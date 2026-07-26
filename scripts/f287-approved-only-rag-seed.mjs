import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const f285Dir = path.join(root, 'outputs', 'f285_controlled_rag_seed');
const f286Dir = path.join(root, 'outputs', 'f286_ocr_human_review_packet');
const outputDir = path.join(root, 'outputs', 'f287_approved_only_rag_seed');
fs.mkdirSync(outputDir, { recursive: true });

const seedLive = process.env.F287_SEED_LIVE === '1';
const confirmApprovedOnly = process.env.F287_CONFIRM_APPROVED_ONLY === '1';
const databaseUrl = process.env.DATABASE_URL;
const mode = seedLive && confirmApprovedOnly && databaseUrl ? 'live' : 'dry-run';

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readJsonl = (filePath) => fs.readFileSync(filePath, 'utf8')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      row.push(cell);
      cell = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [header, ...data] = rows;
  return data.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ''])));
}

function chunkHashFromTags(row) {
  try {
    const tags = JSON.parse(row.tags || '[]');
    const tag = tags.find((value) => String(value).startsWith('chunkHash:'));
    return tag ? tag.slice('chunkHash:'.length) : '';
  } catch {
    return '';
  }
}

function sourceHashFromTags(row) {
  try {
    const tags = JSON.parse(row.tags || '[]');
    const tag = tags.find((value) => String(value).startsWith('sourceHash:'));
    return tag ? tag.slice('sourceHash:'.length) : '';
  } catch {
    return '';
  }
}

const f285 = readJson(path.join(f285Dir, 'f285_controlled_rag_seed.json'));
const f286 = readJson(path.join(f286Dir, 'f286_ocr_human_review_packet.json'));
const dbRows = readJsonl(path.join(f285Dir, 'f285_document_chunks_db_rows.jsonl'));
const decisions = parseCsv(fs.readFileSync(path.join(f286Dir, 'f286_review_decisions_template.csv'), 'utf8'));
const f285ChunkHashes = new Set(dbRows.map((row) => chunkHashFromTags(row)).filter(Boolean));

const normalizedDecisions = decisions.map((row) => ({
  ...row,
  decision: String(row.decision || '').trim().toLowerCase(),
  chunkHashes: String(row.chunkHashes || '').split('|').filter(Boolean),
}));

const pending = normalizedDecisions.filter((row) => !row.decision || row.decision === 'pending');
const approvedDecisionRows = normalizedDecisions.filter((row) => row.decision === 'approve');
const excludedDecisionRows = normalizedDecisions.filter((row) => row.decision && row.decision !== 'approve');
const explicitlyApprovedHashes = new Set(approvedDecisionRows.flatMap((row) => row.chunkHashes));
const explicitlyExcludedHashes = new Set(excludedDecisionRows.flatMap((row) => row.chunkHashes));
const reviewExcludedRows = excludedDecisionRows.map((row) => ({
  decision: row.decision,
  reason: row.reason,
  pageKey: row.pageKey,
  documentId: row.documentId,
  page: Number(row.page),
  modality: row.modality,
  extractionMode: row.extractionMode,
  minQualityScore: Number(row.minQualityScore),
  flags: row.flags,
  sourceHash: row.sourceHash,
  chunkHashes: row.chunkHashes,
  overlapsF285SeedRows: row.chunkHashes.some((hash) => f285ChunkHashes.has(hash)),
}));

const approvedRows = [];
const f285ExcludedRows = [];
for (const row of dbRows) {
  const chunkHash = chunkHashFromTags(row);
  const sourceHash = sourceHashFromTags(row);
  const decision = explicitlyApprovedHashes.has(chunkHash)
    ? 'human-approved'
    : explicitlyExcludedHashes.has(chunkHash)
      ? 'human-excluded'
      : 'qa-seed-draft-ready';

  const nextRow = {
    ...row,
    source: row.source.replace(/^f285-/, 'f287-'),
    tags: JSON.stringify([
      ...JSON.parse(row.tags || '[]'),
      'F287',
      `f287Decision:${decision}`,
      `f287SourceHash:${sourceHash}`,
      `f287ChunkHash:${chunkHash}`,
    ]),
  };

  if (decision === 'human-excluded') {
    f285ExcludedRows.push({ source: row.source, page_ref: row.page_ref, chunkHash, decision });
  } else {
    approvedRows.push(nextRow);
  }
}

const sources = [...new Set(approvedRows.map((row) => row.source))].sort();
const byModality = approvedRows.reduce((acc, row) => {
  acc[row.modality] = (acc[row.modality] ?? 0) + 1;
  return acc;
}, {});

const seedReport = {
  mode,
  databaseUrlConfigured: Boolean(databaseUrl),
  requiredFlags: ['F287_SEED_LIVE=1', 'F287_CONFIRM_APPROVED_ONLY=1', 'DATABASE_URL'],
  liveDbWritePerformed: false,
  deletePolicy: 'delete only exact F287 source ids before insert',
  sourceCount: sources.length,
  rowCount: approvedRows.length,
  inserted: 0,
  deletedSources: [],
  reason: mode === 'live'
    ? ''
    : 'Dry-run only. Set F287_SEED_LIVE=1, F287_CONFIRM_APPROVED_ONLY=1 and DATABASE_URL after backup/restore probe.',
};

