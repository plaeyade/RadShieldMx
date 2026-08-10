import type { CanvasEventControllerV2Status, CanvasEventModeV2 } from '@/lib/canvas/eventControllerV2';
import type { F515CanvasEventHardeningContract } from '@/lib/f515CanvasEventHardening';
import type { F442ToF445RendererV2Runtime } from '@/lib/f442ToF445RendererV2Runtime';
import type { F556F560PostBetaDeepStack } from '@/lib/f556F560PostBetaDeepStack';

export type F561F565LaneId =
  | 'event-adapter'
  | 'selection-overlay'
  | 'pointer-routing'
  | 'undo-rollback'
  | 'e2e-harness';

export type F561F565LaneStatus = 'ready' | 'preview' | 'gated';

export interface F561F565Lane {
  id: F561F565LaneId;
  phase: 'F561' | 'F562' | 'F563' | 'F564' | 'F565';
  label: string;
  status: F561F565LaneStatus;
  evidence: string;
  rollback: string;
}

export interface F561F565EventControllerV2Stack {
  schema: 'radshield-mx.f561-f565.renderer-event-controller-v2.v1';
  phaseRange: 'F561-F565';
  status: 'event-controller-v2-preview' | 'event-controller-v2-gated';
  controller: CanvasEventControllerV2Status;
  eventHarness: {
    stableHandlersStillCanonical: true;
    pointerWrappersActive: boolean;
    mutationPolicy: 'observe-route-then-stable-handler';
    coveredModes: CanvasEventModeV2[];
    lastActionTestId: 'f515b-canvas-event-action';
  };
  rendererBridge: {
    runtimeStatus: F442ToF445RendererV2Runtime['status'];
    instructions: number;
    overlayCanReceivePointerEvents: false;
    overlayCanMutateGeometry: false;
  };
  lanes: F561F565Lane[];
  qa: {
    requiredE2E: string[];
    passedScenarioCount: number;
    totalScenarioCount: number;
    screenshotRequired: true;
  };
  rollback: string[];
}

function statusFor(pass: boolean, hasGate: boolean): F561F565LaneStatus {
  if (pass) return 'ready';
  return hasGate ? 'gated' : 'preview';
}

export function buildF561F565RendererEventControllerV2(params: {
  postBeta: F556F560PostBetaDeepStack;
  eventHardening: F515CanvasEventHardeningContract;
  rendererRuntime: F442ToF445RendererV2Runtime;
  pointerWrappersActive: boolean;
}): F561F565EventControllerV2Stack {
  const { postBeta, eventHardening, rendererRuntime, pointerWrappersActive } = params;
  const passedScenarioCount = eventHardening.scenarios.filter((scenario) => scenario.status === 'pass').length;
  const totalScenarioCount = eventHardening.scenarios.length;
  const rendererUsable = rendererRuntime.status !== 'renderer-v2-runtime-blocked';

  const lanes: F561F565Lane[] = [
    {
      id: 'event-adapter',
      phase: 'F561',
      label: 'Adaptador pointer -> evento v2',
      status: statusFor(pointerWrappersActive, false),
      evidence: pointerWrappersActive
        ? 'Mouse down/move/up actualizan lastF515EventAction y despues llaman al handler estable.'
        : 'El harness existe, pero aun no envuelve eventos reales.',
      rollback: 'Restaurar onMouseDown/onMouseMove/onMouseUp directos al handler estable.',
    },
    {
      id: 'selection-overlay',
      phase: 'F562',
      label: 'Overlay de seleccion y lectura',
      status: rendererUsable ? 'preview' : 'gated',
      evidence: `${rendererRuntime.instructions.length} instrucciones F442 disponibles; overlay no captura eventos.`,
      rollback: 'Ocultar canvas f442-f445-renderer-v2-overlay-canvas.',
    },
    {
      id: 'pointer-routing',
      phase: 'F563',
      label: 'Ruteo seguro por modo CAD',
      status: eventHardening.status === 'ready-for-low-risk-migration' ? 'ready' : 'gated',
      evidence: `${passedScenarioCount}/${totalScenarioCount} escenarios F515 pasan; modos ${eventHardening.controller.coveredModes.length}.`,
      rollback: 'Forzar route-to-stable-useCanvas y limpiar banderas de evento v2.',
    },
    {
      id: 'undo-rollback',
      phase: 'F564',
      label: 'Rollback/undo antes de mutar',
      status: 'ready',
      evidence: 'F561-F565 observa y enruta; no escribe geometria persistente ni cambia calculos.',
      rollback: 'Desactivar wrappers; floorplan y stores permanecen intactos.',
    },
    {
      id: 'e2e-harness',
      phase: 'F565',
      label: 'E2E visual de eventos',
      status: postBeta.status === 'post-beta-deep-gated' ? 'preview' : 'ready',
      evidence: 'Debe generar screenshot de canvas, panel F561-F565 y accion real de pointer.',
      rollback: 'Repetir F556-F560 y F229 si el canvas queda en blanco o los menus se mueven.',
    },
  ];

  return {
    schema: 'radshield-mx.f561-f565.renderer-event-controller-v2.v1',
    phaseRange: 'F561-F565',
    status: lanes.some((lane) => lane.status === 'gated') ? 'event-controller-v2-gated' : 'event-controller-v2-preview',
    controller: eventHardening.controller,
    eventHarness: {
      stableHandlersStillCanonical: true,
      pointerWrappersActive,
      mutationPolicy: 'observe-route-then-stable-handler',
      coveredModes: eventHardening.controller.coveredModes,
      lastActionTestId: 'f515b-canvas-event-action',
    },
    rendererBridge: {
      runtimeStatus: rendererRuntime.status,
      instructions: rendererRuntime.instructions.length,
      overlayCanReceivePointerEvents: false,
      overlayCanMutateGeometry: false,
    },
    lanes,
    qa: {
      requiredE2E: [
        'canvas visible and nonblank after pointer wrappers',
        'right click menu still opens and stays aligned',
        'quick dock commands still dispatch stable callbacks',
        'pointerdown updates f515b-canvas-event-action',
        'renderer overlay remains pointer-events none',
      ],
      passedScenarioCount,
      totalScenarioCount,
      screenshotRequired: true,
    },
    rollback: [
      'Use stable CanvasArea handlers directly.',
      'Disable canvasEventControllerV2 and canvasHighRiskCad feature flags.',
      'Hide renderer v2 overlay without changing calculation or DB state.',
      'Return to F556-F560 post-beta gated panel if E2E visual fails.',
    ],
  };
}
