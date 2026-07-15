export type EvidenceSourceType =
  | 'official'
  | 'regulatory'
  | 'standard'
  | 'manufacturer'
  | 'peerReviewed'
  | 'technicalReport'
  | 'other';

export type EvidenceConfidence = 'high' | 'medium' | 'low';
export type EvidenceVerificationStatus = 'draft' | 'reviewed' | 'verified';

export interface EvidenceSource {
  id: string;
  title: string;
  url: string;
  sourceType: EvidenceSourceType;
  capturedAt: string;
  author?: string;
  publishedDate?: string;
  claim: string;
  excerpt: string;
  notes: string;
  confidence: EvidenceConfidence;
  tags: string[];
  claimId?: string;
  documentId?: string;
  pageRef?: string;
  sectionRef?: string;
  excerptHash?: string;
  verificationStatus?: EvidenceVerificationStatus;
}

export interface EvidencePack {
  schemaVersion: 'radshield-evidence-pack-v1';
  packId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  objective: string;
  sources: EvidenceSource[];
  citationLedger: EvidenceCitationLedgerEntry[];
  integrationNotes: {
    fsb: string;
    browserbase: string;
    revit: string;
    cadx: string;
    cadCodeVerify: string;
    idacDose: string;
  };
}

export interface EvidenceCitationLedgerEntry {
  sourceId: string;
  claimId: string;
  title: string;
  sourceType: EvidenceSourceType;
  confidence: EvidenceConfidence;
  documentId: string;
  pageRef: string;
  sectionRef: string;
  excerptHash: string;
  verificationStatus: EvidenceVerificationStatus;
}

export const EVIDENCE_PACK_SCHEMA_VERSION = 'radshield-evidence-pack-v1' as const;

