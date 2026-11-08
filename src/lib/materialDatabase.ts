// =============================================================================
// materialDatabase.ts — Base de datos completa de materiales de blindaje
// Incluye: Verishield, TM Nipoll, Nelco, concretos baríticos, aceros, plomos,
//          materiales NCRP 151, AAPM, ICRU, y normativa mexicana
// =============================================================================

import { TABLA_B_2, TABLA_B_7 } from '@/lib/ncrp151';
import { densidadDiseno, tvlDisenoHD, tvlFugaHD } from '@/lib/ininBloquesHD';

// Fuente única para los materiales de referencia de NCRP 151: Tabla B.2 (primaria, TVL₁) y
// Tabla B.7 (fuga en concreto, TVL₁). Para acero y plomo la secundaria usa la primaria (conservador).
const ENERGIAS = { '6MV': '6', '10MV': '10', '15MV': '15', '18MV': '18', '25MV': '25', Co60: 'Co60' } as const;
function tvlNCRP(mat: 'concrete' | 'steel' | 'lead', tipo: 'primary' | 'secondary'): Record<string, number> {
  return Object.fromEntries(
    Object.entries(ENERGIAS).map(([k, e]) => [
      k,
      tipo === 'secondary' && mat === 'concrete' ? TABLA_B_7[e].tvl1_cm : TABLA_B_2[mat][e].tvl1_cm,
    ]),
  );
}

export interface ShieldingMaterial {
  id: string;
  name: string;
  category: 'concrete' | 'steel' | 'lead' | 'composite' | 'barite' | 'borated' | 'special';
  density_g_cm3: number;
  // TVL en cm por energía (6MV, 10MV, 15MV, 18MV, 25MV, Co60)
  TVL_primary_cm: Record<string, number | null>;
  TVL_secondary_cm: Record<string, number | null>;
  TVL_neutron_cm?: { TVL1: number; TVLe: number }; // Solo para >10 MV
  // Propiedades físicas
  compressive_strength_MPa?: number;
  thickness_mm_std?: number[]; // Espesores estándar disponibles
  // Precio aproximado (MXN por m² a espesor estándar)
  cost_MXN_m2_approx?: number;
  // Normativa de referencia
  normativa: string[];
  // Notas técnicas
  notes: string;
  // Fabricante
  manufacturer?: string;
  // Si es material NCRP 151 referencia
  isNCRP151?: boolean;
}

