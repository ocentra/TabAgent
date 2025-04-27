// src/messageHandler.js

import { createChatSession, addMessageToChat, updateMessageInChat, generateMessageId, deleteMessageFromChat, getChatSessionById } from '../db.js';
import { URL_REGEX, getActiveTab, showError } from './utils.js';

// --- Module State ---
let db = null;
let ui = null;
let renderer = null;
let getActiveSessionIdFunc = null;
let onSessionCreatedCallback = null;
let getCurrentTabIdFunc = null;
let isSendingMessage = false; // Prevents duplicate sends

//  Stores dependencies (DB functions, UI controller, Renderer, etc.) needed by the handler.
export function initializeMessageHandler(dependencies) {
    db = dependencies.dbFunctions;
    ui = dependencies.uiController;
    renderer = dependencies.chatRenderer;
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    onSessionCreatedCallback = dependencies.onSessionCreatedCallback;
    getCurrentTabIdFunc = dependencies.getCurrentTabIdFunc;

    if (!db || !ui || !renderer || !getActiveSessionIdFunc || !onSessionCreatedCallback || !getCurrentTabIdFunc) {
        console.error("MessageHandler: Missing one or more dependencies during initialization!");
    } else {
        console.log("[MessageHandler] Initialized with dependencies.");
    }
}

//  Central function to process user input, determine action (scrape/query), and initiate it.
export async function handleSendMessage(messageText) {
    if (isSendingMessage) {
        console.warn("MessageHandler: Already processing a message.");
        return;
    }
    if (!messageText) {
        console.warn("MessageHandler: Attempted to send empty message.");
        return;
    }
    if (!db || !ui || !renderer || !getActiveSessionIdFunc || !getCurrentTabIdFunc) {
         showError("Cannot send message: Handler not properly initialized.");
         return;
    }

    isSendingMessage = true;
    ui.disableInput(); // Optimistic UI update

    let sessionId = getActiveSessionIdFunc();
    const currentTabId = getCurrentTabIdFunc();
    let userMessageId = null;
    let placeholderMessageId = null;

    console.log(`MessageHandler: Processing message. Text: "${messageText}". Session: ${sessionId}`);

    const isURL = URL_REGEX.test(messageText);

    try {
        // --- Save User Message ---
        const userMessage = { sender: 'user', text: messageText, timestamp: Date.now(), isLoading: false };
        if (!sessionId) {
            console.log("MessageHandler: No active session, creating new one.");
            // Pass only the first message to create session
            sessionId = await db.createChatSession(userMessage);
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId); // Notify sidepanel of the new session ID
            } else {
                console.error("MessageHandler: onSessionCreatedCallback is missing!");
            }
            // Re-render the chat with the new session (containing the first message)
            await renderer.renderChatSession(sessionId);
            // We don't need userMessageId here as it's the only message initially
        } else {
            console.log(`MessageHandler: Adding user message to existing session ${sessionId}.`);
            userMessageId = await db.addMessageToChat(sessionId, userMessage);
            // Re-render to show the user's message immediately
            renderer.displayMessage(userMessage); // Add just the new message
            renderer.scrollToBottom();
        }

        // --- Handle URL or Query ---
        if (isURL) {
            await processUrl(sessionId, messageText, currentTabId);
        } else {
            await processQuery(sessionId, messageText, currentTabId);
        }

        // Clear input *after* successfully initiating the process (URL or Query)
        ui.clearInput();

    } catch (error) {
        console.error("MessageHandler: Error processing message:", error);
        showError(`Error: ${error.message}`);
        // Attempt to clean up placeholder if it exists and an error occurred *before* sending to background
        if (placeholderMessageId && sessionId) {
             try {
                 await db.updateMessageInChat(sessionId, placeholderMessageId, {
                     isLoading: false, sender: 'error', text: `Failed to start: ${error.message}`
                 });
                 if (sessionId === getActiveSessionIdFunc()) {
                     await renderer.renderChatSession(sessionId);
                 }
             } catch (dbError) { console.error("DB error updating placeholder on initial failure:", dbError); }
        }
        // Re-enable UI on error
        ui.enableInput();
        isSendingMessage = false;
    }
    // Note: isSendingMessage is reset within background listeners or on error paths.
}

