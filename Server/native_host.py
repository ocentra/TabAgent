#!/usr/bin/env python3
"""
Native Messaging Host for Tab Agent Extension
This script handles communication between the Chrome extension and local system resources.
"""

import sys
import json
import struct
import logging
import os

# Configuration defaults
class Config:
    LOG_LEVEL = "DEBUG"
    LOG_FILE = "native_host.log"
    ALLOWED_COMMANDS = []
    COMMAND_TIMEOUT = 30
    MAX_MESSAGE_SIZE = 1024 * 1024

# Try to import custom configuration
try:
    import config
    # Override defaults with custom config
    for attr in dir(config):
        if not attr.startswith('_'):
            setattr(Config, attr, getattr(config, attr))
except ImportError:
    pass

# Set up logging
log_level = getattr(logging, Config.LOG_LEVEL.upper(), logging.DEBUG)
logging.basicConfig(
    filename=Config.LOG_FILE,
    level=log_level,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

def get_message():
    """Read a message from stdin"""
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        sys.exit(0)
    message_length = struct.unpack('@I', raw_length)[0]
    
    # Check message size limit
    if message_length > Config.MAX_MESSAGE_SIZE:
        raise ValueError(f"Message too large: {message_length} bytes")
    
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def send_message(message_content):
    """Send a message to stdout"""
    encoded_content = json.dumps(message_content).encode('utf-8')
    encoded_length = struct.pack('@I', len(encoded_content))
    sys.stdout.buffer.write(encoded_length)
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.buffer.flush()

def handle_ping(message):
    """Handle ping message"""
    return {
        "status": "success",
        "response": "pong",
        "version": "1.0.0",
        "pid": os.getpid()
    }

def handle_get_system_info(message):
    """Handle system info request"""
    import platform
    return {
        "status": "success",
        "platform": platform.system(),
        "platform_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version()
    }

def handle_execute_command(message):
    """Handle command execution request"""
    import subprocess
    
    command = message.get("command", "")
    if not command:
        return {"status": "error", "message": "No command provided"}
    
    try:
        # Security check: whitelist allowed commands
        if Config.ALLOWED_COMMANDS and command not in Config.ALLOWED_COMMANDS:
            return {"status": "error", "message": "Command not allowed"}
        
        # Log the command execution
        logging.info(f"Executing command: {command}")
        
        # Execute the command and return result
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True,
            timeout=Config.COMMAND_TIMEOUT
        )
        
        return {
            "status": "success",
            "command": command,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        logging.error(f"Command execution timeout: {command}")
        return {
            "status": "error",
            "message": f"Command timed out after {Config.COMMAND_TIMEOUT} seconds"
        }
    except Exception as e:
        logging.error(f"Command execution error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

def main():
    """Main message loop"""
    logging.info("Native host started")
    
    # Message handlers
    handlers = {
        "ping": handle_ping,
        "get_system_info": handle_get_system_info,
        "execute_command": handle_execute_command
    }
    
    while True:
        try:
            message = get_message()
            logging.debug(f"Received message: {message}")
            
            # Get the action from the message
            action = message.get("action", "")
            
            # Handle the action
            if action in handlers:
                response = handlers[action](message)
            else:
                response = {
                    "status": "error",
                    "message": f"Unknown action: {action}"
                }
            
            send_message(response)
            
        except json.JSONDecodeError as e:
            error_response = {
                "status": "error",
                "message": f"Invalid JSON: {str(e)}"
            }
            send_message(error_response)
            sys.exit(1)
        except struct.error as e:
            error_response = {
                "status": "error",
                "message": f"Message format error: {str(e)}"
            }
            send_message(error_response)
            sys.exit(1)
        except ValueError as e:
            error_response = {
                "status": "error",
                "message": f"Message size error: {str(e)}"
            }
            send_message(error_response)
            sys.exit(1)
        except KeyboardInterrupt:
            logging.info("Native host interrupted")
            sys.exit(0)
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            error_response = {
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }
            send_message(error_response)
            sys.exit(1)

if __name__ == '__main__':
    main()