export type F139AuditStatus = 'ready-with-ocr-blockers' | 'blocked' | 'ready';

export interface F139OcrPendingItem {
  id: string;
  title: string;
  pages: number;
  sha256: string | null;
  requiredAction: string;
}

export interface F139MaterialCitationOcrAudit {
  phase: 'F139';
  status: F139AuditStatus;
  databaseChecks: string[];
  citationChecks: string[];
  duplicateChecks: string[];
  ocrPending: F139OcrPendingItem[];
  resubmissionRequest: string[];
  nextPhase: string;
  decision: string;
}

export function buildF139MaterialCitationOcrAudit(
  status: F139AuditStatus = 'ready',
): F139MaterialCitationOcrAudit {
  return {
    phase: 'F139',
    status,
    databaseChecks: [
      'Read back every f138-* source from document_chunks.',
      'Verify chunk count by source against the F138 manifest.',
      'Confirm source scope uses only f138-* material evidence rows.',
      'Confirm live seed did not require deleting non-F138 knowledge.',
    ],
    citationChecks: [
      'Every inserted chunk must keep page_ref.',
      'Every inserted chunk must carry a hash tag.',
      'Every inserted chunk must keep modality Materials.',
      'Vendor values remain evidence, not certified calculation constants until reviewed.',
    ],
    duplicateChecks: [
      'Exact SHA-256 duplicate detection across uploaded material PDFs.',
      'Source duplicate detection in document_chunks.',
      'Semantic warning for similar TD-500/TD-550 TVL values requiring human review.',
      'Former OCR blockers were recovered in F141 and remain traceable through source/page/hash checks.',
    ],
    ocrPending: [],
    resubmissionRequest: [
      'No material OCR blockers remain after F141.',
      'Optional: OCR-review ScanPRO pages 2 and 10 because they still have no extracted text.',
      'Optional: vendor revision sheet resolving TD-500 versus TD-550 density/TVL interpretation before using values as calculation constants.',
    ],
    nextPhase: 'F140 documentation suite or F142 Memoria IA material evidence',
    decision:
      'F139 accepts the F138/F141 live material seed for RAG use and requires human review before promoting vendor TVL values into certified calculation defaults.',
  };
}
