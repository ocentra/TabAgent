import browser from 'webextension-polyfill';
import { URL_REGEX, getActiveTab, showError } from '../Utilities/generalUtils.js';
import { sendDbRequestSmart } from '../sidepanel.js';
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
import { UIEventNames, RuntimeMessageTypes } from '../events/eventNames.js';

let getActiveSessionIdFunc = null;
let onSessionCreatedCallback = null;
let getCurrentTabIdFunc = null;
let isSendingMessage = false; // TODO: Remove this and rely on status check via DB event

const pendingDbRequests = new Map();

function requestDbAndWait(requestEvent, timeoutMs = 5000) {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await sendDbRequestSmart(requestEvent, timeoutMs);
            console.log('[Trace][sidepanel] requestDbAndWait: Raw result', result);
            const response = Array.isArray(result) ? result[0] : result;
            if (response && (response.success || response.error === undefined)) {
                resolve(response.data || response.payload);
            } else {
                reject(new Error(response?.error || `DB operation ${requestEvent.type} failed`));
            }
        } catch (error) {
            reject(error);
        }
    });
}

async function handleQuerySubmit(data) {
    const { text } = data;
    console.log(`[Orchestrator: handleQuerySubmit] received event with text: "${text}"`);
    if (isSendingMessage) {
        console.warn("[Orchestrator handleQuerySubmit]: Already processing a previous submission.");
        return;
    }
    isSendingMessage = true;

    let sessionId = getActiveSessionIdFunc();
    const currentTabId = getCurrentTabIdFunc();
    let placeholderMessageId = null;

    console.log(`[Orchestrator: handleQuerySubmit] Processing submission. Text: "${text}". Session: ${sessionId}`);
    const isURL = URL_REGEX.test(text);

    try {
        clearTemporaryMessages();
        const userMessage = { sender: 'user', text: text, timestamp: Date.now(), isLoading: false };
        if (!sessionId) {
            console.log("[Orchestrator: handleQuerySubmit] No active session, creating new one via event.");
            const createRequest = new DbCreateSessionRequest(userMessage);
            const createResponse = await requestDbAndWait(createRequest);
            sessionId = createResponse.newSessionId;
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            } else {
                 console.error("[Orchestrator: handleQuerySubmit] onSessionCreatedCallback is missing!");
                 throw new Error("Configuration error: Cannot notify about new session.");
            }
        } else {
            console.log(`[Orchestrator: handleQuerySubmit] Adding user message to existing session ${sessionId} via event.`);
            clearTemporaryMessages();
            const addRequest = new DbAddMessageRequest(sessionId, userMessage);
            await requestDbAndWait(addRequest);
        }
        console.log(`[Orchestrator: handleQuerySubmit] Setting session ${sessionId} status to 'processing' via event`);
        const statusRequest = new DbUpdateStatusRequest(sessionId, 'processing');
        await requestDbAndWait(statusRequest);
        let placeholder;
        if (isURL) {
            placeholder = { sender: 'system', text: `⏳ Scraping ${text}...`, timestamp: Date.now(), isLoading: true };
        } else {
            placeholder = { sender: 'ai', text: 'Thinking...', timestamp: Date.now(), isLoading: true };
        }
        console.log(`[Orchestrator: handleQuerySubmit] Adding placeholder to session ${sessionId} via event.`);
        const addPlaceholderRequest = new DbAddMessageRequest(sessionId, placeholder);
        const placeholderResponse = await requestDbAndWait(addPlaceholderRequest);
        placeholderMessageId = placeholderResponse.newMessageId;
        
        if (isURL) {
            // Always send scrape request to background, let background decide how to scrape
            try {
                const response = await browser.runtime.sendMessage({
                    type: RuntimeMessageTypes.SCRAPE_REQUEST,
                    payload: {
                        url: text,
                        chatId: sessionId,
                        messageId: placeholderMessageId
                    }
                });
                console.log("[Orchestrator: handleQuerySubmit] SCRAPE_REQUEST sent to background.", response);
            } catch (error) {
                console.error('[Orchestrator: handleQuerySubmit] Error sending SCRAPE_REQUEST:', error.message);
                const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, {
                    isLoading: false, sender: 'error', text: `Failed to initiate scrape: ${error.message}`
                });
                requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error:", e));
                requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error:", e));
                isSendingMessage = false;
            }
        } else {
            console.log("[Orchestrator: handleQuerySubmit] Sending query to background for AI response.");
            const messagePayload = {
                type: RuntimeMessageTypes.SEND_CHAT_MESSAGE,
                payload: {
                    chatId: sessionId,
                    messages: [{ role: 'user', content: text }], 
                    options: { /* model, temp, etc */ },
                    messageId: placeholderMessageId
                }
            };
            try {
                const response = await browser.runtime.sendMessage(messagePayload);
                if (response && response.success) {
                    console.log('[Orchestrator: handleQuerySubmit] Background acknowledged forwarding sendChatMessage. Actual AI response will follow separately.', response);
                } else {
                    console.error('[Orchestrator: handleQuerySubmit] Background reported an error while attempting to forward sendChatMessage:', response?.error);
                    const errorPayload = { isLoading: false, sender: 'error', text: `Error forwarding query: ${response?.error || 'Unknown error'}` };
                    const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
                    await requestDbAndWait(errorUpdateRequest); // Can await here too
                    await requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error'));
                    isSendingMessage = false; // Reset flag if forwarding failed
                }
            } catch (error) {
                console.error('[Orchestrator: handleQuerySubmit] Error sending query to background or processing its direct ack:', error);
                const errorText = error && typeof error.message === 'string' ? error.message : 'Unknown error during send/ack';
                const errorPayload = { isLoading: false, sender: 'error', text: `Failed to send query: ${errorText}` };
                const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
                requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error (within catch):", e));
                requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error (within catch):", e));
                isSendingMessage = false; // Reset flag on send error
            }
        }
    } catch (error) {
        console.error("[Orchestrator: handleQuerySubmit] Error processing query submission:", error);
        showError(`Error: ${error.message || error}`);
        if (sessionId) {
            console.log(`[Orchestrator: handleQuerySubmit] Setting session ${sessionId} status to 'error' due to processing failure via event`);
            requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on processing error:", e));
        } else {
            console.error("[Orchestrator: handleQuerySubmit] Error occurred before session ID was established.");
        }
        isSendingMessage = false;
    }
}

