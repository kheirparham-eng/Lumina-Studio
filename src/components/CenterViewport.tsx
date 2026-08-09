import React, { useRef, useState, useEffect } from 'react';
import { PhotoAdjustments, ViewMode, HistogramData, CropState, MaskState } from '../types/editor';
import { WebGLPhotoRenderer } from '../lib/webgl/renderer';
import { createDefaultAdjustments } from '../lib/presets';
import { InteractiveCropOverlay } from './InteractiveCropOverlay';
import { InteractiveMaskOverlay } from './InteractiveMaskOverlay';
import {
  Upload,
  Square,
  SplitSquareVertical,
  Columns2,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Crop,
  Layers,
} from 'lucide-react';

interface CenterViewportProps {
  imageSource: HTMLImageElement | HTMLCanvasElement | null;
  adjustments: PhotoAdjustments;
  viewMode: ViewMode;
  zoom: number;
  onZoomChange: (z: number) => void;
  isComparing: boolean;
  isCropActive?: boolean;
  onToggleCropActive?: (active?: boolean) => void;
  onCropChange?: (crop: CropState) => void;
  onMaskChange?: (mask: MaskState) => void;
  onResetCrop?: () => void;
  showHighlightClipping?: boolean;
  showShadowClipping?: boolean;
  onRendererReady: (renderer: WebGLPhotoRenderer) => void;
  onRenderFrame: (data?: HistogramData) => void;
  onDropImage: (file: File) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onCompareStart?: () => void;
  onCompareEnd?: () => void;
  onResetAll?: () => void;
}

