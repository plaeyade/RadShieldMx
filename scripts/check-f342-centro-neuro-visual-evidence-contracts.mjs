import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

execFileSync(process.execPath, ['scripts/f342-centro-neuro-visual-evidence.mjs'], { stdio: 'pipe' });

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);
const readJson = (file) => JSON.parse(read(file));
const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

const manifest = exists('outputs/f342_centro_neuro_visual_evidence/f342_centro_neuro_visual_evidence.json')
  ? readJson('outputs/f342_centro_neuro_visual_evidence/f342_centro_neuro_visual_evidence.json')
  : null;
const html = exists('outputs/f342_centro_neuro_visual_evidence/f342_visual_review.html')
  ? read('outputs/f342_centro_neuro_visual_evidence/f342_visual_review.html')
  : '';
const pkg = readJson('package.json');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

expect('manifest exists', Boolean(manifest));
if (manifest) {
  expect('schema matches', manifest.schema === 'radshield-mx.f342.centro-neuro-visual-evidence.v1');
  expect('status ready', manifest.status === 'centro-neuro-visual-evidence-ready');
  expect('all visual gates pass', manifest.gates?.length === 8 && manifest.gates.every((gate) => gate.pass));
  expect('six expected screenshots listed', manifest.expectedBrowserScreenshots?.length === 6);
  expect('visual cards complete', manifest.visualCards?.length === 4);
  expect('pending inputs visible', manifest.pendingInputs?.length >= 10);
}

expect('visual html contains equipment', ['Ciclotron', 'Gamma Knife', 'LINAC'].every((label) => html.includes(label)));
expect('visual html warns draft only', html.includes('No certifica blindaje'));
expect(
  'package exposes F342 scripts',
  pkg.scripts?.['prepare:f342:centro-neuro-visual-evidence'] === 'node scripts/f342-centro-neuro-visual-evidence.mjs' &&
    pkg.scripts?.['test:f342:centro-neuro-visual-evidence'] === 'node scripts/check-f342-centro-neuro-visual-evidence-contracts.mjs' &&
    pkg.scripts?.['test:f342:browser-smoke'] === 'playwright test e2e/f342-centro-neuro-visual-smoke.spec.ts --project=chromium',
);
expect('docs updated', update.includes('F342 Centro Neuro visual evidence') && changelog.includes('F342') && versions.includes('F342') && manual.includes('Addendum F342'));

for (const file of [
  'outputs/f342_centro_neuro_visual_evidence/f342_centro_neuro_visual_evidence.json',
  'outputs/f342_centro_neuro_visual_evidence/f342_visual_review.html',
  'outputs/fase_342_centro_neuro_visual_evidence.md',
]) {
  expect(`required output ${file}`, exists(file));
}

if (failures.length) {
  console.error('F342 visual evidence contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F342 Centro Neuro visual evidence contracts passed.');
