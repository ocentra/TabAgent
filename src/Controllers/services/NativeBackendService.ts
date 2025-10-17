/**
 * Native Backend Service
 * 
 * Core service for all native app communication.
 * Wraps NativeHostManager with type-safe operations.
 * 
 * Single Responsibility: Communication layer between extension and native app
 */

import { nativeHostManager } from '../NativeHostManager';
import { NativeActionType } from '../../types/native';
import type { 
  NativeRequest,
  NativeResponse,
  SystemInfo 
} from '../../types/native';

// Logging constants
const LOG_DEBUG = false;
const LOG_ERROR = true;
const prefix = '[NativeBackendService]';

export class NativeBackendService {
  private static instance: NativeBackendService;
  
  private constructor() {
    if (LOG_DEBUG) console.log(prefix, 'Initialized');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): NativeBackendService {
    if (!NativeBackendService.instance) {
      NativeBackendService.instance = new NativeBackendService();
    }
    return NativeBackendService.instance;
  }
  
  /**
   * Send message to native app (type-safe wrapper)
   */
  async sendMessage<T extends NativeResponse>(
    request: NativeRequest,
    timeoutMs?: number
  ): Promise<T> {
    try {
      const response = await nativeHostManager.sendMessage(request, timeoutMs);
      return response as T;
    } catch (error) {
      if (LOG_ERROR) console.error(prefix, 'Message failed:', error);
      throw error;
    }
  }
  
  /**
   * Connect to native app
   */
  async connect(): Promise<boolean> {
    try {
      return await nativeHostManager.connect();
    } catch (error) {
      if (LOG_ERROR) console.error(prefix, 'Connection failed:', error);
      return false;
    }
  }
  
  /**
   * Disconnect from native app
   */
  disconnect(): void {
    nativeHostManager.disconnect();
  }
  
  /**
   * Check if connected to native app
   */
  isConnected(): boolean {
    return nativeHostManager.getStatus().connected;
  }
  
  /**
   * Get connection status
   */
  getStatus() {
    return nativeHostManager.getStatus();
  }
  
  /**
   * Ping native app to test connection
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.sendMessage({
        action: NativeActionType.PING
      });
      return response.status === 'success';
    } catch {
      return false;
    }
  }
  
  /**
   * Get system information from native app
   */
  async getSystemInfo(): Promise<SystemInfo> {
    const response = await this.sendMessage({
      action: NativeActionType.GET_SYSTEM_INFO
    });
    
    if (response.status === 'error') {
      throw new Error(response.message || 'Failed to get system info');
    }
    
    return response as unknown as SystemInfo;
  }
}

// Export singleton instance
export const nativeBackendService = NativeBackendService.getInstance();

