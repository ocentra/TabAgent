#!/usr/bin/env python3
"""
Health Check Server for Tab Agent Native Host
Runs a simple FastAPI server on localhost:8765 for debugging
"""

import os
import sys
import json
import logging
import threading
from datetime import datetime
from typing import Dict, Any, Optional

try:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse, FileResponse
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
    import psutil
except ImportError:
    print("Warning: FastAPI dependencies not installed. Health server disabled.")
    print("Install with: pip install fastapi uvicorn psutil")
    # Define dummy classes so the import doesn't fail
    FastAPI = None

# Configuration
HEALTH_PORT = 8765
LOG_FILE = "native_host.log"

# Create FastAPI app
if FastAPI is not None:
    app = FastAPI(
        title="Tab Agent Native Host Health Check",
        description="Debugging and health check API for Tab Agent native messaging host",
        version="1.0.0"
    )

    # Enable CORS for extension to access
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, restrict to extension origin
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global state
    health_state = {
        "started_at": datetime.now().isoformat(),
        "message_count": 0,
        "last_message": None,
        "last_message_time": None,
        "errors": [],
        "native_host_running": False
    }

    @app.get("/")
    async def root():
        """Root endpoint"""
        return {
            "service": "Tab Agent Native Host Health Check",
            "status": "running",
            "message": "Use /health for diagnostics",
            "endpoints": [
                "/health",
                "/logs",
                "/logs/tail/{lines}",
                "/state",
                "/test-connection"
            ]
        }

    @app.get("/health")
    async def health_check():
        """Comprehensive health check"""
        try:
            # Check if native host process is running
            current_pid = os.getpid()
            parent_pid = os.getppid()
            
            # Get process info
            process = psutil.Process(current_pid)
            parent_process = psutil.Process(parent_pid) if parent_pid > 0 else None
            
            # Check if log file exists
            log_file_exists = os.path.exists(LOG_FILE)
            log_file_size = os.path.getsize(LOG_FILE) if log_file_exists else 0
            
            # Get last log lines
            last_log_lines = []
            if log_file_exists:
                try:
                    with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        last_log_lines = lines[-10:] if len(lines) > 10 else lines
                except Exception as e:
                    last_log_lines = [f"Error reading log: {str(e)}"]
            
            return {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "process": {
                    "pid": current_pid,
                    "parent_pid": parent_pid,
                    "parent_name": parent_process.name() if parent_process else None,
                    "cpu_percent": process.cpu_percent(interval=0.1),
                    "memory_mb": round(process.memory_info().rss / 1024 / 1024, 2),
                    "threads": process.num_threads(),
                    "status": process.status()
                },
                "native_messaging": {
                    "running": health_state["native_host_running"],
                    "message_count": health_state["message_count"],
                    "last_message": health_state["last_message"],
                    "last_message_time": health_state["last_message_time"]
                },
                "logging": {
                    "log_file": LOG_FILE,
                    "log_file_exists": log_file_exists,
                    "log_file_size_bytes": log_file_size,
                    "last_log_lines": [line.strip() for line in last_log_lines]
                },
                "errors": health_state["errors"][-10:] if health_state["errors"] else []
            }
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": str(e),
                    "timestamp": datetime.now().isoformat()
                }
            )

    @app.get("/logs")
    async def get_logs():
        """Get all logs"""
        try:
            if not os.path.exists(LOG_FILE):
                return {"status": "error", "message": "Log file not found"}
            
            with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            return {
                "status": "success",
                "log_file": os.path.abspath(LOG_FILE),
                "content": content,
                "size_bytes": len(content)
            }
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": str(e)}
            )

    @app.get("/logs/tail/{lines}")
    async def get_logs_tail(lines: int = 100):
        """Get last N lines of logs"""
        try:
            if not os.path.exists(LOG_FILE):
                return {"status": "error", "message": "Log file not found"}
            
            with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                all_lines = f.readlines()
                last_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            
            return {
                "status": "success",
                "log_file": os.path.abspath(LOG_FILE),
                "lines": ''.join(last_lines),
                "total_lines": len(all_lines),
                "requested_lines": lines
            }
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": str(e)}
            )

    @app.get("/logs/download")
    async def download_logs():
        """Download log file"""
        if os.path.exists(LOG_FILE):
            return FileResponse(
                LOG_FILE,
                media_type="text/plain",
                filename="native_host.log"
            )
        return {"status": "error", "message": "Log file not found"}

    @app.get("/state")
    async def get_state():
        """Get current state"""
        return {
            "status": "success",
            "state": health_state,
            "timestamp": datetime.now().isoformat()
        }

    @app.post("/state/message")
    async def record_message(data: Dict[str, Any]):
        """Record a message received by native host"""
        health_state["message_count"] += 1
        health_state["last_message"] = data.get("action", "unknown")
        health_state["last_message_time"] = datetime.now().isoformat()
        health_state["native_host_running"] = True
        return {"status": "success"}

    @app.post("/state/error")
    async def record_error(data: Dict[str, Any]):
        """Record an error"""
        error_entry = {
            "timestamp": datetime.now().isoformat(),
            "error": data.get("error", "unknown"),
            "context": data.get("context", {})
        }
        health_state["errors"].append(error_entry)
        # Keep only last 50 errors
        if len(health_state["errors"]) > 50:
            health_state["errors"] = health_state["errors"][-50:]
        return {"status": "success"}

    @app.get("/test-connection")
    async def test_connection():
        """Test if server is reachable"""
        return {
            "status": "success",
            "message": "Health server is running!",
            "timestamp": datetime.now().isoformat(),
            "native_host_running": health_state["native_host_running"],
            "uptime_seconds": (datetime.now() - datetime.fromisoformat(health_state["started_at"])).total_seconds()
        }

    @app.get("/lmstudio/check")
    async def check_lmstudio():
        """Check if LM Studio is installed and running"""
        import platform
        import subprocess
        
        result = {
            "installed": False,
            "running": False,
            "api_accessible": False,
            "path": None,
            "version": None,
            "api_url": "http://localhost:1234",
            "models": []
        }
        
        try:
            # Check if LM Studio is installed (platform-specific)
            system = platform.system()
            
            if system == "Windows":
                # Check common Windows paths
                import winreg
                lm_paths = [
                    os.path.join(os.getenv("LOCALAPPDATA", ""), "Programs", "LM Studio", "LM Studio.exe"),
                    os.path.join(os.getenv("PROGRAMFILES", ""), "LM Studio", "LM Studio.exe"),
                    os.path.join(os.getenv("PROGRAMFILES(X86)", ""), "LM Studio", "LM Studio.exe"),
                ]
                
                for path in lm_paths:
                    if os.path.exists(path):
                        result["installed"] = True
                        result["path"] = path
                        break
            
            elif system == "Darwin":  # macOS
                lm_paths = [
                    "/Applications/LM Studio.app",
                    os.path.expanduser("~/Applications/LM Studio.app")
                ]
                
                for path in lm_paths:
                    if os.path.exists(path):
                        result["installed"] = True
                        result["path"] = path
                        break
            
            elif system == "Linux":
                # Check common Linux paths
                lm_paths = [
                    os.path.expanduser("~/.local/share/LM Studio"),
                    "/opt/LM Studio",
                    os.path.expanduser("~/LM Studio")
                ]
                
                for path in lm_paths:
                    if os.path.exists(path):
                        result["installed"] = True
                        result["path"] = path
                        break
            
            # Check if LM Studio process is running
            try:
                for proc in psutil.process_iter(['name', 'exe']):
                    proc_name = proc.info['name'].lower() if proc.info['name'] else ''
                    if 'lm studio' in proc_name or 'lmstudio' in proc_name:
                        result["running"] = True
                        break
            except Exception as e:
                logging.warning(f"Failed to check LM Studio process: {str(e)}")
            
            # Check if LM Studio API is accessible
            try:
                import urllib.request
                import urllib.error
                
                # Try to connect to LM Studio API
                req = urllib.request.Request(
                    "http://localhost:1234/v1/models",
                    headers={"User-Agent": "TabAgent/1.0"}
                )
                
                with urllib.request.urlopen(req, timeout=2) as response:
                    if response.status == 200:
                        result["api_accessible"] = True
                        data = json.loads(response.read().decode())
                        
                        # Parse models
                        if "data" in data:
                            result["models"] = [
                                {
                                    "id": model.get("id", "unknown"),
                                    "owned_by": model.get("owned_by", "unknown")
                                }
                                for model in data["data"]
                            ]
            except (urllib.error.URLError, ConnectionRefusedError, TimeoutError) as e:
                logging.debug(f"LM Studio API not accessible: {str(e)}")
                result["api_accessible"] = False
            except Exception as e:
                logging.warning(f"Error checking LM Studio API: {str(e)}")
            
            # Overall status
            result["status"] = "success"
            result["summary"] = (
                f"Installed: {'✅' if result['installed'] else '❌'}, "
                f"Running: {'✅' if result['running'] else '❌'}, "
                f"API: {'✅' if result['api_accessible'] else '❌'}, "
                f"Models: {len(result['models'])}"
            )
            
            return result
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "installed": result["installed"],
                "running": result["running"],
                "api_accessible": result["api_accessible"]
            }

    @app.get("/lmstudio/models")
    async def get_lmstudio_models():
        """Get loaded models from LM Studio"""
        try:
            import urllib.request
            import urllib.error
            
            req = urllib.request.Request(
                "http://localhost:1234/v1/models",
                headers={"User-Agent": "TabAgent/1.0"}
            )
            
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    return {
                        "status": "success",
                        "models": data.get("data", []),
                        "count": len(data.get("data", []))
                    }
            
            return {
                "status": "error",
                "message": "Failed to fetch models"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def start_health_server():
        """Start the health check server in a background thread"""
        try:
            logging.info(f"Starting health check server on port {HEALTH_PORT}")
            # Configure uvicorn
            config = uvicorn.Config(
                app,
                host="127.0.0.1",
                port=HEALTH_PORT,
                log_level="warning",
                access_log=False,
                loop="asyncio"
            )
            server = uvicorn.Server(config)
            server.run()
        except Exception as e:
            logging.error(f"Failed to start health server: {str(e)}")
            import traceback
            logging.error(traceback.format_exc())

    def start_health_server_background():
        """Start health server in background thread"""
        try:
            thread = threading.Thread(target=start_health_server, daemon=True)
            thread.start()
            logging.info(f"Health check server thread started on http://localhost:{HEALTH_PORT}")
            logging.info(f"Health server will be available shortly...")
            return thread
        except Exception as e:
            logging.error(f"Failed to start health server thread: {str(e)}")
            import traceback
            logging.error(traceback.format_exc())
            return None

else:
    # Dummy functions if FastAPI not available
    def start_health_server_background():
        logging.warning("Health server disabled - FastAPI not installed")
        return None

