import { existsSync, readFileSync } from 'node:fs';

const files = {
  compare: 'src/sections/dialogs/CompareScenariosDialog.tsx',
  tutorial: 'src/sections/dialogs/TutorialDialog.tsx',
  versionHistory: 'src/sections/dialogs/VersionHistoryDialog.tsx',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
  report: 'outputs/f389_f391_dialogshell_migration_audit/f389_f391_dialogshell_migration_audit.json',
};

const read = (file) => readFileSync(file, 'utf8');
const checks = [
  [files.compare, "import DialogShell from '@/components/DialogShell'", 'Compare Scenarios imports DialogShell'],
  [files.compare, '<DialogShell', 'Compare Scenarios uses DialogShell'],
  [files.compare, 'f389-compare-scenarios-dialogshell', 'Compare Scenarios has F389 trace'],
  [files.tutorial, "import DialogShell from '@/components/DialogShell'", 'Tutorial imports DialogShell'],
  [files.tutorial, '<DialogShell', 'Tutorial uses DialogShell'],
  [files.tutorial, 'f390-tutorial-dialogshell', 'Tutorial has F390 trace'],
  [files.versionHistory, "import DialogShell from '@/components/DialogShell'", 'Version History imports DialogShell'],
  [files.versionHistory, '<DialogShell', 'Version History uses DialogShell'],
  [files.versionHistory, 'f391-version-history-dialogshell', 'Version History has F391 trace'],
  [files.packageJson, 'prepare:f389-f391:dialogshell-migration', 'Package exposes F389-F391 prepare'],
  [files.packageJson, 'test:f389-f391:dialogshell-migration', 'Package exposes F389-F391 contract'],
  [files.changelog, 'F389-F391', 'Changelog includes F389-F391'],
  [files.versions, 'F389-F391', 'Version manual includes F389-F391'],
  [files.manual, 'Addendum F389-F391', 'User manual includes F389-F391'],
  [files.update, 'F389-F391 DialogShell migration close', 'Update Center includes F389-F391'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

for (const file of [files.compare, files.tutorial, files.versionHistory]) {
  if (read(file).includes('fixed inset-0')) {
    failures.push([file, 'no fixed inset-0', 'Migrated dialog should not keep its own fullscreen overlay']);
  }
}

if (!existsSync(files.report)) {
  failures.push([files.report, 'exists', 'F389-F391 report generated']);
} else {
  const report = JSON.parse(read(files.report));
  if (report.status !== 'dialogshell-migration-closed') {
    failures.push([files.report, 'dialogshell-migration-closed', 'F389-F391 report status closed']);
  }
  if (report.migratedCount !== 6 || report.remaining?.length !== 0) {
    failures.push([files.report, '6 migrated and 0 remaining', 'All F378 migrate-window candidates are closed']);
  }
}

if (failures.length) {
  console.error('F389-F391 DialogShell contract failures:');
  for (const [file, needle, label] of failures) console.error(`- ${label}: missing "${needle}" in ${file}`);
  process.exit(1);
}

console.log(`F389-F391 DialogShell contracts OK (${checks.length + 5} checks).`);
