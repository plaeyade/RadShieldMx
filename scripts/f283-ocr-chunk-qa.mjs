import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const f281Dir = path.join(root, 'outputs', 'f281_full_local_ocr');
const f282Dir = path.join(root, 'outputs', 'f282_ocr_rag_readiness');
const outputDir = path.join(root, 'outputs', 'f283_ocr_chunk_qa');
fs.mkdirSync(outputDir, { recursive: true });

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readJsonl = (filePath) => fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const sha256Text = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

const f281 = readJson(path.join(f281Dir, 'f281_full_local_ocr.json'));
const f282 = readJson(path.join(f282Dir, 'f282_ocr_rag_readiness.json'));
const pages = readJsonl(path.join(f281Dir, 'f281_full_local_ocr_pages.jsonl'));
const chunks = readJsonl(path.join(f282Dir, 'f282_rag_chunks.jsonl'));

const alphaNumericRatio = (text) => {
  const chars = Array.from(text ?? '');
  if (chars.length === 0) return 0;
  const good = chars.filter((char) => /[\p{L}\p{N}\s.,;:()[\]\/%+\-_=°µ]/u.test(char)).length;
  return good / chars.length;
};

const suspiciousTokenRatio = (text) => {
  const tokens = String(text ?? '').split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 1;
  const suspicious = tokens.filter((token) => {
    if (token.length <= 2) return false;
    if (/^[A-ZÁÉÍÓÚÜÑ0-9.,:;/%+\-()]+$/.test(token)) return false;
    if (/[|{}<>~^`]/.test(token)) return true;
    if ((token.match(/[0-9]/g) ?? []).length > 0 && (token.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) ?? []).length > 0 && token.length > 10) return true;
    if ((token.match(/[^\p{L}\p{N}.,:;/%+\-()]/gu) ?? []).length >= 2) return true;
    return false;
  }).length;
  return suspicious / tokens.length;
};

const formulaSignal = (text) => /TVL|NCRP|IAEA|OIEA|UAQ|CNSNS|mSv|µSv|uSv|Gy|mGy|B\s*=|P\s*=|W\s*=|U\s*=|T\s*=|cGy|MeV|MV/i.test(text ?? '');
const materialSignal = (text) => /plomo|concreto|hormig[oó]n|tabique|barita|acero|density|densidad|TM\s*NIPOLL|NIPOLL|Verishield|Nelco/i.test(text ?? '');

const qualityForPage = (page) => {
  const text = String(page.text ?? '');
  const chars = text.trim().length;
  const ratio = alphaNumericRatio(text);
  const suspicious = suspiciousTokenRatio(text);
  const lineCount = text.split(/\n/).filter((line) => line.trim()).length;
  const score = Math.round(Math.max(0, Math.min(100,
    35 +
    Math.min(35, chars / 60) +
    Math.min(15, lineCount / 2) +
    (ratio >= 0.92 ? 10 : ratio >= 0.86 ? 4 : -12) +
    (suspicious <= 0.04 ? 5 : suspicious <= 0.08 ? 0 : -10),
  )));
  const flags = [];
  if (chars < 300) flags.push('low-text');
  if (ratio < 0.86) flags.push('low-alphanumeric-ratio');
  if (suspicious > 0.08) flags.push('suspicious-token-ratio');
  if (!formulaSignal(text) && !materialSignal(text) && chars < 900) flags.push('weak-domain-signal');
  return {
    page: page.page,
    extractionMode: page.extractionMode,
    reviewStatus: page.reviewStatus,
    textChars: chars,
    alphaNumericRatio: Number(ratio.toFixed(3)),
    suspiciousTokenRatio: Number(suspicious.toFixed(3)),
    lineCount,
    hasFormulaSignal: formulaSignal(text),
    hasMaterialSignal: materialSignal(text),
    qualityScore: score,
    qaStatus: flags.length === 0 && score >= 78 ? 'qa-auto-pass' : score >= 62 ? 'qa-sample-review' : 'qa-blocked-review',
    flags,
    textHash: sha256Text(text),
    sample: text.replace(/\s+/g, ' ').slice(0, 420),
  };
};

const groupByDocument = new Map();
for (const page of pages) {
  const list = groupByDocument.get(page.documentId) ?? [];
  list.push({ ...page, qa: qualityForPage(page) });
  groupByDocument.set(page.documentId, list);
}

const selectSamples = (docPages) => {
  const sorted = [...docPages].sort((a, b) => a.page - b.page);
  const ocr = sorted.filter((page) => page.extractionMode === 'tesseract-ocr');
  const weak = sorted.filter((page) => page.qa.qaStatus !== 'qa-auto-pass').sort((a, b) => a.qa.qualityScore - b.qa.qualityScore);
  const picks = new Map();
  const add = (page) => { if (page) picks.set(page.page, page); };
  add(sorted[0]);
  add(sorted[Math.floor(sorted.length / 2)]);
  add(sorted.at(-1));
  add(ocr[0]);
  add(ocr[Math.floor(ocr.length / 2)]);
  add(ocr.at(-1));
  weak.slice(0, 3).forEach(add);
  return Array.from(picks.values()).sort((a, b) => a.page - b.page).map((page) => page.qa);
};

const chunkQa = chunks.map((chunk) => {
  const page = pages.find((candidate) => candidate.documentId === chunk.documentId && candidate.page === chunk.page);
  const pageQa = page ? qualityForPage(page) : undefined;
  const qaStatus = pageQa?.qaStatus === 'qa-blocked-review' ? 'chunk-blocked-page-qa'
    : pageQa?.qaStatus === 'qa-sample-review' ? 'chunk-needs-sample-qa'
    : chunk.reviewStatus === 'draft-needs-review' ? 'chunk-needs-ocr-page-qa'
    : 'chunk-seed-draft-ready';
  return {
    chunkId: chunk.chunkId,
    documentId: chunk.documentId,
    sourceHash: chunk.sourceHash,
    page: chunk.page,
    modality: chunk.modality,
    chunkHash: chunk.chunkHash,
    textChars: chunk.textChars,
    extractionMode: chunk.extractionMode,
    qaStatus,
    pageQualityScore: pageQa?.qualityScore,
    pageFlags: pageQa?.flags ?? ['missing-page-qa'],
  };
});

const documentQa = Array.from(groupByDocument.entries()).map(([documentId, docPages]) => {
  const pageQa = docPages.map((page) => page.qa);
  const blocked = pageQa.filter((page) => page.qaStatus === 'qa-blocked-review').length;
  const sampleReview = pageQa.filter((page) => page.qaStatus === 'qa-sample-review').length;
  const autoPass = pageQa.filter((page) => page.qaStatus === 'qa-auto-pass').length;
  const docChunks = chunkQa.filter((chunk) => chunk.documentId === documentId);
  const f282Doc = f282.documents.find((doc) => doc.documentId === documentId);
  return {
    documentId,
    modality: f282Doc?.modality ?? 'GENERAL',
    sourceHash: f282Doc?.sourceHash,
    pages: pageQa.length,
    chunks: docChunks.length,
    autoPassPages: autoPass,
    sampleReviewPages: sampleReview,
    blockedPages: blocked,
    seedDraftChunks: docChunks.filter((chunk) => chunk.qaStatus === 'chunk-seed-draft-ready').length,
    reviewChunks: docChunks.filter((chunk) => chunk.qaStatus !== 'chunk-seed-draft-ready').length,
    status: blocked > 0 ? 'qa-blocked-pages-present' : sampleReview > 0 ? 'qa-sample-review-required' : 'qa-auto-pass',
    samplePages: selectSamples(docPages),
  };
});

const manifest = {
  phase: 'F283',
  schema: 'radshield-mx.ocr-chunk-qa.f283.v1',
  generatedAt: new Date().toISOString(),
  status: 'ocr-chunk-qa-ready',
  inputPhases: ['F281', 'F282'],
  spanishOcrOperational: Boolean(f281.tools?.spanishOcrOperational),
  seedDbAutomatically: false,
  qaPolicy: [
    'Auto-pass is allowed only for pages with acceptable text volume, OCR character ratios and domain signals.',
    'OCR pages remain at least sample-review until representative samples are manually accepted.',
    'Blocked pages/chunks must not be seeded into document_chunks.',
    'Native searchable text can enter seed draft only with sourceHash/page/chunkHash traceability.',
  ],
  totals: {
    documents: documentQa.length,
    pages: pages.length,
    chunks: chunks.length,
    autoPassPages: documentQa.reduce((sum, doc) => sum + doc.autoPassPages, 0),
    sampleReviewPages: documentQa.reduce((sum, doc) => sum + doc.sampleReviewPages, 0),
    blockedPages: documentQa.reduce((sum, doc) => sum + doc.blockedPages, 0),
    seedDraftChunks: chunkQa.filter((chunk) => chunk.qaStatus === 'chunk-seed-draft-ready').length,
    reviewChunks: chunkQa.filter((chunk) => chunk.qaStatus !== 'chunk-seed-draft-ready').length,
  },
  documents: documentQa,
  outputArtifacts: [
    'outputs/f283_ocr_chunk_qa/f283_ocr_chunk_qa.json',
    'outputs/f283_ocr_chunk_qa/f283_chunk_qa.jsonl',
    'outputs/fase_283_ocr_chunk_qa.md',
  ],
  releaseDecision:
    'F283 creates OCR/chunk QA evidence and seed-draft separation. Proceed to DB seed only after reviewing sample pages and excluding blocked chunks.',
};

fs.writeFileSync(path.join(outputDir, 'f283_ocr_chunk_qa.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f283_chunk_qa.jsonl'), `${chunkQa.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_283_ocr_chunk_qa.md'),
  [
    '# F283 OCR Chunk QA',
    '',
    `Status: ${manifest.status}`,
    `Spanish OCR operational: ${manifest.spanishOcrOperational ? 'yes' : 'no'}`,
    `Seed DB automatically: ${manifest.seedDbAutomatically ? 'yes' : 'no'}`,
    `Documents: ${manifest.totals.documents}`,
    `Pages: ${manifest.totals.pages}`,
    `Chunks: ${manifest.totals.chunks}`,
    `Auto-pass pages: ${manifest.totals.autoPassPages}`,
    `Sample-review pages: ${manifest.totals.sampleReviewPages}`,
    `Blocked pages: ${manifest.totals.blockedPages}`,
    `Seed-draft chunks: ${manifest.totals.seedDraftChunks}`,
    `Review chunks: ${manifest.totals.reviewChunks}`,
    '',
    '## Documents',
    ...documentQa.map((doc) => `- ${doc.documentId}: ${doc.status}; modality=${doc.modality}; pages=${doc.pages}; chunks=${doc.chunks}; seedDraftChunks=${doc.seedDraftChunks}; reviewChunks=${doc.reviewChunks}; samplePages=${doc.samplePages.map((page) => `${page.page}:${page.qaStatus}:${page.qualityScore}`).join(', ')}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  totals: manifest.totals,
  documents: documentQa.map((doc) => `${doc.documentId}:${doc.status}:seed=${doc.seedDraftChunks}:review=${doc.reviewChunks}`),
}, null, 2));