//  Handles the specific logic for processing a URL input.
async function processUrl(sessionId, url, currentTabId) {
    console.log(`MessageHandler: Entering processUrl for session ${sessionId}, url: ${url}`);
    let placeholderMessageId = null;
    try {
        const activeTab = await getActiveTab();
        const activeTabUrl = activeTab?.url;
        const normalizeUrl = (u) => u ? u.replace(/\/$/, '') : null; // Simple normalization
        const inputUrlNormalized = normalizeUrl(url);
        const activeTabUrlNormalized = normalizeUrl(activeTabUrl);

        // --- Add Placeholder ---
        const placeholderText = (activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized)
            ? `⏳ Scraping active tab: ${url}...`
            : `⏳ Scraping ${url}...`;
        const placeholder = { messageId: db.generateMessageId(sessionId), sender: 'system', text: placeholderText, timestamp: Date.now(), isLoading: true };
        placeholderMessageId = await db.addMessageToChat(sessionId, placeholder);
        renderer.displayMessage(placeholder); // Add placeholder UI
        renderer.scrollToBottom();

        // --- Decide Scrape Method ---
        if (activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized) {
            // --- Active Tab Scraping (Content Script) ---
            console.log("MessageHandler: URL matches active tab. Using content script.");
            chrome.tabs.sendMessage(activeTab.id, { type: 'SCRAPE_ACTIVE_TAB' }, async (response) => {
                // Response handled by background listener setup in setupBackgroundListeners
                // This callback primarily handles immediate errors *sending* the message
                if (chrome.runtime.lastError) {
                    console.error('MessageHandler: Error sending SCRAPE_ACTIVE_TAB:', chrome.runtime.lastError.message);
                    await handleScrapeResponse(sessionId, placeholderMessageId, false, `Error sending request: ${chrome.runtime.lastError.message}`);
                } else {
                    console.log("MessageHandler: SCRAPE_ACTIVE_TAB message sent.");
                    // Actual result processing happens in the main listener for 'scrapeResult' type messages (if content script sends one)
                    // OR potentially update directly here if content script response is simple/final
                    // For now, assume background script handles the final update via STAGE_SCRAPE_RESULT or similar
                }
            });
        } else {
            // --- Background Scraping (Offscreen/Fetch) ---
            console.log("MessageHandler: URL differs from active tab or no active tab. Using background scrape.");
            chrome.runtime.sendMessage({
                type: 'TEMP_SCRAPE_URL',
                url: url,
                tabId: currentTabId, // Pass context tab ID
                chatId: sessionId,
                messageId: placeholderMessageId // ID for background to update
            }, (response) => {
                 if (chrome.runtime.lastError) {
                    console.error('MessageHandler: Error sending TEMP_SCRAPE_URL:', chrome.runtime.lastError.message);
                    // Update placeholder to show error if sending failed
                     handleBackgroundResponseError(sessionId, placeholderMessageId, `Error initiating scrape: ${chrome.runtime.lastError.message}`);
                 } else {
                     console.log("MessageHandler: TEMP_SCRAPE_URL message sent successfully.");
                     // Background script will send 'STAGE_SCRAPE_RESULT' messages
                 }
            });
        }
    } catch (error) {
        console.error("MessageHandler: Error in processUrl:", error);
        // Ensure placeholder is updated on error
        if (placeholderMessageId) {
            await handleScrapeResponse(sessionId, placeholderMessageId, false, `Error processing URL: ${error.message}`);
        } else {
            // If placeholder wasn't even created, show general error
             showError(`Error processing URL: ${error.message}`);
             ui.enableInput(); // Re-enable UI
             isSendingMessage = false;
        }
        throw error; // Re-throw to be caught by handleSendMessage if needed
    }
}

//  Handles the specific logic for processing a text query input.
async function processQuery(sessionId, text, currentTabId) {
    console.log(`MessageHandler: Entering processQuery for session ${sessionId}, text: ${text}`);
    let placeholderMessageId = null;
    try {
        // --- Add Placeholder ---
        const placeholder = { messageId: db.generateMessageId(sessionId), sender: 'ai', text: 'Thinking...', timestamp: Date.now(), isLoading: true };
        placeholderMessageId = await db.addMessageToChat(sessionId, placeholder);
        renderer.displayMessage(placeholder); // Add placeholder UI
        renderer.scrollToBottom();

        // --- Send Query to Background ---
        const messagePayload = {
            type: 'query',
            tabId: currentTabId, // Pass context tab ID
            text: text,
            // model: document.getElementById('model-selector')?.value || 'default', // Get model if selector exists
            chatId: sessionId,
            messageId: placeholderMessageId // ID for background to update
        };

        console.log('MessageHandler: Sending query to background:', messagePayload);
        chrome.runtime.sendMessage(messagePayload, (response) => {
            // Handle immediate errors sending the message
            if (chrome.runtime.lastError) {
                console.error('MessageHandler: Error sending query:', chrome.runtime.lastError.message);
                 handleBackgroundResponseError(sessionId, placeholderMessageId, `Connection error: ${chrome.runtime.lastError.message}`);
            } else {
                console.log('MessageHandler: Query message sent successfully.');
                // Background script will send 'response' or 'error' message
            }
        });
    } catch (error) {
        console.error("MessageHandler: Error in processQuery:", error);
         // Ensure placeholder is updated on error
         if (placeholderMessageId) {
             await handleBackgroundResponseError(sessionId, placeholderMessageId, `Error processing query: ${error.message}`);
         } else {
             showError(`Error processing query: ${error.message}`);
             ui.enableInput(); // Re-enable UI
             isSendingMessage = false;
         }
        throw error; // Re-throw to be caught by handleSendMessage if needed
    }
}

