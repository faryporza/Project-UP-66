"""
Geometry utilities for line crossing detection.
"""
from typing import Optional, Tuple


def side_of_line(cy: int, line_y: int, margin: int = 0) -> str:
    """
    Determine which side of the line a point is on.
    
    Args:
        cy: Y coordinate of the point
        line_y: Y coordinate of the line
        margin: Margin around the line (dead zone)
    
    Returns:
        "above", "below", or "on" (within margin)
    """
    if cy < (line_y - margin):
        return "above"
    elif cy > (line_y + margin):
        return "below"
    return "on"


def crossed_line(
    prev_cy: int,
    curr_cy: int,
    line_y: int,
    margin: int,
    direction: str = "both"
) -> Optional[str]:
    """
    Check if a point crossed the line between two frames.
    
    Args:
        prev_cy: Previous Y coordinate
        curr_cy: Current Y coordinate
        line_y: Y coordinate of the line
        margin: Margin for crossing detection
        direction: "both", "down" (above->below), or "up" (below->above)
    
    Returns:
        "down", "up", or None if no crossing
    """
    # Check for downward crossing (above -> below)
    if direction in ("both", "down"):
        if prev_cy < (line_y - margin) and curr_cy > (line_y + margin):
            return "down"
    
    # Check for upward crossing (below -> above)
    if direction in ("both", "up"):
        if prev_cy > (line_y + margin) and curr_cy < (line_y - margin):
            return "up"
    
    return None


def get_center(box: Tuple[float, float, float, float]) -> Tuple[int, int]:
    """
    Get center point of a bounding box.
    
    Args:
        box: (x1, y1, x2, y2) coordinates
    
    Returns:
        (cx, cy) center coordinates
    """
    x1, y1, x2, y2 = box
    return int((x1 + x2) / 2), int((y1 + y2) / 2)
