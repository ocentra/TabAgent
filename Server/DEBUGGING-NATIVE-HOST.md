# Debugging the Native Host (When It's a Compiled .exe with No UI)

## 🎯 **The Problem**

```
Native host is compiled .exe:
❌ No UI/terminal window
❌ Can't see if it's running
❌ Can't see what's happening
❌ Can't debug easily
❌ Extension says "not connected" - why?!
```

## 💡 **The Solution: Dual Debugging System**

### **Method 1: Log File** (Always Available)
- Native host writes to `native_host.log`
- Can check even if process crashed
- Persists across restarts
- No dependencies needed

### **Method 2: Health API Server** (When Running)
- FastAPI server on `http://localhost:8765`
- Can query even if native messaging broken!
- Shows real-time status
- Checks LM Studio too!

---

## 🚀 **Quick Debugging Workflow**

### **Step 1: Is the .exe running?**

**Windows:**
```powershell
# Check if process is running
Get-Process | Where-Object {$_.ProcessName -like "*tabagent*"}

# If running, you'll see:
# Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
# -------  ------    -----      -----     ------     --  -- -----------
#     123       5     1234      5678       0.12   1234   1 tabagent-host

# If NOT running → Exe crashed or not installed
```

**macOS/Linux:**
```bash
# Check if process is running
ps aux | grep tabagent-host

# If running, you'll see process details
# If NOT running → Binary not started or crashed
```

### **Step 2: Check the Health API**

**Open in browser:**
```
http://localhost:8765
```

**If accessible:**
- ✅ Native host is RUNNING!
- ✅ Can now check detailed status
- ✅ Can see why native messaging might fail

**If NOT accessible:**
- ❌ Native host not running
- ❌ Or crashed during startup
- ❌ Check log file (Step 3)

### **Step 3: Check the Log File**

**Location:**
```
Windows: %LOCALAPPDATA%\TabAgent\native_host.log
macOS:   ~/.local/share/TabAgent/native_host.log
Linux:   ~/.local/share/TabAgent/native_host.log
```

**View in terminal:**
```powershell
# Windows
notepad "$env:LOCALAPPDATA\TabAgent\native_host.log"

# Or watch in real-time
Get-Content "$env:LOCALAPPDATA\TabAgent\native_host.log" -Wait -Tail 20
```

```bash
# macOS/Linux
tail -f ~/.local/share/TabAgent/native_host.log
```

---

## 🔍 **Health API Endpoints**

### **GET `/health`** - Full Diagnostic Report

```bash
curl http://localhost:8765/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-11T14:23:45",
  "process": {
    "pid": 12345,
    "cpu_percent": 0.5,
    "memory_mb": 45.2,
    "threads": 3,
    "status": "running"
  },
  "native_messaging": {
    "running": true,
    "message_count": 42,
    "last_message": "ping",
    "last_message_time": "2025-10-11T14:23:44"
  },
  "logging": {
    "log_file": "native_host.log",
    "log_file_exists": true,
    "log_file_size_bytes": 15234,
    "last_log_lines": [...]
  }
}
```

### **GET `/lmstudio/check`** - LM Studio Status

```bash
curl http://localhost:8765/lmstudio/check
```

**Response:**
```json
{
  "status": "success",
  "installed": true,
  "running": true,
  "api_accessible": true,
  "path": "C:\\Users\\...\\LM Studio.exe",
  "api_url": "http://localhost:1234",
  "models": [
    {"id": "llama-2-7b-chat", "owned_by": "meta"},
    {"id": "mistral-7b-instruct", "owned_by": "mistralai"}
  ],
  "summary": "Installed: ✅, Running: ✅, API: ✅, Models: 2"
}
```

### **GET `/logs/tail/100`** - Last 100 Log Lines

```bash
curl http://localhost:8765/logs/tail/100
```

### **GET `/test-connection`** - Simple Alive Check

```bash
curl http://localhost:8765/test-connection
```

---

## 🎨 **Extension UI: Diagnostics Button**

### **When Connected:**

```
Integrations → Native Tab → (Connected) 
[🔄 Test Connection] [📄 View Logs] [🔍 Diagnostics]
```

**Click "🔍 Diagnostics"** and you get:

