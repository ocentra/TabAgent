# Integration Guide: Connecting Extension to Native Host

This guide explains how to integrate the Chrome extension with the native messaging host.

## Overview

The native messaging API allows extensions to exchange messages with native applications. This enables the extension to access system resources that would otherwise be unavailable due to Chrome's security restrictions.

## Extension Integration

### 1. Update manifest.json

Add the `nativeMessaging` permission to your extension's [manifest.json](../manifest.json):

```json
{
  "permissions": [
    "nativeMessaging"
  ]
}
```

### 2. Sending Messages to Native Host

Use `chrome.runtime.sendNativeMessage` to communicate with the native host:

```javascript
// Send a message to the native host
chrome.runtime.sendNativeMessage(
  'com.tabagent.host',  // Native host name
  { action: 'ping' },   // Message payload
  (response) => {       // Response callback
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      return;
    }
    console.log('Response:', response);
  }
);
```

### 3. Supported Message Types

The native host supports these message actions:

- `ping`: Test connectivity
- `get_system_info`: Retrieve system information
- `execute_command`: Execute a system command (restricted)

Example messages:

```javascript
// Ping test
{ action: 'ping' }

// Get system information
{ action: 'get_system_info' }

// Execute a command
{ action: 'execute_command', command: 'echo Hello World' }
```

## Response Format

All responses from the native host follow this format:

```json
{
  "status": "success|error",
  "message": "Additional information (for errors)",
  "data": {}
}
```

### Success Response Examples

```json
// Ping response
{
  "status": "success",
  "response": "pong",
  "version": "1.0.0",
  "pid": 12345
}

// System info response
{
  "status": "success",
  "platform": "Windows",
  "platform_version": "10.0.19041",
  "architecture": "AMD64",
  "processor": "Intel64 Family 6 Model 142 Stepping 10",
  "python_version": "3.9.1"
}
```

### Error Response Example

```json
{
  "status": "error",
  "message": "Command not allowed"
}
```

## Security Considerations

1. **Command Execution**: By default, the native host restricts command execution. In production, only whitelisted commands should be allowed.

2. **Message Validation**: Always validate responses from the native host before using the data.

3. **Error Handling**: Implement proper error handling for all native messaging operations.

## Testing Integration

1. Build the native host executable:
   ```
   cd Server
   build.bat
   ```

2. Register the native host:
   ```
   register_host.bat
   ```

3. Test the connection in your extension:
   ```javascript
   chrome.runtime.sendNativeMessage('com.tabagent.host', { action: 'ping' }, (response) => {
     console.log('Native host response:', response);
   });
   ```

## Troubleshooting

### Common Issues

1. **"Error: Specified native messaging host not found"**
   - Ensure the native host is properly registered
   - Check that the manifest file is in the correct location
   - Verify the extension ID matches in the native host manifest

2. **No response from native host**
   - Check that the native host executable exists at the specified path
   - Verify the executable has proper permissions
   - Check the native host log file for errors

3. **"Error: Attempting to use a disconnected port object"**
   - The native host process may have crashed
   - Check the native host log file for errors

### Debugging

1. Check the native host log file (native_host.log by default)
2. Use the test_host.py script to verify the native host is working:
   ```
   python test_host.py
   ```
3. Verify registry entries on Windows or manifest location on macOS/Linux