# Persistent Native Host Connection Architecture

## 🎯 **Problem Solved**

Previously, we were using **one-off native messaging** where:
- ❌ Each message started a new native host process
- ❌ Process started → processed message → exited immediately
- ❌ Expensive overhead (process startup/shutdown on every message)
- ❌ No connection state maintained
- ❌ Health server started/stopped repeatedly

## ✅ **New Solution: Persistent Connection**

Similar to how we manage VRAM/model worker connections, the native host now uses a **persistent port-based connection**:

- ✅ **Starts when extension loads** (`runtime.onStartup`, `runtime.onInstalled`)
- ✅ **Stays running** with an open port
- ✅ **Reuses same process** for all messages
- ✅ **Auto-reconnects** if disconnected
- ✅ **Stops when extension unloads** (clean shutdown)

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    Extension                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐         ┌──────────────────────┐ │
│  │  UI Components   │────────►│ IntegrationsController│ │
│  │  (Sidepanel)     │         │                      │ │
│  └──────────────────┘         └─────────┬────────────┘ │
│                                          │               │
│                                          │ browser.runtime│
│                                          │ .sendMessage  │
│                                          ▼               │
│  ┌──────────────────────────────────────────────────────┤
│  │        Background Script (background.ts)             │
│  │                                                       │
│  │    ┌──────────────────────────────────────────┐    │
│  │    │    NativeHostManager (Singleton)          │    │
│  │    │  - Persistent port connection             │    │
│  │    │  - Auto-reconnect logic                   │    │
│  │    │  - Message queue                          │    │
│  │    │  - Response handlers                      │    │
│  │    └───────────────┬───────────────────────────┘    │
│  │                    │ chrome.runtime.connectNative  │
│  └────────────────────┼───────────────────────────────┘
│                       │                                  │
│                       │ Port connection (persistent)     │
│                       ▼                                  │
└──────────────────────────────────────────────────────────┘
                        │
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│            Native Host Process                         │
│          (tabagent-host.exe)                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌───────────────────────────────────────────────┐  │
│  │  Main Loop (native_host.py)                   │  │
│  │  - Reads messages from stdin                   │  │
│  │  - Processes commands                          │  │
│  │  - Sends responses to stdout                   │  │
│  │  - Runs until port disconnects                 │  │
│  └───────────────────────────────────────────────┘  │
│                                                        │
│  ┌───────────────────────────────────────────────┐  │
│  │  Health Server (FastAPI on port 8765)         │  │
│  │  - Background daemon thread                    │  │
│  │  - HTTP API for diagnostics                    │  │
│  │  - Swagger UI for testing                      │  │
│  └───────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 📋 **Component Responsibilities**

### **1. NativeHostManager (`src/Controllers/NativeHostManager.ts`)**

**Purpose:** Manages persistent port connection to native host

**Features:**
- ✅ Singleton instance (one connection per extension)
- ✅ Auto-connects on extension startup
- ✅ Maintains persistent `chrome.runtime.connectNative()` port
- ✅ Message queue (queues messages when disconnected)
- ✅ Promise-based message sending with timeouts
- ✅ Auto-reconnect with exponential backoff
- ✅ Clean disconnection on extension unload

**API:**
```typescript
// Connect to native host
await nativeHostManager.connect();

// Send message (queues if not connected)
const response = await nativeHostManager.sendMessage({ action: 'get_system_info' });

// Check connection status
const { connected, reconnectAttempts, queuedMessages } = nativeHostManager.getStatus();

// Disconnect
nativeHostManager.disconnect();
```

---

### **2. Background Script Integration (`src/background.ts`)**

**Lifecycle Hooks:**
```typescript
// On extension install/update
browser.runtime.onInstalled.addListener(async () => {
    // ... other initialization
    const { nativeHostManager } = await import('./Controllers/NativeHostManager');
    await nativeHostManager.connect();
});

// On browser startup (extension already installed)
browser.runtime.onStartup.addListener(async () => {
    // ... other initialization
    const { nativeHostManager } = await import('./Controllers/NativeHostManager');
    await nativeHostManager.connect();
});

// Message router
browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'native_host_message') {
        // Route through persistent connection
        const response = await nativeHostManager.sendMessage(message.payload);
        sendResponse(response);
    }
});
```

---

### **3. IntegrationsController (`src/Controllers/IntegrationsController.ts`)**

**Updated Message Sending:**
```typescript
async function sendNativeMessage(message: any, timeoutMs: number = 5000): Promise<any> {
    try {
        // First, try persistent connection via background
        const response = await browser.runtime.sendMessage({
            type: 'native_host_message',
            payload: message,
            timeout: timeoutMs
        });
        return response;
    } catch (error) {
        // Fallback to one-off native messaging (legacy support)
        return legacyOneOffMessaging(message, timeoutMs);
    }
}
```

---

### **4. Native Host (`Server/native_host.py`)**

**Port-based Connection:**
```python
def main():
    # Start health server in background
    if HEALTH_SERVER_AVAILABLE:
        start_health_server_background()
    
    # Main loop - stays alive while port is open
    while True:
        message = get_message()  # Blocks until message received
        if not message:
            break  # Port closed, exit gracefully
        
        response = handle_message(message)
        send_message(response)
```

