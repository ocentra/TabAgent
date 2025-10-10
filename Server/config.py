# Tab Agent Native Host Configuration

# Logging configuration
LOG_LEVEL = "INFO"
LOG_FILE = "native_host.log"

# Security settings
# Whitelist of allowed commands (empty list means all commands allowed - FOR DEVELOPMENT ONLY)
ALLOWED_COMMANDS = []

# Timeout for command execution (seconds)
COMMAND_TIMEOUT = 30

# Maximum message size (bytes)
MAX_MESSAGE_SIZE = 1024 * 1024  # 1MB