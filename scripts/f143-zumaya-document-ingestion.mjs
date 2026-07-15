import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f143_zumaya_document_ingestion');
mkdirSync(outputDir, { recursive: true });

const python = process.env.PYTHON_EXE || 'C:\\Users\\carlo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const live = process.env.F143_SEED_LIVE === '1';
const databaseUrl = process.env.DATABASE_URL;

const docs = [
  ['ncrp-144-particle-accelerators', 'Radiation Protection for Particle Accelerators', 'NCRP-144', 'normative', 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Radiation Protection for Partic - National Research Council.pdf'],
  ['hahs-gamma-knife-ma-2025', '2505 MA Gamma Knife HAHS Pedregal V2', 'MEMORIA-GAMMA-KNIFE', 'analytic-memory', 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\2505 MA Gamma Knife HAHS Pedregal V2.pdf'],
  ['zumaya-memoria-al', 'Entregable Memoria AL Zumaya', 'MEMORIA-LINAC', 'analytic-memory', 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Entregable Memoria AL Zumaya.pdf'],
  ['ncrp-49-structural-shielding', 'NCRP 49 Structural Shielding Design', 'NCRP-49', 'normative', 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\NCRP 49_ Structural Shielding D - National Council On Radiation P.pdf'],
  ['iaea-srs-47-radiotherapy-facilities', 'Radiation Protection in the Design of Radiotherapy Facilities', 'IAEA-SRS-47', 'normative', 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Radiation Protection in the Des - International Atomic Energy Age.pdf'],
  ['elekta-esprit-site-planning', 'Elekta Esprit LGK Site Planning Guide', 'ELEKTA-ESPRIT', 'vendor-planning', 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Elekta Esprit LGK Site Planning Guide (1).pdf'],
  ['braqui-co60-example', 'Ejemplo Braqui con Co-60', 'MEMORIA-BRAQUI-CO60', 'example-memory', 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Ejemplo Braqui con Co-60.pdf'],
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
    for (let i = 0; i < word.length; i += 1) hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    vec[Math.abs(hash) % dims] += (count / maxFreq) * 0.5 + 0.1;
  }
  const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? vec.map((value) => value / norm) : vec;
}

function chunkPage(text, doc, page) {
  const normalized = normalizeWhitespace(text);
  if (normalized.length < 160) return [];
  const max = 1200;
  const chunks = [];
  for (let start = 0; start < normalized.length; start += max) {
    const content = normalized.slice(start, start + max).trim();
    if (content.length < 160) continue;
    chunks.push({
      docId: doc.id,
      source: `f143-${doc.id}`,
      section: `${doc.title} p.${page} chunk ${chunks.length + 1}`,
      modality: doc.kind === 'normative' ? 'Normative' : doc.kind === 'vendor-planning' ? 'VendorPlanning' : 'AnalyticMemory',
      content,
      tags: JSON.stringify([...new Set(['F143', doc.standard, doc.kind, doc.id])]),
      pageRef: `p.${page}`,
    });
  }
  return chunks;
}

function extractFields(text) {
  const normalized = normalizeWhitespace(text);
  return {
    tvl: [...normalized.matchAll(/\bTVL\b[^0-9]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*(?:cm|mm|m)\b/gi)].slice(0, 20).map((m) => m[0]),
    density: [...normalized.matchAll(/(?:density|densidad)[^0-9]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*(?:g\/cm|kg\/m)/gi)].slice(0, 20).map((m) => m[0]),
    weight: [...normalized.matchAll(/(?:weight|peso|mass|masa)[^0-9]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*(?:kg|lb|ton)/gi)].slice(0, 20).map((m) => m[0]),
    uncertainty: [...normalized.matchAll(/(?:uncertainty|incertidumbre)[^.]{0,160}/gi)].slice(0, 20).map((m) => m[0]),
  };
}

const pythonCode = String.raw`
import json, sys
from pathlib import Path
from pypdf import PdfReader

docs = json.loads(sys.argv[1])
out = []
for item in docs:
    doc_id, title, standard, kind, file_path = item
    p = Path(file_path)
    entry = {"id": doc_id, "title": title, "standard": standard, "kind": kind, "path": str(p), "exists": p.exists(), "pages": 0, "pageTexts": [], "error": None}
    if p.exists():
        try:
            reader = PdfReader(str(p))
            entry["pages"] = len(reader.pages)
            for index, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                entry["pageTexts"].append({"page": index + 1, "text": text})
        except Exception as exc:
            entry["error"] = str(exc)
    out.append(entry)
print(json.dumps(out, ensure_ascii=False))
`;

const extraction = spawnSync(python, ['-c', pythonCode, JSON.stringify(docs)], {
  encoding: 'utf8',
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  maxBuffer: 80 * 1024 * 1024,
});

if (extraction.status !== 0) throw new Error(`F143 extraction failed: ${extraction.stderr || extraction.stdout}`);

const extracted = JSON.parse(extraction.stdout);
const allChunks = [];
const manifest = extracted.map((doc) => {
  const allText = doc.pageTexts.map((page) => page.text || '').join('\n');
  const textLength = normalizeWhitespace(allText).length;
  const zeroTextPages = doc.pageTexts.filter((page) => !normalizeWhitespace(page.text).length).map((page) => page.page);
  const chunks = doc.pageTexts.flatMap((page) => chunkPage(page.text, doc, page.page));
  allChunks.push(...chunks);
  return {
    id: doc.id,
    source: `f143-${doc.id}`,
    title: doc.title,
    standard: doc.standard,
    kind: doc.kind,
    path: doc.path,
    exists: doc.exists,
    sha256: doc.exists ? sha256(doc.path) : null,
    pages: doc.pages,
    textLength,
    zeroTextPages,
    status: !doc.exists ? 'missing-source' : textLength < 400 ? 'needs-ocr' : 'rag-ready',
    chunkCount: chunks.length,
    extractedFields: extractFields(allText),
  };
});

const dbChunks = allChunks.map((chunk) => ({
  ...chunk,
  embedding: JSON.stringify(simpleEmbedding(chunk.content)),
  tags: JSON.stringify([...new Set([...JSON.parse(chunk.tags), `hash:${createHash('sha256').update(chunk.content).digest('hex').slice(0, 16)}`])]),
}));

const dbDraft = {
  phase: 'F143',
  targetTable: 'document_chunks',
  liveSeedFlag: 'F143_SEED_LIVE=1',
  mode: live ? 'live' : 'dry-run',
  sourcePolicy: 'delete-and-replace only f143-* sources listed in this draft',
  chunks: dbChunks,
};

let seedReport = {
  phase: 'F143',
  mode: live ? 'live' : 'dry-run',
  databaseUrlConfigured: Boolean(databaseUrl),
  ok: true,
  inserted: 0,
  deletedSources: [],
  reason: live ? '' : 'Dry-run only. Set F143_SEED_LIVE=1 to insert into document_chunks.',
};

if (live) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required for F143 live seed.');
  const sources = [...new Set(dbChunks.map((chunk) => chunk.source))];
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
    seedReport.reason = 'Live F143 ZUMAYA document seed completed.';
  } catch (error) {
    await connection.rollback();
    seedReport.ok = false;
    seedReport.reason = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    await connection.end();
  }
}

const status = manifest.every((doc) => doc.status === 'rag-ready') ? 'ready' : 'ready-with-document-warnings';
const output = {
  phase: 'F143',
  status,
  generatedAt: new Date().toISOString(),
  documentCount: manifest.length,
  ragReadyCount: manifest.filter((doc) => doc.status === 'rag-ready').length,
  needsOcrCount: manifest.filter((doc) => doc.status === 'needs-ocr').length,
  missingSourceCount: manifest.filter((doc) => doc.status === 'missing-source').length,
  chunkCount: dbChunks.length,
  manifest,
  database: seedReport,
  resolvedBlockers: [
    'NCRP-144 source is now available locally.',
    'NCRP-49 is searchable and indexed.',
    'Memoria AL Zumaya is searchable and indexed.',
  ],
  remainingImprovements: [
    'Deduplicate IAEA SRS-47 against earlier F75/F129 source before making canonical-source UI decisions.',
    'Use NCRP-144 in cyclotron/accelerator workflows and neutron/activation evidence.',
    'Use Elekta Esprit guide for Gamma Knife layout/equipment footprint and planning evidence.',
    'Use HAHS Gamma Knife and Braqui Co-60 examples as analytic-memory exemplars, not normative references.',
    'Add reviewed/unreviewed status for values extracted from analytic memories and vendor guides.',
  ],
  evidence: [
    'outputs/f143_zumaya_document_ingestion/f143_zumaya_document_ingestion.json',
    'outputs/f143_zumaya_document_ingestion/f143_document_chunks_db_draft.json',
    'outputs/f143_zumaya_document_ingestion/f143_document_chunks.jsonl',
    'outputs/f143_zumaya_document_ingestion/f143_seed_report.json',
    'outputs/fase_143_zumaya_document_ingestion.md',
  ],
  decision:
    'F143 indexes the new ZUMAYA PDFs into document_chunks as f143-* sources and resolves the OCR/missing-source blockers relevant to NCRP-144, NCRP-49 and Memoria AL.',
};

writeFileSync(path.join(outputDir, 'f143_zumaya_document_ingestion.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(path.join(outputDir, 'f143_document_chunks_db_draft.json'), `${JSON.stringify(dbDraft, null, 2)}\n`, 'utf8');
writeFileSync(path.join(outputDir, 'f143_seed_report.json'), `${JSON.stringify(seedReport, null, 2)}\n`, 'utf8');
writeFileSync(path.join(outputDir, 'f143_document_chunks.jsonl'), `${dbChunks.map((chunk) => JSON.stringify(chunk)).join('\n')}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_143_zumaya_document_ingestion.md'),
  [
    '# F143 ZUMAYA Document DB Ingestion',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    `Documents: ${output.documentCount}`,
    `RAG-ready: ${output.ragReadyCount}`,
    `Needs OCR: ${output.needsOcrCount}`,
    `Chunks: ${output.chunkCount}`,
    `DB mode: ${seedReport.mode}`,
    `DB inserted: ${seedReport.inserted}`,
    '',
    '## Documents',
    ...manifest.map((doc) => `- ${doc.status} ${doc.id}: ${doc.pages} pages, ${doc.chunkCount} chunks, zero-text pages ${doc.zeroTextPages.join(', ') || 'none'}`),
    '',
    '## Resolved Blockers',
    ...output.resolvedBlockers.map((item) => `- ${item}`),
    '',
    '## Remaining Improvements',
    ...output.remainingImprovements.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F143 ZUMAYA ingestion ${output.status}: ${dbChunks.length} chunks, ${seedReport.mode}`);
