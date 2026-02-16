import { useState } from 'react';
import { useStatistics } from '@/hooks/useStatistics';
import { useCamera } from '@/hooks/useCamera';
import { StatCard } from '@/components/statistics/StatCard';
import { Charts } from '@/components/statistics/Charts';
import { DataTable } from '@/components/statistics/DataTable';
import { Header } from '@/components/layout/Header';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { vehicleTypeInfo } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Car, 
  Bike, 
  Truck, 
  Bus,
  Activity, 
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Database
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { VehicleType } from '@/types';

const vehicleLabelMap = vehicleTypeInfo.reduce<Record<VehicleType, string>>((result, info) => {
  result[info.type] = info.label;
  return result;
}, {} as Record<VehicleType, string>);

const vehicleColorMap = vehicleTypeInfo.reduce<Record<VehicleType, string>>((result, info) => {
  result[info.type] = info.color;
  return result;
}, {} as Record<VehicleType, string>);

const iconMap: Record<string, LucideIcon> = {
  Car, Truck, Bike, Van: Truck, Bus,
};
const getVehicleIcon = (type: VehicleType): LucideIcon => {
  const info = vehicleTypeInfo.find((v) => v.type === type);
  return (info && iconMap[info.icon]) || Car;
};

export function Statistics() {
  const { cameras } = useCamera();
  const {
    statistics,
    timeRangeData,
    detections,
    loading,
    error,
    dbConnected,
    filter,
    fetchStatistics,
    updateFilter,
    exportData,
    getTypeSummary,
    getCameraSummary
  } = useStatistics();

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(filter.startDate),
    to: new Date(filter.endDate)
  });

  const handleDateChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    if (range.from) {
      updateFilter({ startDate: format(range.from, 'yyyy-MM-dd') });
    }
    if (range.to) {
      updateFilter({ endDate: format(range.to, 'yyyy-MM-dd') });
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    await exportData(format);
  };

  const typeSummary = getTypeSummary();
  const cameraSummary = getCameraSummary();

  if (!dbConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="สถิติ" subtitle="รายงานสถิติยานพาหนะ" />
        <main className="p-6">
          <ErrorMessage
            title="ไม่สามารถเชื่อมต่อฐานข้อมูลได้"
            message="ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง"
            onRetry={fetchStatistics}
          />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="สถิติ" subtitle="รายงานสถิติยานพาหนะ" />
        <main className="p-6">
          <ErrorMessage
            title="ไม่สามารถโหลดข้อมูลได้"
            message={error}
            onRetry={fetchStatistics}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="สถิติ" subtitle="รายงานสถิติยานพาหนะ" />
      
      <main className="p-6 space-y-6">
        {/* Database Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">สถานะฐานข้อมูล:</span>
            <Badge variant={dbConnected ? 'default' : 'destructive'} className={dbConnected ? 'bg-green-500' : ''}>
              {dbConnected ? 'เชื่อมต่อ' : 'ตัดการเชื่อมต่อ'}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchStatistics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Date Range */}
            <div className="flex-1">
              <label className="text-sm text-gray-500 block mb-1">ช่วงวันที่</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd MMM yyyy', { locale: th })} -{' '}
                          {format(dateRange.to, 'dd MMM yyyy', { locale: th })}
                        </>
                      ) : (
                        format(dateRange.from, 'dd MMM yyyy', { locale: th })
                      )
                    ) : (
                      'เลือกช่วงวันที่'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={handleDateChange as any}
                    numberOfMonths={2}
                    required={false}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Camera Filter */}
            <div className="flex-1">
              <label className="text-sm text-gray-500 block mb-1">กล้อง</label>
              <Select
                value={filter.cameras[0] || 'all'}
                onValueChange={(value) => updateFilter({ 
                  cameras: value === 'all' ? [] : [value] 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทุกกล้อง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกกล้อง</SelectItem>
                  {cameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      {camera.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export */}
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="ยานพาหนะทั้งหมด"
              value={statistics.total.toLocaleString()}
              subtitle={`ความแม่นยำเฉลี่ย ${statistics.accuracy}%`}
              icon={Activity}
              color="#3b82f6"
            />
            {Object.entries(statistics.byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const vType = type as VehicleType;
                return (
                  <StatCard
                    key={type}
                    title={vehicleLabelMap[vType] || type}
                    value={count.toLocaleString()}
                    subtitle={`${statistics.total ? ((count / statistics.total) * 100).toFixed(1) : '0.0'}%`}
                    icon={getVehicleIcon(vType)}
                    color={vehicleColorMap[vType] || '#6b7280'}
                  />
                );
              })}
          </div>
        )}

        {/* Charts */}
        {statistics && (
          <Charts
            timeRangeData={timeRangeData}
            byTypeData={typeSummary}
            byCameraData={cameraSummary}
          />
        )}

        {/* Data Table */}
        <DataTable
          detections={detections}
          getVehicleLabel={(type) => {
            return vehicleLabelMap[type as VehicleType] || type;
          }}
          getVehicleColor={(type) => {
            return vehicleColorMap[type as VehicleType] || '#6b7280';
          }}
          loading={loading}
        />
      </main>
    </div>
  );
}
