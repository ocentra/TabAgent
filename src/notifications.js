

let notificationTimeout;

/**
 * @param {string} message 
 * @param {'info' | 'success' | 'error'} [type='info'] 
 * @param {number} [duration=4000] 
 */
export function showNotification(message, type = 'info', duration = 3000) {
    console.log(`[Notification] ${type.toUpperCase()}: ${message} (Duration: ${duration}ms)`);

}


export function hideNotification() {
    const banner = document.getElementById('notification-banner');
    if (banner) {
        banner.classList.remove('visible');
    }
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    if (banner) {
        banner.onclick = null;
    }
} 