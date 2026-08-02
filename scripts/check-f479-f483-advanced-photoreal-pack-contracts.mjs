import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'src/lib/medical3D/advancedPhotorealPack.ts',
  'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
  'public/medical3d/photoreal/README_PHOTOREAL_ASSETS.md',
];
const haystack = files.map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')).join('\n');
const markers = [
  'AdvancedPhotorealPackContract',
  'F479',
  'F480',
  'F481',
  'F482',
  'F483',
  'public/medical3d/photoreal',
  'clinical_softbox.hdr',
  'radiation-warning',
  'penetration-tag',
  'f479-f483-advanced-photoreal-pack',
  'f479-photoreal-texture-plan',
  'f480-photoreal-hdri-plan',
  'f481-photoreal-decal-plan',
  'f482-photoreal-render-presets',
  'f483-export-photoreal-pack',
  'visual evidence only',
];

const failures = markers.filter((marker) => !haystack.includes(marker));
if (failures.length) {
  console.error('F479-F483 advanced photoreal pack contracts failed:');
  for (const failure of failures) console.error(`- missing marker "${failure}"`);
  process.exit(1);
}

console.log('F479-F483 advanced photoreal pack contracts passed.');
