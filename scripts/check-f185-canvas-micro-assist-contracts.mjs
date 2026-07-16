import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const read = (file) => readFileSync(file, 'utf8');
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

const files = [
  'src/lib/f185CanvasMicroAssist.ts',
  'src/sections/CanvasArea.tsx',
  'src/pages/ShieldingDesigner.tsx',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

for (const file of files) {
  expect(`Missing ${file}`, existsSync(file));
}

const f185 = read('src/lib/f185CanvasMicroAssist.ts');
const canvas = read('src/sections/CanvasArea.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const packageJson = read('package.json');
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');

expect('F185 builder exported', f185.includes('buildF185CanvasMicroAssist'));
expect('F185 status token present', f185.includes('canvas-micro-assist-ready'));
expect('F185 guardrail says no events/geometria changes', f185.includes('no cambia canvas events, geometria ni calculos'));
expect('Canvas imports F185', canvas.includes("buildF185CanvasMicroAssist"));
expect('Canvas renders F185 HUD', canvas.includes('data-testid="f185-canvas-micro-assist"'));
expect('Canvas renders dynamic assist test ids', canvas.includes('data-testid={`f185-assist-${item.id}`}'));
for (const id of ['tool', 'selection', 'snap', 'layers', 'evidence', 'heatmap']) {
  expect(`F185 module defines assist ${id}`, f185.includes(`'${id}'`));
}
expect('Demo R&F autoload preserved', designer.includes("Demo - R&F Room (RadShield Fig.6)"));
expect('Welcome screen not disabled', !designer.includes('if (false && !showWelcomeScreen'));
expect('Package exposes F185 test', packageJson.includes('test:f185:canvas-assist'));
expect('Changelog documents F185', changelog.includes('F185'));
expect('Manual documents F185', manual.includes('F185'));

if (failures.length) {
  console.error('F185 canvas micro assist contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F185 canvas micro assist contracts OK.');
