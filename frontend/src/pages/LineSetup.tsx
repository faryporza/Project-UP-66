import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { LineCanvas } from '@/components/detection/LineCanvas';
import { useCamera } from '@/hooks/useCamera';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const defaultCanvasWidth = 1280;
const defaultCanvasHeight = 720;

export function LineSetup() {
  const { cameras } = useCamera();
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [lineIdSeed, setLineIdSeed] = useState(() => `line_${Date.now()}`);
  const [snapshotUrl, setSnapshotUrl] = useState('');

  const selectedCamera = useMemo(() => {
    return cameras.find((camera) => camera.id === selectedCameraId) ?? null;
  }, [cameras, selectedCameraId]);

  useEffect(() => {
    if (!selectedCameraId && cameras.length > 0) {
      setSelectedCameraId(cameras[0].id);
    }
  }, [cameras, selectedCameraId]);

  const handleCameraChange = (id: string) => {
    setSelectedCameraId(id);
    setLineIdSeed(`line_${Date.now()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="ตั้งเส้นนับ" subtitle="กำหนดเส้นสำหรับนับยานพาหนะ" />

      <main className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="text-gray-600">เลือกกล้อง</span>
              <Select value={selectedCameraId} onValueChange={handleCameraChange}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="เลือกกล้อง" />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            camera.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {camera.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="text-gray-600">snapshot URL (optional)</span>
              <Input
                value={snapshotUrl}
                onChange={(e) => setSnapshotUrl(e.target.value)}
                placeholder="http://localhost:8000/snapshot/cam_001"
                className="min-w-80"
              />
            </label>

            <Button
              variant="secondary"
              onClick={() => setSnapshotUrl('')}
            >
              Clear Snapshot
            </Button>

            {selectedCamera && (
              <Badge variant={selectedCamera.status === 'online' ? 'default' : 'secondary'}>
                {selectedCamera.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}
              </Badge>
            )}
          </div>
        </div>

        {selectedCamera ? (
          <LineCanvas
            cameraId={selectedCamera.id}
            lineIdDefault={lineIdSeed}
            width={defaultCanvasWidth}
            height={defaultCanvasHeight}
            backgroundImageUrl={snapshotUrl}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-600">
            ยังไม่พบกล้องในระบบ กรุณาเพิ่มกล้องก่อนใช้งาน
          </div>
        )}
      </main>
    </div>
  );
}
