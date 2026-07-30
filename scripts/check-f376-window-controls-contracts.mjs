import { readFileSync } from 'node:fs';

const files = {
  dialogShell: 'src/components/DialogShell.tsx',
  sourceSelector: 'src/sections/SourceSelector.tsx',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');

const checks = [
  [files.dialogShell, 'data-f376-dialog-pass-through', 'DialogShell deja pasar eventos cuando esta minimizado'],
  [files.dialogShell, 'f376-dialog-minimize', 'DialogShell expone minimizar trazable'],
  [files.dialogShell, 'f376-dialog-expand', 'DialogShell expone expandir trazable'],
  [files.dialogShell, 'f376-dialog-close', 'DialogShell expone cerrar trazable'],
  [files.sourceSelector, 'f376-source-selector-overlay', 'SourceSelector expone overlay trazable'],
  [files.sourceSelector, 'f376-source-selector-window', 'SourceSelector expone ventana trazable'],
  [files.sourceSelector, 'f376-source-selector-minimize', 'SourceSelector expone minimizar'],
  [files.sourceSelector, 'f376-source-selector-expand', 'SourceSelector expone expandir'],
  [files.sourceSelector, 'f376-source-selector-close', 'SourceSelector expone cerrar'],
  [files.sourceSelector, 'f376-source-selector-minimized', 'SourceSelector expone restaurar minimizado'],
  [files.sourceSelector, 'handlePointerDown', 'SourceSelector permite arrastre por encabezado'],
  [files.packageJson, 'test:f376:window-controls', 'package expone contrato F376'],
  [files.packageJson, 'test:f376:window-controls-smoke', 'package expone smoke F376'],
  [files.changelog, 'F376', 'Changelog incluye F376'],
  [files.versions, 'F376', 'Manual de versiones incluye F376'],
  [files.manual, 'Addendum F376', 'Manual usuario incluye F376'],
  [files.update, 'F376 Window controls', 'Update Center incluye F376'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (failures.length) {
  console.error('F376 window controls contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F376 window controls contracts OK (${checks.length} checks).`);
