import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['src/lib/medical3D/babylonRuntimeSmoke.ts', 'radshield-mx.medical3d.babylon-parity-export.f456-f458.v1'],
  ['src/lib/medical3D/babylonRuntimeSmoke.ts', 'wallsFromScene'],
  ['src/lib/medical3D/babylonRuntimeSmoke.ts', 'targetFps'],
  ['src/lib/medical3D/babylonRuntimeSmoke.ts', 'Babylon export is visual evidence only'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f456-f458-babylon-parity-contract'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f457-babylon-performance-gate'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f458-babylon-export-png'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'scene.walls.forEach'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'scene.equipment.forEach'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'scene.zones.length'],
  ['e2e/f456-f458-babylon-parity-export.spec.ts', 'f458-babylon-export-png'],
  ['CHANGELOG.md', 'F456-F458'],
  ['MANUAL_VERSIONES_v50.md', 'F456-F458'],
  ['MANUAL_USUARIO_v99.md', 'F456-F458'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F456-F458 Babylon parity/export'],
  ['package.json', 'prepare:f456-f458:babylon-parity'],
  ['package.json', 'test:f456-f458:babylon-parity'],
  ['package.json', 'test:f456-f458:babylon-parity:e2e'],
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

const outputDir = path.join(root, 'outputs', 'f456_f458_babylon_parity_export');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'f456_f458_babylon_parity_export_audit.json'),
  `${JSON.stringify({
    schema: 'radshield-mx.f456-f458.babylon-parity-export-audit.v1',
    generatedAt: new Date().toISOString(),
    status: failures.length ? 'failed' : 'passed',
    checks: checks.map(([relativePath, marker]) => ({ relativePath, marker })),
    releaseRule: 'Babylon is a parity/export preview; Three/R3F remains production renderer until full scene parity and performance gates pass.',
  }, null, 2)}\n`,
  'utf8',
);

if (failures.length) {
  console.error('F456-F458 Babylon parity/export audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F456-F458 Babylon parity/export audit passed.');
