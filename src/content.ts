import browser from 'webextension-polyfill';
import { Contexts } from './events/eventNames';
import {  DBEventNames } from './DB/dbEvents';
import { UIEventNames } from './events/eventNames';
window.EXTENSION_CONTEXT = Contexts.OTHERS;

console.log("[ContentScript] Executing...");

try {

    console.log("[ContentScript] Setting up message listener...");
    browser.runtime.onMessage.addListener((message: any, sender: any, _sendResponse: (response: any) => void) => {
        const type = message?.type;

        if (Object.values(DBEventNames).includes(type)) {
            return false;
        }
        console.log("[ContentScript] Received message:", message);

        if (message.type === UIEventNames.SCRAPE_PAGE || message.type === UIEventNames.SCRAPE_ACTIVE_TAB) {
            console.log(`[ContentScript] ${message.type} request received.`);
            const tryExtract = () => {
                if (window.TabAgentPageExtractor && typeof window.TabAgentPageExtractor.extract === 'function') {
                    try {
                        console.log("[ContentScript] Calling window.TabAgentPageExtractor.extract()...");
                        const extractedData = window.TabAgentPageExtractor.extract(document);
                        console.log("[ContentScript] window.TabAgentPageExtractor.extract() completed.");
                        if (extractedData && typeof extractedData === 'object') {
                            console.log(`[ContentScript] Extracted: ${extractedData.title}, Text Length: ${extractedData.text?.length}`);
                            _sendResponse({
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
                            console.error("[ContentScript] window.TabAgentPageExtractor.extract() failed or returned null.");
                            _sendResponse({ success: false, error: "Failed to extract content using TabAgentPageExtractor.extract." });
                        }
                    } catch (error: unknown) {
                        console.error("[ContentScript] Error during extraction:", error);
                        const errMsg = error instanceof Error ? error.message : String(error);
                        _sendResponse({ success: false, error: errMsg });
                    }
                } else {
                    console.error('TabAgent Content Script: TabAgentPageExtractor.extract not found! Attempting to inject pageExtractor.js...');
                    // Try to inject pageExtractor.js dynamically
                    const script = document.createElement('script');
                    script.src = browser.runtime.getURL('pageExtractor.js');
                    script.onload = () => {
                        script.remove();
                        // Try again after injection
                        setTimeout(() => {
                            if (window.TabAgentPageExtractor && typeof window.TabAgentPageExtractor.extract === 'function') {
                                tryExtract();
                            } else {
                                _sendResponse({ success: false, error: 'TabAgentPageExtractor.extract still not found after injecting pageExtractor.js.' });
                            }
                        }, 100); // Wait a bit for script to register
                    };
                    script.onerror = () => {
                        _sendResponse({ success: false, error: 'Failed to inject pageExtractor.js.' });
                    };
                    (document.head || document.documentElement).appendChild(script);
                }
            };
            tryExtract();
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