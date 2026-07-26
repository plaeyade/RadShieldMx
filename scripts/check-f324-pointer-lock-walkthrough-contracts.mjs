import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f324_pointer_lock_walkthrough/f324_pointer_lock_walkthrough.json'));
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F324 ready', manifest.status === 'pointer-lock-walkthrough-ready');
expect('Pointer lock source checks pass', Object.values(manifest.sourceChecks).every(Boolean));
expect('Opt-in UI present', dialog.includes('f324-pointer-lock-control') && dialog.includes('Mouse-look'));
expect('Workbench click contract', dialog.includes('f324-pointer-lock-workbench') && dialog.includes('handleCanvasPointerLock'));
expect('Mouse movement contract', dialog.includes('movementX') && dialog.includes('movementY'));
expect('Room bounds retained', dialog.includes('Limites de sala activos') && dialog.includes('THREE.MathUtils.clamp'));
expect('Package scripts F324', pkg.scripts?.['prepare:f324:pointer-lock-walkthrough'] === 'node scripts/f324-pointer-lock-walkthrough.mjs' && pkg.scripts?.['test:f324:pointer-lock-walkthrough'] === 'node scripts/check-f324-pointer-lock-walkthrough-contracts.mjs');
expect('Docs updated', update.includes('F324 Pointer-lock walkthrough') && changelog.includes('F324') && versions.includes('F324') && manual.includes('Addendum F324'));

if (failures.length) {
  console.error('F324 pointer-lock walkthrough contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F324 pointer-lock walkthrough contracts passed.');
