import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredMarkers = [
  ['src/lib/f415BimMepCoordination.ts', 'radshield-mx.f415.bim-mep-coordination.v1'],
  ['src/lib/f415BimMepCoordination.ts', 'IfcDuctSegment'],
  ['src/lib/f415BimMepCoordination.ts', 'IfcFlowSegment'],
  ['src/lib/f415BimMepCoordination.ts', 'IfcCableCarrierSegment'],
  ['src/lib/f415BimMepCoordination.ts', 'IfcOpeningElement'],
  ['src/lib/f415BimMepCoordination.ts', 'penetration-register'],
  ['src/lib/f415BimMepCoordination.ts', 'mep-clash'],
  ['src/lib/f415BimMepCoordination.ts', 'structural-load'],
  ['src/sections/CanvasArea.tsx', 'buildF415BimMepCoordinationPlan'],
  ['src/sections/CanvasArea.tsx', 'f415-bim-mep-coordination'],
  ['CHANGELOG.md', 'F415'],
  ['MANUAL_VERSIONES_v50.md', 'F415'],
  ['MANUAL_USUARIO_v99.md', 'F415'],
  ['package.json', 'prepare:f415:bim-mep'],
  ['package.json', 'test:f415:bim-mep'],
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
  console.error('F415 BIM MEP coordination audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F415 BIM MEP coordination audit passed.');
