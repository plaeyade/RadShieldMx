import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredMarkers = [
  ['src/lib/f411BimCanvasMethodology.ts', 'F412BimEntityRow'],
  ['src/lib/f411BimCanvasMethodology.ts', 'entityCatalog'],
  ['src/lib/f411BimCanvasMethodology.ts', 'RS_RequiredThickness'],
  ['src/lib/f411BimCanvasMethodology.ts', 'DB/API versionada'],
  ['src/sections/CanvasArea.tsx', 'f412-bim-entity-catalog'],
  ['src/sections/CanvasArea.tsx', 'f412-bim-rs-parameters'],
  ['src/sections/CanvasArea.tsx', 'f412-bim-roundtrip-gates'],
  ['e2e/f411-bim-canvas.spec.ts', 'f412-bim-entity-catalog'],
  ['CHANGELOG.md', 'F412'],
  ['MANUAL_VERSIONES_v50.md', 'F412'],
  ['MANUAL_USUARIO_v99.md', 'F412'],
  ['package.json', 'prepare:f412:bim-methodology'],
  ['package.json', 'test:f412:bim-methodology'],
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
  console.error('F412 BIM methodology implementation audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F412 BIM methodology implementation audit passed.');
