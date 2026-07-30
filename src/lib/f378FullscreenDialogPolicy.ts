export type F378DialogDisposition = 'keep-fullscreen' | 'migrate-window' | 'already-controlled';

export interface F378DialogPolicyItem {
  file: string;
  dialog: string;
  disposition: F378DialogDisposition;
  reason: string;
  recommendedShell: 'DialogShell' | 'SidePanelShell' | 'FullscreenWithHeader' | 'none';
  priority: 'P0' | 'P1' | 'P2';
}

export const F378_FULLSCREEN_DIALOG_POLICY: F378DialogPolicyItem[] = [
  {
    file: 'src/components/DialogShell.tsx',
    dialog: 'DialogShell',
    disposition: 'already-controlled',
    reason: 'Base modal already supports drag, minimize, maximize, close and pass-through when minimized.',
    recommendedShell: 'none',
    priority: 'P0',
  },
  {
    file: 'src/components/SidePanelShell.tsx',
    dialog: 'SidePanelShell',
    disposition: 'already-controlled',
    reason: 'Base side panel supports minimize, restore and close for right-side panels.',
    recommendedShell: 'none',
    priority: 'P0',
  },
  {
    file: 'src/sections/dialogs/EvidencePackDialog.tsx',
    dialog: 'Evidence Pack',
    disposition: 'keep-fullscreen',
    reason: 'Document/evidence review benefits from fullscreen layout and must not accidentally lose context.',
    recommendedShell: 'FullscreenWithHeader',
    priority: 'P1',
  },
  {
    file: 'src/sections/dialogs/ManualDialog.tsx',
    dialog: 'Manual de usuario',
    disposition: 'keep-fullscreen',
    reason: 'Long documentation reader needs full viewport and print/export behavior.',
    recommendedShell: 'FullscreenWithHeader',
    priority: 'P2',
  },
  {
    file: 'src/sections/dialogs/MemoriaAnaliticaWizard.tsx',
    dialog: 'Memoria Analitica',
    disposition: 'keep-fullscreen',
    reason: 'Wizard/editor is a document workflow with dense sections and export controls.',
    recommendedShell: 'FullscreenWithHeader',
    priority: 'P1',
  },
  {
    file: 'src/sections/dialogs/LayoutBunkerDialog.tsx',
    dialog: 'Layout Bunker',
    disposition: 'keep-fullscreen',
    reason: 'Large layout authoring requires maximum space and should not become a small modal.',
    recommendedShell: 'FullscreenWithHeader',
    priority: 'P1',
  },
  {
    file: 'src/sections/dialogs/DashboardDialog.tsx',
    dialog: 'Dashboard',
    disposition: 'keep-fullscreen',
    reason: 'Dashboard is a workspace-level view, not a transient tool.',
    recommendedShell: 'FullscreenWithHeader',
    priority: 'P2',
  },
  {
    file: 'src/sections/dialogs/ChecklistCNSNSDialog.tsx',
    dialog: 'Checklist CNSNS',
    disposition: 'keep-fullscreen',
    reason: 'Regulatory checklist needs uninterrupted vertical space and traceability.',
    recommendedShell: 'FullscreenWithHeader',
    priority: 'P1',
  },
  {
    file: 'src/sections/dialogs/NCRP151TablesDialog.tsx',
    dialog: 'NCRP 151 Tables',
    disposition: 'keep-fullscreen',
    reason: 'Reference tables are wide and should remain readable.',
    recommendedShell: 'FullscreenWithHeader',
    priority: 'P2',
  },
  {
    file: 'src/sections/dialogs/BarrierEditor.tsx',
    dialog: 'Barrier Editor',
    disposition: 'migrate-window',
    reason: 'Barrier editing should coexist with canvas inspection instead of blocking it.',
    recommendedShell: 'DialogShell',
    priority: 'P0',
  },
  {
    file: 'src/sections/dialogs/AirKermaOverlay.tsx',
    dialog: 'Air Kerma Overlay',
    disposition: 'migrate-window',
    reason: 'Overlay settings are a canvas aid and should be movable/minimizable.',
    recommendedShell: 'DialogShell',
    priority: 'P0',
  },
  {
    file: 'src/sections/dialogs/ControlPointsDialog.tsx',
    dialog: 'Control Points',
    disposition: 'migrate-window',
    reason: 'Control point editing is spatial and should keep the floorplan visible.',
    recommendedShell: 'DialogShell',
    priority: 'P0',
  },
  {
    file: 'src/sections/dialogs/CompareScenariosDialog.tsx',
    dialog: 'Compare Scenarios',
    disposition: 'migrate-window',
    reason: 'Scenario comparison is useful as a movable reference while looking at the canvas.',
    recommendedShell: 'DialogShell',
    priority: 'P1',
  },
  {
    file: 'src/sections/dialogs/VersionHistoryDialog.tsx',
    dialog: 'Version History',
    disposition: 'migrate-window',
    reason: 'History review is a secondary panel and should not monopolize the viewport.',
    recommendedShell: 'DialogShell',
    priority: 'P2',
  },
  {
    file: 'src/sections/dialogs/TutorialDialog.tsx',
    dialog: 'Tutorial',
    disposition: 'migrate-window',
    reason: 'Tutorial content should remain available while the user practices on the canvas.',
    recommendedShell: 'DialogShell',
    priority: 'P1',
  },
];

export const F378_POLICY_SUMMARY = {
  phase: 'F378',
  purpose: 'Classify legacy fullscreen dialogs before migrating them.',
  guardrails: [
    'Do not migrate every fullscreen dialog blindly.',
    'Keep document, regulatory, dashboard and dense table workflows fullscreen.',
    'Migrate spatial/canvas aids first: barrier editor, air kerma, control points.',
    'Every migrated tool must expose close, minimize, restore and smoke coverage.',
  ],
};
