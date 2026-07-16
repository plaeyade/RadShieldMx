import type { FloorPlan } from '@/types/radshield';
import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';

export type F171CanvasPolishStatus = 'ready' | 'partial' | 'backlog';

export interface F171CanvasPolishItem {
  id: string;
  label: string;
  status: F171CanvasPolishStatus;
  evidence: string;
  releaseUse: string;
}

export interface F171CanvasPolishSummary {
  phase: 'F171';
  status: 'canvas-polish-predeploy-ready' | 'canvas-polish-predeploy-partial';
  score: number;
  items: F171CanvasPolishItem[];
  predeployGates: string[];
  nextActions: string[];
  decision: string;
}

interface BuildOptions {
  floorPlan?: FloorPlan | null;
  selectedId?: string | null;
  selectedIds?: string[];
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
  snapToGrid?: boolean;
  heatmapPointCount?: number;
}

function statusScore(status: F171CanvasPolishStatus): number {
  if (status === 'ready') return 1;
  if (status === 'partial') return 0.6;
  return 0.2;
}

export function buildF171CanvasPolishPredeploy(options: BuildOptions = {}): F171CanvasPolishSummary {
  const barrierCount = options.floorPlan?.barriers?.length ?? 0;
  const sourceCount = options.floorPlan?.sources?.length ?? 0;
  const selectedCount = options.selectedIds?.length ?? (options.selectedId ? 1 : 0);
  const hasResults = (options.barrierResults?.length ?? 0) > 0;
  const hasSampleLines = (options.sampleLines?.length ?? 0) > 0;
  const heatmapPointCount = options.heatmapPointCount ?? 0;

  const items: F171CanvasPolishItem[] = [
    {
      id: 'grips',
      label: 'Grips',
      status: barrierCount > 0 || sourceCount > 0 ? 'ready' : 'partial',
      evidence: `${barrierCount} barriers and ${sourceCount} sources available for direct-edit affordances.`,
      releaseUse: 'Move and adjust layout objects without leaving the floorplan context.',
    },
    {
      id: 'dimensions',
      label: 'Cotas',
      status: hasSampleLines ? 'ready' : barrierCount > 0 ? 'partial' : 'backlog',
      evidence: `${options.sampleLines?.length ?? 0} sample/dimension lines tracked for visual evidence.`,
      releaseUse: 'Keep wall distance evidence visible for Memoria IA and PDF export.',
    },
    {
      id: 'snap',
      label: 'Snap',
      status: options.snapToGrid ? 'ready' : 'partial',
      evidence: options.snapToGrid ? 'Snap is enabled in current canvas state.' : 'Snap is available but currently disabled.',
      releaseUse: 'Reduce layout drift during wall tracing and equipment placement.',
    },
    {
      id: 'selection',
      label: 'Seleccion',
      status: selectedCount > 1 ? 'ready' : selectedCount === 1 ? 'partial' : 'partial',
      evidence: `${selectedCount} selected object(s); multi-selection/lasso support is exposed by F145.`,
      releaseUse: 'Batch-edit barriers, sources and zones during CAD-like review.',
    },
    {
      id: 'heatmap',
      label: 'Heatmap',
      status: hasResults && heatmapPointCount > 0 ? 'ready' : hasResults ? 'partial' : 'backlog',
      evidence: `${heatmapPointCount} heatmap points and ${options.barrierResults?.length ?? 0} barrier results available.`,
      releaseUse: 'Show isodose/regulatory context before exporting reports.',
    },
    {
      id: 'properties',
      label: 'Propiedades',
      status: barrierCount > 0 || sourceCount > 0 ? 'ready' : 'partial',
      evidence: 'Canvas context provides selectedId, selectedIds and floorPlan entity collections.',
      releaseUse: 'Enable inline/sidebar property edits with undo-ready handoff.',
    },
    {
      id: 'export',
      label: 'Export',
      status: hasResults || barrierCount > 0 ? 'ready' : 'partial',
      evidence: 'PNG export and visual evidence controls remain on the floating canvas toolbar.',
      releaseUse: 'Attach the reviewed floorplan to Memoria IA, PDF report and Evidence Pack.',
    },
  ];

  const score = Math.round((items.reduce((sum, item) => sum + statusScore(item.status), 0) / items.length) * 100);
  const status = score >= 70 ? 'canvas-polish-predeploy-ready' : 'canvas-polish-predeploy-partial';

  return {
    phase: 'F171',
    status,
    score,
    items,
    predeployGates: [
      'Canvas keeps visible CAD readiness inside the floorplan view.',
      'No shielding formula, material constant or regulatory target changed in F171.',
      'F170 canonical citation coverage is expected before final release candidate.',
      'Advanced geometry rewrites remain post-release unless smoke tests fail.',
    ],
    nextActions: [
      'After deploy target is available, rerun F154-F158 against the final URL.',
      'Post-release: add dense editable isocontours and cursor snap glyphs.',
      'Post-release: expand manufacturer SVG/PNG equipment catalog with clearance checks.',
    ],
    decision:
      'F171 closes a low-risk predeploy polish pass: canvas readiness is visible and auditable while deeper CAD engine work remains controlled backlog.',
  };
}
