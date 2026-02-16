import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export type LineCanvasProps = {
  apiBase?: string;
  cameraId: string;
  lineIdDefault?: string;
  width?: number;
  height?: number;
  backgroundImageUrl?: string;
};

type CanvasPoint = { x: number; y: number };

type SaveStatus = 'idle' | 'saving' | 'ok' | 'error';

const defaultCanvasWidth = 1280;
const defaultCanvasHeight = 720;
const defaultApiBase = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8000';

export function LineCanvas({
  apiBase = defaultApiBase,
  cameraId,
  lineIdDefault = 'line_001',
  width = defaultCanvasWidth,
  height = defaultCanvasHeight,
  backgroundImageUrl = ''
}: LineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [lineId, setLineId] = useState(lineIdDefault);
  const [p1, setP1] = useState<CanvasPoint | null>(null);
  const [p2, setP2] = useState<CanvasPoint | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLineId(lineIdDefault);
  }, [lineIdDefault]);

  const bgImg = useMemo(() => {
    if (!backgroundImageUrl) return null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = backgroundImageUrl;
    return img;
  }, [backgroundImageUrl]);

  const getCanvasPoint = (evt: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((evt.clientX - rect.left) * scaleX);
    const y = Math.round((evt.clientY - rect.top) * scaleY);

    return {
      x: Math.max(0, Math.min(canvas.width - 1, x)),
      y: Math.max(0, Math.min(canvas.height - 1, y))
    };
  };

  const reset = () => {
    setP1(null);
    setP2(null);
    setStatus('idle');
    setMsg('');
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImg && bgImg.complete) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Click 2 points to set counting line (P1 then P2).', 16, 28);

    const drawPoint = (pt: CanvasPoint, label: string) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.fillText(`${label} (${pt.x}, ${pt.y})`, pt.x + 10, pt.y - 10);
    };

    if (p1) drawPoint(p1, 'P1');
    if (p2) drawPoint(p2, 'P2');

    if (p1 && p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (!bgImg) return;
    const handleLoad = () => draw();
    bgImg.addEventListener('load', handleLoad);
    return () => bgImg.removeEventListener('load', handleLoad);
  }, [bgImg]);

  useEffect(() => {
    draw();
  }, [p1, p2, width, height, backgroundImageUrl]);

  const onCanvasClick = (evt: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const pt = getCanvasPoint(evt);
    if (!p1) {
      setP1(pt);
      return;
    }
    if (!p2) {
      setP2(pt);
      return;
    }
    setP1(pt);
    setP2(null);
  };

  const saveLine = async () => {
    if (!p1 || !p2) {
      setStatus('error');
      setMsg('ต้องเลือก 2 จุดก่อน (P1 และ P2)');
      return;
    }
    if (!cameraId.trim() || !lineId.trim()) {
      setStatus('error');
      setMsg('ต้องมี camera_id และ line_id');
      return;
    }

    setStatus('saving');
    setMsg('');

    const payload = {
      line_id: lineId,
      camera_id: cameraId,
      p1,
      p2,
      is_active: isActive,
      canvas_w: width,
      canvas_h: height
    };

    try {
      const res = await fetch(`${apiBase}/lines`, {
        method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'ngrok-skip-browser-warning': 'true'
         },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || `HTTP ${res.status}`);
      }

      setStatus('ok');
      setMsg(`บันทึกเส้นสำเร็จ: ${data.line_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setStatus('error');
      setMsg(`บันทึกไม่สำเร็จ: ${message}`);
    }
  };

  return (
    <div className="grid gap-4 max-w-5xl">
      <div className="flex flex-wrap items-end gap-4">
        <label className="grid gap-1.5 text-sm">
          <span className="text-gray-600">camera_id</span>
          <Input value={cameraId} disabled className="min-w-60" />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="text-gray-600">line_id</span>
          <Input value={lineId} onChange={(e) => setLineId(e.target.value)} className="min-w-60" />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
          <Checkbox checked={isActive} onCheckedChange={(value) => setIsActive(value === true)} />
          <span>is_active</span>
        </label>

        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>

        <Button onClick={saveLine} className="bg-green-600 hover:bg-green-700">
          Save (POST /lines)
        </Button>
      </div>

      <div className="text-sm text-gray-500">
        {p1 ? `P1: (${p1.x}, ${p1.y})` : 'P1: -'} | {p2 ? `P2: (${p2.x}, ${p2.y})` : 'P2: -'}
      </div>

      <div className="rounded-xl border border-gray-300 overflow-hidden bg-gray-900">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={onCanvasClick}
          className="w-full max-w-full cursor-crosshair"
        />
      </div>

      {status !== 'idle' && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm text-white ${
            status === 'ok'
              ? 'border-emerald-700 bg-emerald-950'
              : status === 'error'
                ? 'border-red-700 bg-red-950'
                : 'border-gray-700 bg-gray-900'
          }`}
        >
          {status === 'saving' ? 'กำลังบันทึก...' : msg}
        </div>
      )}
    </div>
  );
}
