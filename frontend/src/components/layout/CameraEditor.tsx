import { useState } from 'react';
import type { Camera } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

const apiBaseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8000';
const ngrokHeaders = { 'ngrok-skip-browser-warning': 'true' };

interface CameraEditorProps {
  camera: Camera | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCamera: Camera) => void;
}

export function CameraEditor({ camera, isOpen, onClose, onSave }: CameraEditorProps) {
  const [formData, setFormData] = useState({
    name: camera?.name || '',
    rtsp: camera?.rtsp || '',
    hlsUrl: camera?.streamUrl || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!camera) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${apiBaseUrl}/cameras/${camera.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...ngrokHeaders,
        },
        body: JSON.stringify({
          name: formData.name,
          rtsp: formData.rtsp,
          hls_url: formData.hlsUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update camera');
      }

      const updatedCamera = await response.json();
      
      // Transform API response to Camera type
      const transformedCamera: Camera = {
        id: updatedCamera.camera_id,
        name: updatedCamera.name,
        location: camera.location,
        zone: camera.zone,
        status: camera.status,
        fps: camera.fps,
        resolution: camera.resolution,
        rtsp: updatedCamera.rtsp,
        streamUrl: updatedCamera.hls_url,
      };

      setSuccess(true);
      setTimeout(() => {
        onSave(transformedCamera);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!camera) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลกล้อง</DialogTitle>
          <DialogDescription>
            อัปเดตข้อมูลสำหรับกล้อง {camera.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera ID (Read-only) */}
          <div>
            <Label className="text-xs text-gray-500">รหัสกล้อง</Label>
            <Input
              type="text"
              value={camera.id}
              disabled
              className="bg-gray-100 text-gray-600"
            />
          </div>

          {/* Camera Name */}
          <div>
            <Label htmlFor="name">ชื่อกล้อง</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="เช่น กล้อง A1"
              disabled={isLoading}
            />
          </div>

          {/* RTSP URL */}
          <div>
            <Label htmlFor="rtsp">RTSP URL</Label>
            <Input
              id="rtsp"
              name="rtsp"
              type="text"
              value={formData.rtsp}
              onChange={handleChange}
              placeholder="rtsp://camera-url/stream"
              disabled={isLoading}
              className="font-mono text-xs"
            />
          </div>

          {/* HLS URL */}
          <div>
            <Label htmlFor="hlsUrl">HLS Stream URL (M3U8)</Label>
            <Input
              id="hlsUrl"
              name="hlsUrl"
              type="text"
              value={formData.hlsUrl}
              onChange={handleChange}
              placeholder="https://example.com/stream.m3u8"
              disabled={isLoading}
              className="font-mono text-xs"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">บันทึกข้อมูลสำเร็จ!</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              'บันทึก'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
