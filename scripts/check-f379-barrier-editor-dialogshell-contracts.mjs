import { readFileSync } from 'node:fs';

const files = {
  barrierEditor: 'src/sections/dialogs/BarrierEditor.tsx',
  policy: 'src/lib/f378FullscreenDialogPolicy.ts',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');
const barrierEditor = read(files.barrierEditor);

const checks = [
  [files.barrierEditor, "import DialogShell from '@/components/DialogShell'", 'BarrierEditor imports DialogShell'],
  [files.barrierEditor, '<DialogShell', 'BarrierEditor uses DialogShell'],
  [files.barrierEditor, 'f379-barrier-editor-dialogshell', 'BarrierEditor body is traceable'],
  [files.barrierEditor, 'f379-barrier-editor-empty', 'BarrierEditor empty state is traceable'],
  [files.barrierEditor, 'Generate Recommendations', 'BarrierEditor keeps recommendation action'],
  [files.policy, 'Barrier Editor', 'F378 policy still tracks Barrier Editor'],
  [files.packageJson, 'test:f379:barrier-editor', 'Package exposes F379 test'],
  [files.changelog, 'F379', 'Changelog includes F379'],
  [files.versions, 'F379', 'Version manual includes F379'],
  [files.manual, 'Addendum F379', 'User manual includes F379'],
  [files.update, 'F379 Barrier Editor window', 'Update Center includes F379'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (barrierEditor.includes('fixed inset-0 z-50 bg-black/50')) {
  failures.push([files.barrierEditor, 'no fixed inset-0 z-50 bg-black/50', 'BarrierEditor removed legacy overlay']);
}

if (failures.length) {
  console.error('F379 BarrierEditor DialogShell contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F379 BarrierEditor DialogShell contracts OK (${checks.length + 1} checks).`);
