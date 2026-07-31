export interface F406CanvasToolContract {
  id: string;
  label: string;
  testId: string;
  expectedAction: string;
  requiredForRelease: boolean;
}

export interface F406CanvasToolQa {
  schema: 'radshield-mx.f406.canvas-tool-qa.v1';
  phase: 'F406';
  status: 'canvas-tool-qa-ready' | 'canvas-tool-qa-review';
  requiredCount: number;
  optionalCount: number;
  toolContracts: F406CanvasToolContract[];
  evidenceSelectors: string[];
  releaseGates: string[];
  warnings: string[];
}

export const F406_CANVAS_TOOL_CONTRACTS: F406CanvasToolContract[] = [
  { id: 'select', label: 'Seleccionar', testId: 'f191-tool-select', expectedAction: 'activateCanvasTool(select)', requiredForRelease: true },
  { id: 'barrier', label: 'Muro', testId: 'f191-tool-barrier', expectedAction: 'activateCanvasTool(barrier)', requiredForRelease: true },
  { id: 'source', label: 'Fuente', testId: 'f191-tool-source', expectedAction: 'activateCanvasTool(source)', requiredForRelease: true },
  { id: 'region', label: 'Zona', testId: 'f191-tool-region', expectedAction: 'activateCanvasTool(region)', requiredForRelease: true },
  { id: 'measure', label: 'Medir', testId: 'f191-tool-measure', expectedAction: 'activateCanvasTool(measure)', requiredForRelease: true },
  { id: 'pan', label: 'Pan', testId: 'f191-tool-pan', expectedAction: 'activateCanvasTool(pan)', requiredForRelease: true },
  { id: 'plan', label: 'Plano', testId: 'f191-visual-mode-plan', expectedAction: 'applyVisualMode(plan)', requiredForRelease: true },
  { id: 'heat', label: 'Heat', testId: 'f191-visual-mode-heat', expectedAction: 'applyVisualMode(heat)', requiredForRelease: true },
  { id: 'isocontours', label: 'Iso', testId: 'f191-visual-mode-isocontours', expectedAction: 'applyVisualMode(isocontours)', requiredForRelease: true },
  { id: 'structure', label: 'Estruct', testId: 'f191-visual-mode-structure', expectedAction: 'applyVisualMode(structure)', requiredForRelease: true },
  { id: 'command-dock', label: 'Dock CAD', testId: 'f374-canvas-command-dock', expectedAction: 'runCanvasCommand(command)', requiredForRelease: true },
  { id: 'context-menu', label: 'Boton derecho', testId: 'canvas-context-menu', expectedAction: 'handleCanvasContextMenu(event)', requiredForRelease: true },
  { id: 'main-canvas', label: 'Canvas principal', testId: 'f100-main-floorplan-canvas', expectedAction: 'pointer/touch/context events', requiredForRelease: true },
  { id: 'heatmap-toggle', label: 'Heatmap toggle', testId: 'f89-heatmap-toggle', expectedAction: 'onToggleHeatmap(value)', requiredForRelease: false },
  { id: 'visual-export', label: 'Export por escena', testId: 'f217-visual-export-by-scene', expectedAction: 'onExportPNG()', requiredForRelease: false },
];

export function buildF406CanvasToolQa(sourceText = ''): F406CanvasToolQa {
  const missing = F406_CANVAS_TOOL_CONTRACTS
    .filter((contract) => contract.requiredForRelease && sourceText && !sourceText.includes(contract.testId))
    .map((contract) => `Missing required canvas selector ${contract.testId}`);
  const missingOptional = F406_CANVAS_TOOL_CONTRACTS
    .filter((contract) => !contract.requiredForRelease && sourceText && !sourceText.includes(contract.testId))
    .map((contract) => `Optional selector not found ${contract.testId}`);

  return {
    schema: 'radshield-mx.f406.canvas-tool-qa.v1',
    phase: 'F406',
    status: missing.length === 0 ? 'canvas-tool-qa-ready' : 'canvas-tool-qa-review',
    requiredCount: F406_CANVAS_TOOL_CONTRACTS.filter((contract) => contract.requiredForRelease).length,
    optionalCount: F406_CANVAS_TOOL_CONTRACTS.filter((contract) => !contract.requiredForRelease).length,
    toolContracts: F406_CANVAS_TOOL_CONTRACTS,
    evidenceSelectors: F406_CANVAS_TOOL_CONTRACTS.map((contract) => contract.testId),
    releaseGates: [
      'All required selectors present in CanvasArea.',
      'All required buttons expose title/aria-label text.',
      'F229 Playwright harness must pass before changing renderer/event controller.',
      'Context menu must remain available on the main canvas.',
    ],
    warnings: [...missing, ...missingOptional],
  };
}
