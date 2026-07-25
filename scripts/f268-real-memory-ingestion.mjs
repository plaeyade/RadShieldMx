import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';

const root = process.cwd();
const sourceDirs = [
  process.env.F268_MEMORY_SOURCE_DIR,
  'C:\\Users\\carlo\\Downloads\\RadShield Mx',
  'C:\\Users\\carlo\\Downloads',
  'C:\\Users\\carlo\\Desktop\\ZUMAYA',
].filter(Boolean);
const outputDir = join(root, 'outputs', 'f268_real_memory_ingestion');
mkdirSync(outputDir, { recursive: true });

const python = process.env.PYTHON_EXE || 'C:\\Users\\carlo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const extractor = join(root, 'scripts', 'f75_extract_pdf_text.py');
const live = process.env.F268_SEED_LIVE === '1';
const databaseUrl = process.env.DATABASE_URL;

const expected = [
  { file: '2309 MA LAB PROD IMPSA...pdf', id: 'impsa-lab-prod-2309', title: '2309 MA LAB PROD IMPSA', modality: 'CY', equipmentFamily: 'Cyclotron production lab', kind: 'analytic-memory' },
  { file: 'Memoria Analítica Ciclotrón.pdf', id: 'cyclotron-analytic-memory', title: 'Memoria Analitica Ciclotron', modality: 'CY', equipmentFamily: 'Cyclotron', kind: 'analytic-memory' },
  { file: '2505 MA Gamma Knife HAHS Pedregal V2.pdf', id: 'hahs-gamma-knife-2505', title: '2505 MA Gamma Knife HAHS Pedregal V2', modality: 'GammaKnife', equipmentFamily: 'Gamma Knife', kind: 'analytic-memory' },
  { file: 'Memoria de Cálculo Ciclotrón.pdf', id: 'cyclotron-calculation-memory', title: 'Memoria de Calculo Ciclotron', modality: 'CY', equipmentFamily: 'Cyclotron', kind: 'calculation-memory' },
  { file: '2309 MA CICLOTRON KIUBE IMPSA.. (1).pdf', id: 'impsa-cyclotron-kiube-2309-copy', title: '2309 MA CICLOTRON KIUBE IMPSA copy', modality: 'CY', equipmentFamily: 'Cyclone KIUBE', kind: 'analytic-memory' },
  { file: 'Ejemplo Braqui con Co-60.pdf', id: 'braqui-co60-example-downloads', title: 'Ejemplo Braqui con Co-60', modality: 'Brachy', equipmentFamily: 'HDR Co-60', kind: 'example-memory' },
  { file: 'Ejemplo 5 Versa HD 15 MV.pdf', id: 'versa-hd-15mv-example-5', title: 'Ejemplo 5 Versa HD 15 MV', modality: 'TX', equipmentFamily: 'Versa HD 15 MV', kind: 'example-memory' },
  { file: 'Ejemplo 4 Versa HD 15 MV.pdf', id: 'versa-hd-15mv-example-4', title: 'Ejemplo 4 Versa HD 15 MV', modality: 'TX', equipmentFamily: 'Versa HD 15 MV', kind: 'example-memory' },
  { file: 'Ejemplo 3 -Versa HD 15 MV.pdf', id: 'versa-hd-15mv-example-3', title: 'Ejemplo 3 Versa HD 15 MV', modality: 'TX', equipmentFamily: 'Versa HD 15 MV', kind: 'example-memory' },
  { file: 'Ejemplo 2- Versa HD 15 MV-.pdf', id: 'versa-hd-15mv-example-2', title: 'Ejemplo 2 Versa HD 15 MV', modality: 'TX', equipmentFamily: 'Versa HD 15 MV', kind: 'example-memory' },
  { file: 'Ejemplo 1 Versa HD 15 MV.pdf', id: 'versa-hd-15mv-example-1', title: 'Ejemplo 1 Versa HD 15 MV', modality: 'TX', equipmentFamily: 'Versa HD 15 MV', kind: 'example-memory' },
  { file: '2505 MA Gamma Knife HAHS Pedregal V2 (1).pdf', id: 'hahs-gamma-knife-2505-copy', title: '2505 MA Gamma Knife HAHS Pedregal V2 copy', modality: 'GammaKnife', equipmentFamily: 'Gamma Knife', kind: 'analytic-memory' },
  { file: '2309 MA CICLOTRON KIUBE IMPSA...pdf', id: 'impsa-cyclotron-kiube-2309', title: '2309 MA CICLOTRON KIUBE IMPSA', modality: 'CY', equipmentFamily: 'Cyclone KIUBE', kind: 'analytic-memory' },
];

