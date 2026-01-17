"""
Line crossing counter logic.
"""
from typing import Dict, Set, Tuple, Optional, List
from dataclasses import dataclass, field

from app.config import CLASSES, COUNT_CLASS_IDS, LINE_MARGIN, DIRECTION
from app.utils.geometry import crossed_line, get_center


@dataclass
class LineCrossingCounter:
    """
    Counts objects crossing a horizontal line using tracking IDs.
    """
    
    line_y: int = 0
    margin: int = LINE_MARGIN
    direction: str = DIRECTION
    
    # Internal state
    prev_centers: Dict[int, Tuple[int, int]] = field(default_factory=dict)
    counted_ids: Set[int] = field(default_factory=set)
    total_crossings: int = 0
    counts_by_class: Dict[str, int] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize counts for all classes."""
        if not self.counts_by_class:
            self.counts_by_class = {name: 0 for name in CLASSES.values()}
    
    def reset(self):
        """Reset all counting state."""
        self.prev_centers.clear()
        self.counted_ids.clear()
        self.total_crossings = 0
        self.counts_by_class = {name: 0 for name in CLASSES.values()}
    
    def update(
        self,
        boxes: List[Tuple[float, float, float, float]],
        class_ids: List[int],
        track_ids: List[int],
    ) -> List[Tuple[int, int, str]]:
        """
        Process detections and count line crossings.
        
        Args:
            boxes: List of (x1, y1, x2, y2) bounding boxes
            class_ids: List of class IDs
            track_ids: List of tracking IDs
        
        Returns:
            List of (track_id, class_id, direction) for new crossings
        """
        crossings = []
        
        for box, cid, tid in zip(boxes, class_ids, track_ids):
            # Skip classes not in counting list
            if cid not in COUNT_CLASS_IDS:
                continue
            
            # Get center point
            cx, cy = get_center(box)
            
            # Check for crossing if we have previous position
            if tid in self.prev_centers:
                _, prev_cy = self.prev_centers[tid]
                
                cross_dir = crossed_line(
                    prev_cy, cy,
                    self.line_y, self.margin,
                    self.direction
                )
                
                # Count if crossed and not already counted
                if cross_dir and tid not in self.counted_ids:
                    self.counted_ids.add(tid)
                    self.total_crossings += 1
                    
                    class_name = CLASSES.get(cid, f"class_{cid}")
                    self.counts_by_class[class_name] = self.counts_by_class.get(class_name, 0) + 1
                    
                    crossings.append((tid, cid, cross_dir))
            
            # Update previous center
            self.prev_centers[tid] = (cx, cy)
        
        return crossings
    
    def get_counts(self) -> dict:
        """Get current counts."""
        return {
            "total_crossings": self.total_crossings,
            "counts_by_class": dict(self.counts_by_class),
        }
