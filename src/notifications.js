/**
 * src/notifications.js
 * Manages the UI notification banner.
 */

let notificationTimeout;

/**
 * Shows a notification message in the banner.
 * @param {string} message - The message to display.
 * @param {'info' | 'success' | 'error'} [type='info'] - The type of notification (affects styling).
 * @param {number} [duration=4000] - Duration in ms to show the message (0 for indefinite).
 */
export function showNotification(message, type = 'info', duration = 3000) {
    console.log(`[Notification] ${type.toUpperCase()}: ${message} (Duration: ${duration}ms)`);

    // Optional: Basic alert fallback (can be annoying)
    // alert(`${type.toUpperCase()}: ${message}`);

    // You could also implement a simple DOM-based notification here
    // for temporary feedback if needed.
}

/**
 * Hides the notification banner.
 */
export function hideNotification() {
    const banner = document.getElementById('notification-banner');
    if (banner) {
        banner.classList.remove('visible');
        // Optional: Clean up after transition ends, though CSS handles visibility
        // banner.addEventListener('transitionend', () => { banner.textContent = ''; }, { once: true });
    }
    // Clear timeout if banner is hidden manually
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    // Remove the click listener once hidden
    if (banner) {
        banner.onclick = null;
    }
} 