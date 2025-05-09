import browser from 'webextension-polyfill';
import { DBEventNames } from './events/eventNames.js';
import { DbGetReadyStateRequest, DbInitializeRequest } from './events/dbEvents.js';

export function isDbEvent(eventName) {
  return Object.values(DBEventNames).includes(eventName);
}

export function isBackgroundContext() {
  return (typeof window === 'undefined') && (typeof self !== 'undefined') && !!self.registration;
}

function getContextName() {
  if (isBackgroundContext()) return 'Background';
  // You can add more checks here for popup, content script, etc.
  // For now, default to 'Sidepanel' for non-background
  return 'Sidepanel';
}

let dbInitPromise = null;

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.isDbInitInProgress = false;
  }

  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  unsubscribe(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const eventListeners = this.listeners.get(eventName);
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
      // Optional: Clean up the event name if no listeners remain
      if (eventListeners.length === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  async autoEnsureDbInitialized() {
    if (this.isDbInitInProgress) {
      console.warn('[EventBus][autoEnsureDbInitialized] Initialization already in progress, returning existing promise.');
      return dbInitPromise;
    }
    if (!dbInitPromise) {
      this.isDbInitInProgress = true;
      console.info('[EventBus][autoEnsureDbInitialized] Starting DB initialization...');
      dbInitPromise = (async () => {
        try {
          const [response] = await this.publish(DBEventNames.DB_GET_READY_STATE_REQUEST, new DbGetReadyStateRequest());
          if (response?.data?.ready) {
            console.info('[EventBus][autoEnsureDbInitialized] DB is already ready.');
            return true;
          }
          await this.publish(DBEventNames.INITIALIZE_REQUEST, new DbInitializeRequest());
          for (let i = 0; i < 5; i++) {
            const [check] = await this.publish(DBEventNames.DB_GET_READY_STATE_REQUEST, new DbGetReadyStateRequest());
            if (check?.data?.ready) {
              console.info(`[EventBus][autoEnsureDbInitialized] DB became ready after ${i+1} checks.`);
              return true;
            }
            await new Promise(res => setTimeout(res, 300));
          }
          console.error('[EventBus][autoEnsureDbInitialized] Database failed to initialize after retries.');
          throw new Error('Database failed to initialize');
        } catch (err) {
          console.error('[EventBus][autoEnsureDbInitialized] Initialization failed:', err);
          throw err;
        } finally {
          this.isDbInitInProgress = false;
        }
      })();
    }
    return dbInitPromise;
  }

  async publish(eventName, data) {
   
     console.log(`[EventBus][${getContextName()}] eventName`, eventName,'data:', data);

    if (isDbEvent(eventName) && !isBackgroundContext()) {
      console.log(`[EventBus][${getContextName()}] Forwarding DB event to background:`, eventName, data);
      const result = await browser.runtime.sendMessage({ type: eventName, payload: data });
      console.log(`[EventBus][${getContextName()}] Received response from background for`, eventName, result);
      return result;
    }
    if (isDbEvent(eventName) && isBackgroundContext()) {
      console.log(`[EventBus][${getContextName()}] Handling DB event locally:`, eventName, data);
    }
    const listeners = this.listeners.get(eventName);
    if (listeners && listeners.length > 0) {
      try {
        const eventData = structuredClone(data);
        console.log(`[EventBus] Publishing ${eventName}. Found ${listeners.length} listeners. Data to send:`, JSON.stringify(eventData));
        const results = await Promise.all(
          listeners.map((callback, index) => {
            try {
              console.log(`[EventBus] Calling listener #${index + 1} for ${eventName} with data:`, JSON.stringify(eventData));
              return callback(eventData);
            } catch (error) {
              console.error(`[EventBus] Error in listener #${index + 1} for ${eventName}:`, error);
              return undefined;
            }
          })
        );
        console.log('[EventBus] Returning results for', eventName, results);
        return results;
      } catch (cloneError) {
        console.error(`[EventBus] Failed to structuredClone data for event ${eventName}:`, cloneError, data);
        return Promise.reject(cloneError);
      }
    } else {
      console.log(`[EventBus] No listeners registered for event ${eventName}. Data:`, JSON.stringify(data));
      return Promise.resolve([]);
    }
  }
}

export const eventBus = new EventBus(); 