```
┌──────────────────────────────────────────────────┐
│ 🔍 Native Host Diagnostics                  ✕   │
│ Complete system check - 2025-10-11 14:23:45      │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ Health Server                              │ │
│ │ ✅ Accessible                              │ │
│ │ [View Details] → Full JSON response       │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ Native Messaging                           │ │
│ │ ✅ Connected - Version: 1.0.0              │ │
│ │ [View Details] → Message details          │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ LM Studio                                  │ │
│ │ ✅ Running & API accessible - 2 models     │ │
│ │ [View Details] → Model list               │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ 💡 Troubleshooting Tips                         │
│ Quick Actions:                                   │
│ [Open Health Dashboard] [View Logs] [Copy]      │
│                                                  │
│                          [🔄 Refresh] [Close]   │
└──────────────────────────────────────────────────┘
```

---

## 🔧 **Debugging Scenarios**

### **Scenario 1: "Native host not found" but exe IS running**

```
Process: ✅ Running (Task Manager shows it)
Health API: ✅ http://localhost:8765 works
Native Messaging: ❌ Extension can't connect
```

**Diagnosis:**
```
Problem: Native messaging misconfigured
- Registry key wrong/missing
- Manifest file incorrect
- Extension ID mismatch
```

**Debug:**
```powershell
# 1. Check health API
curl http://localhost:8765/health

# 2. Check registry
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabagent.host"

# 3. Check manifest file
type "%LOCALAPPDATA%\TabAgent\com.tabagent.host-chromium.json"

# 4. Verify extension ID matches
```

### **Scenario 2: "Timeout" but process running**

```
Process: ✅ Running
Health API: ✅ Works
Native Messaging: ❌ Timeout
```

**Diagnosis:**
```
Problem: Native messaging receiving but not responding
- Python error in message handler
- Message loop broken
- Crash on specific message type
```

**Debug:**
```
# 1. Check health API for errors
curl http://localhost:8765/health

# Look at "errors" array in response

# 2. Check logs via health API
curl http://localhost:8765/logs/tail/100

# 3. Or view in extension
Click "🔍 Diagnostics" → View Logs
```

### **Scenario 3: Process not running at all**

```
Process: ❌ Not running
Health API: ❌ Not accessible
Native Messaging: ❌ "Host not found"
```

**Diagnosis:**
```
Problem: Exe crashed on startup or not installed
```

**Debug:**
```
# 1. Check log file (might show crash reason)
notepad "%LOCALAPPDATA%\TabAgent\native_host.log"

# 2. Try running manually to see error
cd "%LOCALAPPDATA%\TabAgent"
.\tabagent-host.exe

# 3. Check Windows Event Viewer
eventvwr.msc → Windows Logs → Application
# Look for Python/Application errors
```

### **Scenario 4: LM Studio issues**

```
Native Host: ✅ Connected
LM Studio: ❌ Not working
```

**Debug via Health API:**
```bash
# Check LM Studio status
curl http://localhost:8765/lmstudio/check

# Response tells you:
{
  "installed": true/false,     ← Is LM Studio installed?
  "running": true/false,       ← Is process running?
  "api_accessible": true/false,← Can we connect to API?
  "models": [...]              ← What models are loaded?
}
```

**Or in Extension:**
```
Click "🔍 Diagnostics" button
See LM Studio section:
- ✅ Installed, Running, API accessible
- ⚠️ Installed but not running
- ❌ Not installed
```

---

## 📋 **Complete Debugging Checklist**

When native messaging fails:

```
☐ 1. Check if process running (Task Manager / ps aux)
     ├─ NOT running? → Check log file for crash
     └─ Running? → Continue to step 2

☐ 2. Check health API (http://localhost:8765)
     ├─ Accessible? → Native host is alive!
     │   └─ Check /health for detailed status
     └─ NOT accessible? → Process might be hung
         └─ Kill and restart

☐ 3. In extension, click "🔍 Diagnostics"
     ├─ Shows which parts work/fail
     ├─ Copy diagnostic report
     └─ Use for troubleshooting

☐ 4. Check browser console (F12)
     ├─ Look for [NATIVE] logs
     ├─ Browser type detected correctly?
     └─ What error message?

☐ 5. View logs (in extension or via API)
     ├─ Click "📄 View Logs" in extension
     ├─ Or: curl http://localhost:8765/logs/tail/100
     └─ Look for errors

☐ 6. Verify configuration
     ├─ Registry keys correct?
     ├─ Manifest file exists?
     ├─ Extension ID matches?
     └─ Exe path correct?
```

