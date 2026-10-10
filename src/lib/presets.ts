import {
  PhotoAdjustments,
  Preset,
  CurvePoint,
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
  master: [
    { x: 0, y: 0 },
    { x: 255, y: 255 },
  ],
  red: [
    { x: 0, y: 0 },
    { x: 255, y: 255 },
  ],
  green: [
    { x: 0, y: 0 },
    { x: 255, y: 255 },
  ],
  blue: [
    { x: 0, y: 0 },
    { x: 255, y: 255 },
  ],
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
 * Smoothly blends a curve channel towards a target curve by interpolating y-values.
 */
function interpolateCurvePoints(
  basePoints: CurvePoint[],
  targetPoints: CurvePoint[],
  factor: number
): CurvePoint[] {
  if (factor <= 0) return basePoints;
  if (factor >= 1) return targetPoints;

  return targetPoints.map((targetPt) => {
    // In a default neutral curve, y equals x
    const baseY = targetPt.x;
    const blendedY = Math.round(baseY + (targetPt.y - baseY) * factor);
    return {
      x: targetPt.x,
      y: Math.max(0, Math.min(255, blendedY)),
    };
  });
}

/**
 * Non-destructive preset intensity blending function.
 * Smoothly interpolates preset parameters with base adjustments according to intensity (0-100%).
 */
export function blendPresetAdjustments(
  baseAdj: PhotoAdjustments,
  presetAdj: Partial<PhotoAdjustments>,
  intensityPercent: number
): PhotoAdjustments {
  const factor = Math.max(0, Math.min(100, intensityPercent)) / 100;
  const lerp = (base: number, target: number) => base + (target - base) * factor;

  const result: PhotoAdjustments = { ...baseAdj };

  // Core Light Controls
  if (presetAdj.exposure !== undefined) result.exposure = lerp(baseAdj.exposure, presetAdj.exposure);
  if (presetAdj.contrast !== undefined) result.contrast = lerp(baseAdj.contrast, presetAdj.contrast);
  if (presetAdj.highlights !== undefined) result.highlights = lerp(baseAdj.highlights, presetAdj.highlights);
  if (presetAdj.shadows !== undefined) result.shadows = lerp(baseAdj.shadows, presetAdj.shadows);
  if (presetAdj.whites !== undefined) result.whites = lerp(baseAdj.whites, presetAdj.whites);
  if (presetAdj.blacks !== undefined) result.blacks = lerp(baseAdj.blacks, presetAdj.blacks);

  // Core Color Controls
  if (presetAdj.temp !== undefined) result.temp = lerp(baseAdj.temp, presetAdj.temp);
  if (presetAdj.tint !== undefined) result.tint = lerp(baseAdj.tint, presetAdj.tint);
  if (presetAdj.vibrance !== undefined) result.vibrance = lerp(baseAdj.vibrance, presetAdj.vibrance);
  if (presetAdj.saturation !== undefined) result.saturation = lerp(baseAdj.saturation, presetAdj.saturation);

  // Clarity, Texture, Effects & Vignette
  if (presetAdj.clarity !== undefined) result.clarity = lerp(baseAdj.clarity, presetAdj.clarity);
  if (presetAdj.texture !== undefined) result.texture = lerp(baseAdj.texture, presetAdj.texture);
  if (presetAdj.dehaze !== undefined) result.dehaze = lerp(baseAdj.dehaze, presetAdj.dehaze);
  if (presetAdj.vignette !== undefined) result.vignette = lerp(baseAdj.vignette, presetAdj.vignette);
  if (presetAdj.vignetteMidpoint !== undefined) result.vignetteMidpoint = lerp(baseAdj.vignetteMidpoint, presetAdj.vignetteMidpoint);

  // Grain & Detail
  if (presetAdj.sharpening !== undefined) result.sharpening = lerp(baseAdj.sharpening, presetAdj.sharpening);
  if (presetAdj.noiseReduction !== undefined) result.noiseReduction = lerp(baseAdj.noiseReduction, presetAdj.noiseReduction);
  if (presetAdj.colorNoiseReduction !== undefined) result.colorNoiseReduction = lerp(baseAdj.colorNoiseReduction ?? 0, presetAdj.colorNoiseReduction);
  if (presetAdj.noiseDetail !== undefined) result.noiseDetail = lerp(baseAdj.noiseDetail ?? 50, presetAdj.noiseDetail);
  if (presetAdj.grain !== undefined) result.grain = lerp(baseAdj.grain, presetAdj.grain);
  if (presetAdj.grainSize !== undefined) result.grainSize = lerp(baseAdj.grainSize, presetAdj.grainSize);
  if (presetAdj.grainRoughness !== undefined) result.grainRoughness = lerp(baseAdj.grainRoughness, presetAdj.grainRoughness);
  if (presetAdj.chromaticAberration !== undefined) result.chromaticAberration = lerp(baseAdj.chromaticAberration, presetAdj.chromaticAberration);

  // 8-Channel HSL Mixer interpolation
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

  // Split Toning / 3-Way Color Grading interpolation
  if (presetAdj.colorGrading) {
    const pCG = presetAdj.colorGrading;
    const bCG = baseAdj.colorGrading;
    result.colorGrading = {
      shadows: pCG.shadows
        ? {
            hue: pCG.shadows.hue,
            saturation: lerp(bCG.shadows.saturation, pCG.shadows.saturation),
            luminance: lerp(bCG.shadows.luminance, pCG.shadows.luminance),
          }
        : bCG.shadows,
      midtones: pCG.midtones
        ? {
            hue: pCG.midtones.hue,
            saturation: lerp(bCG.midtones.saturation, pCG.midtones.saturation),
            luminance: lerp(bCG.midtones.luminance, pCG.midtones.luminance),
          }
        : bCG.midtones,
      highlights: pCG.highlights
        ? {
            hue: pCG.highlights.hue,
            saturation: lerp(bCG.highlights.saturation, pCG.highlights.saturation),
            luminance: lerp(bCG.highlights.luminance, pCG.highlights.luminance),
          }
        : bCG.highlights,
      blending: pCG.blending !== undefined ? lerp(bCG.blending, pCG.blending) : bCG.blending,
      balance: pCG.balance !== undefined ? lerp(bCG.balance, pCG.balance) : bCG.balance,
    };
  }

  // Smooth Tone Curve interpolation
  if (presetAdj.toneCurve) {
    const bTC = baseAdj.toneCurve;
    const pTC = presetAdj.toneCurve;
    result.toneCurve = {
      master: pTC.master ? interpolateCurvePoints(bTC.master, pTC.master, factor) : bTC.master,
      red: pTC.red ? interpolateCurvePoints(bTC.red, pTC.red, factor) : bTC.red,
      green: pTC.green ? interpolateCurvePoints(bTC.green, pTC.green, factor) : bTC.green,
      blue: pTC.blue ? interpolateCurvePoints(bTC.blue, pTC.blue, factor) : bTC.blue,
    };
  }

  // Camera Calibration Primaries & Shadow Tint
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

  // Parametric Curve
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

  // Mask selective adjustments if present
  if (presetAdj.mask && factor >= 0.2) {
    result.mask = presetAdj.mask;
  }

  return result;
}

/**
 * Production-grade library of 20 professional color grading presets across 4 categories:
 * - Category A: Classic Analog & 35mm Negative Emulations (Film)
 * - Category B: Modern Cinematic & Mood Grades (Cinematic)
 * - Category C: Clean Editorial & Commercial Studio (Studio)
 * - Category D: Monochrome & Specialty Tones (B&W)
 */
export const BUILT_IN_PRESETS: Preset[] = [
  // Neutral Reset Preset
  {
    id: 'preset-original',
    name: 'Reset to None',
    category: 'Built-in',
    description: 'Revert all color grading and adjustments to original neutral balance.',
    format: 'builtin',
    adjustments: createDefaultAdjustments(),
  },

  // =========================================================================
  // CATEGORY A: Classic Analog & 35mm Negative Emulations (Film)
  // =========================================================================
  {
    id: 'film-portra-400',
    name: 'Kodak Portra 400',
    category: 'Film',
    description: 'Warm editorial film: natural skin tones, soft lifted blacks, smooth highlight roll-off, and subtle organic grain.',
    format: 'xmp',
    adjustments: {
      exposure: 0.2,
      contrast: -10,
      highlights: -25,
      shadows: 30,
      whites: -15,
      blacks: 20,
      temp: 5950, // +10 relative kelvin
      tint: 4,
      saturation: -6,
      vibrance: 14,
      clarity: 0,
      grain: 25,
      grainSize: 2,
      grainRoughness: 45,
      vignette: -6,
      toneCurve: {
        master: [
          { x: 0, y: 18 },
          { x: 60, y: 58 },
          { x: 195, y: 198 },
          { x: 255, y: 242 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [
          { x: 0, y: 6 },
          { x: 255, y: 250 },
        ],
      },
      hsl: {
        ...createDefaultHSLState(),
        red: { hue: 2, saturation: 8, luminance: 3 },
        orange: { hue: -2, saturation: 10, luminance: 6 },
        yellow: { hue: -4, saturation: -4, luminance: 4 },
        green: { hue: 4, saturation: -10, luminance: -2 },
        aqua: { hue: 0, saturation: -12, luminance: 0 },
        blue: { hue: 0, saturation: -15, luminance: -4 },
      },
      colorGrading: {
        shadows: { hue: 35, saturation: 14, luminance: 2 },
        midtones: { hue: 28, saturation: 8, luminance: 0 },
        highlights: { hue: 45, saturation: 10, luminance: 2 },
        blending: 50,
        balance: 4,
      },
    },
  },
  {
    id: 'film-gold-200',
    name: 'Kodak Gold 200',
    category: 'Film',
    description: 'Vintage nostalgia: warm golden sunlight highlights, subtle bronze shadows, and saturated summertime pop.',
    format: 'xmp',
    adjustments: {
      exposure: 0.0,
      contrast: 12,
      highlights: -15,
      shadows: 15,
      whites: 10,
      blacks: -5,
      temp: 6310, // +18 relative kelvin
      tint: 6,
      saturation: 12,
      vibrance: 8,
      clarity: 4,
      grain: 35,
      grainSize: 2,
      grainRoughness: 50,
      vignette: -10,
      toneCurve: {
        master: [
          { x: 0, y: 14 },
          { x: 64, y: 66 },
          { x: 190, y: 202 },
          { x: 255, y: 248 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [{ x: 0, y: 8 }, { x: 255, y: 246 }],
      },
      colorGrading: {
        shadows: { hue: 32, saturation: 20, luminance: -2 },
        midtones: { hue: 38, saturation: 10, luminance: 0 },
        highlights: { hue: 45, saturation: 26, luminance: 6 },
        blending: 55,
        balance: 8,
      },
    },
  },
  {
    id: 'film-superia-400',
    name: 'Fuji Superia 400',
    category: 'Film',
    description: 'Everyday street negative: signature Fuji 4th color layer with soft magenta/green split tone and punchy urban contrast.',
    format: 'xmp',
    adjustments: {
      exposure: 0.05,
      contrast: 14,
      highlights: -20,
      shadows: 18,
      whites: 5,
      blacks: -8,
      temp: 5320, // -4 relative kelvin
      tint: 10,
      saturation: 5,
      vibrance: 12,
      clarity: 6,
      grain: 30,
      grainSize: 2,
      grainRoughness: 50,
      vignette: -10,
      colorGrading: {
        shadows: { hue: 142, saturation: 16, luminance: -2 }, // soft emerald green shadows
        midtones: { hue: 0, saturation: 0, luminance: 0 },
        highlights: { hue: 322, saturation: 18, luminance: 2 }, // soft magenta highlights
        blending: 50,
        balance: 0,
      },
      hsl: {
        ...createDefaultHSLState(),
        green: { hue: 8, saturation: 12, luminance: 2 },
        aqua: { hue: 4, saturation: 14, luminance: -2 },
        magenta: { hue: 0, saturation: 12, luminance: 2 },
      },
    },
  },
  {
    id: 'film-velvia-50',
    name: 'Fuji Velvia 50',
    category: 'Film',
    description: 'Legendary slide film: ultra-saturated nature, landscape greens, punchy contrast, and vivid azure skies.',
    format: 'xmp',
    adjustments: {
      exposure: 0.1,
      contrast: 22,
      highlights: -18,
      shadows: 12,
      whites: 15,
      blacks: -10,
      temp: 5230, // -6 relative kelvin
      tint: -2,
      saturation: 28,
      vibrance: 20,
      clarity: 14,
      grain: 8,
      grainSize: 1,
      grainRoughness: 40,
      vignette: -12,
      colorGrading: {
        shadows: { hue: 215, saturation: 16, luminance: -4 },
        midtones: { hue: 120, saturation: 8, luminance: 0 },
        highlights: { hue: 52, saturation: 14, luminance: 4 },
        blending: 50,
        balance: -4,
      },
      hsl: {
        ...createDefaultHSLState(),
        green: { hue: -5, saturation: 24, luminance: 4 },
        blue: { hue: -6, saturation: 26, luminance: -6 },
        yellow: { hue: 2, saturation: 20, luminance: 4 },
      },
    },
  },
  {
    id: 'film-hp5-plus',
    name: 'Ilford HP5 Plus',
    category: 'Film',
    description: 'Classic grayscale street film: rich silver tones, medium-contrast S-curve, and prominent authentic optical grain.',
    format: 'lrtemplate',
    adjustments: {
      exposure: 0.05,
      contrast: 24,
      highlights: -10,
      shadows: 15,
      whites: 15,
      blacks: -20,
      temp: 5500,
      tint: 0,
      saturation: -100,
      vibrance: -100,
      clarity: 18,
      grain: 45,
      grainSize: 2,
      grainRoughness: 60,
      vignette: -12,
      toneCurve: {
        master: [
          { x: 0, y: 6 },
          { x: 60, y: 48 },
          { x: 195, y: 210 },
          { x: 255, y: 252 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
      },
    },
  },

  // =========================================================================
  // CATEGORY B: Modern Cinematic & Mood Grades (Cinematic)
  // =========================================================================
  {
    id: 'cine-teal-orange',
    name: 'Teal & Orange Blockbuster',
    category: 'Cinematic',
    description: 'Hollywood blockbuster look: deep teal shadows (#005f73) balanced against warm radiant amber highlights (#ee9b00).',
    format: 'xmp',
    adjustments: {
      exposure: 0.05,
      contrast: 20,
      highlights: -30,
      shadows: -10,
      whites: -15,
      blacks: -35,
      temp: 5140, // -8 relative kelvin
      tint: -4,
      saturation: -15,
      vibrance: 15,
      clarity: 16,
      texture: 8,
      vignette: -18,
      colorGrading: {
        shadows: { hue: 192, saturation: 48, luminance: -6 }, // Deep teal (#005f73)
        midtones: { hue: 32, saturation: 16, luminance: 0 },
        highlights: { hue: 38, saturation: 45, luminance: 6 }, // Warm radiant amber (#ee9b00)
        blending: 65,
        balance: -8,
      },
      hsl: {
        ...createDefaultHSLState(),
        orange: { hue: 4, saturation: 25, luminance: 6 },
        blue: { hue: -15, saturation: 30, luminance: -8 },
        aqua: { hue: -5, saturation: 25, luminance: -4 },
      },
    },
  },
  {
    id: 'cine-moody-forest',
    name: 'Moody Forest',
    category: 'Cinematic',
    description: 'Nordic evergreen grade: cool shadowed depths, muted foliage greens, desaturated earth tones, and mist atmosphere.',
    format: 'xmp',
    adjustments: {
      exposure: -0.1,
      contrast: 16,
      highlights: -40,
      shadows: 25,
      whites: -25,
      blacks: -15,
      temp: 4960, // -12 relative kelvin
      tint: 6,
      saturation: -30,
      vibrance: -10,
      clarity: 14,
      dehaze: 8,
      vignette: -16,
      colorGrading: {
        shadows: { hue: 165, saturation: 26, luminance: -4 }, // deep pine
        midtones: { hue: 180, saturation: 10, luminance: 0 },
        highlights: { hue: 200, saturation: 15, luminance: 2 }, // misty cool
        blending: 60,
        balance: -10,
      },
      hsl: {
        ...createDefaultHSLState(),
        green: { hue: 12, saturation: -38, luminance: -12 },
        yellow: { hue: -10, saturation: -28, luminance: -6 },
        orange: { hue: -5, saturation: -20, luminance: 2 },
      },
    },
  },
  {
    id: 'cine-cyberpunk-neon',
    name: 'Cyberpunk Neon',
    category: 'Cinematic',
    description: 'Tokyo night aesthetic: vivid electric magenta highlights, deep cyan shadows, high clarity, and deep crushed blacks.',
    format: 'xmp',
    adjustments: {
      exposure: 0.1,
      contrast: 30,
      highlights: -15,
      shadows: 20,
      whites: 15,
      blacks: -40,
      temp: 4825, // -15 relative kelvin
      tint: 25,
      saturation: 20,
      vibrance: 25,
      clarity: 25,
      dehaze: 12,
      vignette: -22,
      colorGrading: {
        shadows: { hue: 192, saturation: 52, luminance: -8 }, // deep cyan
        midtones: { hue: 280, saturation: 20, luminance: 0 }, // electric purple
        highlights: { hue: 315, saturation: 50, luminance: 8 }, // vivid electric magenta
        blending: 70,
        balance: 0,
      },
    },
  },
  {
    id: 'cine-golden-hour',
    name: 'Golden Hour Glow',
    category: 'Cinematic',
    description: 'Sunset warmth: glowing ambient golden specular highlights, lifted bronze shadows, and radiant warm vibrance.',
    format: 'xmp',
    adjustments: {
      exposure: 0.25,
      contrast: 10,
      highlights: -20,
      shadows: 25,
      whites: 15,
      blacks: 5,
      temp: 6580, // +24 relative kelvin
      tint: 8,
      saturation: 10,
      vibrance: 18,
      clarity: 8,
      vignette: -12,
      colorGrading: {
        shadows: { hue: 35, saturation: 22, luminance: 2 }, // bronze sunset
        midtones: { hue: 42, saturation: 18, luminance: 0 },
        highlights: { hue: 45, saturation: 36, luminance: 10 }, // warm golden glow
        blending: 55,
        balance: 8,
      },
    },
  },
  {
    id: 'cine-bleach-bypass',
    name: 'Bleach Bypass',
    category: 'Cinematic',
    description: 'Gritty cinema action: skip-bleach photochemical emulation with extreme contrast, heavy desaturation, and high clarity.',
    format: 'lrtemplate',
    adjustments: {
      exposure: 0.0,
      contrast: 45,
      highlights: 10,
      shadows: -30,
      whites: 20,
      blacks: -25,
      temp: 5410, // -2 relative kelvin
      tint: -2,
      saturation: -60,
      vibrance: -25,
      clarity: 35,
      grain: 30,
      grainSize: 2,
      grainRoughness: 55,
      vignette: -20,
      colorGrading: {
        shadows: { hue: 210, saturation: 20, luminance: -5 }, // cold metallic steel
        midtones: { hue: 0, saturation: 0, luminance: 0 },
        highlights: { hue: 45, saturation: 10, luminance: 2 },
        blending: 50,
        balance: 0,
      },
    },
  },

  // =========================================================================
  // CATEGORY C: Clean Editorial & Commercial Studio (Studio)
  // =========================================================================
  {
    id: 'studio-bright-airy',
    name: 'Bright & Airy',
    category: 'Studio',
    description: 'Clean lifestyle editorial: overexposed luminous whites, soft low contrast, open shadows, and luminous skin tones.',
    format: 'xmp',
    adjustments: {
      exposure: 0.5,
      contrast: -16,
      highlights: -35,
      shadows: 45,
      whites: 25,
      blacks: 30,
      temp: 5680, // +4 relative kelvin
      tint: 0,
      saturation: -8,
      vibrance: 10,
      clarity: -4,
      toneCurve: {
        master: [
          { x: 0, y: 12 },
          { x: 64, y: 72 },
          { x: 190, y: 205 },
          { x: 255, y: 255 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
      },
    },
  },
  {
    id: 'studio-scandinavian',
    name: 'Minimalist Scandinavian',
    category: 'Studio',
    description: 'Clean Nordic minimalism: neutral white balance, controlled contrast, muted warm tones, and refined clean clarity.',
    format: 'xmp',
    adjustments: {
      exposure: 0.2,
      contrast: 8,
      highlights: -12,
      shadows: 18,
      whites: 5,
      blacks: -5,
      temp: 5410, // -2 relative kelvin
      tint: 0,
      saturation: -25,
      vibrance: -5,
      clarity: 8,
      vignette: -6,
    },
  },
  {
    id: 'studio-matte-fashion',
    name: 'Matte Editorial Fashion',
    category: 'Studio',
    description: 'Vogue fashion editorial: lifted matte shadow floor, smooth desaturated palette, and rich velvet midtones.',
    format: 'xmp',
    adjustments: {
      exposure: 0.1,
      contrast: -8,
      highlights: -15,
      shadows: 35,
      whites: -20,
      blacks: 40,
      temp: 5550,
      tint: 2,
      saturation: -12,
      vibrance: 8,
      clarity: 4,
      grain: 16,
      grainSize: 2,
      grainRoughness: 40,
      toneCurve: {
        master: [
          { x: 0, y: 28 }, // lifted matte floor
          { x: 60, y: 62 },
          { x: 195, y: 198 },
          { x: 255, y: 244 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
      },
    },
  },
  {
    id: 'studio-crisp-product',
    name: 'Crisp Product Studio',
    category: 'Studio',
    description: 'Commercial e-commerce studio: razor-sharp micro-contrast, punchy dehaze, accurate neutral whites, and crisp product pop.',
    format: 'lrtemplate',
    adjustments: {
      exposure: 0.3,
      contrast: 15,
      highlights: -10,
      shadows: 10,
      whites: 20,
      blacks: -10,
      temp: 5500,
      tint: 0,
      saturation: 5,
      vibrance: 8,
      clarity: 20,
      dehaze: 10,
      sharpening: 45,
      noiseReduction: 12,
    },
  },
  {
    id: 'studio-pastel-dream',
    name: 'Pastel Dream',
    category: 'Studio',
    description: 'Soft fantasy aesthetic: ethereal pastel tints, rose/peach highlights, lavender shadow split-toning, and dreamy low contrast.',
    format: 'xmp',
    adjustments: {
      exposure: 0.4,
      contrast: -22,
      highlights: -30,
      shadows: 50,
      whites: -10,
      blacks: 35,
      temp: 5770, // +6 relative kelvin
      tint: 12,
      saturation: -15,
      vibrance: 15,
      clarity: -10,
      dehaze: -5,
      colorGrading: {
        shadows: { hue: 275, saturation: 18, luminance: 4 }, // soft lavender shadows
        midtones: { hue: 0, saturation: 0, luminance: 0 },
        highlights: { hue: 25, saturation: 22, luminance: 6 }, // rose/peach highlights
        blending: 60,
        balance: 5,
      },
    },
  },

  // =========================================================================
  // CATEGORY D: Monochrome & Specialty Tones (B&W)
  // =========================================================================
  {
    id: 'mono-noir-contrast',
    name: 'Noir Contrast',
    category: 'B&W',
    description: 'Dramatic black & white: aggressive deep shadows, specular clipped whites, high clarity, and cinematic chiaroscuro mood.',
    format: 'lrtemplate',
    adjustments: {
      exposure: 0.05,
      contrast: 45,
      highlights: 10,
      shadows: -40,
      whites: 30,
      blacks: -45,
      temp: 5500,
      tint: 0,
      saturation: -100,
      vibrance: -100,
      clarity: 30,
      grain: 35,
      grainSize: 2,
      grainRoughness: 55,
      vignette: -28,
      toneCurve: {
        master: [
          { x: 0, y: 0 },
          { x: 60, y: 30 },
          { x: 190, y: 225 },
          { x: 255, y: 255 },
        ],
        red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
      },
    },
  },
  {
    id: 'mono-silky-sepia',
    name: 'Silky Sepia',
    category: 'B&W',
    description: 'Archival print emulation: rich chocolate shadows, warm cream paper highlights, soft vintage contrast, and fine photographic grain.',
    format: 'xmp',
    adjustments: {
      exposure: 0.1,
      contrast: 10,
      highlights: -20,
      shadows: 20,
      whites: -15,
      blacks: 15,
      temp: 6760, // +28 relative kelvin
      tint: 14,
      saturation: -85,
      vibrance: -80,
      grain: 20,
      grainSize: 2,
      grainRoughness: 45,
      colorGrading: {
        shadows: { hue: 35, saturation: 32, luminance: 0 }, // archival sepia chocolate
        midtones: { hue: 42, saturation: 18, luminance: 0 },
        highlights: { hue: 48, saturation: 28, luminance: 4 }, // warm cream print
        blending: 60,
        balance: 5,
      },
    },
  },
  {
    id: 'mono-cyanotype',
    name: 'Cyanotype',
    category: 'B&W',
    description: '19th-century photographic process: prussian and cobalt blue monochrome monochrome toning with historic architectural depth.',
    format: 'xmp',
    adjustments: {
      exposure: 0.0,
      contrast: 20,
      highlights: -10,
      shadows: -15,
      whites: 10,
      blacks: -10,
      temp: 3250, // -50 relative kelvin
      tint: -20,
      saturation: -90,
      vibrance: -85,
      grain: 18,
      grainSize: 2,
      grainRoughness: 45,
      colorGrading: {
        shadows: { hue: 218, saturation: 48, luminance: -6 }, // deep prussian blue
        midtones: { hue: 212, saturation: 36, luminance: 0 }, // cobalt cyan
        highlights: { hue: 204, saturation: 28, luminance: 4 }, // pale cyanotype wash
        blending: 80,
        balance: -5,
      },
    },
  },
  {
    id: 'spec-infrared',
    name: 'Infrared Aerochrome',
    category: 'B&W',
    description: 'Surreal Kodak Aerochrome color infrared: vegetation transposed to vibrant crimson/magenta while water and sky remain deep navy.',
    format: 'xmp',
    adjustments: {
      exposure: 0.15,
      contrast: 25,
      highlights: -10,
      shadows: 15,
      whites: 15,
      blacks: -10,
      temp: 5500,
      tint: 0,
      clarity: 15,
      vibrance: 20,
      hsl: {
        ...createDefaultHSLState(),
        green: { hue: -95, saturation: 65, luminance: 15 }, // foliage inverted to crimson
        yellow: { hue: -75, saturation: 55, luminance: 10 },
        aqua: { hue: 15, saturation: 40, luminance: -10 },
        blue: { hue: 10, saturation: 45, luminance: -18 }, // sky remains deep cobalt
        red: { hue: 5, saturation: 20, luminance: 5 },
        orange: { hue: -10, saturation: 20, luminance: 5 },
      },
      calibration: {
        shadowTint: 5,
        redHue: 20,
        redSaturation: 20,
        greenHue: -80,
        greenSaturation: 40,
        blueHue: -20,
        blueSaturation: 30,
      },
      colorGrading: {
        shadows: { hue: 210, saturation: 28, luminance: -6 },
        midtones: { hue: 0, saturation: 0, luminance: 0 },
        highlights: { hue: 345, saturation: 25, luminance: 4 }, // vivid crimson
        blending: 65,
        balance: 0,
      },
    },
  },
  {
    id: 'film-disposable-flash',
    name: '90s Disposable Flash',
    category: 'Film',
    description: 'Point-and-shoot nostalgia: direct harsh flash exposure, clipped bright whites, deep shadows, and high photographic noise.',
    format: 'xmp',
    adjustments: {
      exposure: 0.4,
      contrast: 28,
      highlights: 30,
      shadows: -15,
      whites: 35,
      blacks: -20,
      temp: 5860, // +8 relative kelvin
      tint: 2,
      saturation: 14,
      vibrance: 10,
      clarity: 12,
      grain: 40,
      grainSize: 3,
      grainRoughness: 60,
      vignette: -15,
      sharpening: 35,
    },
  },
];
