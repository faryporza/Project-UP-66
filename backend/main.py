import os
import json
import cv2
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_PATH = os.path.join(BASE_DIR, "video", "video.mp4")
MODEL_PATH = os.path.join(BASE_DIR, "models", "best.pt")
OUT_PATH = os.path.join(BASE_DIR, "output_detect.mp4")
OUT_JSON = os.path.join(BASE_DIR, "count_result.json")

CLASS_MAP = {
    0: "ambulance",
    1: "boxtruck",
    2: "bus",
    3: "e_tan",
    4: "hatchback",
    5: "jeep",
    6: "mini_truck",
    7: "motorcycle",
    8: "pickup",
    9: "saleng",
    10: "sedan",
    11: "songthaew",
    12: "supercar",
    13: "suv",
    14: "taxi",
    15: "truck",
    16: "tuktuk",
    17: "van",
}

# โหลดโมเดล
model = YOLO(MODEL_PATH)

# ตรวจสอบไฟล์
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ Cannot find model: {MODEL_PATH}")
if not os.path.exists(VIDEO_PATH):
    video_dir = os.path.join(BASE_DIR, "video")
    available = []
    if os.path.isdir(video_dir):
        available = [f for f in os.listdir(video_dir) if os.path.isfile(os.path.join(video_dir, f))]
    hint = f"Available files: {', '.join(available)}" if available else "No files found in video folder."
    raise FileNotFoundError(f"❌ Cannot find video: {VIDEO_PATH}. {hint}")

# เปิดวิดีโอ
cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    raise FileNotFoundError(f"❌ Cannot open video: {VIDEO_PATH}")

# อ่านข้อมูลวิดีโอ
fps = cap.get(cv2.CAP_PROP_FPS) or 30
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# ตั้งค่า VideoWriter (mp4)
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
writer = cv2.VideoWriter(OUT_PATH, fourcc, fps, (w, h))

print(f"✅ Start detecting: {VIDEO_PATH}")
print(f"🎥 Output will be saved to: {OUT_PATH}")
print(f"🧾 Count result will be saved to: {OUT_JSON}")

# เส้นนับจำนวน (แนวนอนกลางภาพ)
line_y = int(h * 0.6)
line_color = (0, 255, 255)

# ตัวแปรสำหรับนับ
counts = {name: 0 for name in CLASS_MAP.values()}
track_last_y = {}
track_best = {}
counted_ids = set()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # ตรวจจับ + ติดตาม (ช่วยแก้ปัญหา 1 คันหลายคลาส)
    results = model.track(
        frame,
        conf=0.05,
        iou=0.5,
        device=0,
        persist=True,
        verbose=False,
    )

    annotated = frame.copy()
    if results and results[0].boxes is not None and len(results[0].boxes) > 0:
        boxes = results[0].boxes
        ids = boxes.id.cpu().tolist() if boxes.id is not None else [None] * len(boxes)
        clses = boxes.cls.cpu().tolist()
        confs = boxes.conf.cpu().tolist()
        xyxy = boxes.xyxy.cpu().tolist()

        for i in range(len(boxes)):
            x1, y1, x2, y2 = map(int, xyxy[i])
            cls_id = int(clses[i])
            conf = float(confs[i])
            track_id = int(ids[i]) if ids[i] is not None else None

            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)

            label_name = CLASS_MAP.get(cls_id, model.names.get(cls_id, str(cls_id)))

            # เก็บคลาสที่มั่นใจที่สุดต่อ track id
            if track_id is not None:
                best = track_best.get(track_id)
                if best is None or conf > best[1]:
                    track_best[track_id] = (label_name, conf)

                prev_y = track_last_y.get(track_id)
                track_last_y[track_id] = cy

                # ข้ามเส้นจากบนลงล่างหรือจากล่างขึ้นบน (นับครั้งเดียว)
                if prev_y is not None and track_id not in counted_ids:
                    crossed = (prev_y < line_y <= cy) or (prev_y > line_y >= cy)
                    if crossed:
                        final_label = track_best.get(track_id, (label_name, conf))[0]
                        if final_label not in counts:
                            counts[final_label] = 0
                        counts[final_label] += 1
                        counted_ids.add(track_id)

            # วาดกล่องและป้าย
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
            text = f"{label_name} {conf:.2f}"
            cv2.putText(annotated, text, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            cv2.circle(annotated, (cx, cy), 3, (255, 0, 0), -1)

    # วาดเส้นนับจำนวน
    cv2.line(annotated, (0, line_y), (w, line_y), line_color, 2)

    # บันทึกวิดีโอผลลัพธ์
    writer.write(annotated)

    # แสดงผล (กด q เพื่อออก)
    cv2.imshow("YOLO Detection", annotated)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
writer.release()
cv2.destroyAllWindows()

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(counts, f, ensure_ascii=False, indent=2)

print("✅ Done!")
