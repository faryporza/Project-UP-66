"""
ระบบนับรถจากกล้อง RTSP ด้วย YOLO v11
Vehicle Counting System using YOLO v11 with RTSP Stream
"""

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import json
import os
import threading
import time
from datetime import datetime
from pathlib import Path

# Initialize FastAPI app
app = FastAPI(
    title="ระบบนับรถ - Vehicle Counting API",
    description="API สำหรับนับรถจากกล้อง RTSP ด้วย YOLO v11",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vehicle class mapping
VEHICLE_CLASSES = {
    0: 'ambulance',      # รถพยาบาล
    1: 'boxtruck',       # รถบรรทุกกล่อง
    2: 'bus',            # รถบัส
    3: 'e_tan',          # อีแต๋น
    4: 'hatchback',      # รถแฮทช์แบ็ก
    5: 'jeep',           # รถจี๊ป
    6: 'mini_truck',     # รถกระบะเล็ก
    7: 'motorcycle',     # รถจักรยานยนต์
    8: 'pickup',         # รถกระบะ
    9: 'saleng',         # ซาเล้ง
    10: 'sedan',         # รถเก๋ง
    11: 'songthaew',     # รถสองแถว
    12: 'supercar',      # ซุปเปอร์คาร์
    13: 'suv',           # รถ SUV
    14: 'taxi',          # รถแท็กซี่
    15: 'truck',         # รถบรรทุก
    16: 'tuktuk',        # รถตุ๊กตุ๊ก
    17: 'van',           # รถตู้
}

# Thai name mapping for display
VEHICLE_NAMES_TH = {
    'ambulance': 'รถพยาบาล',
    'boxtruck': 'รถบรรทุกกล่อง',
    'bus': 'รถบัส',
    'e_tan': 'อีแต๋น',
    'hatchback': 'รถแฮทช์แบ็ก',
    'jeep': 'รถจี๊ป',
    'mini_truck': 'รถกระบะเล็ก',
    'motorcycle': 'รถจักรยานยนต์',
    'pickup': 'รถกระบะ',
    'saleng': 'ซาเล้ง',
    'sedan': 'รถเก๋ง',
    'songthaew': 'รถสองแถว',
    'supercar': 'ซุปเปอร์คาร์',
    'suv': 'รถ SUV',
    'taxi': 'รถแท็กซี่',
    'truck': 'รถบรรทุก',
    'tuktuk': 'รถตุ๊กตุ๊ก',
    'van': 'รถตู้',
}

# Camera configuration
TEST_VIDEO_PATH = str((Path(__file__).parent / "video" / "car_data_2026-01-12_13-06-30.mp4").resolve())

CAMERAS = [
    {
        "id": "cam-001",
        "province_code": "TH56",
        "province_name": "Phayao",
        "province_name_th": "พะเยา",
        "rtsp_url": "rtsp://admin:luis2547@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0",
        "video_path": TEST_VIDEO_PATH,
        "status": "inactive",
        "location": {"lat": 19.1641, "lng": 99.9013}
    }
]

# Detection state
detection_state = {
    "is_running": False,
    "thread": None,
    "model": None,
    "counts": {cls: 0 for cls in VEHICLE_CLASSES.values()},
    "last_update": None,
    "total_count": 0
}

# Data directory
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
RESULTS_FILE = DATA_DIR / "detection_results.json"


def load_model():
    """Load YOLO model"""
    model_path = Path(__file__).parent / "best.mlpackage"
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    return YOLO(str(model_path))


def save_results():
    """Save detection results to JSON file"""
    data = {
        "last_update": detection_state["last_update"],
        "total_count": detection_state["total_count"],
        "counts": detection_state["counts"],
        "counts_th": {
            VEHICLE_NAMES_TH.get(k, k): v 
            for k, v in detection_state["counts"].items()
        },
        "cameras": CAMERAS
    }
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def detection_worker(camera_id: str):
    """Background worker for vehicle detection"""
    global detection_state
    
    # Find camera
    camera = next((c for c in CAMERAS if c["id"] == camera_id), None)
    if not camera:
        return
    
    # Load model if not loaded
    if detection_state["model"] is None:
        detection_state["model"] = load_model()
    
    model = detection_state["model"]
    rtsp_url = camera["rtsp_url"]
    video_path = camera.get("video_path")
    use_test_video = bool(video_path) and Path(video_path).exists()
    source = video_path if use_test_video else rtsp_url
    
    # Update camera status
    camera["status"] = "active"
    
    # Open RTSP stream
    cap = cv2.VideoCapture(source)
    
    if not cap.isOpened():
        camera["status"] = "error"
        detection_state["is_running"] = False
        return
    
    frame_count = 0
    skip_frames = 5  # Process every 5th frame for performance
    
    while detection_state["is_running"]:
        ret, frame = cap.read()
        if not ret:
            if use_test_video:
                # End of file
                detection_state["is_running"] = False
                break
            # Try to reconnect RTSP
            cap.release()
            time.sleep(2)
            cap = cv2.VideoCapture(rtsp_url)
            if not cap.isOpened():
                break
            continue
        
        frame_count += 1
        if frame_count % skip_frames != 0:
            continue
        
        # Run detection
        results = model(frame, verbose=False)
        
        if results and len(results) > 0:
            result = results[0]
            if result.boxes is not None:
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    if cls_id in VEHICLE_CLASSES:
                        cls_name = VEHICLE_CLASSES[cls_id]
                        detection_state["counts"][cls_name] += 1
                        detection_state["total_count"] += 1
        
        # Update timestamp
        detection_state["last_update"] = datetime.now().isoformat()
        
        # Save results periodically
        if frame_count % 50 == 0:
            save_results()
    
    # Cleanup
    cap.release()
    camera["status"] = "inactive"
    save_results()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ยินดีต้อนรับสู่ระบบนับรถ",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/cameras")
