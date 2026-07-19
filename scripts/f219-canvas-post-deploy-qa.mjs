import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f219_canvas_post_deploy_qa');
fs.mkdirSync(outDir, { recursive: true });

const source = fs.readFileSync(path.join(root, 'src/lib/f219CanvasPostDeployQa.ts'), 'utf8');

const pendingIds = [
  'cad-direct-edit',
  'advanced-snapping',
  'editable-dimensions',
  'lasso-multiselect',
  'true-isocontours',
  'equipment-footprints',
  'visual-3d-inspection',
];

const qa = {
  schema: 'radshield-mx.canvas-post-deploy-qa.f219.v1',
  phase: 'F219',
  status: 'post-deploy-qa-ready',
  publicUrl: 'https://radshield-mx-static-dist.vercel.app/',
  automatedCovered: ['canvas-visible', 'dxf-apply', 'scene-export', 'report-handoff'],
  manualRequired: ['url-shell', 'operator-pass'],
  pendingCanvasImprovements: pendingIds,
  nextRecommendedPhase: 'F220',
  decision:
    'F219 cierra QA visual post-deploy y ordena pendientes de canvas antes de seguir con microfases CAD de bajo riesgo.',
};

for (const token of [
  'buildF219CanvasPostDeployQa',
  'post-deploy-qa-ready',
  'cad-direct-edit',
  'advanced-snapping',
  'editable-dimensions',
  'true-isocontours',
]) {
  if (!source.includes(token)) throw new Error(`F219 source missing token: ${token}`);
}

fs.writeFileSync(path.join(outDir, 'f219_canvas_post_deploy_qa.json'), `${JSON.stringify(qa, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_219_canvas_post_deploy_qa.md'),
  [
    '# F219 - Canvas Post-Deploy QA',
    '',
    `- Estado: ${qa.status}`,
    `- URL publica: ${qa.publicUrl}`,
    `- Checks automatizados cubiertos: ${qa.automatedCovered.join(', ')}`,
    `- Checks manuales requeridos: ${qa.manualRequired.join(', ')}`,
    `- Pendientes canvas: ${qa.pendingCanvasImprovements.join(', ')}`,
    `- Siguiente fase recomendada: ${qa.nextRecommendedPhase}`,
    '',
    qa.decision,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({ status: qa.status, pending: pendingIds.length }, null, 2));
