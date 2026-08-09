import React, { useState, useRef } from 'react';
import { ToneCurveState, CurvePoint } from '../types/editor';

interface ToneCurvePanelProps {
  toneCurve: ToneCurveState;
  onChange: (state: ToneCurveState) => void;
}

type ChannelKey = 'master' | 'red' | 'green' | 'blue';

// Compute Monotone Cubic Spline SVG path matching WebGL spline LUT
function getSmoothSplinePath(points: CurvePoint[], width = 200, height = 200): string {
  if (!points || points.length === 0) return '';
  const pts = [...points].sort((a, b) => a.x - b.x);

  const mapPoint = (p: CurvePoint) => ({
    x: (p.x / 255) * width,
    y: height - (p.y / 255) * height,
  });

  const mapped = pts.map(mapPoint);
  const n = mapped.length;

  if (n === 1) return `M ${mapped[0].x},${mapped[0].y}`;
  if (n === 2) return `M ${mapped[0].x},${mapped[0].y} L ${mapped[1].x},${mapped[1].y}`;

  const dx: number[] = [];
  const dy: number[] = [];
  const ms: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx[i] = mapped[i + 1].x - mapped[i].x;
    dy[i] = mapped[i + 1].y - mapped[i].y;
    ms[i] = dx[i] === 0 ? 0 : dy[i] / dx[i];
  }

  const tangents: number[] = [ms[0]];
  for (let i = 0; i < n - 2; i++) {
    const m0 = ms[i];
    const m1 = ms[i + 1];
    if (m0 * m1 <= 0) {
      tangents.push(0);
    } else {
      const commonDx = dx[i] + dx[i + 1];
      tangents.push((3 * commonDx) / ((commonDx + dx[i + 1]) / m0 + (commonDx + dx[i]) / m1));
    }
  }
  tangents.push(ms[ms.length - 1]);

  let d = `M ${mapped[0].x.toFixed(1)},${mapped[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i];
    if (h === 0) {
      d += ` L ${mapped[i + 1].x.toFixed(1)},${mapped[i + 1].y.toFixed(1)}`;
      continue;
    }
    const cp1x = mapped[i].x + h / 3;
    const cp1y = Math.min(height, Math.max(0, mapped[i].y + (tangents[i] * h) / 3));
    const cp2x = mapped[i + 1].x - h / 3;
    const cp2y = Math.min(height, Math.max(0, mapped[i + 1].y - (tangents[i + 1] * h) / 3));

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${mapped[i + 1].x.toFixed(1)},${mapped[i + 1].y.toFixed(1)}`;
  }

  return d;
}

