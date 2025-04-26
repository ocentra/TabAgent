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
export function showNotification(message, type = 'info', duration = 4000) {
    const banner = document.getElementById('notification-banner');
    if (!banner) {
        console.error("Notification banner element (#notification-banner) not found in the DOM.");
        // Fallback to alert if banner isn't found
        alert(`(${type.toUpperCase()}) ${message}`);
        return;
    }

    // Clear any existing timeout to prevent premature hiding
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }

    banner.textContent = message;
    // Reset classes, keep 'notification', add 'visible' and type-specific class
    banner.className = 'notification visible';
    if (type === 'error') {
        banner.classList.add('error');
    } else if (type === 'success') {
        banner.classList.add('success');
    } else {
        banner.classList.add('info'); // Default style
    }

    // Auto-hide after duration, if duration is positive
    if (duration > 0) {
        notificationTimeout = setTimeout(() => {
            hideNotification();
        }, duration);
    }

    // Allow clicking the banner to dismiss it immediately
    banner.onclick = hideNotification;
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