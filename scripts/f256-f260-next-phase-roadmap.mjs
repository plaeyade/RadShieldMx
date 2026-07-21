import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f256_f260_next_phase_roadmap');
const jsonPath = path.join(outputDir, 'f256_f260_next_phase_roadmap.json');
const mdPath = path.join(root, 'outputs', 'fase_256_260_next_phase_roadmap.md');

const manifest = {
  phaseRange: 'F256-F260',
  schema: 'radshield-mx.next-phase-roadmap.f256-f260.v1',
  generatedAt: new Date().toISOString(),
  baseline: 'F255 static RC plus disabled high-risk CAD flags',
  status: 'next-phase-roadmap-ready',
  phases: [
    ['F256', 'Public static deploy verification', 'ready'],
    ['F257', 'CAD staging flag activation', 'staging-only'],
    ['F258', 'Renderer/event controller v2 spike', 'staging-only'],
    ['F259', 'DWG external conversion provider', 'blocked-until-gate'],
    ['F260', 'DB/fullstack production revisit', 'blocked-until-gate'],
  ].map(([phase, title, status]) => ({ phase, title, status })),
  deployDecision: {
    staticFrontend: 'upload-current-dist-then-public-smoke',
    fullStack: 'defer-until-db-restore-probe-and-backend-smoke',
    cadHighRisk: 'staging-feature-flag-only',
  },
  requiredBeforeCadHighRisk: [
    'npm run test:f197:menu-canvas',
    'npm run test:f207:functional-app-qa',
    'npm run test:f229:canvas-e2e-contracts',
    'npm run test:f231-f236:canvas-release-coverage',
    'npm run test:f200:static-release-gate',
  ],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const markdown = [
  '# F256-F260 Next Phase Roadmap',
  '',
  `Status: **${manifest.status}**`,
  `Baseline: ${manifest.baseline}`,
  '',
  '## Phases',
  '',
  ...manifest.phases.map((phase) => `- ${phase.phase}: ${phase.title} (${phase.status})`),
  '',
  '## Deploy Decision',
  '',
  `- Static frontend: ${manifest.deployDecision.staticFrontend}`,
  `- Fullstack: ${manifest.deployDecision.fullStack}`,
  `- CAD high risk: ${manifest.deployDecision.cadHighRisk}`,
  '',
  '## Required Before CAD High Risk',
  '',
  ...manifest.requiredBeforeCadHighRisk.map((command) => `- ${command}`),
  '',
].join('\n');

fs.writeFileSync(mdPath, markdown, 'utf8');
console.log(`F256-F260 roadmap ${manifest.status}: ${manifest.phases.length} phases.`);
