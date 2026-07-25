import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f267-real-case-smoke-execution.mjs'], { stdio: 'inherit' });

const files = [
  'src/lib/f267RealCaseSmokeExecution.ts',
  'scripts/f267-real-case-smoke-execution.mjs',
  'scripts/check-f267-real-case-smoke-execution-contracts.mjs',
  'outputs/f267_real_case_smoke_execution/f267_real_case_smoke_execution.json',
  'outputs/f267_real_case_smoke_execution/real_case_smoke_deviation_log.csv',
  'outputs/fase_267_real_case_smoke_execution.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_USUARIO_v99.md',
  'MANUAL_VERSIONES_v50.md',
  'CONTROL_DE_CAMBIOS_v99.md',
  'public/manual_usuario.html',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');
for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
const pkg = existsSync('package.json') ? JSON.parse(read('package.json')) : {};
const manifest = existsSync(files[3]) ? JSON.parse(read(files[3])) : null;
const csv = existsSync(files[4]) ? read(files[4]) : '';

function expect(label, condition) {
  if (!condition) failures.push(label);
}

for (const token of [
  'F267',
  'radshield-mx.real-case-smoke-execution.f267.v1',
  'buildF267RealCaseSmokeExecution',
  'summarizeF267RealCaseSmokeExecution',
  'ct-body-public-control',
  'linac-6mv-primary-public',
  'pet-f18-uptake-room',
  'synthetic-F264-baseline-replace-with-signed-memory',
  'Replace synthetic baseline values',
  'real_case_smoke_deviation_log.csv',
  'pending-run-in-app-or-TS-harness',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('package exposes prepare script', pkg.scripts?.['prepare:f267:real-case-smoke'] === 'node scripts/f267-real-case-smoke-execution.mjs');
expect('package exposes test script', pkg.scripts?.['test:f267:real-case-smoke'] === 'node scripts/check-f267-real-case-smoke-execution-contracts.mjs');
expect('CSV has DX row', csv.includes('ct-body-public-control') && csv.includes('"DX"'));
expect('CSV has TX row', csv.includes('linac-6mv-primary-public') && csv.includes('"TX"'));
expect('CSV has NM row', csv.includes('pet-f18-uptake-room') && csv.includes('"NM"'));
expect('CSV avoids misleading zero-only baseline', csv.includes('pending-run-in-app-or-TS-harness') || !csv.includes('"0.00 mm","0.00 mm"'));
if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.real-case-smoke-execution.f267.v1');
  expect('manifest ready', manifest.status === 'ready-for-real-case-replacement');
  expect('manifest has no open blocker/major', manifest.openBlockerMajorCount === 0);
  expect('manifest declares numeric payload availability', typeof manifest.f264ResultsAvailable === 'boolean');
}

if (failures.length) {
  console.error('F267 real case smoke execution contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F267 real case smoke execution contracts passed.');
