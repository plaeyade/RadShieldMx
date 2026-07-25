export interface F281FullLocalOcrDocument {
  documentId: string;
  status: 'full-local-ocr-draft-ready' | 'native-text-ready' | 'full-local-ocr-warning' | 'missing-source' | 'duplicate-suppressed';
  pagesProcessed: number;
  pagesTotal: number;
  nativePages: number;
  ocrPages: number;
  textChars: number;
  warnings: string[];
}

export interface F281FullLocalOcr {
  phase: 'F281';
  status: 'full-local-ocr-draft';
  paidCloudOcrUsed: false;
  seedDbAutomatically: false;
  spanishOcrOperational: boolean;
  documents: F281FullLocalOcrDocument[];
  outputArtifacts: string[];
  releaseDecision: string;
}

export function buildF281FullLocalOcrSummary(): F281FullLocalOcr {
  return {
    phase: 'F281',
    status: 'full-local-ocr-draft',
    paidCloudOcrUsed: false,
    seedDbAutomatically: false,
    spanishOcrOperational: false,
    documents: [
      {
        documentId: 'real-analytic-memories-folder',
        status: 'full-local-ocr-warning',
        pagesProcessed: 0,
        pagesTotal: 0,
        nativePages: 0,
        ocrPages: 0,
        textChars: 0,
        warnings: ['Run prepare:f281:full-local-ocr to generate full local OCR/text evidence.'],
      },
    ],
    outputArtifacts: [
      'outputs/f281_full_local_ocr/f281_full_local_ocr.json',
      'outputs/f281_full_local_ocr/f281_full_local_ocr_pages.jsonl',
      'outputs/f281_full_local_ocr/text/*.txt',
      'outputs/fase_281_full_local_ocr.md',
    ],
    releaseDecision:
      'F281 completes local hybrid OCR/text extraction for real analytic memories and keeps results as draft evidence until page-level QA/dedup approves DB/RAG seed.',
  };
}

export function summarizeF281FullLocalOcr(): string {
  const gate = buildF281FullLocalOcrSummary();
  return [
    'F281 FULL LOCAL OCR',
    `Status: ${gate.status}`,
    `Paid cloud OCR: ${gate.paidCloudOcrUsed ? 'yes' : 'no'}`,
    `DB seed automatico: ${gate.seedDbAutomatically ? 'yes' : 'no'}`,
    `Spanish OCR operational: ${gate.spanishOcrOperational ? 'yes' : 'no'}`,
    `Artifacts: ${gate.outputArtifacts.join(' | ')}`,
    `Decision: ${gate.releaseDecision}`,
  ].join('\n');
}
