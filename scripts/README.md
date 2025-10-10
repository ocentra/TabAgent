# Build Scripts

This directory contains scripts to help with building and verifying the Tab Agent extension and native app.

## Extension Build Process

1. **Build the extension**:
   ```bash
   npm run build
   ```

2. **Verify the extension distribution**:
   ```bash
   npm run build:verify
   ```

The extension will be built and automatically copied to `../TabAgentDist/Extension`.

## Native App Build Process

1. **Build the native app for Windows**:
   ```bash
   cd Server
   build.bat
   ```

2. **Build the native app for macOS**:
   ```bash
   cd Server
   chmod +x build-macos.sh
   ./build-macos.sh
   ```

3. **Build the native app for Linux**:
   ```bash
   cd Server
   chmod +x build-linux.sh
   ./build-linux.sh
   ```

The native app executables will be automatically copied to `../TabAgentDist/NativeApp` after building.

## Verification Scripts

- `verify-extension-dist.bat` - Verifies that the extension has been built and copied to the correct location
- `verify-native-dist.bat` - Verifies that the native app has been built and copied to the correct location