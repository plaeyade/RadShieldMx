import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join('outputs', 'f389_f391_dialogshell_migration_audit');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const f378 = JSON.parse(read('outputs/f378_legacy_modal_audit/f378_legacy_modal_audit.json'));

const migrationCandidates = [
  ['Barrier Editor', 'src/sections/dialogs/BarrierEditor.tsx', 'P0', 'f379-barrier-editor-dialogshell'],
  ['Air Kerma Overlay', 'src/sections/dialogs/AirKermaOverlay.tsx', 'P0', 'f380-air-kerma-overlay-dialogshell'],
  ['Control Points', 'src/sections/dialogs/ControlPointsDialog.tsx', 'P0', 'f381-control-points-dialogshell'],
  ['Compare Scenarios', 'src/sections/dialogs/CompareScenariosDialog.tsx', 'P1', 'f389-compare-scenarios-dialogshell'],
  ['Tutorial', 'src/sections/dialogs/TutorialDialog.tsx', 'P1', 'f390-tutorial-dialogshell'],
  ['Version History', 'src/sections/dialogs/VersionHistoryDialog.tsx', 'P2', 'f391-version-history-dialogshell'],
].map(([name, file, priority, trace]) => {
  const text = read(file);
  return {
    name,
    file,
    priority,
    trace,
    importsDialogShell: text.includes("import DialogShell from '@/components/DialogShell'"),
    usesDialogShell: text.includes('<DialogShell'),
    hasTrace: text.includes(trace),
    legacyFullscreenOverlay: text.includes('fixed inset-0') && !file.endsWith('DialogShell.tsx'),
  };
});

const checks = [
  {
    id: 'f378-policy-counts-stable',
    pass: f378.summary.policyItems === 15 && f378.summary.keepFullscreen === 7 && f378.summary.migrateWindow === 6,
    evidence: 'F378 source policy still reports 15 surfaces, 7 keep-fullscreen and 6 migrate-window candidates.',
  },
  {
    id: 'all-migrate-window-candidates-dialogshell',
    pass: migrationCandidates.every((item) => item.importsDialogShell && item.usesDialogShell && item.hasTrace),
    evidence: 'All 6 migrate-window candidates are now DialogShell-controlled with phase traces.',
  },
  {
    id: 'no-candidate-keeps-own-fixed-overlay',
    pass: migrationCandidates.every((item) => !item.legacyFullscreenOverlay),
    evidence: 'Migrated candidates no longer define their own fixed inset-0 overlay.',
  },
];

const remaining = migrationCandidates.filter((item) => !(item.importsDialogShell && item.usesDialogShell && item.hasTrace));
const manifest = {
  phase: 'F389-F391',
  generatedAt: new Date().toISOString(),
  status: checks.every((check) => check.pass) ? 'dialogshell-migration-closed' : 'dialogshell-migration-open',
  f378: {
    policyItems: f378.summary.policyItems,
    keepFullscreen: f378.summary.keepFullscreen,
    migrateWindow: f378.summary.migrateWindow,
    alreadyControlled: f378.summary.alreadyControlled,
  },
  migratedCandidates: migrationCandidates,
  migratedCount: migrationCandidates.length - remaining.length,
  remaining,
  checks,
};

fs.writeFileSync(path.join(outDir, 'f389_f391_dialogshell_migration_audit.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(outDir, 'f389_f391_dialogshell_migration_audit.md'),
  [
    '# F389-F391 DialogShell Migration Audit',
    '',
    `Status: ${manifest.status}`,
    '',
    '## F378 policy snapshot',
    `- Policy items: ${manifest.f378.policyItems}`,
    `- Keep fullscreen by policy: ${manifest.f378.keepFullscreen}`,
    `- Migrate-window candidates: ${manifest.f378.migrateWindow}`,
    '',
    '## Migrated candidates',
    ...migrationCandidates.map((item) => `- ${item.priority} ${item.name}: ${item.importsDialogShell && item.usesDialogShell && item.hasTrace ? 'migrated' : 'open'} (${item.file})`),
    '',
    '## Checks',
    ...checks.map((check) => `- ${check.id}: ${check.pass ? 'pass' : 'fail'} - ${check.evidence}`),
    '',
  ].join('\n'),
);

if (manifest.status !== 'dialogshell-migration-closed') {
  console.error('F389-F391 DialogShell migration audit failed:');
  for (const item of remaining) console.error(`- ${item.name}: ${item.file}`);
  for (const check of checks.filter((item) => !item.pass)) console.error(`- ${check.id}: ${check.evidence}`);
  process.exit(1);
}

console.log(`F389-F391 DialogShell migration audit written to ${outDir}`);
