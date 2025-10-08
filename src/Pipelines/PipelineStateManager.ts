/// <reference lib="dom" />
import browser from 'webextension-polyfill';

const prefix = '[PipelineStateManager]';

// Logging flags
const LOG_GENERAL = false;
const LOG_ERROR = true;

/**
 * State persistence interface
 */
export interface PersistentState {
  lastLoadedModel?: {
    repoId: string;
    quantPath: string;
    loadedAt: number;
  };
  lastChatSessionId?: string;
  lastActiveTabId?: number;
}

/**
 * PipelineStateManager - Manages persistent state for pipelines
 * Handles saving/loading model state, chat sessions, and active tabs
 */
export class PipelineStateManager {
  private static readonly STATE_STORAGE_KEY = 'tabagent_background_state';
  private static state: PersistentState = {};

  /**
   * Load persistent state from storage
   */
  static async loadState(): Promise<void> {
    return new Promise((resolve) => {
      try {
        browser.storage.local.get(this.STATE_STORAGE_KEY).then((result: any) => {
          if (result[this.STATE_STORAGE_KEY]) {
            this.state = result[this.STATE_STORAGE_KEY];
            if (LOG_GENERAL) {
              console.log(prefix, '📂 Loaded persistent state:', {
                lastLoadedModel: this.state.lastLoadedModel,
                lastChatSessionId: this.state.lastChatSessionId,
                lastActiveTabId: this.state.lastActiveTabId
              });
            }
          } else {
            this.state = {};
            if (LOG_GENERAL) {
              console.log(prefix, '📂 No persistent state found, starting fresh');
            }
          }
          resolve();
        }).catch((error: any) => {
          if (LOG_ERROR) {
            console.error(prefix, '❌ Failed to load persistent state:', error);
          }
          this.state = {};
          resolve();
        });
      } catch (error) {
        if (LOG_ERROR) {
          console.error(prefix, '❌ Error loading persistent state:', error);
        }
        this.state = {};
        resolve();
      }
    });
  }

  /**
   * Save persistent state to storage
   */
  static saveState(): void {
    try {
      if (LOG_GENERAL) {
        console.log(prefix, '💾 Saving persistent state:', {
          lastLoadedModel: this.state.lastLoadedModel,
          lastChatSessionId: this.state.lastChatSessionId,
          lastActiveTabId: this.state.lastActiveTabId
        });
      }

      // Store in memory and sync storage
      browser.storage.local.set({ [this.STATE_STORAGE_KEY]: this.state }).catch((error: any) => {
        if (LOG_ERROR) {
          console.error(prefix, '❌ Failed to save persistent state:', error);
        }
      });
    } catch (error) {
      if (LOG_ERROR) {
        console.error(prefix, '❌ Error saving persistent state:', error);
      }
    }
  }

  /**
   * Update last loaded model
   */
  static updateLastLoadedModel(repoId: string, quantPath: string): void {
    this.state.lastLoadedModel = {
      repoId,
      quantPath,
      loadedAt: Date.now()
    };
    this.saveState();
  }

  /**
   * Get last loaded model
   */
  static getLastLoadedModel(): { repoId: string; quantPath: string } | null {
    return this.state.lastLoadedModel || null;
  }

  /**
   * Update last chat session
   */
  static updateLastChatSession(sessionId: string): void {
    this.state.lastChatSessionId = sessionId;
    this.saveState();
  }

  /**
   * Get last chat session
   */
  static getLastChatSession(): string | null {
    return this.state.lastChatSessionId || null;
  }

  /**
   * Update last active tab
   */
  static updateLastActiveTab(tabId: number): void {
    this.state.lastActiveTabId = tabId;
    this.saveState();
  }

  /**
   * Get last active tab
   */
  static getLastActiveTab(): number | null {
    return this.state.lastActiveTabId || null;
  }

  /**
   * Get entire state (read-only copy)
   */
  static getState(): PersistentState {
    return { ...this.state };
  }

  /**
   * Clear all persistent state
   */
  static clearState(): void {
    this.state = {};
    browser.storage.local.remove(this.STATE_STORAGE_KEY).catch((error: any) => {
      if (LOG_ERROR) {
        console.error(prefix, '❌ Failed to clear persistent state:', error);
      }
    });
  }

  /**
   * Initialize state manager (loads state from storage)
   */
  static async initialize(): Promise<void> {
    await this.loadState();
    if (LOG_GENERAL) {
      console.log(prefix, '📂 State manager initialized');
    }
  }
}
