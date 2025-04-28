class EventBus {
  constructor() {
    this.listeners = new Map();
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

  publish(eventName, data) {
    const listeners = this.listeners.get(eventName); // Get the specific listeners first
    if (listeners && listeners.length > 0) {
      try {
        const eventData = structuredClone(data); // Clone the data for this event
        // --> Log intent BEFORE loop <--
        console.log(`[EventBus] Publishing ${eventName}. Found ${listeners.length} listeners. Data to send:`, JSON.stringify(eventData));

        listeners.forEach((callback, index) => {
          try {
            // --> Log intent INSIDE loop for EACH listener <--
            console.log(`[EventBus] Calling listener #${index + 1} for ${eventName} with data:`, JSON.stringify(eventData));
            callback(eventData); // Pass the cloned data
          } catch (error) {
            // Log error for specific listener
            console.error(`[EventBus] Error in listener #${index + 1} for ${eventName}:`, error);
          }
        });
      } catch (cloneError) {
          console.error(`[EventBus] Failed to structuredClone data for event ${eventName}:`, cloneError, data);
      }
    } else {
        // Log if no listeners found
        console.log(`[EventBus] No listeners registered for event ${eventName}.`);
    }
  }
}

export const eventBus = new EventBus(); 