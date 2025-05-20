import { MessageSenderTypes } from '../events/eventNames';
import browser from 'webextension-polyfill';

/**
 * Formats a chat session object into a self-contained HTML string.
 * @param sessionData - The chat session object from the database.
 * @returns {string} - The generated HTML string.
 */
export function formatChatToHtml(sessionData: any): string {
    if (!sessionData) return '';

    const title = sessionData.title || 'Chat Session';
    const messagesHtml = (sessionData.messages || []).map((msg: any) => {
        const senderClass = msg.sender === MessageSenderTypes.USER ? 'user-message' : 'other-message';
        const senderLabel = msg.sender === MessageSenderTypes.USER ? 'You' : (msg.sender === MessageSenderTypes.AI ? 'Agent' : 'System');
        // Basic sanitization: escape HTML characters to prevent XSS if message text somehow contains HTML
        const escapedText = msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        // Convert newlines to <br> tags for display
        const formattedText = escapedText.replace(/\n/g, '<br>');

        return `
            <div class="message-row ${senderClass === 'user-message' ? 'row-user' : 'row-other'}">
                <div class="message-bubble ${senderClass}">
                    <span class="sender-label">${senderLabel}:</span>
                    <div class="message-text">${formattedText}</div>
                </div>
            </div>
        `;
    }).join('\n');

    // Basic CSS for styling the downloaded file
    const css = `
        body { font-family: sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8f9fa; color: #212529; }
        .container { max-width: 800px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #343a40; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-top: 0; }
        .chat-body { margin-top: 20px; }
        .message-row { margin-bottom: 15px; overflow: hidden; /* Clear floats */ }
        .row-user { text-align: right; }
        .row-other { text-align: left; }
        .message-bubble { display: inline-block; padding: 10px 15px; border-radius: 15px; max-width: 75%; word-wrap: break-word; }
        .user-message { background-color: #007bff; color: white; margin-left: auto; /* Align right */ }
        .other-message { background-color: #e9ecef; color: #343a40; margin-right: auto; /* Align left */ }
        .sender-label { font-weight: bold; display: block; margin-bottom: 5px; font-size: 0.9em; color: inherit; }
        .message-text { margin-top: 5px; }
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
            <style>${css}</style>
        </head>
        <body>
            <div class="container">
                <h1>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>
                <div class="chat-body">
                    ${messagesHtml}
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Initiates the download of the provided HTML content as a file.
 * Requires the "downloads" permission in manifest.json.
 * @param htmlContent - The HTML string to download.
 * @param filename - The suggested filename (e.g., "chat_session.html").
 * @param onError - Optional callback function to handle errors.
 */
export async function downloadHtmlFile(
    htmlContent: string,
    filename: string,
    onError?: (message: string) => void
): Promise<void> {
    try {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        console.log(`Initiating download for: ${filename} (prompting user)`);
        try {
            const downloadId = await browser.downloads.download({
                url: url,
                filename: filename,
                saveAs: true
            });
            // Always revoke the URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
            if (downloadId) {
                console.log(`Download initiated (or dialog opened) with ID: ${downloadId}`);
            } else {
                console.log("Download cancelled by user (no downloadId assigned)." );
            }
        } catch (err: any) {
            setTimeout(() => URL.revokeObjectURL(url), 100);
            const message = err?.message || String(err);
            console.error("Download API error:", message);
            if (!message || !message.toLowerCase().includes('cancel')) {
                if (onError) {
                    onError(`Download failed: ${message || 'Unknown error'}`);
                } else {
                    console.error("No error handler provided for download failure.");
                    alert(`Download failed: ${message || 'Unknown error'}. Ensure extension has permissions.`);
                }
            } else {
                console.log("Download cancelled by user.");
            }
        }
    } catch (error) {
        console.error("Error creating blob or initiating download:", error);
        if (onError) {
            onError("An error occurred while preparing the download.");
        } else {
            console.error("No error handler provided for download preparation error.");
            alert("An error occurred while preparing the download.");
        }
    }
} 