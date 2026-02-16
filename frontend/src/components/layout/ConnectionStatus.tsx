import { useState } from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useConnection } from '@/hooks/useConnection';
import { Button } from '@/components/ui/button';

export function ConnectionStatus() {
  const { status, statusText, statusColor, latency, retryConnection } = useConnection();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await retryConnection();
    setIsRetrying(false);
  };

  const getIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" style={{ color: statusColor }} />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" style={{ color: statusColor }} />;
      case 'unstable':
        return <AlertCircle className="w-4 h-4" style={{ color: statusColor }} />;
      default:
        return <RefreshCw className="w-4 h-4 animate-spin" style={{ color: statusColor }} />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
        style={{ 
          backgroundColor: `${statusColor}15`,
          color: statusColor 
        }}
      >
        {getIcon()}
        <span className="font-medium hidden sm:inline">{statusText}</span>
        {status === 'connected' && latency > 0 && (
          <span className="text-xs opacity-75">({latency}ms)</span>
        )}
      </div>

      {status === 'disconnected' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
          ลองใหม่
        </Button>
      )}
    </div>
  );
}
