import React, { useRef, useEffect } from 'react';
import { HistogramData } from '../types/editor';

interface HistogramViewProps {
  data: HistogramData;
  showHighlightClipping: boolean;
  showShadowClipping: boolean;
  onToggleHighlightClipping: () => void;
  onToggleShadowClipping: () => void;
}

export const HistogramView: React.FC<HistogramViewProps> = ({
  data,
  showHighlightClipping,
  showShadowClipping,
  onToggleHighlightClipping,
  onToggleShadowClipping,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#282828';
    ctx.lineWidth = 1;

    for (let x = 64; x < 256; x += 64) {
      const px = (x / 256) * width;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const max = data.maxVal || 1;

    // Helper to draw single channel path
    const drawChannel = (arr: number[], color: string, alpha: number) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * width;
        const normalizedVal = Math.pow(arr[i] / max, 0.6); // Soft logarithmic compression for visual readability
        const y = height - normalizedVal * (height - 5);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    };

    // Draw Channels with additive blending
    ctx.globalCompositeOperation = 'screen';
    drawChannel(data.r, 'rgba(239, 68, 68, 0.85)', 0.6);   // Red
    drawChannel(data.g, 'rgba(34, 197, 94, 0.85)', 0.6);   // Green
    drawChannel(data.b, 'rgba(59, 130, 246, 0.85)', 0.6);  // Blue
    drawChannel(data.l, 'rgba(255, 255, 255, 0.4)', 0.3);  // Luminance

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }, [data]);

  return (
    <div className="relative rounded border border-[#2a2a2a] bg-[#111111] p-2">
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
          <span className="uppercase tracking-widest font-bold text-neutral-300">RGB Histogram</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Shadow Clipping Toggle */}
          <button
            onClick={onToggleShadowClipping}
            title="Toggle Shadow Clipping Warning (Blue)"
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono transition-colors cursor-pointer ${
              showShadowClipping
                ? 'bg-blue-600 text-white font-bold ring-1 ring-blue-400'
                : 'bg-[#222] text-neutral-400 hover:bg-[#2a2a2a]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${data.hasShadowClipping ? 'bg-blue-400 animate-pulse' : 'bg-neutral-600'}`} />
            Shadows
          </button>

          {/* Highlight Clipping Toggle */}
          <button
            onClick={onToggleHighlightClipping}
            title="Toggle Highlight Clipping Warning (Red)"
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono transition-colors cursor-pointer ${
              showHighlightClipping
                ? 'bg-red-600 text-white font-bold ring-1 ring-red-400'
                : 'bg-[#222] text-neutral-400 hover:bg-[#2a2a2a]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${data.hasHighlightClipping ? 'bg-red-400 animate-pulse' : 'bg-neutral-600'}`} />
            Highlights
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={256}
        height={80}
        className="w-full rounded bg-[#0a0a0a] border border-[#222] shadow-inner"
      />

      <div className="mt-1 flex justify-between text-[8px] font-mono text-neutral-500 px-0.5">
        <span>0 (Black)</span>
        <span>64</span>
        <span>128</span>
        <span>192</span>
        <span>255 (White)</span>
      </div>
    </div>
  );
};
