"""Background worker for continuous inference."""

import threading
import time
from typing import Optional

from app.config import config
from app.core.camera import VideoSource
from app.core.state import app_state
from app.detector.counter import LineCrossingCounter
from app.detector.drawer import FrameDrawer
from app.detector.model import YOLODetector
from app.utils.time import FPSCounter, Timer


class InferenceWorker:
    """Background worker for running YOLO inference continuously."""
    
    def __init__(self):
        """Initialize the inference worker."""
        self.thread: Optional[threading.Thread] = None
        self.running = False
        self.detector: Optional[YOLODetector] = None
        self.counter: Optional[LineCrossingCounter] = None
        self.drawer: Optional[FrameDrawer] = None
        self.video_source: Optional[VideoSource] = None
    
    def start(self):
        """Start the background worker thread."""
        if self.running:
            print("Worker already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        print("Inference worker started")
    
    def stop(self):
        """Stop the background worker thread."""
        if not self.running:
            return
        
        self.running = False
        if self.thread is not None:
            self.thread.join(timeout=5.0)
        
        # Release resources
        if self.video_source is not None:
            self.video_source.release()
        
        app_state.worker_running = False
        print("Inference worker stopped")
    
    def _initialize_components(self) -> bool:
        """
        Initialize all components.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Initialize video source
            self.video_source = VideoSource()
            if not self.video_source.open():
                raise RuntimeError("Failed to open video source")
            
            # Calculate line position
            _, height = self.video_source.get_frame_dimensions()
            line_y = int(height * config.LINE_Y_PERCENT)
            app_state.set_line_y(line_y)
            
            # Initialize detector
            self.detector = YOLODetector()
            self.detector.load()
            
            # Initialize counter
            self.counter = LineCrossingCounter(line_y)
            
            # Initialize drawer
            self.drawer = FrameDrawer()
            
            app_state.worker_error = None
            return True
            
        except Exception as e:
            error_msg = f"Failed to initialize components: {e}"
            print(error_msg)
            app_state.worker_error = error_msg
            return False
    
    def _run(self):
        """Main worker loop."""
        print("Worker thread starting...")
        app_state.worker_running = True
        
        # Initialize components
        if not self._initialize_components():
            app_state.worker_running = False
            return
        
        # Main inference loop
        fps_counter = FPSCounter()
        inference_timer = Timer()
        
        print("Starting inference loop...")
        
        while self.running:
            try:
                # Read frame
                ret, frame = self.video_source.read()
                
                if not ret or frame is None:
                    # Try to restart if it's a video file
                    if self.video_source.is_file():
                        print("End of video, restarting...")
                        self.video_source.restart()
                        continue
                    else:
                        print("Failed to read frame from webcam")
                        time.sleep(0.1)
                        continue
                
                # Run inference
                inference_timer.start()
                results = self.detector.track(frame)
                inference_time = inference_timer.stop()
                
                # Update counter
                up_count, down_count = self.counter.update(results)
                
                # Update FPS
                current_fps = fps_counter.update()
                
                # Annotate frame
                annotated = self.drawer.annotate_frame(
                    frame,
                    results,
                    self.counter.line_y,
                    up_count,
                    down_count,
                    current_fps
                )
                
                # Update shared state
                app_state.update_frame(frame, annotated)
                app_state.update_counts(up_count, down_count)
                app_state.update_metrics(current_fps, inference_time)
                
            except Exception as e:
                error_msg = f"Error in inference loop: {e}"
                print(error_msg)
                app_state.worker_error = error_msg
                # Continue running despite errors
                time.sleep(0.1)
        
        print("Worker thread exiting...")
        app_state.worker_running = False
    
    def reset_counts(self):
        """Reset the counter."""
        if self.counter is not None:
            self.counter.reset()
            app_state.reset_counts()
    
    def set_line_y(self, line_y: int):
        """Update the line position."""
        if self.counter is not None:
            self.counter.set_line_y(line_y)
            app_state.set_line_y(line_y)


# Global worker instance
worker = InferenceWorker()
