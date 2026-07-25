import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f283_ocr_chunk_qa/f283_ocr_chunk_qa.json'));
const chunks = read('outputs/f283_ocr_chunk_qa/f283_chunk_qa.jsonl').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F283 status', manifest.status === 'ocr-chunk-qa-ready');
expect('Input phases tracked', manifest.inputPhases.includes('F281') && manifest.inputPhases.includes('F282'));
expect('Spanish OCR operational', manifest.spanishOcrOperational === true);
expect('No automatic DB seed', manifest.seedDbAutomatically === false);
expect('Documents tracked', manifest.totals.documents >= 6);
expect('Chunks tracked', chunks.length === manifest.totals.chunks);
expect('Seed/review partition total', manifest.totals.seedDraftChunks + manifest.totals.reviewChunks === manifest.totals.chunks);
expect('Chunk QA metadata present', chunks.every((chunk) => chunk.chunkId && chunk.chunkHash && chunk.qaStatus && chunk.pageQualityScore !== undefined));
expect('Document sample pages present', manifest.documents.every((doc) => Array.isArray(doc.samplePages) && doc.samplePages.length > 0));
expect('QA policy blocks automatic seed', manifest.qaPolicy.some((item) => item.includes('must not be seeded')));
expect('Update Center documents F283', update.includes('F283 OCR chunk QA'));
expect('Manual documents F283', manual.includes('Addendum F283'));
expect('Version manual documents F283', versions.includes('F283'));
expect('Changelog documents F283', changelog.includes('F283'));

if (failures.length) {
  console.error('F283 OCR chunk QA contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F283 OCR chunk QA contracts passed.');
