# Tab Agent Native Host

Native messaging host for Tab Agent extension. Enables secure communication between the extension and your local system.

## Quick Start

### Developer Setup
```bash
# Windows
setup.bat

# macOS / Linux
./setup-macos.sh  # or ./setup-linux.sh
```

### Build Executable
```bash
cd build-tool
./build.bat        # Windows
./build-linux.sh   # Linux
./build-macos.sh   # macOS
```

Built executable → `TabAgentDist/NativeApp/`

### Test
```bash
python tests/test_host.py
```

## What It Does

- Native messaging protocol for browser extensions
- System information retrieval
- Secure command execution
- Cross-platform (Windows, macOS, Linux)

## Supported Actions

- `ping` - Test connectivity
- `get_system_info` - System information
- `execute_command` - Execute commands (restricted)

## Structure

```
Server/
├── native_host.py          # Main application
├── config.py               # Configuration
├── requirements.txt        # Dependencies
├── com.tabagent.host.json  # Manifest template
├── setup*.sh / setup.bat   # Developer setup
├── build-tool/             # Build scripts only
└── tests/                  # Unit tests
```

## Installation

End-user installation is handled by the installer (separate from this server).