function normalizeName(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function findFile(fileName) {
  for (const sourceDir of sourceDirs) {
    const direct = join(sourceDir, fileName);
    if (existsSync(direct)) return direct;
  }
  const wanted = normalizeName(fileName);
  for (const sourceDir of sourceDirs) {
    if (!existsSync(sourceDir)) continue;
    const found = readdirSync(sourceDir)
      .map((name) => join(sourceDir, name))
      .find((filePath) => normalizeName(basename(filePath)) === wanted);
    if (found) return found;
  }
  return join(sourceDirs[0] || process.cwd(), fileName);
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function simpleEmbedding(text, dims = 128) {
  const stopWords = new Set(['para', 'con', 'sin', 'del', 'las', 'los', 'una', 'uno', 'por', 'que', 'the', 'and', 'with', 'from']);
  const vec = new Array(dims).fill(0);
  const words = String(text).toLowerCase()
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
    for (let i = 0; i < word.length; i += 1) hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    vec[Math.abs(hash) % dims] += (count / maxFreq) * 0.5 + 0.1;
  }
  const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? vec.map((value) => value / norm) : vec;
}

function chunkText(text, doc, chunkSize = 1800, overlap = 240) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  const chunks = [];
  for (let start = 0; start < normalized.length; start += (chunkSize - overlap)) {
    const content = normalized.slice(start, start + chunkSize).trim();
    if (content.length < 180) continue;
    chunks.push({
      source: `f268-real-memory-${doc.id}`,
      section: `${doc.title} chunk ${chunks.length + 1}`,
      modality: doc.modality,
      content,
      pageRef: content.match(/\[page\s+(\d+)\]/i)?.[1] ? `p.${content.match(/\[page\s+(\d+)\]/i)[1]}` : null,
      tags: JSON.stringify(['F268', doc.modality, doc.equipmentFamily, doc.kind, doc.id]),
    });
  }
  return chunks;
}

function extractText(filePath) {
  const result = spawnSync(python, [extractor, filePath], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return { ok: false, pages: 0, extractedPages: 0, text: '', error: result.stderr || result.stdout || 'extractor-failed' };
  }
  return JSON.parse(result.stdout || '{}');
}

const seenHashes = new Map();
const documents = [];
const chunks = [];

for (const doc of expected) {
  const filePath = findFile(doc.file);
  const entry = {
    ...doc,
    path: filePath,
    exists: existsSync(filePath),
    sizeBytes: 0,
    sha256: null,
    duplicateOf: null,
    pages: 0,
    extractedPages: 0,
    chunks: 0,
    status: 'missing-source',
    reason: '',
  };

  if (!entry.exists) {
    entry.reason = 'source PDF not found in Downloads';
    documents.push(entry);
    continue;
  }

  entry.sizeBytes = statSync(filePath).size;
  entry.sha256 = sha256(filePath);
  if (seenHashes.has(entry.sha256)) {
    entry.status = 'duplicate-skipped';
    entry.duplicateOf = seenHashes.get(entry.sha256);
    entry.reason = `duplicate sha256 of ${entry.duplicateOf}`;
    documents.push(entry);
    continue;
  }
  seenHashes.set(entry.sha256, entry.id);

  const extracted = extractText(filePath);
  entry.pages = extracted.pages || 0;
  entry.extractedPages = extracted.extractedPages || 0;
  if (!extracted.ok) {
    entry.status = 'error';
    entry.reason = extracted.error || 'pdf extraction failed';
    documents.push(entry);
    continue;
  }
  const docChunks = chunkText(extracted.text, entry);
  entry.chunks = docChunks.length;
  entry.status = docChunks.length > 0 ? 'rag-ready' : 'needs-ocr';
  entry.reason = docChunks.length > 0 ? '' : 'no searchable text chunks; route to F268A OCR provider';
  chunks.push(...docChunks);
  documents.push(entry);
}

const dbChunks = chunks.map((chunk) => ({
  ...chunk,
  embedding: JSON.stringify(simpleEmbedding(chunk.content)),
  tags: JSON.stringify([
    ...JSON.parse(chunk.tags),
    `hash:${createHash('sha256').update(chunk.content).digest('hex').slice(0, 16)}`,
  ]),
}));

const sources = [...new Set(dbChunks.map((chunk) => chunk.source))].sort();
const seedReport = {
  phase: 'F268',
  mode: live ? 'live' : 'dry-run',
  databaseUrlConfigured: Boolean(databaseUrl),
  sourceCount: sources.length,
  chunkCount: dbChunks.length,
  inserted: 0,
  deletedSources: [],
  ok: true,
  reason: live ? '' : 'Dry-run only. Set F268_SEED_LIVE=1 with DATABASE_URL to insert into document_chunks.',
};

