import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f314_babylon_runtime_loader/f314_babylon_runtime_loader.json'));
const runtime = read('src/lib/medical3D/babylonRuntimeLoader.ts');
const adapter = read('src/lib/medical3D/babylonAdapter.ts');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F314 ready', manifest.status === 'babylon-runtime-loader-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('Runtime loader present', runtime.includes('loadBabylonRuntime') && runtime.includes('@vite-ignore'));
expect('Fallback preserved', runtime.includes("fallbackEngine: 'three-r3f'"));
expect('Runtime status type exists', adapter.includes('BabylonRuntimeStatus'));
expect('Install policy recorded', manifest.installAttempt?.attemptedCommand === 'npm install @babylonjs/core @babylonjs/loaders');
expect('Docs updated', update.includes('F314 Babylon runtime loader') && changelog.includes('F314') && versions.includes('F314') && manual.includes('Addendum F314'));
expect('Package scripts F314', pkg.scripts?.['prepare:f314:babylon-runtime-loader'] === 'node scripts/f314-babylon-runtime-loader.mjs' && pkg.scripts?.['test:f314:babylon-runtime-loader'] === 'node scripts/check-f314-babylon-runtime-loader-contracts.mjs');

if (failures.length) {
  console.error('F314 Babylon runtime loader contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F314 Babylon runtime loader contracts passed.');
