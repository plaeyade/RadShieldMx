import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputDir = join(root, 'outputs', 'f75_pdf_ingestion');
mkdirSync(outputDir, { recursive: true });
const ocrSidecarDirs = [
  join(root, 'outputs', 'f76_ocr', 'extracted_text'),
  join(root, 'data', 'rag', 'ocr'),
];

const pythonCandidates = [
  process.env.PYTHON,
  'C:\\Users\\carlo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe',
  'python',
].filter(Boolean);

function firstWorkingPython() {
  for (const candidate of pythonCandidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) return candidate;
  }
  throw new Error('No Python runtime available for PDF extraction.');
}

const documents = [
  {
    id: 'ncrp-144-particle-accelerators',
    title: 'Radiation Protection for Particle Accelerators',
    standard: 'NCRP-144',
    docType: 'ncrp',
    kind: 'normative',
    path: 'H:\\Mi unidad\\Manuales\\National Research Council\\Radiation Protection for Particle Ac (64)\\Radiation Protection for Partic - National Research Council.pdf',
  },
  {
    id: 'ncrp-147-medical-xray',
    title: 'Structural Shielding Design for Medical X-Ray Imaging Facilities',
    standard: 'NCRP-147',
    docType: 'ncrp',
    kind: 'normative',
    path: 'H:\\Mi unidad\\Manuales\\National Research Council\\Structural Shielding Design for Medi (52)\\Structural Shielding Design for - National Research Council.pdf',
  },
  {
    id: 'ncrp-147-medical-xray-desktop',
    title: 'Structural Shielding Design for Medical X-Ray Imaging Facilities',
    standard: 'NCRP-147',
    docType: 'ncrp',
    kind: 'normative',
    path: 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Structural Shielding Design for - National Research Council.pdf',
  },
  {
    id: 'iaea-srs-47-radiotherapy-facilities',
    title: 'Radiation Protection in the Design of Radiotherapy Facilities',
    standard: 'IAEA-SRS-47',
    docType: 'iaea',
    kind: 'normative',
    path: 'H:\\Mi unidad\\Manuales\\International Atomic Energy Agency\\Radiation Protection in the Design o (50)\\Radiation Protection in the Des - International Atomic Energy Age.pdf',
  },
  {
    id: 'iaea-srs-47-radiotherapy-facilities-desktop',
    title: 'Radiation Protection in the Design of Radiotherapy Facilities',
    standard: 'IAEA-SRS-47',
    docType: 'iaea',
    kind: 'normative',
    path: 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Radiation Protection in the Des - International Atomic Energy Age.pdf',
  },
  {
    id: 'ncrp-49-structural-shielding',
    title: 'NCRP Report No. 49 - Structural Shielding Design and Evaluation for Medical Use of X Rays and Gamma Rays',
    standard: 'NCRP-49',
    docType: 'ncrp',
    kind: 'normative',
    path: 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\NCRP 49_ Structural Shielding D - National Council On Radiation P.pdf',
  },
  {
    id: 'zumaya-memoria-pet',
    title: 'Entregable Memoria PET Zumaya',
    standard: 'MEMORIA-PET',
    docType: 'generic',
    kind: 'analytic-memory',
    path: 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Entregable Memoria PET Zumaya.pdf',
  },
  {
    id: 'zumaya-memoria-al',
    title: 'Entregable Memoria AL Zumaya',
    standard: 'MEMORIA-LINAC',
    docType: 'generic',
    kind: 'analytic-memory',
    path: 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Entregable Memoria AL Zumaya.pdf',
  },
  {
    id: 'zumaya-memoria-hdr-braqui',
    title: 'Entregable Memoria HDR Braqui Zumaya',
    standard: 'MEMORIA-HDR',
    docType: 'generic',
    kind: 'analytic-memory',
    path: 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Entregable Memoria HDR Braqui Zumaya.pdf',
  },
  {
    id: 'zumaya-informe-sr-permiso-al-hdr',
    title: 'Informe de SR Permiso de C AL HDR Zumaya',
    standard: 'MEMORIA-HDR-LINAC',
    docType: 'generic',
    kind: 'analytic-memory',
    path: 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Informe de SR Permiso de C AL HDR Zumaya.pdf',
  },
  {
    id: 'zumaya-informe-anual-gamma-knife-2024',
    title: 'Informe Anual Gamma Knife 2024',
    standard: 'MEMORIA-GAMMA-KNIFE',
    docType: 'generic',
    kind: 'analytic-memory',
    path: 'C:\\Users\\carlo\\Desktop\\ZUMAYA\\Informe Anual Gamma Knife 2024.pdf',
  },
];

