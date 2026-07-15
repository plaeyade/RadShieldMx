import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f138_material_rag');
mkdirSync(outputDir, { recursive: true });

const python = process.env.PYTHON_EXE || 'C:\\Users\\carlo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const live = process.env.F138_SEED_LIVE === '1';
const databaseUrl = process.env.DATABASE_URL;

const docs = [
  ['contuplex-td-550', 'Tabique TD-550 CONTUPLEX', 'vendor-datasheet', 'C:\\Users\\carlo\\Downloads\\Tabique TD-550 CONTUPLEX.pdf'],
  ['contuplex-td-350', 'Tabique TD-350 CONTUPLEX', 'vendor-datasheet', 'C:\\Users\\carlo\\Downloads\\Tabique TD-350 CONTUPLEX.pdf'],
  ['contuplex-td-400', 'Tabique TD-400 CONTUPLEX', 'vendor-datasheet', 'C:\\Users\\carlo\\Downloads\\Tabique TD-400 CONTUPLEX.pdf'],
  ['contuplex-td-500', 'Tabique TD-500 CONTUPLEX', 'vendor-datasheet', 'C:\\Users\\carlo\\Downloads\\Tabique TD-500 CONTUPLEX.pdf'],
  ['bloques-hd-characterization', 'Caracterizacion de bloques HD', 'characterization-report', 'C:\\Users\\carlo\\Downloads\\CARACTERIZACION DE BLOQUES HD.pdf'],
  ['tmnipol-tvl-2021', 'TMNIPOL reporte determinacion TVL 2021', 'tvl-report', 'C:\\Users\\carlo\\Downloads\\TMNIPOL REPORTE DETERMINACION TVL 23dic RAD FISICA (1).pdf'],
  ['scanpro-hd-materials', 'ScanPRO high-density material scan', 'characterization-report', 'C:\\Users\\carlo\\Downloads\\ScanPRO-2024-08-26-16-38-02.pdf'],
  ['tmnipol-td-375-tvl-2020', 'Reporte final TVL bloques alta densidad TD-375', 'tvl-report', 'C:\\Users\\carlo\\Downloads\\REPORTE FINAL DETERMINACION TVL BLOQUES ALTA DENSIDAD TV-375 (1).pdf'],
];

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function normalizeWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function chunkText(text, doc, pageRef) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];
  const chunks = [];
  const max = 1100;
  for (let start = 0; start < normalized.length; start += max) {
    const content = normalized.slice(start, start + max).trim();
    if (content.length < 160) continue;
    chunks.push({
      docId: doc.id,
      source: `f138-${doc.id}`,
      section: `${doc.title} chunk ${chunks.length + 1}`,
      modality: 'Materials',
      content,
      tags: JSON.stringify([...new Set(['F138', 'materiales', 'alta-densidad', doc.role, doc.id])]),
      pageRef,
    });
  }
  return chunks;
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

function extractNumbers(text) {
  const normalized = normalizeWhitespace(text);
  const matches = {
    densities: [...normalized.matchAll(/(?:densidad|=)\s*(?:nominal)?\s*[:=]?\s*([0-9]+(?:[.,][0-9]+)?)\s*g\/cm/gi)].map((m) => m[1]),
    tvl18: [...normalized.matchAll(/TVL\s*18\s*MV[^0-9]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*cm/gi)].map((m) => m[1]),
    weights: [...normalized.matchAll(/peso\s+por\s+pieza[^0-9]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*kg/gi)].map((m) => m[1]),
    compression: [...normalized.matchAll(/(?:compresion|compresi.n)[^0-9]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*(MPa|kgf\/cm)/gi)].map((m) => `${m[1]} ${m[2]}`),
    models: [...new Set([...normalized.matchAll(/\bTD[-\s]?(350|375|400|500|550)\b/gi)].map((m) => `TD-${m[1]}`))],
  };
  return matches;
}

