import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputDir = path.join(root, 'outputs', 'f284_rag_seed_candidate');
const outputDir = path.join(root, 'outputs', 'f285_controlled_rag_seed');
fs.mkdirSync(outputDir, { recursive: true });

const seedLive = process.env.F285_SEED_LIVE === '1';
const confirmReviewed = process.env.F285_CONFIRM_REVIEWED === '1';
const databaseUrl = process.env.DATABASE_URL;
const mode = seedLive && confirmReviewed && databaseUrl ? 'live' : 'dry-run';

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readJsonl = (filePath) => fs.readFileSync(filePath, 'utf8')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

function simpleEmbedding(text, dims = 128) {
  const vec = new Array(dims).fill(0);
  const words = String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);

  for (const word of words) {
    let hash = 0;
    for (let index = 0; index < word.length; index += 1) {
      hash = ((hash << 5) - hash + word.charCodeAt(index)) | 0;
    }
    vec[Math.abs(hash) % dims] += 1;
  }

  const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? vec.map((value) => Number((value / norm).toFixed(8))) : vec;
}

function toDbRow(row) {
  const tags = [
    'F285',
    'F284-approved-seed-candidate',
    `document:${row.documentId}`,
    `sourceHash:${row.sourceHash}`,
    `chunkHash:${row.chunkHash}`,
    `textHash:${row.textHash}`,
    `extraction:${row.extractionMode}`,
    `qa:${row.qaStatus}`,
    `quality:${row.pageQualityScore}`,
    `citation:${row.citationLocator}`,
  ];

  return {
    source: `f285-ocr-memory-${row.documentId}`,
    section: `${row.citationLocator} chunk ${row.chunkId}`,
    modality: row.modality,
    content: row.text,
    embedding: JSON.stringify(simpleEmbedding(row.text)),
    tags: JSON.stringify(tags),
    page_ref: `p.${row.page}; chunk=${row.chunkHash.slice(0, 12)}; source=${row.sourceHash.slice(0, 12)}`,
  };
}

const f284 = readJson(path.join(inputDir, 'f284_rag_seed_candidate.json'));
const candidates = readJsonl(path.join(inputDir, 'f284_document_chunks_seed_candidate.jsonl'));
const blocked = candidates.filter((row) => row.qaStatus !== 'chunk-seed-draft-ready' || row.reviewStatus !== 'seed-draft-ready');

if (blocked.length > 0) {
  throw new Error(`F285 refused to seed ${blocked.length} chunks that are not seed-draft-ready.`);
}

const dbRows = candidates.map(toDbRow);
const sources = [...new Set(dbRows.map((row) => row.source))].sort();
const byModality = dbRows.reduce((acc, row) => {
  acc[row.modality] = (acc[row.modality] ?? 0) + 1;
  return acc;
}, {});

const seedReport = {
  mode,
  databaseUrlConfigured: Boolean(databaseUrl),
  requiredFlags: ['F285_SEED_LIVE=1', 'F285_CONFIRM_REVIEWED=1', 'DATABASE_URL'],
  liveDbWritePerformed: false,
  deletePolicy: 'delete only exact F285 source ids before insert',
  sourceCount: sources.length,
  rowCount: dbRows.length,
  inserted: 0,
  deletedSources: [],
  preflight: {
    f284Status: f284.status,
    candidatesMatchManifest: f284.totals.seedCandidates === candidates.length,
    onlySeedDraftReady: blocked.length === 0,
  },
  reason: mode === 'live'
    ? ''
    : 'Dry-run only. Set F285_SEED_LIVE=1, F285_CONFIRM_REVIEWED=1 and DATABASE_URL after operator review to insert into document_chunks.',
};

if (seedLive && (!confirmReviewed || !databaseUrl)) {
  seedReport.reason = 'Live seed requested but blocked: both F285_CONFIRM_REVIEWED=1 and DATABASE_URL are required.';
}

if (mode === 'live') {
  const mysql = await import('mysql2/promise');
  const connection = await mysql.default.createConnection(databaseUrl);
  try {
    await connection.beginTransaction();
    if (sources.length > 0) {
      await connection.query(`DELETE FROM document_chunks WHERE source IN (${sources.map(() => '?').join(',')})`, sources);
      seedReport.deletedSources = sources;
    }
    if (dbRows.length > 0) {
      await connection.query(
        'INSERT INTO document_chunks (source, section, modality, content, embedding, tags, page_ref) VALUES ?',
        [dbRows.map((row) => [row.source, row.section, row.modality, row.content, row.embedding, row.tags, row.page_ref])],
      );
    }
    await connection.commit();
    seedReport.liveDbWritePerformed = true;
    seedReport.inserted = dbRows.length;
    seedReport.reason = 'Live F285 controlled RAG seed completed.';
  } catch (error) {
    await connection.rollback();
    seedReport.reason = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    await connection.end();
  }
}

const manifest = {
  phase: 'F285',
  schema: 'radshield-mx.controlled-rag-seed.f285.v1',
  generatedAt: new Date().toISOString(),
  status: mode === 'live' ? 'controlled-rag-seed-live-complete' : 'controlled-rag-seed-dry-run',
  inputPhases: ['F281', 'F282', 'F283', 'F284'],
  targetTable: 'document_chunks',
  seedDbAutomatically: false,
  liveDbWritePerformed: seedReport.liveDbWritePerformed,
  totals: {
    rowsPrepared: dbRows.length,
    sources: sources.length,
    modalities: byModality,
  },
  database: seedReport,
  operatorChecklist: [
    'Review F283 sample pages and blocked-page list.',
    'Confirm no protected patient identifiers are intended for public/static deployment.',
    'Run DB backup and restore probe before live seed.',
    'Enable live seed only with F285_SEED_LIVE=1 and F285_CONFIRM_REVIEWED=1.',
    'Run F170 RAG citation governance after live seed.',
  ],
  outputArtifacts: [
    'outputs/f285_controlled_rag_seed/f285_controlled_rag_seed.json',
    'outputs/f285_controlled_rag_seed/f285_document_chunks_db_rows.jsonl',
    'outputs/f285_controlled_rag_seed/f285_seed_report.json',
    'outputs/fase_285_controlled_rag_seed.md',
  ],
};

fs.writeFileSync(path.join(outputDir, 'f285_controlled_rag_seed.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f285_document_chunks_db_rows.jsonl'), `${dbRows.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f285_seed_report.json'), `${JSON.stringify(seedReport, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_285_controlled_rag_seed.md'),
  [
    '# F285 Controlled RAG Seed',
    '',
    `Status: ${manifest.status}`,
    `Mode: ${seedReport.mode}`,
    `Target table: ${manifest.targetTable}`,
    `Rows prepared: ${manifest.totals.rowsPrepared}`,
    `Sources: ${manifest.totals.sources}`,
    `Modalities: ${Object.entries(byModality).map(([key, value]) => `${key}=${value}`).join(', ')}`,
    `Live DB write performed: ${manifest.liveDbWritePerformed ? 'yes' : 'no'}`,
    '',
    '## Safety gate',
    seedReport.reason,
    '',
    '## Operator checklist',
    ...manifest.operatorChecklist.map((item) => `- ${item}`),
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  mode: seedReport.mode,
  rowsPrepared: manifest.totals.rowsPrepared,
  liveDbWritePerformed: manifest.liveDbWritePerformed,
}, null, 2));
