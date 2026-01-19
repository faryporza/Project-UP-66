"""Geometry utility functions."""

from typing import Tuple


def side_of_line(y_position: float, line_y: float) -> int:
    """
    Determine which side of the line a point is on.
    
    Args:
        y_position: Y coordinate of the point
        line_y: Y coordinate of the line
    
    Returns:
        1 if below the line, -1 if above the line, 0 if on the line
    """
    if y_position > line_y:
        return 1
    elif y_position < line_y:
        return -1
    return 0


def has_crossed_line(prev_y: float, curr_y: float, line_y: float, margin: int = 5) -> Tuple[bool, str]:
    """
    Check if an object has crossed the line with margin.
    
    Args:
        prev_y: Previous Y position
        curr_y: Current Y position
        line_y: Line Y position
        margin: Margin in pixels to consider as crossing
    
    Returns:
        Tuple of (crossed, direction) where direction is 'up', 'down', or ''
    """
    # Check if crossed from top to bottom (down)
    if prev_y < line_y - margin and curr_y > line_y + margin:
        return True, 'down'
    
    # Check if crossed from bottom to top (up)
    if prev_y > line_y + margin and curr_y < line_y - margin:
        return True, 'up'
    
    return False, ''


def get_bbox_center(bbox: Tuple[float, float, float, float]) -> Tuple[float, float]:
    """
    Get the center point of a bounding box.
    
    Args:
        bbox: Bounding box as (x1, y1, x2, y2)
    
    Returns:
        Tuple of (center_x, center_y)
    """
    x1, y1, x2, y2 = bbox
    center_x = (x1 + x2) / 2
    center_y = (y1 + y2) / 2
    return center_x, center_y


def get_bbox_bottom_center(bbox: Tuple[float, float, float, float]) -> Tuple[float, float]:
    """
    Get the bottom center point of a bounding box.
    
    Args:
        bbox: Bounding box as (x1, y1, x2, y2)
    
    Returns:
        Tuple of (center_x, bottom_y)
    """
    x1, y1, x2, y2 = bbox
    center_x = (x1 + x2) / 2
    bottom_y = y2
    return center_x, bottom_y
