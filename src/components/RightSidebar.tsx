import React, { useState } from 'react';
import { PhotoAdjustments } from '../types/editor';
import { SliderInput } from './SliderInput';
import { HSLPanel } from './HSLPanel';
import { ColorGradingPanel } from './ColorGradingPanel';
import { ToneCurvePanel } from './ToneCurvePanel';
import { CropPanel } from './CropPanel';
import { SelectiveMaskPanel } from './SelectiveMaskPanel';
import { createDefaultMaskState } from '../lib/presets';
import {
  Sun,
  Palette,
  Sliders,
  Sparkles,
  Crop,
  Layers,
  ChevronDown,
  RotateCcw,
  Eye,
  Activity,
  Focus,
  CircleDot,
  Cpu,
  Zap,
} from 'lucide-react';

interface RightSidebarProps {
  adjustments: PhotoAdjustments;
  isCropActive?: boolean;
  onToggleCropActive?: () => void;
  onChange: (adj: PhotoAdjustments, actionLabel?: string) => void;
  onResetAll: () => void;
}

type PanelKey = 'light' | 'color' | 'hsl' | 'grading' | 'curve' | 'mask' | 'effects' | 'detail' | 'crop';

export const RightSidebar: React.FC<RightSidebarProps> = ({
  adjustments,
  isCropActive,
  onToggleCropActive,
  onChange,
  onResetAll,
}) => {
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({
    light: true,
    color: true,
    hsl: false,
    grading: false,
    curve: false,
    mask: false,
    effects: false,
    detail: false,
    crop: false,
  });

  const togglePanel = (key: PanelKey) => {
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePartial = (updates: Partial<PhotoAdjustments>, label?: string) => {
    onChange({ ...adjustments, ...updates }, label);
  };

  return (
    <aside className="ios-glass-card flex h-full w-full md:w-[320px] flex-col select-none z-20 shrink-0 transition-colors duration-300">
      {/* Header with Global Reset */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 shadow-sm">
            <Sliders className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-white">Develop Controls</h3>
        </div>

        <button
          onClick={onResetAll}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] font-bold text-neutral-300 hover:bg-white/10 hover:text-blue-400 transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          <RotateCcw className="h-3 w-3 text-blue-400" />
          Reset All
        </button>
      </div>

      {/* Accordion Panels Scrollable List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        
        {/* 1. LIGHT PANEL */}
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md">
          <button
            onClick={() => togglePanel('light')}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Light</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                openPanels.light ? 'rotate-180 text-blue-400' : ''
              }`}
            />
          </button>

          {openPanels.light && (
            <div className="p-3 space-y-1 bg-black/30 border-t border-white/10">
              <SliderInput
                label="Exposure"
                value={adjustments.exposure}
                min={-5}
                max={5}
                step={0.05}
                defaultValue={0}
                unit=" EV"
                onChange={(val) => updatePartial({ exposure: val }, 'Exposure')}
              />
              <SliderInput
                label="Contrast"
                value={adjustments.contrast}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ contrast: val }, 'Contrast')}
              />
              <SliderInput
                label="Highlights"
                value={adjustments.highlights}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ highlights: val }, 'Highlights')}
              />
              <SliderInput
                label="Shadows"
                value={adjustments.shadows}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ shadows: val }, 'Shadows')}
              />
              <SliderInput
                label="Whites"
                value={adjustments.whites}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ whites: val }, 'Whites')}
              />
              <SliderInput
                label="Blacks"
                value={adjustments.blacks}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ blacks: val }, 'Blacks')}
              />
            </div>
          )}
        </div>

        {/* 2. COLOR & WHITE BALANCE */}
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md">
          <button
            onClick={() => togglePanel('color')}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Color & WB</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                openPanels.color ? 'rotate-180 text-cyan-400' : ''
              }`}
            />
          </button>

          {openPanels.color && (
            <div className="p-3 space-y-1 bg-black/30 border-t border-white/10">
              <SliderInput
                label="Temp"
                value={adjustments.temp}
                min={2000}
                max={10000}
                step={50}
                defaultValue={5500}
                unit=" K"
                trackGradient="linear-gradient(to right, #3b82f6, #f8fafc, #f59e0b)"
                onChange={(val) => updatePartial({ temp: val }, 'Temperature')}
              />
              <SliderInput
                label="Tint"
                value={adjustments.tint}
                min={-100}
                max={100}
                defaultValue={0}
                trackGradient="linear-gradient(to right, #22c55e, #f8fafc, #d946ef)"
                onChange={(val) => updatePartial({ tint: val }, 'Tint')}
              />
              <SliderInput
                label="Vibrance"
                value={adjustments.vibrance}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ vibrance: val }, 'Vibrance')}
              />
              <SliderInput
                label="Saturation"
                value={adjustments.saturation}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ saturation: val }, 'Saturation')}
              />
            </div>
          )}
        </div>

        {/* 3. HSL COLOR MIXER */}
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md">
          <button
            onClick={() => togglePanel('hsl')}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-pink-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Color Mixer</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                openPanels.hsl ? 'rotate-180 text-pink-400' : ''
              }`}
            />
          </button>

          {openPanels.hsl && (
            <div className="p-3 bg-black/30 border-t border-white/10">
              <HSLPanel
                hsl={adjustments.hsl}
                onChange={(newHsl) => updatePartial({ hsl: newHsl }, 'HSL Color Shift')}
              />
            </div>
          )}
        </div>

        {/* 4. COLOR GRADING */}
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md">
          <button
            onClick={() => togglePanel('grading')}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Color Grading</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                openPanels.grading ? 'rotate-180 text-purple-400' : ''
              }`}
            />
          </button>

          {openPanels.grading && (
            <div className="p-3 bg-black/30 border-t border-white/10">
              <ColorGradingPanel
                colorGrading={adjustments.colorGrading}
                onChange={(newCg) => updatePartial({ colorGrading: newCg }, 'Color Grading')}
              />
            </div>
          )}
        </div>

        {/* 5. TONE CURVE */}
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md">
          <button
            onClick={() => togglePanel('curve')}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Tone Curve</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                openPanels.curve ? 'rotate-180 text-emerald-400' : ''
              }`}
            />
          </button>

          {openPanels.curve && (
            <div className="p-3 bg-black/30 border-t border-white/10">
              <ToneCurvePanel
                toneCurve={adjustments.toneCurve}
                onChange={(newCurve) => updatePartial({ toneCurve: newCurve }, 'Tone Curve')}
              />
            </div>
          )}
        </div>

        {/* 6. SELECTIVE MASKING */}
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md">
          <button
            onClick={() => togglePanel('mask')}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Selective Masking</span>
              {adjustments.mask && adjustments.mask.type !== 'none' && (
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                openPanels.mask ? 'rotate-180 text-purple-400' : ''
              }`}
            />
          </button>

          {openPanels.mask && (
            <div className="p-3 bg-black/30 border-t border-white/10">
              <SelectiveMaskPanel
                mask={adjustments.mask || createDefaultMaskState()}
                onChange={(newMask) => updatePartial({ mask: newMask }, 'Selective Masking')}
                onResetMask={() => updatePartial({ mask: createDefaultMaskState() }, 'Reset Mask')}
              />
            </div>
          )}
        </div>

        {/* 7. EFFECTS */}
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md">
          <button
            onClick={() => togglePanel('effects')}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Effects & Texture</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                openPanels.effects ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </button>

          {openPanels.effects && (
            <div className="p-3 space-y-1 bg-black/30 border-t border-white/10">
              <SliderInput
                label="Clarity"
                value={adjustments.clarity}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ clarity: val }, 'Clarity')}
              />
              <SliderInput
                label="Texture"
                value={adjustments.texture}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ texture: val }, 'Texture')}
              />
              <SliderInput
                label="Dehaze"
                value={adjustments.dehaze}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ dehaze: val }, 'Dehaze')}
              />
              <SliderInput
                label="Vignette"
                value={adjustments.vignette}
                min={-100}
                max={100}
                defaultValue={0}
                onChange={(val) => updatePartial({ vignette: val }, 'Vignette')}
              />
              <SliderInput
                label="Vignette Midpoint"
                value={adjustments.vignetteMidpoint ?? 50}
                min={0}
                max={100}
                defaultValue={50}
                onChange={(val) => updatePartial({ vignetteMidpoint: val }, 'Vignette Midpoint')}
              />
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block mb-1">
                  Film Grain & Artifacts
                </span>
                <SliderInput
                  label="Grain Amount"
                  value={adjustments.grain}
                  min={0}
                  max={100}
                  defaultValue={0}
                  onChange={(val) => updatePartial({ grain: val }, 'Film Grain')}
                />
                <SliderInput
                  label="Grain Size"
                  value={adjustments.grainSize ?? 2}
                  min={1}
                  max={5}
                  step={0.5}
                  defaultValue={2}
                  onChange={(val) => updatePartial({ grainSize: val }, 'Grain Size')}
                />
                <SliderInput
                  label="Grain Roughness"
                  value={adjustments.grainRoughness ?? 50}
                  min={0}
                  max={100}
                  defaultValue={50}
                  onChange={(val) => updatePartial({ grainRoughness: val }, 'Grain Roughness')}
                />
                <SliderInput
                  label="Chromatic Aberration"
                  value={adjustments.chromaticAberration ?? 0}
                  min={0}
                  max={100}
                  defaultValue={0}
                  onChange={(val) => updatePartial({ chromaticAberration: val }, 'Chromatic Aberration')}
                />
              </div>
            </div>
          )}
        </div>

        {/* 8. DETAIL & AI DENOISE */}
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md">
          <button
            onClick={() => togglePanel('detail')}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Focus className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Detail & AI Denoise</span>
              {((adjustments.noiseReduction ?? 0) > 0 || (adjustments.colorNoiseReduction ?? 0) > 0) && (
                <span className="flex items-center gap-1 rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-mono text-sky-300 ring-1 ring-sky-400/40 animate-pulse">
                  <Cpu className="h-2.5 w-2.5" /> AI Denoise Active
                </span>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                openPanels.detail ? 'rotate-180 text-sky-400' : ''
              }`}
            />
          </button>

          {openPanels.detail && (
            <div className="p-3 space-y-3 bg-black/30 border-t border-white/10">
              {/* AI High-ISO Denoise Section */}
              <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-2.5 space-y-2 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
                    <Sparkles className="h-3 w-3 text-sky-400 animate-pulse" />
                    AI High-ISO Denoise (Kernel Filter)
                  </div>
                  {((adjustments.noiseReduction ?? 0) > 0 || (adjustments.colorNoiseReduction ?? 0) > 0) && (
                    <button
                      onClick={() =>
                        updatePartial(
                          {
                            noiseReduction: 0,
                            colorNoiseReduction: 0,
                            noiseDetail: 50,
                          },
                          'Reset AI Denoise'
                        )
                      }
                      className="text-[9px] font-mono text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Quick High-ISO Profiles */}
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  <button
                    onClick={() =>
                      updatePartial(
                        { noiseReduction: 15, colorNoiseReduction: 20, noiseDetail: 75 },
                        'ISO 400-800 Denoise'
                      )
                    }
                    className="rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-[9px] font-mono font-medium text-neutral-300 hover:border-sky-400 hover:text-sky-300 transition-colors text-center cursor-pointer"
                  >
                    Low ISO
                  </button>
                  <button
                    onClick={() =>
                      updatePartial(
                        { noiseReduction: 38, colorNoiseReduction: 45, noiseDetail: 55 },
                        'ISO 1600-3200 Denoise'
                      )
                    }
                    className="rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-[9px] font-mono font-medium text-neutral-300 hover:border-sky-400 hover:text-sky-300 transition-colors text-center cursor-pointer"
                  >
                    Med ISO
                  </button>
                  <button
                    onClick={() =>
                      updatePartial(
                        { noiseReduction: 68, colorNoiseReduction: 75, noiseDetail: 40 },
                        'ISO 6400+ Denoise'
                      )
                    }
                    className="rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-[9px] font-mono font-medium text-neutral-300 hover:border-sky-400 hover:text-sky-300 transition-colors text-center cursor-pointer"
                  >
                    High ISO
                  </button>
                  <button
                    onClick={() =>
                      updatePartial(
                        { noiseReduction: 88, colorNoiseReduction: 90, noiseDetail: 30 },
                        'Extreme ISO 12800+ Denoise'
                      )
                    }
                    className="rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-[9px] font-mono font-medium text-neutral-300 hover:border-sky-400 hover:text-sky-300 transition-colors text-center cursor-pointer"
                  >
                    Extreme
                  </button>
                </div>

                {/* Denoise Sliders */}
                <SliderInput
                  label="AI Noise Reduction"
                  value={adjustments.noiseReduction ?? 0}
                  min={0}
                  max={100}
                  defaultValue={0}
                  trackGradient="linear-gradient(to right, #0369a1, #38bdf8)"
                  onChange={(val) => updatePartial({ noiseReduction: val }, 'AI Noise Reduction')}
                />

                <SliderInput
                  label="Color Noise (Chroma)"
                  value={adjustments.colorNoiseReduction ?? 0}
                  min={0}
                  max={100}
                  defaultValue={0}
                  trackGradient="linear-gradient(to right, #818cf8, #c084fc)"
                  onChange={(val) => updatePartial({ colorNoiseReduction: val }, 'Color Noise Reduction')}
                />

                <SliderInput
                  label="Edge Detail Retention"
                  value={adjustments.noiseDetail ?? 50}
                  min={0}
                  max={100}
                  defaultValue={50}
                  onChange={(val) => updatePartial({ noiseDetail: val }, 'Noise Detail Retention')}
                />

                <div className="flex items-center justify-between pt-1 text-[9px] text-neutral-400 font-mono">
                  <span>WebGL Bilateral Kernel: 12-Tap</span>
                  <span className="text-sky-400">
                    {(adjustments.noiseReduction ?? 0) > 0 ? `${adjustments.noiseReduction}% Denoise` : 'Bypassed'}
                  </span>
                </div>
              </div>

              {/* Capture Sharpening */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-2.5 space-y-2 backdrop-blur-md">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-300 block">
                  Capture Sharpening
                </span>
                <SliderInput
                  label="Sharpening Amount"
                  value={adjustments.sharpening}
                  min={0}
                  max={100}
                  defaultValue={15}
                  onChange={(val) => updatePartial({ sharpening: val }, 'Sharpening')}
                />
              </div>
            </div>
          )}
        </div>

        {/* 7. CROP & GEOMETRY */}
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md">
          <button
            onClick={() => togglePanel('crop')}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Crop className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Crop & Geometry</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                openPanels.crop ? 'rotate-180 text-orange-400' : ''
              }`}
            />
          </button>

          {openPanels.crop && (
            <div className="p-3 bg-black/30 border-t border-white/10">
              <CropPanel
                crop={adjustments.crop}
                isCropActive={isCropActive}
                onToggleCropActive={onToggleCropActive}
                onChange={(newCrop) => updatePartial({ crop: newCrop }, 'Crop / Geometry')}
                onResetCrop={() =>
                  updatePartial(
                    {
                      crop: {
                        aspectRatio: 'free',
                        rotation: 0,
                        flipH: false,
                        flipV: false,
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1,
                      },
                    },
                    'Reset Crop'
                  )
                }
              />
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
