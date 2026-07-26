import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f307_f309_3d_engine_release/f307_f309_3d_engine_release.json'));
const strategy = read('src/lib/medical3D/renderStrategy.ts');
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const preview = read('outputs/f307_f309_3d_engine_release/f307_f309_3d_engine_strategy_preview.html');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F307-F309 ready', manifest.status === '3d-engine-release-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('Three active', strategy.includes("id: 'three-r3f'") && strategy.includes("status: 'active'"));
expect('Babylon adapter ready', strategy.includes("id: 'babylon-pbr-webgpu-webxr'") && strategy.includes("status: 'adapter-ready'"));
expect('Unity deferred final', strategy.includes("id: 'unity-webgl-external'") && strategy.includes("status: 'deferred'"));
expect('Dialog selector exists', dialog.includes('f307-f309-render-engine-selector') && dialog.includes('Exportar handoff 3D'));
expect('Preview explains order', preview.includes('Three.js / R3F') && preview.includes('Babylon PBR/WebGPU/WebXR') && preview.includes('Unity WebGL'));
expect('Docs updated', update.includes('F307-F309 3D engine release') && changelog.includes('F307-F309') && versions.includes('F307-F309') && manual.includes('Addendum F307-F309'));
expect('Package scripts F307-F309', pkg.scripts?.['prepare:f307-f309:3d-engine-release'] === 'node scripts/f307-f309-3d-engine-release.mjs' && pkg.scripts?.['test:f307-f309:3d-engine-release'] === 'node scripts/check-f307-f309-3d-engine-release-contracts.mjs');

if (failures.length) {
  console.error('F307-F309 3D engine release contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F307-F309 3D engine release contracts passed.');
