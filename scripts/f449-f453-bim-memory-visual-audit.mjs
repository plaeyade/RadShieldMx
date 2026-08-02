import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'radshield-mx.f449-f453.bim-memory-visual.v1'],
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'F449CalculationTraceBinding'],
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'F450CitationEvidenceBinding'],
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'F451VisualAdaptation'],
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'F452BimGraphicPanel'],
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'F453ReleaseHandoff'],
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'visible-vs-real-room'],
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'every-wall-has-job'],
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'bim-ribbon-frame'],
  ['src/lib/f449ToF453BimMemoryVisual.ts', 'mep-coordination'],
  ['src/sections/CanvasArea.tsx', 'buildF449ToF453BimMemoryVisual'],
  ['src/sections/CanvasArea.tsx', 'f449-f453-bim-memory-visual'],
  ['src/sections/CanvasArea.tsx', 'f451-bim-visual-board'],
  ['src/sections/CanvasArea.tsx', 'f449-trace-bindings'],
  ['src/sections/CanvasArea.tsx', 'f450-citation-bindings'],
  ['src/sections/CanvasArea.tsx', 'f451-visual-adaptations'],
  ['src/sections/CanvasArea.tsx', 'f452-graphic-panels'],
  ['src/sections/CanvasArea.tsx', 'f453-release-handoff'],
  ['src/sections/CanvasArea.tsx', 'f449-f453-bim-memory-visual-row'],
  ['e2e/f449-f453-bim-memory-visual.spec.ts', 'bim-memory-visual-ui-ready'],
  ['CHANGELOG.md', 'F449-F453'],
  ['MANUAL_VERSIONES_v50.md', 'F449-F453'],
  ['MANUAL_USUARIO_v99.md', 'F449-F453'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F449-F453 BIM memory visual'],
  ['package.json', 'prepare:f449-f453:bim-memory'],
  ['package.json', 'test:f449-f453:bim-memory'],
  ['package.json', 'test:f449-f453:bim-memory:e2e'],
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

if (failures.length) {
  console.error('F449-F453 BIM memory visual audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F449-F453 BIM memory visual audit passed.');
