import { URL_REGEX, getActiveTab, showError } from '../Utilities/generalUtils.js';
import { eventBus } from '../eventBus.js';
import {
    DbCreateSessionRequest, DbCreateSessionResponse,
    DbAddMessageRequest, DbAddMessageResponse,
    DbUpdateMessageRequest, DbUpdateMessageResponse,
    DbDeleteMessageRequest, DbDeleteMessageResponse,
    DbUpdateStatusRequest, DbUpdateStatusResponse,
    DbGetSessionRequest, DbGetSessionResponse,
    DbToggleStarRequest, DbToggleStarResponse,
    DbGetAllSessionsRequest, DbGetAllSessionsResponse,
    DbGetStarredSessionsRequest, DbGetStarredSessionsResponse,
    DbDeleteSessionRequest, DbDeleteSessionResponse,
    DbRenameSessionRequest, DbRenameSessionResponse
} from '../events/dbEvents.js';
import { clearTemporaryMessages } from './chatRenderer.js';

let getActiveSessionIdFunc = null;
let onSessionCreatedCallback = null;
let getCurrentTabIdFunc = null;
let isSendingMessage = false; // TODO: Remove this and rely on status check via DB event

const pendingDbRequests = new Map();

function requestDbAndWait(requestEvent, timeoutMs = 5000) { 
    return new Promise((resolve, reject) => {
        const { requestId, type: requestType } = requestEvent;
        const responseHandler = (responseEvent) => {
            if (responseEvent && responseEvent.requestId === requestId) {
                console.log(`[Orchestrator] Received DB response for ${requestType} (Req ID: ${requestId})`);
                console.log(`[Orchestrator] RAW Received Response Event Object (Req ID: ${requestId}):`, JSON.stringify(responseEvent));
                eventBus.unsubscribe(responseEventType, responseHandler);
                pendingDbRequests.delete(requestId);
                clearTimeout(timeoutId);
                if (responseEvent.success) {
                    resolve(responseEvent.data);
                } else {
                    reject(new Error(responseEvent.error || `DB operation ${requestType} failed`));
                }
            }
        };
        const timeoutId = setTimeout(() => {
            console.error(`[Orchestrator] DB request timed out for ${requestType} (Req ID: ${requestId})`);
            eventBus.unsubscribe(responseEventType, responseHandler);
            pendingDbRequests.delete(requestId);
            reject(new Error(`DB request timed out for ${requestType}`));
        }, timeoutMs);

        let responseEventType;
        if (requestType === DbCreateSessionRequest.name) {
            responseEventType = DbCreateSessionResponse.name;
        } else if (requestType === DbAddMessageRequest.name) {
            responseEventType = DbAddMessageResponse.name;
        } else if (requestType === DbGetSessionRequest.name) {
            responseEventType = DbGetSessionResponse.name;
        } else if (requestType === DbUpdateMessageRequest.name) {
            responseEventType = DbUpdateMessageResponse.name;
        } else if (requestType === DbDeleteMessageRequest.name) {
            responseEventType = DbDeleteMessageResponse.name;
        } else if (requestType === DbUpdateStatusRequest.name) {
            responseEventType = DbUpdateStatusResponse.name;
        } else if (requestType === DbToggleStarRequest.name) {
            responseEventType = DbToggleStarResponse.name;
        } else if (requestType === DbGetAllSessionsRequest.name) {
            responseEventType = DbGetAllSessionsResponse.name;
        } else if (requestType === DbGetStarredSessionsRequest.name) {
            responseEventType = DbGetStarredSessionsResponse.name;
        } else if (requestType === DbDeleteSessionRequest.name) {
            responseEventType = DbDeleteSessionResponse.name;
        } else if (requestType === DbRenameSessionRequest.name) {
            responseEventType = DbRenameSessionResponse.name;
        } else {
            console.error(`[Orchestrator] Unknown request type for response mapping: ${requestType}`);
            responseEventType = requestType.replace('Request', 'Response');
            if (responseEventType === requestType) {
                 reject(new Error(`Cannot determine response event type for request: ${requestType}`));
                 return;
            }
        }

        console.log(`[Orchestrator] Subscribing responseHandler for ReqID ${requestId} to event type: ${responseEventType}`);
        eventBus.subscribe(responseEventType, responseHandler);

        pendingDbRequests.set(requestId, { handler: responseHandler, timeoutId });

        eventBus.publish(requestEvent.type, requestEvent);
    });
}

