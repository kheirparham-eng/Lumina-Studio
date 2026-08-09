export const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const FRAGMENT_SHADER = `
precision highp float;

varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform sampler2D u_curveTexture; // 256x1 2D texture encoding tone curves for RGB
uniform vec2 u_textureSize;

uniform float u_rotation; // radians
uniform vec2 u_flip; // vec2(flipH ? -1.0 : 1.0, flipV ? -1.0 : 1.0)

// Light
uniform float u_exposure;     // -5.0 to 5.0
uniform float u_contrast;     // -100.0 to 100.0
uniform float u_highlights;   // -100.0 to 100.0
uniform float u_shadows;      // -100.0 to 100.0
uniform float u_whites;       // -100.0 to 100.0
uniform float u_blacks;       // -100.0 to 100.0

// Color
uniform float u_temp;         // 2000.0 to 10000.0
uniform float u_tint;         // -100.0 to 100.0
uniform float u_vibrance;     // -100.0 to 100.0
uniform float u_saturation;   // -100.0 to 100.0

// HSL Sliders (8 channels: Hue, Sat, Lum for Red, Orange, Yellow, Green, Aqua, Blue, Purple, Magenta)
// Each channel is vec3(hueShift, satShift, lumShift)
uniform vec3 u_hslRed;
uniform vec3 u_hslOrange;
uniform vec3 u_hslYellow;
uniform vec3 u_hslGreen;
uniform vec3 u_hslAqua;
uniform vec3 u_hslBlue;
uniform vec3 u_hslPurple;
uniform vec3 u_hslMagenta;

// Color Grading
uniform vec3 u_cgShadows;     // vec3(hue 0-360, sat 0-100, lum -100 to 100)
uniform vec3 u_cgMidtones;
uniform vec3 u_cgHighlights;
uniform float u_cgBlending;   // 0-100
uniform float u_cgBalance;    // -100 to 100

// Effects & Details
uniform float u_clarity;      // -100 to 100
uniform float u_texture;      // -100 to 100
uniform float u_dehaze;       // -100 to 100
uniform float u_vignette;     // -100 to 100
uniform float u_vignetteMidpoint; // 0 to 100
uniform float u_grain;        // 0 to 100
uniform float u_grainSize;    // 1 to 5
uniform float u_grainRoughness; // 0 to 100
uniform float u_chromaticAberration; // 0 to 100
uniform float u_sharpening;   // 0 to 100
uniform float u_noiseReduction; // 0 to 100

// Selective Masking Uniforms
uniform float u_maskType;       // 0 = none, 1 = radial, 2 = linear
uniform float u_maskInvert;     // 0 or 1
uniform float u_maskOpacity;    // 0 to 100
uniform float u_maskFeather;    // 0 to 100
uniform vec2  u_maskRadialCenter;
uniform vec2  u_maskRadialRadius;
uniform vec2  u_maskLinearStart;
uniform vec2  u_maskLinearEnd;
uniform float u_maskExposure;
uniform float u_maskContrast;
uniform float u_maskTemp;
uniform float u_maskSaturation;
uniform float u_maskClarity;

// Clipping Warnings
uniform float u_showHighlightClipping; // 0 or 1
uniform float u_showShadowClipping;    // 0 or 1

// Crop bounds
uniform vec4 u_cropBounds;    // vec4(x, y, width, height) in 0..1 range

// RGB to HSV conversion
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - 3.0);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Kelvin Temp to RGB multiplier
vec3 tempToRGB(float kelvin) {
    float k = kelvin / 100.0;
    vec3 color;
    if (k <= 66.0) {
        color.r = 255.0;
        color.g = 99.4708025861 * log(k) - 161.1195681661;
        if (k <= 19.0) {
            color.b = 0.0;
        } else {
            color.b = 138.5177312231 * log(k - 10.0) - 305.0447927307;
        }
    } else {
        color.r = 329.698727446 * pow(k - 60.0, -0.1332047592);
        color.g = 288.1221695283 * pow(k - 60.0, -0.0755148492);
        color.b = 255.0;
    }
    return clamp(color / 255.0, 0.0, 2.0);
}

// Helper to calculate hue weight for 8 color channels
float channelWeight(float hue, float centerHue, float width) {
    float d = abs(hue - centerHue);
    if (d > 0.5) d = 1.0 - d;
    return smoothstep(width, 0.0, d);
}

// Pseudo-random generator for film grain
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    // Center normalized coordinates around center (0.5, 0.5)
    vec2 st = v_texCoord - vec2(0.5);

    // Correct for image aspect ratio so rotation is isometric
    float aspect = u_textureSize.x / max(1.0, u_textureSize.y);
    st.x *= aspect;

    // Apply rotation
    float cosR = cos(u_rotation);
    float sinR = sin(u_rotation);
    vec2 rotSt = vec2(st.x * cosR + st.y * sinR, -st.x * sinR + st.y * cosR);

    // Un-correct aspect ratio
    rotSt.x /= aspect;

    // Apply flip
    rotSt *= u_flip;

    // Shift back from center
    vec2 normalizedCoord = rotSt + vec2(0.5);

    // Map to cropped texture bounds
    vec2 tc = vec2(
        u_cropBounds.x + normalizedCoord.x * u_cropBounds.z,
        u_cropBounds.y + normalizedCoord.y * u_cropBounds.w
    );

    // If out of cropped bounds or image texture bounds, output background
    if (tc.x < 0.0 || tc.x > 1.0 || tc.y < 0.0 || tc.y > 1.0) {
        gl_FragColor = vec4(0.08, 0.08, 0.08, 1.0);
        return;
    }

    vec2 texel = 1.0 / u_textureSize;
    
    // Chromatic Aberration (Channel Fringe Shift)
    vec4 texColor = texture2D(u_image, tc);
    if (u_chromaticAberration > 0.0) {
        vec2 caOffset = (normalizedCoord - vec2(0.5)) * (u_chromaticAberration / 100.0) * 0.012;
        float caR = texture2D(u_image, clamp(tc + caOffset, 0.0, 1.0)).r;
        float caB = texture2D(u_image, clamp(tc - caOffset, 0.0, 1.0)).b;
        texColor.r = caR;
        texColor.b = caB;
    }
    vec3 color = texColor.rgb;

    // 0. Noise Reduction (Edge-Preserving Spatial Filter)
    if (u_noiseReduction > 0.0) {
        float nrAmount = u_noiseReduction / 100.0;
        vec3 centerCol = color;
        vec3 sumCol = centerCol;
        float totalW = 1.0;

        vec2 nOffsets[4];
        nOffsets[0] = vec2(texel.x, 0.0);
        nOffsets[1] = vec2(-texel.x, 0.0);
        nOffsets[2] = vec2(0.0, texel.y);
        nOffsets[3] = vec2(0.0, -texel.y);

        for (int i = 0; i < 4; i++) {
            vec2 nCoord = clamp(tc + nOffsets[i], 0.0, 1.0);
            vec3 nCol = texture2D(u_image, nCoord).rgb;
            float diff = length(nCol - centerCol);
            float w = exp(-diff * diff * 25.0);
            sumCol += nCol * w;
            totalW += w;
        }
        vec3 smoothed = sumCol / totalW;
        color = mix(color, smoothed, nrAmount * 0.85);
    }

    // 1. White Balance (Temp & Tint)
    vec3 neutralRGB = tempToRGB(5500.0);
    vec3 targetRGB = tempToRGB(u_temp);
    vec3 wbMult = targetRGB / neutralRGB;
    
    // Tint adjustment (green - magenta balance)
    wbMult.g *= (1.0 - u_tint / 200.0);
    wbMult.r *= (1.0 + u_tint / 400.0);
    wbMult.b *= (1.0 + u_tint / 400.0);

    color *= wbMult;

    // 2. Exposure (2^EV scale)
    color *= pow(2.0, u_exposure);

    // 3. Contrast
    float cFactor = (u_contrast + 100.0) / 100.0;
    cFactor = cFactor * cFactor; // Soft quadratic response
    color = (color - 0.5) * cFactor + 0.5;

    // 4. Highlights, Shadows, Whites, Blacks
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    
    // Highlight S-curve
    float highlightWeight = smoothstep(0.5, 1.0, lum);
    color += color * (u_highlights / 100.0) * highlightWeight * 0.5;

    // Shadow expansion
    float shadowWeight = 1.0 - smoothstep(0.0, 0.5, lum);
    color += (1.0 - color) * (u_shadows / 100.0) * shadowWeight * 0.4;

    // Whites & Blacks shoulder/toe adjustment
    color += (u_whites / 100.0) * pow(lum, 2.0) * 0.3;
    color += (u_blacks / 100.0) * pow(1.0 - lum, 2.0) * 0.3;

    color = clamp(color, 0.0, 1.0);

    // 5. Tone Curves Lookup (from 256x1 texture u_curveTexture)
    color.r = texture2D(u_curveTexture, vec2(color.r, 0.125)).r; // Row 0: Master + Red
    color.g = texture2D(u_curveTexture, vec2(color.g, 0.375)).g; // Row 1: Master + Green
    color.b = texture2D(u_curveTexture, vec2(color.b, 0.625)).b; // Row 2: Master + Blue

    // 6. 8-Channel HSL Mixer
    vec3 hsv = rgb2hsv(color);
    float h = hsv.x; // 0.0 to 1.0

    // Channel center hues normalized 0..1
    float wRed     = channelWeight(h, 0.000, 0.10) + channelWeight(h, 1.000, 0.10);
    float wOrange  = channelWeight(h, 0.083, 0.08); // ~30 deg
    float wYellow  = channelWeight(h, 0.166, 0.08); // ~60 deg
    float wGreen   = channelWeight(h, 0.333, 0.12); // ~120 deg
    float wAqua    = channelWeight(h, 0.500, 0.10); // ~180 deg
    float wBlue    = channelWeight(h, 0.666, 0.12); // ~240 deg
    float wPurple  = channelWeight(h, 0.777, 0.08); // ~280 deg
    float wMagenta = channelWeight(h, 0.888, 0.08); // ~320 deg

    vec3 hslShift = u_hslRed * wRed +
                    u_hslOrange * wOrange +
                    u_hslYellow * wYellow +
                    u_hslGreen * wGreen +
                    u_hslAqua * wAqua +
                    u_hslBlue * wBlue +
                    u_hslPurple * wPurple +
                    u_hslMagenta * wMagenta;

    // Apply HSL shifts (hueShift in degrees -> / 360.0)
    hsv.x = fract(hsv.x + (hslShift.x / 360.0));
    hsv.y = clamp(hsv.y * (1.0 + hslShift.y / 100.0), 0.0, 1.0);
    hsv.z = clamp(hsv.z * (1.0 + hslShift.z / 100.0), 0.0, 1.0);

    color = hsv2rgb(hsv);

    // 7. Saturation & Vibrance
    lum = dot(color, vec3(0.299, 0.587, 0.114));
    float satAmount = u_saturation / 100.0;
    float vibAmount = u_vibrance / 100.0;

    // Global Saturation
    color = mix(vec3(lum), color, 1.0 + satAmount);

    // Smart Vibrance (protects already saturated hues)
    float maxC = max(color.r, max(color.g, color.b));
    float minC = min(color.r, min(color.g, color.b));
    float currentSat = maxC - minC;
    float vibFactor = (1.0 - currentSat) * vibAmount;
    color = mix(vec3(lum), color, 1.0 + vibFactor);

    // 8. Color Grading (Shadows, Midtones, Highlights)
    lum = dot(color, vec3(0.299, 0.587, 0.114));
    
    // Balance pivot point
    float pivot = 0.5 + (u_cgBalance / 200.0);
    float shadowWeightCG = clamp((pivot - lum) / pivot, 0.0, 1.0);
    float highlightWeightCG = clamp((lum - pivot) / (1.0 - pivot), 0.0, 1.0);
    float midtoneWeightCG = clamp(1.0 - shadowWeightCG - highlightWeightCG, 0.0, 1.0);

    vec3 shadowColor = hsv2rgb(vec3(u_cgShadows.x / 360.0, u_cgShadows.y / 100.0, 1.0)) * (u_cgShadows.z / 100.0 + 1.0);
    vec3 midtoneColor = hsv2rgb(vec3(u_cgMidtones.x / 360.0, u_cgMidtones.y / 100.0, 1.0)) * (u_cgMidtones.z / 100.0 + 1.0);
    vec3 highlightColor = hsv2rgb(vec3(u_cgHighlights.x / 360.0, u_cgHighlights.y / 100.0, 1.0)) * (u_cgHighlights.z / 100.0 + 1.0);

    vec3 cgResult = color;
    cgResult += (shadowColor - vec3(1.0)) * shadowWeightCG * (u_cgShadows.y / 100.0);
    cgResult += (midtoneColor - vec3(1.0)) * midtoneWeightCG * (u_cgMidtones.y / 100.0);
    cgResult += (highlightColor - vec3(1.0)) * highlightWeightCG * (u_cgHighlights.y / 100.0);

    color = mix(color, cgResult, u_cgBlending / 100.0);

    // 9. Dehaze & Clarity (Local contrast enhancement)
    if (u_dehaze != 0.0) {
        float dehazeMult = u_dehaze / 100.0;
        color = mix(color, pow(color, vec3(1.0 + dehazeMult * 0.5)), abs(dehazeMult));
        color *= (1.0 + dehazeMult * 0.1);
    }

    if (u_clarity != 0.0) {
        float clarityVal = u_clarity / 100.0;
        vec3 midtoneMask = vec3(1.0) - abs(color - vec3(0.5)) * 2.0;
        color += (color - vec3(0.5)) * clarityVal * midtoneMask * 0.35;
    }

    // Sharpening (Unsharp Mask / Laplacian Operator)
    if (u_sharpening > 0.0) {
        float sharpVal = u_sharpening / 100.0;
        vec3 nUp    = texture2D(u_image, clamp(tc + vec2(0.0, -texel.y), 0.0, 1.0)).rgb;
        vec3 nDown  = texture2D(u_image, clamp(tc + vec2(0.0,  texel.y), 0.0, 1.0)).rgb;
        vec3 nLeft  = texture2D(u_image, clamp(tc + vec2(-texel.x, 0.0), 0.0, 1.0)).rgb;
        vec3 nRight = texture2D(u_image, clamp(tc + vec2( texel.x, 0.0), 0.0, 1.0)).rgb;

        vec3 laplacian = color * 4.0 - (nUp + nDown + nLeft + nRight);
        color = clamp(color + laplacian * sharpVal * 0.5, 0.0, 1.0);
    }

    // 10. Local Selective Masking (Radial & Linear Gradient Masks)
    if (u_maskType > 0.5) {
        float maskWeight = 0.0;
        if (u_maskType < 1.5) {
            // Radial Ellipse Mask
            vec2 normCenter = (v_texCoord - u_maskRadialCenter) / max(vec2(0.001), u_maskRadialRadius);
            float distSq = dot(normCenter, normCenter);
            float featherVal = max(0.001, u_maskFeather / 100.0);
            maskWeight = 1.0 - smoothstep(1.0 - featherVal, 1.0 + featherVal, sqrt(distSq));
        } else {
            // Linear Gradient Mask
            vec2 dir = u_maskLinearEnd - u_maskLinearStart;
            float lenSq = dot(dir, dir);
            if (lenSq > 0.0001) {
                float t = dot(v_texCoord - u_maskLinearStart, dir) / lenSq;
                float featherVal = max(0.001, u_maskFeather / 100.0);
                maskWeight = smoothstep(0.5 - featherVal * 0.5, 0.5 + featherVal * 0.5, t);
            }
        }
        if (u_maskInvert > 0.5) {
            maskWeight = 1.0 - maskWeight;
        }
        maskWeight *= (u_maskOpacity / 100.0);

        if (maskWeight > 0.001) {
            if (u_maskExposure != 0.0) {
                color *= pow(2.0, u_maskExposure * maskWeight);
            }
            if (u_maskContrast != 0.0) {
                float maskCFactor = 1.0 + (u_maskContrast / 100.0) * maskWeight;
                color = (color - 0.5) * maskCFactor + 0.5;
            }
            if (u_maskTemp != 0.0) {
                vec3 maskTempRGB = tempToRGB(5500.0 + u_maskTemp * 30.0);
                color = mix(color, color * maskTempRGB, maskWeight * 0.5);
            }
            if (u_maskSaturation != 0.0) {
                float maskLum = dot(color, vec3(0.299, 0.587, 0.114));
                color = mix(color, mix(vec3(maskLum), color, 1.0 + u_maskSaturation / 100.0), maskWeight);
            }
            if (u_maskClarity != 0.0) {
                vec3 mMask = vec3(1.0) - abs(color - vec3(0.5)) * 2.0;
                color += (color - vec3(0.5)) * (u_maskClarity / 100.0) * maskWeight * mMask * 0.35;
            }
        }
    }

    // 11. Vignette & Midpoint
    if (u_vignette != 0.0) {
        vec2 centerDist = v_texCoord - vec2(0.5);
        float dist = length(centerDist);
        float mid = clamp(u_vignetteMidpoint / 100.0, 0.05, 0.95);
        float vig = smoothstep(mid * 0.4, mid * 1.4, dist);
        if (u_vignette < 0.0) {
            color *= (1.0 + (u_vignette / 100.0) * vig);
        } else {
            color = mix(color, vec3(1.0), (u_vignette / 100.0) * vig * 0.5);
        }
    }

    // 12. Film Grain (Size & Roughness)
    if (u_grain > 0.0) {
        float gSize = max(1.0, u_grainSize);
        vec2 grainUV = floor(v_texCoord * u_textureSize / gSize) * gSize;
        float n1 = rand(grainUV);
        float n2 = rand(grainUV * 1.337 + vec2(17.1, 43.7));
        float roughness = clamp(u_grainRoughness / 100.0, 0.0, 1.0);
        float noise = mix(n1 - 0.5, (n1 * n2) - 0.25, roughness) * (u_grain / 100.0) * 0.22;
        color += vec3(noise);
    }

    // 13. Highlight & Shadow Clipping Overlays
    vec3 finalColor = clamp(color, 0.0, 1.0);
    if (u_showHighlightClipping > 0.5) {
        if (color.r >= 0.99 && color.g >= 0.99 && color.b >= 0.99) {
            finalColor = vec3(1.0, 0.0, 0.15); // Vibrant pure Red highlight clipping warning
        }
    }
    if (u_showShadowClipping > 0.5) {
        if (color.r <= 0.01 && color.g <= 0.01 && color.b <= 0.01) {
            finalColor = vec3(0.0, 0.45, 1.0); // Vibrant pure Blue shadow clipping warning
        }
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
`;
