import { dbInitializationPromise,  loadAllChatHistory, createChatSession, addMessageToChat, updateMessageInChat, getChatSessionById, generateMessageId, deleteMessageFromChat } from './db.js';
import { getActiveChatSessionId } from './sidepanel.js'; 
import { showNotification } from './notifications.js'; 

let queryInput, sendButton, chatBody, attachButton, fileInput; 
let driveButton; 
let driveViewerModal, driveViewerClose, driveViewerList, driveViewerCancel, driveViewerInsert, driveViewerSearch, driveViewerSelectedArea, driveViewerBreadcrumbsContainer, driveViewerBack; // Keep selections
let onSessionCreatedCallback = null; 
let isSendingMessage = false;
let currentContextTabId = null; 
let isFetchingDriveList = false;
let driveSearchTerm = ''; 


// --- Constants --- 
// Please place your API Key from Google Cloud Console here
const GOOGLE_API_KEY = 'AIzaSyBIEk7rhZdvDXj7HFWKtp4rwSpZD5q8wEc'; 
// Derive App ID from Client ID (remove .apps.googleusercontent.com)
const GOOGLE_CLIENT_ID = '1054233721282-tvskc3gdni8v4h2u1k2767a9ngbf4ong.apps.googleusercontent.com';
const GOOGLE_APP_ID = GOOGLE_CLIENT_ID.split('-')[0];
const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

// --- Global Variables ---

let oauthToken = null; // Store the token after successful auth

const OFFSCRIPT_PATH = 'offscreen.html';

