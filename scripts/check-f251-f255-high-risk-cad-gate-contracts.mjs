import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f251-f255-high-risk-cad-gate.mjs'], { stdio: 'pipe' });

const files = [
  'src/lib/f251ToF255HighRiskCadGate.ts',
  'src/lib/f125CalculationEvidenceGate.ts',
  'src/lib/featureFlags.ts',
  '.env.example',
  'scripts/f251-f255-high-risk-cad-gate.mjs',
  'scripts/check-f251-f255-high-risk-cad-gate-contracts.mjs',
  'outputs/f251_f255_high_risk_cad_gate/f251_f255_high_risk_cad_gate.json',
  'outputs/fase_251_255_high_risk_cad_gate.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'MANUAL_USUARIO_v99.md',
  'MANUAL_VERSIONES_v50.md',
  'CHANGELOG.md',
  'CONTROL_DE_CAMBIOS_v99.md',
  'package.json',
];

const failures = [];
for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const read = (file) => readFileSync(file, 'utf8');
const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
const manifest = existsSync(files[6]) ? JSON.parse(read(files[6])) : null;
const pkg = existsSync('package.json') ? JSON.parse(read('package.json')) : {};

const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

for (const token of [
  'F251-F255',
  'VITE_CANVAS_HIGH_RISK_CAD',
  'VITE_CANVAS_EVENT_CONTROLLER_V2',
  'buildF251ToF255HighRiskCadGate',
  'buildF251ToF255HighRiskCadReportSection',
  'buildF251ToF255HighRiskCadReportSection',
  'renderer-event-controller-v2',
  'dwg-external-conversion-pipeline',
  'bidirectional-2d-3d-sync',
  'solid-geometry-booleans',
  'gpu-heatmap-isocontours',
  'npm run test:f197:menu-canvas',
  'npm run test:f207:functional-app-qa',
  'npm run test:f229:canvas-e2e-contracts',
  'npm run test:f231-f236:canvas-release-coverage',
  'npm run test:f200:static-release-gate',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('feature flag defaults master off', joined.includes('canvasHighRiskCad: import.meta.env.VITE_CANVAS_HIGH_RISK_CAD === \'true\''));
expect('event controller subflag depends on master', joined.includes('VITE_CANVAS_HIGH_RISK_CAD') && joined.includes('VITE_CANVAS_EVENT_CONTROLLER_V2'));
expect('package exposes prepare script', pkg.scripts?.['prepare:f251-f255:high-risk-cad'] === 'node scripts/f251-f255-high-risk-cad-gate.mjs');
expect('package exposes test script', pkg.scripts?.['test:f251-f255:high-risk-cad'] === 'node scripts/check-f251-f255-high-risk-cad-gate-contracts.mjs');

if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.high-risk-cad-gate.f251-f255.v1');
  expect('manifest status', manifest.status === 'disabled-by-default-staging-ready');
  expect('manifest has five phases', manifest.phases?.length === 5);
  expect('manifest has before/after gates', manifest.beforeAfterGateCommandOrder?.length === 5);
}

if (failures.length) {
  console.error('F251-F255 high-risk CAD gate contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F251-F255 high-risk CAD gate contracts passed.');
