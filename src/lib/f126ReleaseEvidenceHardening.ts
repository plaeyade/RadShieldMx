import {
  buildEvidenceCitationLedger,
  type EvidenceCitationLedgerEntry,
  type EvidenceSource,
} from '@/lib/evidencePack';

export interface F126ReleaseEvidenceItem {
  sourceId: string;
  title: string;
  hasClaim: boolean;
  hasDocumentId: boolean;
  hasPageOrSection: boolean;
  hasHash: boolean;
  verificationStatus: string;
  releaseReady: boolean;
}

export interface F126ReleaseEvidenceHardening {
  phase: 'F126';
  status: 'implemented-release-evidence-hardening';
  total: number;
  releaseReady: number;
  missingDocumentId: number;
  missingPageOrSection: number;
  missingHash: number;
  unverified: number;
  readyForReleaseCandidate: boolean;
  requiredFields: string[];
  items: F126ReleaseEvidenceItem[];
  nextPhase: 'F127';
  decision: string;
}

function itemFromLedger(entry: EvidenceCitationLedgerEntry): F126ReleaseEvidenceItem {
  const hasClaim = Boolean(entry.claimId);
  const hasDocumentId = Boolean(entry.documentId);
  const hasPageOrSection = Boolean(entry.pageRef || entry.sectionRef);
  const hasHash = Boolean(entry.excerptHash);
  const verificationStatus = entry.verificationStatus || 'draft';
  const releaseReady = hasClaim && hasDocumentId && hasPageOrSection && hasHash && verificationStatus !== 'draft';

  return {
    sourceId: entry.sourceId,
    title: entry.title,
    hasClaim,
    hasDocumentId,
    hasPageOrSection,
    hasHash,
    verificationStatus,
    releaseReady,
  };
}

export function buildF126ReleaseEvidenceHardening(
  sources: EvidenceSource[] = [],
  ledger: EvidenceCitationLedgerEntry[] = [],
): F126ReleaseEvidenceHardening {
  const normalizedLedger = ledger.length > 0 ? ledger : buildEvidenceCitationLedger(sources);
  const items = normalizedLedger.map(itemFromLedger);
  const releaseReady = items.filter(item => item.releaseReady).length;
  const missingDocumentId = items.filter(item => !item.hasDocumentId).length;
  const missingPageOrSection = items.filter(item => !item.hasPageOrSection).length;
  const missingHash = items.filter(item => !item.hasHash).length;
  const unverified = items.filter(item => item.verificationStatus === 'draft').length;
  const total = items.length;

  return {
    phase: 'F126',
    status: 'implemented-release-evidence-hardening',
    total,
    releaseReady,
    missingDocumentId,
    missingPageOrSection,
    missingHash,
    unverified,
    readyForReleaseCandidate: total > 0 && releaseReady === total,
    requiredFields: ['claimId', 'documentId', 'pageRef-or-sectionRef', 'excerptHash', 'verificationStatus-reviewed-or-verified'],
    items,
    nextPhase: 'F127',
    decision:
      'Release candidate evidence requires documentId, page or section reference, excerpt hash and reviewed/verified status for each citation-ledger item.',
  };
}

export function buildF126ReleaseEvidenceSection(
  sources: EvidenceSource[] = [],
  ledger: EvidenceCitationLedgerEntry[] = [],
): string {
  const gate = buildF126ReleaseEvidenceHardening(sources, ledger);
  return [
    '9. GATE F126 EVIDENCIA PARA RELEASE',
    `   Fuentes en ledger: ${gate.total}`,
    `   Listas para release: ${gate.releaseReady}`,
    `   Sin documentId: ${gate.missingDocumentId}`,
    `   Sin pagina/seccion: ${gate.missingPageOrSection}`,
    `   Sin hash: ${gate.missingHash}`,
    `   En borrador: ${gate.unverified}`,
    `   Release candidate: ${gate.readyForReleaseCandidate ? 'listo' : 'pendiente'}`,
    `   Campos obligatorios: ${gate.requiredFields.join(', ')}`,
    ...gate.items.slice(0, 12).map(item => `   - ${item.title || item.sourceId}: ${item.releaseReady ? 'READY' : 'REVIEW'} | ${item.verificationStatus}`),
    `   Decision: ${gate.decision}`,
  ].join('\n');
}
