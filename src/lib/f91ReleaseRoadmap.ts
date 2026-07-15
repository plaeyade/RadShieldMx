import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';
import { buildF90EndToEndChecklist, summarizeF90EndToEndQa } from '@/lib/f90EndToEndQa';

export type ReleasePriority = 'P0' | 'P1' | 'P2';

export interface ReleaseImprovement {
  phase: string;
  priority: ReleasePriority;
  area: 'canvas' | '3d' | 'rag' | 'memoriaIA' | 'db' | 'security' | 'release';
  title: string;
  outcome: string;
}

export const RELEASE_IMPROVEMENT_ROADMAP: ReleaseImprovement[] = [
  {
    phase: 'F91',
    priority: 'P0',
    area: 'canvas',
    title: 'Canvas avanzado CAD-like',
    outcome: 'Contextual editing, precision cues, layer visibility, measurements and isocontour readiness from the active floor plan.',
  },
  {
    phase: 'F92',
    priority: 'P0',
    area: '3d',
    title: '3D inspection walkthrough',
    outcome: 'First-person visual inspection of equipment, wall thicknesses, controlled zones and dose overlays.',
  },
  {
    phase: 'F93',
    priority: 'P0',
    area: 'rag',
    title: 'RAG citation ledger',
    outcome: 'Claim-level evidence with document, page/section, hash, confidence and standards mapping for analytic memories.',
  },
  {
    phase: 'F94',
    priority: 'P0',
    area: 'db',
    title: 'DB live reconstruction',
    outcome: 'MySQL/Drizzle migrations, seeds, document chunks, projects, calculations and evidence packs validated against a real database.',
  },
  {
    phase: 'F95',
    priority: 'P1',
    area: 'security',
    title: 'Security and permissions hardening',
    outcome: 'Roles, API limits, document protection, project access controls, audit trail and env/secret review.',
  },
  {
    phase: 'F96',
    priority: 'P1',
    area: 'memoriaIA',
    title: 'Memoria IA reviewer',
    outcome: 'AI memory generation checks F90/F91 readiness, evidence coverage, missing citations and calculation traceability before export.',
  },
  {
    phase: 'F97',
    priority: 'P1',
    area: 'release',
    title: 'Release candidate package',
    outcome: 'Frozen features, full validation suite, operator manual, offline-safe package and deploy/full-stack decision.',
  },
  {
    phase: 'F98',
    priority: 'P2',
    area: 'canvas',
    title: 'Native-like CAD integrations',
    outcome: 'DWG external conversion workflow, DXF/SVG import review and Revit/IFC metadata bridge improvements.',
  },
];

export interface F91CanvasAdvancedSummary {
  selectedObjectType: 'barrier' | 'source' | 'criticalPoint' | 'region' | 'none';
  precisionScore: number;
  precisionReady: boolean;
  contextualEditReady: boolean;
  layerReady: boolean;
  measurementReady: boolean;
  heatmapReady: boolean;
  nextActions: string[];
}

export function buildF91CanvasAdvancedSummary(input: {
  floorPlan?: FloorPlan;
  selectedId?: string | null;
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
  heatmapPointCount?: number;
}): F91CanvasAdvancedSummary {
  const floorPlan = input.floorPlan;
  const barriers = floorPlan?.barriers ?? [];
  const sources = floorPlan?.sources ?? [];
  const criticalPoints = floorPlan?.criticalPoints ?? [];
  const selectedId = input.selectedId;
  const selectedObjectType =
    barriers.some((barrier) => barrier.id === selectedId) ? 'barrier'
      : sources.some((source) => source.id === selectedId) ? 'source'
        : criticalPoints.some((point) => point.id === selectedId) ? 'criticalPoint'
          : 'none';
  const f90 = summarizeF90EndToEndQa(buildF90EndToEndChecklist({
    floorPlan,
    barrierResults: input.barrierResults,
    sampleLines: input.sampleLines,
    heatmapPointCount: input.heatmapPointCount,
    dbDeferred: true,
  }));
  const contextualEditReady = selectedObjectType !== 'none';
  const layerReady = barriers.some((barrier) => Boolean(barrier.shieldingPresetId || barrier.shieldingLayers?.length));
  const measurementReady = Boolean(floorPlan?.scale_m_per_pixel && floorPlan.scale_m_per_pixel > 0 && barriers.length > 0);
  const heatmapReady = (input.heatmapPointCount ?? 0) > 0;
  const precisionScore = Math.round((f90.pct + (contextualEditReady ? 10 : 0) + (layerReady ? 10 : 0) + (measurementReady ? 10 : 0) + (heatmapReady ? 10 : 0)) / 1.4);
  const nextActions = [
    !contextualEditReady ? 'Seleccionar una barrera/equipo para edicion contextual.' : '',
    !measurementReady ? 'Calibrar escala y dibujar barreras medibles.' : '',
    !layerReady ? 'Aplicar presets/capas de blindaje a barreras.' : '',
    !heatmapReady ? 'Activar heatmap F89 despues del calculo.' : '',
  ].filter(Boolean);

  return {
    selectedObjectType,
    precisionScore: Math.min(100, precisionScore),
    precisionReady: f90.pct >= 80 && measurementReady,
    contextualEditReady,
    layerReady,
    measurementReady,
    heatmapReady,
    nextActions,
  };
}

export function buildF91MemoriaAIPlan() {
  return RELEASE_IMPROVEMENT_ROADMAP.filter((item) => item.area === 'memoriaIA' || item.area === 'rag' || item.area === 'canvas')
    .map((item) => `${item.phase} ${item.priority}: ${item.title} - ${item.outcome}`);
}
