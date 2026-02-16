import { useCamera } from '@/hooks/useCamera';
import { useStatistics } from '@/hooks/useStatistics';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/statistics/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { vehicleTypeInfo } from '@/data/mock';
import { 
  Video, 
  BarChart3, 
  Activity,
  Car,
  Bike,
  Truck,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type { VehicleType } from '@/types';

const vehicleColorMap = vehicleTypeInfo.reduce<Record<VehicleType, string>>((result, info) => {
  result[info.type] = info.color;
  return result;
}, {} as Record<VehicleType, string>);

type PageType = 'dashboard' | 'live' | 'statistics' | 'line-setup' | 'reports' | 'settings';

interface DashboardProps {
  onNavigate: (page: PageType) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { cameras, onlineCameras, offlineCameras } = useCamera();
  const { statistics } = useStatistics();

  const quickActions = [
    {
      id: 'live',
      title: 'ดูภาพสด',
      description: 'ตรวจสอบยานพาหนะแบบ Real-time',
      icon: Video,
      color: '#10b981',
      count: `${onlineCameras.length} กล้อง`
    },
    {
      id: 'statistics',
      title: 'สถิติ',
      description: 'ดูรายงานสถิติยานพาหนะ',
      icon: BarChart3,
      color: '#8b5cf6',
      count: statistics ? `${statistics.total} รายการ` : '0 รายการ'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="ภาพรวมระบบ" 
        subtitle="แดชบอร์ดสำหรับตำรวจจราจร"
      />
      
      <main className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">ยินดีต้อนรับสู่ระบบตรวจจับยานพาหนะ</h2>
          <p className="text-white/80 mb-4">
            ระบบตรวจจับและวิเคราะห์ยานพาหนะอัจฉริยะด้วย AI (YOLOv11)
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>{onlineCameras.length} กล้องออนไลน์</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>{offlineCameras.length} กล้องออฟไลน์</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>ระบบทำงานปกติ</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="ยานพาหนะทั้งหมด"
              value={statistics.total.toLocaleString()}
              icon={Activity}
              color="#3b82f6"
            />
            <StatCard
              title="รถเก๋ง(ซีดาน)"
              value={statistics.byType.sedan?.toLocaleString() || '0'}
              subtitle={`${statistics.total ? ((statistics.byType.sedan ?? 0) / statistics.total * 100).toFixed(1) : '0.0'}%`}
              icon={Car}
              color={vehicleColorMap.sedan}
            />
            <StatCard
              title="รถเก๋ง(แฮทช์แบ็ก)"
              value={statistics.byType.hatchback?.toLocaleString() || '0'}
              subtitle={`${statistics.total ? ((statistics.byType.hatchback ?? 0) / statistics.total * 100).toFixed(1) : '0.0'}%`}
              icon={Car}
              color={vehicleColorMap.hatchback}
            />
            <StatCard
              title="รถจักรยานยนต์"
              value={statistics.byType.motorcycle?.toLocaleString() || '0'}
              subtitle={`${statistics.total ? ((statistics.byType.motorcycle ?? 0) / statistics.total * 100).toFixed(1) : '0.0'}%`}
              icon={Bike}
              color={vehicleColorMap.motorcycle}
            />
            <StatCard
              title="รถกระบะ"
              value={statistics.byType.pickup?.toLocaleString() || '0'}
              subtitle={`${statistics.total ? ((statistics.byType.pickup ?? 0) / statistics.total * 100).toFixed(1) : '0.0'}%`}
              icon={Truck}
              color={vehicleColorMap.pickup}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onNavigate(action.id as PageType)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${action.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: action.color }} />
                    </div>
                    <Badge variant="secondary">{action.count}</Badge>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                  <p className="text-sm text-gray-500 mb-4">{action.description}</p>
                  <Button variant="ghost" className="p-0 h-auto text-sm" style={{ color: action.color }}>
                    ไปที่หน้านี้
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะระบบ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Video className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">กล้องทั้งหมด</p>
                <p className="text-2xl font-bold">{cameras.length}</p>
                <p className="text-sm text-green-600">{onlineCameras.length} ออนไลน์</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">การตรวจจับวันนี้</p>
                <p className="text-2xl font-bold">{statistics?.total || 0}</p>
                <p className="text-sm text-blue-600">ความแม่นยำ {statistics?.accuracy || 0}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ข้อมูลในฐานข้อมูล</p>
                <p className="text-2xl font-bold">พร้อมใช้งาน</p>
                <p className="text-sm text-purple-600">MySQL Connected</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
