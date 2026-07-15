import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const ragPanel = read('src/sections/RAGIngestionPanel.tsx');
const pdfExtractor = read('src/lib/rag/pdfTextExtractor.ts');
const conversionApi = read('src/lib/externalConversionApi.ts');
const externalConnector = read('src/sections/dialogs/ExternalConnectorDialog.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const canvasArea = read('src/sections/CanvasArea.tsx');
const pkg = JSON.parse(read('package.json'));
const summaryPath = join(root, 'outputs', 'f75_pdf_ingestion_summary.json');
const summary = existsSync(summaryPath) ? JSON.parse(read('outputs/f75_pdf_ingestion_summary.json')) : null;
const manifestPath = join(root, 'outputs', 'f75_pdf_ingestion', 'f75_pdf_ingestion_manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(read('outputs/f75_pdf_ingestion/f75_pdf_ingestion_manifest.json')) : null;
const dbSeedDraftPath = join(root, 'outputs', 'f75_pdf_ingestion', 'f75_document_chunks_db_draft.json');
const dbSeedDraft = existsSync(dbSeedDraftPath) ? JSON.parse(read('outputs/f75_pdf_ingestion/f75_document_chunks_db_draft.json')) : null;

function hasPreparedStandard(standard) {
  return Boolean(manifest?.documents?.some((doc) => doc.standard === standard && doc.status === 'prepared'));
}

const checks = [
  {
    name: 'rag:pdf-upload-extracts-text',
    ok: ragPanel.includes("import { extractPdfText }") && ragPanel.includes("endsWith('.pdf')") && pdfExtractor.includes('pdfjs-dist'),
  },
  {
    name: 'rag:pdf-ingestion-manifest-prepared',
    ok: Boolean(summary?.preparedDocuments >= 6 && summary?.totalChunks >= 200),
  },
  {
    name: 'rag:core-standards-versioned',
    ok: hasPreparedStandard('NCRP-147') &&
      hasPreparedStandard('IAEA-SRS-47') &&
      hasPreparedStandard('MEMORIA-GAMMA-KNIFE') &&
      hasPreparedStandard('MEMORIA-HDR-LINAC'),
  },
  {
    name: 'rag:document-chunks-db-draft-ready',
    ok: Boolean(summary?.dbSeedDraftPath && dbSeedDraft?.targetTable === 'document_chunks' && dbSeedDraft?.chunks?.length === summary?.totalChunks),
  },
  {
    name: 'conversion:external-api-configured',
    ok: conversionApi.includes('SUPPORTED_CONVERSION_ROUTES') && conversionApi.includes("'dwg'") && externalConnector.includes('CAD Conversion API'),
  },
  {
    name: 'ui:no-legacy-quick-actions-mounted',
    ok: !designer.includes('<CanvasQuickActionsSidebar') && !designer.includes('CanvasQuickActionsSidebar'),
  },
  {
    name: 'canvas:medical3d-single-entry',
    ok: (canvasArea.match(/Medical 3D Floor Plan/g) || []).length >= 1,
  },
  {
    name: 'package:f75-scripts-registered',
    ok: pkg.scripts?.['prepare:f75:pdf-rag'] === 'node scripts/f75-prepare-pdf-rag.mjs' &&
      pkg.scripts?.['test:f75:pdf-rag-ui'] === 'node scripts/check-f75-pdf-rag-conversion-ui-contracts.mjs',
  },
];

const warnings = [];
const duplicatedMenuTerms = ['PDF', '3D', 'DXF', 'MC'].filter((term) => {
  const hits = (designer.match(new RegExp(term, 'g')) || []).length;
  return hits > 60;
});
if (duplicatedMenuTerms.length > 0) {
  warnings.push({
    name: 'ui:soft-duplication-hotspots',
    detail: `Review menu/submenu density for: ${duplicatedMenuTerms.join(', ')}`,
  });
}

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F75',
  ok: failed.length === 0,
  checks,
  failed,
  warnings,
  generatedAt: new Date().toISOString(),
};

mkdirSync(join(root, 'outputs'), { recursive: true });
writeFileSync(join(root, 'outputs', 'f75_pdf_rag_conversion_ui_contracts.json'), `${JSON.stringify(output, null, 2)}\n`);

if (failed.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log('F75 PDF/RAG/conversion/UI contracts passed');
