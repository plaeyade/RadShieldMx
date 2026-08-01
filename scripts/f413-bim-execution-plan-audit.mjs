import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredMarkers = [
  ['src/lib/f413BimExecutionPlan.ts', 'radshield-mx.f413.bim-execution-plan.v1'],
  ['src/lib/f413BimExecutionPlan.ts', 'RS_BimEntityId'],
  ['src/lib/f413BimExecutionPlan.ts', 'Acquire'],
  ['src/lib/f413BimExecutionPlan.ts', 'Coordinate'],
  ['src/sections/CanvasArea.tsx', 'f413-bim-execution-plan'],
  ['src/sections/CanvasArea.tsx', 'data-testid={`f413-bim-step-${step.id}`}'],
  ['src/lib/revitIntegration.ts', 'RS_CalculationHash'],
  ['src/lib/revitIntegration.ts', 'RS_StructuralLoad_kg_m2'],
  ['CHANGELOG.md', 'F413'],
  ['MANUAL_VERSIONES_v50.md', 'F413'],
  ['MANUAL_USUARIO_v99.md', 'F413'],
  ['package.json', 'prepare:f413:bim-execution'],
  ['package.json', 'test:f413:bim-execution'],
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
  console.error('F413 BIM execution plan audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F413 BIM execution plan audit passed.');
