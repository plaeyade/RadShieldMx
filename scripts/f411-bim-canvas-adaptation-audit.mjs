import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredMarkers = [
  ['src/lib/f411BimCanvasMethodology.ts', 'radshield-mx.f411.bim-canvas-methodology.v1'],
  ['src/lib/f411BimCanvasMethodology.ts', 'bimDataNeeds'],
  ['src/sections/CanvasArea.tsx', 'f411-bim-ribbon'],
  ['src/sections/CanvasArea.tsx', 'f411-bim-project-manager'],
  ['src/sections/CanvasArea.tsx', 'f411-bim-navigation-rail'],
  ['src/sections/CanvasArea.tsx', 'f411-bim-methodology-card'],
  ['e2e/f411-bim-canvas.spec.ts', 'radshield-mx.f411.bim-canvas-ui.v1'],
  ['package.json', 'prepare:f411:bim-canvas'],
  ['package.json', 'test:f411:bim-canvas'],
  ['package.json', 'test:f411:bim-canvas:e2e'],
  ['CHANGELOG.md', 'F411'],
  ['MANUAL_VERSIONES_v50.md', 'F411'],
  ['MANUAL_USUARIO_v99.md', 'F411'],
];

const failures = [];

for (const [relativePath, marker] of requiredMarkers) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath}: missing file`);
    continue;
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  if (!text.includes(marker)) failures.push(`${relativePath}: missing marker "${marker}"`);
}

if (failures.length) {
  console.error('F411 BIM canvas adaptation audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F411 BIM canvas adaptation audit passed.');
