import type { FloorPlan } from '@/types/radshield';
import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import { buildF122CanvasStructuralOverlay } from '@/lib/f122CanvasStructuralOverlay';
import { buildF99CanvasCadReadiness } from '@/lib/f99CanvasCadReadiness';

export interface F141ProfessionalCanvasInput {
  floorPlan?: FloorPlan;
  selectedId?: string | null;
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
  heatmapPointCount?: number;
  snapToGrid?: boolean;
}

export interface F141ProfessionalCanvasCapability {
  id: string;
  label: string;
  status: 'ready' | 'partial' | 'pending';
  detail: string;
}

export interface F141ProfessionalCanvasSummary {
  phase: 'F141';
  status: 'implemented-professional-canvas-polish';
  score: number;
  cadEditing: F141ProfessionalCanvasCapability[];
  materialPanel: F141ProfessionalCanvasCapability[];
  structuralOverlay: F141ProfessionalCanvasCapability[];
  quickAccess: F141ProfessionalCanvasCapability[];
  ocrAndDocuments: {
    materialOcrPending: number;
    partialSearchableWarnings: string[];
    remainingDocumentBlockers: string[];
  };
  nextImprovements: string[];
  decision: string;
}

function pct(ready: number, total: number) {
  return total > 0 ? Math.round((ready / total) * 100) : 0;
}

function statusReady(value: boolean): F141ProfessionalCanvasCapability['status'] {
  return value ? 'ready' : 'partial';
}

export function buildF141ProfessionalCanvasSummary(input: F141ProfessionalCanvasInput = {}): F141ProfessionalCanvasSummary {
  const floorPlan = input.floorPlan;
  const barrierCount = floorPlan?.barriers?.length ?? 0;
  const sourceCount = floorPlan?.sources?.length ?? 0;
  const selectedId = input.selectedId ?? null;
  const barrierResults = input.barrierResults ?? [];
  const sampleLines = input.sampleLines ?? [];
  const heatmapPointCount = input.heatmapPointCount ?? 0;
  const cad = buildF99CanvasCadReadiness({
    floorPlan,
    selectedId,
    barrierResults,
    sampleLines,
    heatmapPointCount,
    snapToGrid: Boolean(input.snapToGrid),
  });
  const structural = buildF122CanvasStructuralOverlay(floorPlan);

  const cadEditing: F141ProfessionalCanvasCapability[] = [
    {
      id: 'selection-grips',
      label: 'Seleccion/grips',
      status: selectedId ? 'ready' : barrierCount > 0 ? 'partial' : 'pending',
      detail: selectedId ? 'Objeto seleccionado listo para edicion contextual.' : 'Seleccion multiple/lasso sigue como mejora posterior.',
    },
    {
      id: 'dimensions',
      label: 'Cotas',
      status: sampleLines.length > 0 ? 'ready' : 'partial',
      detail: sampleLines.length > 0 ? `${sampleLines.length} lineas/puntos de muestra disponibles.` : 'Faltan cotas persistentes editables/exportables.',
    },
    {
      id: 'snapping',
      label: 'Snapping',
      status: input.snapToGrid ? 'ready' : 'partial',
      detail: input.snapToGrid ? 'Snap a grid activo.' : 'Falta snapping avanzado endpoint/midpoint/perpendicular/interseccion.',
    },
    {
      id: 'cad-score',
      label: 'CAD score',
      status: cad.score >= 70 ? 'ready' : cad.score >= 45 ? 'partial' : 'pending',
      detail: `F99 CAD-like readiness ${cad.score}%.`,
    },
  ];

  const materialPanel: F141ProfessionalCanvasCapability[] = [
    {
      id: 'material-toolbox',
      label: 'Toolbox materiales',
      status: 'ready',
      detail: 'MaterialComparison es el entry point canonico para costo/tiempo/estructura.',
    },
    {
      id: 'material-evidence',
      label: 'Evidencia RAG',
      status: 'ready',
      detail: 'F138/F139/F141 dejaron 111 chunks de materiales con page_ref/hash.',
    },
    {
      id: 'partial-ocr',
      label: 'OCR parcial',
      status: 'partial',
      detail: 'CARACTERIZACION p.24 y ScanPRO p.2/p.10 siguen sin texto extraible.',
    },
  ];

  const structuralOverlay: F141ProfessionalCanvasCapability[] = [
    {
      id: 'overlay',
      label: 'Overlay estructural',
      status: statusReady(structural.overlayReady),
      detail: structural.overlayReady ? `${structural.barrierCount} barreras, ${structural.totalMassKg} kg total.` : 'Dibujar o importar barreras para activar kg/m2 y riesgo.',
    },
    {
      id: 'review-flags',
      label: 'Revision estructural',
      status: structural.reviewRequiredCount > 0 ? 'partial' : 'ready',
      detail: `${structural.reviewRequiredCount} barreras requieren revision; ${structural.datasheetRequiredCount} requieren ficha.`,
    },
  ];

  const quickAccess: F141ProfessionalCanvasCapability[] = [
    {
      id: 'mini-cad',
      label: 'Mini CAD',
      status: 'ready',
      detail: 'Sidebar Mini CAD existe con seleccion, cotas, capas, snap, muro, equipo, zona y 3D.',
    },
    {
      id: 'workflow-strip',
      label: 'Flujo superior',
      status: sourceCount > 0 || barrierCount > 0 ? 'ready' : 'partial',
      detail: 'Layout -> Smart room -> Zona -> Calculo -> Memoria visible en canvas.',
    },
  ];

  const all = [...cadEditing, ...materialPanel, ...structuralOverlay, ...quickAccess];
  const readyScore = pct(
    all.reduce((sum, item) => sum + (item.status === 'ready' ? 1 : item.status === 'partial' ? 0.5 : 0), 0),
    all.length,
  );

  return {
    phase: 'F141',
    status: 'implemented-professional-canvas-polish',
    score: readyScore,
    cadEditing,
    materialPanel,
    structuralOverlay,
    quickAccess,
    ocrAndDocuments: {
      materialOcrPending: 0,
      partialSearchableWarnings: [
        'CARACTERIZACION DE BLOQUES HD: page 24 has no extracted text.',
        'ScanPRO: pages 2 and 10 have no extracted text.',
      ],
      remainingDocumentBlockers: [
        'Historical F75 blockers may still require OCR if needed for release docs: NCRP 49 and Memoria AL Zumaya.',
      ],
    },
    nextImprovements: [
      'Implement draggable grips and inline numeric editing for selected barriers.',
      'Make dimensions persistent/editable/exportable instead of only QA/sample overlays.',
      'Add advanced snapping modes: endpoint, midpoint, perpendicular, intersection and angle.',
      'Expose material evidence citations directly on selected barrier properties.',
      'Move quick access into compact command chips with favorites and context-sensitive states.',
    ],
    decision:
      'F141 professionalizes the existing CAD-like canvas through explicit readiness, material evidence, structural overlay and quick-access UX, while leaving deeper CAD editing for a later implementation pass.',
  };
}
