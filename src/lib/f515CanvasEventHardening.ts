import {
  getCanvasEventControllerV2Status,
  routeCanvasEventV2,
  type CanvasEventActionV2,
  type CanvasPointerEventV2,
} from '@/lib/canvas/eventControllerV2';

export interface F515CanvasEventScenario {
  id: string;
  event: CanvasPointerEventV2;
  expectedAction: CanvasEventActionV2['action'];
  stableFallbackRequired: boolean;
  e2eName: string;
}

export interface F515CanvasEventScenarioResult {
  id: string;
  expectedAction: CanvasEventActionV2['action'];
  routedAction: CanvasEventActionV2['action'];
  status: 'pass' | 'review';
  reason: string;
  e2eName: string;
}

export interface F515CanvasEventHardeningContract {
  schema: 'radshield-mx.canvas.event-hardening.f515.v1';
  phase: 'F515';
  status: 'ready-for-low-risk-migration' | 'review';
  controller: ReturnType<typeof getCanvasEventControllerV2Status>;
  connectionMatrix: {
    surface: string;
    stablePath: string;
    v2Path: string;
    mutationPolicy: string;
  }[];
  scenarios: F515CanvasEventScenarioResult[];
  requiredNextE2E: string[];
  rollback: string[];
}

export const F515_CANVAS_EVENT_SCENARIOS: F515CanvasEventScenario[] = [
  {
    id: 'f515-disabled-default-stable-route',
    event: { type: 'pointerdown', mode: 'drag', x: 10, y: 10 },
    expectedAction: 'route-to-stable-useCanvas',
    stableFallbackRequired: true,
    e2eName: 'canvas event v2 disabled keeps stable useCanvas route',
  },
  {
    id: 'f515-non-finite-pointer-ignored',
    event: { type: 'pointermove', mode: 'drag', x: Number.NaN, y: 20 },
    expectedAction: 'ignore',
    stableFallbackRequired: false,
    e2eName: 'non finite pointer input is ignored',
  },
  {
    id: 'f515-wheel-routes-to-zoom',
    event: { type: 'wheel', mode: 'zoom', x: 50, y: 60 },
    expectedAction: 'zoom-view',
    stableFallbackRequired: false,
    e2eName: 'wheel zoom does not move panels',
  },
  {
    id: 'f516c-context-tool-routes-to-harness',
    event: { type: 'pointerdown', mode: 'tool', x: 120, y: 160 },
    expectedAction: 'activate-tool',
    stableFallbackRequired: false,
    e2eName: 'context menu tool action activates stable tool through harness',
  },
  {
    id: 'f515-lasso-start-update-finish',
    event: { type: 'pointerdown', mode: 'lasso', x: 20, y: 30 },
    expectedAction: 'start-selection',
    stableFallbackRequired: false,
    e2eName: 'lasso selection starts without geometry mutation',
  },
  {
    id: 'f515-snap-preview-only',
    event: { type: 'pointermove', mode: 'snap', x: 100, y: 100 },
    expectedAction: 'snap-preview',
    stableFallbackRequired: false,
    e2eName: 'snap preview appears and clears',
  },
  {
    id: 'f515-delete-key-routes-selection-delete',
    event: { type: 'keydown', mode: 'delete', x: 0, y: 0, key: 'Delete' },
    expectedAction: 'delete-selection',
    stableFallbackRequired: false,
    e2eName: 'delete requires selected object',
  },
  {
    id: 'f515-undo-key-routes-last-action',
    event: { type: 'keydown', mode: 'undo', x: 0, y: 0, key: 'z', ctrlKey: true },
    expectedAction: 'undo-last',
    stableFallbackRequired: false,
    e2eName: 'undo restores previous floorplan hash',
  },
];

function scenarioResult(scenario: F515CanvasEventScenario, forceEnabled: boolean): F515CanvasEventScenarioResult {
  const routed = routeCanvasEventV2WithGate(scenario.event, forceEnabled);
  return {
    id: scenario.id,
    expectedAction: scenario.expectedAction,
    routedAction: routed.action,
    status: routed.action === scenario.expectedAction ? 'pass' : 'review',
    reason: routed.reason,
    e2eName: scenario.e2eName,
  };
}

