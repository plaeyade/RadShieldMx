import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'src/lib/f164ClinicalProjectMap.ts',
  'src/components/ClinicalProjectMap.tsx',
  'scripts/f165-clinical-outputs-closure.mjs',
  'outputs/f165_clinical_outputs_closure/f165_clinical_outputs_closure.json',
  'outputs/fase_165_clinical_outputs_closure.md',
  'package.json',
];

const tokens = [
  ['src/lib/f164ClinicalProjectMap.ts', 'roomClassifications'],
  ['src/lib/f164ClinicalProjectMap.ts', 'flowRoutes'],
  ['src/lib/f164ClinicalProjectMap.ts', 'syncTargets'],
  ['src/lib/f164ClinicalProjectMap.ts', 'visualExports'],
  ['src/lib/f164ClinicalProjectMap.ts', 'buildF164ClinicalMapSvg'],
  ['src/lib/f164ClinicalProjectMap.ts', 'buildF164ClinicalMapExportPlan'],
  ['src/components/ClinicalProjectMap.tsx', 'onNodeSelect'],
  ['src/components/ClinicalProjectMap.tsx', 'SVG bytes'],
  ['src/components/ClinicalProjectMap.tsx', 'OCR/salas'],
  ['scripts/f165-clinical-outputs-closure.mjs', 'png-export-hook'],
  ['scripts/f165-clinical-outputs-closure.mjs', 'ocr-room-classifier'],
  ['scripts/f165-clinical-outputs-closure.mjs', 'clinical-flow-arrows'],
  ['scripts/f165-clinical-outputs-closure.mjs', '2d-3d-report-sync'],
  ['package.json', 'prepare:f165:clinical-outputs'],
  ['package.json', 'test:f165:clinical-outputs'],
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const [file, token] of tokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing token file ${file}`);
    continue;
  }
  if (!fs.readFileSync(full, 'utf8').includes(token)) failures.push(`Missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f165_clinical_outputs_closure', 'f165_clinical_outputs_closure.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F165') failures.push('F165 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.clinical-outputs-closure.f165.v1') failures.push('F165 schema mismatch');
  if (manifest.status !== 'clinical-outputs-ready') failures.push('F165 not ready');
  for (const id of ['png-export-hook', 'ocr-room-classifier', 'clinical-flow-arrows', '2d-3d-report-sync']) {
    if (!manifest.closedPendings?.some((item) => item.id === id && item.status === 'implemented')) {
      failures.push(`F165 missing closed pending ${id}`);
    }
  }
}

if (failures.length) {
  console.error('F165 clinical outputs closure contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F165 clinical outputs closure contracts OK.');
