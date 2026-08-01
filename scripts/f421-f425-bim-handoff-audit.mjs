import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f421ToF425BimHandoff.ts', 'radshield-mx.f421-f425.bim-handoff.v1'],
  ['src/lib/f421ToF425BimHandoff.ts', 'rendererDeepTouchpoint'],
  ['src/lib/f421ToF425BimHandoff.ts', 'after-f425'],
  ['src/lib/f421ToF425BimHandoff.ts', 'F421BimVisualExport'],
  ['src/lib/f421ToF425BimHandoff.ts', 'F422BimIntakeRoute'],
  ['src/lib/f421ToF425BimHandoff.ts', 'F423BimNormalizationMap'],
  ['src/lib/f421ToF425BimHandoff.ts', 'F424ProductSpecRecord'],
  ['src/lib/f421ToF425BimHandoff.ts', 'F425BimHandoffDeliverable'],
  ['src/sections/CanvasArea.tsx', 'buildF421ToF425BimHandoffPlan'],
  ['src/sections/CanvasArea.tsx', 'f421-visual-export-bim'],
  ['src/sections/CanvasArea.tsx', 'f422-intake-pipeline'],
  ['src/sections/CanvasArea.tsx', 'f423-normalization-map'],
  ['src/sections/CanvasArea.tsx', 'f424-product-spec-library'],
  ['src/sections/CanvasArea.tsx', 'f425-bim-handoff'],
  ['CHANGELOG.md', 'F421-F425'],
  ['MANUAL_VERSIONES_v50.md', 'F421-F425'],
  ['MANUAL_USUARIO_v99.md', 'F421-F425'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F421-F425 BIM handoff'],
  ['package.json', 'prepare:f421-f425:bim-handoff'],
  ['package.json', 'test:f421-f425:bim-handoff'],
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
  console.error('F421-F425 BIM handoff audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F421-F425 BIM handoff audit passed.');