export const MATERIALS_DB: ShieldingMaterial[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CONCRETOS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'concrete-normal-235',
    name: 'Concreto normal',
    category: 'concrete',
    density_g_cm3: 2.35,
    TVL_primary_cm: tvlNCRP('concrete', 'primary'),
    TVL_secondary_cm: tvlNCRP('concrete', 'secondary'),
    TVL_neutron_cm: { TVL1: 31, TVLe: 21 },
    compressive_strength_MPa: 25,
    normativa: ['NCRP 151', 'IAEA SRS 47', 'NOM-008-NUCL-2018'],
    notes: 'Concreto convencional f\'c=250 kg/cm². Material de referencia NCRP 151 Tabla B.1.',
    isNCRP151: true,
  },
  {
    id: 'concrete-barite-335',
    name: 'Concreto barita (3.35)',
    category: 'barite',
    density_g_cm3: 3.35,
    TVL_primary_cm: { '6MV': 27.0, '10MV': 28.0, '15MV': 32.0, '18MV': 36.0, '25MV': 41.0, 'Co60': 16.5 },
    TVL_secondary_cm: { '6MV': 22.0, '10MV': 24.0, '15MV': 27.0, '18MV': 30.0, '25MV': 34.0, 'Co60': 13.5 },
    compressive_strength_MPa: 30,
    normativa: ['NCRP 151', 'IAEA SRS 47'],
    notes: 'Concreto con agregado de barita (BaSO4). Mayor densidad que concreto normal.',
    isNCRP151: true,
  },
  {
    id: 'concrete-iron-450',
    name: 'Concreto hierro (4.5)',
    category: 'concrete',
    density_g_cm3: 4.50,
    TVL_primary_cm: { '6MV': 20.0, '10MV': 21.0, '15MV': 23.5, '18MV': 26.0, '25MV': 30.0, 'Co60': 12.4 },
    TVL_secondary_cm: { '6MV': 17.0, '10MV': 18.0, '15MV': 20.0, '18MV': 22.0, '25MV': 25.0, 'Co60': 10.0 },
    compressive_strength_MPa: 35,
    normativa: ['NCRP 151'],
    notes: 'Concreto con agregado de hierro (magnetita/limonita). Alta densidad para blindaje compacto.',
    isNCRP151: true,
  },
  {
    id: 'nelco-n125',
    name: 'Nelco N125 (concreto barita)',
    category: 'barite',
    density_g_cm3: 3.25,
    TVL_primary_cm: { '6MV': 28.0, '10MV': 29.0, '15MV': 33.0, '18MV': 37.0, '25MV': 42.0, 'Co60': 17.0 },
    TVL_secondary_cm: { '6MV': 23.0, '10MV': 25.0, '15MV': 28.0, '18MV': 31.0, '25MV': 35.0, 'Co60': 14.0 },
    compressive_strength_MPa: 28,
    thickness_mm_std: [100, 150, 200, 250, 300],
    manufacturer: 'Nelco',
    normativa: ['NCRP 151', 'AAPM'],
    notes: 'Concreto barita premezclado comercial. Densidad nominal 3.25 g/cm³. Fabricado bajo pedido.',
  },
  {
    id: 'nelco-n145',
    name: 'Nelco N145 (concreto hierro)',
    category: 'concrete',
    density_g_cm3: 4.45,
    TVL_primary_cm: { '6MV': 20.5, '10MV': 21.5, '15MV': 24.0, '18MV': 26.5, '25MV': 30.5, 'Co60': 12.6 },
    TVL_secondary_cm: { '6MV': 17.5, '10MV': 18.5, '15MV': 20.5, '18MV': 22.5, '25MV': 25.5, 'Co60': 10.2 },
    compressive_strength_MPa: 32,
    thickness_mm_std: [80, 100, 150, 200, 250],
    manufacturer: 'Nelco',
    normativa: ['NCRP 151', 'AAPM'],
    notes: 'Concreto hierro premezclado comercial. Máxima densidad de la línea Nelco.',
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // ACEROS Y METALES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'steel-normal',
    name: 'Acero estructural',
    category: 'steel',
    density_g_cm3: 7.87,
    TVL_primary_cm: tvlNCRP('steel', 'primary'),
    TVL_secondary_cm: tvlNCRP('steel', 'secondary'),
    normativa: ['NCRP 151', 'IAEA SRS 47'],
    notes: 'Acero estructural A36/A992. Usado en placas, vigas, puertas blindadas.',
    isNCRP151: true,
  },
  {
    id: 'lead-cast',
    name: 'Plomo colado',
    category: 'lead',
    density_g_cm3: 11.34,
    TVL_primary_cm: tvlNCRP('lead', 'primary'),
    TVL_secondary_cm: tvlNCRP('lead', 'secondary'),
    thickness_mm_std: [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25],
    normativa: ['NCRP 151', 'IAEA SRS 47'],
    notes: 'Plomo puro ASTM B749. Para puertas, ventanas, juntas. TVL₁ 5.7 cm a 4–30 MV (NCRP 151 Tabla B.2).',
    isNCRP151: true,
  },
  {
    id: 'lead-sheet',
    name: 'Lámina de plomo',
    category: 'lead',
    density_g_cm3: 11.34,
    TVL_primary_cm: tvlNCRP('lead', 'primary'),
    TVL_secondary_cm: tvlNCRP('lead', 'secondary'),
    thickness_mm_std: [0.5, 1.0, 1.5, 2.0, 3.0],
    normativa: ['NCRP 147', 'NCRP 151'],
    notes: 'Lámina de plomo para blindaje de Rayos X diagnóstico y dental.',
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // MATERIALES COMPUESTOS / ESPECIALES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'verishield-220',
    name: 'VeriShield (2.20)',
    category: 'composite',
    density_g_cm3: 2.20,
    TVL_primary_cm: { '6MV': 40.0, '10MV': 40.0, '15MV': 44.0, '18MV': 48.0, '25MV': 53.0, 'Co60': 23.0 },
    TVL_secondary_cm: { '6MV': 33.0, '10MV': 34.0, '15MV': 37.0, '18MV': 41.0, '25MV': 46.0, 'Co60': 19.0 },
    thickness_mm_std: [50, 75, 100, 125, 150],
    manufacturer: 'MarShield',
    normativa: ['NCRP 151', 'AAPM'],
    notes: 'Panel compuesto de polímero con agregado mineral. Instalación en seco sin obra civil. Densidad 2.20 g/cm³.',
  },
  {
    id: 'verishield-260',
    name: 'VeriShield HD (2.60)',
    category: 'composite',
    density_g_cm3: 2.60,
    TVL_primary_cm: { '6MV': 34.0, '10MV': 35.0, '15MV': 39.0, '18MV': 42.0, '25MV': 47.0, 'Co60': 19.5 },
    TVL_secondary_cm: { '6MV': 28.0, '10MV': 29.0, '15MV': 33.0, '18MV': 36.0, '25MV': 40.0, 'Co60': 16.0 },
    thickness_mm_std: [40, 60, 80, 100, 125],
    manufacturer: 'MarShield',
    normativa: ['NCRP 151', 'AAPM'],
    notes: 'Panel compuesto alta densidad. Alternativa a concreto barita. Instalación modular.',
  },
  // Bloques HD TM NIPOL: TVL de diseño = envolvente por masa de concreto y acero NCRP 151 (ver ininBloquesHD.ts).
  // El certificado ININ LSCD-589/TD/2024 (3.5, 4.0 y 5.0 g/cm³) queda como evidencia, pendiente de validación.
  ...([
    ['tm-nipol-hd35', 3.5, 'TM NIPOL HD 3.5'],
    ['tm-nipoll-n40', 4.0, 'TM NIPOL HD 4.0'],
    ['tm-nipoll-n50', 5.0, 'TM NIPOL HD 5.0'],
    ['tm-nipol-hd55', 5.5, 'TM NIPOL HD 5.5 (recomendado linac; sin medición)'],
  ] as const).map(([id, nominal, name]): ShieldingMaterial => {
    const { rho, fuente } = densidadDiseno(nominal);
    return {
    id,
    name,
    category: 'composite',
    density_g_cm3: rho,
    TVL_primary_cm: Object.fromEntries(Object.entries(ENERGIAS).map(([k, e]) => [k, tvlDisenoHD(rho, e).tvl1_cm])),
    TVL_secondary_cm: Object.fromEntries(Object.entries(ENERGIAS).map(([k, e]) => [k, tvlFugaHD(rho, e)])),
    thickness_mm_std: [130, 260],
    manufacturer: 'TM NIPOL (México)',
    normativa: ['NCRP 151', 'ININ CE.CB.LSCD-589/TD/2024'],
    notes: `Bloque 13×13×26 cm, nominal ${nominal} g/cm³; densidad de diseño ${rho} (${fuente}). TVL = envolvente por masa de concreto y acero (NCRP 151); los TVL del ININ no se adoptan hasta validar (docs/validacion-bloques-hd.md).`,
    };
  }),
  {
    id: 'v-250',
    name: 'Bloques V-250 (concreto barita)',
    category: 'barite',
    density_g_cm3: 3.50,
    TVL_primary_cm: { '6MV': 25.0, '10MV': 26.5, '15MV': 29.5, '18MV': 32.5, '25MV': 37.0, 'Co60': 15.5 },
    TVL_secondary_cm: { '6MV': 20.0, '10MV': 22.0, '15MV': 24.5, '18MV': 27.0, '25MV': 31.0, 'Co60': 12.5 },
    thickness_mm_std: [50, 100, 150, 200, 250],
    normativa: ['NCRP 151', 'NOM-008-NUCL-2018'],
    notes: 'Bloques modulares de concreto barita V-250. Usados en paredes, puertas y techos.',
  },
  {
    id: 'borated-poly',
    name: 'Polietileno boratado (5%)',
    category: 'borated',
    density_g_cm3: 1.05,
    TVL_primary_cm: { '6MV': null, '10MV': null, '15MV': null, '18MV': null, '25MV': null, 'Co60': null },
    TVL_secondary_cm: { '6MV': null, '10MV': null, '15MV': null, '18MV': null, '25MV': null, 'Co60': null },
    TVL_neutron_cm: { TVL1: 5.5, TVLe: 4.5 },
    thickness_mm_std: [25, 50, 75, 100],
    normativa: ['NCRP 151', 'IAEA SRS 47'],
    notes: 'Para captura de neutrones térmicos. Siempre se usa con concreto (>10 MV). HVL_n ≈ 5 cm.',
  },
  {
    id: 'tungsten',
    name: 'Tungsteno',
    category: 'steel',
    density_g_cm3: 17.0,
    TVL_primary_cm: { '6MV': 3.8, '10MV': 4.0, '15MV': 4.5, '18MV': 5.0, '25MV': 5.8, 'Co60': 0.8 },
    TVL_secondary_cm: { '6MV': 3.2, '10MV': 3.4, '15MV': 3.8, '18MV': 4.2, '25MV': 4.8, 'Co60': 0.65 },
    normativa: ['NCRP 151'],
    notes: 'Metal denso para blindaje compacto. Usado en colimadores, aplicaciones especiales.',
    isNCRP151: true,
  },
  {
    id: 'aluminum',
    name: 'Aluminio',
    category: 'steel',
    density_g_cm3: 2.70,
    TVL_primary_cm: { '6MV': 45.0, '10MV': 45.0, '15MV': 50.0, '18MV': 55.0, '25MV': 60.0, 'Co60': 25.0 },
    TVL_secondary_cm: { '6MV': 38.0, '10MV': 38.0, '15MV': 42.0, '18MV': 46.0, '25MV': 52.0, 'Co60': 20.0 },
    normativa: ['NCRP 151'],
    notes: 'Baja densidad. No recomendado para blindaje primario.',
    isNCRP151: true,
  },
  {
    id: 'water',
    name: 'Agua',
    category: 'special',
    density_g_cm3: 1.00,
    TVL_primary_cm: { '6MV': 95.0, '10MV': 95.0, '15MV': 105.0, '18MV': 115.0, '25MV': 130.0, 'Co60': 52.0 },
    TVL_secondary_cm: { '6MV': 80.0, '10MV': 80.0, '15MV': 88.0, '18MV': 96.0, '25MV': 108.0, 'Co60': 42.0 },
    normativa: ['NCRP 151'],
    notes: 'Material de referencia ICRU. Útil para dosimetría y benchmarks.',
    isNCRP151: true,
  },
];

