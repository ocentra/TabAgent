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
from typing import Dict, Any, Optional

# Import typed message definitions from core
from core.message_types import (
    ActionType,
    EventType,
    BackendType,
    LoadModelRequest,
    GenerateRequest,
    UpdateSettingsRequest,
    UnloadModelRequest,
    GetModelStateRequest,
    ErrorResponse,
    SuccessResponse,
    LoadingStatus
)

# Import backend implementations
from backends.bitnet import BitNetManager, BitNetConfig, GGUFValidator
from backends.lmstudio import LMStudioManager

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

# Initialize backend managers
bitnet_manager: Optional[BitNetManager] = None
lmstudio_manager: Optional[LMStudioManager] = None

def get_message() -> Dict[str, Any]:
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

def send_message(message_content: Dict[str, Any]) -> None:
    """Send a message to stdout"""
    encoded_content = json.dumps(message_content).encode('utf-8')
    encoded_length = struct.pack('@I', len(encoded_content))
    sys.stdout.buffer.write(encoded_length)
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.buffer.flush()

def handle_ping(message: Dict[str, Any]) -> Dict[str, Any]:
    """Handle ping message"""
    return {
        "status": "success",
        "response": "pong",
        "version": "1.0.0",
        "pid": os.getpid()
    }

def handle_get_system_info(message: Dict[str, Any]) -> Dict[str, Any]:
    """Handle system info request"""
    import platform
    import torch
    
    # Detect GPU
    has_cuda = False
    gpu_name = None
    try:
        import torch
        if torch.cuda.is_available():
            has_cuda = True
            gpu_name = torch.cuda.get_device_name(0)
    except:
        pass
    
    return {
        "status": "success",
        "platform": platform.system(),
        "platform_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version(),
        "has_cuda": has_cuda,
        "gpu_name": gpu_name
    }

def handle_execute_command(message: Dict[str, Any]) -> Dict[str, Any]:
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


