import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'src/lib/f219CanvasPostDeployQa.ts',
  'scripts/f219-canvas-post-deploy-qa.mjs',
  'scripts/check-f219-canvas-post-deploy-qa-contracts.mjs',
  'outputs/f219_canvas_post_deploy_qa/f219_canvas_post_deploy_qa.json',
  'outputs/fase_219_canvas_post_deploy_qa.md',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const missingFiles = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missingFiles.length > 0) throw new Error(`Missing F219 files: ${missingFiles.join(', ')}`);

const qa = JSON.parse(fs.readFileSync(path.join(root, 'outputs/f219_canvas_post_deploy_qa/f219_canvas_post_deploy_qa.json'), 'utf8'));
const expectations = [
  ['schema', qa.schema === 'radshield-mx.canvas-post-deploy-qa.f219.v1'],
  ['phase', qa.phase === 'F219'],
  ['status', qa.status === 'post-deploy-qa-ready'],
  ['url', qa.publicUrl === 'https://radshield-mx-static-dist.vercel.app/'],
  ['pending count', qa.pendingCanvasImprovements?.length >= 7],
  ['next phase', qa.nextRecommendedPhase === 'F220'],
];

const failed = expectations.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) throw new Error(`F219 contract failed: ${failed.join(', ')}`);

const combinedText = requiredFiles
  .map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'))
  .join('\n');

const requiredTokens = [
  'F219',
  'Canvas Post-Deploy QA',
  'buildF219CanvasPostDeployQa',
  'test:f219:canvas-postdeploy',
  'prepare:f219:canvas-postdeploy',
  'post-deploy-qa-ready',
  'cad-direct-edit',
  'advanced-snapping',
  'editable-dimensions',
  'lasso-multiselect',
  'true-isocontours',
  'equipment-footprints',
  'visual-3d-inspection',
  'F220',
];

const missingTokens = requiredTokens.filter((token) => !combinedText.includes(token));
if (missingTokens.length > 0) throw new Error(`F219 tokens missing: ${missingTokens.join(', ')}`);

console.log(
  JSON.stringify(
    {
      status: 'f219-contracts-ready',
      pending: qa.pendingCanvasImprovements.length,
      next: qa.nextRecommendedPhase,
    },
    null,
    2,
  ),
);
