import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['src/lib/medical3D/f459F463VisualStack.ts', 'radshield-mx.medical3d.visual-stack.f459-f463.v1'],
  ['src/lib/medical3D/pbrMaterialDatabase.ts', 'radshield-mx.medical3d.pbr-material-db.f461-f463.v1'],
  ['src/lib/medical3D/pbrMaterialDatabase.ts', 'TM/NIPOLL bloque HD'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f459-f463-visual-stack'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f459-f460-unity-bridge-summary'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f461-photoreal-walkthrough-preset'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f462-pbr-material-gallery'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f463-update-pbr-db'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f463-wasd-visual-guide'],
  ['e2e/f459-f463-visual-stack.spec.ts', 'f462-pbr-material-gallery'],
  ['CHANGELOG.md', 'F459-F463'],
  ['MANUAL_VERSIONES_v50.md', 'F459-F463'],
  ['MANUAL_USUARIO_v99.md', 'F459-F463'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F459-F463 visual stack'],
  ['package.json', 'prepare:f459-f463:visual-stack'],
  ['package.json', 'test:f459-f463:visual-stack'],
  ['package.json', 'test:f459-f463:visual-stack:e2e'],
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

const outputDir = path.join(root, 'outputs', 'f459_f463_visual_stack');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'f459_f463_visual_stack_audit.json'),
  `${JSON.stringify({
    schema: 'radshield-mx.f459-f463.visual-stack-audit.v1',
    generatedAt: new Date().toISOString(),
    status: failures.length ? 'failed' : 'passed',
    checks: checks.map(([relativePath, marker]) => ({ relativePath, marker })),
    boundary: 'Visual stack is screenshot/evidence metadata; calculation/RAG sources remain authoritative for signed reports.',
  }, null, 2)}\n`,
  'utf8',
);

if (failures.length) {
  console.error('F459-F463 visual stack audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F459-F463 visual stack audit passed.');
