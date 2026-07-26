import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f339_real_case_centro_neuro');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

execFileSync(process.execPath, ['scripts/f339-real-case-centro-neuro.mjs'], {
  cwd: root,
  stdio: 'pipe',
});

const manifest = readJson('outputs/f339_real_case_centro_neuro/f339_real_case_centro_neuro.json');
const seed = readJson('outputs/f339_real_case_centro_neuro/f339_floorplan_seed_candidate.json');
const csv = read('outputs/f339_real_case_centro_neuro/f339_trial_scenarios.csv');
const pkg = readJson('package.json');
const updateApp = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versionManual = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('F339 manifest ready', manifest.status === 'real-case-centro-neuro-ready-for-operator-trial');
expect('F339 blockers empty', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect(
  'Centro Neuro PDF hash matches approved source',
  manifest.pdfSource.sha256 === '52b5fb7179fd62b849abcbcc1bf94c807dae71a58f219c6095a713e0a32c713c',
);
expect('PDF metadata identifies AutoCAD source', String(manifest.pdfSource.info.Creator ?? '').includes('AutoCAD'));
expect('Rendered page exists', fs.existsSync(path.join(outDir, 'centro_neuro_page-1.png')));
expect('Rendered page referenced by seed', seed.renderedPage === 'outputs/f339_real_case_centro_neuro/centro_neuro_page-1.png');
expect(
  'Required rooms detected',
  ['CYCLOTRON', 'RADIOFARMACIA', 'LGK (GAMAKNIFE)', 'LINAC'].every((label) =>
    seed.detectedRooms.some((room) => room.label === label),
  ),
);
expect(
  'Trial scenarios cover cyclotron, Gamma Knife and LINAC',
  ['Cyclotron', 'Gamma Knife / LGK', 'LINAC'].every((equipment) =>
    manifest.trialScenarios.some((scenario) => scenario.equipment === equipment),
  ),
);
expect(
  'Visible equipment weights captured',
  seed.detectedRooms.some((room) => room.visibleEquipmentWeightKg === 36502) &&
    seed.detectedRooms.some((room) => room.visibleEquipmentWeightKg === 3341),
);
expect('Scale policy blocks image-only calculations', seed.scalePolicy.includes('calibrate scale'));
expect(
  'CSV scenario export complete',
  csv.includes('F339-CY-CENTRO-NEURO-CYCLOTRON-001') &&
    csv.includes('F339-TX-CENTRO-NEURO-LGK-001') &&
    csv.includes('F339-TX-CENTRO-NEURO-LINAC-001'),
);
expect('F331-F338 upstream gate is ready', manifest.gates.some((gate) => gate.id === 'f331-f338-ready' && gate.pass));
expect(
  'Package scripts registered',
  pkg.scripts?.['prepare:f339:real-case-centro-neuro'] === 'node scripts/f339-real-case-centro-neuro.mjs' &&
    pkg.scripts?.['test:f339:real-case-centro-neuro'] === 'node scripts/check-f339-real-case-centro-neuro-contracts.mjs',
);
expect(
  'Docs and Update Center mention F339',
  updateApp.includes('F339 Centro Neuro real case') &&
    changelog.includes('F339') &&
    versionManual.includes('F339') &&
    userManual.includes('Addendum F339'),
);

if (failures.length) {
  console.error('F339 contract failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`F339 contracts passed: ${manifest.trialScenarios.length} real-case scenarios ready.`);
