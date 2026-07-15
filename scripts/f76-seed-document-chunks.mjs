import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import mysql from 'mysql2/promise';

const root = process.cwd();
const draftPath = join(root, 'outputs', 'f75_pdf_ingestion', 'f75_document_chunks_db_draft.json');
const outputDir = join(root, 'outputs', 'f76_seed');
mkdirSync(outputDir, { recursive: true });

const live = process.env.F76_SEED_LIVE === '1';
const databaseUrl = process.env.DATABASE_URL;

function simpleEmbedding(text, dims = 128) {
  const stopWords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'al', 'que', 'en', 'por', 'para',
    'con', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'durante', 'segun', 'mediante',
    'y', 'o', 'pero', 'aunque', 'porque', 'si', 'no', 'the', 'a', 'an', 'and', 'or',
    'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by',
  ]);
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
  const freq = new Map();
  for (const word of words) freq.set(word, (freq.get(word) || 0) + 1);
  const maxFreq = Math.max(...freq.values(), 1);
  for (const [word, count] of freq.entries()) {
    let hash = 0;
    for (let i = 0; i < word.length; i += 1) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % dims;
    vec[idx] += (count / maxFreq) * 0.5 + 0.1;
  }
  const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? vec.map((value) => value / norm) : vec;
}

function contentHash(chunk) {
  return createHash('sha256')
    .update(`${chunk.source}|${chunk.section}|${chunk.pageRef || ''}|${chunk.content}`)
    .digest('hex')
    .slice(0, 16);
}

if (!existsSync(draftPath)) {
  throw new Error(`Missing DB draft: ${draftPath}. Run npm run prepare:f75:pdf-rag first.`);
}

const draft = JSON.parse(readFileSync(draftPath, 'utf8'));
const chunks = (draft.chunks || []).map((chunk) => ({
  ...chunk,
  embedding: JSON.stringify(simpleEmbedding(chunk.content)),
  tags: JSON.stringify([
    ...new Set([
      ...JSON.parse(chunk.tags || '[]'),
      'F76',
      `hash:${contentHash(chunk)}`,
    ]),
  ]),
}));
const sources = [...new Set(chunks.map((chunk) => chunk.source))].sort();

const report = {
  phase: 'F76',
  generatedAt: new Date().toISOString(),
  mode: live ? 'live' : 'dry-run',
  ok: false,
  databaseUrlConfigured: Boolean(databaseUrl),
  sourceCount: sources.length,
  chunkCount: chunks.length,
  sources,
  inserted: 0,
  deletedSources: [],
  reason: '',
};

if (!databaseUrl) {
  report.reason = 'DATABASE_URL is not configured. Dry-run only.';
} else if (!live) {
  report.reason = 'Dry-run only. Set F76_SEED_LIVE=1 to insert into document_chunks.';
} else {
  const connection = await mysql.createConnection(databaseUrl);
  try {
    await connection.beginTransaction();
    if (sources.length > 0) {
      await connection.query(
        `DELETE FROM document_chunks WHERE source IN (${sources.map(() => '?').join(',')})`,
        sources,
      );
      report.deletedSources = sources;
    }
    const rows = chunks.map((chunk, index) => [
      chunk.source,
      chunk.section || `F76 document chunk ${index + 1}`,
      chunk.modality || 'General',
      chunk.content,
      chunk.embedding,
      chunk.tags,
      chunk.pageRef || null,
    ]);
    if (rows.length > 0) {
      await connection.query(
        'INSERT INTO document_chunks (source, section, modality, content, embedding, tags, page_ref) VALUES ?',
        [rows],
      );
    }
    await connection.commit();
    report.ok = true;
    report.inserted = rows.length;
    report.reason = 'Live seed completed.';
  } catch (error) {
    await connection.rollback();
    report.reason = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (!live) {
  report.ok = true;
}

writeFileSync(join(outputDir, 'f76_seed_document_chunks_report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
