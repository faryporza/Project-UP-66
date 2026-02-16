import { useState, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useDetection } from '@/hooks/useDetection';
import { VideoPlayer } from '@/components/detection/VideoPlayer';
import { DetectionPanel } from '@/components/detection/DetectionPanel';
import { Header } from '@/components/layout/Header';
import { CameraEditor } from '@/components/layout/CameraEditor';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Play, 
  Pause,
  Activity,
  Settings
} from 'lucide-react';

type ActiveLine = {
  line_id: string;
  camera_id: string;
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  is_active: boolean;
};

const apiBaseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8000';
const ngrokHeaders = { 'ngrok-skip-browser-warning': 'true' };

export function LiveMonitor() {
  const { cameras, getCameraById } = useCamera();
  const onlineCameras = cameras.filter(c => c.status === 'online');
  
  // Auto-select first online camera
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  useEffect(() => {
    if (!selectedCameraId && onlineCameras.length > 0) {
      setSelectedCameraId(onlineCameras[0].id);
    }
  }, [onlineCameras, selectedCameraId]);
  
  const {
    detections,
    liveDetections,
    isStreaming,
    fps,
    frameSrc,
    liveCounts,
    startStreaming,
    stopStreaming,
    getVehicleLabel,
    getVehicleColor,
    fetchDetections
  } = useDetection(selectedCameraId);

  const [activeLine, setActiveLine] = useState<ActiveLine | null>(null);
  const [lineError, setLineError] = useState<string | null>(null);

  const selectedCamera = selectedCameraId ? getCameraById(selectedCameraId) : null;

  const handleCameraChange = (id: string) => {
    stopStreaming();
    setSelectedCameraId(id);
  };

  const handleToggleStream = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  const handleSaveCamera = (updatedCamera: typeof selectedCamera) => {
    // Refresh camera list by fetching again
    if (selectedCameraId) {
      window.location.reload();
    }
  };

  useEffect(() => {
    if (!selectedCameraId) {
      setActiveLine(null);
      setLineError(null);
      return;
    }

    let isMounted = true;
    const loadLine = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/lines/active/${selectedCameraId}`, { headers: ngrokHeaders });
        if (!res.ok) {
          if (res.status === 404) {
            if (isMounted) {
              setActiveLine(null);
              setLineError(null);
            }
            return;
          }
          throw new Error('โหลดเส้นนับไม่สำเร็จ');
        }
        const data = (await res.json()) as ActiveLine;
        if (isMounted) {
          setActiveLine(data);
          setLineError(null);
        }
      } catch (err) {
        if (isMounted) {
          setActiveLine(null);
          setLineError('ไม่สามารถโหลดเส้นนับได้');
        }
      }
    };

    loadLine();
    return () => {
      isMounted = false;
    };
  }, [selectedCameraId]);

  if (onlineCameras.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="ดูภาพสด" subtitle="ตรวจสอบยานพาหนะแบบ Real-time" />
        <main className="p-6">
          <ErrorMessage
            title="ไม่พบกล้องที่พร้อมใช้งาน"
            message="ไม่มีกล้องที่อยู่ในสถานะออนไลน์ กรุณาตรวจสอบการเชื่อมต่อกล้อง"
            onRetry={fetchDetections}
          />
        </main>
      </div>
    );
  }

  if (!selectedCamera) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="ดูภาพสด" subtitle="ตรวจสอบยานพาหนะแบบ Real-time" />
        <main className="p-6">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        </main>
      </div>
    );
  }

  if (selectedCamera.status === 'offline') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="ดูภาพสด" subtitle="ตรวจสอบยานพาหนะแบบ Real-time" />
        <main className="p-6">
          <ErrorMessage
            title="กล้องไม่พร้อมใช้งาน"
            message={`กล้อง ${selectedCamera.name} (${selectedCamera.id}) อยู่ในสถานะออฟไลน์ ไม่สามารถแสดงภาพได้`}
            onRetry={fetchDetections}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="ดูภาพสด" 
        subtitle={`กล้อง ${selectedCamera.name} - ${selectedCamera.location}`}
      />
      
      <CameraEditor
        camera={selectedCamera}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveCamera}
      />
      
      <main className="p-6 space-y-6">
        {/* Camera Selector & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">เลือกกล้อง</label>
              <Select value={selectedCameraId || ''} onValueChange={handleCameraChange}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="เลือกกล้อง" />
                </SelectTrigger>
                <SelectContent>
                  {onlineCameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        {camera.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stream Status */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={isStreaming ? 'default' : 'secondary'}
                className={isStreaming ? 'bg-green-500' : ''}
              >
                <Activity className="w-3 h-3 mr-1" />
                {isStreaming ? 'กำลังสตรีม' : 'หยุดชั่วคราว'}
              </Badge>
              {isStreaming && (
                <Badge variant="outline">
                  {fps} FPS
                </Badge>
              )}
            </div>

            {/* Stream Control */}
            <Button
              onClick={handleToggleStream}
              variant={isStreaming ? 'destructive' : 'default'}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  หยุด
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  เล่น
                </>
              )}
            </Button>

            {/* Camera Settings */}
            <Button
              onClick={() => setIsEditorOpen(true)}
              variant="outline"
            >
              <Settings className="w-4 h-4 mr-2" />
              ตั้งค่า
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <VideoPlayer
              cameraId={selectedCamera.id}
              cameraName={selectedCamera.name}
              isStreaming={isStreaming}
              fps={fps}
              streamUrl={selectedCamera.streamUrl}
              frameSrc={frameSrc}
              liveCounts={liveCounts}
              line={activeLine ? { p1: activeLine.p1, p2: activeLine.p2 } : null}
              liveDetections={liveDetections}
              onToggleStream={handleToggleStream}
              getVehicleColor={getVehicleColor}
            />

            {!selectedCamera.streamUrl && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                กล้องนี้ยังไม่มี stream URL (HLS) ในฐานข้อมูล
              </div>
            )}

            {lineError && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                {lineError}
              </div>
            )}
            {!lineError && !activeLine && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
                ยังไม่มีเส้นนับที่ใช้งานอยู่สำหรับกล้องนี้
              </div>
            )}
            
            {/* Camera Info */}
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลกล้อง</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">รหัสกล้อง</p>
                  <p className="font-medium">{selectedCamera.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ตำแหน่ง</p>
                  <p className="font-medium">{selectedCamera.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">โซน</p>
                  <p className="font-medium">{selectedCamera.zone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ความละเอียด</p>
                  <p className="font-medium">{selectedCamera.resolution} @ {selectedCamera.fps}fps</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detection Panel */}
          <div>
            <DetectionPanel
              detections={detections}
              getVehicleLabel={getVehicleLabel}
              getVehicleColor={getVehicleColor}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
