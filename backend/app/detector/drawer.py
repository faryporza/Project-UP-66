"""
Drawing utilities for visualization.
"""
import cv2
import numpy as np
from typing import Any, Optional, Tuple, List

from app.config import CLASSES, SHOW_CONF


# Colors (BGR format)
COLOR_BOX = (0, 255, 0)        # Green
COLOR_LINE = (0, 255, 255)     # Yellow
COLOR_CENTER = (255, 255, 0)   # Cyan
COLOR_TEXT = (0, 255, 0)       # Green
COLOR_CROSSING = (0, 0, 255)   # Red


def draw_detections(
    frame: np.ndarray,
    boxes: Any,
    show_conf: float = SHOW_CONF,
    show_ids: bool = True,
) -> Tuple[np.ndarray, List[Tuple[int, int]]]:
    """
    Draw bounding boxes and labels on frame.
    
    Args:
        frame: Input frame
        boxes: YOLO boxes object
        show_conf: Minimum confidence to display
        show_ids: Whether to show tracking IDs
    
    Returns:
        Annotated frame and list of center points
    """
    out = frame.copy()
    centers = []
    
    if boxes is None or len(boxes) == 0:
        return out, centers
    
    # Extract data from boxes
    xyxy = boxes.xyxy.cpu().tolist()
    confs = boxes.conf.cpu().tolist()
    clss = boxes.cls.cpu().tolist()
    ids = boxes.id.cpu().tolist() if boxes.id is not None else [None] * len(xyxy)
    
    for (x1, y1, x2, y2), conf, cid, tid in zip(xyxy, confs, clss, ids):
        # Filter by confidence
        if conf < show_conf:
            continue
        
        cid = int(cid)
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        centers.append((cx, cy))
        
        # Draw bounding box
        cv2.rectangle(out, (x1, y1), (x2, y2), COLOR_BOX, 2)
        
        # Draw center point
        cv2.circle(out, (cx, cy), 4, COLOR_CENTER, -1)
        
        # Build label
        class_name = CLASSES.get(cid, f"class_{cid}")
        label = f"{class_name} {conf:.2f}"
        if show_ids and tid is not None:
            label += f" id:{int(tid)}"
        
        # Draw label background and text
        ty = y1 - 7 if y1 - 7 > 15 else y1 + 20
        cv2.putText(out, label, (x1, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.6, COLOR_BOX, 2)
    
    return out, centers


def draw_line(
    frame: np.ndarray,
    line_y: int,
    x1_ratio: float = 0.1,
    x2_ratio: float = 0.9,
    color: Tuple[int, int, int] = COLOR_LINE,
    thickness: int = 3,
) -> np.ndarray:
    """
    Draw the counting line on frame.
    
    Args:
        frame: Input frame
        line_y: Y coordinate of line
        x1_ratio: Start X ratio (0-1)
        x2_ratio: End X ratio (0-1)
        color: Line color (BGR)
        thickness: Line thickness
    
    Returns:
        Frame with line drawn
    """
    h, w = frame.shape[:2]
    x1 = int(w * x1_ratio)
    x2 = int(w * x2_ratio)
    cv2.line(frame, (x1, line_y), (x2, line_y), color, thickness)
    return frame


def draw_hud(
    frame: np.ndarray,
    total_crossings: int,
    frame_index: int = 0,
    fps: float = 0.0,
) -> np.ndarray:
    """
    Draw heads-up display (HUD) with stats.
    
    Args:
        frame: Input frame
        total_crossings: Total crossing count
        frame_index: Current frame number
        fps: Current FPS
    
    Returns:
        Frame with HUD
    """
    # Crossing count (top-left)
    cv2.putText(
        frame,
        f"Crossings: {total_crossings}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        COLOR_TEXT,
        2,
    )
    
    # Frame info (top-right)
    h, w = frame.shape[:2]
    info_text = f"Frame: {frame_index}"
    if fps > 0:
        info_text += f" | FPS: {fps:.1f}"
    
    text_size = cv2.getTextSize(info_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
    cv2.putText(
        frame,
        info_text,
        (w - text_size[0] - 10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        COLOR_TEXT,
        2,
    )
    
    return frame
