"""
Configuration module - loads settings from environment variables.
"""
import os

# -------------------- Model Settings --------------------
MODEL_PATH = os.getenv("MODEL_PATH", "models/best.pt")
DEVICE = os.getenv("DEVICE", "cpu")  # "cpu" or "0" for CUDA

# -------------------- Video Source --------------------
VIDEO_SOURCE = os.getenv("VIDEO_SOURCE", "0")  # "0" for webcam or path to video

# -------------------- Detection Settings --------------------
CONFIDENCE = float(os.getenv("CONFIDENCE", "0.05"))
IOU = float(os.getenv("IOU", "0.70"))
SHOW_CONF = float(os.getenv("SHOW_CONF", "0.25"))
MAX_DET = int(os.getenv("MAX_DET", "300"))
AGNOSTIC_NMS = os.getenv("AGNOSTIC_NMS", "true").lower() == "true"

# -------------------- Line Crossing Settings --------------------
LINE_MARGIN = int(os.getenv("LINE_MARGIN", "12"))
DIRECTION = os.getenv("DIRECTION", "both")  # "both" / "up" / "down"
LINE_Y_RATIO = float(os.getenv("LINE_Y_RATIO", "0.55"))  # เส้นอยู่ที่ 55% ของความสูง

# -------------------- Stream Settings --------------------
JPEG_QUALITY = int(os.getenv("JPEG_QUALITY", "80"))
STREAM_DELAY = float(os.getenv("STREAM_DELAY", "0.03"))  # ~30 FPS

# -------------------- Class Definitions --------------------
CLASSES = {
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

# Class IDs to count (all 18 classes by default)
COUNT_CLASS_IDS = list(range(18))
