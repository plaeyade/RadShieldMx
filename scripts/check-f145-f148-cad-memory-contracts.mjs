import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/hooks/useCanvas.ts',
  'src/lib/f145CanvasCadProfessional.ts',
  'src/lib/f148MemoryProfileSelector.ts',
  'src/sections/CanvasArea.tsx',
  'src/sections/dialogs/MemoriaAIWizard.tsx',
  'outputs/f145_canvas_cad_professional/f145_canvas_cad_professional.json',
  'outputs/f148_memory_profile_selector/f148_memory_profile_selector.json',
  'package.json',
];

const read = (file) => readFileSync(file, 'utf8');
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const useCanvas = existsSync('src/hooks/useCanvas.ts') ? read('src/hooks/useCanvas.ts') : '';
for (const token of ['selection-lasso', 'intersection', 'pointInPolygon', 'segmentIntersection', 'lasso-select', 'inline-sidebar-edit']) {
  if (!useCanvas.includes(token)) failures.push(`useCanvas missing ${token}`);
}

const canvasArea = existsSync('src/sections/CanvasArea.tsx') ? read('src/sections/CanvasArea.tsx') : '';
for (const token of ['buildF145CanvasCadProfessionalSummary', 'f145-cad-professional-panel', 'f145-cad-${item.id}']) {
  if (!canvasArea.includes(token)) failures.push(`CanvasArea missing ${token}`);
}

const f145Lib = existsSync('src/lib/f145CanvasCadProfessional.ts') ? read('src/lib/f145CanvasCadProfessional.ts') : '';
for (const token of ['advanced-snapping', 'multi-lasso-selection', 'inline-editing', 'fine-undo-redo']) {
  if (!f145Lib.includes(token)) failures.push(`F145 lib missing ${token}`);
}

const memoria = existsSync('src/sections/dialogs/MemoriaAIWizard.tsx') ? read('src/sections/dialogs/MemoriaAIWizard.tsx') : '';
for (const token of ['buildF148MemoryProfileSelector', 'f148-memory-profile-selector', 'f148-memory-profile-select', 'GAMMA_KNIFE', 'LINAC', 'DIAGNOSTIC', 'NUCLEAR_MEDICINE']) {
  if (!memoria.includes(token)) failures.push(`MemoriaAIWizard missing ${token}`);
}

const f145 = existsSync(requiredFiles[5]) ? JSON.parse(read(requiredFiles[5])) : null;
if (f145) {
  if (f145.phase !== 'F145' || f145.status !== 'ready') failures.push('F145 report not ready');
  for (const token of ['Advanced snapping', 'Ctrl/Meta lasso selection', 'Inline sidebar edit']) {
    if (!f145.implemented.join(' ').includes(token)) failures.push(`F145 report missing ${token}`);
  }
}

const f148 = existsSync(requiredFiles[6]) ? JSON.parse(read(requiredFiles[6])) : null;
if (f148) {
  if (f148.phase !== 'F148' || f148.status !== 'ready') failures.push('F148 report not ready');
  for (const profile of ['DIAGNOSTIC', 'LINAC', 'GAMMA_KNIFE', 'BRAQUI_CO60', 'NUCLEAR_MEDICINE', 'CYCLOTRON']) {
    if (!f148.profiles.includes(profile)) failures.push(`F148 missing profile ${profile}`);
  }
  if (f148.modalityMapping?.dx !== 'DIAGNOSTIC') failures.push('F148 missing DX to DIAGNOSTIC mapping');
  if (f148.modalityMapping?.nm !== 'NUCLEAR_MEDICINE') failures.push('F148 missing NM to NUCLEAR_MEDICINE mapping');
}

const pkg = existsSync('package.json') ? read('package.json') : '';
for (const token of ['prepare:f145:canvas-cad', 'prepare:f148:memory-profile', 'test:f145-f148:cad-memory']) {
  if (!pkg.includes(token)) failures.push(`package.json missing ${token}`);
}

if (failures.length > 0) {
  console.error('F145/F148 CAD memory contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F145/F148 CAD memory contracts OK.');