function sha256(path) {
  const hash = createHash('sha256');
  hash.update(readFileSync(path));
  return hash.digest('hex');
}

function chunkText(text, doc, chunkSize = 3200, overlap = 280) {
  const chunks = [];
  let index = 0;
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + chunkSize);
    const content = text.slice(start, end).trim();
    if (content.length > 120) {
      const pageMatch = content.match(/\[page\s+(\d+)\]/i);
      chunks.push({
        id: `${doc.id}_chunk_${index}`,
        docId: doc.id,
        title: doc.title,
        source: doc.path,
        standard: doc.standard,
        docType: doc.docType,
        kind: doc.kind,
        page: pageMatch ? Number(pageMatch[1]) : null,
        content,
      });
      index += 1;
    }
    if (end === text.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

function readOcrSidecar(doc) {
  for (const dir of ocrSidecarDirs) {
    const path = join(dir, `${doc.id}.txt`);
    if (existsSync(path)) {
      const text = readFileSync(path, 'utf8').trim();
      if (text.length > 120) {
        return { path, text };
      }
    }
  }
  return null;
}

const python = firstWorkingPython();
const extractor = join(root, 'scripts', 'f75_extract_pdf_text.py');
const manifest = [];
const allChunks = [];

for (const doc of documents) {
  const entry = {
    ...doc,
    status: 'pending',
    readable: false,
    sizeBytes: 0,
    sha256: null,
    pages: 0,
    extractedPages: 0,
    chunks: 0,
    reason: '',
  };

  try {
    if (!existsSync(doc.path)) {
      entry.reason = 'not-accessible-or-not-found';
      manifest.push(entry);
      continue;
    }

    const file = statSync(doc.path);
    entry.readable = true;
    entry.sizeBytes = file.size;
    entry.sha256 = sha256(doc.path);

    const result = spawnSync(python, [extractor, doc.path], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    });
    const parsed = JSON.parse(result.stdout || '{}');
    if (result.status !== 0 || !parsed.ok) {
      entry.status = 'error';
      entry.reason = parsed.error || result.stderr || 'pdf-extraction-failed';
      manifest.push(entry);
      continue;
    }

    entry.pages = parsed.pages;
    entry.extractedPages = parsed.extractedPages;
    const sidecar = readOcrSidecar(doc);
    if (sidecar && (!parsed.text || parsed.text.trim().length < 120)) {
      entry.reason = `ocr-sidecar:${sidecar.path}`;
    }
    const chunks = chunkText(sidecar?.text || parsed.text, doc);
    entry.chunks = chunks.length;
    entry.status = chunks.length > 0 ? 'prepared' : 'empty';
    if (chunks.length === 0) entry.reason = 'no-text-chunks-extracted';
    allChunks.push(...chunks);
  } catch (error) {
    entry.status = 'error';
    entry.reason = error instanceof Error ? error.message : String(error);
  }

  manifest.push(entry);
}

const dbSeedDraft = allChunks.map((chunk) => ({
  source: chunk.standard,
  section: chunk.title,
  modality: inferModality(chunk),
  content: chunk.content,
  embedding: '[]',
  tags: JSON.stringify([
    'F75',
    chunk.standard,
    chunk.docType,
    chunk.kind,
    chunk.docId,
  ]),
  pageRef: chunk.page ? `p.${chunk.page}` : null,
  metadata: {
    docId: chunk.docId,
    title: chunk.title,
    sourcePath: chunk.source,
    chunkId: chunk.id,
  },
}));

