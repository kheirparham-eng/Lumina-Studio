import React, { useState } from 'react';
import {
  HistogramData,
  Preset,
  PresetCategory,
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
  Clapperboard,
  User,
  Trees,
  Palette,
  Coffee,
  Bookmark,
  Camera,
  Building2,
  Moon,
  Utensils,
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
  onImportPresetJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCurrentPresetJSON: () => void;
  onSaveCustomPreset: (name: string) => void;
  onDeleteCustomPreset: (id: string) => void;

  history: HistoryItem[];
  currentHistoryIndex: number;
  onSelectHistoryItem: (index: number) => void;

  imageInfo: ImageInfo | null;
  onSelectSamplePhoto: (photo: SamplePhoto) => void;
  activeSampleId: string | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Commercial & Studio Editorial': <Camera className="h-3.5 w-3.5 text-rose-400" />,
  'Fine Art Architecture & Urban': <Building2 className="h-3.5 w-3.5 text-cyan-400" />,
  'Professional Landscape & Nature': <Trees className="h-3.5 w-3.5 text-emerald-400" />,
  'Night & High-ISO Street Photography': <Moon className="h-3.5 w-3.5 text-purple-400" />,
  'Classic Analog Film Emulations': <Film className="h-3.5 w-3.5 text-amber-400" />,
  'Food & Product Photography': <Utensils className="h-3.5 w-3.5 text-orange-400" />,
  'Cinematic & Film': <Film className="h-3.5 w-3.5 text-indigo-400" />,
  'Subject-Focused': <User className="h-3.5 w-3.5 text-cyan-400" />,
  'Vintage & Analog Film': <Film className="h-3.5 w-3.5 text-amber-400" />,
  'Modern Cinematic Tones': <Clapperboard className="h-3.5 w-3.5 text-teal-400" />,
  'Portrait & Skin Retouching': <User className="h-3.5 w-3.5 text-rose-400" />,
  'Nature & Landscape': <Trees className="h-3.5 w-3.5 text-emerald-400" />,
  'B&W Fine Art': <Palette className="h-3.5 w-3.5 text-neutral-300" />,
  'Social & Lifestyle': <Coffee className="h-3.5 w-3.5 text-orange-400" />,
  User: <Bookmark className="h-3.5 w-3.5 text-blue-400" />,
};

