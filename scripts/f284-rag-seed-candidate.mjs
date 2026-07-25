import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const f282Dir = path.join(root, 'outputs', 'f282_ocr_rag_readiness');
const f283Dir = path.join(root, 'outputs', 'f283_ocr_chunk_qa');
const outputDir = path.join(root, 'outputs', 'f284_rag_seed_candidate');
fs.mkdirSync(outputDir, { recursive: true });

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readJsonl = (filePath) => fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const sha256Text = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

const f282 = readJson(path.join(f282Dir, 'f282_ocr_rag_readiness.json'));
const f283 = readJson(path.join(f283Dir, 'f283_ocr_chunk_qa.json'));
const ragChunks = readJsonl(path.join(f282Dir, 'f282_rag_chunks.jsonl'));
const chunkQa = readJsonl(path.join(f283Dir, 'f283_chunk_qa.jsonl'));
const qaByChunk = new Map(chunkQa.map((row) => [row.chunkId, row]));

const seedCandidates = ragChunks
  .map((chunk) => ({ chunk, qa: qaByChunk.get(chunk.chunkId) }))
  .filter(({ qa }) => qa?.qaStatus === 'chunk-seed-draft-ready')
  .map(({ chunk, qa }) => ({
    documentId: chunk.documentId,
    sourceHash: chunk.sourceHash,
    page: chunk.page,
    modality: chunk.modality,
    chunkId: chunk.chunkId,
    chunkHash: chunk.chunkHash,
    textHash: sha256Text(chunk.text),
    textChars: chunk.textChars,
    extractionMode: chunk.extractionMode,
    reviewStatus: 'seed-draft-ready',
    qaStatus: qa.qaStatus,
    pageQualityScore: qa.pageQualityScore,
    citationLocator: `${chunk.documentId} p.${chunk.page}`,
    text: chunk.text,
  }));

const reviewExcluded = chunkQa
  .filter((qa) => qa.qaStatus !== 'chunk-seed-draft-ready')
  .map((qa) => ({
    chunkId: qa.chunkId,
    documentId: qa.documentId,
    page: qa.page,
    modality: qa.modality,
    chunkHash: qa.chunkHash,
    qaStatus: qa.qaStatus,
    pageQualityScore: qa.pageQualityScore,
    pageFlags: qa.pageFlags,
  }));

const byModality = seedCandidates.reduce((acc, row) => {
  acc[row.modality] = (acc[row.modality] ?? 0) + 1;
  return acc;
}, {});

const byDocument = seedCandidates.reduce((acc, row) => {
  acc[row.documentId] = (acc[row.documentId] ?? 0) + 1;
  return acc;
}, {});

const manifest = {
  phase: 'F284',
  schema: 'radshield-mx.rag-seed-candidate.f284.v1',
  generatedAt: new Date().toISOString(),
  status: 'rag-seed-candidate-dry-run',
  inputPhases: ['F282', 'F283'],
  seedDbAutomatically: false,
  liveDbWritePerformed: false,
  requiredOperatorAction: 'Review F283 sampled pages, then run a separate explicit DB seed phase with approved chunks only.',
  sourceCorpus: {
    f282Chunks: f282.totals.chunks,
    f283SeedDraftChunks: f283.totals.seedDraftChunks,
    f283ReviewChunks: f283.totals.reviewChunks,
  },
  totals: {
    seedCandidates: seedCandidates.length,
    reviewExcluded: reviewExcluded.length,
    documentsWithSeedCandidates: Object.keys(byDocument).length,
    modalities: byModality,
  },
  outputArtifacts: [
    'outputs/f284_rag_seed_candidate/f284_rag_seed_candidate.json',
    'outputs/f284_rag_seed_candidate/f284_document_chunks_seed_candidate.jsonl',
    'outputs/f284_rag_seed_candidate/f284_review_excluded_chunks.jsonl',
    'outputs/fase_284_rag_seed_candidate.md',
  ],
  releaseDecision:
    'F284 prepares an auditable seed-candidate corpus only. It does not write to DB; blocked/review chunks are excluded and must be reviewed before any live seed.',
};

fs.writeFileSync(path.join(outputDir, 'f284_rag_seed_candidate.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f284_document_chunks_seed_candidate.jsonl'), `${seedCandidates.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f284_review_excluded_chunks.jsonl'), `${reviewExcluded.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_284_rag_seed_candidate.md'),
  [
    '# F284 RAG Seed Candidate',
    '',
    `Status: ${manifest.status}`,
    `Seed DB automatically: ${manifest.seedDbAutomatically ? 'yes' : 'no'}`,
    `Live DB write performed: ${manifest.liveDbWritePerformed ? 'yes' : 'no'}`,
    `Seed candidates: ${manifest.totals.seedCandidates}`,
    `Review excluded: ${manifest.totals.reviewExcluded}`,
    `Documents with seed candidates: ${manifest.totals.documentsWithSeedCandidates}`,
    `Modalities: ${Object.entries(byModality).map(([key, value]) => `${key}=${value}`).join(', ')}`,
    '',
    '## Operator action',
    manifest.requiredOperatorAction,
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  seedCandidates: manifest.totals.seedCandidates,
  reviewExcluded: manifest.totals.reviewExcluded,
  modalities: manifest.totals.modalities,
}, null, 2));
