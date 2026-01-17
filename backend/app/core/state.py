"""
Shared state module - thread-safe state management.
"""
from threading import Lock
from typing import Optional, Dict, Set, Tuple
from dataclasses import dataclass, field
from datetime import datetime

from app.config import CLASSES


@dataclass
class AppState:
    """Thread-safe application state container."""
    
    # Threading
    lock: Lock = field(default_factory=Lock)
    running: bool = False
    
    # Frame data
    latest_jpeg: Optional[bytes] = None
    frame_index: int = 0
    frame_size: Tuple[int, int] = (0, 0)  # (width, height)
    
    # Timestamps
    started_at: Optional[str] = None
    
    # Line settings
    line_y: int = 0
    line_x1_ratio: float = 0.1
    line_x2_ratio: float = 0.9
    
    # Counting state
    total_crossings: int = 0
    counts_by_class: Dict[str, int] = field(default_factory=dict)
    counted_ids: Set[int] = field(default_factory=set)
    prev_centers: Dict[int, Tuple[int, int]] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize counts for all classes."""
        if not self.counts_by_class:
            self.counts_by_class = {name: 0 for name in CLASSES.values()}
    
    def reset_counts(self):
        """Reset all counting state."""
        with self.lock:
            self.total_crossings = 0
            self.counts_by_class = {name: 0 for name in CLASSES.values()}
            self.counted_ids.clear()
            self.prev_centers.clear()
    
    def set_line(self, y: int, x1_ratio: float = 0.1, x2_ratio: float = 0.9):
        """Update line position."""
        with self.lock:
            self.line_y = y
            self.line_x1_ratio = x1_ratio
            self.line_x2_ratio = x2_ratio
    
    def update_frame(self, jpeg: bytes, index: int):
        """Update latest frame."""
        with self.lock:
            self.latest_jpeg = jpeg
            self.frame_index = index
    
    def get_frame(self) -> Optional[bytes]:
        """Get latest frame (thread-safe)."""
        with self.lock:
            return self.latest_jpeg
    
    def increment_count(self, class_name: str):
        """Increment count for a class."""
        with self.lock:
            self.total_crossings += 1
            self.counts_by_class[class_name] = self.counts_by_class.get(class_name, 0) + 1
    
    def get_status(self) -> dict:
        """Get current status as dictionary."""
        with self.lock:
            return {
                "total_crossings": self.total_crossings,
                "counts_by_class": dict(self.counts_by_class),
                "frame_index": self.frame_index,
                "line_y": self.line_y,
            }


# Global state instance
state = AppState()
