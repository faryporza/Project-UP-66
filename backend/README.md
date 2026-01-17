# YOLO Line Crossing Backend

FastAPI backend for YOLO object detection with line crossing counting and MJPEG streaming.

## Features

- 🎯 **YOLO Object Detection**: Uses Ultralytics YOLO for real-time object detection and tracking
- 📏 **Line Crossing Counter**: Counts objects crossing a configurable horizontal line
- 📹 **MJPEG Streaming**: Real-time video stream with annotations via HTTP
- ⚡ **Background Worker**: Non-blocking inference using background threads
- 🎨 **Visual Annotations**: Bounding boxes, tracking IDs, counting line, and HUD
- 🐳 **Docker Support**: Both CPU and GPU Docker configurations
- 🔧 **RESTful API**: Complete API for status, control, and streaming

## Architecture

```
Camera/Video → YOLO Track → Line Crossing Counter → Shared State
                                                           ↓
                                                    /api/stream  /api/status
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── config.py            # Configuration and environment variables
│   ├── detector/
│   │   ├── model.py         # YOLO model loading and tracking
│   │   ├── counter.py       # Line crossing counting logic
│   │   └── drawer.py        # Frame annotation (boxes, line, HUD)
│   ├── api/
│   │   ├── status.py        # GET /api/status, /api/health
│   │   ├── stream.py        # GET /api/stream (MJPEG)
│   │   └── control.py       # POST /api/reset, /api/line, /api/start, /api/stop
│   ├── core/
│   │   ├── camera.py        # Video source handling
│   │   ├── worker.py        # Background inference worker
│   │   └── state.py         # Shared state management
│   └── utils/
│       ├── geometry.py      # Geometric calculations
│       └── time.py          # Time utilities and FPS counter
├── models/
│   └── best.pt              # YOLO model (place your model here)
├── requirements.txt
├── Dockerfile.cpu
├── Dockerfile.gpu
├── docker-compose.cpu.yml
├── docker-compose.gpu.yml
└── README.md
```

## Installation

### Local Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Place your YOLO model** (optional)
   ```bash
   # If you have a custom model, place it in models/best.pt
   # Otherwise, the system will use yolov8n.pt by default
   ```

5. **Run the application**
   ```bash
   python -m app.main
   ```

### Docker Installation

#### CPU Version
```bash
docker-compose -f docker-compose.cpu.yml up --build
```

#### GPU Version (requires NVIDIA Docker)
```bash
docker-compose -f docker-compose.gpu.yml up --build
```

## Configuration

Configuration is done via environment variables. See `app/config.py` for all options.

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `MODEL_PATH` | `models/best.pt` | Path to YOLO model |
| `VIDEO_SOURCE` | `0` | Video source (0 for webcam, or path to video file) |
| `CONFIDENCE_THRESHOLD` | `0.5` | Detection confidence threshold |
| `IOU_THRESHOLD` | `0.45` | IOU threshold for NMS |
| `LINE_Y_PERCENT` | `0.5` | Line position as percentage of frame height |
| `CROSSING_MARGIN` | `5` | Pixels margin for crossing detection |
| `JPEG_QUALITY` | `80` | JPEG quality for streaming (0-100) |
| `STREAM_FPS` | `15` | Stream frame rate |
| `WORKER_ENABLED` | `true` | Auto-start worker on startup |

### Example Configuration

```bash
# For video file
export VIDEO_SOURCE=/path/to/video.mp4

# For webcam
export VIDEO_SOURCE=0

# Adjust detection threshold
export CONFIDENCE_THRESHOLD=0.6

# Adjust line position (30% from top)
export LINE_Y_PERCENT=0.3
```

## API Endpoints

### Status Endpoints

#### `GET /api/status`
Get current system status, counts, and performance metrics.

**Response:**
```json
{
  "worker_running": true,
  "worker_error": null,
  "counts": {
    "up_count": 5,
    "down_count": 3,
    "total_count": 8,
    "last_reset": "2024-01-01T12:00:00"
  },
  "line_y": 240,
  "fps": 28.5,
  "inference_time_ms": 35.2,
  "last_update": "2024-01-01T12:00:01",
  "has_frame": true
}
```

