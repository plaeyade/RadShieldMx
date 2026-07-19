import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f251_f255_high_risk_cad_gate');
const jsonPath = path.join(outputDir, 'f251_f255_high_risk_cad_gate.json');
const mdPath = path.join(root, 'outputs', 'fase_251_255_high_risk_cad_gate.md');

const gateCommands = [
  'npm run test:f197:menu-canvas',
  'npm run test:f207:functional-app-qa',
  'npm run test:f229:canvas-e2e-contracts',
  'npm run test:f231-f236:canvas-release-coverage',
  'npm run test:f200:static-release-gate',
];

const manifest = {
  phaseRange: 'F251-F255',
  schema: 'radshield-mx.high-risk-cad-gate.f251-f255.v1',
  generatedAt: new Date().toISOString(),
  status: 'disabled-by-default-staging-ready',
  staticRcBaseline: 'F248-F250 static frontend release candidate remains the rollback baseline',
  featureFlags: {
    VITE_CANVAS_HIGH_RISK_CAD: 'false by default',
    VITE_CANVAS_EVENT_CONTROLLER_V2: 'false by default and requires VITE_CANVAS_HIGH_RISK_CAD=true',
  },
  beforeAfterGateCommandOrder: gateCommands,
  phases: [
    ['F251', 'Renderer/event controller v2', 'staging-only'],
    ['F252', 'DWG external conversion pipeline', 'staging-only'],
    ['F253', 'Bidirectional 2D/3D sync', 'staging-only'],
    ['F254', 'Solid/boolean CAD geometry', 'blocked until geometry QA'],
    ['F255', 'GPU/WebGL heatmaps and isocontours', 'blocked until CPU reference QA'],
  ].map(([phase, title, status]) => ({ phase, title, status })),
  rollbackPlan: [
    'Set VITE_CANVAS_HIGH_RISK_CAD=false.',
    'Set VITE_CANVAS_EVENT_CONTROLLER_V2=false.',
    'Clear localStorage radshield_feature_flags if experimental flags were toggled in browser.',
    'Return to the F250 static RC artifact and rerun F197/F207/F229/F231-F236/F200.',
  ],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const markdown = [
  '# F251-F255 High-Risk CAD Gate',
  '',
  `Status: **${manifest.status}**`,
  `Static RC baseline: ${manifest.staticRcBaseline}`,
  '',
  '## Feature Flags',
  '',
  ...Object.entries(manifest.featureFlags).map(([key, value]) => `- ${key}: ${value}`),
  '',
  '## Before/After Gates',
  '',
  ...manifest.beforeAfterGateCommandOrder.map((command) => `- ${command}`),
  '',
  '## Phases',
  '',
  ...manifest.phases.map((phase) => `- ${phase.phase}: ${phase.title} (${phase.status})`),
  '',
  '## Rollback',
  '',
  ...manifest.rollbackPlan.map((item) => `- ${item}`),
  '',
].join('\n');

fs.writeFileSync(mdPath, markdown, 'utf8');
console.log(`F251-F255 high-risk CAD gate ${manifest.status}: ${manifest.phases.length} phases.`);
