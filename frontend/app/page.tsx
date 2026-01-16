'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ThailandMap from './components/ThailandMap';
import CameraCard from './components/CameraCard';
import Dashboard from './components/Dashboard';

interface Camera {
  id: string;
  province_code: string;
  province_name: string;
  province_name_th: string;
  status: string;
  rtsp_url?: string;
}

interface Stats {
  is_running: boolean;
  last_update: string | null;
  total_count: number;
  counts: Record<string, number>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const apiUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

export default function Home() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [stats, setStats] = useState<Stats>({
    is_running: false,
    last_update: null,
    total_count: 0,
    counts: {},
  });
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cameras
  const fetchCameras = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/cameras'), { cache: 'no-store' });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setCameras(data.cameras || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
      // Load from local JSON as fallback
      try {
        const res = await fetch('/data/cameras.json');
        const data = await res.json();
        setCameras(data.cameras || []);
        setError('ไม่สามารถเชื่อมต่อ Backend ได้ กำลังใช้ข้อมูลกล้องจากไฟล์ local');
      } catch {
        setError('ไม่สามารถโหลดข้อมูลกล้องได้');
      }
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/stats'), { cache: 'no-store' });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('ไม่สามารถเชื่อมต่อ Backend ได้');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCameras();
      await fetchStats();
      setLoading(false);
    };
    init();
  }, [fetchCameras, fetchStats]);

  // Poll stats when detection is running
  useEffect(() => {
    if (!stats.is_running) return;

    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, [stats.is_running, fetchStats]);

  // Start detection
  const handleStartDetection = async (cameraId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/detection/start/${cameraId}`), {
        method: 'POST',
      });
      if (res.ok) {
        await fetchStats();
        await fetchCameras();
      }
    } catch (err) {
      console.error('Failed to start detection:', err);
      setError('ไม่สามารถเริ่มการตรวจจับได้');
    }
  };

  // Stop detection
  const handleStopDetection = async () => {
    try {
      const res = await fetch(apiUrl('/api/detection/stop'), {
        method: 'POST',
      });
      if (res.ok) {
        await fetchStats();
        await fetchCameras();
      }
    } catch (err) {
      console.error('Failed to stop detection:', err);
      setError('ไม่สามารถหยุดการตรวจจับได้');
    }
  };

  // Handle province click
  const handleProvinceClick = (provinceCode: string, camera?: Camera) => {
    if (camera) {
      setSelectedCamera(camera);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚗</span>
              <div>
                <h1 className="text-2xl font-bold text-white">ระบบนับรถ</h1>
                <p className="text-gray-400 text-sm">Vehicle Counting System with YOLO v11</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${stats.is_running ? 'bg-green-500/20' : 'bg-gray-700/50'
                }`}>
                <div className={`w-2 h-2 rounded-full ${stats.is_running ? 'bg-green-500 status-pulse' : 'bg-gray-500'
                  }`} />
                <span className={`text-sm font-medium ${stats.is_running ? 'text-green-400' : 'text-gray-400'
                  }`}>
                  {stats.is_running ? 'กำลังตรวจจับ' : 'ไม่ได้ทำงาน'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 border-b border-red-500/50 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📍</span>
                แผนที่ประเทศไทย
              </h2>
              <ThailandMap
                cameras={cameras}
                onProvinceClick={handleProvinceClick}
                selectedProvince={selectedCamera?.province_code}
              />
            </div>
          </div>

          {/* Camera Control Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📷</span>
                กล้องที่เลือก
              </h2>
              {selectedCamera ? (
                <CameraCard
                  camera={selectedCamera}
                  onStart={handleStartDetection}
                  onStop={handleStopDetection}
                  isDetecting={stats.is_running}
                />
              ) : (
                <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-dashed border-gray-600">
                  <p className="text-gray-400">คลิกที่จังหวัดบนแผนที่เพื่อเลือกกล้อง</p>
                </div>
              )}
            </div>

            {/* Camera List */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📋</span>
                รายการกล้องทั้งหมด
              </h2>
              <div className="space-y-3">
                {cameras.map(camera => (
                  <div
                    key={camera.id}
                    onClick={() => setSelectedCamera(camera)}
                    className={`bg-gray-800/50 rounded-lg p-4 cursor-pointer border transition-all ${selectedCamera?.id === camera.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${camera.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                        <div>
                          <p className="text-white font-medium">{camera.province_name_th}</p>
                          <p className="text-gray-500 text-sm">{camera.id}</p>
                        </div>
                      </div>
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Section */}
        <div className="mt-8">
          <Dashboard
            counts={stats.counts}
            totalCount={stats.total_count}
            isRunning={stats.is_running}
            lastUpdate={stats.last_update}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900/80 border-t border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Vehicle Counting System © 2026 | Powered by YOLO v11
          </p>
        </div>
      </footer>
    </main>
  );
}
