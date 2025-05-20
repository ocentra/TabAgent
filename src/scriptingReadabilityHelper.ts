import { Contexts } from './events/eventNames';
window.EXTENSION_CONTEXT = Contexts.OTHERS;
// DO NOT use import statements here - they won't work in scripts injected via registerContentScripts.
// Readability should be globally available because Readability.js is injected first.

declare var Readability: any;

(function() {
    // This must match eventNames.js UIEventNames.DYNAMIC_SCRIPT_MESSAGE_TYPE
    const DYNAMIC_SCRIPT_MESSAGE_TYPE = 'offscreenIframeResult';
    // Polyfill for browser API if only chrome is available
    const browser = typeof (window as any).browser !== 'undefined' ? (window as any).browser : (typeof (window as any).chrome !== 'undefined' ? (window as any).chrome : undefined);
    console.log('[Dynamic Script Helper] Running in iframe...');

    let result: any = { success: false, source: 'dynamic-script-helper' };

    const runReadabilityAndSend = () => {
        try {
            if (typeof Readability === 'undefined') {
                throw new Error('Readability library not found in iframe context.');
            }

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
        } catch (e: any) {
            console.error('[Dynamic Script Helper] Error:', e);
            result.error = e.message || 'Unknown error in dynamic script helper';
        }
        console.log('[Dynamic Script Helper] Sending result back to background:', result);
        browser.runtime.sendMessage({ type: DYNAMIC_SCRIPT_MESSAGE_TYPE, payload: result });
    };

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