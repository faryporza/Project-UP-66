import { useState, useEffect, useCallback } from 'react';
import type { Statistics, StatisticsFilter, Detection, TimeRangeData } from '@/types';

type ByClassItem = { class: string; total: number };
type ByCameraItem = { camera_id: string; total: number };
type ByTimeItem = { time: string; by_class: Record<string, number> };
type RecentCount = {
  count_id: string;
  camera_id: string;
  line_id: string;
  track_id: number;
  class: string;
  time: string;
};

const apiBaseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8000';
const ngrokHeaders = { 'ngrok-skip-browser-warning': 'true' };

export function useStatistics() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [timeRangeData, setTimeRangeData] = useState<TimeRangeData[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(true);
  const [filter, setFilter] = useState<StatisticsFilter>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    cameras: [],
    vehicleTypes: [],
    minConfidence: 0
  });

  // Check database connection
  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/health`, { headers: ngrokHeaders });
      if (!res.ok) {
        throw new Error('health check failed');
      }
      setDbConnected(true);
      return true;
    } catch (err) {
      setDbConnected(false);
      return false;
    }
  }, [apiBaseUrl]);

  const buildRange = () => {
    const start = new Date(`${filter.startDate}T00:00:00`);
    const end = new Date(`${filter.endDate}T23:59:59.999`);
    return { start, end };
  };

  const toQuery = (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        search.set(key, String(value));
      }
    });
    return search.toString();
  };

  const buildFilterQuery = () => {
    const cameras = filter.cameras.length > 0 ? filter.cameras.join(',') : undefined;
    const classes = filter.vehicleTypes.length > 0 ? filter.vehicleTypes.join(',') : undefined;
    return { cameras, classes };
  };

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check connection first
      const connected = await checkConnection();
      if (!connected) {
        throw new Error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      }

      const { start, end } = buildRange();
      const { cameras, classes } = buildFilterQuery();
      const queryBase = {
        start: start.toISOString(),
        end: end.toISOString(),
        camera_ids: cameras,
        classes
      };

      const [byClassRes, byCameraRes, byTimeRes] = await Promise.all([
        fetch(`${apiBaseUrl}/counts/by-class?${toQuery(queryBase)}`, { headers: ngrokHeaders }),
        fetch(`${apiBaseUrl}/counts/by-camera?${toQuery(queryBase)}`, { headers: ngrokHeaders }),
        fetch(`${apiBaseUrl}/counts/by-time?${toQuery({ ...queryBase, bucket: 'hour' })}`, { headers: ngrokHeaders })
      ]);

      if (!byClassRes.ok || !byCameraRes.ok || !byTimeRes.ok) {
        throw new Error('โหลดข้อมูลสถิติไม่สำเร็จ');
      }

      const byClassData = await byClassRes.json();
      const byCameraData = await byCameraRes.json();
      const byTimeData = await byTimeRes.json();

      const byClassItems: ByClassItem[] = Array.isArray(byClassData?.items) ? byClassData.items : [];
      const byCameraItems: ByCameraItem[] = Array.isArray(byCameraData?.items) ? byCameraData.items : [];
      const byTimeItems: ByTimeItem[] = Array.isArray(byTimeData?.items) ? byTimeData.items : [];

      const byType: Record<string, number> = {};
      let total = 0;
      byClassItems.forEach((item) => {
        byType[item.class] = item.total;
        total += item.total;
      });

      const byCamera: Record<string, number> = {};
      byCameraItems.forEach((item) => {
        byCamera[item.camera_id] = item.total;
      });

      const timeData: TimeRangeData[] = byTimeItems.map((item) => ({
        time: item.time,
        byType: item.by_class as TimeRangeData['byType']
      }));

      setStatistics({
        total,
        byType,
        byTime: [],
        byCamera,
        accuracy: 0
      });
      setTimeRangeData(timeData);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสถิติได้');
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [filter, checkConnection]);

  // Fetch detection history
  const fetchDetections = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const connected = await checkConnection();
      if (!connected) {
        throw new Error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      }

      const { start, end } = buildRange();
      const { cameras, classes } = buildFilterQuery();
      const query = toQuery({
        start: start.toISOString(),
        end: end.toISOString(),
        camera_ids: cameras,
        classes,
        limit: 200
      });

      const res = await fetch(`${apiBaseUrl}/counts/recent?${query}`, { headers: ngrokHeaders });
      if (!res.ok) {
        throw new Error('ไม่สามารถโหลดประวัติการตรวจจับได้');
      }
      const data = await res.json();
      const items: RecentCount[] = Array.isArray(data?.items) ? data.items : [];

      const mapped = items.map<Detection>((item) => ({
        id: item.count_id,
        cameraId: item.camera_id,
        timestamp: item.time,
        vehicleType: item.class as Detection['vehicleType'],
        confidence: 100,
        bbox: [0, 0, 0, 0]
      }));

      setDetections(mapped);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดประวัติการตรวจจับได้');
      setDetections([]);
    } finally {
      setLoading(false);
    }
  }, [filter, checkConnection]);

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<StatisticsFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  // Export data
  const exportData = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (format === 'csv') {
        // Generate CSV
        const headers = ['ID', 'Camera', 'Timestamp', 'Type', 'Confidence'];
        const rows = detections.map(d => [
          d.id,
          d.cameraId,
          d.timestamp,
          d.vehicleType,
          d.confidence
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detections_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Generate JSON
        const json = JSON.stringify(detections, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detections_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      return true;
    } catch (err) {
      return false;
    } finally {
      setLoading(false);
    }
  }, [detections]);

  // Get summary by vehicle type
  const getTypeSummary = useCallback(() => {
    if (!statistics) return [];
    
    return Object.entries(statistics.byType).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / statistics.total) * 100).toFixed(1)
    }));
  }, [statistics]);

  // Get summary by camera
  const getCameraSummary = useCallback(() => {
    if (!statistics) return [];
    
    return Object.entries(statistics.byCamera).map(([cameraId, count]) => ({
      cameraId,
      count
    }));
  }, [statistics]);

  // Initial fetch
  useEffect(() => {
    fetchStatistics();
    fetchDetections();
  }, [fetchStatistics, fetchDetections]);

  return {
    statistics,
    timeRangeData,
    detections,
    loading,
    error,
    dbConnected,
    filter,
    fetchStatistics,
    fetchDetections,
    updateFilter,
    exportData,
    getTypeSummary,
    getCameraSummary,
    checkConnection
  };
}
