import os
import time
import asyncio
import uuid
import base64
import threading
from datetime import datetime
from typing import Optional, Dict, Any, List
from collections import defaultdict

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from ultralytics import YOLO

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise RuntimeError("Missing MONGODB_URL in .env")

app = FastAPI(title="Vehicle Counter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient(MONGODB_URL)
db = client.get_default_database()  # ใช้ db จาก URL (vehicle_counter)

cameras = db["cameras"]
lines = db["lines"]
counts = db["counts"]


def _split_csv(value: Optional[str]) -> Optional[List[str]]:
    if not value:
        return None
    items = [item.strip() for item in value.split(",") if item.strip()]
    return items or None


# ---------- Pydantic Models ----------
class CameraIn(BaseModel):
    camera_id: str
    name: str
    rtsp: str
    hls_url: Optional[str] = None


class Point(BaseModel):
    x: int
    y: int


class LineIn(BaseModel):
    line_id: str
    camera_id: str
    p1: Point
    p2: Point
    is_active: bool = True
    canvas_w: int = 1280
    canvas_h: int = 720


class CountIn(BaseModel):
    count_id: str
    camera_id: str
    line_id: str
    track_id: int
    class_name: str = Field(..., alias="class")  # รับ key ชื่อ "class"
    time: datetime


# ---------- Startup: Create Indexes ----------
@app.on_event("startup")
async def startup():
    # cameras: unique camera_id
    await cameras.create_index("camera_id", unique=True)

    # lines: unique line_id, index camera_id + is_active
    await lines.create_index("line_id", unique=True)
    await lines.create_index([("camera_id", 1)])
    await lines.create_index([("camera_id", 1), ("is_active", 1)])

    # counts: unique count_id + dashboard indexes + unique anti-duplicate
    await counts.create_index("count_id", unique=True)
    await counts.create_index([("camera_id", 1), ("time", -1)])
    await counts.create_index([("camera_id", 1), ("class", 1), ("time", -1)])
    # กันนับซ้ำ: 1 track_id ต่อ 1 line_id ต่อ 1 camera_id
    await counts.create_index([("camera_id", 1), ("line_id", 1), ("track_id", 1)], unique=True)


# ---------- Cameras ----------
@app.post("/cameras")
async def create_camera(payload: CameraIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now()
    doc["updated_at"] = datetime.now()
    try:
        await cameras.insert_one(doc)
    except Exception as e:
        # ถ้า camera_id ซ้ำ
        raise HTTPException(status_code=409, detail=f"create_camera failed: {str(e)}")
    return {"ok": True, "camera_id": payload.camera_id}


@app.get("/cameras")
async def list_cameras():
    items = []
    async for c in cameras.find({}, {"_id": 0}):
        items.append(c)
    return {"items": items}


@app.get("/cameras/{camera_id}")
async def get_camera(camera_id: str):
    c = await cameras.find_one({"camera_id": camera_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="camera not found")
    return c


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    rtsp: Optional[str] = None
    hls_url: Optional[str] = None


@app.patch("/cameras/{camera_id}")
async def update_camera(camera_id: str, payload: CameraUpdate):
    c = await cameras.find_one({"camera_id": camera_id})
    if not c:
        raise HTTPException(status_code=404, detail="camera not found")
    
    update_doc = {}
    if payload.name is not None:
        update_doc["name"] = payload.name
    if payload.rtsp is not None:
        update_doc["rtsp"] = payload.rtsp
    if payload.hls_url is not None:
        update_doc["hls_url"] = payload.hls_url
    
    if not update_doc:
        raise HTTPException(status_code=400, detail="no fields to update")
    
    update_doc["updated_at"] = datetime.now()
    
    try:
        await cameras.update_one(
            {"camera_id": camera_id},
            {"$set": update_doc}
        )
        updated = await cameras.find_one({"camera_id": camera_id}, {"_id": 0})
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"update_camera failed: {str(e)}")


# ---------- Health ----------
@app.get("/health")
async def health_check():
    return {"ok": True, "time": datetime.utcnow()}


# ---------- Lines ----------
@app.post("/lines")
async def create_line(payload: LineIn):
    # ตรวจว่ากล้องมีจริง
    cam = await cameras.find_one({"camera_id": payload.camera_id})
    if not cam:
        raise HTTPException(status_code=404, detail="camera not found")

    doc = payload.model_dump()
    doc["created_at"] = datetime.now()
    doc["updated_at"] = datetime.now()

    # ถ้าตั้ง active = true ให้ปิด active เดิมของกล้องนี้ก่อน
    if doc.get("is_active", True):
        await lines.update_many(
            {"camera_id": payload.camera_id, "is_active": True},
            {"$set": {"is_active": False, "updated_at": datetime.now()}}
        )

    try:
        # upsert: ถ้า line_id ซ้ำ ให้อัปเดตแทน
        await lines.update_one(
            {"line_id": payload.line_id},
            {"$set": doc, "$setOnInsert": {"created_at": datetime.now()}},
            upsert=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"create_line failed: {str(e)}")
    return {"ok": True, "line_id": payload.line_id}


@app.get("/lines/active/{camera_id}")
async def get_active_line(camera_id: str):
    line = await lines.find_one({"camera_id": camera_id, "is_active": True}, {"_id": 0})
    if not line:
        raise HTTPException(status_code=404, detail="active line not found")
    return line


@app.patch("/lines/{line_id}/activate")
async def activate_line(line_id: str):
    line = await lines.find_one({"line_id": line_id})
    if not line:
        raise HTTPException(status_code=404, detail="line not found")

    camera_id = line["camera_id"]
    await lines.update_many(
        {"camera_id": camera_id},
        {"$set": {"is_active": False, "updated_at": datetime.now()}}
    )
    await lines.update_one(
        {"line_id": line_id},
        {"$set": {"is_active": True, "updated_at": datetime.now()}}
    )
    return {"ok": True, "line_id": line_id, "camera_id": camera_id}


# ---------- Counts (Events) ----------
@app.post("/counts")
async def insert_count(payload: CountIn):
    doc = payload.model_dump(by_alias=True)
    # payload รับ "class" แต่เราเก็บ field เป็น "class" ตามที่คุณกำหนด
    # (pydantic alias class_name -> "class")
    doc["class"] = doc.pop("class_name")
    try:
        await counts.insert_one(doc)
        return {"ok": True, "count_id": payload.count_id}
    except Exception as e:
        # ถ้าโดน unique (camera_id+line_id+track_id) = นับซ้ำ
        # เราจะตอบ 409 และบอกว่า duplicate
        msg = str(e)
        if "duplicate key" in msg.lower():
            raise HTTPException(status_code=409, detail="duplicate count (same camera_id+line_id+track_id)")
        raise HTTPException(status_code=500, detail=f"insert_count failed: {msg}")


# Dashboard: นับแยก class ในช่วงเวลา
@app.get("/counts/by-class")
async def count_by_class(
    start: datetime,
    end: datetime,
    camera_id: Optional[str] = None,
    camera_ids: Optional[str] = Query(default=None, description="Comma-separated camera IDs"),
    classes: Optional[str] = Query(default=None, description="Comma-separated class names")
):
    camera_list = _split_csv(camera_ids) or _split_csv(camera_id)
    class_list = _split_csv(classes)
    match: Dict[str, Any] = {"time": {"$gte": start, "$lte": end}}
    if camera_list:
        match["camera_id"] = {"$in": camera_list}
    if class_list:
        match["class"] = {"$in": class_list}

    pipeline = [
        {"$match": match},
        {"$group": {"_id": "$class", "total": {"$sum": 1}}},
        {"$sort": {"total": -1}}
    ]
    out = []
    async for row in counts.aggregate(pipeline):
        out.append({"class": row["_id"], "total": row["total"]})
    return {"start": start, "end": end, "items": out}


@app.get("/counts/by-camera")
async def count_by_camera(
    start: datetime,
    end: datetime,
    camera_id: Optional[str] = None,
    camera_ids: Optional[str] = Query(default=None, description="Comma-separated camera IDs"),
    classes: Optional[str] = Query(default=None, description="Comma-separated class names")
):
    camera_list = _split_csv(camera_ids) or _split_csv(camera_id)
    class_list = _split_csv(classes)
    match: Dict[str, Any] = {"time": {"$gte": start, "$lte": end}}
    if camera_list:
        match["camera_id"] = {"$in": camera_list}
    if class_list:
        match["class"] = {"$in": class_list}

    pipeline = [
        {"$match": match},
        {"$group": {"_id": "$camera_id", "total": {"$sum": 1}}},
        {"$sort": {"total": -1}}
    ]
    out = []
    async for row in counts.aggregate(pipeline):
        out.append({"camera_id": row["_id"], "total": row["total"]})
    return {"start": start, "end": end, "items": out}


@app.get("/counts/by-time")
async def count_by_time(
    start: datetime,
    end: datetime,
    bucket: str = Query(default="hour", description="hour or day"),
    camera_id: Optional[str] = None,
    camera_ids: Optional[str] = Query(default=None, description="Comma-separated camera IDs"),
    classes: Optional[str] = Query(default=None, description="Comma-separated class names")
):
    camera_list = _split_csv(camera_ids) or _split_csv(camera_id)
    class_list = _split_csv(classes)
    match: Dict[str, Any] = {"time": {"$gte": start, "$lte": end}}
    if camera_list:
        match["camera_id"] = {"$in": camera_list}
    if class_list:
        match["class"] = {"$in": class_list}

    if bucket == "day":
        time_format = "%Y-%m-%d"
    else:
        time_format = "%Y-%m-%d %H:00"

    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": {
                    "time": {"$dateToString": {"format": time_format, "date": "$time"}},
                    "class": "$class",
                },
                "total": {"$sum": 1},
            }
        },
        {"$sort": {"_id.time": 1}},
    ]

    time_map: Dict[str, Dict[str, int]] = {}
    async for row in counts.aggregate(pipeline):
        time_key = row["_id"]["time"]
        class_key = row["_id"]["class"]
        time_map.setdefault(time_key, {})[class_key] = row["total"]

    items = [{"time": key, "by_class": time_map[key]} for key in sorted(time_map.keys())]
    return {"start": start, "end": end, "bucket": bucket, "items": items}


