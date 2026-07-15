import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f139_material_audit');
mkdirSync(outputDir, { recursive: true });

const f138Path = path.join(root, 'outputs', 'f138_material_rag', 'f138_material_rag_manifest.json');
if (!existsSync(f138Path)) throw new Error(`Missing F138 manifest: ${f138Path}`);

function commandPath(name) {
  const result = spawnSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `(Get-Command ${name} -ErrorAction SilentlyContinue).Source`,
  ], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() || null : null;
}

function normalizeValue(value) {
  return String(value ?? '').replace(',', '.').trim();
}

const f138 = JSON.parse(readFileSync(f138Path, 'utf8'));
const manifest = f138.manifest ?? [];
const expectedSources = manifest
  .filter((doc) => doc.status === 'rag-ready')
  .map((doc) => ({
    id: doc.id,
    source: `f138-${doc.id}`,
    expectedChunks: doc.chunkCount,
    sha256: doc.sha256,
    title: doc.title,
  }));

const shaGroups = Object.values(
  manifest.reduce((groups, doc) => {
    if (!doc.sha256) return groups;
    groups[doc.sha256] = groups[doc.sha256] || [];
    groups[doc.sha256].push(doc.id);
    return groups;
  }, {}),
).filter((ids) => ids.length > 1);

const ocrPending = manifest.filter((doc) => doc.status === 'needs-ocr').map((doc) => ({
  id: doc.id,
  title: doc.title,
  path: doc.path,
  exists: existsSync(doc.path),
  pages: doc.pages,
  sha256: doc.sha256,
  textLength: doc.textLength,
  requiredAction: 'Resubmit searchable PDF, provide OCR text sidecar, or install OCR engine and rerun F139.',
}));

const semanticWarnings = [];
const td500 = manifest.find((doc) => doc.id === 'contuplex-td-500');
const td550 = manifest.find((doc) => doc.id === 'contuplex-td-550');
if (td500 && td550) {
  const td500Tvl = (td500.extractedFields?.tvl18 ?? []).map(normalizeValue);
  const td550Tvl = (td550.extractedFields?.tvl18 ?? []).map(normalizeValue);
  if (td500Tvl.some((value) => td550Tvl.includes(value))) {
    semanticWarnings.push({
      id: 'td500-td550-shared-tvl18',
      severity: 'review',
      message: 'TD-500 and TD-550 expose overlapping TVL 18 MV values in extracted text. Keep as vendor evidence until a reviewed material constants table resolves the interpretation.',
      affectedDocs: ['contuplex-td-500', 'contuplex-td-550'],
    });
  }
}

for (const doc of manifest.filter((item) => item.status === 'rag-ready')) {
  const densityValues = (doc.extractedFields?.densities ?? []).map(normalizeValue);
  if (densityValues.length > 1 && new Set(densityValues).size > 2) {
    semanticWarnings.push({
      id: `${doc.id}-multiple-density-values`,
      severity: 'review',
      message: 'Multiple density-like values were extracted, likely including comparison materials. Use page-level citation before promoting a density constant.',
      affectedDocs: [doc.id],
      values: densityValues,
    });
  }
}

const tools = {
  tesseract: commandPath('tesseract'),
  ocrmypdf: commandPath('ocrmypdf'),
  pdftoppm: commandPath('pdftoppm'),
  pdfinfo: commandPath('pdfinfo'),
};

let db = {
  databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
  ok: false,
  sourceRows: [],
  totalF138Chunks: 0,
  pageRefMissing: 0,
  hashTagMissing: 0,
  modalityMismatch: 0,
  duplicateContentGroups: [],
  sourceCountMatchesManifest: false,
  reason: '',
};

if (!process.env.DATABASE_URL) {
  db.reason = 'DATABASE_URL is not configured.';
} else {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [sourceRows] = await connection.query(
      "select source, count(*) as count from document_chunks where source like 'f138-%' group by source order by source",
    );
    const [qualityRows] = await connection.query(
      "select count(*) as total, sum(case when page_ref is null or page_ref = '' then 1 else 0 end) as pageRefMissing, sum(case when tags not like '%hash:%' then 1 else 0 end) as hashTagMissing, sum(case when modality <> 'Materials' then 1 else 0 end) as modalityMismatch from document_chunks where source like 'f138-%'",
    );
    const [duplicates] = await connection.query(
      "select source, page_ref as pageRef, left(sha2(content, 256), 16) as contentHash, count(*) as count from document_chunks where source like 'f138-%' group by source, page_ref, left(sha2(content, 256), 16) having count(*) > 1",
    );

    const sourceMap = new Map(sourceRows.map((row) => [row.source, Number(row.count)]));
    const sourceCountMatchesManifest = expectedSources.every((item) => sourceMap.get(item.source) === item.expectedChunks);
    db = {
      databaseUrlConfigured: true,
      ok: sourceCountMatchesManifest &&
        Number(qualityRows[0]?.pageRefMissing ?? 0) === 0 &&
        Number(qualityRows[0]?.hashTagMissing ?? 0) === 0 &&
        Number(qualityRows[0]?.modalityMismatch ?? 0) === 0,
      sourceRows,
      totalF138Chunks: Number(qualityRows[0]?.total ?? 0),
      pageRefMissing: Number(qualityRows[0]?.pageRefMissing ?? 0),
      hashTagMissing: Number(qualityRows[0]?.hashTagMissing ?? 0),
      modalityMismatch: Number(qualityRows[0]?.modalityMismatch ?? 0),
      duplicateContentGroups: duplicates,
      sourceCountMatchesManifest,
      reason: 'F139 DB readback completed.',
    };
  } finally {
    await connection.end();
  }
}

