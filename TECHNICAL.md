# Tab Agent Technical Documentation

Complete technical guide for developers, contributors, and advanced users.

## 📁 Project Structure

```
TabAgent/ (Private - Source Code)
├── src/                         # Extension source (TypeScript)
│   ├── background.ts
│   ├── sidepanel.ts
│   ├── Controllers/
│   ├── DB/
│   ├── Pipelines/
│   └── ...
├── Server/                      # Native host source (Python)
│   ├── native_host.py          # Main application
│   ├── config.py
│   ├── requirements.txt
│   ├── setup*.sh / setup.bat   # Developer setup
│   ├── build-tool/             # Build scripts
│   └── tests/                  # Unit tests
├── scripts/                     # Build automation (TypeScript)
├── TabAgentDist/                # Distribution repo (nested, public)
│   ├── Extension/              # Built extension
│   └── NativeApp/              # Installers + binaries
├── .github/workflows/
│   └── build-and-deploy.yml    # CI/CD pipeline
└── webpack.config.js           # Builds to TabAgentDist/Extension/
```

---

## 🔨 Build System

### Quick Commands

```bash
# Build everything
npm run build

# Individual builds
npm run build:extension    # Extension only
npm run build:native       # Native host only
npm run build:installer    # Installer package only

# Verification
npm run verify
```

### What Each Build Does

#### `build:extension`
1. Builds Tailwind CSS (`src/input.css` → `src/output.css`)
2. Cleans output directory
3. Runs webpack:
   - Compiles TypeScript → JavaScript
   - Bundles all modules
   - Copies assets (icons, models, etc.)
   - **Outputs to**: `TabAgentDist/Extension/`

#### `build:native`
1. Detects platform (Windows/macOS/Linux)
2. Checks if source files changed (smart rebuild)
3. Runs platform-specific build:
   - Windows: `Server/build-tool/build.bat`
   - macOS: `Server/build-tool/build-macos.sh`
   - Linux: `Server/build-tool/build-linux.sh`
4. **Outputs to**: `TabAgentDist/NativeApp/binaries/{platform}/`

#### `build:installer`
1. Detects platform
2. Verifies native binary exists
3. Builds platform installer:
   - Windows: MSI package (`TabAgent-Setup.msi`)
   - macOS: PKG package (`TabAgent-Setup.pkg`)
   - Linux: DEB package (`tabagent_1.0.0_amd64.deb`)
4. **Outputs to**: `TabAgentDist/NativeApp/installers/{platform}/`

---

## 🔄 Development Workflow

### First Time Setup

```bash
# 1. Clone repository
git clone https://github.com/ocentra/TabAgent.git
cd TabAgent

# 2. Install Node.js dependencies
npm install

# 3. Setup Python environment
cd Server
setup.bat        # Windows
./setup-macos.sh # macOS
./setup-linux.sh # Linux
cd ..
```

### Daily Development

```bash
# 1. Make changes to src/ or Server/

# 2. Build
npm run build:extension  # If only extension changed
# Or
npm run build           # Build everything

# 3. Test
# Load TabAgentDist/Extension/ as unpacked extension
# Run installer if testing native features

# 4. Verify
npm run verify
```

### Commit & Deploy

```bash
# Local commit (TabAgent repo)
git add .
git commit -m "Feature: ..."
git push origin master

# TabAgentDist is auto-deployed by GitHub Actions
# Or manually:
cd TabAgentDist
git add .
git commit -m "Auto-build from TabAgent@SHA"
git push
```

---

## 🚀 Installation System

### How Installation Works

#### **User Downloads Installer**
```
Method 1: Extension "Download" button
├─ Extension checks: /releases/latest
├─ If release exists → Downloads MSI/PKG/DEB
└─ If no release → Downloads install-gui.ps1 script

Method 2: Extension "Copy Command"
├─ Copies: irm .../install-gui.ps1 | iex
└─ User pastes in terminal

Method 3: Clone Repository
├─ git clone TabAgentDist
└─ Run installer from local repo
```

