import React, { useState } from 'react';
import { HSLState, HSLChannel } from '../types/editor';
import { SliderInput } from './SliderInput';

interface HSLPanelProps {
  hsl: HSLState;
  onChange: (newHSL: HSLState) => void;
}

type HSLTab = 'hue' | 'saturation' | 'luminance';
type ColorKey = keyof HSLState;

const COLORS: { key: ColorKey; label: string; bgClass: string; colorHex: string }[] = [
  { key: 'red', label: 'Red', bgClass: 'bg-red-500', colorHex: '#ef4444' },
  { key: 'orange', label: 'Orange', bgClass: 'bg-orange-500', colorHex: '#f97316' },
  { key: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-400', colorHex: '#eab308' },
  { key: 'green', label: 'Green', bgClass: 'bg-green-500', colorHex: '#22c55e' },
  { key: 'aqua', label: 'Aqua', bgClass: 'bg-cyan-400', colorHex: '#06b6d4' },
  { key: 'blue', label: 'Blue', bgClass: 'bg-blue-500', colorHex: '#3b82f6' },
  { key: 'purple', label: 'Purple', bgClass: 'bg-purple-500', colorHex: '#a855f7' },
  { key: 'magenta', label: 'Magenta', bgClass: 'bg-fuchsia-500', colorHex: '#d946ef' },
];

export const HSLPanel: React.FC<HSLPanelProps> = ({ hsl, onChange }) => {
  const [activeTab, setActiveTab] = useState<HSLTab>('hue');

  const handleChannelChange = (key: ColorKey, property: keyof HSLChannel, val: number) => {
    onChange({
      ...hsl,
      [key]: {
        ...hsl[key],
        [property]: val,
      },
    });
  };

  const handleResetHSL = () => {
    const resetState: HSLState = { ...hsl };
    COLORS.forEach(({ key }) => {
      resetState[key] = { hue: 0, saturation: 0, luminance: 0 };
    });
    onChange(resetState);
  };

  return (
    <div className="space-y-3">
      {/* Tab Selectors & Reset */}
      <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-2">
        <div className="flex rounded bg-[#222222] p-0.5 border border-[#2a2a2a]">
          {(['hue', 'saturation', 'luminance'] as HSLTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={handleResetHSL}
          className="text-[10px] font-mono text-neutral-500 hover:text-blue-400 transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* 8 Color Channel Sliders */}
      <div className="space-y-1.5">
        {COLORS.map(({ key, label, colorHex }) => {
          const val = hsl[key][activeTab];
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full border border-neutral-700 shrink-0"
                style={{ backgroundColor: colorHex }}
              />
              <div className="flex-1">
                <SliderInput
                  label={label}
                  value={val}
                  min={-100}
                  max={100}
                  defaultValue={0}
                  onChange={(v) => handleChannelChange(key, activeTab, v)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
