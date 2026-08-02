import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f515_f520_post_beta_plan');
fs.mkdirSync(outDir, { recursive: true });

const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const read = (relativePath) => (exists(relativePath) ? fs.readFileSync(path.join(root, relativePath), 'utf8') : '');
const gitValue = (args, fallback) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
};

const pkg = JSON.parse(read('package.json') || '{}');
const unityRoot = 'public/unity/radshield-medical-3d';
const unityHasBuildDir = exists(`${unityRoot}/Build`);
const unityHasIndex = exists(`${unityRoot}/index.html`);
const unityStatus = unityHasIndex && unityHasBuildDir ? 'exported-build-present' : 'awaiting-exported-build';

const checks = {
  rendererEvents: {
    canvasArea: exists('src/sections/CanvasArea.tsx'),
    stableHook: exists('src/hooks/useCanvas.ts'),
    eventControllerV2: exists('src/lib/canvas/eventControllerV2.ts'),
    rendererCore: exists('src/lib/canvas/CanvasRenderer.ts'),
    rendererRuntime: exists('src/lib/f442ToF445RendererV2Runtime.ts'),
    qaGate: exists('src/lib/f446ToF448CanvasStrongQa.ts'),
  },
  babylon: {
    dependencyCore: Boolean(pkg.dependencies?.['@babylonjs/core']),
    dependencyGui: Boolean(pkg.dependencies?.['@babylonjs/gui']),
    dependencyLoaders: Boolean(pkg.dependencies?.['@babylonjs/loaders']),
    deepRuntime: exists('src/lib/medical3D/babylonDeepRuntime.ts'),
    adapter: exists('src/lib/medical3D/babylonAdapter.ts'),
    e2e: exists('e2e/f470-f474-babylon-deep-runtime.spec.ts'),
  },
  unity: {
    dependency: Boolean(pkg.dependencies?.['react-unity-webgl']),
    handoff: exists('src/lib/medical3D/unityWebglHandoff.ts'),
    exportedBuildContract: exists('src/lib/medical3D/unityWebglExportedBuild.ts'),
    requiredPaths: [
      { path: `${unityRoot}/index.html`, present: unityHasIndex },
      { path: `${unityRoot}/Build`, present: unityHasBuildDir },
      { path: `${unityRoot}/TemplateData`, present: exists(`${unityRoot}/TemplateData`) },
    ],
    status: unityStatus,
  },
  dbTechnical: {
    schema: exists('db/f501_f504_regulatory_materials_schema.sql'),
    xcomModule: exists('src/lib/xcomAttenuation.ts'),
    regulatoryDb: exists('src/lib/f491F498RegulatoryMaterialsDb.ts'),
    seedReadback: exists('src/lib/f506F507RegulatorySeedReadback.ts'),
    postSeedQa: exists('src/lib/f508F509PostSeedQa.ts'),
  },
  numericQa: {
    normativeQa: exists('src/lib/f484F490NormativeQa.ts'),
    postSeedQa: exists('src/lib/f508F509PostSeedQa.ts'),
    diagnosticPetPromotion: exists('src/lib/f510DiagnosticPetTvlPromotion.ts'),
  },
  ragMemory: {
    documentChunksSeed: exists('scripts/f76-seed-document-chunks.mjs'),
    ocrRecovery: exists('scripts/f141-material-ocr-recovery.mjs'),
    sourceGovernance: exists('src/lib/f144SourceGovernance.ts'),
    memoriaEvidence: exists('src/lib/f142MemoriaIaMaterialEvidence.ts'),
  },
};

const tracks = [
  ['F515', 'Renderer base/eventos del canvas', checks.rendererEvents, 'start-now'],
  ['F516', 'Babylon profundo real', checks.babylon, checks.babylon.dependencyCore && checks.babylon.deepRuntime ? 'gated-ready' : 'blocked'],
  ['F517', 'Unity WebGL con build exportado real', checks.unity, unityStatus],
  ['F518', 'DB tecnica ENDF/XCOM/ICRU', checks.dbTechnical, checks.dbTechnical.schema && checks.dbTechnical.xcomModule ? 'needs-dataset-expansion' : 'blocked'],
  ['F519', 'QA numerico NCRP/IAEA/UAQ ampliado', checks.numericQa, 'start-now'],
  ['F520', 'Memorias reales para RAG/IA', checks.ragMemory, 'needs-approved-documents'],
].map(([phase, title, evidence, status]) => ({ phase, title, status, evidence }));

const manifest = {
  schema: 'radshield-mx.post-beta.f515-f520.v1',
  phaseRange: 'F515-F520',
  generatedAt: new Date().toISOString(),
  branch: gitValue(['branch', '--show-current'], 'unknown'),
  commit: gitValue(['rev-parse', '--short', 'HEAD'], 'unknown'),
  betaBaseline: 'F511-F514 beta probado por usuario',
  status: 'post-beta-plan-ready',
  tracks,
  executionOrder: [
    'F515 renderer base/eventos',
    'F519 QA numerico',
    'F520 memorias RAG/IA',
    'F518 DB tecnica datasets',
    'F516 Babylon profundo',
    'F517 Unity WebGL real cuando exista build exportado',
  ],
  blockers: [
    ...(unityStatus === 'awaiting-exported-build' ? ['Unity WebGL real requiere build exportado en public/unity/radshield-medical-3d.'] : []),
    'DB ENDF/XCOM/ICRU requiere dataset canonico versionado antes de alimentar calculo.',
    'Babylon profundo debe permanecer lazy/fallback hasta E2E visual.',
  ],
};

fs.writeFileSync(path.join(outDir, 'f515_f520_post_beta_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f515_f520_post_beta_summary.md'), [
  '# F515-F520 POST-BETA PLAN',
  '',
  `Estado: ${manifest.status}`,
  `Commit: ${manifest.commit}`,
  '',
  '## Orden',
  ...manifest.executionOrder.map((item) => `- ${item}`),
  '',
  '## Tracks',
  ...manifest.tracks.map((track) => `- ${track.phase}: ${track.title} (${track.status})`),
  '',
  '## Bloqueos/guardrails',
  ...manifest.blockers.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F515-F520 post-beta plan generated. status=${manifest.status}`);
