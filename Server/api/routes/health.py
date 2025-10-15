"""
Health Check Endpoints
"""

import time
from fastapi import APIRouter

from ..types import HealthStatus
from ..backend_manager import get_backend_manager

router = APIRouter()

# Track server start time
_start_time = time.time()


@router.get("/health", response_model=HealthStatus)
async def health_check():
    """
    Health check endpoint
    
    Returns:
        Server health status including model load state
    """
    manager = get_backend_manager()
    
    return HealthStatus(
        status="ok",
        model_loaded=manager.is_model_loaded(),
        backend=manager.get_backend_type(),
        uptime=time.time() - _start_time
    )
