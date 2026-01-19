"""Configuration settings for the YOLO Line Crossing application."""

import os
from pathlib import Path
from typing import Optional


class Config:
    """Application configuration."""
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Model settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/best.pt")
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
    IOU_THRESHOLD: float = float(os.getenv("IOU_THRESHOLD", "0.45"))
    
    # Video source settings
    VIDEO_SOURCE: str = os.getenv("VIDEO_SOURCE", "0")  # Default to webcam
    FRAME_WIDTH: int = int(os.getenv("FRAME_WIDTH", "640"))
    FRAME_HEIGHT: int = int(os.getenv("FRAME_HEIGHT", "480"))
    FPS: int = int(os.getenv("FPS", "30"))
    
    # Line crossing settings
    LINE_Y_PERCENT: float = float(os.getenv("LINE_Y_PERCENT", "0.5"))  # Line position as percentage of frame height
    CROSSING_MARGIN: int = int(os.getenv("CROSSING_MARGIN", "5"))  # Pixels margin for crossing detection
    
    # Stream settings
    JPEG_QUALITY: int = int(os.getenv("JPEG_QUALITY", "80"))
    STREAM_FPS: int = int(os.getenv("STREAM_FPS", "15"))
    
    # Worker settings
    WORKER_ENABLED: bool = os.getenv("WORKER_ENABLED", "true").lower() == "true"
    
    # Colors (BGR format for OpenCV)
    COLOR_BOX: tuple = (0, 255, 0)  # Green
    COLOR_LINE: tuple = (0, 0, 255)  # Red
    COLOR_TEXT: tuple = (255, 255, 255)  # White
    COLOR_BG: tuple = (0, 0, 0)  # Black
    
    @classmethod
    def get_model_path(cls) -> Path:
        """Get the absolute path to the model file."""
        return Path(cls.MODEL_PATH).absolute()
    
    @classmethod
    def get_video_source(cls) -> str | int:
        """Get the video source, converting to int if it's a webcam index."""
        try:
            return int(cls.VIDEO_SOURCE)
        except ValueError:
            return cls.VIDEO_SOURCE


config = Config()
