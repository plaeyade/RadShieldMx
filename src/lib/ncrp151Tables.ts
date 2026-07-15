// =============================================================================
// ncrp151Tables.ts — Tablas NCRP 151 (2005) completas para consulta interactiva
// Incluye: Tablas B.1-B.10, Tabla 4.1 (Cargas de trabajo), Tabla B.2 (Ocupación)
// =============================================================================

export interface NCRPTable {
  id: string;
  title: string;
  description: string;
  section: string;
  columns: string[];
  rows: Record<string, (string | number)[]>;
  notes?: string[];
}

// ── Tabla B.1 — TVL en concreto (valores representativos) ──
export const TABLE_B1_TVL: NCRPTable = {
  id: 'B1',
  title: 'Tabla B.1 — Valores de TVL en concreto (ρ = 2.35 g/cm³)',
  description: 'Valores de Capa de Reducción de la Dosis (TVL) para haces primarios en concreto ordinario',
  section: 'NCRP 151 Appendix B',
  columns: ['Energía', 'TVL₁ (cm)', 'TVLe (cm)'],
  rows: {
    'Co-60': ['Co-60', 21.8, 18.0],
    '4 MV': ['4 MV', 35.0, 32.0],
    '6 MV': ['6 MV', 37.0, 31.0],
    '10 MV': ['10 MV', 41.0, 35.0],
    '15 MV': ['15 MV', 45.0, 39.0],
    '18 MV': ['18 MV', 45.0, 39.0],
    '20 MV': ['20 MV', 46.0, 40.0],
    '24 MV': ['24 MV', 50.0, 44.0],
  },
  notes: [
    'TVL₁ = primer TVL (buildup)',
    'TVLe = TVL de equilibrio (equilibrium)',
    'Para energías > 10 MV usar TVL₁ para el primer TVL y TVLe para los subsiguientes',
    'Fuente: NCRP 151 (2005) Tabla B.1',
  ],
};

// ── Tabla B.2 — Factores de ocupación T ──
export const TABLE_B2_OCCUPANCY: NCRPTable = {
  id: 'B2',
  title: 'Tabla B.2 — Factores de Ocupación (T)',
  description: 'Factores de ocupación para áreas adyacentes a salas de radioterapia',
  section: 'NCRP 151 §4.4.2',
  columns: ['Área/Tipo', 'Típico T', 'Rango'],
  rows: {
    'Control total': ['Sala de control / POE', 1.0, '1'],
    'Oficina': ['Oficinas, laboratorios, enfermería', 1.0, '0.5-1'],
    'Consultorio': ['Consultorios, área de pacientes', 0.5, '0.2-1'],
    'Pasillo pacientes': ['Pasillos de pacientes', 0.2, '0.1-0.5'],
    'Sala espera': ['Salas de espera de pacientes', 0.125, '0.0625-0.25'],
    'Público cerrado': ['Áreas público cerrado (baños)', 0.05, '0.025-0.2'],
    'Público transitado': ['Áreas público transitado', 0.025, '0.0125-0.05'],
    'Estacionamiento': ['Estacionamiento', 0.05, '0.025-0.2'],
    'Exterior no controlado': ['Área exterior no controlada', 0.025, '0.0125-0.05'],
    'Vivienda': ['Viviendas residenciales', 0.02, '0.01-0.05'],
    'Desocupado': ['Área desocupada / techos', 0.125, '0.0625-0.25'],
    'Sótano': ['Sótanos no habitables', 0.05, '0.025-0.2'],
  },
  notes: [
    'T = fracción del tiempo de trabajo que el área está ocupada mientras el haz está encendido',
    'Valores típicos recomendados por NCRP 151 §4.4.2',
    'El valor final debe determinarse por el Físico Médico basado en el caso específico',
  ],
};

