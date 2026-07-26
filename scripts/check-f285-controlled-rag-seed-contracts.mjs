import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f285_controlled_rag_seed/f285_controlled_rag_seed.json'));
const seedReport = JSON.parse(read('outputs/f285_controlled_rag_seed/f285_seed_report.json'));
const rows = read('outputs/f285_controlled_rag_seed/f285_document_chunks_db_rows.jsonl')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');
const script = read('scripts/f285-controlled-rag-seed.mjs');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F285 status', ['controlled-rag-seed-dry-run', 'controlled-rag-seed-live-complete'].includes(manifest.status));
expect('Target table is document_chunks', manifest.targetTable === 'document_chunks');
expect('No automatic DB seed', manifest.seedDbAutomatically === false);
expect('Rows prepared', rows.length > 1000);
expect('Manifest row count matches', manifest.totals.rowsPrepared === rows.length);
expect('Seed report row count matches', seedReport.rowCount === rows.length);
expect('Dry run by default', seedReport.mode === 'dry-run' && manifest.liveDbWritePerformed === false);
expect('Requires live and reviewed flags', seedReport.requiredFlags.includes('F285_SEED_LIVE=1') && seedReport.requiredFlags.includes('F285_CONFIRM_REVIEWED=1'));
expect('Script gates live seed', script.includes("process.env.F285_SEED_LIVE === '1'") && script.includes("process.env.F285_CONFIRM_REVIEWED === '1'"));
expect('Rows are DB compatible', rows.every((row) => row.source?.startsWith('f285-ocr-memory-') && row.section && row.modality && row.content && row.embedding && row.tags && row.page_ref));
expect('Rows keep hash tags', rows.every((row) => row.tags.includes('sourceHash:') && row.tags.includes('chunkHash:') && row.page_ref.includes('chunk=')));
expect('Update Center documents F285', update.includes('F285 Controlled RAG seed'));
expect('Manual documents F285', manual.includes('Addendum F285'));
expect('Version manual documents F285', versions.includes('F285'));
expect('Changelog documents F285', changelog.includes('F285'));

if (failures.length) {
  console.error('F285 controlled RAG seed contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F285 controlled RAG seed contracts passed.');