if (pending.length > 0) {
  seedReport.reason = `Blocked: ${pending.length} F286 decision rows remain pending.`;
}

if (mode === 'live') {
  if (pending.length > 0) throw new Error(seedReport.reason);
  const mysql = await import('mysql2/promise');
  const connection = await mysql.default.createConnection(databaseUrl);
  try {
    await connection.beginTransaction();
    if (sources.length > 0) {
      await connection.query(`DELETE FROM document_chunks WHERE source IN (${sources.map(() => '?').join(',')})`, sources);
      seedReport.deletedSources = sources;
    }
    if (approvedRows.length > 0) {
      await connection.query(
        'INSERT INTO document_chunks (source, section, modality, content, embedding, tags, page_ref) VALUES ?',
        [approvedRows.map((row) => [row.source, row.section, row.modality, row.content, row.embedding, row.tags, row.page_ref])],
      );
    }
    await connection.commit();
    seedReport.liveDbWritePerformed = true;
    seedReport.inserted = approvedRows.length;
    seedReport.reason = 'Live F287 approved-only RAG seed completed.';
  } catch (error) {
    await connection.rollback();
    seedReport.reason = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    await connection.end();
  }
}

const manifest = {
  phase: 'F287',
  schema: 'radshield-mx.approved-only-rag-seed.f287.v1',
  generatedAt: new Date().toISOString(),
  status: mode === 'live' ? 'approved-only-rag-seed-live-complete' : 'approved-only-rag-seed-dry-run',
  inputPhases: ['F285', 'F286'],
  targetTable: 'document_chunks',
  seedDbAutomatically: false,
  liveDbWritePerformed: seedReport.liveDbWritePerformed,
  f286DecisionSummary: {
    totalRows: normalizedDecisions.length,
    pending: pending.length,
    approve: approvedDecisionRows.length,
    excluded: excludedDecisionRows.length,
    byDecision: normalizedDecisions.reduce((acc, row) => {
      acc[row.decision || 'blank'] = (acc[row.decision || 'blank'] ?? 0) + 1;
      return acc;
    }, {}),
  },
  totals: {
    f285Rows: f285.totals.rowsPrepared,
    approvedRows: approvedRows.length,
    f285ExcludedRows: f285ExcludedRows.length,
    f286ReviewRowsExcluded: reviewExcludedRows.length,
    sources: sources.length,
    modalities: byModality,
  },
  database: seedReport,
  releaseDecision:
    'F287 seeds only F285 QA-ready rows not explicitly excluded by F286 review decisions. F286 needs-reocr/needs-redaction/reject rows are not inserted.',
  nextPhase: seedReport.liveDbWritePerformed ? 'F288 live RAG validation' : 'F288 dry-run/live RAG validation after operator-controlled seed',
  outputArtifacts: [
    'outputs/f287_approved_only_rag_seed/f287_approved_only_rag_seed.json',
    'outputs/f287_approved_only_rag_seed/f287_document_chunks_approved_only.jsonl',
    'outputs/f287_approved_only_rag_seed/f287_excluded_by_review.jsonl',
    'outputs/f287_approved_only_rag_seed/f287_seed_report.json',
    'outputs/fase_287_approved_only_rag_seed.md',
  ],
};

fs.writeFileSync(path.join(outputDir, 'f287_approved_only_rag_seed.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f287_document_chunks_approved_only.jsonl'), `${approvedRows.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f287_excluded_by_review.jsonl'), `${reviewExcludedRows.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f287_f285_rows_excluded_by_review.jsonl'), `${f285ExcludedRows.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f287_seed_report.json'), `${JSON.stringify(seedReport, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_287_approved_only_rag_seed.md'),
  [
    '# F287 Approved-only RAG Seed',
    '',
    `Status: ${manifest.status}`,
    `Mode: ${seedReport.mode}`,
    `F286 decisions: ${JSON.stringify(manifest.f286DecisionSummary.byDecision)}`,
    `Approved rows prepared: ${manifest.totals.approvedRows}`,
    `F286 review rows excluded: ${manifest.totals.f286ReviewRowsExcluded}`,
    `F285 rows affected by exclusions: ${manifest.totals.f285ExcludedRows}`,
    `Live DB write performed: ${manifest.liveDbWritePerformed ? 'yes' : 'no'}`,
    '',
    '## Decision',
    manifest.releaseDecision,
    '',
    '## Next',
    manifest.nextPhase,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  mode: seedReport.mode,
  decisions: manifest.f286DecisionSummary.byDecision,
  approvedRows: manifest.totals.approvedRows,
  f286ReviewRowsExcluded: manifest.totals.f286ReviewRowsExcluded,
  f285ExcludedRows: manifest.totals.f285ExcludedRows,
  liveDbWritePerformed: manifest.liveDbWritePerformed,
}, null, 2));
