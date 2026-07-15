import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/canvasF85Workflow.ts',
    tokens: [
      'CanvasRiskLevel',
      'getBarrierRiskLevel',
      'getBarrierRiskColor',
      'buildF89RiskHeatmapSummary',
      'f89HeatmapPoints',
      'f89MaxHeatmapKerma',
    ],
  },
  {
    file: 'src/hooks/useCanvas.ts',
    tokens: [
      'getBarrierRiskLevel',
      'getBarrierRiskColor',
      'PASS',
      'WARN',
      'FAIL',
    ],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    tokens: [
      'f89-heatmap-toggle',
      'f89-heatmap-status-chip',
      'heatmapPointCount',
      'onToggleHeatmap',
      'buildF89RiskHeatmapSummary',
    ],
  },
  {
    file: 'src/pages/ShieldingDesigner.tsx',
    tokens: [
      'computeCurrentHeatmap',
      'handleToggleHeatmap',
      'heatmapPointCount={heatmapData.length}',
      'buildCanvasQAExport(floorPlan, barrierResults, sampleLines, heatmapData)',
      "heatmap.f89",
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['F89 Risk heatmap QA'],
  },
  {
    file: 'package.json',
    tokens: ['test:f89:risk-heatmap'],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) {
      missing.push(`${check.file}: ${token}`);
    }
  }
}

if (missing.length > 0) {
  console.error('F89 risk heatmap contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F89 risk heatmap contract OK');
