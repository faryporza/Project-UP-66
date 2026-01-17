"""
MJPEG Stream API endpoint.
"""
import time
from typing import Generator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.config import STREAM_DELAY
from app.core.state import state

router = APIRouter()


def mjpeg_generator() -> Generator[bytes, None, None]:
    """
    Generate MJPEG stream frames.
    
    Yields:
        MJPEG frame data
    """
    while True:
        frame = state.get_frame()
        
        if frame is None:
            time.sleep(0.01)
            continue
        
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame
            + b"\r\n"
        )
        
        time.sleep(STREAM_DELAY)


@router.get("/stream")
def get_stream():
    """
    Get MJPEG video stream.
    
    Returns:
        Streaming response with MJPEG content
    """
    return StreamingResponse(
        mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
