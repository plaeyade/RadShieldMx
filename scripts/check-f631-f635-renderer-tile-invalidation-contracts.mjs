import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f631F635RendererTileInvalidation.ts',
    [
      'radshield-mx.canvas.renderer-tile-invalidation.f631-f635.v1',
      'buildF631F635RendererTileInvalidation',
      'drawF631F635TileInvalidationOverlay',
      'dirtyRatio',
      'tile-invalidation-preview',
      'No usar tiles para eventos',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF631F635RendererTileInvalidation',
      'drawF631F635TileInvalidationOverlay',
      'f631-f635-renderer-tile-invalidation',
      'f631-f635-status',
      'f631-f635-metrics',
      'f631-f635-gates',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F631-F635 Tile invalidation atlas', 'tile-invalidation-preview'],
  ],
  [
    'e2e/f631-f635-renderer-tile-invalidation.spec.ts',
    ['f631-f635-renderer-tile-invalidation', 'f631_f635_renderer_tile_invalidation'],
  ],
  [
    'CHANGELOG.md',
    ['F631-F635', 'tile atlas', 'invalidacion parcial'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F631-F635', 'tiles', 'invalidacion parcial'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F631-F635', 'tile-invalidation-preview'],
  ],
  [
    'public/manual_usuario.html',
    ['F631-F635', 'Tile Atlas'],
  ],
  [
    'public/manual_versiones.html',
    ['F631-F635', 'Tile Invalidation'],
  ],
  [
    'package.json',
    [
      'test:f631-f635:renderer-tile-invalidation',
      'test:f631-f635:renderer-tile-invalidation:values',
      'test:f631-f635:renderer-tile-invalidation:e2e',
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
  console.error('F631-F635 renderer tile invalidation contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F631-F635 renderer tile invalidation contracts passed.');
