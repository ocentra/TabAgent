// src/Controllers/adapters/NativeAppAdapter.ts
// Adapter for communicating with the native messaging host

import browser from 'webextension-polyfill';
import { BaseAdapter, FileContentAdapter } from './BaseAdapter';
import { FileItem } from '../FileBrowserDisplay';

// Native messaging host name
const HOST_NAME = 'com.tabagent.host';

// Message types for native messaging
interface NativeMessage {
  action: string;
  [key: string]: any;
}

interface NativeResponse {
  status: 'success' | 'error';
  message?: string;
  [key: string]: any;
}

export class NativeAppAdapter implements BaseAdapter, FileContentAdapter {
  private isConnected = false;
  private connectionTested = false;

  async fetchFiles(path: string): Promise<FileItem[]> {
    // For native app, we might want to show system information or available commands
    // This is a placeholder implementation
    return [{
      id: 'system-info',
      name: '🖥️ System Information',
      type: 'folder',
      mimeType: 'folder',
      size: 0,
      modifiedTime: new Date().toISOString(),
      path: 'system-info'
    }, {
      id: 'execute-command',
      name: '🔧 Execute Command',
      type: 'folder',
      mimeType: 'folder',
      size: 0,
      modifiedTime: new Date().toISOString(),
      path: 'execute-command'
    }];
  }

  isFolder(item: FileItem): boolean {
    return item.type === 'folder';
  }

  getFolderId(item: FileItem): string {
    return item.id;
  }

  clearCache(): void {
    // Clear any cached data
    this.isConnected = false;
    this.connectionTested = false;
  }

  // Test connection to the native host
  async testConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.sendMessage({ action: 'ping' });
      
      if (response.status === 'success') {
        this.isConnected = true;
        this.connectionTested = true;
        return { success: true, message: 'Connected successfully' };
      } else {
        return { success: false, message: response.message || 'Connection failed' };
      }
    } catch (error) {
      this.isConnected = false;
      this.connectionTested = true;
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get system information from the native host
  async getSystemInfo(): Promise<any> {
    if (!this.connectionTested) {
      const testResult = await this.testConnection();
      if (!testResult.success) {
        throw new Error(testResult.message || 'Not connected to native host');
      }
    }
    
    if (!this.isConnected) {
      throw new Error('Not connected to native host');
    }
    
    const response = await this.sendMessage({ action: 'get_system_info' });
    
    if (response.status === 'success') {
      return response;
    } else {
      throw new Error(response.message || 'Failed to get system info');
    }
  }

  // Execute a command through the native host
  async executeCommand(command: string): Promise<any> {
    if (!this.connectionTested) {
      const testResult = await this.testConnection();
      if (!testResult.success) {
        throw new Error(testResult.message || 'Not connected to native host');
      }
    }
    
    if (!this.isConnected) {
      throw new Error('Not connected to native host');
    }
    
    const response = await this.sendMessage({ 
      action: 'execute_command', 
      command: command 
    });
    
    if (response.status === 'success') {
      return response;
    } else {
      throw new Error(response.message || 'Failed to execute command');
    }
  }

  // Generic method to send messages to the native host
  private sendMessage(message: NativeMessage): Promise<NativeResponse> {
    return new Promise((resolve, reject) => {
      // Check if we're in an extension context with native messaging support
      if (typeof browser === 'undefined' || !browser.runtime || !browser.runtime.sendNativeMessage) {
        reject(new Error('Native messaging is not available in this context'));
        return;
      }

      browser.runtime.sendNativeMessage(
        HOST_NAME,
        message
      ).then((response: NativeResponse) => {
        resolve(response);
      }).catch((error: any) => {
        reject(new Error(error.message || 'Failed to send message to native host'));
      });
    });
  }

  // Implementation of FileContentAdapter interface
  async getFileContent(fileId: string, files: FileItem[]): Promise<File | Blob | null> {
    // For native app adapter, this would depend on the specific file type
    // This is a placeholder implementation
    console.warn('getFileContent not implemented for NativeAppAdapter');
    return null;
  }
}