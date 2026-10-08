import React, { useState, useRef } from 'react';
import {
  HistogramData,
  Preset,
  HistoryItem,
  ImageInfo,
} from '../types/editor';
import { HistogramView } from './HistogramView';
import { SAMPLE_PHOTOS, SamplePhoto } from '../lib/sampleImages';
import {
  SlidersHorizontal,
  History,
  Image as ImageIcon,
  Download,
  Upload,
  Info,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  Search,
  Sparkles,
  Film,
  Camera,
  Layers,
  FileCode,
  FileCheck,
  Bookmark,
  FileDown,
} from 'lucide-react';

interface LeftSidebarProps {
  histogramData: HistogramData;
  showHighlightClipping: boolean;
  showShadowClipping: boolean;
  onToggleHighlightClipping: () => void;
  onToggleShadowClipping: () => void;

  presets: Preset[];
  activePresetId: string | null;
  presetIntensity: number;
  onPresetIntensityChange: (intensity: number) => void;
  presetThumbnails: Record<string, string>;
  onSelectPreset: (preset: Preset) => void;
  onImportPresetFiles?: (files: FileList | File[]) => void;
  onExportXmp?: (preset?: Preset) => void;
  onExportLrtemplate?: (preset?: Preset) => void;
  onExportJson?: (preset?: Preset) => void;
  onSaveCustomPreset: (name: string) => void;
  onDeleteCustomPreset: (id: string) => void;
  onClearAllCustomPresets?: () => void;

  // Optional backwards-compat props
  onImportPresetJSON?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCurrentPresetJSON?: () => void;

  history: HistoryItem[];
  currentHistoryIndex: number;
  onSelectHistoryItem: (index: number) => void;

  imageInfo: ImageInfo | null;
  onSelectSamplePhoto: (photo: SamplePhoto) => void;
  activeSampleId: string | null;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  histogramData,
  showHighlightClipping,
  showShadowClipping,
  onToggleHighlightClipping,
  onToggleShadowClipping,

  presets,
  activePresetId,
  presetIntensity,
  onPresetIntensityChange,
  presetThumbnails,
  onSelectPreset,
  onImportPresetFiles,
  onExportXmp,
  onExportLrtemplate,
  onExportJson,
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onClearAllCustomPresets,
  onImportPresetJSON,
  onExportCurrentPresetJSON,

  history,
  currentHistoryIndex,
  onSelectHistoryItem,

