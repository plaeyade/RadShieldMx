import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f172a_arxiv_research');
const jsonPath = path.join(outDir, 'f172a_arxiv_research.json');
const mdPath = path.join(root, 'outputs', 'fase_172a_arxiv_research.md');
const python = process.env.PYTHON_EXE || 'C:\\Users\\carlo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const extractor = path.join(root, 'scripts', 'f170b_extract_pdf_text.py');
mkdirSync(outDir, { recursive: true });

const documents = [
  {
    id: 'arxiv-2601-10336v2',
    source: 'f172a-arxiv-2601-10336v2',
    title: 'Radiation Shielding Performance of Different Concrete Materials: A Systematic Review',
    path: 'C:\\Users\\carlo\\Downloads\\2601.10336v2.pdf',
    modality: 'Materials',
    tags: ['F172A', 'arXiv', 'research-review', 'concrete', 'HVL', 'TVL', 'heavyweight concrete', 'materials', 'structural-load'],
  },
  {
    id: 'arxiv-2407-12991v2',
    source: 'f172a-arxiv-2407-12991v2',
    title: 'Concrete and Lead Shielding Requirements for PET Facilities',
    path: 'C:\\Users\\carlo\\Downloads\\2407.12991v2.pdf',
    modality: 'Nuclear Medicine',
    tags: ['F172A', 'arXiv', 'PET', '511 keV', 'lead', 'concrete', 'buildup', 'Monte Carlo', 'TG-108-QA'],
  },
];

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

function chunkText(text, size = 1700, overlap = 200) {
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

function extractFields(text) {
  const normalized = normalizeWhitespace(text);
  return {
    tvlHvlMentions: (normalized.match(/\b(?:TVL|HVL|half-value|tenth-value)\b/gi) || []).length,
    densityMentions: (normalized.match(/\b(?:density|densidad|g\/cm|kg\/m)\b/gi) || []).length,
    buildupMentions: (normalized.match(/\b(?:buildup|build-up|Monte Carlo|wide-beam|narrow-beam)\b/gi) || []).length,
    leadConcreteMentions: (normalized.match(/\b(?:lead|plomo|concrete|concreto)\b/gi) || []).length,
  };
}

function extractDocument(doc) {
  const result = spawnSync(python, [extractor, doc.path], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    maxBuffer: 120 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`PDF extraction failed for ${doc.source}: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const manifests = [];
const chunks = [];

for (const doc of documents) {
  const extracted = extractDocument(doc);
  const hash = extracted.exists ? sha256(doc.path) : null;
  const fullText = (extracted.pages || []).map((page) => page.text || '').join('\n');
  const pageManifests = [];

  for (const page of extracted.pages || []) {
    const pageChunks = chunkText(page.text);
    pageManifests.push({ page: page.page, textLength: normalizeWhitespace(page.text).length, chunkCount: pageChunks.length });
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
    exists: existsSync(doc.path),
    sha256: hash,
    pages: pageManifests.length,
    textLength,
    chunkCount,
    zeroTextPages: pageManifests.filter((item) => item.textLength === 0).map((item) => item.page),
    extractedFields: extractFields(fullText),
    status: !extracted.exists ? 'missing-source' : textLength < 1000 || chunkCount === 0 ? 'needs-ocr-or-review' : 'indexed-research',
    calculationPolicy: 'research-methodology-only; do not override canonical NCRP/IAEA/AAPM/UAQ constants without controlled review',
  });
}

const database = { configured: Boolean(process.env.DATABASE_URL), ok: false, inserted: 0, deletedSources: documents.map((doc) => doc.source), reason: '' };

if (!process.env.DATABASE_URL) {
  database.reason = 'DATABASE_URL is not configured';
} else {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.beginTransaction();
    await connection.query(`DELETE FROM document_chunks WHERE source IN (${documents.map(() => '?').join(',')})`, documents.map((doc) => doc.source));
    if (chunks.length > 0) {
      await connection.query(
        'INSERT INTO document_chunks (source, section, modality, content, embedding, tags, page_ref) VALUES ?',
        [chunks.map((chunk) => [chunk.source, chunk.section, chunk.modality, chunk.content, chunk.embedding, chunk.tags, chunk.pageRef])],
      );
    }
    await connection.commit();
    database.ok = true;
    database.inserted = chunks.length;
    database.reason = 'F172A arXiv research sources indexed into document_chunks.';
  } catch (error) {
    await connection.rollback();
    database.reason = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    await connection.end();
  }
}

const ready = database.ok && manifests.every((doc) => doc.status === 'indexed-research') && chunks.length > 0;
const output = {
  phase: 'F172A',
  title: 'arXiv research indexing and methodology integration',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.arxiv-research.f172a.v1',
  status: ready ? 'arxiv-research-integrated' : 'arxiv-research-gated',
  documentCount: manifests.length,
  chunkCount: chunks.length,
  documents: manifests,
  database,
  methodologyIntegration: {
    materialToolbox: 'Use concrete review as research support for density, aggregate, constructability, weight/cost and material-evidence warnings.',
    petShielding: 'Use PET paper as QA support for 511 keV buildup, lead-versus-concrete constructability and Monte Carlo validation cautions.',
    calculationEngine: 'No automatic overwrite of canonical constants; promote only through controlled source governance.',
  },
  nextBeforeDeploy: [
    'F172 release candidate final: rebuild package and freeze release evidence.',
    'Repeat F154-F158 against final URL when deploy target is reachable.',
    'Optional post-release: project-specific MC validation for PET wide-beam buildup via external GATE/EGSnrc gateway.',
  ],
};

writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, [
  '# F172A - arXiv Research Indexing and Methodology Integration',
  '',
  `Generado: ${output.generatedAt}`,
  `Estado: **${output.status}**`,
  `Chunks insertados: **${output.database.inserted}**`,
  '',
  '## Documentos',
  '',
  ...output.documents.map((doc) => `- ${doc.source}: ${doc.status}; paginas=${doc.pages}; chunks=${doc.chunkCount}; hash=${doc.sha256}`),
  '',
  '## Integracion metodologica',
  '',
  `- Materiales: ${output.methodologyIntegration.materialToolbox}`,
  `- PET: ${output.methodologyIntegration.petShielding}`,
  `- Motor: ${output.methodologyIntegration.calculationEngine}`,
  '',
  '## Antes de deploy',
  '',
  ...output.nextBeforeDeploy.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F172A arXiv research ${output.status}; chunks=${output.chunkCount}`);
if (!ready) process.exit(1);
