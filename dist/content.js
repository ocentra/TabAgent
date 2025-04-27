// Log start of content script execution
console.log("[ContentScript] Executing...");

// Put imports at the top level before other code (REMOVED)
// import { extractReadableArticle, scrapeSimpleTextFallback } from './webScraper.js';
// console.log("[ContentScript] Successfully imported webScraper."); 

try {
    // Functions extractReadableArticle and scrapeSimpleTextFallback are now expected
    // to be globally available because webScraper.js is loaded via manifest.

    // Listener for messages from background script or side panel
    console.log("[ContentScript] Setting up message listener...");
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("[ContentScript] Received message:", message);

        // Respond to either SCRAPE_PAGE (legacy/temp tab) or SCRAPE_ACTIVE_TAB (direct request)
        if (message.type === 'SCRAPE_PAGE' || message.type === 'SCRAPE_ACTIVE_TAB') {
            console.log(`[ContentScript] ${message.type} request received.`);
            try {
                // REMOVED: Cloning document for Readability
                // console.log("[ContentScript] Cloning document...");
                // const documentClone = document.cloneNode(true);
                // console.log("[ContentScript] Document cloned. Calling extractReadableArticle...");
                
                // --- MODIFIED: Call window.scraper.extract() directly --- 
                if (typeof window.scraper === 'undefined' || typeof window.scraper.extract !== 'function') {
                    console.error('TabAgent Content Script: window.scraper.extract not found! Ensure PageExtractor.js is loaded before this script.');
                    throw new Error('TabAgent Content Script: Scraper functions not found. Was PageExtractor.js injected correctly?');
                }
                console.log("[ContentScript] Calling window.scraper.extract()...");
                const extractedData = window.scraper.extract(); // Call the new function
                console.log("[ContentScript] window.scraper.extract() completed.");
                // --------------------------------------------------------

                // Check if extraction was successful (returned an object)
                if (extractedData && typeof extractedData === 'object') { 
                    console.log(`[ContentScript] New scraper extracted: ${extractedData.title}, Text Length: ${extractedData.text?.length}`);
                    // Send back the full ExtractedContent object
                    sendResponse({
                        success: true,
                        // Keep the existing structure expected by background.js for now
                        // The background stage will add the method, stage number etc.
                        title: extractedData.title,
                        text: extractedData.text,
                        contentHtml: extractedData.content, // Pass cleaned HTML if available
                        segments: extractedData.segments,
                        excerpt: null, // Excerpt not directly in new structure, maybe use metaDescription?
                        siteName: null, // Not explicitly in new structure
                        byline: extractedData.author, // Map author
                        lang: extractedData.language || document.documentElement.lang,
                        // Pass the whole object for potential future use, but map main fields
                        _extractedData: extractedData 
                    });
                } else {
                     console.error("[ContentScript] window.scraper.extract() failed or returned null.");
                     sendResponse({ success: false, error: "Failed to extract content using window.scraper.extract." });
                }
                // REMOVED: Readability fallback logic

            } catch (error) {
                console.error("[ContentScript] Error during scraping process:", error);
                sendResponse({ success: false, error: error.message });
            }
            // console.log("[ContentScript] Sending response for SCRAPE_PAGE."); // Log is less specific now
            return true; // Indicate async response
        }

        // Handle other message types if needed
        console.log("[ContentScript] Message type not SCRAPE_PAGE, returning false.");
        return false; // Indicate no async response planned for other types
    });
    console.log("[ContentScript] Message listener added.");

} catch (error) {
    // This catch block might not catch import errors if they happen before the try block
    console.error("[ContentScript] CRITICAL: Error during script execution (likely listener setup):", error);
}

console.log("[ContentScript] Execution finished (listener potentially set up).");

// Optional: Add any other logic the content script might need,
// like interacting with the page UI if required later. 