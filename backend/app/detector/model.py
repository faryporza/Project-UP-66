"""
YOLO model loader and inference.
"""
from typing import Any, Optional
from ultralytics import YOLO

from app.config import MODEL_PATH, DEVICE, CONFIDENCE, IOU, MAX_DET, AGNOSTIC_NMS


# Global model instance (loaded once)
_model: Optional[YOLO] = None


def get_model() -> YOLO:
    """
    Get or initialize the YOLO model (singleton pattern).
    
    Returns:
        Loaded YOLO model
    """
    global _model
    if _model is None:
        _model = YOLO(MODEL_PATH)
    return _model


def track_frame(frame: Any, persist: bool = True) -> Any:
    """
    Run YOLO tracking on a frame.
    
    Args:
        frame: Input frame (numpy array)
        persist: Whether to persist tracking IDs across frames
    
    Returns:
        YOLO Results object
    """
    model = get_model()
    results = model.track(
        frame,
        conf=CONFIDENCE,
        iou=IOU,
        device=DEVICE,
        agnostic_nms=AGNOSTIC_NMS,
        max_det=MAX_DET,
        tracker="bytetrack.yaml",
        persist=persist,
        verbose=False,
    )
    return results[0]
