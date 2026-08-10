import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f646F650RendererSelectionTransaction.ts',
    [
      'radshield-mx.canvas.renderer-selection-transaction.f646-f650.v1',
      'buildF646F650RendererSelectionTransaction',
      'selection-transaction-preview',
      'rollbackToken',
      'No escribir seleccion real',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF646F650RendererSelectionTransaction',
      'f646-f650-renderer-selection-transaction',
      'f646-f650-status',
      'f646-f650-metrics',
      'f646-f650-draft',
      'f646-f650-snapshot',
      'f646-f650-rollback-token',
      'f646-f650-gates',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F646-F650 Selection transaction preview', 'selection-transaction-preview'],
  ],
  [
    'e2e/f646-f650-renderer-selection-transaction.spec.ts',
    ['f646-f650-renderer-selection-transaction', 'f646_f650_renderer_selection_transaction'],
  ],
  [
    'CHANGELOG.md',
    ['F646-F650', 'transaccion simulada', 'rollback'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F646-F650', 'rollback token', 'setCanvasState'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F646-F650', 'selection-transaction-preview'],
  ],
  [
    'public/manual_usuario.html',
    ['F646-F650', 'Selection Transaction'],
  ],
  [
    'public/manual_versiones.html',
    ['F646-F650', 'Selection Transaction'],
  ],
  [
    'package.json',
    [
      'test:f646-f650:renderer-selection-transaction',
      'test:f646-f650:renderer-selection-transaction:values',
      'test:f646-f650:renderer-selection-transaction:e2e',
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
  console.error('F646-F650 renderer selection transaction contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F646-F650 renderer selection transaction contracts passed.');
