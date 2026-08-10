import type { F484F490Standard } from '@/lib/f484F490NormativeQa';
import type { F519BarrierRole } from '@/lib/f519NormativeQaExpansion';
import {
  buildF581F585ExpandedNormativeNumericQa,
  type F581F585Modality,
} from '@/lib/f581F585ExpandedNormativeNumericQa';

export type F586F590EvidenceState = 'canonical-live' | 'canonical-pending-page' | 'supporting-memory' | 'vendor-pending';
export type F586F590PromotionState = 'promoted-for-beta-qa' | 'db-seed-required' | 'blocked-for-clinical';

export interface F586F590DatasetSource {
  id: string;
  standard: F484F490Standard;
  title: string;
  authorityRank: 1 | 2 | 3 | 4;
  pageRef: string;
  hash: string;
  evidenceState: F586F590EvidenceState;
  allowedUses: ('numeric-qa' | 'memoria-evidence' | 'db-seed-candidate')[];
}

export interface F586F590DatasetCase {
  id: string;
  phase: 'F586' | 'F587' | 'F588' | 'F589' | 'F590';
  label: string;
  modality: F581F585Modality;
  barrierRole: F519BarrierRole;
  standard: F484F490Standard;
  sourceId: string;
  sourcePage: string;
  sourceHash: string;
  tolerancePct: number;
  clinicalReviewRequired: boolean;
  promotionState: F586F590PromotionState;
  evidenceChecklist: {
    hasStandard: boolean;
    hasPageRef: boolean;
    hasHash: boolean;
    hasTolerance: boolean;
    hasClinicalWarning: boolean;
  };
}

export interface F586F590NormativeDatasetQa {
  schema: 'radshield-mx.calc.normative-dataset-qa.f586-f590.v1';
  phaseRange: 'F586-F590';
  status: 'dataset-qa-ready' | 'dataset-qa-review';
  inheritedF581F585Status: ReturnType<typeof buildF581F585ExpandedNormativeNumericQa>['status'];
  phases: { phase: string; title: string; exitCriteria: string }[];
  sources: F586F590DatasetSource[];
  cases: F586F590DatasetCase[];
  summary: {
    totalCases: number;
    promotedForBetaQa: number;
    dbSeedRequired: number;
    clinicalBlocked: number;
    canonicalSources: number;
    standardsCovered: F484F490Standard[];
    modalitiesCovered: F581F585Modality[];
    rolesCovered: F519BarrierRole[];
    maxTolerancePct: number;
  };
  gates: {
    canPublishBetaDatasetQa: boolean;
    canSeedLiveDbAutomatically: false;
    canClaimClinicalCertification: false;
    requiresDocumentChunks: true;
    requiresPageHashReview: true;
  };
  releaseBlockers: string[];
  screenshots: string[];
}

