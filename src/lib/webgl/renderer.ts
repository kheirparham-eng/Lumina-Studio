import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';
import { PhotoAdjustments, HistogramData, CurvePoint, ToneCurveState } from '../../types/editor';

// Monotonic Cubic Spline Interpolation for Tone Curves
function createSplineTable(points: CurvePoint[]): Uint8Array {
  const table = new Uint8Array(256);
  if (!points || points.length === 0) {
    for (let i = 0; i < 256; i++) table[i] = i;
    return table;
  }

  // Sort points by X
  const pts = [...points].sort((a, b) => a.x - b.x);

  // If missing 0 or 255 endpoints, pad them
  if (pts[0].x > 0) pts.unshift({ x: 0, y: pts[0].y });
  if (pts[pts.length - 1].x < 255) pts.push({ x: 255, y: pts[pts.length - 1].y });

  const n = pts.length;
  const x = pts.map((p) => p.x);
  const y = pts.map((p) => p.y);

  // Monotone cubic Hermite spline interpolation
  const dx: number[] = [];
  const dy: number[] = [];
  const ms: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx[i] = x[i + 1] - x[i];
    dy[i] = y[i + 1] - y[i];
    ms[i] = dx[i] === 0 ? 0 : dy[i] / dx[i];
  }

  const c1s: number[] = [ms[0]];
  for (let i = 0; i < n - 2; i++) {
    const m = ms[i];
    const nextM = ms[i + 1];
    if (m * nextM <= 0) {
      c1s.push(0);
    } else {
      const common_dx = dx[i] + dx[i + 1];
      c1s.push((3 * common_dx) / ((common_dx + dx[i + 1]) / m + (common_dx + dx[i]) / nextM));
    }
  }
  c1s.push(ms[ms.length - 1]);

  // Interpolate for all 256 inputs
  for (let i = 0; i < 256; i++) {
    // Find segment
    let seg = 0;
    while (seg < n - 1 && x[seg + 1] < i) {
      seg++;
    }
    if (seg >= n - 1) {
      table[i] = Math.min(255, Math.max(0, Math.round(y[n - 1])));
      continue;
    }

    const h = dx[seg];
    if (h === 0) {
      table[i] = Math.min(255, Math.max(0, Math.round(y[seg])));
      continue;
    }

    const t = (i - x[seg]) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    const val =
      (2 * t3 - 3 * t2 + 1) * y[seg] +
      (t3 - 2 * t2 + t) * h * c1s[seg] +
      (-2 * t3 + 3 * t2) * y[seg + 1] +
      (t3 - t2) * h * c1s[seg + 1];

    table[i] = Math.min(255, Math.max(0, Math.round(val)));
  }

  return table;
}

// Build 256x4 LUT image array (Master, Red, Green, Blue combined)
function buildCurveLUT(toneCurve: ToneCurveState): Uint8Array {
  const lut = new Uint8Array(256 * 4 * 4); // 256 width x 4 rows x RGBA
  const masterTable = createSplineTable(toneCurve.master);
  const redTable = createSplineTable(toneCurve.red);
  const greenTable = createSplineTable(toneCurve.green);
  const blueTable = createSplineTable(toneCurve.blue);

  for (let i = 0; i < 256; i++) {
    const m = masterTable[i] / 255;

    // Row 0: Master + Red
    const rVal = Math.min(255, Math.max(0, Math.round(redTable[Math.round(m * 255)])));
    // Row 1: Master + Green
    const gVal = Math.min(255, Math.max(0, Math.round(greenTable[Math.round(m * 255)])));
    // Row 2: Master + Blue
    const bVal = Math.min(255, Math.max(0, Math.round(blueTable[Math.round(m * 255)])));

    // Row 0
    const idx0 = (0 * 256 + i) * 4;
    lut[idx0 + 0] = rVal;
    lut[idx0 + 1] = gVal;
    lut[idx0 + 2] = bVal;
    lut[idx0 + 3] = 255;

    // Row 1
    const idx1 = (1 * 256 + i) * 4;
    lut[idx1 + 0] = rVal;
    lut[idx1 + 1] = gVal;
    lut[idx1 + 2] = bVal;
    lut[idx1 + 3] = 255;

    // Row 2
    const idx2 = (2 * 256 + i) * 4;
    lut[idx2 + 0] = rVal;
    lut[idx2 + 1] = gVal;
    lut[idx2 + 2] = bVal;
    lut[idx2 + 3] = 255;

    // Row 3
    const idx3 = (3 * 256 + i) * 4;
    lut[idx3 + 0] = rVal;
    lut[idx3 + 1] = gVal;
    lut[idx3 + 2] = bVal;
    lut[idx3 + 3] = 255;
  }

  return lut;
}

