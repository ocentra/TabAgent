"""
TabAgent Server - Main FastAPI Application

OpenAI-compatible API server for local AI inference with hardware-aware backend selection.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import chat, models, health, management, stats
from .backend_adapter import get_inference_adapter
from .backend_manager import get_backend_manager

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - startup and shutdown"""
    # Startup
    logger.info("TabAgent Server starting...")
    
    # Initialize adapter (uses shared InferenceService)
    adapter = get_inference_adapter()
    backend_mgr = get_backend_manager()
    backend_mgr.set_backend(adapter, "tabagent")
    logger.info("Backend adapter initialized (shares logic with native_host.py)")
    
    yield
    
    # Shutdown
    logger.info("TabAgent Server shutting down...")


# Create FastAPI application
app = FastAPI(
    title="TabAgent Server",
    description="Hardware-aware inference platform with OpenAI-compatible API",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware - allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(models.router, prefix="/api/v1", tags=["models"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(management.router, prefix="/api/v1", tags=["management"])
app.include_router(stats.router, prefix="/api/v1", tags=["stats"])


@app.get("/")
async def root():
    """Root endpoint - basic server info"""
    return {
        "name": "TabAgent Server",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/api/v1/health",
            "models": "/api/v1/models",
            "chat": "/api/v1/chat/completions",
            "completions": "/api/v1/completions",
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )
    
    # Run server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )

