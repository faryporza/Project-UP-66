ได้เลยค่ะ — นี่คือขั้นตอนติดตั้ง **Ultralytics + OpenCV** แบบใช้ **venv** และให้มันใช้ **CUDA GPU** (บนเครื่องตัวเอง)

> หมายเหตุ: `opencv-python` ไม่ได้ใช้ CUDA เองโดยตรง แต่ YOLO (PyTorch) จะใช้ CUDA ตอนรันโมเดลค่ะ

---

## 0) เช็กก่อนว่า NVIDIA + CUDA พร้อมไหม (Windows / Linux)

รัน:

```bash
nvidia-smi
```

ถ้าเห็นชื่อการ์ดจอ + Driver แปลว่าโอเค

---

## 1) สร้างและใช้งาน venv

### ✅ Windows (PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

### ✅ macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

---

## 2) ติดตั้ง PyTorch แบบ CUDA (สำคัญสุด)

**ต้องติดตั้ง PyTorch CUDA ก่อน** แล้วค่อยติดตั้ง `ultralytics`

### วิธีที่ปลอดภัย (เลือก CUDA ตามที่ PyTorch รองรับ)

ไปเลือกคำสั่งจากหน้า PyTorch: [https://pytorch.org/get-started/locally/](https://pytorch.org/get-started/locally/)

แต่ถ้าจะให้คำสั่งพร้อมใช้ (ตัวอย่างยอดนิยมตอนนี้คือ CUDA 12.1):

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

> ถ้าเครื่องคุณรองรับ/มีไดรเวอร์ใหม่พอ อันนี้จะใช้ได้บ่อยที่สุดค่ะ

---

## 3) ติดตั้ง Ultralytics + OpenCV

```bash
pip install ultralytics opencv-python
```

---

## 4) เช็กว่า CUDA ใช้ได้จริงไหม

สร้างไฟล์ `check_cuda.py` แล้วใส่:

```python
import torch
print("Torch version:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
```

รัน:

```bash
python check_cuda.py
```

ถ้าออกว่า:

* `CUDA available: True`
* เห็นชื่อ GPU
  แปลว่าใช้ GPU ได้แล้วค่ะ ✅

---

## 5) รัน YOLO ให้ใช้ GPU

โดยปกติ Ultralytics จะเลือก GPU ให้เองถ้ามี CUDA
แต่คุณบังคับได้ด้วย `device=0`

```python
from ultralytics import YOLO

model = YOLO("/models/best.pt")
model.predict("test.jpg", device=0, conf=0.5, save=True)
```

---

## ปัญหาที่เจอบ่อย (สั้นๆ)

* `CUDA available: False` → ส่วนใหญ่คือ **ลง PyTorch แบบ CPU** หรือ **ไดรเวอร์ไม่รองรับ**
* `nvidia-smi` ไม่มี → ยังไม่ได้ลง NVIDIA Driver / ใช้เครื่องไม่มี NVIDIA

---

ถ้าบอกได้ว่าใช้ **Windows หรือ Ubuntu** และ `nvidia-smi` โชว์ว่า **Driver Version / CUDA Version** เท่าไหร่ (แคปหน้าจอ/พิมพ์มาก็ได้) เดี๋ยวผมจะให้คำสั่ง PyTorch CUDA ที่ “ตรงเป๊ะ” กับเครื่องคุณค่ะ
