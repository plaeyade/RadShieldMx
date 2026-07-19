export type F251F255CadStatus = 'flagged-off' | 'staging-only' | 'blocked';

export interface F251F255CadWorkItem {
  phase: 'F251' | 'F252' | 'F253' | 'F254' | 'F255';
  id: string;
  title: string;
  status: F251F255CadStatus;
  featureFlag: 'VITE_CANVAS_HIGH_RISK_CAD' | 'VITE_CANVAS_EVENT_CONTROLLER_V2';
  scope: string;
  rollback: string;
  requiredBeforeAfterGates: string[];
}

export interface F251F255HighRiskCadGate {
  phaseRange: 'F251-F255';
  schema: 'radshield-mx.high-risk-cad-gate.f251-f255.v1';
  rcStaticDeployDecision: 'apply-static-rc-before-high-risk-cad';
  defaultRuntimeState: 'disabled-by-default';
  items: F251F255CadWorkItem[];
  beforeAfterGateCommandOrder: string[];
  rollbackPlan: string[];
  releaseDecision: string;
}

export function buildF251ToF255HighRiskCadGate(): F251F255HighRiskCadGate {
  const beforeAfterGateCommandOrder = [
    'npm run test:f197:menu-canvas',
    'npm run test:f207:functional-app-qa',
    'npm run test:f229:canvas-e2e-contracts',
    'npm run test:f231-f236:canvas-release-coverage',
    'npm run test:f200:static-release-gate',
  ];

  return {
    phaseRange: 'F251-F255',
    schema: 'radshield-mx.high-risk-cad-gate.f251-f255.v1',
    rcStaticDeployDecision: 'apply-static-rc-before-high-risk-cad',
    defaultRuntimeState: 'disabled-by-default',
    items: [
      {
        phase: 'F251',
        id: 'renderer-event-controller-v2',
        title: 'Renderer base and pointer/event controller v2',
        status: 'staging-only',
        featureFlag: 'VITE_CANVAS_EVENT_CONTROLLER_V2',
        scope: 'Introduce an isolated event controller for drag, snap, lasso, pan, zoom, delete and undo without replacing stable useCanvas by default.',
        rollback: 'Set VITE_CANVAS_EVENT_CONTROLLER_V2=false and VITE_CANVAS_HIGH_RISK_CAD=false; stable useCanvas remains the default path.',
        requiredBeforeAfterGates: beforeAfterGateCommandOrder,
      },
      {
        phase: 'F252',
        id: 'dwg-external-conversion-pipeline',
        title: 'DWG external conversion pipeline',
        status: 'staging-only',
        featureFlag: 'VITE_CANVAS_HIGH_RISK_CAD',
        scope: 'Add provider boundary for DWG->DXF/SVG/IFC conversion with file audit, timeout and DXF fallback; no native browser DWG claim.',
        rollback: 'Disable provider and keep existing DXF import/manual conversion workflow.',
        requiredBeforeAfterGates: beforeAfterGateCommandOrder,
      },
      {
        phase: 'F253',
        id: 'bidirectional-2d-3d-sync',
        title: 'Bidirectional 2D/3D medical inspection sync',
        status: 'staging-only',
        featureFlag: 'VITE_CANVAS_HIGH_RISK_CAD',
        scope: 'Sync floorplan geometry, equipment, materials, controlled zones and visual snapshots with scene hashes.',
        rollback: 'Return to one-way 2D->3D snapshot/export handoff and discard unsaved staged 3D edits.',
        requiredBeforeAfterGates: beforeAfterGateCommandOrder,
      },
      {
        phase: 'F254',
        id: 'solid-geometry-booleans',
        title: 'Solid/boolean CAD geometry',
        status: 'blocked',
        featureFlag: 'VITE_CANVAS_HIGH_RISK_CAD',
        scope: 'Doors, penetrations and wall cuts using an isolated geometry kernel with unit/hash invalidation.',
        rollback: 'Keep current wall/door representation and reject boolean-derived calculation changes unless geometry QA is green.',
        requiredBeforeAfterGates: beforeAfterGateCommandOrder,
      },
      {
        phase: 'F255',
        id: 'gpu-heatmap-isocontours',
        title: 'GPU/WebGL heatmaps and isocontours',
        status: 'blocked',
        featureFlag: 'VITE_CANVAS_HIGH_RISK_CAD',
        scope: 'GPU rendering for dose grids with CPU reference comparison, regulatory legend and export QA.',
        rollback: 'Use current CPU/proxy visual layers and block GPU output from signed reports until numeric comparison passes.',
        requiredBeforeAfterGates: beforeAfterGateCommandOrder,
      },
    ],
    beforeAfterGateCommandOrder,
    rollbackPlan: [
      'Keep RC/static deploy artifact before enabling any CAD high-risk flag.',
      'Disable VITE_CANVAS_HIGH_RISK_CAD and VITE_CANVAS_EVENT_CONTROLLER_V2 to return to stable canvas.',
      'Clear localStorage key radshield_feature_flags if a browser persisted experimental flags.',
      'Re-run F197/F207/F229/F231-F236/F200 after rollback.',
      'Do not merge high-risk CAD work unless before/after gate outputs are both green.',
    ],
    releaseDecision:
      'Static RC/deploy remains the stable baseline. High-risk CAD work may start only as disabled-by-default/staging-only capability and must not alter production canvas behavior until before/after gates pass.',
  };
}

export function buildF251ToF255HighRiskCadReportSection(): string {
  const gate = buildF251ToF255HighRiskCadGate();
  return [
    'F251-F255 HIGH-RISK CAD GATE',
    `Default runtime: ${gate.defaultRuntimeState}`,
    `RC/static deploy: ${gate.rcStaticDeployDecision}`,
    'Before/after gates:',
    ...gate.beforeAfterGateCommandOrder.map((command) => `- ${command}`),
    'Rollback:',
    ...gate.rollbackPlan.map((item) => `- ${item}`),
    'Work items:',
    ...gate.items.map((item) => `- ${item.phase} ${item.title} [${item.status}] via ${item.featureFlag}`),
  ].join('\n');
}
