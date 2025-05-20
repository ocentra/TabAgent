let notificationTimeout: number | null;

/**
 * @param message - The notification message
 * @param type - The notification type
 * @param duration - Duration in ms
 */
export function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info', duration: number = 3000): void {
    console.log(`[Notification] ${type.toUpperCase()}: ${message} (Duration: ${duration}ms)`);
}

export function hideNotification(): void {
    const banner = document.getElementById('notification-banner') as HTMLElement | null;
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