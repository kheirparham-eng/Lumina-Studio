import React, { useState, useEffect } from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  trackGradient?: string;
  onChange: (val: number) => void;
  icon?: React.ReactNode;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  unit = '',
  trackGradient,
  onChange,
  icon,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    let num = parseFloat(inputValue);
    if (isNaN(num)) num = defaultValue;
    num = Math.max(min, Math.min(max, num));
    onChange(num);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  // Calculate percentage for progress fill
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const zeroPercent = Math.max(0, Math.min(100, ((defaultValue - min) / (max - min)) * 100));

  return (
    <div className="group mb-2.5 text-[11px] ios-spring">
      <div className="mb-1 flex items-center justify-between">
        <label className="flex items-center gap-1.5 font-medium text-neutral-300 group-hover:text-white transition-colors cursor-pointer select-none">
          {icon && <span className="text-neutral-400 group-hover:text-blue-400 transition-colors">{icon}</span>}
          <span>{label}</span>
        </label>

        {isEditing ? (
          <input
            type="number"
            autoFocus
            value={inputValue}
            step={step}
            min={min}
            max={max}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-14 rounded-md bg-black/40 px-1.5 py-0.5 text-right font-mono text-[11px] text-blue-400 border border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            onDoubleClick={handleDoubleClick}
            title="Click to edit value, double-click to reset"
            className={`font-mono text-[11px] px-1.5 py-0.5 rounded transition-all cursor-pointer hover:bg-white/10 ${
              value !== defaultValue ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-neutral-400'
            }`}
          >
            {value > 0 && defaultValue === 0 ? `+${value}` : value}
            {unit}
          </button>
        )}
      </div>

      <div
        className="relative flex items-center h-5 py-1 cursor-pointer select-none"
        onDoubleClick={handleDoubleClick}
      >
        {/* Sleek iOS Capsule Track */}
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-black/50 border border-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] relative"
          style={{ background: trackGradient || undefined }}
        >
          {/* Active fill indicator for centered zero sliders */}
          {!trackGradient && min < 0 && (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-75 shadow-[0_0_14px_rgba(59,130,246,0.7)]"
              style={{
                left: `${Math.min(percent, zeroPercent)}%`,
                width: `${Math.abs(percent - zeroPercent)}%`,
              }}
            >
              {/* Glossy top shine bar */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30 rounded-t-full pointer-events-none" />
            </div>
          )}

          {!trackGradient && min >= 0 && (
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-75 shadow-[0_0_14px_rgba(59,130,246,0.7)] relative overflow-hidden"
              style={{ width: `${percent}%` }}
            >
              {/* Glossy top shine bar */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30 rounded-t-full pointer-events-none" />
            </div>
          )}

          {/* Zero mark notch line */}
          {min < 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10 shadow-[0_0_4px_rgba(255,255,255,0.8)]"
              style={{ left: `${zeroPercent}%` }}
            />
          )}
        </div>

        {/* Range input slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 h-full w-full opacity-0 cursor-ew-resize ios-slider z-20"
        />

        {/* Custom Circular iOS Glass Thumb with Specular Highlight */}
        <div
          className="pointer-events-none absolute h-4.5 w-4.5 -translate-x-1/2 rounded-full border-1.5 border-white bg-gradient-to-b from-white via-slate-100 to-slate-300 shadow-[0_3px_10px_rgba(0,0,0,0.5),_inset_0_1.5px_1.5px_rgba(255,255,255,1),_0_0_10px_rgba(59,130,246,0.5)] transition-transform duration-100 group-hover:scale-125 group-active:scale-140 z-30"
          style={{ left: `${percent}%` }}
        >
          {/* Specular Glint Spot */}
          <div className="absolute top-0.5 left-1 h-1 w-1 rounded-full bg-white blur-[0.3px]" />
        </div>
      </div>
    </div>
  );
};
