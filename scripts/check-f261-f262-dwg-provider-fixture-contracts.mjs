import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f261-f262-dwg-provider-fixture.mjs'], { stdio: 'pipe' });

const files = [
  'src/lib/dwgProviderSelection.ts',
  'src/lib/dwgFixtureGate.ts',
  'src/lib/dwgExternalProviderGate.ts',
  'src/lib/f125CalculationEvidenceGate.ts',
  'scripts/f261-f262-dwg-provider-fixture.mjs',
  'scripts/check-f261-f262-dwg-provider-fixture-contracts.mjs',
  'fixtures/dwg/README.md',
  'outputs/f261_f262_dwg_provider_fixture/f261_f262_dwg_provider_fixture.json',
  'outputs/fase_261_262_dwg_provider_fixture.md',
  '.env.example',
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
const manifest = existsSync(files[7]) ? JSON.parse(read(files[7])) : null;
const pkg = existsSync('package.json') ? JSON.parse(read('package.json')) : {};

function expect(label, condition) {
  if (!condition) failures.push(label);
}

for (const token of [
  'F261-F262',
  'buildDwgProviderSelection',
  'summarizeDwgProviderSelection',
  'buildDwgFixtureGate',
  'summarizeDwgFixtureGate',
  'aps-design-automation',
  'oda-self-hosted',
  'cloudconvert-preview',
  'manual-dxf-fallback',
  'fixtures/dwg',
  'small-architectural-plan.dwg',
  'equipment-layout.dwg',
  'DWG_CONVERSION_PROVIDER',
  'APS_CLIENT_ID',
  'APS_CLIENT_SECRET',
  'DWG_CONVERSION_TIMEOUT_MS',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('F125 includes provider selection summary', joined.includes('summarizeDwgProviderSelection'));
expect('F125 includes fixture gate summary', joined.includes('summarizeDwgFixtureGate'));
expect('package exposes prepare script', pkg.scripts?.['prepare:f261-f262:dwg'] === 'node scripts/f261-f262-dwg-provider-fixture.mjs');
expect('package exposes test script', pkg.scripts?.['test:f261-f262:dwg'] === 'node scripts/check-f261-f262-dwg-provider-fixture-contracts.mjs');

if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.dwg-provider-fixture.f261-f262.v1');
  expect('manifest selected APS', manifest.recommendation?.primary === 'aps-design-automation');
  expect('manifest waits for fixtures', manifest.status === 'provider-selected-waiting-for-fixtures');
}

if (failures.length) {
  console.error('F261-F262 DWG provider/fixture contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F261-F262 DWG provider/fixture contracts passed.');
