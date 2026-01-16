ระบบนับรถจากกล้อง RTSP ด้วย YOLO v11
ภาพรวม
สร้างเว็บแอปพลิเคชันสำหรับนับรถ 18 ประเภทจากกล้อง RTSP โดยใช้ YOLO v11 พร้อมแสดงผลบน Dashboard พร้อมแผนที่ประเทศไทย

ประเภทรถที่นับ
Index	ประเภท	Index	ประเภท
0	ambulance (รถพยาบาล)	9	saleng (ซาเล้ง)
1	boxtruck (รถบรรทุกกล่อง)	10	sedan (รถเก๋ง)
2	bus (รถบัส)	11	songthaew (รถสองแถว)
3	e_tan (อีแต๋น)	12	supercar (ซุปเปอร์คาร์)
4	hatchback (รถแฮทช์แบ็ก)	13	suv (รถ SUV)
5	jeep (รถจี๊ป)	14	taxi (รถแท็กซี่)
6	mini_truck (รถกระบะเล็ก)	15	truck (รถบรรทุก)
7	motorcycle (รถจักรยานยนต์)	16	tuktuk (รถตุ๊กตุ๊ก)
8	pickup (รถกระบะ)	17	van (รถตู้)
Proposed Changes
Backend Component
[NEW] 
requirements.txt
รายการ dependencies สำหรับ Python backend:

fastapi - Web framework
uvicorn - ASGI server
ultralytics - YOLO v11
opencv-python - Video processing
python-multipart - File upload support
[MODIFY] 
main.py
สร้าง FastAPI server พร้อม:

YOLO Model Loading: โหลด 
best.pt
 model
RTSP Stream Processing: อ่านวิดีโอจากกล้อง IP
Vehicle Detection: ตรวจจับและนับรถ 18 ประเภท
JSON Storage: บันทึกผลการนับลง JSON file
REST API Endpoints:
GET /api/cameras - รายการกล้อง
GET /api/stats - สถิติการนับรถ
GET /api/detection/start - เริ่มตรวจจับ
GET /api/detection/stop - หยุดตรวจจับ
[NEW] 
data/detection_results.json
ไฟล์ JSON สำหรับเก็บผลการนับรถ

Frontend Component
[NEW] 
components/ThailandMap.tsx
Component แสดงแผนที่ประเทศไทยแบบ Interactive:

ใช้ SVG จาก 
public/maps/th.svg
แสดงตำแหน่งกล้องที่จังหวัดพะเยา (TH56)
สีแสดงสถานะกล้อง (เขียว = ทำงาน, แดง = ไม่ทำงาน)
คลิกเพื่อแสดงข้อมูลกล้อง
[NEW] 
components/Dashboard.tsx
Component หน้า Dashboard หลัก:

แสดงสรุปจำนวนรถทั้งหมด
แยกแสดงตามประเภท
อัพเดทแบบ Real-time
[NEW] 
components/VehicleStats.tsx
Component แสดงสถิติรถแต่ละประเภท:

การ์ดแสดงจำนวนรถแต่ละประเภท
ใช้ไอคอนประกอบ
รองรับภาษาไทย
[NEW] 
components/CameraCard.tsx
Component แสดงข้อมูลกล้อง:

ชื่อจังหวัด/ตำแหน่ง
สถานะการทำงาน
ข้อมูล RTSP URL
[MODIFY] 
page.tsx
อัพเดทหน้าหลัก:

รวม Dashboard component
รวม Thailand Map component
Layout สำหรับแสดงผลข้อมูล
[MODIFY] 
globals.css
เพิ่ม CSS สำหรับ:

Styling แผนที่
Animation สำหรับสถานะกล้อง
Dark theme สำหรับ Dashboard
[NEW] 
data/cameras.json
ข้อมูลกล้องเริ่มต้น (JSON format):

{
  "cameras": [{
    "id": "cam-001",
    "province_code": "TH56",
    "province_name": "Phayao",
    "province_name_th": "พะเยา",
    "rtsp_url": "rtsp://admin:luis2547@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0",
    "status": "active"
  }]
}
Verification Plan
Manual Verification
1. Backend Verification:

# เข้า directory backend
cd /Users/tanakitchuchoed/Documents/GitHub/Project-UP-66/backend
# Activate venv
source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# รัน backend server
python main.py
# ทดสอบ API ด้วย curl
curl http://localhost:8000/api/cameras
curl http://localhost:8000/api/stats
2. Frontend Verification:

# เข้า directory frontend
cd /Users/tanakitchuchoed/Documents/GitHub/Project-UP-66/frontend
# รัน development server
npm run dev
# เปิด browser ที่ http://localhost:3000
3. Visual Verification:

ตรวจสอบว่าแผนที่ประเทศไทยแสดงผลถูกต้อง
คลิกที่จังหวัดพะเยา (TH56) แสดงข้อมูลกล้อง
Dashboard แสดงจำนวนรถแต่ละประเภทเป็นภาษาไทย
IMPORTANT

กล้อง RTSP ต้องเปิดใช้งานและเข้าถึงได้จาก network ที่รันระบบ

