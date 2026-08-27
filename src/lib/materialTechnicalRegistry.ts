import { MATERIALS, type ShieldingMaterial } from '@/types/radshield';
import {
  costPerM2FromMaterial,
  gCm3ToKgM3,
  kgM2FromDensityThickness,
  structuralLoadKPaFromKgM2,
} from '@/lib/unitNormalization';

export type MaterialModality = 'DX' | 'TX' | 'NM' | 'CY';
export type MaterialEvidenceStatus = 'canonical' | 'vendor-certified' | 'derived' | 'needs-source';

export interface MaterialTechnicalRecord {
  code: string;
  name: string;
  category: string;
  manufacturer?: string;
  certifiedLab?: string;
  density_g_cm3: number;
  density_kg_m3: number;
  tvl_mm: Record<string, number>;
  hvl_mm?: Record<string, number>;
  cost_per_m3: number;
  cost_per_kg: number;
  mass_kg_per_m2_by_tvl: Record<string, number>;
  cost_per_m2_by_tvl: Record<string, number>;
  structuralLoad_kPa_by_tvl: Record<string, number>;
  sourceRefs: string[];
  evidenceStatus: MaterialEvidenceStatus;
  warnings: string[];
  searchTokens: string[];
}

export interface MaterialTechnicalValidation {
  errors: string[];
  warnings: string[];
  duplicateCodes: string[];
  duplicateNames: string[];
}

export interface MaterialEnergyComparison {
  code: string;
  name: string;
  category: string;
  energyKey: string;
  requiredTvls: number;
  thickness_mm: number;
  mass_kg_per_m2: number;
  cost_per_m2: number;
  structuralLoad_kPa: number;
  evidenceStatus: MaterialEvidenceStatus;
  warnings: string[];
}

export interface MaterialDecisionRow extends MaterialEnergyComparison {
  area_m2: number;
  totalMass_kg: number;
  estimatedInstallDays: number;
  structuralStatus: 'ok' | 'coordinate-structure' | 'structural-review';
  evidenceReady: boolean;
}

export interface MaterialTechnicalClosure {
  status: 'beta-materials-ready' | 'review-required';
  totalMaterials: number;
  canonicalMaterials: number;
  vendorCertifiedMaterials: number;
  duplicateCodes: number;
  availableModalities: Record<MaterialModality, number>;
  releaseGuards: string[];
  recommendedNextData: string[];
}

