import { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import type { VehicleType } from '@/types';
import { Play, Pause, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VideoPlayerProps {
  cameraId: string;
  cameraName: string;
  isStreaming: boolean;
  fps: number;
  streamUrl?: string;
  frameSrc?: string | null;
  liveCounts?: Record<string, number>;
  liveDetections: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: VehicleType;
    confidence: number;
    label: string;
  }>;
  onToggleStream: () => void;
}

export function VideoPlayer({
  cameraId,
  cameraName,
  isStreaming,
  fps,
  streamUrl,
  frameSrc,
  liveCounts,
  liveDetections,
  onToggleStream,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hlsRef = useRef<Hls | null>(null);

  // Initialize HLS (for background live view when detection is NOT running)
  useEffect(() => {
    // If we have frameSrc from detection, don't need HLS
    if (frameSrc) return;

    const video = videoRef.current;
    if (!video || !streamUrl) return;

    const playVideo = () => {
      video.play().catch((e) => console.warn('play() blocked:', e));
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      playVideo();
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 3,
        liveDurationInfinity: true,
        highBufferWatchdogPeriod: 1,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 15000,
        fragLoadingTimeOut: 25000,
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => playVideo());

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
  }, [streamUrl, frameSrc]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Determine whether to show annotated frame from backend or HLS video
  const showAnnotatedFrame = isStreaming && !!frameSrc;

  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden"
    >
      {/* HLS Video (shown when detection is NOT running) */}
      <video
        ref={videoRef}
        className={`w-full aspect-video ${showAnnotatedFrame ? 'hidden' : 'block'}`}
        muted
        playsInline
        autoPlay
        controls={false}
      />

      {/* Annotated frame from backend YOLO (shown when detection IS running) */}
      {showAnnotatedFrame && (
        <img
          src={frameSrc!}
          alt="Detection preview"
          className="w-full aspect-video object-contain"
        />
      )}

      {/* Overlay Controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">{cameraName}</h3>
              <p className="text-white/70 text-sm">{cameraId}</p>
            </div>
            <div className="flex items-center gap-2">
              {isStreaming && (
                <Badge variant="outline" className="bg-black/50 text-white border-white/30">
                  {fps} FPS
                </Badge>
              )}
              {isStreaming && (
                <Badge className="bg-red-500 animate-pulse">DETECTING</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Live Counts Overlay */}
        {isStreaming && liveCounts && Object.keys(liveCounts).length > 0 && (
          <div className="absolute top-16 right-4 bg-black/80 rounded-lg p-3 pointer-events-auto">
            <h4 className="text-white text-xs font-bold mb-2 uppercase tracking-wider">นับยานพาหนะ</h4>
            {Object.entries(liveCounts).sort(([,a],[,b]) => b - a).map(([cls, count]) => (
              <div key={cls} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-white/80">{cls}</span>
                <span className="text-yellow-400 font-bold">{count}</span>
              </div>
            ))}
            <div className="border-t border-white/20 mt-1 pt-1 flex items-center justify-between">
              <span className="text-white/80 text-sm">รวม</span>
              <span className="text-green-400 font-bold text-sm">
                {Object.values(liveCounts).reduce((a, b) => a + b, 0)}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onToggleStream}
              >
                {isStreaming ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <span className="text-white text-sm">
                {isStreaming ? 'กำลังตรวจจับ' : 'กดเล่นเพื่อเริ่มตรวจจับ'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Detection Count */}
        {isStreaming && liveDetections.length > 0 && (
          <div className="absolute top-16 left-4 bg-black/70 rounded-lg p-3">
            <p className="text-white text-sm">
              ตรวจพบ: <span className="font-bold text-yellow-400">{liveDetections.length}</span> คัน
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
