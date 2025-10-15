"""
Backend Manager

Unified interface for managing inference backends.
Works for both HTTP server and native messaging (stdin/stdout).
"""

import logging
from typing import Optional, AsyncGenerator
from abc import ABC, abstractmethod

from core.message_types import (
    ChatMessage,
    InferenceSettings,
    BackendType,
    ModelType,
    GenerationCompletePayload,
)
from .types import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionChunk,
    ChatCompletionChoice,
    ChatCompletionChunkChoice,
    ChatCompletionChunkDelta,
    ChatCompletionMessage,
    ChatCompletionUsage,
    PerformanceStats,
)
from .constants import OpenAIObject, FinishReason, MessageRole

logger = logging.getLogger(__name__)


class BackendInterface(ABC):
    """Abstract interface for inference backends"""
    
    @abstractmethod
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        pass
    
    @abstractmethod
    def get_backend_type(self) -> Optional[BackendType]:
        """Get current backend type"""
        pass
    
    @abstractmethod
    def get_model_path(self) -> Optional[str]:
        """Get loaded model path"""
        pass
    
    @abstractmethod
    async def generate(
        self,
        messages: list[ChatMessage],
        settings: InferenceSettings,
    ) -> str:
        """Generate non-streaming response"""
        pass
    
    @abstractmethod
    async def generate_stream(
        self,
        messages: list[ChatMessage],
        settings: InferenceSettings,
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response"""
        pass
    
    @abstractmethod
    def get_stats(self) -> Optional[PerformanceStats]:
        """Get performance statistics"""
        pass


class BackendManager:
    """
    Manages multiple inference backends.
    
    Provides unified interface for both HTTP API and native messaging.
    """
    
    def __init__(self):
        self._current_backend: Optional[BackendInterface] = None
        self._model_id: str = "unknown"
        logger.info("BackendManager initialized")
    
    def set_backend(self, backend: BackendInterface, model_id: str) -> None:
        """
        Set active backend
        
        Args:
            backend: Backend implementation
            model_id: Model identifier
        """
        self._current_backend = backend
        self._model_id = model_id
        logger.info(f"Backend set: {backend.get_backend_type()}, model: {model_id}")
    
    def is_model_loaded(self) -> bool:
        """Check if any model is loaded"""
        return (
            self._current_backend is not None 
            and self._current_backend.is_loaded()
        )
    
    def get_backend_type(self) -> Optional[BackendType]:
        """Get current backend type"""
        if self._current_backend:
            return self._current_backend.get_backend_type()
        return None
    
    def get_model_id(self) -> str:
        """Get current model identifier"""
        return self._model_id
    
    async def chat_completion(
        self,
        request: ChatCompletionRequest,
    ) -> ChatCompletionResponse:
        """
        Generate non-streaming chat completion
        
        Args:
            request: Chat completion request
            
        Returns:
            Chat completion response
            
        Raises:
            RuntimeError: If no model is loaded
        """
        if not self.is_model_loaded():
            raise RuntimeError("No model loaded")
        
        assert self._current_backend is not None
        
        # Convert request to inference settings
        settings = request.to_inference_settings()
        
        # Generate response
        generated_text = await self._current_backend.generate(
            request.messages,
            settings,
        )
        
        # Build OpenAI-compatible response
        import time
        
        response = ChatCompletionResponse(
            id=self._generate_id(),
            created=int(time.time()),
            model=request.model,
            choices=[
                ChatCompletionChoice(
                    index=0,
                    message=ChatCompletionMessage(
                        role=MessageRole.ASSISTANT,
                        content=generated_text,
                    ),
                    finish_reason=FinishReason.STOP,
                )
            ],
        )
        
        # Add usage stats if available
        stats = self._current_backend.get_stats()
        if stats and stats.input_tokens and stats.output_tokens:
            response.usage = ChatCompletionUsage(
                prompt_tokens=stats.input_tokens,
                completion_tokens=stats.output_tokens,
                total_tokens=stats.input_tokens + stats.output_tokens,
            )
        
        return response
    
    async def chat_completion_stream(
        self,
        request: ChatCompletionRequest,
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """
        Generate streaming chat completion
        
        Args:
            request: Chat completion request
            
        Yields:
            Chat completion chunks
            
        Raises:
            RuntimeError: If no model is loaded
        """
        if not self.is_model_loaded():
            raise RuntimeError("No model loaded")
        
        assert self._current_backend is not None
        
        # Convert request to inference settings
        settings = request.to_inference_settings()
        
        # Generate streaming response
        import time
        chunk_id = self._generate_id()
        
        async for token in self._current_backend.generate_stream(
            request.messages,
            settings,
        ):
            chunk = ChatCompletionChunk(
                id=chunk_id,
                created=int(time.time()),
                model=request.model,
                choices=[
                    ChatCompletionChunkChoice(
                        index=0,
                        delta=ChatCompletionChunkDelta(
                            content=token,
                        ),
                        finish_reason=None,
                    )
                ],
            )
            yield chunk
        
        # Send finish chunk
        finish_chunk = ChatCompletionChunk(
            id=chunk_id,
            created=int(time.time()),
            model=request.model,
            choices=[
                ChatCompletionChunkChoice(
                    index=0,
                    delta=ChatCompletionChunkDelta(),
                    finish_reason=FinishReason.STOP,
                )
            ],
        )
        yield finish_chunk
    
    def get_performance_stats(self) -> Optional[PerformanceStats]:
        """Get current performance statistics"""
        if self._current_backend:
            return self._current_backend.get_stats()
        return None
    
    @staticmethod
    def _generate_id() -> str:
        """Generate unique ID for responses"""
        import time
        import random
        timestamp = int(time.time())
        random_part = random.randint(1000, 9999)
        return f"chatcmpl-{timestamp}{random_part}"


# Global backend manager instance
_backend_manager: Optional[BackendManager] = None


def get_backend_manager() -> BackendManager:
    """
    Get global backend manager instance
    
    Returns:
        BackendManager singleton
    """
    global _backend_manager
    if _backend_manager is None:
        _backend_manager = BackendManager()
    return _backend_manager

