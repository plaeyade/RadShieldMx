import { readFileSync } from 'node:fs';

const migratedP0 = [
  {
    phase: 'F379',
    file: 'src/sections/dialogs/BarrierEditor.tsx',
    trace: 'f379-barrier-editor-dialogshell',
    name: 'Barrier Editor',
  },
  {
    phase: 'F380',
    file: 'src/sections/dialogs/AirKermaOverlay.tsx',
    trace: 'f380-air-kerma-overlay-dialogshell',
    name: 'Air Kerma Overlay',
  },
  {
    phase: 'F381',
    file: 'src/sections/dialogs/ControlPointsDialog.tsx',
    trace: 'f381-control-points-dialogshell',
    name: 'Control Points',
  },
];

const commonFiles = {
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
  policy: 'src/lib/f378FullscreenDialogPolicy.ts',
};

const read = (file) => readFileSync(file, 'utf8');
const failures = [];

for (const item of migratedP0) {
  const text = read(item.file);
  if (!text.includes("import DialogShell from '@/components/DialogShell'")) {
    failures.push([item.file, 'DialogShell import', `${item.name} imports DialogShell`]);
  }
  if (!text.includes('<DialogShell')) {
    failures.push([item.file, '<DialogShell', `${item.name} uses DialogShell`]);
  }
  if (!text.includes(item.trace)) {
    failures.push([item.file, item.trace, `${item.name} has phase trace`]);
  }
  if (text.includes('fixed inset-0 z-50 bg-black/50')) {
    failures.push([item.file, 'no legacy fullscreen overlay', `${item.name} removed legacy overlay`]);
  }
}

const checks = [
  [commonFiles.policy, 'Migrate spatial/canvas aids first: barrier editor, air kerma, control points.', 'F378 policy keeps P0 rationale'],
  [commonFiles.packageJson, 'test:f382:p0-dialogshell-closure', 'Package exposes F382 test'],
  [commonFiles.changelog, 'F382', 'Changelog includes F382'],
  [commonFiles.versions, 'F382', 'Version manual includes F382'],
  [commonFiles.manual, 'Addendum F382', 'User manual includes F382'],
  [commonFiles.update, 'F382 P0 DialogShell closure', 'Update Center includes F382'],
];

for (const [file, needle, label] of checks) {
  if (!read(file).includes(needle)) failures.push([file, needle, label]);
}

if (failures.length) {
  console.error('F382 P0 DialogShell closure contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F382 P0 DialogShell closure contracts OK (${migratedP0.length * 4 + checks.length} checks).`);
