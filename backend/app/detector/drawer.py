"""Drawing utilities for visualization."""

import cv2
import numpy as np

from app.config import config
from app.utils.geometry import get_bbox_bottom_center


class FrameDrawer:
    """Drawer for annotating frames with detections and HUD."""
    
    def __init__(self):
        """Initialize the frame drawer."""
        self.font = cv2.FONT_HERSHEY_SIMPLEX
        self.font_scale = 0.6
        self.font_thickness = 2
        self.line_thickness = 2
        self.box_thickness = 2
    
    def draw_line(self, frame: np.ndarray, line_y: int) -> np.ndarray:
        """
        Draw the counting line on the frame.
        
        Args:
            frame: Input frame
            line_y: Y coordinate of the line
        
        Returns:
            Frame with line drawn
        """
        h, w = frame.shape[:2]
        cv2.line(
            frame,
            (0, line_y),
            (w, line_y),
            config.COLOR_LINE,
            self.line_thickness
        )
        return frame
    
    def draw_detections(self, frame: np.ndarray, detections, line_y: int) -> np.ndarray:
        """
        Draw bounding boxes and tracking information.
        
        Args:
            frame: Input frame
            detections: YOLO detection results
            line_y: Y coordinate of the counting line
        
        Returns:
            Frame with detections drawn
        """
        if detections is None or len(detections) == 0:
            return frame
        
        for detection in detections:
            if detection.boxes is None or len(detection.boxes) == 0:
                continue
            
            boxes = detection.boxes
            
            for i in range(len(boxes)):
                # Get bounding box coordinates
                bbox = boxes.xyxy[i].cpu().numpy()
                x1, y1, x2, y2 = map(int, bbox)
                
                # Get confidence
                conf = float(boxes.conf[i]) if boxes.conf is not None else 0.0
                
                # Get class
                cls = int(boxes.cls[i]) if boxes.cls is not None else 0
                class_name = detection.names[cls] if hasattr(detection, 'names') else str(cls)
                
                # Get track ID if available
                track_id = None
                if boxes.id is not None:
                    track_id = int(boxes.id[i].item())
                
                # Draw bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), config.COLOR_BOX, self.box_thickness)
                
                # Prepare label
                if track_id is not None:
                    label = f"ID:{track_id} {class_name} {conf:.2f}"
                else:
                    label = f"{class_name} {conf:.2f}"
                
                # Draw label background
                (label_w, label_h), _ = cv2.getTextSize(
                    label, self.font, self.font_scale, self.font_thickness
                )
                cv2.rectangle(
                    frame,
                    (x1, y1 - label_h - 10),
                    (x1 + label_w, y1),
                    config.COLOR_BOX,
                    -1
                )
                
                # Draw label text
                cv2.putText(
                    frame,
                    label,
                    (x1, y1 - 5),
                    self.font,
                    self.font_scale,
                    config.COLOR_TEXT,
                    self.font_thickness
                )
                
                # Draw bottom center point
                center_x, bottom_y = get_bbox_bottom_center(bbox)
                cv2.circle(frame, (int(center_x), int(bottom_y)), 5, config.COLOR_LINE, -1)
        
        return frame
    
    def draw_hud(self, frame: np.ndarray, up_count: int, down_count: int, fps: float) -> np.ndarray:
        """
        Draw HUD (heads-up display) with counts and FPS.
        
        Args:
            frame: Input frame
            up_count: Count of objects crossing up
            down_count: Count of objects crossing down
            fps: Current FPS
        
        Returns:
            Frame with HUD drawn
        """
        h, w = frame.shape[:2]
        
        # Prepare HUD text
        hud_lines = [
            f"UP: {up_count}",
            f"DOWN: {down_count}",
            f"TOTAL: {up_count + down_count}",
            f"FPS: {fps:.1f}"
        ]
        
        # Draw HUD background
        hud_height = len(hud_lines) * 30 + 20
        cv2.rectangle(
            frame,
            (10, 10),
            (200, 10 + hud_height),
            config.COLOR_BG,
            -1
        )
        
        # Draw HUD text
        y_offset = 35
        for line in hud_lines:
            cv2.putText(
                frame,
                line,
                (20, y_offset),
                self.font,
                self.font_scale,
                config.COLOR_TEXT,
                self.font_thickness
            )
            y_offset += 30
        
        return frame
    
    def annotate_frame(
        self,
        frame: np.ndarray,
        detections,
        line_y: int,
        up_count: int,
        down_count: int,
        fps: float
    ) -> np.ndarray:
        """
        Fully annotate a frame with all visualizations.
        
        Args:
            frame: Input frame
            detections: YOLO detection results
            line_y: Y coordinate of the counting line
            up_count: Count of objects crossing up
            down_count: Count of objects crossing down
            fps: Current FPS
        
        Returns:
            Fully annotated frame
        """
        # Make a copy to avoid modifying the original
        annotated = frame.copy()
        
        # Draw in order: line -> detections -> HUD
        annotated = self.draw_line(annotated, line_y)
        annotated = self.draw_detections(annotated, detections, line_y)
        annotated = self.draw_hud(annotated, up_count, down_count, fps)
        
        return annotated
