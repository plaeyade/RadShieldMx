import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['src/lib/medical3D/babylonDeepRuntime.ts', 'radshield-mx.medical3d.babylon-deep-runtime.f470-f474.v1'],
  ['src/lib/medical3D/babylonDeepRuntime.ts', 'deep-runtime-ready'],
  ['src/lib/medical3D/babylonDeepRuntime.ts', 'cameraModes'],
  ['src/lib/medical3D/babylonDeepRuntime.ts', 'Evidence Pack'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f470-f474-babylon-deep-runtime'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f471-babylon-pick-hud'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f472-babylon-camera-modes'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f473-babylon-overlays'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'registerPick'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'ActionManager.OnPickTrigger'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'buildBabylonDeepRuntimeContract'],
  ['e2e/f470-f474-babylon-deep-runtime.spec.ts', 'f470-f474-babylon-deep-runtime'],
  ['CHANGELOG.md', 'F470-F474'],
  ['MANUAL_VERSIONES_v50.md', 'F470-F474'],
  ['MANUAL_USUARIO_v99.md', 'F470-F474'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F470-F474 Babylon profundo'],
  ['package.json', 'prepare:f470-f474:babylon-deep'],
  ['package.json', 'test:f470-f474:babylon-deep'],
  ['package.json', 'test:f470-f474:babylon-deep:e2e'],
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

const outputDir = path.join(root, 'outputs', 'f470_f474_babylon_deep_runtime');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'f470_f474_babylon_deep_runtime_audit.json'),
  `${JSON.stringify({
    schema: 'radshield-mx.f470-f474.babylon-deep-runtime-audit.v1',
    generatedAt: new Date().toISOString(),
    status: failures.length ? 'failed' : 'passed',
    checks: checks.map(([relativePath, marker]) => ({ relativePath, marker })),
    releaseRule: 'Babylon deep runtime is interactive visual QA; Three/R3F remains production fallback until deep parity passes repeated smoke runs.',
  }, null, 2)}\n`,
  'utf8',
);

if (failures.length) {
  console.error('F470-F474 Babylon deep runtime audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F470-F474 Babylon deep runtime audit passed.');
