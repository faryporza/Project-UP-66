"""YOLO model loading and inference."""

from pathlib import Path
from typing import Optional

from ultralytics import YOLO

from app.config import config


class YOLODetector:
    """YOLO detector with tracking capabilities."""
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the YOLO detector.
        
        Args:
            model_path: Path to the YOLO model file. If None, uses config value.
        """
        self.model_path = model_path or config.MODEL_PATH
        self.model: Optional[YOLO] = None
        self.loaded = False
    
    def load(self):
        """Load the YOLO model."""
        try:
            model_file = Path(self.model_path)
            
            # If model doesn't exist, use default YOLOv8 model
            if not model_file.exists():
                print(f"Model file not found at {self.model_path}, using yolov8n.pt")
                self.model = YOLO('yolov8n.pt')
            else:
                print(f"Loading model from {self.model_path}")
                self.model = YOLO(str(model_file))
            
            self.loaded = True
            print("YOLO model loaded successfully")
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            raise
    
    def track(self, frame, persist: bool = True, conf: Optional[float] = None, iou: Optional[float] = None):
        """
        Run tracking on a frame.
        
        Args:
            frame: Input frame (numpy array)
            persist: Whether to persist tracks between frames
            conf: Confidence threshold (uses config if None)
            iou: IOU threshold (uses config if None)
        
        Returns:
            YOLO results object
        """
        if not self.loaded or self.model is None:
            raise RuntimeError("Model not loaded. Call load() first.")
        
        conf_threshold = conf if conf is not None else config.CONFIDENCE_THRESHOLD
        iou_threshold = iou if iou is not None else config.IOU_THRESHOLD
        
        results = self.model.track(
            frame,
            persist=persist,
            conf=conf_threshold,
            iou=iou_threshold,
            verbose=False
        )
        
        return results
    
    def get_model_info(self) -> dict:
        """Get model information."""
        if not self.loaded or self.model is None:
            return {"loaded": False}
        
        return {
            "loaded": True,
            "model_path": self.model_path,
            "model_type": self.model.model_name if hasattr(self.model, 'model_name') else "unknown",
            "task": self.model.task if hasattr(self.model, 'task') else "detect"
        }
