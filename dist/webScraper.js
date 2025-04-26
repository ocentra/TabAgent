// Readability is now expected to be loaded globally via manifest.json
// import { Readability } from '@mozilla/readability';
console.log("[WebScraper] Script start.");

/**
 * Extracts the main readable content from a document clone using Mozilla's Readability library.
 * 
 * @param {Document} docClone - A clone of the document to parse (Readability modifies the DOM).
 * @returns {object|null} An object containing the article content (title, content, textContent, etc.) 
 *                         as parsed by Readability, or null if parsing fails.
 */
function extractReadableArticle(docClone) {
    console.log("[WebScraper] extractReadableArticle called.");
    // Check if the Readability library was loaded globally.
    if (typeof Readability === 'undefined') {
        console.error("[WebScraper] Readability library is not available globally. Check manifest.json load order.");
        throw new Error("Readability library not loaded.");
    }
    console.log("[WebScraper] Readability object found.");

    try {
        console.log("[WebScraper] Attempting to parse with Readability...");
        const reader = new Readability(docClone);
        console.log("[WebScraper] Readability instance created.");
        const article = reader.parse();
        console.log("[WebScraper] Readability parse() completed.");

        if (article) {
             console.log(`[WebScraper] Readability parsed article: "${article.title}", Length: ${article.length}`);
        } else {
             console.warn("[WebScraper] Readability returned null.");
        }
        
        return article;
    } catch (error) {
        console.error("[WebScraper] Readability parsing failed:", error);
        return null;
    }
}

// --- Keep the simple scraper as a potential fallback --- 
/**
 * Attempts to scrape the main textual content from the current page using simple selectors.
 * Tries common main content selectors first, then falls back to the body.
 * 
 * @returns {string} The extracted text content, or an empty string if fails.
 */
function scrapeSimpleTextFallback() {
    console.log("[WebScraper] scrapeSimpleTextFallback called.");
    let mainContentElement = 
        document.querySelector('main') || 
        document.querySelector('article') || 
        document.body; // Fallback to body

    if (mainContentElement) {
        console.log("[WebScraper] Fallback found element:", mainContentElement.tagName);
        let rawText = mainContentElement.innerText;
        
        // Basic cleanup
        let cleanedText = rawText.replace(/\s\s+/g, ' ').trim(); // Replace multiple spaces/newlines with single space
        
        console.log(`[WebScraper] (Fallback): Extracted ${cleanedText.length} characters.`);
        return cleanedText;
    } else {
        console.warn("[WebScraper] (Fallback): Could not find main content element or body.");
        return '';
    }
}

// --- TODO: Add Metadata Scraping Function ---
/*
function scrapePageMetadata() {
    const metadata = {
        title: document.title || null,
        lang: document.documentElement.lang || null,
        description: null,
        ogTitle: null,
        ogDescription: null,
        // Add more as needed
    };
    
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) metadata.description = descriptionTag.content;

    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) metadata.ogTitle = ogTitleTag.content;
    
    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) metadata.ogDescription = ogDescriptionTag.content;

    // ... potentially scrape author, keywords etc.

    return metadata;
}
*/

console.log("[WebScraper] Functions defined globally.");
// Functions are now global due to manifest loading, so no export needed.
// export { extractReadableArticle, scrapeSimpleTextFallback };
// console.log("[WebScraper] Exports defined."); // Removed export log 