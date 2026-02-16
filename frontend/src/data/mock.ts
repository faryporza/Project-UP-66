import type { Camera, Detection, Statistics, TimeRangeData, VehicleType, VehicleTypeInfo } from '@/types';

export const mockCameras: Camera[] = [
  {
    id: 'IP-001',
    name: 'กล้องถนนสุขุมวิท',
    location: 'ถนนสุขุมวิท ซอย 10',
    rtspUrl: 'rtsp://192.168.1.101/stream',
    status: 'online',
    zone: 'สุขุมวิท',
    lastActive: '2024-01-15T14:30:00Z',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 'IP-002',
    name: 'กล้องถนนเพลินจิต',
    location: 'แยกเพลินจิต',
    rtspUrl: 'rtsp://192.168.1.102/stream',
    status: 'online',
    zone: 'เพลินจิต',
    lastActive: '2024-01-15T14:29:00Z',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 'IP-003',
    name: 'กล้องถนนอโศก',
    location: 'แยกอโศก',
    rtspUrl: 'rtsp://192.168.1.103/stream',
    status: 'offline',
    zone: 'อโศก',
    lastActive: '2024-01-15T10:15:00Z',
    resolution: '1920x1080',
    fps: 25
  },
  {
    id: 'IP-004',
    name: 'กล้องถนนพระราม 9',
    location: 'แยกพระราม 9',
    rtspUrl: 'rtsp://192.168.1.104/stream',
    status: 'online',
    zone: 'พระราม 9',
    lastActive: '2024-01-15T14:31:00Z',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 'IP-005',
    name: 'กล้องถนนรัชดา',
    location: 'แยกรัชดา-ลาดพร้าว',
    rtspUrl: 'rtsp://192.168.1.105/stream',
    status: 'online',
    zone: 'รัชดา',
    lastActive: '2024-01-15T14:28:00Z',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 'IP-006',
    name: 'กล้องถนนสีลม',
    location: 'แยกสีลม',
    rtspUrl: 'rtsp://192.168.1.106/stream',
    status: 'offline',
    zone: 'สีลม',
    lastActive: '2024-01-15T08:45:00Z',
    resolution: '1280x720',
    fps: 25
  },
  {
    id: 'IP-007',
    name: 'กล้องถนนสาทร',
    location: 'แยกสาทร',
    rtspUrl: 'rtsp://192.168.1.107/stream',
    status: 'online',
    zone: 'สาทร',
    lastActive: '2024-01-15T14:32:00Z',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 'IP-008',
    name: 'กล้องถนนวิทยุ',
    location: 'แยกวิทยุ',
    rtspUrl: 'rtsp://192.168.1.108/stream',
    status: 'online',
    zone: 'วิทยุ',
    lastActive: '2024-01-15T14:30:00Z',
    resolution: '1920x1080',
    fps: 30
  }
];

