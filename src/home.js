// Import necessary functions from db.js
import { dbInitializationPromise, saveChatHistory, loadAllChatHistory, createChatSession, addMessageToChat, updateMessageInChat, getChatSessionById, generateMessageId } from './db.js';

// Import function to get the active session ID from sidepanel
import { getActiveChatSessionId } from './sidepanel.js'; // We need this export from sidepanel.js

// Import showNotification function from notifications.js
import { showNotification } from './notifications.js'; // Make sure this is imported

// --- Consolidated DOM Element Declarations ---
let queryInput, sendButton, chatBody, attachButton, fileInput; 

// --- Drive Viewer Modal Elements ---
let driveButton;
let driveViewerModal, driveViewerClose, driveViewerList, driveViewerCancel, driveViewerInsert, driveViewerSearch, driveViewerSelectedArea, driveViewerBreadcrumbsContainer, driveViewerBack;
// ------------------------------------

// --- Store the callback from sidepanel ---
let onSessionCreatedCallback = null;

// --- State Variables ---
let currentContextTabId = null; 
let isFetchingDriveList = false;
let driveSearchTerm = '';

// --- Drive Viewer Modal State ---
let isDriveViewerOpen = false;
let currentFolderId = 'root';
let currentFolderPath = [{ id: 'root', name: 'Root' }];
let driveFilesCache = {};
let selectedDriveFiles = {};
// ---------------------------

// --- Constants --- 
const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

// --- Global Variables ---
// Note: The 'gapi' and 'google' objects are NOT expected to be loaded globally in this script anymore.

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

// Render chat messages for a given session ID
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
    // Use messageId from DB as the element ID
    messageDiv.id = msg.messageId || `msg-fallback-${Date.now()}-${Math.random()}`; 

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('rounded-lg', 'p-2', 'max-w-xs', 'lg:max-w-md', 'break-words');
    bubbleDiv.textContent = msg.text; 

    // Apply styling based on sender type or loading state
    if (msg.isLoading) {
        messageDiv.classList.add('justify-start'); 
        bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'italic', 'message-loading'); 
    } else if (msg.sender === 'user') {
        messageDiv.classList.add('justify-end');
        bubbleDiv.classList.add('bg-blue-500', 'text-white');
    } else if (msg.sender === 'error') { // Handle error type
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-red-100', 'dark:bg-red-900', 'text-red-700', 'dark:text-red-300'); // Error styling
    } else { // Includes 'ai', 'system' etc.
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-200', 'dark:bg-gray-600');
    }

    messageDiv.appendChild(bubbleDiv);
    chatBody.appendChild(messageDiv); 
};

// Display the initial welcome message
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

