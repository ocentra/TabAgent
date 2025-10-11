# Tab Agent Logging & Debugging Guide

## 🔍 **Complete Logging System**

Tab Agent now has comprehensive logging for both extension and native host components.

---

## 📊 **Extension Logging**

### **Log Flags** (`src/Controllers/IntegrationsController.ts`)

```typescript
const LOG_GENERAL = false;       // General operations
const LOG_DEBUG = false;         // Detailed debug info
const LOG_ERROR = true;          // Errors only (always on)
const LOG_WARN = false;          // Warnings
const LOG_NATIVE_APP = true;     // 🆕 Native messaging specific
```

### **Native App Connection Logs**

When `LOG_NATIVE_APP = true`, you'll see:

```
[IntegrationsController] [NATIVE] Testing native host connection...
[IntegrationsController] [NATIVE] sendNativeMessage called with: {message: {action: 'ping'}, timeoutMs: 3000}
[IntegrationsController] [NATIVE] Detected browser type: chromium
[IntegrationsController] [NATIVE] Using Chromium API (callback-based)
[IntegrationsController] [NATIVE] Chromium response received: {status: 'success', response: 'pong', version: '1.0.0'}
[IntegrationsController] [NATIVE] Received response: {status: 'success', ...}
[IntegrationsController] [NATIVE] ✅ Successfully connected! Version: 1.0.0
[IntegrationsController] [NATIVE] Loading system information...
[IntegrationsController] [NATIVE] System info response: {...}
[IntegrationsController] [NATIVE] System info: {os: 'Windows', cpu: '...', ...}
[IntegrationsController] [NATIVE] ✅ System information loaded and displayed
```

### **Error Scenarios**

#### **Native Host Not Found:**
```
[IntegrationsController] [NATIVE] Testing native host connection...
[IntegrationsController] [NATIVE] sendNativeMessage called with: {action: 'ping'}
[IntegrationsController] [NATIVE] Detected browser type: chromium
[IntegrationsController] [NATIVE] Using Chromium API (callback-based)
[IntegrationsController] [NATIVE] Chromium error: Specified native messaging host not found
[IntegrationsController] [NATIVE] ❌ Connection failed: Error: Specified native messaging host not found
```

#### **Timeout:**
```
[IntegrationsController] [NATIVE] Testing native host connection...
[IntegrationsController] [NATIVE] sendNativeMessage called with: {action: 'ping'}
[IntegrationsController] [NATIVE] Detected browser type: chromium
[IntegrationsController] [NATIVE] Using Chromium API (callback-based)
[IntegrationsController] [NATIVE] Timeout after 3000ms
[IntegrationsController] [NATIVE] ❌ Connection failed: Error: Native messaging timeout
```

#### **Unsupported Browser:**
```
[IntegrationsController] [NATIVE] Testing native host connection...
[IntegrationsController] [NATIVE] sendNativeMessage called with: {action: 'ping'}
[IntegrationsController] [NATIVE] Detected browser type: unsupported
[IntegrationsController] [NATIVE] Unsupported browser!
[IntegrationsController] [NATIVE] ❌ Connection failed: Error: Native messaging not supported
```

---

## 📄 **Native Host Logging**

### **Log Configuration** (`Server/native_host.py`)

```python
class Config:
    LOG_LEVEL = "DEBUG"           # DEBUG | INFO | WARNING | ERROR
    LOG_FILE = "native_host.log"  # Log file location
```

### **Log File Location**

**When Running from Source:**
```
Server/native_host.log
```

**When Running as Executable:**
```
Windows: %LOCALAPPDATA%\TabAgent\native_host.log
macOS:   ~/.local/share/TabAgent/native_host.log
Linux:   ~/.local/share/TabAgent/native_host.log
```

### **Log Format**

