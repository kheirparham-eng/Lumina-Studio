# 📸 Photo Editor Studio

[![Deploy to GitHub Pages](https://github.com/kheirparham-eng/Photo-editor/actions/workflows/deploy.yml/badge.svg)](https://github.com/kheirparham-eng/Photo-editor/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://kheirparham-eng.github.io/Photo-editor/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![WebGL](https://img.shields.io/badge/WebGL-2.0%20Engine-990000?style=for-the-badge&logo=webgl)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)

A high-performance, GPU-accelerated web photo editor built with **React 19**, **TypeScript**, **WebGL GLSL Shaders**, and **Tailwind CSS**. Designed with an elegant iOS-inspired glassmorphism interface and professional photo-editing controls.

👉 **[Try the Live App Here](https://kheirparham-eng.github.io/Photo-editor/)**

---

## ✨ Features

- ⚡ **GPU-Accelerated WebGL Rendering**: Instant realtime rendering powered by custom WebGL fragment shaders for silky-smooth 60 FPS slider adjustments.
- 🎨 **Professional Tone & Color Controls**:
  - **Light**: Exposure, Contrast, Highlights, Shadows, Whites, Blacks, and Tone Curve control.
  - **Color**: White Balance (Temperature & Tint), Vibrance, Saturation, and 8-channel HSL Color Mixer.
  - **Effects & Detail**: Clarity, Dehaze, Vignette, Film Grain, and Sharpening.
- 📊 **Realtime RGB Histogram**: Dynamic WebGL-calculated channel distribution and luminance graph.
- 🔀 **Before & After Comparison**:
  - Split-screen slider mode.
  - Side-by-side mode.
  - Hold-to-compare overlay.
- 🎛️ **Cinematic Presets & Custom Presets**:
  - Rich built-in library (Film Noir, Moody Amber, Golden Hour, Crisp Clean, Cyberpunk, Vintage Chrome, and more).
  - Create and save custom presets to `localStorage` with thumbnail generation.
- 🤖 **AI Auto-Enhance**: Gemini AI integration for intelligent image tone analysis and balanced auto-adjustments.
- 🌓 **iOS Glassmorphism UI**: Seamless toggle between Dark Glass Studio mode and Light Glass Daylight mode.
- ↺ **Non-Destructive History**: Full undo/redo history timeline with quick restore points.
- 💾 **High-Resolution Export**: Export full-resolution images in PNG, JPEG, or WebP format with custom compression quality settings.

---

## 🛠️ Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Graphics Engine** | Custom WebGL Fragment Shaders (`glsl`) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Deployment** | GitHub Actions + GitHub Pages |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kheirparham-eng/Photo-editor.git
   cd Photo-editor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🌐 Deploying to GitHub Pages

This repository is pre-configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the application to GitHub Pages whenever you push to `main` or `master`.

### Enable GitHub Pages in Repository Settings:
1. Go to your repository on GitHub: `https://github.com/kheirparham-eng/Photo-editor`
2. Click **Settings** ➔ **Pages**.
3. Under **Source**, select **GitHub Actions**.
4. Push your changes to `main`:
   ```bash
   git add .
   git commit -m "Deploy Photo Editor to GitHub Pages"
   git push origin main
   ```

---

## 📜 License

Distributed under the Apache 2.0 License. See `LICENSE` for details.