function hashText(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export const F586_F590_DATASET_SOURCES: F586F590DatasetSource[] = [
  {
    id: 'src-ncrp151-canonical',
    standard: 'NCRP151',
    title: 'NCRP 151 structural shielding design and evaluation',
    authorityRank: 1,
    pageRef: 'document_chunks:NCRP151:barrier-methods',
    hash: hashText('NCRP151|barrier-methods|primary-secondary-door-maze'),
    evidenceState: 'canonical-pending-page',
    allowedUses: ['numeric-qa', 'memoria-evidence', 'db-seed-candidate'],
  },
  {
    id: 'src-ncrp147-canonical',
    standard: 'NCRP147',
    title: 'NCRP 147 diagnostic x-ray structural shielding',
    authorityRank: 1,
    pageRef: 'document_chunks:NCRP147:diagnostic-barriers',
    hash: hashText('NCRP147|diagnostic-barriers|lead-equivalent'),
    evidenceState: 'canonical-pending-page',
    allowedUses: ['numeric-qa', 'memoria-evidence', 'db-seed-candidate'],
  },
  {
    id: 'src-iaea-srs47-canonical',
    standard: 'IAEA-SRS47',
    title: 'IAEA Safety Reports Series 47 radiotherapy facility design',
    authorityRank: 1,
    pageRef: 'document_chunks:IAEA-SRS47:radiotherapy-design',
    hash: hashText('IAEA-SRS47|radiotherapy-design|maze-neutron-cobalt'),
    evidenceState: 'canonical-pending-page',
    allowedUses: ['numeric-qa', 'memoria-evidence', 'db-seed-candidate'],
  },
  {
    id: 'src-tg108-pet-canonical',
    standard: 'AAPM-TG108',
    title: 'AAPM TG-108 PET and PET/CT shielding guidance',
    authorityRank: 2,
    pageRef: 'document_chunks:AAPM-TG108:pet-hotlab-511kev',
    hash: hashText('AAPM-TG108|pet-hotlab-511kev|source-term-screening'),
    evidenceState: 'canonical-pending-page',
    allowedUses: ['numeric-qa', 'memoria-evidence', 'db-seed-candidate'],
  },
  {
    id: 'src-uaq-memorias-realcase',
    standard: 'UAQ',
    title: 'UAQ / memorias analiticas reales versionadas',
    authorityRank: 3,
    pageRef: 'document_chunks:UAQ:real-memories-crosscheck',
    hash: hashText('UAQ|real-memories-crosscheck|linac-gammaknife-cyclotron'),
    evidenceState: 'supporting-memory',
    allowedUses: ['numeric-qa', 'memoria-evidence'],
  },
];

const SOURCE_BY_STANDARD: Partial<Record<F484F490Standard, F586F590DatasetSource>> = {
  NCRP151: F586_F590_DATASET_SOURCES[0],
  NCRP147: F586_F590_DATASET_SOURCES[1],
  'IAEA-SRS47': F586_F590_DATASET_SOURCES[2],
  'AAPM-TG108': F586_F590_DATASET_SOURCES[3],
  UAQ: F586_F590_DATASET_SOURCES[4],
};

function phaseForIndex(index: number): F586F590DatasetCase['phase'] {
  return (['F586', 'F587', 'F588', 'F589', 'F590'] as const)[Math.min(index, 4)];
}

function promotionStateForSource(source: F586F590DatasetSource): F586F590PromotionState {
  if (source.evidenceState === 'canonical-live') return 'promoted-for-beta-qa';
  if (source.allowedUses.includes('db-seed-candidate')) return 'db-seed-required';
  return 'blocked-for-clinical';
}

export function buildF586F590NormativeDatasetQa(): F586F590NormativeDatasetQa {
  const inherited = buildF581F585ExpandedNormativeNumericQa();
  const cases = inherited.results.map((result, index): F586F590DatasetCase => {
    const source = SOURCE_BY_STANDARD[result.standard] ?? F586_F590_DATASET_SOURCES[4];
    const promotionState = promotionStateForSource(source);
    return {
      id: `f586-f590-${result.caseId}`,
      phase: phaseForIndex(Math.floor(index / 2)),
      label: result.label,
      modality: result.modality,
      barrierRole: result.barrierRole,
      standard: result.standard,
      sourceId: source.id,
      sourcePage: source.pageRef,
      sourceHash: source.hash,
      tolerancePct: result.standard === 'NCRP147' || result.standard === 'AAPM-TG108' ? 0.5 : 0.25,
      clinicalReviewRequired: true,
      promotionState,
      evidenceChecklist: {
        hasStandard: Boolean(result.standard),
        hasPageRef: source.pageRef.includes('document_chunks:'),
        hasHash: source.hash.startsWith('fnv1a-'),
        hasTolerance: true,
        hasClinicalWarning: true,
      },
    };
  });
  const clinicalBlocked = cases.filter((item) => item.clinicalReviewRequired).length;
  const dbSeedRequired = cases.filter((item) => item.promotionState === 'db-seed-required').length;
  const promotedForBetaQa = cases.filter((item) => item.promotionState === 'promoted-for-beta-qa').length;
  const reviewCases = cases.filter((item) => !Object.values(item.evidenceChecklist).every(Boolean)).length;

  return {
    schema: 'radshield-mx.calc.normative-dataset-qa.f586-f590.v1',
    phaseRange: 'F586-F590',
    status: reviewCases === 0 && inherited.status === 'qa-expanded-pass' ? 'dataset-qa-ready' : 'dataset-qa-review',
    inheritedF581F585Status: inherited.status,
    phases: [
      { phase: 'F586', title: 'Fuente canonica por norma', exitCriteria: 'Cada caso F581-F585 apunta a fuente NCRP/IAEA/UAQ/AAPM concreta.' },
      { phase: 'F587', title: 'Hash y pagina', exitCriteria: 'Cada cita declara document_chunks, pageRef y hash estable antes de DB live.' },
      { phase: 'F588', title: 'Tolerancia por norma', exitCriteria: 'Cada familia tiene tolerancia numerica y warning clinico explicito.' },
      { phase: 'F589', title: 'Matriz modalidad-barrera', exitCriteria: 'Cada modalidad cubre rol de superficie: primaria/secundaria/puerta/laberinto/penetracion/zona.' },
      { phase: 'F590', title: 'Gate de promocion', exitCriteria: 'Beta QA permitida; seed live, uso clinico y certificacion siguen bloqueados.' },
    ],
    sources: F586_F590_DATASET_SOURCES,
    cases,
    summary: {
      totalCases: cases.length,
      promotedForBetaQa,
      dbSeedRequired,
      clinicalBlocked,
      canonicalSources: F586_F590_DATASET_SOURCES.filter((source) => source.authorityRank <= 2).length,
      standardsCovered: unique(cases.map((item) => item.standard)),
      modalitiesCovered: unique(cases.map((item) => item.modality)),
      rolesCovered: unique(cases.map((item) => item.barrierRole)),
      maxTolerancePct: Math.max(...cases.map((item) => item.tolerancePct)),
    },
    gates: {
      canPublishBetaDatasetQa: reviewCases === 0 && inherited.gates.canPublishBetaNumericQa,
      canSeedLiveDbAutomatically: false,
      canClaimClinicalCertification: false,
      requiresDocumentChunks: true,
      requiresPageHashReview: true,
    },
    releaseBlockers: [
      'Reemplazar pageRef simbolico por pagina real extraida desde document_chunks.',
      'Promover fuentes canonicas a canonical-live solo despues de deduplicacion y revision de hash.',
      'Correr seed/readback DB y restore probe antes de activar calculos DB-backed.',
      'Mantener certificacion clinica bloqueada hasta revision profesional y dataset ENDF/XCOM/ICRU completo.',
    ],
    screenshots: [
      'outputs/f586_f590_normative_dataset_qa/00_normative_dataset_panel.png',
      'outputs/f586_f590_normative_dataset_qa/01_normative_dataset_canvas.png',
      'outputs/f586_f590_normative_dataset_qa/02_normative_dataset_update_center.png',
    ],
  };
}

export function formatF586F590NormativeDatasetQaMarkdown(contract = buildF586F590NormativeDatasetQa()): string {
  return [
    '# F586-F590 DATASET NORMATIVO QA',
    '',
    `Estado: ${contract.status}`,
    `Casos: ${contract.summary.totalCases}`,
    `Fuentes canonicas: ${contract.summary.canonicalSources}`,
    `Seed DB requerido: ${contract.summary.dbSeedRequired}`,
    `Bloqueados para certificacion clinica: ${contract.summary.clinicalBlocked}`,
    `Normas: ${contract.summary.standardsCovered.join(', ')}`,
    '',
    '## Fases',
    ...contract.phases.map((phase) => `- ${phase.phase}: ${phase.title} - ${phase.exitCriteria}`),
    '',
    '## Casos versionados',
    ...contract.cases.map(
      (item) => `- ${item.phase} ${item.label}: ${item.standard}/${item.barrierRole}, ${item.sourcePage}, ${item.sourceHash}, ${item.promotionState}`,
    ),
    '',
    '## Gates',
    `- Beta dataset QA: ${contract.gates.canPublishBetaDatasetQa ? 'permitida' : 'review'}`,
    '- Seed DB automatico: NO',
    '- Certificacion clinica: NO',
    '- document_chunks requerido: SI',
    '- revision pagina/hash requerida: SI',
    '',
    '## Bloqueadores',
    ...contract.releaseBlockers.map((item) => `- ${item}`),
    '',
  ].join('\n');
}
