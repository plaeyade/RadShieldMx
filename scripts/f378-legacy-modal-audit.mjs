import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join('outputs', 'f378_legacy_modal_audit');
fs.mkdirSync(outDir, { recursive: true });

const policy = [
  ['src/components/DialogShell.tsx', 'DialogShell', 'already-controlled', 'none', 'P0', 'Base modal already supports drag/minimize/maximize/close.'],
  ['src/components/SidePanelShell.tsx', 'SidePanelShell', 'already-controlled', 'none', 'P0', 'Base side panel supports minimize/restore/close.'],
  ['src/sections/dialogs/EvidencePackDialog.tsx', 'Evidence Pack', 'keep-fullscreen', 'FullscreenWithHeader', 'P1', 'Evidence review needs full viewport.'],
  ['src/sections/dialogs/ManualDialog.tsx', 'Manual de usuario', 'keep-fullscreen', 'FullscreenWithHeader', 'P2', 'Long documentation reader and print/export workflow.'],
  ['src/sections/dialogs/MemoriaAnaliticaWizard.tsx', 'Memoria Analitica', 'keep-fullscreen', 'FullscreenWithHeader', 'P1', 'Dense document wizard with export controls.'],
  ['src/sections/dialogs/LayoutBunkerDialog.tsx', 'Layout Bunker', 'keep-fullscreen', 'FullscreenWithHeader', 'P1', 'Large layout authoring workflow.'],
  ['src/sections/dialogs/DashboardDialog.tsx', 'Dashboard', 'keep-fullscreen', 'FullscreenWithHeader', 'P2', 'Workspace-level dashboard view.'],
  ['src/sections/dialogs/ChecklistCNSNSDialog.tsx', 'Checklist CNSNS', 'keep-fullscreen', 'FullscreenWithHeader', 'P1', 'Regulatory checklist workflow.'],
  ['src/sections/dialogs/NCRP151TablesDialog.tsx', 'NCRP 151 Tables', 'keep-fullscreen', 'FullscreenWithHeader', 'P2', 'Wide reference tables.'],
  ['src/sections/dialogs/BarrierEditor.tsx', 'Barrier Editor', 'migrate-window', 'DialogShell', 'P0', 'Canvas-adjacent editing should not block the floorplan.'],
  ['src/sections/dialogs/AirKermaOverlay.tsx', 'Air Kerma Overlay', 'migrate-window', 'DialogShell', 'P0', 'Canvas overlay controls should be movable/minimizable.'],
  ['src/sections/dialogs/ControlPointsDialog.tsx', 'Control Points', 'migrate-window', 'DialogShell', 'P0', 'Spatial editing should keep canvas visible.'],
  ['src/sections/dialogs/CompareScenariosDialog.tsx', 'Compare Scenarios', 'migrate-window', 'DialogShell', 'P1', 'Comparison should coexist with canvas inspection.'],
  ['src/sections/dialogs/TutorialDialog.tsx', 'Tutorial', 'migrate-window', 'DialogShell', 'P1', 'Guidance should remain visible while practicing.'],
  ['src/sections/dialogs/VersionHistoryDialog.tsx', 'Version History', 'migrate-window', 'DialogShell', 'P2', 'Secondary review should not monopolize viewport.'],
].map(([file, dialog, disposition, recommendedShell, priority, reason]) => ({
  file,
  dialog,
  disposition,
  recommendedShell,
  priority,
  reason,
}));

const discovered = [];
for (const root of ['src/sections/dialogs', 'src/components']) {
  for (const name of fs.readdirSync(root)) {
    if (!/\.(tsx|ts)$/.test(name)) continue;
    const file = path.join(root, name).replaceAll('\\', '/');
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes('fixed inset-0 z-50') || text.includes('fixed inset-y-0 right-0')) {
      discovered.push({
        file,
        hasFullscreenOverlay: text.includes('fixed inset-0 z-50'),
        hasRightSidePanel: text.includes('fixed inset-y-0 right-0'),
        hasDialogShell: text.includes('DialogShell'),
        hasSidePanelShell: text.includes('SidePanelShell'),
      });
    }
  }
}

const manifest = {
  phase: 'F378',
  generatedAt: new Date().toISOString(),
  status: 'legacy-modal-audit-ready',
  summary: {
    policyItems: policy.length,
    discoveredLegacySurfaces: discovered.length,
    keepFullscreen: policy.filter((item) => item.disposition === 'keep-fullscreen').length,
    migrateWindow: policy.filter((item) => item.disposition === 'migrate-window').length,
    alreadyControlled: policy.filter((item) => item.disposition === 'already-controlled').length,
  },
  guardrails: [
    'Do not migrate every fullscreen dialog blindly.',
    'Keep document/regulatory/dashboard/table workflows fullscreen.',
    'Migrate spatial/canvas aids first.',
    'Every migrated tool must expose close, minimize, restore and smoke coverage.',
  ],
  policy,
  discovered,
};

fs.writeFileSync(path.join(outDir, 'f378_legacy_modal_audit.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  path.join(outDir, 'f378_legacy_modal_audit.csv'),
  [
    'file,dialog,disposition,recommendedShell,priority,reason',
    ...policy.map((item) => [item.file, item.dialog, item.disposition, item.recommendedShell, item.priority, item.reason]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
  ].join('\n'),
);
fs.writeFileSync(
  path.join(outDir, 'f378_legacy_modal_audit.md'),
  [
    '# F378 Legacy Modal Audit',
    '',
    `Status: ${manifest.status}`,
    '',
    '## Summary',
    `- Policy items: ${manifest.summary.policyItems}`,
    `- Keep fullscreen: ${manifest.summary.keepFullscreen}`,
    `- Migrate to window: ${manifest.summary.migrateWindow}`,
    `- Already controlled: ${manifest.summary.alreadyControlled}`,
    '',
    '## Guardrails',
    ...manifest.guardrails.map((item) => `- ${item}`),
    '',
    '## P0 Migration Candidates',
    ...policy.filter((item) => item.priority === 'P0' && item.disposition === 'migrate-window')
      .map((item) => `- ${item.dialog}: ${item.file} -> ${item.recommendedShell}. ${item.reason}`),
    '',
  ].join('\n'),
);

console.log(`F378 legacy modal audit written to ${outDir}`);
