import { useState } from 'react';
import type { Detection, VehicleType } from '@/types';
import { Car, Bike, Truck, Van, ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DataTableProps {
  detections: Detection[];
  getVehicleLabel: (type: VehicleType) => string;
  getVehicleColor: (type: VehicleType) => string;
  loading?: boolean;
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

export function DataTable({ 
  detections, 
  getVehicleLabel,
  getVehicleColor,
  loading = false 
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(detections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = detections.slice(startIndex, startIndex + itemsPerPage);

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('th-TH'),
      time: date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-500">สูง</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-500">ปานกลาง</Badge>;
    return <Badge className="bg-orange-500">ต่ำ</Badge>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">รายละเอียดการตรวจจับ</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            ส่งออก CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>วันที่-เวลา</TableHead>
              <TableHead>กล้อง</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>ความมั่นใจ</TableHead>
              <TableHead>ระดับ</TableHead>
              <TableHead className="text-right">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((detection) => {
                const Icon = vehicleIcons[detection.vehicleType];
                const color = getVehicleColor(detection.vehicleType);
                const { date, time } = formatDateTime(detection.timestamp);

                return (
                  <TableRow key={detection.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{date}</p>
                        <p className="text-sm text-gray-500">{time}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{detection.cameraId}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color }} />
                        <span>{getVehicleLabel(detection.vehicleType)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${detection.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm">{detection.confidence.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getConfidenceBadge(detection.confidence)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDetection(detection)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, detections.length)} จาก {detections.length} รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              หน้า {currentPage} จาก {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedDetection} onOpenChange={() => setSelectedDetection(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>รายละเอียดการตรวจจับ</DialogTitle>
          </DialogHeader>
          {selectedDetection && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Car className="w-16 h-16 mx-auto mb-2" />
                  <p>ภาพตัวอย่าง</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">รหัส</p>
                  <p className="font-medium">{selectedDetection.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">กล้อง</p>
                  <p className="font-medium">{selectedDetection.cameraId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ประเภท</p>
                  <p className="font-medium">{getVehicleLabel(selectedDetection.vehicleType)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ความมั่นใจ</p>
                  <p className="font-medium">{selectedDetection.confidence.toFixed(1)}%</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">เวลา</p>
                  <p className="font-medium">
                    {new Date(selectedDetection.timestamp).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
