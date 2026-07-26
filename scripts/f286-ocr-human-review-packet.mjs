import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const f282Dir = path.join(root, 'outputs', 'f282_ocr_rag_readiness');
const f283Dir = path.join(root, 'outputs', 'f283_ocr_chunk_qa');
const f284Dir = path.join(root, 'outputs', 'f284_rag_seed_candidate');
const f285Dir = path.join(root, 'outputs', 'f285_controlled_rag_seed');
const outputDir = path.join(root, 'outputs', 'f286_ocr_human_review_packet');
fs.mkdirSync(outputDir, { recursive: true });

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readJsonl = (filePath) => fs.readFileSync(filePath, 'utf8')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const cleanPreview = (text, max = 420) => String(text || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const f283 = readJson(path.join(f283Dir, 'f283_ocr_chunk_qa.json'));
const f284 = readJson(path.join(f284Dir, 'f284_rag_seed_candidate.json'));
const f285 = readJson(path.join(f285Dir, 'f285_controlled_rag_seed.json'));
const chunks = readJsonl(path.join(f282Dir, 'f282_rag_chunks.jsonl'));
const chunkQa = readJsonl(path.join(f283Dir, 'f283_chunk_qa.jsonl'));

const chunkById = new Map(chunks.map((chunk) => [chunk.chunkId, chunk]));
const qaByPage = new Map();
for (const qa of chunkQa) {
  const key = `${qa.documentId}::${qa.page}`;
  const entry = qaByPage.get(key) ?? {
    documentId: qa.documentId,
    page: qa.page,
    modality: qa.modality,
    sourceHash: qa.sourceHash,
    extractionMode: chunkById.get(qa.chunkId)?.extractionMode ?? 'unknown',
    chunkIds: [],
    chunkHashes: [],
    chunkCount: 0,
    reviewChunkCount: 0,
    seedDraftChunkCount: 0,
    maxTextChars: 0,
    minQualityScore: qa.pageQualityScore,
    flags: new Set(),
    preview: '',
  };

  const chunk = chunkById.get(qa.chunkId);
  entry.chunkIds.push(qa.chunkId);
  entry.chunkHashes.push(qa.chunkHash);
  entry.chunkCount += 1;
  if (qa.qaStatus === 'chunk-seed-draft-ready') entry.seedDraftChunkCount += 1;
  if (qa.qaStatus !== 'chunk-seed-draft-ready') entry.reviewChunkCount += 1;
  entry.maxTextChars = Math.max(entry.maxTextChars, qa.textChars || chunk?.textChars || 0);
  entry.minQualityScore = Math.min(entry.minQualityScore, qa.pageQualityScore ?? 0);
  for (const flag of qa.pageFlags ?? []) entry.flags.add(flag);
  if (!entry.preview && chunk?.text) entry.preview = cleanPreview(chunk.text);
  qaByPage.set(key, entry);
}

const pageRows = [...qaByPage.values()].map((entry) => ({
  ...entry,
  flags: [...entry.flags].sort(),
  pageKey: `${entry.documentId} p.${entry.page}`,
}));

const sampleReviewPages = pageRows
  .filter((row) => row.reviewChunkCount > 0 && row.flags.length === 0 && row.minQualityScore >= 50)
  .sort((a, b) => a.documentId.localeCompare(b.documentId) || a.page - b.page);

const blockedPages = pageRows
  .filter((row) => row.flags.length > 0 || row.minQualityScore < 50)
  .sort((a, b) => a.documentId.localeCompare(b.documentId) || a.page - b.page);

const documentSummary = f283.documents.map((doc) => ({
  documentId: doc.documentId,
  modality: doc.modality,
  sourceHash: doc.sourceHash,
  pages: doc.pages,
  chunks: doc.chunks,
  sampleReviewPages: doc.sampleReviewPages,
  blockedPages: doc.blockedPages,
  seedDraftChunks: doc.seedDraftChunks,
  reviewChunks: doc.reviewChunks,
  status: doc.status,
  recommendation: doc.blockedPages > 0
    ? 'review-blocked-pages-before-live-seed'
    : doc.sampleReviewPages > 0
      ? 'review-samples-before-live-seed'
      : 'ready-after-standard-operator-review',
}));

const reviewRows = [...sampleReviewPages, ...blockedPages].map((row) => ({
  decision: 'pending',
  reason: '',
  pageKey: row.pageKey,
  documentId: row.documentId,
  page: row.page,
  modality: row.modality,
  extractionMode: row.extractionMode,
  minQualityScore: row.minQualityScore,
  chunkCount: row.chunkCount,
  reviewChunkCount: row.reviewChunkCount,
  seedDraftChunkCount: row.seedDraftChunkCount,
  flags: row.flags.join('|'),
  sourceHash: row.sourceHash,
  chunkHashes: row.chunkHashes.join('|'),
  preview: row.preview,
}));

const csvHeader = [
  'decision',
  'reason',
  'pageKey',
  'documentId',
  'page',
  'modality',
  'extractionMode',
  'minQualityScore',
  'chunkCount',
  'reviewChunkCount',
  'seedDraftChunkCount',
  'flags',
  'sourceHash',
  'chunkHashes',
  'preview',
];

const approvalTemplate = [
  csvHeader.join(','),
  ...reviewRows.map((row) => csvHeader.map((key) => csvCell(row[key])).join(',')),
].join('\n');

const manifest = {
  phase: 'F286',
  schema: 'radshield-mx.ocr-human-review-packet.f286.v1',
  generatedAt: new Date().toISOString(),
  status: 'ocr-human-review-packet-ready',
  inputPhases: ['F282', 'F283', 'F284', 'F285'],
  seedDbAutomatically: false,
  liveDbWritePerformed: false,
  blocksF287LiveSeed: true,
  totals: {
    documents: f283.totals.documents,
    pages: f283.totals.pages,
    chunks: f283.totals.chunks,
    sampleReviewPages: f283.totals.sampleReviewPages,
    blockedPages: f283.totals.blockedPages,
    reviewRows: reviewRows.length,
    f284SeedCandidates: f284.totals.seedCandidates,
    f285RowsPrepared: f285.totals.rowsPrepared,
  },
  approvalPolicy: {
    allowedDecisions: ['approve', 'reject', 'needs-redaction', 'needs-reocr'],
    liveSeedRequirement:
      'All F286 review rows must be approve or documented reject before enabling F285_SEED_LIVE=1 and F285_CONFIRM_REVIEWED=1.',
    privacyRule:
      'Private clinical memories can support local RAG/evidence but must not be bundled into public static deploy artifacts.',
    citationRule:
      'Any OCR-derived claim in Memoria IA must include page, sourceHash and chunkHash and must be marked example/evidence, not canonical norm.',
  },
  documentSummary,
  outputArtifacts: [
    'outputs/f286_ocr_human_review_packet/f286_ocr_human_review_packet.json',
    'outputs/f286_ocr_human_review_packet/f286_review_decisions_template.csv',
    'outputs/f286_ocr_human_review_packet/f286_sample_review_pages.json',
    'outputs/f286_ocr_human_review_packet/f286_blocked_pages.json',
    'outputs/fase_286_ocr_human_review_packet.md',
  ],
};

const pageList = (rows) => rows.map((row) => ({
  pageKey: row.pageKey,
  documentId: row.documentId,
  page: row.page,
  modality: row.modality,
  extractionMode: row.extractionMode,
  minQualityScore: row.minQualityScore,
  chunkCount: row.chunkCount,
  flags: row.flags,
  sourceHash: row.sourceHash,
  chunkHashes: row.chunkHashes,
  preview: row.preview,
}));

fs.writeFileSync(path.join(outputDir, 'f286_ocr_human_review_packet.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f286_review_decisions_template.csv'), `${approvalTemplate}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f286_sample_review_pages.json'), `${JSON.stringify(pageList(sampleReviewPages), null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f286_blocked_pages.json'), `${JSON.stringify(pageList(blockedPages), null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_286_ocr_human_review_packet.md'),
  [
    '# F286 OCR Human Review Packet',
    '',
    `Status: ${manifest.status}`,
    `Documents: ${manifest.totals.documents}`,
    `Pages: ${manifest.totals.pages}`,
    `Chunks: ${manifest.totals.chunks}`,
    `Sample-review pages: ${manifest.totals.sampleReviewPages}`,
    `Blocked pages: ${manifest.totals.blockedPages}`,
    `Review rows: ${manifest.totals.reviewRows}`,
    `F285 rows prepared: ${manifest.totals.f285RowsPrepared}`,
    '',
    '## Gate',
    manifest.approvalPolicy.liveSeedRequirement,
    '',
    '## Operator actions',
    '- Open `f286_review_decisions_template.csv`.',
    '- For each row, set decision to approve, reject, needs-redaction or needs-reocr.',
    '- Do not run F287 live seed until every row has a documented decision.',
    '- Run F170 after any live seed to revalidate hashes and citations.',
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  sampleReviewPages: manifest.totals.sampleReviewPages,
  blockedPages: manifest.totals.blockedPages,
  reviewRows: manifest.totals.reviewRows,
  blocksF287LiveSeed: manifest.blocksF287LiveSeed,
}, null, 2));
