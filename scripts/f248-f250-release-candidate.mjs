import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f248_f250_release_candidate');
const jsonPath = path.join(outputDir, 'f248_f250_release_candidate.json');
const mdPath = path.join(root, 'outputs', 'fase_248_250_release_candidate.md');
const publicUrl = process.env.PUBLIC_DEPLOY_URL || 'https://radshield-mx-static-dist.vercel.app/';

const highRiskCadImprovements = [
  {
    id: 'cad-renderer-event-rewrite',
    title: 'Renderer base + pointer/event controller rewrite',
    applyWhen: 'Post-F250, feature flag, rama experimental, F197/F207/F229/F231-F236/F200 antes y despues.',
  },
  {
    id: 'cad-native-dwg',
    title: 'DWG nativo en navegador',
    applyWhen: 'Post-release como conversion externa DWG->DXF/SVG/IFC; no prometer nativo en frontend estatico.',
  },
  {
    id: 'cad-real-time-3d-sync',
    title: 'Sincronizacion 2D/3D en tiempo real',
    applyWhen: 'Post-RC; iniciar unidireccional 2D->3D, luego bidireccional con hashes y undo/redo.',
  },
  {
    id: 'cad-boolean-geometry-engine',
    title: 'Booleanas/solidos CAD',
    applyWhen: 'Post-RC con fixtures geometricos, unidades y validacion calculo/distancia.',
  },
  {
    id: 'cad-gpu-heatmap-isocontours',
    title: 'Heatmaps/isocontornos GPU/WebGL',
    applyWhen: 'Post-RC con modo CPU de referencia, leyenda regulatoria y QA visual/export.',
  },
];

const manifest = {
  phaseRange: 'F248-F250',
  schema: 'radshield-mx.release-candidate.f248-f250.v1',
  generatedAt: new Date().toISOString(),
  status: 'static-frontend-release-candidate',
  publicUrl: publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`,
  staticFrontendDecision: 'go-after-public-smoke',
  fullStackDecision: 'blocked-until-db-restore-probe',
  phases: [
    {
      phase: 'F248',
      status: 'ready',
      title: 'Public/static URL smoke',
      required: ['F200 static release gate', 'F202 public smoke or F203 manual verification', 'HTTPS SPA fallback'],
    },
    {
      phase: 'F249',
      status: 'guarded',
      title: 'DB/fullstack release decision',
      required: ['F153 restore probe', 'F168 DB live finalization', 'production secrets', 'backend smoke'],
    },
    {
      phase: 'F250',
      status: 'ready',
      title: 'Release candidate final',
      required: ['manual v1-F250', 'Update Center F250', 'build', 'contracts', 'scope freeze'],
    },
  ],
  highRiskCadImprovements,
  releaseChecklist: [
    'Build Vite limpio.',
    'F200/F237/F238-F247/F248-F250 verdes.',
    'Manual HTML con cobertura v1-F250.',
    'Upload manual de dist a Vercel/static host.',
    'Repetir F202 o F203 contra la URL final.',
    'DB/API/RAG privado bloqueado hasta restore probe y secretos productivos.',
    'CAD alto riesgo despues del RC con feature flag y rollback.',
  ],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const markdown = [
  '# F248-F250 Release Candidate',
  '',
  `Status: **${manifest.status}**`,
  `Public URL: \`${manifest.publicUrl}\``,
  `Static frontend: \`${manifest.staticFrontendDecision}\``,
  `Fullstack: \`${manifest.fullStackDecision}\``,
  '',
  '## Phases',
  '',
  ...manifest.phases.map((phase) => `- ${phase.phase} ${phase.title}: ${phase.status}. Required: ${phase.required.join('; ')}.`),
  '',
  '## High-Risk CAD Deferred',
  '',
  ...manifest.highRiskCadImprovements.map((item) => `- ${item.title}: ${item.applyWhen}`),
  '',
  '## Release Checklist',
  '',
  ...manifest.releaseChecklist.map((item) => `- ${item}`),
  '',
].join('\n');

fs.writeFileSync(mdPath, markdown, 'utf8');
console.log(`F248-F250 release candidate ${manifest.status}: ${manifest.phases.length} phases.`);