// ── Tabla B.3 — Límites de dosis P ──
export const TABLE_B3_DOSE_LIMITS: NCRPTable = {
  id: 'B3',
  title: 'Tabla B.3 — Límites de Dosis de Diseño (P)',
  description: 'Límites de dosis para blindajes de radioterapia',
  section: 'NCRP 151 §4.4.1',
  columns: ['Clasificación', 'P (mSv/año)', 'P (mSv/semana)', 'Uso'],
  rows: {
    'POE USA': ['Personal Ocupacionalmente Expuesto (USA)', 5.0, 0.1, 'Sala de control, POE'],
    'Público USA': ['Público general (USA)', 1.0, 0.02, 'Áreas públicas'],
    'POE MX': ['Personal Ocupacional (México NOM-008)', 20.0, 0.4, 'Sala de control'],
    'Público MX': ['Público general (México NOM-008)', 5.0, 0.1, 'Áreas públicas'],
    'Embarazo USA': ['Mujer embarazada (USA)', 5.0, 0.1, 'Durante embarazo'],
    'Embarazo MX': ['Mujer embarazada (México)', 2.0, 0.04, 'Post-concepción'],
  },
  notes: [
    'México: NOM-008-NUCL-2018, Art. 7-9',
    'USA: NCRP 116 (1993), 10 CFR 20',
    'Para laberintos: P = 0.02 mSv/semana (público) o 0.1 mSv/semana (POE)',
  ],
};

// ── Tabla 4.1 — Cargas de trabajo W típicas ──
export const TABLE_41_WORKLOAD: NCRPTable = {
  id: '41',
  title: 'Tabla 4.1 — Cargas de Trabajo Típicas (W)',
  description: 'Cargas de trabajo semanales típicas para LINAC de radioterapia',
  section: 'NCRP 151 §4.5',
  columns: ['Técnica', 'W típico (Gy/sem)', 'Pacientes/sem', 'Notas'],
  rows: {
    'Convencional': ['Convencional (3D-CRT)', 450, 25, 'W = 450 Gy/sem, C₁ = 1.0'],
    'IMRT': ['IMRT', 450, 25, 'C₁ = 2.5, W_L = 1125 Gy/sem eq.'],
    'VMAT': ['VMAT/RapidArc', 450, 25, 'C₁ = 4.0, W_L = 1800 Gy/sem eq.'],
    'SBRT': ['SBRT/SABR', 100, 5, 'C₁ = 5.0, W_L = 500 Gy/sem eq.'],
    'SRS': ['SRS (mono-sesión)', 50, 10, 'C₁ = 8.0, W_L = 400 Gy/sem eq.'],
    'IGRT CBCT': ['IGRT con CBCT', 'Adicional', '-', '+0.1-1.0 mSv/sem a puerta'],
  },
  notes: [
    'W = carga de trabajo en Gy/semana al isocentro',
    'W_L = W × C₁ = carga de trabajo modificada (Eq. 4.35)',
    'Valores típicos, deben ajustarse al caso específico',
  ],
};

// ── Tabla B.4 — Fracciones de dispersión α ──
export const TABLE_B4_SCATTER_FRACTION: NCRPTable = {
  id: 'B4',
  title: 'Tabla B.4 — Fracciones de Dispersión (α) por Ángulo',
  description: 'Fracción de radiación dispersa por unidad de área a 1 m del paciente',
  section: 'NCRP 151 §4.8',
  columns: ['Ángulo (°)', '6 MV', '10 MV', '15 MV', '18 MV'],
  rows: {
    '15': ['15°', 3.0e-3, 2.5e-3, 2.0e-3, 1.8e-3],
    '30': ['30°', 2.5e-3, 2.0e-3, 1.7e-3, 1.5e-3],
    '45': ['45°', 1.8e-3, 1.5e-3, 1.3e-3, 1.2e-3],
    '60': ['60°', 1.2e-3, 1.0e-3, 8.5e-4, 7.5e-4],
    '90': ['90°', 6.0e-4, 5.0e-4, 4.2e-4, 3.8e-4],
    '120': ['120°', 3.5e-4, 3.0e-4, 2.5e-4, 2.2e-4],
    '135': ['135°', 2.8e-4, 2.4e-4, 2.0e-4, 1.8e-4],
  },
  notes: [
    'α = fracción de dosis dispersa por unidad de área a 1 m (m²)',
    'Para campo de 400 cm² (20×20 cm)',
    'Fuente: NCRP 151 (2005) Tabla B.4',
  ],
};

