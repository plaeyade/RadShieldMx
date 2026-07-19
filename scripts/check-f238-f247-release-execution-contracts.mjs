import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/f238-f247-release-execution.mjs'], { stdio: 'pipe' });

const read = (file) => readFileSync(file, 'utf8');
const requiredFiles = [
  'src/lib/f238ToF247ReleaseExecution.ts',
  'src/lib/f125CalculationEvidenceGate.ts',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'public/manual_usuario.html',
  'MANUAL_USUARIO_v99.md',
  'MANUAL_VERSIONES_v50.md',
  'CHANGELOG.md',
  'CONTROL_DE_CAMBIOS_v99.md',
  'outputs/f238_f247_release_execution/f238_f247_release_execution.json',
  'outputs/fase_238_247_release_execution.md',
  'package.json',
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = existsSync(requiredFiles[0]) ? read(requiredFiles[0]) : '';
const f125 = existsSync(requiredFiles[1]) ? read(requiredFiles[1]) : '';
const update = existsSync(requiredFiles[2]) ? read(requiredFiles[2]) : '';
const html = existsSync(requiredFiles[3]) ? read(requiredFiles[3]) : '';
const manual = existsSync(requiredFiles[4]) ? read(requiredFiles[4]) : '';
const versions = existsSync(requiredFiles[5]) ? read(requiredFiles[5]) : '';
const changelog = existsSync(requiredFiles[6]) ? read(requiredFiles[6]) : '';
const control = existsSync(requiredFiles[7]) ? read(requiredFiles[7]) : '';
const output = existsSync(requiredFiles[8]) ? JSON.parse(read(requiredFiles[8])) : null;
const pkg = existsSync(requiredFiles[10]) ? JSON.parse(read(requiredFiles[10])) : {};

const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

for (const token of [
  'buildF238ToF247ReleaseExecution',
  'buildVersionedTvlHvlLedger',
  'buildMaterialAudit',
  'buildReportAppendixChecklist',
  'buildF238ToF247ReportSection',
  'manualCoverage: \'v1-F247\'',
  'frontendDeployDecision',
  'fullStackDeployDecision',
  'sourcePriority',
  'citationHash',
  'reviewStatus',
]) {
  expect(`F238-F247 lib missing ${token}`, lib.includes(token));
}

for (const phase of ['F238', 'F239', 'F240', 'F241', 'F242', 'F243', 'F244', 'F245', 'F246', 'F247']) {
  expect(`F238-F247 lib missing ${phase}`, lib.includes(`phase: '${phase}'`) || lib.includes(phase));
  expect(`manual/html missing ${phase}`, html.includes(phase) || manual.includes(phase) || versions.includes(phase));
}

expect('F125 includes F238-F247 report section', f125.includes('buildF238ToF247ReportSection'));
expect('Update Center documents F238-F247', update.includes('F238-F247 Release execution'));
expect('manual html coverage includes F247 within current range', /Cobertura de versiones: v1 - F(24[7-9]|25[0-9])/.test(html));
expect('manual user documents F238-F247', manual.includes('F238-F247'));
expect('manual versions documents F238-F247', versions.includes('F238-F247'));
expect('changelog documents F238-F247', changelog.includes('F238-F247'));
expect('control changes documents F238-F247', control.includes('F238-F247'));
expect('package exposes prepare script', pkg.scripts?.['prepare:f238-f247:release-execution'] === 'node scripts/f238-f247-release-execution.mjs');
expect('package exposes test script', pkg.scripts?.['test:f238-f247:release-execution'] === 'node scripts/check-f238-f247-release-execution-contracts.mjs');

if (output) {
  expect('output status ready', output.status === 'ready');
  expect('output has ten phases', output.phases?.length === 10);
  expect('output has frontend/fullstack decision', output.deployDecision?.frontend === 'ready-after-static-smoke' && output.deployDecision?.fullstack === 'requires-db-live-restore-probe');
}

if (failures.length) {
  console.error('F238-F247 release execution contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F238-F247 release execution contracts passed.');