export const ToneCurvePanel: React.FC<ToneCurvePanelProps> = ({ toneCurve, onChange }) => {
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('master');
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = toneCurve[activeChannel] || [{ x: 0, y: 0 }, { x: 255, y: 255 }];

  const handleChannelSelect = (ch: ChannelKey) => {
    setActiveChannel(ch);
  };

  const handlePointerDownPoint = (index: number, e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggedPointIndex(index);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggedPointIndex === null || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(255, Math.round(((e.clientX - rect.left) / rect.width) * 255)));
    const ny = Math.max(0, Math.min(255, Math.round((1 - (e.clientY - rect.top) / rect.height) * 255)));

    const newPoints = [...points];

    if (draggedPointIndex === 0) {
      newPoints[0] = { x: 0, y: ny };
    } else if (draggedPointIndex === points.length - 1) {
      newPoints[points.length - 1] = { x: 255, y: ny };
    } else {
      const prevX = points[draggedPointIndex - 1].x + 2;
      const nextX = points[draggedPointIndex + 1].x - 2;
      const clampedX = Math.max(prevX, Math.min(nextX, nx));
      newPoints[draggedPointIndex] = { x: clampedX, y: ny };
    }

    onChange({
      ...toneCurve,
      [activeChannel]: newPoints,
    });
  };

  const handlePointerUp = () => {
    setDraggedPointIndex(null);
  };

  const handlePointContextMenu = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (points.length <= 2) return;
    if (index === 0 || index === points.length - 1) return;
    const newPoints = points.filter((_, i) => i !== index);
    onChange({
      ...toneCurve,
      [activeChannel]: newPoints,
    });
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (draggedPointIndex !== null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = Math.max(0, Math.min(255, Math.round(((e.clientX - rect.left) / rect.width) * 255)));
    const cy = Math.max(0, Math.min(255, Math.round((1 - (e.clientY - rect.top) / rect.height) * 255)));

    const near = points.some((p) => Math.hypot(p.x - cx, p.y - cy) < 15);
    if (near) return;

    const newPoints = [...points, { x: cx, y: cy }].sort((a, b) => a.x - b.x);
    onChange({
      ...toneCurve,
      [activeChannel]: newPoints,
    });
  };

  const handleResetChannel = () => {
    onChange({
      ...toneCurve,
      [activeChannel]: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    });
  };

  const sortedPoints = [...points].sort((a, b) => a.x - b.x);
  const pathD = getSmoothSplinePath(sortedPoints, 200, 200);

  const getChannelColor = (ch: ChannelKey) => {
    switch (ch) {
      case 'red':
        return '#f87171';
      case 'green':
        return '#4ade80';
      case 'blue':
        return '#60a5fa';
      default:
        return '#e2e8f0';
    }
  };

  const strokeColor = getChannelColor(activeChannel);

  const activePoint =
    draggedPointIndex !== null
      ? sortedPoints[draggedPointIndex]
      : hoveredPointIndex !== null
      ? sortedPoints[hoveredPointIndex]
      : null;

  return (
    <div className="space-y-3">
      {/* Channel Toggles & Reset */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-full bg-black/40 p-0.5 border border-white/10 backdrop-blur-md">
          {(['master', 'red', 'green', 'blue'] as ChannelKey[]).map((ch) => (
            <button
              key={ch}
              onClick={() => handleChannelSelect(ch)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeChannel === ch
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
              style={{
                color: activeChannel === ch ? getChannelColor(ch) : undefined,
              }}
            >
              {ch}
            </button>
          ))}
        </div>

        <button
          onClick={handleResetChannel}
          className="text-[10px] font-mono font-bold text-neutral-400 hover:text-blue-400 transition-colors cursor-pointer"
        >
          Reset Curve
        </button>
      </div>

      {/* Point Values Readout Bar */}
      <div className="flex items-center justify-between px-1 text-[10px] font-mono text-neutral-400">
        <span>Tonal Curve</span>
        {activePoint ? (
          <span className="text-blue-400 font-extrabold">
            In: {activePoint.x} &nbsp;|&nbsp; Out: {activePoint.y}
          </span>
        ) : (
          <span className="text-neutral-500">Click to add points</span>
        )}
      </div>

      {/* Interactive SVG Curve Editor */}
      <div className="relative flex justify-center rounded-2xl bg-black/40 p-2.5 border border-white/10 shadow-inner backdrop-blur-xl overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          onClick={handleSvgClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="h-48 w-48 touch-none cursor-crosshair rounded-xl bg-slate-950/80 border border-white/10 select-none shadow-2xl"
        >
          {/* Grid Lines */}
          <line x1="50" y1="0" x2="50" y2="200" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="150" y1="0" x2="150" y2="200" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="0" y1="150" x2="200" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Reference Diagonal line */}
          <line x1="0" y1="200" x2="200" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />

          {/* Smooth Monotone Spline Curve Path */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 6px ${strokeColor}80)`,
            }}
          />

          {/* Control Points */}
          {sortedPoints.map((p, idx) => {
            const px = (p.x / 255) * 200;
            const py = 200 - (p.y / 255) * 200;
            const isDragging = draggedPointIndex === idx;

            return (
              <circle
                key={idx}
                cx={px}
                cy={py}
                r={isDragging ? 7 : 5}
                fill="#0f172a"
                stroke={strokeColor}
                strokeWidth={isDragging ? 3.5 : 2.5}
                onPointerDown={(e) => handlePointerDownPoint(idx, e)}
                onMouseEnter={() => setHoveredPointIndex(idx)}
                onMouseLeave={() => setHoveredPointIndex(null)}
                onContextMenu={(e) => handlePointContextMenu(idx, e)}
                className="cursor-pointer transition-transform duration-100 hover:scale-125"
              />
            );
          })}
        </svg>
      </div>

      <p className="text-center text-[10px] text-neutral-400 font-mono">
        Right-click or long-press a point to delete it.
      </p>
    </div>
  );
};