// Handle URL Scraping (Database-centric)
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
            // Call the callback
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            } else {
                console.error("Home: onSessionCreatedCallback is not defined in handleUrlScrapeRequest!");
            }
            
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
            tabId: currentTabId,
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
    } finally {
         // isSendingMessage = false; // Reset flag - This seems incorrect here, handled later
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
                     // Call the callback
                     if (onSessionCreatedCallback) {
                         onSessionCreatedCallback(sessionId);
                     } else {
                         console.error("Home: onSessionCreatedCallback is not defined! (Content Script Path)");
                     }
                     
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
                    let updatePayload = { isLoading: false };
                    let success = false;

                    // --- Handle Response from Content Script --- 
                    if (chrome.runtime.lastError) {
                        console.error('Error sending/receiving SCRAPE_ACTIVE_TAB:', chrome.runtime.lastError.message);
                        updatePayload.sender = 'error';
                        updatePayload.text = `Error scraping active tab: ${chrome.runtime.lastError.message}`;
                    } else if (response?.success) {
                        console.log('Received successful scrape from active tab:', response);
                        updatePayload.sender = 'ai';
                        updatePayload.text = `Scraped Active Tab: ${response.title || messageText}\n\n${(response.textContent || response.excerpt || 'No text content found.').substring(0, 500)}${ (response.textContent?.length > 500 || response.excerpt?.length > 500) ? '...' : '' }`;
                        success = true;
                    } else {
                        const errorMsg = response?.error || 'Unknown error from content script.';
                        console.error('Content script reported scrape failure:', errorMsg);
                        updatePayload.sender = 'error';
                        updatePayload.text = `Scraping active tab failed: ${errorMsg}`;
                    }

                    // 5. Update Placeholder in DB
                    try {
                       await updateMessageInChat(sessionId, placeholderMessageId, updatePayload);
                       await renderChatSession(sessionId); // Re-render
                    } catch (dbError) {
                       console.error("Home: DB Error updating content script scrape result:", dbError);
                       showError("Failed to save scrape result.");
                       // Maybe add a new error message instead?
                    }

                    // 6. Re-enable input
                    queryInput.disabled = false;
                    adjustTextareaHeight(); 
                    queryInput.focus();
                });

            } else {
                // --- URL does NOT match active tab: Use Background Scrape ---
                console.log("URL does not match active tab. Using background scrape.");
                handleUrlScrapeRequest(messageText, currentTabId); 
            }
        } catch (error) {
            console.error("Error checking active tab or processing URL:", error);
            showError(`Error processing URL: ${error.message}`);
            // Fallback to background scrape on error? Or just let user retry?
            // For now, just show error and re-enable input if it was disabled.
            queryInput.disabled = false;
            adjustTextareaHeight();
        } finally {
            // Reset flag ONLY if NOT calling background scrape
            if (!(activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized)) {
                 isSendingMessage = false; 
            }
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
            // Call the callback
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            } else {
                console.error("Home: onSessionCreatedCallback is not defined! (Query Path)");
            }
            
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
            chatId: sessionId,
            messageId: placeholderMessageId 
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
    
    // Store the callback from sidepanel if provided
    if (!onSessionCreatedCallback && typeof onSessionCreated === 'function') {
        console.log("[HomeInit] Storing onSessionCreatedCallback.");
        onSessionCreatedCallback = onSessionCreated; 
    } else if (typeof onSessionCreated !== 'function' && !onSessionCreatedCallback) {
         console.warn("[HomeInit] onSessionCreated callback was not provided or already set.");
    }
    

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
    
    // Attach chat event listeners
    queryInput?.removeEventListener('input', adjustTextareaHeight); // Remove previous if any
    queryInput?.addEventListener('input', adjustTextareaHeight);
    
    queryInput?.removeEventListener('keydown', handleEnterKey);
    queryInput?.addEventListener('keydown', handleEnterKey);
    
    sendButton?.removeEventListener('click', handleSendButtonClick);
    sendButton?.addEventListener('click', handleSendButtonClick);

    // File Attachment Listeners
    if (attachButton && fileInput) {
        // Remove first to prevent duplicates if init runs again
        attachButton.removeEventListener('click', handleAttachClick);
        attachButton.addEventListener('click', handleAttachClick);

        fileInput.removeEventListener('change', handleFileSelected);
        fileInput.addEventListener('change', handleFileSelected);
    } else {
        console.warn("Attach button or file input element not found.");
    }
    

    // Google Drive Button Listener
    driveButton.addEventListener('click', handleDriveConnect);

    // Drive Viewer Listeners
    driveButton?.removeEventListener('click', showDriveViewerModal);
    driveButton?.addEventListener('click', showDriveViewerModal);
    driveViewerClose?.removeEventListener('click', hideDriveViewerModal);
    driveViewerClose?.addEventListener('click', hideDriveViewerModal);
    driveViewerCancel?.removeEventListener('click', hideDriveViewerModal);
    driveViewerCancel?.addEventListener('click', hideDriveViewerModal);
    driveViewerSearch?.removeEventListener('input', handleDriveSearchInput);
    driveViewerSearch?.addEventListener('input', handleDriveSearchInput);
    driveViewerBack?.removeEventListener('click', handleDriveBackButtonClick);
    driveViewerBack?.addEventListener('click', handleDriveBackButtonClick);
    

    console.log("Home Page Elements & Listeners Initialized (Drive Viewer - Full Features)." + Date.now());
}

// Named Event Handlers for Re-attachment/Removal
function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage(currentContextTabId);
    }
}

function handleSendButtonClick() {
    handleSendMessage(currentContextTabId);
}

// Handler for Attach Button Click
function handleAttachClick() {
    if (fileInput) {
        fileInput.click(); // Programmatically click the hidden file input
    }
}

