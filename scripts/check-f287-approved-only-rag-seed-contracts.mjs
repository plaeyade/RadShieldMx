import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f287_approved_only_rag_seed/f287_approved_only_rag_seed.json'));
const seedReport = JSON.parse(read('outputs/f287_approved_only_rag_seed/f287_seed_report.json'));
const approved = read('outputs/f287_approved_only_rag_seed/f287_document_chunks_approved_only.jsonl')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const excluded = read('outputs/f287_approved_only_rag_seed/f287_excluded_by_review.jsonl')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');
const script = read('scripts/f287-approved-only-rag-seed.mjs');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F287 status', ['approved-only-rag-seed-dry-run', 'approved-only-rag-seed-live-complete'].includes(manifest.status));
expect('No automatic DB seed', manifest.seedDbAutomatically === false);
expect('Target table', manifest.targetTable === 'document_chunks');
expect('F286 decisions are documented', manifest.f286DecisionSummary.totalRows === 136);
expect('F286 needs-reocr rows carried forward', manifest.f286DecisionSummary.byDecision['needs-reocr'] === 136);
expect('Approved rows remain available', approved.length > 1000);
expect('Counts match', manifest.totals.approvedRows === approved.length && manifest.totals.f286ReviewRowsExcluded === excluded.length);
expect('Review exclusions are preserved', manifest.totals.f286ReviewRowsExcluded === 136 && excluded.every((row) => row.decision === 'needs-reocr'));
expect('Dry run by default', seedReport.mode === 'dry-run' && manifest.liveDbWritePerformed === false);
expect('Live seed gates are explicit', script.includes("process.env.F287_SEED_LIVE === '1'") && script.includes("process.env.F287_CONFIRM_APPROVED_ONLY === '1'"));
expect('Rows are F287 sources', approved.every((row) => row.source.startsWith('f287-ocr-memory-') && row.tags.includes('F287')));
expect('Rows mark QA seed draft ready', approved.every((row) => row.tags.includes('f287Decision:qa-seed-draft-ready') || row.tags.includes('f287Decision:human-approved')));
expect('Update Center documents F287', update.includes('F287 Approved-only RAG seed'));
expect('Manual documents F287', manual.includes('Addendum F287'));
expect('Version manual documents F287', versions.includes('F287'));
expect('Changelog documents F287', changelog.includes('F287'));

if (failures.length) {
  console.error('F287 approved-only RAG seed contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F287 approved-only RAG seed contracts passed.');
