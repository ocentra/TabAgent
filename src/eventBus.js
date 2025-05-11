import browser from 'webextension-polyfill';
import { DBEventNames, InternalEventBusMessageTypes, Contexts } from './events/eventNames.js';
import { DbGetReadyStateRequest, DbInitializeRequest } from './events/dbEvents.js';

export function isBackgroundContext() {
  return (typeof window === 'undefined') && (typeof self !== 'undefined') && !!self.registration;
}

function getContextName() {
  if (isBackgroundContext()) return Contexts.BACKGROUND;
  if (typeof window !== 'undefined' && window.EXTENSION_CONTEXT) return window.EXTENSION_CONTEXT;
  return Contexts.UNKNOWN; // Fallback
}

let dbInitPromise = null;

const broadcastableEventTypes = [
  DBEventNames.DB_MESSAGES_UPDATED_NOTIFICATION,
  DBEventNames.DB_STATUS_UPDATED_NOTIFICATION,
  DBEventNames.DB_SESSION_UPDATED_NOTIFICATION,
  DBEventNames.DB_INITIALIZATION_COMPLETE_NOTIFICATION
];

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
      if (eventListeners.length === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  dispatchToLocalListeners(eventName, data, context) {



    console.log(`[EventBus][${getContextName()}] : dispatchToLocalListeners -> Dispatching locally: ${eventName}`, data);
    const localListeners = this.listeners.get(eventName);
    const promises = [];
    if (localListeners && localListeners.length > 0) {
      try {
        const eventData = structuredClone(data);
        console.log(`[EventBus][${getContextName()}] : dispatchToLocalListeners -> Found ${localListeners.length} listeners for ${eventName}.`);
        localListeners.forEach(callback => {
          try {
            const result = callback(eventData);
            if (result && typeof result.then === 'function') {
              promises.push(result);
            }
          } catch (error) {
            console.error(`[EventBus][${getContextName()}] Error in local listener for ${eventName}:`, error);
            promises.push(Promise.reject(error));
          }
        });
      } catch (cloneError) {
        console.error(`[EventBus][${getContextName()}] Failed to structuredClone data for local dispatch of ${eventName}:`, cloneError, data);
        return Promise.reject(cloneError);
      }
    } else {
      console.log(`[EventBus][${getContextName()}] : dispatchToLocalListeners -> No local listeners for ${eventName}.`);
    }
    return Promise.all(promises);
  }

  async autoEnsureDbInitialized() {
    const context = getContextName();
    if (this.isDbInitInProgress) {
      return dbInitPromise;
    }
    if (!dbInitPromise) {
      this.isDbInitInProgress = true;
      console.info(`[EventBus][${context}] : autoEnsureDbInitialized -> Starting DB initialization...`);
      dbInitPromise = (async () => {
        try {
          const [response] = await this.publish(DbGetReadyStateRequest.type, new DbGetReadyStateRequest());
          if (response?.data?.ready) {
            console.info(`[EventBus][${context}] : autoEnsureDbInitialized -> DB is already ready.`);
            return true;
          }
          await this.publish(DbInitializeRequest.type, new DbInitializeRequest());
          for (let i = 0; i < 5; i++) {
            const [check] = await this.publish(DbGetReadyStateRequest.type, new DbGetReadyStateRequest());
            if (check?.data?.ready) {
              console.info(`[EventBus][${context}] : autoEnsureDbInitialized -> DB became ready after ${i+1} checks.`);
              return true;
            }
            await new Promise(res => setTimeout(res, 300));
          }
          console.error(`[EventBus][${context}] : autoEnsureDbInitialized -> Database failed to initialize after retries.`);
          throw new Error('Database failed to initialize');
        } catch (err) {
          console.error(`[EventBus][${context}] : autoEnsureDbInitialized -> Initialization failed:`, err);
          throw err;
        } finally {
          this.isDbInitInProgress = false;
        }
      })();
    }
    return dbInitPromise;
  }

  async publish(eventName, data, contextName = getContextName()) {
    const context = contextName;
    console.log(`[EventBus][${context}] : publish -> Event: ${eventName}`, data);
  

    if (!isBackgroundContext()) { // UI Context
      
      // background event broadcast, no need to forward
      if (eventName === InternalEventBusMessageTypes.BACKGROUND_EVENT_BROADCAST) {
        return Promise.resolve([]); 
      }
      
      // db event, forward to background
      if (Object.values(DBEventNames).includes(eventName)) {            
        console.log(`[EventBus][${context}] : publish -> Forwarding event to background: ${eventName}`);
        const resultFromBg = await browser.runtime.sendMessage({ type: eventName, payload: data , originalContext: context, crossContext: false});
        console.log(`[EventBus][${context}] : publish -> Received response from background for ${eventName}:`, resultFromBg);
        return resultFromBg;

      }

      // same context, dispatch locally
      if (getContextName() === context) {    
        return this.dispatchToLocalListeners(eventName, data, context);
      }

      // different context, forward to background

      if (getContextName() != context) {    
        console.log(`[EventBus][${context}] : publish -> Forwarding event to background: ${eventName}`);
        const resultFromBg = await browser.runtime.sendMessage({ type: eventName, payload: data , originalContext: context, crossContext: true});
        console.log(`[EventBus][${context}] : publish -> Received response from background for ${eventName}:`, resultFromBg);
        return resultFromBg;
      }



    } else { // Background Context
      if (broadcastableEventTypes.includes(eventName)) {
        console.log(`[EventBus][${context}] :: publish -> Event ${eventName} is broadcastable. Sending wrapper.`);
        const broadcastPayload = {
          type: InternalEventBusMessageTypes.BACKGROUND_EVENT_BROADCAST,
          payload: {
            eventName: eventName,
            data: structuredClone(data),
            originalContext: context,
            crossContext: false
          }
        };
        browser.runtime.sendMessage(broadcastPayload)
          .catch(error => {
            if (error.message.includes("Could not establish connection") ||
              error.message.includes("Receiving end does not exist") ||
              error.message.includes("The message port closed before a response was received")) {
              console.warn(`[EventBus][${context}] :publish Failed to broadcast ${eventName} to UI: No active receiver.`);
            } else {
              console.error(`[EventBus][${context}] : publish Error broadcasting event ${eventName}:`, error);
            }
          });
        console.log(`[EventBus][${context}] : publish -> Dispatching broadcastable event ${eventName} locally in background as well.`);
        return this.dispatchToLocalListeners(eventName, data, context);
      } else {
        console.log(`[EventBus][${context}] : : publish -> Event ${eventName} is not broadcastable. Dispatching locally in background.`);
        return this.dispatchToLocalListeners(eventName, data, context);
      }
    }
  }
}

