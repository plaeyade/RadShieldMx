import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f268_real_memory_ingestion/f268_real_memory_ingestion.json'));
const draft = JSON.parse(read('outputs/f268_real_memory_ingestion/f268_document_chunks_db_draft.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const f268Lib = read('src/lib/f268RealAnalyticMemoryIngestion.ts');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F268 status ready', manifest.status === 'real-memory-ingestion-ready');
expect('At least 10 supplied documents tracked', manifest.documentCount >= 10);
expect('Duplicates detected', manifest.duplicateCount >= 2);
expect('RAG ready canonical documents present', manifest.ragReadyCount >= 5);
expect('Chunks generated', manifest.chunkCount > 20);
expect('TX modality present', manifest.modalities.includes('TX'));
expect('CY modality present', manifest.modalities.includes('CY'));
expect('GammaKnife modality present', manifest.modalities.includes('GammaKnife'));
expect('Brachy modality present', manifest.modalities.includes('Brachy'));
expect('DB draft matches chunk count', draft.chunks.length === manifest.chunkCount);
expect('F268 lib exists', f268Lib.includes('buildF268RealAnalyticMemoryIngestionSummary'));
expect('Update Center documents F268', update.includes('F268 Real memory ingestion'));
expect('Changelog documents F268', changelog.includes('F268'));
expect('Manual versions documents F268', versions.includes('F268'));
expect('User manual documents F268', manual.includes('F268'));

if (failures.length) {
  console.error('F268 real memory ingestion contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F268 real memory ingestion contracts passed.');