const TX_KEYS = ['6MV', '10MV', '15MV', '18MV', 'Co60'];
const NM_KEYS = ['511keV', '140keV', '364keV', 'Ir192'];
const CY_KEYS = ['18MV', 'neutron'];
const INSTALL_RATE_M2_DAY_BY_CATEGORY: Record<string, number> = {
  Conventional: 8,
  NELCO: 16,
  VERITAS: 14,
  'TM-NIPOL': 18,
  'Special Nuclear': 12,
  borated: 12,
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function classifyEvidenceStatus(material: ShieldingMaterial): MaterialEvidenceStatus {
  if (material.certifiedLab) return 'vendor-certified';
  if (['CONCRETE235', 'PB', 'STEEL'].includes(material.code)) return 'canonical';
  if (!material.TVL_mm && !material.HVL_mm && !material.archerAlpha) return 'needs-source';
  return 'derived';
}

function inferSourceRefs(material: ShieldingMaterial): string[] {
  const keys = Object.keys(material.TVL_mm ?? {});
  const refs: string[] = [];
  if (keys.some((key) => TX_KEYS.includes(key))) refs.push('NCRP151');
  if (keys.some((key) => NM_KEYS.includes(key))) refs.push('TG108-NCRP147-XCOM-support');
  if (keys.includes('neutron') || material.category?.toLowerCase().includes('borated')) refs.push('IAEA-neutron-review-required');
  if (material.archerAlpha) refs.push('NCRP147-Archer');
  if (material.certifiedLab) refs.push(`LAB:${material.certifiedLab}`);
  if (material.manufacturer) refs.push(`VENDOR:${material.manufacturer}`);
  if (refs.length === 0) refs.push('internal-derived');
  return uniq(refs);
}

function buildWarnings(material: ShieldingMaterial, evidenceStatus: MaterialEvidenceStatus): string[] {
  const warnings: string[] = [];
  if (!Number.isFinite(material.density) || material.density <= 0) warnings.push('density missing or invalid');
  if (!material.TVL_mm && !material.HVL_mm && !material.archerAlpha) warnings.push('attenuation data missing');
  if (evidenceStatus !== 'canonical') warnings.push('requires source/page/hash review before final memoria analitica');
  if (Object.keys(material.TVL_mm ?? {}).includes('neutron')) warnings.push('neutron shielding requires dedicated high-energy review');
  if (material.manufacturer && !material.certifiedLab) warnings.push('vendor material requires project-specific approval');
  return warnings;
}

export function buildMaterialTechnicalRegistry(materials: ShieldingMaterial[] = MATERIALS): MaterialTechnicalRecord[] {
  return materials.map((material) => {
    const tvl = material.TVL_mm ?? {};
    const evidenceStatus = classifyEvidenceStatus(material);
    const massByTvl = Object.fromEntries(
      Object.entries(tvl).map(([energy, thickness]) => [energy, kgM2FromDensityThickness(material.density, thickness)]),
    );
    const costByTvl = Object.fromEntries(
      Object.entries(tvl).map(([energy, thickness]) => [energy, costPerM2FromMaterial(material, thickness)]),
    );
    const loadByTvl = Object.fromEntries(
      Object.entries(massByTvl).map(([energy, mass]) => [energy, structuralLoadKPaFromKgM2(mass)]),
    );
    const category = material.category ?? 'Conventional';

    return {
      code: material.code,
      name: material.name,
      category,
      manufacturer: material.manufacturer,
      certifiedLab: material.certifiedLab,
      density_g_cm3: material.density,
      density_kg_m3: material.density_kg_m3 ?? gCm3ToKgM3(material.density),
      tvl_mm: tvl,
      hvl_mm: material.HVL_mm,
      cost_per_m3: material.cost_per_m3 ?? 0,
      cost_per_kg: material.cost_per_kg ?? 0,
      mass_kg_per_m2_by_tvl: massByTvl,
      cost_per_m2_by_tvl: costByTvl,
      structuralLoad_kPa_by_tvl: loadByTvl,
      sourceRefs: inferSourceRefs(material),
      evidenceStatus,
      warnings: buildWarnings(material, evidenceStatus),
      searchTokens: uniq([
        material.code,
        material.name,
        category,
        material.manufacturer ?? '',
        material.certifiedLab ?? '',
        ...Object.keys(tvl),
      ].map(normalizeName)),
    };
  });
}

export function validateMaterialTechnicalRegistry(records = buildMaterialTechnicalRegistry()): MaterialTechnicalValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const codeCounts = new Map<string, number>();
  const nameCounts = new Map<string, number>();

  for (const record of records) {
    const normalizedName = normalizeName(record.name);
    codeCounts.set(record.code, (codeCounts.get(record.code) ?? 0) + 1);
    nameCounts.set(normalizedName, (nameCounts.get(normalizedName) ?? 0) + 1);

    if (!record.code.trim()) errors.push('material code is empty');
    if (!Number.isFinite(record.density_g_cm3) || record.density_g_cm3 <= 0) errors.push(`${record.code}: density must be positive`);
    if (!Number.isFinite(record.density_kg_m3) || record.density_kg_m3 <= 0) errors.push(`${record.code}: SI density must be positive`);
    for (const [energy, thickness] of Object.entries(record.tvl_mm)) {
      if (!Number.isFinite(thickness) || thickness <= 0) errors.push(`${record.code}: TVL ${energy} must be positive`);
      const mass = record.mass_kg_per_m2_by_tvl[energy];
      const load = record.structuralLoad_kPa_by_tvl[energy];
      if (!Number.isFinite(mass) || mass <= 0) errors.push(`${record.code}: mass for ${energy} is invalid`);
      if (!Number.isFinite(load) || load <= 0) errors.push(`${record.code}: structural load for ${energy} is invalid`);
    }
    if (record.warnings.length > 0) warnings.push(...record.warnings.map((warning) => `${record.code}: ${warning}`));
  }

  const duplicateCodes = [...codeCounts.entries()].filter(([, count]) => count > 1).map(([code]) => code);
  const duplicateNames = [...nameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name);
  errors.push(...duplicateCodes.map((code) => `duplicate material code: ${code}`));
  warnings.push(...duplicateNames.map((name) => `duplicate normalized material name: ${name}`));

  return { errors, warnings, duplicateCodes, duplicateNames };
}

export function getMaterialsForModality(modality: MaterialModality, records = buildMaterialTechnicalRegistry()): MaterialTechnicalRecord[] {
  const hasAnyKey = (record: MaterialTechnicalRecord, keys: string[]) => keys.some((key) => key in record.tvl_mm);
  return records.filter((record) => {
    if (modality === 'TX') return hasAnyKey(record, TX_KEYS);
    if (modality === 'NM') return hasAnyKey(record, NM_KEYS);
    if (modality === 'CY') return hasAnyKey(record, CY_KEYS) || /NIPOL|BARITE|IRON|VERITAS|BORATED/i.test(`${record.code} ${record.category}`);
    return Boolean(record.hvl_mm) || Boolean(record.sourceRefs.find((ref) => ref.includes('NCRP147'))) || hasAnyKey(record, ['140keV', '364keV']);
  });
}

