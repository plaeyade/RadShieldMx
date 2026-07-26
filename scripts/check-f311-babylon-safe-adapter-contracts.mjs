import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f311_babylon_safe_adapter/f311_babylon_safe_adapter.json'));
const adapter = read('src/lib/medical3D/babylonAdapter.ts');
const flags = read('src/lib/featureFlags.ts');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F311 ready', manifest.status === 'babylon-safe-adapter-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('Adapter contract exists', adapter.includes('buildBabylonAdapterContract') && adapter.includes('buildBabylonHandoff'));
expect('No runtime import', !adapter.includes("from '@babylonjs/core'") && !adapter.includes('from "@babylonjs/core"'));
expect('Required packages documented', adapter.includes('@babylonjs/core') && adapter.includes('@babylonjs/loaders'));
expect('Flags are explicit', flags.includes('medical3DBabylonAdapter') && flags.includes('VITE_MEDICAL_3D_BABYLON_ADAPTER') && flags.includes('VITE_MEDICAL_3D_BABYLON_RUNTIME'));
expect('Babylon not installed yet', !pkg.dependencies?.['@babylonjs/core'] && !pkg.devDependencies?.['@babylonjs/core']);
expect('Docs updated', update.includes('F311 Babylon safe adapter') && changelog.includes('F311') && versions.includes('F311') && manual.includes('Addendum F311'));
expect('Package scripts F311', pkg.scripts?.['prepare:f311:babylon-safe-adapter'] === 'node scripts/f311-babylon-safe-adapter.mjs' && pkg.scripts?.['test:f311:babylon-safe-adapter'] === 'node scripts/check-f311-babylon-safe-adapter-contracts.mjs');

if (failures.length) {
  console.error('F311 Babylon safe adapter contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F311 Babylon safe adapter contracts passed.');
