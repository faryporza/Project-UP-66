import { useState, useCallback, useRef } from 'react';
import type { Detection, VehicleType } from '@/types';

interface DetectionBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: VehicleType;
  confidence: number;
  label: string;
  track_id?: number;
}

const apiBaseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8000';
// http -> ws, https -> wss
const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');

export function useDetection(cameraId: string | null) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [liveDetections, setLiveDetections] = useState<DetectionBox[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fps, setFps] = useState(0);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch historical detections (placeholder)
  const fetchDetections = useCallback(async () => {
    if (!cameraId) return;
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setDetections([]);
    } catch {
      setError('ไม่สามารถโหลดข้อมูลการตรวจจับได้');
    } finally {
      setLoading(false);
    }
  }, [cameraId]);

  // Start streaming — connect WebSocket to backend
  const startStreaming = useCallback(() => {
    if (!cameraId) return;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsStreaming(true);
    setError(null);
    setLiveCounts({});

    const ws = new WebSocket(`${wsBaseUrl}/ws/detect/${cameraId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
          setIsStreaming(false);
          return;
        }

        if (data.type === 'frame') {
          // Update annotated frame
          if (data.frame) {
            setFrameSrc(`data:image/jpeg;base64,${data.frame}`);
          }

          // Update FPS
          if (data.fps) setFps(Math.round(data.fps));

          // Update detections (bounding boxes)
          if (data.detections) {
            setLiveDetections(data.detections as DetectionBox[]);
          }

          // Update live counts
          if (data.counts) {
            setLiveCounts(data.counts);
          }

          // Accumulate new detections for DetectionPanel
          if (data.new_counts && Array.isArray(data.new_counts) && data.new_counts.length > 0) {
            const newDetections: Detection[] = data.new_counts.map(
              (nc: { camera_id: string; track_id: number; class: string; confidence: number; bbox: [number, number, number, number]; time: string }) => ({
                id: `det-${nc.camera_id}-${nc.track_id}`,
                cameraId: nc.camera_id,
                timestamp: nc.time || new Date().toISOString(),
                vehicleType: nc.class as VehicleType,
                confidence: nc.confidence ?? 0,
                bbox: nc.bbox ?? [0, 0, 0, 0],
              })
            );
            setDetections(prev => [...newDetections, ...prev].slice(0, 200));
          }
        }
      } catch (e) {
        console.warn('[WS] parse error:', e);
      }
    };

    ws.onerror = (e) => {
      console.error('[WS] error:', e);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('[WS] disconnected');
      setIsStreaming(false);
      setFps(0);
    };
  }, [cameraId]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
    setLiveDetections([]);
    setFps(0);
    setFrameSrc(null);
    setLiveCounts({});
  }, []);

  // Get vehicle label
  const getVehicleLabel = (type: VehicleType): string => {
    const labels: Record<VehicleType, string> = {
      ambulance: 'รถพยาบาล',
      boxtruck: 'รถบรรทุกตู้',
      bus: 'รถบัส',
      e_tan: 'รถอีแต๋น',
      hatchback: 'รถเก๋ง(แฮทช์แบ็ก)',
      jeep: 'รถจิ๊บ',
      mini_truck: 'รถบรรทุก(ขนาดเล็ก)',
      motorcycle: 'รถจักรยานยนต์',
      pickup: 'รถกระบะ',
      saleng: 'รถซาเล้ง',
      sedan: 'รถเก๋ง(ซีดาน)',
      songthaew: 'รถสองแถว',
      supercar: 'ซูเปอร์คาร์',
      suv: 'รถ SUV',
      taxi: 'รถแท็กซี่',
      truck: 'รถบรรทุก',
      tuktuk: 'รถตุ๊กตุ๊ก',
      van: 'รถตู้'
    };
    return labels[type] || type;
  };

  // Get color for vehicle type
  const getVehicleColor = (type: VehicleType): string => {
    const colors: Record<VehicleType, string> = {
      ambulance: '#dc2626',
      boxtruck: '#4c1d95',
      bus: '#f59e0b',
      e_tan: '#84cc16',
      hatchback: '#38bdf8',
      jeep: '#0f766e',
      mini_truck: '#7c3aed',
      motorcycle: '#ef4444',
      pickup: '#16a34a',
      saleng: '#db2777',
      sedan: '#2563eb',
      songthaew: '#f97316',
      supercar: '#e11d48',
      suv: '#0ea5e9',
      taxi: '#eab308',
      truck: '#6b7280',
      tuktuk: '#f43f5e',
      van: '#10b981'
    };
    return colors[type] || '#6b7280';
  };

  // Clear detections
  const clearDetections = useCallback(() => {
    setDetections([]);
    setLiveDetections([]);
    setFrameSrc(null);
    setLiveCounts({});
  }, []);

  return {
    detections,
    liveDetections,
    loading,
    error,
    isStreaming,
    fps,
    frameSrc,
    liveCounts,
    fetchDetections,
    startStreaming,
    stopStreaming,
    getVehicleLabel,
    getVehicleColor,
    clearDetections
  };
}
