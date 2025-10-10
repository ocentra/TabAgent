# Tab Agent Native Host

This is the native messaging host application for the Tab Agent Chrome extension. It allows the extension to communicate with the local system and execute commands that require elevated permissions or access to system resources.

## Features

- Native messaging protocol implementation for Chrome extensions
- System information retrieval
- Command execution capabilities
- Cross-platform support (Windows, macOS, Linux)

## Setup

### Prerequisites

- Python 3.7 or later

### Installation

For end users, we provide a seamless installation process:

#### For macOS and Linux Users

Copy and paste this command in your terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/YourUsername/YourRepo/main/install.sh)"
```

#### For Windows Users

Copy and paste this command in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/YourUsername/YourRepo/main/install.ps1'))"
```

This will automatically download the appropriate executable for your platform, install it, and register it with Chrome.

### Manual Installation (Development)

1. Run `setup.bat` (Windows) or manually create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Building

To build a standalone executable:

1. Run `build.bat` (Windows) or manually build with PyInstaller:
   ```bash
   pyinstaller --onefile --name tabagent-host native_host.py
   ```

The executable will be created in the `dist` folder.

## Usage

The native host communicates with the Chrome extension using Chrome's native messaging protocol:

1. Messages are sent as JSON objects with a length prefix
2. Each message must have an "action" field specifying the operation
3. Responses are sent back in the same format

### Supported Actions

- `ping`: Test connectivity
- `get_system_info`: Retrieve system information
- `execute_command`: Execute a system command (restricted for security)

## Security

For security reasons, command execution is restricted. In production, only whitelisted commands should be allowed.

## Integration with Chrome Extension

To register this native host with Chrome, you'll need to:

1. Create a manifest file for the native messaging host
2. Register the host with Chrome using the appropriate registry keys (Windows) or by placing the manifest in the correct location (macOS/Linux)
3. Update the Chrome extension to send messages to this host

## Development

To run the native host directly for testing:

```bash
python native_host.py
```

The host will listen for messages on stdin and respond on stdout.