import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f265-real-app-testing-protocol.mjs'], { stdio: 'inherit' });

const files = [
  'src/lib/f265RealAppTestingProtocol.ts',
  'scripts/f265-real-app-testing-protocol.mjs',
  'scripts/check-f265-real-app-testing-protocol-contracts.mjs',
  'outputs/f265_real_app_testing_protocol/f265_real_app_testing_protocol.json',
  'outputs/fase_265_real_app_testing_protocol.md',
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

function expect(label, condition) {
  if (!condition) failures.push(label);
}

for (const token of [
  'F265',
  'radshield-mx.real-app-testing-protocol.f265.v1',
  'buildF265RealAppTestingProtocol',
  'summarizeF265RealAppTestingProtocol',
  'DX',
  'TX',
  'NM',
  'CY',
  'floorplan-scale-zone',
  'equipment-source',
  'material-selection',
  'calculation-evidence',
  'rag-report-export',
  'No clinical signed release',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('package exposes prepare script', pkg.scripts?.['prepare:f265:real-app-testing'] === 'node scripts/f265-real-app-testing-protocol.mjs');
expect('package exposes test script', pkg.scripts?.['test:f265:real-app-testing'] === 'node scripts/check-f265-real-app-testing-protocol-contracts.mjs');
if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.real-app-testing-protocol.f265.v1');
  expect('manifest has all profiles', ['DX', 'TX', 'NM', 'CY'].every((profile) => manifest.profiles?.includes(profile)));
  expect('manifest captures release rule', String(manifest.releaseRule || '').includes('DX/TX/NM'));
}

if (failures.length) {
  console.error('F265 real app testing protocol contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F265 real app testing protocol contracts passed.');
