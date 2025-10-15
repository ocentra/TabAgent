"""
Backend Adapter

Thin adapter that wraps core.inference_service for HTTP API.
Reuses ALL existing logic from native_host.py via InferenceService.
"""

import logging
from typing import Optional, AsyncGenerator

from core.message_types import (
    ChatMessage,
    InferenceSettings,
    BackendType,
)
from core.inference_service import get_inference_service
from .backend_manager import BackendInterface
from .types import PerformanceStats

logger = logging.getLogger(__name__)


class InferenceServiceAdapter(BackendInterface):
    """
    Adapter that wraps InferenceService.
    Reuses ALL logic from native_host.py via shared service.
    """
    
    def __init__(self):
        """Initialize adapter with shared service"""
        self._service = get_inference_service()
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self._service.is_model_loaded()
    
    def get_backend_type(self) -> Optional[BackendType]:
        """Get current backend type"""
        return self._service.get_backend_type()
    
    def get_model_path(self) -> Optional[str]:
        """Get loaded model path"""
        manager = self._service.get_active_manager()
        if manager and hasattr(manager, 'current_model_path'):
            return manager.current_model_path
        return None
    
    async def generate(
        self,
        messages: list[ChatMessage],
        settings: InferenceSettings,
    ) -> str:
        """
        Generate non-streaming response.
        Uses existing InferenceService.generate()
        
        Args:
            messages: Chat messages
            settings: Inference settings
            
        Returns:
            Generated text
        """
        # Call shared service (same logic as native_host.handle_generate)
        result = self._service.generate(messages, settings)
        
        if result["status"] == "success":
            return result["payload"]["generatedText"]
        else:
            raise RuntimeError(result["message"])
    
    async def generate_stream(
        self,
        messages: list[ChatMessage],
        settings: InferenceSettings,
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response
        
        Args:
            messages: Chat messages
            settings: Inference settings
            
        Yields:
            Generated tokens
        """
        # Collect tokens via callback
        tokens: list[str] = []
        
        def stream_callback(token: str, tps: Optional[str], num_tokens: int):
            tokens.append(token)
        
        # Generate with callback (reuses native_host logic)
        result = self._service.generate(messages, settings, stream_callback)
        
        # Yield collected tokens
        for token in tokens:
            yield token
    
    def get_stats(self) -> Optional[PerformanceStats]:
        """Get performance statistics"""
        manager = self._service.get_active_manager()
        if not manager:
            return None
        
        # Get stats from active manager
        if hasattr(manager, 'get_state'):
            state = manager.get_state()
            if state:
                return PerformanceStats(
                    time_to_first_token=state.get("time_to_first_token"),
                    tokens_per_second=state.get("tokens_per_second"),
                    input_tokens=state.get("input_tokens"),
                    output_tokens=state.get("output_tokens"),
                )
        
        return None


def get_inference_adapter() -> InferenceServiceAdapter:
    """
    Get inference adapter using shared service.
    
    Returns:
        Adapter wrapping InferenceService
    """
    return InferenceServiceAdapter()

