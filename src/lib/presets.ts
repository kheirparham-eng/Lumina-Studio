import {
  PhotoAdjustments,
  Preset,
  HSLState,
  ColorGradingState,
  ToneCurveState,
  CropState,
  MaskState,
} from '../types/editor';

export const createDefaultHSLState = (): HSLState => ({
  red: { hue: 0, saturation: 0, luminance: 0 },
  orange: { hue: 0, saturation: 0, luminance: 0 },
  yellow: { hue: 0, saturation: 0, luminance: 0 },
  green: { hue: 0, saturation: 0, luminance: 0 },
  aqua: { hue: 0, saturation: 0, luminance: 0 },
  blue: { hue: 0, saturation: 0, luminance: 0 },
  purple: { hue: 0, saturation: 0, luminance: 0 },
  magenta: { hue: 0, saturation: 0, luminance: 0 },
});

export const createDefaultColorGradingState = (): ColorGradingState => ({
  shadows: { hue: 0, saturation: 0, luminance: 0 },
  midtones: { hue: 0, saturation: 0, luminance: 0 },
  highlights: { hue: 0, saturation: 0, luminance: 0 },
  blending: 50,
  balance: 0,
});

export const createDefaultToneCurveState = (): ToneCurveState => ({
  master: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
});

export const createDefaultCropState = (): CropState => ({
  aspectRatio: 'free',
  rotation: 0,
  flipH: false,
  flipV: false,
  x: 0,
  y: 0,
  width: 1,
  height: 1,
});

export const createDefaultMaskState = (): MaskState => ({
  type: 'none',
  invert: false,
  opacity: 100,
  feather: 50,
  centerX: 0.5,
  centerY: 0.5,
  radiusX: 0.35,
  radiusY: 0.35,
  startX: 0.5,
  startY: 0.2,
  endX: 0.5,
  endY: 0.8,
  exposure: 0,
  contrast: 0,
  temp: 0,
  saturation: 0,
  clarity: 0,
});

export const createDefaultCalibrationState = () => ({
  shadowTint: 0,
  redHue: 0,
  redSaturation: 0,
  greenHue: 0,
  greenSaturation: 0,
  blueHue: 0,
  blueSaturation: 0,
});

export const createDefaultParametricCurveState = () => ({
  shadows: 0,
  darks: 0,
  lights: 0,
  highlights: 0,
  shadowSplit: 14,
  midtoneSplit: 43,
  highlightSplit: 75,
});

export const createDefaultDetailState = () => ({
  sharpenRadius: 1.0,
  sharpenDetail: 25,
  sharpenEdgeMasking: 0,
  luminanceNoiseContrast: 0,
  colorNoiseDetail: 50,
  colorNoiseSmoothness: 50,
});

export const createDefaultOpticsState = () => ({
  defringePurple: 0,
  defringeGreen: 0,
  distortion: 0,
  lensProfileEnable: false,
});

export const createDefaultAdjustments = (): PhotoAdjustments => ({
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,

  temp: 5500,
  tint: 0,
  vibrance: 0,
  saturation: 0,

  hsl: createDefaultHSLState(),
  colorGrading: createDefaultColorGradingState(),
  toneCurve: createDefaultToneCurveState(),
  parametricCurve: createDefaultParametricCurveState(),
  calibration: createDefaultCalibrationState(),
  detailSettings: createDefaultDetailState(),
  optics: createDefaultOpticsState(),

  clarity: 0,
  texture: 0,
  dehaze: 0,
  vignette: 0,
  vignetteMidpoint: 50,
  sharpening: 15,
  noiseReduction: 0,
  colorNoiseReduction: 0,
  noiseDetail: 50,
  grain: 0,
  grainSize: 2,
  grainRoughness: 50,
  chromaticAberration: 0,

  mask: createDefaultMaskState(),
  crop: createDefaultCropState(),
});

/**
 * Non-destructive preset intensity blending function.
 * Linearly interpolates preset settings with base adjustments according to intensity (0-100%).
 */
