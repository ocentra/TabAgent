import { DbGetSessionRequest } from '../events/dbEvents.js';
import { formatChatToHtml, downloadHtmlFile } from '../downloadFormatter.js';

/**
 * Fetches, formats, and initiates the download for a chat session.
 * @param {string} sessionId - The ID of the session to download.
 * @param {Function} requestDbAndWaitFunc - The function to make DB requests.
 * @param {Function} showNotificationFunc - The function to display notifications.
 */
export async function initiateChatDownload(sessionId, requestDbAndWaitFunc, showNotificationFunc) {
    if (!sessionId || !requestDbAndWaitFunc || !showNotificationFunc) {
        console.error("[initiateChatDownload] Failed: Missing sessionId, requestDbAndWaitFunc, or showNotificationFunc.");
        // Optionally show an error notification here if showNotificationFunc is available
        if (showNotificationFunc) showNotificationFunc("Download failed due to internal error.", 'error');
        return;
    }

    console.log(`[initiateChatDownload] Preparing download for: ${sessionId}`);
    showNotificationFunc("Preparing download...", 'info'); // Use the passed function

    try {
        // Fetch the session data
        const sessionData = await requestDbAndWaitFunc(new DbGetSessionRequest(sessionId));
        if (!sessionData) {
            throw new Error("Chat session data not found.");
        }

        // Format the chat to HTML
        const htmlContent = formatChatToHtml(sessionData);

        // Generate a safe filename
        const safeTitle = (sessionData.title || sessionData.name || 'Chat_Session').replace(/[^a-z0-9_\-\.]/gi, '_').replace(/_{2,}/g, '_');
        const filename = `${safeTitle}_${sessionId.substring(0, 8)}.html`;

        // Trigger the download using downloadHtmlFile, passing an error handler
        downloadHtmlFile(htmlContent, filename, (errorMessage) => {
            // This internal callback is used by downloadHtmlFile for download API errors
            showNotificationFunc(errorMessage, 'error');
        });
        // No success notification needed here as the browser handles the download prompt

    } catch (error) {
        // Catches errors from requestDbAndWaitFunc or formatChatToHtml
        console.error(`[initiateChatDownload] Error preparing download for ${sessionId}:`, error);
        showNotificationFunc(`Failed to prepare download: ${error.message}`, 'error'); // Use the passed function
    }
} 