async function handleBackgroundMsgResponse(message) {
    const { chatId, messageId, text } = message;
    console.log(`[Orchestrator: handleBackgroundMsgResponse] for chat ${chatId}, placeholder ${messageId}`);
    try {
        const updatePayload = { isLoading: false, sender: 'ai', text: text || 'Received empty response.' };
        const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`[Orchestrator: handleBackgroundMsgResponse] Setting session ${chatId} status to 'idle' after response via event`);
        const statusRequest = new DbUpdateStatusRequest(chatId, 'idle');
        await requestDbAndWait(statusRequest);
    } catch (error) {
        console.error(`[Orchestrator: handleBackgroundMsgResponse] Error handling background response for chat ${chatId}:`, error);
        showError(`Failed to update chat with response: ${error.message || error}`);
        const statusRequest = new DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on response processing error:", e));
    } finally {
         isSendingMessage = false; // TODO: Remove later
    }
}

async function handleBackgroundMsgError(message) {
    console.error(`[Orchestrator: handleBackgroundMsgError] Received error for chat ${message.chatId}, placeholder ${message.messageId}: ${message.error}`);
    showError(`Error processing request: ${message.error}`); // Show global error regardless

    const sessionId = getActiveSessionIdFunc(); // Get current session ID

    if (sessionId && message.chatId === sessionId && message.messageId) {
        // Only update DB if the error belongs to the *active* session and has a message ID
        console.log(`[Orchestrator: handleBackgroundMsgError] Attempting to update message ${message.messageId} in active session ${sessionId} with error.`);
        const errorPayload = { isLoading: false, sender: 'error', text: `Error: ${message.error}` };
        const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, message.messageId, errorPayload);
        const statusRequest = new DbUpdateStatusRequest(sessionId, 'error');
        try {
            await requestDbAndWait(errorUpdateRequest);
            console.log(`[Orchestrator: handleBackgroundMsgError] Error message update successful for session ${sessionId}.`);
            await requestDbAndWait(statusRequest);
            console.log(`[Orchestrator: handleBackgroundMsgError] Session ${sessionId} status set to 'error'.`);
        } catch (dbError) {
            console.error('[Orchestrator: handleBackgroundMsgError] Error updating chat/status on background error:', dbError);
            // Show a more specific UI error if DB update fails
            showError(`Failed to update chat with error status: ${dbError.message}`);
            // Attempt to set status to error even if message update failed
            try {
                 await requestDbAndWait(new DbUpdateStatusRequest(sessionId, 'error'));
            } catch (statusError) {
                 console.error('[Orchestrator: handleBackgroundMsgError] Failed to set session status on error handling error:', statusError);
            }
        }
    } else {
         console.warn(`[Orchestrator: handleBackgroundMsgError] Received error, but no active session ID (${sessionId}) or message ID (${message.messageId}) matches the error context (${message.chatId}). Not updating DB.`);
         // If the error is specifically a model load error (we might need a better way to signal this)
         // ensure the UI controller knows. The direct worker:error event might be better.
    }

    isSendingMessage = false; // Reset flag after handling error
}