def handle_load_model(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle model loading request from extension
    Detects model type and routes to appropriate backend
    """
    global bitnet_manager
    
    try:
        # Validate request
        request = LoadModelRequest(**message)
        model_path = request.modelPath
        
        logging.info(f"Load model request: {model_path}")
        
        # Detect model type
        model_type = GGUFValidator.detect_model_type(model_path)
        logging.info(f"Detected model type: {model_type.value}")
        
        # Detect GPU availability
        has_gpu = GGUFValidator.detect_cuda_available()
        logging.info(f"CUDA available: {has_gpu}")
        
        # Get appropriate backend
        backend_type = GGUFValidator.get_backend_for_model(model_type, has_gpu=has_gpu)
        logging.info(f"Selected backend: {backend_type.value}")
        
        # Route to backend
        if backend_type == BackendType.BITNET_CPU or backend_type == BackendType.BITNET_GPU:
            # Initialize BitNet manager if needed
            if bitnet_manager is None:
                bitnet_manager = BitNetManager(BitNetConfig())
            
            # Load model with progress callback
            def progress_callback(status: LoadingStatus, progress: int, message: str):
                send_message({
                    "type": EventType.MODEL_LOADING_PROGRESS.value,
                    "payload": {
                        "status": status.value,
                        "progress": progress,
                        "file": os.path.basename(model_path),
                        "message": message
                    }
                })
            
            bitnet_manager.load_model(model_path, progress_callback)
            
            return {
                "status": "success",
                "type": EventType.WORKER_READY.value,
                "payload": {
                    "backend": backend_type.value,
                    "modelPath": model_path,
                    "executionProvider": backend_type.value
                }
            }
        
        elif backend_type == BackendType.LMSTUDIO:
            # Initialize LM Studio manager if needed
            if lmstudio_manager is None:
                lmstudio_manager = LMStudioManager()
            
            # Ensure server is running
            if not lmstudio_manager.ensure_server_running():
                return {
                    "status": "error",
                    "message": "LM Studio server failed to start. Is LM Studio installed?"
                }
            
            # Note: Model loading is handled by LM Studio itself
            # Extension uses SDK to load models
            # Native app just ensures server is running
            logging.info(f"LM Studio backend selected, server running")
            
            return {
                "status": "success",
                "type": EventType.WORKER_READY.value,
                "payload": {
                    "backend": backend_type.value,
                    "modelPath": model_path,
                    "executionProvider": "lmstudio",
                    "note": "Model loading handled by LM Studio. Use extension SDK."
                }
            }
        
        else:
            return {
                "status": "error",
                "message": f"Unsupported model type: {model_type.value}"
            }
    
    except FileNotFoundError as e:
        logging.error(f"Model file not found: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
    except Exception as e:
        logging.error(f"Error loading model: {e}")
        return {
            "status": "error",
            "message": f"Failed to load model: {str(e)}"
        }


def handle_generate(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle text generation request from extension
    Routes to appropriate backend based on loaded model
    """
    global bitnet_manager, lmstudio_manager
    
    try:
        # Validate request
        request = GenerateRequest(**message)
        
        # Determine which backend to use
        backend_name = None
        if bitnet_manager is not None and bitnet_manager.is_model_loaded:
            backend_name = "BitNet"
        elif lmstudio_manager is not None and lmstudio_manager.is_server_running:
            backend_name = "LM Studio"
        else:
            return {
                "status": "error",
                "message": "No model loaded. Load a model first or ensure LM Studio is running."
            }
        
        logging.info(f"Generate request with {len(request.messages)} messages using {backend_name}")
        
        # Stream callback
        def stream_callback(token: str, tps: Optional[str], num_tokens: int):
            send_message({
                "type": EventType.GENERATION_UPDATE.value,
                "payload": {
                    "token": token,
                    "tps": tps,
                    "numTokens": num_tokens
                }
            })
        
        # Generate text using active backend
        if backend_name == "BitNet":
            generated_text = bitnet_manager.generate(
                messages=request.messages,
                settings=request.settings,
                stream_callback=stream_callback
            )
        else:  # LM Studio
            generated_text = lmstudio_manager.proxy_chat_completion(
                messages=request.messages,
                settings=request.settings,
                stream_callback=stream_callback
            )
        
        # Send completion event
        return {
            "status": "success",
            "type": EventType.GENERATION_COMPLETE.value,
            "payload": {
                "output": generated_text,
                "generatedText": generated_text
            }
        }
    
    except Exception as e:
        logging.error(f"Generation error: {e}")
        return {
            "status": "error",
            "type": EventType.GENERATION_ERROR.value,
            "message": str(e)
        }


def handle_update_settings(message: Dict[str, Any]) -> Dict[str, Any]:
    """Handle inference settings update"""
    global bitnet_manager
    
    try:
        request = UpdateSettingsRequest(**message)
        
        if bitnet_manager is None:
            return {
                "status": "error",
                "message": "No manager initialized"
            }
        
        bitnet_manager.update_settings(request.settings)
        
        logging.info("Inference settings updated")
        
        return {
            "status": "success",
            "message": "Settings updated"
        }
    
    except Exception as e:
        logging.error(f"Error updating settings: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def handle_get_model_state(message: Dict[str, Any]) -> Dict[str, Any]:
    """Get current model state"""
    global bitnet_manager
    
    try:
        if bitnet_manager is None:
            return {
                "status": "success",
                "payload": {
                    "isReady": False,
                    "backend": None,
                    "modelPath": None
                }
            }
        
        state = bitnet_manager.get_state()
        
        return {
            "status": "success",
            "payload": state
        }
    
    except Exception as e:
        logging.error(f"Error getting model state: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def handle_unload_model(message: Dict[str, Any]) -> Dict[str, Any]:
    """Unload current model"""
    global bitnet_manager
    
    try:
        if bitnet_manager is not None and bitnet_manager.is_model_loaded:
            bitnet_manager.unload_model()
            logging.info("Model unloaded")
        
        return {
            "status": "success",
            "message": "Model unloaded"
        }
    
    except Exception as e:
        logging.error(f"Error unloading model: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def handle_stop_generation(message: Dict[str, Any]) -> Dict[str, Any]:
    """Stop ongoing generation"""
    # TODO: Implement generation stopping
    logging.info("Stop generation requested")
    
    return {
        "status": "success",
        "message": "Generation stopped"
    }


def handle_check_lmstudio(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check LM Studio installation and runtime status
    """
    global lmstudio_manager
    
    try:
        # Initialize LM Studio manager if needed
        if lmstudio_manager is None:
            lmstudio_manager = LMStudioManager()
        
        # Get status
        status = lmstudio_manager.get_status()
        
        logging.info(f"LM Studio status: installed={status['installed']}, running={status['server_running']}")
        
        return {
            "status": "success",
            "payload": status
        }
    
    except Exception as e:
        logging.error(f"Error checking LM Studio: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def handle_start_lmstudio(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Start LM Studio server
    """
    global lmstudio_manager
    
    try:
        # Initialize LM Studio manager if needed
        if lmstudio_manager is None:
            lmstudio_manager = LMStudioManager()
        
        # Ensure server is running
        success = lmstudio_manager.ensure_server_running()
        
        if success:
            logging.info("LM Studio server started successfully")
            return {
                "status": "success",
                "message": "LM Studio server is running",
                "payload": {
                    "server_running": True,
                    "api_endpoint": f"http://127.0.0.1:1234"
                }
            }
        else:
            return {
                "status": "error",
                "message": "Failed to start LM Studio server"
            }
    
    except RuntimeError as e:
        logging.error(f"Cannot start LM Studio: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
    except Exception as e:
        logging.error(f"Error starting LM Studio: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def handle_stop_lmstudio(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stop LM Studio server
    """
    global lmstudio_manager
    
    try:
        if lmstudio_manager is None:
            return {
                "status": "error",
                "message": "LM Studio manager not initialized"
            }
        
        success = lmstudio_manager.stop_server()
        
        if success:
            logging.info("LM Studio server stopped")
            return {
                "status": "success",
                "message": "LM Studio server stopped"
            }
        else:
            return {
                "status": "error",
                "message": "Failed to stop LM Studio server"
            }
    
    except Exception as e:
        logging.error(f"Error stopping LM Studio: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

def main():
    """Main message loop"""
    logging.info("Native host started")
    
    # Initialize LM Studio manager at startup
    global lmstudio_manager
    try:
        lmstudio_manager = LMStudioManager()
        # Auto-start LM Studio server if installed and bootstrapped
        if lmstudio_manager.is_installed and lmstudio_manager.is_bootstrapped:
            logging.info("Attempting to start LM Studio server at startup")
            lmstudio_manager.ensure_server_running()
    except Exception as e:
        logging.warning(f"Failed to initialize LM Studio at startup: {e}")
    
    # Message handlers (strongly typed)
    handlers: Dict[str, Any] = {
        ActionType.PING.value: handle_ping,
        ActionType.GET_SYSTEM_INFO.value: handle_get_system_info,
        ActionType.EXECUTE_COMMAND.value: handle_execute_command,
        
        # Model handlers (generic - routes to appropriate backend)
        ActionType.LOAD_MODEL.value: handle_load_model,
        ActionType.GENERATE.value: handle_generate,
        ActionType.GET_MODEL_STATE.value: handle_get_model_state,
        ActionType.UPDATE_SETTINGS.value: handle_update_settings,
        ActionType.UNLOAD_MODEL.value: handle_unload_model,
        ActionType.STOP_GENERATION.value: handle_stop_generation,
        
        # LM Studio lifecycle handlers
        ActionType.CHECK_LMSTUDIO.value: handle_check_lmstudio,
        ActionType.START_LMSTUDIO.value: handle_start_lmstudio,
        ActionType.STOP_LMSTUDIO.value: handle_stop_lmstudio,
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