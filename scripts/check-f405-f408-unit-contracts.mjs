import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const files = [
  ['src/__tests__/lib/f405ToF408ReleaseContracts.test.ts', ['describe', 'calculation-traceability-ready', 'canvas-tool-qa-ready', 'reportable heatmap', 'Unity-compatible']],
  ['src/lib/f405CalculationTraceabilityBundle.ts', ['buildF405CalculationTraceabilityBundle', 'calculation-traceability-ready']],
  ['src/lib/f406CanvasToolQa.ts', ['buildF406CanvasToolQa', 'canvas-tool-qa-ready']],
  ['src/lib/f407ReportableHeatmap.ts', ['buildF407ReportableHeatmapSnapshot', 'reportable-heatmap-ready']],
  ['src/lib/f408UnitySceneExport.ts', ['buildF408UnitySceneExport', 'validateF408UnitySceneExport']],
];

const failures = [];
for (const [path, markers] of files) {
  const text = readFileSync(join(root, path), 'utf8');
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${path} missing ${marker}`);
  }
}

if (failures.length) {
  console.error(['F405-F408 unit contract failures:', ...failures.map((item) => `- ${item}`)].join('\n'));
  process.exit(1);
}

console.log('F405-F408 unit contracts ready');
