import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f99CanvasCadReadiness.ts',
    tokens: [
      'buildF99CanvasCadReadiness',
      'dimensions',
      'grips',
      'direct_edit',
      'layers',
      'snapping',
      'equipment_symbols',
      'isocontours',
      'selection',
    ],
  },
  {
    file: 'src/lib/canvas/CanvasRenderer.ts',
    tokens: [
      'drawSelectedBarrierCadOverlay',
      'roundRect(point.x - 4',
      'scale_m_per_pixel',
      'rgba(255, 247, 237, 0.94)',
    ],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    tokens: [
      'buildF99CanvasCadReadiness',
      'f99-cad-like-readiness-panel',
      'data-testid={`f99-cad-${item.id}`}',
      'f99Cad.score',
    ],
  },
  {
    file: 'outputs/fase_99_canvas_cad_like_readiness.md',
    tokens: [
      'F99',
      'CAD-like',
      'grips',
      'isocontornos',
      'seleccion',
    ],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) missing.push(`${check.file}: ${token}`);
  }
}

if (missing.length > 0) {
  console.error('F99 canvas CAD readiness contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F99 canvas CAD readiness contracts OK');
