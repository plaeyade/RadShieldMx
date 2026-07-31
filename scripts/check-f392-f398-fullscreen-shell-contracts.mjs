import { existsSync, readFileSync } from 'node:fs';

const files = {
  shell: 'src/components/FullscreenShell.tsx',
  evidence: 'src/sections/dialogs/EvidencePackDialog.tsx',
  manual: 'src/sections/dialogs/ManualDialog.tsx',
  memoria: 'src/sections/dialogs/MemoriaAnaliticaWizard.tsx',
  layout: 'src/sections/dialogs/LayoutBunkerDialog.tsx',
  dashboard: 'src/sections/dialogs/DashboardDialog.tsx',
  checklist: 'src/sections/dialogs/ChecklistCNSNSDialog.tsx',
  ncrp: 'src/sections/dialogs/NCRP151TablesDialog.tsx',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manualDoc: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
  report: 'outputs/f392_f398_fullscreen_shell_audit/f392_f398_fullscreen_shell_audit.json',
};

const read = (file) => readFileSync(file, 'utf8');
const targets = [
  [files.evidence, 'f392-evidence-pack-fullscreen-shell', 'Evidence Pack F392 trace'],
  [files.manual, 'f393-manual-fullscreen-shell', 'Manual F393 trace'],
  [files.memoria, 'f394-memoria-analitica-fullscreen-shell', 'Memoria F394 trace'],
  [files.layout, 'f395-layout-bunker-fullscreen-shell', 'Layout F395 trace'],
  [files.dashboard, 'f396-dashboard-fullscreen-shell', 'Dashboard F396 trace'],
  [files.checklist, 'f397-checklist-cnsns-fullscreen-shell', 'Checklist F397 trace'],
  [files.ncrp, 'f398-ncrp151-tables-fullscreen-shell', 'NCRP F398 trace'],
];

const checks = [
  [files.shell, 'export default function FullscreenShell', 'FullscreenShell component exists'],
  [files.shell, 'contained-toggle', 'FullscreenShell exposes contained/fullscreen toggle'],
  [files.shell, 'data-fullscreen-shell-collapsed', 'FullscreenShell exposes collapse state'],
  ...targets.flatMap(([file, trace, label]) => [
    [file, "import FullscreenShell from '@/components/FullscreenShell'", `${label} imports shell`],
    [file, '<FullscreenShell', `${label} uses shell`],
    [file, trace, label],
  ]),
  [files.packageJson, 'prepare:f392-f398:fullscreen-shell', 'Package exposes F392-F398 prepare'],
  [files.packageJson, 'test:f392-f398:fullscreen-shell', 'Package exposes F392-F398 contract'],
  [files.changelog, 'F392-F398', 'Changelog includes F392-F398'],
  [files.versions, 'F392-F398', 'Version manual includes F392-F398'],
  [files.manualDoc, 'Addendum F392-F398', 'User manual includes F392-F398'],
  [files.update, 'F392-F398 FullscreenShell control', 'Update Center includes F392-F398'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

for (const [file, , label] of targets) {
  if (read(file).includes('fixed inset-0')) {
    failures.push([file, 'no local fixed inset-0', `${label} should not own fullscreen overlay`]);
  }
}

if (!existsSync(files.report)) {
  failures.push([files.report, 'exists', 'F392-F398 report generated']);
} else {
  const report = JSON.parse(read(files.report));
  if (report.status !== 'fullscreen-shell-controlled') {
    failures.push([files.report, 'fullscreen-shell-controlled', 'F392-F398 report status controlled']);
  }
  if (report.controlledCount !== 7 || report.remaining?.length !== 0) {
    failures.push([files.report, '7 controlled and 0 remaining', 'All seven fullscreen surfaces are controlled']);
  }
}

if (failures.length) {
  console.error('F392-F398 FullscreenShell contract failures:');
  for (const [file, needle, label] of failures) console.error(`- ${label}: missing "${needle}" in ${file}`);
  process.exit(1);
}

console.log(`F392-F398 FullscreenShell contracts OK (${checks.length + targets.length + 2} checks).`);