#### **Installer Execution**
```
1. Detect Context:
   ├─ Running from repo? → Use local binaries
   └─ Standalone? → Download from GitHub

2. Detect State:
   ├─ Already installed? → Update mode
   └─ Fresh system? → Installation mode

3. Install Files:
   Windows: %LOCALAPPDATA%\TabAgent\
   macOS:   ~/Library/Application Support/TabAgent/
   Linux:   ~/.local/share/tabagent/ (or /opt/tabagent/)
   
   ├─ Native/
   │   ├─ tabagent-host.exe (or binary)
   │   ├─ update.ps1/sh
   │   └─ uninstall.ps1/sh
   └─ Extension/
       └─ (all extension files)

4. Register with Browsers:
   Creates manifest:
   {
     "name": "com.tabagent.host",
     "path": "/full/path/to/tabagent-host.exe",
     "allowed_origins": [
       "chrome-extension://DEV_ID/",
       "chrome-extension://STORE_ID/"
     ]
   }
   
   Registers:
   Windows: HKCU\Software\{Browser}\NativeMessagingHosts\
   macOS:   ~/Library/Application Support/{Browser}/
   Linux:   ~/.config/{browser}/NativeMessagingHosts/

5. Check LM Studio:
   ├─ Installed? → Check API
   ├─ Not installed? → Guide user
   └─ Skip option available

6. Guide Extension Installation:
   ├─ Shows: Extension folder location
   ├─ Explains: Load unpacked process
   └─ Opens: Folder in explorer/finder
```

---

## 🔗 Native Messaging Connection

### How Extension Connects to Native Host

#### **Extension Side:**
```typescript
// Extension sends message
chrome.runtime.sendNativeMessage('com.tabagent.host', {
  action: 'ping'
}, (response) => {
  console.log('Connected!', response);
});
```

#### **Browser Side:**
```
1. Browser receives sendNativeMessage call
2. Looks up: "com.tabagent.host" in registry/config
3. Reads manifest file
4. Checks: Is extension ID in allowed_origins?
5. If yes:
   ├─ Launches native host executable
   ├─ Connects stdin/stdout
   └─ Routes messages
6. If no:
   └─ Error: "Access forbidden"
```

#### **Native Host Side:**
```python
# native_host.py
def main():
    while True:
        # Read message from stdin
        length = struct.unpack('I', sys.stdin.buffer.read(4))[0]
        message = sys.stdin.buffer.read(length).decode('utf-8')
        
        # Process message
        response = handle_message(json.loads(message))
        
        # Send response to stdout
        send_message(response)
```

### Persistent Connection

We use `NativeHostManager` to maintain a long-lived connection:

```typescript
// src/Controllers/NativeHostManager.ts
class NativeHostManager {
  private port: chrome.runtime.Port | null = null;
  
  connect() {
    this.port = chrome.runtime.connectNative('com.tabagent.host');
    this.port.onMessage.addListener(this.handleMessage);
    this.port.onDisconnect.addListener(this.handleDisconnect);
  }
  
  sendMessage(message: any): Promise<any> {
    return new Promise((resolve) => {
      const id = generateId();
      this.pendingMessages.set(id, resolve);
      this.port.postMessage({ id, ...message });
    });
  }
}

// Background script starts connection
browser.runtime.onStartup.addListener(() => {
  nativeHostManager.connect();
});
```

**Benefits:**
- ✅ Connection stays open (like WebSocket)
- ✅ Lower latency
- ✅ Auto-reconnect on failure
- ✅ Message queuing

---

## 🤖 LM Studio Integration

### Current Plan

**LM Studio** is our primary local AI backend.

#### **Installation Flow:**
```
1. Installer checks for LM Studio:
   ├─ Check: /Applications/LM Studio.app (macOS)
   ├─ Check: C:\Program Files\LM Studio\ (Windows)
   └─ Check: Process running

2. If not found:
   ├─ Show: "LM Studio enhances Tab Agent"
   ├─ Button: "Download LM Studio"
   ├─ Opens: https://lmstudio.ai/download
   └─ Skip option for advanced users

3. If found:
   ├─ Check: LM Studio API (http://localhost:1234/v1/models)
   ├─ Running? → ✅ Ready
   └─ Not running? → Prompt to start
```

#### **Communication:**
```typescript
// Extension → Native Host → LM Studio

Extension:
  └─ Sends message to native host

Native Host:
  └─ HTTP request to LM Studio API
     └─ POST http://localhost:1234/v1/chat/completions

LM Studio:
  └─ Responds with AI completion

Native Host:
  └─ Returns to extension

Extension:
  └─ Displays in UI
```

#### **Future Enhancements:**
- Direct integration using `lmstudio.js`
- Model management from extension
- Auto-start LM Studio
- Multi-model support
- Custom prompts and templates

---

## 🏗️ GitHub Actions Pipeline

### Workflow: `build-and-deploy.yml`

