export type F138MaterialDocStatus = 'rag-ready' | 'needs-ocr' | 'review';

export interface F138MaterialDocSummary {
  id: string;
  title: string;
  family: 'contuplex-td' | 'tmnipol-tvl' | 'high-density-blocks';
  status: F138MaterialDocStatus;
  role: 'vendor-datasheet' | 'tvl-report' | 'characterization-report';
  expectedUse: string[];
}

export interface F138RobotStructuralOpportunity {
  id: string;
  label: string;
  sourceCapability: string;
  cypeCoverage: 'covered' | 'partial' | 'not-covered';
  radshieldAction: string;
  priority: 'now' | 'next' | 'later';
}

export interface F138MaterialRagRobotSummary {
  phase: 'F138';
  status: 'implemented-index-draft';
  materialDocuments: F138MaterialDocSummary[];
  robotOpportunities: F138RobotStructuralOpportunity[];
  appImprovements: string[];
  phasePlan: string[];
  deployDecision: string;
  decision: string;
}

export const F138_MATERIAL_DOCUMENTS: F138MaterialDocSummary[] = [
  {
    id: 'contuplex-td-350',
    title: 'Tabique TD-350 CONTUPLEX',
    family: 'contuplex-td',
    status: 'rag-ready',
    role: 'vendor-datasheet',
    expectedUse: ['material library', 'shielding comparison', 'structural load estimate', 'memoria IA citation'],
  },
  {
    id: 'contuplex-td-400',
    title: 'Tabique TD-400 CONTUPLEX',
    family: 'contuplex-td',
    status: 'rag-ready',
    role: 'vendor-datasheet',
    expectedUse: ['material library', 'shielding comparison', 'structural load estimate', 'memoria IA citation'],
  },
  {
    id: 'contuplex-td-500',
    title: 'Tabique TD-500 CONTUPLEX',
    family: 'contuplex-td',
    status: 'rag-ready',
    role: 'vendor-datasheet',
    expectedUse: ['material library', 'shielding comparison', 'structural load estimate', 'memoria IA citation'],
  },
  {
    id: 'contuplex-td-550',
    title: 'Tabique TD-550 CONTUPLEX',
    family: 'contuplex-td',
    status: 'rag-ready',
    role: 'vendor-datasheet',
    expectedUse: ['material library', 'shielding comparison', 'structural load estimate', 'memoria IA citation'],
  },
  {
    id: 'tmnipol-tvl-2021',
    title: 'TMNIPOL reporte determinacion TVL 2021',
    family: 'tmnipol-tvl',
    status: 'rag-ready',
    role: 'tvl-report',
    expectedUse: ['TVL evidence', 'calculation audit', 'vendor validation', 'memoria IA citation'],
  },
  {
    id: 'tmnipol-td-375-tvl-2020',
    title: 'Reporte final determinacion TVL bloques alta densidad TD-375',
    family: 'tmnipol-tvl',
    status: 'rag-ready',
    role: 'tvl-report',
    expectedUse: ['TVL evidence', 'calculation audit', 'density interpolation review', 'memoria IA citation'],
  },
  {
    id: 'bloques-hd-characterization',
    title: 'Caracterizacion de bloques HD',
    family: 'high-density-blocks',
    status: 'rag-ready',
    role: 'characterization-report',
    expectedUse: ['mechanical properties', 'structural load estimate', 'vendor validation'],
  },
  {
    id: 'scanpro-hd-materials',
    title: 'ScanPRO high-density material scan',
    family: 'high-density-blocks',
    status: 'review',
    role: 'characterization-report',
    expectedUse: ['source review', 'mechanical properties', 'vendor validation', 'partial OCR review'],
  },
];

export const F138_ROBOT_STRUCTURAL_OPPORTUNITIES: F138RobotStructuralOpportunity[] = [
  {
    id: 'finite-element-mesh-readiness',
    label: 'FEM mesh readiness for shielding walls',
    sourceCapability: 'Robot finite element auto-meshing',
    cypeCoverage: 'partial',
    radshieldAction: 'Add an export/checklist that flags walls needing shell/plate FEM review by load, openings, supports and discontinuities.',
    priority: 'next',
  },
  {
    id: 'modal-nonlinear-seismic-loadcases',
    label: 'Modal/nonlinear load case registry',
    sourceCapability: 'Static, modal and nonlinear structural analysis',
    cypeCoverage: 'partial',
    radshieldAction: 'Track when shielding mass changes require modal/seismic/nonlinear review instead of only kg/m2 alerts.',
    priority: 'next',
  },
  {
    id: 'wind-and-sequential-self-weight',
    label: 'Sequential self-weight and temporary load states',
    sourceCapability: 'Sequential self-weight and wind load workflows',
    cypeCoverage: 'not-covered',
    radshieldAction: 'Add construction sequence risk for modular high-density blocks: temporary stacking, pallet loads and partial-height walls.',
    priority: 'now',
  },
  {
    id: 'open-api-results-bridge',
    label: 'Structural API result bridge',
    sourceCapability: 'Open API to create parametric structures and extract results',
    cypeCoverage: 'not-covered',
    radshieldAction: 'Define JSON exchange for external structural software results: deflection, utilization, reactions, warnings and reviewer stamp.',
    priority: 'later',
  },
  {
    id: 'revit-bim-roundtrip',
    label: 'Revit/BIM analytical roundtrip',
    sourceCapability: 'BIM-integrated Revit data exchange',
    cypeCoverage: 'partial',
    radshieldAction: 'Use IFC/Revit metadata to keep shielding wall IDs, material choices and structural review status synchronized.',
    priority: 'next',
  },
];

export function buildF138MaterialRagRobotSummary(): F138MaterialRagRobotSummary {
  return {
    phase: 'F138',
    status: 'implemented-index-draft',
    materialDocuments: F138_MATERIAL_DOCUMENTS,
    robotOpportunities: F138_ROBOT_STRUCTURAL_OPPORTUNITIES,
    appImprovements: [
      'Seed Contuplex/TM NIPOLL documents into RAG as vendor evidence with page refs and hashes.',
      'OCR recovery for the two high-density characterization PDFs is complete; ScanPRO keeps a partial page warning.',
      'Add material-library rows only after resolving TVL/density discrepancies.',
      'Expose vendor evidence in MaterialComparisonDialog and Memoria IA calculation citations.',
      'Add construction sequence risk for heavy modular blocks and pallet staging.',
      'Plan a professional quick-access restyle after release cutover: compact command chips, favorites, status badges and command palette.',
      'Keep deploy public gated until F137 external URL/secrets/DB backup gates are satisfied.',
    ],
    phasePlan: [
      'F139 live material seed and duplicate/citation validation',
      'F141 recovered OCR blockers for material characterization PDFs',
      'F140 manual usuario + manual versiones + control de cambios + auditoria tecnica',
      'F142 Memoria IA material-evidence workflow',
      'F143 public deploy URL smoke and release package refresh',
    ],
    deployDecision:
      'F137 allows controlled cutover preparation, but public deploy remains blocked until URL smoke, production secrets and DB backup are complete.',
    decision:
      'F138 converts the new high-density block PDFs into a RAG/DB-ready material evidence package and adds Autodesk Robot-inspired structural verification gaps beyond CYPECAD coverage.',
  };
}