export function initializeOrchestrator(dependencies) {
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    onSessionCreatedCallback = dependencies.onSessionCreatedCallback;
    getCurrentTabIdFunc = dependencies.getCurrentTabIdFunc;

    if (!getActiveSessionIdFunc || !onSessionCreatedCallback || !getCurrentTabIdFunc) {
        console.error("Orchestrator: Missing one or more dependencies during initialization!");
        return;
    }

    console.log("[Orchestrator] Initializing and subscribing to application events...");
    eventBus.subscribe('ui:querySubmitted', handleQuerySubmit);
    eventBus.subscribe('background:responseReceived', handleBackgroundMsgResponse);
    eventBus.subscribe('background:errorReceived', handleBackgroundMsgError);
    eventBus.subscribe('background:scrapeStageResult', handleBackgroundScrapeStage);
    eventBus.subscribe('background:scrapeResultReceived', handleBackgroundDirectScrapeResult);
    console.log("[Orchestrator] Event subscriptions complete.");
}

async function handleQuerySubmit(data) {
    const { text } = data;
    console.log(`Orchestrator: handleQuerySubmit received event with text: "${text}"`);
    if (isSendingMessage) {
        console.warn("Orchestrator: Already processing a previous submission.");
        return;
    }
    isSendingMessage = true;

    let sessionId = getActiveSessionIdFunc();
    const currentTabId = getCurrentTabIdFunc();
    let placeholderMessageId = null;

    console.log(`Orchestrator: Processing submission. Text: "${text}". Session: ${sessionId}`);
    const isURL = URL_REGEX.test(text);

    try {
        clearTemporaryMessages();
        const userMessage = { sender: 'user', text: text, timestamp: Date.now(), isLoading: false };
        if (!sessionId) {
            console.log("Orchestrator: No active session, creating new one via event.");
            const createRequest = new DbCreateSessionRequest(userMessage);
            const createResponse = await requestDbAndWait(createRequest);
            sessionId = createResponse.newSessionId;
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            } else {
                 console.error("Orchestrator: onSessionCreatedCallback is missing!");
                 throw new Error("Configuration error: Cannot notify about new session.");
            }
        } else {
            console.log(`Orchestrator: Adding user message to existing session ${sessionId} via event.`);
            clearTemporaryMessages();
            const addRequest = new DbAddMessageRequest(sessionId, userMessage);
            await requestDbAndWait(addRequest);
        }
        console.log(`[Orchestrator] Setting session ${sessionId} status to 'processing' via event`);
        const statusRequest = new DbUpdateStatusRequest(sessionId, 'processing');
        await requestDbAndWait(statusRequest);
        let placeholder;
        if (isURL) {
            const activeTab = await getActiveTab();
            const activeTabUrl = activeTab?.url;
            const normalizeUrl = (u) => u ? u.replace('/$', '') : null;
            const inputUrlNormalized = normalizeUrl(text);
            const activeTabUrlNormalized = normalizeUrl(activeTabUrl);
            const placeholderText = (activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized)
                ? `⏳ Scraping active tab: ${text}...`
                : `⏳ Scraping ${text}...`;
            placeholder = { sender: 'system', text: placeholderText, timestamp: Date.now(), isLoading: true };
        } else {
            placeholder = { sender: 'ai', text: 'Thinking...', timestamp: Date.now(), isLoading: true };
        }
        console.log(`[Orchestrator] Adding placeholder to session ${sessionId} via event.`);
        const addPlaceholderRequest = new DbAddMessageRequest(sessionId, placeholder);
        const placeholderResponse = await requestDbAndWait(addPlaceholderRequest);
        placeholderMessageId = placeholderResponse.newMessageId;
        if (isURL) {
             const activeTab = await getActiveTab();
             const activeTabUrl = activeTab?.url;
             const normalizeUrl = (u) => u ? u.replace('/$', '') : null;
             const inputUrlNormalized = normalizeUrl(text);
             const activeTabUrlNormalized = normalizeUrl(activeTabUrl);
            if (activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized) {
                console.log("Orchestrator: Triggering content script scrape.");
                chrome.tabs.sendMessage(activeTab.id, { type: 'SCRAPE_ACTIVE_TAB' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Orchestrator: Error sending SCRAPE_ACTIVE_TAB:', chrome.runtime.lastError.message);
                        const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, {
                            isLoading: false, sender: 'error', text: `Failed to send scrape request: ${chrome.runtime.lastError.message}`
                        });
                        requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error:", e));
                        requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error:", e));
                        isSendingMessage = false;
                    } else { console.log("Orchestrator: SCRAPE_ACTIVE_TAB message sent."); }
                });
            } else {
                console.log("Orchestrator: Triggering background scrape.");
                chrome.runtime.sendMessage({
                    type: 'TEMP_SCRAPE_URL', url: text, tabId: currentTabId, chatId: sessionId, messageId: placeholderMessageId
                }, (response) => {
                     if (chrome.runtime.lastError) {
                        console.error('Orchestrator: Error sending TEMP_SCRAPE_URL:', chrome.runtime.lastError.message);
                        const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, {
                             isLoading: false, sender: 'error', text: `Failed to initiate scrape: ${chrome.runtime.lastError.message}`
                        });
                         requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error:", e));
                         requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error:", e));
                         isSendingMessage = false;
                     } else { console.log("Orchestrator: TEMP_SCRAPE_URL message sent successfully."); }
                });
            }
        } else {
            const messagePayload = {
                type: 'query', tabId: currentTabId, text: text, chatId: sessionId, messageId: placeholderMessageId
            };
            console.log('Orchestrator: Sending query to background:', messagePayload);
            chrome.runtime.sendMessage(messagePayload, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Orchestrator: Error sending query:', chrome.runtime.lastError.message);
                    const errorPayload = { isLoading: false, sender: 'error', text: `Failed to send query: ${chrome.runtime.lastError.message}` };
                    const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
                    requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error:", e));
                    requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error:", e));
                    isSendingMessage = false; // Reset flag on send error
                } else {
                    // Process the response received from background.js
                    console.log('Orchestrator: Received direct response from background for query:', response);
                    let updatePayload = {};
                    let finalStatus = 'idle';

                    if (response && response.success) {
                        updatePayload = { isLoading: false, sender: 'ai', text: response.data || 'Received empty successful response.' };
                        finalStatus = 'idle';
                    } else {
                        updatePayload = { isLoading: false, sender: 'error', text: `Error: ${response?.error || 'Unknown error from background.'}` };
                        finalStatus = 'error';
                        console.error('Orchestrator: Background query processing failed:', response?.error);
                    }

                    // Update the placeholder message
                    const updateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, updatePayload);
                    requestDbAndWait(updateRequest)
                        .then(() => {
                             console.log(`[Orchestrator] Setting session ${sessionId} status to '${finalStatus}' after query response via event`);
                             return requestDbAndWait(new DbUpdateStatusRequest(sessionId, finalStatus));
                        })
                        .catch(e => {
                            console.error("Failed to update placeholder/status after query response:", e);
                             // Attempt to set error status even if update failed
                             requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error')).catch(e2 => console.error("Failed to set fallback error status:", e2));
                        })
                        .finally(() => {
                            isSendingMessage = false; // Reset flag after processing response
                        });
                }
            });
        }
    } catch (error) {
        console.error("Orchestrator: Error processing query submission:", error);
        showError(`Error: ${error.message || error}`);
        if (sessionId) {
            console.log(`[Orchestrator] Setting session ${sessionId} status to 'error' due to processing failure via event`);
            requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on processing error:", e));
        } else {
            console.error("Orchestrator: Error occurred before session ID was established.");
        }
        isSendingMessage = false;
    }
}

