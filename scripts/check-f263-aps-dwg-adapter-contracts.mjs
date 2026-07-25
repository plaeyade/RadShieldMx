import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f263-aps-dwg-adapter.mjs'], { stdio: 'pipe' });

const files = [
  'src/lib/dwgApsDesignAutomationContract.ts',
  'api/lib/dwgApsDesignAutomationAdapter.ts',
  'api/cad-router.ts',
  'api/router.ts',
  'src/lib/f125CalculationEvidenceGate.ts',
  'scripts/f263-aps-dwg-adapter.mjs',
  'scripts/check-f263-aps-dwg-adapter-contracts.mjs',
  'outputs/f263_aps_dwg_adapter/f263_aps_dwg_adapter.json',
  'outputs/fase_263_aps_dwg_adapter.md',
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
  'F263',
  'radshield-mx.aps-dwg-adapter.f263.v1',
  'buildApsDwgAdapterContract',
  'getApsDwgEnvironmentStatus',
  'buildApsDwgConversionPlan',
  'cadRouter',
  'cad: cadRouter',
  'cad.apsDwgStatus',
  'cad.apsDwgPlan',
  'aps-design-automation',
  'dwg-upload-to-aps-workitem-to-dxf-to-existing-dxf-import',
  'frontendSecretsAllowed: false',
  'APS_CLIENT_ID',
  'APS_CLIENT_SECRET',
  'APS_BUCKET_KEY',
  'small-architectural-plan.dwg',
  'equipment-layout.dwg',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('package exposes prepare script', pkg.scripts?.['prepare:f263:aps-dwg'] === 'node scripts/f263-aps-dwg-adapter.mjs');
expect('package exposes test script', pkg.scripts?.['test:f263:aps-dwg'] === 'node scripts/check-f263-aps-dwg-adapter-contracts.mjs');

if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.aps-dwg-adapter.f263.v1');
  expect('manifest provider selected', manifest.provider?.selected === 'aps-design-automation');
  expect('manifest backend router', manifest.backend?.router === 'api/cad-router.ts');
  expect('manifest status is known', [
    'disabled',
    'adapter-ready-waiting-for-credentials-and-fixtures',
    'adapter-ready-waiting-for-fixtures',
    'adapter-ready-waiting-for-credentials',
    'adapter-ready-to-smoke',
  ].includes(manifest.status));
}

if (failures.length) {
  console.error('F263 APS DWG adapter contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F263 APS DWG adapter contracts passed.');
