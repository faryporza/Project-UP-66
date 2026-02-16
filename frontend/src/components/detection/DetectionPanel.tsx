import type { Detection, VehicleType } from '@/types';
import { Car, Bike, Truck, Van, Clock, Camera } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface DetectionPanelProps {
  detections: Detection[];
  getVehicleColor: (type: VehicleType) => string;
  getVehicleLabel: (type: VehicleType) => string;
}

const vehicleIcons: Record<VehicleType, typeof Car> = {
  ambulance: Van,
  boxtruck: Truck,
  bus: Van,
  e_tan: Truck,
  hatchback: Car,
  jeep: Car,
  mini_truck: Truck,
  motorcycle: Bike,
  pickup: Truck,
  saleng: Bike,
  sedan: Car,
  songthaew: Van,
  supercar: Car,
  suv: Car,
  taxi: Car,
  truck: Truck,
  tuktuk: Bike,
  van: Van
};

export function DetectionPanel({ 
  detections, 
  getVehicleColor,
  getVehicleLabel 
}: DetectionPanelProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">การตรวจจับล่าสุด</h3>
          <Badge variant="secondary">
            {detections.length} รายการ
          </Badge>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="h-[400px]">
        {detections.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">ยังไม่มีการตรวจจับ</p>
            <p className="text-sm text-gray-400 mt-1">
              รอการตรวจจับยานพาหนะ...
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {detections.map((detection, index) => {
              const Icon = vehicleIcons[detection.vehicleType];
              const color = getVehicleColor(detection.vehicleType);
              
              return (
                <div
                  key={detection.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {getVehicleLabel(detection.vehicleType)}
                        </h4>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(detection.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {/* Confidence */}
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getConfidenceColor(detection.confidence)}`}
                              style={{ width: `${detection.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-12 text-right">
                            {detection.confidence.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Camera ID */}
                      <p className="text-xs text-gray-500 mt-1">
                        กล้อง: {detection.cameraId}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {detections.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            แสดง {detections.length} รายการล่าสุด
          </p>
        </div>
      )}
    </div>
  );
}
