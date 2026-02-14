from ultralytics import YOLO

model = YOLO("model/best.mlpackage")

print(model.names)