async function handleBackgroundScrapeStage(payload) {
    const { stage, success, chatId, messageId, error, ...rest } = payload;
    console.log(`[Orchestrator: handleBackgroundScrapeStage] Stage ${stage}, chatId: ${chatId}, Success: ${success}`);

    let updatePayload = {};
    let finalStatus = 'idle'; // Default to idle on success

    if (success) {
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Scrape stage ${stage} succeeded for chat ${chatId}.`);
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
        console.error(`[Orchestrator: handleBackgroundScrapeStage] Scrape stage ${stage} failed for chat ${chatId}. Error: ${errorText}`);
        updatePayload = { isLoading: false, sender: 'error', text: `Scraping failed (Stage ${stage}): ${errorText}` };
        finalStatus = 'error';
    }

    // --- Update DB regardless of success/failure based on this stage result --- 
    try {
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Updating message ${messageId} for stage ${stage} result.`);
        const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Updated placeholder ${messageId} with stage ${stage} result.`);

        // Also set final session status based on this stage outcome
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Setting session ${chatId} status to '${finalStatus}' after stage ${stage} result via event`);
        const statusRequest = new DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);

    } catch (dbError) {
        console.error(`[Orchestrator: handleBackgroundScrapeStage] Failed to update DB after stage ${stage} result:`, dbError);
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
         console.log("[Orchestrator: handleBackgroundScrapeStage] Resetting isSendingMessage after processing scrape stage result.");
    }
}

async function handleBackgroundDirectScrapeResult(message) {
    const { chatId, messageId, success, error, ...scrapeData } = message;
    console.log(`[Orchestrator: handleBackgroundDirectScrapeResult] for chat ${chatId}, placeholder ${messageId}, Success: ${success}`);
    const updatePayload = { isLoading: false };
     if (success) {
         updatePayload.sender = 'system';
         updatePayload.text = `Full Scrape Result: ${scrapeData.title || 'Scraped Content'}`;
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
        await requestDbAndWait(updateRequest);
        const finalStatus = success ? 'idle' : 'error';
        console.log(`[Orchestrator: handleBackgroundDirectScrapeResult] Setting session ${chatId} status to '${finalStatus}' after direct scrape result via event`);
        const statusRequest = new DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);
    } catch (error) {
        console.error(`[Orchestrator: handleBackgroundDirectScrapeResult] Error handling direct scrape result for chat ${chatId}:`, error);
        showError(`Failed to update chat with direct scrape result: ${error.message || error}`);
        const statusRequest = new DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on direct scrape processing error:", e));
    } finally {
         isSendingMessage = false; // TODO: Remove later
    }
}

document.addEventListener(UIEventNames.QUERY_SUBMITTED, (e) => handleQuerySubmit(e.detail));
document.addEventListener(UIEventNames.BACKGROUND_RESPONSE_RECEIVED, (e) => handleBackgroundMsgResponse(e.detail));
document.addEventListener(UIEventNames.BACKGROUND_ERROR_RECEIVED, (e) => handleBackgroundMsgError(e.detail));
document.addEventListener(UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, handleBackgroundScrapeStage);
document.addEventListener(UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, handleBackgroundDirectScrapeResult);

export function initializeOrchestrator(dependencies) {
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    onSessionCreatedCallback = dependencies.onSessionCreatedCallback;
    getCurrentTabIdFunc = dependencies.getCurrentTabIdFunc;

    if (!getActiveSessionIdFunc || !onSessionCreatedCallback || !getCurrentTabIdFunc) {
        console.error("Orchestrator: Missing one or more dependencies during initialization!");
        return;
    }

    console.log("[Orchestrator] Initializing and subscribing to application events...");
    console.log("[Orchestrator] Event subscriptions complete.");
}