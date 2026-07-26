import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f343_centro_neuro_preflight');
const manifestPath = path.join(outDir, 'f343_centro_neuro_preflight.json');
const equipmentCsvPath = path.join(outDir, 'f343_equipment_preflight.csv');
const worksheetCsvPath = path.join(outDir, 'f343_occupancy_penetration_worksheet.csv');
const phaseMdPath = path.join(root, 'outputs', 'fase_343_centro_neuro_preflight.md');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

if (!fs.existsSync(manifestPath)) {
  throw new Error('Run npm run prepare:f343:centro-neuro-preflight before checking contracts.');
}

const manifest = JSON.parse(readText(manifestPath));
assert(manifest.schema === 'radshield-mx.f343.centro-neuro-preflight.v1', 'Unexpected F343 schema.');
assert(manifest.status === 'centro-neuro-preflight-ready-draft-blocked', 'F343 must remain draft-blocked, not signed.');
assert(manifest.signedCalculationProduced === false, 'F343 must not emit signed shielding calculations.');
assert(Array.isArray(manifest.equipmentPreflight) && manifest.equipmentPreflight.length === 3, 'F343 requires three equipment preflights.');
assert(manifest.equipmentPreflight.some((item) => item.label === 'Elekta Versa HD' && item.userProvided.maximumEnergyMeV === 15), 'Versa HD 15 MeV preflight missing.');
assert(manifest.equipmentPreflight.some((item) => item.label === 'Elekta Gamma Knife Esprit'), 'Gamma Knife Esprit preflight missing.');
assert(manifest.equipmentPreflight.some((item) => item.label === 'IBA Cyclone KIUBE' && item.userProvided.protonEnergyMeV === 18), 'Cyclone KIUBE 18 MeV preflight missing.');
assert(manifest.equipmentPreflight.every((item) => item.blockers.includes('source-term-report-required')), 'Every equipment must require source-term evidence.');
assert(manifest.equipmentPreflight.every((item) => item.blockers.includes('occupancy-map-not-approved')), 'Every equipment must require occupancy approval.');
assert(manifest.equipmentPreflight.every((item) => item.blockers.includes('penetrations-not-marked')), 'Every equipment must require penetration markup.');
assert(manifest.equipmentPreflight.every((item) => item.blockers.includes('material-tvl-density-not-versioned')), 'Every equipment must require material TVL/density evidence.');
assert(manifest.materialPreflight?.status === 'draft-only-until-versioned-evidence', 'Material preflight must be draft-only.');
assert(manifest.clinicalWarnings.some((item) => item.includes('15 MeV')), 'LINAC 15 MeV warning missing.');
assert(manifest.clinicalWarnings.some((item) => item.includes('18 MeV')), 'Cyclotron 18 MeV warning missing.');
assert(manifest.gates.every((gate) => gate.pass === true), 'All F343 generation gates should pass.');

for (const filePath of [equipmentCsvPath, worksheetCsvPath, phaseMdPath]) {
  assert(fs.existsSync(filePath), `Missing F343 artifact: ${filePath}`);
}

const packageJson = JSON.parse(readText(path.join(root, 'package.json')));
assert(packageJson.scripts['prepare:f343:centro-neuro-preflight'], 'Missing F343 prepare script.');
assert(packageJson.scripts['test:f343:centro-neuro-preflight'], 'Missing F343 test script.');

for (const doc of ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'MANUAL_USUARIO_v99.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  assert(readText(path.join(root, doc)).includes('F343'), `F343 missing from ${doc}.`);
}

console.log('F343 contracts OK: Centro Neuro source/occupancy/penetration preflight is draft-blocked and documented.');