// --- Utility Functions --- 
function showError(message) {

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

async function renderChatSession(sessionId) {
    if (!chatBody) return;
    console.log(`Home: Rendering chat session ID: ${sessionId}`);
    chatBody.innerHTML = ''; 

    if (!sessionId) {
       
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
             if (isScrolledToBottom || true) { 
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
    bubbleDiv.classList.add('rounded-lg', 'break-words', 'relative', 'group'); 
   
    bubbleDiv.classList.add('max-w-4xl'); // <<< INCREASED MAX WIDTH

    // --- Copy Button Container ---
    const copyButtonContainer = document.createElement('div');
    copyButtonContainer.className = 'copy-button-container absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity';
    const copyButton = document.createElement('button');
    copyButton.innerHTML = `<svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
    copyButton.className = 'copy-button p-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    copyButton.title = 'Copy text';
    copyButton.onclick = (e) => {
        e.stopPropagation(); 
        let textToCopy = '';
      
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


    let codeElement = null; 

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
            
            // JSON view --- 
            const stageContentContainer = document.createElement('div');
            stageContentContainer.classList.add('overflow-y-auto', 'max-h-64', 'mt-1'); 
            
            const preElement = document.createElement('pre');

            preElement.classList.add('bg-gray-800', 'rounded', 'p-2');           
  
            codeElement = document.createElement('code');
            codeElement.className = 'language-json'; 
                       
            const dataToShow = {
                 title: msg.metadata.title || 'N/A',
                 segments: msg.metadata.segments,
                 links: msg.metadata.links 
            };
            codeElement.textContent = JSON.stringify(dataToShow, null, 2);
            
            preElement.appendChild(codeElement); 
            stageContentContainer.appendChild(preElement); 
            bubbleDiv.appendChild(stageContentContainer);


        } else {
            bubbleDiv.classList.add('bg-red-100', 'dark:bg-red-900');
            stageHeaderDiv.classList.add('text-red-700', 'dark:text-red-300');
            stageHeaderDiv.textContent = `[Stage ${msg.metadata.stage} - Failed] Error: ${msg.metadata.error || 'Unknown'}`;
            bubbleDiv.appendChild(stageHeaderDiv);
        }

    } else {
        // --- Normal Message Rendering --- 
        bubbleDiv.classList.add('p-2'); 
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


    if (codeElement && window.Prism) {
        try {
            Prism.highlightElement(codeElement);
        } catch (e) {
            console.error("Prism highlighting failed:", e);
        }
    }

};


const displayWelcomeMessage = () => {
    if (!chatBody) return;
    chatBody.innerHTML = ''; 

    const welcomeMsg = {
        messageId: 'welcome-msg',
        sender: 'ai',
        text: 'Welcome to Tab Agent! Ask me anything or paste a URL to scrape.',
        timestamp: Date.now(),
        isLoading: false
    };
    displayMessage(welcomeMsg);

    if (queryInput) queryInput.disabled = false;
    if (sendButton) sendButton.disabled = true; 
    adjustTextareaHeight();
};


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


async function handleUrlScrapeRequest(url, currentTabId) { 
    let sessionId = getActiveChatSessionId(); 
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

            console.log("Home: No active session, creating new one for URL message.");
            sessionId = await createChatSession(userMessage);

            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            } else {
                console.error("Home: onSessionCreatedCallback is not defined in handleUrlScrapeRequest!");
            }

            await renderChatSession(sessionId); 
            userMessageId = sessionId ? (await getChatSessionById(sessionId))?.messages[0]?.messageId : null; 
        } else {
            userMessageId = await addMessageToChat(sessionId, userMessage);
            await renderChatSession(sessionId); 
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
        queryInput.disabled = true; 
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


    } catch (error) {
        console.error("Home: Error processing URL scrape request:", error);
        showError(`Error saving/starting scrape: ${error.message}`);

        if(placeholderMessageId && sessionId){
        
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


function getActiveTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            if (tabs && tabs.length > 0) {
                resolve(tabs[0]);
            } else {               
                resolve(null);
            }
        });
    });
}


const handleSendMessage = async (currentTabId) => {
    if (isSendingMessage) { 
        console.log("Home: Already sending message, preventing double execution.");
        return;
    }
    isSendingMessage = true; 

    const messageText = queryInput.value.trim();
    if (!messageText || queryInput.disabled) {
        isSendingMessage = false; 
        return; 
    }

    let sessionId = getActiveChatSessionId(); 
    let userMessageId = null;
    let placeholderMessageId = null;

    console.log(`Home: Sending message. Text: "${messageText}". Active Session: ${sessionId}`);

    const isURL = URL_REGEX.test(messageText);


    if (isURL) {
        try {
            const activeTab = await getActiveTab();
            const activeTabUrl = activeTab ? activeTab.url : null;
            const normalizeUrl = (url) => url ? url.replace(/\/$/, '') : null;
            const inputUrlNormalized = normalizeUrl(messageText);
            const activeTabUrlNormalized = normalizeUrl(activeTabUrl);

            if (activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized) {
           
                console.log("URL matches active tab. Sending SCRAPE_ACTIVE_TAB to content script.");

                // 1. Save User Message
                const userMessage = { sender: 'user', text: messageText, timestamp: Date.now(), isLoading: false };
                 if (!sessionId) {
                     sessionId = await createChatSession(userMessage);

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

                    let updatePayload = { 
                        isLoading: false,
                        sender: 'ai' 
                    };
                    let success = false;

                    if (chrome.runtime.lastError) {
                        console.error('Error sending/receiving SCRAPE_ACTIVE_TAB:', chrome.runtime.lastError.message);
                        updatePayload.sender = 'error';
                        updatePayload.text = `Error scraping active tab: ${chrome.runtime.lastError.message}`;
                    } else if (response?.success) {
                        console.log('Received successful scrape from active tab:', response);

                        updatePayload.text = response.textContent || response.excerpt || 'No text content found.'; 

                        updatePayload.metadata = {
                            type: 'scrape_result',
                            method: 'contentScript', 
                            url: inputUrlNormalized,
                            title: response.title || inputUrlNormalized
                            
                        };
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
                       await renderChatSession(sessionId); 
                    } catch (dbError) {
                       console.error("Home: DB Error updating content script scrape result:", dbError);
                       showError("Failed to save scrape result.");
                    }

                    // 6. Re-enable input
                    queryInput.disabled = false;
                    adjustTextareaHeight(); 
                    queryInput.focus();
                    isSendingMessage = false; 
                });

            } else {
               
                console.log("URL does not match active tab. Using background scrape.");
                handleUrlScrapeRequest(messageText, currentTabId); 
                
            }
        } catch (error) {
            console.error("Error checking active tab or processing URL:", error);
            showError(`Error processing URL: ${error.message}`);
            queryInput.disabled = false;
            adjustTextareaHeight();
            isSendingMessage = false; 
        } 
        return; 
    }

    try {

        const userMessage = { sender: 'user', text: messageText, timestamp: Date.now(), isLoading: false };
        if (!sessionId) {
            sessionId = await createChatSession(userMessage);

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
            tabId: currentTabId, 
            text: messageText,
            model: document.getElementById('model-selector')?.value || 'default',
            chatId: sessionId,
            messageId: placeholderMessageId 

        };

        console.log('Home: Sending query to background:', messagePayload);
        chrome.runtime.sendMessage(messagePayload, (response) => {

            if (chrome.runtime.lastError) {
                console.error('Home: Error sending query:', chrome.runtime.lastError.message);

                 updateMessageInChat(sessionId, placeholderMessageId, {
                     isLoading: false,
                     sender: 'error',
                     text: `Error: Could not connect. ${chrome.runtime.lastError.message}`
                 }).then(() => {
                    if (sessionId === getActiveChatSessionId()) renderChatSession(sessionId);
                 });

                 queryInput.disabled = false;
                 adjustTextareaHeight();
                 isSendingMessage = false; 
            } else {
                console.log('Home: Query message sent successfully.', response);
                 
            }
        });

    } catch (error) {
        console.error("Home: Error processing chat query:", error);
        showError(`Error sending message: ${error.message}`);
        queryInput.disabled = false;
        adjustTextareaHeight();
        isSendingMessage = false; 
    }
};


async function handleFileSelected(event) {
    if (!event.target.files || event.target.files.length === 0) {
        console.log("No file selected.");
        return;
    }

    const file = event.target.files[0];
    console.log(`File selected: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);


    let sessionId = getActiveChatSessionId();
    if (!sessionId) {

        showError("Please start a chat before attaching a file.");
         if(fileInput) fileInput.value = '';
        return; 
    }

    const fileMessage = {
        sender: 'system', 
        text: `📎 Attached file: ${file.name}`, 
        timestamp: Date.now(),
        isLoading: false 
    };

    try {
        await addMessageToChat(sessionId, fileMessage);
        await renderChatSession(sessionId); 
    } catch (error) {
         console.error("Error adding file attachment message to chat:", error);
         showError("Failed to add file attachment message.");
    }

    if(fileInput) fileInput.value = ''; 
}


function initializeHomePage(tabId, onSessionCreated) { 
    console.log(`[HomeInit] Initializing Home Page elements and listeners. Context TabID: ${tabId}`);
    currentContextTabId = tabId;

    if (!onSessionCreatedCallback && typeof onSessionCreated === 'function') {
        console.log("[HomeInit] Storing onSessionCreatedCallback.");
        onSessionCreatedCallback = onSessionCreated; 
    } else if (typeof onSessionCreated !== 'function' && !onSessionCreatedCallback) {
         console.warn("[HomeInit] onSessionCreated callback was not provided or already set.");
    }

    queryInput = document.getElementById('query-input');
    sendButton = document.getElementById('send-button');
    chatBody = document.getElementById('chat-body');
    attachButton = document.getElementById('attach-button'); 
    fileInput = document.getElementById('file-input');   

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

    queryInput?.removeEventListener('input', adjustTextareaHeight); 
    queryInput?.addEventListener('input', adjustTextareaHeight);
    
    queryInput?.removeEventListener('keydown', handleEnterKey);
    queryInput?.addEventListener('keydown', handleEnterKey); 
    
    sendButton?.removeEventListener('click', handleSendButtonClick);
    sendButton?.addEventListener('click', handleSendButtonClick); 


    if (attachButton && fileInput) {

        attachButton.removeEventListener('click', handleAttachClick);
        attachButton.addEventListener('click', handleAttachClick);

        fileInput.removeEventListener('change', handleFileSelected);
        fileInput.addEventListener('change', handleFileSelected);
    } else {
        console.warn("Attach button or file input element not found.");
    }

    console.log("Home Page Elements & Listeners Initialized." + Date.now()); // Simplified log
}


function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage(currentContextTabId);
    }
}

