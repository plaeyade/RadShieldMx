import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const manifestPath = join(root, 'outputs', 'f75_pdf_ingestion', 'f75_pdf_ingestion_manifest.json');
const outputDir = join(root, 'outputs', 'f76_ocr');
const textDir = join(outputDir, 'extracted_text');
const ocrPdfDir = join(outputDir, 'ocr_pdfs');
mkdirSync(textDir, { recursive: true });
mkdirSync(ocrPdfDir, { recursive: true });

function commandPath(name) {
  const result = spawnSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `(Get-Command ${name} -ErrorAction SilentlyContinue).Source`,
  ], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

function runPythonExtract(pdfPath, textPath) {
  const python = process.env.PYTHON ||
    'C:\\Users\\carlo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
  const extractor = join(root, 'scripts', 'f75_extract_pdf_text.py');
  const result = spawnSync(python, [extractor, pdfPath], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return { ok: false, reason: result.stderr || 'extractor-failed' };
  }
  const parsed = JSON.parse(result.stdout || '{}');
  if (!parsed.ok || !parsed.text?.trim()) {
    return { ok: false, reason: parsed.error || 'no-text-after-ocr' };
  }
  writeFileSync(textPath, parsed.text, 'utf8');
  return {
    ok: true,
    pages: parsed.pages,
    extractedPages: parsed.extractedPages,
    chars: parsed.text.length,
  };
}

function runOcrMyPdf(inputPdf, outputPdf) {
  const result = spawnSync('ocrmypdf', [
    '--skip-text',
    '--deskew',
    '--optimize',
    '0',
    inputPdf,
    outputPdf,
  ], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return { ok: false, reason: result.stderr || result.stdout || 'ocrmypdf-failed' };
  }
  return { ok: true };
}

if (!existsSync(manifestPath)) {
  throw new Error(`Missing manifest. Run npm run prepare:f75:pdf-rag first: ${manifestPath}`);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const ocrmypdf = commandPath('ocrmypdf');
const tesseract = commandPath('tesseract');
const pdftoppm = commandPath('pdftoppm');
const candidates = manifest.documents.filter((doc) => doc.status === 'empty' && doc.readable);
const results = [];

for (const doc of candidates) {
  const textPath = join(textDir, `${doc.id}.txt`);
  const ocrPdfPath = join(ocrPdfDir, `${doc.id}.ocr.pdf`);
  const entry = {
    id: doc.id,
    title: doc.title,
    sourcePath: doc.path,
    sourceFile: basename(doc.path),
    status: 'pending',
    textPath,
    ocrPdfPath,
    reason: '',
  };

  if (existsSync(textPath)) {
    entry.status = 'sidecar-present';
    entry.reason = 'Existing OCR text sidecar will be used by prepare:f75:pdf-rag.';
    results.push(entry);
    continue;
  }

  if (!ocrmypdf) {
    entry.status = 'ocr-engine-missing';
    entry.reason = 'Install OCRmyPDF/Tesseract/Poppler or place a UTF-8 text sidecar at textPath.';
    results.push(entry);
    continue;
  }

  const ocr = runOcrMyPdf(doc.path, ocrPdfPath);
  if (!ocr.ok) {
    entry.status = 'ocr-error';
    entry.reason = ocr.reason;
    results.push(entry);
    continue;
  }

  const extracted = runPythonExtract(ocrPdfPath, textPath);
  if (!extracted.ok) {
    entry.status = 'ocr-extract-error';
    entry.reason = extracted.reason;
    results.push(entry);
    continue;
  }

  entry.status = 'ocr-text-ready';
  entry.reason = `${extracted.chars} chars extracted from OCR PDF.`;
  results.push(entry);
}

const report = {
  phase: 'F76',
  generatedAt: new Date().toISOString(),
  tools: {
    ocrmypdf: ocrmypdf || null,
    tesseract: tesseract || null,
    pdftoppm: pdftoppm || null,
  },
  ok: results.every((item) => ['ocr-text-ready', 'sidecar-present'].includes(item.status)),
  candidateCount: candidates.length,
  results,
  manualSidecarConvention: 'data/rag/ocr/{documentId}.txt or outputs/f76_ocr/extracted_text/{documentId}.txt',
  nextCommand: 'npm run prepare:f75:pdf-rag',
};

writeFileSync(join(outputDir, 'f76_ocr_status.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const lines = [
  '# F76 OCR status',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `OCRmyPDF: ${report.tools.ocrmypdf || 'NOT_FOUND'}`,
  `Tesseract: ${report.tools.tesseract || 'NOT_FOUND'}`,
  `pdftoppm: ${report.tools.pdftoppm || 'NOT_FOUND'}`,
  '',
  '## Candidates',
  '',
  ...results.map((item) => `- ${item.id}: ${item.status}. ${item.reason}`),
  '',
  '## Manual fallback',
  '',
  'If OCR tools are unavailable, export the PDF to UTF-8 text and save it as:',
  '',
  '- `data/rag/ocr/{documentId}.txt`, or',
  '- `outputs/f76_ocr/extracted_text/{documentId}.txt`.',
  '',
  'Then run `npm run prepare:f75:pdf-rag` again.',
  '',
];

writeFileSync(join(outputDir, 'f76_ocr_status.md'), `${lines.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  ok: report.ok,
  candidateCount: report.candidateCount,
  statuses: results.map((item) => ({ id: item.id, status: item.status })),
}, null, 2));