const CATEGORIES_ORDER: PresetCategory[] = [
  'Commercial & Studio Editorial',
  'Fine Art Architecture & Urban',
  'Professional Landscape & Nature',
  'Night & High-ISO Street Photography',
  'Classic Analog Film Emulations',
  'Food & Product Photography',
  'Cinematic & Film',
  'Subject-Focused',
  'Vintage & Analog Film',
  'Modern Cinematic Tones',
  'Portrait & Skin Retouching',
  'Nature & Landscape',
  'B&W Fine Art',
  'Social & Lifestyle',
];

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
  onImportPresetJSON,
  onExportCurrentPresetJSON,
  onSaveCustomPreset,
  onDeleteCustomPreset,

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

  // Accordion expanded state for categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Commercial & Studio Editorial': true,
    'Fine Art Architecture & Urban': true,
    'Professional Landscape & Nature': false,
    'Night & High-ISO Street Photography': false,
    'Classic Analog Film Emulations': false,
    'Food & Product Photography': false,
    'Cinematic & Film': false,
    'Subject-Focused': false,
    'Vintage & Analog Film': false,
    'Modern Cinematic Tones': false,
    'Portrait & Skin Retouching': false,
    'Nature & Landscape': false,
    'B&W Fine Art': false,
    'Social & Lifestyle': false,
    User: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    onSaveCustomPreset(newPresetName.trim());
    setNewPresetName('');
    setShowSavePresetInput(false);
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
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <aside className="ios-glass-card flex h-full w-full md:w-80 flex-col select-none z-20 shrink-0 transition-colors duration-300">
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
                placeholder="Search 50+ pro presets..."
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
                    <span>{activePreset.name}</span>
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

            {/* Action buttons: Save preset, Import/Export JSON */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSavePresetInput(!showSavePresetInput)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/20 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                Save Custom
              </button>

              <label
                className="ios-glass-button flex items-center justify-center rounded-full p-2 text-neutral-200 hover:text-white cursor-pointer transition-all active:scale-95 shadow-sm"
                title="Import Preset JSON"
              >
                <Upload className="h-3.5 w-3.5 text-blue-400" />
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportPresetJSON}
                  className="hidden"
                />
              </label>

              <button
                onClick={onExportCurrentPresetJSON}
                title="Export Current Preset JSON"
                className="ios-glass-button flex items-center justify-center rounded-full p-2 text-neutral-200 hover:text-white transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-blue-400" />
              </button>
            </div>

            {/* Save Preset Input Modal */}
            {showSavePresetInput && (
              <div className="rounded-2xl bg-black/40 p-3 border border-blue-500/40 space-y-2 backdrop-blur-lg">
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

            {/* Reset Original Button */}
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
              <span>Reset to Original Balance</span>
              {activePresetId === 'preset-original' && <Check className="h-4 w-4 text-blue-400" />}
            </button>

            {/* Accordion Preset Categories */}
            <div className="space-y-2">
              {/* Custom User Presets */}
              {filteredPresets.some((p) => p.category === 'User') && (
                <div className="rounded-2xl border border-blue-500/40 bg-black/25 overflow-hidden backdrop-blur-md">
                  <button
                    onClick={() => toggleCategory('User')}
                    className="flex w-full items-center justify-between p-2.5 text-left text-xs font-bold text-blue-300 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {CATEGORY_ICONS['User']}
                      <span>My Custom Presets</span>
                      <span className="rounded-full bg-blue-500/30 px-2 py-0.5 text-[10px] text-blue-200 font-mono">
                        {filteredPresets.filter((p) => p.category === 'User').length}
                      </span>
                    </div>
                    {expandedCategories['User'] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {expandedCategories['User'] && (
                    <div className="p-2 space-y-1 bg-black/30 border-t border-white/10">
                      {filteredPresets
                        .filter((p) => p.category === 'User')
                        .map((preset) => {
                          const isActive = activePresetId === preset.id;
                          return (
                            <div
                              key={preset.id}
                              className={`flex items-center justify-between rounded-xl p-2 text-xs transition-all ${
                                isActive
                                  ? 'bg-blue-600/30 border border-blue-400/80 text-blue-300 font-bold'
                                  : 'bg-black/20 hover:bg-white/10 text-neutral-200 border border-transparent'
                              }`}
                            >
                              <button
                                onClick={() => onSelectPreset(preset)}
                                className="flex flex-1 items-center gap-2 text-left truncate cursor-pointer"
                              >
                                {isActive && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                                <span className="truncate">{preset.name}</span>
                              </button>
                              <button
                                onClick={() => onDeleteCustomPreset(preset.id)}
                                className="text-neutral-400 hover:text-red-400 p-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Pro Built-In Categories */}
              {CATEGORIES_ORDER.map((category) => {
                const categoryPresets = filteredPresets.filter((p) => p.category === category);
                if (categoryPresets.length === 0) return null;

                const isExpanded = expandedCategories[category] ?? false;

                return (
                  <div
                    key={category}
                    className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-md"
                  >
                    {/* Category Accordion Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center justify-between p-2.5 text-left text-xs font-bold text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {CATEGORY_ICONS[category]}
                        <span>{category}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-neutral-300 font-mono">
                          {categoryPresets.length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>

                    {/* Preset Grid Cards with Thumbnails */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 gap-2 p-2 bg-black/30 border-t border-white/10">
                        {categoryPresets.map((preset) => {
                          const isActive = activePresetId === preset.id;
                          const thumbUrl = presetThumbnails[preset.id];

                          return (
                            <button
                              key={preset.id}
                              onClick={() => onSelectPreset(preset)}
                              className={`group flex items-center gap-3 rounded-xl p-2 text-left transition-all cursor-pointer active:scale-98 ${
                                isActive
                                  ? 'bg-blue-600/25 border border-blue-400/80 shadow-lg shadow-blue-500/20'
                                  : 'bg-black/20 hover:bg-white/10 border border-white/5 hover:border-white/20'
                              }`}
                            >
                              {/* Thumbnail Canvas / Image */}
                              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-black/40 border border-white/15 shadow-sm">
                                {thumbUrl ? (
                                  <img
                                    src={thumbUrl}
                                    alt={preset.name}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-[9px] text-neutral-500 font-mono">
                                    PREVIEW
                                  </div>
                                )}
                                {isActive && (
                                  <div className="absolute inset-0 bg-blue-500/30 border-2 border-blue-400 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white drop-shadow" />
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div className="min-w-0 flex-1">
                                <div className={`text-[11px] font-bold truncate flex items-center justify-between ${
                                  isActive ? 'text-blue-300' : 'text-neutral-200 group-hover:text-white'
                                }`}>
                                  <span className="truncate">{preset.name}</span>
                                </div>
                                {preset.description && (
                                  <p className="mt-0.5 text-[9px] text-neutral-400 opacity-80 line-clamp-2 leading-tight">
                                    {preset.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
                      className={`absolute -left-[18px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border ${
                        isActive
                          ? 'border-blue-400 bg-blue-500 ring-4 ring-blue-500/30'
                          : 'border-white/30 bg-black/40 group-hover:border-white/60'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                    <span className={`font-mono text-[9px] ${isActive ? 'text-blue-200 font-semibold' : 'opacity-50'}`}>
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
          <div className="space-y-3">
            <p className="text-[11px] text-neutral-300 opacity-80">
              Select a sample photo to test real-time WebGL adjustments:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {SAMPLE_PHOTOS.map((photo) => {
                const isActive = activeSampleId === photo.id;
                return (
                  <button
                    key={photo.id}
                    onClick={() => onSelectSamplePhoto(photo)}
                    className={`group relative overflow-hidden rounded-2xl border text-left transition-all cursor-pointer active:scale-98 ${
                      isActive
                        ? 'border-blue-400 ring-2 ring-blue-500/40 bg-blue-500/10 shadow-lg'
                        : 'border-white/10 hover:border-white/25 bg-black/20'
                    }`}
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-black/50">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2 flex items-center justify-between bg-black/30 backdrop-blur-md">
                      <div>
                        <div className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">
                          {photo.title}
                        </div>
                        <div className="text-[9px] text-neutral-400 font-mono opacity-70">{photo.category}</div>
                      </div>
                      {isActive && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white shadow-md">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
