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
                // --- Create a clone of the document for Readability --- 
                console.log("[ContentScript] Cloning document...");
                const documentClone = document.cloneNode(true);
                console.log("[ContentScript] Document cloned. Calling extractReadableArticle...");
                // -----------------------------------------------------
                
                // Call function directly from global scope
                const article = extractReadableArticle(documentClone); 

                if (article && article.textContent) { // Check if article and textContent exist
                    console.log(`[ContentScript] Readability extracted: ${article.title}, Length: ${article.length}`);
                    // Send back relevant data extracted by Readability
                    sendResponse({
                        success: true,
                        title: article.title || document.title, // Fallback to document title
                        textContent: article.textContent,      // Cleaned text
                        contentHtml: article.content,          // Cleaned HTML (includes images)
                        excerpt: article.excerpt,
                        siteName: article.siteName,
                        byline: article.byline,
                        lang: article.lang || document.documentElement.lang // Fallback lang
                    });
                } else {
                     console.warn("[ContentScript] Readability failed. Trying fallback...");
                     // --- Fallback to simple scraping --- 
                     // Call function directly from global scope
                     const simpleText = scrapeSimpleTextFallback(); 
                     if (simpleText) {
                          console.log("[ContentScript] Fallback succeeded.");
                         sendResponse({ 
                             success: true, // Still success, but indicate fallback was used
                             wasFallback: true,
                             title: document.title, // Use document title for fallback
                             textContent: simpleText,
                             contentHtml: null, // No clean HTML from fallback
                             lang: document.documentElement.lang || null
                          });
                     } else {
                          console.error("[ContentScript] Both Readability and fallback scraping failed.");
                          sendResponse({ success: false, error: "Failed to extract content using Readability or fallback." });
                     }
                     // ---------------------------------
                }

            } catch (error) {
                console.error("[ContentScript] Error during scraping process:", error);
                sendResponse({ success: false, error: error.message });
            }
            console.log("[ContentScript] Sending response for SCRAPE_PAGE.");
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