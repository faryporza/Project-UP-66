'use client';

import React from 'react';

interface VehicleCounts {
    [key: string]: number;
}

interface VehicleStatsProps {
    counts: VehicleCounts;
    totalCount: number;
    isRunning: boolean;
    lastUpdate: string | null;
}

const VEHICLE_INFO: Record<string, { name: string; icon: string; color: string }> = {
    ambulance: { name: 'รถพยาบาล', icon: '🚑', color: 'bg-red-500' },
    boxtruck: { name: 'รถบรรทุกกล่อง', icon: '📦', color: 'bg-amber-600' },
    bus: { name: 'รถบัส', icon: '🚌', color: 'bg-yellow-500' },
    e_tan: { name: 'อีแต๋น', icon: '🚜', color: 'bg-lime-600' },
    hatchback: { name: 'รถแฮทช์แบ็ก', icon: '🚗', color: 'bg-blue-500' },
    jeep: { name: 'รถจี๊ป', icon: '🚙', color: 'bg-green-600' },
    mini_truck: { name: 'รถกระบะเล็ก', icon: '🛻', color: 'bg-orange-500' },
    motorcycle: { name: 'รถจักรยานยนต์', icon: '🏍️', color: 'bg-purple-500' },
    pickup: { name: 'รถกระบะ', icon: '🛻', color: 'bg-teal-500' },
    saleng: { name: 'ซาเล้ง', icon: '🛺', color: 'bg-pink-500' },
    sedan: { name: 'รถเก๋ง', icon: '🚘', color: 'bg-indigo-500' },
    songthaew: { name: 'รถสองแถว', icon: '🚐', color: 'bg-cyan-500' },
    supercar: { name: 'ซุปเปอร์คาร์', icon: '🏎️', color: 'bg-rose-500' },
    suv: { name: 'รถ SUV', icon: '🚙', color: 'bg-emerald-500' },
    taxi: { name: 'รถแท็กซี่', icon: '🚕', color: 'bg-yellow-400' },
    truck: { name: 'รถบรรทุก', icon: '🚚', color: 'bg-slate-600' },
    tuktuk: { name: 'รถตุ๊กตุ๊ก', icon: '🛺', color: 'bg-fuchsia-500' },
    van: { name: 'รถตู้', icon: '🚐', color: 'bg-sky-500' },
};

export default function VehicleStats({ counts, totalCount, isRunning, lastUpdate }: VehicleStatsProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Sort by count descending
    const sortedVehicles = Object.entries(counts)
        .sort(([, a], [, b]) => b - a);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Count */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200 text-sm font-medium">จำนวนรถทั้งหมด</p>
                            <p className="text-4xl font-bold mt-1">{totalCount.toLocaleString()}</p>
                        </div>
                        <div className="text-5xl opacity-80">🚗</div>
                    </div>
                </div>

                {/* Status */}
                <div className={`rounded-xl p-6 text-white shadow-lg ${isRunning
                        ? 'bg-gradient-to-br from-green-600 to-green-800'
                        : 'bg-gradient-to-br from-gray-600 to-gray-800'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-200 text-sm font-medium">สถานะการตรวจจับ</p>
                            <p className="text-2xl font-bold mt-1">
                                {isRunning ? 'กำลังทำงาน' : 'หยุดทำงาน'}
                            </p>
                        </div>
                        <div className={`w-4 h-4 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                    </div>
                </div>

                {/* Last Update */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-200 text-sm font-medium">อัพเดทล่าสุด</p>
                            <p className="text-lg font-bold mt-1">{formatDate(lastUpdate)}</p>
                        </div>
                        <div className="text-3xl opacity-80">📊</div>
                    </div>
                </div>
            </div>

            {/* Vehicle Type Cards */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">จำนวนรถแยกตามประเภท</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {sortedVehicles.map(([type, count]) => {
                        const info = VEHICLE_INFO[type] || { name: type, icon: '🚗', color: 'bg-gray-500' };
                        return (
                            <div
                                key={type}
                                className={`${info.color} rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-transform duration-200`}
                            >
                                <div className="text-3xl mb-2">{info.icon}</div>
                                <p className="text-sm font-medium opacity-90 truncate">{info.name}</p>
                                <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