const pythonCode = String.raw`
import json, sys
from pathlib import Path
from pypdf import PdfReader

docs = json.loads(sys.argv[1])
out = []
for item in docs:
    doc_id, title, role, file_path = item
    p = Path(file_path)
    entry = {"id": doc_id, "title": title, "role": role, "path": str(p), "exists": p.exists(), "pages": 0, "pageTexts": [], "error": None}
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
  maxBuffer: 20 * 1024 * 1024,
});

if (extraction.status !== 0) {
  throw new Error(`PDF extraction failed: ${extraction.stderr || extraction.stdout}`);
}

const extracted = JSON.parse(extraction.stdout);
const chunks = [];
const manifest = extracted.map((doc) => {
  const source = docs.find(([id]) => id === doc.id);
  const role = source?.[2] ?? doc.role;
  const allText = doc.pageTexts.map((page) => page.text || '').join('\n');
  const textLength = normalizeWhitespace(allText).length;
  const status = !doc.exists ? 'missing-source' : textLength < 400 ? 'needs-ocr' : 'rag-ready';
  const hash = doc.exists ? sha256(doc.path) : null;
  const pageChunks = doc.pageTexts.flatMap((page) => chunkText(page.text, { ...doc, role }, `p.${page.page}`));
  chunks.push(...pageChunks);
  return {
    id: doc.id,
    title: doc.title,
    role,
    path: doc.path,
    sha256: hash,
    pages: doc.pages,
    textLength,
    status,
    chunkCount: pageChunks.length,
    extractedFields: extractNumbers(allText),
    tags: ['F138', 'materiales', 'TMNIPOLL', 'CONTUPLEX', 'alta-densidad', role],
    note: status === 'needs-ocr'
      ? 'Scanned or low-text PDF. Needs OCR before reliable RAG/DB seed.'
      : 'Prepared for RAG and material evidence citation. Verify vendor values before calculation release.',
  };
});

const dbChunks = chunks.map((chunk) => ({
  ...chunk,
  embedding: JSON.stringify(simpleEmbedding(chunk.content)),
  tags: JSON.stringify([...new Set([...JSON.parse(chunk.tags), `hash:${createHash('sha256').update(chunk.content).digest('hex').slice(0, 16)}`])]),
}));

const dbDraft = {
  phase: 'F138',
  targetTable: 'document_chunks',
  liveSeedFlag: 'F138_SEED_LIVE=1',
  mode: live ? 'live' : 'dry-run',
  sourcePolicy: 'delete-and-replace only f138-* sources listed in this draft',
  chunks: dbChunks,
};

let seedReport = {
  phase: 'F138',
  mode: live ? 'live' : 'dry-run',
  databaseUrlConfigured: Boolean(databaseUrl),
  ok: true,
  inserted: 0,
  deletedSources: [],
  reason: live ? '' : 'Dry-run only. Set F138_SEED_LIVE=1 to insert into document_chunks.',
};

if (live) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required for F138 live seed.');
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
    seedReport.reason = 'Live F138 material document seed completed.';
  } catch (error) {
    await connection.rollback();
    seedReport.ok = false;
    seedReport.reason = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    await connection.end();
  }
}

const robotStructuralAnalysis = {
  source: 'https://www.autodesk.com/products/robot-structural-analysis/overview',
  verifiedAt: new Date().toISOString(),
  capabilitiesReviewed: [
    'finite element mesh workflows',
    'modal and nonlinear analysis',
    'wind and sequential self-weight workflows',
    'BIM/Revit data exchange',
    'open API for structures and results',
  ],
  radshieldAdditionsBeyondCypecad: [
    'FEM readiness gate for heavy shielding walls and slabs',
    'construction sequence/pallet staging risk for modular high-density blocks',
    'external structural result bridge for utilization, deflection, reactions and reviewer stamp',
    'Revit/IFC roundtrip metadata for shielding wall IDs and structural review state',
  ],
};

const missingCount = manifest.filter((doc) => doc.status === 'missing-source').length;
const needsOcrCount = manifest.filter((doc) => doc.status === 'needs-ocr').length;

const output = {
  phase: 'F138',
  status: missingCount > 0 ? 'blocked' : needsOcrCount > 0 ? 'ready-with-ocr-blockers' : 'ready',
  generatedAt: new Date().toISOString(),
  materialDocumentCount: manifest.length,
  ragReadyCount: manifest.filter((doc) => doc.status === 'rag-ready').length,
  needsOcrCount,
  chunkCount: dbChunks.length,
  database: seedReport,
  manifest,
  robotStructuralAnalysis,
  evidence: [
    'outputs/f138_material_rag/f138_material_rag_manifest.json',
    'outputs/f138_material_rag/f138_material_chunks_db_draft.json',
    'outputs/f138_material_rag/f138_material_chunks.jsonl',
    'outputs/f138_material_rag/f138_seed_report.json',
    'outputs/fase_138_material_rag_robot.md',
  ],
  nextPhase: 'F139 live material seed validation or F140 documentation suite',
  decision: needsOcrCount > 0
    ? 'Index the readable TM NIPOLL/CONTUPLEX PDFs as vendor/lab evidence for RAG and Memoria IA, keep scanned/low-text documents under OCR blocker, and use Robot-inspired FEM/loadcase gaps for the next structural canvas improvements.'
    : 'Index all TM NIPOLL/CONTUPLEX material PDFs as vendor/lab evidence for RAG and Memoria IA, keep extracted values under reviewed-citation policy, and use Robot-inspired FEM/loadcase gaps for the next structural canvas improvements.',
};

writeFileSync(path.join(outputDir, 'f138_material_rag_manifest.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(path.join(outputDir, 'f138_material_chunks_db_draft.json'), `${JSON.stringify(dbDraft, null, 2)}\n`, 'utf8');
writeFileSync(path.join(outputDir, 'f138_seed_report.json'), `${JSON.stringify(seedReport, null, 2)}\n`, 'utf8');
writeFileSync(path.join(outputDir, 'f138_material_chunks.jsonl'), `${dbChunks.map((chunk) => JSON.stringify(chunk)).join('\n')}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_138_material_rag_robot.md'),
  [
    '# F138 Material RAG + Autodesk Robot Review',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    `Documents: ${output.materialDocumentCount}`,
    `RAG-ready: ${output.ragReadyCount}`,
    `Needs OCR: ${output.needsOcrCount}`,
    `Chunks: ${output.chunkCount}`,
    `DB mode: ${seedReport.mode}`,
    '',
    '## Material Documents',
    ...manifest.map((doc) => `- ${doc.status} ${doc.id}: ${doc.title}, pages ${doc.pages}, chunks ${doc.chunkCount}`),
    '',
    '## Robot Structural Analysis Additions',
    ...robotStructuralAnalysis.radshieldAdditionsBeyondCypecad.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F138 material RAG ${output.status}: ${dbChunks.length} chunks, ${seedReport.mode}`);
