import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f317_f323_medical_3d_release_line/f317_f323_medical_3d_release_line.json'));
const pkg = JSON.parse(read('package.json'));
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('Release line status', manifest.status === 'f317-f323-release-line-ready');
expect('Seven phases present', Array.isArray(manifest.phases) && manifest.phases.length === 7);
expect('Modalities x modes', manifest.modalityCoverage?.combinations === 18);
expect('WASD enhanced in manifest', manifest.wasdImprovements?.some((item) => item.includes('Shift')) && manifest.wasdImprovements?.some((item) => item.includes('R/F')));
expect('WASD enhanced in dialog', dialog.includes("keys.current.has('shift')") && dialog.includes("keys.current.has('control')") && dialog.includes('THREE.MathUtils.clamp'));
expect('Babylon blocker explicit', manifest.blockers?.some((item) => item.includes('EACCES')));
expect('Package scripts present', pkg.scripts?.['prepare:f317-f323:medical-3d-release-line'] === 'node scripts/f317-f323-medical-3d-release-line.mjs' && pkg.scripts?.['test:f317-f323:medical-3d-release-line'] === 'node scripts/check-f317-f323-medical-3d-release-line-contracts.mjs');
expect('Docs updated', update.includes('F317-F323 Medical 3D release line') && changelog.includes('F317-F323') && versions.includes('F317-F323') && manual.includes('Addendum F317-F323'));

if (failures.length) {
  console.error('F317-F323 Medical 3D release line contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F317-F323 Medical 3D release line contracts passed.');
