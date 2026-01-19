"""Status API endpoint."""

from fastapi import APIRouter

from app.core.state import app_state

router = APIRouter()


@router.get("/status")
async def get_status():
    """
    Get current system status.
    
    Returns:
        Dictionary containing system status, counts, and metrics
    """
    return app_state.get_status()


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Simple health status
    """
    return {
        "status": "healthy",
        "worker_running": app_state.worker_running
    }
