"""
Background worker for continuous inference.
"""
import cv2
import time
import threading
from typing import Optional

from app.config import JPEG_QUALITY, LINE_Y_RATIO
from app.core.state import state
from app.core.camera import Camera
from app.detector.model import track_frame
from app.detector.counter import LineCrossingCounter
from app.detector.drawer import draw_detections, draw_line, draw_hud
from app.utils.time import now_iso


# Worker thread reference
_worker_thread: Optional[threading.Thread] = None
_stop_event = threading.Event()


def _inference_loop():
    """
    Main inference loop - runs in background thread.
    """
    camera = Camera()
    
    if not camera.open():
        print("[Worker] ERROR: Cannot open video source")
        return
    
    # Initialize line position
    w, h = camera.size
    line_y = int(h * LINE_Y_RATIO)
    state.line_y = line_y
    state.frame_size = (w, h)
    state.started_at = now_iso()
    
    # Initialize counter
    counter = LineCrossingCounter(line_y=line_y)
    
    frame_index = 0
    fps_start = time.time()
    fps_count = 0
    current_fps = 0.0
    
    print(f"[Worker] Started - Source: {camera.source}, Size: {w}x{h}, Line Y: {line_y}")
    
    try:
        while not _stop_event.is_set():
            ok, frame = camera.read()
            
            if not ok or frame is None:
                time.sleep(0.01)
                continue
            
            frame_index += 1
            fps_count += 1
            
            # Calculate FPS every second
            elapsed = time.time() - fps_start
            if elapsed >= 1.0:
                current_fps = fps_count / elapsed
                fps_count = 0
                fps_start = time.time()
            
            # Run YOLO tracking
            result = track_frame(frame)
            
            # Draw detections
            annotated, centers = draw_detections(frame, result.boxes)
            
            # Process line crossing
            if result.boxes is not None and len(result.boxes) > 0 and result.boxes.id is not None:
                boxes = result.boxes.xyxy.cpu().tolist()
                class_ids = [int(c) for c in result.boxes.cls.cpu().tolist()]
                track_ids = [int(t) for t in result.boxes.id.cpu().tolist()]
                
                # Update counter
                counter.update(boxes, class_ids, track_ids)
                
                # Sync counter state to global state
                with state.lock:
                    state.total_crossings = counter.total_crossings
                    state.counts_by_class = dict(counter.counts_by_class)
            
            # Draw line
            draw_line(annotated, line_y, state.line_x1_ratio, state.line_x2_ratio)
            
            # Draw HUD
            draw_hud(annotated, counter.total_crossings, frame_index, current_fps)
            
            # Encode to JPEG
            ok, buf = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
            
            if ok:
                state.update_frame(buf.tobytes(), frame_index)
    
    except Exception as e:
        print(f"[Worker] ERROR: {e}")
    
    finally:
        camera.release()
        print("[Worker] Stopped")


def start_worker():
    """Start the background worker thread."""
    global _worker_thread
    
    if _worker_thread is not None and _worker_thread.is_alive():
        print("[Worker] Already running")
        return
    
    _stop_event.clear()
    state.running = True
    
    _worker_thread = threading.Thread(target=_inference_loop, daemon=True)
    _worker_thread.start()
    
    print("[Worker] Thread started")


def stop_worker():
    """Stop the background worker thread."""
    global _worker_thread
    
    _stop_event.set()
    state.running = False
    
    if _worker_thread is not None:
        _worker_thread.join(timeout=5.0)
        _worker_thread = None
    
    print("[Worker] Thread stopped")
