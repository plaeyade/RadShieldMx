export interface F279LocalFreeOcrTool {
  id: 'tesseract' | 'ocrmypdf' | 'pdftotext' | 'pdftoppm' | 'pdfjs';
  role: string;
  status: 'available' | 'missing' | 'bundled-js';
  installHint: string;
}

export interface F279LocalFreeOcrGate {
  phase: 'F279';
  status: 'local-free-ocr-gate';
  tools: F279LocalFreeOcrTool[];
  recommendedPipeline: string[];
  pendingDocuments: string[];
  releaseDecision: string;
}

export function buildF279LocalFreeOcrGate(): F279LocalFreeOcrGate {
  return {
    phase: 'F279',
    status: 'local-free-ocr-gate',
    tools: [
      {
        id: 'pdfjs',
        role: 'Extract embedded/searchable text before OCR.',
        status: 'bundled-js',
        installHint: 'Already present through pdfjs-dist for text extraction checks.',
      },
      {
        id: 'pdftotext',
        role: 'Free Poppler text extraction fallback.',
        status: 'missing',
        installHint: 'Install Poppler for Windows or use an existing bundled Poppler path.',
      },
      {
        id: 'pdftoppm',
        role: 'Render scanned PDF pages to images before Tesseract.',
        status: 'missing',
        installHint: 'Install Poppler for Windows; pdftoppm is commonly bundled with Poppler.',
      },
      {
        id: 'tesseract',
        role: 'Local OCR engine for scanned pages.',
        status: 'missing',
        installHint: 'Install Tesseract OCR for Windows and Spanish/English language data.',
      },
      {
        id: 'ocrmypdf',
        role: 'Optional wrapper to make searchable PDFs locally.',
        status: 'missing',
        installHint: 'Install via Python/pip only if local Python OCR workflow is preferred.',
      },
    ],
    recommendedPipeline: [
      'Try embedded text with pdfjs/pdftotext.',
      'If text yield is low, render pages with pdftoppm.',
      'Run Tesseract locally with spa+eng language data.',
      'Create page-level text JSONL with source hash, page number and OCR engine version.',
      'Review confidence/page quality before dedupe and DB seed.',
    ],
    pendingDocuments: ['memoria-lab-prod-impsa-2309', 'memoria-ciclotron-kiube-impsa-2309'],
    releaseDecision:
      'F279 replaces paid OCR first-pass with a local/free OCR lane. Cloud OCR remains deferred unless local OCR quality fails and operator approves cost.',
  };
}

export function summarizeF279LocalFreeOcrGate(): string {
  const gate = buildF279LocalFreeOcrGate();
  return [
    'F279 LOCAL FREE OCR GATE',
    `Status: ${gate.status}`,
    `Tools: ${gate.tools.map((tool) => `${tool.id}:${tool.status}`).join(' | ')}`,
    `Decision: ${gate.releaseDecision}`,
  ].join('\n');
}
