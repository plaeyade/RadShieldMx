export type F121RadiologyFit = 'DX' | 'TX' | 'NM' | 'CY';
export type F121StructuralRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface F121ShieldingMaterialImpact {
  id: string;
  label: string;
  family: 'concrete' | 'masonry' | 'modular-panel' | 'metal' | 'hybrid';
  densityKgM3: number;
  defaultThicknessMm: number;
  costIndex: 1 | 2 | 3 | 4 | 5;
  scheduleIndex: 1 | 2 | 3 | 4 | 5;
  radiologyFit: F121RadiologyFit[];
  structuralRisk: F121StructuralRisk;
  requiresStructuralReview: boolean;
  requiresVendorDatasheet: boolean;
  constructionNotes: string[];
}

export interface F121BarrierImpactInput {
  materialId: string;
  lengthM: number;
  heightM: number;
  thicknessMm?: number;
}

export interface F121BarrierStructuralImpact {
  material: F121ShieldingMaterialImpact;
  areaM2: number;
  volumeM3: number;
  massKg: number;
  kgM2: number;
  kgPerLinearM: number;
  thicknessMm: number;
  structuralRisk: F121StructuralRisk;
  costIndex: F121ShieldingMaterialImpact['costIndex'];
  scheduleIndex: F121ShieldingMaterialImpact['scheduleIndex'];
  reviewRequired: boolean;
  datasheetRequired: boolean;
}

export const F121_SHIELDING_MATERIAL_IMPACT: F121ShieldingMaterialImpact[] = [
  {
    id: 'ordinary_concrete',
    label: 'Concreto ordinario',
    family: 'concrete',
    densityKgM3: 2400,
    defaultThicknessMm: 200,
    costIndex: 2,
    scheduleIndex: 2,
    radiologyFit: ['DX', 'TX', 'NM', 'CY'],
    structuralRisk: 'moderate',
    requiresStructuralReview: true,
    requiresVendorDatasheet: false,
    constructionNotes: ['Buen costo base', 'Mayor espesor puede afectar cimentacion y claros existentes'],
  },
  {
    id: 'high_density_concrete',
    label: 'Concreto alta densidad',
    family: 'concrete',
    densityKgM3: 3600,
    defaultThicknessMm: 160,
    costIndex: 3,
    scheduleIndex: 2,
    radiologyFit: ['TX', 'NM', 'CY'],
    structuralRisk: 'high',
    requiresStructuralReview: true,
    requiresVendorDatasheet: true,
    constructionNotes: ['Reduce espesor frente a concreto ordinario', 'Requiere control de agregados y peso propio'],
  },
  {
    id: 'barite_magnetite_concrete',
    label: 'Concreto baritado/magnetita',
    family: 'concrete',
    densityKgM3: 4200,
    defaultThicknessMm: 140,
    costIndex: 4,
    scheduleIndex: 2,
    radiologyFit: ['TX', 'NM', 'CY'],
    structuralRisk: 'high',
    requiresStructuralReview: true,
    requiresVendorDatasheet: true,
    constructionNotes: ['Alta masa por area', 'Validar disponibilidad, mezcla, contraccion y detalles constructivos'],
  },
  {
    id: 'high_density_block',
    label: 'Tabique/bloque alta densidad',
    family: 'masonry',
    densityKgM3: 2800,
    defaultThicknessMm: 120,
    costIndex: 3,
    scheduleIndex: 4,
    radiologyFit: ['DX', 'TX', 'NM'],
    structuralRisk: 'high',
    requiresStructuralReview: true,
    requiresVendorDatasheet: true,
    constructionNotes: ['Rapido para remodelacion', 'Controlar juntas, anclajes y continuidad del blindaje'],
  },
  {
    id: 'tm_nipoll_dense_block',
    label: 'Bloque modular denso tipo TM/Nipoll',
    family: 'masonry',
    densityKgM3: 3000,
    defaultThicknessMm: 100,
    costIndex: 4,
    scheduleIndex: 4,
    radiologyFit: ['DX', 'NM'],
    structuralRisk: 'high',
    requiresStructuralReview: true,
    requiresVendorDatasheet: true,
    constructionNotes: ['Buena velocidad de instalacion', 'No usar valores finales sin ficha de atenuacion del proveedor'],
  },
  {
    id: 'nelco_modular_panel',
    label: 'Panel modular tipo Nelco',
    family: 'modular-panel',
    densityKgM3: 3200,
    defaultThicknessMm: 75,
    costIndex: 5,
    scheduleIndex: 5,
    radiologyFit: ['DX', 'TX', 'NM'],
    structuralRisk: 'high',
    requiresStructuralReview: true,
    requiresVendorDatasheet: true,
    constructionNotes: ['Alta velocidad de obra limpia', 'Requiere detalle de uniones, penetraciones y garantia de proveedor'],
  },
  {
    id: 'verishield_modular_panel',
    label: 'Panel modular tipo VeriShield',
    family: 'modular-panel',
    densityKgM3: 3200,
    defaultThicknessMm: 75,
    costIndex: 5,
    scheduleIndex: 5,
    radiologyFit: ['DX', 'TX', 'NM'],
    structuralRisk: 'high',
    requiresStructuralReview: true,
    requiresVendorDatasheet: true,
    constructionNotes: ['Candidato para aceleracion de obra', 'Validar resistencia al fuego, fijaciones y equivalencia radiologica'],
  },
  {
    id: 'lead_sheet',
    label: 'Lamina de plomo',
    family: 'metal',
    densityKgM3: 11340,
    defaultThicknessMm: 2,
    costIndex: 4,
    scheduleIndex: 5,
    radiologyFit: ['DX', 'NM'],
    structuralRisk: 'moderate',
    requiresStructuralReview: false,
    requiresVendorDatasheet: true,
    constructionNotes: ['Muy eficiente en bajo espesor', 'Cuidar traslapes, toxicidad, soporte y proteccion mecanica'],
  },
  {
    id: 'steel_plate',
    label: 'Placa de acero',
    family: 'metal',
    densityKgM3: 7850,
    defaultThicknessMm: 10,
    costIndex: 3,
    scheduleIndex: 3,
    radiologyFit: ['TX', 'CY'],
    structuralRisk: 'high',
    requiresStructuralReview: true,
    requiresVendorDatasheet: false,
    constructionNotes: ['Util para componentes localizados', 'Requiere detalle de anclaje y corrosion'],
  },
  {
    id: 'multilayer_hybrid',
    label: 'Sistema multicapa hibrido',
    family: 'hybrid',
    densityKgM3: 2600,
    defaultThicknessMm: 90,
    costIndex: 4,
    scheduleIndex: 4,
    radiologyFit: ['DX', 'TX', 'NM', 'CY'],
    structuralRisk: 'moderate',
    requiresStructuralReview: true,
    requiresVendorDatasheet: true,
    constructionNotes: ['Permite balancear espesor, peso y acabados', 'Debe documentar equivalencia TVL/HVL por energia'],
  },
];

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function riskFromKgM2(kgM2: number, baseRisk: F121StructuralRisk): F121StructuralRisk {
  if (kgM2 >= 1000) return 'critical';
  if (kgM2 >= 450) return 'high';
  if (kgM2 >= 150) return baseRisk === 'low' ? 'moderate' : baseRisk;
  return baseRisk;
}

