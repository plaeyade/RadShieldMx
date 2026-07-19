import type { CanvasBarrierResult } from '@/hooks/useCanvas';
import type { CanvasLayer } from '@/hooks/useCanvasLayers';
import type { Barrier, FloorPlan } from '@/types/radshield';

export type F209DimensionStatus = 'ready' | 'review' | 'missing-scale';

export interface F209DimensionRow {
  id: string;
  label: string;
  barrierType: string;
  material: string;
  lengthPx: number;
  lengthM: number;
  thicknessMm: number;
  hasResult: boolean;
}

export interface F209LayerRow {
  id: string;
  label: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface F209CanvasDimensionSchedule {
  phase: 'F209';
  schema: 'radshield-mx.canvas-dimension-schedule.f209.v1';
  status: 'canvas-dimension-schedule-ready' | 'canvas-dimension-schedule-review';
  scale_m_per_pixel: number;
  barrierCount: number;
  resultCoveragePct: number;
  totalLengthM: number;
  longestBarrierM: number;
  rows: F209DimensionRow[];
  layers: F209LayerRow[];
  warnings: string[];
  reportColumns: string[];
  decision: string;
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function thicknessOf(barrier: Barrier): number {
  const required = barrier.requiredThickness_mm;
  if (typeof required === 'number' && Number.isFinite(required)) return required;
  if (required && typeof required === 'object') {
    const values = Object.values(required).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (values.length > 0) return Math.max(...values);
  }
  return finite(barrier.thickness_mm);
}

export function buildF209CanvasDimensionSchedule(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  layers: CanvasLayer[] = [],
): F209CanvasDimensionSchedule {
  const scale = finite(floorPlan?.scale_m_per_pixel);
  const resultIds = new Set(barrierResults.map((result) => result.barrierId));
  const barriers = floorPlan?.barriers ?? [];
  const rows = barriers.map((barrier) => {
    const lengthPx = Math.hypot(finite(barrier.x2) - finite(barrier.x1), finite(barrier.y2) - finite(barrier.y1));
    return {
      id: barrier.id,
      label: barrier.name || barrier.id,
      barrierType: barrier.barrierType || 'secondary',
      material: barrier.materialCode || barrier.material || 'N/D',
      lengthPx,
      lengthM: lengthPx * scale,
      thicknessMm: thicknessOf(barrier),
      hasResult: resultIds.has(barrier.id),
    };
  });

  const totalLengthM = rows.reduce((sum, row) => sum + row.lengthM, 0);
  const resultCoveragePct = rows.length ? Math.round((rows.filter((row) => row.hasResult).length / rows.length) * 100) : 0;
  const layerRows = layers.map((layer) => ({
    id: layer.id,
    label: layer.nameEs || layer.name || layer.id,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity,
  }));
  const warnings = [
    scale <= 0 ? 'Definir escala m/pixel para convertir cotas a metros.' : '',
    rows.length === 0 ? 'Dibujar o importar barreras para crear tabla de cotas.' : '',
    rows.some((row) => row.lengthM <= 0) ? 'Revisar barreras con longitud cero antes de exportar.' : '',
    resultCoveragePct < 100 && rows.length > 0 ? 'Ejecutar calculo para cubrir todas las barreras de la tabla.' : '',
  ].filter(Boolean);
  const status = warnings.length === 0 ? 'canvas-dimension-schedule-ready' : 'canvas-dimension-schedule-review';

  return {
    phase: 'F209',
    schema: 'radshield-mx.canvas-dimension-schedule.f209.v1',
    status,
    scale_m_per_pixel: scale,
    barrierCount: rows.length,
    resultCoveragePct,
    totalLengthM,
    longestBarrierM: rows.reduce((max, row) => Math.max(max, row.lengthM), 0),
    rows,
    layers: layerRows,
    warnings,
    reportColumns: ['Barrera', 'Tipo', 'Material', 'Longitud m', 'Espesor mm', 'Resultado'],
    decision:
      'F209 agrega una agenda CAD de cotas/capas para revisar longitudes, materiales y cobertura de calculo antes de exportar el plano a memoria, PDF o Evidence Pack.',
  };
}

export function formatF209CanvasDimensionSchedule(schedule: F209CanvasDimensionSchedule): string {
  return [
    'F209 CANVAS DIMENSION SCHEDULE',
    `Estado: ${schedule.status}`,
    `Escala: ${schedule.scale_m_per_pixel} m/pixel`,
    `Barreras: ${schedule.barrierCount}; cobertura calculo: ${schedule.resultCoveragePct}%`,
    `Longitud total: ${schedule.totalLengthM.toFixed(2)} m; mayor: ${schedule.longestBarrierM.toFixed(2)} m`,
    ...schedule.rows.slice(0, 12).map((row) => `- ${row.label}: ${row.barrierType}, ${row.material}, ${row.lengthM.toFixed(2)} m, ${row.thicknessMm.toFixed(1)} mm, resultado=${row.hasResult ? 'si' : 'no'}`),
    `Capas: ${schedule.layers.map((layer) => `${layer.label}:${layer.visible ? 'on' : 'off'}`).join(' | ') || 'N/D'}`,
    `Advertencias: ${schedule.warnings.join(' | ') || 'sin advertencias'}`,
    `Decision: ${schedule.decision}`,
  ].join('\n');
}
