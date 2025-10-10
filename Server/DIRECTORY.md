# Server Directory Structure

```
Server/
├── native_host.py          # Main native messaging host application
├── config.py               # Configuration file
├── requirements.txt        # Python dependencies
├── setup.bat               # Setup script for Windows
├── build.bat               # Build script for Windows
├── register_host.bat       # Registration script for Windows
├── register_host.sh        # Registration script for macOS/Linux
├── test_host.py            # Test script for the native host
├── testExtensionConnection.ts  # Test script for extension connection
├── NativeMessagingTypes.ts # TypeScript interfaces for native messaging
├── nativeMessagingUtils.ts # Utility functions for native messaging
├── nativeMessagingExample.ts # Example usage of native messaging
├── NativeAppAdapter.ts     # Extension adapter for native app
├── chrome.d.ts             # Chrome API declarations
├── package.json            # Package configuration
└── docs/
    ├── README.md           # General documentation
    └── native_app_connector.md  # Native app connector documentation
```

## File Descriptions

### Core Files
- **native_host.py**: The main application that handles communication with the Chrome extension
- **config.py**: Configuration settings for the native host
- **requirements.txt**: Lists Python dependencies (currently empty as we only use standard library)

### Scripts
- **setup.bat**: Sets up the Python virtual environment and installs dependencies
- **build.bat**: Builds a standalone executable using PyInstaller
- **register_host.bat**: Registers the native host with Chrome on Windows
- **register_host.sh**: Registers the native host with Chrome on macOS/Linux
- **test_host.py**: Simple test script to verify the native host is working

### Documentation
- **docs/README.md**: Detailed documentation about the native host