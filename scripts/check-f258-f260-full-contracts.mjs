import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/canvas/eventControllerV2.ts',
  'src/lib/dwgExternalProviderGate.ts',
  'scripts/f260-fullstack-db-gate.mjs',
  'src/lib/f257ToF260FullExecution.ts',
  '.env.staging-cad.example',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_USUARIO_v99.md',
  'MANUAL_VERSIONES_v50.md',
  'CONTROL_DE_CAMBIOS_v99.md',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');
for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
const pkg = existsSync('package.json') ? JSON.parse(read('package.json')) : {};

function expect(label, condition) {
  if (!condition) failures.push(label);
}

for (const token of [
  'getCanvasEventControllerV2Status',
  'routeCanvasEventV2',
  'route-to-stable-useCanvas',
  'VITE_CANVAS_EVENT_CONTROLLER_V2',
  'buildDwgExternalProviderContract',
  'nativeBrowserDwgSupport: false',
  'no-floorplan-mutation-on-failure',
  'f260_fullstack_db_gate',
  'RADSHIELD_ALLOW_DB_BACKUP',
  'RADSHIELD_ALLOW_DB_RESTORE_PROBE',
  'blocked-by-db-live-gates',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('package exposes F258-F260 contract test', pkg.scripts?.['test:f258-f260:full'] === 'node scripts/check-f258-f260-full-contracts.mjs');
expect('package exposes F260 DB gate', pkg.scripts?.['prepare:f260:db-gate'] === 'node scripts/f260-fullstack-db-gate.mjs');
expect('staging file enables CAD master flag', read('.env.staging-cad.example').includes('VITE_CANVAS_HIGH_RISK_CAD=true'));
expect('staging file keeps event controller off by default', read('.env.staging-cad.example').includes('VITE_CANVAS_EVENT_CONTROLLER_V2=false'));

if (failures.length) {
  console.error('F258-F260 full contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F258-F260 full contracts passed.');
