export type F129DocumentAction = 'seed-ready' | 'needs-ocr' | 'missing-source' | 'dedupe-preferred' | 'dedupe-suppressed';

export interface F129DocumentSeedItem {
  id: string;
  title: string;
  standard: string;
  kind: 'normative' | 'analytic-memory' | 'generic';
  action: F129DocumentAction;
  chunks: number;
  sha256: string | null;
  note: string;
}

export interface F129DocumentSeedReadiness {
  phase: 'F129';
  status: 'db-ready-with-blockers';
  seedMode: 'dry-run-until-mysql';
  totals: {
    documents: number;
    seedReady: number;
    chunksReady: number;
    needsOcr: number;
    missingSources: number;
    semanticDuplicateGroups: number;
  };
  canonicalSeedStandards: string[];
  blockers: string[];
  items: F129DocumentSeedItem[];
  mysqlNextSteps: string[];
  decision: string;
}

export const F129_CANONICAL_SEED_ITEMS: F129DocumentSeedItem[] = [
  {
    id: 'ncrp-147-medical-xray-desktop',
    title: 'Structural Shielding Design for Medical X-Ray Imaging Facilities',
    standard: 'NCRP-147',
    kind: 'normative',
    action: 'seed-ready',
    chunks: 124,
    sha256: 'f28f2c5dc2bbed7d4066ba4532dda1ba0fab5507fed8e9844f8f4f499a05b0a6',
    note: 'Canonical local source replaces inaccessible H: drive duplicate.',
  },
  {
    id: 'iaea-srs-47-radiotherapy-facilities-desktop',
    title: 'Radiation Protection in the Design of Radiotherapy Facilities',
    standard: 'IAEA-SRS-47',
    kind: 'normative',
    action: 'seed-ready',
    chunks: 82,
    sha256: '029074d26d6f6f7958b6f9afe2c181de846ebc4e8712a5ff18b7c61527f19fa5',
    note: 'Canonical local source replaces inaccessible H: drive duplicate.',
  },
  {
    id: 'zumaya-memoria-pet',
    title: 'Entregable Memoria PET Zumaya',
    standard: 'MEMORIA-PET',
    kind: 'analytic-memory',
    action: 'seed-ready',
    chunks: 3,
    sha256: 'bc585c225affebee53f06183b61bd9e29048c2228867ae483e14cbf1a528f93f',
    note: 'Ready for RAG examples and analytic-memory pattern extraction.',
  },
  {
    id: 'zumaya-memoria-hdr-braqui',
    title: 'Entregable Memoria HDR Braqui Zumaya',
    standard: 'MEMORIA-HDR',
    kind: 'analytic-memory',
    action: 'seed-ready',
    chunks: 3,
    sha256: '2a8f0f487cfa0ea72cb1b2f0d9c136b48e729261475755942b79c90a91f86910',
    note: 'Ready for RAG examples and HDR report pattern extraction.',
  },
  {
    id: 'zumaya-informe-sr-permiso-al-hdr',
    title: 'Informe de SR Permiso de C AL HDR Zumaya',
    standard: 'MEMORIA-HDR-LINAC',
    kind: 'analytic-memory',
    action: 'seed-ready',
    chunks: 6,
    sha256: '5d2bdca2bd087e06dd64cdaaa7f2fdf14592d66148a3e277e6ebbd6b0f313865',
    note: 'Ready for RAG examples spanning LINAC/HDR permit evidence.',
  },
  {
    id: 'zumaya-informe-anual-gamma-knife-2024',
    title: 'Informe Anual Gamma Knife 2024',
    standard: 'MEMORIA-GAMMA-KNIFE',
    kind: 'analytic-memory',
    action: 'seed-ready',
    chunks: 11,
    sha256: '9fad1ab70ca79d0b63e282dd3b8e734613cdf1574dda6cdb112a8fbcc7f13965',
    note: 'Ready, but extractedPages is partial; prioritize spot-checking before release training use.',
  },
  {
    id: 'ncrp-49-structural-shielding',
    title: 'NCRP Report No. 49 - Structural Shielding Design and Evaluation',
    standard: 'NCRP-49',
    kind: 'normative',
    action: 'needs-ocr',
    chunks: 0,
    sha256: '5213a557cd6bf1b08cc2c71ec4de8b1741d6fe48cfa8a7bab62ccb8f3f2f82f7',
    note: 'Scanned/no text. Needs OCR before seed.',
  },
  {
    id: 'zumaya-memoria-al',
    title: 'Entregable Memoria AL Zumaya',
    standard: 'MEMORIA-LINAC',
    kind: 'analytic-memory',
    action: 'needs-ocr',
    chunks: 0,
    sha256: '123c36edae2ee9c9b31a558fcdc2a8429c588f9ec971497792e0fa8fd1a4ecaf',
    note: 'Scanned/no text. Needs OCR before seed.',
  },
  {
    id: 'ncrp-144-particle-accelerators',
    title: 'Radiation Protection for Particle Accelerators',
    standard: 'NCRP-144',
    kind: 'normative',
    action: 'missing-source',
    chunks: 0,
    sha256: null,
    note: 'Original H: drive source was not accessible in this workspace.',
  },
];

export function buildF129DocumentSeedReadiness(): F129DocumentSeedReadiness {
  const seedReady = F129_CANONICAL_SEED_ITEMS.filter((item) => item.action === 'seed-ready');
  const needsOcr = F129_CANONICAL_SEED_ITEMS.filter((item) => item.action === 'needs-ocr');
  const missingSources = F129_CANONICAL_SEED_ITEMS.filter((item) => item.action === 'missing-source');

  return {
    phase: 'F129',
    status: 'db-ready-with-blockers',
    seedMode: 'dry-run-until-mysql',
    totals: {
      documents: 11,
      seedReady: seedReady.length,
      chunksReady: seedReady.reduce((sum, item) => sum + item.chunks, 0),
      needsOcr: needsOcr.length,
      missingSources: missingSources.length,
      semanticDuplicateGroups: 2,
    },
    canonicalSeedStandards: [...new Set(seedReady.map((item) => item.standard))],
    blockers: [
      'MySQL/DATABASE_URL live seed is pending Windows MySQL installation.',
      'OCR is still required for NCRP-49 and Memoria AL before complete knowledge seed.',
      'H: drive originals remain inaccessible; local Desktop/ZUMAYA copies are canonical where available.',
    ],
    items: F129_CANONICAL_SEED_ITEMS,
    mysqlNextSteps: [
      'Install MySQL 8 Windows Service.',
      'Set DATABASE_URL for radshield_mx.',
      'Run db preflight, migrations, dry-run seed, then live seed with explicit flag.',
      'Verify document row count, chunk count, duplicate groups and citation hashes.',
    ],
    decision:
      'F129 freezes a safe document seed manifest while DB is unavailable: seed only canonical prepared documents, keep OCR and missing-source blockers explicit, and avoid duplicate NCRP/IAEA ingestion.',
  };
}
