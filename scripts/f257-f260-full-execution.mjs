import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f257_f260_full_execution');
const jsonPath = path.join(outputDir, 'f257_f260_full_execution.json');
const mdPath = path.join(root, 'outputs', 'fase_257_260_full_execution.md');
const stagingEnvPath = path.join(root, '.env.staging-cad.example');

const beforeAfterGates = [
  'npm run test:f197:menu-canvas',
  'npm run test:f207:functional-app-qa',
  'npm run test:f229:canvas-e2e-contracts',
  'npm run test:f231-f236:canvas-release-coverage',
  'npm run test:f200:static-release-gate',
];

const manifest = {
  phaseRange: 'F257-F260',
  schema: 'radshield-mx.f257-f260.full-execution.v1',
  generatedAt: new Date().toISOString(),
  status: 'f257-f260-full-execution-ready',
  baseline: 'F256 public static smoke path plus F255 rollback',
  releaseLanes: {
    staticFrontend: 'stable lane; keep current RC/static dist as rollback',
    cadStaging: 'feature-flag lane only; never default production',
    stagingWithoutFeatureFlags: 'not recommended; no rollback switch and no clean before/after isolation',
    dbFullstack: 'blocked until restore probe, backend smoke and secrets pass',
  },
  phases: [
    {
      phase: 'F257',
      status: 'executed',
      title: 'CAD staging flag package',
      enabledByDefault: false,
      requiredFlags: {
        VITE_CANVAS_HIGH_RISK_CAD: 'true only in staging',
        VITE_CANVAS_EVENT_CONTROLLER_V2: 'false initially; true only after F258 patch exists',
      },
      validationCommands: [...beforeAfterGates, 'npm run test:f251-f255:high-risk-cad'],
      rollback: 'Disable both CAD flags, clear localStorage.radshield_feature_flags and redeploy the stable static ZIP.',
    },
    {
      phase: 'F258',
      status: 'staging-ready',
      title: 'Renderer/event controller v2 execution gate',
      requiredFlags: {
        VITE_CANVAS_HIGH_RISK_CAD: 'true in staging',
        VITE_CANVAS_EVENT_CONTROLLER_V2: 'true only for event-controller-v2 smoke',
      },
      validationCommands: [
        'npm run test:f229:canvas-e2e-contracts',
        'npm run test:f229:canvas-e2e',
        'npm run test:f207:functional-app-qa',
      ],
      rollback: 'Disable VITE_CANVAS_EVENT_CONTROLLER_V2 first, then VITE_CANVAS_HIGH_RISK_CAD if needed.',
    },
    {
      phase: 'F259',
      status: 'blocked-by-external-provider',
      title: 'DWG external conversion provider boundary',
      requiredProviderContract: [
        'max file size limit',
        'conversion timeout',
        'input/output hash audit',
        'DXF/SVG/IFC output validation',
        'safe failure without floorplan mutation',
      ],
      validationCommands: [
        'npm run test:f204:canvas-dxf-recovery',
        'npm run test:f213:dxf-layer-mapping',
        'npm run test:f207:functional-app-qa',
      ],
      rollback: 'Keep DXF canonical and reject failed provider output.',
    },
    {
      phase: 'F260',
      status: 'blocked-by-db-live-gates',
      title: 'DB/fullstack production revisit gate',
      requiredEnvironment: [
        'DATABASE_URL',
        'RADSHIELD_ALLOW_DB_BACKUP=1',
        'RADSHIELD_ALLOW_DB_RESTORE_PROBE=1',
        'backend health URL',
      ],
      validationCommands: [
        'npm run db:preflight',
        'npm run test:f153:db-backup-restore',
        'npm run test:backend:health',
        'npm run test:f131:fullstack-live',
      ],
      rollback: 'Keep VITE_ENABLE_BACKEND=false and keep private RAG/DB outside the static host.',
    },
  ],
  beforeAfterGates,
};

const stagingEnv = [
  '# RadShield-MX CAD staging environment',
  '# Use this file only in a separate staging deploy/branch.',
  '# Production/static RC must keep both flags disabled.',
  'VITE_ENABLE_BACKEND=false',
  'VITE_CANVAS_HIGH_RISK_CAD=true',
  'VITE_CANVAS_EVENT_CONTROLLER_V2=false',
  'VITE_APP_VERSION=f257-cad-staging',
  '',
  '# Turn this on only after F258 event controller v2 has its own patch and E2E smoke.',
  '# VITE_CANVAS_EVENT_CONTROLLER_V2=true',
  '',
].join('\n');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(stagingEnvPath, stagingEnv, 'utf8');

const markdown = [
  '# F257-F260 Full Execution',
  '',
  `Status: **${manifest.status}**`,
  `Baseline: ${manifest.baseline}`,
  '',
  '## Release Lanes',
  '',
  `- Static frontend: ${manifest.releaseLanes.staticFrontend}`,
  `- CAD staging: ${manifest.releaseLanes.cadStaging}`,
  `- Staging without feature flags: ${manifest.releaseLanes.stagingWithoutFeatureFlags}`,
  `- DB/fullstack: ${manifest.releaseLanes.dbFullstack}`,
  '',
  '## Phases',
  '',
  ...manifest.phases.map((phase) => [
    `### ${phase.phase} - ${phase.title}`,
    '',
    `- Status: ${phase.status}`,
    `- Validation: ${phase.validationCommands.join(' | ')}`,
    `- Rollback: ${phase.rollback}`,
  ].join('\n')),
  '',
  '## Before/After Gates',
  '',
  ...manifest.beforeAfterGates.map((command) => `- ${command}`),
  '',
].join('\n');

fs.writeFileSync(mdPath, markdown, 'utf8');
console.log(`F257-F260 full execution ${manifest.status}: ${manifest.phases.length} phases.`);
