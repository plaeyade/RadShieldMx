import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const f287Dir = path.join(root, 'outputs', 'f287_approved_only_rag_seed');
const outputDir = path.join(root, 'outputs', 'f288_rag_approved_validation');
fs.mkdirSync(outputDir, { recursive: true });

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readJsonl = (filePath) => fs.readFileSync(filePath, 'utf8')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

function parseTags(row) {
  try {
    return JSON.parse(row.tags || '[]');
  } catch {
    return [];
  }
}

function sha(text) {
  return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

function scoreQuery(row, query) {
  const haystack = `${row.source} ${row.section} ${row.modality} ${row.content}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

const f287 = readJson(path.join(f287Dir, 'f287_approved_only_rag_seed.json'));
const rows = readJsonl(path.join(f287Dir, 'f287_document_chunks_approved_only.jsonl'));
const reviewExcluded = readJsonl(path.join(f287Dir, 'f287_excluded_by_review.jsonl'));

const rowHashes = rows.map((row) => sha(`${row.source}|${row.page_ref}|${row.content}`));
const duplicateHashes = [...new Set(rowHashes.filter((hash, index) => rowHashes.indexOf(hash) !== index))];
const invalidRows = rows.filter((row) => {
  const tags = parseTags(row);
  return !row.source?.startsWith('f287-ocr-memory-')
    || !row.section
    || !row.modality
    || !row.content
    || !row.page_ref
    || !row.embedding
    || !tags.includes('F287')
    || !tags.some((tag) => String(tag).startsWith('sourceHash:'))
    || !tags.some((tag) => String(tag).startsWith('chunkHash:'));
});

const byModality = rows.reduce((acc, row) => {
  acc[row.modality] = (acc[row.modality] ?? 0) + 1;
  return acc;
}, {});
const bySource = rows.reduce((acc, row) => {
  acc[row.source] = (acc[row.source] ?? 0) + 1;
  return acc;
}, {});

const smokeQueries = [
  { id: 'cy-cyclotron', query: 'ciclotron blindaje concreto activado' },
  { id: 'tx-linac', query: 'Versa HD 15 MV barrera primaria' },
  { id: 'tx-gamma-knife', query: 'Gamma Knife memoria analitica' },
  { id: 'tx-braqui', query: 'Braqui Co-60 blindaje' },
];

const retrievalSmoke = smokeQueries.map((item) => {
  const top = rows
    .map((row) => ({ row, score: scoreQuery(row, item.query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => ({
      source: entry.row.source,
      modality: entry.row.modality,
      pageRef: entry.row.page_ref,
      score: entry.score,
      preview: entry.row.content.replace(/\s+/g, ' ').slice(0, 240),
    }));
  return { ...item, hits: top.length, top };
});

const dbReadback = {
  attempted: process.env.F288_DB_READBACK === '1',
  databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
  f287RowsInDb: null,
  distinctSourcesInDb: null,
  ok: null,
  reason: 'DB readback skipped. Set F288_DB_READBACK=1 after live seed.',
};

if (dbReadback.attempted) {
  if (!process.env.DATABASE_URL) {
    dbReadback.ok = false;
    dbReadback.reason = 'DATABASE_URL is not configured.';
  } else {
    const mysql = await import('mysql2/promise');
    const connection = await mysql.default.createConnection(process.env.DATABASE_URL);
    try {
      const [countRows] = await connection.query("select count(*) as count, count(distinct source) as sources from document_chunks where source like 'f287-ocr-memory-%'");
      dbReadback.f287RowsInDb = Number(countRows[0]?.count ?? 0);
      dbReadback.distinctSourcesInDb = Number(countRows[0]?.sources ?? 0);
      dbReadback.ok = dbReadback.f287RowsInDb === rows.length;
      dbReadback.reason = dbReadback.ok
        ? 'F287 approved rows are present in DB.'
        : 'F287 approved rows are not fully present in DB; live seed may not have been run.';
    } finally {
      await connection.end();
    }
  }
}

const gates = {
  f287Ready: f287.status === 'approved-only-rag-seed-dry-run' || f287.status === 'approved-only-rag-seed-live-complete',
  rowsPrepared: rows.length === f287.totals.approvedRows && rows.length > 1000,
  noInvalidRows: invalidRows.length === 0,
  noDuplicateRows: duplicateHashes.length === 0,
  reviewExclusionsPreserved: reviewExcluded.length === f287.totals.f286ReviewRowsExcluded,
  retrievalSmokeReady: retrievalSmoke.every((item) => item.hits > 0),
};

const status = Object.values(gates).every(Boolean)
  ? 'rag-approved-validation-ready'
  : 'rag-approved-validation-gated';

const manifest = {
  phase: 'F288',
  schema: 'radshield-mx.rag-approved-validation.f288.v1',
  generatedAt: new Date().toISOString(),
  status,
  inputPhases: ['F287'],
  seedDbAutomatically: false,
  liveDbWritePerformed: false,
  totals: {
    rows: rows.length,
    sources: Object.keys(bySource).length,
    modalities: byModality,
    reviewExcludedRows: reviewExcluded.length,
    invalidRows: invalidRows.length,
    duplicateRows: duplicateHashes.length,
  },
  gates,
  dbReadback,
  retrievalSmoke,
  releaseDecision:
    'F288 validates the approved-only RAG corpus as a local/private evidence corpus. DB readback remains optional and read-only.',
  nextPhase: 'F289 Memoria IA RAG handoff',
  outputArtifacts: [
    'outputs/f288_rag_approved_validation/f288_rag_approved_validation.json',
    'outputs/f288_rag_approved_validation/f288_retrieval_smoke.json',
    'outputs/fase_288_rag_approved_validation.md',
  ],
};

fs.writeFileSync(path.join(outputDir, 'f288_rag_approved_validation.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f288_retrieval_smoke.json'), `${JSON.stringify(retrievalSmoke, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_288_rag_approved_validation.md'), [
  '# F288 RAG Approved Validation',
  '',
  `Status: ${status}`,
  `Rows: ${rows.length}`,
  `Sources: ${Object.keys(bySource).length}`,
  `Modalities: ${Object.entries(byModality).map(([key, value]) => `${key}=${value}`).join(', ')}`,
  `Review exclusions preserved: ${reviewExcluded.length}`,
  '',
  '## Retrieval smoke',
  ...retrievalSmoke.map((item) => `- ${item.id}: ${item.hits} hits`),
  '',
  '## DB readback',
  dbReadback.reason,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status,
  rows: rows.length,
  modalities: byModality,
  retrievalSmoke: retrievalSmoke.map((item) => ({ id: item.id, hits: item.hits })),
  dbReadback: dbReadback.reason,
}, null, 2));

if (status !== 'rag-approved-validation-ready') process.exit(1);
