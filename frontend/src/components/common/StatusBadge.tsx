import { Badge } from '@/components/ui/badge';

type StatusType = 'online' | 'offline' | 'warning' | 'info' | 'success' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  showDot?: boolean;
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; defaultText: string }> = {
  online: {
    bg: 'bg-green-500/10',
    text: 'text-green-700',
    dot: 'bg-green-500',
    defaultText: 'ออนไลน์'
  },
  offline: {
    bg: 'bg-red-500/10',
    text: 'text-red-700',
    dot: 'bg-red-500',
    defaultText: 'ออฟไลน์'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-700',
    dot: 'bg-yellow-500',
    defaultText: 'คำเตือน'
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    defaultText: 'ข้อมูล'
  },
  success: {
    bg: 'bg-green-500/10',
    text: 'text-green-700',
    dot: 'bg-green-500',
    defaultText: 'สำเร็จ'
  },
  error: {
    bg: 'bg-red-500/10',
    text: 'text-red-700',
    dot: 'bg-red-500',
    defaultText: 'ผิดพลาด'
  }
};

export function StatusBadge({ status, text, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.bg} ${config.text} border-0 font-medium`}
    >
      {showDot && (
        <span className={`w-2 h-2 rounded-full ${config.dot} mr-1.5`} />
      )}
      {text || config.defaultText}
    </Badge>
  );
}
