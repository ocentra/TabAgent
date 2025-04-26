console.log("[Offscreen Script Start] Executing offscreen.js");

import { Readability } from '@mozilla/readability';

// Keep track of the iframe we create
let scrapingIframe = null;
const IFRAME_ID = 'scraping-iframe';

// --- REMOVED Globals for Google API/Picker --- 
// let pickerApiLoaded = false;
// let oauthToken = null;
// let googleApiKey = null;
// let googleAppId = null;

console.log("[Offscreen Script] Adding runtime.onMessage listener...");
// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Offscreen: Received message:', message);
    // This document now ONLY handles parsing/iframe tasks
    if (message.target !== 'offscreen' && message.type !== 'parseHTML' && message.type !== 'createIframe' && message.type !== 'removeIframe') {
        console.log('Offscreen: Ignoring message not intended for parsing/iframe document:', message.type);
        return false; // Ignore messages not intended for this offscreen document
    }

    switch (message.type) {
        // REMOVED case 'showGooglePicker' - Handled by google_drive_offscreen.js
        // case 'showGooglePicker': ...
        case 'parseHTML':
            console.log('[Offscreen] Handling parseHTML.');
            if (typeof message.htmlContent !== 'string') {
                 console.error('[Offscreen] Invalid HTML content received.');
                 // Ensure response is sent even on validation failure
                 sendResponse({ success: false, error: 'Invalid HTML content provided.' }); 
                 return false; 
            }

            try {
                console.log('[Offscreen] Creating DOMParser...');
                const parser = new DOMParser();
                console.log('[Offscreen] Parsing HTML string...');
                const doc = parser.parseFromString(message.htmlContent, 'text/html');
                console.log('[Offscreen] HTML parsing done.');

                if (!doc || !doc.body || doc.body.innerHTML.trim() === '') {
                     console.error('[Offscreen] DOMParser failed to parse HTML or resulted in empty body.');
                     sendResponse({ success: false, error: 'Failed to parse HTML content meaningfully.' });
                     return false;
                }
                console.log('[Offscreen] Document seems valid. Instantiating Readability...');
                
                // Use Readability
                const reader = new Readability(doc);
                console.log('[Offscreen] Calling reader.parse()...');
                const article = reader.parse();
                console.log('[Offscreen] reader.parse() returned.', article === null ? 'null' : 'object');

                console.log('[Offscreen] Readability parsing complete. Sending response...');
                // Send the parsed article object back
                sendResponse({ success: true, article: article });
                console.log('[Offscreen] Response sent (success/article).');

            } catch (error) {
                console.error('[Offscreen] Error during parsing process:', error);
                // Ensure response is sent on error
                sendResponse({ success: false, error: error.message || 'Unknown error during parsing.' });
                console.log('[Offscreen] Response sent (error).');
            }
            
            // Return true MUST be outside the try/catch to ensure it's always reached
            // if the message type was handled, allowing async sendResponse.
            console.log('[Offscreen] Returning true to indicate async response.');
            return true; 
        case 'createIframe':
            console.log('[Offscreen] ENTERING createIframe handler...');
            console.log(`[Offscreen] Handling createIframe for URL: ${message.url}`);
            if (scrapingIframe) {
                 console.warn('[Offscreen] Iframe already exists. Removing old one before creating new.');
                 scrapingIframe.remove();
                 scrapingIframe = null;
            }
            if (!message.url || !message.url.startsWith('http')) {
                console.error('[Offscreen] Invalid URL received for createIframe.');
                sendResponse({ success: false, error: 'Invalid URL provided for iframe.' });
                return false; // Synchronous response for invalid input
            }

            try {
                scrapingIframe = document.createElement('iframe');
                scrapingIframe.id = IFRAME_ID;
                scrapingIframe.src = message.url;
                // Styling to keep it hidden but functional (may need adjustment)
                scrapingIframe.style.position = 'absolute';
                scrapingIframe.style.width = '1px';
                scrapingIframe.style.height = '1px';
                scrapingIframe.style.left = '-9999px';
                scrapingIframe.style.top = '-9999px';
                scrapingIframe.style.border = 'none';

                document.body.appendChild(scrapingIframe);
                console.log('[Offscreen] Iframe created and appended.');
                // Send success response immediately, loading happens async
                sendResponse({ success: true }); 
            } catch (error) {
                 console.error('[Offscreen] Error creating iframe:', error);
                 sendResponse({ success: false, error: `Failed to create iframe: ${error.message}` });
                 // Clean up if partially created
                 if (scrapingIframe) scrapingIframe.remove();
                 scrapingIframe = null;
                 return false; // Synchronous response on error
            }
            // We send the response synchronously above, so return false here.
            return false; 
        case 'removeIframe':
            console.log('[Offscreen] Handling removeIframe.');
            if (scrapingIframe) {
                try {
                    scrapingIframe.remove();
                    console.log('[Offscreen] Iframe removed successfully.');
                    scrapingIframe = null;
                    sendResponse({ success: true });
                } catch (error) {
                     console.error('[Offscreen] Error removing iframe:', error);
                     sendResponse({ success: false, error: `Failed to remove iframe: ${error.message}`});
                }
            } else {
                console.warn('[Offscreen] No iframe found to remove.');
                sendResponse({ success: false, error: 'No iframe exists to remove.' });
            }
            return false; // Synchronous response
        default:
            console.log('[Offscreen] Received unhandled message type:', message?.type);
            // It's important to return false if the message type isn't handled
            return false; 
    }
});

// --- REMOVED Google Picker Functions --- 
// function loadPickerApi() { ... }
// function handleGapiError(error) { ... }
// function handleGapiLoad() { ... }
// function handleClientLoad() { ... }
// function createPicker() { ... }
// function pickerCallback(data) { ... }

// Function to close the offscreen document (still potentially useful, e.g., if parsing fails critically)
function closeOffscreenDocument() {
  console.log("Offscreen: Closing document.");
  window.close();
}

console.log("Offscreen script (Parsing/Iframe) loaded and listener added."); 