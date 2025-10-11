# Complete Extension → Native App Flow

## 🚀 **Startup Sequence**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Extension Loads (Browser starts / Extension installed)   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Background Script (background.ts)                        │
│    - runtime.onInstalled / runtime.onStartup fires          │
│    - Import NativeHostManager                               │
│    - await nativeHostManager.connect()                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. NativeHostManager.connect()                              │
│    - chrome.runtime.connectNative('com.tabagent.host')     │
│    - Creates persistent port connection                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──── SUCCESS ───┐
                   │                 │
                   │                 ▼
                   │    ┌─────────────────────────────────────┐
                   │    │ 4a. Native Host Starts              │
                   │    │     - Process starts automatically  │
                   │    │     - Health server starts (8765)   │
                   │    │     - Waits for messages on stdin   │
                   │    │     - Port stays open ✅            │
                   │    └──────────────┬──────────────────────┘
                   │                   │
                   │                   ▼
                   │    ┌─────────────────────────────────────┐
                   │    │ 5a. Background receives success     │
                   │    │     - isConnected = true            │
                   │    │     - connectedSince = now          │
                   │    │     - Broadcast status update       │
                   │    └─────────────────────────────────────┘
                   │
                   └──── FAILURE ───┐
                                    │
                                    ▼
                       ┌─────────────────────────────────────┐
                       │ 4b. Native Host Not Found           │
                       │     - Connection fails               │
                       │     - Add 'error' event to log      │
                       │     - Schedule reconnect attempt     │
                       └─────────────────────────────────────┘
```

---

## 📺 **UI Initialization (Sidepanel Opens)**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Opens Sidepanel                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Sidepanel Loads (sidepanel.ts)                          │
│    - Initializes all controllers                            │
│    - IntegrationsController.init()                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User Clicks "Native" Tab                                 │
│    - createNativeContent() renders UI                       │
│    - setupNativeAppManagement() called                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. setupNativeAppManagement()                               │
│    ✅ Setup message listener for 'native_host_status_update'│
│    ✅ Call updateNativeConnectionStatus() (initial check)   │
│    ✅ Start auto-refresh (every 5 seconds)                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. updateNativeConnectionStatus()                           │
│    - browser.runtime.sendMessage({                          │
│        type: 'get_native_host_status'                       │
│      })                                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Background Receives Request                              │
│    - type === 'get_native_host_status'                      │
│    - nativeHostManager.getStatus()                          │
│    - sendResponse(status)                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. UI Receives Status                                       │
│    {                                                         │
│      connected: true/false,                                 │
│      connectedSince: timestamp,                             │
│      uptime: milliseconds,                                  │
│      reconnectAttempts: 0-5,                                │
│      messagesSent: count,                                   │
│      messagesReceived: count,                               │
│      recentEvents: [...]                                    │
│    }                                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──── IF CONNECTED ──┐
                   │                     │
                   │                     ▼
                   │      ┌────────────────────────────────────┐
                   │      │ Show Connected UI                  │
                   │      │ ✅ Status icon                     │
                   │      │ 📊 Connected since + uptime        │
                   │      │ 📈 Messages sent/received         │
                   │      │ 📋 Recent activity log            │
                   │      │ 🟢 Hide install section           │
                   │      │ 🎯 Show: System Info              │
                   │      │ 🎯 Show: Test Connection btn      │
                   │      │ 🎯 Show: View Logs btn            │
                   │      │ 🎯 Show: Diagnostics btn          │
                   │      └────────────────────────────────────┘
                   │
                   └──── IF NOT CONNECTED ──┐
                                             │
                                             ▼
                                  ┌────────────────────────────────────┐
                                  │ Show Not Connected UI              │
                                  │ ❌ Status icon                     │
                                  │ 📋 Last disconnect reason          │
                                  │ 🟢 Show install section           │
                                  │ 📥 Download Installer btn         │
                                  │ 📋 Copy Command btn               │
                                  │ 📖 Installation instructions      │
                                  │ 🔗 GitHub repo links              │
                                  └────────────────────────────────────┘
```

---

## 🔄 **Real-Time Status Updates**

### **Method 1: Polling (Every 5 seconds)**
```
UI (IntegrationsController)
    │
    │ setInterval (every 5s)
    ▼
browser.runtime.sendMessage({ type: 'get_native_host_status' })
    │
    ▼
Background (background.ts)
    │
    │ nativeHostManager.getStatus()
    ▼
Returns current status
    │
    ▼
UI updates display
```

### **Method 2: Broadcast (On Change)**
```
NativeHostManager
    │
    │ Connection change detected
    │ (connected / disconnected / reconnecting / error)
    ▼
notifyStatusChange()
    │
    │ browser.runtime.sendMessage({
    │   type: 'native_host_status_update',
    │   payload: status
    │ })
    ▼
All listening UIs receive update immediately
    │
    ▼
updateUIWithStatus(status)
```

