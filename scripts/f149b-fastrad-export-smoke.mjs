import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f149b_fastrad_export_smoke');
const jsonPath = path.join(outDir, 'f149b_fastrad_export_smoke.json');
const mdPath = path.join(root, 'outputs', 'fase_149b_fastrad_export_smoke.md');

const sourceFacts = [
  {
    id: 'interface-modeling-step-gdml',
    source: 'https://www.fastrad.net/modules/',
    lines: '22-44',
    fact: 'FASTRAD supports 3D radiation models, STEP import/export, material retrieval from AP214_is and GDML exchange.',
    radshieldUse: 'Keep STEP/GDML as external import/export inspiration for Medical 3D and CAD workflows.',
  },
  {
    id: 'sector-ray-six-face-spot',
    source: 'https://www.fastrad.net/modules/',
    lines: '56-90',
    fact: 'FASTRAD sector analysis includes ray-tracing, isolated detectors, 2D/3D mappings, six-face equivalent thickness and spot-shielding projection.',
    radshieldUse: 'Adopt sector QA, six-face equivalent summary and future spot-shielding annotations.',
  },
  {
    id: 'monte-carlo-scripting-depth',
    source: 'https://www.fastrad.net/modules/',
    lines: '94-139',
    fact: 'FASTRAD offers forward/reverse Monte Carlo, particle trajectories, 3D mappings, depth curves and scripting.',
    radshieldUse: 'Keep true Monte Carlo external; adopt depth-curve and scenario scripting patterns as post-RC backlog.',
  },
  {
    id: 'radiation-protection-mapping',
    source: 'https://www.fastrad.net/modules/',
    lines: '215-234',
    fact: 'FASTRAD radiation protection can estimate ICRP/ICRU quantities and map critical radiation areas.',
    radshieldUse: 'Use as UX inspiration for effective dose/isodose critical-area maps, not as a substitute for medical shielding standards.',
  },
];

const manifest = {
  phase: 'F149b',
  title: 'FASTRAD clinical utility analysis + export smoke',
  generatedAt: new Date().toISOString(),
  sourceUrl: 'https://www.fastrad.net/modules/',
  sourceFacts,
  adoptedNow: [
    'sector ray-tracing critical path QA',
    'six-face equivalent thickness room summary',
    'export smoke across Memoria IA, PDF Report, Evidence Pack and Update App',
  ],
  deferred: [
    'spot-shielding annotations for penetrations and local inserts',
    'material depth curves for thickness/cost/weight/time comparisons',
    'declarative scenario portfolio for modality regression cases',
    'educational trajectory overlay in 3D medical inspection',
  ],
  externalOnly: [
    'forward/reverse Monte Carlo transport remains external until validated engine, commissioning dataset and QA report exist',
  ],
  requiredSurfaces: [
    'src/sections/dialogs/MemoriaAIWizard.tsx',
    'src/sections/dialogs/PdfReportDialog.tsx',
    'src/sections/dialogs/EvidencePackDialog.tsx',
    'src/sections/dialogs/UpdateAppDialog.tsx',
  ],
  nextPhase: 'F150 release candidate after final visual/runtime smoke.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F149b - FASTRAD Utility + Export Smoke',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  '## Fuente',
  '',
  `- ${manifest.sourceUrl}`,
  '',
  '## Hechos Relevantes',
  '',
  ...sourceFacts.map((item) => `- ${item.id}: ${item.fact} Uso RadShield: ${item.radshieldUse}`),
  '',
  '## Adoptar Ahora',
  '',
  ...manifest.adoptedNow.map((item) => `- ${item}`),
  '',
  '## Diferir',
  '',
  ...manifest.deferred.map((item) => `- ${item}`),
  '',
  '## Mantener Externo',
  '',
  ...manifest.externalOnly.map((item) => `- ${item}`),
  '',
  `Siguiente fase: ${manifest.nextPhase}`,
  '',
].join('\n'), 'utf8');

console.log(`F149b FASTRAD export smoke written: ${path.relative(root, jsonPath)}`);
