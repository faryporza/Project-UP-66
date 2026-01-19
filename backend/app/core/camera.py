"""Camera/video source handling."""

from typing import Optional, Tuple

import cv2
import numpy as np

from app.config import config


class VideoSource:
    """Video source wrapper for webcam or video file."""
    
    def __init__(self, source: Optional[str | int] = None):
        """
        Initialize the video source.
        
        Args:
            source: Video source (webcam index or file path). Uses config if None.
        """
        self.source = source if source is not None else config.get_video_source()
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_opened = False
        self.frame_width = config.FRAME_WIDTH
        self.frame_height = config.FRAME_HEIGHT
    
    def open(self) -> bool:
        """
        Open the video source.
        
        Returns:
            True if successfully opened, False otherwise
        """
        try:
            self.cap = cv2.VideoCapture(self.source)
            
            if not self.cap.isOpened():
                print(f"Failed to open video source: {self.source}")
                return False
            
            # Set frame dimensions if it's a webcam
            if isinstance(self.source, int):
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_width)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frame_height)
                self.cap.set(cv2.CAP_PROP_FPS, config.FPS)
            
            # Get actual dimensions
            self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            self.is_opened = True
            print(f"Video source opened: {self.source} ({self.frame_width}x{self.frame_height})")
            return True
            
        except Exception as e:
            print(f"Error opening video source: {e}")
            return False
    
    def read(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Read a frame from the video source.
        
        Returns:
            Tuple of (success, frame)
        """
        if not self.is_opened or self.cap is None:
            return False, None
        
        try:
            ret, frame = self.cap.read()
            return ret, frame
        except Exception as e:
            print(f"Error reading frame: {e}")
            return False, None
    
    def release(self):
        """Release the video source."""
        if self.cap is not None:
            self.cap.release()
            self.is_opened = False
            print("Video source released")
    
    def get_frame_dimensions(self) -> Tuple[int, int]:
        """
        Get frame dimensions.
        
        Returns:
            Tuple of (width, height)
        """
        return self.frame_width, self.frame_height
    
    def is_file(self) -> bool:
        """Check if source is a file (not webcam)."""
        return isinstance(self.source, str)
    
    def restart(self) -> bool:
        """
        Restart the video source (mainly for video files).
        
        Returns:
            True if successfully restarted
        """
        if not self.is_file():
            return True  # Webcam doesn't need restart
        
        if self.cap is not None:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            return True
        
        return False
    
    def __enter__(self):
        """Context manager entry."""
        self.open()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.release()
