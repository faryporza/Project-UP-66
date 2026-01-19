# YOLO Line Crossing Architecture

This document explains the architecture and design decisions of the YOLO Line Crossing backend.

## Overview

The system is a FastAPI-based backend that:
1. Captures video from a camera or file
2. Runs YOLO object detection and tracking
3. Counts objects crossing a horizontal line
4. Streams annotated video via MJPEG
5. Provides RESTful API for control and status

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FastAPI App                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   API Endpoints                        │  │
│  │  /api/status  /api/stream  /api/control               │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ▲                                 │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Shared State                          │  │
│  │  • Frames (latest, annotated)                         │  │
│  │  • Counts (up, down)                                  │  │
│  │  • Metrics (FPS, inference time)                      │  │
│  │  • Thread Lock                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ▲                                 │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Background Worker Thread                  │  │
│  │                                                        │  │
│  │  ┌──────────────┐                                     │  │
│  │  │ Video Source │                                     │  │
│  │  └──────┬───────┘                                     │  │
│  │         │                                              │  │
│  │         ▼                                              │  │
│  │  ┌──────────────┐                                     │  │
│  │  │ YOLO Tracker │                                     │  │
│  │  └──────┬───────┘                                     │  │
│  │         │                                              │  │
│  │         ▼                                              │  │
│  │  ┌──────────────┐                                     │  │
│  │  │   Counter    │                                     │  │
│  │  └──────┬───────┘                                     │  │
│  │         │                                              │  │
│  │         ▼                                              │  │
│  │  ┌──────────────┐                                     │  │
│  │  │    Drawer    │                                     │  │
│  │  └──────┬───────┘                                     │  │
│  │         │                                              │  │
│  │         ▼                                              │  │
│  │  Update Shared State                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

### 1. Core Modules (`app/core/`)

#### `state.py`
- **Purpose**: Thread-safe shared state management
- **Key Components**:
  - `CountState`: Stores counting statistics
  - `AppState`: Global application state with thread lock
- **Thread Safety**: Uses `threading.Lock` for synchronization

#### `camera.py`
- **Purpose**: Video source abstraction
- **Supports**:
  - Webcam (via index: 0, 1, 2)
  - Video files (MP4, AVI, etc.)
  - RTSP streams
- **Features**: Context manager, auto-restart for files

#### `worker.py`
- **Purpose**: Background inference loop
- **Flow**:
  1. Initialize components (camera, model, counter, drawer)
  2. Continuous loop: read frame → track → count → draw → update state
  3. Runs in daemon thread (non-blocking)
- **Error Handling**: Catches exceptions, updates error state

### 2. Detector Modules (`app/detector/`)

#### `model.py`
- **Purpose**: YOLO model loading and inference
- **Features**:
  - Auto-download default model if custom not found
  - Configurable confidence and IOU thresholds
  - Object tracking with persistence

#### `counter.py`
- **Purpose**: Line crossing detection and counting
- **Algorithm**:
  1. Track object positions by ID
  2. Detect when object crosses line with margin
  3. Determine direction (up/down)
  4. Increment appropriate counter
- **Key Feature**: Uses bottom-center of bbox for better accuracy

#### `drawer.py`
- **Purpose**: Frame annotation
- **Draws**:
  - Bounding boxes with labels
  - Tracking IDs
  - Counting line (red)
  - Bottom-center tracking points
  - HUD with counts and FPS

### 3. API Modules (`app/api/`)

#### `status.py`
- **Endpoints**:
  - `GET /api/status`: Full system status
  - `GET /api/health`: Simple health check

#### `stream.py`
- **Endpoint**: `GET /api/stream`
- **Format**: MJPEG (Motion JPEG)
- **Implementation**: Generator function with frame-by-frame encoding

#### `control.py`
- **Endpoints**:
  - `POST /api/reset`: Reset counts
  - `POST /api/line`: Update line position
  - `POST /api/start`: Start worker
  - `POST /api/stop`: Stop worker

### 4. Utility Modules (`app/utils/`)

#### `geometry.py`
- Functions for line crossing detection
- Bounding box center calculations
- Side-of-line determination

#### `time.py`
- `Timer`: Simple timer for measuring elapsed time
- `FPSCounter`: Moving average FPS calculation
- Timestamp formatting

### 5. Configuration (`app/config.py`)

- Environment variable based configuration
- Default values for all settings
- Type conversion (string to int/float/bool)

## Design Decisions

### 1. Background Worker Pattern

**Why?**
- Non-blocking: API remains responsive during inference
- Continuous processing: No delays between frames
- Resource management: Single inference pipeline

**Trade-offs**:
- Thread synchronization complexity
- Potential race conditions (mitigated with locks)

### 2. Shared State with Lock

**Why?**
- Simple inter-thread communication
- Fast read/write access
- No external dependencies (Redis, etc.)

**Trade-offs**:
- Limited to single process
- Lock contention possible (minimal in practice)

### 3. MJPEG Streaming

**Why?**
- Simple HTTP-based protocol
- Works in any browser via `<img>` tag
- No complex video encoding

