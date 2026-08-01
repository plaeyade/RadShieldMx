import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  {
    file: 'src/lib/f413BimExecutionPlan.ts',
    markers: [
      'F413BimExecutionStep',
      'F413BimWorkset',
      'F413BimDeliverable',
      'buildF413BimExecutionPlan',
      'Acquire',
      'Normalize',
      'Classify',
      'Bind RS_*',
      'Calculate',
      'Coordinate',
      'Publish',
      'Evidence Pack reproducible',
    ],
  },
  {
    file: 'src/lib/revitIntegration.ts',
    markers: [
      'RS_BimEntityId',
      'RS_ControlledZone',
      'RS_StructuralLoad_kg_m2',
      'RS_CalculationHash',
      'RS_RevisionStatus',
    ],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    markers: [
      'buildF413BimExecutionPlan',
      'f413-bim-execution-plan',
      'f413-bim-step-${step.id}',
    ],
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
  console.error('F413 BIM execution contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F413 BIM execution contracts passed.');
