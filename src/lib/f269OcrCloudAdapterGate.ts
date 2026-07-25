export type F269OcrProviderId = 'google-document-ai' | 'amazon-textract';

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
  status: 'server-only-waiting-for-credentials' | 'ready-to-smoke';
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
    canonicalAction: 'Run Google Document AI first, then Textract fallback only if page/table confidence is insufficient.',
  },
  {
    documentId: 'memoria-ciclotron-kiube-impsa-2309',
    title: '2309 MA CICLOTRON KIUBE IMPSA.. (1)',
    sourcePath: 'C:/Users/carlo/Downloads/RadShield Mx/2309 MA CICLOTRON KIUBE IMPSA.. (1).pdf',
    reason: 'needs-ocr',
    canonicalAction: 'Run OCR, preserve page map, then re-enter dedupe/hash and RAG chunk pipeline before Memoria IA use.',
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
  const hasGoogle = googleSecrets.every((secret) => configuredSecrets[secret]);
  const hasTextract = textractSecrets.every((secret) => configuredSecrets[secret]);

  return {
    phase: 'F269',
    status: 'ocr-cloud-adapter-gate-ready',
    providers: [
      {
        id: 'google-document-ai',
        role: 'primary-layout-ocr',
        status: hasGoogle ? 'ready-to-smoke' : 'server-only-waiting-for-credentials',
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
        status: hasTextract ? 'ready-to-smoke' : 'server-only-waiting-for-credentials',
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
    ],
    pendingDocuments: F269_DEFAULT_PENDING_DOCUMENTS,
    smokePolicy: [
      'Use the two known OCR-pending analytic memories from F268 as the controlled fixture set.',
      'OCR output must preserve page number, confidence, text hash and original file hash.',
      'A successful live OCR smoke does not automatically overwrite canonical chunks; it creates reviewable draft chunks.',
      'Memoria IA can cite OCR-derived content only after page confidence and human review status are present.',
    ],
    releaseDecision:
      'F269 closes the OCR adapter design gate. Live OCR remains blocked until backend credentials are configured and the fixture smoke is run outside the static frontend.',
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
