import { showNotification } from '../notifications.js';
import { showError } from '../Utilities/generalUtils.js';
import { eventBus } from '../eventBus.js';
import { 
    DbMessagesUpdatedNotification, 
    DbSessionUpdatedNotification, 
    DbGetSessionRequest
} from '../events/dbEvents.js';

let chatBodyElement = null;
let currentSessionId = null;
let requestDbAndWaitFunc = null;
let observer = null; // MutationObserver
const TEMP_MESSAGE_CLASS = 'temp-status-message'; // Class for temporary messages

export function initializeRenderer(chatBody, requestDbFunc) {
    if (!chatBody) {
        console.error("[ChatRenderer] chatBody element is required for initialization.");
        return;
    }
    if (!requestDbFunc) {
        console.error("[ChatRenderer] requestDbAndWait function is required for initialization.");
        return;
    }
    chatBodyElement = chatBody;
    requestDbAndWaitFunc = requestDbFunc;
    console.log("[ChatRenderer] Initialized with chat body element and DB request function.");
    eventBus.subscribe(DbMessagesUpdatedNotification.name, handleMessagesUpdate);
    console.log("[ChatRenderer] Subscribed to DbMessagesUpdatedNotification.");
    eventBus.subscribe(DbSessionUpdatedNotification.name, handleSessionMetadataUpdate);
    console.log("[ChatRenderer] Subscribed to DbSessionUpdatedNotification.");

    // Initialize MutationObserver to apply syntax highlighting
    initializeObserver();
}

export function setActiveSessionId(sessionId) {
    console.log(`[ChatRenderer] Setting active session ID to: ${sessionId}`);
    currentSessionId = sessionId;
    if (chatBodyElement) {
        chatBodyElement.innerHTML = '';
    }
    if (!sessionId) {
        displayWelcomeMessage();
    } else {
        console.log(`[ChatRenderer] Proactively loading messages for new session: ${sessionId}`);
        loadAndRenderMessages(sessionId);
    }
}

export function displayWelcomeMessage() {
    if (!chatBodyElement) return;
    chatBodyElement.innerHTML = '';
    const welcomeMsg = {
        messageId: 'welcome-msg',
        sender: 'system',
        text: 'Welcome to Tab Agent! Ask me anything or paste a URL to scrape.',
        timestamp: Date.now(),
        isLoading: false
    };
    renderSingleMessage(welcomeMsg);
}

export function scrollToBottom() {
    if (chatBodyElement) {
        requestAnimationFrame(() => {
             chatBodyElement.scrollTop = chatBodyElement.scrollHeight;
        });
    }
}

async function loadAndRenderMessages(sessionId) {
    if (!requestDbAndWaitFunc) {
        console.error("[ChatRenderer] Cannot load messages: requestDbAndWait function not available.");
        if (chatBodyElement) chatBodyElement.innerHTML = '<div class="p-4 text-red-500">Error: Cannot load chat messages.</div>';
        return;
    }
    if (!sessionId) {
        console.warn("[ChatRenderer] loadAndRenderMessages called with null sessionId. Displaying welcome.");
        displayWelcomeMessage();
        return;
    }

    console.log(`[ChatRenderer] Requesting messages for session ${sessionId}...`);
    try {
        const request = new DbGetSessionRequest(sessionId);
        const sessionData = await requestDbAndWaitFunc(request);

        if (sessionData && sessionData.messages) {
            console.log(`[ChatRenderer] Received ${sessionData.messages.length} messages for ${sessionId}. Rendering.`);
            if (chatBodyElement) chatBodyElement.innerHTML = '';
            if (sessionData.messages.length === 0) {
                displayWelcomeMessage();
            } else {
                sessionData.messages.forEach(msg => renderSingleMessage(msg));
                scrollToBottom();
            }
        } else {
            console.warn(`[ChatRenderer] No messages found in session data for ${sessionId}. Displaying welcome.`, sessionData);
            displayWelcomeMessage();
        }
    } catch (error) {
        console.error(`[ChatRenderer] Failed to load messages for session ${sessionId}:`, error);
        showError(`Failed to load chat: ${error.message}`);
        if (chatBodyElement) chatBodyElement.innerHTML = `<div class="p-4 text-red-500">Failed to load chat: ${error.message}</div>`;
    }
}

function handleMessagesUpdate(notification) {
    if (!notification || !notification.sessionId || !notification.payload) return;
    
    if (notification.sessionId === currentSessionId) {
        console.log(`[ChatRenderer] Received message update notification for active session ${currentSessionId}. Rendering.`);
        
        let messages = notification.payload.messages;
        if (!Array.isArray(messages)) {
            if (Array.isArray(notification.payload)) {
                 console.warn('[ChatRenderer] Payload did not have .messages, using payload directly as array.');
                 messages = notification.payload;
            } else {
                 console.error(`[ChatRenderer] Invalid messages structure: Expected array, got:`, notification.payload);
                 return;
            }
        }

        console.log(`[ChatRenderer] Messages array received:`, JSON.stringify(messages));
        if (!chatBodyElement) return;
        chatBodyElement.innerHTML = '';
        if (messages.length === 0) {
            console.log(`[ChatRenderer] Active session ${currentSessionId} has no messages. Displaying welcome.`);
            displayWelcomeMessage();
        } else {
            messages.forEach(msg => renderSingleMessage(msg));
            scrollToBottom();
        }
    }
}

