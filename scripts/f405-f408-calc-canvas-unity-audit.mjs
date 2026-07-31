import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, 'outputs', 'f405_f408_calc_canvas_unity_audit');
mkdirSync(outDir, { recursive: true });

function text(path) {
  return readFileSync(join(root, path), 'utf8');
}

const files = {
  f405: 'src/lib/f405CalculationTraceabilityBundle.ts',
  f406: 'src/lib/f406CanvasToolQa.ts',
  f407: 'src/lib/f407ReportableHeatmap.ts',
  f408: 'src/lib/f408UnitySceneExport.ts',
  canvas: 'src/sections/CanvasArea.tsx',
  tests: 'src/__tests__/lib/f405ToF408ReleaseContracts.test.ts',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
};

const required = [
  ['F405 bundle', files.f405, 'radshield-mx.f405.calculation-traceability-bundle.v1'],
  ['F406 canvas QA', files.f406, 'radshield-mx.f406.canvas-tool-qa.v1'],
  ['F407 heatmap snapshot', files.f407, 'radshield-mx.f407.reportable-heatmap.v1'],
  ['F408 Unity export', files.f408, 'radshield-mx.f408.unity-scene-export.v1'],
  ['Canvas main', files.canvas, 'f100-main-floorplan-canvas'],
  ['Canvas context menu', files.canvas, 'canvas-context-menu'],
  ['Canvas CAD toolbar', files.canvas, 'f191-pyrate-inspired-toolbar'],
  ['Canvas command dock', files.canvas, 'f374-canvas-command-dock'],
  ['Unit tests', files.tests, 'F405-F408 release contracts'],
  ['Update Center', files.update, 'F405-F408'],
  ['Changelog', files.changelog, 'F405-F408'],
  ['Manual versiones', files.versions, 'F405-F408'],
  ['Manual usuario', files.manual, 'F405-F408'],
];

const checks = required.map(([name, path, marker]) => {
  let pass = false;
  let detail = '';
  try {
    const source = text(path);
    pass = source.includes(marker);
    detail = pass ? `found ${marker}` : `missing ${marker}`;
  } catch (error) {
    detail = error instanceof Error ? error.message : String(error);
  }
  return { name, path, marker, pass, detail };
});

const report = {
  schema: 'radshield-mx.f405-f408.audit.v1',
  phase: 'F405-F408',
  generatedAt: new Date().toISOString(),
  status: checks.every((check) => check.pass) ? 'ready' : 'review',
  checks,
};

writeFileSync(join(outDir, 'f405_f408_calc_canvas_unity_audit.json'), JSON.stringify(report, null, 2));
writeFileSync(
  join(outDir, 'F405_F408_CALC_CANVAS_UNITY_AUDIT.md'),
  [
    '# F405-F408 Calc Canvas Unity Audit',
    '',
    `Status: ${report.status}`,
    '',
    ...checks.map((check) => `- ${check.pass ? 'OK' : 'REVIEW'} ${check.name}: ${check.detail}`),
    '',
  ].join('\n'),
);

if (report.status !== 'ready') {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`F405-F408 audit ready: ${outDir}`);
