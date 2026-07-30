import { readFileSync } from 'node:fs';

const files = {
  sidebar: 'src/sections/Sidebar.tsx',
  toolbar: 'src/sections/Toolbar.tsx',
  canvas: 'src/sections/CanvasArea.tsx',
  packageJson: 'package.json',
};

const read = (file) => readFileSync(file, 'utf8');
const checks = [
  [files.sidebar, 'f374-quick-action-status', 'Sidebar muestra confirmacion de accesos rapidos'],
  [files.sidebar, "runQuickAction('Calcular blindaje'", 'Sidebar ejecuta/fallback de calcular'],
  [files.sidebar, "runQuickAction('Memoria IA'", 'Sidebar ejecuta/fallback de Memoria IA'],
  [files.sidebar, "runQuickAction('Toolbox materiales'", 'Sidebar ejecuta/fallback de materiales'],
  [files.sidebar, "runQuickAction('DXF / DWG'", 'Sidebar ejecuta/fallback de DXF'],
  [files.toolbar, 'f374-toolbar-quick-', 'Toolbar marca favoritos ejecutables F374'],
  [files.toolbar, 'toast.success(`${label}: accion enviada`)', 'Toolbar confirma acciones enviadas'],
  [files.canvas, 'f374-canvas-command-dock', 'Canvas incluye dock de comandos CAD'],
  [files.canvas, "id: 'calc'", 'Canvas dock incluye calculo'],
  [files.canvas, "id: 'medical3d'", 'Canvas dock incluye inspeccion 3D'],
  [files.canvas, "id: 'evidence'", 'Canvas dock incluye evidencia'],
  [files.canvas, 'runCanvasCommand', 'Canvas ejecuta comandos con estado y fallback visual'],
  [files.packageJson, 'test:f374:quick-canvas', 'package.json expone script F374'],
  [files.packageJson, 'test:f374:quick-canvas-smoke', 'package.json expone smoke E2E F374'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (failures.length) {
  console.error('F374 quick/canvas contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F374 quick/canvas contracts OK (${checks.length} checks).`);
