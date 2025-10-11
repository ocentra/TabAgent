# Tab Agent Development Setup

One-time setup guide for Tab Agent development.

## 📋 Prerequisites

### Required for All Platforms
- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Python** 3.7+ ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))

### Platform-Specific Requirements

#### Windows
- **WiX Toolset** (for MSI building)
  ```powershell
  choco install wixtoolset
  ```
  Or download from: https://wixtoolset.org/releases/

#### macOS
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```

#### Linux
- **DEB build tools** (Debian/Ubuntu)
  ```bash
  sudo apt-get install dpkg-dev
  ```
  
- **RPM build tools** (Fedora/RedHat) - Optional
  ```bash
  sudo dnf install rpm-build
  ```

---

## 🚀 Quick Setup

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

# 4. Build everything
npm run build

# 5. Verify
npm run verify
```

---

## ⚠️ Platform-Specific Notes

### Windows MSI Building

**WiX Toolset is REQUIRED** for building MSI installers.

**Installation Options:**

1. **Chocolatey** (Recommended):
   ```powershell
   choco install wixtoolset
   ```

2. **Direct Download**:
   - Visit: https://wixtoolset.org/releases/
   - Download: WiX v3.11.2 or later
   - Install to default location

3. **Verify Installation**:
   ```powershell
   candle -?
   light -?
   # Should show WiX help
   ```

**Why No npm Package?**
- WiX npm packages are outdated (incompatible with Node.js 20+)
- Official WiX is more reliable
- GitHub Actions installs via choco automatically
- One-time install per developer machine

### macOS PKG Building

**Xcode Command Line Tools** provide `pkgbuild` and `productbuild`.

Already installed if you have Xcode. Otherwise:
```bash
xcode-select --install
```

### Linux Package Building

**DEB building** (Debian/Ubuntu):
```bash
# Usually pre-installed, verify:
dpkg-deb --version

# If not installed:
sudo apt-get install dpkg-dev
```

**RPM building** (Fedora/RedHat) - Optional:
```bash
sudo dnf install rpm-build
```

---

## 🔧 Troubleshooting

### "WiX not found" Error

**Problem**: `build-msi.bat` fails with "candle is not recognized"

**Solution**:
1. Install WiX Toolset (see above)
2. Restart terminal (refresh PATH)
3. Verify: `candle -?`
4. Try build again

### Python venv Issues

**Problem**: Build fails with Python module errors

**Solution**:
```bash
cd Server
# Delete old venv
rm -rf venv

# Re-run setup
setup.bat  # Or .sh
```

### Extension Won't Load

**Problem**: "Manifest file is invalid"

**Solution**:
```bash
# Rebuild extension
npm run build:extension

# Check manifest
cat TabAgentDist/Extension/manifest.json
```

---

## 💡 Development Tips

### Faster Iteration

**Extension-only changes:**
```bash
npm run build:extension
# Reload extension in browser (no need to rebuild native)
```

**Native-only changes:**
```bash
npm run build:native
# Re-run installer to update
```

### Skip Installer Build

If you're only testing and don't need the MSI/PKG:
```bash
npm run build:extension && npm run build:native
# Skip build:installer
```

### Manual Native Host Registration

For quick testing without running full installer:
```powershell
# See TECHNICAL.md "Native Host Testing (Without Install)"
```

---

## 🎯 Ready to Develop!

After setup:
1. ✅ All dependencies installed
2. ✅ Python venv ready
3. ✅ Platform tools installed
4. ✅ Can build everything

**Start coding!** 🚀

See [TECHNICAL.md](TECHNICAL.md) for architecture and detailed docs.

