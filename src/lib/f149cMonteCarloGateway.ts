import { buildF149NormativeNumericQa } from './f149NormativeNumericQa';
import { buildF149bFastradClinicalUtility } from './f149bFastradClinicalUtility';
import type { FloorPlan } from '@/types/radshield';

export type F149cEngineId = 'gate-opengate' | 'geant4' | 'egsnrc' | 'openmc' | 'mcnp6' | 'phits' | 'fluka' | 'penelope';
export type F149cEngineStatus = 'recommended-primary' | 'recommended-specialized' | 'available-export' | 'restricted-external';
export type F149cTransportMode = 'forward' | 'reverse-qa' | 'adjoint-external';

export interface F149cEngineCandidate {
  id: F149cEngineId;
  label: string;
  status: F149cEngineStatus;
  bestUse: string;
  exportFormats: string[];
  inputGenerator: string;
  resultImport: string[];
  guardrail: string;
}

export interface F149cGatewayArtifact {
  path: string;
  purpose: string;
  requiredForRelease: boolean;
}

export interface F149cValidationGate {
  id: string;
  label: string;
  status: 'ready' | 'required-before-clinical-use' | 'deferred';
  evidence: string;
}

export interface F149cMonteCarloGatewaySummary {
  phase: 'F149c';
  status: 'implemented-external-gateway-contract';
  sourceBasis: string[];
  engines: F149cEngineCandidate[];
  transportModes: Array<{
    mode: F149cTransportMode;
    label: string;
    implementation: string;
    releaseDecision: string;
  }>;
  exportPackage: {
    releaseReady: boolean;
    packageSchema: string;
    projectFingerprint: string;
    artifacts: F149cGatewayArtifact[];
    supportedModalities: string[];
  };
  validationGates: F149cValidationGate[];
  uiSurfaces: Array<'Memoria IA' | 'PDF Report' | 'Evidence Pack' | 'Update App' | 'MC dialogs'>;
  releaseGuardrails: string[];
  decision: string;
  nextPhase: string;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `f149c-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export const F149C_ENGINE_CANDIDATES: F149cEngineCandidate[] = [
  {
    id: 'gate-opengate',
    label: 'GATE / OpenGATE',
    status: 'recommended-primary',
    bestUse: 'Medicina nuclear, PET/SPECT, dosimetria, radioterapia y escenarios medicos scriptables.',
    exportFormats: ['gate.py', 'materials.json', 'sources.json', 'scoring.json', 'geometry.gdml'],
    inputGenerator: 'Generador Python declarativo desde floorplan/equipos/materiales.',
    resultImport: ['dose-map.csv', 'actors.json', 'stat.txt', 'vtk/nii maps'],
    guardrail: 'Requiere instalacion externa, version fijada, fisica documentada y QA contra caso conocido antes de uso clinico.',
  },
  {
    id: 'geant4',
    label: 'Geant4',
    status: 'recommended-primary',
    bestUse: 'Transporte general de particulas, blindaje de bunker, trayectorias, scoring y geometria CAD/GDML.',
    exportFormats: ['geant4.mac', 'geometry.gdml', 'materials.gdml', 'run_manifest.json'],
    inputGenerator: 'Extension del useMCBridge actual con material stacks, detectores y scoring mesh.',
    resultImport: ['dose.csv', 'flux.csv', 'tracks.csv', 'summary.json'],
    guardrail: 'No se certifica por si solo; se exige physics list, cortes, semillas, historias, incertidumbre y reporte QA.',
  },
  {
    id: 'egsnrc',
    label: 'EGSnrc',
    status: 'recommended-specialized',
    bestUse: 'Fotones/electrones/positrones para radioterapia, haces y dosimetria detallada.',
    exportFormats: ['egs.inp', 'egsgeom.egsinp', 'beam_model.json'],
    inputGenerator: 'Plantillas para barrera plana, cuarto simplificado y comparacion de material.',
    resultImport: ['egsdat', '3ddose', 'statdose.csv'],
    guardrail: 'Excelente para fisica de fotones/electrones, pero requiere compilacion y modelos de haz validados.',
  },
  {
    id: 'openmc',
    label: 'OpenMC',
    status: 'recommended-specialized',
    bestUse: 'Neutrones/fotones, ciclotron, fixed-source, CAD/DAGMC y analisis nuclear/ingenieril.',
    exportFormats: ['model.xml', 'materials.xml', 'settings.xml', 'tallies.xml', 'geometry.h5m'],
    inputGenerator: 'Escenarios de neutrones/ciclotron y fuentes fijas con tallies de flujo/dosis.',
    resultImport: ['statepoint.h5', 'summary.h5', 'mesh.csv'],
    guardrail: 'Usar para blindaje neutrónico e ingenieria; no sustituye GATE/EGSnrc en dosimetria clinica de paciente.',
  },
  {
    id: 'mcnp6',
    label: 'MCNP6',
    status: 'restricted-external',
    bestUse: 'Blindaje avanzado, neutrones, detectores y benchmarks historicos.',
    exportFormats: ['mcnp.i', 'materials_cards.txt', 'tallies.txt'],
    inputGenerator: 'Deck exportable si el usuario tiene licencia/instalacion valida.',
    resultImport: ['mctal', 'outp', 'mesh tally csv'],
    guardrail: 'Distribucion restringida/export-control; RadShield-MX solo debe exportar/importar, no redistribuir ni embeder.',
  },
  {
    id: 'phits',
    label: 'PHITS',
    status: 'available-export',
    bestUse: 'Iones, protones, neutrones, ciclotron y proteccion radiologica de altas energias.',
    exportFormats: ['phits.inp', 'material_cards.txt'],
    inputGenerator: 'Plantillas por ciclotron, target, bunker y barreras gruesas.',
    resultImport: ['dose.out', 't-track.out', 'mesh.csv'],
    guardrail: 'Mantener como integracion externa con control de version y validacion por caso.',
  },
  {
    id: 'fluka',
    label: 'FLUKA',
    status: 'available-export',
    bestUse: 'Protones, activacion, residual dose, shielding de aceleradores y altas energias.',
    exportFormats: ['fluka.inp', 'geometry.inc', 'materials.inc'],
    inputGenerator: 'Exportador de escenarios constructivos/estructurales de acelerador.',
    resultImport: ['fort.*', 'usrbin.csv', 'residual-dose.csv'],
    guardrail: 'Licencia/instalacion externa; resultados deben quedar anexados con hash y version.',
  },
  {
    id: 'penelope',
    label: 'PENELOPE',
    status: 'available-export',
    bestUse: 'Transporte acoplado electron-foton y comparacion de barreras a energias diagnosticas/terapia.',
    exportFormats: ['penelope.in', 'geometry.geo', 'materials.mat'],
    inputGenerator: 'Plantillas para slab, multilayer y fuentes puntuales/haz.',
    resultImport: ['tally.dat', 'dose_depth.csv'],
    guardrail: 'Integracion externa; no mezclar resultados con NCRP sin etiqueta MC y estimacion de incertidumbre.',
  },
];

const BASE_ARTIFACTS: F149cGatewayArtifact[] = [
  { path: 'mc_gateway/manifest.json', purpose: 'Hash, version, modalidad, motor, fecha, usuario y guardrails.', requiredForRelease: true },
  { path: 'mc_gateway/geometry.gdml', purpose: 'Geometria 3D exportable derivada del floorplan, barreras y equipos.', requiredForRelease: true },
  { path: 'mc_gateway/materials.json', purpose: 'Materiales con densidad, TVL/HVL, incertidumbre, proveedor y fuente/hash.', requiredForRelease: true },
  { path: 'mc_gateway/sources.json', purpose: 'Fuentes DX/TX/NM/CY, energia/espectro, posicion, orientacion y actividad/workload.', requiredForRelease: true },
  { path: 'mc_gateway/scoring.json', purpose: 'Detectores, puntos criticos, mallas 2D/3D, H*(10), air kerma, flujo y dosis.', requiredForRelease: true },
  { path: 'mc_gateway/gate.py', purpose: 'Script primario recomendado para GATE/OpenGATE.', requiredForRelease: false },
  { path: 'mc_gateway/geant4.mac', purpose: 'Macro Geant4 para validacion general y trazas.', requiredForRelease: false },
  { path: 'mc_gateway/egsnrc.egsinp', purpose: 'Plantilla EGSnrc para fotones/electrones cuando aplique.', requiredForRelease: false },
  { path: 'mc_gateway/openmc_model.xml', purpose: 'Plantilla OpenMC para neutrones/fotones y fuentes fijas.', requiredForRelease: false },
  { path: 'mc_gateway/results_import_schema.json', purpose: 'Contrato para importar dosis, flujo, incertidumbre y metadata externa.', requiredForRelease: true },
];

function buildProjectFingerprint(floorPlan?: FloorPlan): string {
  if (!floorPlan) return stableHash('no-floorplan-f149c');
  const barrierSummary = floorPlan.barriers
    .map((barrier) => `${barrier.id}:${barrier.name}:${barrier.materialCode ?? 'NA'}:${barrier.x1},${barrier.y1},${barrier.x2},${barrier.y2}`)
    .join('|');
  const sourceSummary = floorPlan.sources
    .map((source) => `${source.id}:${source.name}:${source.modality?.id ?? 'NA'}:${source.x},${source.y}`)
    .join('|');
  return stableHash(`${floorPlan.name}|${floorPlan.scale_m_per_pixel}|${barrierSummary}|${sourceSummary}`);
}

export function buildF149cMonteCarloGateway(floorPlan?: FloorPlan): F149cMonteCarloGatewaySummary {
  const f149 = buildF149NormativeNumericQa();
  const f149b = buildF149bFastradClinicalUtility();
  const projectFingerprint = buildProjectFingerprint(floorPlan);
  const validationGates: F149cValidationGate[] = [
    {
      id: 'numeric-qa',
      label: 'QA numerico NCRP/IAEA/UAQ',
      status: f149.releaseReady ? 'ready' : 'required-before-clinical-use',
      evidence: `F149 ${f149.totals.passed}/${f149.totals.total}; bloqueos ${f149.totals.releaseBlocking}.`,
    },
    {
      id: 'export-smoke',
      label: 'Smoke de exportacion documental',
      status: f149b.exportSmoke.releaseReady ? 'ready' : 'required-before-clinical-use',
      evidence: f149b.exportSmoke.surfaces.map((surface) => `${surface.surface}:${surface.status}`).join(' | '),
    },
    {
      id: 'commissioning-dataset',
      label: 'Dataset de commissioning del motor externo',
      status: 'required-before-clinical-use',
      evidence: 'Debe anexar version del motor, physics list/cross-section data, semillas, historias, incertidumbre y caso benchmark.',
    },
    {
      id: 'reverse-mc-validation',
      label: 'Reverse/adjoint MC validado',
      status: 'deferred',
      evidence: 'En release se permite back-projection QA; reverse/adjoint fisico queda en motor externo validado.',
    },
  ];

  const releaseReady = validationGates
    .filter((gate) => gate.id === 'numeric-qa' || gate.id === 'export-smoke')
    .every((gate) => gate.status === 'ready');

  return {
    phase: 'F149c',
    status: 'implemented-external-gateway-contract',
    sourceBasis: [
      'FASTRAD F149b: forward/reverse MC queda externo hasta validacion.',
      'GATE/OpenGATE: ruta primaria para medicina nuclear, radioterapia y dosimetria scriptable.',
      'Geant4: toolkit general para transporte, GDML, tracking y scoring.',
      'EGSnrc/OpenMC: motores especializados para foton/electron y neutron/fixed-source.',
      'Base local RadShield-MX: useMCBridge, monteCarloEngine surrogate, nativeMCEngine educativo y dialogs MC existentes.',
    ],
    engines: F149C_ENGINE_CANDIDATES,
    transportModes: [
      {
        mode: 'forward',
        label: 'Forward Monte Carlo externo',
        implementation: 'Exportar geometria/materiales/fuentes/scoring; ejecutar en GATE/Geant4/EGSnrc/OpenMC; reimportar resultados con incertidumbre.',
        releaseDecision: 'Permitido como paquete externo trazable; no bloquea RC si no se ejecuta motor externo.',
      },
      {
        mode: 'reverse-qa',
        label: 'Reverse QA deterministico',
        implementation: 'Back-projection detector->fuente, ray tracing inverso, ruta critica, seis caras y espesor equivalente.',
        releaseDecision: 'Permitido en app como QA visual y explicabilidad; no se etiqueta Monte Carlo fisico.',
      },
      {
        mode: 'adjoint-external',
        label: 'Reverse/adjoint MC fisico',
        implementation: 'Conectar solo a motor externo con validacion, dataset y reporte QA.',
        releaseDecision: 'Diferido post-RC.',
      },
    ],
    exportPackage: {
      releaseReady,
      packageSchema: 'radshield-mx.mc-gateway.f149c.v1',
      projectFingerprint,
      artifacts: BASE_ARTIFACTS,
      supportedModalities: ['DX', 'TX', 'NM', 'CY'],
    },
    validationGates,
    uiSurfaces: ['Memoria IA', 'PDF Report', 'Evidence Pack', 'Update App', 'MC dialogs'],
    releaseGuardrails: [
      'No declarar equivalencia clinica Monte Carlo sin motor externo validado.',
      'Todo resultado importado debe incluir version del motor, entradas, semilla, historias, incertidumbre, tiempo de corrida y hash de archivos.',
      'Los resultados MC complementan NCRP/IAEA/UAQ; no reemplazan automaticamente la metodologia normativa.',
      'MCNP/FLUKA/PHITS/PENELOPE se tratan como instalaciones/licencias externas del usuario.',
      'Reverse MC real queda post-RC; en release solo se habilita reverse QA deterministico.',
    ],
    decision:
      'F149c implementa el gateway externo validable: export/import, manifiesto, guardrails y superficies de evidencia. El release puede continuar sin ejecutar Monte Carlo clinico real.',
    nextPhase: 'F150 release candidate controlado con smoke visual/runtime y paquete final; MC real queda como integracion externa post-RC.',
  };
}

export function formatF149cMonteCarloGatewayText(summary = buildF149cMonteCarloGateway()): string {
  return [
    'F149C MONTE CARLO GATEWAY EXTERNO VALIDABLE',
    `   Estado: ${summary.status}; releaseReady=${summary.exportPackage.releaseReady ? 'si' : 'no'}.`,
    `   Schema: ${summary.exportPackage.packageSchema}; fingerprint=${summary.exportPackage.projectFingerprint}.`,
    `   Motores primarios: ${summary.engines.filter((engine) => engine.status === 'recommended-primary').map((engine) => engine.label).join(' | ')}.`,
    `   Motores especializados: ${summary.engines.filter((engine) => engine.status === 'recommended-specialized').map((engine) => engine.label).join(' | ')}.`,
    `   Motores export/licencia externa: ${summary.engines.filter((engine) => engine.status === 'available-export' || engine.status === 'restricted-external').map((engine) => engine.label).join(' | ')}.`,
    '   Modos:',
    ...summary.transportModes.map((mode) => `   - ${mode.label}: ${mode.implementation} Decision: ${mode.releaseDecision}`),
    '   Artefactos:',
    ...summary.exportPackage.artifacts.map((artifact) => `   - ${artifact.path}: ${artifact.purpose}${artifact.requiredForRelease ? ' [release]' : ''}`),
    '   Validaciones:',
    ...summary.validationGates.map((gate) => `   - ${gate.label}: ${gate.status}. ${gate.evidence}`),
    '   Guardrails:',
    ...summary.releaseGuardrails.map((guardrail) => `   - ${guardrail}`),
    `   Decision: ${summary.decision}`,
  ].join('\n');
}