// Google Drive Connection Handler (Now just opens modal)
async function handleDriveConnect() {
    // This function is currently triggered by the Drive button click,
    // but the primary action (opening the modal) is handled by showDriveViewerModal,
    // which is ALSO attached to the same button click in initializeHomePage.
    // Consider simplifying this - maybe handleDriveConnect *only* checks auth
    // and then calls showDriveViewerModal, removing the direct listener for showDriveViewerModal.
    // For now, leaving as is, but it's slightly redundant.
    console.log("handleDriveConnect called - primarily for potential future auth checks before opening modal.");
    // We could add auth check logic here if needed before showing the modal.
    // showDriveViewerModal(); // Or call it from here instead of direct listener
}

// Background Message Listener
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    // Handle File List Response
    if (message.type === 'driveFileListResponse') {
        console.log('Home: Received driveFileListResponse (For Viewer):', message);
        isFetchingDriveList = false; 

        if (!isDriveViewerOpen || message.folderId !== currentFolderId) { 
            console.warn(`Home: Ignoring driveFileListResponse for folder ${message.folderId}. Current: ${currentFolderId}`);
            return false;
        }

        if (message.success && message.files) {
            driveFilesCache[message.folderId] = message.files;
            renderDriveViewerItems(message.files); 
            } else {
            showNotification(`Error fetching folder content: ${message.error || 'Unknown error.'}`, 'error');
            if (driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error loading content: ${message.error || 'Unknown'}</div>`;
        }
        return false; 
    }
    
    // Handle File Content Response
    else if (message.type === 'driveFileContentResponse') {
        // ... (Keep existing logic - unrelated to modal layout) ...
    }
    
    // Keep existing handlers for TEMP_SCRAPE_RESULT, response, error
    // ... (Keep existing logic) ...

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

// --- NEW: Drive Viewer Modal Logic --- 

function showDriveViewerModal() {
    if (!driveViewerModal) return;
    console.log("Home: Showing Drive Viewer modal.");
    driveViewerModal.classList.remove('hidden');
    isDriveViewerOpen = true;
    // Reset state on open
    currentFolderId = 'root';
    currentFolderPath = [{ id: 'root', name: 'Root' }];
    selectedDriveFiles = {}; 
    driveFilesCache = {};
    driveSearchTerm = '';
    if(driveViewerSearch) driveViewerSearch.value = '';
    updateInsertButtonState(); 
    renderSelectedFiles();
    // Trigger fetch for root folder content
    fetchAndDisplayViewerFolderContent('root'); 
}

function hideDriveViewerModal() {
    if (!driveViewerModal) return;
    console.log("Home: Hiding Drive Viewer modal.");
    driveViewerModal.classList.add('hidden');
    isDriveViewerOpen = false;
    if (driveViewerList) {
         driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`; // Reset list content on close
    }
}

// Fetch folder content (includes caching)
function fetchAndDisplayViewerFolderContent(folderId) {
    if (!driveViewerList || isFetchingDriveList) return;

    currentFolderId = folderId; 
    driveSearchTerm = ''; 
    if(driveViewerSearch) driveViewerSearch.value = '';
    console.log(`Home: Fetching content for Drive Viewer (Folder: ${folderId})`);
    isFetchingDriveList = true;
    driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`;
    updateHeaderState();
    updateBreadcrumbs();

    // Check cache first
    if (driveFilesCache[folderId]) {
         console.log(`Home: Using cached content for folder ${folderId}`);
         renderDriveViewerItems(driveFilesCache[folderId]);
         isFetchingDriveList = false;
         return;
    }

    // Request folder content from background if not cached
    chrome.runtime.sendMessage({ type: 'requestDriveFileList', folderId: folderId }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(`Home: Error sending requestDriveFileList (Viewer - ${folderId}):`, chrome.runtime.lastError.message);
            showNotification(`Error requesting folder content: ${chrome.runtime.lastError.message}`, 'error');
            if (driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error loading content.</div>`;
             isFetchingDriveList = false;
        } else if (response && response.success) {
            console.log(`Home: Background acknowledged requestDriveFileList for Viewer (${folderId}).`);
            // Wait for the driveFileListResponse message
        } else {
            const errorMsg = response?.error || 'Unknown error from background';
            console.error(`Home: Background reported error for requestDriveFileList (Viewer - ${folderId}):`, errorMsg);
            showNotification(`Error requesting folder content: ${errorMsg}`, 'error');
            if (driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-red-500 dark:text-gray-400 p-4">Error loading content.</div>`;
             isFetchingDriveList = false;
        }
    });
}