**Trade-offs**:
- Higher bandwidth than H.264/WebRTC
- Frame-by-frame encoding overhead

### 4. Modular Architecture

**Why?**
- Separation of concerns
- Easy to test individual components
- Flexible: swap implementations (e.g., different detector)

**Trade-offs**:
- More files and directories
- Slightly more complex imports

## Data Flow

### Inference Flow (Worker Thread)

```
1. VideoSource.read() → frame
2. YOLODetector.track(frame) → results
3. LineCrossingCounter.update(results) → counts
4. FrameDrawer.annotate_frame() → annotated
5. AppState.update_frame() → shared state
```

### Stream Flow (API Request)

```
1. Client requests /api/stream
2. generate_mjpeg() generator starts
3. Loop:
   a. AppState.get_annotated_frame()
   b. cv2.imencode() → JPEG
   c. yield frame in MJPEG format
4. Stream continues until client disconnects
```

### Status Flow (API Request)

```
1. Client requests /api/status
2. AppState.get_status() (with lock)
3. Return JSON response
```

## Performance Considerations

### 1. Frame Rate

- **Target**: 15-30 FPS
- **Bottleneck**: YOLO inference (~30-50ms on GPU)
- **Optimization**: Use smaller model (yolov8n vs yolov8x)

### 2. Memory

- **Usage**: ~500MB-2GB (depends on model)
- **Frames**: Only 2 frames stored (latest + annotated)
- **Optimization**: Frame copying only when necessary

### 3. CPU vs GPU

- **CPU**: 5-10 FPS with yolov8n
- **GPU**: 25-30 FPS with yolov8n
- **Recommendation**: GPU for production

## Thread Safety

### Critical Sections

1. **Frame Update**: `AppState.update_frame()`
   - Protected by lock
   - Copies frames to avoid race conditions

2. **Count Update**: `AppState.update_counts()`
   - Protected by lock
   - Atomic integer updates

3. **Status Read**: `AppState.get_status()`
   - Protected by lock
   - Returns copy of data

### Lock Strategy

- **Type**: `threading.Lock` (reentrant not needed)
- **Scope**: Minimal - only data access
- **Duration**: < 1ms per lock acquisition

## Error Handling

### Worker Thread

- **Exceptions**: Caught and logged
- **State**: Error message stored in `AppState.worker_error`
- **Recovery**: Continue running, skip failed frame

### Video Source

- **Webcam Failure**: Retry with delay
- **File End**: Auto-restart for video files
- **Stream Loss**: Attempt reconnection

### API Endpoints

- **Invalid Input**: FastAPI validation (Pydantic)
- **Server Errors**: 500 with error message
- **Timeout**: Configurable per endpoint

## Future Enhancements

### Possible Improvements

1. **Multi-Line Support**: Count on multiple lines
2. **Region-Based Counting**: Define polygonal regions
3. **Database Integration**: Store historical counts
4. **WebSocket API**: Real-time push updates
5. **Video Recording**: Save annotated video
6. **Alert System**: Trigger on count thresholds
7. **Analytics Dashboard**: Visualize trends

### Scalability

1. **Multi-Camera**: Multiple worker instances
2. **Load Balancing**: Distribute across servers
3. **Cloud Deployment**: Kubernetes orchestration
4. **Edge Deployment**: Run on edge devices

## Testing

### Test Coverage

- **Unit Tests**: `test_structure.py`
  - Geometry functions
  - Time utilities
  - State management
  
- **Integration Tests**: Manual via `example_usage.py`
  - API endpoints
  - Full workflow
  
- **Visual Tests**: `viewer.html`
  - Stream quality
  - UI functionality

### Testing Strategy

1. **Development**: Local with webcam
2. **CI/CD**: Mock video source
3. **Production**: Monitoring and alerts

## Deployment

### Local Development

```bash
python -m app.main
```

### Docker (CPU)

```bash
docker-compose -f docker-compose.cpu.yml up
```

### Docker (GPU)

```bash
docker-compose -f docker-compose.gpu.yml up
```

### Production Recommendations

1. **Reverse Proxy**: nginx or Traefik
2. **HTTPS**: SSL/TLS certificates
3. **Authentication**: API keys or OAuth
4. **Monitoring**: Prometheus + Grafana
5. **Logging**: Centralized logging system

## Security Considerations

### Current Implementation

- **CORS**: Allows all origins (development)
- **Authentication**: None (trusted network only)
- **Input Validation**: Pydantic models

### Production Requirements

1. **CORS**: Restrict to specific origins
2. **Authentication**: JWT or API keys
3. **Rate Limiting**: Prevent abuse
4. **Input Sanitization**: Validate all inputs
5. **HTTPS Only**: Encrypt all traffic

## Conclusion

This architecture provides a solid foundation for YOLO-based line crossing detection with:
- Clean separation of concerns
- Thread-safe state management
- RESTful API design
- Easy deployment options
- Extensible structure

The modular design allows for easy customization and extension while maintaining code quality and performance.
