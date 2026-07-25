export type F268aProviderId =
  | 'google-document-ai'
  | 'amazon-textract'
  | 'crossref'
  | 'semantic-scholar'
  | 'oda-drawings-sdk'
  | 'aps-design-automation'
  | 'gate-opengate'
  | 'geant4'
  | 'egsnrc-egs-brachy';

export type F268aProviderCategory = 'ocr' | 'literature' | 'cad' | 'monte-carlo';
export type F268aProviderStatus = 'ready-to-configure' | 'server-only' | 'external-engine' | 'deferred-post-release';

export interface F268aExternalProvider {
  id: F268aProviderId;
  category: F268aProviderCategory;
  label: string;
  status: F268aProviderStatus;
  bestUse: string;
  requiredSecrets: string[];
  safeFrontendExposure: false | 'public-status-only';
  acceptedInputs: string[];
  outputs: string[];
  releaseGate: string;
}

export interface F268aExternalApiReadiness {
  phase: 'F268A';
  status: 'api-readiness-gate-implemented';
  providers: F268aExternalProvider[];
  nextPhases: string[];
  nonNegotiableControls: string[];
  releaseDecision: string;
}

export const F268A_EXTERNAL_PROVIDERS: F268aExternalProvider[] = [
  {
    id: 'google-document-ai',
    category: 'ocr',
    label: 'Google Document AI',
    status: 'server-only',
    bestUse: 'OCR/layout/table extraction for scanned NCRP/IAEA/material PDFs and analytic memories.',
    requiredSecrets: ['GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_DOCUMENTAI_PROJECT_ID', 'GOOGLE_DOCUMENTAI_LOCATION', 'GOOGLE_DOCUMENTAI_PROCESSOR_ID'],
    safeFrontendExposure: 'public-status-only',
    acceptedInputs: ['pdf', 'tiff', 'png'],
    outputs: ['text', 'page-layout', 'tables', 'confidence', 'source-page-map'],
    releaseGate: 'F269 OCR cloud smoke with non-sensitive searchable/scan fixture.',
  },
  {
    id: 'amazon-textract',
    category: 'ocr',
    label: 'Amazon Textract',
    status: 'server-only',
    bestUse: 'OCR/forms/tables fallback for reports, checklists and scanned memorias.',
    requiredSecrets: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_TEXTRACT_BUCKET'],
    safeFrontendExposure: 'public-status-only',
    acceptedInputs: ['pdf', 'tiff', 'png', 'jpg'],
    outputs: ['text', 'tables', 'forms', 'confidence', 'blocks-json'],
    releaseGate: 'F269B Textract fallback smoke with explicit cost/PHI warning.',
  },
  {
    id: 'crossref',
    category: 'literature',
    label: 'Crossref REST API',
    status: 'ready-to-configure',
    bestUse: 'DOI metadata, journal provenance and bibliography normalization for Memoria IA.',
    requiredSecrets: [],
    safeFrontendExposure: 'public-status-only',
    acceptedInputs: ['doi', 'title', 'author', 'year'],
    outputs: ['metadata', 'doi', 'publisher', 'journal', 'reference-list'],
    releaseGate: 'F271 literature metadata smoke; never auto-updates calculation constants.',
  },
  {
    id: 'semantic-scholar',
    category: 'literature',
    label: 'Semantic Scholar API',
    status: 'ready-to-configure',
    bestUse: 'Deep-dive literature graph, citations and related work for evidence review.',
    requiredSecrets: ['SEMANTIC_SCHOLAR_API_KEY optional'],
    safeFrontendExposure: 'public-status-only',
    acceptedInputs: ['doi', 'paper-id', 'title-query'],
    outputs: ['paper-metadata', 'citations', 'references', 'abstract'],
    releaseGate: 'F271 literature deep-dive smoke with source ranking and hallucination guardrails.',
  },
  {
    id: 'oda-drawings-sdk',
    category: 'cad',
    label: 'ODA Drawings SDK',
    status: 'deferred-post-release',
    bestUse: 'Private/enterprise DWG/DGN/DXF conversion when APS cloud is not acceptable.',
    requiredSecrets: ['ODA_SERVICE_URL', 'ODA_API_KEY'],
    safeFrontendExposure: 'public-status-only',
    acceptedInputs: ['dwg', 'dgn', 'dxf'],
    outputs: ['dxf', 'svg', 'ifc', 'pdf', 'png'],
    releaseGate: 'Post-release private service smoke; keep manual DXF fallback.',
  },
  {
    id: 'aps-design-automation',
    category: 'cad',
    label: 'Autodesk Platform Services Design Automation',
    status: 'server-only',
    bestUse: 'Primary DWG->DXF conversion preserving AutoCAD layer/block semantics.',
    requiredSecrets: ['DWG_CONVERSION_PROVIDER', 'APS_CLIENT_ID', 'APS_CLIENT_SECRET', 'APS_BUCKET_KEY'],
    safeFrontendExposure: 'public-status-only',
    acceptedInputs: ['dwg'],
    outputs: ['dxf', 'svg', 'pdf'],
    releaseGate: 'F270 APS DWG smoke with non-sensitive fixture and layer/scale audit.',
  },
  {
    id: 'gate-opengate',
    category: 'monte-carlo',
    label: 'GATE / OpenGATE',
    status: 'external-engine',
    bestUse: 'Primary medical Monte Carlo external engine for NM/PET/SPECT/radiotherapy scenarios.',
    requiredSecrets: ['GATE_RUNNER_URL optional', 'GATE_RUNNER_TOKEN optional'],
    safeFrontendExposure: 'public-status-only',
    acceptedInputs: ['geometry.gdml', 'materials.json', 'sources.json', 'gate.py'],
    outputs: ['dose-map', 'actors', 'uncertainty', 'run-manifest'],
    releaseGate: 'F272 external MC export/import smoke; not required for static frontend release.',
  },
  {
    id: 'geant4',
    category: 'monte-carlo',
    label: 'Geant4',
    status: 'external-engine',
    bestUse: 'General transport, GDML geometry, shielding studies and scoring mesh.',
    requiredSecrets: ['GEANT4_RUNNER_URL optional', 'GEANT4_RUNNER_TOKEN optional'],
    safeFrontendExposure: 'public-status-only',
    acceptedInputs: ['gdml', 'mac', 'materials.gdml'],
    outputs: ['dose.csv', 'flux.csv', 'summary.json'],
    releaseGate: 'F272 external runner smoke with version/physics-list/hash evidence.',
  },
  {
    id: 'egsnrc-egs-brachy',
    category: 'monte-carlo',
    label: 'EGSnrc / egs_brachy',
    status: 'external-engine',
    bestUse: 'Photon/electron and brachytherapy specialized validation for HDR/Co-60/Ir-192 cases.',
    requiredSecrets: ['EGSNRC_RUNNER_URL optional', 'EGSNRC_RUNNER_TOKEN optional'],
    safeFrontendExposure: 'public-status-only',
    acceptedInputs: ['egsinp', 'egsgeom', 'source-model'],
    outputs: ['3ddose', 'egsdat', 'statdose.csv'],
    releaseGate: 'F272B EGSnrc/egs_brachy smoke against a known brachy fixture.',
  },
];

