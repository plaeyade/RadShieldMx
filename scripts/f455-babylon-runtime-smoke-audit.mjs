import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/medical3D/babylonRuntimeSmoke.ts', 'radshield-mx.medical3d.babylon-runtime-smoke.f455.v1'],
  ['src/lib/medical3D/babylonRuntimeSmoke.ts', 'PBR concrete shielding shell'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f455-babylon-runtime-smoke'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', '@babylonjs/core'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f455-babylon-runtime-canvas'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'runtime-smoke-ready'],
  ['e2e/f455-babylon-runtime-smoke.spec.ts', 'f455-babylon-runtime-smoke'],
  ['CHANGELOG.md', 'F455'],
  ['MANUAL_VERSIONES_v50.md', 'F455'],
  ['MANUAL_USUARIO_v99.md', 'F455'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F455 Babylon runtime smoke'],
  ['package.json', 'prepare:f455:babylon-runtime'],
  ['package.json', 'test:f455:babylon-runtime'],
  ['package.json', 'test:f455:babylon-runtime:e2e'],
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

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dependencies = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
for (const dependency of ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/materials', '@babylonjs/gui', 'react-unity-webgl']) {
  if (!dependencies[dependency]) failures.push(`package.json: missing dependency ${dependency}`);
}

const outputDir = path.join(root, 'outputs', 'f455_babylon_runtime_smoke');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'f455_babylon_runtime_smoke_audit.json'),
  `${JSON.stringify({
    schema: 'radshield-mx.f455.babylon-runtime-smoke-audit.v1',
    generatedAt: new Date().toISOString(),
    status: failures.length ? 'failed' : 'passed',
    checks: checks.map(([relativePath, marker]) => ({ relativePath, marker })),
    dependencyGate: {
      babylonCore: dependencies['@babylonjs/core'],
      babylonLoaders: dependencies['@babylonjs/loaders'],
      babylonMaterials: dependencies['@babylonjs/materials'],
      babylonGui: dependencies['@babylonjs/gui'],
      reactUnityWebgl: dependencies['react-unity-webgl'],
    },
    recommendation: 'Babylon se valida como preview aislado; Three/R3F sigue como renderer principal hasta QA de paridad.',
  }, null, 2)}\n`,
  'utf8',
);

if (failures.length) {
  console.error('F455 Babylon runtime smoke audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F455 Babylon runtime smoke audit passed.');
