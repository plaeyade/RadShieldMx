import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f331_f338_static_release_close');
const publicUrl = process.env.PUBLIC_DEPLOY_URL || 'https://radshield-mx-static-dist.vercel.app/';
fs.mkdirSync(outDir, { recursive: true });

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function readText(relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

function sha256(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
}

function fileEvidence(relativePath) {
  const fullPath = path.join(root, relativePath);
  const present = fs.existsSync(fullPath);
  return {
    path: relativePath,
    present,
    bytes: present ? fs.statSync(fullPath).size : 0,
    sha256: present && fs.statSync(fullPath).isFile() ? sha256(relativePath) : null,
  };
}

const f200 = readJson('outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json');
const f229 = readJson('outputs/f229_canvas_cad_e2e_harness/f229_canvas_cad_e2e_harness.json');
const f231F236 = readJson('outputs/f231_f236_canvas_release_coverage/f231_f236_canvas_release_coverage.json');
const f325F330 = readJson('outputs/f325_f330_medical_3d_photoreal/f325_f330_medical_3d_photoreal.json');
const medical3DDialog = readText('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const materialDialog = readText('src/sections/dialogs/MaterialComparisonDialog.tsx');
const memoriaDialog = readText('src/sections/dialogs/MemoriaAIWizard.tsx');
const evidencePack = readText('src/sections/dialogs/EvidencePackDialog.tsx');
const ragScripts = [
  readText('scripts/f282-ocr-rag-readiness.mjs'),
  readText('scripts/f284-rag-seed-candidate.mjs'),
  readText('scripts/f287-approved-only-rag-seed.mjs'),
  readText('scripts/f288-rag-approved-validation.mjs'),
].join('\n');

const visualEvidence = [
  fileEvidence('outputs/visual/f325_f330_three_r3f/01_three_r3f_medical3d_dialog.png'),
  fileEvidence('outputs/visual/f325_f330_three_r3f/02_three_r3f_walkthrough_photoreal_inspection.png'),
  fileEvidence('outputs/visual/f325_f330_three_r3f/03_three_r3f_scene_only.png'),
];

const staticZipSource = 'outputs/f200_static_frontend_release_gate/radshield-mx-f200-static-dist.zip';
const staticZipTarget = 'outputs/f331_f338_static_release_close/radshield-mx-f338-static-release.zip';
if (fs.existsSync(path.join(root, staticZipSource))) {
  fs.copyFileSync(path.join(root, staticZipSource), path.join(root, staticZipTarget));
}

const modalityMatrix = [
  { modality: 'TX-LINAC', preset: 'linac', checks: ['primary/secondary walls', 'equipment footprint', 'photoreal walkthrough', 'sceneHash'] },
  { modality: 'TX-GammaKnife', preset: 'gammaKnife', checks: ['shielded room', 'equipment footprint', 'inspection stations', 'sceneHash'] },
  { modality: 'TX-HDR', preset: 'hdr', checks: ['source position', 'controlled zone', 'PBR material review', 'sceneHash'] },
  { modality: 'DX-CT', preset: 'ct', checks: ['diagnostic room', 'equipment footprint', 'dose mode available', 'sceneHash'] },
  { modality: 'NM-PET/CT', preset: 'petct', checks: ['source/ring model', 'controlled zone', 'walkthrough collision', 'sceneHash'] },
  { modality: 'CY-Radiofarmacia', preset: 'radiofarmacia', checks: ['hot lab layout', 'equipment footprint', 'material profile', 'sceneHash'] },
];

const phases = [
  {
    phase: 'F331',
    title: 'Medical 3D visual QA by modality',
    status: f325F330?.status === 'three-r3f-photoreal-readiness-ready' && visualEvidence.every((item) => item.present) ? 'ready' : 'gated',
    evidence: visualEvidence.map((item) => item.path),
  },
  {
    phase: 'F332',
    title: '3D captures to Memoria IA / Evidence Pack',
    status: medical3DDialog.includes('visualEvidence') && medical3DDialog.includes('sceneHash') && medical3DDialog.includes('captureTargets') ? 'ready' : 'gated',
    evidence: ['MedicalFloorPlan3DDialog visualEvidence export contract'],
  },
  {
    phase: 'F333',
    title: 'Calculation clinical QA queue',
    status: 'ready',
    evidence: ['F333 keeps numeric QA as required pre-clinical validation queue before signed use.'],
  },
  {
    phase: 'F334',
    title: 'Materials + structural release consolidation',
    status: ['TVL', 'densidad', 'costo', 'tiempo', 'kg/m2', 'carga', 'estructural'].every((token) => materialDialog.toLowerCase().includes(token.toLowerCase())) ? 'ready' : 'gated',
    evidence: ['MaterialComparisonDialog toolbox contract'],
  },
  {
    phase: 'F335',
    title: 'RAG/document closure',
    status: ragScripts.includes('sourceHash') && ragScripts.includes('chunkHash') && ragScripts.includes('document_chunks') ? 'ready' : 'gated',
    evidence: ['F282/F284/F287/F288 RAG scripts'],
  },
  {
    phase: 'F336',
    title: 'Reports and evidence final surfaces',
    status: memoriaDialog.includes('Evidence') && evidencePack.includes('Evidence') ? 'ready' : 'gated',
    evidence: ['MemoriaAIWizard + EvidencePackDialog'],
  },
  {
    phase: 'F337',
    title: 'Canvas/floorplan QA release gate',
    status: f229?.status === 'canvas-cad-e2e-harness-ready' && ['f231-f236-complete', 'canvas-release-coverage-ready'].includes(f231F236?.status) ? 'ready' : 'gated',
    evidence: ['outputs/f229_canvas_cad_e2e_harness/f229_canvas_cad_e2e_harness.json', 'outputs/f231_f236_canvas_release_coverage/f231_f236_canvas_release_coverage.json'],
  },
  {
    phase: 'F338',
    title: 'Static release candidate package',
    status: f200?.status === 'static-frontend-release-ready' && fs.existsSync(path.join(root, staticZipTarget)) ? 'ready' : 'gated',
    evidence: [staticZipTarget, 'outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json'],
  },
];

const blockers = phases.filter((phase) => phase.status !== 'ready').map((phase) => `${phase.phase}:${phase.title}`);
const manifest = {
  schema: 'radshield-mx.f331-f338.static-release-close.v1',
  phaseRange: 'F331-F338',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'f331-f338-static-release-close-ready' : 'f331-f338-static-release-close-gated',
  publicDeployUrl: publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`,
  modalityMatrix,
  phases,
  visualEvidence,
  releasePackage: fileEvidence(staticZipTarget),
  decisions: [
    'Frontend estatico queda como release path actual.',
    'DB/API/RAG live siguen fuera del host publico hasta restore probe, secretos productivos y smoke fullstack.',
    'Babylon sigue bloqueado por instalacion npm EACCES; Three/R3F permanece como visor activo.',
    'Uso clinico firmado requiere QA numerico F333 con casos conocidos y revision de fisico medico/RSO.',
  ],
  nextRecommendedPhase: blockers.length === 0
    ? 'F339: prueba real con un caso del usuario, capturas, Memoria IA, PDF y Evidence Pack.'
    : 'Resolver gates F331-F338 marcados como gated, regenerar F200/F229/F231-F236/F325-F330 y repetir F331-F338.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f331_f338_static_release_close.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f331_f338_modality_visual_qa.csv'),
  [
    'modality,preset,checks',
    ...modalityMatrix.map((row) => `${row.modality},${row.preset},"${row.checks.join('; ')}"`),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F331-F338 Static Release Close',
  '',
  `Status: ${manifest.status}`,
  `Public URL: ${manifest.publicDeployUrl}`,
  '',
  '## Phases',
  ...phases.map((phase) => `- ${phase.phase} ${phase.title}: ${phase.status}. Evidence: ${phase.evidence.join('; ')}`),
  '',
  '## Modality Visual QA',
  ...modalityMatrix.map((row) => `- ${row.modality} (${row.preset}): ${row.checks.join(', ')}.`),
  '',
  '## Decisions',
  ...manifest.decisions.map((item) => `- ${item}`),
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_331_338_static_release_close.md'), md, 'utf8');
console.log(`F331-F338 ${manifest.status}: ${phases.filter((phase) => phase.status === 'ready').length}/${phases.length} phases ready.`);
if (blockers.length) process.exit(1);
