import { showError } from '../Utilities/generalUtils';
import { 
    DbMessagesUpdatedNotification, 
    DbSessionUpdatedNotification, 
    DbGetSessionRequest
} from '../DB/dbEvents';
import { MessageSenderTypes } from '../events/eventNames';
import { dbChannel } from '../DB/idbSchema';
import browser from 'webextension-polyfill';

let chatBodyElement: HTMLElement | null = null;
let currentSessionId: string | null = null;
let requestDbAndWaitFunc: ((request: any) => Promise<any>) | null = null;
let observer: MutationObserver | null = null; // MutationObserver
const TEMP_MESSAGE_CLASS = 'temp-status-message'; // Class for temporary messages

function handleMessagesUpdate(notification: any) {
    console.log('[ChatRenderer handleMessagesUpdate] handleMessagesUpdate received notification:', JSON.parse(JSON.stringify(notification)));
    if (!notification || !notification.sessionId || !notification.payload) {
        console.warn('[ChatRenderer][DEBUG] handleMessagesUpdate: Invalid or incomplete notification received. Bailing out.', { notification });
        return;
    }
    
    if (notification.sessionId === currentSessionId) {
        console.log(`[ChatRenderer handleMessagesUpdate] Received message update notification for active session ${currentSessionId}. Rendering.`);
        
        let messages = notification.payload.messages;
        if (!Array.isArray(messages)) {
            console.error('[ChatRenderer handleMessagesUpdate] ERROR: notification.payload.messages is not an array! Got:', notification.payload);
            return;
        }
        
        console.log(`[ChatRenderer handleMessagesUpdate] Messages array received:`, JSON.stringify(messages));
        if (!chatBodyElement) return;
        chatBodyElement.innerHTML = '';
        if (messages.length === 0) {
            console.log(`[ChatRenderer handleMessagesUpdate] Active session ${currentSessionId} has no messages. Displaying welcome.`);
            displayWelcomeMessage();
        } else {
            messages.forEach((msg: any) => renderSingleMessage(msg));
            scrollToBottom();
        }
    }
}

function handleSessionMetadataUpdate(notification: any) {
    if (!notification || !notification.sessionId || !notification.payload?.session) return;

    if (notification.sessionId === currentSessionId) {
        const updatedSessionData = notification.payload.session;
        console.log(`[ChatRenderer] Received metadata update for active session ${currentSessionId}. New Title: ${updatedSessionData.title}, Starred: ${updatedSessionData.isStarred}`);
        
        updateChatHeader(updatedSessionData);
    }
}

document.addEventListener(DbMessagesUpdatedNotification.type, (e: Event) => {
    const customEvent = e as CustomEvent;
    handleMessagesUpdate(customEvent.detail);
});

document.addEventListener(DbSessionUpdatedNotification.type, (e: Event) => {
    const customEvent = e as CustomEvent;
    handleSessionMetadataUpdate(customEvent.detail);
});

dbChannel.onmessage = (event: MessageEvent) => {
    console.log('[ChatRenderer] dbChannel event received:', event.data);
    const message = event.data;
    const payloadKeys = message && message.payload ? Object.keys(message.payload) : [];
    const sessionId = message.sessionId || (message.payload && message.payload.session && message.payload.session.id) || 'N/A';
    console.log(`[ChatRenderer] dbChannel.onmessage: type=${message.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}]`);
    const type = message?.type;
    if (type === DbMessagesUpdatedNotification.type) {
        handleMessagesUpdate(message.payload);
    }
    if (type === DbSessionUpdatedNotification.type) {
        handleSessionMetadataUpdate(message.payload);
    }
};

// If browser.runtime.onMessage is used for notifications, add a similar log
if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
    browser.runtime.onMessage.addListener((message: any) => {
        const payloadKeys = message && message.payload ? Object.keys(message.payload) : [];
        const sessionId = message.sessionId || (message.payload && message.payload.session && message.payload.session.id) || 'N/A';
        console.log(`[ChatRenderer] browser.runtime.onMessage: type=${message.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}]`);
        const type = message?.type;
        if (type === DbMessagesUpdatedNotification.type) {
            handleMessagesUpdate(message.payload);
        }
        if (type === DbSessionUpdatedNotification.type) {
            handleSessionMetadataUpdate(message.payload);
        }
    });
}

export function initializeRenderer(chatBody: HTMLElement, requestDbFunc: (request: any) => Promise<any>) {
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
    initializeObserver();
}

export function setActiveSessionId(sessionId: string | null) {
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
            if (chatBodyElement) {
                chatBodyElement.scrollTop = chatBodyElement.scrollHeight;
            }
        });
    }
}