const exactDuplicateStatus = shaGroups.length === 0 ? 'none' : 'review';
const canAutoOcr = Boolean(tools.tesseract && tools.ocrmypdf);
const status = db.ok
  ? (ocrPending.length > 0 ? 'ready-with-ocr-blockers' : 'ready')
  : 'blocked';

const output = {
  phase: 'F139',
  status,
  generatedAt: new Date().toISOString(),
  source: 'F138 material RAG live seed',
  db,
  exactDuplicateStatus,
  exactDuplicateGroups: shaGroups,
  semanticWarnings,
  citationAudit: {
    expectedSources,
    pageRefsOk: db.pageRefMissing === 0,
    hashTagsOk: db.hashTagMissing === 0,
    modalityOk: db.modalityMismatch === 0,
    vendorEvidencePolicy: 'Do not promote vendor/lab extracted values into calculation defaults until manually reviewed and cited by page.',
  },
  ocr: {
    tools,
    canAutoOcr,
    pendingCount: ocrPending.length,
    pending: ocrPending,
    resubmissionNeeded: ocrPending.map((item) => ({
      id: item.id,
      file: path.basename(item.path),
      options: [
        'Resubmit searchable/OCR PDF.',
        `Provide UTF-8 sidecar text as data/rag/ocr/${item.id}.txt.`,
        `Provide UTF-8 sidecar text as outputs/f76_ocr/extracted_text/${item.id}.txt.`,
      ],
    })),
  },
  releaseImpact: {
    deploy: 'No public deploy blocker beyond F137 gates, but material OCR remains a knowledge-quality blocker.',
    canvas: 'Next improvement should surface material evidence confidence, OCR status and structural/FEM review flags in the material/canvas panels.',
    memoriaIA: 'Next improvement should cite f138-* chunks by source/page and show vendor-evidence warnings.',
  },
  evidence: [
    'outputs/f139_material_audit/f139_material_citation_ocr_audit.json',
    'outputs/fase_139_material_citation_ocr_audit.md',
  ],
  nextPhase: 'F140 documentation suite or F141 canvas/material evidence UX',
  decision: 'F139 validates the F138 live seed and keeps OCR/semantic review blockers explicit before using TM NIPOLL/CONTUPLEX data as calculation constants.',
};

writeFileSync(path.join(outputDir, 'f139_material_citation_ocr_audit.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');

writeFileSync(
  path.join(root, 'outputs', 'fase_139_material_citation_ocr_audit.md'),
  [
    '# F139 Material Citation/OCR Audit',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    '',
    '## DB Readback',
    `- DB configured: ${db.databaseUrlConfigured}`,
    `- DB OK: ${db.ok}`,
    `- F138 chunks: ${db.totalF138Chunks}`,
    `- Source counts match manifest: ${db.sourceCountMatchesManifest}`,
    `- Missing page refs: ${db.pageRefMissing}`,
    `- Missing hash tags: ${db.hashTagMissing}`,
    `- Modality mismatches: ${db.modalityMismatch}`,
    '',
    '## Sources',
    ...db.sourceRows.map((row) => `- ${row.source}: ${row.count}`),
    '',
    '## Duplicate / Review Warnings',
    ...(shaGroups.length ? shaGroups.map((ids) => `- Exact SHA duplicate: ${ids.join(', ')}`) : ['- No exact SHA duplicates among F138 source PDFs.']),
    ...(semanticWarnings.length ? semanticWarnings.map((item) => `- ${item.id}: ${item.message}`) : ['- No semantic warnings.']),
    '',
    '## OCR Pending',
    ...(ocrPending.length ? ocrPending.map((item) => `- ${item.id}: ${path.basename(item.path)} (${item.pages} pages)`) : ['- None']),
    '',
    '## OCR Tools',
    ...Object.entries(tools).map(([name, value]) => `- ${name}: ${value || 'NOT_FOUND'}`),
    '',
    '## Resubmission Needed',
    ...(output.ocr.resubmissionNeeded.length
      ? output.ocr.resubmissionNeeded.map((item) => `- ${item.file}: searchable PDF or sidecar ${item.id}.txt`)
      : ['- None']),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F139 material citation/OCR audit ${output.status}: ${db.totalF138Chunks} chunks, ${ocrPending.length} OCR pending`);
if (status === 'blocked') process.exit(1);