  imageInfo,
  onSelectSamplePhoto,
  activeSampleId,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'history' | 'samples'>('presets');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accordion expanded state for categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Lightroom XMP Presets': true,
    'Lightroom Classic (.lrtemplate)': true,
    'Imported XMP': true,
    'Imported LRTemplates': true,
    'My Custom Presets': true,
    User: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: prev[cat] === undefined ? false : !prev[cat],
    }));
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    onSaveCustomPreset(newPresetName.trim());
    setNewPresetName('');
    setShowSavePresetInput(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onImportPresetFiles) {
        onImportPresetFiles(e.target.files);
      } else if (onImportPresetJSON) {
        onImportPresetJSON(e);
      }
    }
    // Reset file input so re-selecting same file triggers change
    e.target.value = '';
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onImportPresetFiles) {
        onImportPresetFiles(e.dataTransfer.files);
      }
    }
  };

  const megapixel = imageInfo
    ? ((imageInfo.width * imageInfo.height) / 1000000).toFixed(1)
    : '0';

  const activePreset = presets.find((p) => p.id === activePresetId);

  // Filter presets by search
  const filteredPresets = presets.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      (p.format && p.format.toLowerCase().includes(q))
    );
  });

  // Extract unique categories (excluding neutral 'Built-in' reset which has its own top row)
  const categories: string[] = Array.from(
    new Set<string>(filteredPresets.filter((p) => p.id !== 'preset-original').map((p) => p.category))
  );

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('xmp')) return <FileCode className="h-3.5 w-3.5 text-blue-400" />;
    if (lower.includes('lrtemplate') || lower.includes('classic'))
      return <Film className="h-3.5 w-3.5 text-amber-400" />;
    if (lower.includes('custom') || lower.includes('user'))
      return <Bookmark className="h-3.5 w-3.5 text-emerald-400" />;
    return <Layers className="h-3.5 w-3.5 text-purple-400" />;
  };

  return (
    <aside
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`ios-glass-card flex h-full w-full md:w-84 flex-col select-none z-20 shrink-0 transition-all duration-300 relative ${
        isDraggingOver ? 'ring-2 ring-blue-500 ring-inset bg-blue-950/30' : ''
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center pointer-events-none border-2 border-dashed border-blue-400 rounded-3xl m-2">
          <Upload className="h-12 w-12 text-blue-400 animate-bounce mb-3" />
          <h3 className="text-base font-bold text-white">Drop Lightroom Presets Here</h3>
          <p className="text-xs text-neutral-300 mt-1 max-w-xs">
            Supports authentic Adobe Camera Raw <strong className="text-blue-400">.xmp</strong> and Lightroom Classic <strong className="text-amber-400">.lrtemplate</strong> files
          </p>
        </div>
      )}

      {/* 1. Histogram View */}
      <div className="p-3 border-b border-white/10">
        <HistogramView
          data={histogramData}
          showHighlightClipping={showHighlightClipping}
          showShadowClipping={showShadowClipping}
          onToggleHighlightClipping={onToggleHighlightClipping}
          onToggleShadowClipping={onToggleShadowClipping}
        />
      </div>

      {/* 2. Photo EXIF Summary */}
      {imageInfo && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-black/20 text-[10px] font-mono text-neutral-300">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <Info className="h-3 w-3 text-blue-400 shrink-0" />
            <span className="truncate font-semibold">{imageInfo.name}</span>
          </div>
          <span className="shrink-0 text-blue-400 font-bold">
            {imageInfo.width}×{imageInfo.height} ({megapixel} MP)
          </span>
        </div>
      )}

      {/* 3. Section Navigation Segmented Glass Tabs */}
      <div className="flex border-b border-white/10 bg-black/30 p-1.5 gap-1.5 backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/40'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 drop-shadow" />
          Presets
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/40'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <History className="h-3.5 w-3.5 drop-shadow" />
          History
          <span className="ml-0.5 rounded-full bg-white/25 px-1.5 py-0.2 text-[9px] text-white font-mono font-bold shadow-inner border border-white/20">
            {history.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('samples')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'samples'
              ? 'ios-glossy-blue text-white shadow-lg shadow-blue-500/40'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5 drop-shadow" />
          Samples
        </button>
      </div>

      {/* 4. Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search presets (.xmp, .lrtemplate)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-white/15 bg-black/30 pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
              />
            </div>

            {/* Active Preset Intensity Slider */}
            {activePreset && activePreset.id !== 'preset-original' && (
              <div className="rounded-2xl border border-blue-500/40 bg-blue-500/15 p-3 space-y-2 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-extrabold text-blue-300">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    <span className="truncate max-w-[160px]">{activePreset.name}</span>
                    {activePreset.format && (
                      <span className="rounded bg-blue-500/30 px-1 py-0.2 text-[9px] uppercase font-mono text-blue-200 border border-blue-400/30">
                        {activePreset.format}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-200">
                    {presetIntensity}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-300 font-bold">0%</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={presetIntensity}
                    onChange={(e) => onPresetIntensityChange(parseInt(e.target.value))}
                    className="w-full accent-blue-400 cursor-pointer ios-slider"
                  />
                  <span className="text-[9px] uppercase tracking-wider text-neutral-300 font-bold">100%</span>
                </div>
              </div>
            )}

            {/* Action Bar: Import XMP/lrtemplate, Export, Save Custom */}
            <div className="flex items-center gap-1.5 relative">
              {/* Hidden file input supporting multiple .xmp, .lrtemplate, .json */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xmp,.lrtemplate,.json,.xml"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Import Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-600/25 px-2.5 py-1.5 text-xs font-bold text-blue-200 hover:bg-blue-600/35 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Import .xmp or .lrtemplate preset files"
              >
                <Upload className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Import Preset</span>
              </button>

              {/* Save Custom Button */}
              <button
                onClick={() => setShowSavePresetInput(!showSavePresetInput)}
                className="flex items-center justify-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-white/20 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Save current adjustments as a preset"
              >
                <Plus className="h-3.5 w-3.5 text-white" />
                <span>Save</span>
              </button>

              {/* Export Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Export presets as .xmp or .lrtemplate"
                  className="ios-glass-button flex items-center justify-center rounded-full p-2 text-neutral-200 hover:text-white transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-blue-400" />
                </button>

                {/* Export Dropdown Menu */}
                {showExportMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-neutral-900/95 border border-white/20 p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-white/10 mb-1">
                      Export Current Adjustments
                    </div>
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        if (onExportXmp) onExportXmp();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-neutral-200 hover:bg-blue-600/30 hover:text-white transition-colors cursor-pointer"
                    >
                      <FileCode className="h-3.5 w-3.5 text-blue-400" />
                      <div>
                        <div className="font-bold">Lightroom XMP (.xmp)</div>
                        <div className="text-[10px] text-neutral-400">Adobe Camera Raw / CC standard</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        if (onExportLrtemplate) onExportLrtemplate();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-neutral-200 hover:bg-amber-600/30 hover:text-white transition-colors cursor-pointer"
                    >
                      <Film className="h-3.5 w-3.5 text-amber-400" />
                      <div>
                        <div className="font-bold">Lightroom Classic (.lrtemplate)</div>
                        <div className="text-[10px] text-neutral-400">Legacy Classic Lua preset</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        if (onExportJson) onExportJson();
                        else if (onExportCurrentPresetJSON) onExportCurrentPresetJSON();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-neutral-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <div>
                        <div className="font-bold">JSON Preset (.json)</div>
                        <div className="text-[10px] text-neutral-400">Web / Lumina Studio format</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Save Preset Input Modal */}
            {showSavePresetInput && (
              <div className="rounded-2xl bg-black/60 p-3 border border-blue-500/40 space-y-2 backdrop-blur-lg">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                  Save Custom Preset
                </label>
                <input
                  type="text"
                  placeholder="Preset Name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                  className="w-full rounded-lg bg-black/50 px-2.5 py-1.5 text-xs text-white border border-white/20 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSavePresetInput(false)}
                    className="rounded-full px-3 py-1 text-xs text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePreset}
                    className="rounded-full bg-blue-600 px-3.5 py-1 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer active:scale-95 shadow-md"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Reset to Original Balance Button */}
            <button
              onClick={() => {
                const orig = presets.find((p) => p.id === 'preset-original');
                if (orig) onSelectPreset(orig);
              }}
              className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs font-semibold transition-all cursor-pointer border ${
                activePresetId === 'preset-original'
                  ? 'bg-blue-600/30 border-blue-400/80 text-blue-300 font-bold shadow-md'
                  : 'bg-black/20 border-white/10 text-neutral-200 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Camera className="h-3.5 w-3.5 text-neutral-400" />
                <span>Reset to Original Neutral Balance</span>
              </div>
              {activePresetId === 'preset-original' && <Check className="h-4 w-4 text-blue-400" />}
            </button>

            {/* Preset Categories List */}
            <div className="space-y-2">
              {categories.map((category) => {
                const categoryPresets = filteredPresets.filter((p) => p.category === category);
                if (categoryPresets.length === 0) return null;

                const isExpanded = expandedCategories[category] !== false;

                return (
                  <div
                    key={category}
                    className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden backdrop-blur-md"
                  >
                    {/* Category Accordion Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center justify-between p-2.5 text-left text-xs font-bold text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        {getCategoryIcon(category)}
                        <span className="truncate">{category}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-neutral-300 font-mono">
                          {categoryPresets.length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
                      )}
                    </button>

                    {/* Preset Grid Cards */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 gap-1.5 p-2 bg-black/30 border-t border-white/10">
                        {categoryPresets.map((preset) => {
                          const isActive = activePresetId === preset.id;
                          const thumbUrl = presetThumbnails[preset.id];

                          const hasToneCurve =
                            preset.adjustments?.toneCurve &&
                            (preset.adjustments.toneCurve.master.length > 2 ||
                              preset.adjustments.toneCurve.red.length > 2 ||
                              preset.adjustments.toneCurve.blue.length > 2);

                          const hasHsl = !!preset.adjustments?.hsl;
                          const hasColorGrading = !!preset.adjustments?.colorGrading;

                          return (
                            <div
                              key={preset.id}
                              className={`group relative flex items-center justify-between rounded-xl p-2 text-left transition-all cursor-pointer border ${
                                isActive
                                  ? 'bg-blue-600/30 border-blue-400/80 shadow-lg shadow-blue-500/20 text-white'
                                  : 'bg-black/20 hover:bg-white/10 border-white/5 hover:border-white/20 text-neutral-200'
                              }`}
                            >
                              {/* Main Select Button */}
                              <button
                                onClick={() => onSelectPreset(preset)}
                                className="flex flex-1 items-center gap-2.5 min-w-0 text-left cursor-pointer"
                              >
                                {/* Thumbnail Preview */}
                                <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-black/50 border border-white/15 shadow-sm">
                                  {thumbUrl ? (
                                    <img
                                      src={thumbUrl}
                                      alt={preset.name}
                                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-[8px] text-neutral-500 font-mono">
                                      {preset.format?.toUpperCase() || 'PRESET'}
                                    </div>
                                  )}
                                  {isActive && (
                                    <div className="absolute inset-0 bg-blue-500/35 border-2 border-blue-400 flex items-center justify-center">
                                      <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                                    </div>
                                  )}
                                </div>

                                {/* Text Details & Badges */}
                                <div className="min-w-0 flex-1 pr-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs truncate max-w-[140px]">
                                      {preset.name}
                                    </span>
                                    {preset.format && (
                                      <span
                                        className={`rounded px-1 py-0.2 text-[8px] font-mono font-bold uppercase tracking-wider ${
                                          preset.format === 'xmp'
                                            ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
                                            : preset.format === 'lrtemplate'
                                            ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                                            : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                                        }`}
                                      >
                                        .{preset.format}
                                      </span>
                                    )}
                                  </div>

                                  {/* Feature tags */}
                                  <div className="flex items-center gap-1 mt-0.5 text-[8px] text-neutral-400 font-mono">
                                    {hasToneCurve && (
                                      <span className="rounded bg-white/10 px-1 py-0.2 text-neutral-300">
                                        Curve
                                      </span>
                                    )}
                                    {hasHsl && (
                                      <span className="rounded bg-white/10 px-1 py-0.2 text-neutral-300">
                                        HSL
                                      </span>
                                    )}
                                    {hasColorGrading && (
                                      <span className="rounded bg-white/10 px-1 py-0.2 text-neutral-300">
                                        Grade
                                      </span>
                                    )}
                                  </div>

                                  {preset.description && (
                                    <p className="mt-0.5 text-[9px] text-neutral-400 opacity-80 line-clamp-1">
                                      {preset.description}
                                    </p>
                                  )}
                                </div>
                              </button>

                              {/* Action buttons (Export / Delete) */}
                              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                {/* Export specific preset */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (preset.format === 'lrtemplate' && onExportLrtemplate) {
                                      onExportLrtemplate(preset);
                                    } else if (onExportXmp) {
                                      onExportXmp(preset);
                                    }
                                  }}
                                  title={`Export "${preset.name}" as ${
                                    preset.format === 'lrtemplate' ? '.lrtemplate' : '.xmp'
                                  }`}
                                  className="text-neutral-400 hover:text-blue-400 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                  <FileDown className="h-3.5 w-3.5" />
                                </button>

                                {/* Delete preset (if not built-in original) */}
                                {preset.id !== 'preset-original' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteCustomPreset(preset.id);
                                    }}
                                    title="Delete preset"
                                    className="text-neutral-400 hover:text-red-400 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Clear All Custom / Imported Presets Button */}
            {onClearAllCustomPresets && presets.length > 1 && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    if (window.confirm('Reset all presets to default? Custom and imported presets will be removed.')) {
                      onClearAllCustomPresets();
                    }
                  }}
                  className="text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors underline cursor-pointer"
                >
                  Reset Presets Library
                </button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-neutral-400 pb-1.5 border-b border-white/10">
              <span>Editing Timeline</span>
              <span className="font-mono text-blue-400">{history.length} Steps</span>
            </div>

            <div className="relative space-y-1.5 pl-3 border-l border-white/15">
              {history.map((item, idx) => {
                const isActive = idx === currentHistoryIndex;
                const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectHistoryItem(idx)}
                    className={`group relative flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/30 border border-blue-400/80 text-blue-300 font-bold shadow-md'
                        : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span
                      className={`absolute -left-[17px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border transition-all ${
                        isActive
                          ? 'border-blue-400 bg-blue-500 scale-125'
                          : 'border-white/30 bg-neutral-800 group-hover:border-white'
                      }`}
                    />
                    <span className="truncate pr-2 font-medium">{item.label}</span>
                    <span className="shrink-0 font-mono text-[9px] text-neutral-400">
                      {timeStr}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SAMPLES TAB */}
        {activeTab === 'samples' && (
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_PHOTOS.map((sample) => {
              const isSelected = activeSampleId === sample.id;
              return (
                <button
                  key={sample.id}
                  onClick={() => onSelectSamplePhoto(sample)}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-400 ring-2 ring-blue-500/40 shadow-lg'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="relative aspect-3/2 w-full overflow-hidden bg-neutral-900">
                    <img
                      src={sample.url}
                      alt={sample.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute right-1.5 top-1.5 rounded-full bg-blue-500 p-0.5 text-white shadow">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="p-1.5 bg-black/40">
                    <div className="truncate text-[11px] font-bold text-white">
                      {sample.title}
                    </div>
                    <div className="truncate text-[9px] text-neutral-400">
                      {sample.category}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