// Render folder items
function renderDriveViewerItems(items) {
    if (!driveViewerList) return;
    driveViewerList.innerHTML = ''; 

    const searchTermLower = driveSearchTerm.toLowerCase();
    const filteredItems = driveSearchTerm
        ? items.filter(item => item.name.toLowerCase().includes(searchTermLower))
        : items;

    if (!filteredItems || filteredItems.length === 0) {
        const msg = driveSearchTerm 
            ? `No items match "${driveSearchTerm}".` 
            : "Folder is empty.";
        driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">${msg}</div>`;
        return;
    }

    filteredItems.forEach(item => {
        const isFolder = item.mimeType === GOOGLE_FOLDER_MIME_TYPE;
        const itemElement = document.createElement('div');
        itemElement.className = 'drive-viewer-item'; 
        itemElement.dataset.id = item.id;
        itemElement.dataset.name = item.name;
        itemElement.dataset.mime = item.mimeType;

        // Add selected class if applicable (only for files)
        if (!isFolder && selectedDriveFiles[item.id]) {
            itemElement.classList.add('selected');
        }

        // Icon
        const iconElement = document.createElement('span');
        iconElement.className = 'drive-viewer-item-icon';
        if (item.iconLink) {
            const img = document.createElement('img');
            img.src = item.iconLink;
            img.alt = isFolder ? 'Folder' : 'File';
            img.className = 'w-5 h-5';
            img.onerror = () => { iconElement.innerHTML = getFallbackIcon(item.mimeType); };
            iconElement.appendChild(img);
        } else {
            iconElement.innerHTML = getFallbackIcon(item.mimeType);
        }

        // Name
        const nameElement = document.createElement('span');
        nameElement.className = 'flex-grow truncate';
        nameElement.textContent = item.name;
        nameElement.title = item.name;

        itemElement.appendChild(iconElement);
        itemElement.appendChild(nameElement);

        // Add click listener
        itemElement.addEventListener('click', handleDriveItemClick);

        driveViewerList.appendChild(itemElement);
    });
}

// Handle click on folder or file
function handleDriveItemClick(event) {
    const itemElement = event.currentTarget;
    const itemId = itemElement.dataset.id;
    const itemName = itemElement.dataset.name;
    const itemMime = itemElement.dataset.mime;

    if (!itemId || !itemName || !itemMime) return;

    if (itemMime === GOOGLE_FOLDER_MIME_TYPE) {
        // Navigate into folder
        console.log(`Home: Navigating into folder: ${itemName} (${itemId})`);
        currentFolderPath.push({ id: itemId, name: itemName });
        fetchAndDisplayViewerFolderContent(itemId);
        } else {
        // Toggle file selection
        toggleFileSelection(itemId, itemElement, { id: itemId, name: itemName, mimeType: itemMime });
    }
}

// Update breadcrumbs display
function updateBreadcrumbs() {
    if (!driveViewerBreadcrumbsContainer) return;
    driveViewerBreadcrumbsContainer.innerHTML = '';
    currentFolderPath.forEach((folder, index) => {
        const crumbElement = document.createElement(index === currentFolderPath.length - 1 ? 'span' : 'button');
        crumbElement.textContent = folder.name;
        crumbElement.dataset.id = folder.id;
        crumbElement.dataset.index = index; // Store index for navigation
        if (index < currentFolderPath.length - 1) {
            // Apply button styling and add listener for navigation
            crumbElement.className = 'text-blue-600 hover:underline dark:text-blue-400 cursor-pointer'; // Consider CSS variables
            crumbElement.addEventListener('click', handleBreadcrumbClick);
            const separator = document.createElement('span');
            separator.textContent = ' / ';
            separator.className = 'mx-1 text-gray-400';
            driveViewerBreadcrumbsContainer.appendChild(crumbElement);
            driveViewerBreadcrumbsContainer.appendChild(separator);
        } else {
            // Last element is just text (current folder)
            crumbElement.className = 'font-semibold';
            driveViewerBreadcrumbsContainer.appendChild(crumbElement);
        }
    });
}

