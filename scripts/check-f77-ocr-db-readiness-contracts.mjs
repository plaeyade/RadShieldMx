import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const readinessPath = join(root, 'outputs', 'f77_ocr_db', 'f77_ocr_install_db_readiness.json');
const ocrPath = join(root, 'outputs', 'f76_ocr', 'f76_ocr_status.json');
const seedPath = join(root, 'outputs', 'f76_seed', 'f76_seed_document_chunks_report.json');
const f75SummaryPath = join(root, 'outputs', 'f75_pdf_ingestion_summary.json');

const readiness = existsSync(readinessPath) ? JSON.parse(read('outputs/f77_ocr_db/f77_ocr_install_db_readiness.json')) : null;
const ocr = existsSync(ocrPath) ? JSON.parse(read('outputs/f76_ocr/f76_ocr_status.json')) : null;
const seed = existsSync(seedPath) ? JSON.parse(read('outputs/f76_seed/f76_seed_document_chunks_report.json')) : null;
const f75 = existsSync(f75SummaryPath) ? JSON.parse(read('outputs/f75_pdf_ingestion_summary.json')) : null;

const checks = [
  {
    name: 'f77:required-pdfs-found-in-zumaya',
    ok: Boolean(readiness?.pdfs?.length >= 4 && readiness.pdfs.every((pdf) => pdf.exists)),
  },
  {
    name: 'f77:ocr-blocker-explicit',
    ok: Boolean(readiness?.blockers?.some((item) => item.includes('OCR engine missing'))),
  },
  {
    name: 'f77:db-live-disarmed',
    ok: readiness?.databaseUrlConfigured === false && readiness?.liveSeedArmed === false,
  },
  {
    name: 'f77:ocr-candidates-tracked',
    ok: Boolean(ocr?.candidateCount === 2 && ocr?.results?.every((item) => item.status === 'ocr-engine-missing')),
  },
  {
    name: 'f77:seed-dry-run-preserves-rag-count',
    ok: Boolean(seed?.mode === 'dry-run' && seed?.chunkCount === 229 && f75?.totalChunks === 229),
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F77',
  ok: failed.length === 0,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
};

mkdirSync(join(root, 'outputs'), { recursive: true });
writeFileSync(join(root, 'outputs', 'f77_ocr_db_readiness_contracts.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');

if (failed.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log('F77 OCR/DB readiness contracts passed');
