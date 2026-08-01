import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'src/lib/f409OutputSurfaceIntegration.ts'), 'utf8');

const checks = [
  ['schema literal', "schema: 'radshield-mx.f409.output-surface-integration.v1'"],
  ['phase literal', "phase: 'F409'"],
  ['uses F405 traceability', 'buildF405CalculationTraceabilityBundle'],
  ['uses F407 heatmap', 'buildF407ReportableHeatmapSnapshot'],
  ['uses F408 unity', 'buildF408UnitySceneExport'],
  ['validates F408 unity', 'validateF408UnitySceneExport'],
  ['maps Memoria IA surface', "id: 'memoria-ia'"],
  ['maps Evidence Pack surface', "id: 'evidence-pack'"],
  ['maps PDF surface', "id: 'pdf-report'"],
  ['maps Medical 3D surface', "id: 'medical-3d'"],
  ['maps Update Center surface', "id: 'update-center'"],
  ['formats memory text', 'formatF409OutputSurfaceIntegrationText'],
];

const failures = checks.filter(([, marker]) => !source.includes(marker));

if (failures.length) {
  console.error('F409 contract check failed:');
  for (const [label, marker] of failures) console.error(`- ${label}: missing "${marker}"`);
  process.exit(1);
}

console.log('F409 output surface contracts passed.');
