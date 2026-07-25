export type F269OcrProviderId = 'google-document-ai' | 'amazon-textract' | 'local-free-ocr';

export interface F269OcrPendingDocument {
  documentId: string;
  title: string;
  sourcePath: string;
  reason: 'needs-ocr' | 'low-text-yield';
  canonicalAction: string;
}

export interface F269OcrProviderGate {
  id: F269OcrProviderId;
  role: 'primary-layout-ocr' | 'fallback-table-form-ocr';
  status: 'server-only-waiting-for-credentials' | 'ready-to-smoke' | 'deferred-cost-rollback' | 'local-free-preferred';
  requiredSecrets: string[];
  acceptedInputs: string[];
  expectedOutputs: string[];
  safetyControls: string[];
}

export interface F269OcrCloudAdapterGate {
  phase: 'F269';
  status: 'ocr-cloud-adapter-gate-ready';
  providers: F269OcrProviderGate[];
  pendingDocuments: F269OcrPendingDocument[];
  smokePolicy: string[];
  releaseDecision: string;
}

export const F269_DEFAULT_PENDING_DOCUMENTS: F269OcrPendingDocument[] = [
  {
    documentId: 'memoria-lab-prod-impsa-2309',
    title: '2309 MA LAB PROD IMPSA...',
    sourcePath: 'C:/Users/carlo/Downloads/RadShield Mx/2309 MA LAB PROD IMPSA...pdf',
    reason: 'needs-ocr',
    canonicalAction: 'Use local/free OCR first. Cloud OCR is deferred because Document AI and Textract may have per-page cost.',
  },
  {
    documentId: 'memoria-ciclotron-kiube-impsa-2309',
    title: '2309 MA CICLOTRON KIUBE IMPSA.. (1)',
    sourcePath: 'C:/Users/carlo/Downloads/RadShield Mx/2309 MA CICLOTRON KIUBE IMPSA.. (1).pdf',
    reason: 'needs-ocr',
    canonicalAction: 'Run local/free OCR, preserve page map, then re-enter dedupe/hash and RAG chunk pipeline before Memoria IA use.',
  },
];

export function buildF269OcrCloudAdapterGate(configuredSecrets: Record<string, boolean> = {}): F269OcrCloudAdapterGate {
  const googleSecrets = [
    'GOOGLE_APPLICATION_CREDENTIALS',
    'GOOGLE_DOCUMENTAI_PROJECT_ID',
    'GOOGLE_DOCUMENTAI_LOCATION',
    'GOOGLE_DOCUMENTAI_PROCESSOR_ID',
  ];
  const textractSecrets = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_TEXTRACT_BUCKET'];
  return {
    phase: 'F269',
    status: 'ocr-cloud-adapter-gate-ready',
    providers: [
      {
        id: 'google-document-ai',
        role: 'primary-layout-ocr',
        status: 'deferred-cost-rollback',
        requiredSecrets: googleSecrets,
        acceptedInputs: ['pdf', 'tiff', 'png'],
        expectedOutputs: ['text', 'page-layout', 'tables', 'confidence', 'source-page-map', 'provider-operation-id'],
        safetyControls: [
          'Backend or operator runner only.',
          'No VITE_* secrets.',
          'Hash source PDF and OCR output before DB write.',
          'Never send PHI to public/static frontend.',
        ],
      },
      {
        id: 'amazon-textract',
        role: 'fallback-table-form-ocr',
        status: 'deferred-cost-rollback',
        requiredSecrets: textractSecrets,
        acceptedInputs: ['pdf', 'tiff', 'png', 'jpg'],
        expectedOutputs: ['text', 'tables', 'forms', 'confidence', 'blocks-json', 'source-page-map'],
        safetyControls: [
          'Use only as fallback or comparison route.',
          'Record cost/region/provider in OCR manifest.',
          'Keep raw provider blocks outside the static frontend package.',
          'Re-chunk OCR output through dedupe before live DB seed.',
        ],
      },
      {
        id: 'local-free-ocr',
        role: 'primary-layout-ocr',
        status: 'local-free-preferred',
        requiredSecrets: [],
        acceptedInputs: ['pdf', 'png', 'tiff', 'jpg'],
        expectedOutputs: ['text', 'page-map', 'confidence-if-available', 'source-hash', 'ocr-engine-version'],
        safetyControls: [
          'No cloud upload.',
          'No per-page cloud cost.',
          'Use Tesseract/OCRmyPDF/Poppler/PDF.js pipeline before considering paid OCR.',
          'Review OCR confidence and page map before DB seed.',
        ],
      },
    ],
    pendingDocuments: F269_DEFAULT_PENDING_DOCUMENTS,
    smokePolicy: [
      'Use the two known OCR-pending analytic memories from F268 as the controlled fixture set.',
      'Prefer local/free OCR before any paid provider.',
      'OCR output must preserve page number, confidence, text hash and original file hash.',
      'A successful live OCR smoke does not automatically overwrite canonical chunks; it creates reviewable draft chunks.',
      'Memoria IA can cite OCR-derived content only after page confidence and human review status are present.',
    ],
    releaseDecision:
      'F269 cloud OCR is rolled back for cost control. Local/free OCR is preferred; cloud OCR remains an explicit last-resort route only after operator approval.',
  };
}

export function summarizeF269OcrCloudAdapterGate(): string {
  const gate = buildF269OcrCloudAdapterGate();
  return [
    'F269 OCR CLOUD ADAPTER GATE',
    `Status: ${gate.status}`,
    `Providers: ${gate.providers.map((provider) => `${provider.id}:${provider.status}`).join(' | ')}`,
    `Pending OCR docs: ${gate.pendingDocuments.map((doc) => doc.documentId).join(' | ')}`,
    `Decision: ${gate.releaseDecision}`,
  ].join('\n');
}
