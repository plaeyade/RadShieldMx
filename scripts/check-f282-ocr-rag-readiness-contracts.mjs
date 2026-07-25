import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f282_ocr_rag_readiness/f282_ocr_rag_readiness.json'));
const chunks = read('outputs/f282_ocr_rag_readiness/f282_rag_chunks.jsonl').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F282 status', manifest.status === 'ocr-rag-readiness-draft');
expect('F281 input tracked', manifest.inputPhase === 'F281');
expect('Spanish OCR is operational for current corpus', manifest.spanishOcrOperational === true);
expect('No automatic DB seed', manifest.seedDbAutomatically === false);
expect('Chunk policy exists', manifest.chunkPolicy && manifest.chunkPolicy.dedupe.includes('chunkHash'));
expect('Documents tracked', manifest.totals.documents >= 6);
expect('Chunks generated', manifest.totals.chunks > 100);
expect('Chunks match manifest', chunks.length === manifest.totals.chunks);
expect('Chunks have citation metadata', chunks.every((chunk) => chunk.documentId && chunk.sourceHash && chunk.page > 0 && chunk.chunkHash));
expect('Update Center documents F282', update.includes('F282 OCR RAG readiness'));
expect('Manual documents F282', manual.includes('Addendum F282'));
expect('Version manual documents F282', versions.includes('F282'));
expect('Changelog documents F282', changelog.includes('F282'));

if (failures.length) {
  console.error('F282 OCR/RAG readiness contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F282 OCR/RAG readiness contracts passed.');