export const eventBus = new EventBus();

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }
  const context = getContextName();

  if (message.type === InternalEventBusMessageTypes.BACKGROUND_EVENT_BROADCAST) {
    console.log(`[EventBus][${context}] : onMessage -> Received BACKGROUND_EVENT_BROADCAST. Original event: ${message.payload?.eventName}`);
    if (message.payload && broadcastableEventTypes.includes(message.payload.eventName)) {
      eventBus.dispatchToLocalListeners(message.payload.eventName, message.payload.data);
    } 
    return false; 
  }

  if (message.crossContext === true && !isBackgroundContext()) {
    eventBus.dispatchToLocalListeners(message.type, message.payload, message.originalContext);
    return false;
  }

  if (isBackgroundContext()) {
    if (message.crossContext === true && message.originalContext) {
      browser.runtime.sendMessage({
        type: message.type,
        payload: message.payload,
        originalContext: message.originalContext,
        crossContext: true
      });
      return false;
    }
    if (Object.values(DBEventNames).includes(message.type)) { 
      console.log(`[EventBus][${context}] : onMessage -> Received direct DBEvent (request): ${message.type}. Publishing to local BG eventBus.`);
      eventBus.publish(message.type, message.payload) 
        .then(result => {
            try {
                console.log(`[EventBus][${context}] : onMessage -> DBEvent ${message.type} processed. Sending response.`);
                sendResponse(structuredClone(result));
            } catch(e) {
                console.error(`[EventBus][${context}] :onMessage Failed to clone response for DBEvent ${message.type}:`, e);
                sendResponse({success: false, error: "Failed to clone response in background"});
            }
        })
        .catch(error => {
            console.error(`[EventBus][${context}] : onMessage Error processing DBEvent ${message.type}:`, error);
            sendResponse({ success: false, error: error.message });
        });
      return true; 
    }
  }

  console.log(`[EventBus][${context}] : onMessage -> Message type ${message.type} not handled by eventBus onMessage logic.`);
  return false; 
});