async def get_cameras():
    """Get all cameras configuration"""
    return {
        "cameras": CAMERAS,
        "total": len(CAMERAS)
    }


@app.get("/api/stats")
async def get_stats():
    """Get current detection statistics"""
    return {
        "is_running": detection_state["is_running"],
        "last_update": detection_state["last_update"],
        "total_count": detection_state["total_count"],
        "counts": detection_state["counts"],
        "counts_th": {
            VEHICLE_NAMES_TH.get(k, k): v 
            for k, v in detection_state["counts"].items()
        },
        "vehicle_types": list(VEHICLE_CLASSES.values()),
        "vehicle_types_th": VEHICLE_NAMES_TH
    }


def start_detection_internal(camera_id: str):
    """Shared logic to start detection"""
    if detection_state["is_running"]:
        return {"error": "Detection already running", "status": "error"}

    # Find camera
    camera = next((c for c in CAMERAS if c["id"] == camera_id), None)
    if not camera:
        return {"error": f"Camera {camera_id} not found", "status": "error"}

    # Reset counts
    detection_state["counts"] = {cls: 0 for cls in VEHICLE_CLASSES.values()}
    detection_state["total_count"] = 0
    detection_state["is_running"] = True

    # Start detection in background thread
    thread = threading.Thread(target=detection_worker, args=(camera_id,))
    thread.daemon = True
    thread.start()
    detection_state["thread"] = thread

    return {
        "message": f"เริ่มตรวจจับสำหรับกล้อง {camera_id}",
        "status": "started",
        "camera": camera
    }


@app.post("/api/detection/start/{camera_id}")
async def start_detection(camera_id: str, background_tasks: BackgroundTasks):
    """Start vehicle detection for a camera (POST)"""
    return start_detection_internal(camera_id)


@app.get("/api/detection/start/{camera_id}")
async def start_detection_get(camera_id: str):
    """Start vehicle detection for a camera (GET)"""
    return start_detection_internal(camera_id)


@app.get("/api/detection/start")
async def start_detection_get_query(camera_id: str):
    """Start vehicle detection for a camera via query param (GET)"""
    return start_detection_internal(camera_id)


def stop_detection_internal():
    """Shared logic to stop detection"""
    if not detection_state["is_running"]:
        return {"error": "Detection not running", "status": "error"}

    detection_state["is_running"] = False

    # Wait for thread to finish
    if detection_state["thread"]:
        detection_state["thread"].join(timeout=5)

    save_results()

    return {
        "message": "หยุดการตรวจจับเรียบร้อย",
        "status": "stopped",
        "final_counts": detection_state["counts"],
        "total_count": detection_state["total_count"]
    }


@app.post("/api/detection/stop")
async def stop_detection():
    """Stop vehicle detection (POST)"""
    return stop_detection_internal()


@app.get("/api/detection/stop")
async def stop_detection_get():
    """Stop vehicle detection (GET)"""
    return stop_detection_internal()


