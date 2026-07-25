export type F257F260Status = 'executed' | 'staging-ready' | 'blocked-by-external-gate';

export interface F257F260PhaseExecution {
  phase: 'F257' | 'F258' | 'F259' | 'F260';
  title: string;
  status: F257F260Status;
  enabledByDefault: boolean;
  productionSafe: boolean;
  deliverables: string[];
  validationCommands: string[];
  rollback: string;
  releaseDecision: string;
}

export interface F257F260FullExecution {
  phaseRange: 'F257-F260';
  schema: 'radshield-mx.f257-f260.full-execution.v1';
  baseline: 'F256-public-static-smoke-path-plus-F255-rollback';
  staticFrontendDecision: 'keep-current-static-rc-as-stable-release-lane';
  highRiskCadDecision: 'staging-only-disabled-in-production';
  stagingWithoutFeatureFlagsDecision: 'not-recommended-no-rollback-switch';
  dbFullstackDecision: 'blocked-until-restore-probe-backend-smoke-and-secrets';
  phases: F257F260PhaseExecution[];
  globalBeforeAfterGates: string[];
  operatorActions: string[];
}

export function buildF257ToF260FullExecution(): F257F260FullExecution {
  const globalBeforeAfterGates = [
    'npm run test:f197:menu-canvas',
    'npm run test:f207:functional-app-qa',
    'npm run test:f229:canvas-e2e-contracts',
    'npm run test:f231-f236:canvas-release-coverage',
    'npm run test:f200:static-release-gate',
  ];

  return {
    phaseRange: 'F257-F260',
    schema: 'radshield-mx.f257-f260.full-execution.v1',
    baseline: 'F256-public-static-smoke-path-plus-F255-rollback',
    staticFrontendDecision: 'keep-current-static-rc-as-stable-release-lane',
    highRiskCadDecision: 'staging-only-disabled-in-production',
    stagingWithoutFeatureFlagsDecision: 'not-recommended-no-rollback-switch',
    dbFullstackDecision: 'blocked-until-restore-probe-backend-smoke-and-secrets',
    phases: [
      {
        phase: 'F257',
        title: 'CAD staging flag package',
        status: 'executed',
        enabledByDefault: false,
        productionSafe: true,
        deliverables: [
          '.env.staging-cad.example documents the CAD staging flags',
          'VITE_CANVAS_HIGH_RISK_CAD remains false in .env.example',
          'release evidence records stable rollback to the current static RC',
        ],
        validationCommands: [
          ...globalBeforeAfterGates,
          'npm run test:f251-f255:high-risk-cad',
        ],
        rollback:
          'Set VITE_CANVAS_HIGH_RISK_CAD=false, set VITE_CANVAS_EVENT_CONTROLLER_V2=false, clear localStorage.radshield_feature_flags and redeploy the current static dist ZIP.',
        releaseDecision:
          'F257 is complete as a staging package. It must not be enabled on the public static URL unless the before/after gates pass.',
      },
      {
        phase: 'F258',
        title: 'Renderer/event controller v2 execution gate',
        status: 'staging-ready',
        enabledByDefault: false,
        productionSafe: true,
        deliverables: [
          'src/lib/canvas/eventControllerV2.ts provides the isolated event router contract',
          'event controller v2 remains isolated behind VITE_CANVAS_EVENT_CONTROLLER_V2',
          'no default replacement of useCanvas event mutation',
          'F229 E2E harness is the required acceptance surface for drag/snap/lasso/pan/zoom/delete/undo',
        ],
        validationCommands: [
          'npm run test:f229:canvas-e2e-contracts',
          'npm run test:f229:canvas-e2e',
          'npm run test:f207:functional-app-qa',
        ],
        rollback:
          'Disable VITE_CANVAS_EVENT_CONTROLLER_V2 first; if the staging shell still fails, disable VITE_CANVAS_HIGH_RISK_CAD and return to stable useCanvas.',
        releaseDecision:
          'F258 can begin in staging after F257, but it is not a production feature until E2E pointer behavior passes before and after the patch.',
      },
      {
        phase: 'F259',
        title: 'DWG external conversion provider boundary',
        status: 'blocked-by-external-gate',
        enabledByDefault: false,
        productionSafe: true,
        deliverables: [
          'src/lib/dwgExternalProviderGate.ts defines the provider boundary',
          'DWG remains external conversion only; no native browser DWG claim',
          'provider contract requires file size limit, timeout, conversion hash, audit trail and DXF fallback',
          'DXF layer mapping stays canonical until converted DWG fixtures pass smoke',
        ],
        validationCommands: [
          'npm run test:f204:canvas-dxf-recovery',
          'npm run test:f213:dxf-layer-mapping',
          'npm run test:f207:functional-app-qa',
        ],
        rollback:
          'Reject provider output and keep current DXF import path; never mutate the floorplan from a failed conversion.',
        releaseDecision:
          'F259 is specified, but execution requires a selected conversion provider and test DWG files.',
      },
      {
        phase: 'F260',
        title: 'DB/fullstack production revisit gate',
        status: 'blocked-by-external-gate',
        enabledByDefault: false,
        productionSafe: true,
        deliverables: [
          'scripts/f260-fullstack-db-gate.mjs writes a DB/fullstack readiness manifest',
          'static frontend remains separate from DB/private RAG',
          'DATABASE_URL, backup permission, restore probe permission and backend health URL are required',
          'no multiuser/fullstack claim is allowed without backup hash, restore probe OK and backend smoke OK',
        ],
        validationCommands: [
          'npm run db:preflight',
          'npm run test:f153:db-backup-restore',
          'npm run test:backend:health',
          'npm run test:f131:fullstack-live',
        ],
        rollback:
          'Keep VITE_ENABLE_BACKEND=false in static release; remove production secrets from frontend host; return to offline/static mode.',
        releaseDecision:
          'F260 is ready to run when DB credentials and restore-probe permissions are provided. It remains blocked for production until those gates pass live.',
      },
    ],
    globalBeforeAfterGates,
    operatorActions: [
      'Publish or verify the current static ZIP first.',
      'Use a separate staging deployment for CAD high-risk flags.',
      'Do not run a full staging build without feature flags; it removes the rollback switch and makes regressions harder to isolate.',
      'Do not enable DB/fullstack on the static public host.',
      'Run DB restore probe on a disposable target before touching production data.',
    ],
  };
}

export function buildF257ToF260FullExecutionSection(): string {
  const gate = buildF257ToF260FullExecution();
  return [
    'F257-F260 FULL EXECUTION GATE',
    `Baseline: ${gate.baseline}`,
    `Static frontend: ${gate.staticFrontendDecision}`,
    `CAD high risk: ${gate.highRiskCadDecision}`,
    `Staging without feature flags: ${gate.stagingWithoutFeatureFlagsDecision}`,
    `DB/fullstack: ${gate.dbFullstackDecision}`,
    `Before/after gates: ${gate.globalBeforeAfterGates.join(' | ')}`,
    ...gate.phases.map((phase) => [
      `- ${phase.phase} ${phase.title} [${phase.status}]`,
      `  Enabled by default: ${phase.enabledByDefault ? 'yes' : 'no'}`,
      `  Production safe: ${phase.productionSafe ? 'yes' : 'no'}`,
      `  Deliverables: ${phase.deliverables.join(' | ')}`,
      `  Validation: ${phase.validationCommands.join(' | ')}`,
      `  Rollback: ${phase.rollback}`,
      `  Decision: ${phase.releaseDecision}`,
    ].join('\n')),
    `Operator actions: ${gate.operatorActions.join(' | ')}`,
  ].join('\n');
}
