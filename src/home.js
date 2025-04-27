// Import necessary functions from db.js
import { dbInitializationPromise, /* REMOVED: saveChatHistory, */ loadAllChatHistory, createChatSession, addMessageToChat, updateMessageInChat, getChatSessionById, generateMessageId, deleteMessageFromChat } from './db.js';

// Import function to get the active session ID from sidepanel
import { getActiveChatSessionId } from './sidepanel.js'; // We need this export from sidepanel.js

// Import showNotification function from notifications.js
import { showNotification } from './notifications.js'; // Make sure this is imported

// --- Consolidated DOM Element Declarations ---
let queryInput, sendButton, chatBody, attachButton, fileInput; 
// Comment out old drive modal elements
// let driveButton, driveModal, driveModalClose, driveModalCancel, driveModalInsert, driveFileListContainer;
// let driveModalContent, driveModalHeader, driveModalSelectedArea, driveModalMiddleSection, driveModalFooter; 

// --- NEW: Drive Viewer Modal Elements ---
let driveButton; // Keep the main trigger button
let driveViewerModal, driveViewerClose, driveViewerList, driveViewerCancel, driveViewerInsert, driveViewerSearch, driveViewerSelectedArea, driveViewerBreadcrumbsContainer, driveViewerBack; // Keep selections
// ------------------------------------

// State specific to Home page
// let currentTabId = null; // Passed during init, keep if needed for context
// let chatMessages = []; // REMOVED - Source of truth is now DB

// --- Store the callback from sidepanel ---
let onSessionCreatedCallback = null; // <<< ADD

// --- DOM Elements --- 
let isSendingMessage = false;
let currentContextTabId = null; 

// --- ADD Drive Modal DOM Elements ---
// let isDriveModalOpen = false;
// --- REMOVE/COMMENT OUT unused refs for now ---
// let currentFolderId = 'root';
// let currentFolderPath = [{ id: 'root', name: 'Root' }]; 
// let driveFilesCache = {}; 
// let selectedDriveFiles = {}; 
let isFetchingDriveList = false;
let driveSearchTerm = ''; // Restore search term
// ---------------------------

// --- Drive Viewer Modal State ---
// let isDriveViewerOpen = false;
// let currentFolderId = 'root'; // Restore folder tracking
// let currentFolderPath = [{ id: 'root', name: 'Root' }]; // Restore for breadcrumbs
// let driveFilesCache = {}; // Restore for caching
// let selectedDriveFiles = {}; // Restore selection tracking
// ---------------------------

// --- Constants --- 
// Please place your API Key from Google Cloud Console here
const GOOGLE_API_KEY = 'AIzaSyBIEk7rhZdvDXj7HFWKtp4rwSpZD5q8wEc'; // <<< UPDATED
// Derive App ID from Client ID (remove .apps.googleusercontent.com)
const GOOGLE_CLIENT_ID = '1054233721282-tvskc3gdni8v4h2u1k2767a9ngbf4ong.apps.googleusercontent.com';
const GOOGLE_APP_ID = GOOGLE_CLIENT_ID.split('-')[0];
// REMOVED: const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

// --- Global Variables ---
// Note: The 'gapi' and 'google' objects become available globally once the Google API script loads.
let gapiLoaded = false;
let pickerApiLoaded = false;
let oauthToken = null; // Store the token after successful auth

const OFFSCRIPT_PATH = 'offscreen.html';

