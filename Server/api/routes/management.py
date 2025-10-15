"""
Model Management Endpoints

Uses existing ModelManager and InferenceService.
"""

from fastapi import APIRouter, HTTPException, status
import logging

from ..types import (
    ModelPullRequest,
    ModelLoadRequest,
    ModelUnloadRequest,
    ModelOperationResponse,
)
from ..constants import ErrorCode
from core.inference_service import get_inference_service
from models import ModelManager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/models/pull", response_model=ModelOperationResponse)
async def pull_model(request: ModelPullRequest):
    """
    Download model from HuggingFace.
    Uses existing ModelManager.download_model()
    """
    logger.info(f"Pull request for model: {request.model}")
    
    try:
        manager = ModelManager()
        success = manager.download_model(
            model_name=request.model,
            variant=request.variant
        )
        
        if success:
            return ModelOperationResponse(
                success=True,
                message=f"Model {request.model} downloaded successfully",
                model=request.model
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": {
                        "message": f"Failed to download model: {request.model}",
                        "type": ErrorCode.BACKEND_ERROR.value,
                    }
                }
            )
    
    except ValueError as e:
        logger.error(f"Model not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "message": str(e),
                    "type": ErrorCode.INVALID_MODEL.value,
                }
            }
        )
    except Exception as e:
        logger.error(f"Pull error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "message": str(e),
                    "type": ErrorCode.BACKEND_ERROR.value,
                }
            }
        )


@router.post("/models/load", response_model=ModelOperationResponse)
async def load_model(request: ModelLoadRequest):
    """
    Load model into inference service.
    Uses existing InferenceService.load_model()
    """
    logger.info(f"Load request for model: {request.model}")
    
    try:
        service = get_inference_service()
        
        # Load model (reuses native_host logic)
        result = service.load_model(request.model)
        
        if result["status"] == "success":
            return ModelOperationResponse(
                success=True,
                message=f"Model loaded successfully",
                model=request.model,
                backend=service.get_backend_type()
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": {
                        "message": result.get("message", "Unknown error"),
                        "type": ErrorCode.BACKEND_ERROR.value,
                    }
                }
            )
    
    except Exception as e:
        logger.error(f"Load error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "message": str(e),
                    "type": ErrorCode.BACKEND_ERROR.value,
                }
            }
        )


@router.post("/models/unload", response_model=ModelOperationResponse)
async def unload_model(request: ModelUnloadRequest):
    """
    Unload current model.
    Uses existing manager.unload_model()
    """
    logger.info("Unload request")
    
    try:
        service = get_inference_service()
        manager = service.get_active_manager()
        
        if manager and hasattr(manager, 'unload_model'):
            manager.unload_model()
            
            return ModelOperationResponse(
                success=True,
                message="Model unloaded successfully"
            )
        else:
            return ModelOperationResponse(
                success=True,
                message="No model loaded"
            )
    
    except Exception as e:
        logger.error(f"Unload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "message": str(e),
                    "type": ErrorCode.BACKEND_ERROR.value,
                }
            }
        )

