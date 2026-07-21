import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f256-f260-next-phase-roadmap.mjs'], { stdio: 'pipe' });

const files = [
  'src/lib/f256ToF260NextPhaseRoadmap.ts',
  'src/lib/f125CalculationEvidenceGate.ts',
  'scripts/f256-f260-next-phase-roadmap.mjs',
  'scripts/check-f256-f260-next-phase-roadmap-contracts.mjs',
  'outputs/f256_f260_next_phase_roadmap/f256_f260_next_phase_roadmap.json',
  'outputs/fase_256_260_next_phase_roadmap.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'MANUAL_USUARIO_v99.md',
  'MANUAL_VERSIONES_v50.md',
  'CHANGELOG.md',
  'CONTROL_DE_CAMBIOS_v99.md',
  'public/manual_usuario.html',
  'package.json',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');
for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
const manifest = existsSync(files[4]) ? JSON.parse(read(files[4])) : null;
const pkg = existsSync('package.json') ? JSON.parse(read('package.json')) : {};

const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

for (const token of [
  'F256-F260',
  'buildF256ToF260NextPhaseRoadmap',
  'buildF256ToF260RoadmapSection',
  'Public static deploy verification',
  'CAD staging flag activation',
  'Renderer/event controller v2 spike',
  'DWG external conversion provider',
  'DB/fullstack production revisit',
  'upload-current-dist-then-public-smoke',
  'defer-until-db-restore-probe-and-backend-smoke',
  'staging-feature-flag-only',
  'npm run test:f197:menu-canvas',
  'npm run test:f207:functional-app-qa',
  'npm run test:f229:canvas-e2e-contracts',
  'npm run test:f231-f236:canvas-release-coverage',
  'npm run test:f200:static-release-gate',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('F125 includes F256-F260 roadmap section', joined.includes('buildF256ToF260RoadmapSection'));
expect('Update Center documents F256-F260', joined.includes('F256-F260 Next phases'));
expect('manual html coverage includes F260', /Cobertura de versiones: v1 - F26[0-9]/.test(joined));
expect('package exposes prepare script', pkg.scripts?.['prepare:f256-f260:roadmap'] === 'node scripts/f256-f260-next-phase-roadmap.mjs');
expect('package exposes test script', pkg.scripts?.['test:f256-f260:roadmap'] === 'node scripts/check-f256-f260-next-phase-roadmap-contracts.mjs');

if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.next-phase-roadmap.f256-f260.v1');
  expect('manifest status', manifest.status === 'next-phase-roadmap-ready');
  expect('manifest has five phases', manifest.phases?.length === 5);
}

if (failures.length) {
  console.error('F256-F260 roadmap contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F256-F260 roadmap contracts passed.');
