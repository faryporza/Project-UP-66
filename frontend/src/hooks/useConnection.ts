import { useState, useEffect, useCallback } from 'react';
import type { ConnectionStatus } from '@/types';

export function useConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastPing, setLastPing] = useState<number>(Date.now());
  const [latency, setLatency] = useState<number>(0);

  // Check connection status
  const checkConnection = useCallback(async () => {
    try {
      const start = Date.now();
      // Simulate ping
      await new Promise(resolve => setTimeout(resolve, 100));
      const ping = Date.now() - start;
      
      setLatency(ping);
      setLastPing(Date.now());
      
      if (ping > 500) {
        setStatus('unstable');
      } else {
        setStatus('connected');
      }
      
      return true;
    } catch (err) {
      setStatus('disconnected');
      return false;
    }
  }, []);

  // Retry connection
  const retryConnection = useCallback(async () => {
    setStatus('connecting');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return checkConnection();
  }, [checkConnection]);

  // Monitor connection
  useEffect(() => {
    checkConnection();
    
    const interval = setInterval(() => {
      checkConnection();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkConnection]);

  // Watch for offline events
  useEffect(() => {
    const handleOffline = () => {
      setStatus('disconnected');
    };

    const handleOnline = () => {
      checkConnection();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkConnection]);

  const statusText = {
    connected: 'เชื่อมต่อปกติ',
    disconnected: 'ตัดการเชื่อมต่อ',
    connecting: 'กำลังเชื่อมต่อ...',
    unstable: 'เชื่อมต่อไม่เสถียร'
  };

  const statusColor = {
    connected: '#10b981',
    disconnected: '#ef4444',
    connecting: '#3b82f6',
    unstable: '#f59e0b'
  };

  return {
    status,
    statusText: statusText[status],
    statusColor: statusColor[status],
    latency,
    lastPing,
    checkConnection,
    retryConnection
  };
}
