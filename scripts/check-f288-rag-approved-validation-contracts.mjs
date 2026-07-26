import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f288_rag_approved_validation/f288_rag_approved_validation.json'));
const retrieval = JSON.parse(read('outputs/f288_rag_approved_validation/f288_retrieval_smoke.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F288 ready', manifest.status === 'rag-approved-validation-ready');
expect('No live DB write', manifest.seedDbAutomatically === false && manifest.liveDbWritePerformed === false);
expect('Rows validated', manifest.totals.rows === 1545 && manifest.gates.rowsPrepared);
expect('Review exclusions preserved', manifest.totals.reviewExcludedRows === 136 && manifest.gates.reviewExclusionsPreserved);
expect('No invalid rows', manifest.totals.invalidRows === 0 && manifest.gates.noInvalidRows);
expect('No duplicate rows', manifest.totals.duplicateRows === 0 && manifest.gates.noDuplicateRows);
expect('Retrieval smoke has all queries', retrieval.length === 4 && retrieval.every((item) => item.hits > 0));
expect('DB readback is optional/read-only', manifest.dbReadback.attempted === false);
expect('Update Center documents F288', update.includes('F288 RAG approved validation'));
expect('Manual documents F288', manual.includes('Addendum F288'));
expect('Version manual documents F288', versions.includes('F288'));
expect('Changelog documents F288', changelog.includes('F288'));

if (failures.length) {
  console.error('F288 RAG approved validation contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F288 RAG approved validation contracts passed.');
