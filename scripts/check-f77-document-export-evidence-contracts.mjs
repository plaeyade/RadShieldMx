import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const cnsns = read('src', 'hooks', 'useCNSNSReport.ts');
const pdf = read('src', 'hooks', 'usePDFGenerator.ts');
const regulatory = read('src', 'sections', 'dialogs', 'RegulatoryReportDialog.tsx');
const pdfDialog = read('src', 'sections', 'dialogs', 'PdfReportDialog.tsx');
const designer = read('src', 'pages', 'ShieldingDesigner.tsx');
const pkg = JSON.parse(read('package.json'));

const checks = [
  {
    name: 'CNSNS DOCX includes shared F76 evidence appendix',
    ok:
      cnsns.includes("from '@/lib/analyticMemoryEvidence'") &&
      cnsns.includes('barrierResults?: CanvasBarrierResult[]') &&
      cnsns.includes('sampleLines?: CanvasSampleLine[]') &&
      cnsns.includes('analyticEvidenceParagraphs') &&
      cnsns.includes('EVIDENCIA TRAZABLE DEL CANVAS (F76)'),
  },
  {
    name: 'PDF technical report includes shared F76 evidence appendix',
    ok:
      pdf.includes("from '@/lib/analyticMemoryEvidence'") &&
      pdf.includes('barrierResults?: CanvasBarrierResult[]') &&
      pdf.includes('sampleLines?: CanvasSampleLine[]') &&
      pdf.includes('Evidencia trazable del canvas (F76)'),
  },
  {
    name: 'ShieldingDesigner passes live calculation context to DOCX and PDF exports',
    ok:
      designer.includes('canvasImageDataUrl,barrierResults,sampleLines') &&
      designer.includes('date: new Date().toLocaleDateString') &&
      designer.includes('barrierResults, sampleLines'),
  },
  {
    name: 'Regulatory JSON export contains F76 snapshot and appendix',
    ok:
      regulatory.includes('buildAnalyticMemoryEvidenceSection') &&
      regulatory.includes('buildAnalyticMemorySnapshot') &&
      regulatory.includes('evidencia_canvas_f76') &&
      regulatory.includes('apendice_memoria'),
  },
  {
    name: 'PDF Report dialog JSON preview/export contains F76 evidence',
    ok:
      pdfDialog.includes('useCanvasStore') &&
      pdfDialog.includes('evidencia_canvas_f76') &&
      pdfDialog.includes('Evidencia F76') &&
      pdfDialog.includes('apendice_memoria'),
  },
  {
    name: 'package exposes F77 contract',
    ok: pkg.scripts?.['test:f77:document-evidence'] === 'node scripts/check-f77-document-export-evidence-contracts.mjs',
  },
];

const passed = checks.filter(check => check.ok).length;
const result = {
  phase: 'F77',
  ok: passed === checks.length,
  passed,
  total: checks.length,
  checks,
  databaseTouched: false,
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.join(root, 'outputs'), { recursive: true });
fs.writeFileSync(path.join(root, 'outputs', 'f77_document_export_evidence_contracts.json'), JSON.stringify(result, null, 2));

if (!result.ok) {
  console.error(`F77 document export evidence contracts failed: ${passed}/${checks.length}`);
  for (const check of checks.filter(item => !item.ok)) console.error(`- ${check.name}`);
  process.exit(1);
}

console.log(`F77 document export evidence contracts passed: ${passed}/${checks.length}`);
