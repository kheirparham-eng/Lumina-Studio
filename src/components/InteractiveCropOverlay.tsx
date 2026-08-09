import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CropState } from '../types/editor';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface InteractiveCropOverlayProps {
  crop: CropState;
  onChange: (newCrop: CropState) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageWidth: number;
  imageHeight: number;
  isCropActive: boolean;
  onDone: () => void;
  onResetCrop: () => void;
}

const ASPECT_RATIOS: { label: string; value: CropState['aspectRatio'] }[] = [
  { label: 'Free', value: 'free' },
  { label: 'Original', value: 'original' },
  { label: '1 : 1', value: '1:1' },
  { label: '4 : 5', value: '4:5' },
  { label: '3 : 2', value: '3:2' },
  { label: '16 : 9', value: '16:9' },
  { label: '9 : 16', value: '9:16' },
  { label: '4 : 3', value: '4:3' },
];

export function fitCropToAspect(
  ratio: CropState['aspectRatio'],
  imgW: number,
  imgH: number
): { x: number; y: number; width: number; height: number } {
  if (ratio === 'free') {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  let targetRatio = 1.0;
  if (ratio === 'original') targetRatio = imgW / (imgH || 1);
  else if (ratio === '1:1') targetRatio = 1.0;
  else if (ratio === '4:5') targetRatio = 0.8;
  else if (ratio === '3:2') targetRatio = 1.5;
  else if (ratio === '16:9') targetRatio = 16 / 9;
  else if (ratio === '9:16') targetRatio = 9 / 16;
  else if (ratio === '4:3') targetRatio = 4 / 3;

  const A_img = imgW / (imgH || 1);

  let w = 1.0;
  let h = 1.0;

  if (A_img > targetRatio) {
    h = 1.0;
    w = targetRatio / A_img;
  } else {
    w = 1.0;
    h = A_img / targetRatio;
  }

  const x = (1.0 - w) / 2;
  const y = (1.0 - h) / 2;

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(1, w),
    height: Math.min(1, h),
  };
}

