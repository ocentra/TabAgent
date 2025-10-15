"""
Inference Service - Shared Logic Layer

Extracted from native_host.py to be used by BOTH:
- HTTP API (FastAPI)
- Native messaging (stdin/stdout)

DRY principle: Single source of truth for inference logic.
"""

import logging
from typing import Optional, Callable, Dict, Any
from pathlib import Path

from core.message_types import (
    ChatMessage,
    InferenceSettings,
    BackendType,
    ModelType,
    LoadingStatus,
    EventType,
)

logger = logging.getLogger(__name__)

# Type aliases from native_host.py
ProgressCallback = Callable[[LoadingStatus, int, str], None]
StreamCallback = Callable[[str, Optional[str], int], None]


class InferenceService:
    """
    Unified inference service for all backends.
    
    Used by both HTTP API and native messaging.
    Manages backend lifecycle and routing.
    """
    
    def __init__(self):
        """Initialize inference service"""
        self.bitnet_manager: Optional[Any] = None
        self.lmstudio_manager: Optional[Any] = None
        self.llamacpp_manager: Optional[Any] = None
        self.onnx_manager: Optional[Any] = None
        
        logger.info("InferenceService initialized")
    
    def load_model(
        self,
        model_path: str,
        progress_callback: Optional[ProgressCallback] = None
    ) -> Dict[str, Any]:
        """
        Load model - routes to appropriate backend.
        
        This is the SAME logic as native_host.handle_load_model()
        
        Args:
            model_path: Path to model file
            progress_callback: Optional progress callback
            
        Returns:
            Response dict with status and payload
        """
        from backends.bitnet.validator import GGUFValidator
        from backends.bitnet import BitNetManager, BitNetConfig
        
        try:
            # Detect model type (existing logic from native_host.py)
            model_type = GGUFValidator.detect_model_type(model_path)
            logger.info(f"Detected model type: {model_type.value}")
            
            # Detect GPU availability
            has_gpu = GGUFValidator.detect_cuda_available()
            logger.info(f"CUDA available: {has_gpu}")
            
            # Get appropriate backend
            backend_type = GGUFValidator.get_backend_for_model(
                model_type,
                has_gpu=has_gpu
            )
            logger.info(f"Selected backend: {backend_type.value}")
            
            # Route to backend
            if backend_type in [BackendType.BITNET_CPU, BackendType.BITNET_GPU]:
                # Initialize BitNet manager if needed
                if self.bitnet_manager is None:
                    self.bitnet_manager = BitNetManager(BitNetConfig())
                
                # Load model
                self.bitnet_manager.load_model(model_path, progress_callback)
                
                return {
                    "status": "success",
                    "type": EventType.WORKER_READY.value,
                    "payload": {
                        "backend": backend_type.value,
                        "modelPath": model_path,
                        "executionProvider": backend_type.value
                    }
                }
            
            else:
                return {
                    "status": "error",
                    "message": f"Unsupported model type: {model_type.value}"
                }
        
        except FileNotFoundError as e:
            logger.error(f"Model file not found: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return {
                "status": "error",
                "message": f"Failed to load model: {str(e)}"
            }
    
    def generate(
        self,
        messages: list[ChatMessage],
        settings: Optional[InferenceSettings] = None,
        stream_callback: Optional[StreamCallback] = None
    ) -> Dict[str, Any]:
        """
        Generate text - routes to active backend.
        
        This is the SAME logic as native_host.handle_generate()
        
        Args:
            messages: Chat messages
            settings: Inference settings
            stream_callback: Optional streaming callback
            
        Returns:
            Response dict with status and generated text
        """
        try:
            # Determine which backend to use (existing logic from native_host.py)
            backend_name = None
            manager = None
            
            if self.bitnet_manager is not None and self.bitnet_manager.is_model_loaded:
                backend_name = "BitNet"
                manager = self.bitnet_manager
            elif self.lmstudio_manager is not None and self.lmstudio_manager.is_server_running:
                backend_name = "LM Studio"
                manager = self.lmstudio_manager
            else:
                return {
                    "status": "error",
                    "message": "No model loaded. Load a model first or ensure LM Studio is running."
                }
            
            logger.info(f"Generate request with {len(messages)} messages using {backend_name}")
            
            # Generate text using active backend
            if backend_name == "BitNet":
                generated_text = manager.generate(
                    messages=messages,
                    settings=settings,
                    stream_callback=stream_callback
                )
            else:  # LM Studio
                generated_text = manager.proxy_chat_completion(
                    messages=messages,
                    settings=settings,
                    stream_callback=stream_callback
                )
            
            # Return success
            return {
                "status": "success",
                "type": EventType.GENERATION_COMPLETE.value,
                "payload": {
                    "output": generated_text,
                    "generatedText": generated_text
                }
            }
        
        except Exception as e:
            logger.error(f"Generation error: {e}")
            return {
                "status": "error",
                "type": EventType.GENERATION_ERROR.value,
                "message": str(e)
            }
    
    def get_active_manager(self) -> Optional[Any]:
        """Get currently active backend manager"""
        if self.bitnet_manager and self.bitnet_manager.is_model_loaded:
            return self.bitnet_manager
        elif self.lmstudio_manager and hasattr(self.lmstudio_manager, 'is_server_running') and self.lmstudio_manager.is_server_running:
            return self.lmstudio_manager
        return None
    
    def get_backend_type(self) -> Optional[BackendType]:
        """Get active backend type"""
        manager = self.get_active_manager()
        if manager and hasattr(manager, 'backend'):
            return manager.backend
        return None
    
    def is_model_loaded(self) -> bool:
        """Check if any model is loaded"""
        return self.get_active_manager() is not None


# Global singleton
_inference_service: Optional[InferenceService] = None


def get_inference_service() -> InferenceService:
    """Get global InferenceService singleton"""
    global _inference_service
    if _inference_service is None:
        _inference_service = InferenceService()
    return _inference_service

