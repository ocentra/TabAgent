# Tab Agent Build Scripts

Cross-platform build automation for Tab Agent extension and native app.

## 🚀 Quick Start

### Build Everything (Recommended)
```bash
npm run build
```
This builds:
1. ✅ Browser extension (TypeScript → JavaScript)
2. ✅ Native host (Python → Executable)
3. ✅ Platform installer (MSI/PKG/DEB)

### Individual Builds

```bash
npm run build:extension  # Extension only
npm run build:native     # Native host only
npm run build:installer  # Installer package only
```

### Verify Build
```bash
npm run verify
```

## 🎯 What Each Script Does

### `build-native.js`
- Detects your platform (Windows/macOS/Linux)
- Checks if source files changed
- Builds native host only if needed
- Outputs to: `TabAgentDist/NativeApp/binaries/[platform]/`

### `build-installer.js`
- Detects your platform
- Builds appropriate installer:
  - Windows: `TabAgent-Setup.msi`
  - macOS: `TabAgent-Setup.pkg`
  - Linux: `tabagent_1.0.0_amd64.deb`
- Checks for required tools (WiX, pkgbuild, dpkg)

### `verify-all.js`
- Verifies extension built correctly
- Verifies native host binaries present
- Verifies installer scripts exist
- Shows what's ready to test

## 📦 Complete Workflow

```bash
# 1. Initial setup (first time only)
cd Server
setup.bat  # Windows
# Or: ./setup-macos.sh / ./setup-linux.sh

# 2. Build everything
npm run build

# 3. Verify
npm run verify

# 4. Test installer
# Windows:
TabAgentDist\NativeApp\installers\windows\TabAgent-Setup.msi

# macOS:
open TabAgentDist/NativeApp/installers/macos/TabAgent-Setup.pkg

# Linux:
sudo dpkg -i TabAgentDist/NativeApp/installers/linux/tabagent_1.0.0_amd64.deb
```

## 🔧 Smart Features

### Change Detection
Native host build only runs if:
- Output doesn't exist
- Source files newer than output
- Saves time on extension-only changes

### Platform Detection
Automatically builds correct installer for your OS:
- Windows → MSI
- macOS → PKG
- Linux → DEB (RPM available via manual build)

### Dependency Checking
- Verifies WiX Toolset (Windows)
- Checks for pkgbuild (macOS)
- Checks for dpkg-deb (Linux)

## ⚠️ Requirements

### Windows
- Node.js 20+
- Python 3.7+ (for native host)
- WiX Toolset (for MSI): `choco install wixtoolset`

### macOS
- Node.js 20+
- Python 3.7+ (for native host)
- Xcode Command Line Tools (for PKG)

### Linux
- Node.js 20+
- Python 3.7+ (for native host)
- dpkg-deb (usually pre-installed)
- rpm-build (optional, for RPM packages)

## 🎯 Result

After `npm run build`, you'll have:
- ✅ Extension ready at: `TabAgentDist/Extension/`
- ✅ Native binary at: `TabAgentDist/NativeApp/binaries/[platform]/`
- ✅ Installer at: `TabAgentDist/NativeApp/installers/[platform]/`

Ready to test the complete installation experience!
