import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/hooks/useCanvas.ts',
    tokens: [
      'selectedIds',
      'hoverId',
      'snapAdvanced',
      'barrier-start',
      'barrier-mid',
      'barrier-end',
      'source-rotate',
      'selection-window',
      'endpoint',
      'midpoint',
      'perpendicular',
      'angle15',
      'Umbral regulatorio',
      'isocontours',
      'cadLikeFeatures',
      'draggable-grips',
      'persistent-dimension-export',
      'window-select',
      'hover-preselection',
      'equipment-rotation',
    ],
  },
  {
    file: 'src/sections/Sidebar.tsx',
    tokens: [
      'cad-inline-barrier-editor',
      'cad-inline-source-editor',
      'rotationDeg',
      'manufacturerVariant',
    ],
  },
  {
    file: 'src/types/radshield.ts',
    tokens: [
      'rotationDeg',
      'footprint_m',
      'manufacturerVariant',
    ],
  },
  {
    file: 'src/lib/f99CanvasCadReadiness.ts',
    tokens: [
      'Inline CAD inputs',
      'Grid, endpoint, midpoint, perpendicular, equipment center and angle-15',
      'labeled contour levels',
      'Shift multi-select',
    ],
  },
  {
    file: 'outputs/cad_like_completion_report.md',
    tokens: [
      'Grips arrastrables',
      'Cotas persistentes',
      'Snapping avanzado',
      'Seleccion multiple',
      'Isocontornos',
      'Simbolos de equipos',
      'Edicion directa',
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
  console.error('CAD-like completion contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('CAD-like completion contracts OK');