```
2025-10-11 14:23:45,123 [INFO] Native host started
2025-10-11 14:23:46,456 [DEBUG] Received message: {'action': 'ping'}
2025-10-11 14:23:46,457 [DEBUG] Sending response: {'status': 'success', 'response': 'pong', 'version': '1.0.0'}
2025-10-11 14:23:47,789 [DEBUG] Received message: {'action': 'get_system_info'}
2025-10-11 14:23:47,890 [DEBUG] Sending response: {'status': 'success', 'data': {...}}
```

### **Log Levels**

- **DEBUG**: All messages, verbose details
- **INFO**: Important operations (startup, connections)
- **WARNING**: Potential issues
- **ERROR**: Failures and exceptions

---

## 🛠️ **Debugging Tools**

### **1. Extension Console Logs**

```typescript
// Enable native app logging
const LOG_NATIVE_APP = true;  // In IntegrationsController.ts
```

**View Logs:**
1. Open extension
2. Right-click → Inspect
3. Go to Console tab
4. Filter by `[NATIVE]`

### **2. Native Host Logs (View in Extension!)**

**New Feature:** Click "📄 View Logs" button in extension!

```
Integrations → Native Tab → (When Connected) → View Logs
```

**Features:**
- ✅ Shows last 500 lines
- ✅ Auto-scrolls to bottom
- ✅ Refresh button
- ✅ Copy to clipboard
- ✅ Shows log file path
- ✅ Beautiful syntax highlighting

### **3. Manual Log Access**

**Windows:**
```powershell
# View logs
notepad %LOCALAPPDATA%\TabAgent\native_host.log

# Or in PowerShell
Get-Content "$env:LOCALAPPDATA\TabAgent\native_host.log" -Tail 50

# Watch logs in real-time
Get-Content "$env:LOCALAPPDATA\TabAgent\native_host.log" -Wait -Tail 20
```

**macOS/Linux:**
```bash
# View logs
cat ~/.local/share/TabAgent/native_host.log

# Last 50 lines
tail -50 ~/.local/share/TabAgent/native_host.log

# Watch logs in real-time
tail -f ~/.local/share/TabAgent/native_host.log
```

---

## 🔧 **Common Debugging Scenarios**

### **Scenario 1: "Native host not found"**

**Extension Console:**
```
[IntegrationsController] [NATIVE] Detected browser type: chromium
[IntegrationsController] [NATIVE] Chromium error: Specified native messaging host not found
```

**Diagnosis:**
- ❌ Native host not installed
- ❌ Registry not configured
- ❌ Manifest file missing/incorrect

**Solution:**
1. Run installer: `install.ps1` or `TabAgent-Setup.msi`
2. Check registry: `reg query HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabagent.host`
3. Verify manifest exists and points to correct executable

### **Scenario 2: "Timeout"**

**Extension Console:**
```
[IntegrationsController] [NATIVE] Timeout after 3000ms
```

**Native Host Log:**
```
(empty or no recent entries)
```

**Diagnosis:**
- ❌ Native host not running
- ❌ Native host crashed on startup
- ❌ Permissions issue

**Solution:**
1. Check if process running: `tasklist | findstr tabagent-host`
2. Try running manually: `%LOCALAPPDATA%\TabAgent\tabagent-host.exe`
3. Check native host logs for errors
4. Verify Python dependencies (if running from source)

### **Scenario 3: "Connected but system info fails"**

**Extension Console:**
```
[IntegrationsController] [NATIVE] ✅ Successfully connected!
[IntegrationsController] [NATIVE] Loading system information...
[IntegrationsController] [NATIVE] ❌ Failed to load system information: ...
```

**Native Host Log:**
```
[ERROR] Error handling get_system_info: ...
```

**Diagnosis:**
- ⚠️ System info handler error
- ⚠️ Permission issue reading system info
- ⚠️ Missing dependencies

**Solution:**
1. View native host logs (click "View Logs" button)
2. Check for Python errors
3. Verify all imports work
4. Test manually: `python Server/native_host.py`