export function buildF268aExternalApiReadiness(): F268aExternalApiReadiness {
  return {
    phase: 'F268A',
    status: 'api-readiness-gate-implemented',
    providers: F268A_EXTERNAL_PROVIDERS,
    nextPhases: [
      'F269 OCR cloud adapter smoke: Google Document AI primary, Textract fallback.',
      'F270 APS DWG fixture smoke; ODA remains private post-release route.',
      'F271 literature deep-dive: Crossref + Semantic Scholar metadata and citation ranking.',
      'F272 external Monte Carlo runner contracts: GATE/OpenGATE/Geant4/EGSnrc.',
    ],
    nonNegotiableControls: [
      'No secrets in VITE_* or static frontend.',
      'All cloud OCR/CAD/MC calls go through backend or operator runner.',
      'Hash every input/output and preserve page/layer/run metadata.',
      'No PHI/private plans on public static host.',
      'External MC results must include engine version, physics list/data library, seed, histories, uncertainty and run manifest.',
    ],
    releaseDecision:
      'F268A adds API/motor readiness without turning on live external calls. Static frontend can remain stable; live adapters require backend credentials and fixture smokes.',
  };
}

export function summarizeF268aExternalApiReadiness(): string {
  const gate = buildF268aExternalApiReadiness();
  const providers = gate.providers.map((provider) => `${provider.id}:${provider.status}`).join(' | ');
  return [
    'F268A EXTERNAL API READINESS',
    `Status: ${gate.status}`,
    `Providers: ${providers}`,
    `Controls: ${gate.nonNegotiableControls.join(' | ')}`,
    `Decision: ${gate.releaseDecision}`,
  ].join('\n');
}