// --- Utility Functions --- 
function showError(message) {
    // (Consider moving to a shared utils.js if needed elsewhere)
    console.error("UI Error:", message);
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.backgroundColor = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '100'; 
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// --- Core Home Page Logic --- 

// REMOVED: addMessageToState - Messages added directly to DB

// NEW: Render chat messages for a given session ID
async function renderChatSession(sessionId) {
    if (!chatBody) return;
    console.log(`Home: Rendering chat session ID: ${sessionId}`);
    chatBody.innerHTML = ''; // Clear existing messages

    if (!sessionId) {
        // No active session, show welcome message
        displayWelcomeMessage();
        return;
    }

    try {
        const sessionData = await getChatSessionById(sessionId);
        if (!sessionData || !sessionData.messages || sessionData.messages.length === 0) {
            console.log(`Home: Session ${sessionId} is empty or not found. Showing welcome.`);
            displayWelcomeMessage(); // Show welcome if session is empty/invalid
        } else {
             console.log(`Home: Rendering ${sessionData.messages.length} messages for session ${sessionId}.`);
             const isScrolledToBottom = chatBody.scrollHeight - chatBody.clientHeight <= chatBody.scrollTop + 1;
            
             sessionData.messages.forEach(msg => displayMessage(msg)); // Display messages from DB

             // Scroll to bottom after rendering
             if (isScrolledToBottom || true) { // Always scroll down for now
                 chatBody.scrollTop = chatBody.scrollHeight;
             }
        }
    } catch (error) {
        console.error(`Home: Error fetching/rendering chat session ${sessionId}:`, error);
        showError(`Failed to load chat: ${error.message}`);
        displayWelcomeMessage(); // Show welcome on error
    }
}

// Display a single message bubble (accepts message object from DB)
const displayMessage = (msg) => { 
    if (!chatBody) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'mb-2');
    messageDiv.id = msg.messageId || `msg-fallback-${Date.now()}-${Math.random()}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('rounded-lg', 'break-words', 'relative', 'group'); // Added relative, group
    // Increase max width
    bubbleDiv.classList.add('max-w-4xl'); // <<< INCREASED MAX WIDTH

    // --- Copy Button Container ---
    const copyButtonContainer = document.createElement('div');
    copyButtonContainer.className = 'copy-button-container absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity';
    const copyButton = document.createElement('button');
    copyButton.innerHTML = `<svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
    copyButton.className = 'copy-button p-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    copyButton.title = 'Copy text';
    copyButton.onclick = (e) => {
        e.stopPropagation(); // Prevent bubble click events
        let textToCopy = '';
        // Find the main content area (might be text, JSON, etc.)
        const contentElement = bubbleDiv.querySelector('pre code') || bubbleDiv.querySelector('.prose') || bubbleDiv;
        textToCopy = contentElement.textContent || '';
        navigator.clipboard.writeText(textToCopy)
            .then(() => showNotification('Copied!', 'success', 1500))
            .catch(err => {
                console.error('Failed to copy:', err);
                showNotification('Copy failed', 'error', 1500);
            });
    };
    copyButtonContainer.appendChild(copyButton);
    bubbleDiv.appendChild(copyButtonContainer);
    // ---------------------------

    let codeElement = null; // Keep track if we create a code element

    // --- Check message type by metadata --- 
    if (msg.metadata && msg.metadata.type === 'scrape_result') {
        // --- FINAL Scrape Result Rendering (Scrollable) --- 
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-200', 'dark:bg-gray-600', 'p-2');

        const headerDiv = document.createElement('div');
        headerDiv.classList.add('text-xs', 'font-semibold', 'mb-1', 'text-gray-700', 'dark:text-gray-300');
        // Display method in header
        headerDiv.textContent = `Scraped (${msg.metadata.method || 'Unknown'}): ${msg.metadata.title || msg.metadata.url || 'Content'}`;
        bubbleDiv.appendChild(headerDiv);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('overflow-y-auto', 'max-h-64', 'text-sm', 'prose', 'prose-sm', 'dark:prose-invert', 'whitespace-pre-wrap');
        contentDiv.textContent = msg.text;
        bubbleDiv.appendChild(contentDiv);

    } else if (msg.metadata && msg.metadata.type === 'scrape_stage_result') {
        // --- INDIVIDUAL Stage Result Rendering (for comparison) --- 
        messageDiv.classList.add('justify-start'); 
        bubbleDiv.classList.add('p-2');

        const stageHeaderDiv = document.createElement('div');
        stageHeaderDiv.classList.add('text-xs', 'font-semibold', 'mb-1');
        
        if (msg.metadata.success) {
            bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700');
            bubbleDiv.classList.add('border', 'border-gray-300', 'dark:border-gray-600');
            stageHeaderDiv.classList.add('text-gray-700', 'dark:text-gray-300');
            stageHeaderDiv.textContent = `[Stage ${msg.metadata.stage} - ${msg.metadata.method || 'Unknown'} - Success] Length: ${msg.metadata.length || 0}`;
            bubbleDiv.appendChild(stageHeaderDiv);
            
            // --- MODIFIED: Add JSON view --- 
            const stageContentContainer = document.createElement('div');
            stageContentContainer.classList.add('overflow-y-auto', 'max-h-64', 'mt-1'); // Use max-h-64 like final result
            
            const preElement = document.createElement('pre');
            // Add Prism theme background class for consistency (optional but recommended)
            preElement.classList.add('bg-gray-800', 'rounded', 'p-2'); // Example: Using dark bg
            
            // ADDED: Create code element for Prism
            codeElement = document.createElement('code');
            codeElement.className = 'language-json'; // Set language for Prism
            
            // Format the segments (and potentially links) as JSON
            const dataToShow = {
                 title: msg.metadata.title || 'N/A',
                 segments: msg.metadata.segments,
                 // links: msg.metadata.links // Optionally include links too
            };
            codeElement.textContent = JSON.stringify(dataToShow, null, 2);
            
            preElement.appendChild(codeElement); // Append code to pre
            stageContentContainer.appendChild(preElement); // Append pre to container
            bubbleDiv.appendChild(stageContentContainer);
            // --- END MODIFICATION --- 

        } else {
            bubbleDiv.classList.add('bg-red-100', 'dark:bg-red-900');
            stageHeaderDiv.classList.add('text-red-700', 'dark:text-red-300');
            stageHeaderDiv.textContent = `[Stage ${msg.metadata.stage} - Failed] Error: ${msg.metadata.error || 'Unknown'}`;
            bubbleDiv.appendChild(stageHeaderDiv);
        }

    } else {
        // --- Normal Message Rendering --- 
        bubbleDiv.classList.add('p-2'); // Add padding for normal messages
        bubbleDiv.textContent = msg.text;

        if (msg.isLoading) {
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'italic');
        } else if (msg.sender === 'user') {
            messageDiv.classList.add('justify-end');
            bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100', 'p-2');
        } else if (msg.sender === 'error') {
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-red-100', 'dark:bg-red-900', 'text-red-700', 'dark:text-red-300', 'p-2');
        } else { // Includes 'ai', 'system' etc.
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-900', 'dark:text-green-100', 'p-2');
        }
    }
    // --- End Rendering Logic --- 

    messageDiv.appendChild(bubbleDiv);
    chatBody.appendChild(messageDiv);

    // --- ADDED: Trigger Prism highlighting if code exists ---
    if (codeElement && window.Prism) {
        try {
            Prism.highlightElement(codeElement);
        } catch (e) {
            console.error("Prism highlighting failed:", e);
        }
    }
    // ------------------------------------------------------
};