---

## 📋 **Log Analysis Checklist**

When debugging issues, check logs in this order:

### **Step 1: Extension Console**
```
✓ Is browser type detected correctly?
✓ Is sendNativeMessage called?
✓ Is there a timeout or error?
✓ Is response received?
```

### **Step 2: Native Host Logs**
```
✓ Did native host start?
✓ Did it receive the message?
✓ Did it send a response?
✓ Any Python errors?
```

### **Step 3: System Logs**
```
Windows: Event Viewer → Application Logs
macOS:   Console.app → System Logs
Linux:   journalctl or dmesg
```

---

## 🎯 **Testing Connection with Full Logging**

### **Enable All Logs:**

**Extension (`IntegrationsController.ts`):**
```typescript
const LOG_NATIVE_APP = true;  ✅
```

**Native Host (`config.py`):**
```python
LOG_LEVEL = "DEBUG"  ✅
```

### **Test Sequence:**

1. **Open Extension**
   - Check console: Should see initialization logs
   
2. **Go to Integrations → Native Tab**
   ```
   [IntegrationsController] [NATIVE] Testing native host connection...
   ```

3. **Connection Attempt**
   ```
   [IntegrationsController] [NATIVE] sendNativeMessage called...
   [IntegrationsController] [NATIVE] Detected browser type: chromium
   [IntegrationsController] [NATIVE] Using Chromium API...
   ```

4. **Success or Failure**
   ```
   Success: ✅ Successfully connected! Version: 1.0.0
   Failure: ❌ Connection failed: [reason]
   ```

5. **View Native Logs** (if connected)
   - Click "📄 View Logs" button
   - See all native host activity
   - Refresh to update
   - Copy for debugging

---

## 🚨 **Error Messages & Solutions**

| Error | Extension Log | Native Log | Solution |
|-------|--------------|------------|----------|
| **Not installed** | "Specified native messaging host not found" | (No logs) | Run installer |
| **Timeout** | "Timeout after 3000ms" | (Empty or old) | Check if running, restart |
| **Permission denied** | "Access denied" | "Permission error" | Run as admin, check file permissions |
| **Invalid response** | "Invalid response from native host" | "Error sending message" | Check native host code, update |
| **Unsupported browser** | "Native messaging not supported" | N/A | Use Chrome, Edge, Firefox, Opera, Brave, or Vivaldi |

---

## 🎨 **Log Viewer UI**

### **Features:**

```
┌──────────────────────────────────────────────────┐
│ 📄 Native Host Logs                         ✕   │
│ File: C:\...\TabAgent\native_host.log           │
│ (showing last 500 of 1,234 lines)               │
├──────────────────────────────────────────────────┤
│                                                  │
│ [2025-10-11 14:23:45] [INFO] Native host...     │
│ [2025-10-11 14:23:46] [DEBUG] Received...       │
│ [2025-10-11 14:23:46] [DEBUG] Sending...        │
│ [2025-10-11 14:23:47] [DEBUG] Received...       │
│ [2025-10-11 14:23:47] [DEBUG] Sending...        │
│                                                  │
│ (Auto-scrolls to bottom, green terminal theme)  │
│                                                  │
├──────────────────────────────────────────────────┤
│ [🔄 Refresh] [📋 Copy to Clipboard]    [Close] │
└──────────────────────────────────────────────────┘
```

**Actions:**
- **Refresh**: Fetch latest logs from native host
- **Copy**: Copy all displayed logs to clipboard
- **Close**: Close the modal

---

## 💡 **Best Practices**

### **For Development:**
```typescript
// Keep native app logging ON during development
const LOG_NATIVE_APP = true;

// This helps you see:
- Browser detection
- API calls
- Responses
- Errors
- Timing issues
```

