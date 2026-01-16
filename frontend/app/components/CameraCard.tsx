'use client';

import React from 'react';

interface Camera {
    id: string;
    province_code: string;
    province_name: string;
    province_name_th: string;
    status: string;
    rtsp_url?: string;
}

interface CameraCardProps {
    camera: Camera;
    onStart?: (cameraId: string) => void;
    onStop?: () => void;
    isDetecting?: boolean;
}

export default function CameraCard({ camera, onStart, onStop, isDetecting }: CameraCardProps) {
    const isActive = camera.status === 'active';

    return (
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700 shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 status-pulse' : 'bg-gray-500'}`} />
                    <div>
                        <h3 className="text-white font-bold text-lg">{camera.province_name_th}</h3>
                        <p className="text-gray-400 text-sm">{camera.province_name} ({camera.province_code})</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                    {isActive ? 'กำลังทำงาน' : 'ไม่ทำงาน'}
                </span>
            </div>

            {/* Camera ID */}
            <div className="mb-4">
                <p className="text-gray-500 text-xs mb-1">Camera ID</p>
                <p className="text-gray-300 font-mono text-sm">{camera.id}</p>
            </div>

            {/* RTSP URL (masked) */}
            {camera.rtsp_url && (
                <div className="mb-4">
                    <p className="text-gray-500 text-xs mb-1">RTSP URL</p>
                    <p className="text-gray-300 font-mono text-xs truncate bg-gray-900/50 px-2 py-1 rounded">
                        {camera.rtsp_url.replace(/\/\/.*@/, '//***@')}
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                {!isDetecting ? (
                    <button
                        onClick={() => onStart?.(camera.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        เริ่มตรวจจับ
                    </button>
                ) : (
                    <button
                        onClick={() => onStop?.()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                        หยุดตรวจจับ
                    </button>
                )}
            </div>
        </div>
    );
}
