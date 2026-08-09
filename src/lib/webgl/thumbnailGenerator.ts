import { PhotoAdjustments, Preset } from '../../types/editor';
import { createDefaultAdjustments } from '../presets';
import { WebGLPhotoRenderer } from './renderer';

/**
 * Pre-renders small 140x90 thumbnail images for presets asynchronously in non-blocking batches
 * using an offscreen WebGL renderer and disposes WebGL resources cleanly.
 */
export async function generatePresetThumbnails(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  presets: Preset[],
  onBatchDone?: (batchMap: Record<string, string>) => void,
  thumbWidth = 140,
  thumbHeight = 90
): Promise<Record<string, string>> {
  if (!sourceImage) return {};

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = thumbWidth;
  offscreenCanvas.height = thumbHeight;

  // Create downsampled small source for thumbnail generator
  const thumbSourceCanvas = document.createElement('canvas');
  thumbSourceCanvas.width = thumbWidth;
  thumbSourceCanvas.height = thumbHeight;
  const ctx = thumbSourceCanvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(sourceImage, 0, 0, thumbWidth, thumbHeight);
  }

  const renderer = new WebGLPhotoRenderer(offscreenCanvas);
  renderer.setImage(thumbSourceCanvas);

  const resultMap: Record<string, string> = {};
  const defaultAdj = createDefaultAdjustments();

  // Process in small async batches to avoid blocking main thread
  const BATCH_SIZE = 6;
  for (let i = 0; i < presets.length; i += BATCH_SIZE) {
    const batch = presets.slice(i, i + BATCH_SIZE);
    const batchResult: Record<string, string> = {};

    for (const preset of batch) {
      const adj: PhotoAdjustments = {
        ...defaultAdj,
        ...preset.adjustments,
      };

      renderer.render(adj);
      try {
        const url = offscreenCanvas.toDataURL('image/jpeg', 0.82);
        resultMap[preset.id] = url;
        batchResult[preset.id] = url;
      } catch (e) {
        console.warn(`Failed to generate thumbnail for preset ${preset.id}`, e);
      }
    }

    if (onBatchDone) {
      onBatchDone(batchResult);
    }

    // Yield control to main event loop for smooth UI interaction
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Clean up WebGL resources
  renderer.dispose();

  return resultMap;
}