export const InteractiveCropOverlay: React.FC<InteractiveCropOverlayProps> = ({
  crop,
  onChange,
  canvasRef,
  imageWidth,
  imageHeight,
  isCropActive,
  onDone,
  onResetCrop,
}) => {
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const startPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startCrop = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });

  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  // Keep overlay synchronized with canvas DOM position & size
  const updateRect = useCallback(() => {
    if (canvasRef.current) {
      const r = canvasRef.current.getBoundingClientRect();
      setRect({
        left: canvasRef.current.offsetLeft,
        top: canvasRef.current.offsetTop,
        width: r.width,
        height: r.height,
      });
    }
  }, [canvasRef]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect, isCropActive, crop]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isCropActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onDone();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDone();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCropActive, onDone]);

  if (!isCropActive || rect.width <= 0 || rect.height <= 0) return null;

  const canvasW = rect.width;
  const canvasH = rect.height;

  // Calculate crop pixel coordinates relative to canvas overlay
  const boxLeft = crop.x * canvasW;
  const boxTop = crop.y * canvasH;
  const boxWidth = crop.width * canvasW;
  const boxHeight = crop.height * canvasH;
  const boxRight = boxLeft + boxWidth;
  const boxBottom = boxTop + boxHeight;

  // Real pixel resolution of current crop
  const croppedPxW = Math.round(crop.width * (imageWidth || 1920));
  const croppedPxH = Math.round(crop.height * (imageHeight || 1080));

  // Get target ratio for locking
  const getTargetRatio = () => {
    if (crop.aspectRatio === 'free') return null;
    if (crop.aspectRatio === 'original') return (imageWidth || 1920) / (imageHeight || 1080);
    if (crop.aspectRatio === '1:1') return 1.0;
    if (crop.aspectRatio === '4:5') return 0.8;
    if (crop.aspectRatio === '3:2') return 1.5;
    if (crop.aspectRatio === '16:9') return 16 / 9;
    if (crop.aspectRatio === '9:16') return 9 / 16;
    if (crop.aspectRatio === '4:3') return 4 / 3;
    return null;
  };

  const handlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setDragHandle(handle);
    startPointer.current = { x: e.clientX, y: e.clientY };
    startCrop.current = {
      x: crop.x,
      y: crop.y,
      width: crop.width,
      height: crop.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragHandle) return;

    const dx = (e.clientX - startPointer.current.x) / canvasW;
    const dy = (e.clientY - startPointer.current.y) / canvasH;

    const MIN_NORM = 0.05;
    const targetRatio = getTargetRatio();
    const A_img = (imageWidth || 1920) / (imageHeight || 1080);

    const { x, y, width: w, height: h } = startCrop.current;

    if (dragHandle === 'move') {
      let newX = Math.max(0, Math.min(1 - w, x + dx));
      let newY = Math.max(0, Math.min(1 - h, y + dy));
      onChange({ ...crop, x: newX, y: newY });
      return;
    }

    if (dragHandle === 'se') {
      let newW = Math.max(MIN_NORM, Math.min(1 - x, w + dx));
      let newH = Math.max(MIN_NORM, Math.min(1 - y, h + dy));
      if (targetRatio) {
        newH = newW * (A_img / targetRatio);
        if (y + newH > 1) {
          newH = 1 - y;
          newW = newH * (targetRatio / A_img);
        }
      }
      onChange({ ...crop, width: newW, height: newH });
    } else if (dragHandle === 'sw') {
      let maxW = x + w;
      let newX = Math.max(0, Math.min(maxW - MIN_NORM, x + dx));
      let newW = maxW - newX;
      let newH = Math.max(MIN_NORM, Math.min(1 - y, h + dy));
      if (targetRatio) {
        newH = newW * (A_img / targetRatio);
        if (y + newH > 1) {
          newH = 1 - y;
          newW = newH * (targetRatio / A_img);
        }
        newX = maxW - newW;
      }
      onChange({ ...crop, x: newX, width: newW, height: newH });
    } else if (dragHandle === 'ne') {
      let maxH = y + h;
      let newY = Math.max(0, Math.min(maxH - MIN_NORM, y + dy));
      let newH = maxH - newY;
      let newW = Math.max(MIN_NORM, Math.min(1 - x, w + dx));
      if (targetRatio) {
        newH = newW * (A_img / targetRatio);
        if (maxH - newH < 0) {
          newH = maxH;
          newW = newH * (targetRatio / A_img);
        }
        newY = maxH - newH;
      }
      onChange({ ...crop, y: newY, width: newW, height: newH });
    } else if (dragHandle === 'nw') {
      let maxW = x + w;
      let maxH = y + h;
      let newX = Math.max(0, Math.min(maxW - MIN_NORM, x + dx));
      let newW = maxW - newX;
      let newY = Math.max(0, Math.min(maxH - MIN_NORM, y + dy));
      let newH = maxH - newY;
      if (targetRatio) {
        newH = newW * (A_img / targetRatio);
        if (maxH - newH < 0) {
          newH = maxH;
          newW = newH * (targetRatio / A_img);
        }
        newX = maxW - newW;
        newY = maxH - newH;
      }
      onChange({ ...crop, x: newX, y: newY, width: newW, height: newH });
    } else if (dragHandle === 'e') {
      let newW = Math.max(MIN_NORM, Math.min(1 - x, w + dx));
      let newH = h;
      if (targetRatio) {
        newH = newW * (A_img / targetRatio);
        if (y + newH > 1) {
          newH = 1 - y;
          newW = newH * (targetRatio / A_img);
        }
      }
      onChange({ ...crop, width: newW, height: newH });
    } else if (dragHandle === 'w') {
      let maxW = x + w;
      let newX = Math.max(0, Math.min(maxW - MIN_NORM, x + dx));
      let newW = maxW - newX;
      let newH = h;
      if (targetRatio) {
        newH = newW * (A_img / targetRatio);
        if (y + newH > 1) {
          newH = 1 - y;
          newW = newH * (targetRatio / A_img);
        }
        newX = maxW - newW;
      }
      onChange({ ...crop, x: newX, width: newW, height: newH });
    } else if (dragHandle === 's') {
      let newH = Math.max(MIN_NORM, Math.min(1 - y, h + dy));
      let newW = w;
      if (targetRatio) {
        newW = newH * (targetRatio / A_img);
        if (x + newW > 1) {
          newW = 1 - x;
          newH = newW * (A_img / targetRatio);
        }
      }
      onChange({ ...crop, width: newW, height: newH });
    } else if (dragHandle === 'n') {
      let maxH = y + h;
      let newY = Math.max(0, Math.min(maxH - MIN_NORM, y + dy));
      let newH = maxH - newY;
      let newW = w;
      if (targetRatio) {
        newW = newH * (targetRatio / A_img);
        if (x + newW > 1) {
          newW = 1 - x;
          newH = newW * (A_img / targetRatio);
        }
        newY = maxH - newH;
      }
      onChange({ ...crop, y: newY, width: newW, height: newH });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragHandle) {
      setDragHandle(null);
    }
  };

  const handleAspectChange = (ratio: CropState['aspectRatio']) => {
    const fitted = fitCropToAspect(ratio, imageWidth, imageHeight);
    onChange({
      ...crop,
      aspectRatio: ratio,
      ...fitted,
    });
  };

  const rotate90 = (dir: 1 | -1) => {
    let nextRot = (crop.rotation + dir * 90) % 360;
    if (nextRot > 180) nextRot -= 360;
    if (nextRot < -180) nextRot += 360;
    onChange({
      ...crop,
      rotation: nextRot,
    });
  };

  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${canvasW}px`,
        height: `${canvasH}px`,
      }}
    >
      {/* Dimmed Outside Mask Overlay */}
      <div
        className="absolute bg-black/65 backdrop-blur-[1px] pointer-events-auto"
        style={{ top: 0, left: 0, width: `${canvasW}px`, height: `${boxTop}px` }}
      />
      <div
        className="absolute bg-black/65 backdrop-blur-[1px] pointer-events-auto"
        style={{
          top: `${boxBottom}px`,
          left: 0,
          width: `${canvasW}px`,
          height: `${canvasH - boxBottom}px`,
        }}
      />
      <div
        className="absolute bg-black/65 backdrop-blur-[1px] pointer-events-auto"
        style={{
          top: `${boxTop}px`,
          left: 0,
          width: `${boxLeft}px`,
          height: `${boxHeight}px`,
        }}
      />
      <div
        className="absolute bg-black/65 backdrop-blur-[1px] pointer-events-auto"
        style={{
          top: `${boxTop}px`,
          left: `${boxRight}px`,
          width: `${canvasW - boxRight}px`,
          height: `${boxHeight}px`,
        }}
      />

      {/* Main Crop Frame Box */}
      <div
        onPointerDown={(e) => handlePointerDown('move', e)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute pointer-events-auto border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.8)] cursor-move group select-none"
        style={{
          left: `${boxLeft}px`,
          top: `${boxTop}px`,
          width: `${boxWidth}px`,
          height: `${boxHeight}px`,
        }}
      >
        {/* Rule-of-Thirds Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          <div className="border-r border-b border-white/30" />
          <div className="border-r border-b border-white/30" />
          <div className="border-b border-white/30" />
          <div className="border-r border-b border-white/30" />
          <div className="border-r border-b border-white/30" />
          <div className="border-b border-white/30" />
          <div className="border-r border-white/30" />
          <div className="border-r border-white/30" />
          <div />
        </div>

        {/* Dimension & Aspect Badge */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none rounded-full bg-slate-950/90 border border-white/20 px-3 py-0.5 text-[10px] font-mono font-bold text-blue-400 shadow-xl backdrop-blur-md whitespace-nowrap">
          {croppedPxW} × {croppedPxH} px &nbsp;•&nbsp; {crop.aspectRatio.toUpperCase()}
        </div>

        {/* Corner & Edge Handles */}
        {/* Top-Left */}
        <div
          onPointerDown={(e) => handlePointerDown('nw', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute -top-2 -left-2 h-5 w-5 border-t-4 border-l-4 border-blue-400 bg-white/30 hover:bg-blue-400 cursor-nwse-resize shadow-md transition-colors"
        />
        {/* Top-Right */}
        <div
          onPointerDown={(e) => handlePointerDown('ne', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute -top-2 -right-2 h-5 w-5 border-t-4 border-r-4 border-blue-400 bg-white/30 hover:bg-blue-400 cursor-nesw-resize shadow-md transition-colors"
        />
        {/* Bottom-Left */}
        <div
          onPointerDown={(e) => handlePointerDown('sw', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute -bottom-2 -left-2 h-5 w-5 border-b-4 border-l-4 border-blue-400 bg-white/30 hover:bg-blue-400 cursor-nesw-resize shadow-md transition-colors"
        />
        {/* Bottom-Right */}
        <div
          onPointerDown={(e) => handlePointerDown('se', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute -bottom-2 -right-2 h-5 w-5 border-b-4 border-r-4 border-blue-400 bg-white/30 hover:bg-blue-400 cursor-nwse-resize shadow-md transition-colors"
        />

        {/* Top Middle Edge */}
        <div
          onPointerDown={(e) => handlePointerDown('n', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-8 rounded-full border-t-2 border-white bg-blue-500 hover:bg-blue-400 cursor-ns-resize shadow-md"
        />
        {/* Bottom Middle Edge */}
        <div
          onPointerDown={(e) => handlePointerDown('s', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-8 rounded-full border-b-2 border-white bg-blue-500 hover:bg-blue-400 cursor-ns-resize shadow-md"
        />
        {/* Left Middle Edge */}
        <div
          onPointerDown={(e) => handlePointerDown('w', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-8 rounded-full border-l-2 border-white bg-blue-500 hover:bg-blue-400 cursor-ew-resize shadow-md"
        />
        {/* Right Middle Edge */}
        <div
          onPointerDown={(e) => handlePointerDown('e', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 rounded-full border-r-2 border-white bg-blue-500 hover:bg-blue-400 cursor-ew-resize shadow-md"
        />
      </div>

      {/* Interactive Floating Crop Toolbar overlay below canvas */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2 z-40">
        {/* Straighten / Rotation Slider & Quick Controls Bar */}
        <div className="flex items-center gap-2 rounded-2xl bg-slate-950/90 border border-white/20 px-4 py-2 text-white shadow-2xl backdrop-blur-2xl">
          <button
            onClick={() => rotate90(-1)}
            title="Rotate 90° CCW"
            className="rounded-full p-1.5 hover:bg-white/15 active:scale-90 text-neutral-300 hover:text-white transition-all"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => rotate90(1)}
            title="Rotate 90° CW"
            className="rounded-full p-1.5 hover:bg-white/15 active:scale-90 text-neutral-300 hover:text-white transition-all"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Flip Buttons */}
          <button
            onClick={() => onChange({ ...crop, flipH: !crop.flipH })}
            title="Flip Horizontal"
            className={`rounded-full p-1.5 active:scale-90 transition-all ${
              crop.flipH ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-300 hover:text-white hover:bg-white/15'
            }`}
          >
            <FlipHorizontal className="h-4 w-4" />
          </button>

          <button
            onClick={() => onChange({ ...crop, flipV: !crop.flipV })}
            title="Flip Vertical"
            className={`rounded-full p-1.5 active:scale-90 transition-all ${
              crop.flipV ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-300 hover:text-white hover:bg-white/15'
            }`}
          >
            <FlipVertical className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Straighten Rotation Slider */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] text-neutral-300 font-bold uppercase">Straighten</span>
            <input
              type="range"
              min={-45}
              max={45}
              step={0.1}
              value={crop.rotation}
              onChange={(e) => onChange({ ...crop, rotation: parseFloat(e.target.value) })}
              className="w-28 accent-blue-500 cursor-pointer"
            />
            <span className="w-10 text-right font-extrabold text-blue-400">
              {crop.rotation > 0 ? `+${crop.rotation.toFixed(1)}` : crop.rotation.toFixed(1)}°
            </span>
            {crop.rotation !== 0 && (
              <button
                onClick={() => onChange({ ...crop, rotation: 0 })}
                title="Reset Rotation to 0°"
                className="text-[10px] text-neutral-400 hover:text-blue-400 font-bold underline"
              >
                0°
              </button>
            )}
          </div>
        </div>

        {/* Aspect Ratio Pills & Done Actions Bar */}
        <div className="flex items-center gap-2 rounded-2xl bg-slate-950/90 border border-white/20 px-3 py-1.5 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-1">
            {ASPECT_RATIOS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleAspectChange(value)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                  crop.aspectRatio === value
                    ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-400'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/20 mx-1" />

          <button
            onClick={onResetCrop}
            title="Reset Crop Geometry"
            className="flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 border border-white/10"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset</span>
          </button>

          <button
            onClick={onDone}
            className="ios-glossy-blue flex items-center gap-1.5 rounded-xl text-white px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-500/40 border border-white/30"
          >
            <Check className="h-3.5 w-3.5 drop-shadow" />
            <span className="drop-shadow">Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
