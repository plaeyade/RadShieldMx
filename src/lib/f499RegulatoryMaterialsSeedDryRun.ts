import { buildF491F498RegulatoryMaterialsDb, type F491F498ReviewState, type F491F498ValueUse } from '@/lib/f491F498RegulatoryMaterialsDb';

export interface F499RegulatorySourceSeedRow {
  id: string;
  title: string;
  authority: string;
  canonicalRank: number;
  documentHash: string;
  pageRef: string;
  reviewState: F491F498ReviewState;
  allowedUses: string;
  notes: string;
}

export interface F499MaterialConstantSeedRow {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  density_g_cm3: number;
  densityState: F491F498ReviewState;
  reviewState: F491F498ReviewState;
  allowedUses: string;
  warnings: string;
}

export interface F499MaterialValueVersionSeedRow {
  id: string;
  materialId: string;
  valueKind: 'density' | 'tvl-primary' | 'tvl-secondary' | 'tvl-neutron' | 'cost' | 'thickness-standard';
  energyKey: string;
  value: number;
  unit: string;
  sourceId: string;
  reviewState: F491F498ReviewState;
  allowedUse: F491F498ValueUse;
}

export interface F499MaterialSourceLinkSeedRow {
  materialId: string;
  sourceId: string;
  allowedUse: F491F498ValueUse;
  reviewState: F491F498ReviewState;
}

export interface F499RegulatoryMaterialsSeedDryRun {
  schema: 'radshield-mx.db.regulatory-materials.seed.f499.v1';
  phase: 'F499';
  status: 'dry-run-ready';
  liveWriteBlocked: true;
  generatedTables: string[];
  rows: {
    regulatorySources: F499RegulatorySourceSeedRow[];
    materialConstants: F499MaterialConstantSeedRow[];
    materialValueVersions: F499MaterialValueVersionSeedRow[];
    materialSourceLinks: F499MaterialSourceLinkSeedRow[];
  };
  counts: {
    regulatorySources: number;
    materialConstants: number;
    materialValueVersions: number;
    materialSourceLinks: number;
    approvedCalculationValueVersions: number;
    reviewRequiredValueVersions: number;
  };
  reviewQueue: string[];
  dryRunArtifacts: string[];
  nextPhase: string;
}

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function idSafe(value: string): string {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180);
}

function firstSource(sourceIds: string[]): string {
  return sourceIds[0] || 'source-pending';
}

function valueReviewState(materialReviewState: F491F498ReviewState): F491F498ReviewState {
  return materialReviewState === 'approved-reference' ? 'approved-reference' : 'review-required';
}

function valueAllowedUse(materialReviewState: F491F498ReviewState): F491F498ValueUse {
  return materialReviewState === 'approved-reference' ? 'calculation' : 'report-evidence';
}

