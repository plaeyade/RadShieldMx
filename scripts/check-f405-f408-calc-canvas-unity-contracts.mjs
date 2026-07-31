import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function source(path) {
  return readFileSync(join(root, path), 'utf8');
}

const checks = [
  {
    name: 'F405 reuses F237 governance instead of creating a parallel approval gate',
    path: 'src/lib/f405CalculationTraceabilityBundle.ts',
    markers: ['buildF237CalculationEngineGovernance', 'calculation-traceability-ready', 'Memoria IA'],
  },
  {
    name: 'F406 covers canvas tools, visual modes, command dock and context menu',
    path: 'src/lib/f406CanvasToolQa.ts',
    markers: ['f191-tool-barrier', 'f191-visual-mode-isocontours', 'f374-canvas-command-dock', 'canvas-context-menu'],
  },
  {
    name: 'F407 builds on F212 regulatory legend and defines export targets',
    path: 'src/lib/f407ReportableHeatmap.ts',
    markers: ['buildF212HeatmapRegulatoryLegend', 'Evidence Pack', 'visual snapshot hash'],
  },
  {
    name: 'F408 exports meters/Y-up Unity scene without claiming certified Monte Carlo',
    path: 'src/lib/f408UnitySceneExport.ts',
    markers: ["units: 'meters'", "upAxis: 'Y'", 'Unity WebGL bridge', 'must not change geometry/material thickness'],
  },
  {
    name: 'Unit test covers F405-F408',
    path: 'src/__tests__/lib/f405ToF408ReleaseContracts.test.ts',
    markers: ['F405-F408 release contracts', 'calculation-traceability-ready', 'canvas-tool-qa-ready', 'Unity-compatible'],
  },
  {
    name: 'Package scripts expose prepare/test/unit',
    path: 'package.json',
    markers: ['prepare:f405-f408:calc-canvas-unity', 'test:f405-f408:calc-canvas-unity', 'test:f405-f408:unit'],
  },
];

const failures = checks.flatMap((check) => {
  const text = source(check.path);
  return check.markers
    .filter((marker) => !text.includes(marker))
    .map((marker) => `${check.name}: missing "${marker}" in ${check.path}`);
});

if (failures.length) {
  console.error(['F405-F408 contract failures:', ...failures.map((failure) => `- ${failure}`)].join('\n'));
  process.exit(1);
}

console.log('F405-F408 contracts ready');
