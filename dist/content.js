import browser from 'webextension-polyfill';
import { Contexts } from './events/eventNames.js';
import { DirectDBNames, DBEventNames } from './events/eventNames.js';
import { UIEventNames } from './events/eventNames.js';
window.EXTENSION_CONTEXT = Contexts.OTHERS;

console.log("[ContentScript] Executing...");

try {

    console.log("[ContentScript] Setting up message listener...");
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const type = message?.type;
        if (Object.values(DirectDBNames).includes(type)) {
            return false;
        }
        if (Object.values(DBEventNames).includes(type)) {
            return false;
        }
        console.log("[ContentScript] Received message:", message);

        if (message.type === UIEventNames.SCRAPE_PAGE || message.type === UIEventNames.SCRAPE_ACTIVE_TAB) {
            console.log(`[ContentScript] ${message.type} request received.`);
            try {

                
                if (typeof window.scraper === 'undefined' || typeof window.scraper.extract !== 'function') {
                    console.error('TabAgent Content Script: window.scraper.extract not found! Ensure PageExtractor.js is loaded before this script.');
                    throw new Error('TabAgent Content Script: Scraper functions not found. Was PageExtractor.js injected correctly?');
                }
                console.log("[ContentScript] Calling window.scraper.extract()...");
                const extractedData = window.scraper.extract(); // Call the new function
                console.log("[ContentScript] window.scraper.extract() completed.");

                if (extractedData && typeof extractedData === 'object') { 
                    console.log(`[ContentScript] New scraper extracted: ${extractedData.title}, Text Length: ${extractedData.text?.length}`);
                    sendResponse({
                        success: true,

                        title: extractedData.title,
                        text: extractedData.text,
                        contentHtml: extractedData.content,
                        segments: extractedData.segments,
                        excerpt: null, 
                        siteName: null, 
                        byline: extractedData.author, 
                        lang: extractedData.language || document.documentElement.lang,
                        _extractedData: extractedData 
                    });
                } else {
                     console.error("[ContentScript] window.scraper.extract() failed or returned null.");
                     sendResponse({ success: false, error: "Failed to extract content using window.scraper.extract." });
                }

            } catch (error) {
                console.error("[ContentScript] Error during scraping process:", error);
                sendResponse({ success: false, error: error.message });
            }
            return true;
        }

        console.log(`[ContentScript] Message type not ${UIEventNames.SCRAPE_PAGE}, returning false.`);
        return false; 
    });
    console.log("[ContentScript] Message listener added.");

} catch (error) {
    console.error("[ContentScript] CRITICAL: Error during script execution (likely listener setup):", error);
}

console.log("[ContentScript] Execution finished (listener potentially set up).");

