import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f170b_canonical_reindex');
const jsonPath = path.join(outDir, 'f170b_canonical_reindex.json');
const mdPath = path.join(root, 'outputs', 'fase_170b_canonical_reindex.md');
const python = process.env.PYTHON_EXE || 'C:\\Users\\carlo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const extractor = path.join(root, 'scripts', 'f170b_extract_pdf_text.py');

mkdirSync(outDir, { recursive: true });

const canonicalDocuments = [
  {
    id: 'ncrp147',
    source: 'f170b-ncrp147',
    title: 'NCRP 147 - Structural Shielding Design for Medical X-Ray Imaging Facilities',
    modality: 'Diagnostic',
    path: 'C:\\Users\\carlo\\Downloads\\Nuclear.AI\\LIBROS\\Structural Shielding Design for - National Research Council.pdf',
    tags: ['F170B', 'NCRP 147', 'NCRP147', 'Diagnostic', 'shielding', 'canonical'],
  },
  {
    id: 'tg108',
    source: 'f170b-aapm-tg108',
    title: 'AAPM TG-108 - PET and PET/CT Shielding Requirements',
    modality: 'Nuclear Medicine',
    path: 'C:\\Users\\carlo\\Downloads\\aapm tg 1108.pdf',
    tags: ['F170B', 'AAPM', 'TG-108', 'TG108', 'PET', 'F-18', 'shielding', 'canonical'],
  },
];

const detectedButNotIndexed = [
  'C:\\Users\\carlo\\Downloads\\2601.10336v2.pdf',
  'C:\\Users\\carlo\\Downloads\\2407.12991v2.pdf',
].map((file) => ({
  path: file,
  exists: existsSync(file),
  reason: 'Detected in user upload, held for later technical review; not part of F170 canonical NCRP147/TG108 reindex.',
}));

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function normalizeWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function simpleEmbedding(text, dims = 128) {
  const stopWords = new Set(['para', 'con', 'sin', 'del', 'las', 'los', 'una', 'uno', 'por', 'que', 'the', 'and', 'with', 'from']);
  const vec = new Array(dims).fill(0);
  const words = normalizeWhitespace(text).toLowerCase()
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

function chunkText(text, size = 1800, overlap = 220) {
  const normalized = normalizeWhitespace(text);
  if (normalized.length < 160) return [];
  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    const content = normalized.slice(start, start + size).trim();
    if (content.length >= 160) chunks.push(content);
    if (start + size >= normalized.length) break;
    start += size - overlap;
  }
  return chunks;
}

function extractDocument(doc) {
  const result = spawnSync(python, [extractor, doc.path], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    maxBuffer: 150 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`PDF extraction failed for ${doc.source}: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

const manifests = [];
const chunks = [];

for (const doc of canonicalDocuments) {
  const extracted = extractDocument(doc);
  const hash = extracted.exists ? sha256(doc.path) : null;
  const pageManifests = [];

  for (const page of extracted.pages || []) {
    const pageChunks = chunkText(page.text);
    pageManifests.push({
      page: page.page,
      textLength: normalizeWhitespace(page.text).length,
      chunkCount: pageChunks.length,
    });
    pageChunks.forEach((content, index) => {
      const tags = [...new Set([...doc.tags, `hash:${hash}`, `page:${page.page}`])];
      chunks.push({
        source: doc.source,
        section: `${doc.title} p.${page.page} chunk ${index + 1}`,
        modality: doc.modality,
        content,
        embedding: JSON.stringify(simpleEmbedding(content)),
        tags: JSON.stringify(tags),
        pageRef: `p.${page.page}`,
      });
    });
  }

  const textLength = pageManifests.reduce((sum, item) => sum + item.textLength, 0);
  const chunkCount = pageManifests.reduce((sum, item) => sum + item.chunkCount, 0);
  manifests.push({
    id: doc.id,
    source: doc.source,
    title: doc.title,
    path: doc.path,
    exists: extracted.exists,
    sha256: hash,
    pages: pageManifests.length,
    textLength,
    chunkCount,
    zeroTextPages: pageManifests.filter((item) => item.textLength === 0).map((item) => item.page),
    status: !extracted.exists ? 'missing-source' : textLength < 1000 || chunkCount === 0 ? 'needs-ocr-or-review' : 'indexed',
    extractionError: extracted.error,
  });
}

const database = {
  configured: Boolean(process.env.DATABASE_URL),
  inserted: 0,
  deletedSources: canonicalDocuments.map((doc) => doc.source),
  ok: false,
  reason: '',
};

if (!process.env.DATABASE_URL) {
  database.reason = 'DATABASE_URL is not configured';
} else {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.beginTransaction();
    await connection.query(
      `DELETE FROM document_chunks WHERE source IN (${canonicalDocuments.map(() => '?').join(',')})`,
      canonicalDocuments.map((doc) => doc.source),
    );
    if (chunks.length > 0) {
      await connection.query(
        'INSERT INTO document_chunks (source, section, modality, content, embedding, tags, page_ref) VALUES ?',
        [chunks.map((chunk) => [chunk.source, chunk.section, chunk.modality, chunk.content, chunk.embedding, chunk.tags, chunk.pageRef])],
      );
    }
    await connection.commit();
    database.inserted = chunks.length;
    database.ok = true;
    database.reason = 'Canonical NCRP147/TG108 reindex completed.';
  } catch (error) {
    await connection.rollback();
    database.reason = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    await connection.end();
  }
}

const ready = database.ok && manifests.every((doc) => doc.status === 'indexed') && chunks.length > 0;
const output = {
  phase: 'F170B',
  title: 'Canonical NCRP147/TG108 PDF reindex',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.canonical-reindex.f170b.v1',
  status: ready ? 'canonical-reindex-ready' : 'canonical-reindex-gated',
  documentCount: manifests.length,
  chunkCount: chunks.length,
  documents: manifests,
  database,
  detectedButNotIndexed,
  followUp: [
    'Repeat F170 RAG citation governance and verify NCRP147/TG108 coverage is present.',
    'Keep arXiv documents out of canonical normative coverage until reviewed and assigned a source policy.',
    'Use hash-tagged chunks for citation picker and Memoria IA traceability.',
  ],
};

writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, [
  '# F170B - Canonical NCRP147/TG108 PDF Reindex',
  '',
  `Generado: ${output.generatedAt}`,
  '',
  `Estado: **${output.status}**`,
  `Chunks insertados: **${output.database.inserted}**`,
  '',
  '## Documentos',
  '',
  ...output.documents.map((doc) => `- ${doc.source}: ${doc.status}; paginas=${doc.pages}; chunks=${doc.chunkCount}; hash=${doc.sha256}`),
  '',
  '## Detectados no indexados',
  '',
  ...output.detectedButNotIndexed.map((doc) => `- ${doc.path}: ${doc.exists ? 'existe' : 'no encontrado'}; ${doc.reason}`),
  '',
].join('\n'), 'utf8');

console.log(`F170B canonical reindex written: ${path.relative(root, jsonPath)}`);
console.log(`Status: ${output.status}; chunks=${output.chunkCount}`);

if (!ready) process.exit(1);