function inferModality(chunk) {
  const haystack = `${chunk.standard} ${chunk.title} ${chunk.docId}`.toLowerCase();
  if (haystack.includes('gamma')) return 'Gamma Knife';
  if (haystack.includes('pet')) return 'PET/CT';
  if (haystack.includes('hdr') || haystack.includes('braqui')) return 'HDR';
  if (haystack.includes('linac') || haystack.includes('radiotherapy') || haystack.includes('srs-47')) return 'LINAC';
  if (haystack.includes('x-ray') || haystack.includes('x ray') || haystack.includes('ncrp-147')) return 'X-Ray';
  return 'General';
}

const summaryPath = join(root, 'outputs', 'f75_pdf_ingestion_summary.json');
if (existsSync(summaryPath) && process.env.F75_ALLOW_REGRESSION !== '1') {
  const previousSummary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  if (Number(previousSummary.totalChunks || 0) > allChunks.length) {
    const guard = {
      phase: 'F75',
      generatedAt: new Date().toISOString(),
      ok: false,
      reason: 'chunk-regression-guard',
      previousChunks: previousSummary.totalChunks,
      attemptedChunks: allChunks.length,
      detail: 'Refusing to overwrite prepared RAG artifacts because current source availability would reduce chunk coverage. Re-expose PDFs or set F75_ALLOW_REGRESSION=1 intentionally.',
      attemptedDocuments: manifest.map((item) => ({
        id: item.id,
        status: item.status,
        chunks: item.chunks,
        reason: item.reason,
      })),
    };
    writeFileSync(
      join(outputDir, 'f75_pdf_ingestion_regression_guard.json'),
      `${JSON.stringify(guard, null, 2)}\n`,
      'utf8',
    );
    console.error(JSON.stringify(guard, null, 2));
    process.exit(1);
  }
}

writeFileSync(join(outputDir, 'f75_pdf_ingestion_manifest.json'), `${JSON.stringify({
  phase: 'F75',
  generatedAt: new Date().toISOString(),
  python,
  documents: manifest,
}, null, 2)}\n`, 'utf8');

writeFileSync(
  join(outputDir, 'f75_pdf_rag_chunks.jsonl'),
  allChunks.map((chunk) => JSON.stringify(chunk)).join('\n') + (allChunks.length ? '\n' : ''),
  'utf8',
);

writeFileSync(
  join(outputDir, 'f75_document_chunks_db_draft.json'),
  `${JSON.stringify({
    phase: 'F75',
    generatedAt: new Date().toISOString(),
    targetTable: 'document_chunks',
    note: 'Draft only. Embeddings are placeholders until live embedding/vector seed is configured.',
    chunks: dbSeedDraft,
  }, null, 2)}\n`,
  'utf8',
);

writeFileSync(summaryPath, `${JSON.stringify({
  phase: 'F75',
  ok: manifest.some((item) => item.status === 'prepared'),
  preparedDocuments: manifest.filter((item) => item.status === 'prepared').length,
  pendingDocuments: manifest.filter((item) => item.status === 'pending').length,
  emptyDocuments: manifest.filter((item) => item.status === 'empty').length,
  errorDocuments: manifest.filter((item) => item.status === 'error').length,
  totalChunks: allChunks.length,
  manifestPath: 'outputs/f75_pdf_ingestion/f75_pdf_ingestion_manifest.json',
  chunksPath: 'outputs/f75_pdf_ingestion/f75_pdf_rag_chunks.jsonl',
  dbSeedDraftPath: 'outputs/f75_pdf_ingestion/f75_document_chunks_db_draft.json',
}, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  preparedDocuments: manifest.filter((item) => item.status === 'prepared').length,
  pendingDocuments: manifest.filter((item) => item.status === 'pending').length,
  totalChunks: allChunks.length,
}, null, 2));
