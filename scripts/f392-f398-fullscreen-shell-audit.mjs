import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join('outputs', 'f392_f398_fullscreen_shell_audit');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const fullscreenItems = [
  ['F392', 'Evidence Pack', 'src/sections/dialogs/EvidencePackDialog.tsx', 'f392-evidence-pack-fullscreen-shell'],
  ['F393', 'Manual de usuario', 'src/sections/dialogs/ManualDialog.tsx', 'f393-manual-fullscreen-shell'],
  ['F394', 'Memoria Analitica', 'src/sections/dialogs/MemoriaAnaliticaWizard.tsx', 'f394-memoria-analitica-fullscreen-shell'],
  ['F395', 'Layout Bunker', 'src/sections/dialogs/LayoutBunkerDialog.tsx', 'f395-layout-bunker-fullscreen-shell'],
  ['F396', 'Dashboard', 'src/sections/dialogs/DashboardDialog.tsx', 'f396-dashboard-fullscreen-shell'],
  ['F397', 'Checklist CNSNS', 'src/sections/dialogs/ChecklistCNSNSDialog.tsx', 'f397-checklist-cnsns-fullscreen-shell'],
  ['F398', 'NCRP 151 Tables', 'src/sections/dialogs/NCRP151TablesDialog.tsx', 'f398-ncrp151-tables-fullscreen-shell'],
].map(([phase, name, file, trace]) => {
  const text = read(file);
  return {
    phase,
    name,
    file,
    trace,
    importsShell: text.includes("import FullscreenShell from '@/components/FullscreenShell'"),
    usesShell: text.includes('<FullscreenShell'),
    hasTrace: text.includes(trace),
    ownsLegacyOverlay: text.includes('fixed inset-0'),
  };
});

const shell = read('src/components/FullscreenShell.tsx');
const checks = [
  {
    id: 'fullscreen-shell-controls',
    pass: shell.includes('data-testid={`${traceId}-minimize`}') && shell.includes('data-testid={`${traceId}-contained-toggle`}') && shell.includes('data-testid={`${traceId}-close`}'),
    evidence: 'FullscreenShell exposes minimize, contained/fullscreen toggle and close controls.',
  },
  {
    id: 'all-seven-use-shell',
    pass: fullscreenItems.every((item) => item.importsShell && item.usesShell && item.hasTrace),
    evidence: 'All 7 F378 keep-fullscreen surfaces now use FullscreenShell traces.',
  },
  {
    id: 'no-local-fullscreen-overlays',
    pass: fullscreenItems.every((item) => !item.ownsLegacyOverlay),
    evidence: 'The 7 migrated surfaces no longer own fixed inset-0 overlays.',
  },
];

const remaining = fullscreenItems.filter((item) => !(item.importsShell && item.usesShell && item.hasTrace) || item.ownsLegacyOverlay);
const manifest = {
  phase: 'F392-F398',
  generatedAt: new Date().toISOString(),
  status: checks.every((check) => check.pass) ? 'fullscreen-shell-controlled' : 'fullscreen-shell-incomplete',
  mode: 'controlled-fullscreen',
  note: 'These workflows remain large-screen by design, but use a common shell with minimize, contained/fullscreen toggle and close.',
  fullscreenItems,
  controlledCount: fullscreenItems.length - remaining.length,
  remaining,
  checks,
};

fs.writeFileSync(path.join(outDir, 'f392_f398_fullscreen_shell_audit.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(outDir, 'f392_f398_fullscreen_shell_audit.md'),
  [
    '# F392-F398 FullscreenShell Audit',
    '',
    `Status: ${manifest.status}`,
    '',
    '## Controlled fullscreen surfaces',
    ...fullscreenItems.map((item) => `- ${item.phase} ${item.name}: ${item.importsShell && item.usesShell && item.hasTrace && !item.ownsLegacyOverlay ? 'controlled' : 'open'} (${item.file})`),
    '',
    '## Checks',
    ...checks.map((check) => `- ${check.id}: ${check.pass ? 'pass' : 'fail'} - ${check.evidence}`),
    '',
  ].join('\n'),
);

if (manifest.status !== 'fullscreen-shell-controlled') {
  console.error('F392-F398 FullscreenShell audit failed:');
  for (const item of remaining) console.error(`- ${item.phase} ${item.name}: ${item.file}`);
  for (const check of checks.filter((item) => !item.pass)) console.error(`- ${check.id}: ${check.evidence}`);
  process.exit(1);
}

console.log(`F392-F398 FullscreenShell audit written to ${outDir}`);
