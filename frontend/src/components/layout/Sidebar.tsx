import { useState } from 'react';
import { 
  LayoutDashboard, 
  Video, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Shield,
  PenLine
} from 'lucide-react';
type PageType = 'dashboard' | 'live' | 'statistics' | 'line-setup' | 'reports' | 'settings' | 'logout';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: PageType) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'live', label: 'ดูภาพสด', icon: Video },
    { id: 'line-setup', label: 'ตั้งเส้นนับ', icon: PenLine },
    { id: 'statistics', label: 'สถิติ', icon: BarChart3 },
  ];

  const bottomItems = [
    { id: 'logout', label: 'ออกจากระบบ', icon: LogOut },
  ];

  const handleClick = (id: string) => {
    onPageChange(id as PageType);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky lg:top-0 inset-y-0 left-0 z-40
        w-[280px] h-screen bg-[#1e3a5f] text-white
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col shrink-0
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">ระบบตรวจจับฯ</h1>
              <p className="text-xs text-white/60">Vehicle Detection AI</p>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/60'}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-white/10 space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  text-white/70 hover:bg-white/10 hover:text-white
                  transition-all duration-200"
              >
                <Icon className="w-5 h-5 text-white/60" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="font-semibold text-sm">ตร.</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">ตำรวจจราจร</p>
              <p className="text-xs text-white/60 truncate">สน.ลาดพร้าว</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
