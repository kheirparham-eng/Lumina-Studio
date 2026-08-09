import React, { useState } from 'react';
import { PhotoAdjustments, ImageInfo } from '../types/editor';
import { WebGLPhotoRenderer } from '../lib/webgl/renderer';
import { Download, X, CheckCircle, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  adjustments: PhotoAdjustments;
  imageInfo: ImageInfo | null;
  renderer: WebGLPhotoRenderer | null;
  fullResImageSource?: HTMLImageElement | HTMLCanvasElement | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  adjustments,
  imageInfo,
  renderer,
  fullResImageSource,
}) => {
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(92);
  const [scale, setScale] = useState(1.0);
  const [customFilename, setCustomFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const originalWidth = imageInfo?.width || 1920;
  const originalHeight = imageInfo?.height || 1080;

  const targetWidth = Math.round(originalWidth * adjustments.crop.width * scale);
  const targetHeight = Math.round(originalHeight * adjustments.crop.height * scale);

  const defaultName = imageInfo?.name.replace(/\.[^/.]+$/, '') || 'edited_photo';
  const finalFilename = `${customFilename.trim() || defaultName}_edited.${
    format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp'
  }`;

  const handleExportDownload = async () => {
    if (!renderer) return;
    setIsExporting(true);

    try {
      const blob = await renderer.exportImage(
        adjustments,
        format,
        quality / 100,
        scale,
        fullResImageSource || undefined
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xl p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border-1.5 border-white/30 bg-gradient-to-b from-white/15 via-white/5 to-black/60 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.8),_inset_0_1.5px_1.5px_rgba(255,255,255,0.4)] text-white space-y-5 backdrop-blur-3xl overflow-hidden">
        {/* Specular Edge Highlight Spot */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-500/25 border border-blue-400/40 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]">
              <Sparkles className="h-4 w-4 drop-shadow" />
            </div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white drop-shadow">Export High-Res Photo</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-300 hover:bg-white/15 hover:text-white transition-all cursor-pointer active:scale-90 border border-transparent hover:border-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 relative z-10">
          {/* File Name */}
          <div>
            <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-neutral-300">
              File Name
            </label>
            <input
              type="text"
              placeholder={defaultName}
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-black/50 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner font-mono"
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-neutral-300">
              Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'JPEG (.jpg)', val: 'image/jpeg' },
                { label: 'PNG (.png)', val: 'image/png' },
                { label: 'WebP (.webp)', val: 'image/webp' },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  onClick={() => setFormat(val as any)}
                  className={`rounded-xl py-2 text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
                    format === val
                      ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/40'
                      : 'bg-black/40 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Compression (for JPEG & WebP) */}
          {format !== 'image/png' && (
            <div>
              <div className="mb-1.5 flex justify-between text-[10px] font-extrabold uppercase tracking-wider">
                <span className="text-neutral-300">Quality Compression</span>
                <span className="font-mono text-blue-400 font-bold">{quality}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full accent-blue-400 cursor-pointer ios-slider"
              />
            </div>
          )}

          {/* Scale Resolution */}
          <div>
            <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-neutral-300">
              Output Scaling
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '100% (Full)', s: 1.0 },
                { label: '75%', s: 0.75 },
                { label: '50%', s: 0.5 },
                { label: '25%', s: 0.25 },
              ].map(({ label, s }) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`rounded-xl py-1.5 text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
                    scale === s
                      ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/40'
                      : 'bg-black/40 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions Summary */}
          <div className="rounded-2xl bg-black/50 p-3.5 border border-white/15 text-xs font-mono text-neutral-300 flex justify-between items-center shadow-inner">
            <span>Dimensions:</span>
            <span className="text-blue-400 font-extrabold text-sm drop-shadow">
              {targetWidth} × {targetHeight} px
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/15 relative z-10">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="rounded-full ios-glass-button px-4 py-2 text-xs font-bold text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>

          <button
            onClick={handleExportDownload}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-full ios-glossy-blue px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-blue-500/40 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {exportComplete ? (
              <>
                <CheckCircle className="h-4 w-4 text-white drop-shadow" />
                <span className="drop-shadow">Downloaded!</span>
              </>
            ) : isExporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="drop-shadow">Rendering...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 drop-shadow" />
                <span className="drop-shadow">Download Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
