import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';

export type F90QaStepId =
  | 'layout'
  | 'scale'
  | 'sources'
  | 'controlledZone'
  | 'barriers'
  | 'calculation'
  | 'heatmap'
  | 'evidence'
  | 'dbDecision';

export interface F90QaStep {
  id: F90QaStepId;
  label: string;
  ready: boolean;
  detail: string;
}

export interface F90QaInput {
  floorPlan?: FloorPlan;
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
  heatmapPointCount?: number;
  dbLive?: boolean;
  dbDeferred?: boolean;
}

export function buildF90EndToEndChecklist(input: F90QaInput): F90QaStep[] {
  const floorPlan = input.floorPlan;
  const barriers = floorPlan?.barriers ?? [];
  const sources = floorPlan?.sources ?? [];
  const regions = (floorPlan?.occupiedRegions.length ?? 0) + (floorPlan?.regions?.length ?? 0);
  const criticalPoints = floorPlan?.criticalPoints?.length ?? 0;
  const barrierResults = input.barrierResults ?? [];
  const sampleLines = input.sampleLines ?? [];
  const heatmapPointCount = input.heatmapPointCount ?? 0;
  const dbLive = input.dbLive === true;
  const dbDeferred = input.dbDeferred !== false;
  const hasCalculatedBarriers = barriers.some((barrier) => barrier.maxKerma || barrier.requiredThickness_mm);

  return [
    {
      id: 'layout',
      label: 'Layout',
      ready: Boolean(floorPlan?.imageUrl) || barriers.length > 0,
      detail: floorPlan?.imageUrl ? 'Plano importado' : barriers.length > 0 ? 'Layout vectorial' : 'Importar o dibujar plano',
    },
    {
      id: 'scale',
      label: 'Escala',
      ready: Boolean(floorPlan?.scale_m_per_pixel && floorPlan.scale_m_per_pixel > 0),
      detail: floorPlan?.scale_m_per_pixel ? `${floorPlan.scale_m_per_pixel.toFixed(4)} m/px` : 'Calibrar escala',
    },
    {
      id: 'sources',
      label: 'Equipos',
      ready: sources.length > 0,
      detail: sources.length > 0 ? `${sources.length} fuente(s)` : 'Colocar LINAC, PET/CT, HDR, etc.',
    },
    {
      id: 'controlledZone',
      label: 'Zona',
      ready: regions > 0 || criticalPoints > 0,
      detail: regions > 0 ? `${regions} region(es)` : criticalPoints > 0 ? `${criticalPoints} punto(s) critico(s)` : 'Dibujar zona/control',
    },
    {
      id: 'barriers',
      label: 'Barreras',
      ready: barriers.length > 0,
      detail: barriers.length > 0 ? `${barriers.length} barrera(s)` : 'Dibujar muros/losa',
    },
    {
      id: 'calculation',
      label: 'Calculo',
      ready: barrierResults.length > 0 || hasCalculatedBarriers || sampleLines.length > 0,
      detail: barrierResults.length > 0 ? `${barrierResults.length} resultado(s)` : sampleLines.length > 0 ? `${sampleLines.length} linea(s)` : 'Ejecutar calculo',
    },
    {
      id: 'heatmap',
      label: 'Heatmap',
      ready: heatmapPointCount > 0,
      detail: heatmapPointCount > 0 ? `${heatmapPointCount} punto(s)` : 'Activar F89',
    },
    {
      id: 'evidence',
      label: 'Evidencia',
      ready: (barrierResults.length > 0 || hasCalculatedBarriers) && criticalPoints > 0,
      detail: criticalPoints > 0 ? 'Snapshot/QA listo' : 'Agregar punto critico',
    },
    {
      id: 'dbDecision',
      label: 'DB',
      ready: dbLive || dbDeferred,
      detail: dbLive ? 'Live validada' : dbDeferred ? 'Diferida documentada' : 'Definir DB',
    },
  ];
}

export function summarizeF90EndToEndQa(steps: F90QaStep[]) {
  const ready = steps.filter((step) => step.ready).length;
  const total = steps.length;
  return {
    ready,
    total,
    pct: total > 0 ? Math.round((ready / total) * 100) : 0,
    releaseReadyOffline: ready === total,
    missing: steps.filter((step) => !step.ready).map((step) => step.label),
  };
}
