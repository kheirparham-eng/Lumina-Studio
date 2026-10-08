import {
  PhotoAdjustments,
  Preset,
  CurvePoint,
  HSLState,
  ColorGradingState,
  ToneCurveState,
  CalibrationState,
  ParametricCurveState,
  DetailState,
  OpticsState,
  MaskState,
} from '../types/editor';
import {
  createDefaultAdjustments,
  createDefaultHSLState,
  createDefaultColorGradingState,
  createDefaultToneCurveState,
  createDefaultCalibrationState,
  createDefaultParametricCurveState,
  createDefaultDetailState,
  createDefaultOpticsState,
} from './presets';

/**
 * Generates a standard UUID v4 string
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().toUpperCase();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16).toUpperCase();
  });
}

/**
 * Safely extracts a balanced Lua table block `{ ... }` for a given table name.
 */
export function extractLuaTableBlock(content: string, tableName: string): string | null {
  const regex = new RegExp(tableName + '\\s*=', 'i');
  const match = regex.exec(content);
  if (!match) return null;
  const startBrace = content.indexOf('{', match.index);
  if (startBrace === -1) return null;

  let depth = 1;
  let i = startBrace + 1;
  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    i++;
  }
  return content.slice(startBrace, i);
}

/**
 * Normalizes an array of curve coordinate numbers [x0, y0, x1, y1, ...]
 * into sorted CurvePoint[] with coordinates clamped between 0 and 255.
 */
function parseCurveCoordinates(numbers: number[]): CurvePoint[] {
  if (!numbers || numbers.length < 4) {
    return [
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ];
  }

  // Determine if coordinates are normalized 0.0 to 1.0 or already 0 to 255
  const maxVal = Math.max(...numbers);
  const isNormalized = maxVal <= 1.0001 && maxVal > 0;
  const scale = isNormalized ? 255 : 1;

  const points: CurvePoint[] = [];
  for (let i = 0; i < numbers.length - 1; i += 2) {
    const rawX = numbers[i] * scale;
    const rawY = numbers[i + 1] * scale;
    const x = Math.max(0, Math.min(255, Math.round(rawX)));
    const y = Math.max(0, Math.min(255, Math.round(rawY)));
    points.push({ x, y });
  }

  // Sort strictly by x ascending
  points.sort((a, b) => a.x - b.x);

  // Ensure endpoints exist
  if (points.length === 0 || points[0].x > 0) {
    points.unshift({ x: 0, y: points[0]?.y ?? 0 });
  }
  if (points[points.length - 1].x < 255) {
    points.push({ x: 255, y: points[points.length - 1].y ?? 255 });
  }

  return points;
}

/**
 * Maps raw Lightroom/Camera Raw key-value settings dictionary into Lumina Studio PhotoAdjustments.
 * Supports every develop component from both .xmp and .lrtemplate.
 */
