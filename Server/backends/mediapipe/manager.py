"""
MediaPipe LLM Inference backend manager.

Handles on-device optimized inference using Google MediaPipe.
Supports Gemma models in .task bundle format.
"""

import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from enum import Enum

from core.message_types import (
    ChatMessage,
    InferenceSettings,
    BackendType,
    AccelerationBackend,
)

from .config import (
    MediaPipeConfig,
    MediaPipeDelegate,
)


logger = logging.getLogger(__name__)


class MediaPipeStatus(str, Enum):
    """MediaPipe task status"""
    NOT_LOADED = "not_loaded"
    LOADING = "loading"
    READY = "ready"
    ERROR = "error"


class MediaPipeManager:
    """
    MediaPipe LLM Inference backend manager.
    
    Provides on-device optimized inference using Google's MediaPipe framework.
    Supports Gemma models in .task bundle format with GPU/NPU acceleration.
    """
    
    def __init__(self):
        """Initialize MediaPipe manager"""
        self.llm_inference: Optional[Any] = None
        self.model_path: Optional[Path] = None
        self.config: Optional[MediaPipeConfig] = None
        self.status: MediaPipeStatus = MediaPipeStatus.NOT_LOADED
        self.backend_type: Optional[BackendType] = None
        
        # Lazy import MediaPipe
        self._mediapipe = None
        
        logger.info("MediaPipeManager initialized")
    
    def _ensure_mediapipe(self):
        """Lazy load MediaPipe library"""
        if self._mediapipe is None:
            try:
                import mediapipe as mp
                self._mediapipe = mp
                logger.info(f"MediaPipe loaded (version: {mp.__version__})")
            except ImportError:
                raise RuntimeError(
                    "MediaPipe not installed. "
                    "Install with: pip install mediapipe"
                )
    
    def is_model_loaded(self) -> bool:
        """
        Check if a model is currently loaded.
        
        Returns:
            True if model is loaded and ready
        """
        return (
            self.status == MediaPipeStatus.READY and
            self.llm_inference is not None
        )
    
    def load_model(
        self,
        model_path: str,
        delegate: MediaPipeDelegate = MediaPipeDelegate.CPU,
        config: Optional[MediaPipeConfig] = None
    ) -> bool:
        """
        Load MediaPipe .task bundle model.
        
        Args:
            model_path: Path to .task bundle file
            delegate: Inference delegate (CPU/GPU/NPU)
            config: MediaPipe configuration (optional)
            
        Returns:
            True if model loaded successfully
            
        Raises:
            FileNotFoundError: If model file not found
            RuntimeError: If MediaPipe not available
        """
        self._ensure_mediapipe()
        
        path = Path(model_path)
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        if not path.suffix == '.task':
            logger.warning(f"Model file is not .task bundle: {model_path}")
        
        # Use provided config or create default
        if config is None:
            config = MediaPipeConfig(
                model_path=model_path,
                delegate=delegate
            )
        
        logger.info(
            f"Loading MediaPipe model: {model_path} "
            f"(delegate: {config.delegate.value})"
        )
        
        self.status = MediaPipeStatus.LOADING
        
        try:
            # Import MediaPipe LLM task
            from mediapipe.tasks.python import genai
            
            # Create task options
            task_options = genai.LlmInference.LlmInferenceOptions(
                model_asset_path=str(path)
            )
            
            # Create LLM Inference task
            self.llm_inference = genai.LlmInference.create_from_options(task_options)
            
            # Create session options
            session_options = {
                "max_tokens": config.max_tokens,
                "top_k": config.top_k,
                "top_p": config.top_p,
                "temperature": config.temperature,
            }
            
            if config.random_seed is not None:
                session_options["random_seed"] = config.random_seed
            
            # Create inference session
            self.llm_session = self.llm_inference.create_session(**session_options)
            
            self.model_path = path
            self.config = config
            self.backend_type = self._map_backend_type(delegate)
            self.status = MediaPipeStatus.READY
            
            logger.info(f"MediaPipe model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load MediaPipe model: {e}")
            self.status = MediaPipeStatus.ERROR
            self.llm_inference = None
            self.llm_session = None
            return False
    
    def unload_model(self) -> bool:
        """
        Unload current model.
        
        Returns:
            True if unloaded successfully
        """
        if self.llm_session is None and self.llm_inference is None:
            logger.info("No model loaded, nothing to unload")
            return True
        
        try:
            # Release task
            if self.llm_inference is not None:
                # Close the LLM inference instance
                self.llm_inference.close()
                self.llm_inference = None
            
            self.model_path = None
            self.config = None
            self.backend_type = None
            self.status = MediaPipeStatus.NOT_LOADED
            
            logger.info("MediaPipe model unloaded")
            return True
            
        except Exception as e:
            logger.error(f"Error unloading model: {e}")
            return False
    
    def generate(
        self,
        messages: List[ChatMessage],
        settings: InferenceSettings
    ) -> str:
        """
        Generate text using MediaPipe LLM.
        
        Args:
            messages: Chat messages
            settings: Inference settings
            
        Returns:
            Generated text
            
        Raises:
            RuntimeError: If no model loaded
        """
        if not self.is_model_loaded():
            raise RuntimeError("No model loaded or not ready")
        
        try:
            # Build prompt from messages
            prompt = self._build_prompt(messages)
            
            # Generate response using MediaPipe
            response = self.llm_inference.generate_response(prompt)
            
            if response:
                logger.info(f"Generated {len(response)} characters")
                return response
            else:
                logger.error("Empty response from MediaPipe")
                return ""
                
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise RuntimeError(f"MediaPipe generation failed: {e}")
    
    def generate_stream(
        self,
        messages: List[ChatMessage],
        settings: InferenceSettings,
        callback
    ):
        """
        Generate text with streaming output.
        
        Args:
            messages: Chat messages
            settings: Inference settings
            callback: Callback function(token: str)
            
        Raises:
            RuntimeError: If no model loaded
        """
        if not self.is_model_loaded():
            raise RuntimeError("No model loaded or not ready")
        
        try:
            # Build prompt
            prompt = self._build_prompt(messages)
            
            # MediaPipe generates in chunks via generator
            for response_chunk in self.llm_inference.generate_response_async(prompt):
                callback(response_chunk)
            
        except Exception as e:
            logger.error(f"Streaming generation failed: {e}")
            raise RuntimeError(f"MediaPipe streaming failed: {e}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about loaded model.
        
        Returns:
            Dictionary with model information
        """
        if not self.is_model_loaded():
            return {
                "loaded": False,
                "status": self.status.value,
                "error": "No model loaded"
            }
        
        return {
            "loaded": True,
            "status": self.status.value,
            "model_path": str(self.model_path),
            "backend": self.backend_type.value if self.backend_type else None,
            "delegate": self.config.delegate.value if self.config else None,
            "max_tokens": self.config.max_tokens if self.config else None,
        }
    
    @staticmethod
    def _build_prompt(messages: List[ChatMessage]) -> str:
        """
        Build prompt string from chat messages.
        
        Args:
            messages: List of chat messages
            
        Returns:
            Formatted prompt string
        """
        # Simple concatenation for now
        # TODO: Use proper chat template based on model
        prompt_parts = []
        for msg in messages:
            prompt_parts.append(f"{msg.role.value}: {msg.content}")
        
        return "\n".join(prompt_parts)
    
    @staticmethod
    def _map_backend_type(delegate: MediaPipeDelegate) -> BackendType:
        """
        Map MediaPipe delegate to BackendType.
        
        Args:
            delegate: MediaPipe delegate
            
        Returns:
            BackendType enum value
        """
        mapping = {
            MediaPipeDelegate.CPU: BackendType.MEDIAPIPE_CPU,
            MediaPipeDelegate.GPU: BackendType.MEDIAPIPE_GPU,
            MediaPipeDelegate.NPU: BackendType.MEDIAPIPE_NPU,
        }
        
        return mapping.get(delegate, BackendType.MEDIAPIPE_CPU)

