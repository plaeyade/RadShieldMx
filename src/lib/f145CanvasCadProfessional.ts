import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';

export type F145CadStatus = 'ready' | 'partial' | 'pending';

export interface F145CadCapability {
  id: string;
  label: string;
  status: F145CadStatus;
  evidence: string;
}

export interface F145CanvasCadProfessionalSummary {
  phase: 'F145';
  status: 'implemented-cad-professional-canvas';
  score: number;
  selectedCount: number;
  capabilities: F145CadCapability[];
  operationHints: string[];
  releaseGates: string[];
  decision: string;
}

export function buildF145CanvasCadProfessionalSummary(input: {
  floorPlan?: FloorPlan;
  selectedId?: string | null;
  selectedIds?: string[];
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
  snapToGrid?: boolean;
}): F145CanvasCadProfessionalSummary {
  const barrierCount = input.floorPlan?.barriers?.length ?? 0;
  const sourceCount = input.floorPlan?.sources?.length ?? 0;
  const selectedCount = input.selectedIds?.length ?? (input.selectedId ? 1 : 0);
  const hasGeometry = barrierCount + sourceCount > 0;
  const hasSelected = selectedCount > 0;
  const hasCalculations = (input.barrierResults?.length ?? 0) > 0;
  const hasDimensions = barrierCount > 0 || (input.sampleLines?.length ?? 0) > 0;

  const capabilities: F145CadCapability[] = [
    {
      id: 'draggable-grips',
      label: 'Grips',
      status: hasSelected ? 'ready' : hasGeometry ? 'partial' : 'pending',
      evidence: 'Barrier endpoint/midpoint grips and equipment move/rotate grips are handled by useCanvas drag states.',
    },
    {
      id: 'editable-dimensions',
      label: 'Cotas editables',
      status: hasDimensions ? 'ready' : 'pending',
      evidence: 'Barrier dimensions are exported as editable CAD JSON entities and selected objects are editable through the sidebar inline inputs.',
    },
    {
      id: 'advanced-snapping',
      label: 'Snap avanzado',
      status: input.snapToGrid ? 'ready' : 'partial',
      evidence: 'Grid, endpoint, midpoint, perpendicular, intersection, equipment-center and angle-15 snapping are available.',
    },
    {
      id: 'multi-lasso-selection',
      label: 'Multi/lasso',
      status: hasGeometry ? 'ready' : 'pending',
      evidence: 'Single select, Shift multi-select, window select and Ctrl/Meta lasso selection are wired.',
    },
    {
      id: 'hover-preselection',
      label: 'Hover',
      status: hasGeometry ? 'ready' : 'pending',
      evidence: 'Canvas tracks hoverId and renders hover styling for barriers/sources.',
    },
    {
      id: 'inline-editing',
      label: 'Edicion inline',
      status: hasSelected ? 'ready' : hasGeometry ? 'partial' : 'pending',
      evidence: 'Sidebar inputs call updateSelected for barrier/source/critical-point names, coordinates, rotations and material-related fields.',
    },
    {
      id: 'fine-undo-redo',
      label: 'Undo/redo fino',
      status: 'ready',
      evidence: 'ShieldingDesigner binds floorPlan to useUndoRedo with 50 snapshots, Ctrl+Z/Ctrl+Y shortcuts and the UndoRedoHistoryPanel.',
    },
    {
      id: 'isocontours',
      label: 'Isocontornos',
      status: hasCalculations ? 'ready' : 'partial',
      evidence: 'CAD export includes isocontour labels and regulatory legend; full editable contour geometry remains a later release gate.',
    },
  ];

  const ready = capabilities.filter((item) => item.status === 'ready').length;
  const partial = capabilities.filter((item) => item.status === 'partial').length;
  const score = Math.round(((ready + partial * 0.5) / capabilities.length) * 100);

  return {
    phase: 'F145',
    status: 'implemented-cad-professional-canvas',
    score,
    selectedCount,
    capabilities,
    operationHints: [
      'Drag selected barrier endpoint/midpoint grips to edit geometry.',
      'Use Shift-click for multi-select.',
      'Drag empty canvas for window selection.',
      'Use Ctrl/Meta + drag on empty canvas for lasso selection.',
      'Use sidebar inputs for inline numeric/name edits.',
      'Export PNG also writes CAD JSON with dimensions, equipment symbols, isocontours and snap modes.',
    ],
    releaseGates: [
      'Add human-readable transaction labels for drag/edit undo history.',
      'Add independent dimension objects with style/edit handles.',
      'Add visible snap glyph at cursor for endpoint/midpoint/intersection/perpendicular.',
      'Convert exported isocontour labels into editable contour polylines.',
    ],
    decision:
      'F145 upgrades the existing canvas into a CAD-like operational layer while keeping release-critical formula and report logic unchanged.',
  };
}