function handleSessionMetadataUpdate(notification) {
    if (!notification || !notification.sessionId || !notification.payload?.session) return;

    if (notification.sessionId === currentSessionId) {
        const updatedSessionData = notification.payload.session;
        console.log(`[ChatRenderer] Received metadata update for active session ${currentSessionId}. New Title: ${updatedSessionData.title}, Starred: ${updatedSessionData.isStarred}`);
        
        updateChatHeader(updatedSessionData);
    }
}

function updateChatHeader(sessionData) {
    if (!sessionData) {
        console.log('[ChatRenderer] Clearing chat header (no active session).');
    } else {
        console.log(`[ChatRenderer] Updating chat header for ${sessionData.id}. Title: ${sessionData.title}, Starred: ${sessionData.isStarred}`);
    }
}

function renderSingleMessage(msg) {
    if (!chatBodyElement) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'mb-2');
    messageDiv.id = msg.messageId || `msg-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('rounded-lg', 'break-words', 'relative', 'group', 'p-2', 'max-w-4xl');
    const copyButtonContainer = document.createElement('div');
    copyButtonContainer.className = 'copy-button-container absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity';
    const copyButton = document.createElement('button');
    copyButton.innerHTML = `<svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
    copyButton.className = 'copy-button p-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    copyButton.title = 'Copy text';
    copyButton.onclick = (e) => {
        e.stopPropagation();
        const contentElement = bubbleDiv.querySelector('pre code') || bubbleDiv.querySelector('.prose') || bubbleDiv;
        const textToCopy = contentElement?.textContent || '';
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
    if (msg.metadata?.type === 'scrape_result') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-200', 'dark:bg-gray-600');
        const headerDiv = document.createElement('div');
        headerDiv.classList.add('text-xs', 'font-semibold', 'mb-1', 'text-gray-700', 'dark:text-gray-300', 'pr-6');
        headerDiv.textContent = `Scraped (${msg.metadata.method || 'N/A'}): ${msg.metadata.title || msg.metadata.url || 'Content'}`;
        bubbleDiv.appendChild(headerDiv);
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('overflow-y-auto', 'max-h-64', 'text-sm', 'prose', 'prose-sm', 'dark:prose-invert', 'whitespace-pre-wrap', 'mt-1');
        contentDiv.textContent = msg.text || '';
        bubbleDiv.appendChild(contentDiv);
    } else if (msg.metadata?.type === 'scrape_stage_result') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('border', 'border-gray-300', 'dark:border-gray-600');
        const stageHeaderDiv = document.createElement('div');
        stageHeaderDiv.classList.add('text-xs', 'font-semibold', 'mb-1', 'pr-6');
        if (msg.metadata.success) {
            bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700');
            stageHeaderDiv.classList.add('text-gray-700', 'dark:text-gray-300');
            stageHeaderDiv.textContent = `[Stage ${msg.metadata.stage} - ${msg.metadata.method || '?'} - OK] Len: ${msg.metadata.length || 0}`;
            bubbleDiv.appendChild(stageHeaderDiv);
            const stageContentContainer = document.createElement('div');
            stageContentContainer.classList.add('overflow-y-auto', 'max-h-64', 'mt-1');
            const preElement = document.createElement('pre');
            preElement.classList.add('bg-gray-800', 'dark:bg-gray-900', 'rounded', 'p-2', 'text-xs');
            codeElement = document.createElement('code');
            codeElement.className = 'language-json';
            const dataToShow = {
                 title: msg.metadata.title || 'N/A',
                 links: msg.metadata.links,
            };
            codeElement.textContent = JSON.stringify(dataToShow, null, 2);
            preElement.appendChild(codeElement);
            stageContentContainer.appendChild(preElement);
            bubbleDiv.appendChild(stageContentContainer);
        } else {
            bubbleDiv.classList.add('bg-red-100', 'dark:bg-red-900');
            stageHeaderDiv.classList.add('text-red-700', 'dark:text-red-300');
            stageHeaderDiv.textContent = `[Stage ${msg.metadata.stage} - Failed] ${msg.metadata.error || 'Unknown'}`;
            bubbleDiv.appendChild(stageHeaderDiv);
        }
    } else if (msg.metadata?.type === 'scrape_result_full') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'border', 'border-gray-300', 'dark:border-gray-600');
        const headerDiv = document.createElement('div');
        headerDiv.classList.add('text-xs', 'font-semibold', 'mb-1', 'text-gray-700', 'dark:text-gray-300', 'pr-6');
        headerDiv.textContent = `Full Scrape Result: ${msg.metadata.scrapeData?.title || 'No Title'}`;
        bubbleDiv.appendChild(headerDiv);
        const jsonContainer = document.createElement('div');
        jsonContainer.classList.add('overflow-y-auto', 'max-h-96', 'mt-1');
        const preElement = document.createElement('pre');
        preElement.classList.add('bg-gray-800', 'dark:bg-gray-900', 'rounded', 'p-2', 'text-xs');
        codeElement = document.createElement('code');
        codeElement.className = 'language-json';
        try {
            codeElement.textContent = JSON.stringify(msg.metadata.scrapeData || { error: "No scrape data found" }, null, 2);
        } catch (e) {
            console.error("Error stringifying scrapeData:", e);
            codeElement.textContent = JSON.stringify({ error: "Failed to stringify scrape data", details: e.message }, null, 2);
        }
        preElement.appendChild(codeElement);
        jsonContainer.appendChild(preElement);
        bubbleDiv.appendChild(jsonContainer);
    } else {
        bubbleDiv.textContent = msg.text || '';
        if (msg.isLoading) {
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'italic');
        } else if (msg.sender === 'user') {
            messageDiv.classList.add('justify-end');
            bubbleDiv.classList.add('bg-blue-500/20', 'dark:bg-blue-600/40', 'text-gray-900', 'dark:text-gray-100');
        } else if (msg.sender === 'error') {
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-red-100', 'dark:bg-red-900', 'text-red-700', 'dark:text-red-300');
        } else {
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100');
        }
    }
    messageDiv.appendChild(bubbleDiv);
    chatBodyElement.appendChild(messageDiv);
    if (codeElement && window.Prism) {
        try {
            Prism.highlightElement(codeElement);
        } catch (e) {
            console.warn("Prism highlighting failed:", e);
        }
    }
}

