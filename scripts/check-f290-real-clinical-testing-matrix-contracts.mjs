import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f290_real_clinical_testing_matrix/f290_real_clinical_testing_matrix.json'));
const csv = read('outputs/f290_real_clinical_testing_matrix/f290_real_case_matrix.csv');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F290 ready', manifest.status === 'real-clinical-testing-matrix-ready');
expect('No live DB write', manifest.seedDbAutomatically === false && manifest.liveDbWritePerformed === false);
expect('All profiles covered', manifest.gates.allProfilesCovered);
expect('Real signed memory flag exists', manifest.gates.signedMemoryRequiredFlagged);
expect('No clinical release claim', manifest.gates.noClinicalReleaseClaim);
expect('At least six cases', manifest.testCases.length >= 6);
expect('CSV includes CY and TX', csv.includes('CY-KIUBE-001') && csv.includes('TX-LINAC-6MV-001'));
expect('Acceptance criteria mention citations', manifest.acceptanceCriteria.some((item) => item.includes('citationId')));
expect('Update Center documents F290', update.includes('F290 Real clinical testing matrix'));
expect('Manual documents F290', manual.includes('Addendum F290'));
expect('Version manual documents F290', versions.includes('F290'));
expect('Changelog documents F290', changelog.includes('F290'));

if (failures.length) {
  console.error('F290 real clinical testing matrix contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F290 real clinical testing matrix contracts passed.');
