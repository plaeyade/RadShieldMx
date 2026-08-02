import { MATERIALS_DB } from '@/lib/materialDatabase';
import { buildF144SourceGovernance } from '@/lib/f144SourceGovernance';
import { buildF484F490NormativeQa } from '@/lib/f484F490NormativeQa';

export type F491F498MaterialAuthority = 'normative' | 'vendor' | 'lab' | 'analytic-memory' | 'derived';
export type F491F498ReviewState = 'approved-reference' | 'review-required' | 'candidate' | 'blocked';
export type F491F498ValueUse = 'calculation' | 'report-evidence' | 'visual-only' | 'structural-cost';

export interface F491F498SourceRecord {
  sourceId: string;
  title: string;
  authority: F491F498MaterialAuthority;
  canonicalRank: number;
  documentHash: string;
  pageRef: string;
  status: F491F498ReviewState;
  allowedUses: F491F498ValueUse[];
  notes: string;
}

export interface F491F498MaterialValueRecord {
  materialId: string;
  materialName: string;
  manufacturer?: string;
  category: string;
  density_g_cm3: number;
  densityState: F491F498ReviewState;
  tvlPrimary_cm: Record<string, number | null>;
  tvlSecondary_cm: Record<string, number | null>;
  neutronTvl_cm?: { TVL1: number; TVLe: number };
  cost_MXN_m2_approx?: number;
  thickness_mm_std?: number[];
  sourceIds: string[];
  allowedUses: F491F498ValueUse[];
  reviewState: F491F498ReviewState;
  warnings: string[];
}

export interface F491F498RegulatoryMaterialsDb {
  schema: 'radshield-mx.db.regulatory-materials.f491-f498.v1';
  phaseRange: 'F491-F498';
  status: 'versioned-db-ready' | 'review-required';
  phases: { phase: string; title: string; exitCriteria: string }[];
  sources: F491F498SourceRecord[];
  materials: F491F498MaterialValueRecord[];
  summary: {
    totalSources: number;
    totalMaterials: number;
    approvedReferenceMaterials: number;
    reviewRequiredMaterials: number;
    candidateMaterials: number;
    blockedMaterials: number;
    calculationAllowedMaterials: number;
  };
  databaseRoute: {
    tables: string[];
    seedMode: 'dry-run-first';
    liveRequirements: string[];
    migrationSqlDraft: string[];
  };
  integrationSurfaces: string[];
  releaseDecision: string;
}