async function handleBackgroundMsgResponse(message) {
    const { chatId, messageId, text } = message;
    console.log(`Orchestrator: handleBackgroundMsgResponse for chat ${chatId}, placeholder ${messageId}`);
    try {
        const updatePayload = { isLoading: false, sender: 'ai', text: text || 'Received empty response.' };
        const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`[Orchestrator] Setting session ${chatId} status to 'idle' after response via event`);
        const statusRequest = new DbUpdateStatusRequest(chatId, 'idle');
        await requestDbAndWait(statusRequest);
    } catch (error) {
        console.error(`Orchestrator: Error handling background response for chat ${chatId}:`, error);
        showError(`Failed to update chat with response: ${error.message || error}`);
        const statusRequest = new DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on response processing error:", e));
    } finally {
         isSendingMessage = false; // TODO: Remove later
    }
}

async function handleBackgroundMsgError(message) {
    console.error(`Orchestrator: Received error for chat ${message.chatId}, placeholder ${message.messageId}: ${message.error}`);
    showError(`Error processing request: ${message.error}`); // Show global error regardless

    const sessionId = getActiveSessionIdFunc(); // Get current session ID

    if (sessionId && message.chatId === sessionId && message.messageId) {
        // Only update DB if the error belongs to the *active* session and has a message ID
        console.log(`Orchestrator: Attempting to update message ${message.messageId} in active session ${sessionId} with error.`);
        const errorPayload = { isLoading: false, sender: 'error', text: `Error: ${message.error}` };
        const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, message.messageId, errorPayload);
        const statusRequest = new DbUpdateStatusRequest(sessionId, 'error');
        try {
            await requestDbAndWait(errorUpdateRequest);
            console.log(`Orchestrator: Error message update successful for session ${sessionId}.`);
            await requestDbAndWait(statusRequest);
            console.log(`Orchestrator: Session ${sessionId} status set to 'error'.`);
        } catch (dbError) {
            console.error('Orchestrator: Error updating chat/status on background error:', dbError);
            // Show a more specific UI error if DB update fails
            showError(`Failed to update chat with error status: ${dbError.message}`);
            // Attempt to set status to error even if message update failed
            try {
                 await requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error'));
            } catch (statusError) {
                 console.error('Failed to set session status on error handling error:', statusError);
            }
        }
    } else {
         console.warn(`Orchestrator: Received error, but no active session ID (${sessionId}) or message ID (${message.messageId}) matches the error context (${message.chatId}). Not updating DB.`);
         // If the error is specifically a model load error (we might need a better way to signal this)
         // ensure the UI controller knows. The direct worker:error event might be better.
    }

    isSendingMessage = false; // Reset flag after handling error
}

