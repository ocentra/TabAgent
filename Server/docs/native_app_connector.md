# Native Application Connector Documentation

## Overview

The Native Application connector allows the Tab Agent extension to communicate with a native host application installed on the user's system. This enables the extension to access system resources and execute commands that would otherwise be restricted by browser security policies.

## Architecture

The connector uses Chrome's Native Messaging API to establish communication between the extension and the native host:

```
[Tab Agent Extension] ↔ [Chrome Native Messaging] ↔ [Tab Agent Native Host] ↔ [System Resources]
```

## Components

### 1. Native Host Application (`native_host.py`)

A Python application that runs on the user's system and handles requests from the extension.

Key features:
- Implements Chrome's native messaging protocol
- Handles system information requests
- Executes system commands (with security restrictions)
- Cross-platform support (Windows, macOS, Linux)

### 2. Extension Adapter (`NativeAppAdapter.ts`)

A TypeScript class that implements the BaseAdapter interface to communicate with the native host.

### 3. Connector Configuration

A built-in connector configuration that appears in the Connectors UI.

## Installation

### Prerequisites

1. Python 3.7 or later installed on the system
2. Tab Agent extension installed in Chrome

### Steps

1. **Build the Native Host Executable**
   ```bash
   cd Server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install pyinstaller
   pyinstaller --onefile --name tabagent-host native_host.py
   ```

2. **Register the Native Host with Chrome**
   - Windows: Run `register_host.bat`
   - macOS/Linux: Run `register_host.sh`

3. **Verify Installation**
   - Open the Tab Agent extension
   - Navigate to the Connectors page
   - Find the "Native Application" connector
   - Click "Connect" to test the connection

## Security

The native host implements several security measures:

1. **Command Whitelisting**: By default, all commands are allowed in development mode. In production, only whitelisted commands should be allowed.

2. **Message Size Limits**: Messages are limited to 1MB to prevent abuse.

3. **Timeout Protection**: Commands are terminated after 30 seconds to prevent hanging processes.

4. **Input Validation**: All messages are validated before processing.

## Usage

### From the Extension UI

1. Navigate to the Connectors page
2. Find the "Native Application" section
3. Click the "Connect" button next to "Native Application"
4. If the native host is properly installed and registered, you should see a success message

### From Extension Code

```typescript
import { getAdapter } from '../Controllers/adapters/AdapterRegistry';
import { ConnectorType } from '../DB/idbConnectors';

// Get the native app adapter
const adapter = getAdapter('native-app' as ConnectorType);

if (adapter) {
    // Test connection
    const testResult = await adapter.testConnection();
    
    if (testResult.success) {
        // Get system information
        const systemInfo = await adapter.getSystemInfo();
        console.log('System info:', systemInfo);
        
        // Execute a command (with restrictions)
        const commandResult = await adapter.executeCommand('echo Hello World');
        console.log('Command result:', commandResult);
    }
}
```

## Development

### Modifying the Native Host

1. Make changes to `native_host.py`
2. Rebuild the executable:
   ```bash
   pyinstaller --onefile --name tabagent-host native_host.py
   ```
3. The new executable will be in the `dist` folder

### Adding New Message Types

1. Add a new handler function in `native_host.py`
2. Register the handler in the `handlers` dictionary in the `main()` function
3. Update the TypeScript interfaces in `NativeMessagingTypes.ts`
4. Add corresponding methods in `NativeAppAdapter.ts`

### Testing

1. Use the built-in test script:
   ```bash
   python test_host.py
   ```

2. Test from the extension context:
   - Load the extension in Chrome
   - Open the background page or content script console
   - Run the test functions

## Troubleshooting

### Common Issues

1. **"Specified native messaging host not found"**
   - Ensure the native host is properly registered
   - Check that the manifest file is in the correct location
   - Verify the extension ID matches in the native host manifest

2. **No response from native host**
   - Check that the native host executable exists at the specified path
   - Verify the executable has proper permissions
   - Check the native host log file for errors

3. **"Attempting to use a disconnected port object"**
   - The native host process may have crashed
   - Check the native host log file for errors

### Debugging

1. Check the native host log file (native_host.log by default)
2. Use the test_host.py script to verify the native host is working:
   ```bash
   python test_host.py
   ```
3. Verify registry entries on Windows or manifest location on macOS/Linux

## Future Enhancements

1. **Enhanced Security**: Implement cryptographic signing of messages
2. **Extended Functionality**: Add file system access, process management, etc.
3. **Configuration UI**: Create a settings page for the native host
4. **Auto-update**: Implement automatic updating of the native host