import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f641F645RendererEventDryRun.ts',
    [
      'radshield-mx.canvas.renderer-event-dry-run.f641-f645.v1',
      'buildF641F645RendererEventDryRun',
      'event-dry-run-preview',
      'pointerdown-preview',
      'useCanvas sigue',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF641F645RendererEventDryRun',
      'f641-f645-renderer-event-dry-run',
      'f641-f645-status',
      'f641-f645-metrics',
      'f641-f645-intent',
      'f641-f645-comparison',
      'f641-f645-gates',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F641-F645 Event dry-run bridge', 'event-dry-run-preview'],
  ],
  [
    'e2e/f641-f645-renderer-event-dry-run.spec.ts',
    ['f641-f645-renderer-event-dry-run', 'f641_f645_renderer_event_dry_run'],
  ],
  [
    'CHANGELOG.md',
    ['F641-F645', 'dry-run', 'useCanvas'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F641-F645', 'dry-run', 'pointerdown-preview'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F641-F645', 'event-dry-run-preview'],
  ],
  [
    'public/manual_usuario.html',
    ['F641-F645', 'Event Dry-run'],
  ],
  [
    'public/manual_versiones.html',
    ['F641-F645', 'Event Dry-run'],
  ],
  [
    'package.json',
    [
      'test:f641-f645:renderer-event-dry-run',
      'test:f641-f645:renderer-event-dry-run:values',
      'test:f641-f645:renderer-event-dry-run:e2e',
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
  console.error('F641-F645 renderer event dry-run contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F641-F645 renderer event dry-run contracts passed.');
