import { buildF264RealClinicalTrialGate } from './realClinicalTrialCases';

export type F265TestArea =
  | 'calculation'
  | 'floorplan'
  | 'materials'
  | 'rag-citations'
  | 'report-export'
  | 'ui-workflow';

export type F265TestStatus = 'ready' | 'requires-real-input' | 'blocked';

export interface F265RealTestStep {
  id: string;
  label: string;
  area: F265TestArea;
  acceptanceCriteria: string[];
  evidenceToCapture: string[];
  blockingIfMissing: boolean;
}

export interface F265RealModalityProtocol {
  profile: 'DX' | 'TX' | 'NM' | 'CY';
  label: string;
  status: F265TestStatus;
  requiredInputs: string[];
  testSteps: F265RealTestStep[];
}

export interface F265RealAppTestingProtocol {
  phase: 'F265';
  schema: 'radshield-mx.real-app-testing-protocol.f265.v1';
  status: 'ready-for-operator-real-testing' | 'waiting-for-real-inputs';
  generatedAt: string;
  f264Status: string;
  modalityProtocols: F265RealModalityProtocol[];
  deviationLogTemplate: Array<{
    field: string;
    purpose: string;
  }>;
  releaseRule: string;
}

const commonSteps: F265RealTestStep[] = [
  {
    id: 'floorplan-scale-zone',
    label: 'Cargar o dibujar plano, fijar escala y declarar zonas controladas/publicas',
    area: 'floorplan',
    acceptanceCriteria: [
      'El canvas conserva sidebar, toolbar, quick access y panel de flujo sin tapar el area de dibujo.',
      'La escala queda visible y puede comprobarse con una cota conocida.',
      'Cada zona tiene nombre, ocupacion T, meta P y relacion con una barrera.',
    ],
    evidenceToCapture: ['captura del canvas', 'escala usada', 'lista de zonas', 'hash/import source si aplica'],
    blockingIfMissing: true,
  },
  {
    id: 'equipment-source',
    label: 'Colocar equipo/fuente y confirmar workload, energia y modalidad',
    area: 'calculation',
    acceptanceCriteria: [
      'El perfil DX/TX/NM/CY coincide con el equipo real.',
      'Workload, U, T, P, distancia y energia quedan visibles antes del calculo.',
      'Energia mayor a 10 MV emite advertencia de neutrones.',
    ],
    evidenceToCapture: ['snapshot de equipo', 'inputs de calculo', 'warnings clinicos'],
    blockingIfMissing: true,
  },
  {
    id: 'material-selection',
    label: 'Elegir material y validar TVL/densidad/peso/costo/carga estructural',
    area: 'materials',
    acceptanceCriteria: [
      'El material muestra TVL/HVL o advertencia de fuente no versionada.',
      'Densidad, kg/m2, kPa, costo/m2 y tiempo estimado se calculan en unidades normalizadas.',
      'Los materiales especiales quedan marcados como proveedor/revision si no son canonicos NCRP/IAEA.',
    ],
    evidenceToCapture: ['codigo material', 'TVL/HVL usado', 'densidad', 'carga estructural', 'cita/hash'],
    blockingIfMissing: true,
  },
  {
    id: 'calculation-evidence',
    label: 'Ejecutar calculo y revisar formula, norma, inputs, outputs y comparador',
    area: 'calculation',
    acceptanceCriteria: [
      'Cada barrera calculada tiene formulaId, standard, inputs, outputs, assumptions y citationIds.',
      'El comparador base/conservador existe y no contradice el espesor seleccionado.',
      'La cache F196 cambia si se altera escala, geometria, material, P, T, U o workload.',
    ],
    evidenceToCapture: ['resultado por barrera', 'trace', 'comparison', 'calculationCacheKey'],
    blockingIfMissing: true,
  },
  {
    id: 'rag-report-export',
    label: 'Generar Memoria IA/PDF/Evidence Pack y verificar citas',
    area: 'report-export',
    acceptanceCriteria: [
      'La memoria incluye paso a paso desde plano/equipo hasta espesor recomendado.',
      'Cada resultado conserva cita, pagina/hash cuando exista, advertencias y revision requerida.',
      'PDF/Evidence Pack no elimina anexos de materiales, QA numerico ni checklist CNSNS/UAQ.',
    ],
    evidenceToCapture: ['Memoria IA exportada', 'PDF', 'Evidence Pack', 'deviation log'],
    blockingIfMissing: true,
  },
];

