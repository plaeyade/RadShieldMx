import { buildF265RealAppTestingProtocol, type F265RealModalityProtocol } from './f265RealAppTestingProtocol';

export type F266Severity = 'blocker' | 'major' | 'minor' | 'observation';
export type F266Disposition = 'open' | 'accepted-limitation' | 'fixed' | 'needs-rso-review';

export interface F266DeviationRow {
  caseId: string;
  modalityProfile: 'DX' | 'TX' | 'NM' | 'CY';
  sourceDocument: string;
  expectedFromSignedMemory: string;
  radshieldOutput: string;
  difference: string;
  classification: 'calculation' | 'data' | 'floorplan' | 'material' | 'citation' | 'report' | 'ui';
  severity: F266Severity;
  disposition: F266Disposition;
  owner: string;
  evidencePath: string;
  notes: string;
}

export interface F266RealCaseChecklist {
  profile: F265RealModalityProtocol['profile'];
  label: string;
  minimumEvidence: string[];
  passCriteria: string[];
  stopCriteria: string[];
}

export interface F266RealCaseEvidenceKit {
  phase: 'F266';
  schema: 'radshield-mx.real-case-evidence-kit.f266.v1';
  status: 'ready-for-real-case-capture' | 'blocked';
  generatedAt: string;
  f265Status: string;
  checklists: F266RealCaseChecklist[];
  deviationCsvHeader: Array<keyof F266DeviationRow>;
  emptyDeviationRow: F266DeviationRow;
  operatorRunOrder: string[];
}

function checklistFor(protocol: F265RealModalityProtocol): F266RealCaseChecklist {
  const shared = [
    'captura-canvas-escala-zonas.png',
    'inputs-equipo-fuente.json',
    'material-tvl-densidad-carga.json',
    'calculation-trace.json',
    'comparador-base-conservador.json',
    'memoria-ia-export.txt',
    'reporte-pdf.pdf',
    'evidence-pack.json',
    'deviation-log.csv',
  ];
  const modalityExtra: Record<F265RealModalityProtocol['profile'], string[]> = {
    DX: ['tecnica-kVp-mAs-DLP-o-workload.pdf', 'ocupacion-publica/controlada.pdf'],
    TX: ['memoria-analitica-previa.pdf', 'tabla-W-U-T-P-por-barrera.csv', 'neutron-review-si-energia-mayor-10MV.md'],
    NM: ['actividad-pacientes-tiempo-permanencia.csv', 'layout-inyeccion-espera-adquisicion.png'],
    CY: ['energia-corriente-target-operacion.csv', 'maze-puertas-ventilacion-activacion.md'],
  };

  return {
    profile: protocol.profile,
    label: protocol.label,
    minimumEvidence: [...shared, ...modalityExtra[protocol.profile]],
    passCriteria: [
      'No hay desviaciones blocker o major abiertas.',
      'Cada barrera critica tiene formula, norma, inputs, outputs, citationIds y warnings visibles.',
      'El espesor calculado coincide con memoria previa dentro de tolerancia definida o tiene justificacion documentada.',
      'El PDF y Evidence Pack preservan anexos de material, QA numerico y limitaciones.',
    ],
    stopCriteria: [
      'Canvas sin escala verificable o zonas sin ocupacion.',
      'Material sin TVL/HVL/densidad versionada y sin advertencia visible.',
      'Diferencia de espesor o dosis clasificada como blocker/major sin resolucion.',
      'Reporte exportado sin trazabilidad de formula/norma/cita.',
    ],
  };
}

export function buildF266RealCaseEvidenceKit(): F266RealCaseEvidenceKit {
  const protocol = buildF265RealAppTestingProtocol();
  const deviationCsvHeader: Array<keyof F266DeviationRow> = [
    'caseId',
    'modalityProfile',
    'sourceDocument',
    'expectedFromSignedMemory',
    'radshieldOutput',
    'difference',
    'classification',
    'severity',
    'disposition',
    'owner',
    'evidencePath',
    'notes',
  ];

  return {
    phase: 'F266',
    schema: 'radshield-mx.real-case-evidence-kit.f266.v1',
    status: protocol.status === 'ready-for-operator-real-testing' ? 'ready-for-real-case-capture' : 'blocked',
    generatedAt: new Date().toISOString(),
    f265Status: protocol.status,
    checklists: protocol.modalityProtocols.map(checklistFor),
    deviationCsvHeader,
    emptyDeviationRow: {
      caseId: '',
      modalityProfile: 'DX',
      sourceDocument: '',
      expectedFromSignedMemory: '',
      radshieldOutput: '',
      difference: '',
      classification: 'calculation',
      severity: 'observation',
      disposition: 'open',
      owner: '',
      evidencePath: '',
      notes: '',
    },
    operatorRunOrder: [
      '1. Seleccionar caso real y perfil DX/TX/NM/CY.',
      '2. Capturar evidencia minima antes de calcular.',
      '3. Ejecutar calculo y exportes.',
      '4. Comparar contra memoria previa o criterio firmado.',
      '5. Registrar desviaciones en CSV.',
      '6. Cerrar blocker/major antes de release clinico firmado.',
    ],
  };
}

export function formatF266DeviationCsvTemplate(kit = buildF266RealCaseEvidenceKit()): string {
  const header = kit.deviationCsvHeader.join(',');
  const row = kit.deviationCsvHeader.map((field) => JSON.stringify(String(kit.emptyDeviationRow[field] ?? ''))).join(',');
  return `${header}\n${row}\n`;
}

export function summarizeF266RealCaseEvidenceKit(kit = buildF266RealCaseEvidenceKit()): string {
  return [
    'F266 REAL CASE EVIDENCE KIT',
    `Status: ${kit.status}`,
    `F265 prerequisite: ${kit.f265Status}`,
    ...kit.checklists.map((item) => `- ${item.profile}: evidence=${item.minimumEvidence.length} pass=${item.passCriteria.length} stop=${item.stopCriteria.length}`),
  ].join('\n');
}
