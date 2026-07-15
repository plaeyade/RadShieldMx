import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';

export type F99CadCapabilityStatus = 'ready' | 'partial' | 'missing';

export interface F99CadCapability {
  id: string;
  label: string;
  status: F99CadCapabilityStatus;
  current: string;
  missing: string;
}

export function buildF99CanvasCadReadiness(input: {
  floorPlan?: FloorPlan;
  selectedId?: string | null;
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
  heatmapPointCount?: number;
  snapToGrid?: boolean;
}) {
  const floorPlan = input.floorPlan;
  const barriers = floorPlan?.barriers ?? [];
  const sources = floorPlan?.sources ?? [];
  const layersApplied = barriers.some((barrier) => Boolean(barrier.shieldingPresetId || barrier.shieldingLayers?.length));
  const selectedBarrier = barriers.some((barrier) => barrier.id === input.selectedId);
  const selectedSource = sources.some((source) => source.id === input.selectedId);
  const hasScale = Boolean(floorPlan?.scale_m_per_pixel && floorPlan.scale_m_per_pixel > 0);
  const hasHeatmap = (input.heatmapPointCount ?? 0) > 0;
  const hasSampleLines = (input.sampleLines?.length ?? 0) > 0;

  const capabilities: F99CadCapability[] = [
    {
      id: 'dimensions',
      label: 'Cotas',
      status: hasScale && barriers.length > 0 ? 'ready' : 'missing',
      current: 'Selected barriers show measured CAD overlay and CAD JSON exports dimension entities.',
      missing: 'Optional future: independent dimension objects and editable visual styles.',
    },
    {
      id: 'grips',
      label: 'Grips',
      status: selectedBarrier || selectedSource ? 'ready' : 'partial',
      current: 'Barrier endpoint/midpoint grips and equipment move/rotate grips are draggable.',
      missing: 'Optional future: keyboard nudging, constraints panel and grip tooltips.',
    },
    {
      id: 'direct_edit',
      label: 'Edicion directa',
      status: selectedBarrier || selectedSource ? 'ready' : 'partial',
      current: 'Inline CAD inputs exist for selected barrier/equipment plus undoable drag edits.',
      missing: 'Optional future: floating property popover directly over canvas.',
    },
    {
      id: 'layers',
      label: 'Capas',
      status: layersApplied ? 'ready' : 'partial',
      current: 'Layer visibility, opacity and shielding preset layers are available.',
      missing: 'Layer lock/isolate, saved layer states and per-layer snapping.',
    },
    {
      id: 'snapping',
      label: 'Snapping',
      status: input.snapToGrid ? 'ready' : 'partial',
      current: 'Grid, endpoint, midpoint, perpendicular, equipment center and angle-15 snapping are wired.',
      missing: 'Optional future: intersection/tangent solver and visible snap glyph per mode.',
    },
    {
      id: 'equipment_symbols',
      label: 'Simbolos equipos',
      status: 'ready',
      current: 'Unified equipment symbols include rotation, footprint metadata and manufacturer variant export.',
      missing: 'Optional future: manufacturer-specific SVG/PNG catalog and collision warnings.',
    },
    {
      id: 'isocontours',
      label: 'Isocontornos',
      status: hasHeatmap || hasSampleLines ? 'ready' : 'partial',
      current: 'Heatmap has labeled contour levels and regulatory threshold legend with CAD JSON export.',
      missing: 'Optional future: marching-squares contour extraction from dense dose fields.',
    },
    {
      id: 'selection',
      label: 'Seleccion',
      status: input.selectedId ? 'ready' : 'partial',
      current: 'Single select, Shift multi-select, window select and hover preselection are wired.',
      missing: 'Optional future: freeform lasso and object tree synchronization.',
    },
  ];

  const score = Math.round((capabilities.reduce((sum, item) => {
    if (item.status === 'ready') return sum + 1;
    if (item.status === 'partial') return sum + 0.5;
    return sum;
  }, 0) / capabilities.length) * 100);

  return {
    capabilities,
    ready: capabilities.filter((item) => item.status === 'ready').length,
    partial: capabilities.filter((item) => item.status === 'partial').length,
    missing: capabilities.filter((item) => item.status === 'missing').length,
    score,
    nextCadActions: [
      'Add freeform lasso selection',
      'Add snap glyph labels at cursor',
      'Add manufacturer-specific SVG/PNG equipment catalog',
      'Add dense marching-squares contour extraction',
    ],
  };
}
