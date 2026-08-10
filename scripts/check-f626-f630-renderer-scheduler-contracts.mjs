import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f626F630RendererBaseScheduler.ts',
    [
      'radshield-mx.canvas.renderer-base-scheduler.f626-f630.v1',
      'buildF626F630RendererBaseScheduler',
      'drawF626F630RendererSchedulerHud',
      'maxCommandsPerFrame',
      'cacheKey',
      'invalidatesOn',
      'Sin reemplazo de renderer base',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF626F630RendererBaseScheduler',
      'drawF626F630RendererSchedulerHud',
      'f626-f630-renderer-scheduler',
      'f626-f630-status',
      'f626-f630-metrics',
      'f626-f630-invalidation',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F626-F630 Renderer scheduler', 'renderer-scheduler-preview'],
  ],
  [
    'e2e/f626-f630-renderer-scheduler.spec.ts',
    ['f626-f630-renderer-scheduler', 'f626_f630_renderer_scheduler', 'cache'],
  ],
  [
    'CHANGELOG.md',
    ['F626-F630', 'scheduler', 'cache key'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F626-F630', 'scheduler', 'invalidacion'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F626-F630', 'renderer-scheduler-preview'],
  ],
  [
    'public/manual_usuario.html',
    ['F626-F630', 'Scheduler', 'cache key'],
  ],
  [
    'public/manual_versiones.html',
    ['F626-F630', 'Renderer Scheduler'],
  ],
  [
    'package.json',
    [
      'test:f626-f630:renderer-scheduler',
      'test:f626-f630:renderer-scheduler:values',
      'test:f626-f630:renderer-scheduler:e2e',
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
  console.error('F626-F630 renderer scheduler contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F626-F630 renderer scheduler contracts passed.');