export function routeCanvasEventV2WithGate(event: CanvasPointerEventV2, forceEnabled: boolean): CanvasEventActionV2 {
  if (!forceEnabled) {
    return {
      action: 'route-to-stable-useCanvas',
      reason: 'F515 harness disabled gate; stable useCanvas remains canonical',
      requiresE2E: false,
    };
  }

  if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) {
    return {
      action: 'ignore',
      reason: 'non-finite pointer coordinates are ignored',
      requiresE2E: true,
    };
  }

  if (event.type === 'keydown' && event.key === 'Delete') {
    return { action: 'delete-selection', reason: 'delete key with selected object', requiresE2E: true };
  }
  if (event.type === 'keydown' && (event.ctrlKey || event.metaKey) && event.key?.toLowerCase() === 'z') {
    return { action: 'undo-last', reason: 'undo shortcut', requiresE2E: true };
  }
  if (event.type === 'wheel') {
    return { action: 'zoom-view', reason: 'wheel routed to zoom', requiresE2E: true };
  }
  if (event.mode === 'tool' && event.type === 'pointerdown') {
    return { action: 'activate-tool', reason: 'canvas UI tool command routed through event harness', requiresE2E: true };
  }
  if (event.mode === 'pan') {
    return { action: 'pan-view', reason: 'pan mode pointer route', requiresE2E: true };
  }
  if (event.mode === 'snap' && event.type === 'pointermove') {
    return { action: 'snap-preview', reason: 'snap preview only; mutation stays in stable path until E2E passes', requiresE2E: true };
  }
  if (event.mode === 'lasso') {
    if (event.type === 'pointerdown') return { action: 'start-selection', reason: 'lasso start', requiresE2E: true };
    if (event.type === 'pointermove') return { action: 'update-selection', reason: 'lasso update', requiresE2E: true };
    if (event.type === 'pointerup') return { action: 'finish-selection', reason: 'lasso finish', requiresE2E: true };
  }
  if (event.mode === 'drag') {
    if (event.type === 'pointerdown') return { action: 'start-drag', reason: 'drag start', requiresE2E: true };
    if (event.type === 'pointermove') return { action: 'update-drag', reason: 'drag update', requiresE2E: true };
    if (event.type === 'pointerup') return { action: 'finish-drag', reason: 'drag finish', requiresE2E: true };
  }

  return routeCanvasEventV2(event);
}

export function buildF515CanvasEventHardening(): F515CanvasEventHardeningContract {
  const scenarios = F515_CANVAS_EVENT_SCENARIOS.map((scenario) =>
    scenarioResult(scenario, scenario.stableFallbackRequired ? false : true),
  );
  const reviewCount = scenarios.filter((item) => item.status === 'review').length;

  return {
    schema: 'radshield-mx.canvas.event-hardening.f515.v1',
    phase: 'F515',
    status: reviewCount === 0 ? 'ready-for-low-risk-migration' : 'review',
    controller: getCanvasEventControllerV2Status(),
    connectionMatrix: [
      {
        surface: 'CanvasArea pointer handlers',
        stablePath: 'src/hooks/useCanvas.ts',
        v2Path: 'src/lib/canvas/eventControllerV2.ts',
        mutationPolicy: 'No persistent geometry mutation until action-specific E2E passes.',
      },
      {
        surface: 'CanvasRenderer draw pass',
        stablePath: 'src/lib/canvas/CanvasRenderer.ts',
        v2Path: 'src/lib/f442ToF445RendererV2Runtime.ts',
        mutationPolicy: 'Renderer may draw overlays; state writes remain in stable stores.',
      },
      {
        surface: 'Sidebar/menu/panel shell',
        stablePath: 'src/sections/CanvasArea.tsx',
        v2Path: 'e2e/f446-f448-canvas-strong-qa.spec.ts',
        mutationPolicy: 'Event changes must not obscure canvas, shift sidebar, or detach quick actions.',
      },
    ],
    scenarios,
    requiredNextE2E: [
      'canvas nonblank after app load',
      'right-click/context surface does not block pointer capture',
      'right-click/context tool command routes through F516c harness and keeps stable tool activation',
      'quick actions still dispatch their dialog/store action',
      'drag preview does not commit geometry before pointerup',
      'lasso selection has escape/cancel behavior',
      'undo/redo checks floorplan hash before and after mutation',
    ],
    rollback: [
      'Disable VITE_CANVAS_EVENT_CONTROLLER_V2.',
      'Disable VITE_CANVAS_HIGH_RISK_CAD if the issue persists.',
      'Clear localStorage.radshield_feature_flags in affected browsers.',
      'Return to stable useCanvas path; do not revert DB or calculation assets.',
    ],
  };
}

export function formatF515CanvasEventHardeningMarkdown(contract = buildF515CanvasEventHardening()): string {
  return [
    '# F515 CANVAS EVENT HARDENING',
    '',
    `Estado: ${contract.status}`,
    `Controller enabled: ${contract.controller.enabled}`,
    '',
    '## Escenarios',
    ...contract.scenarios.map((item) => `- ${item.id}: ${item.routedAction} (${item.status})`),
    '',
    '## Siguiente E2E',
    ...contract.requiredNextE2E.map((item) => `- ${item}`),
    '',
    '## Rollback',
    ...contract.rollback.map((item) => `- ${item}`),
    '',
  ].join('\n');
}
