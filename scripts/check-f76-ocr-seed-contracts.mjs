import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const pkg = JSON.parse(read('package.json'));
const prep = read('scripts/f75-prepare-pdf-rag.mjs');
const ocr = read('scripts/f76-ocr-pending-pdfs.mjs');
const seed = read('scripts/f76-seed-document-chunks.mjs');
const ocrStatusPath = join(root, 'outputs', 'f76_ocr', 'f76_ocr_status.json');
const seedReportPath = join(root, 'outputs', 'f76_seed', 'f76_seed_document_chunks_report.json');
const ocrStatus = existsSync(ocrStatusPath) ? JSON.parse(read('outputs/f76_ocr/f76_ocr_status.json')) : null;
const seedReport = existsSync(seedReportPath) ? JSON.parse(read('outputs/f76_seed/f76_seed_document_chunks_report.json')) : null;

const checks = [
  {
    name: 'ocr:script-registered',
    ok: pkg.scripts?.['prepare:f76:ocr'] === 'node scripts/f76-ocr-pending-pdfs.mjs',
  },
  {
    name: 'ocr:sidecar-supported-by-rag-prep',
    ok: prep.includes('ocrSidecarDirs') &&
      prep.includes("join(root, 'data', 'rag', 'ocr')") &&
      prep.includes("join(root, 'outputs', 'f76_ocr', 'extracted_text')"),
  },
  {
    name: 'ocr:pending-report-generated',
    ok: Boolean(ocrStatus?.phase === 'F76' && ocrStatus?.candidateCount >= 1 && Array.isArray(ocrStatus?.results)),
  },
  {
    name: 'seed:dry-run-default',
    ok: seed.includes("process.env.F76_SEED_LIVE === '1'") && seed.includes("mode: live ? 'live' : 'dry-run'"),
  },
  {
    name: 'seed:script-registered',
    ok: pkg.scripts?.['db:seed:f76:documents'] === 'node scripts/f76-seed-document-chunks.mjs',
  },
  {
    name: 'seed:dry-run-report-generated',
    ok: Boolean(seedReport?.phase === 'F76' && seedReport?.mode === 'dry-run' && seedReport?.chunkCount >= 200),
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F76',
  ok: failed.length === 0,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
};

mkdirSync(join(root, 'outputs'), { recursive: true });
writeFileSync(join(root, 'outputs', 'f76_ocr_seed_contracts.json'), `${JSON.stringify(output, null, 2)}\n`);

if (failed.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log('F76 OCR/seed contracts passed');
