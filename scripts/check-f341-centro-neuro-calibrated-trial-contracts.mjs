import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

execFileSync(process.execPath, ['scripts/f341-centro-neuro-calibrated-trial.mjs'], { stdio: 'pipe' });

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);
const readJson = (file) => JSON.parse(read(file));
const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

const manifest = exists('outputs/f341_centro_neuro_calibrated_trial/f341_centro_neuro_calibrated_trial.json')
  ? readJson('outputs/f341_centro_neuro_calibrated_trial/f341_centro_neuro_calibrated_trial.json')
  : null;
const pkg = readJson('package.json');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

expect('manifest exists', Boolean(manifest));
if (manifest) {
  expect('schema matches', manifest.schema === 'radshield-mx.f341.centro-neuro-calibrated-trial.v1');
  expect('status ready', manifest.status === 'centro-neuro-calibrated-trial-ready');
  expect('scale is 1:100', manifest.drawingScale?.ratioLabel === '1:100');
  expect('provisional pixel scale derived', Math.abs(manifest.provisionalScale?.metersPerPixel - 0.01693333) < 0.000001);
  expect('material is high-density concrete', manifest.defaultMaterial?.family === 'concrete-heavy');
  expect('material TVL remains gated', String(manifest.defaultMaterial?.tvlStatus).includes('versioned-value-required'));
  expect('source terms cover three equipment families', ['Cyclotron', 'Gamma Knife / LGK', 'LINAC'].every((equipment) => manifest.sourceTerms.some((item) => item.equipment === equipment)));
  expect('penetrations are pending and explicit', manifest.penetrationSchedule?.status === 'pending-operator-markup' && manifest.penetrationSchedule?.requiredItems?.length >= 6);
  expect('occupancy is pending and explicit', manifest.occupancyMap?.status === 'pending-user-confirmation' && manifest.occupancyMap?.suggestedDraftZones?.length >= 5);
  expect('signed calculation is blocked', manifest.realTrialWorkflow?.some((item) => item.status === 'blocked-until-pending-inputs'));
  expect('all gates pass', manifest.gates?.length === 8 && manifest.gates.every((gate) => gate.pass));
}

expect(
  'package exposes F341 scripts',
  pkg.scripts?.['prepare:f341:centro-neuro-calibrated-trial'] === 'node scripts/f341-centro-neuro-calibrated-trial.mjs' &&
    pkg.scripts?.['test:f341:centro-neuro-calibrated-trial'] === 'node scripts/check-f341-centro-neuro-calibrated-trial-contracts.mjs' &&
    pkg.scripts?.['test:f341:browser-smoke'] === 'playwright test e2e/f341-centro-neuro-operator-smoke.spec.ts --project=chromium',
);
expect('docs updated', update.includes('F341 Centro Neuro calibrated trial') && changelog.includes('F341') && versions.includes('F341') && manual.includes('Addendum F341'));

for (const file of [
  'outputs/f341_centro_neuro_calibrated_trial/f341_centro_neuro_calibrated_trial.json',
  'outputs/f341_centro_neuro_calibrated_trial/f341_source_terms.json',
  'outputs/f341_centro_neuro_calibrated_trial/f341_penetrations_occupancy_todo.json',
  'outputs/f341_centro_neuro_calibrated_trial/f341_operator_inputs.csv',
  'outputs/fase_341_centro_neuro_calibrated_trial.md',
]) {
  expect(`required output ${file}`, exists(file));
}

if (failures.length) {
  console.error('F341 calibrated trial contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F341 Centro Neuro calibrated trial contracts passed.');
