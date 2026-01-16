'use client';

import React from 'react';
import VehicleStats from './VehicleStats';

interface DashboardProps {
  counts: Record<string, number>;
  totalCount: number;
  isRunning: boolean;
  lastUpdate: string | null;
}

export default function Dashboard({ counts, totalCount, isRunning, lastUpdate }: DashboardProps) {
  return (
    <section className="dashboard-dark bg-gray-900/40 border border-gray-800 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📊</span>
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <span className="text-sm text-gray-400">อัพเดทแบบ Real-time</span>
      </div>
      <VehicleStats
        counts={counts}
        totalCount={totalCount}
        isRunning={isRunning}
        lastUpdate={lastUpdate}
      />
    </section>
  );
}
