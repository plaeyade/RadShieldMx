import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const inputDir = path.join(root, 'outputs', 'f281_full_local_ocr');
const outputDir = path.join(root, 'outputs', 'f282_ocr_rag_readiness');
fs.mkdirSync(outputDir, { recursive: true });

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const sha256Text = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

const manifestPath = path.join(inputDir, 'f281_full_local_ocr.json');
const pagesPath = path.join(inputDir, 'f281_full_local_ocr_pages.jsonl');

if (!fs.existsSync(manifestPath) || !fs.existsSync(pagesPath)) {
  throw new Error('F281 outputs missing. Run npm run prepare:f281:full-local-ocr first.');
}

const f281 = readJson(manifestPath);
const pages = fs.readFileSync(pagesPath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const chunkSize = Number(process.env.F282_CHUNK_SIZE ?? 1400);
const overlap = Number(process.env.F282_CHUNK_OVERLAP ?? 180);

const cleanText = (text) => String(text ?? '')
  .replace(/\r/g, '')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{4,}/g, '\n\n\n')
  .trim();

const classifyModality = (documentId, text) => {
  const haystack = `${documentId} ${text}`.toLowerCase();
  if (haystack.includes('gamma knife') || haystack.includes('gammaknife')) return 'TX-GAMMA-KNIFE';
  if (haystack.includes('braqui') || haystack.includes('co-60') || haystack.includes('co60')) return 'TX-BRAQUI';
  if (haystack.includes('ciclotron') || haystack.includes('cyclotron') || haystack.includes('kiube')) return 'CY';
  if (haystack.includes('versa') || haystack.includes('15 mv') || haystack.includes('linac') || haystack.includes('acelerador lineal')) return 'TX-LINAC';
  if (haystack.includes('pet') || haystack.includes('radiofarmacia')) return 'NM';
  return 'GENERAL';
};

const splitChunks = (text) => {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  const chunks = [];
  let index = 0;
  while (index < cleaned.length) {
    const end = Math.min(cleaned.length, index + chunkSize);
    const chunk = cleaned.slice(index, end).trim();
    if (chunk.length >= 120) chunks.push(chunk);
    if (end === cleaned.length) break;
    index = Math.max(0, end - overlap);
  }
  return chunks;
};

const chunks = [];
const seen = new Set();
const documentStats = new Map();

for (const page of pages) {
  const text = cleanText(page.text);
  const pageChunks = splitChunks(text);
  const modality = classifyModality(page.documentId, text.slice(0, 2000));
  const stats = documentStats.get(page.documentId) ?? {
    documentId: page.documentId,
    sourcePath: page.sourcePath,
    sourceHash: page.sourceHash,
    modality,
    pages: 0,
    nativePages: 0,
    ocrPages: 0,
    chunks: 0,
    textChars: 0,
    reviewRequiredPages: 0,
  };

  stats.pages += 1;
  stats.textChars += text.length;
  if (page.extractionMode === 'native-text') stats.nativePages += 1;
  if (page.extractionMode === 'tesseract-ocr') stats.ocrPages += 1;
  if (page.reviewStatus === 'draft-needs-review') stats.reviewRequiredPages += 1;

  pageChunks.forEach((chunkText, chunkIndex) => {
    const chunkHash = sha256Text(`${page.sourceHash}:${page.page}:${chunkText}`);
    if (seen.has(chunkHash)) return;
    seen.add(chunkHash);
    stats.chunks += 1;
    chunks.push({
      chunkId: `f282-${page.documentId}-p${String(page.page).padStart(4, '0')}-${String(chunkIndex + 1).padStart(2, '0')}`,
      documentId: page.documentId,
      sourcePath: page.sourcePath,
      sourceHash: page.sourceHash,
      page: page.page,
      modality,
      extractionMode: page.extractionMode,
      ocrLanguage: page.language,
      reviewStatus: page.reviewStatus,
      textChars: chunkText.length,
      chunkHash,
      text: chunkText,
    });
  });

  documentStats.set(page.documentId, stats);
}

const documents = Array.from(documentStats.values()).map((doc) => ({
  ...doc,
  status: doc.chunks > 0 && doc.reviewRequiredPages === 0 ? 'rag-ready-native-or-reviewed' : doc.chunks > 0 ? 'rag-draft-needs-page-qa' : 'rag-blocked-empty',
}));

const manifest = {
  phase: 'F282',
  schema: 'radshield-mx.ocr-rag-readiness.f282.v1',
  generatedAt: new Date().toISOString(),
  status: 'ocr-rag-readiness-draft',
  inputPhase: f281.phase,
  spanishOcrOperational: Boolean(f281.tools?.spanishOcrOperational),
  tessdataSource: f281.tools?.tesseract?.tessdataSource,
  seedDbAutomatically: false,
  chunkPolicy: {
    chunkSize,
    overlap,
    minimumChunkChars: 120,
    dedupe: 'chunkHash derived from sourceHash + page + text',
  },
  totals: {
    documents: documents.length,
    pages: pages.length,
    chunks: chunks.length,
    nativePages: documents.reduce((sum, doc) => sum + doc.nativePages, 0),
    ocrPages: documents.reduce((sum, doc) => sum + doc.ocrPages, 0),
    reviewRequiredPages: documents.reduce((sum, doc) => sum + doc.reviewRequiredPages, 0),
  },
  documents,
  outputArtifacts: [
    'outputs/f282_ocr_rag_readiness/f282_ocr_rag_readiness.json',
    'outputs/f282_ocr_rag_readiness/f282_rag_chunks.jsonl',
    'outputs/fase_282_ocr_rag_readiness.md',
  ],
  releaseDecision:
    'F282 prepares deduplicated OCR/text chunks for RAG review. DB seed remains disabled until sampled page QA, citation policy and canonical-source governance approve the corpus.',
};

fs.writeFileSync(path.join(outputDir, 'f282_ocr_rag_readiness.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f282_rag_chunks.jsonl'), `${chunks.map((chunk) => JSON.stringify(chunk)).join('\n')}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_282_ocr_rag_readiness.md'),
  [
    '# F282 OCR RAG Readiness',
    '',
    `Status: ${manifest.status}`,
    `Spanish OCR operational: ${manifest.spanishOcrOperational ? 'yes' : 'no'}`,
    `Tessdata source: ${manifest.tessdataSource || 'default'}`,
    `Seed DB automatically: ${manifest.seedDbAutomatically ? 'yes' : 'no'}`,
    `Documents: ${manifest.totals.documents}`,
    `Pages: ${manifest.totals.pages}`,
    `Chunks: ${manifest.totals.chunks}`,
    `Review-required pages: ${manifest.totals.reviewRequiredPages}`,
    '',
    '## Documents',
    ...documents.map((doc) => `- ${doc.documentId}: ${doc.status}; modality=${doc.modality}; pages=${doc.pages}; chunks=${doc.chunks}; reviewPages=${doc.reviewRequiredPages}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  spanishOcrOperational: manifest.spanishOcrOperational,
  totals: manifest.totals,
  documents: documents.map((doc) => `${doc.documentId}:${doc.status}:${doc.chunks}`),
}, null, 2));
