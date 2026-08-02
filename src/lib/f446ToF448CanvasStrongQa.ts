import type { F442ToF445RendererV2Runtime } from '@/lib/f442ToF445RendererV2Runtime';

export type F446CanvasSurfaceStatus = 'ready' | 'review' | 'blocked';

export interface F446CanvasSurfaceCheck {
  id: string;
  phase: 'F446';
  label: string;
  surface: string;
  status: F446CanvasSurfaceStatus;
  evidence: string;
}

export interface F447CanvasInteractionCheck {
  id: string;
  phase: 'F447';
  label: string;
  action: string;
  expected: string;
  status: F446CanvasSurfaceStatus;
}

export interface F448CanvasRegressionGate {
  id: string;
  phase: 'F448';
  label: string;
  pass: boolean;
  blockingRule: string;
  rollback: string;
}

export interface F446ToF448CanvasStrongQa {
  schema: 'radshield-mx.f446-f448.canvas-strong-qa.v1';
  phaseRange: 'F446-F448';
  status: 'canvas-strong-qa-ready' | 'canvas-strong-qa-review' | 'canvas-strong-qa-blocked';
  surfaceChecks: F446CanvasSurfaceCheck[];
  interactionChecks: F447CanvasInteractionCheck[];
  regressionGates: F448CanvasRegressionGate[];
  e2eSpec: 'e2e/f446-f448-canvas-strong-qa.spec.ts';
  releaseDecision: string;
}

function statusFromBoolean(value: boolean): F446CanvasSurfaceStatus {
  return value ? 'ready' : 'blocked';
}