export function estimateBarrierStructuralImpact(input: F121BarrierImpactInput): F121BarrierStructuralImpact {
  const material = F121_SHIELDING_MATERIAL_IMPACT.find((item) => item.id === input.materialId);
  if (!material) throw new Error(`Unknown F121 shielding material: ${input.materialId}`);

  const thicknessMm = input.thicknessMm ?? material.defaultThicknessMm;
  const areaM2 = input.lengthM * input.heightM;
  const volumeM3 = areaM2 * (thicknessMm / 1000);
  const massKg = volumeM3 * material.densityKgM3;
  const kgM2 = material.densityKgM3 * (thicknessMm / 1000);
  const kgPerLinearM = kgM2 * input.heightM;
  const structuralRisk = riskFromKgM2(kgM2, material.structuralRisk);

  return {
    material,
    areaM2: round(areaM2),
    volumeM3: round(volumeM3, 3),
    massKg: round(massKg),
    kgM2: round(kgM2),
    kgPerLinearM: round(kgPerLinearM),
    thicknessMm,
    structuralRisk,
    costIndex: material.costIndex,
    scheduleIndex: material.scheduleIndex,
    reviewRequired: material.requiresStructuralReview || kgM2 >= 150,
    datasheetRequired: material.requiresVendorDatasheet,
  };
}

export function buildF121StructuralShieldingImpactSummary() {
  const sample = ['ordinary_concrete', 'high_density_block', 'nelco_modular_panel', 'verishield_modular_panel', 'lead_sheet'].map((materialId) =>
    estimateBarrierStructuralImpact({ materialId, lengthM: 4, heightM: 2.8 }),
  );

  return {
    phase: 'F121',
    status: 'implemented-planning-layer',
    materialCount: F121_SHIELDING_MATERIAL_IMPACT.length,
    workflows: ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia'],
    outputs: ['kg/m2', 'kg/ml', 'masa total', 'riesgo estructural', 'costo relativo', 'rapidez obra'],
    sample,
    nextPhase: 'F122 canvas structural overlay',
    decision:
      'F121 conecta proteccion radiologica con impacto estructural y obra; los materiales de proveedor quedan como vendor-type hasta cargar ficha tecnica certificada.',
  };
}
