import browser from 'webextension-polyfill';
import { URL_REGEX, showError } from '../Utilities/generalUtils';
import { sendDbRequestSmart, sendToModelWorker, isModelLoaded } from '../sidepanel';
import {
    DbCreateSessionRequest,
    DbAddMessageRequest,
    DbUpdateMessageRequest,
    DbUpdateStatusRequest,
    DbGetSessionRequest,
} from '../DB/dbEvents';
import { clearTemporaryMessages } from './chatRenderer';
import { UIEventNames, RuntimeMessageTypes } from '../events/eventNames';
import { Message } from '../DB/idbMessage';
import { DB_ENTITY_TYPES } from '../DB/idbBase';

// --- Types ---
interface OrchestratorDependencies {
    getActiveSessionIdFunc: () => string | null;
    onSessionCreatedCallback: (sessionId: string) => void;
    getCurrentTabIdFunc: () => number | null;
}

class ChatOrchestrator {
    private getActiveSessionId: (() => string | null) | null = null;
    private onSessionCreated: ((sessionId: string) => void) | null = null;
    private getCurrentTabId: (() => number | null) | null = null;
    private isSendingMessage = false;

    private readonly prefix = '[Orchestrator]';
    private readonly LOG_GENERAL = true;
    private readonly LOG_DEBUG = true;
    private readonly LOG_ERROR = true;
    private readonly LOG_WARN = true;

    public initialize(dependencies: OrchestratorDependencies) {
        this.validateDependencies(dependencies);
        this.setupDependencies(dependencies);
        this.setupEventListeners();
        if (this.LOG_GENERAL) console.log(this.prefix, 'Orchestrator initialized successfully');
    }

    private validateDependencies(dependencies: OrchestratorDependencies) {
        const { getActiveSessionIdFunc, onSessionCreatedCallback, getCurrentTabIdFunc } = dependencies;
        if (!getActiveSessionIdFunc || !onSessionCreatedCallback || !getCurrentTabIdFunc) {
            if (this.LOG_ERROR) console.error(this.prefix, 'Missing required dependencies during initialization');
            throw new Error('Missing required orchestrator dependencies');
        }
    }

    private setupDependencies(dependencies: OrchestratorDependencies) {
        this.getActiveSessionId = dependencies.getActiveSessionIdFunc;
        this.getCurrentTabId = dependencies.getCurrentTabIdFunc;
        this.onSessionCreated = (sessionId: string) => {
            if (this.LOG_GENERAL) console.log(this.prefix, `Session created: ${sessionId}`);
            dependencies.onSessionCreatedCallback(sessionId);
        };
    }

    private setupEventListeners() {
        document.addEventListener(UIEventNames.QUERY_SUBMITTED, (e: Event) => this.handleQuerySubmit((e as CustomEvent).detail));
        document.addEventListener(UIEventNames.BACKGROUND_RESPONSE_RECEIVED, (e: Event) => this.handleBackgroundMsgResponse((e as CustomEvent).detail));
        document.addEventListener(UIEventNames.BACKGROUND_ERROR_RECEIVED, (e: Event) => this.handleBackgroundMsgError((e as CustomEvent).detail));
        document.addEventListener(UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, (e: Event) => this.handleBackgroundScrapeStage((e as CustomEvent).detail));
        document.addEventListener(UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, (e: Event) => this.handleBackgroundDirectScrapeResult((e as CustomEvent).detail));
    }