// Handle clicks on breadcrumb links
function handleBreadcrumbClick(event) {
    const targetIndex = parseInt(event.currentTarget.dataset.index, 10);
    const targetFolderId = event.currentTarget.dataset.id;

    if (isNaN(targetIndex) || !targetFolderId) return;

    console.log(`Home: Breadcrumb click - Navigating to index ${targetIndex} (${targetFolderId})`);
    // Slice the path array up to and including the clicked index
    currentFolderPath = currentFolderPath.slice(0, targetIndex + 1);
    fetchAndDisplayViewerFolderContent(targetFolderId);
}

// Toggle file selection state and UI
function toggleFileSelection(fileId, element, fileData) {
    if (selectedDriveFiles[fileId]) {
        delete selectedDriveFiles[fileId];
        element?.classList.remove('selected');
             } else {
        selectedDriveFiles[fileId] = fileData; 
        element?.classList.add('selected');
    }
    renderSelectedFiles();
    updateInsertButtonState();
}

// Render the selected file pills
function renderSelectedFiles() {
     if (!driveViewerSelectedArea) return;

     const selectedIds = Object.keys(selectedDriveFiles);
     const pillContainer = driveViewerSelectedArea.querySelector('.flex-wrap') || driveViewerSelectedArea;
     pillContainer.innerHTML = ''; // Clear previous pills

     if (selectedIds.length === 0) {
         // Optionally hide the area or show a placeholder text
     } else {
         selectedIds.forEach(id => {
             const file = selectedDriveFiles[id];
             const pill = document.createElement('span');
             pill.className = 'selected-file-item';
             pill.textContent = file.name;
             const removeBtn = document.createElement('button');
             removeBtn.className = 'selected-file-remove';
             removeBtn.textContent = '×'; // Use times symbol
             removeBtn.title = `Remove ${file.name}`;
             removeBtn.dataset.id = id;
             removeBtn.addEventListener('click', handleRemoveSelectedFile);
             pill.appendChild(removeBtn);
             pillContainer.appendChild(pill);
         });
     }
}

// Handle removing a selected file via its pill
function handleRemoveSelectedFile(event) {
    const fileId = event.currentTarget.dataset.id;
    if (fileId && selectedDriveFiles[fileId]) {
        // Find the corresponding item in the main list to deselect visually
        const mainListItem = driveViewerList?.querySelector(`.drive-viewer-item[data-id="${fileId}"]`);
        // Call toggleFileSelection to update state and UI
        toggleFileSelection(fileId, mainListItem, null);
    }
}

// Update the Insert button state (enabled/disabled, count)
function updateInsertButtonState() {
     if (!driveViewerInsert) return;
     const count = Object.keys(selectedDriveFiles).length;
     driveViewerInsert.disabled = count === 0;
     driveViewerInsert.textContent = `Insert (${count})`;
}

// Search Handler (debounced)
const handleDriveSearchInput = debounce((event) => {
    driveSearchTerm = event.target.value.trim();
    console.log(`Home: Filtering Drive items by term: "${driveSearchTerm}"`);
    if (driveFilesCache[currentFolderId]) {
        renderDriveViewerItems(driveFilesCache[currentFolderId]);
    } else {
        console.warn(`Home: Search triggered but folder ${currentFolderId} not in cache.`);
        if(driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Folder not cached for search.</div>`;
    }
}, 300); 

// Back button handler
function handleDriveBackButtonClick() {
    if (currentFolderPath.length <= 1) return; // Already at root

    // Remove the last folder from the path to get the parent
    const parentFolder = currentFolderPath[currentFolderPath.length - 2]; 
    // Update the path state *before* fetching
    currentFolderPath.pop(); 
    console.log(`Home: Back button click - Navigating to ${parentFolder.name} (${parentFolder.id})`);
    fetchAndDisplayViewerFolderContent(parentFolder.id);
}

// Update Header State (Back button visibility)
function updateHeaderState() {
    if (!driveViewerBack) return;
    if (currentFolderPath.length > 1) {
        driveViewerBack.classList.remove('hidden');
    } else {
        driveViewerBack.classList.add('hidden');
    }
}

// Generate fallback icon SVG based on mime type
function getFallbackIcon(mimeType) {
    // Simple fallback logic
     if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
         return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>';
     } // TODO: Add more specific mime types (Docs, Sheets, Slides, PDF, Image etc.)
     // Default file icon
     return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>';
}

// Export functions needed by sidepanel.js
export { initializeHomePage, loadAndRenderChat, resetAndShowWelcomeMessage }; 