import React, { useRef } from 'react';
import { ColorGradingState, ColorWheelVal } from '../types/editor';
import { SliderInput } from './SliderInput';

interface ColorGradingPanelProps {
  colorGrading: ColorGradingState;
  onChange: (state: ColorGradingState) => void;
}

type WheelZone = 'shadows' | 'midtones' | 'highlights';

interface ColorWheelProps {
  title: string;
  value: ColorWheelVal;
  onChange: (val: ColorWheelVal) => void;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ title, value, onChange }) => {
  const wheelRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 1) {
      updateFromPointer(e);
    }
  };

  const updateFromPointer = (e: React.PointerEvent) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const radius = rect.width / 2;

    const dist = Math.min(radius, Math.sqrt(dx * dx + dy * dy));
    const sat = Math.round((dist / radius) * 100);

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    const hue = Math.round(angle);

    onChange({
      ...value,
      hue,
      saturation: sat,
    });
  };

  // Convert hue and sat to thumb x, y
  const angleRad = (value.hue * Math.PI) / 180;
  const distPct = value.saturation / 100;
  const thumbX = 50 + distPct * 50 * Math.cos(angleRad);
  const thumbY = 50 + distPct * 50 * Math.sin(angleRad);

  return (
    <div className="flex flex-col items-center rounded bg-[#1c1c1c] p-2 border border-[#2a2a2a]">
      <div className="mb-1 flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-300">
        <span className="capitalize">{title}</span>
        <span className="font-mono text-[10px] text-blue-400">
          {value.hue}° / {value.saturation}%
        </span>
      </div>

      {/* Wheel Canvas / Disk */}
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative h-24 w-24 cursor-crosshair rounded-full shadow-inner border border-[#333] overflow-hidden"
        style={{
          background: `conic-gradient(
            from 0deg,
            #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000
          )`,
        }}
      >
        {/* Radial saturation gradient overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, #808080 0%, transparent 100%)',
          }}
        />

        {/* Center Crosshair */}
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-400/60" />

        {/* Vector Thumb */}
        <div
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-950 shadow-md transition-transform"
          style={{
            left: `${thumbX}%`,
            top: `${thumbY}%`,
          }}
        />
      </div>

      {/* Luminance Slider */}
      <div className="w-full mt-1.5">
        <SliderInput
          label="Luminance"
          value={value.luminance}
          min={-100}
          max={100}
          defaultValue={0}
          onChange={(lum) => onChange({ ...value, luminance: lum })}
        />
      </div>
    </div>
  );
};

export const ColorGradingPanel: React.FC<ColorGradingPanelProps> = ({
  colorGrading,
  onChange,
}) => {
  const handleZoneChange = (zone: WheelZone, val: ColorWheelVal) => {
    onChange({
      ...colorGrading,
      [zone]: val,
    });
  };

  return (
    <div className="space-y-4">
      {/* 3-Way Wheels Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <ColorWheel
          title="Shadows"
          value={colorGrading.shadows}
          onChange={(v) => handleZoneChange('shadows', v)}
        />
        <ColorWheel
          title="Midtones"
          value={colorGrading.midtones}
          onChange={(v) => handleZoneChange('midtones', v)}
        />
        <ColorWheel
          title="Highlights"
          value={colorGrading.highlights}
          onChange={(v) => handleZoneChange('highlights', v)}
        />
      </div>

      {/* Blending & Balance Controls */}
      <div className="rounded-lg bg-neutral-900 p-2.5 border border-neutral-800 space-y-2">
        <SliderInput
          label="Blending"
          value={colorGrading.blending}
          min={0}
          max={100}
          defaultValue={50}
          onChange={(val) => onChange({ ...colorGrading, blending: val })}
        />

        <SliderInput
          label="Balance"
          value={colorGrading.balance}
          min={-100}
          max={100}
          defaultValue={0}
          onChange={(val) => onChange({ ...colorGrading, balance: val })}
        />
      </div>
    </div>
  );
};