async function loadAndRenderMessages(sessionId: string | null) {
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
                sessionData.messages.forEach((msg: any) => renderSingleMessage(msg));
                scrollToBottom();
            }
        } else {
            console.warn(`[ChatRenderer] No messages found in session data for ${sessionId}. Displaying welcome.`, sessionData);
            displayWelcomeMessage();
        }
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        showError(`Failed to load chat: ${errMsg}`);
        if (chatBodyElement) chatBodyElement.innerHTML = `<div class="p-4 text-red-500">Failed to load chat: ${errMsg}</div>`;
    }
}

function updateChatHeader(sessionData: any) {
    if (!sessionData) {
        console.log('[ChatRenderer] Clearing chat header (no active session).');
    } else {
        console.log(`[ChatRenderer] Updating chat header for ${sessionData.id}. Title: ${sessionData.title}, Starred: ${sessionData.isStarred}`);
    }
}

function renderSingleMessage(msg: any) {
    if (!chatBodyElement) return;

    console.log('[ChatRenderer] renderSingleMessage: msg object:', JSON.parse(JSON.stringify(msg)));

    // Parse metadata for type detection
    let meta: any = {};
    try { meta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : (msg.metadata || {}); } catch {
        console.error('[ChatRenderer] Error parsing metadata for message:', msg.messageId);
    }
    const extraction = meta.extraction;
    const isPageExtractor = (meta.extractionType === 'PageExtractor') || (extraction && extraction.__type === 'PageExtractor');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'mb-2');
    messageDiv.id = msg.messageId || `msg-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('rounded-lg', 'break-words', 'relative', 'group', 'p-2', 'min-w-0');

    if (msg.sender !== MessageSenderTypes.USER) {
        bubbleDiv.classList.add('max-w-4xl');
    }

    // Actions container (copy/download) as before
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container absolute top-1 right-1 transition-opacity flex space-x-1 z-10';

    const copyButton = document.createElement('button');
    copyButton.innerHTML = '<img src="icons/copy.svg" alt="Copy" class="w-4 h-4">';
    copyButton.title = 'Copy message text';
    copyButton.onclick = () => {
        let textToCopy = msg.text;
        if (msg.metadata?.type === 'scrape_result_full' && msg.metadata.scrapeData) {
            textToCopy = JSON.stringify(msg.metadata.scrapeData, null, 2);
        }
        navigator.clipboard.writeText(textToCopy).then(() => {
            window.originalUITooltipController?.showTooltip(copyButton, 'Copied!');
        }).catch((err: any) => console.error('Failed to copy text: ', err));
    };
    actionsContainer.appendChild(copyButton);

    if (msg.metadata?.type === 'scrape_result_full' && msg.metadata.scrapeData) {
        const downloadButton = document.createElement('button');
        downloadButton.innerHTML = '<img src="icons/download.svg" alt="Download" class="w-4 h-4">';
        downloadButton.title = 'Download scrape data as JSON';
        downloadButton.onclick = () => {
            console.log('Download clicked for:', msg.metadata.scrapeData); // Placeholder
            window.originalUITooltipController?.showTooltip(downloadButton, 'Download (placeholder)');
        };
        actionsContainer.appendChild(downloadButton);
    }
    // IMPORTANT: Append actionsContainer AFTER main content is set, or ensure it's not overwritten.
    // For now, we will append it after other content elements are added to bubbleDiv.

    let contentToParse = msg.text || msg.content || '';
    let specialHeaderHTML = '';

    // --- Special handling for PageExtractor results ---
    if (isPageExtractor && extraction) {
        specialHeaderHTML = `<div class="scrape-header p-2 rounded-t-md bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 mb-1"><h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Scraped Page Extraction</h4><p class="text-xs text-gray-500 dark:text-gray-400 break-all">URL: ${extraction.url || 'N/A'}</p></div>`;
        contentToParse = '```json\n' + JSON.stringify(extraction, null, 2) + '\n```';
        console.log('[ChatRenderer] Rendering PageExtractor JSON:', contentToParse);
    } else if (msg.text) {
        console.log('[ChatRenderer] Preparing to parse regular message. Input to marked:', contentToParse);
    }

    console.log(`[ChatRenderer] Before style application: msg.sender = ${msg.sender}`);
    // Apply sender-specific alignment and base bubble styling
    if (msg.isLoading) {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'italic', 'border', 'border-gray-300', 'dark:border-gray-500');
    } else if (msg.sender === MessageSenderTypes.USER) {
        messageDiv.classList.add('justify-end', 'min-w-0');
        bubbleDiv.classList.add(
            'bg-[rgba(236,253,245,0.51)]', // very subtle green tint
            'dark:bg-[rgba(20,83,45,0.12)]', // subtle dark green tint for dark mode
            'text-green-900',
            'dark:text-green-100',
            'border',
            'border-green-100',
            'dark:border-green-900'
        );
    } else if (msg.sender === 'error') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add(
            'bg-[rgba(254,226,226,0.37)]', // subtle red tint (light)
            'dark:bg-[rgba(120,20,20,0.12)]', // subtle red tint (dark)
            'text-red-700',
            'dark:text-red-200',
            'border',
            'border-red-200',
            'dark:border-red-700'
        );
    } else if (msg.sender === 'system') { 
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add(
            'bg-[rgba(219,234,254,0.5)]', // subtle blue tint
            'dark:bg-[rgba(30,41,59,0.2)]', // subtle dark blue/gray for dark mode
            'text-blue-900',
            'dark:text-blue-100',
            'border',
            'border-blue-100',
            'dark:border-blue-900'
        );
    } else { // Default for 'ai' or other non-user/non-error/non-system senders
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100', 'border', 'border-gray-300', 'dark:border-gray-600');
    }
    console.log('[ChatRenderer] messageDiv classes:', messageDiv.className);
    console.log('[ChatRenderer] bubbleDiv classes:', bubbleDiv.className);

    // --- HEADER BAR WITH FOLDOUT AND ACTIONS ---
    const headerBar = document.createElement('div');
    headerBar.className = 'bubble-header flex items-center justify-between px-2 py-0.5 min-w-[300px] w-full bg-[rgba(200,200,200,0.18)] dark:bg-[rgba(50,50,50,0.28)] rounded-t-lg border-b border-gray-200 dark:border-gray-700 transition-all duration-150 group';
    headerBar.onmouseenter = () => headerBar.classList.add('bg-[rgba(200,200,200,0.28)]', 'dark:bg-[rgba(50,50,50,0.38)]');
    headerBar.onmouseleave = () => headerBar.classList.remove('bg-[rgba(200,200,200,0.28)]', 'dark:bg-[rgba(50,50,50,0.38)]');

    // Foldout button with SVG chevron
    const foldoutBtn = document.createElement('button');
    foldoutBtn.className = 'toggle-foldout mr-2 flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer';
    foldoutBtn.title = 'Expand/collapse message';
    foldoutBtn.innerHTML = `<svg class="chevron-icon transition-transform duration-150" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    headerBar.appendChild(foldoutBtn);

    // Actions container (already created above)
    actionsContainer.classList.add('ml-auto', 'flex', 'items-center', 'space-x-1');
    headerBar.appendChild(actionsContainer);

    // --- MAIN CONTENT (foldable) ---
    const mainContentDiv = document.createElement('div');
    mainContentDiv.className = 'message-main-content';

    if (window.marked && window.marked.parse) {
        try {
            const localRenderer = new window.marked.Renderer();

            const escapeHtmlEntities = (str: string): string => {
                if (typeof str !== 'string') return '';
                return str.replace(/[&<>"'/]/g, function (match: string): string {
                    return {
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#39;',
                        '/': '&#x2F;'
                    }[match] || '';
                });
            };

            // ONLY override the .code() method for now
            localRenderer.code = (tokenOrCode: any, languageInfoString: string, isEscaped: boolean) => {
                // Log what we receive
                console.log('[ChatRenderer Custom Code] Received arguments:', 
                    {
                        tokenOrCode_type: typeof tokenOrCode,
                        tokenOrCode_value: JSON.parse(JSON.stringify(tokenOrCode)), // Deep copy for logging
                        languageInfoString_type: typeof languageInfoString,
                        languageInfoString_value: languageInfoString,
                        isEscaped_value: isEscaped
                    }
                );

                let actualCodeString = '';
                let actualLanguageString = languageInfoString || '';
                // let actuallyEscaped = isEscaped; // Not directly used with hljs which expects raw code

                if (typeof tokenOrCode === 'object' && tokenOrCode !== null && typeof tokenOrCode.text === 'string') {
                    actualCodeString = tokenOrCode.text;
                    actualLanguageString = tokenOrCode.lang || actualLanguageString; 
                    // actuallyEscaped = typeof tokenOrCode.escaped === 'boolean' ? tokenOrCode.escaped : isEscaped;
                    console.log('[ChatRenderer Custom Code] Interpreted as token object. Using token.text and token.lang.');
                } else if (typeof tokenOrCode === 'string') {
                    actualCodeString = tokenOrCode;
                    console.log('[ChatRenderer Custom Code] Interpreted as direct code string.');
                } else {
                    console.warn('[ChatRenderer Custom Code] Received unexpected type for code argument:', tokenOrCode);
                    actualCodeString = '[Error: Unexpected code content type]';
                }
                
                // Initialize safeLanguage and langClass based on the *provided* language hint
                let languageHint = actualLanguageString.trim();
                let safeLanguage = escapeHtmlEntities(languageHint || 'plaintext');
                let langClass = `language-${safeLanguage}`;
                
                const copyIcon = '<img src="icons/copy.svg" alt="Copy code" class="w-4 h-4">'; 
                const downloadIcon = '<img src="icons/download.svg" alt="Download code" class="w-4 h-4">';
                
                const encodedCodeForAttr = encodeURIComponent(actualCodeString);
                
                let highlightedCodeForDisplay = '';
                if (window.hljs) {
                    // highlight expects raw, unescaped code.
                    // actualCodeString should be raw based on Marked default behavior without sanitize: true
                    if (actualLanguageString && window.hljs.getLanguage(actualLanguageString)) {
                        try {
                            highlightedCodeForDisplay = window.hljs.highlight(actualCodeString, { language: actualLanguageString, ignoreIllegals: true }).value;
                            console.log('[ChatRenderer Custom Code] Highlighted with specified language:', actualLanguageString);
                        } catch (e) {
                            console.error('[ChatRenderer Custom Code] hljs.highlight error:', e);
                            highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
                        }
                    } else {
                        try {
                            const autoResult = window.hljs.highlightAuto(actualCodeString);
                            highlightedCodeForDisplay = autoResult.value;
                            const detectedLang = autoResult.language;
                            console.log('[ChatRenderer Custom Code] Highlighted with auto-detection. Detected:', detectedLang);

                            if (detectedLang) { // If auto-detection was successful
                                safeLanguage = escapeHtmlEntities(detectedLang);
                                langClass = `language-${safeLanguage}`; // Update based on detected language
                            }
                        } catch (e) {
                            console.error('[ChatRenderer Custom Code] hljs.highlightAuto error:', e);
                            highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
                        }
                    }
                } else {
                    console.warn('[ChatRenderer Custom Code] window.hljs not found. Falling back to escaped code.');
                    highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
                }

                return `
<div class="code-block-wrapper bg-gray-800 dark:bg-gray-900 rounded-md shadow-md my-2 text-sm">
    <div class="code-block-header flex justify-between items-center px-3 py-1.5 bg-gray-700 dark:bg-gray-800 rounded-t-md border-b border-gray-600 dark:border-gray-700">
        <span class="code-language text-xs text-gray-300 dark:text-gray-400 font-semibold">${safeLanguage}</span>
        <div class="code-actions flex space-x-2">
            <button class="code-action-copy-snippet p-1 rounded text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" title="Copy code" data-code="${encodedCodeForAttr}">
                ${copyIcon}
            </button>
            <button class="code-action-download-snippet p-1 rounded text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" title="Download ${safeLanguage} snippet" data-code="${encodedCodeForAttr}" data-lang="${safeLanguage}">
                ${downloadIcon}
            </button>
        </div>
    </div>
    <pre class="p-3 overflow-x-auto"><code class="${langClass}">${highlightedCodeForDisplay}</code></pre>
</div>`;
            };

            // DO NOT override .paragraph, .list, .listitem, .heading for this test.
            // Let Marked use its defaults for these.

            const parsedContent = window.marked.parse(contentToParse || '', {
                renderer: localRenderer, // Use the renderer with only .code overridden
                gfm: true, 
                breaks: true 
            });
            console.log('[ChatRenderer Minimal Custom Marked.parse() output:]', parsedContent);
            mainContentDiv.innerHTML = parsedContent;
            if (window.hljs) {
                console.log('[ChatRenderer] Content set. highlight should have processed via Marked config.');
            }
        } catch (e) {
            console.error('Error during marked.parse:', e);
            mainContentDiv.textContent = contentToParse || ''; 
        }
    } else {
        console.warn('Marked not available. Falling back to textContent.');
        mainContentDiv.textContent = contentToParse || '';
    }

    // FOLDOUT LOGIC
    let expanded = true;
    foldoutBtn.onclick = () => {
        expanded = !expanded;
        mainContentDiv.style.display = expanded ? '' : 'none';
        // Rotate chevron
        const svg = foldoutBtn.querySelector('.chevron-icon') as HTMLElement | null;
        if (svg) svg.style.transform = expanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    };
    // Default: expanded
    mainContentDiv.style.display = '';

    // --- ASSEMBLE BUBBLE ---
    bubbleDiv.innerHTML = '';
    bubbleDiv.appendChild(headerBar);
    if (specialHeaderHTML) {
        const headerDiv = document.createElement('div');
        headerDiv.innerHTML = specialHeaderHTML;
        bubbleDiv.appendChild(headerDiv);
    }
    bubbleDiv.appendChild(mainContentDiv);
    bubbleDiv.appendChild(actionsContainer); // Append actions container LAST to ensure it's not overwritten and is on top (due to z-10)
    
    messageDiv.appendChild(bubbleDiv);
    chatBodyElement.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

