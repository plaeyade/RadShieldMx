export interface F116UtilityMenuConsolidation {
  phase: 'F116';
  status: 'implemented-controlled';
  visibleLegacyMenus: string[];
  movedToIntegrations: string[];
  canonicalIntegrationsTrigger: string;
  nextPhase: string;
  decision: string;
}

export function buildF116UtilityMenuConsolidation(): F116UtilityMenuConsolidation {
  return {
    phase: 'F116',
    status: 'implemented-controlled',
    visibleLegacyMenus: ['Archivo'],
    movedToIntegrations: [
      'Performance Dashboard',
      'Benchmarks Suite',
      'Function Profiler',
      'CPU & Memory Profile',
      'Technical Audit',
      'Code Quality Audit',
      'Algorithm Analyzer',
      'CAD/MC Geometry',
      'Shielding Design Agent',
      'Performance Recommendations',
      'WASM Optimizations',
      'Continuous Tests',
    ],
    canonicalIntegrationsTrigger: 'f116-migrated-integrations-dropdown',
    nextPhase: 'F117 should connect active modality profiles with Memoria IA defaults, report templates and Evidence Pack routing.',
    decision: 'F116 keeps Archivo as the only top-bar utility menu and moves Eficiencia into a canonical Integraciones dropdown without deleting legacy handlers.',
  };
}
