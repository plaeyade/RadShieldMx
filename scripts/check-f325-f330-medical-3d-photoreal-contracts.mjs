import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f325_f330_medical_3d_photoreal/f325_f330_medical_3d_photoreal.json'));
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F325-F330 ready', manifest.status === 'three-r3f-photoreal-readiness-ready');
expect('Source checks pass', Object.values(manifest.sourceChecks).every(Boolean));
expect('Collision source present', dialog.includes('pointHitsWall') && dialog.includes('pointHitsEquipment') && dialog.includes('Colisiones'));
expect('PBR source present', dialog.includes('medicalPbrProfile') && dialog.includes('photorealWalkthrough'));
expect('Lighting source present', dialog.includes('lightingPresets') && dialog.includes('Luz inspeccion'));
expect('Visual evidence export present', dialog.includes('visualEvidence') && dialog.includes('Evidence Pack'));
expect('Asset pipeline export present', dialog.includes('assetPipeline') && dialog.includes('glb'));
expect(
  'Package scripts F325-F330',
  pkg.scripts?.['prepare:f325-f330:medical-3d-photoreal'] === 'node scripts/f325-f330-medical-3d-photoreal.mjs' &&
    pkg.scripts?.['test:f325-f330:medical-3d-photoreal'] === 'node scripts/check-f325-f330-medical-3d-photoreal-contracts.mjs',
);
expect(
  'Docs updated',
  update.includes('F325-F330 Medical 3D photoreal readiness') &&
    changelog.includes('F325-F330') &&
    versions.includes('F325-F330') &&
    manual.includes('Addendum F325-F330'),
);

if (failures.length) {
  console.error('F325-F330 Medical 3D photoreal contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F325-F330 Medical 3D photoreal contracts passed.');
