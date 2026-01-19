"""Time utility functions."""

import time
from datetime import datetime
from typing import Optional


class Timer:
    """Simple timer for measuring elapsed time."""
    
    def __init__(self):
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
    
    def start(self):
        """Start the timer."""
        self.start_time = time.time()
        self.end_time = None
    
    def stop(self) -> float:
        """
        Stop the timer and return elapsed time.
        
        Returns:
            Elapsed time in seconds
        """
        if self.start_time is None:
            return 0.0
        self.end_time = time.time()
        return self.elapsed()
    
    def elapsed(self) -> float:
        """
        Get elapsed time.
        
        Returns:
            Elapsed time in seconds
        """
        if self.start_time is None:
            return 0.0
        end = self.end_time if self.end_time is not None else time.time()
        return end - self.start_time
    
    def reset(self):
        """Reset the timer."""
        self.start_time = None
        self.end_time = None


class FPSCounter:
    """FPS counter using moving average."""
    
    def __init__(self, window_size: int = 30):
        self.window_size = window_size
        self.frame_times = []
        self.last_time = time.time()
    
    def update(self) -> float:
        """
        Update the FPS counter.
        
        Returns:
            Current FPS
        """
        current_time = time.time()
        frame_time = current_time - self.last_time
        self.last_time = current_time
        
        self.frame_times.append(frame_time)
        if len(self.frame_times) > self.window_size:
            self.frame_times.pop(0)
        
        if len(self.frame_times) == 0:
            return 0.0
        
        avg_time = sum(self.frame_times) / len(self.frame_times)
        return 1.0 / avg_time if avg_time > 0 else 0.0
    
    def reset(self):
        """Reset the FPS counter."""
        self.frame_times = []
        self.last_time = time.time()


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """
    Format a datetime as ISO 8601 string.
    
    Args:
        dt: Datetime to format, or None for current time
    
    Returns:
        ISO 8601 formatted string
    """
    if dt is None:
        dt = datetime.now()
    return dt.isoformat()