```
Trigger: Push to master

Phase 1: Build Extension & Binaries (Parallel)
├─ build-extension (ubuntu)
│   └─ npm run build → TabAgentDist/Extension/
│
└─ build-binaries (matrix: 3 OS)
    ├─ Windows runner → tabagent-host.exe
    ├─ macOS runner → tabagent-host
    └─ Linux runner → tabagent-host

Phase 2: Build Installers (Parallel)
├─ build-msi (windows) → TabAgent-Setup.msi
├─ build-pkg (macos) → TabAgent-Setup.pkg
├─ build-deb (ubuntu) → tabagent_1.0.0.deb
└─ build-rpm (ubuntu) → tabagent-1.0.0.rpm

Phase 3: Deploy
├─ Download all artifacts
├─ Copy to TabAgentDist repo
└─ Commit and push

Phase 4: Release (Only if tagged)
└─ Create GitHub Release with all installers
```

### Manual Release Process

```bash
# 1. Update version in package.json
npm version 1.0.1

# 2. Commit
git commit -am "Release v1.0.1"

# 3. Tag
git tag v1.0.1

# 4. Push
git push origin master
git push origin v1.0.1

# GitHub Actions creates release automatically
```

---

## 🔐 Security & Privacy Architecture

### Extension ID Management

**Development:**
- Extension ID: `fkkeoobeahalebjpbockfedlncckobjb` (from load unpacked)
- Hardcoded in installers

**Store Publication:**
```bash
# After Chrome Web Store assigns new ID:
cd TabAgentDist/NativeApp/dev-tools
./update-extension-id.ps1 -NewExtensionId "store-id"

# Updates all installer manifests to support BOTH:
allowed_origins: [
  "chrome-extension://fkkeoobeahalebjpbockfedlncckobjb/",  # Dev
  "chrome-extension://store-assigned-id/"                  # Store
]
```

### Native Messaging Security

