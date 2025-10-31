/**
 * Native Host Connection Manager
 * Manages a persistent connection to the native host, similar to how we manage VRAM/model worker connections.
 * 
 * Connection Lifecycle:
 * 1. Starts when extension loads (runtime.onStartup)
 * 2. Maintains persistent port connection
 * 3. Auto-reconnects on disconnect
 * 4. Closes cleanly on extension unload
 */

import browser from 'webextension-polyfill';

// Logging constant (matches IntegrationsController)
const LOG_NATIVE_APP = false;  // DISABLED - Focus on backgroundModelManager only

const NATIVE_HOST_NAME = 'com.tabagent.host';
const RECONNECT_DELAY_MS = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

interface NativeHostPort {
    postMessage: (message: any) => void;
    onMessage: {
        addListener: (callback: (message: any) => void) => void;
    };
    onDisconnect: {
        addListener: (callback: () => void) => void;
    };
    disconnect: () => void;
}

interface ConnectionEvent {
    timestamp: number;
    type: 'connected' | 'disconnected' | 'reconnecting' | 'error';
    message: string;
}

interface ConnectionStatus {
    connected: boolean;
    connectedSince: number | null;
    uptime: number;
    reconnectAttempts: number;
    queuedMessages: number;
    messagesSent: number;
    messagesReceived: number;
    lastActivity: number | null;
    recentEvents: ConnectionEvent[];
}

class NativeHostManager {
    private port: NativeHostPort | null = null;
    private isConnected: boolean = false;
    private connectedSince: number | null = null;
    private reconnectAttempts: number = 0;
    private reconnectTimer: number | null = null;
    private messageQueue: any[] = [];
    private messageHandlers: Map<string, (response: any) => void> = new Map();
    private messageIdCounter: number = 0;
    private messagesSent: number = 0;
    private messagesReceived: number = 0;
    private lastActivity: number | null = null;
    private connectionEvents: ConnectionEvent[] = [];
    private readonly MAX_EVENTS = 20; // Keep last 20 events

    constructor() {
        if (LOG_NATIVE_APP) console.log('[NativeHostManager] Initialized');
        this.addEvent('disconnected', 'Manager initialized');
    }

    /**
     * Add a connection event to history
     */
    private addEvent(type: ConnectionEvent['type'], message: string): void {
        const event: ConnectionEvent = {
            timestamp: Date.now(),
            type,
            message
        };
        this.connectionEvents.push(event);
        
        // Keep only last MAX_EVENTS
        if (this.connectionEvents.length > this.MAX_EVENTS) {
            this.connectionEvents.shift();
        }
        
        // Notify listeners
        this.notifyStatusChange();
    }

    /**
     * Start the persistent connection to native host
     */
    public async connect(): Promise<boolean> {
        if (this.isConnected && this.port) {
            if (LOG_NATIVE_APP) console.log('[NativeHostManager] Already connected');
            return true;
        }

        try {
            // Detect browser type
            const isFirefox = typeof (window as any).browser !== 'undefined' 
                            && typeof (window as any).browser.runtime !== 'undefined'
                            && typeof (window as any).browser.runtime.getBrowserInfo === 'function';

            if (LOG_NATIVE_APP) console.log('[NativeHostManager] Connecting to native host...', { isFirefox });

            // Use appropriate API based on browser
            if (isFirefox) {
                // Firefox uses browser.runtime.connectNative
                this.port = (window as any).browser.runtime.connectNative(NATIVE_HOST_NAME) as NativeHostPort;
            } else {
                // Chromium-based browsers use chrome.runtime.connectNative
                this.port = (window as any).chrome.runtime.connectNative(NATIVE_HOST_NAME) as NativeHostPort;
            }

            if (!this.port) {
                throw new Error('Failed to create native port');
            }

            // Set up message listener
            this.port.onMessage.addListener((message: any) => {
                this.handleMessage(message);
            });

            // Set up disconnect listener
            this.port.onDisconnect.addListener(() => {
                this.handleDisconnect();
            });

            this.isConnected = true;
            this.connectedSince = Date.now();
            this.reconnectAttempts = 0;

            if (LOG_NATIVE_APP) console.log('[NativeHostManager] ✅ Connected to native host');
            this.addEvent('connected', 'Successfully connected to native host');

            // Process any queued messages
            this.processMessageQueue();

            // Send initial handshake
            await this.sendMessage({ action: 'handshake', source: 'extension' });

            return true;

        } catch (error: any) {
            if (LOG_NATIVE_APP) console.error('[NativeHostManager] ❌ Connection failed:', error);
            this.isConnected = false;
            this.connectedSince = null;
            this.port = null;

            this.addEvent('error', `Connection failed: ${error.message || 'Unknown error'}`);

            // Schedule reconnection attempt
            this.scheduleReconnect();

            return false;
        }
    }