export class WebGLPhotoRenderer {
  public canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private imageTexture: WebGLTexture | null = null;
  private curveTexture: WebGLTexture | null = null;

  private imageWidth = 0;
  private imageHeight = 0;
  private sourceImage: HTMLImageElement | HTMLCanvasElement | null = null;

  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private posLocation = -1;
  private texLocation = -1;

  // Offscreen sampling canvas for histogram calculations
  private histogramCanvas: HTMLCanvasElement;
  private histogramCtx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.histogramCanvas = document.createElement('canvas');
    this.histogramCanvas.width = 256;
    this.histogramCanvas.height = 256;
    this.histogramCtx = this.histogramCanvas.getContext('2d', { willReadFrequently: true });
    this.initGL();
  }

  private initGL() {
    const gl = this.canvas.getContext('webgl', {
      preserveDrawingBuffer: true,
      alpha: false,
    });

    if (!gl) {
      console.warn('WebGL not supported, falling back');
      return;
    }

    this.gl = gl;

    const vertShader = this.createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = this.createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('WebGL Program Link Error:', gl.getProgramInfoLog(program));
      return;
    }

    this.program = program;
    gl.useProgram(program);

    // Setup geometry quad
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.posLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(this.posLocation);
    gl.vertexAttribPointer(this.posLocation, 2, gl.FLOAT, false, 0, 0);

    // Setup texture coordinates
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    const texCoords = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      0, 0,
      1, 1,
      1, 0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    this.texLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(this.texLocation);
    gl.vertexAttribPointer(this.texLocation, 2, gl.FLOAT, false, 0, 0);

    // Create textures
    this.imageTexture = gl.createTexture();
    this.curveTexture = gl.createTexture();
  }

  private createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('WebGL Shader Compile Error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public setImage(img: HTMLImageElement | HTMLCanvasElement) {
    this.sourceImage = img;

    if (img instanceof HTMLImageElement && (!img.complete || img.naturalWidth === 0)) {
      img.onload = () => {
        this.setImage(img);
      };
      return;
    }

    this.imageWidth =
      (img as HTMLImageElement).naturalWidth ||
      img.width ||
      (img as HTMLCanvasElement).width ||
      1920;
    this.imageHeight =
      (img as HTMLImageElement).naturalHeight ||
      img.height ||
      (img as HTMLCanvasElement).height ||
      1080;

    if (!this.gl || !this.program || !this.imageTexture) return;

    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    } catch (e) {
      console.error('WebGL texImage2D error:', e);
    }
  }

  public render(
    adj: PhotoAdjustments,
    showHighlightClipping = false,
    showShadowClipping = false
  ): HistogramData {
    const gl = this.gl;
    const program = this.program;

    if (!gl || !program || !this.sourceImage) {
      return {
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0),
        l: new Array(256).fill(0),
        maxVal: 1,
        hasHighlightClipping: false,
        hasShadowClipping: false,
      };
    }

    gl.useProgram(program);

    if (this.positionBuffer && this.posLocation !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(this.posLocation);
      gl.vertexAttribPointer(this.posLocation, 2, gl.FLOAT, false, 0, 0);
    }

    if (this.texCoordBuffer && this.texLocation !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.enableVertexAttribArray(this.texLocation);
      gl.vertexAttribPointer(this.texLocation, 2, gl.FLOAT, false, 0, 0);
    }

    // Bind Image Texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);

    // Build and Bind Tone Curve LUT Texture
    const lutData = buildCurveLUT(adj.toneCurve);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, lutData);
    gl.uniform1i(gl.getUniformLocation(program, 'u_curveTexture'), 1);

    // Pass Uniforms
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), this.canvas.width, this.canvas.height);
    gl.uniform2f(gl.getUniformLocation(program, 'u_textureSize'), this.imageWidth, this.imageHeight);

    // Geometry & Rotation
    const rad = (adj.crop.rotation * Math.PI) / 180;
    gl.uniform1f(gl.getUniformLocation(program, 'u_rotation'), rad);
    gl.uniform2f(
      gl.getUniformLocation(program, 'u_flip'),
      adj.crop.flipH ? -1.0 : 1.0,
      adj.crop.flipV ? -1.0 : 1.0
    );

    // Crop Bounds
    gl.uniform4f(
      gl.getUniformLocation(program, 'u_cropBounds'),
      adj.crop.x,
      adj.crop.y,
      adj.crop.width,
      adj.crop.height
    );

    // Light
    gl.uniform1f(gl.getUniformLocation(program, 'u_exposure'), adj.exposure);
    gl.uniform1f(gl.getUniformLocation(program, 'u_contrast'), adj.contrast);
    gl.uniform1f(gl.getUniformLocation(program, 'u_highlights'), adj.highlights);
    gl.uniform1f(gl.getUniformLocation(program, 'u_shadows'), adj.shadows);
    gl.uniform1f(gl.getUniformLocation(program, 'u_whites'), adj.whites);
    gl.uniform1f(gl.getUniformLocation(program, 'u_blacks'), adj.blacks);

    // Color
    gl.uniform1f(gl.getUniformLocation(program, 'u_temp'), adj.temp);
    gl.uniform1f(gl.getUniformLocation(program, 'u_tint'), adj.tint);
    gl.uniform1f(gl.getUniformLocation(program, 'u_vibrance'), adj.vibrance);
    gl.uniform1f(gl.getUniformLocation(program, 'u_saturation'), adj.saturation);

    // HSL
    gl.uniform3f(gl.getUniformLocation(program, 'u_hslRed'), adj.hsl.red.hue, adj.hsl.red.saturation, adj.hsl.red.luminance);
    gl.uniform3f(gl.getUniformLocation(program, 'u_hslOrange'), adj.hsl.orange.hue, adj.hsl.orange.saturation, adj.hsl.orange.luminance);
    gl.uniform3f(gl.getUniformLocation(program, 'u_hslYellow'), adj.hsl.yellow.hue, adj.hsl.yellow.saturation, adj.hsl.yellow.luminance);
    gl.uniform3f(gl.getUniformLocation(program, 'u_hslGreen'), adj.hsl.green.hue, adj.hsl.green.saturation, adj.hsl.green.luminance);
    gl.uniform3f(gl.getUniformLocation(program, 'u_hslAqua'), adj.hsl.aqua.hue, adj.hsl.aqua.saturation, adj.hsl.aqua.luminance);
    gl.uniform3f(gl.getUniformLocation(program, 'u_hslBlue'), adj.hsl.blue.hue, adj.hsl.blue.saturation, adj.hsl.blue.luminance);
    gl.uniform3f(gl.getUniformLocation(program, 'u_hslPurple'), adj.hsl.purple.hue, adj.hsl.purple.saturation, adj.hsl.purple.luminance);
    gl.uniform3f(gl.getUniformLocation(program, 'u_hslMagenta'), adj.hsl.magenta.hue, adj.hsl.magenta.saturation, adj.hsl.magenta.luminance);

    // Color Grading
    gl.uniform3f(gl.getUniformLocation(program, 'u_cgShadows'), adj.colorGrading.shadows.hue, adj.colorGrading.shadows.saturation, adj.colorGrading.shadows.luminance);
    gl.uniform3f(gl.getUniformLocation(program, 'u_cgMidtones'), adj.colorGrading.midtones.hue, adj.colorGrading.midtones.saturation, adj.colorGrading.midtones.luminance);
    gl.uniform3f(gl.getUniformLocation(program, 'u_cgHighlights'), adj.colorGrading.highlights.hue, adj.colorGrading.highlights.saturation, adj.colorGrading.highlights.luminance);
    gl.uniform1f(gl.getUniformLocation(program, 'u_cgBlending'), adj.colorGrading.blending);
    gl.uniform1f(gl.getUniformLocation(program, 'u_cgBalance'), adj.colorGrading.balance);

    // Effects & Detail
    gl.uniform1f(gl.getUniformLocation(program, 'u_clarity'), adj.clarity);
    gl.uniform1f(gl.getUniformLocation(program, 'u_texture'), adj.texture);
    gl.uniform1f(gl.getUniformLocation(program, 'u_dehaze'), adj.dehaze);
    gl.uniform1f(gl.getUniformLocation(program, 'u_vignette'), adj.vignette);
    gl.uniform1f(gl.getUniformLocation(program, 'u_vignetteMidpoint'), adj.vignetteMidpoint ?? 50);
    gl.uniform1f(gl.getUniformLocation(program, 'u_grain'), adj.grain);
    gl.uniform1f(gl.getUniformLocation(program, 'u_grainSize'), adj.grainSize ?? 2);
    gl.uniform1f(gl.getUniformLocation(program, 'u_grainRoughness'), adj.grainRoughness ?? 50);
    gl.uniform1f(gl.getUniformLocation(program, 'u_chromaticAberration'), adj.chromaticAberration ?? 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_sharpening'), adj.sharpening);
    gl.uniform1f(gl.getUniformLocation(program, 'u_noiseReduction'), adj.noiseReduction || 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_colorNoiseReduction'), adj.colorNoiseReduction || 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_noiseDetail'), adj.noiseDetail ?? 50);

    // Mask Uniforms
    const mask = adj.mask;
    const maskTypeVal = mask?.type === 'radial' ? 1.0 : mask?.type === 'linear' ? 2.0 : 0.0;
    gl.uniform1f(gl.getUniformLocation(program, 'u_maskType'), maskTypeVal);
    gl.uniform1f(gl.getUniformLocation(program, 'u_maskInvert'), mask?.invert ? 1.0 : 0.0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_maskOpacity'), mask?.opacity ?? 100);
    gl.uniform1f(gl.getUniformLocation(program, 'u_maskFeather'), mask?.feather ?? 50);
    gl.uniform2f(gl.getUniformLocation(program, 'u_maskRadialCenter'), mask?.centerX ?? 0.5, mask?.centerY ?? 0.5);
    gl.uniform2f(gl.getUniformLocation(program, 'u_maskRadialRadius'), mask?.radiusX ?? 0.35, mask?.radiusY ?? 0.35);
    gl.uniform2f(gl.getUniformLocation(program, 'u_maskLinearStart'), mask?.startX ?? 0.5, mask?.startY ?? 0.2);
    gl.uniform2f(gl.getUniformLocation(program, 'u_maskLinearEnd'), mask?.endX ?? 0.5, mask?.endY ?? 0.8);
    gl.uniform1f(gl.getUniformLocation(program, 'u_maskExposure'), mask?.exposure ?? 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_maskContrast'), mask?.contrast ?? 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_maskTemp'), mask?.temp ?? 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_maskSaturation'), mask?.saturation ?? 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_maskClarity'), mask?.clarity ?? 0);

    // Clipping Overlays
    gl.uniform1f(gl.getUniformLocation(program, 'u_showHighlightClipping'), showHighlightClipping ? 1.0 : 0.0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_showShadowClipping'), showShadowClipping ? 1.0 : 0.0);

    // Set Viewport & Draw
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.07, 0.07, 0.07, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Extract Histogram Data
    return this.calculateHistogram();
  }

  private calculateHistogram(): HistogramData {
    const r = new Array(256).fill(0);
    const g = new Array(256).fill(0);
    const b = new Array(256).fill(0);
    const l = new Array(256).fill(0);

    if (!this.histogramCtx || !this.canvas) {
      return { r, g, b, l, maxVal: 1, hasHighlightClipping: false, hasShadowClipping: false };
    }

    // Copy small sample from rendered canvas to sample context
    this.histogramCtx.drawImage(
      this.canvas,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      0,
      0,
      256,
      256
    );

    let imageData: ImageData;
    try {
      imageData = this.histogramCtx.getImageData(0, 0, 256, 256);
    } catch {
      return { r, g, b, l, maxVal: 1, hasHighlightClipping: false, hasShadowClipping: false };
    }

    const pixels = imageData.data;
    let maxVal = 1;
    let highlightClip = false;
    let shadowClip = false;

    for (let i = 0; i < pixels.length; i += 4) {
      const pr = pixels[i];
      const pg = pixels[i + 1];
      const pb = pixels[i + 2];
      const lum = Math.round(0.299 * pr + 0.587 * pg + 0.114 * pb);

      r[pr]++;
      g[pg]++;
      b[pb]++;
      l[lum]++;

      if (pr >= 250 && pg >= 250 && pb >= 250) highlightClip = true;
      if (pr <= 5 && pg <= 5 && pb <= 5) shadowClip = true;

      if (r[pr] > maxVal) maxVal = r[pr];
      if (g[pg] > maxVal) maxVal = g[pg];
      if (b[pb] > maxVal) maxVal = b[pb];
      if (l[lum] > maxVal) maxVal = l[lum];
    }

    return {
      r,
      g,
      b,
      l,
      maxVal,
      hasHighlightClipping: highlightClip,
      hasShadowClipping: shadowClip,
    };
  }

  // Generate full resolution exported Blob or DataURL
  public async exportImage(
    adj: PhotoAdjustments,
    format: 'image/jpeg' | 'image/png' | 'image/webp',
    quality: number,
    scale = 1.0,
    overrideSourceImage?: HTMLImageElement | HTMLCanvasElement
  ): Promise<Blob> {
    const source = overrideSourceImage || this.sourceImage;
    if (!source) {
      throw new Error('No source image loaded for export');
    }

    const imgW = (source as HTMLImageElement).naturalWidth || source.width || this.imageWidth || 1920;
    const imgH = (source as HTMLImageElement).naturalHeight || source.height || this.imageHeight || 1080;

    const exportWidth = Math.round(imgW * adj.crop.width * scale);
    const exportHeight = Math.round(imgH * adj.crop.height * scale);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;

    const tempRenderer = new WebGLPhotoRenderer(exportCanvas);
    tempRenderer.setImage(source);
    tempRenderer.render(adj);

    return new Promise((resolve, reject) => {
      exportCanvas.toBlob(
        (blob) => {
          tempRenderer.dispose();
          if (blob) resolve(blob);
          else reject(new Error('Export canvas blob creation failed'));
        },
        format,
        quality
      );
    });
  }

  // Dispose WebGL resources, textures, buffers, programs and release context to prevent memory leaks
  public dispose(): void {
    const gl = this.gl;
    if (!gl) return;

    try {
      if (this.imageTexture) {
        gl.deleteTexture(this.imageTexture);
        this.imageTexture = null;
      }
      if (this.curveTexture) {
        gl.deleteTexture(this.curveTexture);
        this.curveTexture = null;
      }
      if (this.positionBuffer) {
        gl.deleteBuffer(this.positionBuffer);
        this.positionBuffer = null;
      }
      if (this.texCoordBuffer) {
        gl.deleteBuffer(this.texCoordBuffer);
        this.texCoordBuffer = null;
      }
      if (this.program) {
        gl.deleteProgram(this.program);
        this.program = null;
      }

      const loseCtx = gl.getExtension('WEBGL_lose_context');
      if (loseCtx) {
        loseCtx.loseContext();
      }
    } catch (e) {
      console.warn('Error disposing WebGLPhotoRenderer:', e);
    } finally {
      this.gl = null;
      this.sourceImage = null;
    }
  }
}
