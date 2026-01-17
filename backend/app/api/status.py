"""
Status API endpoint.
"""
from fastapi import APIRouter

from app.config import MODEL_PATH, DEVICE, CONFIDENCE, IOU, MAX_DET, SHOW_CONF, CLASSES
from app.core.state import state
from app.utils.time import now_iso

router = APIRouter()


@router.get("/status")
def get_status():
    """
    Get current detection status and counts.
    
    Returns:
        JSON with metadata, counts, and line info
    """
    status = state.get_status()
    
    return {
        "meta": {
            "started_at": state.started_at,
            "updated_at": now_iso(),
            "model_path": MODEL_PATH,
            "device": DEVICE,
            "conf": CONFIDENCE,
            "iou": IOU,
            "max_det": MAX_DET,
            "show_conf": SHOW_CONF,
            "frame_index": status["frame_index"],
            "frame_size": list(state.frame_size),
        },
        "counts_total_crossings": status["total_crossings"],
        "counts_by_class": status["counts_by_class"],
        "line": {
            "y": status["line_y"],
            "x1_ratio": state.line_x1_ratio,
            "x2_ratio": state.line_x2_ratio,
        },
        "classes": CLASSES,
    }