    /**
     * Disconnect from native host
     */
    public disconnect(): void {
        if (LOG_NATIVE_APP) console.log('[NativeHostManager] Disconnecting...');

        // Clear reconnect timer
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // Disconnect port
        if (this.port) {
            try {
                this.port.disconnect();
            } catch (error) {
                if (LOG_NATIVE_APP) console.warn('[NativeHostManager] Error during disconnect:', error);
            }
            this.port = null;
        }

        this.isConnected = false;
        this.connectedSince = null;
        this.messageQueue = [];
        this.messageHandlers.clear();

        if (LOG_NATIVE_APP) console.log('[NativeHostManager] Disconnected');
        this.addEvent('disconnected', 'Manually disconnected');
    }

    /**
     * Send a message to the native host
     * Queues the message if not connected and returns a promise
     */
    public sendMessage(message: any, timeoutMs: number = 30000): Promise<any> {
        const messageId = `msg_${++this.messageIdCounter}_${Date.now()}`;
        const messageWithId = { ...message, messageId };

        return new Promise((resolve, reject) => {
            // Set timeout for response
            const timeoutId = setTimeout(() => {
                this.messageHandlers.delete(messageId);
                reject(new Error(`Native host message timeout after ${timeoutMs}ms`));
            }, timeoutMs);

            // Store handler
            this.messageHandlers.set(messageId, (response: any) => {
                clearTimeout(timeoutId);
                if (response.status === 'error') {
                    reject(new Error(response.message || 'Native host error'));
                } else {
                    resolve(response);
                }
            });

            // Send or queue
            if (this.isConnected && this.port) {
                try {
                    this.port.postMessage(messageWithId);
                    this.messagesSent++;
                    this.lastActivity = Date.now();
                    if (LOG_NATIVE_APP) console.log('[NativeHostManager] → Sent:', messageWithId.action || messageWithId.command);
                } catch (error) {
                    this.messageHandlers.delete(messageId);
                    clearTimeout(timeoutId);
                    this.addEvent('error', `Failed to send message: ${error}`);
                    reject(error);
                }
            } else {
                if (LOG_NATIVE_APP) console.log('[NativeHostManager] Queueing message (not connected):', messageWithId.action || messageWithId.command);
                this.messageQueue.push(messageWithId);
            }
        });
    }

    /**
     * Check if currently connected
     */
    public isActive(): boolean {
        return this.isConnected && this.port !== null;
    }

    /**
     * Get detailed connection status info
     */
    public getStatus(): ConnectionStatus {
        const now = Date.now();
        return {
            connected: this.isConnected,
            connectedSince: this.connectedSince,
            uptime: this.connectedSince ? now - this.connectedSince : 0,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            messagesSent: this.messagesSent,
            messagesReceived: this.messagesReceived,
            lastActivity: this.lastActivity,
            recentEvents: [...this.connectionEvents]
        };
    }

    /**
     * Notify listeners of status change (broadcast to UI)
     */
    private notifyStatusChange(): void {
        // Broadcast status change to all listeners via runtime messaging
        if (typeof browser !== 'undefined' && browser.runtime) {
            const status = this.getStatus();
            browser.runtime.sendMessage({
                type: 'native_host_status_update',
                payload: status
            }).catch(() => {
                // No listeners, that's okay
            });
        }
    }

