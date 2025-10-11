# Quick Testing Guide for Native Host

## 🚀 **Fastest Way to Test**

### **Step 1: Run Native Host**
```powershell
# From build directory
cd Server\dist
.\tabagent-host.exe

# OR from installed location
& "$env:LOCALAPPDATA\TabAgent\tabagent-host.exe"
```

**You'll see:** Console window appears (waiting for stdin) - That's normal!

### **Step 2: Open Swagger UI**
```
http://localhost:8765/docs
```

**You'll get:** Beautiful interactive API documentation! 🎉

### **Step 3: Try Endpoints**

Click "Try it out" on any endpoint in Swagger UI, or use these:

#### **Browser (Click these links):**
- http://localhost:8765/ - Root info
- http://localhost:8765/health - Full diagnostics
- http://localhost:8765/lmstudio/check - LM Studio status
- http://localhost:8765/logs/tail/50 - Last 50 log lines

#### **PowerShell Commands:**
```powershell
# Quick test
Invoke-RestMethod http://localhost:8765/test-connection

# Full health report (pretty printed)
Invoke-RestMethod http://localhost:8765/health | ConvertTo-Json -Depth 10

# Check LM Studio
Invoke-RestMethod http://localhost:8765/lmstudio/check

# View logs
Invoke-RestMethod http://localhost:8765/logs/tail/100
```

---

## 🧪 **Run Test Script**

We created an automated test script:

```powershell
cd Server
.\test-health-server.ps1
```

**Output:**
```
🧪 Tab Agent Health Server Test Script
=======================================

✅ Native host is running (PID: 12345)
⏳ Waiting for health server to start...

📡 Test 1: Basic Connection
✅ PASS: Health server is accessible
   Uptime: 5.2 seconds

🏥 Test 2: Full Health Check
✅ PASS: Health endpoint working
   Process PID: 12345
   Memory Usage: 45.2 MB
   CPU Usage: 0.5%
   Messages: 0

🤖 Test 3: LM Studio Detection
   Installed: ✅
   Running: ✅
   API Accessible: ✅
   Models Loaded: 2

📄 Test 4: Log File Access
✅ PASS: Can access logs
   Log file: C:\...\native_host.log
   Total lines: 42

=======================================
🎉 Health Server Test Complete!
```

---

## 📊 **What Each Endpoint Returns**

### **`GET /` - Root**
```json
{
  "service": "Tab Agent Native Host Health Check",
  "status": "running",
  "endpoints": ["/health", "/logs", "/lmstudio/check", ...]
}
```

### **`GET /health` - Full Diagnostics**
```json
{
  "status": "healthy",
  "process": {
    "pid": 12345,
    "cpu_percent": 0.5,
    "memory_mb": 45.2,
    "threads": 3
  },
  "native_messaging": {
    "running": true,
    "message_count": 42
  },
  "logging": {
    "log_file_exists": true,
    "last_log_lines": [...]
  }
}
```

### **`GET /lmstudio/check` - LM Studio**
```json
{
  "status": "success",
  "installed": true,
  "running": true,
  "api_accessible": true,
  "path": "C:\\Users\\...\\LM Studio.exe",
  "models": [
    {"id": "llama-2-7b", "owned_by": "meta"}
  ],
  "summary": "Installed: ✅, Running: ✅, API: ✅, Models: 1"
}
```

### **`GET /logs/tail/50` - Last 50 Logs**
```json
{
  "status": "success",
  "log_file": "C:\\..\\native_host.log",
  "lines": "2025-10-11 15:30:00 [INFO] ...\n...",
  "total_lines": 234
}
```

---

## 🎯 **Quick Troubleshooting**

### **If http://localhost:8765 doesn't work:**

**Check 1: Is native host running?**
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*tabagent*"}
```

**Check 2: Is port 8765 blocked?**
```powershell
netstat -an | findstr ":8765"
# Should see: TCP 127.0.0.1:8765 ... LISTENING
```

**Check 3: Check logs**
```powershell
Get-Content Server\native_host.log -Tail 20
# Look for "Starting health check server" or errors
```

**Check 4: Try rebuilding**
```powershell
cd Server
.\build.bat
```

---

## 🎨 **Swagger UI Features**

When you open `http://localhost:8765/docs`:

```
┌──────────────────────────────────────────────┐
│ Tab Agent Native Host Health Check v1.0.0   │
├──────────────────────────────────────────────┤
│                                              │
│ ▼ default                                   │
│   GET  /            Root endpoint           │
│       [Try it out] [Execute]                │
│                                              │
│   GET  /health      Health check            │
│       [Try it out] [Execute]                │
│                                              │
│   GET  /logs        Get all logs            │
│       [Try it out] [Execute]                │
│                                              │
│   GET  /logs/tail/{lines}  Get last N lines│
│       lines: [100] [Try it out]             │
│                                              │
│   GET  /lmstudio/check  LM Studio status   │
│       [Try it out] [Execute]                │
│                                              │
│  ... (all endpoints with Try it out!)      │
│                                              │
└──────────────────────────────────────────────┘
```

**Click "Try it out" → "Execute" → See response!**

---

## 💡 **Pro Tips**

### **Save Health Report:**
```powershell
# Save complete diagnostic report
Invoke-RestMethod http://localhost:8765/health | 
    ConvertTo-Json -Depth 10 | 
    Out-File "health-report-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').json"
```

### **Watch Logs in Real-Time:**
```powershell
# Refresh every 2 seconds
while ($true) {
    cls
    Invoke-RestMethod http://localhost:8765/logs/tail/20
    Start-Sleep 2
}
```

### **Check If Everything Works:**
```powershell
# One-liner to test all endpoints
@('/test-connection', '/health', '/lmstudio/check', '/logs/tail/10') | ForEach-Object {
    Write-Host "Testing $_..." -ForegroundColor Cyan
    try {
        Invoke-RestMethod "http://localhost:8765$_" | Out-Null
        Write-Host "✅ $_" -ForegroundColor Green
    } catch {
        Write-Host "❌ $_" -ForegroundColor Red
    }
}
```

---

## 🎉 **Summary**

### **Easiest Methods:**
1. **Browser:** Open `http://localhost:8765/docs` ← Best for exploration!
2. **PowerShell:** `Invoke-RestMethod http://localhost:8765/health`
3. **Test Script:** `.\test-health-server.ps1` ← Automated testing!

### **What You Can Check:**
- ✅ Is native host running?
- ✅ Memory/CPU usage
- ✅ Message count
- ✅ Log files
- ✅ LM Studio status
- ✅ LM Studio models
- ✅ Error history

### **All Without Python Installed!**
Everything is in the compiled `.exe` - users just run it! 🚀


