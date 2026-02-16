import { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import type { TimeRangeData, VehicleType } from '@/types';
import { vehicleTypeInfo } from '@/data/mock';

interface ChartsProps {
  timeRangeData: TimeRangeData[];
  byTypeData: Array<{ type: string; count: number; percentage: string }>;
  byCameraData: Array<{ cameraId: string; count: number }>;
}

const TYPE_META = vehicleTypeInfo.reduce<Record<VehicleType, { label: string; color: string }>>(
  (result, info) => {
    result[info.type] = { label: info.label, color: info.color };
    return result;
  },
  {} as Record<VehicleType, { label: string; color: string }>
);

export function Charts({ timeRangeData, byTypeData, byCameraData }: ChartsProps) {
  const [timeChartType, setTimeChartType] = useState<'line' | 'bar'>('line');

  // Transform time range data for stacked chart
  const stackedData = timeRangeData.map(d => {
    const row: Record<string, number | string> = { time: d.time };
    vehicleTypeInfo.forEach((info) => {
      row[info.label] = d.byType[info.type] || 0;
    });
    return row;
  });

  // Transform type data for pie chart
  const pieData = byTypeData.map(d => ({
    name: TYPE_META[d.type as VehicleType]?.label || d.type,
    value: d.count,
    color: TYPE_META[d.type as VehicleType]?.color || '#6b7280'
  }));

  return (
    <div className="space-y-6">
      {/* Time Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">จำนวนยานพาหนะตามช่วงเวลา</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeChartType('line')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeChartType === 'line' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              เส้น
            </button>
            <button
              onClick={() => setTimeChartType('bar')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeChartType === 'bar' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              แท่ง
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          {timeChartType === 'line' ? (
            <AreaChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {vehicleTypeInfo.map((info) => (
                <Area
                  key={info.type}
                  type="monotone"
                  dataKey={info.label}
                  stroke={info.color}
                  fill={`${info.color}22`}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {vehicleTypeInfo.map((info) => (
                <Bar
                  key={info.type}
                  dataKey={info.label}
                  stackId="a"
                  fill={info.color}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - By Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">สัดส่วนตามประเภท</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - By Camera */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">จำนวนตามกล้อง</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byCameraData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="cameraId" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
