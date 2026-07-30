import { existsSync, readFileSync } from 'node:fs';

const files = {
  policy: 'src/lib/f378FullscreenDialogPolicy.ts',
  prepare: 'scripts/f378-legacy-modal-audit.mjs',
  report: 'outputs/f378_legacy_modal_audit/f378_legacy_modal_audit.json',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');

const checks = [
  [files.policy, 'F378_FULLSCREEN_DIALOG_POLICY', 'Policy export exists'],
  [files.policy, 'Barrier Editor', 'P0 barrier editor classified'],
  [files.policy, 'Air Kerma Overlay', 'P0 air kerma classified'],
  [files.policy, 'Control Points', 'P0 control points classified'],
  [files.prepare, 'f378_legacy_modal_audit.json', 'Prepare script writes JSON'],
  [files.prepare, 'f378_legacy_modal_audit.csv', 'Prepare script writes CSV'],
  [files.packageJson, 'prepare:f378:legacy-modal-audit', 'Package exposes prepare F378'],
  [files.packageJson, 'test:f378:legacy-modal-audit', 'Package exposes test F378'],
  [files.changelog, 'F378', 'Changelog includes F378'],
  [files.versions, 'F378', 'Version manual includes F378'],
  [files.manual, 'Addendum F378', 'User manual includes F378'],
  [files.update, 'F378 Legacy modal audit', 'Update Center includes F378'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (!existsSync(files.report)) {
  failures.push([files.report, 'exists', 'Generated JSON report exists']);
}

if (!failures.length) {
  const manifest = JSON.parse(read(files.report));
  if (manifest.summary.migrateWindow < 3) {
    failures.push([files.report, 'migrateWindow >= 3', 'Report has migration candidates']);
  }
}

if (failures.length) {
  console.error('F378 legacy modal audit contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F378 legacy modal audit contracts OK (${checks.length + 1} checks).`);
