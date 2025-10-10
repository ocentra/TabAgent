# Native Host Installation Guide

## Prerequisites

1. Tab Agent extension installed in Chrome (extension ID: `fkkeoobeahalebjpbockfedlncckobjb`)
2. Python 3.7 or later installed on your system

## Installation Steps

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

1. Open Chrome
2. Navigate to `chrome://extensions`
3. Find the Tab Agent extension
4. Click on the extension details
5. Test the native host connection

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

### Manual Registration (if scripts fail)

#### Windows

1. Open Registry Editor (regedit)
2. Navigate to:
   ```
   HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.tabagent.host
   ```
3. Create a new String Value with the name `(Default)`
4. Set the value to the full path of `com.tabagent.host.json`

#### macOS

1. Create the directory:
   ```
   mkdir -p ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts
   ```
2. Copy the manifest file:
   ```
   cp com.tabagent.host.json ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
   ```

#### Linux

1. Create the directory:
   ```
   mkdir -p ~/.config/google-chrome/NativeMessagingHosts
   ```
2. Copy the manifest file:
   ```
   cp com.tabagent.host.json ~/.config/google-chrome/NativeMessagingHosts/
   ```

## Security Notes

- The native host executable should be placed in a secure location
- Only trusted extensions should be allowed to communicate with the native host
- Regularly update the native host to the latest version
- Monitor the native host log file for suspicious activity