export function blendPresetAdjustments(
  baseAdj: PhotoAdjustments,
  presetAdj: Partial<PhotoAdjustments>,
  intensityPercent: number
): PhotoAdjustments {
  const factor = Math.max(0, Math.min(100, intensityPercent)) / 100;
  const lerp = (base: number, target: number) => base + (target - base) * factor;

  const result: PhotoAdjustments = { ...baseAdj };

  if (presetAdj.exposure !== undefined) result.exposure = lerp(baseAdj.exposure, presetAdj.exposure);
  if (presetAdj.contrast !== undefined) result.contrast = lerp(baseAdj.contrast, presetAdj.contrast);
  if (presetAdj.highlights !== undefined) result.highlights = lerp(baseAdj.highlights, presetAdj.highlights);
  if (presetAdj.shadows !== undefined) result.shadows = lerp(baseAdj.shadows, presetAdj.shadows);
  if (presetAdj.whites !== undefined) result.whites = lerp(baseAdj.whites, presetAdj.whites);
  if (presetAdj.blacks !== undefined) result.blacks = lerp(baseAdj.blacks, presetAdj.blacks);

  if (presetAdj.temp !== undefined) result.temp = lerp(baseAdj.temp, presetAdj.temp);
  if (presetAdj.tint !== undefined) result.tint = lerp(baseAdj.tint, presetAdj.tint);
  if (presetAdj.vibrance !== undefined) result.vibrance = lerp(baseAdj.vibrance, presetAdj.vibrance);
  if (presetAdj.saturation !== undefined) result.saturation = lerp(baseAdj.saturation, presetAdj.saturation);

  if (presetAdj.clarity !== undefined) result.clarity = lerp(baseAdj.clarity, presetAdj.clarity);
  if (presetAdj.texture !== undefined) result.texture = lerp(baseAdj.texture, presetAdj.texture);
  if (presetAdj.dehaze !== undefined) result.dehaze = lerp(baseAdj.dehaze, presetAdj.dehaze);
  if (presetAdj.vignette !== undefined) result.vignette = lerp(baseAdj.vignette, presetAdj.vignette);
  if (presetAdj.vignetteMidpoint !== undefined) result.vignetteMidpoint = lerp(baseAdj.vignetteMidpoint, presetAdj.vignetteMidpoint);
  if (presetAdj.sharpening !== undefined) result.sharpening = lerp(baseAdj.sharpening, presetAdj.sharpening);
  if (presetAdj.noiseReduction !== undefined) result.noiseReduction = lerp(baseAdj.noiseReduction, presetAdj.noiseReduction);
  if (presetAdj.colorNoiseReduction !== undefined) result.colorNoiseReduction = lerp(baseAdj.colorNoiseReduction ?? 0, presetAdj.colorNoiseReduction);
  if (presetAdj.noiseDetail !== undefined) result.noiseDetail = lerp(baseAdj.noiseDetail ?? 50, presetAdj.noiseDetail);
  if (presetAdj.grain !== undefined) result.grain = lerp(baseAdj.grain, presetAdj.grain);
  if (presetAdj.grainSize !== undefined) result.grainSize = lerp(baseAdj.grainSize, presetAdj.grainSize);
  if (presetAdj.grainRoughness !== undefined) result.grainRoughness = lerp(baseAdj.grainRoughness, presetAdj.grainRoughness);
  if (presetAdj.chromaticAberration !== undefined) result.chromaticAberration = lerp(baseAdj.chromaticAberration, presetAdj.chromaticAberration);

  if (presetAdj.hsl) {
    const blendedHSL = { ...baseAdj.hsl };
    const channels = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'] as const;
    channels.forEach((ch) => {
      const pCh = presetAdj.hsl?.[ch];
      const bCh = baseAdj.hsl[ch];
      if (pCh) {
        blendedHSL[ch] = {
          hue: lerp(bCh.hue, pCh.hue),
          saturation: lerp(bCh.saturation, pCh.saturation),
          luminance: lerp(bCh.luminance, pCh.luminance),
        };
      }
    });
    result.hsl = blendedHSL;
  }

  if (presetAdj.colorGrading) {
    const pCG = presetAdj.colorGrading;
    const bCG = baseAdj.colorGrading;
    result.colorGrading = {
      shadows: pCG.shadows
        ? {
            hue: lerp(bCG.shadows.hue, pCG.shadows.hue),
            saturation: lerp(bCG.shadows.saturation, pCG.shadows.saturation),
            luminance: lerp(bCG.shadows.luminance, pCG.shadows.luminance),
          }
        : bCG.shadows,
      midtones: pCG.midtones
        ? {
            hue: lerp(bCG.midtones.hue, pCG.midtones.hue),
            saturation: lerp(bCG.midtones.saturation, pCG.midtones.saturation),
            luminance: lerp(bCG.midtones.luminance, pCG.midtones.luminance),
          }
        : bCG.midtones,
      highlights: pCG.highlights
        ? {
            hue: lerp(bCG.highlights.hue, pCG.highlights.hue),
            saturation: lerp(bCG.highlights.saturation, pCG.highlights.saturation),
            luminance: lerp(bCG.highlights.luminance, pCG.highlights.luminance),
          }
        : bCG.highlights,
      blending: pCG.blending !== undefined ? lerp(bCG.blending, pCG.blending) : bCG.blending,
      balance: pCG.balance !== undefined ? lerp(bCG.balance, pCG.balance) : bCG.balance,
    };
  }

  if (presetAdj.toneCurve && factor >= 0.15) {
    result.toneCurve = presetAdj.toneCurve as ToneCurveState;
  }

  if (presetAdj.calibration) {
    const bCal = baseAdj.calibration ?? createDefaultCalibrationState();
    const pCal = presetAdj.calibration;
    result.calibration = {
      shadowTint: lerp(bCal.shadowTint, pCal.shadowTint ?? 0),
      redHue: lerp(bCal.redHue, pCal.redHue ?? 0),
      redSaturation: lerp(bCal.redSaturation, pCal.redSaturation ?? 0),
      greenHue: lerp(bCal.greenHue, pCal.greenHue ?? 0),
      greenSaturation: lerp(bCal.greenSaturation, pCal.greenSaturation ?? 0),
      blueHue: lerp(bCal.blueHue, pCal.blueHue ?? 0),
      blueSaturation: lerp(bCal.blueSaturation, pCal.blueSaturation ?? 0),
    };
  }

  if (presetAdj.parametricCurve) {
    const bPC = baseAdj.parametricCurve ?? createDefaultParametricCurveState();
    const pPC = presetAdj.parametricCurve;
    result.parametricCurve = {
      shadows: lerp(bPC.shadows, pPC.shadows ?? 0),
      darks: lerp(bPC.darks, pPC.darks ?? 0),
      lights: lerp(bPC.lights, pPC.lights ?? 0),
      highlights: lerp(bPC.highlights, pPC.highlights ?? 0),
      shadowSplit: pPC.shadowSplit ?? bPC.shadowSplit,
      midtoneSplit: pPC.midtoneSplit ?? bPC.midtoneSplit,
      highlightSplit: pPC.highlightSplit ?? bPC.highlightSplit,
    };
  }

  if (presetAdj.mask && factor >= 0.2) {
    result.mask = presetAdj.mask;
  }

  return result;
}