//  Central listener for messages coming *from* the background script or content scripts.
export function setupBackgroundListeners() {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        console.log("MessageHandler received message:", message);

        // Ensure dependencies are available
        if (!db || !ui || !renderer || !getActiveSessionIdFunc) {
             console.error("MessageHandler listener: Dependencies not initialized!");
             return false; // Indicate sync handling
        }

        const currentSessionId = getActiveSessionIdFunc();

        // --- AI Response ---
        if (message.type === 'response' && message.chatId && message.messageId) {
            const { chatId, messageId, text } = message;
            console.log(`MessageHandler: Handling 'response' for chat ${chatId}, message ${messageId}`);
            await handleBackgroundResponse(chatId, messageId, {
                isLoading: false,
                sender: 'ai',
                text: text || 'Received empty response.'
            });
        }
        // --- AI Error ---
        else if (message.type === 'error' && message.chatId && message.messageId) {
            const { chatId, messageId, error } = message;
            console.error(`MessageHandler: Handling 'error' for chat ${chatId}, message ${messageId}:`, error);
            await handleBackgroundResponse(chatId, messageId, {
                isLoading: false,
                sender: 'error',
                text: `Error: ${error || 'Unknown error occurred.'}`
            });
        }
        // --- Scrape Stage Result ---
        else if (message.type === 'STAGE_SCRAPE_RESULT' && message.payload) {
            const { stage, success, chatId, messageId: originalPlaceholderId, error, ...resultData } = message.payload;
            console.log(`MessageHandler: Handling STAGE_SCRAPE_RESULT Stage ${stage}, chatId: ${chatId}`);

            // Create the message representing this stage's outcome
            const stageResultMessage = {
                messageId: db.generateMessageId(chatId), // New ID for this stage message
                sender: success ? 'system' : 'error',
                timestamp: Date.now(),
                isLoading: false,
                metadata: {
                     type: 'scrape_stage_result',
                     stage: stage,
                     originalPlaceholderId: originalPlaceholderId, // Link back if needed
                     success: success,
                     ...(success ? resultData : { error: error || 'Unknown' }) // Merge result data or error
                }
            };
            // Simple text summary for the stage message bubble
            stageResultMessage.text = success
                ? `Stage ${stage} (${resultData.method || '?'}) OK`
                : `Stage ${stage} Failed: ${error || 'Unknown'}`;

            try {
                // Add the stage result message to the chat
                await db.addMessageToChat(chatId, stageResultMessage);
                console.log(`MessageHandler: Added stage ${stage} result message to DB.`);

                // Determine if this is the final update for this scrape request
                // Logic: If any stage succeeds OR if it's the designated final stage (e.g., stage 4) AND it failed
                // We need a reliable way to know the final stage number or if success means completion.
                // Assuming success at any stage OR failure at the last stage (e.g., 4) is final for now.
                const isFinalUpdate = success || stage === 4; // Adjust '4' if number of stages changes

                if (isFinalUpdate) {
                    console.log(`MessageHandler: Final update for scrape (Stage ${stage}, Success: ${success}). Cleaning up placeholder ${originalPlaceholderId}.`);
                    try {
                        await db.deleteMessageFromChat(chatId, originalPlaceholderId);
                    } catch (deleteError) {
                         console.error(`MessageHandler: Failed to delete placeholder ${originalPlaceholderId}, continuing.`, deleteError);
                    }

                    console.log(`MessageHandler: Attempting to re-enable UI after final scrape update for chat ${chatId}.`);
                    try {
                        ui.enableInput(); 
                        ui.focusInput(); 
                        console.log(`MessageHandler: Successfully called enableInput and focusInput for chat ${chatId}.`);
                    } catch (uiError) {
                        console.error(`MessageHandler: Error during UI enable/focus for chat ${chatId}:`, uiError);
                        showError("Error updating UI state after scrape.");
                    }
                    isSendingMessage = false; // Allow new messages
                    console.log("MessageHandler: UI re-enabled, isSendingMessage reset."); // Keep this log
                }

                // --- ALWAYS Re-render the chat that received the update --- 
                console.log(`MessageHandler: Attempting to re-render chat ${chatId} after stage result.`); // Add log
                try {
                    await renderer.renderChatSession(chatId);
                    console.log(`MessageHandler: Successfully re-rendered chat ${chatId} after stage result.`);
                } catch (renderError) {
                     console.error(`MessageHandler: Error re-rendering chat ${chatId} after stage result:`, renderError);
                     showError("Error displaying latest chat messages.");
                }

            } catch (dbError) {
                console.error(`MessageHandler: DB Error handling STAGE_SCRAPE_RESULT (Stage ${stage}):`, dbError);
                showError(`Failed to record result for Stage ${stage}.`);
                // Error path also tries to re-enable
                if (isFinalUpdate) {
                     console.log(`MessageHandler: Attempting to re-enable UI after DB error during final scrape update for chat ${chatId}.`);
                     try {
                        ui.enableInput(); 
                        console.log(`MessageHandler: Successfully called enableInput after DB error for chat ${chatId}.`);
                     } catch (uiErrorOnErrorPath) {
                        console.error(`MessageHandler: Error during UI enable after DB error for chat ${chatId}:`, uiErrorOnErrorPath);
                        showError("Error updating UI state after DB error.");
                     }
                     isSendingMessage = false; 
                }
            }
        }
        // --- (Optional) Direct Content Script Scrape Result ---
        // If content script sends a final result directly (less common with multi-stage)
        else if (message.type === 'scrapeResult' && message.chatId && message.messageId) {
             const { chatId, messageId, success, error, ...scrapeData } = message;
             console.log(`MessageHandler: Handling direct 'scrapeResult' for chat ${chatId}, message ${messageId}`);
             await handleScrapeResponse(chatId, messageId, success, error, scrapeData);
        }
        else {
            // console.log("MessageHandler: Message type not handled:", message.type);
        }

        return false; // Indicate synchronous handling or no response needed
    });
}

