import { readFileSync } from 'node:fs';

const files = {
  airKerma: 'src/sections/dialogs/AirKermaOverlay.tsx',
  policy: 'src/lib/f378FullscreenDialogPolicy.ts',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');
const airKerma = read(files.airKerma);

const checks = [
  [files.airKerma, "import DialogShell from '@/components/DialogShell'", 'AirKermaOverlay imports DialogShell'],
  [files.airKerma, '<DialogShell', 'AirKermaOverlay uses DialogShell'],
  [files.airKerma, 'f380-air-kerma-overlay-dialogshell', 'AirKermaOverlay body is traceable'],
  [files.airKerma, 'Air Kerma Distribution Overlay', 'AirKermaOverlay keeps title'],
  [files.airKerma, 'Export PDF', 'AirKermaOverlay keeps PDF export action'],
  [files.airKerma, 'Show Shielded', 'AirKermaOverlay keeps shielded toggle'],
  [files.policy, 'Air Kerma Overlay', 'F378 policy still tracks Air Kerma Overlay'],
  [files.packageJson, 'test:f380:air-kerma-overlay', 'Package exposes F380 test'],
  [files.changelog, 'F380', 'Changelog includes F380'],
  [files.versions, 'F380', 'Version manual includes F380'],
  [files.manual, 'Addendum F380', 'User manual includes F380'],
  [files.update, 'F380 Air Kerma window', 'Update Center includes F380'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (airKerma.includes('fixed inset-0 z-50 bg-black/50')) {
  failures.push([files.airKerma, 'no fixed inset-0 z-50 bg-black/50', 'AirKermaOverlay removed legacy overlay']);
}

if (failures.length) {
  console.error('F380 AirKermaOverlay DialogShell contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F380 AirKermaOverlay DialogShell contracts OK (${checks.length + 1} checks).`);
