/**
 * Smart Viewport Downsampling Utility
 * Scales high-resolution source images down to a maximum dimension (e.g. 2048px)
 * for live editing previews to ensure silky-smooth 60fps WebGL rendering.
 */
export function createDownsampledImage(
  sourceImg: HTMLImageElement,
  maxDimension = 2048
): HTMLCanvasElement | HTMLImageElement {
  const width = sourceImg.naturalWidth || sourceImg.width || 1920;
  const height = sourceImg.naturalHeight || sourceImg.height || 1080;

  if (width <= maxDimension && height <= maxDimension) {
    return sourceImg;
  }

  let targetWidth = width;
  let targetHeight = height;

  if (width > height) {
    targetWidth = maxDimension;
    targetHeight = Math.round((height * maxDimension) / width);
  } else {
    targetHeight = maxDimension;
    targetWidth = Math.round((width * maxDimension) / height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImg, 0, 0, targetWidth, targetHeight);
  }

  return canvas;
}