@app.get("/counts/recent")
async def list_recent_counts(
    limit: int = Query(default=100, ge=1, le=1000),
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    camera_id: Optional[str] = None,
    camera_ids: Optional[str] = Query(default=None, description="Comma-separated camera IDs"),
    classes: Optional[str] = Query(default=None, description="Comma-separated class names")
):
    camera_list = _split_csv(camera_ids) or _split_csv(camera_id)
    class_list = _split_csv(classes)
    match: Dict[str, Any] = {}
    if start and end:
        match["time"] = {"$gte": start, "$lte": end}
    if camera_list:
        match["camera_id"] = {"$in": camera_list}
    if class_list:
        match["class"] = {"$in": class_list}

    cursor = counts.find(match, {"_id": 0}).sort("time", -1).limit(limit)
    items = []
    async for row in cursor:
        items.append(row)
    return {"items": items}


# ---------- YOLO Model ----------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "best.mlpackage")
CONF = 0.35              # ↑ จาก 0.05 — ลด false-positive & lag
TRACKER = "bytetrack.yaml"
COUNT_CONF_MIN = 50.0    # confidence ขั้นต่ำ (%) สำหรับลงคะแนนนับ
VOTE_MIN = 3             # ต้องเห็นอย่างน้อย N เฟรมก่อนนับ