@app.get("/api/detection/reset")
async def reset_detection():
    """Reset detection counts"""
    if detection_state["is_running"]:
        return {"error": "Cannot reset while detection is running", "status": "error"}
    
    detection_state["counts"] = {cls: 0 for cls in VEHICLE_CLASSES.values()}
    detection_state["total_count"] = 0
    detection_state["last_update"] = None
    
    save_results()
    
    return {
        "message": "รีเซ็ตการนับเรียบร้อย",
        "status": "reset"
    }


@app.get("/api/provinces")
async def get_provinces():
    """Get province information for map"""
    provinces = {
        "TH10": "Bangkok Metropolis", 
        "TH11": "Samut Prakan", 
        "TH12": "Nonthaburi", 
        "TH13": "Pathum Thani", 
        "TH14": "Phra Nakhon Si Ayutthaya", 
        "TH15": "Ang Thong", 
        "TH16": "Lop Buri", 
        "TH17": "Sing Buri", 
        "TH18": "Chai Nat", 
        "TH19": "Saraburi", 
        "TH20": "Chon Buri", 
        "TH21": "Rayong", 
        "TH22": "Chanthaburi", 
        "TH23": "Trat", 
        "TH24": "Chachoengsao", 
        "TH25": "Prachin Buri", 
        "TH26": "Nakhon Nayok", 
        "TH27": "Sa Kaeo", 
        "TH30": "Nakhon Ratchasima", 
        "TH31": "Buri Ram", 
        "TH32": "Surin", 
        "TH33": "Si Sa Ket", 
        "TH34": "Ubon Ratchathani", 
        "TH35": "Yasothon", 
        "TH36": "Chaiyaphum", 
        "TH37": "Amnat Charoen", 
        "TH38": "Bueng Kan", 
        "TH39": "Nong Bua Lam Phu", 
        "TH40": "Khon Kaen", 
        "TH41": "Udon Thani", 
        "TH42": "Loei", 
        "TH43": "Nong Khai", 
        "TH44": "Maha Sarakham", 
        "TH45": "Roi Et", 
        "TH46": "Kalasin", 
        "TH47": "Sakon Nakhon", 
        "TH48": "Nakhon Phanom", 
        "TH49": "Mukdahan", 
        "TH50": "Chiang Mai", 
        "TH51": "Lamphun", 
        "TH52": "Lampang", 
        "TH53": "Uttaradit", 
        "TH54": "Phrae", 
        "TH55": "Nan", 
        "TH56": "Phayao", 
        "TH57": "Chiang Rai", 
        "TH58": "Mae Hong Son", 
        "TH60": "Nakhon Sawan", 
        "TH61": "Uthai Thani", 
        "TH62": "Kamphaeng Phet", 
        "TH63": "Tak", 
        "TH64": "Sukhothai", 
        "TH65": "Phitsanulok", 
        "TH66": "Phichit", 
        "TH67": "Phetchabun", 
        "TH70": "Ratchaburi", 
        "TH71": "Kanchanaburi", 
        "TH72": "Suphan Buri", 
        "TH73": "Nakhon Pathom", 
        "TH74": "Samut Sakhon", 
        "TH75": "Samut Songkhram", 
        "TH76": "Phetchaburi", 
        "TH77": "Prachuap Khiri Khan", 
        "TH80": "Nakhon Si Thammarat", 
        "TH81": "Krabi", 
        "TH82": "Phangnga", 
        "TH83": "Phuket", 
        "TH84": "Surat Thani", 
        "TH85": "Ranong", 
        "TH86": "Chumphon", 
        "TH90": "Songkhla", 
        "TH91": "Satun", 
        "TH92": "Trang", 
        "TH93": "Phatthalung", 
        "TH94": "Pattani", 
        "TH95": "Yala", 
        "TH96": "Narathiwat", 
        "THS": "Phatthaya"
    }
    
    # Get cameras by province
    cameras_by_province = {}
    for camera in CAMERAS:
        province_code = camera["province_code"]
        if province_code not in cameras_by_province:
            cameras_by_province[province_code] = []
        cameras_by_province[province_code].append(camera)
    
    return {
        "provinces": provinces,
        "cameras_by_province": cameras_by_province
    }


if __name__ == "__main__":
    import uvicorn
    print("🚗 เริ่มต้นระบบนับรถ - Vehicle Counting System")
    print("📊 API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