    /**
     * Handle incoming messages from native host
     */
    private handleMessage(message: any): void {
        if (LOG_NATIVE_APP) console.log('[NativeHostManager] ← Received:', message);

        this.messagesReceived++;
        this.lastActivity = Date.now();

        // If message has a messageId, it's a response to a sent message
        if (message.messageId && this.messageHandlers.has(message.messageId)) {
            const handler = this.messageHandlers.get(message.messageId);
            this.messageHandlers.delete(message.messageId);
            handler!(message);
        } else {
            // Unsolicited message from native host (e.g., status update, notification)
            if (LOG_NATIVE_APP) console.log('[NativeHostManager] Unsolicited message:', message);
            // Could emit event here for other components to listen to
        }
    }

    /**
     * Handle disconnect event
     */
    private handleDisconnect(): void {
        if (LOG_NATIVE_APP) console.warn('[NativeHostManager] Port disconnected');

        // Check for error
        const isFirefox = typeof (window as any).browser !== 'undefined';
        const runtime = isFirefox ? (window as any).browser.runtime : (window as any).chrome.runtime;
        
        if (runtime.lastError) {
            if (LOG_NATIVE_APP) console.error('[NativeHostManager] Disconnect error:', runtime.lastError.message);
        }

        this.isConnected = false;
        this.connectedSince = null;
        this.port = null;

        this.addEvent('disconnected', runtime.lastError ? `Port disconnected: ${runtime.lastError.message}` : 'Port disconnected unexpectedly');

        // Reject all pending messages
        this.messageHandlers.forEach((handler, messageId) => {
            handler({ status: 'error', message: 'Native host disconnected' });
        });
        this.messageHandlers.clear();

        // Schedule reconnection attempt
        this.scheduleReconnect();
    }

    /**
     * Schedule a reconnection attempt
     */
    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            if (LOG_NATIVE_APP) console.error('[NativeHostManager] Max reconnection attempts reached. Giving up.');
            return;
        }

        if (this.reconnectTimer !== null) {
            return; // Already scheduled
        }

        this.reconnectAttempts++;
        const delay = RECONNECT_DELAY_MS * this.reconnectAttempts; // Exponential backoff

        if (LOG_NATIVE_APP) console.log(`[NativeHostManager] Scheduling reconnection attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);

        this.addEvent('reconnecting', `Reconnection attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} scheduled in ${delay/1000}s`);

        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            if (LOG_NATIVE_APP) console.log('[NativeHostManager] Attempting to reconnect...');
            this.addEvent('reconnecting', `Reconnecting now (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            this.connect();
        }, delay);
    }

    /**
     * Process any queued messages after reconnection
     */
    private processMessageQueue(): void {
        if (this.messageQueue.length === 0) return;

        if (LOG_NATIVE_APP) console.log(`[NativeHostManager] Processing ${this.messageQueue.length} queued messages...`);

        const queue = [...this.messageQueue];
        this.messageQueue = [];

        queue.forEach(message => {
            if (this.port) {
                try {
                    this.port.postMessage(message);
                } catch (error) {
                    if (LOG_NATIVE_APP) console.error('[NativeHostManager] Failed to send queued message:', error);
                    // Re-queue on failure
                    this.messageQueue.push(message);
                }
            }
        });
    }
}

// Singleton instance
export const nativeHostManager = new NativeHostManager();

// Auto-connect when module loads (background context)
if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime && (window as any).chrome.runtime.getBackgroundPage) {
    // We're in a background context
    nativeHostManager.connect().catch(error => {
        if (LOG_NATIVE_APP) console.error('[NativeHostManager] Auto-connect failed:', error);
    });
}

// Clean disconnect on extension unload
if (typeof self !== 'undefined') {
    self.addEventListener('beforeunload', () => {
        if (LOG_NATIVE_APP) console.log('[NativeHostManager] Extension unloading, disconnecting...');
        nativeHostManager.disconnect();
    });
}

export default nativeHostManager;