**Standalone Mode Detection:**
```python
if __name__ == '__main__':
    if sys.stdin.isatty():
        # Standalone mode (double-clicked or manual run)
        print("Native Host - Standalone Mode")
        start_health_server()
        while True:
            time.sleep(1)  # Keep alive
    else:
        # Native messaging mode (connected via extension)
        main()
```

---

## 🔄 **Connection Lifecycle**

### **Startup Flow**

```
1. Browser starts / Extension installed
           ↓
2. runtime.onStartup / runtime.onInstalled fires
           ↓
3. Background script imports NativeHostManager
           ↓
4. nativeHostManager.connect() called
           ↓
5. chrome.runtime.connectNative('com.tabagent.host') creates port
           ↓
6. Native host process starts
           ↓
7. Health server starts in daemon thread
           ↓
8. Native host waits for messages on stdin
           ↓
9. Port stays open ✅ (ready for messages)
```

### **Message Flow**

```
1. User clicks "Test Connection" in UI
           ↓
2. IntegrationsController.sendNativeMessage({ action: 'test' })
           ↓
3. browser.runtime.sendMessage({ type: 'native_host_message', payload: {...} })
           ↓
4. Background script receives message
           ↓
5. nativeHostManager.sendMessage(payload)
           ↓
6. port.postMessage(message) → native host stdin
           ↓
7. Native host processes message
           ↓
8. Native host writes response to stdout → port
           ↓
9. port.onMessage fires in NativeHostManager
           ↓
10. Promise resolves with response
           ↓
11. Response sent back to IntegrationsController
           ↓
12. UI updates ✅
```

### **Reconnection Flow**

```
1. Native host crashes or port disconnects
           ↓
2. port.onDisconnect fires
           ↓
3. nativeHostManager.handleDisconnect() called
           ↓
4. All pending messages rejected
           ↓
5. scheduleReconnect() with exponential backoff
           ↓
6. Wait 5s * reconnectAttempts
           ↓
7. nativeHostManager.connect() retries
           ↓
8. Success: Process queued messages
   Failure: Retry up to MAX_RECONNECT_ATTEMPTS (5)
```

### **Shutdown Flow**

```
1. Extension unloads / Browser closes
           ↓
2. beforeunload event fires
           ↓
3. nativeHostManager.disconnect() called
           ↓
4. port.disconnect() closes connection
           ↓
5. Native host stdin closes
           ↓
6. Native host main loop exits gracefully
           ↓
7. Process terminates ✅
```

---

## 🎁 **Benefits**

| Aspect | One-off Messaging | Persistent Connection |
|--------|-------------------|----------------------|
| **Startup overhead** | Every message (~200ms) | Once at extension load |
| **Process lifecycle** | Start → Message → Exit | Start → Stay alive → Exit on unload |
| **Health server** | Starts/stops repeatedly | Runs continuously |
| **Connection state** | None | Maintained with auto-reconnect |
| **Message queue** | N/A | Queues when disconnected |
| **Resource usage** | High (repeated spawning) | Low (single process) |
| **User experience** | Slow first message | Fast all messages |

---

## 🔧 **Configuration**

### **Constants (NativeHostManager.ts)**
```typescript
const NATIVE_HOST_NAME = 'com.tabagent.host';       // Manifest host name
const RECONNECT_DELAY_MS = 5000;                    // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 5;                   // Give up after 5 tries
```

### **Logging**
```typescript
import { LOG_NATIVE_APP } from './IntegrationsController';

// Enable native app logging
if (LOG_NATIVE_APP) console.log('[NativeHostManager] ...');
```

---

## 🧪 **Testing**

### **1. Test Persistent Connection**
```javascript
// In extension console
const { nativeHostManager } = await import('./Controllers/NativeHostManager.js');
await nativeHostManager.connect();
console.log(nativeHostManager.getStatus());
// { connected: true, reconnectAttempts: 0, queuedMessages: 0 }
```

### **2. Test Message Sending**
```javascript
const response = await nativeHostManager.sendMessage({ action: 'get_system_info' });
console.log(response);
```

### **3. Test Reconnection**
```powershell
# Kill native host process
Stop-Process -Name "tabagent-host"

# Extension will auto-reconnect in 5-25 seconds
```

### **4. Test Health Server**
```
http://localhost:8765/health
```

---

## 📝 **Backward Compatibility**

The system maintains **full backward compatibility**:

1. **Persistent connection** is tried first (new behavior)
2. **Falls back to one-off messaging** if persistent connection fails
3. **Native host still supports both modes**:
   - Port-based (persistent)
   - One-off `sendNativeMessage()`

---

## 🎉 **Summary**

This architecture provides:
- ✅ **Faster messaging** (no process startup overhead)
- ✅ **Better resource management** (single long-running process)
- ✅ **Improved reliability** (auto-reconnect, message queuing)
- ✅ **Consistent state** (health server always available)
- ✅ **Clean lifecycle** (starts with extension, stops with extension)
- ✅ **Similar to VRAM management** (familiar pattern)

The native host now behaves like a **persistent service** rather than a **on-demand script**, providing a much better user experience! 🚀