#### `GET /api/health`
Simple health check.

**Response:**
```json
{
  "status": "healthy",
  "worker_running": true
}
```

### Stream Endpoint

#### `GET /api/stream`
MJPEG video stream with annotations.

Access via:
- Browser: `http://localhost:8000/api/stream`
- HTML: `<img src="http://localhost:8000/api/stream" />`

### Control Endpoints

#### `POST /api/reset`
Reset counting statistics.

**Response:**
```json
{
  "message": "Counts reset successfully",
  "up_count": 0,
  "down_count": 0
}
```

#### `POST /api/line`
Update line position.

**Request:**
```json
{
  "line_y": 300
}
```

**Response:**
```json
{
  "message": "Line position updated successfully",
  "line_y": 300
}
```

#### `POST /api/start`
Start the inference worker.

#### `POST /api/stop`
Stop the inference worker.

## Usage Examples

### Python Client

```python
import requests

# Get status
response = requests.get("http://localhost:8000/api/status")
print(response.json())

# Reset counts
response = requests.post("http://localhost:8000/api/reset")
print(response.json())

# Update line position
response = requests.post(
    "http://localhost:8000/api/line",
    json={"line_y": 300}
)
print(response.json())
```

### HTML Client

```html
<!DOCTYPE html>
<html>
<head>
    <title>YOLO Line Crossing Stream</title>
</head>
<body>
    <h1>Live Stream</h1>
    <img src="http://localhost:8000/api/stream" style="width: 100%; max-width: 800px;" />
    
    <h2>Status</h2>
    <div id="status"></div>
    
    <button onclick="resetCounts()">Reset Counts</button>
    
    <script>
        async function updateStatus() {
            const response = await fetch('http://localhost:8000/api/status');
            const data = await response.json();
            document.getElementById('status').innerHTML = JSON.stringify(data, null, 2);
        }
        
        async function resetCounts() {
            await fetch('http://localhost:8000/api/reset', { method: 'POST' });
            updateStatus();
        }
        
        setInterval(updateStatus, 1000);
        updateStatus();
    </script>
</body>
</html>
```

### cURL

```bash
# Get status
curl http://localhost:8000/api/status

# Reset counts
curl -X POST http://localhost:8000/api/reset

# Update line position
curl -X POST http://localhost:8000/api/line \
  -H "Content-Type: application/json" \
  -d '{"line_y": 300}'
```

## Development

### Running in Development Mode

```bash
# With auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing with Different Video Sources

```bash
# Webcam
export VIDEO_SOURCE=0
python -m app.main

# Video file
export VIDEO_SOURCE=/path/to/video.mp4
python -m app.main

# RTSP stream
export VIDEO_SOURCE=rtsp://username:password@ip:port/stream
python -m app.main
```

## Troubleshooting

### Model Not Found
If you see "Model file not found", the system will automatically download and use `yolov8n.pt`. To use a custom model:
```bash
# Place your model in the models directory
mkdir -p models
cp /path/to/your/model.pt models/best.pt
```

### Webcam Not Working
- Ensure `/dev/video0` exists and is accessible
- Try different video sources: `VIDEO_SOURCE=1` or `VIDEO_SOURCE=2`
- Check permissions: `sudo chmod 666 /dev/video0`

### Low FPS
- Reduce `CONFIDENCE_THRESHOLD` to process fewer detections
- Use a smaller YOLO model (e.g., `yolov8n.pt` instead of `yolov8x.pt`)
- Reduce `STREAM_FPS` for slower streaming
- Use GPU version for better performance

### GPU Not Working (Docker)
- Install NVIDIA Docker: https://github.com/NVIDIA/nvidia-docker
- Verify GPU access: `docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi`

## License

MIT License

## Credits

- **Ultralytics YOLO**: https://github.com/ultralytics/ultralytics
- **FastAPI**: https://fastapi.tiangolo.com/
- **OpenCV**: https://opencv.org/