// ── Tabla B.5 — HVL y TVL para Co-60 (Gamma Knife) ──
export const TABLE_B5_CO60: NCRPTable = {
  id: 'B5',
  title: 'Tabla B.5 — HVL y TVL para Co-60 (1.25 MeV)',
  description: 'Valores de media capa y capa de reducción de dosis para Co-60',
  section: 'NCRP 151 Appendix B',
  columns: ['Material', 'ρ (g/cm³)', 'HVL (cm)', 'TVL (cm)'],
  rows: {
    'Concreto': ['Concreto', 2.35, 6.6, 21.8],
    'Acero': ['Acero', 7.87, 1.6, 5.5],
    'Plomo': ['Plomo', 11.34, 0.5, 1.7],
    'Barita': ['Concreto barita', 3.35, 4.5, 16.5],
    'Hierro': ['Concreto hierro', 4.50, 3.5, 12.4],
  },
  notes: [
    'Gamma Knife usa 201 fuentes de Co-60 (1.17 + 1.33 MeV)',
    'TVL efectivo considera geometría múltiple fuente',
    'NCRP 151 §4.8.6 método especial para GK',
  ],
};

// ── Tabla B.6 — Transmission Ir-192 HDR ──
export const TABLE_B6_IR192: NCRPTable = {
  id: 'B6',
  title: 'Tabla B.6 — HVL/TVL Ir-192 HDR (380 keV promedio)',
  description: 'Valores de blindaje para braquiterapia HDR con Ir-192',
  section: 'NCRP 151 / IAEA TECDOC 1274',
  columns: ['Material', 'HVL (mm)', 'TVL (mm)'],
  rows: {
    'Concreto': ['Concreto', 50, 170],
    'Plomo': ['Plomo', 3.0, 10.0],
    'Acero': ['Acero', 14, 47],
    'Barita': ['Concreto barita', 36, 120],
  },
  notes: [
    'Energía promedio Ir-192: 380 keV (γ)',
    'Valores aproximados para blindaje de habitación',
    'PMID 8630660: TVL medidos para blindaje HDR',
  ],
};

// ── Tabla B.7 — Transmission Tc-99m, I-131, F-18 ──
export const TABLE_B7_NUCLEAR_MED: NCRPTable = {
  id: 'B7',
  title: 'Tabla B.7 — Blindaje Medicina Nuclear (Broad Beam)',
  description: 'Transmission factors para radionúclidos comunes en medicina nuclear',
  section: 'PMC12059296 / AAPM TG 108',
  columns: ['Radionúclido', 'Energía', 'Concreto TVL (cm)', 'Plomo HVL (mm)'],
  rows: {
    'Tc-99m': ['Tc-99m', '140 keV', 11.0, 0.3],
    'I-131': ['I-131', '364 keV', 17.0, 3.0],
    'F-18': ['F-18 (PET)', '511 keV', 26.0, 5.5],
    'Ga-68': ['Ga-68 (PET)', '511 keV', 26.0, 5.5],
    'Lu-177': ['Lu-177', '208 keV', 14.0, 2.0],
    'Y-90': ['Y-90', 'Beta', 'N/A (beta shielding)', 'N/A'],
  },
  notes: [
    'Broad beam transmission factors (PMC12059296)',
    'Para F-18/Ga-68: usar TVL concreto para PET/CT (AAPM TG-108)',
    'Y-90: blindaje principalmente Bremmstrahlung',
  ],
};

// ── Tabla B.8 — Neutrones: TVL y método Kersey ──
export const TABLE_B8_NEUTRONS: NCRPTable = {
  id: 'B8',
  title: 'Tabla B.8 — Blindaje Neutrones (> 10 MV)',
  description: 'TVL para neutrones y parámetros del método Kersey',
  section: 'NCRP 151 §5.3 / Kersey (1979)',
  columns: ['Parámetro', 'Concreto (ρ=2.35)', 'Concreto barita', 'Polietileno boratado'],
  rows: {
    'TVL1 neutrones': ['TVL₁ neutrones (cm)', 31, 25, 8.5],
    'TVLe neutrones': ['TVLe neutrones (cm)', 21, 18, 6.0],
    'Kersey method': ['Método Kersey', 'W × Qn × (1/r²) × TVL', 'Eq. 5.1-5.3', 'NCRP 151 §5.3'],
    'Fluence KIUBE': ['Fluencia IBA KIUBE', '3.55×10¹¹ n/s @ 40µA', '18O(p,n)18F', 'IBA MID 55672'],
  },
  notes: [
    'Neutrones significativos solo para energías > 10 MV',
    'Método Kersey: t = TVL₁ + (n-1)×TVLe donde n = log₁₀(K_unshielded/P)',
    'Kersey modificado: incluye componente de captura gamma',
  ],
};

