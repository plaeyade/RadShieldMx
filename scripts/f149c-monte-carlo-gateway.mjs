import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f149c_monte_carlo_gateway');
const jsonPath = path.join(outDir, 'f149c_monte_carlo_gateway.json');
const mdPath = path.join(root, 'outputs', 'fase_149c_monte_carlo_gateway.md');

const engines = [
  { id: 'gate-opengate', label: 'GATE / OpenGATE', status: 'recommended-primary', bestUse: 'Medicina nuclear, PET/SPECT, dosimetria y radioterapia scriptable.' },
  { id: 'geant4', label: 'Geant4', status: 'recommended-primary', bestUse: 'Transporte general, GDML, tracking, scoring y blindaje 3D.' },
  { id: 'egsnrc', label: 'EGSnrc', status: 'recommended-specialized', bestUse: 'Fotones/electrones/positrones para radioterapia y dosimetria.' },
  { id: 'openmc', label: 'OpenMC', status: 'recommended-specialized', bestUse: 'Neutrones/fotones, ciclotron, fixed-source y CAD/DAGMC.' },
  { id: 'mcnp6', label: 'MCNP6', status: 'restricted-external', bestUse: 'Blindaje avanzado y benchmarks con licencia/instalacion del usuario.' },
  { id: 'phits', label: 'PHITS', status: 'available-export', bestUse: 'Iones, protones, neutrones y proteccion de altas energias.' },
  { id: 'fluka', label: 'FLUKA', status: 'available-export', bestUse: 'Protones, activacion, residual dose y aceleradores.' },
  { id: 'penelope', label: 'PENELOPE', status: 'available-export', bestUse: 'Electron-foton y comparacion de barreras.' },
];

const artifacts = [
  ['mc_gateway/manifest.json', 'Hash, version, modalidad, motor, fecha y guardrails.', true],
  ['mc_gateway/geometry.gdml', 'Geometria exportable desde floorplan.', true],
  ['mc_gateway/materials.json', 'Materiales con TVL/densidad/incertidumbre/fuente/hash.', true],
  ['mc_gateway/sources.json', 'Fuentes DX/TX/NM/CY con energia, posicion y workload.', true],
  ['mc_gateway/scoring.json', 'Detectores, mallas y cantidades H*(10)/kerma/flujo/dosis.', true],
  ['mc_gateway/gate.py', 'Script primario GATE/OpenGATE.', false],
  ['mc_gateway/geant4.mac', 'Macro Geant4.', false],
  ['mc_gateway/egsnrc.egsinp', 'Plantilla EGSnrc.', false],
  ['mc_gateway/openmc_model.xml', 'Plantilla OpenMC.', false],
  ['mc_gateway/results_import_schema.json', 'Contrato de importacion de resultados externos.', true],
].map(([pathName, purpose, requiredForRelease]) => ({ path: pathName, purpose, requiredForRelease }));

const manifest = {
  phase: 'F149c',
  title: 'Monte Carlo Gateway externo validable',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.mc-gateway.f149c.v1',
  engines,
  transportModes: [
    {
      mode: 'forward',
      decision: 'Exportar a motor externo, ejecutar fuera de RadShield-MX e importar resultados con incertidumbre.',
    },
    {
      mode: 'reverse-qa',
      decision: 'Permitir back-projection/ray tracing inverso como QA deterministico, sin etiqueta Monte Carlo fisico.',
    },
    {
      mode: 'adjoint-external',
      decision: 'Diferir reverse/adjoint MC real hasta contar con motor externo validado.',
    },
  ],
  artifacts,
  releaseGuardrails: [
    'No declarar equivalencia clinica Monte Carlo sin motor externo validado.',
    'Todo resultado importado debe incluir version del motor, entradas, semillas, historias, incertidumbre y hash.',
    'MC complementa NCRP/IAEA/UAQ; no reemplaza automaticamente la metodologia normativa.',
    'MCNP/FLUKA/PHITS/PENELOPE quedan como instalaciones/licencias externas del usuario.',
    'Reverse MC real queda post-RC; release solo incluye reverse QA deterministico.',
  ],
  requiredSurfaces: [
    'src/sections/dialogs/MemoriaAIWizard.tsx',
    'src/sections/dialogs/PdfReportDialog.tsx',
    'src/sections/dialogs/EvidencePackDialog.tsx',
    'src/sections/dialogs/UpdateAppDialog.tsx',
  ],
  releaseReady: true,
  nextPhase: 'F150 release candidate controlado; MC real post-RC como integracion externa validada.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F149c - Monte Carlo Gateway Externo Validable',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  '## Decision',
  '',
  'F149c implementa contrato export/import para motores externos y evita declarar un motor Monte Carlo clinico nativo sin validacion.',
  '',
  '## Motores',
  '',
  ...engines.map((engine) => `- ${engine.label} (${engine.status}): ${engine.bestUse}`),
  '',
  '## Artefactos',
  '',
  ...artifacts.map((artifact) => `- ${artifact.path}: ${artifact.purpose}${artifact.requiredForRelease ? ' [release]' : ''}`),
  '',
  '## Guardrails',
  '',
  ...manifest.releaseGuardrails.map((item) => `- ${item}`),
  '',
  `Siguiente fase: ${manifest.nextPhase}`,
  '',
].join('\n'), 'utf8');

console.log(`F149c Monte Carlo gateway written: ${path.relative(root, jsonPath)}`);
