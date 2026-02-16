// Camera Types
export type Camera = {
  id: string;
  name: string;
  location: string;
  rtsp: string;
  streamUrl?: string;
  status: 'online' | 'offline';
  zone: string;
  fps: number;
  resolution: string;
};

// Detection Types — must match YOLO model class names
export type VehicleType =
  | 'ambulance'
  | 'boxtruck'
  | 'bus'
  | 'e_tan'
  | 'hatchback'
  | 'jeep'
  | 'mini_truck'
  | 'motorcycle'
  | 'pickup'
  | 'saleng'
  | 'sedan'
  | 'songthaew'
  | 'supercar'
  | 'suv'
  | 'taxi'
  | 'truck'
  | 'tuktuk'
  | 'van';

export type Detection = {
  id: string;
  cameraId: string;
  timestamp: string;
  vehicleType: VehicleType;
  confidence: number;
  bbox: [number, number, number, number]; // x, y, width, height
  imageUrl?: string;
}

// Statistics Types
export type Statistics = {
  total: number;
  byType: Record<string, number>;
  byTime: Array<{ hour: string; count: number }>;
  byCamera: Record<string, number>;
  accuracy: number;
}

export type TimeRangeData = {
  time: string;
  byType: Record<VehicleType, number>;
}

// Connection Status
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'unstable';

// Filter Types
export type CameraFilter = {
  status: 'all' | 'online' | 'offline';
  zone: string;
  search: string;
}

export type StatisticsFilter = {
  startDate: string;
  endDate: string;
  cameras: string[];
  vehicleTypes: VehicleType[];
  minConfidence: number;
}

// Vehicle Type Info
export type VehicleTypeInfo = {
  type: VehicleType;
  label: string;
  color: string;
  icon: string;
}