// ── Tabla B.9 — Distancia fuente-punto dsca ──
export const TABLE_B9_DISTANCE: NCRPTable = {
  id: 'B9',
  title: 'Tabla B.9 — Distancias Típicas Fuente-Punto (d)',
  description: 'Distancias típicas para cálculo de blindaje',
  section: 'NCRP 151 §4.6',
  columns: ['Barrera', 'Distancia típica (m)', 'Rango (m)'],
  rows: {
    'Pared primaria': ['Pared primaria (Gantry 0°)', 4.5, '3.5-6.0'],
    'Pared secundaria': ['Pared secundaria', 3.0, '2.5-5.0'],
    'Techo': ['Techo (skyshine)', 3.5, '2.5-5.0'],
    'Puerta laberinto': ['Puerta laberinto (primera)', 2.5, '2.0-4.0'],
    'Puerta laberinto2': ['Puerta laberinto (segunda)', 4.0, '3.0-6.0'],
    'Sótano': ['Sótano/piso', 2.0, '1.5-3.0'],
  },
  notes: [
    'd = distancia desde el isocentro (fuente) al punto de cálculo',
    'Para LINAC modernos: isocentro a 1.0-1.3 m del piso',
    'Gantry rotation: considerar posición más desfavorable',
  ],
};

// ── Tabla B.10 — Factores U (Uso) ──
export const TABLE_B10_USE_FACTOR: NCRPTable = {
  id: 'B10',
  title: 'Tabla B.10 — Factores de Uso (U)',
  description: 'Fracción del tiempo de trabajo que el haz primario apunta a cada barrera',
  section: 'NCRP 151 §4.4.3',
  columns: ['Orientación', 'U típico', 'Notas'],
  rows: {
    'Pared A': ['Pared A (0°)', 0.25, 'Haz horizontal, lado gantry 0°'],
    'Pared B': ['Pared B (90°)', 0.25, 'Haz horizontal, lado gantry 90°'],
    'Pared C': ['Pared C (180°)', 0.25, 'Haz horizontal, lado gantry 180°'],
    'Pared D': ['Pared D (270°)', 0.25, 'Haz horizontal, lado gantry 270°'],
    'Techo': ['Techo', 0.25, 'Arco superior del gantry'],
    'Piso': ['Piso/Sótano', 0.25, 'Arco inferior del gantry'],
    'Laberinto': ['Laberinto', 0.0, 'Haz primario NO apunta al laberinto'],
  },
  notes: [
    'U = fracción del tiempo de trabajo que el haz primario apunta a la barrera',
    'Para salas con laberinto: U = 0 en la dirección del laberinto',
    'La suma de todos los U para haces primarios = 1.0',
    'Para IMRT/VMAT: distribución más uniforme, U ≈ 0.25 en todas las direcciones',
  ],
};

// ── Colección completa ──
export const ALL_NCRP151_TABLES: NCRPTable[] = [
  TABLE_41_WORKLOAD,
  TABLE_B1_TVL,
  TABLE_B2_OCCUPANCY,
  TABLE_B3_DOSE_LIMITS,
  TABLE_B4_SCATTER_FRACTION,
  TABLE_B5_CO60,
  TABLE_B6_IR192,
  TABLE_B7_NUCLEAR_MED,
  TABLE_B8_NEUTRONS,
  TABLE_B9_DISTANCE,
  TABLE_B10_USE_FACTOR,
];

export function getTableById(id: string): NCRPTable | undefined {
  return ALL_NCRP151_TABLES.find(t => t.id === id);
}

export function searchTables(query: string): NCRPTable[] {
  const q = query.toLowerCase();
  return ALL_NCRP151_TABLES.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    Object.keys(t.rows).some(k => k.toLowerCase().includes(q))
  );
}