export const CenterViewport: React.FC<CenterViewportProps> = ({
  imageSource,
  adjustments,
  viewMode,
  zoom,
  onZoomChange,
  isComparing,
  isCropActive = false,
  onToggleCropActive,
  onCropChange,
  onMaskChange,
  onResetCrop,
  showHighlightClipping = false,
  showShadowClipping = false,
  onRendererReady,
  onRenderFrame,
  onDropImage,
  onViewModeChange,
  onCompareStart,
  onCompareEnd,
  onResetAll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // WebGL Canvases
  const editedCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  const rendererRef = useRef<WebGLPhotoRenderer | null>(null);
  const originalRendererRef = useRef<WebGLPhotoRenderer | null>(null);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Split view slider position (0 to 1)
  const [splitPos, setSplitPos] = useState(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Drag and drop overlay
  const [isDragOver, setIsDragOver] = useState(false);

  // Initialize and synchronize WebGL Renderers with canvas DOM elements and image source
  useEffect(() => {
    if (!imageSource) return;

    if (editedCanvasRef.current) {
      if (!rendererRef.current || rendererRef.current.canvas !== editedCanvasRef.current) {
        rendererRef.current = new WebGLPhotoRenderer(editedCanvasRef.current);
        onRendererReady(rendererRef.current);
      }
      rendererRef.current.setImage(imageSource);
    }

    if (originalCanvasRef.current) {
      if (!originalRendererRef.current || originalRendererRef.current.canvas !== originalCanvasRef.current) {
        originalRendererRef.current = new WebGLPhotoRenderer(originalCanvasRef.current);
      }
      originalRendererRef.current.setImage(imageSource);
    }

    // Reset pan when image changes
    setPan({ x: 0, y: 0 });
  }, [imageSource, viewMode]);

  // Keyboard shortcuts (C for crop, Spacebar hold for compare)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        onToggleCropActive && onToggleCropActive(!isCropActive);
      } else if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (onCompareStart) onCompareStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (onCompareEnd) onCompareEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isCropActive, onToggleCropActive, onCompareStart, onCompareEnd]);

  // Non-blocking rAF Render Scheduling Loop
  const rafIdRef = useRef<number | null>(null);

  const triggerRender = () => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;

      if (!imageSource) return;

      const currentAdj = isComparing ? createDefaultAdjustments() : adjustments;

      // In interactive crop mode, display uncropped base photo on WebGL canvas so user can adjust crop box overlay on top
      const renderAdj = isCropActive
        ? {
            ...currentAdj,
            crop: {
              ...currentAdj.crop,
              x: 0,
              y: 0,
              width: 1,
              height: 1,
            },
          }
        : currentAdj;

      let histData: HistogramData | undefined;
      if (rendererRef.current) {
        histData = rendererRef.current.render(renderAdj, showHighlightClipping, showShadowClipping);
      }
      if (
        (viewMode === 'before-after-side' || viewMode === 'before-after-split') &&
        originalRendererRef.current
      ) {
        originalRendererRef.current.render(createDefaultAdjustments());
      }

      onRenderFrame(histData);
    });
  };

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Adjust Canvas dimensions according to aspect ratio and container size, then trigger rAF render
  useEffect(() => {
    if (!containerRef.current || !imageSource) return;

    if (editedCanvasRef.current) {
      if (!rendererRef.current || rendererRef.current.canvas !== editedCanvasRef.current) {
        rendererRef.current = new WebGLPhotoRenderer(editedCanvasRef.current);
        onRendererReady(rendererRef.current);
        rendererRef.current.setImage(imageSource);
      }
    }
    if (originalCanvasRef.current) {
      if (!originalRendererRef.current || originalRendererRef.current.canvas !== originalCanvasRef.current) {
        originalRendererRef.current = new WebGLPhotoRenderer(originalCanvasRef.current);
        originalRendererRef.current.setImage(imageSource);
      }
    }

    const cw = containerRef.current.clientWidth || 800;
    const ch = containerRef.current.clientHeight || 600;

    const imgW = (imageSource as HTMLImageElement).naturalWidth || imageSource.width || 1920;
    const imgH = (imageSource as HTMLImageElement).naturalHeight || imageSource.height || 1080;

    // Calculate effective width & height taking crop bounds & rotation into account
    const activeCrop = isCropActive ? { x: 0, y: 0, width: 1, height: 1 } : adjustments.crop;
    const cropW = imgW * Math.max(0.01, activeCrop.width);
    const cropH = imgH * Math.max(0.01, activeCrop.height);
    const rad = ((adjustments.crop.rotation || 0) * Math.PI) / 180;

    const effW = Math.abs(cropW * Math.cos(rad)) + Math.abs(cropH * Math.sin(rad));
    const effH = Math.abs(cropW * Math.sin(rad)) + Math.abs(cropH * Math.cos(rad));

    const maxCw = viewMode === 'before-after-side' ? cw * 0.42 : cw * 0.85;

    // Calculate aspect fit size
    let w = maxCw;
    let h = (w * effH) / (effW || 1);

    if (h > ch * 0.85) {
      h = ch * 0.85;
      w = (h * effW) / (effH || 1);
    }

    w *= zoom;
    h *= zoom;

    const targetW = Math.max(1, Math.round(w));
    const targetH = Math.max(1, Math.round(h));

    if (editedCanvasRef.current) {
      if (editedCanvasRef.current.width !== targetW) editedCanvasRef.current.width = targetW;
      if (editedCanvasRef.current.height !== targetH) editedCanvasRef.current.height = targetH;
    }

    if (originalCanvasRef.current) {
      if (originalCanvasRef.current.width !== targetW) originalCanvasRef.current.width = targetW;
      if (originalCanvasRef.current.height !== targetH) originalCanvasRef.current.height = targetH;
    }

    triggerRender();
  }, [zoom, imageSource, isComparing, adjustments, viewMode, isCropActive]);

  // Mouse Pan Handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isDraggingSplit) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      setSplitPos(Math.max(0.05, Math.min(0.95, pos)));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    onZoomChange(Math.max(0.1, Math.min(4.0, zoom + delta)));
  };

  // Drag and Drop Handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onDropImage(e.dataTransfer.files[0]);
    }
  };

  return (
    <main
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-1 items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* 🔮 Dynamic Ambient Liquid Gradient Mesh Background */}
      <div className="absolute inset-0 z-0 animate-liquid-mesh bg-gradient-to-br from-slate-950 via-indigo-950/60 via-purple-950/50 to-slate-900 pointer-events-none opacity-90 transition-colors duration-500" />

      {/* Subtle Specular Glow Orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-[100px] pointer-events-none" />

      {/* Comparison Badge */}
      {isComparing && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-blue-600/90 border border-blue-400 px-5 py-2 text-xs font-black text-white shadow-2xl backdrop-blur-md uppercase tracking-wider animate-pulse">
          ORIGINAL UNEDITED PHOTO
        </div>
      )}

      {/* NO IMAGE PLACEHOLDER */}
      {!imageSource && (
        <div className="flex flex-col items-center justify-center p-8 text-center z-10">
          <div className="mb-5 rounded-3xl bg-white/10 p-8 border border-white/20 shadow-2xl backdrop-blur-xl">
            <Upload className="h-12 w-12 text-blue-400" />
          </div>
          <h3 className="text-lg font-black text-white mb-2 uppercase tracking-wider drop-shadow">
            Drag & Drop Your Image
          </h3>
          <p className="text-xs text-neutral-300 max-w-sm mb-4 opacity-80">
            Supports high-resolution JPEGs, PNGs, and WebPs with full 60FPS WebGL GPU photo processing.
          </p>
        </div>
      )}

      {/* SINGLE CANVAS VIEW */}
      {imageSource && viewMode === 'single' && (
        <div
          className="relative flex items-center justify-center transition-transform duration-75 z-10"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <canvas
            ref={editedCanvasRef}
            className="rounded-2xl border border-white/20 bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
          />
          {adjustments.mask && adjustments.mask.type !== 'none' && !isCropActive && editedCanvasRef.current && (
            <InteractiveMaskOverlay
              mask={adjustments.mask}
              onChange={(newMask) => onMaskChange && onMaskChange(newMask)}
              width={editedCanvasRef.current.clientWidth || 800}
              height={editedCanvasRef.current.clientHeight || 600}
            />
          )}
        </div>
      )}

      {/* SPLIT-SCREEN BEFORE / AFTER SLIDER */}
      {imageSource && viewMode === 'before-after-split' && (
        <div
          className="relative flex items-center justify-center z-10"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          {/* Edited Canvas (Full width background) */}
          <canvas
            ref={editedCanvasRef}
            className="rounded-2xl border border-white/20 bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
          />

          {/* Original Canvas clipped by splitPos */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl"
            style={{ width: `${splitPos * 100}%` }}
          >
            <canvas
              ref={originalCanvasRef}
              className="rounded-2xl bg-black"
              style={{
                width: editedCanvasRef.current ? editedCanvasRef.current.clientWidth || '100%' : '100%',
                height: editedCanvasRef.current ? editedCanvasRef.current.clientHeight || '100%' : '100%',
                maxWidth: 'none',
              }}
            />
          </div>

          {/* Interactive Split Drag Handle Bar */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-indigo-500 to-cyan-400 cursor-ew-resize z-20 shadow-2xl hover:w-1.5 transition-all"
            style={{ left: `${splitPos * 100}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full bg-blue-600 border-2 border-white shadow-2xl flex items-center justify-center text-xs font-black text-white">
              ↔
            </div>
          </div>

          {/* Badges */}
          <span className="absolute bottom-4 left-4 z-10 rounded-full bg-black/60 border border-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-mono text-blue-300 font-bold shadow-lg">
            BEFORE
          </span>
          <span className="absolute bottom-4 right-4 z-10 rounded-full bg-black/60 border border-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-mono text-white font-bold shadow-lg">
            AFTER
          </span>
        </div>
      )}

      {/* SIDE-BY-SIDE BEFORE / AFTER VIEW */}
      {imageSource && viewMode === 'before-after-side' && (
        <div
          className="flex items-center gap-6 z-10"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <div className="relative">
            <span className="absolute top-3 left-3 z-10 rounded-full bg-black/70 border border-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-mono text-blue-300 font-bold shadow-lg">
              BEFORE
            </span>
            <canvas
              ref={originalCanvasRef}
              className="rounded-2xl border border-white/20 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            />
          </div>

          <div className="relative">
            <span className="absolute top-3 left-3 z-10 rounded-full bg-black/70 border border-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-mono text-white font-bold shadow-lg">
              AFTER
            </span>
            <canvas
              ref={editedCanvasRef}
              className="rounded-2xl border border-white/20 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>
      )}

      {/* Interactive WebGL Crop & Straighten Overlay */}
      {imageSource && isCropActive && (
        <InteractiveCropOverlay
          crop={adjustments.crop}
          onChange={(newCrop) => onCropChange && onCropChange(newCrop)}
          canvasRef={editedCanvasRef}
          imageWidth={(imageSource as HTMLImageElement).naturalWidth || imageSource.width || 1920}
          imageHeight={(imageSource as HTMLImageElement).naturalHeight || imageSource.height || 1080}
          isCropActive={isCropActive}
          onDone={() => onToggleCropActive && onToggleCropActive(false)}
          onResetCrop={() => onResetCrop && onResetCrop()}
        />
      )}

      {/* 🍎 FLOATING DYNAMIC iOS BOTTOM DOCK */}
      {imageSource && !isCropActive && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 ios-glass-dock animate-fade-in shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-white/30 backdrop-blur-3xl">
          {/* Crop Tool Button */}
          <button
            onClick={() => onToggleCropActive && onToggleCropActive(!isCropActive)}
            title="Interactive Crop & Straighten Tool (C)"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
              isCropActive
                ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/50 ring-2 ring-blue-400'
                : 'ios-glass-button text-neutral-200 hover:text-white'
            }`}
          >
            <Crop className="h-3.5 w-3.5 text-blue-400 drop-shadow" />
            <span className="drop-shadow">Crop</span>
          </button>

          <div className="h-4 w-px bg-white/20" />

          {/* View Modes */}
          <div className="flex items-center gap-1 rounded-full bg-black/40 p-1 border border-white/20 shadow-inner">
            <button
              onClick={() => onViewModeChange && onViewModeChange('single')}
              title="Single View"
              className={`rounded-full p-2 text-xs transition-all active:scale-90 ${
                viewMode === 'single'
                  ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/50 font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Square className="h-4 w-4 drop-shadow" />
            </button>
            <button
              onClick={() => onViewModeChange && onViewModeChange('before-after-split')}
              title="Split View"
              className={`rounded-full p-2 text-xs transition-all active:scale-90 ${
                viewMode === 'before-after-split'
                  ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/50 font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <SplitSquareVertical className="h-4 w-4 drop-shadow" />
            </button>
            <button
              onClick={() => onViewModeChange && onViewModeChange('before-after-side')}
              title="Side-by-Side View"
              className={`rounded-full p-2 text-xs transition-all active:scale-90 ${
                viewMode === 'before-after-side'
                  ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/50 font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Columns2 className="h-4 w-4 drop-shadow" />
            </button>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Quick Zoom Pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 border border-white/20 text-xs font-mono shadow-inner">
            <button
              onClick={() => onZoomChange(Math.max(0.1, zoom - 0.25))}
              className="text-neutral-300 hover:text-white transition-colors active:scale-90 p-0.5"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-extrabold text-blue-400 drop-shadow">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => onZoomChange(Math.min(4.0, zoom + 0.25))}
              className="text-neutral-300 hover:text-white transition-colors active:scale-90 p-0.5"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onZoomChange(1.0)}
              className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold uppercase text-neutral-200 hover:text-white border border-white/20 hover:bg-white/25 active:scale-95"
            >
              Fit
            </button>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Compare Button */}
          <button
            onMouseDown={onCompareStart}
            onMouseUp={onCompareEnd}
            onMouseLeave={onCompareEnd}
            onTouchStart={onCompareStart}
            onTouchEnd={onCompareEnd}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
              isComparing
                ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/50'
                : 'ios-glass-button text-neutral-200 hover:text-white'
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-blue-400 drop-shadow" />
            <span className="drop-shadow">Hold Original</span>
          </button>
        </div>
      )}

      {/* DRAG OVERLAY */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-600/30 backdrop-blur-md border-4 border-dashed border-blue-400">
          <div className="rounded-3xl bg-black/70 border border-white/30 p-8 text-center text-white font-bold shadow-2xl backdrop-blur-xl">
            <Upload className="mx-auto h-12 w-12 mb-3 text-blue-400 animate-bounce" />
            Drop your image to load in Lumina Studio
          </div>
        </div>
      )}
    </main>
  );
};
