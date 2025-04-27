// src/chatRenderer.js

import { showNotification } from './notifications.js'; // For copy feedback
import { getChatSessionById } from './db.js'; // To fetch session data
import { showError } from './Home/utils.js'; // For displaying errors during render

let chatBodyElement = null;

// Why: Stores the reference to the main chat container element.
export function initializeRenderer(chatBody) {
    if (!chatBody) {
        console.error("ChatRenderer: chatBody element is required for initialization.");
        return;
    }
    chatBodyElement = chatBody;
    console.log("[ChatRenderer] Initialized with chat body element.");
}

// Why: Creates the HTML structure for a single message bubble based on its properties.
export function displayMessage(msg) {
    if (!chatBodyElement) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'mb-2');
    // Use a more robust fallback ID generation if needed
    messageDiv.id = msg.messageId || `msg-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('rounded-lg', 'break-words', 'relative', 'group', 'p-2'); // Base styles + padding
    bubbleDiv.classList.add('max-w-4xl'); // Consistent max width

    // --- Copy Button (Common to most message types) ---
    const copyButtonContainer = document.createElement('div');
    copyButtonContainer.className = 'copy-button-container absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity';
    const copyButton = document.createElement('button');
    // Re-use SVG or use an icon font/library
    copyButton.innerHTML = `<svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
    copyButton.className = 'copy-button p-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    copyButton.title = 'Copy text';
    copyButton.onclick = (e) => {
        e.stopPropagation();
        // Determine the primary content element to copy from
        const contentElement = bubbleDiv.querySelector('pre code') // Code block
                            || bubbleDiv.querySelector('.prose') // Scrape result content
                            || bubbleDiv; // Default to the bubble itself
        const textToCopy = contentElement?.textContent || '';
        navigator.clipboard.writeText(textToCopy)
            .then(() => showNotification('Copied!', 'success', 1500))
            .catch(err => {
                console.error('Failed to copy:', err);
                showNotification('Copy failed', 'error', 1500);
            });
    };
    copyButtonContainer.appendChild(copyButton);
    // Append copy button early so it's present for all types
    bubbleDiv.appendChild(copyButtonContainer);

    let codeElement = null; // To store reference for Prism highlighting

    // --- Message Type Specific Rendering ---
    if (msg.metadata?.type === 'scrape_result') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-200', 'dark:bg-gray-600'); // Distinct background

        const headerDiv = document.createElement('div');
        headerDiv.classList.add('text-xs', 'font-semibold', 'mb-1', 'text-gray-700', 'dark:text-gray-300', 'pr-6'); // Added padding-right for copy btn
        headerDiv.textContent = `Scraped (${msg.metadata.method || 'N/A'}): ${msg.metadata.title || msg.metadata.url || 'Content'}`;
        bubbleDiv.appendChild(headerDiv);

        const contentDiv = document.createElement('div');
        // Apply prose for basic formatting, allow scrolling, preserve whitespace
        contentDiv.classList.add('overflow-y-auto', 'max-h-64', 'text-sm', 'prose', 'prose-sm', 'dark:prose-invert', 'whitespace-pre-wrap', 'mt-1');
        contentDiv.textContent = msg.text || ''; // Ensure text content exists
        bubbleDiv.appendChild(contentDiv);

    } else if (msg.metadata?.type === 'scrape_stage_result') {
        messageDiv.classList.add('justify-start');
        // Keep padding, border differentiates stages
        bubbleDiv.classList.add('border', 'border-gray-300', 'dark:border-gray-600');

        const stageHeaderDiv = document.createElement('div');
        stageHeaderDiv.classList.add('text-xs', 'font-semibold', 'mb-1', 'pr-6'); // Padding for copy btn

        if (msg.metadata.success) {
            bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700');
            stageHeaderDiv.classList.add('text-gray-700', 'dark:text-gray-300');
            stageHeaderDiv.textContent = `[Stage ${msg.metadata.stage} - ${msg.metadata.method || '?'} - OK] Len: ${msg.metadata.length || 0}`;
            bubbleDiv.appendChild(stageHeaderDiv);

            // Container for JSON view
            const stageContentContainer = document.createElement('div');
            stageContentContainer.classList.add('overflow-y-auto', 'max-h-64', 'mt-1');

            const preElement = document.createElement('pre');
            // Consistent code block styling
            preElement.classList.add('bg-gray-800', 'dark:bg-gray-900', 'rounded', 'p-2', 'text-xs'); // Smaller text for JSON

            codeElement = document.createElement('code');
            codeElement.className = 'language-json'; // For Prism

            // Select relevant data to display in the stage result
            const dataToShow = {
                 title: msg.metadata.title || 'N/A',
                 // segments: msg.metadata.segments, // Often too verbose for preview
                 links: msg.metadata.links,
                 // Add other key metadata if useful for debugging stages
            };
            codeElement.textContent = JSON.stringify(dataToShow, null, 2);

            preElement.appendChild(codeElement);
            stageContentContainer.appendChild(preElement);
            bubbleDiv.appendChild(stageContentContainer);

        } else { // Failed stage
            bubbleDiv.classList.add('bg-red-100', 'dark:bg-red-900');
            stageHeaderDiv.classList.add('text-red-700', 'dark:text-red-300');
            stageHeaderDiv.textContent = `[Stage ${msg.metadata.stage} - Failed] ${msg.metadata.error || 'Unknown'}`;
            bubbleDiv.appendChild(stageHeaderDiv);
            // No content body for failed stages usually
        }

    } else { // Normal messages (user, ai, system, error, loading)
        // Apply base text content
        bubbleDiv.textContent = msg.text || ''; // Ensure text exists

        if (msg.isLoading) {
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'italic');
        } else if (msg.sender === 'user') {
            messageDiv.classList.add('justify-end');
            bubbleDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'text-blue-900', 'dark:text-blue-100'); // User color
        } else if (msg.sender === 'error') {
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-red-100', 'dark:bg-red-900', 'text-red-700', 'dark:text-red-300'); // Error color
        } else { // Includes 'ai', 'system'
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100'); // Default AI/System color
             // Example: Different AI color
             // bubbleDiv.classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-900', 'dark:text-green-100');
        }
    }

    messageDiv.appendChild(bubbleDiv);
    chatBodyElement.appendChild(messageDiv);

    // --- Apply Syntax Highlighting (if applicable) ---
    // Why: Enhances readability of code blocks within messages.
    if (codeElement && window.Prism) {
        try {
            // Use highlightElement for efficiency if element is already in DOM
            Prism.highlightElement(codeElement);
        } catch (e) {
            console.warn("Prism highlighting failed:", e);
            // Optional: Add a class to indicate failure?
        }
    }
}

