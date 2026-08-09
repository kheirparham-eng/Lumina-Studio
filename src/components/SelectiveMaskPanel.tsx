import React from 'react';
import { MaskState, MaskType } from '../types/editor';
import { Circle, Sliders, RefreshCw, EyeOff, Spline } from 'lucide-react';
import { SliderInput } from './SliderInput';

interface SelectiveMaskPanelProps {
  mask: MaskState;
  onChange: (newMask: MaskState) => void;
  onResetMask: () => void;
}

export const SelectiveMaskPanel: React.FC<SelectiveMaskPanelProps> = ({
  mask,
  onChange,
  onResetMask,
}) => {
  const handleTypeSelect = (type: MaskType) => {
    onChange({
      ...mask,
      type,
    });
  };

  const updateField = <K extends keyof MaskState>(key: K, value: MaskState[K]) => {
    onChange({
      ...mask,
      [key]: value,
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Mask Type Selector */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-full bg-black/40 p-0.5 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => handleTypeSelect('none')}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              mask.type === 'none'
                ? 'bg-white/20 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <EyeOff className="h-3 w-3" />
            Off
          </button>
          <button
            onClick={() => handleTypeSelect('radial')}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              mask.type === 'radial'
                ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-400/50 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Circle className="h-3 w-3" />
            Radial
          </button>
          <button
            onClick={() => handleTypeSelect('linear')}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              mask.type === 'linear'
                ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-400/50 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Spline className="h-3 w-3" />
            Linear
          </button>
        </div>

        {mask.type !== 'none' && (
          <button
            onClick={onResetMask}
            className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {mask.type !== 'none' && (
        <div className="space-y-3">
          {/* Mask Options: Invert, Opacity, Feather */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-300">
                Mask Shape Controls
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono font-bold text-neutral-300">
                <input
                  type="checkbox"
                  checked={mask.invert}
                  onChange={(e) => updateField('invert', e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-purple-500 focus:ring-purple-400 cursor-pointer"
                />
                Invert Mask
              </label>
            </div>

            <SliderInput
              label="Mask Opacity"
              value={mask.opacity}
              min={0}
              max={100}
              step={1}
              defaultValue={100}
              unit="%"
              onChange={(val) => updateField('opacity', val)}
            />

            <SliderInput
              label="Feather Softness"
              value={mask.feather}
              min={0}
              max={100}
              step={1}
              defaultValue={50}
              unit="%"
              onChange={(val) => updateField('feather', val)}
            />
          </div>

          {/* Selective Adjustments inside Mask */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 space-y-2 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
              <Sliders className="h-3.5 w-3.5" />
              Selective Area Adjustments
            </div>

            <SliderInput
              label="Local Exposure"
              value={mask.exposure}
              min={-3}
              max={3}
              step={0.05}
              defaultValue={0}
              unit=" EV"
              onChange={(val) => updateField('exposure', val)}
            />

            <SliderInput
              label="Local Contrast"
              value={mask.contrast}
              min={-100}
              max={100}
              step={1}
              defaultValue={0}
              onChange={(val) => updateField('contrast', val)}
            />

            <SliderInput
              label="Local Temperature"
              value={mask.temp}
              min={-100}
              max={100}
              step={1}
              defaultValue={0}
              trackGradient="linear-gradient(to right, #3b82f6, #f8fafc, #f59e0b)"
              onChange={(val) => updateField('temp', val)}
            />

            <SliderInput
              label="Local Saturation"
              value={mask.saturation}
              min={-100}
              max={100}
              step={1}
              defaultValue={0}
              onChange={(val) => updateField('saturation', val)}
            />

            <SliderInput
              label="Local Clarity"
              value={mask.clarity}
              min={-100}
              max={100}
              step={1}
              defaultValue={0}
              onChange={(val) => updateField('clarity', val)}
            />
          </div>

          <p className="text-[10px] text-neutral-400 font-mono text-center">
            Drag controls on photo preview to adjust mask position & scale.
          </p>
        </div>
      )}
    </div>
  );
};
