import fs from 'node:fs';

const f104Path = 'outputs/f104_document_closure_manifest.json';
const f104 = fs.existsSync(f104Path) ? JSON.parse(fs.readFileSync(f104Path, 'utf8')) : null;
const documents = f104?.documents ?? [];

const canonicalIds = new Set([
  'ncrp-147-medical-xray-desktop',
  'iaea-srs-47-radiotherapy-facilities-desktop',
  'zumaya-memoria-pet',
  'zumaya-memoria-hdr-braqui',
  'zumaya-informe-sr-permiso-al-hdr',
  'zumaya-informe-anual-gamma-knife-2024',
]);

const suppressedIds = new Set([
  'ncrp-147-medical-xray',
  'iaea-srs-47-radiotherapy-facilities',
]);

const items = documents.map((doc) => {
  let action = 'review';
  if (canonicalIds.has(doc.id) && doc.chunks > 0 && doc.sha256) action = 'seed-ready';
  if (doc.ingestionStatus === 'needs-ocr') action = 'needs-ocr';
  if (doc.ingestionStatus === 'missing-source') action = 'missing-source';
  if (suppressedIds.has(doc.id)) action = 'dedupe-suppressed';

  return {
    id: doc.id,
    title: doc.title,
    standard: doc.standard,
    kind: doc.kind,
    action,
    chunks: doc.chunks,
    sha256: doc.sha256,
    pages: doc.pages,
    extractedPages: doc.extractedPages,
    path: doc.path,
    note:
      action === 'seed-ready'
        ? 'Canonical prepared source for dry-run seed and later MySQL live seed.'
        : action === 'needs-ocr'
          ? 'Requires OCR sidecar/chunks before seed.'
          : action === 'dedupe-suppressed'
            ? 'Suppressed because a local canonical duplicate is prepared.'
            : action === 'missing-source'
              ? 'Source unavailable from current workspace.'
              : 'Review before seed.',
  };
});

const seedReady = items.filter((item) => item.action === 'seed-ready');
const needsOcr = items.filter((item) => item.action === 'needs-ocr');
const missingSources = items.filter((item) => item.action === 'missing-source');
const suppressed = items.filter((item) => item.action === 'dedupe-suppressed');

const output = {
  phase: 'F129',
  generatedAt: new Date().toISOString(),
  status: 'db-ready-with-blockers',
  seedMode: 'dry-run-until-mysql',
  sourceManifest: f104Path,
  totals: {
    documents: items.length,
    seedReady: seedReady.length,
    chunksReady: seedReady.reduce((sum, item) => sum + item.chunks, 0),
    needsOcr: needsOcr.length,
    missingSources: missingSources.length,
    dedupeSuppressed: suppressed.length,
    semanticDuplicateGroups: f104?.documentSummary?.semanticDuplicateGroups ?? 0,
  },
  seedReadyIds: seedReady.map((item) => item.id),
  needsOcrIds: needsOcr.map((item) => item.id),
  missingSourceIds: missingSources.map((item) => item.id),
  suppressedDuplicateIds: suppressed.map((item) => item.id),
  mysqlNextSteps: [
    'Install MySQL 8 Windows Service.',
    'Set DATABASE_URL for radshield_mx.',
    'Run migrations and dry-run seed.',
    'Run live seed only with explicit F76_SEED_LIVE=1 after backup.',
    'Validate documents, chunks, citation hashes and duplicate groups.',
  ],
  blockers: [
    ...(needsOcr.length ? ['OCR pending for scanned PDFs.'] : []),
    ...(missingSources.length ? ['Some source files remain inaccessible.'] : []),
    'Live DB seed waits for MySQL/DATABASE_URL.',
  ],
  decision:
    'Use F129 as the canonical document seed manifest while MySQL is being installed. Seed only seed-ready canonical IDs and keep OCR/missing-source blockers explicit.',
  items,
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync('outputs/f129_document_seed_readiness.json', `${JSON.stringify(output, null, 2)}\n`);

const md = [
  '# F129 Document Seed Readiness',
  '',
  `Generated: ${output.generatedAt}`,
  `Status: ${output.status}`,
  `Seed mode: ${output.seedMode}`,
  '',
  '## Totals',
  `- Documents: ${output.totals.documents}`,
  `- Seed-ready: ${output.totals.seedReady}`,
  `- Chunks ready: ${output.totals.chunksReady}`,
  `- Needs OCR: ${output.totals.needsOcr}`,
  `- Missing sources: ${output.totals.missingSources}`,
  `- Dedupe suppressed: ${output.totals.dedupeSuppressed}`,
  '',
  '## Seed-ready canonical IDs',
  ...output.seedReadyIds.map((id) => `- ${id}`),
  '',
  '## OCR pending',
  ...(output.needsOcrIds.length ? output.needsOcrIds.map((id) => `- ${id}`) : ['- None']),
  '',
  '## Missing sources',
  ...(output.missingSourceIds.length ? output.missingSourceIds.map((id) => `- ${id}`) : ['- None']),
  '',
  '## Suppressed duplicates',
  ...(output.suppressedDuplicateIds.length ? output.suppressedDuplicateIds.map((id) => `- ${id}`) : ['- None']),
  '',
  '## MySQL next steps',
  ...output.mysqlNextSteps.map((step) => `- ${step}`),
  '',
  `Decision: ${output.decision}`,
  '',
].join('\n');

fs.writeFileSync('outputs/fase_129_document_seed_readiness.md', md);

console.log('F129 document seed readiness outputs written.');
