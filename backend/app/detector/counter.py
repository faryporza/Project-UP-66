"""Line crossing counter logic."""

from typing import Dict, Tuple

from app.config import config
from app.utils.geometry import get_bbox_bottom_center, has_crossed_line


class LineCrossingCounter:
    """Counter for tracking objects crossing a line."""
    
    def __init__(self, line_y: int, margin: int = None):
        """
        Initialize the line crossing counter.
        
        Args:
            line_y: Y coordinate of the counting line
            margin: Margin in pixels for crossing detection (uses config if None)
        """
        self.line_y = line_y
        self.margin = margin if margin is not None else config.CROSSING_MARGIN
        
        # Track previous positions of objects by their ID
        self.prev_positions: Dict[int, float] = {}
        
        # Counts
        self.up_count = 0
        self.down_count = 0
    
    def update(self, detections) -> Tuple[int, int]:
        """
        Update the counter with new detections.
        
        Args:
            detections: YOLO detection results
        
        Returns:
            Tuple of (up_count, down_count)
        """
        current_ids = set()
        
        if detections is None or len(detections) == 0:
            return self.up_count, self.down_count
        
        # Process each detection
        for detection in detections:
            if detection.boxes is None or len(detection.boxes) == 0:
                continue
            
            boxes = detection.boxes
            
            # Check if tracking IDs are available
            if boxes.id is None:
                continue
            
            for i, track_id in enumerate(boxes.id):
                track_id = int(track_id.item())
                current_ids.add(track_id)
                
                # Get bounding box
                bbox = boxes.xyxy[i].cpu().numpy()
                
                # Get bottom center point (better for counting people/vehicles)
                _, curr_y = get_bbox_bottom_center(bbox)
                
                # Check if we have a previous position for this ID
                if track_id in self.prev_positions:
                    prev_y = self.prev_positions[track_id]
                    
                    # Check if crossed the line
                    crossed, direction = has_crossed_line(
                        prev_y, curr_y, self.line_y, self.margin
                    )
                    
                    if crossed:
                        if direction == 'up':
                            self.up_count += 1
                            print(f"Object {track_id} crossed UP (total: {self.up_count})")
                        elif direction == 'down':
                            self.down_count += 1
                            print(f"Object {track_id} crossed DOWN (total: {self.down_count})")
                
                # Update position
                self.prev_positions[track_id] = curr_y
        
        # Clean up old tracks that are no longer present
        old_ids = set(self.prev_positions.keys()) - current_ids
        for old_id in old_ids:
            del self.prev_positions[old_id]
        
        return self.up_count, self.down_count
    
    def reset(self):
        """Reset the counter."""
        self.up_count = 0
        self.down_count = 0
        self.prev_positions.clear()
    
    def set_line_y(self, line_y: int):
        """Update the line position."""
        self.line_y = line_y
        # Reset positions when line changes
        self.prev_positions.clear()
    
    def get_counts(self) -> Tuple[int, int]:
        """Get current counts."""
        return self.up_count, self.down_count
