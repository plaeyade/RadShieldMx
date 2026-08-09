import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f520F524DeepRendererBabylon.ts',
    [
      'radshield-mx.f520-f524.deep-renderer-babylon.v1',
      'F520',
      'F521',
      'F522',
      'F523',
      'F524',
      'canReplaceCanvasBase: false',
      'VITE_CANVAS_HIGH_RISK_CAD=false',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF520F524DeepRendererBabylonContract',
      'f520-f524-deep-renderer-babylon-canvas',
      'Renderer v2 sigue pointer-events:none',
      'F197/F207/F229/F446',
    ],
  ],
  [
    'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
    [
      'buildF520F524DeepRendererBabylonContract',
      'f520-f524-deep-renderer-babylon-3d',
      'f521-babylon-deep-summary',
      'f523-deep-activation-policy',
      'Babylon y renderer v2 quedan visuales',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F520-F524 Deep renderer + Babylon', 'canReplaceCanvasBase'],
  ],
  [
    'CHANGELOG.md',
    ['F520-F524', 'Babylon profundo', 'renderer v2'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F520-F524', 'Babylon profundo', 'renderer profundo'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F520-F524', 'QA/rollback', 'VITE_CANVAS_HIGH_RISK_CAD'],
  ],
  [
    'public/manual_usuario.html',
    ['F520-F524', 'Babylon profundo', 'Renderer v2'],
  ],
  [
    'public/manual_versiones.html',
    ['F520-F524', 'Deep renderer'],
  ],
  [
    'package.json',
    ['test:f520-f524:deep-renderer-babylon'],
  ],
];

const failures = [];
for (const [file, needles] of checks) {
  const text = readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${file}: missing "${needle}"`);
  }
}

if (failures.length) {
  console.error('F520-F524 deep renderer/Babylon contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F520-F524 deep renderer/Babylon contracts passed.');