    private showUiOnlyWarning(msg: string) {
        let warningDiv = document.getElementById('ui-only-warning');
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.id = 'ui-only-warning';
            warningDiv.style.background = '#fef3c7';
            warningDiv.style.color = '#92400e';
            warningDiv.style.border = '1px solid #fde68a';
            warningDiv.style.borderRadius = '6px';
            warningDiv.style.padding = '6px 12px';
            warningDiv.style.margin = '8px 0';
            warningDiv.style.fontSize = '0.95em';
            warningDiv.style.textAlign = 'center';
            warningDiv.style.zIndex = '100';
            const inputArea = document.getElementById('input-area') || document.getElementById('chat-input-container');
            if (inputArea && inputArea.parentNode) {
                inputArea.parentNode.insertBefore(warningDiv, inputArea);
            } else {
                document.body.appendChild(warningDiv);
            }
        }
        warningDiv.textContent = msg;
        warningDiv.style.display = '';
        setTimeout(() => {
            if (warningDiv) warningDiv.style.display = 'none';
        }, 3500);
    }

    private async requestDbAndWait(requestEvent: any): Promise<any> {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const result = await sendDbRequestSmart(requestEvent);
                    if (this.LOG_DEBUG) console.log(this.prefix, 'requestDbAndWait: Raw result', result);
                    const response = Array.isArray(result) ? result[0] : result;
                    if (response && (response.success || response.error === undefined)) {
                        resolve(response.data || response.payload);
                    } else {
                        reject(new Error(response?.error || `DB operation ${requestEvent.type} failed`));
                    }
                } catch (error) {
                    reject(error);
                }
            })();
        });
    }

    private async getChatHistoryForModel(sessionId: string): Promise<{role: string, content: string}[]> {
        const sessionData = await this.requestDbAndWait(new DbGetSessionRequest(sessionId));
        if (!sessionData || !Array.isArray(sessionData.messages)) return [];
        return (sessionData.messages as any[])
            // Hydrate Message for business logic only; dbWorker is not needed
            .map((m: any) => m.__type === DB_ENTITY_TYPES.Message ? Message.fromJSON(m) : m)
            .filter((m: Message) => m.sender === 'user' || m.sender === 'ai')
            .map((m: Message) => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.content || ''
            }));
    }

    private async handleQuerySubmit(data: any) {
        const { text } = data;
        if (this.LOG_GENERAL) console.log(this.prefix, `handleQuerySubmit: received event with text: "${text}"`);
        if (this.isSendingMessage) {
            console.warn('[Orchestrator handleQuerySubmit]: Already processing a previous submission.');
            return;
        }
        this.isSendingMessage = true;

        let sessionId = this.getActiveSessionId ? this.getActiveSessionId() : null;
        const currentTabId = this.getCurrentTabId ? this.getCurrentTabId() : null;
        let placeholderMessageId = null;

        if (this.LOG_GENERAL) console.log(this.prefix, `handleQuerySubmit: Processing submission. Text: "${text}". Session: ${sessionId}`);
        const isURL = URL_REGEX.test(text);

        if (!isURL && !isModelLoaded()) {
            this.showUiOnlyWarning('Please load a model first.');
            this.isSendingMessage = false;
            return;
        }

        try {
            clearTemporaryMessages();
            const userMessage = { sender: 'user', text: text, timestamp: Date.now(), isLoading: false };
            if (!sessionId) {
                if (this.LOG_GENERAL) console.log(this.prefix, 'handleQuerySubmit: No active session, creating new one via event.');
                const createRequest = new DbCreateSessionRequest(userMessage);
                const createResponse = await this.requestDbAndWait(createRequest);
                sessionId = (createResponse as any).newSessionId;
                if (this.onSessionCreated) {
                    this.onSessionCreated(sessionId!);
                } else {
                    console.error('[Orchestrator: handleQuerySubmit] onSessionCreatedCallback is missing!');
                    throw new Error('Configuration error: Cannot notify about new session.');
                }
            } else {
                if (this.LOG_GENERAL) console.log(this.prefix, `handleQuerySubmit: Adding user message to existing session ${sessionId} via event.`);
                clearTemporaryMessages();
                const addRequest = new DbAddMessageRequest(sessionId, userMessage);
                await this.requestDbAndWait(addRequest);
            }
            if (this.LOG_GENERAL) console.log(this.prefix, `handleQuerySubmit: Setting session ${sessionId} status to 'processing' via event`);
            const statusRequest = new DbUpdateStatusRequest(sessionId!, 'processing');
            await this.requestDbAndWait(statusRequest);
            let placeholder;
            if (isURL) {
                placeholder = { sender: 'system', text: `⏳ Scraping ${text}...`, timestamp: Date.now(), isLoading: true };
            } else {
                placeholder = { sender: 'ai', text: 'Thinking...', timestamp: Date.now(), isLoading: true };
            }
            if (this.LOG_GENERAL) console.log(this.prefix, `handleQuerySubmit: Adding placeholder to session ${sessionId} via event.`);
            const addPlaceholderRequest = new DbAddMessageRequest(sessionId!, placeholder);
            const placeholderResponse = await this.requestDbAndWait(addPlaceholderRequest);
            if (this.LOG_GENERAL) console.log(this.prefix, 'handleQuerySubmit: Placeholder response:', placeholderResponse);
            placeholderMessageId = (placeholderResponse as any).newMessageId;
            if (typeof placeholderMessageId !== 'string' && placeholderMessageId && placeholderMessageId.newMessageId) {
                placeholderMessageId = placeholderMessageId.newMessageId;
            }
            if (typeof placeholderMessageId === 'string') {
                if (this.LOG_GENERAL) console.log(this.prefix, 'handleQuerySubmit: placeholderMessageId (string):', placeholderMessageId);
            } else {
                if (this.LOG_WARN) console.warn(this.prefix, 'handleQuerySubmit: placeholderMessageId is not a string! Full value:', placeholderMessageId);
            }

            if (isURL) {
                try {
                    const response = await browser.runtime.sendMessage({
                        type: RuntimeMessageTypes.SCRAPE_REQUEST,
                        payload: {
                            url: text,
                            chatId: sessionId,
                            messageId: placeholderMessageId,
                            tabId: currentTabId
                        }
                    });
                    if (this.LOG_GENERAL) console.log(this.prefix, 'handleQuerySubmit: SCRAPE_REQUEST sent to background.', response);
                } catch (error: unknown) {
                    const errObj = error as Error;
                    if (this.LOG_ERROR) console.error(this.prefix, 'handleQuerySubmit: Error sending SCRAPE_REQUEST:', errObj.message);
                    const errorUpdateRequest = new DbUpdateMessageRequest(sessionId!, placeholderMessageId, {
                        isLoading: false, sender: 'error', text: `Failed to initiate scrape: ${errObj.message}`
                    });
                    this.requestDbAndWait(errorUpdateRequest).catch(e => {
                        if (this.LOG_ERROR) console.error(this.prefix, 'Failed to update placeholder on send error:', e);
                    });
                    this.requestDbAndWait(new DbUpdateStatusRequest(sessionId!, 'error')).catch(e => {
                        if (this.LOG_ERROR) console.error(this.prefix, 'Failed to set session status on send error:', e);
                    });
                    this.isSendingMessage = false;
                }
            } else {
                let history: {role: string, content: string}[] = [];
                try {
                    history = await this.getChatHistoryForModel(sessionId!);
                } catch (e) {
                    if (this.LOG_ERROR) console.error(this.prefix, 'handleQuerySubmit: Failed to fetch chat history:', e);
                    history = [{ role: 'user', content: text }];
                }
                const messagePayload = {
                    chatId: sessionId,
                    messages: history,
                    options: {},
                    messageId: placeholderMessageId
                };
                try {
                    sendToModelWorker({ type: 'generate', payload: messagePayload });
                } catch (error: unknown) {
                    const errObj = error as Error;
                    if (this.LOG_ERROR) console.error(this.prefix, 'handleQuerySubmit: Error sending query to model worker:', errObj);
                    const errorText = errObj && typeof errObj.message === 'string' ? errObj.message : 'Unknown error during send/ack';
                    const errorPayload = { isLoading: false, sender: 'error', text: `Failed to send query: ${errorText}` };
                    const errorUpdateRequest = new DbUpdateMessageRequest(sessionId!, placeholderMessageId, errorPayload);
                    this.requestDbAndWait(errorUpdateRequest).catch(e => {
                        if (this.LOG_ERROR) console.error(this.prefix, 'Failed to update placeholder on send error (within catch):', e);
                    });
                    this.requestDbAndWait(new DbUpdateStatusRequest(sessionId!, 'error')).catch(e => {
                        if (this.LOG_ERROR) console.error(this.prefix, 'Failed to set session status on send error (within catch):', e);
                    });
                    this.isSendingMessage = false;
                }
            }
        } catch (error: unknown) {
            const errObj = error as Error;
            if (this.LOG_ERROR) console.error(this.prefix, 'handleQuerySubmit: Error processing query submission:', errObj);
            showError(`Error: ${errObj.message || errObj}`);
            if (sessionId) {
                if (this.LOG_GENERAL) console.log(this.prefix, `handleQuerySubmit: Setting session ${sessionId} status to 'error' due to processing failure via event`);
                this.requestDbAndWait(new DbUpdateStatusRequest(sessionId!, 'error')).catch(e => {
                    if (this.LOG_ERROR) console.error(this.prefix, 'Failed to set session status on processing error:', e);
                });
            } else {
                if (this.LOG_ERROR) console.error(this.prefix, 'handleQuerySubmit: Error occurred before session ID was established.');
            }
            this.isSendingMessage = false;
        }
    }

    private async handleBackgroundMsgResponse(message: any) {
        const { chatId, messageId, text } = message;
        if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundMsgResponse: for chat ${chatId}, placeholder ${messageId}`);
        try {
            const updatePayload = { isLoading: false, sender: 'ai', text: text || 'Received empty response.' };
            const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
            await this.requestDbAndWait(updateRequest);
            if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundMsgResponse: Setting session ${chatId} status to 'idle' after response via event`);
            const statusRequest = new DbUpdateStatusRequest(chatId, 'idle');
            await this.requestDbAndWait(statusRequest);
        } catch (error: unknown) {
            const errObj = error as Error;
            if (this.LOG_ERROR) console.error(this.prefix, `handleBackgroundMsgResponse: Error handling background response for chat ${chatId}:`, errObj);
            showError(`Failed to update chat with response: ${errObj.message || errObj}`);
            const statusRequest = new DbUpdateStatusRequest(chatId, 'error');
            this.requestDbAndWait(statusRequest).catch(e => {
                if (this.LOG_ERROR) console.error(this.prefix, 'Failed to set session status on response processing error:', e);
            });
        } finally {
            this.isSendingMessage = false;
        }
    }

    private async handleBackgroundMsgError(message: any) {
        if (this.LOG_ERROR) console.error(this.prefix, `handleBackgroundMsgError: Received error for chat ${message.chatId}, placeholder ${message.messageId}: ${message.error}`);
        showError(`Error processing request: ${message.error}`);
        const sessionId = this.getActiveSessionId ? this.getActiveSessionId() : null;
        if (sessionId && message.chatId === sessionId && message.messageId) {
            if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundMsgError: Attempting to update message ${message.messageId} in active session ${sessionId} with error.`);
            const errorPayload = { isLoading: false, sender: 'error', text: `Error: ${message.error}` };
            const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, message.messageId, errorPayload);
            const statusRequest = new DbUpdateStatusRequest(sessionId, 'error');
            try {
                await this.requestDbAndWait(errorUpdateRequest);
                if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundMsgError: Error message update successful for session ${sessionId}.`);
                await this.requestDbAndWait(statusRequest);
                if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundMsgError: Session ${sessionId} status set to 'error'.`);
            } catch (dbError: unknown) {
                const dbErr = dbError as Error;
                if (this.LOG_ERROR) console.error(this.prefix, `handleBackgroundMsgError: Error updating chat/status on background error:`, dbErr);
                showError(`Failed to update chat with error status: ${dbErr.message}`);
                try {
                    await this.requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error'));
                } catch (statusError) {
                    if (this.LOG_ERROR) console.error(this.prefix, 'handleBackgroundMsgError: Failed to set session status on error handling error:', statusError);
                }
            }
        }
        this.isSendingMessage = false;
    }

    private async handleBackgroundScrapeStage(payload: any) {
        const { stage, success, chatId, messageId, error, ...rest } = payload;
        if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundScrapeStage: Stage ${stage}, chatId: ${chatId}, Success: ${success}`);
        let updatePayload: any = {};
        let finalStatus = 'idle';
        if (success) {
            if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundScrapeStage: Scrape stage ${stage} succeeded for chat ${chatId}.`);
            let mainContent = rest?.extraction?.content || rest?.content || rest?.title || 'Scrape complete.';
            updatePayload = {
                isLoading: false,
                sender: 'system',
                text: mainContent,
                content: mainContent,
                metadata: {
                    type: 'scrape_result_full',
                    scrapeData: rest
                }
            };
            finalStatus = 'idle';
        } else {
            const errorText = error || `Scraping failed (Stage ${stage}). Unknown error.`;
            if (this.LOG_ERROR) console.error(this.prefix, `handleBackgroundScrapeStage: Scrape stage ${stage} failed for chat ${chatId}. Error: ${errorText}`);
            updatePayload = { isLoading: false, sender: 'error', text: `Scraping failed (Stage ${stage}): ${errorText}` };
            finalStatus = 'error';
        }
        try {
            if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundScrapeStage: Updating message ${messageId} for stage ${stage} result.`);
            const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
            await this.requestDbAndWait(updateRequest);
            if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundScrapeStage: Updated placeholder ${messageId} with stage ${stage} result.`);
            if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundScrapeStage: Setting session ${chatId} status to '${finalStatus}' after stage ${stage} result via event`);
            const statusRequest = new DbUpdateStatusRequest(chatId, finalStatus);
            await this.requestDbAndWait(statusRequest);
        } catch (dbError: unknown) {
            const dbErr = dbError as Error;
            if (this.LOG_ERROR) console.error(this.prefix, `handleBackgroundScrapeStage: Failed to update DB after stage ${stage} result:`, dbErr);
            showError(`Failed to update chat with scrape result: ${dbErr.message || dbErr}`);
            if (finalStatus !== 'error') {
                try {
                    const fallbackStatusRequest = new DbUpdateStatusRequest(chatId, 'error');
                    await this.requestDbAndWait(fallbackStatusRequest);
                } catch (fallbackError) {
                    if (this.LOG_ERROR) console.error(this.prefix, 'handleBackgroundScrapeStage: Failed to set fallback error status:', fallbackError);
                }
            }
        } finally {
            this.isSendingMessage = false;
            if (this.LOG_GENERAL) console.log(this.prefix, 'handleBackgroundScrapeStage: Resetting isSendingMessage after processing scrape stage result.');
        }
    }

    private async handleBackgroundDirectScrapeResult(message: any) {
        const { chatId, messageId, success, error, ...scrapeData } = message;
        if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundDirectScrapeResult: for chat ${chatId}, placeholder ${messageId}, Success: ${success}`);
        const updatePayload: any = { isLoading: false };
        if (success) {
            updatePayload.sender = 'system';
            let mainContent = scrapeData?.extraction?.content || scrapeData?.content || scrapeData?.title || 'Scrape complete.';
            updatePayload.text = mainContent;
            updatePayload.content = mainContent;
            updatePayload.metadata = {
                type: 'scrape_result_full',
                scrapeData: scrapeData
            };
        } else {
            updatePayload.sender = 'error';
            updatePayload.text = `Scraping failed: ${error || 'Unknown error.'}`;
        }
        try {
            const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
            await this.requestDbAndWait(updateRequest);
            const finalStatus = success ? 'idle' : 'error';
            if (this.LOG_GENERAL) console.log(this.prefix, `handleBackgroundDirectScrapeResult: Setting session ${chatId} status to '${finalStatus}' after direct scrape result via event`);
            const statusRequest = new DbUpdateStatusRequest(chatId, finalStatus);
            await this.requestDbAndWait(statusRequest);
        } catch (error: unknown) {
            const errObj = error as Error;
            if (this.LOG_ERROR) console.error(this.prefix, `handleBackgroundDirectScrapeResult: Error handling direct scrape result for chat ${chatId}:`, errObj);
            showError(`Failed to update chat with direct scrape result: ${errObj.message || errObj}`);
            const statusRequest = new DbUpdateStatusRequest(chatId, 'error');
            this.requestDbAndWait(statusRequest).catch(e => {
                if (this.LOG_ERROR) console.error(this.prefix, 'Failed to set session status on direct scrape processing error:', e);
            });
        } finally {
            this.isSendingMessage = false;
        }
    }
}

let orchestratorInstance: ChatOrchestrator | null = null;

export function initializeOrchestrator(dependencies: OrchestratorDependencies) {
    if (!orchestratorInstance) {
        orchestratorInstance = new ChatOrchestrator();
        orchestratorInstance.initialize(dependencies);
    }
}