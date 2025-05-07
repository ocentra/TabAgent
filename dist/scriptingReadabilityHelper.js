/******/ (() => { // webpackBootstrap
/*!*******************************************!*\
  !*** ./src/scriptingReadabilityHelper.js ***!
  \*******************************************/
// This script is dynamically injected into the iframe created by the offscreen document (Stage 2).

// DO NOT use import statements here - they won't work in scripts injected via registerContentScripts.
// Readability should be globally available because Readability.js is injected first.

(function() {
    const DYNAMIC_SCRIPT_MESSAGE_TYPE = 'offscreenIframeResult'; // Must match background.js
    console.log('[Dynamic Script Helper] Running in iframe...');

    let result = { success: false, source: 'dynamic-script-helper' };

    // Function to run Readability and send message
    const runReadabilityAndSend = () => {
        try {
            if (typeof Readability === 'undefined') {
                throw new Error('Readability library not found in iframe context.');
            }
            // Using cloneNode might be safer, but let's try direct access first in iframe context
            // const documentClone = document.cloneNode(true);
            const article = new Readability(document).parse();
            result = {
                success: true,
                source: 'dynamic-script-helper',
                title: article ? article.title : '',
                textContent: article ? article.textContent : '',
                content: article ? article.content : '',
                byline: article ? article.byline : '',
                length: article ? article.length : 0,
                excerpt: article ? article.excerpt : '',
                siteName: article ? article.siteName : ''
            };
            console.log('[Dynamic Script Helper] Readability parsing successful.');
        } catch (e) {
            console.error('[Dynamic Script Helper] Error:', e);
            result.error = e.message || 'Unknown error in dynamic script helper';
        }
        console.log('[Dynamic Script Helper] Sending result back to background:', result);
        chrome.runtime.sendMessage({ type: DYNAMIC_SCRIPT_MESSAGE_TYPE, payload: result });
    };

    // --- Run logic --- 
    // Check if the document is already loaded, otherwise wait for load event
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
         console.log('[Dynamic Script Helper] Document already ready. Running Readability...');
         runReadabilityAndSend();
    } else {
         console.log('[Dynamic Script Helper] Document not ready. Adding load listener...');
         window.addEventListener('load', () => {
              console.log('[Dynamic Script Helper] Window load event fired. Running Readability...');
              runReadabilityAndSend();
         }, { once: true });
    }

})(); 
/******/ })()
;
//# sourceMappingURL=scriptingReadabilityHelper.js.map