export const mockDetections: Detection[] = [
  {
    id: 'DET-001',
    cameraId: 'IP-001',
    timestamp: '2024-01-15T14:32:15Z',
    vehicleType: 'sedan',
    confidence: 94.5,
    bbox: [120, 200, 150, 100]
  },
  {
    id: 'DET-002',
    cameraId: 'IP-001',
    timestamp: '2024-01-15T14:32:08Z',
    vehicleType: 'motorcycle',
    confidence: 87.2,
    bbox: [350, 280, 60, 80]
  },
  {
    id: 'DET-003',
    cameraId: 'IP-001',
    timestamp: '2024-01-15T14:31:55Z',
    vehicleType: 'truck',
    confidence: 91.8,
    bbox: [500, 150, 200, 180]
  },
  {
    id: 'DET-004',
    cameraId: 'IP-001',
    timestamp: '2024-01-15T14:31:42Z',
    vehicleType: 'hatchback',
    confidence: 96.3,
    bbox: [80, 220, 140, 90]
  },
  {
    id: 'DET-005',
    cameraId: 'IP-001',
    timestamp: '2024-01-15T14:31:30Z',
    vehicleType: 'van',
    confidence: 89.7,
    bbox: [300, 190, 160, 110]
  },
  {
    id: 'DET-006',
    cameraId: 'IP-002',
    timestamp: '2024-01-15T14:32:10Z',
    vehicleType: 'tuktuk',
    confidence: 92.1,
    bbox: [200, 300, 55, 75]
  },
  {
    id: 'DET-007',
    cameraId: 'IP-002',
    timestamp: '2024-01-15T14:31:58Z',
    vehicleType: 'pickup',
    confidence: 88.9,
    bbox: [450, 210, 145, 95]
  },
  {
    id: 'DET-008',
    cameraId: 'IP-004',
    timestamp: '2024-01-15T14:32:05Z',
    vehicleType: 'mini_truck',
    confidence: 93.4,
    bbox: [150, 180, 220, 190]
  },
  {
    id: 'DET-009',
    cameraId: 'IP-004',
    timestamp: '2024-01-15T14:31:48Z',
    vehicleType: 'suv',
    confidence: 95.2,
    bbox: [400, 230, 135, 85]
  },
  {
    id: 'DET-010',
    cameraId: 'IP-005',
    timestamp: '2024-01-15T14:32:00Z',
    vehicleType: 'songthaew',
    confidence: 85.6,
    bbox: [250, 290, 50, 70]
  },
  {
    id: 'DET-011',
    cameraId: 'IP-006',
    timestamp: '2024-01-15T14:31:52Z',
    vehicleType: 'jeep',
    confidence: 88.1,
    bbox: [180, 210, 145, 95]
  },
  {
    id: 'DET-012',
    cameraId: 'IP-007',
    timestamp: '2024-01-15T14:31:40Z',
    vehicleType: 'bus',
    confidence: 90.5,
    bbox: [90, 140, 260, 200]
  },
  {
    id: 'DET-013',
    cameraId: 'IP-007',
    timestamp: '2024-01-15T14:31:32Z',
    vehicleType: 'saleng',
    confidence: 84.3,
    bbox: [360, 280, 80, 90]
  },
  {
    id: 'DET-014',
    cameraId: 'IP-008',
    timestamp: '2024-01-15T14:31:25Z',
    vehicleType: 'ambulance',
    confidence: 93.2,
    bbox: [220, 170, 180, 120]
  },
  {
    id: 'DET-015',
    cameraId: 'IP-008',
    timestamp: '2024-01-15T14:31:12Z',
    vehicleType: 'taxi',
    confidence: 91.1,
    bbox: [420, 230, 135, 90]
  },
  {
    id: 'DET-016',
    cameraId: 'IP-003',
    timestamp: '2024-01-15T14:31:02Z',
    vehicleType: 'boxtruck',
    confidence: 86.9,
    bbox: [260, 210, 160, 110]
  },
  {
    id: 'DET-017',
    cameraId: 'IP-003',
    timestamp: '2024-01-15T14:30:55Z',
    vehicleType: 'e_tan',
    confidence: 82.7,
    bbox: [310, 240, 140, 100]
  }
];

export const mockStatistics: Statistics = {
  total: 1245,
  byType: {
    sedan: 250,
    hatchback: 170,
    pickup: 90,
    mini_truck: 60,
    truck: 40,
    suv: 90,
    songthaew: 40,
    jeep: 30,
    van: 70,
    bus: 35,
    motorcycle: 200,
    tuktuk: 35,
    e_tan: 20,
    saleng: 15,
    ambulance: 10,
    taxi: 70,
    boxtruck: 20
  },
  byTime: [
    { hour: '00:00', count: 12 },
    { hour: '01:00', count: 8 },
    { hour: '02:00', count: 5 },
    { hour: '03:00', count: 3 },
    { hour: '04:00', count: 7 },
    { hour: '05:00', count: 15 },
    { hour: '06:00', count: 45 },
    { hour: '07:00', count: 89 },
    { hour: '08:00', count: 112 },
    { hour: '09:00', count: 98 },
    { hour: '10:00', count: 87 },
    { hour: '11:00', count: 95 },
    { hour: '12:00', count: 103 },
    { hour: '13:00', count: 91 },
    { hour: '14:00', count: 88 },
    { hour: '15:00', count: 96 },
    { hour: '16:00', count: 108 },
    { hour: '17:00', count: 125 },
    { hour: '18:00', count: 142 },
    { hour: '19:00', count: 118 },
    { hour: '20:00', count: 76 },
    { hour: '21:00', count: 54 },
    { hour: '22:00', count: 38 },
    { hour: '23:00', count: 22 }
  ],
  byCamera: {
    'IP-001': 450,
    'IP-002': 380,
    'IP-004': 415,
    'IP-005': 0,
    'IP-007': 0,
    'IP-008': 0
  },
  accuracy: 91.5
};