// NEW: Display the initial welcome message
const displayWelcomeMessage = () => {
    if (!chatBody) return;
    chatBody.innerHTML = ''; // Clear previous messages
    // You can customize this welcome message structure
    const welcomeMsg = {
        messageId: 'welcome-msg',
        sender: 'ai',
        text: 'Welcome to Tab Agent! Ask me anything or paste a URL to scrape.',
        timestamp: Date.now(),
        isLoading: false
    };
    displayMessage(welcomeMsg);
    // Ensure input is enabled when showing welcome
    if (queryInput) queryInput.disabled = false;
    if (sendButton) sendButton.disabled = true; // Disabled until user types
    adjustTextareaHeight();
};

// Adjust textarea height
const adjustTextareaHeight = () => {
    if (!queryInput) return;
    queryInput.style.height = 'auto';
    const maxHeight = 150;
    const scrollHeight = queryInput.scrollHeight;
    queryInput.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    if (sendButton) {
        sendButton.disabled = queryInput.value.trim() === '' || queryInput.disabled;
    }
};

// --- NEW: Handle URL Scraping (Database-centric) --- 
async function handleUrlScrapeRequest(url, currentTabId) { // Pass currentTabId if needed by background
    let sessionId = getActiveChatSessionId(); // Get current session ID
    let userMessageId = null;
    let placeholderMessageId = null;

    console.log(`Home: Handling URL Scrape Request for URL: ${url}. Active Session: ${sessionId}`);

    try {
        // 1. Save User Message
        const userMessage = {
            sender: 'user',
            text: url, 
            timestamp: Date.now(),
            isLoading: false
        };
        if (!sessionId) {
            // First message in a new chat
            console.log("Home: No active session, creating new one for URL message.");
            sessionId = await createChatSession(userMessage);
            // --- CALL THE CALLBACK --- <<< MODIFY
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            } else {
                console.error("Home: onSessionCreatedCallback is not defined in handleUrlScrapeRequest!");
            }
            // --- END CALLBACK CALL --- 
            await renderChatSession(sessionId); 
            userMessageId = sessionId ? (await getChatSessionById(sessionId))?.messages[0]?.messageId : null; // Get ID of the first message
        } else {
            userMessageId = await addMessageToChat(sessionId, userMessage);
            await renderChatSession(sessionId); // Re-render to show user message
        }

        // 2. Save Placeholder Message
        const placeholderMessage = {
            messageId: generateMessageId(sessionId), // Generate unique ID
            sender: 'system', 
            text: `⏳ Scraping ${url}...`,
            timestamp: Date.now(),
            isLoading: true
        };
        placeholderMessageId = await addMessageToChat(sessionId, placeholderMessage);
        await renderChatSession(sessionId); // Re-render to show placeholder

        // 3. Clear input & disable
        queryInput.value = '';
        adjustTextareaHeight();
        queryInput.disabled = true; // Disable while processing
        sendButton.disabled = true;

        // 4. Send Request to Background
        console.log(`Home: Sending TEMP_SCRAPE_URL request to background. ChatID: ${sessionId}, MessageID: ${placeholderMessageId}`);
        chrome.runtime.sendMessage({
            type: 'TEMP_SCRAPE_URL',
            url: url,
            tabId: currentTabId, // Pass context if needed by background
            chatId: sessionId,
            messageId: placeholderMessageId 
        });
        // The response/result is now handled by the main chrome.runtime.onMessage listener

    } catch (error) {
        console.error("Home: Error processing URL scrape request:", error);
        showError(`Error saving/starting scrape: ${error.message}`);
        // Attempt to re-enable input on error
        // Only re-enable if the placeholder was successfully added? Consider.
        if(placeholderMessageId && sessionId){
            // If we failed after adding placeholder, update it to error state
             updateMessageInChat(sessionId, placeholderMessageId, {
                 isLoading: false,
                 sender: 'error',
                 text: `Failed to initiate scrape: ${error.message}`
             }).then(() => renderChatSession(sessionId)).catch(e => console.error("DB update failed on initial error:", e));
        }
        queryInput.disabled = false;
        adjustTextareaHeight();
        sendButton.disabled = queryInput.value.trim() === '';
    }
}