export function hashEvidenceExcerpt(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function slugId(value: string, fallback: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  return slug || fallback;
}

export function createEvidenceSource(partial: Partial<EvidenceSource> = {}): EvidenceSource {
  const now = new Date().toISOString();
  const title = partial.title || '';
  const excerpt = partial.excerpt || '';
  const id = partial.id || `ev-${Date.now()}`;
  return {
    id,
    title,
    url: partial.url || '',
    sourceType: partial.sourceType || 'official',
    capturedAt: partial.capturedAt || now,
    author: partial.author || '',
    publishedDate: partial.publishedDate || '',
    claim: partial.claim || '',
    excerpt,
    notes: partial.notes || '',
    confidence: partial.confidence || 'medium',
    tags: partial.tags || [],
    claimId: partial.claimId || `claim-${slugId(title || id, 'evidence')}`,
    documentId: partial.documentId || slugId(title || partial.url || id, 'documento'),
    pageRef: partial.pageRef || '',
    sectionRef: partial.sectionRef || '',
    excerptHash: partial.excerptHash || hashEvidenceExcerpt(excerpt || partial.claim || title || id),
    verificationStatus: partial.verificationStatus || 'draft',
  };
}

export function buildEvidenceCitationLedger(sources: EvidenceSource[]): EvidenceCitationLedgerEntry[] {
  return sources.map((source) => ({
    sourceId: source.id,
    claimId: source.claimId || `claim-${slugId(source.title || source.id, 'evidence')}`,
    title: source.title,
    sourceType: source.sourceType,
    confidence: source.confidence,
    documentId: source.documentId || slugId(source.title || source.url || source.id, 'documento'),
    pageRef: source.pageRef || '',
    sectionRef: source.sectionRef || '',
    excerptHash: source.excerptHash || hashEvidenceExcerpt(source.excerpt || source.claim || source.title || source.id),
    verificationStatus: source.verificationStatus || 'draft',
  }));
}

export function createEvidencePack(projectName = 'RadShield-MX'): EvidencePack {
  const now = new Date().toISOString();
  const sources = [
    createEvidenceSource({
      id: 'ev-template-1',
      title: 'NCRP Report No. 151',
      url: 'https://ncrponline.org/publications/reports/ncrp-report-151/',
      sourceType: 'standard',
      claim: 'Referencia base para diseno de blindajes en instalaciones de megavoltaje.',
      excerpt: 'Registrar aqui el fragmento breve permitido o resumen tecnico verificable.',
      notes: 'Plantilla inicial. Reemplazar o complementar con captura validada.',
      confidence: 'high',
      tags: ['NCRP', 'LINAC', 'blindaje'],
      documentId: 'ncrp-151',
      sectionRef: 'Structural shielding design',
      verificationStatus: 'reviewed',
    }),
  ];

  return {
    schemaVersion: EVIDENCE_PACK_SCHEMA_VERSION,
    packId: `pack-${Date.now()}`,
    projectName,
    createdAt: now,
    updatedAt: now,
    objective: 'Sustentar memoria analitica con fuentes trazables, verificables y auditables.',
    sources,
    citationLedger: buildEvidenceCitationLedger(sources),
    integrationNotes: {
      fsb: 'Integracion externa futura: navegador supervisado por MCP para navegar, leer DOM y capturar evidencia sin usarlo como scraper autonomo.',
      browserbase: 'Integracion externa futura: Search/Fetch/Browser Trace con API key para busqueda estructurada, capturas auditables y deep dives reproducibles.',
      revit: 'Integracion externa futura: Revit/Autodesk como fuente BIM; importar IFC/DXF ahora y evaluar RVT nativo, Revit Add-in o Autodesk Platform Services despues.',
      cadx: 'Integracion externa futura: CADx Studio como motor AI design/render en navegador; exportar briefs auditables desde Medical 3D sin mezclar render generativo con calculo regulatorio.',
      cadCodeVerify: 'Integracion inspirada en paper: CADCodeVerify para verificacion de escenas 3D mediante preguntas, respuestas y feedback; VLM externo queda para fase posterior.',
      idacDose: 'Integracion por fases: IDAC-Dose 2.2 como referencia externa para dosimetria interna diagnostica con ICRP 133/155; RadShield exporta paquetes de comparacion y no reemplaza coeficientes validados.',
    },
  };
}

export function normalizeEvidencePack(value: unknown, fallbackProjectName = 'RadShield-MX'): EvidencePack {
  if (!value || typeof value !== 'object') return createEvidencePack(fallbackProjectName);
  const candidate = value as Partial<EvidencePack>;
  const now = new Date().toISOString();
  const sources = Array.isArray(candidate.sources)
    ? candidate.sources.map((source) => createEvidenceSource(source as Partial<EvidenceSource>))
    : [];
  return {
    schemaVersion: EVIDENCE_PACK_SCHEMA_VERSION,
    packId: typeof candidate.packId === 'string' ? candidate.packId : `pack-${Date.now()}`,
    projectName: typeof candidate.projectName === 'string' ? candidate.projectName : fallbackProjectName,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : now,
    updatedAt: now,
    objective: typeof candidate.objective === 'string' ? candidate.objective : 'Sustentar memoria analitica con evidencia trazable.',
    sources,
    citationLedger: Array.isArray(candidate.citationLedger)
      ? candidate.citationLedger.map((entry) => ({
        ...(entry as EvidenceCitationLedgerEntry),
        verificationStatus: (entry as EvidenceCitationLedgerEntry).verificationStatus || 'draft',
      }))
      : buildEvidenceCitationLedger(sources),
    integrationNotes: {
      fsb: candidate.integrationNotes?.fsb || createEvidencePack(fallbackProjectName).integrationNotes.fsb,
      browserbase: candidate.integrationNotes?.browserbase || createEvidencePack(fallbackProjectName).integrationNotes.browserbase,
      revit: candidate.integrationNotes?.revit || createEvidencePack(fallbackProjectName).integrationNotes.revit,
      cadx: candidate.integrationNotes?.cadx || createEvidencePack(fallbackProjectName).integrationNotes.cadx,
      cadCodeVerify: candidate.integrationNotes?.cadCodeVerify || createEvidencePack(fallbackProjectName).integrationNotes.cadCodeVerify,
      idacDose: candidate.integrationNotes?.idacDose || createEvidencePack(fallbackProjectName).integrationNotes.idacDose,
    },
  };
}

export function summarizeEvidencePack(pack: EvidencePack) {
  const byType = pack.sources.reduce<Record<string, number>>((acc, source) => {
    acc[source.sourceType] = (acc[source.sourceType] || 0) + 1;
    return acc;
  }, {});
  const highConfidence = pack.sources.filter((source) => source.confidence === 'high').length;
  const ledger = pack.citationLedger?.length ? pack.citationLedger : buildEvidenceCitationLedger(pack.sources);
  const ledgerComplete = ledger.filter((entry) => entry.claimId && entry.excerptHash && (entry.pageRef || entry.sectionRef)).length;
  const verified = ledger.filter((entry) => entry.verificationStatus === 'verified').length;
  return {
    total: pack.sources.length,
    highConfidence,
    byType,
    readyForMemory: pack.sources.filter((source) => source.title && source.url && source.claim).length,
    ledgerTotal: ledger.length,
    ledgerComplete,
    verified,
    readyForDeepDive: ledger.length > 0 && ledgerComplete === ledger.length,
  };
}