**Browser Enforces:**
- ✅ Only allowed extension IDs can connect
- ✅ Manifest must specify exact exe path
- ✅ No cross-origin access
- ✅ User must install native host (can't be injected)

**Our Implementation:**
- ✅ Whitelist-based extension IDs
- ✅ Signed manifests (future: code signing)
- ✅ User-level installation (no admin)
- ✅ Easy uninstall

---

## 🧪 Testing

### Extension Testing
```bash
# 1. Build
npm run build:extension

# 2. Load in browser
chrome://extensions
└─ Enable Developer mode
└─ Load unpacked: TabAgentDist/Extension/

# 3. Test features
└─ Open side panel
└─ Try chat, summarization, etc.
```

### Native Host Testing (Without Install)
```powershell
# Quick test via manual registration
$manifest = @{
    name = "com.tabagent.host"
    path = "E:\Desktop\TabAgent\TabAgentDist\NativeApp\binaries\windows\tabagent-host.exe"
    allowed_origins = @("chrome-extension://fkkeoobeahalebjpbockfedlncckobjb/")
} | ConvertTo-Json

$manifestPath = "$env:TEMP\com.tabagent.host.json"
$manifest | Out-File $manifestPath -Encoding ASCII

New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.tabagent.host" -Force
Set-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.tabagent.host" -Name "(Default)" -Value $manifestPath

# Now extension can connect!
```

### Full Installation Testing
```bash
# 1. Build installer
npm run build:installer

# 2. Run installer
TabAgentDist\NativeApp\installers\windows\TabAgent-Setup.msi

# 3. Follow installation wizard

# 4. Test connection
Extension → Integrations → Native
└─ Should show: 📡 Connected ✅
```

---

## 📦 Distribution System

### TabAgentDist Repository

**Nested Repository Setup:**
```
TabAgent/TabAgentDist/  ← Separate git repo
├─ .git/                ← Its own git history
├─ Remote: https://github.com/ocentra/TabAgentDist.git
└─ Ignored by TabAgent repo (.gitignore)
```

**Why This Structure:**
- ✅ Source code stays private (TabAgent)
- ✅ Built files are public (TabAgentDist)
- ✅ Webpack outputs directly to TabAgentDist
- ✅ No manual copying needed
- ✅ Clean separation

### Release vs Alpha Mode

**Alpha Mode (Current):**
```
├─ No GitHub releases created
├─ Users clone TabAgentDist repo
├─ Users run installers from repo
└─ Extension downloads from raw GitHub files
```

**Production Mode (After Tagging):**
```
├─ GitHub releases created (v1.0.0, v1.0.1, etc.)
├─ Users download from releases page
├─ One-click installer downloads
└─ Extension downloads from release assets
```

**Smart Detection in Extension:**
```typescript
// Downloads from releases if available, raw files if not
try {
    const release = await fetch('.../releases/latest');
    if (release.ok) {
        downloadUrl = release.assets.find(a => a.name === 'TabAgent-Setup.msi');
    }
} catch {
    downloadUrl = 'https://raw.githubusercontent.com/.../install-gui.ps1';
}
```

---

## 🛠️ Platform-Specific Details

### Windows
- **Installer**: MSI (WiX Toolset)
- **Install Location**: `%LOCALAPPDATA%\TabAgent\`
- **Registration**: Windows Registry
- **Requirements**: WiX Toolset for building MSI

### macOS
- **Installer**: PKG (pkgbuild/productbuild)
- **Install Location**: `~/Library/Application Support/TabAgent/`
- **Registration**: JSON files in `~/Library/Application Support/{Browser}/`
- **Requirements**: Xcode Command Line Tools

### Linux
- **Installers**: DEB (Debian/Ubuntu) + RPM (RedHat/Fedora)
- **Install Location**: 
  - User: `~/.local/share/tabagent/`
  - System: `/opt/tabagent/`
- **Registration**: JSON files in `~/.config/{browser}/` or `~/.mozilla/`
- **Requirements**: dpkg-deb (DEB) or rpm-build (RPM)

---

## 🔌 Native Messaging Protocol

### Message Format

**Extension → Native Host:**
```json
{
  "action": "get_system_info",
  "data": {}
}
```

**Native Host → Extension:**
```json
{
  "success": true,
  "data": {
    "os": "Windows 10",
    "cpu": "Intel Core i7",
    "ram": "16GB"
  }
}
```

### Supported Actions

- `ping` - Test connectivity
- `get_system_info` - System information
- `get_version` - Native host version
- `get_logs` - Retrieve log files
- `execute_command` - Execute system commands (restricted)

### Adding New Actions

```python
# Server/native_host.py

def handle_custom_action(message):
    # Your custom logic
    return {"success": True, "result": "..."}

# Register handler
message_handlers['custom_action'] = handle_custom_action
```

---

## 📊 Update System

### Version Checking

**Extension Checks:**
```typescript
// Periodically check GitHub API
const release = await fetch('https://api.github.com/repos/ocentra/TabAgentDist/releases/latest');
const latestVersion = release.tag_name;
const currentVersion = manifest.version;

if (latestVersion > currentVersion) {
  // Show update notification
}
```

**Native Host Updates:**
```
Extension sends: { action: "update_self" }
↓
Native host runs: update.ps1 (or update.sh)
↓
Update script:
├─ Downloads new binary from GitHub
├─ Stops current process
├─ Replaces executable
├─ Updates .version file
└─ Restarts if needed
```

---

## 🧩 Extension Components

### Architecture

```
Background Script (background.ts)
├─ Service worker (always running)
├─ Manages: Native host connection
├─ Handles: Browser events
└─ Coordinates: All operations

Side Panel (sidepanel.ts)
├─ Main UI
├─ Controllers for each section
├─ Real-time updates
└─ User interactions

Content Scripts (content.ts)
├─ Page analysis
├─ Content extraction
└─ DOM manipulation

Database (DB/)
├─ IndexedDB wrapper
├─ Schemas for all data types
└─ Vector storage for embeddings
```

### Key Controllers

- `IntegrationsNativeTab.ts` - Native app connection UI
- `ConnectorsController.ts` - Cloud/email/dev tools integrations
- `NativeHostManager.ts` - Persistent native connection
- `UnifiedAttachmentController.ts` - File handling

---

## 🐛 Debugging

### Extension Debugging
```
1. Open browser console
2. Check service worker logs
3. Use LOG_* flags in code
4. Network tab for API calls
```

### Native Host Debugging
```
1. Check logs: %LOCALAPPDATA%\TabAgent\Native\native_host.log
2. Run manually: .\tabagent-host.exe (test stdin/stdout)
3. Use diagnostics in extension UI
```

### Build Debugging
```bash
# Verbose webpack build
npm run build:webpack -- --progress

# Check what files were copied
npm run verify

# Test individual components
npm run build:extension  # Extension only
npm run build:native     # Native only
```

---

## 📚 Additional Resources

- **Server README**: `Server/README.md` - Native host development
- **Scripts README**: `scripts/README.md` - Build system details
- **TODO**: `TODO.md` - Future improvements
- **Distribution**: `TabAgentDist/README.md` - User installation guide

---

## 🤝 Contributing

See main [README.md](README.md) for contribution guidelines.

For technical questions, open a [GitHub Discussion](https://github.com/ocentra/TabAgent/discussions).

---

**Last Updated:** October 2025