//  Handles updating the placeholder message based on a background response (AI or Error).
async function handleBackgroundResponse(chatId, messageId, updatePayload) {
    console.log(`MessageHandler: Entering handleBackgroundResponse for chat ${chatId}, message ${messageId}`);
    try {
        await db.updateMessageInChat(chatId, messageId, updatePayload);
        console.log(`MessageHandler: Updated message ${messageId} in chat ${chatId}.`);

        // Re-render the session that received the update
        // We might re-render even if not active, but that's usually okay.
        await renderer.renderChatSession(chatId); 

        console.log(`MessageHandler: Attempting to re-enable UI after background response for chat ${chatId}.`); // Add log
        ui.enableInput(); 
        ui.focusInput(); 

    } catch (dbError) {
        console.error(`MessageHandler: DB Error updating message ${messageId} for background response:`, dbError);
    } finally {
         isSendingMessage = false;
         console.log("MessageHandler: isSendingMessage reset after background response.");
    }
}

//  Handles updating the placeholder specifically for errors during background processing initiation.
async function handleBackgroundResponseError(chatId, messageId, errorMessage) {
    console.log(`MessageHandler: Entering handleBackgroundResponseError for chat ${chatId}, message ${messageId}`);
     try {
         await db.updateMessageInChat(chatId, messageId, {
             isLoading: false,
             sender: 'error',
             text: errorMessage
         });
         // Re-render the session that received the error
         await renderer.renderChatSession(chatId); 
     } catch (dbError) {
         console.error(`MessageHandler: DB Error updating message ${messageId} on background error:`, dbError);
         showError("Failed to update chat with error status.");
     }
     // Always re-enable UI and reset sending flag on error
     console.log(`MessageHandler: Attempting to re-enable UI after background response error for chat ${chatId}.`); // Add log
     ui.enableInput();
     isSendingMessage = false;
}


//  Handles updating the placeholder message based on a scrape result (success or failure).
// Used for direct content script responses or potentially final stage updates if simplified.
async function handleScrapeResponse(chatId, messageId, success, error, scrapeData = {}) {
    console.log(`MessageHandler: Entering handleScrapeResponse for chat ${chatId}, message ${messageId}, Success: ${success}`);
     const updatePayload = { isLoading: false };
     if (success) {
         updatePayload.sender = 'system'; // Or 'ai' if preferred
         updatePayload.text = scrapeData.text || scrapeData.excerpt || 'Scraped content (no text found).';
         updatePayload.metadata = {
             type: 'scrape_result', // Mark as final result
             method: scrapeData.method || 'unknown',
             url: scrapeData.url,
             title: scrapeData.title,
             // Add other relevant metadata from scrapeData
         };
     } else {
         updatePayload.sender = 'error';
         updatePayload.text = `Scraping failed: ${error || 'Unknown error.'}`;
     }

     // Reuse handleBackgroundResponse, which now contains the UI enabling logic and checks
     console.log(`MessageHandler: Calling handleBackgroundResponse from handleScrapeResponse for chat ${chatId}`);
     await handleBackgroundResponse(chatId, messageId, updatePayload); 
} 