"""Shared state management for the application."""

import threading
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import numpy as np


@dataclass
class CountState:
    """State for counting objects crossing the line."""
    
    up_count: int = 0
    down_count: int = 0
    last_reset: datetime = field(default_factory=datetime.now)
    
    def reset(self):
        """Reset the counts."""
        self.up_count = 0
        self.down_count = 0
        self.last_reset = datetime.now()
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "up_count": self.up_count,
            "down_count": self.down_count,
            "total_count": self.up_count + self.down_count,
            "last_reset": self.last_reset.isoformat()
        }


@dataclass
class AppState:
    """Application state shared between threads."""
    
    # Frame and inference data
    latest_frame: Optional[np.ndarray] = None
    annotated_frame: Optional[np.ndarray] = None
    
    # Counting state
    counts: CountState = field(default_factory=CountState)
    
    # Line position
    line_y: int = 0
    
    # Worker status
    worker_running: bool = False
    worker_error: Optional[str] = None
    
    # Performance metrics
    fps: float = 0.0
    inference_time: float = 0.0
    last_update: datetime = field(default_factory=datetime.now)
    
    # Thread synchronization
    lock: threading.Lock = field(default_factory=threading.Lock)
    
    def update_frame(self, frame: np.ndarray, annotated: np.ndarray):
        """Update the latest frames."""
        with self.lock:
            self.latest_frame = frame.copy() if frame is not None else None
            self.annotated_frame = annotated.copy() if annotated is not None else None
            self.last_update = datetime.now()
    
    def update_counts(self, up: int, down: int):
        """Update the counts."""
        with self.lock:
            self.counts.up_count = up
            self.counts.down_count = down
    
    def update_metrics(self, fps: float, inference_time: float):
        """Update performance metrics."""
        with self.lock:
            self.fps = fps
            self.inference_time = inference_time
    
    def set_line_y(self, y: int):
        """Set the line Y position."""
        with self.lock:
            self.line_y = y
    
    def reset_counts(self):
        """Reset all counts."""
        with self.lock:
            self.counts.reset()
    
    def get_status(self) -> dict:
        """Get current status as dictionary."""
        with self.lock:
            return {
                "worker_running": self.worker_running,
                "worker_error": self.worker_error,
                "counts": self.counts.to_dict(),
                "line_y": self.line_y,
                "fps": round(self.fps, 2),
                "inference_time_ms": round(self.inference_time * 1000, 2),
                "last_update": self.last_update.isoformat(),
                "has_frame": self.annotated_frame is not None
            }
    
    def get_annotated_frame(self) -> Optional[np.ndarray]:
        """Get a copy of the annotated frame."""
        with self.lock:
            return self.annotated_frame.copy() if self.annotated_frame is not None else None


# Global application state
app_state = AppState()
