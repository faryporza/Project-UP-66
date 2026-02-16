import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { LiveMonitor } from '@/pages/LiveMonitor';
import { Statistics } from '@/pages/Statistics';
import { LineSetup } from '@/pages/LineSetup';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

type PageType = 'dashboard' | 'live' | 'statistics' | 'line-setup' | 'reports' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  const handlePageChange = (page: PageType | 'logout') => {
    if (page === 'logout') {
      // Handle logout
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'live':
        return <LiveMonitor />;
      case 'statistics':
        return <Statistics />;
      case 'line-setup':
        return <LineSetup />;
      case 'reports':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">รายงาน</h2>
              <p className="text-gray-500">ฟีเจอร์นี้กำลังอยู่ในระหว่างการพัฒนา</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ตั้งค่า</h2>
              <p className="text-gray-500">ฟีเจอร์นี้กำลังอยู่ในระหว่างการพัฒนา</p>
            </div>
          </div>
        );
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <main className="flex-1 lg:ml-0">
        {renderPage()}
      </main>
      <Toaster />
    </div>
  );
}

export default App;