// Why: Clears the chat area and displays the initial welcome message.
export function displayWelcomeMessage() {
    if (!chatBodyElement) return;
    chatBodyElement.innerHTML = ''; // Clear existing messages

    const welcomeMsg = {
        messageId: 'welcome-msg', // Static ID for the welcome message
        sender: 'system', // Use 'system' or 'ai'
        text: 'Welcome to Tab Agent! Ask me anything or paste a URL to scrape.',
        timestamp: Date.now(),
        isLoading: false
    };
    displayMessage(welcomeMsg); // Use the standard message display function
}

// Why: Fetches messages for a given session ID and renders them in the chat area.
export async function renderChatSession(sessionId) {
    if (!chatBodyElement) return;
    console.log(`ChatRenderer: Rendering session ID: ${sessionId}`);
    chatBodyElement.innerHTML = ''; // Clear previous content

    if (!sessionId) {
        console.log("ChatRenderer: No session ID provided, showing welcome message.");
        displayWelcomeMessage();
        return;
    }

    try {
        const sessionData = await getChatSessionById(sessionId);
        if (!sessionData || !sessionData.messages || sessionData.messages.length === 0) {
            console.log(`ChatRenderer: Session ${sessionId} empty or not found. Showing welcome.`);
            displayWelcomeMessage();
        } else {
            console.log(`ChatRenderer: Rendering ${sessionData.messages.length} messages for ${sessionId}.`);
            // Render all messages
            sessionData.messages.forEach(msg => displayMessage(msg));
            // Scroll to the bottom after rendering messages
            scrollToBottom();
        }
    } catch (error) {
        console.error(`ChatRenderer: Error fetching/rendering session ${sessionId}:`, error);
        showError(`Failed to load chat: ${error.message}`);
        displayWelcomeMessage(); // Fallback to welcome message on error
    }
}

// Why: Scrolls the chat container to the bottom to show the latest messages.
export function scrollToBottom() {
    if (chatBodyElement) {
        chatBodyElement.scrollTop = chatBodyElement.scrollHeight;
    }
} 