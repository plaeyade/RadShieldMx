export interface F198MenuGroupQa {
  id: string;
  triggerTestId: string;
  menuTestId: string;
  label: string;
  criticalFunctions: string[];
  smokePolicy: string;
}

export interface F198FullMenuFunctionQa {
  phase: 'F198';
  status: 'implemented-full-menu-function-qa';
  groups: F198MenuGroupQa[];
  visibleLegacyMenus: string[];
  forbiddenLegacyMenus: string[];
  canvasGuards: string[];
  nextPhase: 'F199';
  decision: string;
}

export const F198_MENU_GROUPS: F198MenuGroupQa[] = [
  {
    id: 'design',
    triggerTestId: 'f96-migrated-design-dropdown',
    menuTestId: 'f96-migrated-design-menu',
    label: 'Diseno',
    criticalFunctions: ['3D Bunker Viewer', 'Floor Plan Features', 'Medical 3D Floor Plan', 'DXF Viewer', 'Point Cloud (LiDAR)', 'Auto-Barrier Detection', 'Real-Time 3D Exploration'],
    smokePolicy: 'Open menu and validate CAD/floorplan/3D/import functions remain visible.',
  },
  {
    id: 'equipment',
    triggerTestId: 'f97-migrated-equipment-dropdown',
    menuTestId: 'f97-migrated-equipment-menu',
    label: 'Equipos',
    criticalFunctions: ['Equipment Library', 'Source Library', 'Gamma Knife', 'Braquiterapia Co-60', 'CBCT/IGRT', 'Medicina Nuclear', 'Cyclone KIUBE'],
    smokePolicy: 'Open menu and validate source/equipment modality entries remain reachable.',
  },
  {
    id: 'shielding',
    triggerTestId: 'f107-migrated-shielding-dropdown',
    menuTestId: 'f107-migrated-shielding-menu',
    label: 'Blindaje',
    criticalFunctions: ['Calcular', 'UAQ', 'Rapido', 'Suelo/Techo', 'Multi-layer / Laminated', 'Neutrones', 'Skyshine', 'AAPM TG 108 PET Shielding', 'Therapy Radionuclide Shielding'],
    smokePolicy: 'Open menu and validate core calculation methods by modality.',
  },
  {
    id: 'verification',
    triggerTestId: 'f108-migrated-verification-dropdown',
    menuTestId: 'f108-migrated-verification-menu',
    label: 'Verificacion',
    criticalFunctions: ['NCRP Validation Suite', 'NCRP 147 vs 151 Cross-Val', 'Shielding Verification', 'Sensitivity Analysis', 'Uncertainty / GUM', 'Mapa de Dosis', 'Performance Dashboard'],
    smokePolicy: 'Open menu and validate QA, uncertainty, dose-map and performance checks.',
  },
  {
    id: 'reports',
    triggerTestId: 'f109-migrated-reports-dropdown',
    menuTestId: 'f109-migrated-reports-menu',
    label: 'Reportes',
    criticalFunctions: ['Memoria IA', 'PDF analitico', 'Reporte CNSNS', 'Dashboard', 'Cost Estimator', 'Checklist CNSNS', 'Annual Dose Report', 'Evidence Pack bridge'],
    smokePolicy: 'Open menu and validate report/export outputs before F199 export smoke.',
  },
  {
    id: 'evidence',
    triggerTestId: 'f110-migrated-evidence-dropdown',
    menuTestId: 'f110-migrated-evidence-menu',
    label: 'Evidencia',
    criticalFunctions: ['Evidence Pack', 'RAG deep dive', 'Reference Library', 'Bibliografia', 'Audit Trail', 'Audit Log', 'Log analysis', 'Technical specs', 'AI source review'],
    smokePolicy: 'Open menu and validate RAG/citation/audit surfaces.',
  },
  {
    id: 'integrations',
    triggerTestId: 'f116-migrated-integrations-dropdown',
    menuTestId: 'f116-migrated-integrations-menu',
    label: 'Integraciones',
    criticalFunctions: ['Performance Dashboard', 'Benchmarks Suite', 'Function Profiler', 'CPU & Memory Profile', 'Technical Audit', 'Code Quality Audit', 'Algorithm Analyzer', 'CATIA-GDML & CAD to ROOT', 'Shielding Design Agent'],
    smokePolicy: 'Open menu and validate performance, audit, CAD/MC and agent integrations.',
  },
];

export function buildF198FullMenuFunctionQa(): F198FullMenuFunctionQa {
  return {
    phase: 'F198',
    status: 'implemented-full-menu-function-qa',
    groups: F198_MENU_GROUPS,
    visibleLegacyMenus: ['Archivo'],
    forbiddenLegacyMenus: ['Calcular', 'Fisica', 'Med. Nuclear', 'Normativa', 'Herramientas', 'Eficiencia'],
    canvasGuards: [
      'f186-sidebar-stable-width',
      'f100-main-floorplan-canvas',
      'f191-pyrate-inspired-toolbar',
      'canvas-workflow-panel or f188-hidden-panel-restore',
    ],
    nextPhase: 'F199',
    decision:
      'F198 validates every canonical menu group function-by-function at visibility/route level while preserving Archivo as the only legacy utility and keeping canvas/sidebar visible.',
  };
}