// --- NEW: Functions for Temporary Messages ---

/**
 * Renders a temporary status message directly to the chat body.
 * These messages are not saved to the database.
 * @param {string} type - 'system', 'success', or 'error'
 * @param {string} text - The message content.
 */
export function renderTemporaryMessage(type, text) {
    if (!chatBodyElement) return;

    // Only log non-system temporary messages to reduce noise
    if (type !== 'system') {
        console.log(`[ChatRenderer] Rendering temporary message (${type}): ${text}`);
    }
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `message-${type}`, TEMP_MESSAGE_CLASS);

    // Basic styling (can be enhanced in CSS)
    messageDiv.style.padding = '8px 12px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.maxWidth = '90%';
    messageDiv.style.alignSelf = 'center'; // Center align system/error messages
    messageDiv.style.backgroundColor = type === 'error' ? '#fee2e2' : (type === 'success' ? '#dcfce7' : '#f3f4f6'); // Example colors
    messageDiv.style.color = type === 'error' ? '#b91c1c' : (type === 'success' ? '#166534' : '#374151'); // Example colors

    // Handle dark mode styling (basic example)
    if (document.documentElement.classList.contains('dark')) {
        messageDiv.style.backgroundColor = type === 'error' ? '#450a0a' : (type === 'success' ? '#14532d' : '#374151');
        messageDiv.style.color = type === 'error' ? '#fca5a5' : (type === 'success' ? '#bbf7d0' : '#d1d5db');
    }

    messageDiv.textContent = text;

    chatBodyElement.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Removes all temporary status messages from the chat body.
 */
export function clearTemporaryMessages() {
    if (!chatBodyElement) return;
    console.log("[ChatRenderer] Clearing temporary status messages.");
    const tempMessages = chatBodyElement.querySelectorAll(`.${TEMP_MESSAGE_CLASS}`);
    tempMessages.forEach(msg => msg.remove());
}

// --- END: Temporary Message Functions ---

function initializeObserver() {
    if (observer) observer.disconnect(); // Disconnect previous observer if any

    observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'PRE') {
                        const codeElement = node.querySelector('code[class*="language-"]');
                        if (codeElement) {
                            if (window.Prism) Prism.highlightElement(codeElement);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // Also check nodes added within existing messages (e.g., streaming)
                        const codeBlocks = node.querySelectorAll('pre code[class*="language-"]');
                        codeBlocks.forEach(codeElement => {
                            // Check if Prism has already highlighted it
                            if (!codeElement.classList.contains('prism-highlighted')) {
                                if (window.Prism) Prism.highlightElement(codeElement);
                                codeElement.classList.add('prism-highlighted'); // Mark as highlighted
                            }
                        });
                    }
                });
            }
        });
    });

    if (chatBodyElement) {
        observer.observe(chatBodyElement, { childList: true, subtree: true });
        console.log("[ChatRenderer] MutationObserver initialized and observing chat body.");
    } else {
        console.error("[ChatRenderer] Cannot initialize MutationObserver: chatBody is null.");
    }
}