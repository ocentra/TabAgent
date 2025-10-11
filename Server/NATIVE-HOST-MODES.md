# Native Host Launch Modes

The Tab Agent native host supports **three different launch modes** depending on how it's started:

---

## 🎯 **Mode 1: Native Messaging Mode** (Extension → Native Host)

**How it starts:**
```
Extension calls chrome.runtime.sendNativeMessage()
           ↓
Browser automatically launches tabagent-host.exe
           ↓
Native host reads JSON from stdin
           ↓
Processes the message
           ↓
Sends JSON response to stdout
           ↓
Browser manages lifecycle (starts/stops per connection)
```

**Characteristics:**
- ✅ Managed by the browser
- ✅ Starts automatically when extension needs it
- ✅ Stops automatically when communication ends
- ✅ Health server runs in background (port 8765)
- ✅ Multiple instances can run (one per connection)
- ⚠️ Process is headless (no console window)

**User doesn't need to do anything** - the extension handles everything!

---

## 🎯 **Mode 2: Standalone Mode** (Double-Click or Manual Run)

**How it starts:**
```
User double-clicks tabagent-host.exe
           OR
User runs: .\dist\tabagent-host.exe
           ↓
Native host detects no stdin pipe (isatty() == True)
           ↓
Switches to standalone mode
           ↓
Shows console with instructions
           ↓
Starts health server
           ↓
Waits for Ctrl+C
```

**What you see:**
```
============================================================
Tab Agent Native Host - Standalone Mode
============================================================

The native host is running for testing/debugging.

Health Server: http://localhost:8765/docs
               http://localhost:8765/health

To use with extension, install the extension and it will
communicate via native messaging automatically.

Press Ctrl+C to stop...
============================================================
```

**Characteristics:**
- ✅ Shows console window with instructions
- ✅ Health server accessible at http://localhost:8765
- ✅ Perfect for testing/debugging
- ✅ Runs until you press Ctrl+C
- ✅ Logs to `native_host.log`
- ⚠️ Extension can't communicate with this instance (separate process)

**Use cases:**
- 🧪 Testing the health server
- 🔍 Debugging native host functionality
- 📊 Accessing Swagger UI for API exploration
- 📝 Checking logs in real-time

---

## 🎯 **Mode 3: Script-Managed Mode** (PowerShell Script)

**How it starts:**
```
User runs: .\start-native-host.ps1
           ↓
Script starts tabagent-host.exe in background job
           ↓
Health server starts
           ↓
Script runs automated tests
           ↓
Script monitors the process
           ↓
Waits for Ctrl+C
           ↓
Cleanup (stops process, removes job)
```

**What you see:**
```
[START] Tab Agent Native Host
==============================

[START] Starting native host...
   Path: E:\Desktop\TabAgent\Server\dist\tabagent-host.exe
[OK] Native host started (PID: 12345)

[WAIT] Waiting for health server to initialize...
[OK] Health server is running!

[LINKS] Quick Links:
   Swagger UI:  http://localhost:8765/docs
   Health API:  http://localhost:8765/health

[TEST] Running full test suite...

[TEST] Test 1: Basic Connection
[PASS] Health server is accessible
...

=======================================
[RUNNING] Press Ctrl+C to stop the native host
=======================================
```

**Characteristics:**
- ✅ Automated startup and testing
- ✅ Process monitoring
- ✅ Automatic cleanup on exit
- ✅ Shows test results
- ✅ Provides quick links
- ✅ Runs until you press Ctrl+C

**Use cases:**
- 🚀 Quick start for development
- 🧪 Running automated tests
- 🔍 Continuous testing during development
- 📊 Monitoring process health

---

## 📋 **Quick Reference**

| Mode | How to Launch | When to Use |
|------|--------------|-------------|
| **Native Messaging** | Extension does it | Normal user operation |
| **Standalone** | Double-click `.exe` | Quick manual testing |
| **Script-Managed** | `.\start-native-host.ps1` | Development/debugging |

---

## 🛠️ **Available Scripts**

### **Start and Monitor**
```powershell
cd Server
.\start-native-host.ps1
```
- Starts native host
- Runs tests
- Monitors process
- Press Ctrl+C to stop

### **Just Test (Expects Running)**
```powershell
cd Server
.\test-health-server.ps1
```
- Tests existing running instance
- Shows diagnostics
- Exits after tests

### **With Options**
```powershell
# Skip automated tests
.\start-native-host.ps1 -NoTest

# Run in foreground (blocking)
.\start-native-host.ps1 -Foreground
```

---

## 🔍 **How the Native Host Detects Mode**

The native host automatically detects which mode to use:

```python
if __name__ == '__main__':
    if sys.stdin.isatty():
        # stdin is a terminal (not a pipe)
        # → Standalone Mode
        print("Tab Agent Native Host - Standalone Mode")
        start_health_server()
        while True:
            time.sleep(1)  # Wait for Ctrl+C
    else:
        # stdin is a pipe (from browser)
        # → Native Messaging Mode
        main()  # Process native messages
```

**Windows:** Uses `msvcrt.kbhit()` and `sys.stdin.isatty()`
**Unix/macOS:** Uses `sys.stdin.isatty()`

---

## 🌐 **Health Server (All Modes)**

The health server runs in **all modes** on port **8765**:

### **Swagger UI**
```
http://localhost:8765/docs
```
Interactive API documentation!

### **Health Check**
```
GET http://localhost:8765/health
```

### **LM Studio Status**
```
GET http://localhost:8765/lmstudio/check
```

### **View Logs**
```
GET http://localhost:8765/logs/tail/50
```

---

## ❓ **FAQ**

### **Q: Can I run multiple instances?**
**A:** Yes! Each mode can run simultaneously:
- ✅ Extension's native messaging instance
- ✅ Your standalone instance (different port needed)
- ✅ Script-managed instance

### **Q: Will double-clicking interfere with the extension?**
**A:** No! They're separate processes. The standalone instance is for testing only.

### **Q: How do I stop the native host?**
- **Standalone Mode:** Press Ctrl+C in console
- **Script-Managed:** Press Ctrl+C in PowerShell
- **Native Messaging:** Extension manages it (stops automatically)

### **Q: Where are the logs?**
```
Server/native_host.log
```
Or via API: `http://localhost:8765/logs/tail/100`

### **Q: What if port 8765 is already in use?**
The health server will fail to start, but native messaging will still work. Check logs for details.

---

## 🎉 **Summary**

| Feature | Native Messaging | Standalone | Script-Managed |
|---------|-----------------|------------|----------------|
| **Started by** | Browser | User | PowerShell script |
| **Console visible** | No | Yes | Yes |
| **Health server** | ✅ | ✅ | ✅ |
| **Auto-stops** | ✅ | ❌ (Ctrl+C) | ❌ (Ctrl+C) |
| **Tests run** | ❌ | ❌ | ✅ |
| **Extension can use** | ✅ | ❌ | ❌* |
| **Best for** | Production | Quick test | Development |

\* *Extension uses its own instance via native messaging*


