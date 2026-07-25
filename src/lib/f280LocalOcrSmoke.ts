export interface F280OcrSmokeDocument {
  documentId: string;
  status: 'ocr-smoke-ready' | 'ocr-smoke-warning' | 'ocr-smoke-failed';
  pagesAttempted: number;
  textChars: number;
  sourceHash?: string;
  warnings: string[];
}

export interface F280LocalOcrSmoke {
  phase: 'F280';
  status: 'local-ocr-smoke';
  documents: F280OcrSmokeDocument[];
  outputArtifacts: string[];
  releaseDecision: string;
}

export function buildF280LocalOcrSmokeSummary(): F280LocalOcrSmoke {
  return {
    phase: 'F280',
    status: 'local-ocr-smoke',
    documents: [
      {
        documentId: 'memoria-lab-prod-impsa-2309',
        status: 'ocr-smoke-warning',
        pagesAttempted: 2,
        textChars: 0,
        warnings: ['Run prepare:f280:local-ocr-smoke to generate live local OCR evidence.'],
      },
      {
        documentId: 'memoria-ciclotron-kiube-impsa-2309',
        status: 'ocr-smoke-warning',
        pagesAttempted: 2,
        textChars: 0,
        warnings: ['Run prepare:f280:local-ocr-smoke to generate live local OCR evidence.'],
      },
    ],
    outputArtifacts: [
      'outputs/f280_local_ocr_smoke/f280_local_ocr_smoke.json',
      'outputs/f280_local_ocr_smoke/f280_local_ocr_pages.jsonl',
      'outputs/fase_280_local_ocr_smoke.md',
    ],
    releaseDecision:
      'F280 performs a small local OCR smoke on the pending real memories. Full-document OCR and DB seed should happen only after reviewing smoke quality.',
  };
}

export function summarizeF280LocalOcrSmoke(): string {
  const gate = buildF280LocalOcrSmokeSummary();
  return [
    'F280 LOCAL OCR SMOKE',
    `Status: ${gate.status}`,
    `Documents: ${gate.documents.map((doc) => `${doc.documentId}:${doc.status}`).join(' | ')}`,
    `Decision: ${gate.releaseDecision}`,
  ].join('\n');
}
