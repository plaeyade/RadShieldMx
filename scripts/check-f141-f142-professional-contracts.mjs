import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const files = [
  'src/lib/f141CanvasProfessionalPolish.ts',
  'src/lib/f142MemoriaIaMaterialEvidence.ts',
  'src/sections/CanvasArea.tsx',
  'src/sections/dialogs/MemoriaAIWizard.tsx',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'scripts/f142-memoria-material-evidence.mjs',
  'outputs/f142_memoria_material_evidence/f142_memoria_material_evidence.json',
  'outputs/fase_142_memoria_material_evidence.md',
  'package.json',
];

const read = (file) => readFileSync(file, 'utf8');
for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const canvas = existsSync('src/sections/CanvasArea.tsx') ? read('src/sections/CanvasArea.tsx') : '';
for (const token of ['buildF141ProfessionalCanvasSummary', 'f141-professional-canvas-panel', 'f141-material-evidence-chip']) {
  if (!canvas.includes(token)) failures.push(`CanvasArea missing ${token}`);
}

const memoria = existsSync('src/sections/dialogs/MemoriaAIWizard.tsx') ? read('src/sections/dialogs/MemoriaAIWizard.tsx') : '';
for (const token of ['buildF142MemoriaIaMaterialEvidence', 'f142-material-evidence-memoria', 'EVIDENCIA MATERIAL F142']) {
  if (!memoria.includes(token)) failures.push(`MemoriaAIWizard missing ${token}`);
}

const update = existsSync('src/sections/dialogs/UpdateAppDialog.tsx') ? read('src/sections/dialogs/UpdateAppDialog.tsx') : '';
for (const token of ['buildF141ProfessionalCanvasSummary', 'buildF142MemoriaIaMaterialEvidence', 'f142-memoria-material-evidence']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing ${token}`);
}

const report = existsSync('outputs/f142_memoria_material_evidence/f142_memoria_material_evidence.json')
  ? JSON.parse(read('outputs/f142_memoria_material_evidence/f142_memoria_material_evidence.json'))
  : null;
if (report) {
  if (report.status !== 'ready') failures.push(`F142 report expected ready, got ${report.status}`);
  if (Number(report.materialChunks) !== 111) failures.push(`F142 expected 111 material chunks, got ${report.materialChunks}`);
  if (Number(report.ocrPending) !== 0) failures.push(`F142 expected zero OCR pending, got ${report.ocrPending}`);
}

const pkg = existsSync('package.json') ? read('package.json') : '';
for (const token of ['prepare:f142:memoria-material', 'test:f142:professional']) {
  if (!pkg.includes(token)) failures.push(`package.json missing ${token}`);
}

if (failures.length > 0) {
  console.error('F141/F142 professional contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F141/F142 professional contracts OK.');
