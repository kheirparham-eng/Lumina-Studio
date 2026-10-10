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
  RotateCcw,
  Palette,
  Clapperboard,
  SunMedium,
  Moon,
  Sliders,
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const nonePreset = presets.find((p) => p.id === 'preset-original') || {
    id: 'preset-original',
    name: 'Reset to None',
    category: 'Built-in',
    description: 'Revert all color grading and adjustments to original neutral balance.',
    format: 'builtin',
    adjustments: {},
  };

  const activePreset = presets.find((p) => p.id === activePresetId && p.id !== 'preset-original');

  // Filter presets by search query
  const searchFiltered = presets.filter((p) => {
    if (p.id === 'preset-original') return false; // Handled by top Reset button
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      (p.format && p.format.toLowerCase().includes(q))
    );
  });

  // Filter by category tab
  const displayPresets = searchFiltered.filter((p) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Custom') {
      return (
        p.category === 'My Custom Presets' ||
        p.category === 'User' ||
        p.category === 'Imported XMP' ||
        p.category === 'Imported LRTemplates'
      );
    }
    return p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Calculate category counts
  const categoryCounts: Record<string, number> = {
    All: searchFiltered.length,
    Film: searchFiltered.filter((p) => p.category.toLowerCase() === 'film').length,
    Cinematic: searchFiltered.filter((p) => p.category.toLowerCase() === 'cinematic').length,
    Studio: searchFiltered.filter((p) => p.category.toLowerCase() === 'studio').length,
    'B&W': searchFiltered.filter((p) => p.category.toLowerCase() === 'b&w').length,
  };

  const customCount = searchFiltered.filter(
    (p) =>
      p.category === 'My Custom Presets' ||
      p.category === 'User' ||
      p.category === 'Imported XMP' ||
      p.category === 'Imported LRTemplates'
  ).length;

  if (customCount > 0) {
    categoryCounts['Custom'] = customCount;
  }

  const categoryTabs = ['All', 'Film', 'Cinematic', 'Studio', 'B&W'];
  if (customCount > 0) {
    categoryTabs.push('Custom');
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Film':
        return <Film className="h-3.5 w-3.5 text-amber-400" />;
      case 'Cinematic':
        return <Clapperboard className="h-3.5 w-3.5 text-cyan-400" />;
      case 'Studio':
        return <SunMedium className="h-3.5 w-3.5 text-rose-400" />;
      case 'B&W':
        return <Moon className="h-3.5 w-3.5 text-neutral-300" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-blue-400" />;
    }
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
            Supports Adobe Camera Raw <strong className="text-blue-400">.xmp</strong> and Lightroom Classic <strong className="text-amber-400">.lrtemplate</strong> files
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
      <div className="flex border-b border-white/10 p-1.5 gap-1.5 liquid-glass-pill m-2 mb-0">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'liquid-glass-accent text-white shadow-lg shadow-fuchsia-500/35'
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
              ? 'liquid-glass-accent text-white shadow-lg shadow-fuchsia-500/35'
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
              ? 'liquid-glass-accent text-white shadow-lg shadow-fuchsia-500/35'
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
            {/* Quick "Reset to None" Action Button */}
            <button
              onClick={() => onSelectPreset(nonePreset)}
              className={`flex w-full items-center justify-between rounded-2xl p-2.5 text-xs font-bold transition-all cursor-pointer border ${
                activePresetId === 'preset-original' || !activePresetId
                  ? 'bg-fuchsia-950/40 border-fuchsia-400/80 text-white shadow-md shadow-fuchsia-500/25 ring-1 ring-fuchsia-400/50'
                  : 'liquid-glass-btn text-neutral-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-neutral-200">
                  <RotateCcw className="h-3.5 w-3.5 text-fuchsia-400" />
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-xs">Reset to None</div>
                  <div className="text-[10px] text-neutral-400 font-normal">
                    Revert all color grading to neutral
                  </div>
                </div>
              </div>
              {(activePresetId === 'preset-original' || !activePresetId) && (
                <div className="flex items-center gap-1 rounded-full bg-fuchsia-500/40 px-2 py-0.5 text-[10px] text-fuchsia-200 border border-fuchsia-400/40 font-mono">
                  <Check className="h-3 w-3 text-fuchsia-300" />
                  <span>Active</span>
                </div>
              )}
            </button>

            {/* Active Preset Title & Interactive Intensity Slider */}
            {activePreset && (
              <div className="rounded-2xl border border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-950/30 via-purple-950/25 to-indigo-950/30 p-3 space-y-2.5 shadow-xl backdrop-blur-xl transition-all">
                {/* Active Preset Title */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-black text-white min-w-0">
                    <Sparkles className="h-4 w-4 text-fuchsia-400 shrink-0" />
                    <span className="truncate max-w-[150px] font-bold">{activePreset.name}</span>
                    <span className="rounded bg-fuchsia-500/30 px-1.5 py-0.5 text-[9px] uppercase font-mono text-fuchsia-200 border border-fuchsia-400/40 shrink-0">
                      {activePreset.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-xs font-black text-fuchsia-300 bg-black/50 px-2 py-0.5 rounded-lg border border-fuchsia-400/30">
                      {presetIntensity}%
                    </span>
                  </div>
                </div>

                {/* Intensity Slider (0% to 100%) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-wider text-neutral-400">
                    <span>Preset Intensity</span>
                    <span>Interpolated Delta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">0%</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={presetIntensity}
                      onChange={(e) => onPresetIntensityChange(parseInt(e.target.value))}
                      className="w-full accent-fuchsia-400 cursor-pointer ios-slider"
                    />
                    <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">100%</span>
                  </div>

                  {/* Quick Intensity Chips */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {[25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => onPresetIntensityChange(val)}
                        className={`flex-1 rounded-lg py-0.5 text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                          presetIntensity === val
                            ? 'liquid-glass-accent text-white shadow-sm'
                            : 'liquid-glass-btn text-neutral-400 hover:text-white'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Category-Filtered Pill Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                <span>Categories</span>
                <span className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-extrabold">{searchFiltered.length} Presets</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar scrollbar-none">
                {categoryTabs.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count = categoryCounts[cat] ?? 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'liquid-glass-accent text-white shadow-md shadow-fuchsia-500/35'
                          : 'liquid-glass-subtle text-neutral-400 hover:text-white'
                      }`}
                    >
                      {getCategoryIcon(cat)}
                      <span>{cat}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono ${
                          isSelected ? 'bg-white/35 text-white' : 'bg-white/10 text-neutral-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={`Search ${selectedCategory === 'All' ? 'all' : selectedCategory} presets...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-white/20 bg-black/40 pl-9 pr-8 py-1.5 text-xs text-white placeholder-neutral-400 focus:border-fuchsia-400 focus:outline-none focus:ring-1 focus:ring-fuchsia-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Preset Actions Toolbar */}
            <div className="flex items-center gap-1.5 relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xmp,.lrtemplate,.json,.xml"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="liquid-glass-btn flex flex-1 items-center justify-center gap-1.5 rounded-full border-fuchsia-500/35 px-2.5 py-1.5 text-xs font-bold text-fuchsia-200 hover:border-fuchsia-400 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Import .xmp or .lrtemplate preset files"
              >
                <Upload className="h-3.5 w-3.5 text-fuchsia-400 shrink-0" />
                <span className="truncate">Import Preset</span>
              </button>

              <button
                onClick={() => setShowSavePresetInput(!showSavePresetInput)}
                className="liquid-glass-btn flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                title="Save current adjustments as custom preset"
              >
                <Plus className="h-3.5 w-3.5 text-fuchsia-400" />
                <span>Save</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Export presets as .xmp or .lrtemplate"
                  className="liquid-glass-btn flex items-center justify-center rounded-full p-2 text-neutral-200 hover:text-white transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-fuchsia-400" />
                </button>

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
                        <div className="text-[10px] text-neutral-400">ProStudio schema format</div>
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

            {/* Responsive Thumbnail Cards Grid */}
            <div className="space-y-2 pt-1">
              {displayPresets.length === 0 ? (
                <div className="p-6 text-center text-neutral-400 bg-black/20 rounded-2xl border border-white/10">
                  <Sliders className="h-8 w-8 mx-auto mb-2 text-neutral-500 opacity-60" />
                  <p className="text-xs font-bold text-neutral-300">No Presets Found</p>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Try adjusting your search query or selecting a different category.
                  </p>
                </div>
              ) : (
                displayPresets.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  const thumbUrl = presetThumbnails[preset.id];

                  const hasToneCurve =
                    preset.adjustments?.toneCurve &&
                    (preset.adjustments.toneCurve.master.length > 2 ||
                      preset.adjustments.toneCurve.red.length > 2 ||
                      preset.adjustments.toneCurve.blue.length > 2);

                  const hasHsl = !!preset.adjustments?.hsl;
                  const hasColorGrading = !!preset.adjustments?.colorGrading;
                  const hasGrain = !!preset.adjustments?.grain && preset.adjustments.grain > 0;
                  const hasClarity = !!preset.adjustments?.clarity && preset.adjustments.clarity !== 0;

                  return (
                    <div
                      key={preset.id}
                      className={`group relative flex items-center justify-between rounded-2xl p-2.5 text-left transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-indigo-950/40 border-fuchsia-400 shadow-xl shadow-fuchsia-500/25 ring-1 ring-fuchsia-400/60 text-white'
                          : 'liquid-glass-subtle hover:bg-white/10 hover:border-white/30 text-neutral-200'
                      }`}
                    >
                      {/* Main Select Button */}
                      <button
                        onClick={() => onSelectPreset(preset)}
                        className="flex flex-1 items-center gap-3 min-w-0 text-left cursor-pointer"
                      >
                        {/* Thumbnail Preview Card */}
                        <div className="relative h-13 w-18 shrink-0 overflow-hidden rounded-xl bg-neutral-900 border border-white/20 shadow-md">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={preset.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-black p-1 text-center">
                              {getCategoryIcon(preset.category)}
                              <span className="text-[8px] font-mono font-bold text-neutral-400 mt-0.5 uppercase">
                                {preset.category}
                              </span>
                            </div>
                          )}

                          {/* Active Overlay with Checkmark */}
                          {isActive && (
                            <div className="absolute inset-0 bg-fuchsia-600/40 border-2 border-fuchsia-400 flex items-center justify-center">
                              <Check className="h-4 w-4 text-white drop-shadow-md stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* Text Details & Badges */}
                        <div className="min-w-0 flex-1 pr-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs truncate max-w-[130px] text-white">
                              {preset.name}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase tracking-wider ${
                                preset.category === 'Film'
                                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400/30'
                                  : preset.category === 'Cinematic'
                                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/30'
                                  : preset.category === 'Studio'
                                  ? 'bg-rose-500/25 text-rose-300 border border-rose-400/30'
                                  : preset.category === 'B&W'
                                  ? 'bg-neutral-500/25 text-neutral-200 border border-neutral-400/30'
                                  : 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/30'
                              }`}
                            >
                              {preset.category}
                            </span>
                          </div>

                          {/* Feature tags */}
                          <div className="flex items-center gap-1 mt-1 text-[8px] text-neutral-400 font-mono flex-wrap">
                            {hasGrain && (
                              <span className="rounded bg-white/10 px-1 py-0.2 text-neutral-300">
                                Grain {preset.adjustments?.grain}
                              </span>
                            )}
                            {hasToneCurve && (
                              <span className="rounded bg-white/10 px-1 py-0.2 text-neutral-300">
                                Curve
                              </span>
                            )}
                            {hasColorGrading && (
                              <span className="rounded bg-white/10 px-1 py-0.2 text-neutral-300">
                                Grade
                              </span>
                            )}
                            {hasHsl && (
                              <span className="rounded bg-white/10 px-1 py-0.2 text-neutral-300">
                                HSL
                              </span>
                            )}
                            {hasClarity && (
                              <span className="rounded bg-white/10 px-1 py-0.2 text-neutral-300">
                                Clarity {preset.adjustments?.clarity! > 0 ? `+${preset.adjustments?.clarity}` : preset.adjustments?.clarity}
                              </span>
                            )}
                          </div>

                          {preset.description && (
                            <p className="mt-1 text-[9px] text-neutral-400 line-clamp-1 opacity-80">
                              {preset.description}
                            </p>
                          )}
                        </div>
                      </button>

                      {/* Action buttons (Export / Delete) */}
                      <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
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
                          className="text-neutral-400 hover:text-fuchsia-400 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </button>

                        {preset.category === 'My Custom Presets' || preset.category === 'User' ? (
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
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Clear All Custom / Imported Presets Button */}
            {onClearAllCustomPresets && customCount > 0 && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    if (window.confirm('Reset all custom presets? Imported and user presets will be removed.')) {
                      onClearAllCustomPresets();
                    }
                  }}
                  className="text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors underline cursor-pointer"
                >
                  Reset Custom Presets
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