const vehicleTypeTotals: Record<VehicleType, number> = {
  sedan: 250,
  hatchback: 170,
  pickup: 90,
  mini_truck: 60,
  truck: 40,
  suv: 90,
  songthaew: 40,
  jeep: 30,
  van: 70,
  bus: 35,
  motorcycle: 200,
  tuktuk: 35,
  e_tan: 20,
  saleng: 15,
  ambulance: 10,
  taxi: 70,
  boxtruck: 20,
  supercar: 0
};

const vehicleTypeEntries = Object.entries(vehicleTypeTotals) as Array<[VehicleType, number]>;
const totalVehicles = vehicleTypeEntries.reduce((sum, [, count]) => sum + count, 0);

const distributeByType = (total: number): Record<VehicleType, number> => {
  const allocations = vehicleTypeEntries.map(([type, count]) => {
    const raw = (total * count) / totalVehicles;
    const value = Math.floor(raw);
    return { type, value, remainder: raw - value };
  });

  const allocated = allocations.reduce((sum, item) => sum + item.value, 0);
  let remaining = total - allocated;

  allocations
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((_, index) => {
      if (remaining <= 0) return;
      allocations[index].value += 1;
      remaining -= 1;
    });

  return allocations.reduce((result, item) => {
    result[item.type] = item.value;
    return result;
  }, {} as Record<VehicleType, number>);
};

export const mockTimeRangeData: TimeRangeData[] = mockStatistics.byTime.map((entry) => ({
  time: entry.hour,
  byType: distributeByType(entry.count)
}));

export const vehicleTypeInfo: VehicleTypeInfo[] = [
  { type: 'hatchback', label: 'รถเก๋ง(แฮทช์แบ็ก)', color: '#38bdf8', icon: 'Car' },
  { type: 'sedan', label: 'รถเก๋ง(ซีดาน)', color: '#2563eb', icon: 'Car' },
  { type: 'pickup', label: 'รถกระบะ', color: '#16a34a', icon: 'Truck' },
  { type: 'mini_truck', label: 'รถบรรทุก(ขนาดเล็ก)', color: '#7c3aed', icon: 'Truck' },
  { type: 'truck', label: 'รถบรรทุก', color: '#6b7280', icon: 'Truck' },
  { type: 'boxtruck', label: 'รถบรรทุกตู้', color: '#4c1d95', icon: 'Truck' },
  { type: 'suv', label: 'รถ SUV', color: '#0ea5e9', icon: 'Car' },
  { type: 'songthaew', label: 'รถสองแถว', color: '#f97316', icon: 'Van' },
  { type: 'jeep', label: 'รถจิ๊บ', color: '#0f766e', icon: 'Car' },
  { type: 'van', label: 'รถตู้', color: '#10b981', icon: 'Van' },
  { type: 'bus', label: 'รถบัส', color: '#f59e0b', icon: 'Bus' },
  { type: 'motorcycle', label: 'รถจักรยานยนต์', color: '#ef4444', icon: 'Bike' },
  { type: 'tuktuk', label: 'รถตุ๊กตุ๊ก', color: '#f43f5e', icon: 'Bike' },
  { type: 'e_tan', label: 'รถอีแต๋น', color: '#84cc16', icon: 'Truck' },
  { type: 'saleng', label: 'รถซาเล้ง', color: '#db2777', icon: 'Bike' },
  { type: 'ambulance', label: 'รถพยาบาล', color: '#dc2626', icon: 'Van' },
  { type: 'taxi', label: 'รถแท็กซี่', color: '#eab308', icon: 'Car' },
  { type: 'supercar', label: 'ซูเปอร์คาร์', color: '#e11d48', icon: 'Car' }
];

export const zones = ['ทั้งหมด', 'สุขุมวิท', 'เพลินจิต', 'อโศก', 'พระราม 9', 'รัชดา', 'สีลม', 'สาทร', 'วิทยุ'];
