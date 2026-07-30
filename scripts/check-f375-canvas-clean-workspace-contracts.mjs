import { readFileSync } from 'node:fs';

const files = {
  canvas: 'src/sections/CanvasArea.tsx',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');
const checks = [
  [files.canvas, 'F375_CANVAS_CHROME_MODE_KEY', 'Canvas persiste modo limpio/guia'],
  [files.canvas, 'f375-clean-workspace-toggle', 'Canvas expone toggle limpio/guia'],
  [files.canvas, 'f375-clean-guide-strip', 'Canvas limpio conserva tira compacta'],
  [files.canvas, 'f375-clean-hidden-overlays', 'Canvas documenta overlays compactos'],
  [files.canvas, "f375IsCleanWorkspace ? 'hidden' : 'hidden xl:flex'", 'Overlays superiores respetan modo limpio'],
  [files.canvas, "f375IsCleanWorkspace ? 'hidden' : 'hidden xl:block'", 'Overlays inferiores respetan modo limpio'],
  [files.canvas, 'data-f375-canvas-mode={canvasChromeMode}', 'Dock marca modo de canvas'],
  [files.packageJson, 'test:f375:clean-workspace', 'package expone contrato F375'],
  [files.packageJson, 'test:f375:clean-workspace-smoke', 'package expone smoke F375'],
  [files.changelog, 'F375', 'Changelog incluye F375'],
  [files.versions, 'F375', 'Manual de versiones incluye F375'],
  [files.manual, 'Addendum F375', 'Manual usuario incluye F375'],
  [files.update, 'F375 Clean canvas workspace', 'Update Center incluye F375'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (failures.length) {
  console.error('F375 clean workspace contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F375 clean workspace contracts OK (${checks.length} checks).`);
