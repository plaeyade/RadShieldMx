export interface CanvasProjection {
  scale: number;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
}

export interface CanvasHeatmapPoint {
  x: number;
  y: number;
  kerma: number;
}

export interface CanvasSamplePointLike {
  x: number;
  y: number;
  kerma?: number;
  thickness_mm?: number;
}

export interface CanvasSampleLineLike {
  id: string;
  points: CanvasSamplePointLike[];
  maxKermaPoint: CanvasSamplePointLike | null;
  maxThicknessPoint: CanvasSamplePointLike | null;
}

function doseColor(normalized: number): [number, number, number] {
  if (normalized < 0.33) {
    const t = normalized / 0.33;
    return [
      Math.round(34 + t * (251 - 34)),
      Math.round(197 + t * (192 - 197)),
      Math.round(94 + t * (45 - 94)),
    ];
  }
  if (normalized < 0.66) {
    const t = (normalized - 0.33) / 0.33;
    return [
      Math.round(251 + t * (237 - 251)),
      Math.round(192 + t * (137 - 192)),
      Math.round(45 + t * (54 - 45)),
    ];
  }
  const t = (normalized - 0.66) / 0.34;
  return [
    Math.round(237 + t * (220 - 237)),
    Math.round(137 + t * (38 - 137)),
    Math.round(54 + t * (38 - 54)),
  ];
}

export function drawCanvasHeatmapLayer(
  ctx: CanvasRenderingContext2D,
  heatmapData: CanvasHeatmapPoint[] | undefined,
  projection: CanvasProjection,
) {
  if (!heatmapData || heatmapData.length === 0) return;

  const maxKerma = Math.max(...heatmapData.map((point) => point.kerma));
  const minKerma = Math.min(...heatmapData.map((point) => point.kerma));
  const range = maxKerma - minKerma || 1;

  for (const point of heatmapData) {
    const sp = projection.worldToScreen(point.x, point.y);
    const normalized = (point.kerma - minKerma) / range;
    const [r, g, b] = doseColor(normalized);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 8 * projection.scale, 0, Math.PI * 2);
    ctx.fill();
  }

  const legendX = 10;
  const legendY = 60;
  const legendW = 120;
  const legendH = 12;
  for (let i = 0; i < legendW; i += 1) {
    const [r, g, b] = doseColor(i / legendW);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(legendX + i, legendY, 1, legendH);
  }

  ctx.fillStyle = '#2d3748';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(minKerma.toFixed(2), legendX, legendY + legendH + 10);
  ctx.textAlign = 'right';
  ctx.fillText(maxKerma.toFixed(2), legendX + legendW, legendY + legendH + 10);
  ctx.textAlign = 'center';
  ctx.fillText('mSv/sem', legendX + legendW / 2, legendY - 3);

  const contourLevels = [
    { ratio: 0.25, label: '25%', color: '#22c55e' },
    { ratio: 0.5, label: '50%', color: '#f59e0b' },
    { ratio: 0.75, label: '75%', color: '#ef4444' },
  ];
  for (const level of contourLevels) {
    const target = minKerma + range * level.ratio;
    const candidates = heatmapData
      .map((point) => ({ point, delta: Math.abs(point.kerma - target) }))
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 8);
    if (candidates.length < 3) continue;

    const centroid = candidates.reduce((acc, item) => ({ x: acc.x + item.point.x, y: acc.y + item.point.y }), { x: 0, y: 0 });
    centroid.x /= candidates.length;
    centroid.y /= candidates.length;
    const csp = projection.worldToScreen(centroid.x, centroid.y);
    const radius = Math.max(18, Math.min(140, 24 + level.ratio * 72)) * projection.scale;

    ctx.save();
    ctx.strokeStyle = level.color;
    ctx.fillStyle = level.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 4]);
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.arc(csp.x, csp.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${level.label} ${target.toFixed(2)}`, csp.x, csp.y - radius - 6);
    ctx.restore();
  }

  const regulatoryThreshold = 0.02;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(legendX, legendY + 34, 138, 20, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Umbral regulatorio: ${regulatoryThreshold} mSv/sem`, legendX + 5, legendY + 47);
  ctx.restore();
}

export function drawCanvasSampleLinesLayer(
  ctx: CanvasRenderingContext2D,
  sampleLines: CanvasSampleLineLike[],
  projection: CanvasProjection,
  options: { showSampleLines: boolean; showSamplePoints: boolean; showMaxima: boolean },
) {
  for (const sampleLine of sampleLines) {
    if (sampleLine.points.length < 2) continue;

    if (options.showSampleLines) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      const first = projection.worldToScreen(sampleLine.points[0].x, sampleLine.points[0].y);
      ctx.moveTo(first.x, first.y);
      for (const point of sampleLine.points.slice(1)) {
        const sp = projection.worldToScreen(point.x, point.y);
        ctx.lineTo(sp.x, sp.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const midPoint = sampleLine.points[Math.floor(sampleLine.points.length / 2)];
      const mid = projection.worldToScreen(midPoint.x, midPoint.y);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('0.3m', mid.x, mid.y - 4);
    }

    if (options.showSamplePoints) {
      ctx.fillStyle = 'rgba(30,30,30,0.6)';
      ctx.beginPath();
      for (const point of sampleLine.points) {
        const sp = projection.worldToScreen(point.x, point.y);
        ctx.moveTo(sp.x + 2.5, sp.y);
        ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    if (!options.showMaxima) continue;
    if (sampleLine.maxKermaPoint) {
      const sp = projection.worldToScreen(sampleLine.maxKermaPoint.x, sampleLine.maxKermaPoint.y);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(220,38,38,0.15)';
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Kmax', sp.x, sp.y - 12);
    }
    if (sampleLine.maxThicknessPoint) {
      const sp = projection.worldToScreen(sampleLine.maxThicknessPoint.x, sampleLine.maxThicknessPoint.y);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(37,99,235,0.15)';
      ctx.fill();
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tmax', sp.x, sp.y + 18);
    }
  }
}

export function buildRendererBaseV2Summary(input: {
  heatmapPointCount: number;
  sampleLineCount: number;
  rendererHelpersActive: string[];
  eventControllerTouched: boolean;
}) {
  const dynamicHelpers = ['drawCanvasHeatmapLayer', 'drawCanvasSampleLinesLayer'];
  return {
    schema: 'radshield-mx.canvas.renderer-base-v2.f387.v1' as const,
    status: input.eventControllerTouched ? 'blocked-event-controller-touched' as const : 'renderer-base-v2-active' as const,
    activeHelpers: [...input.rendererHelpersActive, ...dynamicHelpers],
    dynamicHelpers,
    heatmapPointCount: input.heatmapPointCount,
    sampleLineCount: input.sampleLineCount,
    eventControllerTouched: input.eventControllerTouched,
    guardrails: [
      'Dynamic render helpers are pure drawing functions.',
      'Selection, grips, snapping and pointer events remain in useCanvas.',
      'Do not combine renderer base v2 with event-controller rewrite in the same release.',
    ],
  };
}