// --- NEW: Functions for Temporary Messages ---

/**
 * Renders a temporary status message directly to the chat body.
 * These messages are not saved to the database.
 * @param {string} type - 'system', 'success', or 'error'
 * @param {string} text - The message content.
 */
export function renderTemporaryMessage(type: string, text: string) {
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
    tempMessages.forEach((msg: Element) => msg.remove());
}

// --- END: Temporary Message Functions ---

function initializeObserver() {
    if (observer) observer.disconnect(); // Disconnect previous observer if any

    observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // If using hljs and it needs to be re-triggered on dynamic additions, this is one place.
                        // However, if Marked+hljs provides fully rendered HTML, this might only be for other dynamic changes.
                        // For now, let's assume the initial render from Marked handles it.
                        // const codeBlocks = node.querySelectorAll('pre code[class*="language-"]');
                        // codeBlocks.forEach(codeElement => {
                        //     if (!codeElement.classList.contains('hljs-highlighted')) { // or appropriate hljs class
                        //         if (window.hljs) window.hljs.highlightElement(codeElement); // or hljs.highlightBlock(codeElement)
                        //         codeElement.classList.add('hljs-highlighted');
                        //     }
                        // });
                    }
                });
            }
        });
    });

    if (chatBodyElement) {
        observer.observe(chatBodyElement, { childList: true, subtree: true });
        console.log("[ChatRenderer] MutationObserver initialized and observing chat body.");

        // Event delegation for code block actions
        chatBodyElement.addEventListener('click', async (event: MouseEvent) => {
            const target = (event.target as HTMLElement).closest('button');
            if (!target) return;

            if (target.classList.contains('code-action-copy-snippet')) {
                const codeToCopy = target.dataset.code;
                if (codeToCopy) {
                    try {
                        await navigator.clipboard.writeText(decodeURIComponent(codeToCopy));
                        window.originalUITooltipController?.showTooltip(target, 'Code Copied!');
                    } catch (err) {
                        console.error('Failed to copy code snippet:', err);
                        showError('Failed to copy code snippet.');
                    }
                }
            } else if (target.classList.contains('code-action-download-snippet')) {
                const codeToDownload = target.dataset.code;
                const lang = target.dataset.lang || 'txt';
                const filename = `snippet.${lang}`;
                if (codeToDownload) {
                    try {
                        downloadFile(filename, decodeURIComponent(codeToDownload), getMimeType(lang));
                        window.originalUITooltipController?.showTooltip(target, 'Downloading...');
                    } catch (err) {
                        console.error('Failed to download code snippet:', err);
                        showError('Failed to download code snippet.');
                    }
                }
            }
        });
        console.log("[ChatRenderer] Event listeners for code block actions (copy/download) added to chatBody.");

    } else {
        console.error("[ChatRenderer] Cannot initialize MutationObserver or event listeners: chatBody is null.");
    }
}

// Helper function to get MIME type from language
function getMimeType(lang: string): string {
    const mimeTypes: Record<string, string> = {
        json: 'application/json',
        javascript: 'application/javascript',
        js: 'application/javascript',
        html: 'text/html',
        css: 'text/css',
        xml: 'application/xml',
        python: 'text/x-python',
        py: 'text/x-python',
        java: 'text/x-java-source',
        c: 'text/x-csrc',
        cpp: 'text/x-c++src',
        cs: 'text/x-csharp',
        go: 'text/x-go',
        rb: 'text/x-ruby',
        php: 'application/x-httpd-php',
        swift: 'text/x-swift',
        kt: 'text/x-kotlin',
        rs: 'text/rust',
        sql: 'application/sql',
        sh: 'application/x-sh',
        bash: 'application/x-sh',
        // Add more as needed
        txt: 'text/plain',
        plaintext: 'text/plain'
    };
    return mimeTypes[lang.toLowerCase()] || 'text/plain';
}

// Helper function to trigger file download
function downloadFile(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}