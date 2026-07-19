import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f208CanvasReportingLayer.ts',
  'src/sections/CanvasArea.tsx',
  'src/sections/dialogs/MemoriaAIWizard.tsx',
  'src/sections/dialogs/PdfReportDialog.tsx',
  'src/sections/dialogs/EvidencePackDialog.tsx',
  'scripts/check-f208-canvas-reporting-layer-contracts.mjs',
  'scripts/check-f207-functional-app-qa-smoke.mjs',
  'scripts/check-f199-output-smoke.mjs',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');

for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');

for (const token of [
  'F208',
  'buildF208CanvasReportingLayer',
  'canvas-reporting-layer-ready',
  'f208-canvas-reporting-layer',
  'f208-canvas-reporting-memoria',
  'f208-canvas-reporting-pdf',
  'f208-canvas-reporting-evidence',
  'test:f208:canvas-reporting',
  'Canvas Reporting Layer',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const item of ['floorplan', 'dimensions', 'layers', 'equipment', 'heatmap', 'exports']) {
  if (!joined.includes(`id: '${item}'`)) failures.push(`Missing F208 report item: ${item}`);
}

if (failures.length) {
  console.error('F208 canvas reporting layer contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F208 canvas reporting layer contracts OK.');
