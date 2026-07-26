import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f294_real_guided_smoke/f294_real_guided_smoke.json'));
const checklist = read('outputs/f294_real_guided_smoke/f294_operator_evidence_checklist.csv');
const deviations = read('outputs/f294_real_guided_smoke/f294_deviation_log_template.csv');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F294 ready', manifest.status === 'real-guided-smoke-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('Ready selected case', manifest.selectedCaseId === 'TX-LINAC-6MV-001' && manifest.selectedCase?.status === 'ready');
expect('F293/F292 gates pass', ['f293-ready', 'f292-floorplan-qa-ready', 'selected-case-ready'].every((id) => manifest.gates.some((gate) => gate.id === id && gate.pass === true)));
expect('No DB live write', manifest.seedDbAutomatically === false && manifest.liveDbWritePerformed === false);
expect('Operator checklist complete', Array.isArray(manifest.operatorEvidenceChecklist) && manifest.operatorEvidenceChecklist.length >= 10);
expect('Checklist captures calculation and visuals', checklist.includes('Calculation trace') && checklist.includes('Heatmap/isocontour'));
expect('Deviation log template present', deviations.includes('severity') && deviations.includes('disposition'));
expect('Clinical policy blocks certification', manifest.clinicalUsePolicy.includes('not clinical certification'));
expect('Update Center documents F294', update.includes('F294 Real guided smoke'));
expect('Manual documents F294', manual.includes('Addendum F294'));
expect('Version manual documents F294', versions.includes('F294'));
expect('Changelog documents F294', changelog.includes('F294'));
expect('Package scripts F294 prepare', pkg.scripts?.['prepare:f294:real-guided-smoke'] === 'node scripts/f294-real-guided-smoke.mjs');
expect('Package scripts F294 test', pkg.scripts?.['test:f294:real-guided-smoke'] === 'node scripts/check-f294-real-guided-smoke-contracts.mjs');

if (failures.length) {
  console.error('F294 real guided smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F294 real guided smoke contracts passed.');
