from ultralytics import YOLO

model = YOLO("../models/best.pt")  # ปรับ path ให้ตรงโปรเจกต์คุณ
print(model.names)
