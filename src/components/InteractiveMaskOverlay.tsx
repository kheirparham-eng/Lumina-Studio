import React, { useState } from 'react';
import { MaskState } from '../types/editor';

interface InteractiveMaskOverlayProps {
  mask: MaskState;
  onChange: (newMask: MaskState) => void;
  width: number;
  height: number;
}

type DragMode = 'none' | 'radial-center' | 'radial-radiusX' | 'radial-radiusY' | 'linear-start' | 'linear-end';

export const InteractiveMaskOverlay: React.FC<InteractiveMaskOverlayProps> = ({
  mask,
  onChange,
  width,
  height,
}) => {
  const [dragMode, setDragMode] = useState<DragMode>('none');

  if (mask.type === 'none') return null;

  const handlePointerDown = (mode: DragMode, e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragMode(mode);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === 'none') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (dragMode === 'radial-center') {
      onChange({
        ...mask,
        centerX: relX,
        centerY: relY,
      });
    } else if (dragMode === 'radial-radiusX') {
      const rx = Math.max(0.05, Math.min(0.8, Math.abs(relX - mask.centerX)));
      onChange({
        ...mask,
        radiusX: rx,
      });
    } else if (dragMode === 'radial-radiusY') {
      const ry = Math.max(0.05, Math.min(0.8, Math.abs(relY - mask.centerY)));
      onChange({
        ...mask,
        radiusY: ry,
      });
    } else if (dragMode === 'linear-start') {
      onChange({
        ...mask,
        startX: relX,
        startY: relY,
      });
    } else if (dragMode === 'linear-end') {
      onChange({
        ...mask,
        endX: relX,
        endY: relY,
      });
    }
  };

  const handlePointerUp = () => {
    setDragMode('none');
  };

  const cx = mask.centerX * width;
  const cy = mask.centerY * height;
  const rx = mask.radiusX * width;
  const ry = mask.radiusY * height;

  const sx = mask.startX * width;
  const sy = mask.startY * height;
  const ex = mask.endX * width;
  const ey = mask.endY * height;

  return (
    <div className="absolute inset-0 pointer-events-auto z-20">
      <svg
        width={width}
        height={height}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="h-full w-full touch-none select-none"
      >
        {mask.type === 'radial' && (
          <g>
            {/* Outer Feather Guide Circle */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx * (1 + (mask.feather / 100) * 0.4)}
              ry={ry * (1 + (mask.feather / 100) * 0.4)}
              fill="rgba(168, 85, 247, 0.05)"
              stroke="rgba(168, 85, 247, 0.35)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Main Ellipse Bounds */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="rgba(168, 85, 247, 0.12)"
              stroke="#c084fc"
              strokeWidth="2"
              className="drop-shadow-md"
            />

            {/* Radial Center Handle */}
            <circle
              cx={cx}
              cy={cy}
              r={9}
              fill="#9333ea"
              stroke="#ffffff"
              strokeWidth="2.5"
              onPointerDown={(e) => handlePointerDown('radial-center', e)}
              className="cursor-move hover:scale-125 transition-transform"
            />

            {/* Radius X Handle (Right) */}
            <circle
              cx={cx + rx}
              cy={cy}
              r={7}
              fill="#c084fc"
              stroke="#ffffff"
              strokeWidth="2"
              onPointerDown={(e) => handlePointerDown('radial-radiusX', e)}
              className="cursor-ew-resize hover:scale-125 transition-transform"
            />

            {/* Radius Y Handle (Bottom) */}
            <circle
              cx={cx}
              cy={cy + ry}
              r={7}
              fill="#c084fc"
              stroke="#ffffff"
              strokeWidth="2"
              onPointerDown={(e) => handlePointerDown('radial-radiusY', e)}
              className="cursor-ns-resize hover:scale-125 transition-transform"
            />
          </g>
        )}

        {mask.type === 'linear' && (
          <g>
            {/* Gradient Line vector */}
            <line
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              className="drop-shadow-md"
            />

            {/* Midpoint Perpendicular Guide Line */}
            {(() => {
              const mx = (sx + ex) / 2;
              const my = (sy + ey) / 2;
              const dx = ex - sx;
              const dy = ey - sy;
              const len = Math.hypot(dx, dy) || 1;
              const nx = (-dy / len) * 80;
              const ny = (dx / len) * 80;

              return (
                <line
                  x1={mx - nx}
                  y1={my - ny}
                  x2={mx + nx}
                  y2={my + ny}
                  stroke="rgba(34, 211, 238, 0.7)"
                  strokeWidth="2"
                />
              );
            })()}

            {/* Start Handle Dot */}
            <circle
              cx={sx}
              cy={sy}
              r={9}
              fill="#0891b2"
              stroke="#ffffff"
              strokeWidth="2.5"
              onPointerDown={(e) => handlePointerDown('linear-start', e)}
              className="cursor-move hover:scale-125 transition-transform"
            />

            {/* End Handle Dot */}
            <circle
              cx={ex}
              cy={ey}
              r={9}
              fill="#22d3ee"
              stroke="#ffffff"
              strokeWidth="2.5"
              onPointerDown={(e) => handlePointerDown('linear-end', e)}
              className="cursor-move hover:scale-125 transition-transform"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