/**
 * Authentic Lightroom starter presets and neutral reset preset.
 * All previous hardcoded non-Lightroom presets have been deleted per user request.
 */
export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'preset-original',
    name: 'Reset / Original',
    category: 'Built-in',
    description: 'Revert all controls to initial neutral balance.',
    format: 'builtin',
    adjustments: createDefaultAdjustments(),
  },
  {
    id: 'lr-portra-400-xmp',
    name: 'Kodak Portra 400',
    category: 'Lightroom XMP Presets',
    description: 'Authentic Adobe Camera Raw XMP profile: warm skin tones, lifted film blacks, subtle pastel roll-off.',
    format: 'xmp',
    adjustments: {
      exposure: 0.15,
      contrast: -8,
      highlights: -25,
      shadows: 22,
      whites: -12,
      blacks: 15,
      temp: 5850,
      tint: 5,
      vibrance: -6,
      saturation: -4,
      clarity: -6,
      texture: -4,
      sharpening: 35,
      grain: 18,
      grainSize: 2,
      grainRoughness: 45,
      vignette: -10,
      toneCurve: {
        master: [
          { x: 0, y: 15 },
          { x: 60, y: 55 },
          { x: 190, y: 200 },
          { x: 255, y: 245 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [
          { x: 0, y: 8 },
          { x: 255, y: 252 },
        ],
      },
      hsl: {
        ...createDefaultHSLState(),
        red: { hue: 2, saturation: 10, luminance: 4 },
        orange: { hue: -2, saturation: 12, luminance: 8 },
        yellow: { hue: -4, saturation: -5, luminance: 5 },
        green: { hue: 5, saturation: -12, luminance: -4 },
        aqua: { hue: 0, saturation: -15, luminance: 0 },
        blue: { hue: 0, saturation: -20, luminance: -6 },
      },
      colorGrading: {
        shadows: { hue: 35, saturation: 15, luminance: 4 },
        midtones: { hue: 25, saturation: 8, luminance: 0 },
        highlights: { hue: 45, saturation: 12, luminance: 2 },
        blending: 50,
        balance: 5,
      },
    },
  },
  {
    id: 'lr-teal-orange-xmp',
    name: 'Teal & Orange Cinema',
    category: 'Lightroom XMP Presets',
    description: 'Adobe XMP color grade with cyan/teal in shadows and warm amber/orange in skin highlights.',
    format: 'xmp',
    adjustments: {
      exposure: 0.1,
      contrast: 24,
      highlights: -30,
      shadows: 18,
      whites: 15,
      blacks: -18,
      temp: 5650,
      tint: -4,
      vibrance: 25,
      saturation: -5,
      clarity: 16,
      texture: 10,
      dehaze: 10,
      sharpening: 40,
      vignette: -18,
      toneCurve: {
        master: [
          { x: 0, y: 5 },
          { x: 64, y: 56 },
          { x: 192, y: 205 },
          { x: 255, y: 255 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [
          { x: 0, y: 12 },
          { x: 128, y: 124 },
          { x: 255, y: 240 },
        ],
      },
      hsl: {
        ...createDefaultHSLState(),
        orange: { hue: 5, saturation: 22, luminance: 6 },
        blue: { hue: -12, saturation: 35, luminance: -8 },
        aqua: { hue: -8, saturation: 30, luminance: -5 },
        green: { hue: -15, saturation: -25, luminance: -10 },
      },
      colorGrading: {
        shadows: { hue: 205, saturation: 35, luminance: -6 },
        midtones: { hue: 32, saturation: 18, luminance: 0 },
        highlights: { hue: 42, saturation: 30, luminance: 8 },
        blending: 60,
        balance: -5,
      },
    },
  },
  {
    id: 'lr-golden-hour-xmp',
    name: 'Golden Hour Glow',
    category: 'Lightroom XMP Presets',
    description: 'Warm ambient sunset atmosphere, golden specular highlights, and soft contrast roll-off.',
    format: 'xmp',
    adjustments: {
      exposure: 0.2,
      contrast: 12,
      highlights: -28,
      shadows: 24,
      whites: 14,
      blacks: -10,
      temp: 6400,
      tint: 8,
      vibrance: 28,
      saturation: 10,
      clarity: 10,
      dehaze: 8,
      sharpening: 35,
      vignette: -12,
      colorGrading: {
        shadows: { hue: 35, saturation: 20, luminance: 2 },
        midtones: { hue: 45, saturation: 18, luminance: 0 },
        highlights: { hue: 50, saturation: 35, luminance: 10 },
        blending: 55,
        balance: 8,
      },
    },
  },
  {
    id: 'lr-clean-commercial-lrt',
    name: 'Clean Commercial Studio',
    category: 'Lightroom Classic (.lrtemplate)',
    description: 'Lightroom Classic .lrtemplate develop profile: crisp punch, natural skin tones, clean neutral whites.',
    format: 'lrtemplate',
    adjustments: {
      exposure: 0.18,
      contrast: 16,
      highlights: -18,
      shadows: 20,
      whites: 18,
      blacks: -10,
      temp: 5400,
      tint: 0,
      vibrance: 16,
      saturation: 6,
      clarity: 14,
      texture: 10,
      sharpening: 42,
      noiseReduction: 10,
      toneCurve: {
        master: [
          { x: 0, y: 0 },
          { x: 64, y: 60 },
          { x: 192, y: 200 },
          { x: 255, y: 255 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
      },
    },
  },
  {
    id: 'lr-silver-noir-lrt',
    name: 'Ilford HP5 Silver B&W',
    category: 'Lightroom Classic (.lrtemplate)',
    description: 'High-contrast monochrome film simulation from Lightroom Classic with fine grain and rich silver tones.',
    format: 'lrtemplate',
    adjustments: {
      exposure: 0.1,
      contrast: 38,
      highlights: -20,
      shadows: -12,
      whites: 28,
      blacks: -32,
      temp: 5500,
      vibrance: -100,
      saturation: -100,
      clarity: 28,
      texture: 22,
      sharpening: 40,
      grain: 32,
      grainSize: 2,
      grainRoughness: 55,
      vignette: -18,
      toneCurve: {
        master: [
          { x: 0, y: 5 },
          { x: 50, y: 40 },
          { x: 200, y: 215 },
          { x: 255, y: 255 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
      },
    },
  },
];
