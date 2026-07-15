import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f143ZumayaDocumentIngestion.ts',
  'scripts/f143-zumaya-document-ingestion.mjs',
  'scripts/check-f143-zumaya-document-ingestion-contracts.mjs',
  'outputs/f143_zumaya_document_ingestion/f143_zumaya_document_ingestion.json',
  'outputs/f143_zumaya_document_ingestion/f143_seed_report.json',
  'outputs/fase_143_zumaya_document_ingestion.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const read = (file) => readFileSync(file, 'utf8');
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const report = existsSync(requiredFiles[3]) ? JSON.parse(read(requiredFiles[3])) : null;
if (report) {
  if (report.phase !== 'F143') failures.push('F143 report phase mismatch');
  if (!['ready', 'ready-with-document-warnings'].includes(report.status)) failures.push(`Unexpected F143 status: ${report.status}`);
  if (report.documentCount !== 7) failures.push(`Expected 7 F143 documents, got ${report.documentCount}`);
  if (report.ragReadyCount !== 7) failures.push(`Expected 7 RAG-ready documents, got ${report.ragReadyCount}`);
  if (report.needsOcrCount !== 0) failures.push(`Expected zero OCR documents, got ${report.needsOcrCount}`);
  if (report.chunkCount < 500) failures.push(`Expected substantial chunk count, got ${report.chunkCount}`);
  if (report.database?.mode !== 'live') failures.push('F143 expected live DB seed mode');
  if (report.database?.inserted !== report.chunkCount) failures.push('F143 inserted count should equal chunk count');
}

const update = existsSync('src/sections/dialogs/UpdateAppDialog.tsx') ? read('src/sections/dialogs/UpdateAppDialog.tsx') : '';
for (const token of ['buildF143ZumayaDocumentIngestionSummary', 'f143-zumaya-document-ingestion']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing ${token}`);
}

const pkg = existsSync('package.json') ? read('package.json') : '';
for (const token of ['prepare:f143:zumaya-docs', 'test:f143:zumaya-docs']) {
  if (!pkg.includes(token)) failures.push(`package.json missing ${token}`);
}

if (failures.length > 0) {
  console.error('F143 ZUMAYA document ingestion contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F143 ZUMAYA document ingestion contracts OK.');
