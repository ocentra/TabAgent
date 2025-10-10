# Changelog

## [1.0.0] - 2025-10-10

### Added
- Native messaging host application (`native_host.py`)
- Configuration file (`config.py`)
- Build scripts for Windows (`build.bat`, `setup.bat`)
- Registration scripts for Windows and Unix-like systems (`register_host.bat`, `register_host.sh`)
- Test scripts (`test_host.py`, `testExtensionConnection.ts`)
- TypeScript interfaces and utilities for native messaging (`NativeMessagingTypes.ts`, `nativeMessagingUtils.ts`)
- Extension adapter for native app connector (`NativeAppAdapter.ts`)
- Chrome API declarations (`chrome.d.ts`)
- Documentation (`docs/README.md`, `docs/native_app_connector.md`)
- Directory structure documentation (`DIRECTORY.md`)
- Package configuration (`package.json`)

### Features
- Chrome native messaging protocol implementation
- System information retrieval
- Secure command execution with whitelisting
- Cross-platform support (Windows, macOS, Linux)
- Message size and timeout limits for security
- Built-in logging for debugging
- Standalone executable generation with PyInstaller
- Integration with Tab Agent extension connector system