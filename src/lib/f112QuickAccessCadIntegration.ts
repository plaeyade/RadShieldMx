export interface F112QuickAccessCadIntegration {
  phase: 'F112';
  status: 'implemented-feature-flag-safe';
  persistentFavorites: string[];
  smartChips: string[];
  miniCadTools: string[];
  sidebarIntegration: string[];
  dxTxNmCyPolicy: string;
  decision: string;
}

export function buildF112QuickAccessCadIntegration(): F112QuickAccessCadIntegration {
  return {
    phase: 'F112',
    status: 'implemented-feature-flag-safe',
    persistentFavorites: ['Memoria', 'Evidencia', 'Validar', 'Heatmap'],
    smartChips: ['Layout readiness', 'RAG evidence', 'QA status', 'DB deferred', 'Smoke gate'],
    miniCadTools: ['Select', 'Measure', 'Layers', 'Snap', 'Edit wall', 'Equipment', 'Zone', '3D inspect'],
    sidebarIntegration: [
      'CanvasQuickActionsSidebar keeps existing quick buttons.',
      'Mini CAD panel adds object/edit oriented commands without replacing legacy quick actions.',
      'Collapsed sidebar continues to expose one representative action per group.',
    ],
    dxTxNmCyPolicy: 'DX/TX/NM/CY remain category launchers in F112. Turning them into active modal profiles is deferred until smoke validates favorites, chips and mini CAD.',
    decision: 'F112 implements persistent favorites, smarter status chips and a mini CAD sidebar as additive UX. No canonical dropdowns, legacy fallbacks or DX/TX/NM/CY buttons are removed.',
  };
}
