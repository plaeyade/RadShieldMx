import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f286_ocr_human_review_packet/f286_ocr_human_review_packet.json'));
const samplePages = JSON.parse(read('outputs/f286_ocr_human_review_packet/f286_sample_review_pages.json'));
const blockedPages = JSON.parse(read('outputs/f286_ocr_human_review_packet/f286_blocked_pages.json'));
const csv = read('outputs/f286_ocr_human_review_packet/f286_review_decisions_template.csv');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F286 status', manifest.status === 'ocr-human-review-packet-ready');
expect('F286 does not seed DB', manifest.seedDbAutomatically === false && manifest.liveDbWritePerformed === false);
expect('F287 live seed is blocked by review gate', manifest.blocksF287LiveSeed === true);
expect('Sample pages count matches F283', manifest.totals.sampleReviewPages === 38);
expect('Blocked pages count matches F283', manifest.totals.blockedPages === 24);
expect('Review rows cover sample + blocked pages', manifest.totals.reviewRows === samplePages.length + blockedPages.length);
expect('F285 rows carried forward', manifest.totals.f285RowsPrepared > 1000);
expect('Approval policy is explicit', manifest.approvalPolicy.allowedDecisions.includes('approve') && manifest.approvalPolicy.allowedDecisions.includes('needs-reocr'));
expect('CSV has pending decisions', csv.includes('decision,reason,pageKey') && csv.includes('"pending"'));
expect('Sample rows have traceability', samplePages.every((row) => row.pageKey && row.sourceHash && row.chunkHashes?.length && row.preview));
expect('Blocked rows have reason flags or low quality', blockedPages.every((row) => row.flags.length > 0 || row.minQualityScore < 50));
expect('Update Center documents F286', update.includes('F286 OCR human review'));
expect('Manual documents F286', manual.includes('Addendum F286'));
expect('Version manual documents F286', versions.includes('F286'));
expect('Changelog documents F286', changelog.includes('F286'));

if (failures.length) {
  console.error('F286 OCR human review packet contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F286 OCR human review packet contracts passed.');