---

## 🎯 **The Clever Solution**

### **Your Question:**
> "How the fuck will we know if exe is running but not connecting?"

### **Our Answer:**

```
┌─────────────────────────────────────────────────┐
│  THREE-LAYER DEBUGGING SYSTEM                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Layer 1: Health API (http://localhost:8765)   │
│  ├─ If accessible → Exe is ALIVE!              │
│  ├─ Check /health → See detailed status        │
│  ├─ Check /lmstudio/check → LM Studio status   │
│  └─ Check /logs → Read log file via HTTP       │
│                                                  │
│  Layer 2: Log File (native_host.log)           │
│  ├─ Always written, even if exe crashes        │
│  ├─ Shows startup errors                       │
│  ├─ Shows all messages received/sent           │
│  └─ Can view via extension or terminal         │
│                                                  │
│  Layer 3: Extension Diagnostics Button         │
│  ├─ Tests all three: Health API, Native        │
│  │   Messaging, LM Studio                      │
│  ├─ Shows clear ✅/⚠️/❌ status                 │
│  ├─ Provides troubleshooting tips              │
│  └─ One-click diagnostic report                │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ **Even if native messaging broken**, can check via HTTP
- ✅ **Even if process crashes**, log file shows why
- ✅ **Even if no Python**, exe still writes logs
- ✅ **User-friendly UI** in extension for diagnostics
- ✅ **Can check LM Studio** separately

---

## 🎨 **How User Debugs Issues**

### **Extension shows "Not Connected":**

**User clicks:** "🔍 Diagnostics" button

**Extension checks:**
1. `http://localhost:8765/health` ← Is native host running?
2. Native messaging ping ← Can we communicate?
3. `http://localhost:8765/lmstudio/check` ← Is LM Studio ready?

**User sees clear report:**
```
Health Server: ✅ Accessible
Native Messaging: ❌ Failed - "Specified native messaging host not found"
LM Studio: ✅ Running & API accessible - 2 models

💡 Problem: Native messaging misconfigured
   → Registry key might be wrong
   → Try reinstalling
```

**User knows exactly what's wrong!**

---

## 📊 **API Endpoints Summary**

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `/` | Root info | List available endpoints |
| `/health` | Full diagnostics | Comprehensive status check |
| `/test-connection` | Quick alive check | Is server running? |
| `/logs` | All logs | Download full log file |
| `/logs/tail/N` | Last N lines | Quick log view |
| `/logs/download` | Download log file | Save logs for support |
| `/state` | Current state | Message counts, errors |
| `/lmstudio/check` | LM Studio status | Is LM Studio working? |
| `/lmstudio/models` | Loaded models | What models available? |

---

## 🎉 **Summary: Complete Debugging Solution**

### **When Native Messaging Fails:**

```
Extension UI:
Click "🔍 Diagnostics"
         ↓
Checks 3 things:
├─ Health API (HTTP) ← Works even if messaging broken!
├─ Native Messaging ← Shows exact error
└─ LM Studio ← Separate check

Shows clear status:
✅ Working
⚠️ Warning
❌ Failed

User knows exactly what's wrong!
```

### **Files Created:**

1. ✅ `Server/health_server.py` - FastAPI health check server
2. ✅ `Server/requirements.txt` - Added fastapi, uvicorn, psutil
3. ✅ `Server/native_host.py` - Integrated health server startup
4. ✅ `src/Controllers/IntegrationsController.ts` - Added diagnostics button & logic

### **How It Works:**

```
Native Host Starts (tabagent-host.exe)
         ↓
Starts Health API Server (background thread)
http://localhost:8765
         ↓
Main Loop (native messaging)
stdin → process → stdout
         ↓
All activity logged to native_host.log
         ↓
User can check status 3 ways:
1. Extension "Diagnostics" button
2. Browser: http://localhost:8765/health
3. Terminal: Read log file
```

---

## 🚀 **Ready to Use!**

Next steps:
1. Build native host with health server
2. Test diagnostics button in extension
3. Try health API endpoints
4. Simulate failures and debug them

**You can now debug a "black box" compiled .exe like a pro!** 🎯


