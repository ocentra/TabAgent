"""
Chat Completions Endpoints

OpenAI-compatible chat and text completion endpoints.
Zero string literals - all constants from api.constants.
"""

import json
import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from ..types import (
    ChatCompletionRequest,
    ChatCompletionChunk,
    CompletionRequest,
)
from ..constants import (
    MediaType,
    HTTPHeader,
    CacheControl,
    ConnectionType,
    SSEPrefix,
    SSEMessage,
    ErrorCode,
)
from ..backend_manager import get_backend_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    """
    Create chat completion
    
    OpenAI-compatible endpoint for chat completions with streaming support.
    
    Args:
        request: Chat completion request
        
    Returns:
        Chat completion response (streaming or non-streaming)
        
    Raises:
        HTTPException: If no model loaded or generation fails
    """
    manager = get_backend_manager()
    
    # Check if model is loaded
    if not manager.is_model_loaded():
        logger.error("Chat completion requested but no model loaded")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": {
                    "message": "No model loaded",
                    "type": ErrorCode.MODEL_NOT_LOADED.value,
                    "code": ErrorCode.MODEL_NOT_LOADED.value,
                }
            }
        )
    
    logger.info(f"Chat completion: model={request.model}, stream={request.stream}")
    
    try:
        # Non-streaming response
        if not request.stream:
            response = await manager.chat_completion(request)
            return response
        
        # Streaming response
        else:
            return StreamingResponse(
                _stream_chat_completion(manager, request),
                media_type=MediaType.EVENT_STREAM.value,
                headers={
                    HTTPHeader.CACHE_CONTROL.value: CacheControl.NO_CACHE.value,
                    HTTPHeader.CONNECTION.value: ConnectionType.KEEP_ALIVE.value,
                }
            )
    
    except Exception as e:
        logger.error(f"Generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "message": str(e),
                    "type": ErrorCode.GENERATION_FAILED.value,
                    "code": ErrorCode.GENERATION_FAILED.value,
                }
            }
        )


@router.post("/completions")
async def completions(request: CompletionRequest):
    """
    Create text completion
    
    OpenAI-compatible endpoint for text completions.
    
    Args:
        request: Completion request
        
    Raises:
        HTTPException: Not implemented yet
    """
    logger.warning("Text completions endpoint called but not implemented")
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "error": {
                "message": "Text completions not yet implemented. Use /chat/completions",
                "type": ErrorCode.NOT_IMPLEMENTED.value,
                "code": ErrorCode.NOT_IMPLEMENTED.value,
            }
        }
    )


async def _stream_chat_completion(manager, request: ChatCompletionRequest):
    """
    Generate streaming chat completion
    
    Args:
        manager: Backend manager
        request: Chat completion request
        
    Yields:
        SSE-formatted chunks
    """
    try:
        async for chunk in manager.chat_completion_stream(request):
            # Serialize chunk to JSON
            chunk_json = chunk.model_dump_json(exclude_none=True)
            
            # Format as SSE
            sse_line = f"{SSEPrefix.DATA.value}{chunk_json}\n\n"
            yield sse_line
        
        # Send [DONE] message
        done_line = f"{SSEPrefix.DATA.value}{SSEMessage.DONE.value}\n\n"
        yield done_line
    
    except Exception as e:
        logger.error(f"Streaming error: {e}", exc_info=True)
        # Send error as SSE
        error_data = {
            "error": {
                "message": str(e),
                "type": ErrorCode.GENERATION_FAILED.value,
            }
        }
        error_line = f"{SSEPrefix.DATA.value}{json.dumps(error_data)}\n\n"
        yield error_line
