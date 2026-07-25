import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f257-f260-full-execution.mjs'], { stdio: 'pipe' });

const files = [
  'src/lib/f257ToF260FullExecution.ts',
  'src/lib/f125CalculationEvidenceGate.ts',
  'scripts/f257-f260-full-execution.mjs',
  'scripts/check-f257-f260-full-execution-contracts.mjs',
  'outputs/f257_f260_full_execution/f257_f260_full_execution.json',
  'outputs/fase_257_260_full_execution.md',
  '.env.example',
  '.env.staging-cad.example',
  'src/lib/featureFlags.ts',
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
  'F257-F260',
  'buildF257ToF260FullExecution',
  'buildF257ToF260FullExecutionSection',
  'CAD staging flag package',
  'Renderer/event controller v2 execution gate',
  'DWG external conversion provider boundary',
  'DB/fullstack production revisit gate',
  'not recommended; no rollback switch',
  'not-recommended-no-rollback-switch',
  'VITE_CANVAS_HIGH_RISK_CAD=true',
  'VITE_CANVAS_EVENT_CONTROLLER_V2=false',
  'blocked-by-external-provider',
  'blocked-by-db-live-gates',
  'RADSHIELD_ALLOW_DB_RESTORE_PROBE=1',
  'npm run test:f229:canvas-e2e',
  'npm run test:f204:canvas-dxf-recovery',
  'npm run test:f153:db-backup-restore',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('F125 includes F257-F260 execution section', joined.includes('buildF257ToF260FullExecutionSection'));
expect('Update Center documents F257-F260', joined.includes('F257-F260 Full execution'));
expect('staging env enables master CAD flag', read('.env.staging-cad.example').includes('VITE_CANVAS_HIGH_RISK_CAD=true'));
expect('staging env keeps event controller off initially', read('.env.staging-cad.example').includes('VITE_CANVAS_EVENT_CONTROLLER_V2=false'));
expect('production env keeps CAD flags disabled', read('.env.example').includes('VITE_CANVAS_HIGH_RISK_CAD=false') && read('.env.example').includes('VITE_CANVAS_EVENT_CONTROLLER_V2=false'));
expect('package exposes prepare script', pkg.scripts?.['prepare:f257-f260:full'] === 'node scripts/f257-f260-full-execution.mjs');
expect('package exposes test script', pkg.scripts?.['test:f257-f260:full'] === 'node scripts/check-f257-f260-full-execution-contracts.mjs');

if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.f257-f260.full-execution.v1');
  expect('manifest status', manifest.status === 'f257-f260-full-execution-ready');
  expect('manifest has four phases', manifest.phases?.length === 4);
  expect('F257 executed', manifest.phases?.some((phase) => phase.phase === 'F257' && phase.status === 'executed'));
  expect('F259 blocked safely', manifest.phases?.some((phase) => phase.phase === 'F259' && phase.status === 'blocked-by-external-provider'));
  expect('F260 blocked safely', manifest.phases?.some((phase) => phase.phase === 'F260' && phase.status === 'blocked-by-db-live-gates'));
}

if (failures.length) {
  console.error('F257-F260 full execution contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F257-F260 full execution contracts passed.');
