export type F256F260Status = 'ready' | 'staging-only' | 'blocked-until-gate';

export interface F256F260Phase {
  phase: 'F256' | 'F257' | 'F258' | 'F259' | 'F260';
  title: string;
  status: F256F260Status;
  objective: string;
  requiredInputs: string[];
  exitCriteria: string[];
  riskControl: string;
}

export interface F256F260NextPhaseRoadmap {
  phaseRange: 'F256-F260';
  schema: 'radshield-mx.next-phase-roadmap.f256-f260.v1';
  currentBaseline: 'F255-static-rc-plus-disabled-cad-flags';
  recommendation: string;
  phases: F256F260Phase[];
  deployDecision: {
    staticFrontend: 'upload-current-dist-then-public-smoke';
    fullStack: 'defer-until-db-restore-probe-and-backend-smoke';
    cadHighRisk: 'staging-feature-flag-only';
  };
}

export function buildF256ToF260NextPhaseRoadmap(): F256F260NextPhaseRoadmap {
  return {
    phaseRange: 'F256-F260',
    schema: 'radshield-mx.next-phase-roadmap.f256-f260.v1',
    currentBaseline: 'F255-static-rc-plus-disabled-cad-flags',
    recommendation:
      'Proceed with public static smoke first, then run CAD high-risk work only in staging flags. Do not enable fullstack claims until DB restore probe and backend smoke pass.',
    phases: [
      {
        phase: 'F256',
        title: 'Public static deploy verification',
        status: 'ready',
        objective: 'Upload the current dist ZIP to Vercel/Netlify and verify HTTPS, SPA fallback, manual F255, sidebar, canvas, toolbar and critical outputs.',
        requiredInputs: ['outputs/f200_static_frontend_release_gate/radshield-mx-f200-static-dist.zip', 'PUBLIC_DEPLOY_URL'],
        exitCriteria: ['F202 public smoke ready or F203 manual checklist signed', 'manual F255 visible on public URL', 'canvas/sidebar/toolbar visible'],
        riskControl: 'If public smoke fails, keep F250/F255 local package as rollback and do not overwrite the public URL again.',
      },
      {
        phase: 'F257',
        title: 'CAD staging flag activation',
        status: 'staging-only',
        objective: 'Create a staging build with VITE_CANVAS_HIGH_RISK_CAD=true while keeping VITE_CANVAS_EVENT_CONTROLLER_V2=false until renderer/event smoke is ready.',
        requiredInputs: ['F197/F207/F229/F231-F236/F200 before gates', 'feature flag environment', 'rollback artifact'],
        exitCriteria: ['staging build loads', 'flags visible in release evidence', 'stable canvas path still works when flags are off'],
        riskControl: 'Master flag is off in RC; clear localStorage radshield_feature_flags to rollback browser state.',
      },
      {
        phase: 'F258',
        title: 'Renderer/event controller v2 spike',
        status: 'staging-only',
        objective: 'Prototype isolated pointer event routing for drag, snap, lasso, pan, zoom, delete and undo without replacing useCanvas by default.',
        requiredInputs: ['VITE_CANVAS_EVENT_CONTROLLER_V2=true in staging only', 'F229 E2E harness', 'visual baseline screenshots'],
        exitCriteria: ['drag/snap/lasso/pan/zoom pass in E2E', 'canvas remains nonblank', 'rollback to useCanvas confirmed'],
        riskControl: 'Do not merge an unflagged renderer/event change. Do not change renderer and event mutation in the same patch.',
      },
      {
        phase: 'F259',
        title: 'DWG external conversion provider',
        status: 'blocked-until-gate',
        objective: 'Define external DWG to DXF/SVG/IFC conversion boundary, file audit, timeout, provider errors and DXF fallback.',
        requiredInputs: ['provider selection', 'test DWG files', 'security/file-size limits', 'DXF layer mapping fixtures'],
        exitCriteria: ['converted DXF imports', 'layer mapping survives', 'no native DWG claim in browser', 'failed conversions are safe and recoverable'],
        riskControl: 'Keep current DXF import path as canonical until converted DWG fixture passes smoke.',
      },
      {
        phase: 'F260',
        title: 'DB/fullstack production revisit',
        status: 'blocked-until-gate',
        objective: 'Return to DB live, restore probe, backend smoke, RAG/private documents and production secrets after static frontend is validated.',
        requiredInputs: ['DATABASE_URL', 'RADSHIELD_ALLOW_DB_BACKUP=1', 'RADSHIELD_ALLOW_DB_RESTORE_PROBE=1', 'backend health URL'],
        exitCriteria: ['backup hash', 'restore probe OK', 'backend smoke OK', 'no private corpus in static host'],
        riskControl: 'Frontend static deploy remains separate from fullstack production. No multiuser claim without DB evidence.',
      },
    ],
    deployDecision: {
      staticFrontend: 'upload-current-dist-then-public-smoke',
      fullStack: 'defer-until-db-restore-probe-and-backend-smoke',
      cadHighRisk: 'staging-feature-flag-only',
    },
  };
}

export function buildF256ToF260RoadmapSection(): string {
  const roadmap = buildF256ToF260NextPhaseRoadmap();
  return [
    'F256-F260 NEXT PHASE ROADMAP',
    `Baseline: ${roadmap.currentBaseline}`,
    `Recommendation: ${roadmap.recommendation}`,
    `Static frontend: ${roadmap.deployDecision.staticFrontend}`,
    `Fullstack: ${roadmap.deployDecision.fullStack}`,
    `CAD high risk: ${roadmap.deployDecision.cadHighRisk}`,
    ...roadmap.phases.map((phase) => [
      `- ${phase.phase} ${phase.title} [${phase.status}]`,
      `  Objective: ${phase.objective}`,
      `  Exit: ${phase.exitCriteria.join(' | ')}`,
      `  Risk: ${phase.riskControl}`,
    ].join('\n')),
  ].join('\n');
}
