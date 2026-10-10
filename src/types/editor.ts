export interface HSLChannel {
  hue: number; // -100 to +100
  saturation: number; // -100 to +100
  luminance: number; // -100 to +100
}

export interface HSLState {
  red: HSLChannel;
  orange: HSLChannel;
  yellow: HSLChannel;
  green: HSLChannel;
  aqua: HSLChannel;
  blue: HSLChannel;
  purple: HSLChannel;
  magenta: HSLChannel;
}

export interface ColorWheelVal {
  hue: number; // 0 to 360
  saturation: number; // 0 to 100
  luminance: number; // -100 to +100
}

export interface ColorGradingState {
  shadows: ColorWheelVal;
  midtones: ColorWheelVal;
  highlights: ColorWheelVal;
  blending: number; // 0 to 100
  balance: number; // -100 to +100
}

export interface CurvePoint {
  x: number; // 0 to 255
  y: number; // 0 to 255
}

export interface ToneCurveChannel {
  points: CurvePoint[];
}

export interface ToneCurveState {
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export type MaskType = 'none' | 'radial' | 'linear';

export interface MaskState {
  type: MaskType;
  invert: boolean;
  opacity: number; // 0 to 100
  feather: number; // 0 to 100
  // Radial coordinates (0 to 1 relative to photo)
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  // Linear gradient coordinates (0 to 1 relative to photo)
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  // Local selective offset adjustments inside mask
  exposure: number; // -3.0 to +3.0 EV
  contrast: number; // -100 to +100
  temp: number; // -100 to +100
  saturation: number; // -100 to +100
  clarity: number; // -100 to +100
}

export interface CropState {
  aspectRatio: 'free' | 'original' | '1:1' | '4:5' | '3:2' | '16:9' | '9:16' | '4:3';
  rotation: number; // -180 to 180 degrees
  flipH: boolean;
  flipV: boolean;
  x: number; // 0 to 1 relative crop start
  y: number; // 0 to 1 relative crop start
  width: number; // 0 to 1 relative width
  height: number; // 0 to 1 relative height
}

export interface CalibrationState {
  shadowTint: number; // -100 to +100 (Green to Magenta)
  redHue: number; // -100 to +100
  redSaturation: number; // -100 to +100
  greenHue: number; // -100 to +100
  greenSaturation: number; // -100 to +100
  blueHue: number; // -100 to +100
  blueSaturation: number; // -100 to +100
}

export interface ParametricCurveState {
  shadows: number; // -100 to +100
  darks: number; // -100 to +100
  lights: number; // -100 to +100
  highlights: number; // -100 to +100
  shadowSplit: number; // 0 to 100
  midtoneSplit: number; // 0 to 100
  highlightSplit: number; // 0 to 100
}

export interface DetailState {
  sharpenRadius: number; // 0.5 to 3.0
  sharpenDetail: number; // 0 to 100
  sharpenEdgeMasking: number; // 0 to 100
  luminanceNoiseContrast: number; // 0 to 100
  colorNoiseDetail: number; // 0 to 100
  colorNoiseSmoothness: number; // 0 to 100
}

export interface OpticsState {
  defringePurple: number; // 0 to 100
  defringeGreen: number; // 0 to 100
  distortion: number; // -100 to +100
  lensProfileEnable: boolean;
}

export interface PhotoAdjustments {
  // Light
  exposure: number; // -5 to +5 EV
  contrast: number; // -100 to +100
  highlights: number; // -100 to +100
  shadows: number; // -100 to +100
  whites: number; // -100 to +100
  blacks: number; // -100 to +100

  // Color & White Balance
  temp: number; // 2000 to 10000 K (or normalized -100 to +100 for display, internally mapped)
  tint: number; // -100 to +100
  vibrance: number; // -100 to +100
  saturation: number; // -100 to +100

  // HSL Mixer
  hsl: HSLState;

  // Color Grading
  colorGrading: ColorGradingState;

  // Tone Curve
  toneCurve: ToneCurveState;

  // Parametric Curve (Lightroom 4-Zone curve)
  parametricCurve?: ParametricCurveState;

  // Camera Calibration (Lightroom Primaries & Shadow Tint)
  calibration?: CalibrationState;

  // Effects & Detail
  clarity: number; // -100 to +100
  texture: number; // -100 to +100
  dehaze: number; // -100 to +100
  vignette: number; // -100 to +100
  vignetteMidpoint: number; // 0 to 100
  sharpening: number; // 0 to 100
  noiseReduction: number; // 0 to 100 (AI High-ISO Luminance Denoise)
  colorNoiseReduction?: number; // 0 to 100 (Chroma Sensor Denoise)
  noiseDetail?: number; // 0 to 100 (Edge/Detail Retention Threshold)
  grain: number; // 0 to 100 (Amount)
  grainSize: number; // 1 to 5
  grainRoughness: number; // 0 to 100
  chromaticAberration: number; // 0 to 100

  // Extended Detail & Optics
  detailSettings?: DetailState;
  optics?: OpticsState;

  // Local Selective Masking
  mask: MaskState;

  // Crop & Geometry
  crop: CropState;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  label: string;
  adjustments: PhotoAdjustments;
}

export type PresetCategory =
  | 'Film'
  | 'Cinematic'
  | 'Studio'
  | 'B&W'
  | 'Lightroom XMP Presets'
  | 'Lightroom Classic (.lrtemplate)'
  | 'Imported XMP'
  | 'Imported LRTemplates'
  | 'My Custom Presets'
  | 'Built-in'
  | 'User'
  | string;

export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  description?: string;
  thumbnailUrl?: string;
  format?: 'xmp' | 'lrtemplate' | 'custom' | 'builtin';
  rawSource?: string;
  adjustments: Partial<PhotoAdjustments>;
}

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  l: number[];
  maxVal: number;
  hasHighlightClipping: boolean;
  hasShadowClipping: boolean;
}

export interface ImageInfo {
  name: string;
  width: number;
  height: number;
  fileSize?: string;
  type?: string;
}

export type ViewMode = 'single' | 'before-after-split' | 'before-after-side';

export type ActiveTool = 'edit' | 'crop' | 'curve' | 'preset' | 'history';
