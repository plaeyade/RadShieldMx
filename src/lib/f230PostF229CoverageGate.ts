export interface F230GateInput {
  f198Menus: boolean;
  f207Functional: boolean;
  f229CanvasE2E: boolean;
  f200StaticRelease: boolean;
  canvasVisible: boolean;
  sidebarVisible: boolean;
  updateCenterCurrent: boolean;
}

export interface F230GateRow {
  id: string;
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F230PostF229CoverageGate {
  schema: 'radshield-mx.f230.post-f229-coverage-gate.v1';
  phase: 'F230';
  status: 'post-f229-coverage-ready' | 'post-f229-coverage-gated';
  passCount: number;
  gates: F230GateRow[];
  rendererEventDecision: string;
  nextSafePhases: string[];
}

export function buildF230PostF229CoverageGate(input: F230GateInput): F230PostF229CoverageGate {
  const gates: F230GateRow[] = [
    {
      id: 'f198-menus',
      label: 'menus',
      pass: input.f198Menus,
      evidence: 'F198 smoke valida cada dropdown canonico y sus funciones sin ocultar sidebar/canvas.',
    },
    {
      id: 'f207-functional',
      label: 'funcional',
      pass: input.f207Functional,
      evidence: 'F207 smoke valida Archivo, DXF, canvas, Memoria IA, PDF y Evidence Pack.',
    },
    {
      id: 'f229-canvas-e2e',
      label: 'canvas e2e',
      pass: input.f229CanvasE2E,
      evidence: 'F229 Playwright dedicado cubre dibujo, seleccion, lasso, modos visuales y F217.',
    },
    {
      id: 'f200-static',
      label: 'release',
      pass: input.f200StaticRelease,
      evidence: 'F200 confirma dist, hosting estatico, salidas y paquete de release frontend.',
    },
    {
      id: 'shell-visible',
      label: 'shell',
      pass: input.canvasVisible && input.sidebarVisible,
      evidence: 'Canvas y sidebar siguen visibles antes de considerar cambios de renderer/eventos.',
    },
    {
      id: 'docs-update',
      label: 'docs',
      pass: input.updateCenterCurrent,
      evidence: 'Update Center, manuales, changelog y manual HTML documentan la fase vigente.',
    },
  ];

  const passCount = gates.filter((gate) => gate.pass).length;
  const status = passCount === gates.length ? 'post-f229-coverage-ready' : 'post-f229-coverage-gated';

  return {
    schema: 'radshield-mx.f230.post-f229-coverage-gate.v1',
    phase: 'F230',
    status,
    passCount,
    gates,
    rendererEventDecision:
      status === 'post-f229-coverage-ready'
        ? 'Se puede iniciar F231/F232: cambios pequenos de renderer helpers y event controller v2 solo detras de feature flag, con rollback a useCanvas.'
        : 'No modificar renderer base ni logica de eventos. Primero cerrar F198/F207/F229/F200 y documentacion actualizada.',
    nextSafePhases: [
      'F231: baseline visual pixel-diff desktop/mobile del canvas.',
      'F232: fixture DXF dedicado dentro del arnes E2E CAD.',
      'F233: grip drag/snap por coordenadas con event controller v2 detras de flag.',
      'F234: isocontornos numericos con etiquetas regulatorias y export.',
      'F235: sincronizacion 2D/3D de equipos, espesores, zonas y snapshots.',
    ],
  };
}
