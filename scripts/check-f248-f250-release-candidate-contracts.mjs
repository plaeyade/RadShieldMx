import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f248-f250-release-candidate.mjs'], { stdio: 'pipe' });

const read = (file) => readFileSync(file, 'utf8');
const failures = [];
const requiredFiles = [
  'src/lib/f248ToF250ReleaseCandidate.ts',
  'src/lib/f125CalculationEvidenceGate.ts',
  'scripts/f248-f250-release-candidate.mjs',
  'scripts/check-f248-f250-release-candidate-contracts.mjs',
  'outputs/f248_f250_release_candidate/f248_f250_release_candidate.json',
  'outputs/fase_248_250_release_candidate.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'public/manual_usuario.html',
  'MANUAL_USUARIO_v99.md',
  'MANUAL_VERSIONES_v50.md',
  'CHANGELOG.md',
  'CONTROL_DE_CAMBIOS_v99.md',
  'package.json',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = existsSync(requiredFiles[0]) ? read(requiredFiles[0]) : '';
const manifestPath = 'outputs/f248_f250_release_candidate/f248_f250_release_candidate.json';
const manifest = existsSync(manifestPath) ? JSON.parse(read(manifestPath)) : null;
const joined = requiredFiles.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
const pkg = existsSync('package.json') ? JSON.parse(read('package.json')) : {};

const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

for (const token of [
  'buildF248ToF250ReleaseCandidate',
  'getHighRiskCadImprovements',
  'buildF248ToF250ReportSection',
  'cad-renderer-event-rewrite',
  'cad-native-dwg',
  'cad-real-time-3d-sync',
  'cad-boolean-geometry-engine',
  'cad-gpu-heatmap-isocontours',
  'blocked-until-db-restore-probe',
]) {
  expect(`F248-F250 lib missing ${token}`, lib.includes(token));
}

for (const phase of ['F248', 'F249', 'F250']) {
  expect(`docs missing ${phase}`, joined.includes(phase));
}

expect('manual html coverage includes F250 within current range', /Cobertura de versiones: v1 - F25[0-9]/.test(joined));
expect('Update Center documents F248-F250', joined.includes('F248-F250 Release candidate'));
expect('F125 includes F248-F250 report section', joined.includes('buildF248ToF250ReportSection'));
expect('package exposes prepare script', pkg.scripts?.['prepare:f248-f250:release-candidate'] === 'node scripts/f248-f250-release-candidate.mjs');
expect('package exposes test script', pkg.scripts?.['test:f248-f250:release-candidate'] === 'node scripts/check-f248-f250-release-candidate-contracts.mjs');

if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.release-candidate.f248-f250.v1');
  expect('manifest status', manifest.status === 'static-frontend-release-candidate');
  expect('manifest has 3 phases', manifest.phases?.length === 3);
  expect('manifest has 5 high-risk CAD items', manifest.highRiskCadImprovements?.length === 5);
  expect('manifest blocks fullstack', manifest.fullStackDecision === 'blocked-until-db-restore-probe');
}

if (failures.length) {
  console.error('F248-F250 release candidate contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F248-F250 release candidate contracts passed.');