// Regular expression to check for URLs (simple version)
const URL_REGEX = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;

// Helper function to get active tab info
function getActiveTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            if (tabs && tabs.length > 0) {
                resolve(tabs[0]);
            } else {
                // Handle case where no active tab is found (might happen in edge cases)
                resolve(null);
            }
        });
    });
}

// Handle sending message (modified for active tab check AND DB integration)
const handleSendMessage = async (currentTabId) => {
    if (isSendingMessage) { // Check the flag
        console.log("Home: Already sending message, preventing double execution.");
        return;
    }
    isSendingMessage = true; // Set the flag

    const messageText = queryInput.value.trim();
    if (!messageText || queryInput.disabled) {
        isSendingMessage = false; // Reset flag if exiting early
        return; 
    }

    let sessionId = getActiveChatSessionId(); // Get current active session
    let userMessageId = null;
    let placeholderMessageId = null;

    console.log(`Home: Sending message. Text: "${messageText}". Active Session: ${sessionId}`);

    const isURL = URL_REGEX.test(messageText);

    // --- URL Handling Logic ---
    if (isURL) {
        try {
            const activeTab = await getActiveTab();
            const activeTabUrl = activeTab ? activeTab.url : null;
            const normalizeUrl = (url) => url ? url.replace(/\/$/, '') : null;
            const inputUrlNormalized = normalizeUrl(messageText);
            const activeTabUrlNormalized = normalizeUrl(activeTabUrl);

            if (activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized) {
                // --- URL matches active tab: Scrape via Content Script ---
                console.log("URL matches active tab. Sending SCRAPE_ACTIVE_TAB to content script.");

                // 1. Save User Message
                const userMessage = { sender: 'user', text: messageText, timestamp: Date.now(), isLoading: false };
                 if (!sessionId) {
                     sessionId = await createChatSession(userMessage);
                     // --- CALL THE CALLBACK --- <<< MODIFY
                     if (onSessionCreatedCallback) {
                         onSessionCreatedCallback(sessionId);
                     } else {
                         console.error("Home: onSessionCreatedCallback is not defined! (Content Script Path)");
                     }
                     // ---
                     await renderChatSession(sessionId);
                 } else {
                     userMessageId = await addMessageToChat(sessionId, userMessage);
                     await renderChatSession(sessionId);
                 }

                // 2. Save Placeholder Message
                const placeholder = { messageId: generateMessageId(sessionId), sender: 'system', text: `⏳ Scraping active tab: ${messageText}...`, timestamp: Date.now(), isLoading: true };
                placeholderMessageId = await addMessageToChat(sessionId, placeholder);
                await renderChatSession(sessionId);

                // 3. Disable input & Clear
                queryInput.value = '';
                adjustTextareaHeight();
                queryInput.disabled = true;
                sendButton.disabled = true;

                // 4. Send message to Content Script
                chrome.tabs.sendMessage(activeTab.id, { type: 'SCRAPE_ACTIVE_TAB' }, async (response) => {
                    // --- MODIFIED: Handle Response from Content Script --- 
                    let updatePayload = { 
                        isLoading: false,
                        sender: 'ai' // Keep sender as 'ai' or choose 'system'/'scrape'
                    };
                    let success = false;

                    if (chrome.runtime.lastError) {
                        console.error('Error sending/receiving SCRAPE_ACTIVE_TAB:', chrome.runtime.lastError.message);
                        updatePayload.sender = 'error';
                        updatePayload.text = `Error scraping active tab: ${chrome.runtime.lastError.message}`;
                    } else if (response?.success) {
                        console.log('Received successful scrape from active tab:', response);
                        // Store FULL textContent or excerpt
                        updatePayload.text = response.textContent || response.excerpt || 'No text content found.'; 
                        // Add metadata
                        updatePayload.metadata = {
                            type: 'scrape_result',
                            method: 'contentScript', // Indicate method
                            url: inputUrlNormalized, // URL user entered
                            title: response.title || inputUrlNormalized
                            // Add other fields from response if available (e.g., response.content)
                        };
                        success = true;
                    } else {
                        const errorMsg = response?.error || 'Unknown error from content script.';
                        console.error('Content script reported scrape failure:', errorMsg);
                        updatePayload.sender = 'error';
                        updatePayload.text = `Scraping active tab failed: ${errorMsg}`;
                    }
                    // --- END MODIFICATION ---

                    // 5. Update Placeholder in DB
                    try {
                       await updateMessageInChat(sessionId, placeholderMessageId, updatePayload);
                       await renderChatSession(sessionId); // Re-render
                    } catch (dbError) {
                       console.error("Home: DB Error updating content script scrape result:", dbError);
                       showError("Failed to save scrape result.");
                    }

                    // 6. Re-enable input
                    queryInput.disabled = false;
                    adjustTextareaHeight(); 
                    queryInput.focus();
                    isSendingMessage = false; // <-- RESET FLAG HERE
                });

            } else {
                // --- URL does NOT match active tab: Use Background Scrape ---
                console.log("URL does not match active tab. Using background scrape.");
                handleUrlScrapeRequest(messageText, currentTabId); 
                // Note: isSendingMessage reset is handled by the background response listener
            }
        } catch (error) {
            console.error("Error checking active tab or processing URL:", error);
            showError(`Error processing URL: ${error.message}`);
            // Fallback to background scrape on error? Or just let user retry?
            // For now, just show error and re-enable input if it was disabled.
            queryInput.disabled = false;
            adjustTextareaHeight();
            isSendingMessage = false; // Reset flag on error within try block
        } 
        return; // Stop further processing 
    }
    // --- End URL Handling ---

    // --- Regular Chat Query Logic --- 
    try {
        // 1. Save User Message
        const userMessage = { sender: 'user', text: messageText, timestamp: Date.now(), isLoading: false };
        if (!sessionId) {
            sessionId = await createChatSession(userMessage);
            // --- CALL THE CALLBACK --- <<< MODIFY
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            } else {
                console.error("Home: onSessionCreatedCallback is not defined! (Query Path)");
            }
            // --- 
            await renderChatSession(sessionId);
        } else {
            userMessageId = await addMessageToChat(sessionId, userMessage);
            await renderChatSession(sessionId);
        }

        // 2. Save Placeholder Message
        const placeholder = { messageId: generateMessageId(sessionId), sender: 'ai', text: 'Thinking...', timestamp: Date.now(), isLoading: true };
        placeholderMessageId = await addMessageToChat(sessionId, placeholder);
        await renderChatSession(sessionId);

        // 3. Disable input & Clear
        queryInput.disabled = true; 
        sendButton.disabled = true;
        queryInput.value = '';
        adjustTextareaHeight();

        // 4. Send Request to Background
        const messagePayload = {
            type: 'query',
            tabId: currentTabId, // Keep for context if background needs it
            text: messageText,
            model: document.getElementById('model-selector')?.value || 'default',
            // ---- NEW ----
            chatId: sessionId,
            messageId: placeholderMessageId 
            // ------------
        };

        console.log('Home: Sending query to background:', messagePayload);
        chrome.runtime.sendMessage(messagePayload, (response) => {
            // This callback confirms message SENT. Result comes via listener.
            if (chrome.runtime.lastError) {
                console.error('Home: Error sending query:', chrome.runtime.lastError.message);
                // Update placeholder to show sending error
                 updateMessageInChat(sessionId, placeholderMessageId, {
                     isLoading: false,
                     sender: 'error',
                     text: `Error: Could not connect. ${chrome.runtime.lastError.message}`
                 }).then(() => {
                    if (sessionId === getActiveChatSessionId()) renderChatSession(sessionId);
                 });
                 // Re-enable input immediately ONLY if sending failed
                 queryInput.disabled = false;
                 adjustTextareaHeight();
                 isSendingMessage = false; // Reset flag on send error
            } else {
                console.log('Home: Query message sent successfully.', response);
                 // Input remains disabled until result listener fires
                 // isSendingMessage flag will be reset by the listener or if an error occurs during processing below
            }
        });

    } catch (error) {
        console.error("Home: Error processing chat query:", error);
        showError(`Error sending message: ${error.message}`);
        queryInput.disabled = false;
        adjustTextareaHeight();
        isSendingMessage = false; // Reset flag on processing error
    }
};