async function handleBackgroundScrapeStage(payload) {
    const { stage, success, chatId, messageId, error, ...rest } = payload;
    console.log(`Orchestrator: handleBackgroundScrapeStage Stage ${stage}, chatId: ${chatId}, Success: ${success}`);

    let updatePayload = {};
    let finalStatus = 'idle'; // Default to idle on success

    if (success) {
        console.log(`Orchestrator: Scrape stage ${stage} succeeded for chat ${chatId}.`);
        // Construct a success message matching the 'scrape_result_full' style
        const successText = `Full Scrape Result: ${rest.title || 'No Title'}`; // Use title for the text part
        // Use the 'scrape_result_full' type and structure
        updatePayload = { 
            isLoading: false, 
            sender: 'system', 
            text: successText, // Main text shown outside bubble if needed
            metadata: { 
                type: 'scrape_result_full', 
                scrapeData: rest // Put the full data here for the renderer
            }
        };
        finalStatus = 'idle';

    } else {
        // If a stage fails, update the message immediately with the error
        const errorText = error || `Scraping failed (Stage ${stage}). Unknown error.`;
        console.error(`Orchestrator: Scrape stage ${stage} failed for chat ${chatId}. Error: ${errorText}`);
        updatePayload = { isLoading: false, sender: 'error', text: `Scraping failed (Stage ${stage}): ${errorText}` };
        finalStatus = 'error';
    }

    // --- Update DB regardless of success/failure based on this stage result --- 
    try {
        console.log(`Orchestrator: Updating message ${messageId} for stage ${stage} result.`);
        const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`Orchestrator: Updated placeholder ${messageId} with stage ${stage} result.`);

        // Also set final session status based on this stage outcome
        console.log(`[Orchestrator] Setting session ${chatId} status to '${finalStatus}' after stage ${stage} result via event`);
        const statusRequest = new DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);

    } catch (dbError) {
        console.error(`Orchestrator: Failed to update DB after stage ${stage} result:`, dbError);
        showError(`Failed to update chat with scrape result: ${dbError.message || dbError}`);
        // If DB update fails, maybe try setting status to error anyway?
        if (finalStatus !== 'error') {
             try {
                 const fallbackStatusRequest = new DbUpdateStatusRequest(chatId, 'error');
                 await requestDbAndWait(fallbackStatusRequest);
             } catch (fallbackError) {
                 console.error("Failed to set fallback error status:", fallbackError);
             }
        }
    } finally {
        // Reset sending flag only after processing a stage result
        // This assumes the background script won't send more results for this specific scrape
        // Might need adjustment if background sends a final DIRECT_SCRAPE_RESULT later
         isSendingMessage = false; 
         console.log("Orchestrator: Resetting isSendingMessage after processing scrape stage result.");
    }
}

async function handleBackgroundDirectScrapeResult(message) {
    const { chatId, messageId, success, error, ...scrapeData } = message;
    console.log(`Orchestrator: handleBackgroundDirectScrapeResult for chat ${chatId}, placeholder ${messageId}, Success: ${success}`);
    const updatePayload = { isLoading: false };
     if (success) {
         updatePayload.sender = 'system';
         updatePayload.text = scrapeData.text || scrapeData.excerpt || 'Scraped content (no text found).';
         updatePayload.metadata = {
             type: 'scrape_result', method: scrapeData.method || 'unknown',
             url: scrapeData.url, title: scrapeData.title,
         };
     } else {
         updatePayload.sender = 'error';
         updatePayload.text = `Scraping failed: ${error || 'Unknown error.'}`;
     }
    try {
        const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        const finalStatus = success ? 'idle' : 'error';
        console.log(`[Orchestrator] Setting session ${chatId} status to '${finalStatus}' after direct scrape result via event`);
        const statusRequest = new DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);
    } catch (error) {
        console.error(`Orchestrator: Error handling direct scrape result for chat ${chatId}:`, error);
        showError(`Failed to update chat with direct scrape result: ${error.message || error}`);
        const statusRequest = new DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on direct scrape processing error:", e));
    } finally {
         isSendingMessage = false; // TODO: Remove later
    }
}