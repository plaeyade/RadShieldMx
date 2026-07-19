export interface F216SavedCanvasView {
  id: 'A' | 'B' | 'C';
  label: string;
  visualMode: 'plan' | 'heat' | 'isocontours' | 'structure';
  scale: number;
  offsetX: number;
  offsetY: number;
  savedAt: string;
}

export interface F216MiniViewManagerInput {
  visualMode: 'plan' | 'heat' | 'isocontours' | 'structure';
  scale: number;
  offsetX: number;
  offsetY: number;
  savedViews: F216SavedCanvasView[];
}

export interface F216MiniViewManagerSummary {
  schema: 'radshield-mx.mini-view-manager.f216.v1';
  phase: 'F216';
  status: 'mini-view-manager-ready' | 'mini-view-manager-review';
  activeViewLabel: string;
  zoomPercent: number;
  panLabel: string;
  savedViewCount: number;
  maxSavedViews: number;
  warnings: string[];
}

export function buildF216MiniViewManager(input: F216MiniViewManagerInput): F216MiniViewManagerSummary {
  const warnings: string[] = [];
  if (!Number.isFinite(input.scale) || input.scale <= 0) warnings.push('Zoom no valido; usa Extents para recuperar la vista.');
  if (!Number.isFinite(input.offsetX) || !Number.isFinite(input.offsetY)) warnings.push('Pan no valido; restaura una vista guardada.');

  const zoomPercent = Number.isFinite(input.scale) ? Math.round(input.scale * 100) : 0;
  const panLabel = `${Math.round(input.offsetX || 0)},${Math.round(input.offsetY || 0)}`;
  const matchingView = input.savedViews.find((view) =>
    view.visualMode === input.visualMode &&
    Math.abs(view.scale - input.scale) < 0.01 &&
    Math.abs(view.offsetX - input.offsetX) < 2 &&
    Math.abs(view.offsetY - input.offsetY) < 2
  );

  return {
    schema: 'radshield-mx.mini-view-manager.f216.v1',
    phase: 'F216',
    status: warnings.length ? 'mini-view-manager-review' : 'mini-view-manager-ready',
    activeViewLabel: matchingView?.label ?? input.visualMode,
    zoomPercent,
    panLabel,
    savedViewCount: input.savedViews.length,
    maxSavedViews: 3,
    warnings,
  };
}
