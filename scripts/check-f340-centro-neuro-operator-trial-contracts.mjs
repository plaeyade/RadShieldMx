import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

execFileSync(process.execPath, ['scripts/f340-centro-neuro-operator-trial.mjs'], { stdio: 'pipe' });

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);
const readJson = (file) => JSON.parse(read(file));
const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

const manifestPath = 'outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_operator_trial.json';
const manifest = exists(manifestPath) ? readJson(manifestPath) : null;
const canvasPlan = exists('outputs/f340_centro_neuro_operator_trial/f340_canvas_import_plan.json')
  ? readJson('outputs/f340_centro_neuro_operator_trial/f340_canvas_import_plan.json')
  : null;
const dryRunsCsv = exists('outputs/f340_centro_neuro_operator_trial/f340_calculation_dry_runs.csv')
  ? read('outputs/f340_centro_neuro_operator_trial/f340_calculation_dry_runs.csv')
  : '';
const pkg = readJson('package.json');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

expect('manifest exists', Boolean(manifest));
if (manifest) {
  expect('schema matches', manifest.schema === 'radshield-mx.f340.centro-neuro-operator-trial.v1');
  expect('status ready', manifest.status === 'centro-neuro-operator-trial-ready');
  expect('no blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
  expect('source image has dimensions', manifest.source?.imageSize?.width > 1000 && manifest.source?.imageSize?.height > 1000);
  expect('scale calibration is required', manifest.canvasImportPlan?.scaleCalibration?.status === 'required-before-calculation');
  expect('layers include heatmap and structural load', ['heatmap-isodose', 'structural-load'].every((id) => manifest.canvasImportPlan.layers.some((layer) => layer.id === id)));
  expect('three equipment placements', manifest.equipmentPlacements?.length === 3);
  expect('dry runs cover CY and TX', manifest.calculationDryRuns?.some((item) => item.modalityProfile === 'CY') && manifest.calculationDryRuns?.filter((item) => item.modalityProfile === 'TX').length === 2);
  expect('every dry run blocks calculations until scale', manifest.calculationDryRuns?.every((item) => item.blockedCalculationsUntil.some((gate) => gate.includes('scale'))));
  expect('3D handoff includes sceneHash', manifest.medical3DReview?.exportRequirements?.includes('sceneHash'));
  expect('report workflow includes Evidence Pack', manifest.reportWorkflow?.exports?.includes('Evidence Pack JSON'));
  expect('all gates pass', manifest.gates?.length === 9 && manifest.gates.every((gate) => gate.pass));
}

expect('canvas plan exists', Boolean(canvasPlan));
expect('canvas plan locks background', canvasPlan?.backgroundMode === 'locked-underlay');
expect('overlay exists', exists('outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_overlay.svg'));
expect('dry-run csv includes required scenarios', dryRunsCsv.includes('F339-CY-CENTRO-NEURO-CYCLOTRON-001') && dryRunsCsv.includes('F339-TX-CENTRO-NEURO-LGK-001') && dryRunsCsv.includes('F339-TX-CENTRO-NEURO-LINAC-001'));
expect(
  'package exposes F340 scripts',
  pkg.scripts?.['prepare:f340:centro-neuro-operator-trial'] === 'node scripts/f340-centro-neuro-operator-trial.mjs' &&
    pkg.scripts?.['test:f340:centro-neuro-operator-trial'] === 'node scripts/check-f340-centro-neuro-operator-trial-contracts.mjs',
);
expect('docs updated', update.includes('F340 Centro Neuro operator trial') && changelog.includes('F340') && versions.includes('F340') && manual.includes('Addendum F340'));

for (const file of [
  'outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_operator_trial.json',
  'outputs/f340_centro_neuro_operator_trial/f340_canvas_import_plan.json',
  'outputs/f340_centro_neuro_operator_trial/f340_calculation_dry_runs.csv',
  'outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_overlay.svg',
  'outputs/fase_340_centro_neuro_operator_trial.md',
]) {
  expect(`required output ${file}`, exists(file));
}

if (failures.length) {
  console.error('F340 operator trial contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F340 Centro Neuro operator trial contracts passed.');
