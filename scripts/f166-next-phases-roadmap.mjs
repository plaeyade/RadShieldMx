import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f166_next_phases_roadmap');
const manifestPath = path.join(outDir, 'f166_next_phases_roadmap.json');
const mdPath = path.join(root, 'outputs', 'fase_166_next_phases_roadmap.md');

fs.mkdirSync(outDir, { recursive: true });

const implemented = [
  {
    phase: 'F159',
    title: 'Sites/local hosting prep',
    status: 'implemented',
    evidence: 'sites-deploy-ready package and contracts OK; external deploy waits for reachable Git/hosting target.',
  },
  {
    phase: 'F161',
    title: 'Manuales in extenso predeploy',
    status: 'implemented',
    evidence: 'MANUAL_OPERACION_PREDEPLOY_F161.md plus version/manual/changelog addenda.',
  },
  {
    phase: 'F163',
    title: 'Canvas/floorplan release closure',
    status: 'implemented',
    evidence: 'Canvas release summary, RS Designer parity closure and release gates.',
  },
  {
    phase: 'F164',
    title: 'Clinical project map',
    status: 'implemented',
    evidence: 'NuviaTech-style floorplan-derived clinical map in canvas and Update App.',
  },
  {
    phase: 'F165',
    title: 'Clinical outputs closure',
    status: 'implemented',
    evidence: 'SVG/PNG export plan, OCR-ready room classification, flow routes and 2D/3D/report sync targets.',
  },
];

const pendingImprovements = [
  {
    id: 'public-deploy',
    priority: 'P0',
    area: 'Release/deploy',
    status: 'pending-external-url',
    description: 'Repeat F154-F159 against final public HTTPS URL once Git/hosting remote is reachable from Codex.',
  },
  {
    id: 'db-live-final',
    priority: 'P0',
    area: 'DB/persistence',
    status: 'pending-live-credentials',
    description: 'Run backup, restore probe, migration, seed and live validation against MySQL Windows service with production-like DATABASE_URL.',
  },
  {
    id: 'numeric-qa',
    priority: 'P0',
    area: 'Calculo/normativa',
    status: 'pending-expanded-cases',
    description: 'Expand NCRP/IAEA/UAQ numeric QA using known cases and validated analytic memories before calling stable release.',
  },
  {
    id: 'rag-citation-governance',
    priority: 'P1',
    area: 'RAG/documentos',
    status: 'pending-live-ledger',
    description: 'Persist citation ledger, OCR confidence, hashes, canonical source priority and dedup decisions in DB.',
  },
  {
    id: 'canvas-domain-selection',
    priority: 'P1',
    area: 'Canvas/floorplan',
    status: 'pending-runtime-binding',
    description: 'Bind selected clinical-map node to actual canvas object highlight, layer focus and Medical 3D focus state.',
  },
  {
    id: 'visual-export-runtime',
    priority: 'P1',
    area: 'Reports/evidence',
    status: 'pending-ui-action',
    description: 'Expose one-click SVG/PNG export button for clinical map and store figure in Evidence Pack/PDF workflow.',
  },
  {
    id: 'ocr-room-labels',
    priority: 'P2',
    area: 'OCR/OpenCV',
    status: 'pending-ocr-text-boxes',
    description: 'Replace heuristic region-name classifier with OCR text boxes extracted from imported floorplan images.',
  },
  {
    id: 'mc-external-engines',
    priority: 'P2',
    area: 'Monte Carlo',
    status: 'pending-engine-datasets',
    description: 'Connect GATE/OpenGATE, EGSnrc or OpenMC only after datasets, section libraries and validation policy are versioned.',
  },
];

const nextPhases = [
  {
    phase: 'F167',
    title: 'Deploy target recovery + public smoke',
    objective: 'Reconnect Git/hosting target, publish latest source state, then repeat F154-F159 against final URL.',
    includes: ['public-deploy', 'post-deploy-smoke', 'hosting-metadata'],
    exitCriteria: ['HTTPS URL reachable', 'F154 public smoke OK', 'F155/F157 release decision updated'],
  },
  {
    phase: 'F168',
    title: 'DB live finalization',
    objective: 'Finish MySQL Windows live DB path and verify persistence for projects, evidence, chunks and reports.',
    includes: ['db-live-final', 'backup-restore', 'seed-live', 'auth-persistence'],
    exitCriteria: ['backup file exists', 'restore probe OK', 'db:validate:live OK', 'no secrets in artifacts'],
  },
  {
    phase: 'F169',
    title: 'Numeric QA and analytic-memory evidence',
    objective: 'Harden calculation traceability before stable release.',
    includes: ['numeric-qa', 'formula-source-input-output', 'memoria-ia-citation-check'],
    exitCriteria: ['known-case matrix documented', 'tolerances recorded', 'failures triaged'],
  },
  {
    phase: 'F170',
    title: 'RAG citation governance live',
    objective: 'Turn document governance into DB-backed source/citation ledger.',
    includes: ['rag-citation-governance', 'ocr-confidence', 'hash-dedup', 'canonical-priority'],
    exitCriteria: ['ledger persisted', 'duplicates resolved', 'citation picker reads DB source of truth'],
  },
  {
    phase: 'F171',
    title: 'Canvas clinical sync polish',
    objective: 'Bind clinical map, canvas selection, Medical 3D focus and export figures.',
    includes: ['canvas-domain-selection', 'visual-export-runtime', 'ocr-room-labels'],
    exitCriteria: ['node click highlights canvas objects', '3D opens focused context', 'SVG/PNG export button works'],
  },
  {
    phase: 'F172',
    title: 'Release candidate final',
    objective: 'Freeze large changes, rebuild package, rerun smoke suite and produce final handoff.',
    includes: ['F159 package', 'F161 manuals', 'F167-F171 evidence', 'release checklist'],
    exitCriteria: ['clean git status', 'build OK', 'contracts OK', 'final URL or controlled-offline package declared'],
  },
];

const manifest = {
  phase: 'F166',
  title: 'Roadmap de siguientes fases',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.next-phases-roadmap.f166.v1',
  status: 'roadmap-ready',
  implemented,
  pendingImprovements,
  nextPhases,
  decision:
    'Continue with F167 only when deploy target/network is ready; otherwise advance F168/F169 locally without blocking UI stabilization.',
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  mdPath,
  [
    '# F166 - Roadmap De Siguientes Fases',
    '',
    `Generado: ${manifest.generatedAt}`,
    `Estado: ${manifest.status}`,
    '',
    '## Ya Implementado',
    '',
    ...implemented.map((item) => `- ${item.phase}: ${item.title} (${item.status}). ${item.evidence}`),
    '',
    '## Puntos De Mejora Pendientes',
    '',
    ...pendingImprovements.map((item) => `- ${item.priority} ${item.id} [${item.area}]: ${item.description}`),
    '',
    '## Siguientes Fases Recomendadas',
    '',
    ...nextPhases.flatMap((item) => [
      `### ${item.phase} - ${item.title}`,
      '',
      item.objective,
      '',
      `Incluye: ${item.includes.join(', ')}`,
      `Criterio de salida: ${item.exitCriteria.join(' | ')}`,
      '',
    ]),
    '## Decision',
    '',
    manifest.decision,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F166 next phases roadmap written: ${path.relative(root, manifestPath)}`);
console.log(`Status: ${manifest.status}`);