---

## 💬 **Message Communication Flow**

### **User Clicks "Test Connection"**

```
1. UI: Test Connection button clicked
   ▼
2. UI: await testNativeConnection()
   ▼
3. UI: await sendNativeMessage({ action: 'ping' })
   ▼
4. UI: browser.runtime.sendMessage({
         type: 'native_host_message',
         payload: { action: 'ping' }
       })
   ▼
5. Background: Receives 'native_host_message'
   ▼
6. Background: nativeHostManager.sendMessage(payload)
   ▼
7. NativeHostManager: port.postMessage({ action: 'ping', messageId: 'msg_1_...' })
   ▼
8. Native Host: Receives on stdin
   ▼
9. Native Host: Processes { action: 'ping' }
   ▼
10. Native Host: Writes to stdout { status: 'success', pong: true, messageId: 'msg_1_...' }
    ▼
11. NativeHostManager: port.onMessage fires
    ▼
12. NativeHostManager: Resolves promise with response
    ▼
13. Background: sendResponse(response)
    ▼
14. UI: Receives { status: 'success', pong: true }
    ▼
15. UI: Updates status icon ✅ "Connected"
```

---

## 🔍 **LM Studio Detection Flow**

### **When Connected**

```
1. UI shows "Connected" status
   ▼
2. UI: await loadSystemInformation()
   ▼
3. UI: sendNativeMessage({ action: 'get_system_info' })
   ▼
4. Native Host: Receives 'get_system_info'
   ▼
5. Native Host: Calls internal system_info handler
   ▼
6. Native Host: Checks LM Studio:
   - Windows: Check "C:\Users\{user}\AppData\Local\Programs\LM Studio\LM Studio.exe"
   - Mac: Check "/Applications/LM Studio.app"
   - Linux: Check common paths
   ▼
7. Native Host: Check LM Studio API (http://localhost:1234)
   ▼
8. Native Host: Returns:
   {
     status: 'success',
     system: {
       os: 'Windows',
       ram: '16 GB',
       vram: '8 GB (NVIDIA RTX 3070)',
       ...
     },
     lmstudio: {
       installed: true/false,
       running: true/false,
       api_accessible: true/false,
       models: [...]
     }
   }
   ▼
9. UI: Displays system info + LM Studio status
   - ✅ LM Studio Installed & Running
   - 📊 2 models loaded
   - 🌐 API accessible at localhost:1234
```

---

## 🩺 **Debugging Flow**

### **User Clicks "Diagnostics"**

```
1. UI: Diagnostics button clicked
   ▼
2. UI: await runDiagnostics()
   ▼
3. UI: Performs multiple checks in parallel:

   Check 1: Native Messaging Test
   ├─► sendNativeMessage({ action: 'ping' })
   └─► Result: ✅ Native messaging working

   Check 2: Health Server Test
   ├─► fetch('http://localhost:8765/test-connection')
   └─► Result: ✅ Health server accessible

   Check 3: Health API Detailed Check
   ├─► fetch('http://localhost:8765/health')
   └─► Result: {
         process: { pid, cpu, memory },
         native_messaging: { running, message_count },
         logging: { log_file_exists, last_log_lines }
       }

   Check 4: LM Studio Check
   ├─► fetch('http://localhost:8765/lmstudio/check')
   └─► Result: {
         installed: true,
         running: true,
         api_accessible: true,
         models: [...]
       }

   Check 5: Log File Access
   ├─► fetch('http://localhost:8765/logs/tail/50')
   └─► Result: Last 50 log lines

   ▼
4. UI: showDiagnosticsModal(results)
   ▼
5. UI: Displays comprehensive diagnostic report:
   ┌────────────────────────────────────┐
   │ 🩺 Diagnostics Report              │
   ├────────────────────────────────────┤
   │ ✅ Native Messaging: OK            │
   │ ✅ Health Server: OK (port 8765)   │
   │ ✅ Process: PID 12345, CPU 2%      │
   │ ✅ Memory: 51.2 MB                 │
   │ ✅ LM Studio: Installed & Running  │
   │ ⚠️  Models: 0 loaded               │
   │ ✅ Logs: Accessible                │
   ├────────────────────────────────────┤
   │ 💡 Recommendations:                │
   │ - Load a model in LM Studio       │
   └────────────────────────────────────┘
```

---

## 🔄 **Auto-Reconnect Flow**

### **When Native Host Disconnects**

