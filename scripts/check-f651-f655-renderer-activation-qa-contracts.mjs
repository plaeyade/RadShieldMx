import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f651F655RendererActivationQa.ts',
    [
      'radshield-mx.canvas.renderer-activation-qa.f651-f655.v1',
      'buildF651F655RendererActivationQa',
      'activation-qa-preview',
      'legacyE2eObserved',
      'Mantener preview',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF651F655RendererActivationQa',
      'f651-f655-renderer-activation-qa',
      'f651-f655-status',
      'f651-f655-metrics',
      'f651-f655-decision',
      'f651-f655-risk',
      'f651-f655-gates',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F651-F655 Activation QA gate', 'activation-qa-preview'],
  ],
  [
    'e2e/f651-f655-renderer-activation-qa.spec.ts',
    ['f651-f655-renderer-activation-qa', 'f651_f655_renderer_activation_qa'],
  ],
  [
    'CHANGELOG.md',
    ['F651-F655', 'activacion controlada', 'click legacy'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F651-F655', 'Activation QA', 'click legacy'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F651-F655', 'activation-qa-preview'],
  ],
  [
    'public/manual_usuario.html',
    ['F651-F655', 'Activation QA'],
  ],
  [
    'public/manual_versiones.html',
    ['F651-F655', 'Activation QA'],
  ],
  [
    'package.json',
    [
      'test:f651-f655:renderer-activation-qa',
      'test:f651-f655:renderer-activation-qa:values',
      'test:f651-f655:renderer-activation-qa:e2e',
    ],
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
  console.error('F651-F655 renderer activation QA contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F651-F655 renderer activation QA contracts passed.');