# Load model once at module level
print(f"[YOLO] Loading model from {MODEL_PATH} ...")
yolo_model = YOLO(MODEL_PATH)
yolo_names = yolo_model.names  # {id: class_name}
print(f"[YOLO] Model loaded. Classes: {yolo_names}")


def _line_side(cx: int, cy: int, lx1: int, ly1: int, lx2: int, ly2: int) -> float:
    """Cross-product sign: positive → ซ้ายของเส้น P1→P2, negative → ขวา."""
    return float((lx2 - lx1) * (cy - ly1) - (ly2 - ly1) * (cx - lx1))


# ---------- Detection WebSocket ----------
@app.websocket("/ws/detect/{camera_id}")
async def ws_detect(websocket: WebSocket, camera_id: str):
    await websocket.accept()

    # 1) ดึงข้อมูลกล้องจาก DB
    cam = await cameras.find_one({"camera_id": camera_id}, {"_id": 0})
    if not cam:
        await websocket.send_json({"error": "camera not found"})
        await websocket.close()
        return

    stream_url = cam.get("hls_url") or cam.get("rtsp")
    if not stream_url:
        await websocket.send_json({"error": "no stream URL configured"})
        await websocket.close()
        return

    # 2) เปิด VideoCapture ใน thread แยก พร้อมส่งเฟรมผ่าน queue
    import json

    stop_event = threading.Event()
    frame_queue = asyncio.Queue(maxsize=2)
    loop = asyncio.get_event_loop()

    # Tracking state
    counted_ids: set = set()
    count_totals: Dict[str, int] = defaultdict(int)
    session_id = uuid.uuid4().hex[:8]  # unique per WS session

    # Majority voting per track ID
    track_votes: Dict[int, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    track_top_conf: Dict[int, float] = {}        # best confidence seen
    track_prev_side: Dict[int, float] = {}       # previous side of counting line

    # ดึง active line สำหรับ camera นี้ (ถ้ามี)
    active_line = await lines.find_one({"camera_id": camera_id, "is_active": True}, {"_id": 0})
    active_line_id = active_line["line_id"] if active_line else "no_line"

    def detection_thread():
        """Thread: อ่าน stream → YOLO track → majority vote + line-crossing → นับ"""
        cap = cv2.VideoCapture(stream_url)
        if not cap.isOpened():
            asyncio.run_coroutine_threadsafe(
                frame_queue.put({"error": "cannot open stream"}), loop
            )
            return

        prev_t = time.time()
        frame_count = 0

        # Scale counting line to frame coords (set on first frame)
        line_pts = None  # (lx1, ly1, lx2, ly2) in frame pixels

        while not stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                # stream อาจขาด ลอง reconnect
                cap.release()
                time.sleep(1)
                cap = cv2.VideoCapture(stream_url)
                continue

            h, w = frame.shape[:2]

            # Scale counting line to frame size (once)
            if line_pts is None and active_line:
                cw = active_line.get("canvas_w", 1280)
                ch = active_line.get("canvas_h", 720)
                sx, sy = w / cw, h / ch
                p1 = active_line["p1"]
                p2 = active_line["p2"]
                line_pts = (
                    int(p1["x"] * sx), int(p1["y"] * sy),
                    int(p2["x"] * sx), int(p2["y"] * sy),
                )

            # YOLO track
            results = yolo_model.track(
                source=frame,
                conf=CONF,
                persist=True,
                tracker=TRACKER,
                verbose=False,
            )
            r = results[0]

            detections_list = []
            new_counts = []

            if r.boxes is not None and len(r.boxes) > 0 and r.boxes.id is not None:
                boxes = r.boxes.xyxy.cpu().numpy().astype(int)
                clss = r.boxes.cls.cpu().numpy().astype(int)
                confs = r.boxes.conf.cpu().numpy()
                ids = r.boxes.id.cpu().numpy().astype(int)

                for (x1, y1, x2, y2), cls_id, conf, tid in zip(boxes, clss, confs, ids):
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2
                    cls_name = yolo_names.get(int(cls_id), str(int(cls_id)))

                    detections_list.append({
                        "id": f"det-{int(tid)}",
                        "x": int(x1),
                        "y": int(y1),
                        "width": int(x2 - x1),
                        "height": int(y2 - y1),
                        "type": cls_name,
                        "confidence": round(float(conf) * 100, 1),
                        "label": cls_name,
                        "track_id": int(tid),
                    })

                    # วาด bounding box ลงบนเฟรม
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.circle(frame, (cx, cy), 4, (0, 255, 255), -1)
                    cv2.putText(
                        frame,
                        f"{cls_name} #{int(tid)}",
                        (x1, max(20, y1 - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 255, 0),
                        2,
                    )

                    # --- Majority voting + line-crossing ---
                    conf_pct = round(float(conf) * 100, 1)
                    t_id = int(tid)

                    if t_id not in counted_ids and conf_pct >= COUNT_CONF_MIN:
                        # ลงคะแนน class
                        track_votes[t_id][cls_name] += 1
                        track_top_conf[t_id] = max(
                            track_top_conf.get(t_id, 0.0), conf_pct
                        )
                        total_votes = sum(track_votes[t_id].values())
                        ready = total_votes >= VOTE_MIN

                        # Line-crossing check (ถ้ามีเส้นนับ)
                        crossed = False
                        if line_pts:
                            lx1, ly1, lx2, ly2 = line_pts
                            side = _line_side(cx, cy, lx1, ly1, lx2, ly2)
                            prev = track_prev_side.get(t_id)
                            if prev is not None and prev * side < 0 and ready:
                                crossed = True
                            track_prev_side[t_id] = side

                        should_count = crossed if line_pts else ready

                        if should_count:
                            # เลือก class ที่เห็นบ่อยสุด (majority vote)
                            final_cls = max(
                                track_votes[t_id],
                                key=track_votes[t_id].get,  # type: ignore
                            )
                            count_totals[final_cls] += 1
                            counted_ids.add(t_id)
                            new_counts.append(
                                {
                                    "camera_id": camera_id,
                                    "track_id": t_id,
                                    "class": final_cls,
                                    "confidence": track_top_conf.get(t_id, conf_pct),
                                    "bbox": [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                                    "time": datetime.now().isoformat(),
                                }
                            )

            # FPS
            now = time.time()
            dt = max(now - prev_t, 1e-6)
            cur_fps = 1.0 / dt
            prev_t = now
            frame_count += 1

            # วาด FPS + counts ลงบนเฟรม
            cv2.putText(
                frame,
                f"FPS: {cur_fps:.1f}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2,
            )
            y_pos = 55
            for k, v in sorted(count_totals.items()):
                cv2.putText(
                    frame,
                    f"{k}: {v}",
                    (10, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    2,
                )
                y_pos += 22

            # Draw counting line
            if line_pts:
                lx1, ly1, lx2, ly2 = line_pts
                cv2.line(frame, (lx1, ly1), (lx2, ly2), (0, 0, 255), 2)

            # Encode frame as JPEG
            _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            b64 = base64.b64encode(jpeg.tobytes()).decode("ascii")

            payload = {
                "type": "frame",
                "frame": b64,
                "fps": round(cur_fps, 1),
                "detections": detections_list,
                "counts": dict(count_totals),
                "new_counts": new_counts,
                "frame_w": w,
                "frame_h": h,
            }

            # ส่งเข้า queue (ถ้าเต็มก็ข้ามเฟรมเก่า)
            try:
                frame_queue.put_nowait(payload)
            except asyncio.QueueFull:
                try:
                    frame_queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
                try:
                    frame_queue.put_nowait(payload)
                except asyncio.QueueFull:
                    pass

        cap.release()

    # เริ่ม detection thread
    t = threading.Thread(target=detection_thread, daemon=True)
    t.start()

    try:
        while True:
            # รอข้อมูลจาก detection thread
            payload = await frame_queue.get()
            if "error" in payload:
                await websocket.send_json(payload)
                break

            # บันทึก counts ใหม่ลง DB (async)
            for nc in payload.get("new_counts", []):
                try:
                    count_id = f"cnt_{nc['camera_id']}_{active_line_id}_{session_id}_{nc['track_id']}"
                    await counts.insert_one(
                        {
                            "count_id": count_id,
                            "camera_id": nc["camera_id"],
                            "line_id": active_line_id,
                            "track_id": nc["track_id"],
                            "class": nc["class"],
                            "time": datetime.now(),
                        }
                    )
                except Exception as e:
                    print(f"[DB] count insert skipped: {e}")

            # ส่ง frame + detections + new_counts ให้ frontend
            await websocket.send_json(payload)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] Error: {e}")
    finally:
        stop_event.set()
        t.join(timeout=5)
