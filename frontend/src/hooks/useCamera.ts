import { useState, useEffect, useCallback } from 'react';
import type { Camera, CameraFilter } from '@/types';

type ApiCamera = {
  camera_id: string;
  name: string;
  rtsp: string;
  hls_url?: string;
  stream_url?: string;
  location?: string;
  zone?: string;
  status?: 'online' | 'offline';
  last_active?: string;
  resolution?: string;
  fps?: number;
  updated_at?: string;
};

const apiBaseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8000';
const ngrokHeaders = { 'ngrok-skip-browser-warning': 'true' };

export function useCamera() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [filter, setFilter] = useState<CameraFilter>({
    status: 'all',
    zone: 'ทั้งหมด',
    search: ''
  });

  // Fetch cameras
  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/cameras`, { headers: ngrokHeaders });
      if (!response.ok) {
        throw new Error(`โหลดรายการกล้องไม่สำเร็จ (${response.status})`);
      }
      const data = await response.json();
      const items: ApiCamera[] = Array.isArray(data?.items) ? data.items : [];
      const mapped: Camera[] = items.map((camera) => {
        const normalizedStatus = camera.status === 'offline' ? 'offline' : 'online';
        return {
        id: camera.camera_id,
        name: camera.name,
        location: camera.location ?? 'ไม่ระบุ',
        rtspUrl: camera.rtsp,
        streamUrl: camera.hls_url ?? camera.stream_url,
        status: normalizedStatus,
        zone: camera.zone ?? 'ทั่วไป',
        lastActive: camera.last_active ?? camera.updated_at ?? new Date().toISOString(),
        resolution: camera.resolution ?? 'ไม่ระบุ',
        fps: camera.fps ?? 0
        };
      });
      setCameras(mapped);
    } catch (err) {
      setError('ไม่สามารถโหลดรายการกล้องได้');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter cameras
  const filteredCameras = cameras.filter(camera => {
    // Filter by status
    if (filter.status !== 'all' && camera.status !== filter.status) {
      return false;
    }
    // Filter by zone
    if (filter.zone !== 'ทั้งหมด' && camera.zone !== filter.zone) {
      return false;
    }
    // Filter by search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        camera.id.toLowerCase().includes(searchLower) ||
        camera.name.toLowerCase().includes(searchLower) ||
        camera.location.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Get online cameras only
  const onlineCameras = cameras.filter(c => c.status === 'online');

  // Get offline cameras only
  const offlineCameras = cameras.filter(c => c.status === 'offline');

  // Select camera
  const selectCamera = useCallback((camera: Camera) => {
    if (camera.status === 'online') {
      setSelectedCamera(camera);
      return true;
    }
    return false;
  }, []);

  // Get camera by ID
  const getCameraById = useCallback((id: string) => {
    return cameras.find(c => c.id === id) || null;
  }, [cameras]);

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<CameraFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCameras();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchCameras]);

  return {
    cameras,
    filteredCameras,
    onlineCameras,
    offlineCameras,
    loading,
    error,
    selectedCamera,
    filter,
    fetchCameras,
    selectCamera,
    getCameraById,
    updateFilter,
    setSelectedCamera
  };
}
