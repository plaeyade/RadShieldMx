export interface F111QuickAccessImplementation {
  phase: 'F111';
  status: 'implemented-low-risk';
  favorites: Array<{
    id: string;
    label: string;
    target: string;
    purpose: string;
  }>;
  statusChips: Array<{
    id: string;
    label: string;
    target: string;
    meaning: string;
  }>;
  preservedSurfaces: string[];
  deferredToF112: string[];
  decision: string;
}

export function buildF111QuickAccessImplementation(): F111QuickAccessImplementation {
  return {
    phase: 'F111',
    status: 'implemented-low-risk',
    favorites: [
      { id: 'memoria', label: 'Memoria', target: 'Memoria IA', purpose: 'Abrir el flujo de memoria analitica desde la barra rapida.' },
      { id: 'evidence', label: 'Evidencia', target: 'Evidence Pack', purpose: 'Abrir fuentes, citas, snapshots y trazabilidad documental.' },
      { id: 'validate', label: 'Validar', target: 'NCRP Validation', purpose: 'Ejecutar verificacion normativa y numerica sin navegar menus legacy.' },
      { id: 'heatmap', label: 'Heatmap', target: 'Dose map', purpose: 'Abrir mapa de dosis/isodosis para revisar distribucion visual.' },
    ],
    statusChips: [
      { id: 'db', label: 'DB diferida', target: 'Update Center', meaning: 'MySQL sigue diferido; la app opera en modo offline-safe.' },
      { id: 'rag', label: 'RAG evidencia', target: 'Evidence Pack', meaning: 'RAG se revisa desde evidencia; persistencia vectorial espera DB.' },
      { id: 'qa', label: 'QA activo', target: 'Performance Dashboard', meaning: 'Pruebas, contratos y perfilado siguen disponibles.' },
      { id: 'smoke', label: 'Smoke pendiente', target: 'Update Center', meaning: 'La remocion de fallbacks requiere smoke visual/runtime.' },
    ],
    preservedSurfaces: [
      'DX/TX/NM/CY category buttons',
      'CanvasQuickActionsSidebar v110',
      'Canonical dropdowns F96-F110',
      'Legacy fallback menus',
    ],
    deferredToF112: [
      'Context-aware quick palette behind feature flag',
      'User-pinned favorites persisted in local storage',
      'Stage-aware suggestions based on selected canvas object',
      'Optional compact ribbon experiment',
    ],
    decision: 'F111 implements favorites and status chips as an additive quick-access layer. It does not replace DX/TX/NM/CY buttons, canvas sidebar actions or legacy fallback menus.',
  };
}