function handleSendButtonClick() {
    handleSendMessage(currentContextTabId);
}


function handleAttachClick() {
    if (fileInput) {
        fileInput.click(); 
    }
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("Home: Received message:", message, "from sender:", sender);

   
    if (message.type === 'query') {
       
    }
  
    else if (message.type === 'getTabId') {
        
    }
   
    else if (message.type === 'popupCreated') {
        
    }
   
    else if (message.type === 'getPopupForTab') {
        // ... get popup logic ...
    }  
    else if (message.type === 'response' && message.chatId && message.messageId) {
      
        const { chatId, messageId, text } = message;
        console.log(`Home: Received 'response' for chat ${chatId}, message ${messageId}`);

        const updatePayload = {
            isLoading: false,
            sender: 'ai', 
            text: text || 'Received empty response.' 
        };

        (async () => {
            try {
                await updateMessageInChat(chatId, messageId, updatePayload);
                console.log(`Home: Updated message ${messageId} in chat ${chatId} with AI response.`);
            
                if (chatId === getActiveChatSessionId()) {
                    await renderChatSession(chatId);
                  
                    if (queryInput) {
                        queryInput.disabled = false;
                        adjustTextareaHeight();
                        queryInput.focus();
                    }
                    if (sendButton) {
                         sendButton.disabled = queryInput.value.trim() === '';
                    }
                }
              
                console.log("Home: Resetting isSendingMessage after processing 'response' message.");
                isSendingMessage = false;

            } catch (dbError) {
                console.error(`Home: DB Error updating message ${messageId} for 'response' type:`, dbError);
                showError("Failed to update chat with response.");              
                console.log("Home: Resetting isSendingMessage after DB error on 'response' message.");
                isSendingMessage = false;
               
                 if (queryInput && chatId === getActiveChatSessionId()) {
                     queryInput.disabled = false; 
                     adjustTextareaHeight();
                 }
            }
        })();
      
    }
   
    else if (message.type === 'error' && message.chatId && message.messageId) {
        // ... AI error handling ...
    }
   
    else if (message.type === 'STAGE_SCRAPE_RESULT' && message.payload) {
        const { stage, success, chatId, messageId: originalPlaceholderId, error, ...resultData } = message.payload;
        console.log(`Home: Received STAGE_SCRAPE_RESULT for Stage ${stage}, chatId: ${chatId}, placeholderId: ${originalPlaceholderId}`);

       
        const stageResultMessage = {
            messageId: generateMessageId(chatId),
            sender: 'system',
            timestamp: Date.now(),
            isLoading: false,
            metadata: { 
                 type: 'scrape_stage_result',
                 stage: stage,
                 originalPlaceholderId: originalPlaceholderId,
                 success: success 
            }
        };

        if (success) {
            
            stageResultMessage.text = `Stage ${stage} Success (See JSON)`; 
            stageResultMessage.metadata.title = resultData.title || resultData.url || 'Unknown Title';
            stageResultMessage.metadata.length = resultData.text?.length || 0; 
            stageResultMessage.metadata.method = resultData.method;           
            stageResultMessage.metadata.segments = resultData.segments || []; 
            stageResultMessage.metadata.links = resultData.links || []; 
            stageResultMessage.metadata.images = resultData.images || [];     
            stageResultMessage.metadata.videos = resultData.videos || [];
            stageResultMessage.metadata.tables = resultData.tables || [];
            stageResultMessage.metadata.url = resultData.url || undefined; 
            stageResultMessage.metadata.extractedAt = resultData.extractedAt || undefined;
            stageResultMessage.metadata.wordCount = resultData.wordCount || undefined;
            stageResultMessage.metadata.readingTime = resultData.readingTime || undefined;
            stageResultMessage.metadata.author = resultData.author || undefined;
            stageResultMessage.metadata.publishDate = resultData.publishDate || undefined;
            stageResultMessage.metadata.metaDescription = resultData.metaDescription || undefined;
            stageResultMessage.metadata.language = resultData.language || undefined;
            stageResultMessage.metadata.keywords = resultData.keywords || []; 
            stageResultMessage.metadata.categories = resultData.categories || []; 
         
           
        } else {
          
            stageResultMessage.sender = 'error';
            stageResultMessage.text = `Stage ${stage} Failed: ${error || 'Unknown error.'}`;
            stageResultMessage.metadata.error = error || 'Unknown error.';
        }

       
        (async () => { 
            try {
                if (stage === 1) { // Note: Stage 1 is removed, this might need adjustment if stage numbers change
                    const placeholderUpdate = { text: 'Scraping stages running...' };
                    await updateMessageInChat(chatId, originalPlaceholderId, placeholderUpdate);
                    console.log(`Home: Updated placeholder ${originalPlaceholderId} text.`);
                }
                
                await addMessageToChat(chatId, stageResultMessage);
                console.log(`Home: Added stage ${stage} result message to DB for chat ${chatId}.`);
                

                // --- MODIFIED: Run cleanup if any stage succeeded OR if it's the last stage (Stage 4) ---
                if (success || stage === 4) { 
                    console.log(`Home: Cleaning up after Stage ${stage} (Success: ${success}). Deleting placeholder ${originalPlaceholderId}.`);
                    try {
                        await deleteMessageFromChat(chatId, originalPlaceholderId);
                    } catch (deleteError) {
                         // Log deletion error but continue UI cleanup
                         console.error(`Home: Failed to delete placeholder ${originalPlaceholderId}, continuing cleanup.`, deleteError);
                    }

                    console.log(`Home: Resetting isSendingMessage and re-enabling UI after Stage ${stage}.`);
                    isSendingMessage = false; 
                     if (queryInput && chatId === getActiveChatSessionId()) {
                         queryInput.disabled = false;
                         adjustTextareaHeight();
                         queryInput.focus();
                     }
                }
                // --- END MODIFICATION ---
                
                if (chatId === getActiveChatSessionId()) {
                    await renderChatSession(chatId);
                }
                
            } catch (dbError) {
                console.error(`Home: DB Error handling STAGE_SCRAPE_RESULT (Stage ${stage}):`, dbError);
                showError(`Failed to record result for Stage ${stage}.`);
                 // --- MODIFIED: Also reset UI on DB error during the *final* stage or on success ---
                 if (success || stage === 4) { 
                     console.log(`Home: Resetting isSendingMessage after DB error during final stage/success (Stage ${stage}).`);
                     isSendingMessage = false; 
                     if (queryInput && chatId === getActiveChatSessionId()) {
                         queryInput.disabled = false;
                         adjustTextareaHeight();
                     }
                 }
            }
        })();

        return false; 
    }   
    else {
        console.log("Home: Received message not handled by primary handlers:", message.type);
        return false;
    }
});


async function loadAndRenderChat(sessionId) {
    console.log(`Home: loadAndRenderChat called for session ID: ${sessionId}`);
    if (!queryInput) {
        console.warn("Home: Cannot load chat, UI elements not ready.");
        return; 
    }

    await renderChatSession(sessionId);

    queryInput.disabled = false;
    adjustTextareaHeight();
    queryInput.focus();
}


function resetAndShowWelcomeMessage() {
    console.log("Home: Resetting UI to welcome state.");
    displayWelcomeMessage();
    if(queryInput) queryInput.value = '';
    adjustTextareaHeight();
    if(queryInput) queryInput.focus();
}

export { initializeHomePage, loadAndRenderChat, resetAndShowWelcomeMessage }; 
