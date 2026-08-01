import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'src/lib/f414BimVideoReference.ts');
const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

const markers = [
  'F414BimVideoReferencePattern',
  'F414BimVideoReferencePlan',
  'buildF414BimVideoReferencePlan',
  'sourceEvidence',
  'extractionNotes',
  'canvasApplication',
  'releaseRule',
  'mep-color-systems',
  'tool-palette',
  'shaded-with-edges',
];

const failures = markers.filter((marker) => !text.includes(marker));

const patternCount = (text.match(/id: '/g) ?? []).length;
if (patternCount < 6) failures.push(`expected at least 6 reference patterns, found ${patternCount}`);

if (failures.length) {
  console.error('F414 BIM video reference contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F414 BIM video reference contracts passed.');
