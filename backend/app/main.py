"""
FastAPI Application Entry Point.

YOLO Line Crossing Detection Backend
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import status_router, stream_router, control_router
from app.core.worker import start_worker, stop_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Starts worker on startup, stops on shutdown.
    """
    # Startup
    print("[App] Starting...")
    start_worker()
    
    yield
    
    # Shutdown
    print("[App] Shutting down...")
    stop_worker()


# Create FastAPI app
app = FastAPI(
    title="YOLO Line Crossing API",
    description="Real-time vehicle detection and line crossing counter",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(status_router, prefix="/api", tags=["Status"])
app.include_router(stream_router, prefix="/api", tags=["Stream"])
app.include_router(control_router, prefix="/api", tags=["Control"])


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": "YOLO Line Crossing API",
        "version": "1.0.0",
        "endpoints": {
            "status": "/api/status",
            "stream": "/api/stream",
            "reset": "/api/reset",
            "line": "/api/line",
            "health": "/api/health",
        },
    }