export function buildF499RegulatoryMaterialsSeedDryRun(): F499RegulatoryMaterialsSeedDryRun {
  const registry = buildF491F498RegulatoryMaterialsDb();

  const regulatorySources = registry.sources.map((source): F499RegulatorySourceSeedRow => ({
    id: source.sourceId,
    title: source.title,
    authority: source.authority,
    canonicalRank: source.canonicalRank,
    documentHash: source.documentHash,
    pageRef: source.pageRef,
    reviewState: source.status,
    allowedUses: source.allowedUses.join('|'),
    notes: source.notes,
  }));

  const materialConstants = registry.materials.map((material): F499MaterialConstantSeedRow => ({
    id: material.materialId,
    name: material.materialName,
    category: material.category,
    manufacturer: material.manufacturer || '',
    density_g_cm3: material.density_g_cm3,
    densityState: material.densityState,
    reviewState: material.reviewState,
    allowedUses: material.allowedUses.join('|'),
    warnings: material.warnings.join(' | '),
  }));

  const materialValueVersions = registry.materials.flatMap((material): F499MaterialValueVersionSeedRow[] => {
    const sourceId = firstSource(material.sourceIds);
    const reviewState = valueReviewState(material.reviewState);
    const allowedUse = valueAllowedUse(material.reviewState);
    const baseId = idSafe(material.materialId);
    const rows: F499MaterialValueVersionSeedRow[] = [
      {
        id: `${baseId}-density-g-cm3`,
        materialId: material.materialId,
        valueKind: 'density',
        energyKey: 'bulk',
        value: material.density_g_cm3,
        unit: 'g/cm3',
        sourceId,
        reviewState,
        allowedUse,
      },
    ];

    Object.entries(material.tvlPrimary_cm).forEach(([energyKey, value]) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        rows.push({
          id: `${baseId}-tvl-primary-${idSafe(energyKey)}`,
          materialId: material.materialId,
          valueKind: 'tvl-primary',
          energyKey,
          value,
          unit: 'cm',
          sourceId,
          reviewState,
          allowedUse,
        });
      }
    });

    Object.entries(material.tvlSecondary_cm).forEach(([energyKey, value]) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        rows.push({
          id: `${baseId}-tvl-secondary-${idSafe(energyKey)}`,
          materialId: material.materialId,
          valueKind: 'tvl-secondary',
          energyKey,
          value,
          unit: 'cm',
          sourceId,
          reviewState,
          allowedUse,
        });
      }
    });

    if (material.neutronTvl_cm) {
      rows.push(
        {
          id: `${baseId}-tvl-neutron-tvl1`,
          materialId: material.materialId,
          valueKind: 'tvl-neutron',
          energyKey: 'TVL1',
          value: material.neutronTvl_cm.TVL1,
          unit: 'cm',
          sourceId,
          reviewState,
          allowedUse,
        },
        {
          id: `${baseId}-tvl-neutron-tvle`,
          materialId: material.materialId,
          valueKind: 'tvl-neutron',
          energyKey: 'TVLe',
          value: material.neutronTvl_cm.TVLe,
          unit: 'cm',
          sourceId,
          reviewState,
          allowedUse,
        },
      );
    }

    if (typeof material.cost_MXN_m2_approx === 'number') {
      rows.push({
        id: `${baseId}-cost-mxn-m2`,
        materialId: material.materialId,
        valueKind: 'cost',
        energyKey: 'commercial',
        value: material.cost_MXN_m2_approx,
        unit: 'MXN/m2',
        sourceId,
        reviewState: 'review-required',
        allowedUse: 'structural-cost',
      });
    }

    material.thickness_mm_std?.forEach((thickness) => {
      rows.push({
        id: `${baseId}-thickness-standard-${thickness}`,
        materialId: material.materialId,
        valueKind: 'thickness-standard',
        energyKey: 'commercial',
        value: thickness,
        unit: 'mm',
        sourceId,
        reviewState: 'review-required',
        allowedUse: 'structural-cost',
      });
    });

    return rows;
  });

  const materialSourceLinks = registry.materials.flatMap((material): F499MaterialSourceLinkSeedRow[] =>
    material.sourceIds.flatMap((sourceId) =>
      material.allowedUses.map((allowedUse) => ({
        materialId: material.materialId,
        sourceId,
        allowedUse,
        reviewState: material.reviewState,
      })),
    ),
  );

  const approvedCalculationValueVersions = materialValueVersions.filter((row) => row.reviewState === 'approved-reference' && row.allowedUse === 'calculation').length;
  const reviewRequiredValueVersions = materialValueVersions.filter((row) => row.reviewState !== 'approved-reference').length;

  return {
    schema: 'radshield-mx.db.regulatory-materials.seed.f499.v1',
    phase: 'F499',
    status: 'dry-run-ready',
    liveWriteBlocked: true,
    generatedTables: ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links'],
    rows: {
      regulatorySources,
      materialConstants,
      materialValueVersions,
      materialSourceLinks,
    },
    counts: {
      regulatorySources: regulatorySources.length,
      materialConstants: materialConstants.length,
      materialValueVersions: materialValueVersions.length,
      materialSourceLinks: materialSourceLinks.length,
      approvedCalculationValueVersions,
      reviewRequiredValueVersions,
    },
    reviewQueue: [
      'Review pending-page-ref sources before live seed.',
      'Promote vendor/lab material constants only after source/page/hash/value approval.',
      'Run duplicate review against document_chunks before F500 live readback.',
      'Repeat F484-F490 after DB seed/readback.',
    ],
    dryRunArtifacts: [
      'f499_regulatory_sources.jsonl',
      'f499_material_constants.jsonl',
      'f499_material_value_versions.jsonl',
      'f499_material_source_links.jsonl',
      'f499_seed_dry_run.sql',
      'f499_seed_manifest.json',
    ],
    nextPhase: 'F500 DB live readback after explicit approval and restore probe.',
  };
}

export function formatF499SeedDryRunMarkdown(seed = buildF499RegulatoryMaterialsSeedDryRun()): string {
  return [
    '# F499 SEED DRY-RUN DB REGULATORIA/MATERIALES',
    '',
    `Estado: ${seed.status}`,
    `Escritura live bloqueada: ${seed.liveWriteBlocked}`,
    `Fuentes: ${seed.counts.regulatorySources}`,
    `Materiales: ${seed.counts.materialConstants}`,
    `Versiones de valores: ${seed.counts.materialValueVersions}`,
    `Links material-fuente: ${seed.counts.materialSourceLinks}`,
    `Valores aprobados para calculo: ${seed.counts.approvedCalculationValueVersions}`,
    `Valores en revision: ${seed.counts.reviewRequiredValueVersions}`,
    '',
    '## Cola de revision',
    ...seed.reviewQueue.map((item) => `- ${item}`),
    '',
    '## Artefactos',
    ...seed.dryRunArtifacts.map((item) => `- ${item}`),
    '',
    `Siguiente fase: ${seed.nextPhase}`,
  ].join('\n');
}