if (live) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required for F268 live seed.');
  const connection = await mysql.createConnection(databaseUrl);
  try {
    await connection.beginTransaction();
    if (sources.length > 0) {
      await connection.query(`DELETE FROM document_chunks WHERE source IN (${sources.map(() => '?').join(',')})`, sources);
      seedReport.deletedSources = sources;
    }
    if (dbChunks.length > 0) {
      await connection.query(
        'INSERT INTO document_chunks (source, section, modality, content, embedding, tags, page_ref) VALUES ?',
        [dbChunks.map((chunk) => [chunk.source, chunk.section, chunk.modality, chunk.content, chunk.embedding, chunk.tags, chunk.pageRef])],
      );
    }
    await connection.commit();
    seedReport.inserted = dbChunks.length;
    seedReport.reason = 'Live F268 real memory seed completed.';
  } catch (error) {
    await connection.rollback();
    seedReport.ok = false;
    seedReport.reason = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    await connection.end();
  }
}

const canonical = documents.filter((doc) => doc.status !== 'duplicate-skipped');
const manifest = {
  phase: 'F268',
  schema: 'radshield-mx.real-memory-ingestion.f268.v1',
  generatedAt: new Date().toISOString(),
  status: 'real-memory-ingestion-ready',
  documentCount: documents.length,
  canonicalCount: canonical.length,
  duplicateCount: documents.length - canonical.length,
  ragReadyCount: canonical.filter((doc) => doc.status === 'rag-ready').length,
  needsOcrCount: canonical.filter((doc) => doc.status === 'needs-ocr').length,
  missingSourceCount: canonical.filter((doc) => doc.status === 'missing-source').length,
  chunkCount: dbChunks.length,
  modalities: [...new Set(canonical.map((doc) => doc.modality))].sort(),
  documents,
  duplicateGroups: Object.values(documents.reduce((acc, doc) => {
    if (!doc.sha256) return acc;
    acc[doc.sha256] ||= [];
    acc[doc.sha256].push({ id: doc.id, file: doc.file, status: doc.status });
    return acc;
  }, {})).filter((group) => group.length > 1),
  database: seedReport,
  sourceGovernance: [
    `Search roots: ${sourceDirs.join(' | ')}`,
    'Normative NCRP/IAEA/UAQ sources remain canonical for formulas.',
    'F268 memories are example/training/evidence sources, not automatic constants.',
    'Use page/chunk/hash references when Memoria IA cites a prior memory.',
    'Do not seed private clinical PDFs into a public/static host.',
  ],
  nextPhase: 'F268A API readiness gate',
};

writeFileSync(join(outputDir, 'f268_real_memory_ingestion.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(join(outputDir, 'f268_document_chunks_db_draft.json'), `${JSON.stringify({ phase: 'F268', targetTable: 'document_chunks', mode: seedReport.mode, chunks: dbChunks }, null, 2)}\n`, 'utf8');
writeFileSync(join(outputDir, 'f268_document_chunks.jsonl'), `${dbChunks.map((chunk) => JSON.stringify(chunk)).join('\n')}\n`, 'utf8');
writeFileSync(join(outputDir, 'f268_seed_report.json'), `${JSON.stringify(seedReport, null, 2)}\n`, 'utf8');
writeFileSync(
  join(root, 'outputs', 'fase_268_real_memory_ingestion.md'),
  [
    '# F268 Real Analytic Memory Ingestion',
    '',
    `Status: ${manifest.status}`,
    `Generated: ${manifest.generatedAt}`,
    `Documents supplied: ${manifest.documentCount}`,
    `Canonical documents: ${manifest.canonicalCount}`,
    `Duplicates skipped: ${manifest.duplicateCount}`,
    `RAG-ready: ${manifest.ragReadyCount}`,
    `Needs OCR: ${manifest.needsOcrCount}`,
    `Chunks: ${manifest.chunkCount}`,
    `DB mode: ${seedReport.mode}`,
    '',
    '## Documents',
    ...documents.map((doc) => `- ${doc.status} ${doc.id}: ${doc.file}; pages=${doc.pages}; chunks=${doc.chunks}; duplicateOf=${doc.duplicateOf || 'none'}`),
    '',
    '## Governance',
    ...manifest.sourceGovernance.map((item) => `- ${item}`),
    '',
    `Next: ${manifest.nextPhase}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  canonicalCount: manifest.canonicalCount,
  duplicateCount: manifest.duplicateCount,
  ragReadyCount: manifest.ragReadyCount,
  chunkCount: manifest.chunkCount,
  dbMode: seedReport.mode,
}, null, 2));
