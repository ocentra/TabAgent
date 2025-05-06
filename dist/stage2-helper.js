// src/stage2-helper.js
(function() {
  console.log("[Stage 2 Helper] Running in iframe...");

  // Check if the main scraper script has loaded and defined the necessary function
  if (window.scraper && typeof window.scraper.extract === 'function') {
    try {
      // Call the main extraction function from PageExtractor.js
      const result = window.scraper.extract(); 
      console.log("[Stage 2 Helper] Extraction result obtained:", result ? 'Object' : 'null');

      // Send the result back to the background script
      chrome.runtime.sendMessage({
        type: 'offscreenIframeResult', 
        // Send the actual result (which might be null or incomplete on failure)
        payload: { success: true, ...result } // <-- Assume success if no error thrown, send result
      });
      console.log("[Stage 2 Helper] Result sent to background.");

    } catch (error) {
      console.error("[Stage 2 Helper] Error during extraction:", error);
      // Send an error message back if extraction fails
      chrome.runtime.sendMessage({
        type: 'offscreenIframeResult',
        // Send specific error message
        payload: { success: false, error: `Extraction failed in iframe: ${error.message || error.toString()}` } // <-- Include specific error
      });
    }
  } else {
     console.error("[Stage 2 Helper] window.scraper.extract not found!");
     // Send an error message back if the main scraper isn't available
     chrome.runtime.sendMessage({
        type: 'offscreenIframeResult',
        payload: { success: false, error: 'Scraper function (window.scraper.extract) not available in iframe.' } 
     });
  }
})(); 