import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f212HeatmapRegulatoryLegend.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/check-f212-heatmap-regulatory-legend-contracts.mjs',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');

for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');

for (const token of [
  'F212',
  'buildF212HeatmapRegulatoryLegend',
  'heatmap-regulatory-legend-ready',
  'f212-heatmap-regulatory-legend',
  'f212-heatmap-max-proxy',
  'f212-isocontour-line-count',
  'f212-regulatory-level',
  'test:f212:heatmap-legend',
  'Heatmap Regulatory Legend',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const column of ['Nivel', 'Umbral mSv/sem', 'Color', 'Max proxy', 'Fuente', 'Decision']) {
  if (!joined.includes(column)) failures.push(`Missing export column: ${column}`);
}

for (const threshold of ['ALARA', 'Publico', 'Controlado', 'P min proyecto', 'P max proyecto']) {
  if (!joined.includes(threshold)) failures.push(`Missing threshold label: ${threshold}`);
}

if (failures.length) {
  console.error('F212 heatmap regulatory legend contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F212 heatmap regulatory legend contracts OK.');
