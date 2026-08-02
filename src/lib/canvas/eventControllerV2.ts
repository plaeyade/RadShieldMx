import { isEnabled } from '@/lib/featureFlags';

export type CanvasEventModeV2 =
  | 'select'
  | 'drag'
  | 'snap'
  | 'lasso'
  | 'pan'
  | 'zoom'
  | 'tool'
  | 'delete'
  | 'undo';

export interface CanvasPointerEventV2 {
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'wheel' | 'keydown';
  mode: CanvasEventModeV2;
  x: number;
  y: number;
  pointerId?: number;
  key?: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export interface CanvasEventActionV2 {
  action:
    | 'route-to-stable-useCanvas'
    | 'start-selection'
    | 'update-selection'
    | 'finish-selection'
    | 'start-drag'
    | 'update-drag'
    | 'finish-drag'
    | 'snap-preview'
    | 'pan-view'
    | 'zoom-view'
    | 'activate-tool'
    | 'delete-selection'
    | 'undo-last'
    | 'ignore';
  reason: string;
  requiresE2E: boolean;
}

export interface CanvasEventControllerV2Status {
  enabled: boolean;
  gatedBy: ['VITE_CANVAS_HIGH_RISK_CAD', 'VITE_CANVAS_EVENT_CONTROLLER_V2'];
  safeDefault: 'route-to-stable-useCanvas';
  coveredModes: CanvasEventModeV2[];
  requiredE2E: string[];
  rollback: string;
}

export function getCanvasEventControllerV2Status(): CanvasEventControllerV2Status {
  return {
    enabled: isEnabled('canvasEventControllerV2'),
    gatedBy: ['VITE_CANVAS_HIGH_RISK_CAD', 'VITE_CANVAS_EVENT_CONTROLLER_V2'],
    safeDefault: 'route-to-stable-useCanvas',
    coveredModes: ['select', 'drag', 'snap', 'lasso', 'pan', 'zoom', 'tool', 'delete', 'undo'],
    requiredE2E: [
      'canvas remains nonblank',
      'wall drag preserves geometry',
      'snap preview appears and clears',
      'lasso selects expected objects',
      'pan/zoom do not shift layout panels',
      'delete requires selected object',
      'undo restores previous floorplan hash',
    ],
    rollback:
      'Disable VITE_CANVAS_EVENT_CONTROLLER_V2 first; if staging still fails, disable VITE_CANVAS_HIGH_RISK_CAD and clear localStorage.radshield_feature_flags.',
  };
}

export function routeCanvasEventV2(event: CanvasPointerEventV2): CanvasEventActionV2 {
  if (!isEnabled('canvasEventControllerV2')) {
    return {
      action: 'route-to-stable-useCanvas',
      reason: 'event controller v2 flag is disabled; stable useCanvas remains canonical',
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

  return {
    action: 'route-to-stable-useCanvas',
    reason: 'mode is not yet migrated; stable useCanvas handles it',
    requiresE2E: false,
  };
}
