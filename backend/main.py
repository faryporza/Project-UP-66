import os
from datetime import datetime
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise RuntimeError("Missing MONGODB_URL in .env")

app = FastAPI(title="Vehicle Counter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


class Point(BaseModel):
    x: int
    y: int


class LineIn(BaseModel):
    line_id: str
    camera_id: str
    p1: Point
    p2: Point
    is_active: bool = True


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

    # ถ้าตั้ง active = true ให้ปิด active เดิมของกล้องนี้ก่อน (เลือกได้)
    if doc.get("is_active", True):
        await lines.update_many(
            {"camera_id": payload.camera_id, "is_active": True},
            {"$set": {"is_active": False, "updated_at": datetime.now()}}
        )

    try:
        await lines.insert_one(doc)
    except Exception as e:
        raise HTTPException(status_code=409, detail=f"create_line failed: {str(e)}")
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
