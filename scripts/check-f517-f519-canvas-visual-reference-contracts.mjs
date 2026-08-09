import { readFileSync } from 'node:fs';

const required = [
  [
    'src/lib/f517F519CanvasVisualReference.ts',
    [
      'buildF517F519CanvasVisualReference',
      'clinical-room-catalog',
      'floating-cad-toolbar',
      'variant-thumbnails',
      'inline-object-editor',
      'material-render-palette',
      'export-bim-bundle',
      '#eef3ec',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'f517-f519-canvas-visual-reference-panel',
      'Project Manager palette',
      'Catalogo clinico',
      'Variantes A-E',
      'PDF/DXF/IFC/GLB',
      'Sembrar equipos + Render 3D',
      'bg-[#fffdf8]/96',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    [
      'buildF517F519CanvasVisualReference',
      'F517-F519 Canvas visual reference',
      'catalogo clinico + variantes A-E + materiales + PDF/DXF/IFC/GLB + render 3D',
    ],
  ],
  [
    'CHANGELOG.md',
    ['F517-F519', 'Project Manager', 'paleta', 'catalogo clinico'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F517-F519', 'Catalogo clinico', 'Variantes A-E', 'Sembrar equipos + Render 3D'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F517-F519', 'Project Manager', 'PDF/DXF/IFC/GLB'],
  ],
  [
    'public/manual_usuario.html',
    ['F517-F519', 'Catalogo clinico', 'Project Manager palette'],
  ],
  [
    'public/manual_versiones.html',
    ['F517-F519', 'Canvas Visual Reference'],
  ],
];

const failures = [];

for (const [file, needles] of required) {
  const text = readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) {
      failures.push(`${file}: missing "${needle}"`);
    }
  }
}

if (failures.length) {
  console.error('F517-F519 canvas visual reference contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F517-F519 canvas visual reference contracts passed.');
