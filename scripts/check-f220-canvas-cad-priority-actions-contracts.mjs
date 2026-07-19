import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'src/lib/f220CanvasCadPriorityActions.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/f220-canvas-cad-priority-actions.mjs',
  'scripts/check-f220-canvas-cad-priority-actions-contracts.mjs',
  'outputs/f220_canvas_cad_priority_actions/f220_canvas_cad_priority_actions.json',
  'outputs/fase_220_canvas_cad_priority_actions.md',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const missingFiles = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missingFiles.length > 0) throw new Error(`Missing F220 files: ${missingFiles.join(', ')}`);

const payload = JSON.parse(fs.readFileSync(path.join(root, 'outputs/f220_canvas_cad_priority_actions/f220_canvas_cad_priority_actions.json'), 'utf8'));
const expectations = [
  ['schema', payload.schema === 'radshield-mx.canvas-cad-priority-actions.f220.v1'],
  ['phase', payload.phase === 'F220'],
  ['status', payload.status === 'cad-priority-actions-ready'],
  ['actions', payload.actions?.length === 7],
  ['next phases', payload.nextRecommendedPhases?.length === 6],
];

const failed = expectations.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) throw new Error(`F220 contract failed: ${failed.join(', ')}`);

const combinedText = requiredFiles
  .map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'))
  .join('\n');

const requiredTokens = [
  'F220',
  'Canvas CAD Priority Actions',
  'buildF220CanvasCadPriorityActions',
  'f220-canvas-cad-priority-actions',
  'f220-cad-action-direct-edit',
  'f220-cad-action-advanced-snap',
  'f220-cad-action-editable-dimensions',
  'f220-cad-action-lasso-select',
  'f220-cad-action-isocontours',
  'f220-cad-action-equipment-footprints',
  'f220-cad-action-medical-3d',
  'prepare:f220:canvas-cad-actions',
  'test:f220:canvas-cad-actions',
  'P0',
  'P1',
  'P2',
  'F221',
  'F222',
  'F223',
  'F224',
  'F225',
  'F226',
];

const missingTokens = requiredTokens.filter((token) => !combinedText.includes(token));
if (missingTokens.length > 0) throw new Error(`F220 tokens missing: ${missingTokens.join(', ')}`);

console.log(
  JSON.stringify(
    {
      status: 'f220-contracts-ready',
      actions: payload.actions.length,
      next: payload.nextRecommendedPhases,
    },
    null,
    2,
  ),
);
