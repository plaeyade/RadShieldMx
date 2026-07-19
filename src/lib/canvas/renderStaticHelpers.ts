export interface CanvasViewportRenderState {
  scale: number;
  offsetX: number;
  offsetY: number;
  scale_m_per_pixel: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export function drawCanvasBackgroundGrid(
  ctx: CanvasRenderingContext2D,
  viewport: CanvasViewportRenderState,
  size: CanvasSize,
  options: { backgroundColor?: string; gridColor?: string; baseGridPx?: number } = {},
): void {
  const backgroundColor = options.backgroundColor ?? '#f7fafc';
  const gridColor = options.gridColor ?? '#e2e8f0';
  const baseGridPx = options.baseGridPx ?? 50;
  const gridSize = Math.max(4, baseGridPx * viewport.scale);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size.width, size.height);

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const startGridX = ((viewport.offsetX % gridSize) + gridSize) % gridSize;
  const startGridY = ((viewport.offsetY % gridSize) + gridSize) % gridSize;
  for (let x = startGridX; x < size.width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size.height);
  }
  for (let y = startGridY; y < size.height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(size.width, y);
  }
  ctx.stroke();
}

export function drawFloorPlanImageLayer(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  viewport: CanvasViewportRenderState,
  options: { opacity?: number } = {},
): void {
  if (!image) return;
  const opacity = options.opacity ?? 0.6;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(
    image,
    viewport.offsetX,
    viewport.offsetY,
    image.width * viewport.scale,
    image.height * viewport.scale,
  );
  ctx.restore();
}

export function drawCanvasScaleHud(
  ctx: CanvasRenderingContext2D,
  viewport: CanvasViewportRenderState,
  size: CanvasSize,
): void {
  const sbX = size.width - 120;
  const sbY = size.height - 40;
  const sbLengthPx = viewport.scale_m_per_pixel > 0
    ? (1 / viewport.scale_m_per_pixel) * viewport.scale
    : 0;
  const visibleLength = Math.min(sbLengthPx, 100);

  ctx.save();
  ctx.fillStyle = '#2d3748';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Escala: ${viewport.scale_m_per_pixel > 0 ? `${(1 / viewport.scale_m_per_pixel).toFixed(0)} px/m` : 'Sin calibrar'}`, sbX, sbY - 10);
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sbX, sbY);
  ctx.lineTo(sbX + visibleLength, sbY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sbX, sbY - 3);
  ctx.lineTo(sbX, sbY + 3);
  ctx.moveTo(sbX + visibleLength, sbY - 3);
  ctx.lineTo(sbX + visibleLength, sbY + 3);
  ctx.stroke();
  ctx.fillText('1 m', sbX + visibleLength / 2 - 10, sbY + 15);
  ctx.restore();
}

export function getF228StaticHelperSummary() {
  return {
    schema: 'radshield-mx.canvas.static-render-helpers.f228.v1' as const,
    helpers: ['drawCanvasBackgroundGrid', 'drawFloorPlanImageLayer', 'drawCanvasScaleHud'],
    migratedLayers: ['background-grid', 'floorplan-image', 'hud-scale'],
    guardedLayers: ['cad-overlays', 'selection-grips'],
    decision:
      'F228 extrae helpers puros para capas estaticas/HUD. No toca barreras, seleccion, grips, lasso ni eventos base.',
  };
}