// --- NEW: Handle File Input Change --- 
async function handleFileSelected(event) {
    if (!event.target.files || event.target.files.length === 0) {
        console.log("No file selected.");
        return;
    }

    const file = event.target.files[0];
    console.log(`File selected: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

    // TODO: Implement actual file processing (reading content, sending to background)
    
    // --- Add placeholder message to chat --- 
    let sessionId = getActiveChatSessionId();
    if (!sessionId) {
        // If there's no active chat, maybe create one? Or show an error?
        // For now, let's show an error if no chat is active.
        showError("Please start a chat before attaching a file.");
         // Reset file input value to allow selecting the same file again if needed
         if(fileInput) fileInput.value = '';
        return; 
    }

    const fileMessage = {
        sender: 'system', // Or maybe a new 'file' sender type?
        text: `📎 Attached file: ${file.name}`, 
        timestamp: Date.now(),
        isLoading: false // Not really loading, just indicating attachment
    };

    try {
        await addMessageToChat(sessionId, fileMessage);
        await renderChatSession(sessionId); // Re-render to show the attachment message
    } catch (error) {
         console.error("Error adding file attachment message to chat:", error);
         showError("Failed to add file attachment message.");
    }
    // --- End placeholder message --- 

    // Reset file input value to allow selecting the same file again if needed
    if(fileInput) fileInput.value = ''; 
}

// --- MODIFIED: Initialization --- 
function initializeHomePage(tabId, onSessionCreated) { 
    console.log(`[HomeInit] Initializing Home Page elements and listeners. Context TabID: ${tabId}`);
    currentContextTabId = tabId;
    
    // --- ADD GUARD: Only set callback if it's not already set and is a function --- 
    if (!onSessionCreatedCallback && typeof onSessionCreated === 'function') {
        console.log("[HomeInit] Storing onSessionCreatedCallback.");
        onSessionCreatedCallback = onSessionCreated; 
    } else if (typeof onSessionCreated !== 'function' && !onSessionCreatedCallback) {
         console.warn("[HomeInit] onSessionCreated callback was not provided or already set.");
    }
    // --- END GUARD --- 

    // Assign chat elements
    queryInput = document.getElementById('query-input');
    sendButton = document.getElementById('send-button');
    chatBody = document.getElementById('chat-body');
    attachButton = document.getElementById('attach-button'); 
    fileInput = document.getElementById('file-input');      

    // Assign Drive Viewer Modal elements (using variables declared above)
    driveButton = document.getElementById('drive-button'); 
    driveViewerModal = document.getElementById('drive-viewer-modal');
    driveViewerClose = document.getElementById('drive-viewer-close');
    driveViewerList = document.getElementById('drive-viewer-list');
    driveViewerCancel = document.getElementById('drive-viewer-cancel');
    driveViewerInsert = document.getElementById('drive-viewer-insert');
    driveViewerSearch = document.getElementById('drive-viewer-search');
    driveViewerSelectedArea = document.getElementById('drive-viewer-selected-area');
    driveViewerBreadcrumbsContainer = document.getElementById('drive-viewer-breadcrumbs');
    driveViewerBack = document.getElementById('drive-viewer-back');
    // Comment out assignments for unused elements
    // driveBreadcrumbsContainer = document.getElementById('drive-breadcrumbs');
    // driveSelectedFilesContainer = document.getElementById('drive-selected-files');
    // driveSearchInput = document.getElementById('drive-modal-search'); 
    // driveModalBack = document.getElementById('drive-modal-back');   

    // Attach chat event listeners
    queryInput?.removeEventListener('input', adjustTextareaHeight); // Remove previous if any
    queryInput?.addEventListener('input', adjustTextareaHeight);
    
    queryInput?.removeEventListener('keydown', handleEnterKey);
    queryInput?.addEventListener('keydown', handleEnterKey); // Use named function
    
    sendButton?.removeEventListener('click', handleSendButtonClick);
    sendButton?.addEventListener('click', handleSendButtonClick); // Use named function

    // --- ADD Listeners for File Attachment --- 
    if (attachButton && fileInput) {
        // Remove first to prevent duplicates if init runs again
        attachButton.removeEventListener('click', handleAttachClick);
        attachButton.addEventListener('click', handleAttachClick);

        fileInput.removeEventListener('change', handleFileSelected);
        fileInput.addEventListener('change', handleFileSelected);
    } else {
        console.warn("Attach button or file input element not found.");
    }
    // --- 

    // --- Google Drive Button Listener --- REMOVED
    // REMOVED: driveButton.addEventListener('click', handleDriveConnect);

    // --- Attach SIMPLIFIED Drive Viewer listeners --- REMOVED
    // REMOVED: driveButton?.removeEventListener('click', showDriveViewerModal);
    // REMOVED: driveButton?.addEventListener('click', showDriveViewerModal);
    // REMOVED: driveViewerClose?.removeEventListener('click', hideDriveViewerModal);
    // REMOVED: driveViewerClose?.addEventListener('click', hideDriveViewerModal);
    // REMOVED: driveViewerCancel?.removeEventListener('click', hideDriveViewerModal);
    // REMOVED: driveViewerCancel?.addEventListener('click', hideDriveViewerModal);

    // --- Attach Listeners for NEW Drive Viewer --- REMOVED
    // REMOVED: driveViewerSearch?.removeEventListener('input', handleDriveSearchInput);
    // REMOVED: driveViewerSearch?.addEventListener('input', handleDriveSearchInput);
    // REMOVED: driveViewerBack?.removeEventListener('click', handleDriveBackButtonClick);
    // REMOVED: driveViewerBack?.addEventListener('click', handleDriveBackButtonClick);
    // driveViewerInsert?.addEventListener(...); // Add later
    // ------------------------------------------

    console.log("Home Page Elements & Listeners Initialized." + Date.now()); // Simplified log
}

// --- Named Event Handlers for Re-attachment/Removal --- 
function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage(currentContextTabId);
    }
}

function handleSendButtonClick() {
    handleSendMessage(currentContextTabId);
}

// --- ADD Handler for Attach Button Click --- 
function handleAttachClick() {
    if (fileInput) {
        fileInput.click(); // Programmatically click the hidden file input
    }
}
// --- 

// --- REVISED: Google Drive Connection Handler - REMOVED ---
// REMOVED: async function handleDriveConnect() { ... }

// --- MODIFIED: Background Message Listener ---
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("Home: Received message:", message, "from sender:", sender);

    // --- Handle Query (Modified to check sender context) ---
    if (message.type === 'query') {
        // ... query handling logic ...
    }
    // --- Handle Request for Tab ID ---
    else if (message.type === 'getTabId') {
        // ... tab id logic ...
    }
    // --- Handle Popup Creation Tracking --- 
    else if (message.type === 'popupCreated') {
        // ... popup tracking logic ...
    }
    // --- Handle Get Popup for Tab ---
    else if (message.type === 'getPopupForTab') {
        // ... get popup logic ...
    }
    // --- Handle AI response ---
    else if (message.type === 'response' && message.chatId && message.messageId) {
        // --- ADDED: Logic to handle standard AI/Query response ---
        const { chatId, messageId, text } = message;
        console.log(`Home: Received 'response' for chat ${chatId}, message ${messageId}`);

        const updatePayload = {
            isLoading: false,
            sender: 'ai', // Or 'system' based on desired display
            text: text || 'Received empty response.' // Ensure text is not empty
        };

        (async () => {
            try {
                await updateMessageInChat(chatId, messageId, updatePayload);
                console.log(`Home: Updated message ${messageId} in chat ${chatId} with AI response.`);

                // Re-render IF the chat is active
                if (chatId === getActiveChatSessionId()) {
                    await renderChatSession(chatId);
                    // Re-enable input ONLY if this chat is active
                    if (queryInput) {
                        queryInput.disabled = false;
                        adjustTextareaHeight();
                        queryInput.focus();
                    }
                    if (sendButton) {
                         sendButton.disabled = queryInput.value.trim() === '';
                    }
                }
                // Reset sending flag regardless of active chat, as the request is complete
                console.log("Home: Resetting isSendingMessage after processing 'response' message.");
                isSendingMessage = false;

            } catch (dbError) {
                console.error(`Home: DB Error updating message ${messageId} for 'response' type:`, dbError);
                showError("Failed to update chat with response.");
                // Reset flag even on error
                console.log("Home: Resetting isSendingMessage after DB error on 'response' message.");
                isSendingMessage = false;
                 // Consider re-enabling input even on error? Maybe not, to avoid double sends.
                 if (queryInput && chatId === getActiveChatSessionId()) {
                     queryInput.disabled = false; // Re-enable input on error too?
                     adjustTextareaHeight();
                 }
            }
        })();
        // --- END ADDED LOGIC ---
    }
    // --- Handle AI error ---
    else if (message.type === 'error' && message.chatId && message.messageId) {
        // ... AI error handling ...
    }
    // --- ADD HANDLER for STAGE_SCRAPE_RESULT ---
    else if (message.type === 'STAGE_SCRAPE_RESULT' && message.payload) {
        const { stage, success, chatId, messageId: originalPlaceholderId, error, ...resultData } = message.payload;
        console.log(`Home: Received STAGE_SCRAPE_RESULT for Stage ${stage}, chatId: ${chatId}, placeholderId: ${originalPlaceholderId}`);

        // --- Create a new message object for this stage result --- 
        const stageResultMessage = {
            messageId: generateMessageId(chatId),
            sender: 'system',
            timestamp: Date.now(),
            isLoading: false,
            metadata: { 
                 type: 'scrape_stage_result',
                 stage: stage,
                 originalPlaceholderId: originalPlaceholderId,
                 success: success // Store success flag here directly
            }
        };

        if (success) {
            // For success, store the structured data we want to inspect
            stageResultMessage.text = `Stage ${stage} Success (See JSON)`; // Placeholder text
            stageResultMessage.metadata.title = resultData.title || resultData.url || 'Unknown Title';
            stageResultMessage.metadata.length = resultData.text?.length || 0; // Use text length from resultData
            stageResultMessage.metadata.method = resultData.method;
            // --- STORE STRUCTURED DATA --- 
            stageResultMessage.metadata.segments = resultData.segments || []; 
            stageResultMessage.metadata.links = resultData.links || []; 
            // stageResultMessage.metadata.images = resultData.images || []; // Optionally add others
            // --------------------------- 
        } else {
            // Format error message
            stageResultMessage.sender = 'error';
            stageResultMessage.text = `Stage ${stage} Failed: ${error || 'Unknown error.'}`;
            stageResultMessage.metadata.error = error || 'Unknown error.';
        }

        // --- Add the new message to the database --- 
        (async () => { // Use async IIFE to handle DB operations
            try {
                if (stage === 1) { // Note: Stage 1 is removed, this might need adjustment if stage numbers change
                    const placeholderUpdate = { text: 'Scraping stages running...' };
                    await updateMessageInChat(chatId, originalPlaceholderId, placeholderUpdate);
                    console.log(`Home: Updated placeholder ${originalPlaceholderId} text.`);
                }
                
                await addMessageToChat(chatId, stageResultMessage);
                console.log(`Home: Added stage ${stage} result message to DB for chat ${chatId}.`);
                
                // Delete placeholder after stage 4 is added
                if (stage === 4) { 
                    console.log(`Home: Deleting original placeholder message ${originalPlaceholderId} after Stage 4.`);
                    await deleteMessageFromChat(chatId, originalPlaceholderId);
                    // Reset sending flag and re-enable input AFTER deletion and BEFORE final render
                    console.log("Home: Resetting isSendingMessage after processing Stage 4 result.");
                    isSendingMessage = false;
                     if (queryInput && chatId === getActiveChatSessionId()) {
                         queryInput.disabled = false;
                         adjustTextareaHeight();
                         queryInput.focus();
                     }
                }

                // Re-render IF the chat is active (happens after adding stage msg and potentially after deleting placeholder)
                if (chatId === getActiveChatSessionId()) {
                    await renderChatSession(chatId);
                }
                
            } catch (dbError) {
                console.error(`Home: DB Error handling STAGE_SCRAPE_RESULT (Stage ${stage}):`, dbError);
                showError(`Failed to record result for Stage ${stage}.`);
                 if (stage === 4) { 
                     console.log("Home: Resetting isSendingMessage after DB error on Stage 4.");
                     isSendingMessage = false; 
                     if (queryInput && chatId === getActiveChatSessionId()) {
                         queryInput.disabled = false;
                         adjustTextareaHeight();
                     }
                 }
            }
        })();

        return false; // Indicate message processed
    }
    // --- End STAGE_SCRAPE_RESULT Handler ---

    else {
        console.log("Home: Received message not handled by primary handlers:", message.type);
        return false;
    }
});

// Function to load and render a specific chat session (called by sidepanel)
async function loadAndRenderChat(sessionId) {
    console.log(`Home: loadAndRenderChat called for session ID: ${sessionId}`);
    if (!queryInput) {
        console.warn("Home: Cannot load chat, UI elements not ready.");
        return; // Or throw error?
    }
    // The activeChatSessionId is managed by sidepanel.js
    // This function just needs to render the specified session.
    await renderChatSession(sessionId);
    // Ensure input is enabled after loading a chat
    queryInput.disabled = false;
    adjustTextareaHeight();
    queryInput.focus();
}

// Function to reset UI to welcome state (called by sidepanel or New Chat button)
function resetAndShowWelcomeMessage() {
    console.log("Home: Resetting UI to welcome state.");
    displayWelcomeMessage();
    // Ensure activeChatSessionId is null (handled by sidepanel.js initiator)
    // Clear input
    if(queryInput) queryInput.value = '';
    adjustTextareaHeight();
    if(queryInput) queryInput.focus();
}

// --- NEW: Drive Viewer Modal Logic --- REMOVED
// REMOVED: function showDriveViewerModal() { ... }
// REMOVED: function hideDriveViewerModal() { ... }
// REMOVED: function fetchAndDisplayViewerFolderContent(folderId) { ... }
// REMOVED: function renderDriveViewerItems(items) { ... }
// REMOVED: function handleDriveItemClick(event) { ... }
// REMOVED: function updateBreadcrumbs() { ... }
// REMOVED: function handleBreadcrumbClick(event) { ... }
// REMOVED: function toggleFileSelection(fileId, element, fileData) { ... }
// REMOVED: function renderSelectedFiles() { ... }
// REMOVED: function handleRemoveSelectedFile(event) { ... }
// REMOVED: function updateInsertButtonState() { ... }
// REMOVED: const handleDriveSearchInput = debounce(...) { ... }
// REMOVED: function handleDriveBackButtonClick() { ... }
// REMOVED: function updateHeaderState() { ... }
// REMOVED: function getFallbackIcon(mimeType) { ... }

// Export the necessary functions for sidepanel.js
export { initializeHomePage, loadAndRenderChat, resetAndShowWelcomeMessage }; 
// Export the initializer function AND chatMessages if needed by history restore
// export { initializeHomePage, chatMessages, renderChatMessages }; // OLD EXPORT REMOVED 