### **For Production:**
```typescript
// Turn off verbose logging for users
const LOG_NATIVE_APP = false;
const LOG_DEBUG = false;

// Keep error logging for debugging
const LOG_ERROR = true;
```

### **For Debugging Issues:**
1. ✅ Enable `LOG_NATIVE_APP = true`
2. ✅ Reproduce the issue
3. ✅ Check extension console
4. ✅ Click "View Logs" button
5. ✅ Copy logs for support/GitHub issues

---

## 🎯 **Quick Debugging Commands**

### **Check if Native Host Running:**

**Windows:**
```powershell
# Check process
Get-Process | Where-Object {$_.ProcessName -like "*tabagent*"}

# Test manually
& "$env:LOCALAPPDATA\TabAgent\tabagent-host.exe"
```

**macOS/Linux:**
```bash
# Check process
ps aux | grep tabagent-host

# Test manually
~/.local/share/TabAgent/tabagent-host
```

### **View Logs:**

**From Extension:**
```
Integrations → Native → View Logs
```

**From Terminal:**
```powershell
# Windows - Watch logs
Get-Content "$env:LOCALAPPDATA\TabAgent\native_host.log" -Wait -Tail 20

# macOS/Linux - Watch logs
tail -f ~/.local/share/TabAgent/native_host.log
```

### **Test Native Messaging:**

**From Extension Console:**
```javascript
// Send test message
chrome.runtime.sendNativeMessage(
    'com.tabagent.host',
    { action: 'ping' },
    (response) => console.log('Response:', response)
);
```

---

## 📈 **What Gets Logged**

### **Extension Logs (Console):**

✅ **Native Connection:**
- Browser detection
- API selection (Firefox vs Chromium)
- Message sending
- Response receiving
- Connection status
- Errors and timeouts

✅ **System Information:**
- Request sending
- Response parsing
- UI updates
- Error handling

✅ **Log Viewing:**
- Log fetch requests
- Log display
- Refresh actions
- Copy actions

### **Native Host Logs (File):**

✅ **Startup:**
- Host startup time
- Configuration loaded
- PID (process ID)

✅ **Messages:**
- All received messages
- Message action/type
- Response sent
- Timing information

✅ **Errors:**
- Exception details
- Stack traces
- Error context

✅ **System Info:**
- Requested info
- Gathered data
- Any collection errors

---

## 🔒 **Privacy & Security**

### **What's Logged:**
- ✅ Message types (ping, get_system_info, etc.)
- ✅ Connection attempts
- ✅ Response statuses
- ✅ Error messages

### **What's NOT Logged:**
- ❌ User data
- ❌ Chat messages
- ❌ Personal information
- ❌ Sensitive content

**All logging is local-only.** Logs never leave your machine.

---

## 🎉 **Summary: Complete Debugging Solution**

### **Extension Side:**
```
✅ LOG_NATIVE_APP flag for native messaging
✅ Detailed console logs with prefixes
✅ Browser detection logging
✅ Error categorization
✅ Timing information
```

### **Native Host Side:**
```
✅ File-based logging (native_host.log)
✅ Configurable log levels
✅ Structured log format
✅ Error tracking
✅ Message history
```

### **User-Facing Tools:**
```
✅ "View Logs" button in extension
✅ Beautiful log viewer modal
✅ Refresh and copy functionality
✅ Auto-scroll to latest entries
✅ File path display
```

---

## 🚀 **How to Use**

### **Normal Usage:**
- Logs happen automatically in background
- Check console if curious
- Click "View Logs" to see native host activity

### **When Debugging:**
1. Enable `LOG_NATIVE_APP = true`
2. Reproduce issue
3. Check extension console
4. Click "View Logs" for native side
5. Copy logs if needed for support

### **When Reporting Issues:**
1. Enable logging
2. Reproduce issue
3. Screenshot extension console
4. Copy native host logs
5. Include in GitHub issue

---

**You now have complete visibility into both extension and native host operations!** 🔍✨