function hashText(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function classifyAuthority(normativa: string[], manufacturer?: string): F491F498MaterialAuthority {
  if (manufacturer) return 'vendor';
  if (normativa.some((item) => /NCRP|IAEA|AAPM|ICRU/i.test(item))) return 'normative';
  return 'derived';
}

function sourceForMaterial(material: (typeof MATERIALS_DB)[number]): F491F498SourceRecord {
  const authority = classifyAuthority(material.normativa, material.manufacturer);
  const sourceId = authority === 'normative'
    ? `src-norm-${material.id}`
    : `src-material-${material.id}`;
  const status: F491F498ReviewState = material.isNCRP151 ? 'approved-reference' : authority === 'vendor' ? 'review-required' : 'candidate';
  return {
    sourceId,
    title: `${material.name} - ${material.normativa.join(', ') || 'material evidence'}`,
    authority,
    canonicalRank: authority === 'normative' ? 1 : authority === 'vendor' ? 4 : 5,
    documentHash: hashText(`${material.id}|${material.name}|${material.normativa.join('|')}|${material.notes}`),
    pageRef: material.isNCRP151 ? 'NCRP/IAEA material table reference' : 'pending-page-ref',
    status,
    allowedUses: status === 'approved-reference'
      ? ['calculation', 'report-evidence', 'structural-cost']
      : ['report-evidence', 'structural-cost', 'visual-only'],
    notes: status === 'approved-reference'
      ? 'Reference material can be used in preliminary calculations with formula trace.'
      : 'Promote only after source/page/hash/value review and professional approval.',
  };
}

function reviewStateForMaterial(material: (typeof MATERIALS_DB)[number], source: F491F498SourceRecord): F491F498ReviewState {
  if (material.isNCRP151 && source.status === 'approved-reference') return 'approved-reference';
  if (!Number.isFinite(material.density_g_cm3) || material.density_g_cm3 <= 0) return 'blocked';
  if (material.manufacturer || /verishield|nipoll|nelco|v-|block|bloque/i.test(`${material.id} ${material.name}`)) return 'review-required';
  return 'candidate';
}

function warningsForMaterial(material: (typeof MATERIALS_DB)[number], reviewState: F491F498ReviewState): string[] {
  const warnings = [];
  if (reviewState !== 'approved-reference') warnings.push('Material value is not promoted to controlled calculation constant.');
  if (!material.isNCRP151) warnings.push('Requires source/page/hash review before final memoria analitica.');
  if (material.category === 'borated') warnings.push('Neutron material must be paired with high-energy/neutron methodology review.');
  if (material.manufacturer) warnings.push('Vendor data is evidence until approved by physicist/RSO and project specification.');
  return warnings;
}

function buildMaterialRecord(material: (typeof MATERIALS_DB)[number]): F491F498MaterialValueRecord {
  const source = sourceForMaterial(material);
  const reviewState = reviewStateForMaterial(material, source);
  return {
    materialId: material.id,
    materialName: material.name,
    manufacturer: material.manufacturer,
    category: material.category,
    density_g_cm3: material.density_g_cm3,
    densityState: material.density_g_cm3 > 0 ? reviewState : 'blocked',
    tvlPrimary_cm: material.TVL_primary_cm,
    tvlSecondary_cm: material.TVL_secondary_cm,
    neutronTvl_cm: material.TVL_neutron_cm,
    cost_MXN_m2_approx: material.cost_MXN_m2_approx,
    thickness_mm_std: material.thickness_mm_std,
    sourceIds: [source.sourceId],
    allowedUses: reviewState === 'approved-reference'
      ? ['calculation', 'report-evidence', 'structural-cost']
      : ['report-evidence', 'structural-cost', 'visual-only'],
    reviewState,
    warnings: warningsForMaterial(material, reviewState),
  };
}

export function buildF491F498RegulatoryMaterialsDb(): F491F498RegulatoryMaterialsDb {
  const sourceGovernance = buildF144SourceGovernance();
  const normativeQa = buildF484F490NormativeQa();
  const materialSources = MATERIALS_DB.map(sourceForMaterial);
  const governanceSources: F491F498SourceRecord[] = sourceGovernance.sources.map((source) => ({
    sourceId: source.id,
    title: source.title,
    authority: source.role === 'normative' ? 'normative' : source.role === 'material-evidence' ? 'lab' : source.role === 'vendor-planning' ? 'vendor' : 'analytic-memory',
    canonicalRank: source.priority,
    documentHash: hashText(`${source.id}|${source.source}|${source.title}`),
    pageRef: 'document_chunks.page_ref required for live DB',
    status: source.status === 'canonical' ? 'approved-reference' : source.status === 'review-required' ? 'review-required' : 'candidate',
    allowedUses: source.role === 'normative' ? ['calculation', 'report-evidence'] : ['report-evidence', 'visual-only'],
    notes: source.citationPolicy,
  }));
  const sources = [...governanceSources, ...materialSources];
  const materials = MATERIALS_DB.map(buildMaterialRecord);
  const approvedReferenceMaterials = materials.filter((item) => item.reviewState === 'approved-reference').length;
  const reviewRequiredMaterials = materials.filter((item) => item.reviewState === 'review-required').length;
  const candidateMaterials = materials.filter((item) => item.reviewState === 'candidate').length;
  const blockedMaterials = materials.filter((item) => item.reviewState === 'blocked').length;
  const calculationAllowedMaterials = materials.filter((item) => item.allowedUses.includes('calculation')).length;

  return {
    schema: 'radshield-mx.db.regulatory-materials.f491-f498.v1',
    phaseRange: 'F491-F498',
    status: blockedMaterials === 0 && normativeQa.status === 'qa-pass' ? 'versioned-db-ready' : 'review-required',
    phases: [
      { phase: 'F491', title: 'Source registry', exitCriteria: 'Every normative/material/vendor source has authority, hash and allowed use.' },
      { phase: 'F492', title: 'Material value registry', exitCriteria: 'Every material has density, TVL/HVL family, review state and source link.' },
      { phase: 'F493', title: 'Dedup and canonical priority', exitCriteria: 'Duplicate evidence stays supporting; canonical sources remain ranked.' },
      { phase: 'F494', title: 'DB schema route', exitCriteria: 'Tables and seed mode are declared before live migration.' },
      { phase: 'F495', title: 'Calculation integration gate', exitCriteria: 'Only approved-reference values can feed final calculation constants.' },
      { phase: 'F496', title: 'Report and Evidence integration', exitCriteria: 'Memoria/PDF/Evidence can cite source/page/hash and review state.' },
      { phase: 'F497', title: 'Material toolbox integration', exitCriteria: 'Cost/time/load views read the same registry, not ad hoc constants.' },
      { phase: 'F498', title: 'Release guardrail', exitCriteria: 'Clinical claims stay blocked until DB live seed, restore probe and QA signoff.' },
    ],
    sources,
    materials,
    summary: {
      totalSources: sources.length,
      totalMaterials: materials.length,
      approvedReferenceMaterials,
      reviewRequiredMaterials,
      candidateMaterials,
      blockedMaterials,
      calculationAllowedMaterials,
    },
    databaseRoute: {
      tables: ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links', 'document_chunks'],
      seedMode: 'dry-run-first',
      liveRequirements: [
        'DATABASE_URL configured and restore probe passed.',
        'document_chunks contains canonical NCRP/IAEA/UAQ/material sources with page_ref and hash tags.',
        'F484-F490 normative QA passes after seed readback.',
        'Commercial/lab materials promoted only after reviewed source/page/value approval.',
      ],
      migrationSqlDraft: [
        'CREATE TABLE regulatory_sources (id varchar(128) primary key, title text not null, authority varchar(32) not null, document_hash varchar(96) not null, page_ref varchar(128), review_state varchar(32) not null);',
        'CREATE TABLE material_constants (id varchar(128) primary key, name text not null, category varchar(48), density_g_cm3 decimal(8,4), review_state varchar(32) not null);',
        'CREATE TABLE material_value_versions (id varchar(128) primary key, material_id varchar(128) not null, value_kind varchar(64) not null, energy_key varchar(32), value decimal(12,4), unit varchar(32), source_id varchar(128) not null, valid_from varchar(32), review_state varchar(32) not null);',
        'CREATE TABLE material_source_links (material_id varchar(128) not null, source_id varchar(128) not null, allowed_use varchar(64) not null, primary key(material_id, source_id, allowed_use));',
      ],
    },
    integrationSurfaces: [
      'MaterialComparisonDialog / Material Toolbox',
      'F146 material appendix',
      'F484-F490 calculation QA',
      'Memoria IA citation picker',
      'Evidence Pack source ledger',
      'Medical 3D visual material labels',
      'DB live seed/readback scripts',
    ],
    releaseDecision:
      'F491-F498 makes the regulatory/material database versionable and ready for dry-run seed. Final clinical release still requires live DB seed/readback, restore probe and professional approval of non-reference material constants.',
  };
}

export function formatF491F498RegulatoryMaterialsDbMarkdown(contract = buildF491F498RegulatoryMaterialsDb()): string {
  return [
    '# F491-F498 DB REGULATORIA/MATERIALES VERSIONADA',
    '',
    `Estado: ${contract.status}`,
    `Fuentes: ${contract.summary.totalSources}`,
    `Materiales: ${contract.summary.totalMaterials}`,
    `Materiales aprobados para calculo preliminar: ${contract.summary.calculationAllowedMaterials}`,
    `Materiales con revision requerida: ${contract.summary.reviewRequiredMaterials}`,
    '',
    '## Fases',
    ...contract.phases.map((phase) => `- ${phase.phase}: ${phase.title} - ${phase.exitCriteria}`),
    '',
    '## Ruta DB',
    ...contract.databaseRoute.tables.map((table) => `- ${table}`),
    '',
    '## Superficies integradas',
    ...contract.integrationSurfaces.map((surface) => `- ${surface}`),
    '',
    `Decision: ${contract.releaseDecision}`,
  ].join('\n');
}
