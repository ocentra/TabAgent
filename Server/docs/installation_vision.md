# Tab Agent Native App Connector - Installation Guide

## Vision

Our goal is to provide a seamless installation experience where users can simply copy a command, paste it in their terminal, and have everything automatically downloaded, installed, and registered. This eliminates the need for manual downloads, file management, and complex setup procedures.

## How It Works

1. Users copy a simple command from the extension
2. The command downloads and executes our installer script
3. The script automatically:
   - Detects the user's operating system
   - Downloads the appropriate native host executable
   - Installs it in the correct location
   - Registers it with the browser
4. The extension can immediately communicate with the native host

## Prerequisites

1. Tab Agent extension installed in Chrome
2. Internet connection to download the native host executable
3. Terminal access (Terminal on macOS/Linux, PowerShell on Windows)

## Installation Instructions

### For macOS and Linux Users

Copy and paste this command in your terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/YourUsername/YourRepo/main/install.sh)"
```

### For Windows Users

Copy and paste this command in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/YourUsername/YourRepo/main/install.ps1'))"
```

## What the Installer Does

1. **Detects Your Operating System**: Automatically determines if you're on Windows, macOS, or Linux

2. **Downloads the Correct Executable**: 
   - Windows: Downloads `tabagent-host.exe`
   - macOS: Downloads `tabagent-host-macos`
   - Linux: Downloads `tabagent-host-linux`

3. **Installs to the Appropriate Location**:
   - Windows: `%LOCALAPPDATA%\TabAgent\`
   - macOS: `~/Library/Application Support/TabAgent/`
   - Linux: `~/.local/share/tabagent/`

4. **Registers with Chrome**:
   - Windows: Adds registry entries
   - macOS/Linux: Creates manifest files in the correct locations

5. **Verifies Installation**: Confirms that everything is properly set up

## Security Considerations

The `curl | bash` method is powerful but requires users to place trust in the script. We follow security best practices:

1. **HTTPS Only**: All downloads use HTTPS to prevent man-in-the-middle attacks
2. **Readable Scripts**: Our installer scripts are simple and transparent
3. **Inspect First Option**: Security-conscious users can download and inspect the script before running it:
   ```bash
   curl -o install.sh https://raw.githubusercontent.com/YourUsername/YourRepo/main/install.sh
   # Inspect the install.sh file now with a text editor
   bash install.sh
   ```

## Troubleshooting

### Common Issues

1. **"curl: (7) Failed to connect to raw.githubusercontent.com"**
   - Check your internet connection
   - Ensure you can access https://raw.githubusercontent.com in your browser

2. **"Permission denied"**
   - Make sure you have write permissions to the installation directory
   - On Unix-like systems, you may need to run with `sudo` if installing to system directories

3. **"Registry access is denied" (Windows)**
   - Run PowerShell as Administrator
   - Or ensure you have permission to modify the registry

### Manual Verification

After installation, you can verify that everything is working:

1. Check that the executable exists in the installation directory
2. Verify the manifest file/registry entry was created
3. Test the connection from the Tab Agent extension

## Development Notes

### Building Platform-Specific Executables

To create the executables for each platform:

1. **Windows**:
   ```bash
   pyinstaller --onefile --name tabagent-host native_host.py
   ```

2. **macOS**:
   ```bash
   pyinstaller --onefile --name tabagent-host-macos native_host.py
   ```

3. **Linux**:
   ```bash
   pyinstaller --onefile --name tabagent-host-linux native_host.py
   ```

### Hosting the Executables

For production, host the executables as GitHub releases:
1. Create a new release
2. Upload the platform-specific executables as assets
3. Update the download URLs in the installer scripts

## Support

For issues or questions, please refer to the documentation or contact support.