export function compareMaterialsForEnergy(
  energyKey: string,
  requiredTvls = 1,
  records = buildMaterialTechnicalRegistry(),
): MaterialEnergyComparison[] {
  return records
    .filter((record) => Number.isFinite(record.tvl_mm[energyKey]) && record.tvl_mm[energyKey] > 0)
    .map((record) => {
      const thickness = record.tvl_mm[energyKey] * requiredTvls;
      const mass = kgM2FromDensityThickness(record.density_g_cm3, thickness);
      const volumeM3PerM2 = thickness / 1000;
      const cost = record.cost_per_m3 > 0 ? record.cost_per_m3 * volumeM3PerM2 : mass * record.cost_per_kg;
      return {
        code: record.code,
        name: record.name,
        category: record.category,
        energyKey,
        requiredTvls,
        thickness_mm: thickness,
        mass_kg_per_m2: mass,
        cost_per_m2: cost,
        structuralLoad_kPa: structuralLoadKPaFromKgM2(mass),
        evidenceStatus: record.evidenceStatus,
        warnings: record.warnings,
      };
    })
    .sort((a, b) => a.thickness_mm - b.thickness_mm || a.mass_kg_per_m2 - b.mass_kg_per_m2);
}

function materialInstallRate(category: string): number {
  return INSTALL_RATE_M2_DAY_BY_CATEGORY[category] ?? 10;
}

function structuralStatus(kgM2: number): MaterialDecisionRow['structuralStatus'] {
  if (kgM2 >= 750) return 'structural-review';
  if (kgM2 >= 350) return 'coordinate-structure';
  return 'ok';
}

export function buildMaterialDecisionRows(params: {
  energyKey: string;
  area_m2: number;
  requiredTvls?: number;
  records?: MaterialTechnicalRecord[];
}): MaterialDecisionRow[] {
  const area = Number.isFinite(params.area_m2) && params.area_m2 > 0 ? params.area_m2 : 1;
  const requiredTvls = Number.isFinite(params.requiredTvls) && params.requiredTvls && params.requiredTvls > 0 ? params.requiredTvls : 1;
  return compareMaterialsForEnergy(params.energyKey, requiredTvls, params.records).map((item) => ({
    ...item,
    area_m2: area,
    totalMass_kg: item.mass_kg_per_m2 * area,
    estimatedInstallDays: Math.max(0.5, area / materialInstallRate(item.category)),
    structuralStatus: structuralStatus(item.mass_kg_per_m2),
    evidenceReady: item.evidenceStatus === 'canonical' || item.evidenceStatus === 'vendor-certified',
  }));
}

export function buildMaterialTechnicalClosure(records = buildMaterialTechnicalRegistry()): MaterialTechnicalClosure {
  const validation = validateMaterialTechnicalRegistry(records);
  const canonicalMaterials = records.filter((item) => item.evidenceStatus === 'canonical').length;
  const vendorCertifiedMaterials = records.filter((item) => item.evidenceStatus === 'vendor-certified').length;
  const modalityCounts: Record<MaterialModality, number> = {
    DX: getMaterialsForModality('DX', records).length,
    TX: getMaterialsForModality('TX', records).length,
    NM: getMaterialsForModality('NM', records).length,
    CY: getMaterialsForModality('CY', records).length,
  };

  return {
    status: validation.errors.length === 0 && validation.duplicateCodes.length === 0 ? 'beta-materials-ready' : 'review-required',
    totalMaterials: records.length,
    canonicalMaterials,
    vendorCertifiedMaterials,
    duplicateCodes: validation.duplicateCodes.length,
    availableModalities: modalityCounts,
    releaseGuards: [
      'Commercial/vendor materials require source, page, hash and project approval before final memoria analitica.',
      'PBR/3D material appearance does not modify TVL, density or calculation constants.',
      'Neutron and cyclotron shielding require dedicated high-energy review before clinical signoff.',
      'Cost and installation time are planning estimates until vendor quote and construction schedule are attached.',
    ],
    recommendedNextData: [
      'Vendor quotes for MXN/m3, MXN/kg or MXN/m2 by material.',
      'Commercial thickness catalog for TM-NIPOL, NELCO, VeriShield, lead sheets, doors and windows.',
      'Lab certificates with density, TVL/HVL, page/hash and validity date.',
      'Structural allowable loads per slab/wall and door support detail.',
    ],
  };
}