// ─── Funciones de búsqueda ───
export function getMaterialById(id: string): ShieldingMaterial | undefined {
  return MATERIALS_DB.find(m => m.id === id);
}

export function getMaterialsByCategory(category: ShieldingMaterial['category']): ShieldingMaterial[] {
  return MATERIALS_DB.filter(m => m.category === category);
}

export function getMaterialsByEnergy(energy_MeV: number): ShieldingMaterial[] {
  const key = energy_MeV === 60 ? 'Co60' : `${energy_MeV}MV`;
  return MATERIALS_DB.filter(m => m.TVL_primary_cm[key] !== null).sort(
    (a, b) => (a.TVL_primary_cm[key] || 999) - (b.TVL_primary_cm[key] || 999)
  );
}

export function getTVL(materialId: string, energy_MeV: number, type: 'primary' | 'secondary'): number | null {
  const mat = getMaterialById(materialId);
  if (!mat) return null;
  const key = energy_MeV === 60 ? 'Co60' : `${energy_MeV}MV`;
  if (type === 'primary') return mat.TVL_primary_cm[key] || null;
  return mat.TVL_secondary_cm[key] || null;
}

export function getRecommendedMaterial(thickness_cm: number, energy_MeV: number): { material: ShieldingMaterial; actualThickness: number; weight_kg_m2: number }[] {
  // Ordenar por TVL más pequeño = menos espesor necesario
  const mats = getMaterialsByEnergy(energy_MeV);
  return mats.map(m => {
    const key = energy_MeV === 60 ? 'Co60' : `${energy_MeV}MV`;
    const TVL = m.TVL_primary_cm[key] || 40;
    const n = Math.log10(1 / Math.pow(10, -thickness_cm / TVL));
    const actual_t = n * TVL;
    return { material: m, actualThickness: actual_t, weight_kg_m2: (actual_t / 100) * m.density_g_cm3 * 1000 };
  }).sort((a, b) => a.actualThickness - b.actualThickness);
}

// ─── Tabla resumen para UI ───
export interface MaterialSummary {
  id: string;
  name: string;
  density: number;
  category: string;
  TVL_6MV: string;
  TVL_18MV: string;
  TVL_Co60: string;
  manufacturer?: string;
}

export function getMaterialsSummary(): MaterialSummary[] {
  return MATERIALS_DB.map(m => ({
    id: m.id,
    name: m.name,
    density: m.density_g_cm3,
    category: m.category,
    TVL_6MV: m.TVL_primary_cm['6MV']?.toFixed(1) || 'N/A',
    TVL_18MV: m.TVL_primary_cm['18MV']?.toFixed(1) || 'N/A',
    TVL_Co60: m.TVL_primary_cm['Co60']?.toFixed(1) || 'N/A',
    manufacturer: m.manufacturer,
  }));
}
