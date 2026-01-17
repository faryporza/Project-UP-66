"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import control, status, stream
from app.config import config
from app.core.worker import worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    
    Args:
        app: FastAPI application instance
    """
    # Startup
    print("Starting YOLO Line Crossing API...")
    print(f"Configuration:")
    print(f"  - Host: {config.HOST}:{config.PORT}")
    print(f"  - Model: {config.MODEL_PATH}")
    print(f"  - Video Source: {config.VIDEO_SOURCE}")
    print(f"  - Worker Enabled: {config.WORKER_ENABLED}")
    
    if config.WORKER_ENABLED:
        worker.start()
    
    yield
    
    # Shutdown
    print("Shutting down YOLO Line Crossing API...")
    worker.stop()


# Create FastAPI app
app = FastAPI(
    title="YOLO Line Crossing API",
    description="FastAPI backend for YOLO object detection with line crossing counting",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(status.router, prefix="/api", tags=["status"])
app.include_router(stream.router, prefix="/api", tags=["stream"])
app.include_router(control.router, prefix="/api", tags=["control"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "YOLO Line Crossing API",
        "version": "1.0.0",
        "endpoints": {
            "status": "/api/status",
            "health": "/api/health",
            "stream": "/api/stream",
            "reset": "/api/reset",
            "line": "/api/line",
            "start": "/api/start",
            "stop": "/api/stop"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=False
    )
