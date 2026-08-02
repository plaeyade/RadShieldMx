import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const assetRoot = path.join(root, 'public', 'medical3d', 'photoreal');
const checks = [
  ['src/lib/medical3D/advancedPhotorealPack.ts', 'radshield-mx.medical3d.advanced-photoreal-pack.f479-f483.v1'],
  ['src/lib/medical3D/advancedPhotorealPack.ts', 'clinical_softbox.hdr'],
  ['src/lib/medical3D/advancedPhotorealPack.ts', 'radiation-warning'],
  ['src/lib/medical3D/advancedPhotorealPack.ts', 'cinematic'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f479-f483-advanced-photoreal-pack'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f481-photoreal-decals'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f483-export-photoreal-pack'],
  ['public/medical3d/photoreal/README_PHOTOREAL_ASSETS.md', 'public/medical3d/photoreal/'],
  ['e2e/f479-f483-advanced-photoreal-pack.spec.ts', 'f479-f483-advanced-photoreal-pack'],
  ['CHANGELOG.md', 'F479-F483'],
  ['MANUAL_VERSIONES_v50.md', 'F479-F483'],
  ['MANUAL_USUARIO_v99.md', 'F479-F483'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F479-F483 fotorrealismo avanzado'],
  ['package.json', 'prepare:f479-f483:photoreal-pack'],
  ['package.json', 'test:f479-f483:photoreal-pack'],
  ['package.json', 'test:f479-f483:photoreal-pack:e2e'],
];

const failures = [];
for (const [relativePath, marker] of checks) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath}: missing file`);
    continue;
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  if (!text.includes(marker)) failures.push(`${relativePath}: missing marker "${marker}"`);
}

const localAssetFolders = ['hdri', 'textures', 'decals'].map((folder) => ({
  folder,
  exists: fs.existsSync(path.join(assetRoot, folder)),
}));
const outputDir = path.join(root, 'outputs', 'f479_f483_advanced_photoreal_pack');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'f479_f483_advanced_photoreal_pack_audit.json'),
  `${JSON.stringify({
    schema: 'radshield-mx.f479-f483.advanced-photoreal-pack-audit.v1',
    generatedAt: new Date().toISOString(),
    status: failures.length ? 'failed' : 'advanced-photoreal-pack-ready',
    assetRoot: path.relative(root, assetRoot).replace(/\\/g, '/'),
    localAssetFolders,
    checks: checks.map(([relativePath, marker]) => ({ relativePath, marker })),
    releaseRule: 'Procedural decals/HDRI are ready. Heavy HDRI/textures remain optional assets under public/medical3d/photoreal and must not replace technical material evidence.',
  }, null, 2)}\n`,
  'utf8',
);

if (failures.length) {
  console.error('F479-F483 advanced photoreal pack audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F479-F483 advanced photoreal pack audit passed.');
