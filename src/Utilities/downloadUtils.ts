import { DbGetSessionRequest } from '../DB/dbEvents';
import { formatChatToHtml, downloadHtmlFile } from './downloadFormatter';

/**
 * Fetches, formats, and initiates the download for a chat session.
 * @param {string} sessionId - The ID of the session to download.
 * @param {Function} requestDbAndWaitFunc - The function to make DB requests.
 * @param {Function} showNotificationFunc - The function to display notifications.
 */
export async function initiateChatDownload(
    sessionId: string,
    requestDbAndWaitFunc: (req: any) => Promise<any>,
    showNotificationFunc: (message: string, type: string) => void
): Promise<void> {
    if (!sessionId || !requestDbAndWaitFunc || !showNotificationFunc) {
        console.error("[initiateChatDownload] Failed: Missing sessionId, requestDbAndWaitFunc, or showNotificationFunc.");
        if (showNotificationFunc) showNotificationFunc("Download failed due to internal error.", 'error');
        return;
    }

    console.log(`[initiateChatDownload] Preparing download for: ${sessionId}`);
    showNotificationFunc("Preparing download...", 'info');

    try {
        const sessionData = await requestDbAndWaitFunc(new DbGetSessionRequest(sessionId));
        if (!sessionData) {
            throw new Error("Chat session data not found.");
        }

        const htmlContent = formatChatToHtml(sessionData);
        const safeTitle = (sessionData.title || sessionData.name || 'Chat_Session').replace(/[^a-z0-9_\-\.]/gi, '_').replace(/_{2,}/g, '_');
        const filename = `${safeTitle}_${sessionId.substring(0, 8)}.html`;

        downloadHtmlFile(htmlContent, filename, (errorMessage) => {
            showNotificationFunc(errorMessage, 'error');
        });
    } catch (error: unknown) {
        console.error(`[initiateChatDownload] Error preparing download for ${sessionId}:`, error);
        let message = 'Unknown error';
        if (error instanceof Error) message = error.message;
        showNotificationFunc(`Failed to prepare download: ${message}`, 'error');
    }
} 