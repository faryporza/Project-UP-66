"""Control API endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.worker import worker

router = APIRouter()


class LinePositionRequest(BaseModel):
    """Request model for updating line position."""
    line_y: int = Field(..., ge=0, description="Y coordinate of the counting line")


class ResetResponse(BaseModel):
    """Response model for reset operation."""
    message: str
    up_count: int
    down_count: int


class LinePositionResponse(BaseModel):
    """Response model for line position update."""
    message: str
    line_y: int


@router.post("/reset", response_model=ResetResponse)
async def reset_counts():
    """
    Reset all counting statistics.
    
    Returns:
        Confirmation message with reset counts
    """
    worker.reset_counts()
    return ResetResponse(
        message="Counts reset successfully",
        up_count=0,
        down_count=0
    )


@router.post("/line", response_model=LinePositionResponse)
async def update_line_position(request: LinePositionRequest):
    """
    Update the position of the counting line.
    
    Args:
        request: Line position request
    
    Returns:
        Confirmation message with new line position
    """
    try:
        worker.set_line_y(request.line_y)
        return LinePositionResponse(
            message="Line position updated successfully",
            line_y=request.line_y
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_worker():
    """
    Start the inference worker.
    
    Returns:
        Confirmation message
    """
    try:
        worker.start()
        return {"message": "Worker started successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_worker():
    """
    Stop the inference worker.
    
    Returns:
        Confirmation message
    """
    try:
        worker.stop()
        return {"message": "Worker stopped successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
