import time
import cv2
import numpy as np
import mss
from collections import defaultdict
from ultralytics import YOLO

# ========= ตั้งค่า =========
MODEL_PATH = "model/best.mlpackage"        # หรือ yolov8n.pt
CONF = 0.05

# เลือก monitor ที่จะจับ (1 = จอหลัก)
MONITOR_INDEX = 1

# ถ้าอยากจับเฉพาะบางส่วนของจอ (แนะนำเพื่อให้เร็วขึ้น)
USE_REGION = True
REGION = {"left": 200, "top": 120, "width": 1280, "height": 720}  # ปรับให้ตรงกับบริเวณที่มีถนน/กล้องบนจอ

# เส้นนับ ภายใน "ภาพที่จับมา" (พิกัดอ้างอิงจาก region/frame)
LINE_P1 = (141, 86)
LINE_P2 = (133, 648)

# ถ้ารู้ class id ที่เป็นรถและอยากนับเฉพาะนั้น
# COCO ทั่วไป: car=2, motorcycle=3, bus=5, truck=7
COUNT_CLASSES = None   # เช่น {2,3,5,7} หรือ None = นับทุก class

# Tracker config
TRACKER = "bytetrack.yaml"
# ==========================


def side_of_line(p, a, b):
    """บอกว่าจุด p อยู่ด้านไหนของเส้น a->b (ค่าบวก/ลบ)"""
    return (b[0]-a[0])*(p[1]-a[1]) - (b[1]-a[1])*(p[0]-a[0])


def main():
    model = YOLO(MODEL_PATH)
    names = model.names  # dict {id: name}

    # สถานะฝั่งเส้นของ track id ก่อนหน้า
    last_side = {}
    # กันนับซ้ำ (นับ 1 ครั้งต่อ id)
    counted_ids = set()
    # นับแยกตาม class name
    counts = defaultdict(int)

    prev_t = time.time()

    with mss.mss() as sct:
        monitor = sct.monitors[MONITOR_INDEX]
        grab_area = REGION if USE_REGION else monitor

        while True:
            # 1) จับภาพหน้าจอ
            img = np.array(sct.grab(grab_area), dtype=np.uint8)      # BGRA
            frame = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)            # BGR
            h, w = frame.shape[:2]

            # 2) YOLO track บน frame
            results = model.track(
                source=frame,
                conf=CONF,
                persist=True,
                tracker=TRACKER,
                verbose=False
            )

            r = results[0]

            # 3) วาดเส้นนับ
            cv2.line(frame, LINE_P1, LINE_P2, (0, 0, 255), 3)

            # 4) อ่าน boxes + class + id
            if r.boxes is not None and len(r.boxes) > 0 and r.boxes.id is not None:
                boxes = r.boxes.xyxy.cpu().numpy().astype(int)
                clss = r.boxes.cls.cpu().numpy().astype(int)
                ids = r.boxes.id.cpu().numpy().astype(int)

                for (x1, y1, x2, y2), cls_id, tid in zip(boxes, clss, ids):
                    if COUNT_CLASSES is not None and int(cls_id) not in COUNT_CLASSES:
                        continue

                    # center point
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2

                    # วาดกล่อง/label
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.circle(frame, (cx, cy), 4, (0, 255, 255), -1)
                    cls_name = names.get(int(cls_id), str(int(cls_id)))
                    cv2.putText(frame, f"{cls_name} #{int(tid)}", (x1, max(20, y1 - 8)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                    # 5) Logic ข้ามเส้น (นับ 1 ครั้งต่อ track id)
                    cur_side = side_of_line((cx, cy), LINE_P1, LINE_P2)
                    prev_side = last_side.get(int(tid))

                    if prev_side is not None:
                        crossed = (prev_side < 0 and cur_side > 0) or (prev_side > 0 and cur_side < 0)
                        if crossed and int(tid) not in counted_ids:
                            counts[cls_name] += 1
                            counted_ids.add(int(tid))

                    last_side[int(tid)] = cur_side

            # 6) แสดง FPS + counts
            now = time.time()
            fps = 1.0 / max(now - prev_t, 1e-6)
            prev_t = now
            cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

            y = 60
            cv2.putText(frame, "Counts:", (10, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
            y += 28
            for k, v in sorted(counts.items()):
                cv2.putText(frame, f"{k}: {v}", (10, y),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2)
                y += 24

            cv2.imshow("Screen Vehicle Counting", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break

    cv2.destroyAllWindows()
    print("Final counts:", dict(counts))


if __name__ == "__main__":
    main()
