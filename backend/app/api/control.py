"""
Control API endpoints.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.core.state import state

router = APIRouter()


class LineConfig(BaseModel):
    """Line configuration model."""
    y: Optional[int] = None
    y_ratio: Optional[float] = None  # Alternative: set by ratio (0-1)
    x1_ratio: Optional[float] = None
    x2_ratio: Optional[float] = None


class ResetResponse(BaseModel):
    """Reset response model."""
    success: bool
    message: str


@router.post("/reset")
def reset_counts() -> ResetResponse:
    """
    Reset all crossing counts.
    
    Returns:
        Success message
    """
    state.reset_counts()
    return ResetResponse(
        success=True,
        message="Counts reset successfully",
    )


@router.post("/line")
def set_line(config: LineConfig) -> dict:
    """
    Update line position.
    
    Args:
        config: New line configuration
    
    Returns:
        Updated line settings
    """
    with state.lock:
        # Update Y position
        if config.y is not None:
            state.line_y = config.y
        elif config.y_ratio is not None:
            _, h = state.frame_size
            if h > 0:
                state.line_y = int(h * config.y_ratio)
        
        # Update X ratios
        if config.x1_ratio is not None:
            state.line_x1_ratio = config.x1_ratio
        if config.x2_ratio is not None:
            state.line_x2_ratio = config.x2_ratio
        
        return {
            "success": True,
            "line": {
                "y": state.line_y,
                "x1_ratio": state.line_x1_ratio,
                "x2_ratio": state.line_x2_ratio,
            },
        }


@router.get("/health")
def health_check() -> dict:
    """
    Health check endpoint.
    
    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "running": state.running,
        "frame_index": state.frame_index,
    }
