# Tab Agent Native App Connector - User Guide

## Overview

The Native App Connector allows the Tab Agent extension to communicate with a native host application installed on your system. This enables the extension to access system resources and execute commands that would otherwise be restricted by browser security policies.

## Prerequisites

1. Tab Agent extension installed in Chrome (extension ID: `fkkeoobeahalebjpbockfedlncckobjb`)
2. Python 3.7 or later installed on your system

## Installation

### Step 1: Build the Native Host Executable

1. Open a terminal/command prompt
2. Navigate to the Server directory:
   ```
   cd Server
   ```
3. Create a virtual environment:
   ```
   python -m venv venv
   ```
4. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
5. Install PyInstaller:
   ```
   pip install pyinstaller
   ```
6. Build the executable:
   ```
   pyinstaller --onefile --name tabagent-host native_host.py
   ```

### Step 2: Register the Native Host with Chrome

1. Run the registration script:
   - Windows: `register_host.bat`
   - macOS/Linux: `register_host.sh`

### Step 3: Verify Installation

The native host is now ready to use. You can test the connection from the extension:

1. Open Chrome
2. Navigate to the Tab Agent extension
3. Go to the Connectors page
4. Find the "Native Application" connector
5. Click "Connect" to test the connection

## Features

### System Information
Retrieve detailed information about your system:
- Operating system and version
- Architecture and processor details
- Python version

### Command Execution
Execute system commands securely:
- Run shell commands
- Access file system information
- Interact with system utilities

## Security

The native host implements several security measures:

1. **Command Whitelisting**: By default, all commands are allowed in development mode. In production, only whitelisting should be used.

2. **Message Size Limits**: Messages are limited to 1MB to prevent abuse.

3. **Timeout Protection**: Commands are terminated after 30 seconds to prevent hanging processes.

4. **Input Validation**: All messages are validated before processing.

## Troubleshooting

### Common Issues

1. **"Specified native messaging host not found"**
   - Run the registration script again
   - Verify the extension ID in the manifest file
   - Check that the registry entry exists (Windows) or manifest is in the correct location (macOS/Linux)

2. **No response from native host**
   - Check that the native host executable exists at the specified path
   - Verify the executable has proper permissions
   - Check the native host log file for errors

3. **"Attempting to use a disconnected port object"**
   - The native host process may have crashed
   - Check the native host log file for errors

### Debugging

1. Check the native host log file (native_host.log by default)
2. Use the test scripts to verify the native host is working:
   ```bash
   python test_host.py
   ```
3. Verify registry entries on Windows or manifest location on macOS/Linux

## Development

### Modifying the Native Host

1. Make changes to `native_host.py`
2. Rebuild the executable:
   ```bash
   pyinstaller --onefile --name tabagent-host native_host.py
   ```

### Adding New Message Types

1. Add a new handler function in `native_host.py`
2. Register the handler in the `handlers` dictionary in the `main()` function
3. Update the TypeScript interfaces in `NativeMessagingTypes.ts`
4. Add corresponding methods in `NativeAppAdapter.ts`

## Support

For issues or questions, please refer to the documentation in the `docs` folder or contact support.