# 📸 Lumina Studio — Professional WebGL Photo Editor

<p align="center">
  <img src="https://raw.githubusercontent.com/kheirparham-eng/Lumina-Studio/main/public/icon.png" width="96" alt="Lumina Studio Logo" />
</p>

<p align="center">
  <b>A high-performance, GPU-accelerated non-destructive photo studio built with React 19, TypeScript, custom GLSL Shaders, and Tailwind CSS.</b>
</p>

<p align="center">
  <a href="https://github.com/kheirparham-eng/Lumina-Studio/actions/workflows/deploy.yml">
    <img src="https://github.com/kheirparham-eng/Lumina-Studio/actions/workflows/deploy.yml/badge.svg" alt="Deploy to GitHub Pages" />
  </a>
  <a href="https://kheirparham-eng.github.io/Lumina-Studio/">
    <img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=for-the-badge&logo=github" alt="Live Demo" />
  </a>
  <a href="https://react.dev">
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API">
    <img src="https://img.shields.io/badge/WebGL-2.0%20GLSL-990000?style=for-the-badge&logo=webgl" alt="WebGL GLSL" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-Apache%202.0-green.svg?style=for-the-badge" alt="License" />
  </a>
</p>

---

👉 **[Launch Lumina Studio Live Application](https://kheirparham-eng.github.io/Lumina-Studio/)**

---

## 🌟 Overview

**Lumina Studio** is a browser-based, pro-tier photo editing workstation engineered for photographers, digital creators, and designers. Powered by custom WebGL fragment shaders, Lumina Studio processes image transformations directly on the GPU at a buttery smooth 60 FPS without touching original pixel buffers.

Designed with a refined **iOS Liquid Glass** aesthetic (frosted glassmorphism, 1px refractive highlights, and fluid micro-interactions), Lumina Studio pairs industry-standard photo editing tools with cutting-edge WebGL rendering and Gemini AI smart auto-enhancements.

---

## ✨ Key Features & Capabilities

### 🎛️ 1. Professional Tone & Color Suite
- **Light Controls**: Exposure ($\pm 3$ EV), Contrast, Highlights, Shadows, Whites, and Blacks.
- **Color Temperature & Tint**: Precision White Balance adjustments with kelvin-mapped color shifts.
- **Vibrance & Saturation**: Smart skin-tone-aware color booster and global saturation controls.
- **8-Channel HSL Color Mixer**: Individual Hue, Saturation, and Luminance control for Red, Orange, Yellow, Green, Aqua, Blue, Purple, and Magenta.
- **3-Way Color Grading**: Independent Hue, Saturation, and Balance controls for Shadows, Midtones, and Highlights.

---

### 📈 2. Interactive RGB Tone Curves
- **Master RGB & Individual Channels**: Independent control point editing for Master RGB, Red, Green, and Blue curves.
- **Realtime Spline Mapping**: Custom WebGL curve lookup tables applied instantly to every pixel in real time.

---

### 🎯 3. Local Selective Masking Tools (Non-Destructive)
- **Radial Gradient Mask**: Isolate edits within an adjustable ellipse (ideal for subject pops, vignettes, or light blooms).
- **Linear Gradient Mask**: Draw split linear gradients for darkening skies or sculpting foreground light.
- **Mask Adjustments**: Non-destructive local Exposure, Contrast, Temperature, Saturation, and Clarity inside masked regions.
- **Invert & Feather**: Full control over mask inversion, opacity, and softness.

---

### 🎞️ 4. Analog Grain & Texture Engine
- **Procedural Film Grain**: Multi-scale grain with adjustable Size, Roughness, and Amount.
- **Chromatic Aberration**: Realistic RGB channel fringe shifting.
- **Lens Vignette & Midpoint**: Custom lens falloff and dark corner control.
- **Clarity, Texture & Dehaze**: Micro-contrast enhancement and atmospheric haze reduction.

---

### 🔀 5. Multi-Mode Before/After Comparison
- **Interactive Split-Screen**: Vertical divider slider for side-by-side comparison.
- **Side-by-Side Dual View**: Simultaneous full-frame preview of original vs edited image.
- **Hold-to-View**: Press and hold <kbd>Spacebar</kbd> or click the preview button to temporarily reveal the original photo.

---

### 📊 6. Realtime RGB Histogram & Clipping Warnings
- **Dynamic Channel Distribution**: Live WebGL-calculated Red, Green, Blue, and Luminance graphs.
- **Highlight Clipping Warning**: Blinks bright red for overexposed pixels ($\ge 99\%$).
- **Shadow Clipping Warning**: Blinks bright blue for underexposed pixels ($\le 1\%$).

---

### 🎨 7. Hardcoded Industry-Standard Presets Library
Includes authentic tonal profiles with a global **Preset Strength Blend Slider** ($0\%$ to $100\%$):

| Category | Preset Profile | Character / Aesthetic |
|---|---|---|
| **Analog Film** | **Kodak Portra 400** | Warm editorial film, soft highlight roll-off, matte lifted blacks. |
| | **Fuji Velvia 50** | Vibrant landscape boost, deep greens & rich ocean blues. |
| **Modern Social** | **Dark & Moody** | Dramatic cinematic tones desaturated greens, amber highlight split. |
| | **Bright & Airy** | Soft lifestyle glow lifted shadows, glowing skin-tone luminance. |
| | **Clean Minimalist** | Crisp contrast, desaturated secondary colors, pure whites. |
| **Urban & Stylized** | **Cyberpunk Neon** | Tokyo night vibe electric cyan shadows & magenta highlights. |
| | **Golden Hour Glow** | Warm sunlit sunset tones golden highlights & rich warm shadows. |
| | **B&W Noir** | Monochromatic high-contrast dramatic noir black & white. |

---


## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>C</kbd> | Toggle Interactive Crop & Straighten Overlay |
| <kbd>Spacebar</kbd> *(Hold)* | Hold to reveal original photo |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo last adjustment |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Shift</kbd> + <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Redo adjustment |

---

## 🛠️ Tech Stack

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/)
- **Build System**: [Vite 6](https://vitejs.dev/)
- **GPU Engine**: Custom WebGL GLSL Fragment Shaders & Offscreen Canvas Renderers
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Deployment**: GitHub Actions + GitHub Pages

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kheirparham-eng/Lumina-Studio.git
   cd Lumina-Studio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` in your web browser.

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🌐 Deploying to GitHub Pages

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys **Lumina Studio** to GitHub Pages on every push to `main` or `master`.

### Enable GitHub Pages:
1. Go to your repository settings: `https://github.com/kheirparham-eng/Lumina-Studio/settings/pages`
2. Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
3. Push your latest code:
   ```bash
   git add .
   git commit -m "Update Lumina Studio"
   git push origin main
   ```

---

## 📜 License

Distributed under the **Apache 2.0 License**. See [`LICENSE`](LICENSE) for details.