export function buildF265RealAppTestingProtocol(): F265RealAppTestingProtocol {
  const f264 = buildF264RealClinicalTrialGate();
  const modalityProtocols: F265RealModalityProtocol[] = [
    {
      profile: 'DX',
      label: 'Diagnostico: RX/CT/CBCT',
      status: 'requires-real-input',
      requiredInputs: ['plano o DXF de sala', 'equipo y tecnica', 'workload semanal', 'zonas y ocupacion', 'materiales reales'],
      testSteps: commonSteps,
    },
    {
      profile: 'TX',
      label: 'Terapia: LINAC, Gamma Knife, HDR',
      status: 'requires-real-input',
      requiredInputs: ['memoria analitica previa', 'isocentro', 'workload W', 'U/T/P por barrera', 'energia/modalidad', 'materiales y espesores existentes'],
      testSteps: commonSteps,
    },
    {
      profile: 'NM',
      label: 'Medicina nuclear: PET/SPECT/radiofarmacia',
      status: 'requires-real-input',
      requiredInputs: ['actividad por paciente/lote', 'pacientes por semana', 'tiempos de permanencia', 'zonas controladas', 'materiales y blindajes locales'],
      testSteps: commonSteps,
    },
    {
      profile: 'CY',
      label: 'Ciclotron: produccion/maze/activacion',
      status: 'requires-real-input',
      requiredInputs: ['energia protones', 'corriente', 'target', 'tiempos de operacion', 'maze/puertas', 'datos estructurales y ventilacion'],
      testSteps: commonSteps,
    },
  ];

  return {
    phase: 'F265',
    schema: 'radshield-mx.real-app-testing-protocol.f265.v1',
    status: f264.status === 'ready-for-real-app-testing'
      ? 'ready-for-operator-real-testing'
      : 'waiting-for-real-inputs',
    generatedAt: new Date().toISOString(),
    f264Status: f264.status,
    modalityProtocols,
    deviationLogTemplate: [
      { field: 'caseId', purpose: 'Identificador unico del caso real probado.' },
      { field: 'modalityProfile', purpose: 'DX, TX, NM o CY.' },
      { field: 'expectedFromSignedMemory', purpose: 'Valor o criterio de la memoria/reporte previo.' },
      { field: 'radshieldOutput', purpose: 'Valor generado por RadShield-MX.' },
      { field: 'difference', purpose: 'Diferencia absoluta/relativa y unidad.' },
      { field: 'classification', purpose: 'calculation | data | floorplan | material | citation | report | ui.' },
      { field: 'severity', purpose: 'blocker | major | minor | observation.' },
      { field: 'resolution', purpose: 'Accion correctiva o decision de revision profesional.' },
    ],
    releaseRule:
      'No pasar a release clinico firmado hasta completar al menos un caso real DX, TX y NM; CY puede quedar como gated si no hay datos reales. Cualquier desviacion blocker/major debe corregirse o documentarse como limitacion explicita.',
  };
}

export function summarizeF265RealAppTestingProtocol(protocol = buildF265RealAppTestingProtocol()): string {
  return [
    'F265 REAL APP TESTING PROTOCOL',
    `Status: ${protocol.status}`,
    `F264 prerequisite: ${protocol.f264Status}`,
    ...protocol.modalityProtocols.map((item) => `- ${item.profile}: ${item.label} (${item.status}) inputs=${item.requiredInputs.length} steps=${item.testSteps.length}`),
    `Release rule: ${protocol.releaseRule}`,
  ].join('\n');
}
