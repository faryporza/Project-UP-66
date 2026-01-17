"""
Camera/Video source manager.
"""
import cv2
from typing import Optional, Tuple, Generator
import numpy as np

from app.config import VIDEO_SOURCE


class Camera:
    """
    Video source abstraction for webcam or video files.
    """
    
    def __init__(self, source: Optional[str] = None):
        """
        Initialize camera.
        
        Args:
            source: Video source (webcam index or file path)
        """
        self.source = source or VIDEO_SOURCE
        self.cap: Optional[cv2.VideoCapture] = None
        self.width: int = 0
        self.height: int = 0
        self.fps: float = 0.0
        self._is_file: bool = False
    
    def open(self) -> bool:
        """
        Open the video source.
        
        Returns:
            True if successful
        """
        # Parse source (integer for webcam, string for file)
        src = int(self.source) if self.source.isdigit() else self.source
        self._is_file = isinstance(src, str)
        
        self.cap = cv2.VideoCapture(src)
        
        if not self.cap.isOpened():
            return False
        
        # Read properties
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        
        return True
    
    def read(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Read a frame from the source.
        
        Returns:
            (success, frame) tuple
        """
        if self.cap is None:
            return False, None
        
        ok, frame = self.cap.read()
        
        # Loop video files for demo
        if not ok and self._is_file:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ok, frame = self.cap.read()
        
        return ok, frame
    
    def frames(self) -> Generator[np.ndarray, None, None]:
        """
        Generator that yields frames continuously.
        
        Yields:
            Video frames
        """
        while True:
            ok, frame = self.read()
            if ok and frame is not None:
                yield frame
    
    def release(self):
        """Release the video source."""
        if self.cap is not None:
            self.cap.release()
            self.cap = None
    
    @property
    def is_opened(self) -> bool:
        """Check if source is open."""
        return self.cap is not None and self.cap.isOpened()
    
    @property
    def size(self) -> Tuple[int, int]:
        """Get frame size (width, height)."""
        return self.width, self.height
    
    def __enter__(self):
        """Context manager entry."""
        self.open()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.release()
