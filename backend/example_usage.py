"""Example usage of the YOLO Line Crossing API."""

import requests
import time

# Configuration
API_BASE_URL = "http://localhost:8000/api"


def check_health():
    """Check if the API is healthy."""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        print(f"Health Check: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error checking health: {e}")
        return False


def get_status():
    """Get current status and counts."""
    try:
        response = requests.get(f"{API_BASE_URL}/status", timeout=5)
        data = response.json()
        print("\nCurrent Status:")
        print(f"  Worker Running: {data['worker_running']}")
        print(f"  FPS: {data['fps']}")
        print(f"  Inference Time: {data['inference_time_ms']} ms")
        print(f"  Counts:")
        print(f"    - Up: {data['counts']['up_count']}")
        print(f"    - Down: {data['counts']['down_count']}")
        print(f"    - Total: {data['counts']['total_count']}")
        print(f"  Line Y: {data['line_y']}")
        return data
    except Exception as e:
        print(f"Error getting status: {e}")
        return None


def reset_counts():
    """Reset the counting statistics."""
    try:
        response = requests.post(f"{API_BASE_URL}/reset", timeout=5)
        data = response.json()
        print(f"\nReset Counts: {data['message']}")
        return True
    except Exception as e:
        print(f"Error resetting counts: {e}")
        return False


def update_line_position(line_y: int):
    """Update the line position."""
    try:
        response = requests.post(
            f"{API_BASE_URL}/line",
            json={"line_y": line_y},
            timeout=5
        )
        data = response.json()
        print(f"\nUpdate Line: {data['message']} (Y={data['line_y']})")
        return True
    except Exception as e:
        print(f"Error updating line position: {e}")
        return False


def start_worker():
    """Start the inference worker."""
    try:
        response = requests.post(f"{API_BASE_URL}/start", timeout=5)
        data = response.json()
        print(f"\nStart Worker: {data['message']}")
        return True
    except Exception as e:
        print(f"Error starting worker: {e}")
        return False


def stop_worker():
    """Stop the inference worker."""
    try:
        response = requests.post(f"{API_BASE_URL}/stop", timeout=5)
        data = response.json()
        print(f"\nStop Worker: {data['message']}")
        return True
    except Exception as e:
        print(f"Error stopping worker: {e}")
        return False


def monitor_status(duration: int = 30, interval: int = 2):
    """Monitor status for a duration."""
    print(f"\nMonitoring status for {duration} seconds...")
    start_time = time.time()
    
    while time.time() - start_time < duration:
        status = get_status()
        if status:
            print(f"  [{time.time() - start_time:.1f}s] "
                  f"FPS: {status['fps']:.1f}, "
                  f"Total: {status['counts']['total_count']}")
        time.sleep(interval)


def main():
    """Main example function."""
    print("=" * 60)
    print("YOLO Line Crossing API - Example Usage")
    print("=" * 60)
    
    # Check health
    print("\n1. Checking API health...")
    if not check_health():
        print("❌ API is not responding. Make sure the server is running:")
        print("   cd backend && python -m app.main")
        return
    
    print("✅ API is healthy!")
    
    # Get initial status
    print("\n2. Getting initial status...")
    get_status()
    
    # Reset counts
    print("\n3. Resetting counts...")
    reset_counts()
    time.sleep(1)
    get_status()
    
    # Update line position
    print("\n4. Updating line position...")
    update_line_position(300)
    time.sleep(1)
    get_status()
    
    # Monitor for a while
    print("\n5. Monitoring status...")
    monitor_status(duration=10, interval=2)
    
    # Final status
    print("\n6. Final status...")
    get_status()
    
    print("\n" + "=" * 60)
    print("Example completed!")
    print("=" * 60)
    print("\nTo view the video stream, open:")
    print(f"  {API_BASE_URL}/stream")
    print("\nOr use this HTML:")
    print(f'  <img src="{API_BASE_URL}/stream" />')


if __name__ == "__main__":
    main()
