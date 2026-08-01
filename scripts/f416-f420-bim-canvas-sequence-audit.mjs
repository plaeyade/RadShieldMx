import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f416ToF420BimCanvasSequence.ts', 'radshield-mx.f416-f420.bim-canvas-sequence.v1'],
  ['src/lib/f416ToF420BimCanvasSequence.ts', 'MEPcontent'],
  ['src/lib/f416ToF420BimCanvasSequence.ts', 'ProdLib'],
  ['src/lib/f416ToF420BimCanvasSequence.ts', 'ARCAT'],
  ['src/lib/f416ToF420BimCanvasSequence.ts', 'RevitCity'],
  ['src/lib/f416ToF420BimCanvasSequence.ts', 'F417VisualObjectTemplate'],
  ['src/lib/f416ToF420BimCanvasSequence.ts', 'F418CutawayMetric'],
  ['src/lib/f416ToF420BimCanvasSequence.ts', 'F419SurfaceRoleAssignment'],
  ['src/lib/f416ToF420BimCanvasSequence.ts', 'F420ClashCandidate'],
  ['src/sections/CanvasArea.tsx', 'buildF416ToF420BimCanvasSequence'],
  ['src/sections/CanvasArea.tsx', 'f416-provider-registry'],
  ['src/sections/CanvasArea.tsx', 'f417-object-library'],
  ['src/sections/CanvasArea.tsx', 'f418-cutaway-metrics'],
  ['src/sections/CanvasArea.tsx', 'f419-surface-role-assignments'],
  ['src/sections/CanvasArea.tsx', 'f420-mep-clash-candidates'],
  ['CHANGELOG.md', 'F416-F420'],
  ['MANUAL_VERSIONES_v50.md', 'F416-F420'],
  ['MANUAL_USUARIO_v99.md', 'F416-F420'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F416-F420 BIM canvas sequence'],
  ['package.json', 'prepare:f416-f420:bim-canvas'],
  ['package.json', 'test:f416-f420:bim-canvas'],
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
  console.error('F416-F420 BIM canvas sequence audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F416-F420 BIM canvas sequence audit passed.');
