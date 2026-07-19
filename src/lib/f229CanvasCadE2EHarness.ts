export interface F229CanvasCadE2EHarnessInput {
  barrierCount: number;
  sourceCount: number;
  regionCount: number;
  selectedCount: number;
  snapToGrid: boolean;
  visualMode: string;
  hasExport: boolean;
  hasFloorPlanScale: boolean;
}

export type F229HarnessCoverageStatus = 'ready' | 'partial' | 'guarded';

export interface F229HarnessCoverageRow {
  id: string;
  label: string;
  status: F229HarnessCoverageStatus;
  evidence: string;
}

export interface F229CanvasCadE2EHarness {
  schema: 'radshield-mx.f229.canvas-cad-e2e-harness.v1';
  phase: 'F229';
  status: 'canvas-cad-e2e-harness-ready' | 'canvas-cad-e2e-harness-partial';
  readyCount: number;
  coverage: F229HarnessCoverageRow[];
  nextCoverage: string[];
}

export function buildF229CanvasCadE2EHarness(input: F229CanvasCadE2EHarnessInput): F229CanvasCadE2EHarness {
  const hasGeometry = input.barrierCount + input.sourceCount + input.regionCount > 0;
  const coverage: F229HarnessCoverageRow[] = [
    {
      id: 'shell',
      label: 'shell/sidebar',
      status: 'ready',
      evidence: 'Valida canvas principal, sidebar estable y filas F221-F228 antes de interactuar.',
    },
    {
      id: 'draw-barrier',
      label: 'dibujar muro',
      status: hasGeometry ? 'ready' : 'partial',
      evidence: 'Ejercita herramienta Muro con drag real sobre canvas y verifica incremento de geometria.',
    },
    {
      id: 'select-inline',
      label: 'seleccion',
      status: input.selectedCount > 0 ? 'ready' : 'partial',
      evidence: 'Cubre herramienta Seleccionar, inspector contextual y editor inline sin mover paneles base.',
    },
    {
      id: 'snap-lasso',
      label: 'snap/lasso',
      status: input.snapToGrid ? 'ready' : 'partial',
      evidence: 'Ejercita ventana/lasso con modificadores y conserva snapping visible para endpoint/midpoint/perpendicular/interseccion.',
    },
    {
      id: 'visual-modes',
      label: 'modos',
      status: ['plan', 'heat', 'isocontours', 'structure'].includes(input.visualMode) ? 'ready' : 'partial',
      evidence: 'Recorre Plano, Heat, Iso y Estructura con canvas/sidebar visibles despues de cada cambio.',
    },
    {
      id: 'export-png',
      label: 'export',
      status: input.hasExport ? 'ready' : 'guarded',
      evidence: 'Valida superficie de exportacion F217 para snapshots de Memoria IA, PDF y Evidence Pack.',
    },
    {
      id: 'scale',
      label: 'escala',
      status: input.hasFloorPlanScale ? 'ready' : 'partial',
      evidence: 'Confirma que el HUD de escala F228 sigue alimentado por calibracion del plano.',
    },
  ];

  const readyCount = coverage.filter((row) => row.status === 'ready').length;

  return {
    schema: 'radshield-mx.f229.canvas-cad-e2e-harness.v1',
    phase: 'F229',
    status: readyCount >= 5 && input.hasExport ? 'canvas-cad-e2e-harness-ready' : 'canvas-cad-e2e-harness-partial',
    readyCount,
    coverage,
    nextCoverage: [
      'Agregar baseline visual con pixel-diff por viewport despues de estabilizar el renderer.',
      'Asertar coordenadas exactas de grip drag cuando el event controller v2 quede detras de feature flag.',
      'Incluir fixture DXF dedicado en F230 para cubrir importacion real dentro del arnes CAD.',
      'Conectar el arnes al release gate publico F154-F158 cuando exista URL final estable.',
    ],
  };
}
