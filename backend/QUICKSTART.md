# Quick Start Guide

Get started with YOLO Line Crossing in 5 minutes!

## Prerequisites

- Python 3.11+ (or Docker)
- Webcam or video file
- (Optional) NVIDIA GPU with CUDA for better performance

## Option 1: Quick Start with Python

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python -m app.main
```

The server will start at `http://localhost:8000`

### 3. View the Stream

Open `viewer.html` in your browser or navigate to:
- **Stream**: http://localhost:8000/api/stream
- **Status**: http://localhost:8000/api/status
- **API Docs**: http://localhost:8000/docs

## Option 2: Quick Start with Docker (CPU)

### 1. Build and Run

```bash
cd backend
docker-compose -f docker-compose.cpu.yml up --build
```

### 2. Access the API

The server will be available at `http://localhost:8000`

## Option 3: Quick Start with Docker (GPU)

### 1. Install NVIDIA Docker

Follow: https://github.com/NVIDIA/nvidia-docker

### 2. Build and Run

```bash
cd backend
docker-compose -f docker-compose.gpu.yml up --build
```

## Usage

### View Live Stream

Open `viewer.html` in your browser for a complete web interface with:
- Live video stream
- Real-time counts (up/down/total)
- System status (FPS, inference time)
- Controls (reset, start, stop, line position)

### Using the API

#### Get Status
```bash
curl http://localhost:8000/api/status
```

#### Reset Counts
```bash
curl -X POST http://localhost:8000/api/reset
```

#### Update Line Position
```bash
curl -X POST http://localhost:8000/api/line \
  -H "Content-Type: application/json" \
  -d '{"line_y": 300}'
```

### Python Client Example

```python
import requests

# Get status
response = requests.get("http://localhost:8000/api/status")
print(response.json())

# Reset counts
response = requests.post("http://localhost:8000/api/reset")
print(response.json())
```

Run the included example:
```bash
python example_usage.py
```

## Configuration

Set environment variables to customize:

```bash
# Video source
export VIDEO_SOURCE=0                    # Webcam (default)
export VIDEO_SOURCE=/path/to/video.mp4   # Video file

# Model
export MODEL_PATH=models/best.pt         # Custom model
export CONFIDENCE_THRESHOLD=0.6          # Detection confidence

# Line position
export LINE_Y_PERCENT=0.5                # 50% from top (default)

# Start server
python -m app.main
```

## Troubleshooting

### No video showing
- Check if webcam is accessible: `ls /dev/video*`
- Try different source: `export VIDEO_SOURCE=1`

### Low FPS
- Use GPU version
- Reduce confidence threshold: `export CONFIDENCE_THRESHOLD=0.7`
- Use smaller model: `yolov8n.pt` instead of `yolov8x.pt`

### Model not found
The system will automatically download `yolov8n.pt` if no model is found.

To use a custom model:
```bash
mkdir -p models
cp /path/to/your/model.pt models/best.pt
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [API documentation](http://localhost:8000/docs) for all endpoints
- Customize line position and detection parameters
- Integrate with your own application

## File Structure

```
backend/
├── app/               # Application code
├── models/            # YOLO models (.pt files)
├── viewer.html        # Web interface
├── example_usage.py   # Python example
├── test_structure.py  # Tests
└── requirements.txt   # Dependencies
```

## Support

For issues or questions:
1. Check the [README.md](README.md)
2. Run tests: `python test_structure.py`
3. Check API docs: http://localhost:8000/docs