export function buildF446ToF448CanvasStrongQa(args: {
  sidebarVisible: boolean;
  canvasVisible: boolean;
  commandDockVisible: boolean;
  contextMenuAvailable: boolean;
  dialogControlsAvailable: boolean;
  sourceSelectorControlsAvailable: boolean;
  rendererRuntime: F442ToF445RendererV2Runtime;
  quickCommandCount: number;
  selectedCount: number;
}): F446ToF448CanvasStrongQa {
  const {
    sidebarVisible,
    canvasVisible,
    commandDockVisible,
    contextMenuAvailable,
    dialogControlsAvailable,
    sourceSelectorControlsAvailable,
    rendererRuntime,
    quickCommandCount,
    selectedCount,
  } = args;

  const overlayNonBlocking = rendererRuntime.status !== 'renderer-v2-runtime-blocked' && !rendererRuntime.eventControllerTouched;
  const surfaceChecks: F446CanvasSurfaceCheck[] = [
    {
      id: 'f446-sidebar-stable',
      phase: 'F446',
      label: 'Sidebar estable',
      surface: 'f186-sidebar-stable-width',
      status: statusFromBoolean(sidebarVisible),
      evidence: 'La sidebar debe conservar ancho visible y no tapar el canvas.',
    },
    {
      id: 'f446-main-canvas',
      phase: 'F446',
      label: 'Canvas principal',
      surface: 'f100-main-floorplan-canvas',
      status: statusFromBoolean(canvasVisible),
      evidence: 'El canvas base debe estar montado antes y despues de overlays.',
    },
    {
      id: 'f446-command-dock',
      phase: 'F446',
      label: 'Dock CAD',
      surface: 'f374-canvas-command-dock',
      status: statusFromBoolean(commandDockVisible && quickCommandCount >= 7),
      evidence: `${quickCommandCount} comandos CAD registrados.`,
    },
    {
      id: 'f446-renderer-overlay',
      phase: 'F446',
      label: 'Overlay renderer v2',
      surface: 'f442-f445-renderer-v2-overlay-canvas',
      status: statusFromBoolean(overlayNonBlocking),
      evidence: `${rendererRuntime.instructions.length} instrucciones; event controller touched=${rendererRuntime.eventControllerTouched}.`,
    },
  ];

  const interactionChecks: F447CanvasInteractionCheck[] = [
    {
      id: 'f447-right-click',
      phase: 'F447',
      label: 'Boton derecho',
      action: 'contextmenu sobre canvas',
      expected: 'Abre canvas-context-menu y permite seleccionar acciones.',
      status: statusFromBoolean(contextMenuAvailable),
    },
    {
      id: 'f447-quick-actions',
      phase: 'F447',
      label: 'Accesos rapidos',
      action: 'click Plano/Muro/Fuente/Zona/Calc/3D/Evid',
      expected: 'Cada boton actualiza tool/status o abre superficie conectada.',
      status: statusFromBoolean(commandDockVisible && quickCommandCount >= 7),
    },
    {
      id: 'f447-window-controls',
      phase: 'F447',
      label: 'Ventanas controlables',
      action: 'minimizar/expandir/cerrar DialogShell y SourceSelector',
      expected: 'Las ventanas no bloquean el canvas cuando minimizan o cierran.',
      status: statusFromBoolean(dialogControlsAvailable && sourceSelectorControlsAvailable),
    },
    {
      id: 'f447-selection-safety',
      phase: 'F447',
      label: 'Seleccion segura',
      action: 'mantener seleccion legacy',
      expected: 'Renderer v2 no toma eventos; seleccion sigue en useCanvas.',
      status: overlayNonBlocking ? (selectedCount > 0 ? 'ready' : 'review') : 'blocked',
    },
  ];

  const regressionGates: F448CanvasRegressionGate[] = [
    {
      id: 'f448-canvas-visible-after-actions',
      phase: 'F448',
      label: 'Canvas visible despues de acciones',
      pass: canvasVisible && commandDockVisible,
      blockingRule: 'Si desaparece canvas o dock, no se permite release beta.',
      rollback: 'Apagar overlays auxiliares y regresar a modo CAD Limpio.',
    },
    {
      id: 'f448-overlay-pointer-events-none',
      phase: 'F448',
      label: 'Overlay no intercepta eventos',
      pass: overlayNonBlocking,
      blockingRule: 'Si overlay roba eventos, apagar F442-F445.',
      rollback: 'Ocultar f442-f445-renderer-v2-overlay-canvas y mantener useCanvas.',
    },
    {
      id: 'f448-windows-close-minimize',
      phase: 'F448',
      label: 'Ventanas cierran/minimizan',
      pass: dialogControlsAvailable && sourceSelectorControlsAvailable,
      blockingRule: 'Ventana sin cerrar/minimizar no puede bloquear canvas en beta.',
      rollback: 'Forzar DialogShell/SidePanelShell o retirar acceso directo.',
    },
    {
      id: 'f448-e2e-required',
      phase: 'F448',
      label: 'E2E dedicado requerido',
      pass: true,
      blockingRule: 'Debe correr e2e/f446-f448-canvas-strong-qa.spec.ts antes de deploy.',
      rollback: 'No publicar dist si el E2E falla.',
    },
  ];

  const hasBlock = [...surfaceChecks, ...interactionChecks].some((check) => check.status === 'blocked') ||
    regressionGates.some((gate) => !gate.pass);
  const hasReview = [...surfaceChecks, ...interactionChecks].some((check) => check.status === 'review');
  const status = hasBlock ? 'canvas-strong-qa-blocked' : hasReview ? 'canvas-strong-qa-review' : 'canvas-strong-qa-ready';

  return {
    schema: 'radshield-mx.f446-f448.canvas-strong-qa.v1',
    phaseRange: 'F446-F448',
    status,
    surfaceChecks,
    interactionChecks,
    regressionGates,
    e2eSpec: 'e2e/f446-f448-canvas-strong-qa.spec.ts',
    releaseDecision: status === 'canvas-strong-qa-ready'
      ? 'Canvas listo para repetir smoke de release beta con renderer overlay no bloqueante.'
      : status === 'canvas-strong-qa-review'
        ? 'Canvas operativo con puntos de revision; no activar renderer/eventos mas profundos todavia.'
        : 'Canvas bloqueado para release hasta resolver superficies o interacciones criticas.',
  };
}
