import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f284_rag_seed_candidate/f284_rag_seed_candidate.json'));
const seed = read('outputs/f284_rag_seed_candidate/f284_document_chunks_seed_candidate.jsonl').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const excluded = read('outputs/f284_rag_seed_candidate/f284_review_excluded_chunks.jsonl').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F284 status', manifest.status === 'rag-seed-candidate-dry-run');
expect('No automatic DB seed', manifest.seedDbAutomatically === false);
expect('No live DB write', manifest.liveDbWritePerformed === false);
expect('Seed candidates exist', seed.length > 1000);
expect('Excluded chunks exist', excluded.length > 0);
expect('Manifest counts match seed', manifest.totals.seedCandidates === seed.length);
expect('Manifest counts match excluded', manifest.totals.reviewExcluded === excluded.length);
expect('Seed rows have page/hash/text', seed.every((row) => row.documentId && row.page > 0 && row.sourceHash && row.chunkHash && row.text));
expect('Seed rows are only draft ready', seed.every((row) => row.reviewStatus === 'seed-draft-ready' && row.qaStatus === 'chunk-seed-draft-ready'));
expect('Excluded rows are not seed ready', excluded.every((row) => row.qaStatus !== 'chunk-seed-draft-ready'));
expect('Update Center documents F284', update.includes('F284 RAG seed candidate'));
expect('Manual documents F284', manual.includes('Addendum F284'));
expect('Version manual documents F284', versions.includes('F284'));
expect('Changelog documents F284', changelog.includes('F284'));

if (failures.length) {
  console.error('F284 RAG seed candidate contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F284 RAG seed candidate contracts passed.');
