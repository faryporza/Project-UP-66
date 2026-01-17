# YOLO Line Crossing Backend

Real-time vehicle detection and line crossing counter using YOLO + ByteTrack.

## 📁 Project Structure

```
backend/
├─ app/
│  ├─ main.py              # FastAPI entrypoint
│  ├─ config.py            # ENV configuration
│  ├─ detector/
│  │  ├─ model.py          # YOLO loader + tracking
│  │  ├─ counter.py        # Line crossing logic
│  │  └─ drawer.py         # Visualization
│  ├─ api/
│  │  ├─ status.py         # GET /api/status
│  │  ├─ stream.py         # GET /api/stream (MJPEG)
│  │  └─ control.py        # POST /api/reset, /api/line
│  ├─ core/
│  │  ├─ camera.py         # Video source
│  │  ├─ worker.py         # Background inference
│  │  └─ state.py          # Shared state
│  └─ utils/
│     ├─ time.py
│     └─ geometry.py
├─ models/
│  └─ best.pt              # Your YOLO model
├─ requirements.txt
├─ Dockerfile.cpu
├─ Dockerfile.gpu
├─ docker-compose.cpu.yml
└─ docker-compose.gpu.yml
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Add Your Model

Place your YOLO model file as `models/best.pt`

### 3. Run

```bash
# Using webcam (default)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Using video file
VIDEO_SOURCE=video.mp4 uvicorn app.main:app --reload

# Using GPU
DEVICE=0 uvicorn app.main:app --reload
```

## 🐳 Docker

### CPU Version

```bash
docker compose -f docker-compose.cpu.yml up --build
```

### GPU Version (requires NVIDIA Container Toolkit)

```bash
docker compose -f docker-compose.gpu.yml up --build
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get counts and metadata |
| `/api/stream` | GET | MJPEG video stream |
| `/api/reset` | POST | Reset all counts |
| `/api/line` | POST | Update line position |
| `/api/health` | GET | Health check |

### Example: Get Status

```bash
curl http://localhost:8000/api/status
```

### Example: Reset Counts

```bash
curl -X POST http://localhost:8000/api/reset
```

### Example: Update Line Position

```bash
curl -X POST http://localhost:8000/api/line \
  -H "Content-Type: application/json" \
  -d '{"y_ratio": 0.6}'
```

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_PATH` | `models/best.pt` | Path to YOLO model |
| `VIDEO_SOURCE` | `0` | Webcam index or video path |
| `DEVICE` | `cpu` | `cpu` or `0` for CUDA |
| `CONFIDENCE` | `0.05` | Detection confidence |
| `IOU` | `0.70` | NMS IOU threshold |
| `SHOW_CONF` | `0.25` | Min confidence to display |
| `MAX_DET` | `300` | Max detections per frame |
| `DIRECTION` | `both` | `both`, `up`, or `down` |
| `LINE_MARGIN` | `12` | Crossing detection margin |
| `LINE_Y_RATIO` | `0.55` | Initial line Y position ratio |

## 🚗 Supported Classes

| ID | Class |
|----|-------|
| 0 | ambulance |
| 1 | boxtruck |
| 2 | bus |
| 3 | e_tan |
| 4 | hatchback |
| 5 | jeep |
| 6 | mini_truck |
| 7 | motorcycle |
| 8 | pickup |
| 9 | saleng |
| 10 | sedan |
| 11 | songthaew |
| 12 | supercar |
| 13 | suv |
| 14 | taxi |
| 15 | truck |
| 16 | tuktuk |
| 17 | van |

## 📊 Architecture

```
Camera / Video
      ↓
YOLO Track (GPU/CPU)
      ↓
Line Crossing Counter
      ↓
   Shared State
      ↓             ↓
/api/stream    /api/status
  (MJPEG)        (JSON)
```

## 📝 License

MIT
