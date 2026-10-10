/**
 * Generates a high-resolution procedural landscape canvas
 * used as an instant offline/fail-safe fallback image if external URLs fail or are blocked.
 */
export function createProceduralSampleCanvas(width = 1920, height = 1280): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
  skyGrad.addColorStop(0, '#0f172a');
  skyGrad.addColorStop(0.35, '#3b0764');
  skyGrad.addColorStop(0.7, '#c026d3');
  skyGrad.addColorStop(0.95, '#fb923c');
  skyGrad.addColorStop(1, '#fed7aa');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Glowing Sun / Moon
  const sunX = width * 0.5;
  const sunY = height * 0.52;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, width * 0.35);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.2, '#fde047');
  sunGrad.addColorStop(0.5, 'rgba(251, 146, 60, 0.4)');
  sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, width * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Distant Mountain Ridge
  ctx.fillStyle = '#4a044e';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.62);
  ctx.lineTo(width * 0.18, height * 0.52);
  ctx.lineTo(width * 0.36, height * 0.58);
  ctx.lineTo(width * 0.55, height * 0.48);
  ctx.lineTo(width * 0.72, height * 0.57);
  ctx.lineTo(width * 0.88, height * 0.51);
  ctx.lineTo(width, height * 0.6);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Midground Mountain Ridge
  ctx.fillStyle = '#2e1065';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.68);
  ctx.lineTo(width * 0.22, height * 0.59);
  ctx.lineTo(width * 0.44, height * 0.69);
  ctx.lineTo(width * 0.68, height * 0.57);
  ctx.lineTo(width * 0.85, height * 0.66);
  ctx.lineTo(width, height * 0.62);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Foreground Lake / Floor with Reflection
  const lakeGrad = ctx.createLinearGradient(0, height * 0.72, 0, height);
  lakeGrad.addColorStop(0, '#1e1b4b');
  lakeGrad.addColorStop(0.4, '#172554');
  lakeGrad.addColorStop(1, '#020617');
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, height * 0.72, width, height * 0.28);

  // Water shimmer lines
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const y = height * 0.73 + (height * 0.26 * (i / 40));
    const spread = (y - height * 0.72) * 1.5;
    ctx.beginPath();
    ctx.moveTo(sunX - spread * (0.3 + Math.random() * 0.5), y);
    ctx.lineTo(sunX + spread * (0.3 + Math.random() * 0.5), y);
    ctx.stroke();
  }

  return canvas;
}