export function mapLightroomSettingsToAdjustments(
  rawSettings: Record<string, any>
): Partial<PhotoAdjustments> {
  const adj: Partial<PhotoAdjustments> = {};

  const num = (key: string): number | undefined => {
    const val = rawSettings[key];
    if (val === undefined || val === null || val === '') return undefined;
    const n = parseFloat(String(val).replace(/["'+]/g, '').trim());
    return Number.isFinite(n) ? n : undefined;
  };

  // 1. Exposure (Lightroom is EV, typically -5.0 to +5.0)
  const exp = num('Exposure2012') ?? num('Exposure');
  if (exp !== undefined) adj.exposure = Math.max(-5, Math.min(5, exp));

  // 2. Contrast (-100 to +100)
  const cont = num('Contrast2012') ?? num('Contrast');
  if (cont !== undefined) adj.contrast = Math.max(-100, Math.min(100, cont));

  // 3. Highlights (-100 to +100)
  const hl = num('Highlights2012') ?? num('Highlights');
  if (hl !== undefined) adj.highlights = Math.max(-100, Math.min(100, hl));

  // 4. Shadows (-100 to +100)
  const sh = num('Shadows2012') ?? num('Shadows');
  if (sh !== undefined) adj.shadows = Math.max(-100, Math.min(100, sh));

  // 5. Whites (-100 to +100)
  const wh = num('Whites2012') ?? num('Whites');
  if (wh !== undefined) adj.whites = Math.max(-100, Math.min(100, wh));

  // 6. Blacks (-100 to +100)
  const bl = num('Blacks2012') ?? num('Blacks');
  if (bl !== undefined) adj.blacks = Math.max(-100, Math.min(100, bl));

  // 7. Temperature (Kelvin 2000-10000 or relative offset -100..100 or IncrementalTemperature)
  const incTemp = num('IncrementalTemperature');
  if (incTemp !== undefined) {
    adj.temp = Math.max(2000, Math.min(10000, Math.round(5500 + incTemp * 35)));
  } else {
    const temp = num('Temperature');
    if (temp !== undefined) {
      if (temp > 1000) {
        adj.temp = Math.max(2000, Math.min(10000, temp));
      } else if (temp >= -100 && temp <= 100) {
        adj.temp = Math.max(2000, Math.min(10000, Math.round(5500 + temp * 35)));
      }
    }
  }

  // 8. Tint & IncrementalTint (-100 to +100)
  const incTint = num('IncrementalTint');
  if (incTint !== undefined) {
    adj.tint = Math.max(-100, Math.min(100, incTint));
  } else {
    const tint = num('Tint');
    if (tint !== undefined) adj.tint = Math.max(-100, Math.min(100, tint));
  }

  // 9. Vibrance & Saturation (-100 to +100)
  const vib = num('Vibrance');
  if (vib !== undefined) adj.vibrance = Math.max(-100, Math.min(100, vib));

  const sat = num('Saturation');
  if (sat !== undefined) adj.saturation = Math.max(-100, Math.min(100, sat));

  // Grayscale toggle
  const isGrayscale =
    rawSettings['ConvertToGrayscale'] === true ||
    rawSettings['ConvertToGrayscale'] === 1 ||
    rawSettings['ConvertToGrayscale'] === 'true';
  if (isGrayscale) {
    adj.saturation = -100;
    adj.vibrance = -100;
  }

  // 10. Clarity, Texture, Dehaze (-100 to +100)
  const clar = num('Clarity2012') ?? num('Clarity');
  if (clar !== undefined) adj.clarity = Math.max(-100, Math.min(100, clar));

  const text = num('Texture');
  if (text !== undefined) adj.texture = Math.max(-100, Math.min(100, text));

  const dehaze = num('Dehaze');
  if (dehaze !== undefined) adj.dehaze = Math.max(-100, Math.min(100, dehaze));

  // 11. Sharpening & Detail
  const sharp = num('Sharpness') ?? num('Sharpening');
  if (sharp !== undefined) adj.sharpening = Math.max(0, Math.min(100, sharp));

  const sRadius = num('SharpenRadius');
  const sDetail = num('SharpenDetail');
  const sMasking = num('SharpenEdgeMasking');
  const lnrContrast = num('LuminanceNoiseReductionContrast');
  const cnrDetail = num('ColorNoiseReductionDetail');
  const cnrSmooth = num('ColorNoiseReductionSmoothness');

  if (
    sRadius !== undefined ||
    sDetail !== undefined ||
    sMasking !== undefined ||
    lnrContrast !== undefined ||
    cnrDetail !== undefined ||
    cnrSmooth !== undefined
  ) {
    adj.detailSettings = {
      sharpenRadius: sRadius ?? 1.0,
      sharpenDetail: sDetail ?? 25,
      sharpenEdgeMasking: sMasking ?? 0,
      luminanceNoiseContrast: lnrContrast ?? 0,
      colorNoiseDetail: cnrDetail ?? 50,
      colorNoiseSmoothness: cnrSmooth ?? 50,
    };
  }

  // 12. Noise Reduction
  const nr = num('LuminanceSmoothing') ?? num('NoiseReduction');
  if (nr !== undefined) adj.noiseReduction = Math.max(0, Math.min(100, nr));

  const cnr = num('ColorNoiseReduction');
  if (cnr !== undefined) adj.colorNoiseReduction = Math.max(0, Math.min(100, cnr));

  const nd = num('LuminanceNoiseReductionDetail') ?? num('NoiseDetail');
  if (nd !== undefined) adj.noiseDetail = Math.max(0, Math.min(100, nd));

  // 13. Vignette
  const vig = num('PostCropVignetteAmount') ?? num('VignetteAmount');
  if (vig !== undefined) adj.vignette = Math.max(-100, Math.min(100, vig));

  const vigMid = num('PostCropVignetteMidpoint') ?? num('VignetteMidpoint');
  if (vigMid !== undefined) adj.vignetteMidpoint = Math.max(0, Math.min(100, vigMid));

  // 14. Grain
  const grain = num('GrainAmount');
  if (grain !== undefined) adj.grain = Math.max(0, Math.min(100, grain));

  const grainSize = num('GrainSize');
  if (grainSize !== undefined) {
    adj.grainSize = Math.max(1, Math.min(5, Math.round(1 + (grainSize / 100) * 4)));
  }

  const grainRough = num('GrainFrequency') ?? num('GrainRoughness');
  if (grainRough !== undefined) adj.grainRoughness = Math.max(0, Math.min(100, grainRough));

  // 15. Chromatic Aberration & Optics
  const ca = num('ChromaticAberration') ?? num('AutoLateralCA') ?? num('Defringe');
  if (ca !== undefined) adj.chromaticAberration = Math.max(0, Math.min(100, ca > 1 ? ca : ca * 50));

  const defringePurple = num('DefringePurpleAmount');
  const defringeGreen = num('DefringeGreenAmount');
  const dist = num('LensManualDistortionAmount');
  const lpEnable = num('LensProfileEnable') === 1;

  if (defringePurple !== undefined || defringeGreen !== undefined || dist !== undefined || lpEnable) {
    adj.optics = {
      defringePurple: defringePurple ?? 0,
      defringeGreen: defringeGreen ?? 0,
      distortion: dist ?? 0,
      lensProfileEnable: lpEnable,
    };
  }

  // 16. Camera Calibration (Primaries & Shadow Tint)
  const redHue = num('RedHue');
  const redSat = num('RedSaturation');
  const greenHue = num('GreenHue');
  const greenSat = num('GreenSaturation');
  const blueHue = num('BlueHue');
  const blueSat = num('BlueSaturation');
  const shadowTint = num('ShadowTint');

  if (
    redHue !== undefined ||
    redSat !== undefined ||
    greenHue !== undefined ||
    greenSat !== undefined ||
    blueHue !== undefined ||
    blueSat !== undefined ||
    shadowTint !== undefined
  ) {
    adj.calibration = {
      shadowTint: shadowTint ?? 0,
      redHue: redHue ?? 0,
      redSaturation: redSat ?? 0,
      greenHue: greenHue ?? 0,
      greenSaturation: greenSat ?? 0,
      blueHue: blueHue ?? 0,
      blueSaturation: blueSat ?? 0,
    };
  }

  // 17. Parametric Curve (Lightroom 4-Zone curve)
  const pShadows = num('ParametricShadows');
  const pDarks = num('ParametricDarks');
  const pLights = num('ParametricLights');
  const pHighlights = num('ParametricHighlights');
  const pShadowSplit = num('ParametricShadowSplit');
  const pMidtoneSplit = num('ParametricMidtoneSplit');
  const pHighlightSplit = num('ParametricHighlightSplit');

  if (
    pShadows !== undefined ||
    pDarks !== undefined ||
    pLights !== undefined ||
    pHighlights !== undefined
  ) {
    adj.parametricCurve = {
      shadows: pShadows ?? 0,
      darks: pDarks ?? 0,
      lights: pLights ?? 0,
      highlights: pHighlights ?? 0,
      shadowSplit: pShadowSplit ?? 14,
      midtoneSplit: pMidtoneSplit ?? 43,
      highlightSplit: pHighlightSplit ?? 75,
    };
  }

  // 18. HSL Mixer
  const hsl: HSLState = createDefaultHSLState();
  let hasHSL = false;
  const channels = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'] as const;

  channels.forEach((ch) => {
    const capitalized = ch.charAt(0).toUpperCase() + ch.slice(1);
    const h = num(`HueAdjustment${capitalized}`);
    const s = num(`SaturationAdjustment${capitalized}`);
    const l = num(`LuminanceAdjustment${capitalized}`);

    if (h !== undefined || s !== undefined || l !== undefined) {
      hasHSL = true;
      hsl[ch] = {
        hue: h !== undefined ? Math.max(-100, Math.min(100, h)) : 0,
        saturation: s !== undefined ? Math.max(-100, Math.min(100, s)) : 0,
        luminance: l !== undefined ? Math.max(-100, Math.min(100, l)) : 0,
      };
    }
  });
  if (hasHSL) adj.hsl = hsl;

  // 19. Color Grading / Split Toning
  const splitShadowHue = num('SplitToningShadowHue') ?? num('ColorGradeShadowHue');
  const splitShadowSat = num('SplitToningShadowSaturation') ?? num('ColorGradeShadowSat');
  const splitShadowLum = num('ColorGradeShadowLum') ?? 0;

  const splitHighlightHue = num('SplitToningHighlightHue') ?? num('ColorGradeHighlightHue');
  const splitHighlightSat = num('SplitToningHighlightSaturation') ?? num('ColorGradeHighlightSat');
  const splitHighlightLum = num('ColorGradeHighlightLum') ?? 0;

  const midtoneHue = num('ColorGradeMidtoneHue');
  const midtoneSat = num('ColorGradeMidtoneSat');
  const midtoneLum = num('ColorGradeMidtoneLum') ?? 0;

  const cgBalance = num('ColorGradeBalance') ?? num('SplitToningBalance');
  const cgBlending = num('ColorGradeBlending');

  if (
    splitShadowHue !== undefined ||
    splitHighlightHue !== undefined ||
    midtoneHue !== undefined ||
    cgBalance !== undefined ||
    cgBlending !== undefined
  ) {
    const cg: ColorGradingState = createDefaultColorGradingState();
    if (splitShadowHue !== undefined || splitShadowSat !== undefined) {
      cg.shadows = {
        hue: Math.max(0, Math.min(360, splitShadowHue ?? 0)),
        saturation: Math.max(0, Math.min(100, splitShadowSat ?? 0)),
        luminance: Math.max(-100, Math.min(100, splitShadowLum)),
      };
    }
    if (midtoneHue !== undefined || midtoneSat !== undefined) {
      cg.midtones = {
        hue: Math.max(0, Math.min(360, midtoneHue ?? 0)),
        saturation: Math.max(0, Math.min(100, midtoneSat ?? 0)),
        luminance: Math.max(-100, Math.min(100, midtoneLum)),
      };
    }
    if (splitHighlightHue !== undefined || splitHighlightSat !== undefined) {
      cg.highlights = {
        hue: Math.max(0, Math.min(360, splitHighlightHue ?? 0)),
        saturation: Math.max(0, Math.min(100, splitHighlightSat ?? 0)),
        luminance: Math.max(-100, Math.min(100, splitHighlightLum)),
      };
    }
    if (cgBalance !== undefined) cg.balance = Math.max(-100, Math.min(100, cgBalance));
    if (cgBlending !== undefined) cg.blending = Math.max(0, Math.min(100, cgBlending));
    adj.colorGrading = cg;
  }

  // 20. Tone Curves
  const toneCurve: ToneCurveState = createDefaultToneCurveState();
  let hasCurve = false;

  const masterPoints = rawSettings['ToneCurvePV2012'] ?? rawSettings['ToneCurve'];
  if (Array.isArray(masterPoints) && masterPoints.length >= 4) {
    toneCurve.master = parseCurveCoordinates(masterPoints);
    hasCurve = true;
  }

  const redPoints = rawSettings['ToneCurvePV2012Red'] ?? rawSettings['ToneCurveRed'];
  if (Array.isArray(redPoints) && redPoints.length >= 4) {
    toneCurve.red = parseCurveCoordinates(redPoints);
    hasCurve = true;
  }

  const greenPoints = rawSettings['ToneCurvePV2012Green'] ?? rawSettings['ToneCurveGreen'];
  if (Array.isArray(greenPoints) && greenPoints.length >= 4) {
    toneCurve.green = parseCurveCoordinates(greenPoints);
    hasCurve = true;
  }

  const bluePoints = rawSettings['ToneCurvePV2012Blue'] ?? rawSettings['ToneCurveBlue'];
  if (Array.isArray(bluePoints) && bluePoints.length >= 4) {
    toneCurve.blue = parseCurveCoordinates(bluePoints);
    hasCurve = true;
  }

  if (hasCurve) {
    adj.toneCurve = toneCurve;
  }

  // 21. Local Selective Masking (if extracted)
  if (rawSettings['mask']) {
    adj.mask = rawSettings['mask'];
  }

  return adj;
}

/**
 * Parses Adobe Camera Raw / Lightroom .xmp XML files.
 */
export function parseXmp(content: string, filename?: string): Preset {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');

  // Check for XML parsing error
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Failed to parse XMP XML: ${parserError.textContent?.slice(0, 100)}`);
  }

  const rawSettings: Record<string, any> = {};

  // Find rdf:Description or any element containing crs attributes
  const descriptionElements = xmlDoc.querySelectorAll('Description, rdf\\:Description');
  const targetElement = descriptionElements.length > 0 ? descriptionElements[0] : xmlDoc.documentElement;

  // 1. Extract attributes
  for (let i = 0; i < targetElement.attributes.length; i++) {
    const attr = targetElement.attributes[i];
    const name = attr.name.replace(/^[a-zA-Z0-9_-]+:/, ''); // strip namespace prefix e.g. crs:
    rawSettings[name] = attr.value;
  }

  // 2. Extract child nodes
  const allElements = xmlDoc.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const localName = el.localName || el.tagName.replace(/^[a-zA-Z0-9_-]+:/, '');

    // Skip container elements
    if (['xmpmeta', 'RDF', 'Description', 'Seq', 'Alt'].includes(localName)) continue;

    // Check if it's a Tone Curve sequence
    if (
      ['ToneCurvePV2012', 'ToneCurvePV2012Red', 'ToneCurvePV2012Green', 'ToneCurvePV2012Blue', 'ToneCurve'].includes(
        localName
      )
    ) {
      const liElements = el.querySelectorAll('li, rdf\\:li');
      if (liElements.length > 0) {
        const coords: number[] = [];
        liElements.forEach((li) => {
          const parts = (li.textContent || '').split(/[,\s]+/).filter(Boolean);
          if (parts.length >= 2) {
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            if (!isNaN(x) && !isNaN(y)) {
              coords.push(x, y);
            }
          }
        });
        if (coords.length >= 4) {
          rawSettings[localName] = coords;
        }
      }
      continue;
    }

    // Check if it has simple text content
    if (el.children.length === 0 && el.textContent) {
      const text = el.textContent.trim();
      if (text) {
        rawSettings[localName] = text;
      }
    } else {
      // Check for <rdf:Alt><rdf:li>...</rdf:li></rdf:Alt> text
      const li = el.querySelector('li, rdf\\:li');
      if (li && li.textContent) {
        rawSettings[localName] = li.textContent.trim();
      }
    }
  }

  // 3. Extract Local Gradient & Circular Masks from XMP
  const circEl = xmlDoc.querySelector('CircularGradientBasedCorrections, crs\\:CircularGradientBasedCorrections');
  if (circEl) {
    const maskLi = circEl.querySelector('li, rdf\\:li');
    if (maskLi) {
      const getVal = (k: string) => {
        const a = maskLi.getAttribute(k) || maskLi.getAttribute(`crs:${k}`);
        if (a) return parseFloat(a);
        const ch = maskLi.querySelector(k) || maskLi.querySelector(`crs\\:${k}`);
        return ch?.textContent ? parseFloat(ch.textContent) : undefined;
      };
      const top = getVal('Top') ?? 0;
      const bottom = getVal('Bottom') ?? 0;
      const left = getVal('Left') ?? 0;
      const right = getVal('Right') ?? 0;
      const feather = getVal('Feather') ?? 50;
      const isFlipped = (maskLi.getAttribute('crs:Flipped') || maskLi.getAttribute('Flipped')) === 'true';

      const desc = circEl.querySelector('Description, rdf\\:Description') || maskLi;
      const getDescVal = (k: string) => {
        const a = desc.getAttribute(k) || desc.getAttribute(`crs:${k}`);
        if (a) return parseFloat(a);
        const ch = desc.querySelector(k) || desc.querySelector(`crs\\:${k}`);
        return ch?.textContent ? parseFloat(ch.textContent) : undefined;
      };

      let cX = (left + right) / 2;
      let cY = (top + bottom) / 2;
      let rX = Math.abs(right - left) / 2;
      let rY = Math.abs(bottom - top) / 2;
      if (rX < 0.01 && rY < 0.01) {
        cX = 0.5;
        cY = 0.5;
        rX = 0.35;
        rY = 0.35;
      }

      rawSettings['mask'] = {
        type: 'radial',
        invert: isFlipped,
        opacity: 100,
        feather: Math.max(0, Math.min(100, feather)),
        centerX: cX,
        centerY: cY,
        radiusX: rX,
        radiusY: rY,
        startX: 0.5,
        startY: 0.2,
        endX: 0.5,
        endY: 0.8,
        exposure: getDescVal('LocalExposure2012') ?? getDescVal('LocalExposure') ?? 0,
        contrast: getDescVal('LocalContrast2012') ?? getDescVal('LocalContrast') ?? 0,
        temp: getDescVal('LocalTemperature') ?? 0,
        saturation: getDescVal('LocalSaturation') ?? 0,
        clarity: getDescVal('LocalClarity2012') ?? getDescVal('LocalClarity') ?? 0,
      };
    }
  } else {
    const gradEl = xmlDoc.querySelector('GradientBasedCorrections, crs\\:GradientBasedCorrections');
    if (gradEl) {
      const maskLi = gradEl.querySelector('li, rdf\\:li');
      if (maskLi) {
        const getVal = (k: string) => {
          const a = maskLi.getAttribute(k) || maskLi.getAttribute(`crs:${k}`);
          if (a) return parseFloat(a);
          const ch = maskLi.querySelector(k) || maskLi.querySelector(`crs\\:${k}`);
          return ch?.textContent ? parseFloat(ch.textContent) : undefined;
        };
        const desc = gradEl.querySelector('Description, rdf\\:Description') || maskLi;
        const getDescVal = (k: string) => {
          const a = desc.getAttribute(k) || desc.getAttribute(`crs:${k}`);
          if (a) return parseFloat(a);
          const ch = desc.querySelector(k) || desc.querySelector(`crs\\:${k}`);
          return ch?.textContent ? parseFloat(ch.textContent) : undefined;
        };

        rawSettings['mask'] = {
          type: 'linear',
          invert: false,
          opacity: 100,
          feather: 50,
          centerX: 0.5,
          centerY: 0.5,
          radiusX: 0.35,
          radiusY: 0.35,
          startX: getVal('ZeroX') ?? 0.5,
          startY: getVal('ZeroY') ?? 0.2,
          endX: getVal('FullX') ?? 0.5,
          endY: getVal('FullY') ?? 0.8,
          exposure: getDescVal('LocalExposure2012') ?? getDescVal('LocalExposure') ?? 0,
          contrast: getDescVal('LocalContrast2012') ?? getDescVal('LocalContrast') ?? 0,
          temp: getDescVal('LocalTemperature') ?? 0,
          saturation: getDescVal('LocalSaturation') ?? 0,
          clarity: getDescVal('LocalClarity2012') ?? getDescVal('LocalClarity') ?? 0,
        };
      }
    }
  }

  // Determine Preset Name
  let name =
    rawSettings['Name'] ||
    rawSettings['Title'] ||
    rawSettings['PresetName'] ||
    (filename ? filename.replace(/\.(xmp|xml)$/i, '') : 'Imported XMP Preset');

  // Determine Category / Group
  let category = rawSettings['Group'] || rawSettings['Cluster'] || 'Imported XMP';

  const adjustments = mapLightroomSettingsToAdjustments(rawSettings);

  return {
    id: `xmp-${generateUUID().slice(0, 8)}`,
    name,
    category,
    description: `Lightroom XMP preset with ${Object.keys(adjustments).length} adjustments.`,
    format: 'xmp',
    rawSource: content,
    adjustments,
  };
}

/**
 * Parses Adobe Lightroom Classic .lrtemplate Lua-table files.
 */
export function parseLrtemplate(content: string, filename?: string): Preset {
  const rawSettings: Record<string, any> = {};

  // Extract Title / Name
  let nameMatch = content.match(/title\s*=\s*["']([^"']+)["']/i);
  if (!nameMatch) {
    nameMatch = content.match(/internalName\s*=\s*["']([^"']+)["']/i);
  }
  const name = nameMatch
    ? nameMatch[1]
    : filename
    ? filename.replace(/\.lrtemplate$/i, '')
    : 'Imported .lrtemplate Preset';

  // Extract Tone Curve Tables first
  // Supports multi-line format with arbitrary newlines or indentation
  const curveNames = ['ToneCurvePV2012', 'ToneCurvePV2012Red', 'ToneCurvePV2012Green', 'ToneCurvePV2012Blue', 'ToneCurve'];
  for (const cName of curveNames) {
    const tableBlock = extractLuaTableBlock(content, cName);
    if (tableBlock) {
      const numbers = (tableBlock.match(/[+-]?[0-9]+(?:\.[0-9]+)?/g) || []).map(Number);
      if (numbers.length >= 4) {
        rawSettings[cName] = numbers;
      }
    }
  }

  // Extract Local Masks (Circular Gradient / Radial & Gradient / Linear)
  const circBlock = extractLuaTableBlock(content, 'CircularGradientBasedCorrections');
  if (circBlock && !circBlock.includes('CorrectionActive = false')) {
    const numInBlock = (k: string) => {
      const m = circBlock.match(new RegExp(`${k}\\s*=\\s*([+-]?[0-9]*\\.?[0-9]+)`, 'i'));
      return m ? parseFloat(m[1]) : undefined;
    };
    const top = numInBlock('Top') ?? 0;
    const bottom = numInBlock('Bottom') ?? 0;
    const left = numInBlock('Left') ?? 0;
    const right = numInBlock('Right') ?? 0;
    const feather = numInBlock('Feather') ?? 50;
    const isFlipped = /Flipped\s*=\s*true/i.test(circBlock);

    const locExp = numInBlock('LocalExposure2012') ?? numInBlock('LocalExposure') ?? 0;
    const locCont = numInBlock('LocalContrast2012') ?? numInBlock('LocalContrast') ?? 0;
    const locTemp = numInBlock('LocalTemperature') ?? 0;
    const locClarity = numInBlock('LocalClarity2012') ?? numInBlock('LocalClarity') ?? 0;
    const locSat = numInBlock('LocalSaturation') ?? 0;

    let cX = (left + right) / 2;
    let cY = (top + bottom) / 2;
    let rX = Math.abs(right - left) / 2;
    let rY = Math.abs(bottom - top) / 2;
    if (rX < 0.01 && rY < 0.01) {
      cX = 0.5;
      cY = 0.5;
      rX = 0.35;
      rY = 0.35;
    }

    rawSettings['mask'] = {
      type: 'radial',
      invert: isFlipped,
      opacity: 100,
      feather: Math.max(0, Math.min(100, feather)),
      centerX: cX,
      centerY: cY,
      radiusX: rX,
      radiusY: rY,
      startX: 0.5,
      startY: 0.2,
      endX: 0.5,
      endY: 0.8,
      exposure: locExp,
      contrast: locCont,
      temp: locTemp,
      saturation: locSat,
      clarity: locClarity,
    };
  } else {
    const gradBlock = extractLuaTableBlock(content, 'GradientBasedCorrections');
    if (gradBlock && !gradBlock.includes('CorrectionActive = false')) {
      const numInBlock = (k: string) => {
        const m = gradBlock.match(new RegExp(`${k}\\s*=\\s*([+-]?[0-9]*\\.?[0-9]+)`, 'i'));
        return m ? parseFloat(m[1]) : undefined;
      };
      const fullX = numInBlock('FullX') ?? 0.5;
      const fullY = numInBlock('FullY') ?? 0.8;
      const zeroX = numInBlock('ZeroX') ?? 0.5;
      const zeroY = numInBlock('ZeroY') ?? 0.2;

      const locExp = numInBlock('LocalExposure2012') ?? numInBlock('LocalExposure') ?? 0;
      const locCont = numInBlock('LocalContrast2012') ?? numInBlock('LocalContrast') ?? 0;
      const locTemp = numInBlock('LocalTemperature') ?? 0;
      const locClarity = numInBlock('LocalClarity2012') ?? numInBlock('LocalClarity') ?? 0;
      const locSat = numInBlock('LocalSaturation') ?? 0;

      rawSettings['mask'] = {
        type: 'linear',
        invert: false,
        opacity: 100,
        feather: 50,
        centerX: 0.5,
        centerY: 0.5,
        radiusX: 0.35,
        radiusY: 0.35,
        startX: zeroX,
        startY: zeroY,
        endX: fullX,
        endY: fullY,
        exposure: locExp,
        contrast: locCont,
        temp: locTemp,
        saturation: locSat,
        clarity: locClarity,
      };
    }
  }

  // Extract scalar key-value pairs (e.g. Exposure2012 = -0.35, IncrementalTemperature = 24, RedHue = 47)
  const pairMatches = content.matchAll(
    /([a-zA-Z0-9_]+)\s*=\s*([+-]?[0-9]*\.?[0-9]+|"[^"]*"|'[^']*'|true|false)\s*,?/g
  );
  for (const match of pairMatches) {
    const key = match[1];
    let valStr = match[2].trim();

    // Ignore top-level metadata keys here
    if (['id', 'internalName', 'title', 'type', 'version', 'uuid'].includes(key)) continue;

    if (valStr.startsWith('"') || valStr.startsWith("'")) {
      rawSettings[key] = valStr.slice(1, -1);
    } else if (valStr === 'true') {
      rawSettings[key] = 1;
    } else if (valStr === 'false') {
      rawSettings[key] = 0;
    } else {
      const numVal = parseFloat(valStr);
      rawSettings[key] = isNaN(numVal) ? valStr : numVal;
    }
  }

  const adjustments = mapLightroomSettingsToAdjustments(rawSettings);

  return {
    id: `lrt-${generateUUID().slice(0, 8)}`,
    name,
    category: 'Lightroom Classic (.lrtemplate)',
    description: `Lightroom Classic legacy preset with ${Object.keys(adjustments).length} adjustments.`,
    format: 'lrtemplate',
    rawSource: content,
    adjustments,
  };
}

/**
 * Unified loader that parses .xmp, .lrtemplate, or .json preset files based on file extension or contents.
 */
export function parseLightroomPresetFile(content: string, filename: string): Preset {
  const lowerName = filename.toLowerCase();

  if (
    lowerName.endsWith('.xmp') ||
    lowerName.endsWith('.xml') ||
    content.includes('<x:xmpmeta') ||
    content.includes('<rdf:RDF')
  ) {
    return parseXmp(content, filename);
  }

  if (
    lowerName.endsWith('.lrtemplate') ||
    content.includes('s = {') ||
    content.includes('value = {') ||
    content.includes('settings = {')
  ) {
    return parseLrtemplate(content, filename);
  }

  if (lowerName.endsWith('.json') || content.trim().startsWith('{')) {
    const parsed = JSON.parse(content);
    if (parsed.adjustments) {
      return {
        id: parsed.id || `preset-${generateUUID().slice(0, 8)}`,
        name: parsed.name || filename.replace(/\.json$/i, ''),
        category: parsed.category || 'User',
        description: parsed.description || 'Imported preset JSON',
        format: 'custom',
        adjustments: parsed.adjustments,
      };
    }
  }

  // Fallback sniffing
  if (content.includes('<') && content.includes('>')) {
    return parseXmp(content, filename);
  }
  return parseLrtemplate(content, filename);
}

/**
 * Serializes current Lumina Studio PhotoAdjustments into an authentic Adobe Camera Raw .xmp file.
 */
export function exportToXmp(
  presetName: string,
  inputAdjustments: Partial<PhotoAdjustments>,
  group = 'Lumina Studio'
): string {
  const adjustments: PhotoAdjustments = {
    ...createDefaultAdjustments(),
    ...inputAdjustments,
  };
  const uuid = generateUUID();
  const expVal = (adjustments.exposure >= 0 ? '+' : '') + adjustments.exposure.toFixed(2);
  const contVal = (adjustments.contrast >= 0 ? '+' : '') + Math.round(adjustments.contrast);
  const hlVal = (adjustments.highlights >= 0 ? '+' : '') + Math.round(adjustments.highlights);
  const shVal = (adjustments.shadows >= 0 ? '+' : '') + Math.round(adjustments.shadows);
  const whVal = (adjustments.whites >= 0 ? '+' : '') + Math.round(adjustments.whites);
  const blVal = (adjustments.blacks >= 0 ? '+' : '') + Math.round(adjustments.blacks);
  const tintVal = (adjustments.tint >= 0 ? '+' : '') + Math.round(adjustments.tint);
  const vibVal = (adjustments.vibrance >= 0 ? '+' : '') + Math.round(adjustments.vibrance);
  const satVal = (adjustments.saturation >= 0 ? '+' : '') + Math.round(adjustments.saturation);
  const clarVal = (adjustments.clarity >= 0 ? '+' : '') + Math.round(adjustments.clarity);
  const textVal = (adjustments.texture >= 0 ? '+' : '') + Math.round(adjustments.texture);
  const dehazeVal = (adjustments.dehaze >= 0 ? '+' : '') + Math.round(adjustments.dehaze);
  const sharpVal = '+' + Math.round(adjustments.sharpening);
  const nrVal = Math.round(adjustments.noiseReduction);
  const cnrVal = Math.round(adjustments.colorNoiseReduction ?? 0);
  const vigVal = (adjustments.vignette >= 0 ? '+' : '') + Math.round(adjustments.vignette);
  const vigMidVal = Math.round(adjustments.vignetteMidpoint);
  const grainVal = '+' + Math.round(adjustments.grain);
  const grainSizeVal = '+' + Math.round(((adjustments.grainSize - 1) / 4) * 100);
  const grainFreqVal = '+' + Math.round(adjustments.grainRoughness);

  const formatSeq = (points: CurvePoint[]) => {
    return points.map((p) => `      <rdf:li>${p.x}, ${p.y}</rdf:li>`).join('\n');
  };

  const hsl = adjustments.hsl;
  const hslAttributes = [
    `crs:HueAdjustmentRed="${hsl.red.hue >= 0 ? '+' : ''}${Math.round(hsl.red.hue)}"`,
    `crs:HueAdjustmentOrange="${hsl.orange.hue >= 0 ? '+' : ''}${Math.round(hsl.orange.hue)}"`,
    `crs:HueAdjustmentYellow="${hsl.yellow.hue >= 0 ? '+' : ''}${Math.round(hsl.yellow.hue)}"`,
    `crs:HueAdjustmentGreen="${hsl.green.hue >= 0 ? '+' : ''}${Math.round(hsl.green.hue)}"`,
    `crs:HueAdjustmentAqua="${hsl.aqua.hue >= 0 ? '+' : ''}${Math.round(hsl.aqua.hue)}"`,
    `crs:HueAdjustmentBlue="${hsl.blue.hue >= 0 ? '+' : ''}${Math.round(hsl.blue.hue)}"`,
    `crs:HueAdjustmentPurple="${hsl.purple.hue >= 0 ? '+' : ''}${Math.round(hsl.purple.hue)}"`,
    `crs:HueAdjustmentMagenta="${hsl.magenta.hue >= 0 ? '+' : ''}${Math.round(hsl.magenta.hue)}"`,
    `crs:SaturationAdjustmentRed="${hsl.red.saturation >= 0 ? '+' : ''}${Math.round(hsl.red.saturation)}"`,
    `crs:SaturationAdjustmentOrange="${hsl.orange.saturation >= 0 ? '+' : ''}${Math.round(hsl.orange.saturation)}"`,
    `crs:SaturationAdjustmentYellow="${hsl.yellow.saturation >= 0 ? '+' : ''}${Math.round(hsl.yellow.saturation)}"`,
    `crs:SaturationAdjustmentGreen="${hsl.green.saturation >= 0 ? '+' : ''}${Math.round(hsl.green.saturation)}"`,
    `crs:SaturationAdjustmentAqua="${hsl.aqua.saturation >= 0 ? '+' : ''}${Math.round(hsl.aqua.saturation)}"`,
    `crs:SaturationAdjustmentBlue="${hsl.blue.saturation >= 0 ? '+' : ''}${Math.round(hsl.blue.saturation)}"`,
    `crs:SaturationAdjustmentPurple="${hsl.purple.saturation >= 0 ? '+' : ''}${Math.round(hsl.purple.saturation)}"`,
    `crs:SaturationAdjustmentMagenta="${hsl.magenta.saturation >= 0 ? '+' : ''}${Math.round(hsl.magenta.saturation)}"`,
    `crs:LuminanceAdjustmentRed="${hsl.red.luminance >= 0 ? '+' : ''}${Math.round(hsl.red.luminance)}"`,
    `crs:LuminanceAdjustmentOrange="${hsl.orange.luminance >= 0 ? '+' : ''}${Math.round(hsl.orange.luminance)}"`,
    `crs:LuminanceAdjustmentYellow="${hsl.yellow.luminance >= 0 ? '+' : ''}${Math.round(hsl.yellow.luminance)}"`,
    `crs:LuminanceAdjustmentGreen="${hsl.green.luminance >= 0 ? '+' : ''}${Math.round(hsl.green.luminance)}"`,
    `crs:LuminanceAdjustmentAqua="${hsl.aqua.luminance >= 0 ? '+' : ''}${Math.round(hsl.aqua.luminance)}"`,
    `crs:LuminanceAdjustmentBlue="${hsl.blue.luminance >= 0 ? '+' : ''}${Math.round(hsl.blue.luminance)}"`,
    `crs:LuminanceAdjustmentPurple="${hsl.purple.luminance >= 0 ? '+' : ''}${Math.round(hsl.purple.luminance)}"`,
    `crs:LuminanceAdjustmentMagenta="${hsl.magenta.luminance >= 0 ? '+' : ''}${Math.round(hsl.magenta.luminance)}"`,
  ].join('\n   ');

  const cg = adjustments.colorGrading;
  const colorGradingAttributes = [
    `crs:SplitToningShadowHue="${Math.round(cg.shadows.hue)}"`,
    `crs:SplitToningShadowSaturation="${Math.round(cg.shadows.saturation)}"`,
    `crs:SplitToningHighlightHue="${Math.round(cg.highlights.hue)}"`,
    `crs:SplitToningHighlightSaturation="${Math.round(cg.highlights.saturation)}"`,
    `crs:SplitToningBalance="${Math.round(cg.balance)}"`,
    `crs:ColorGradeMidtoneHue="${Math.round(cg.midtones.hue)}"`,
    `crs:ColorGradeMidtoneSat="${Math.round(cg.midtones.saturation)}"`,
    `crs:ColorGradeMidtoneLum="${Math.round(cg.midtones.luminance)}"`,
    `crs:ColorGradeShadowLum="${Math.round(cg.shadows.luminance)}"`,
    `crs:ColorGradeHighlightLum="${Math.round(cg.highlights.luminance)}"`,
    `crs:ColorGradeBlending="${Math.round(cg.blending)}"`,
  ].join('\n   ');

  // Camera Calibration attributes
  const calib = adjustments.calibration;
  const calibrationAttributes = calib
    ? [
        `crs:ShadowTint="${Math.round(calib.shadowTint)}"`,
        `crs:RedHue="${Math.round(calib.redHue)}"`,
        `crs:RedSaturation="${Math.round(calib.redSaturation)}"`,
        `crs:GreenHue="${Math.round(calib.greenHue)}"`,
        `crs:GreenSaturation="${Math.round(calib.greenSaturation)}"`,
        `crs:BlueHue="${Math.round(calib.blueHue)}"`,
        `crs:BlueSaturation="${Math.round(calib.blueSaturation)}"`,
      ].join('\n   ')
    : '';

  // Parametric Curve attributes
  const pc = adjustments.parametricCurve;
  const parametricAttributes = pc
    ? [
        `crs:ParametricShadows="${Math.round(pc.shadows)}"`,
        `crs:ParametricDarks="${Math.round(pc.darks)}"`,
        `crs:ParametricLights="${Math.round(pc.lights)}"`,
        `crs:ParametricHighlights="${Math.round(pc.highlights)}"`,
        `crs:ParametricShadowSplit="${Math.round(pc.shadowSplit)}"`,
        `crs:ParametricMidtoneSplit="${Math.round(pc.midtoneSplit)}"`,
        `crs:ParametricHighlightSplit="${Math.round(pc.highlightSplit)}"`,
      ].join('\n   ')
    : '';

  const tc = adjustments.toneCurve;

  // Mask serialization
  const mask = adjustments.mask;
  let maskXml = '';
  if (mask && mask.type === 'radial') {
    maskXml = `   <crs:CircularGradientBasedCorrections>
    <rdf:Seq>
     <rdf:li>
      <rdf:Description
       crs:What="Correction"
       crs:CorrectionAmount="1.000000"
       crs:CorrectionActive="true"
       crs:LocalExposure2012="${mask.exposure.toFixed(2)}"
       crs:LocalContrast2012="${Math.round(mask.contrast)}"
       crs:LocalClarity2012="${Math.round(mask.clarity)}"
       crs:LocalSaturation="${Math.round(mask.saturation)}"
       crs:LocalTemperature="${Math.round(mask.temp)}">
       <crs:CorrectionMasks>
        <rdf:Seq>
         <rdf:li
          crs:What="Mask/CircularGradient"
          crs:MaskValue="1.000000"
          crs:Top="${Math.max(0, mask.centerY - mask.radiusY).toFixed(6)}"
          crs:Left="${Math.max(0, mask.centerX - mask.radiusX).toFixed(6)}"
          crs:Bottom="${Math.min(1, mask.centerY + mask.radiusY).toFixed(6)}"
          crs:Right="${Math.min(1, mask.centerX + mask.radiusX).toFixed(6)}"
          crs:Feather="${Math.round(mask.feather)}"
          crs:Flipped="${mask.invert ? 'true' : 'false'}"/>
        </rdf:Seq>
       </crs:CorrectionMasks>
      </rdf:Description>
     </rdf:li>
    </rdf:Seq>
   </crs:CircularGradientBasedCorrections>`;
  } else if (mask && mask.type === 'linear') {
    maskXml = `   <crs:GradientBasedCorrections>
    <rdf:Seq>
     <rdf:li>
      <rdf:Description
       crs:What="Correction"
       crs:CorrectionAmount="1.000000"
       crs:CorrectionActive="true"
       crs:LocalExposure2012="${mask.exposure.toFixed(2)}"
       crs:LocalContrast2012="${Math.round(mask.contrast)}"
       crs:LocalClarity2012="${Math.round(mask.clarity)}"
       crs:LocalSaturation="${Math.round(mask.saturation)}"
       crs:LocalTemperature="${Math.round(mask.temp)}">
       <crs:CorrectionMasks>
        <rdf:Seq>
         <rdf:li
          crs:What="Mask/Gradient"
          crs:MaskValue="1.000000"
          crs:ZeroX="${mask.startX.toFixed(6)}"
          crs:ZeroY="${mask.startY.toFixed(6)}"
          crs:FullX="${mask.endX.toFixed(6)}"
          crs:FullY="${mask.endY.toFixed(6)}"/>
        </rdf:Seq>
       </crs:CorrectionMasks>
      </rdf:Description>
     </rdf:li>
    </rdf:Seq>
   </crs:GradientBasedCorrections>`;
  }

  return `<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c140">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
   xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
   crs:PresetType="Normal"
   crs:Cluster=""
   crs:UUID="${uuid}"
   crs:SupportsAmount="true"
   crs:ProcessVersion="11.0"
   crs:WhiteBalance="Custom"
   crs:Exposure2012="${expVal}"
   crs:Contrast2012="${contVal}"
   crs:Highlights2012="${hlVal}"
   crs:Shadows2012="${shVal}"
   crs:Whites2012="${whVal}"
   crs:Blacks2012="${blVal}"
   crs:Temperature="${Math.round(adjustments.temp)}"
   crs:Tint="${tintVal}"
   crs:Vibrance="${vibVal}"
   crs:Saturation="${satVal}"
   crs:Clarity2012="${clarVal}"
   crs:Texture="${textVal}"
   crs:Dehaze="${dehazeVal}"
   crs:Sharpening="${sharpVal}"
   crs:Sharpness="${sharpVal}"
   crs:LuminanceSmoothing="${nrVal}"
   crs:ColorNoiseReduction="${cnrVal}"
   crs:PostCropVignetteAmount="${vigVal}"
   crs:PostCropVignetteMidpoint="${vigMidVal}"
   crs:GrainAmount="${grainVal}"
   crs:GrainSize="${grainSizeVal}"
   crs:GrainFrequency="${grainFreqVal}"
   ${hslAttributes}
   ${colorGradingAttributes}
   ${calibrationAttributes}
   ${parametricAttributes}>
   <crs:Name>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">${presetName}</rdf:li>
    </rdf:Alt>
   </crs:Name>
   <crs:Group>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">${group}</rdf:li>
    </rdf:Alt>
   </crs:Group>
   <crs:ToneCurvePV2012>
    <rdf:Seq>
${formatSeq(tc.master)}
    </rdf:Seq>
   </crs:ToneCurvePV2012>
   <crs:ToneCurvePV2012Red>
    <rdf:Seq>
${formatSeq(tc.red)}
    </rdf:Seq>
   </crs:ToneCurvePV2012Red>
   <crs:ToneCurvePV2012Green>
    <rdf:Seq>
${formatSeq(tc.green)}
    </rdf:Seq>
   </crs:ToneCurvePV2012Green>
   <crs:ToneCurvePV2012Blue>
    <rdf:Seq>
${formatSeq(tc.blue)}
    </rdf:Seq>
   </crs:ToneCurvePV2012Blue>
${maskXml}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>`;
}

/**
 * Serializes current Lumina Studio PhotoAdjustments into an authentic Adobe Lightroom Classic .lrtemplate file.
 */
export function exportToLrtemplate(
  presetName: string,
  inputAdjustments: Partial<PhotoAdjustments>,
  group = 'Lumina Studio'
): string {
  const adjustments: PhotoAdjustments = {
    ...createDefaultAdjustments(),
    ...inputAdjustments,
  };
  const uuid = generateUUID();
  const tc = adjustments.toneCurve;
  const hsl = adjustments.hsl;
  const cg = adjustments.colorGrading;
  const calib = adjustments.calibration ?? createDefaultCalibrationState();
  const pc = adjustments.parametricCurve ?? createDefaultParametricCurveState();
  const mask = adjustments.mask;

  const formatPoints = (points: CurvePoint[]) => {
    return points.map((p) => `\t\t\t\t${p.x},\n\t\t\t\t${p.y},`).join('\n');
  };

  let maskLua = '';
  if (mask && mask.type === 'radial') {
    maskLua = `\t\t\tCircularGradientBasedCorrections = {
\t\t\t\t{
\t\t\t\t\tCorrectionActive = true,
\t\t\t\t\tCorrectionAmount = 1,
\t\t\t\t\tCorrectionID = "${generateUUID()}",
\t\t\t\t\tCorrectionMasks = {
\t\t\t\t\t\t{
\t\t\t\t\t\t\tAngle = 0,
\t\t\t\t\t\t\tBottom = ${(mask.centerY + mask.radiusY).toFixed(6)},
\t\t\t\t\t\t\tFeather = ${Math.round(mask.feather)},
\t\t\t\t\t\t\tFlipped = ${mask.invert ? 'true' : 'false'},
\t\t\t\t\t\t\tLeft = ${(mask.centerX - mask.radiusX).toFixed(6)},
\t\t\t\t\t\t\tRight = ${(mask.centerX + mask.radiusX).toFixed(6)},
\t\t\t\t\t\t\tTop = ${(mask.centerY - mask.radiusY).toFixed(6)},
\t\t\t\t\t\t\tWhat = "Mask/CircularGradient",
\t\t\t\t\t\t},
\t\t\t\t\t},
\t\t\t\t\tLocalExposure2012 = ${mask.exposure.toFixed(2)},
\t\t\t\t\tLocalContrast2012 = ${Math.round(mask.contrast)},
\t\t\t\t\tLocalClarity2012 = ${Math.round(mask.clarity)},
\t\t\t\t\tLocalSaturation = ${Math.round(mask.saturation)},
\t\t\t\t\tLocalTemperature = ${Math.round(mask.temp)},
\t\t\t\t\tWhat = "Correction",
\t\t\t\t},
\t\t\t},`;
  } else if (mask && mask.type === 'linear') {
    maskLua = `\t\t\tGradientBasedCorrections = {
\t\t\t\t{
\t\t\t\t\tCorrectionActive = true,
\t\t\t\t\tCorrectionAmount = 1,
\t\t\t\t\tCorrectionID = "${generateUUID()}",
\t\t\t\t\tCorrectionMasks = {
\t\t\t\t\t\t{
\t\t\t\t\t\t\tFullX = ${mask.endX.toFixed(6)},
\t\t\t\t\t\t\tFullY = ${mask.endY.toFixed(6)},
\t\t\t\t\t\t\tZeroX = ${mask.startX.toFixed(6)},
\t\t\t\t\t\t\tZeroY = ${mask.startY.toFixed(6)},
\t\t\t\t\t\t\tWhat = "Mask/Gradient",
\t\t\t\t\t\t},
\t\t\t\t\t},
\t\t\t\t\tLocalExposure2012 = ${mask.exposure.toFixed(2)},
\t\t\t\t\tLocalContrast2012 = ${Math.round(mask.contrast)},
\t\t\t\t\tLocalClarity2012 = ${Math.round(mask.clarity)},
\t\t\t\t\tLocalSaturation = ${Math.round(mask.saturation)},
\t\t\t\t\tLocalTemperature = ${Math.round(mask.temp)},
\t\t\t\t\tWhat = "Correction",
\t\t\t\t},
\t\t\t},`;
  }

  return `s = {
\tid = "${uuid}",
\tinternalName = "${presetName}",
\ttitle = "${presetName}",
\ttype = "Develop",
\tvalue = {
\t\tsettings = {
\t\t\tProcessVersion = "11.0",
\t\t\tWhiteBalance = "Custom",
\t\t\tExposure2012 = ${adjustments.exposure.toFixed(2)},
\t\t\tContrast2012 = ${Math.round(adjustments.contrast)},
\t\t\tHighlights2012 = ${Math.round(adjustments.highlights)},
\t\t\tShadows2012 = ${Math.round(adjustments.shadows)},
\t\t\tWhites2012 = ${Math.round(adjustments.whites)},
\t\t\tBlacks2012 = ${Math.round(adjustments.blacks)},
\t\t\tTemperature = ${Math.round(adjustments.temp)},
\t\t\tTint = ${Math.round(adjustments.tint)},
\t\t\tVibrance = ${Math.round(adjustments.vibrance)},
\t\t\tSaturation = ${Math.round(adjustments.saturation)},
\t\t\tClarity2012 = ${Math.round(adjustments.clarity)},
\t\t\tTexture = ${Math.round(adjustments.texture)},
\t\t\tDehaze = ${Math.round(adjustments.dehaze)},
\t\t\tSharpness = ${Math.round(adjustments.sharpening)},
\t\t\tLuminanceSmoothing = ${Math.round(adjustments.noiseReduction)},
\t\t\tColorNoiseReduction = ${Math.round(adjustments.colorNoiseReduction ?? 0)},
\t\t\tPostCropVignetteAmount = ${Math.round(adjustments.vignette)},
\t\t\tPostCropVignetteMidpoint = ${Math.round(adjustments.vignetteMidpoint)},
\t\t\tGrainAmount = ${Math.round(adjustments.grain)},
\t\t\tGrainSize = ${Math.round(((adjustments.grainSize - 1) / 4) * 100)},
\t\t\tGrainFrequency = ${Math.round(adjustments.grainRoughness)},
\t\t\tRedHue = ${Math.round(calib.redHue)},
\t\t\tRedSaturation = ${Math.round(calib.redSaturation)},
\t\t\tGreenHue = ${Math.round(calib.greenHue)},
\t\t\tGreenSaturation = ${Math.round(calib.greenSaturation)},
\t\t\tBlueHue = ${Math.round(calib.blueHue)},
\t\t\tBlueSaturation = ${Math.round(calib.blueSaturation)},
\t\t\tShadowTint = ${Math.round(calib.shadowTint)},
\t\t\tParametricShadows = ${Math.round(pc.shadows)},
\t\t\tParametricDarks = ${Math.round(pc.darks)},
\t\t\tParametricLights = ${Math.round(pc.lights)},
\t\t\tParametricHighlights = ${Math.round(pc.highlights)},
\t\t\tParametricShadowSplit = ${Math.round(pc.shadowSplit)},
\t\t\tParametricMidtoneSplit = ${Math.round(pc.midtoneSplit)},
\t\t\tParametricHighlightSplit = ${Math.round(pc.highlightSplit)},
\t\t\tHueAdjustmentRed = ${Math.round(hsl.red.hue)},
\t\t\tHueAdjustmentOrange = ${Math.round(hsl.orange.hue)},
\t\t\tHueAdjustmentYellow = ${Math.round(hsl.yellow.hue)},
\t\t\tHueAdjustmentGreen = ${Math.round(hsl.green.hue)},
\t\t\tHueAdjustmentAqua = ${Math.round(hsl.aqua.hue)},
\t\t\tHueAdjustmentBlue = ${Math.round(hsl.blue.hue)},
\t\t\tHueAdjustmentPurple = ${Math.round(hsl.purple.hue)},
\t\t\tHueAdjustmentMagenta = ${Math.round(hsl.magenta.hue)},
\t\t\tSaturationAdjustmentRed = ${Math.round(hsl.red.saturation)},
\t\t\tSaturationAdjustmentOrange = ${Math.round(hsl.orange.saturation)},
\t\t\tSaturationAdjustmentYellow = ${Math.round(hsl.yellow.saturation)},
\t\t\tSaturationAdjustmentGreen = ${Math.round(hsl.green.saturation)},
\t\t\tSaturationAdjustmentAqua = ${Math.round(hsl.aqua.saturation)},
\t\t\tSaturationAdjustmentBlue = ${Math.round(hsl.blue.saturation)},
\t\t\tSaturationAdjustmentPurple = ${Math.round(hsl.purple.saturation)},
\t\t\tSaturationAdjustmentMagenta = ${Math.round(hsl.magenta.saturation)},
\t\t\tLuminanceAdjustmentRed = ${Math.round(hsl.red.luminance)},
\t\t\tLuminanceAdjustmentOrange = ${Math.round(hsl.orange.luminance)},
\t\t\tLuminanceAdjustmentYellow = ${Math.round(hsl.yellow.luminance)},
\t\t\tLuminanceAdjustmentGreen = ${Math.round(hsl.green.luminance)},
\t\t\tLuminanceAdjustmentAqua = ${Math.round(hsl.aqua.luminance)},
\t\t\tLuminanceAdjustmentBlue = ${Math.round(hsl.blue.luminance)},
\t\t\tLuminanceAdjustmentPurple = ${Math.round(hsl.purple.luminance)},
\t\t\tLuminanceAdjustmentMagenta = ${Math.round(hsl.magenta.luminance)},
\t\t\tSplitToningShadowHue = ${Math.round(cg.shadows.hue)},
\t\t\tSplitToningShadowSaturation = ${Math.round(cg.shadows.saturation)},
\t\t\tSplitToningHighlightHue = ${Math.round(cg.highlights.hue)},
\t\t\tSplitToningHighlightSaturation = ${Math.round(cg.highlights.saturation)},
\t\t\tSplitToningBalance = ${Math.round(cg.balance)},
\t\t\tColorGradeMidtoneHue = ${Math.round(cg.midtones.hue)},
\t\t\tColorGradeMidtoneSat = ${Math.round(cg.midtones.saturation)},
\t\t\tColorGradeMidtoneLum = ${Math.round(cg.midtones.luminance)},
\t\t\tColorGradeShadowLum = ${Math.round(cg.shadows.luminance)},
\t\t\tColorGradeHighlightLum = ${Math.round(cg.highlights.luminance)},
\t\t\tColorGradeBlending = ${Math.round(cg.blending)},
${maskLua}
\t\t\tToneCurvePV2012 = {
${formatPoints(tc.master)}
\t\t\t},
\t\t\tToneCurvePV2012Red = {
${formatPoints(tc.red)}
\t\t\t},
\t\t\tToneCurvePV2012Green = {
${formatPoints(tc.green)}
\t\t\t},
\t\t\tToneCurvePV2012Blue = {
${formatPoints(tc.blue)}
\t\t\t},
\t\t},
\t\tuuid = "${uuid}",
\t},
\tversion = 0,
}`;
}

/**
 * Triggers a browser file download for text/xml/lua data.
 */
export function downloadPresetFile(filename: string, content: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Loads and parses an array or FileList of preset files (.xmp, .lrtemplate, .json).
 */
export async function loadPresetFiles(files: FileList | File[]): Promise<Preset[]> {
  const fileArray = Array.from(files);
  const loadedPresets: Preset[] = [];

  for (const file of fileArray) {
    try {
      const content = await file.text();
      const preset = parseLightroomPresetFile(content, file.name);
      loadedPresets.push(preset);
    } catch (err) {
      console.error(`Failed to parse preset file ${file.name}:`, err);
    }
  }

  return loadedPresets;
}