```
1. Native Host process crashes or port disconnects
   ▼
2. NativeHostManager: port.onDisconnect fires
   ▼
3. NativeHostManager: handleDisconnect()
   - isConnected = false
   - connectedSince = null
   - Add 'disconnected' event
   - Reject pending messages
   ▼
4. NativeHostManager: scheduleReconnect()
   - reconnectAttempts++ (1/5)
   - delay = 5000ms * attempts (5s, 10s, 15s, 20s, 25s)
   - Add 'reconnecting' event
   - Set timeout
   ▼
5. Background: Broadcasts 'native_host_status_update'
   payload: { connected: false, reconnectAttempts: 1, ... }
   ▼
6. UI: Receives broadcast
   - Status icon changes to 🔄
   - Text: "Reconnecting... (1/5)"
   - Shows last disconnect reason
   ▼
7. After delay (5s): NativeHostManager: connect()
   ▼
8a. SUCCESS:
    - isConnected = true
    - reconnectAttempts = 0
    - Add 'connected' event
    - Broadcast success
    - Process queued messages
    - UI shows ✅ "Connected"

8b. FAILURE:
    - Schedule next attempt (2/5) with 10s delay
    - Repeat until success or max attempts (5)

8c. MAX ATTEMPTS REACHED:
    - Stop reconnecting
    - Add 'error' event: "Max reconnection attempts reached"
    - UI shows ❌ "Not Connected"
    - User must manually trigger reconnect or restart extension
```

---

## 📊 **Activity Log Flow**

### **Event Tracking**

Every significant action creates an event:

```javascript
Event Types:
- 'connected': Successfully connected
- 'disconnected': Port disconnected
- 'reconnecting': Attempting to reconnect
- 'error': Connection error occurred

Event Object:
{
  timestamp: 1697123456789,
  type: 'connected',
  message: 'Successfully connected to native host'
}
```

### **UI Display**

```
Activity Log (Max 10 events, newest first):

🟢 3:45:02 PM  Successfully connected to native host
🟡 3:44:58 PM  Reconnecting now (attempt 2/5)...
🟡 3:44:53 PM  Reconnection attempt 2/5 scheduled in 10s
🔴 3:44:48 PM  Port disconnected unexpectedly
🟢 3:42:15 PM  Successfully connected to native host
🟡 3:42:10 PM  Reconnecting now (attempt 1/5)...
⚠️  3:42:05 PM  Connection failed: Native host not found
```

---

## 🎯 **Complete State Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    DISCONNECTED                              │
│                                                              │
│  • Status: ❌ Not Connected                                 │
│  • UI: Shows install section                                │
│  • Actions: Download / Copy command                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Extension starts / User installs native app
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONNECTING                                │
│                                                              │
│  • Status: ⏳ Checking connection...                        │
│  • UI: Shows loading state                                  │
│  • Background: Attempting connection                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    SUCCESS               FAILURE
         │                   │
         ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│    CONNECTED     │  │   RECONNECTING   │
│                  │  │                  │
│  ✅ Connected    │  │  🔄 Reconnecting │
│  📊 Uptime       │  │  (1-5 attempts)  │
│  📈 Stats        │  │  Exponential     │
│  📋 Activity     │  │  backoff         │
│  🎯 Features     │  │                  │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         │                     │ After max attempts
         │                     ▼
         │            ┌──────────────────┐
         │            │  FAILED          │
         │            │                  │
         │            │  ❌ Connection   │
         │            │     failed       │
         │            │  Max attempts    │
         │            │  reached         │
         │            └──────────────────┘
         │
         │ Port disconnects
         └────────────────────────────────────► RECONNECTING
```

---

## 🎉 **Summary**

### **Startup:**
1. ✅ Extension loads → Background connects to native host
2. ✅ Native host starts automatically (if installed)
3. ✅ Health server starts on port 8765
4. ✅ Persistent connection established

### **UI Flow:**
1. ✅ User opens "Native" tab
2. ✅ Immediate status check
3. ✅ Auto-refresh every 5 seconds
4. ✅ Real-time broadcasts on connection changes

### **Connected State:**
1. ✅ Shows: Uptime, stats, activity log
2. ✅ Actions: Test connection, view logs, diagnostics
3. ✅ LM Studio status and model info
4. ✅ System information

### **Not Connected State:**
1. ✅ Shows: Install instructions
2. ✅ Actions: Download installer, copy command
3. ✅ Transparency: GitHub repo links
4. ✅ Auto-reconnect if previously connected

### **Debugging:**
1. ✅ Native messaging test
2. ✅ Health server API (localhost:8765)
3. ✅ Swagger UI (localhost:8765/docs)
4. ✅ Log file access
5. ✅ LM Studio detection
6. ✅ Comprehensive diagnostics

**The complete flow provides a seamless, transparent, and debuggable experience!** 🚀


