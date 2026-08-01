import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredMarkers = [
  ['src/pages/ShieldingDesigner.tsx', 'e2e-open-medical-3d'],
  ['src/sections/dialogs/MemoriaAIWizard.tsx', 'f409-output-surface-integration-memoria'],
  ['src/sections/dialogs/EvidencePackDialog.tsx', 'f409-output-surface-integration-evidence'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f409-f408-unity-scene-surface'],
  ['e2e/f410-output-surfaces.spec.ts', 'radshield-mx.f410.output-surface-qa.v1'],
  ['e2e/f410-output-surfaces.spec.ts', 'f410_output_surface_qa.json'],
  ['package.json', 'prepare:f410:output-surface-qa'],
  ['package.json', 'test:f410:output-surface-qa'],
  ['package.json', 'test:f410:output-surface-qa:e2e'],
  ['CHANGELOG.md', 'F410'],
  ['MANUAL_VERSIONES_v50.md', 'F410'],
  ['MANUAL_USUARIO_v99.md', 'F410'],
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
  console.error('F410 output surface QA audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F410 output surface QA audit passed.');
