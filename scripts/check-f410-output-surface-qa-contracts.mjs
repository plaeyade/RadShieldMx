import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  {
    file: 'e2e/f410-output-surfaces.spec.ts',
    markers: [
      'bootWorkspace',
      'e2e-open-memoria-ai',
      'f409-output-surface-integration-memoria',
      'e2e-open-evidence-pack',
      'f409-output-surface-integration-evidence',
      'e2e-open-medical-3d',
      'f409-f408-unity-scene-surface',
      'f410_output_surface_qa.json',
    ],
  },
  {
    file: 'src/pages/ShieldingDesigner.tsx',
    markers: ['e2e-open-medical-3d', "open('medicalFloorPlan3D')"],
  },
  {
    file: 'src/sections/dialogs/MemoriaAIWizard.tsx',
    markers: ['f409-output-surface-integration-memoria', 'F409 salidas reales F405-F408'],
  },
];

const failures = [];

for (const check of checks) {
  const fullPath = path.join(root, check.file);
  const text = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
  for (const marker of check.markers) {
    if (!text.includes(marker)) failures.push(`${check.file}: missing "${marker}"`);
  }
}

if (failures.length) {
  console.error('F410 contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F410 output surface QA contracts passed.');
