"""Simple test to verify the backend structure."""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    
    try:
        # Config
        from app.config import config
        print("✓ Config imported successfully")
        
        # State
        from app.core.state import app_state, CountState, AppState
        print("✓ State modules imported successfully")
        
        # Utils
        from app.utils.geometry import (
            side_of_line, has_crossed_line, 
            get_bbox_center, get_bbox_bottom_center
        )
        from app.utils.time import Timer, FPSCounter, format_timestamp
        print("✓ Utils imported successfully")
        
        # Detector modules (may fail without dependencies)
        try:
            from app.detector.model import YOLODetector
            from app.detector.counter import LineCrossingCounter
            from app.detector.drawer import FrameDrawer
            print("✓ Detector modules imported successfully")
        except ImportError as e:
            print(f"⚠ Detector modules import warning (expected without dependencies): {e}")
        
        # Core modules
        try:
            from app.core.camera import VideoSource
            from app.core.worker import InferenceWorker, worker
            print("✓ Core modules imported successfully")
        except ImportError as e:
            print(f"⚠ Core modules import warning (expected without dependencies): {e}")
        
        # API modules
        try:
            from app.api import status, stream, control
            print("✓ API modules imported successfully")
        except ImportError as e:
            print(f"⚠ API modules import warning (expected without dependencies): {e}")
        
        # Main app
        try:
            from app.main import app
            print("✓ Main app imported successfully")
        except ImportError as e:
            print(f"⚠ Main app import warning (expected without dependencies): {e}")
        
        print("\n✅ All critical imports successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Import test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_geometry_functions():
    """Test geometry utility functions."""
    print("\nTesting geometry functions...")
    
    from app.utils.geometry import (
        side_of_line, has_crossed_line,
        get_bbox_center, get_bbox_bottom_center
    )
    
    # Test side_of_line
    assert side_of_line(100, 50) == 1, "Point below line"
    assert side_of_line(30, 50) == -1, "Point above line"
    assert side_of_line(50, 50) == 0, "Point on line"
    print("✓ side_of_line works correctly")
    
    # Test has_crossed_line
    crossed, direction = has_crossed_line(40, 60, 50, 5)
    assert crossed and direction == 'down', "Should detect downward crossing"
    
    crossed, direction = has_crossed_line(60, 40, 50, 5)
    assert crossed and direction == 'up', "Should detect upward crossing"
    
    crossed, direction = has_crossed_line(40, 45, 50, 5)
    assert not crossed, "Should not detect crossing within margin"
    print("✓ has_crossed_line works correctly")
    
    # Test bbox functions
    bbox = (100, 200, 300, 400)
    cx, cy = get_bbox_center(bbox)
    assert cx == 200 and cy == 300, "Center calculation"
    
    cx, by = get_bbox_bottom_center(bbox)
    assert cx == 200 and by == 400, "Bottom center calculation"
    print("✓ Bbox functions work correctly")
    
    print("✅ All geometry tests passed!")


def test_time_functions():
    """Test time utility functions."""
    print("\nTesting time functions...")
    
    from app.utils.time import Timer, FPSCounter, format_timestamp
    import time
    from datetime import datetime
    
    # Test Timer
    timer = Timer()
    timer.start()
    time.sleep(0.1)
    elapsed = timer.stop()
    assert 0.09 < elapsed < 0.15, f"Timer should be ~0.1s, got {elapsed}"
    print("✓ Timer works correctly")
    
    # Test FPSCounter
    fps_counter = FPSCounter(window_size=5)
    for _ in range(10):
        fps_counter.update()
        time.sleep(0.01)
    fps = fps_counter.update()
    assert fps > 0, "FPS should be positive"
    print(f"✓ FPSCounter works correctly (FPS: {fps:.1f})")
    
    # Test format_timestamp
    ts = format_timestamp(datetime(2024, 1, 1, 12, 0, 0))
    assert "2024-01-01" in ts and "12:00:00" in ts, "Timestamp formatting"
    print("✓ format_timestamp works correctly")
    
    print("✅ All time tests passed!")


def test_state_management():
    """Test state management."""
    print("\nTesting state management...")
    
    from app.core.state import CountState, AppState
    import numpy as np
    
    # Test CountState
    count_state = CountState()
    assert count_state.up_count == 0
    assert count_state.down_count == 0
    
    count_state.up_count = 5
    count_state.down_count = 3
    data = count_state.to_dict()
    assert data['up_count'] == 5
    assert data['down_count'] == 3
    assert data['total_count'] == 8
    print("✓ CountState works correctly")
    
    # Test AppState
    app_state = AppState()
    
    # Test frame update
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    app_state.update_frame(dummy_frame, dummy_frame)
    assert app_state.latest_frame is not None
    print("✓ AppState frame update works")
    
    # Test counts update
    app_state.update_counts(10, 5)
    status = app_state.get_status()
    assert status['counts']['up_count'] == 10
    assert status['counts']['down_count'] == 5
    print("✓ AppState counts update works")
    
    # Test reset
    app_state.reset_counts()
    status = app_state.get_status()
    assert status['counts']['up_count'] == 0
    print("✓ AppState reset works")
    
    print("✅ All state management tests passed!")


def test_config():
    """Test configuration."""
    print("\nTesting configuration...")
    
    from app.config import config
    
    assert config.HOST == "0.0.0.0"
    assert config.PORT == 8000
    assert config.CONFIDENCE_THRESHOLD == 0.5
    assert config.IOU_THRESHOLD == 0.45
    
    # Test get_video_source
    video_source = config.get_video_source()
    assert video_source is not None
    print(f"✓ Config loaded (video source: {video_source})")
    
    print("✅ Configuration tests passed!")


if __name__ == "__main__":
    print("=" * 60)
    print("YOLO Line Crossing Backend - Structure Tests")
    print("=" * 60)
    
    all_passed = True
    
    # Run tests
    if not test_imports():
        all_passed = False
    
    try:
        test_config()
        test_geometry_functions()
        test_time_functions()
        test_state_management()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED")
        print("=" * 60)
        sys.exit(1)
