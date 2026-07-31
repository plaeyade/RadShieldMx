import { readFileSync } from 'node:fs';

const files = {
  controlPoints: 'src/sections/dialogs/ControlPointsDialog.tsx',
  policy: 'src/lib/f378FullscreenDialogPolicy.ts',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');
const controlPoints = read(files.controlPoints);

const checks = [
  [files.controlPoints, "import DialogShell from '@/components/DialogShell'", 'ControlPointsDialog imports DialogShell'],
  [files.controlPoints, '<DialogShell', 'ControlPointsDialog uses DialogShell'],
  [files.controlPoints, 'f381-control-points-dialogshell', 'ControlPointsDialog body is traceable'],
  [files.controlPoints, 'Control Points & Design Goals', 'ControlPointsDialog keeps title'],
  [files.controlPoints, 'Add Control Point', 'ControlPointsDialog keeps add action'],
  [files.controlPoints, 'Floor Plan Preview', 'ControlPointsDialog keeps floorplan preview'],
  [files.policy, 'Control Points', 'F378 policy still tracks Control Points'],
  [files.packageJson, 'test:f381:control-points', 'Package exposes F381 test'],
  [files.changelog, 'F381', 'Changelog includes F381'],
  [files.versions, 'F381', 'Version manual includes F381'],
  [files.manual, 'Addendum F381', 'User manual includes F381'],
  [files.update, 'F381 Control Points window', 'Update Center includes F381'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (controlPoints.includes('fixed inset-0 z-50 bg-black/50')) {
  failures.push([files.controlPoints, 'no fixed inset-0 z-50 bg-black/50', 'ControlPointsDialog removed legacy overlay']);
}

if (failures.length) {
  console.error('F381 ControlPointsDialog DialogShell contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F381 ControlPointsDialog DialogShell contracts OK (${checks.length + 1} checks).`);
