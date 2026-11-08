// =============================================================================
// RadSHIELD Mx Shielding Protocol — IGLIN-280880 (UAQ)
// Ecuaciones de blindaje de búnkeres de teleterapia basadas en:
//   NCRP 151, IAEA SRS 47, NOM-008-NUCL-2018
// Autor: Fernando de Jesús González Aguilar (UAQ, 2023)
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// Tabla 3.2 — Límites de dosis (México)
// ─────────────────────────────────────────────────────────────────────────────
export const MEXICO_DOSE_LIMITS = {
  controlled_annual_mSv: 20,     // POE — Personal Ocupacionalmente Expuesto
  controlled_weekly_mSv: 0.4,   // 20 mSv / 50 semanas
  public_annual_mSv: 5,          // Público general
  public_weekly_mSv: 0.1,       // 5 mSv / 50 semanas
  alara_annual_mSv: 1,           // ALARA
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabla 3.3 — Factores de uso U (NCRP 151 §4.2.2)
// ─────────────────────────────────────────────────────────────────────────────
export const USE_FACTORS: Record<string, number> = {
  floor: 1.0,           // Piso (incidencia vertical)
  ceiling: 0.25,        // Techo (ángulo lateral)
  wall_primary: 0.25,   // Pared primaria (una dirección)
  wall_secondary: 1.0,  // Pared secundaria (dispersión omnidireccional)
  door: 0.0,            // Puerta (protegida por laberinto)
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabla 3.4 — Factores de ocupación T (NCRP 151 §4.2.1)
// ─────────────────────────────────────────────────────────────────────────────
export const OCCUPANCY_FACTORS: Record<string, number> = {
  'control_total': 1.0,
  'oficina': 0.5,
  'pasillo_pacientes': 0.5,
  'pasillo_publico': 0.2,
  'sala_espera': 0.25,
  'bano_publico': 0.2,
  'almacen': 0.2,
  'estacionamiento': 0.05,
  'escalera': 0.05,
  'ascensor': 0.05,
  'exterior': 0.2,
  'laboratorio': 0.5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabla B.1 — TVL primaria (cm) por energía y material
// Fuente: NCRP 151, Tabla B.1
// ─────────────────────────────────────────────────────────────────────────────
// =============================================================================
// TVL Primaria — Todos los materiales (16) incluyendo VeriShield, TM Nipoll,
// Nelco, V-250, borated poly, tungsten, etc. (v14.2)
// Alias: IDs de materialDatabase.ts mapean a sus datos correspondientes
// =============================================================================
export const TVL_PRIMARIA_CM: Record<string, Record<string, number>> = {
  // ── Concretos ──
  concrete235:       { '6MV': 37.0, '10MV': 37.0, '15MV': 41.0, '18MV': 45.0, '25MV': 50.0, 'Co60': 21.8 },
  'concrete-normal-235': { '6MV': 37.0, '10MV': 37.0, '15MV': 41.0, '18MV': 45.0, '25MV': 50.0, 'Co60': 21.8 },
  'concrete-barite-335': { '6MV': 27.0, '10MV': 28.0, '15MV': 32.0, '18MV': 36.0, '25MV': 41.0, 'Co60': 16.5 },
  barite:            { '6MV': 25.0, '10MV': 26.5, '15MV': 29.5, '18MV': 32.5, '25MV': 37.0, 'Co60': 15.5 },
  'barite350':       { '6MV': 25.0, '10MV': 26.5, '15MV': 29.5, '18MV': 32.5, '25MV': 37.0, 'Co60': 15.5 },
  'v-250':           { '6MV': 25.0, '10MV': 26.5, '15MV': 29.5, '18MV': 32.5, '25MV': 37.0, 'Co60': 15.5 },
  'concrete-iron-450': { '6MV': 20.0, '10MV': 21.0, '15MV': 23.5, '18MV': 26.0, '25MV': 30.0, 'Co60': 12.4 },
  iron450:           { '6MV': 20.0, '10MV': 21.0, '15MV': 23.5, '18MV': 26.0, '25MV': 30.0, 'Co60': 12.4 },
  // ── Aceros ──
  steel:             { '6MV': 8.5,  '10MV': 9.0,  '15MV': 10.0, '18MV': 11.0, '25MV': 12.5, 'Co60': 5.5 },
  'steel-normal':    { '6MV': 8.5,  '10MV': 9.0,  '15MV': 10.0, '18MV': 11.0, '25MV': 12.5, 'Co60': 5.5 },
  // ── Plomos ──
  lead:              { '6MV': 5.5,  '10MV': 6.0,  '15MV': 7.0,  '18MV': 8.0,  '25MV': 9.5, 'Co60': 1.13 },
  'lead-cast':       { '6MV': 5.5,  '10MV': 6.0,  '15MV': 7.0,  '18MV': 8.0,  '25MV': 9.5, 'Co60': 1.13 },
  'lead-sheet':      { '6MV': 5.5,  '10MV': 6.0,  '15MV': 7.0,  '18MV': 8.0,  '25MV': 9.5, 'Co60': 1.13 },
  // ── Compuestos comerciales ──
  'verishield-220':  { '6MV': 40.0, '10MV': 40.0, '15MV': 44.0, '18MV': 48.0, '25MV': 53.0, 'Co60': 23.0 },
  'verishield-260':  { '6MV': 34.0, '10MV': 35.0, '15MV': 39.0, '18MV': 42.0, '25MV': 47.0, 'Co60': 19.5 },
  'tm-nipoll-n40':   { '6MV': 21.1, '10MV': 23.6, '15MV': 26.2, '18MV': 27.5, '25MV': 29.4, 'Co60': 13.4 },  // TVLe NCRP 151 concreto × 2.35/ρ seca IMCYC (ininBloquesHD.ts)
  'tm-nipoll-n50':   { '6MV': 19.4, '10MV': 21.8, '15MV': 24.1, '18MV': 25.3, '25MV': 27.1, 'Co60': 12.4 },  // TVLe NCRP 151 concreto × 2.35/ρ seca IMCYC (ininBloquesHD.ts)
  'nelco-n125':      { '6MV': 28.0, '10MV': 29.0, '15MV': 33.0, '18MV': 37.0, '25MV': 42.0, 'Co60': 17.0 },
  'nelco-n145':      { '6MV': 20.5, '10MV': 21.5, '15MV': 24.0, '18MV': 26.5, '25MV': 30.5, 'Co60': 12.6 },
  // ─– Especiales ──
  tungsten:          { '6MV': 3.8,  '10MV': 4.2,  '15MV': 5.0,  '18MV': 5.8,  '25MV': 7.0, 'Co60': 0.8 },
  'borated-poly':    { '6MV': 55.0, '10MV': 60.0, '15MV': 70.0, '18MV': 80.0, '25MV': 95.0, 'Co60': 35.0 }, // Neutrones principalmente
  'lx-57b':          { '6MV': 35.0, '10MV': 36.0, '15MV': 40.0, '18MV': 44.0, '25MV': 49.0, 'Co60': 20.5 },
  'brick-barite':    { '6MV': 32.0, '10MV': 33.0, '15MV': 37.0, '18MV': 41.0, '25MV': 46.0, 'Co60': 19.0 },
};

// TVL₁ (first TVL) para energías > 10 MV (efecto de buildup)
export const TVL1_PRIMARIA_CM: Record<string, Record<string, number>> = {
  concrete235:       { '10MV': 36.0, '15MV': 40.0, '18MV': 44.0, '25MV': 49.0 },
  'concrete-normal-235': { '10MV': 36.0, '15MV': 40.0, '18MV': 44.0, '25MV': 49.0 },
  'concrete-barite-335': { '10MV': 27.0, '15MV': 31.0, '18MV': 35.0, '25MV': 40.0 },
  barite:            { '10MV': 25.5, '15MV': 28.5, '18MV': 31.5, '25MV': 36.0 },
  'v-250':           { '10MV': 25.5, '15MV': 28.5, '18MV': 31.5, '25MV': 36.0 },
  'concrete-iron-450': { '10MV': 20.0, '15MV': 23.0, '18MV': 25.0, '25MV': 29.0 },
  iron450:           { '10MV': 20.0, '15MV': 23.0, '18MV': 25.0, '25MV': 29.0 },
  steel:             { '10MV': 8.8,  '15MV': 9.8,  '18MV': 10.8, '25MV': 12.2 },
  'steel-normal':    { '10MV': 8.8,  '15MV': 9.8,  '18MV': 10.8, '25MV': 12.2 },
  lead:              { '10MV': 5.7,  '15MV': 6.7,  '18MV': 7.7,  '25MV': 9.0 },
  'lead-cast':       { '10MV': 5.7,  '15MV': 6.7,  '18MV': 7.7,  '25MV': 9.0 },
  'lead-sheet':      { '10MV': 5.7,  '15MV': 6.7,  '18MV': 7.7,  '25MV': 9.0 },
  'verishield-220':  { '10MV': 39.0, '15MV': 43.0, '18MV': 47.0, '25MV': 52.0 },
  'verishield-260':  { '10MV': 34.0, '15MV': 38.0, '18MV': 41.0, '25MV': 46.0 },
  'tm-nipoll-n40':   { '10MV': 26.2, '15MV': 28.1, '18MV': 28.7, '25MV': 31.3 },
  'tm-nipoll-n50':   { '10MV': 24.1, '15MV': 25.9, '18MV': 26.5, '25MV': 28.9 },
  'nelco-n125':      { '10MV': 28.0, '15MV': 32.0, '18MV': 36.0, '25MV': 41.0 },
  'nelco-n145':      { '10MV': 21.0, '15MV': 23.0, '18MV': 25.0, '25MV': 29.0 },
  tungsten:          { '10MV': 4.0,  '15MV': 4.8,  '18MV': 5.5,  '25MV': 6.8 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabla B.2 — Propiedades de materiales de blindaje
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Propiedades de materiales — 16 materiales con densidad y TVL referencia
// v14.2: Todos los materiales de materialDatabase.ts
// ─────────────────────────────────────────────────────────────────────────────
export const MATERIAL_PROPERTIES_CALC: Record<string, { density: number; TVL_6MV_cm: number; TVL_Co60_cm: number; name: string }> = {
  // Concretos
  concrete235:        { density: 2.35, TVL_6MV_cm: 37.0, TVL_Co60_cm: 21.8, name: 'Concreto normal' },
  'concrete-normal-235': { density: 2.35, TVL_6MV_cm: 37.0, TVL_Co60_cm: 21.8, name: 'Concreto normal' },
  'concrete-barite-335': { density: 3.35, TVL_6MV_cm: 27.0, TVL_Co60_cm: 16.5, name: 'Concreto barita' },
  barite:             { density: 3.50, TVL_6MV_cm: 25.0, TVL_Co60_cm: 15.5, name: 'Barita' },
  barite350:          { density: 3.50, TVL_6MV_cm: 25.0, TVL_Co60_cm: 15.5, name: 'Barita 3.50' },
  'v-250':            { density: 3.50, TVL_6MV_cm: 25.0, TVL_Co60_cm: 15.5, name: 'Bloques V-250' },
  'concrete-iron-450': { density: 4.50, TVL_6MV_cm: 20.0, TVL_Co60_cm: 12.4, name: 'Concreto hierro' },
  iron450:            { density: 4.50, TVL_6MV_cm: 20.0, TVL_Co60_cm: 12.4, name: 'Concreto hierro' },
  // Aceros
  steel:              { density: 7.87, TVL_6MV_cm: 8.5,  TVL_Co60_cm: 5.5,  name: 'Acero' },
  'steel-normal':     { density: 7.87, TVL_6MV_cm: 8.5,  TVL_Co60_cm: 5.5,  name: 'Acero estructural' },
  // Plomos
  lead:               { density: 11.34, TVL_6MV_cm: 5.5,  TVL_Co60_cm: 1.13, name: 'Plomo' },
  'lead-cast':        { density: 11.34, TVL_6MV_cm: 5.5,  TVL_Co60_cm: 1.13, name: 'Plomo colado' },
  'lead-sheet':       { density: 11.34, TVL_6MV_cm: 5.5,  TVL_Co60_cm: 1.13, name: 'Lamina plomo' },
  // Compuestos comerciales
  'verishield-220':   { density: 2.20, TVL_6MV_cm: 40.0, TVL_Co60_cm: 23.0, name: 'VeriShield 2.20' },
  'verishield-260':   { density: 2.60, TVL_6MV_cm: 34.0, TVL_Co60_cm: 19.5, name: 'VeriShield 2.60' },
  'tm-nipoll-n40':    { density: 3.68, TVL_6MV_cm: 21.1, TVL_Co60_cm: 13.4, name: 'TM NIPOL HD 4.0 (ρ seca 3.68)' },
  'tm-nipoll-n50':    { density: 3.99, TVL_6MV_cm: 19.4, TVL_Co60_cm: 12.4, name: 'TM NIPOL HD 5.0 (ρ seca 3.99)' },
  'nelco-n125':       { density: 3.25, TVL_6MV_cm: 28.0, TVL_Co60_cm: 17.0, name: 'Nelco N125' },
  'nelco-n145':       { density: 4.45, TVL_6MV_cm: 20.5, TVL_Co60_cm: 12.6, name: 'Nelco N145' },
  // Especiales
  tungsten:           { density: 17.0, TVL_6MV_cm: 3.8,  TVL_Co60_cm: 0.8,  name: 'Tungsteno' },
  'borated-poly':     { density: 0.95, TVL_6MV_cm: 55.0, TVL_Co60_cm: 35.0, name: 'Polietileno boratado 5%' },
  'lx-57b':           { density: 2.40, TVL_6MV_cm: 35.0, TVL_Co60_cm: 20.5, name: 'Vidrio plomado LX-57B' },
  'brick-barite':     { density: 2.80, TVL_6MV_cm: 32.0, TVL_Co60_cm: 19.0, name: 'Ladrillo baritico' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabla B.3 — Fracciones de dispersión α por ángulo y energía
// ─────────────────────────────────────────────────────────────────────────────
// α (m²) para campo 400 cm² a 1m
export const SCATTER_FRACTION_ALPHA: Record<string, Record<string, number>> = {
  // energy → angle: value
  '6MV':  { '15': 2.77e-3, '30': 1.39e-3, '45': 7.12e-4, '60': 4.46e-4, '90': 2.74e-4, '135': 2.16e-4 },
  '10MV': { '15': 3.18e-3, '30': 1.60e-3, '45': 8.20e-4, '60': 5.10e-4, '90': 3.18e-4, '135': 2.52e-4 },
  '15MV': { '15': 3.50e-3, '30': 1.74e-3, '45': 8.90e-4, '60': 5.52e-4, '90': 3.40e-4, '135': 2.70e-4 },
  '18MV': { '15': 3.60e-3, '30': 1.80e-3, '45': 9.20e-4, '60': 5.70e-4, '90': 3.50e-4, '135': 2.78e-4 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabla B.9 — PDD al 30 cm para factor f (NCRP 151)
// ─────────────────────────────────────────────────────────────────────────────
// f = PDD(30) / PDD(10)
export const PDD_AT_30CM: Record<string, number> = {
  '6MV': 0.73, '10MV': 0.68, '15MV': 0.62, '18MV': 0.60, '25MV': 0.55,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabla B.10 — H₀ y Qₙ por energía y fabricante (NCRP 151)
// ─────────────────────────────────────────────────────────────────────────────
export const HEAD_LEAKAGE_H0: Record<string, number> = {
  '4MV': 0.001, '6MV': 0.001, '10MV': 0.001, '15MV': 0.002, '18MV': 0.003,
  '25MV': 0.005, 'Co60': 0.001,
};

// Factor de calidad para neutrones (Gy → Sv)
export const QUALITY_FACTOR_QN: Record<string, number> = {
  '6MV': 0.05, '10MV': 0.10, '15MV': 0.20, '18MV': 0.30, '25MV': 0.50,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabla 5.1 — Bloques V-250 (propiedades TVL puerta)
// ─────────────────────────────────────────────────────────────────────────────
export const V250_BLOCKS: Record<string, Record<string, number>> = {
  V250A: { TVL1_p_cm: 0.221, TVLe_p_cm: 0.221, TVL1_s_cm: 0.171, TVLe_s_cm: 0.171, densidad: 3.75 },
  V250B: { TVL1_p_cm: 0.230, TVLe_p_cm: 0.230, TVL1_s_cm: 0.178, TVLe_s_cm: 0.178, densidad: 3.70 },
  V250C: { TVL1_p_cm: 0.238, TVLe_p_cm: 0.238, TVL1_s_cm: 0.184, TVLe_s_cm: 0.184, densidad: 3.65 },
  V250D: { TVL1_p_cm: 0.248, TVLe_p_cm: 0.248, TVL1_s_cm: 0.192, TVLe_s_cm: 0.192, densidad: 3.60 },
  V250E: { TVL1_p_cm: 0.261, TVLe_p_cm: 0.261, TVL1_s_cm: 0.202, TVLe_s_cm: 0.202, densidad: 3.50 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Factor C₁ para IMRT/VMAT (Tesis §4.8.5)
// ─────────────────────────────────────────────────────────────────────────────
export const C1_IMRT_FACTORS: Record<string, number> = {
  '3D-CRT': 1.0,
  'IMRT': 2.5,        // 2-5 según complejidad
  'VMAT': 4.0,        // 3-6 según complejidad
  'SBRT': 5.0,        // 4-10 según complejidad
  'TBI': 3.0,         // técnica especial
  'SRS': 8.0,         // 5-10 alta complejidad
};

// ─────────────────────────────────────────────────────────────────────────────
// Carga de trabajo modificada para IMRT (Ecuación del autor, §4.8.5)
// W_L = W_conv(F_conv) + W_IMRT(F_IMRT)(C₁)
// ─────────────────────────────────────────────────────────────────────────────
export function calculateModifiedWorkload(
  W_conv: number,          // carga convencional (Gy/sem)
  F_conv: number,          // fracción convencional (decimal)
  W_IMRT: number,         // carga IMRT (Gy/sem)
  F_IMRT: number,         // fracción IMRT (decimal)
  technique: string        // técnica para C₁
): number {
  const C1 = C1_IMRT_FACTORS[technique] || 1.0;
  return W_conv * F_conv + W_IMRT * F_IMRT * C1;
}

// =============================================================================
// CAPÍTULO 4 — ECUACIONES DE CÁLCULO
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIÓN 4.1 — Transmisión requerida
// B = P × (d_pri)² / (W × U × T)
// ─────────────────────────────────────────────────────────────────────────────
export function eq41_TransmissionRequired(
  P_mSv_per_wk: number,   // objetivo de diseño (mSv/sem)
  d_pri_m: number,        // distancia fuente-punto (m)
  W_Gy_per_wk: number,    // carga de trabajo (Gy/sem)
  U: number,              // factor de uso
  T: number               // factor de ocupación
): number {
  if (W_Gy_per_wk <= 0 || U <= 0 || T <= 0) return 0;
  return (P_mSv_per_wk * d_pri_m * d_pri_m) / (W_Gy_per_wk * 1000 * U * T);
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIÓN 4.2 — Número de TVL (primaria, n > 1)
// n = −log₁₀(B) = log₁₀(1/B)
// ─────────────────────────────────────────────────────────────────────────────
export function eq42_nTVL(B: number): number {
  if (B <= 0) return 100; // máximo práctico
  return Math.log10(1 / B);
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIÓN 4.3 — Espesor de barrera primaria (cm)
// t = TVL₁ + (n − 1) × TVLₑ
// Para n ≤ 1: t = n × TVL₁
// ─────────────────────────────────────────────────────────────────────────────
export function eq43_BarrierThickness(
  n: number,               // número de TVL
  TVL1_cm: number,        // primer TVL (cm)
  TVLe_cm: number         // TVL de equilibrio (cm)
): number {
  if (n <= 0) return 0;
  if (n <= 1) return n * TVL1_cm;
  return TVL1_cm + (n - 1) * TVLe_cm;
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIÓN 4.4 — Dosis equivalente semanal sin blindaje
// Ḣ_u = (W × U × T) / d²
// ─────────────────────────────────────────────────────────────────────────────
export function eq44_UnshieldedKerma(
  W_Gy_per_wk: number,
  U: number,
  T: number,
  d_m: number
): number {
  if (d_m <= 0) return Infinity;
  return (W_Gy_per_wk * 1000 * U * T) / (d_m * d_m);
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIONES 4.8-4.10 — Barrera secundaria (dispersión)
// Ḣ = (W × T × α × (F/400)) / (d_sca² × d_sec²)
// ─────────────────────────────────────────────────────────────────────────────
export function eq48_ScatterKerma(
  W_Gy_per_wk: number,
  T: number,
  alpha_m2: number,      // fracción de dispersión
  F_cm2: number,         // área de campo (cm²)
  d_sca_m: number,       // distancia fuente-paciente (m)
  d_sec_m: number        // distancia paciente-barrera (m)
): number {
  if (d_sca_m <= 0 || d_sec_m <= 0) return Infinity;
  return (W_Gy_per_wk * 1000 * T * alpha_m2 * (F_cm2 / 400)) / (d_sca_m * d_sca_m * d_sec_m * d_sec_m);
}

// Espesor de barrera secundaria por dispersión
export function eq49_SecondaryScatterThickness(
  H_mSv_per_wk: number,
  P_mSv_per_wk: number,
  TVL1_L_cm: number,
  TVL_Le_cm: number
): number {
  if (H_mSv_per_wk <= P_mSv_per_wk) return 0;
  const B = P_mSv_per_wk / H_mSv_per_wk;
  const n = eq42_nTVL(B);
  return eq43_BarrierThickness(n, TVL1_L_cm, TVL_Le_cm);
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIÓN 4.11 — Fuga del cabezal
// Ḣ = (W × T × 10⁻³ × f) / d_L²
// donde f = PDD(30)/PDD(10) para > 10 MV
// ─────────────────────────────────────────────────────────────────────────────
export function eq411_LeakageKerma(
  W_Gy_per_wk: number,
  T: number,
  H0: number,              // fracción de fuga (ej: 0.001)
  f_factor: number,        // factor f para >10 MV (1.0 para ≤10 MV)
  d_L_m: number            // distancia a la barrera (m)
): number {
  if (d_L_m <= 0) return Infinity;
  return (W_Gy_per_wk * 1000 * T * H0 * f_factor) / (d_L_m * d_L_m);
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIONES 4.12-4.13 — Regla de las dos fuentes
// t_ps = TVL_L × log₁₀(1 + 10^(t_L/TVL_L))
// ─────────────────────────────────────────────────────────────────────────────
export function eq412_TwoSourceRule(
  t_L_cm: number,         // espesor por fuga (cm)
  t_ps_cm: number,        // espesor por dispersión (cm)
  TVL_L_cm: number        // TVL de radiación de fuga (cm)
): number {
  if (TVL_L_cm <= 0) return Math.max(t_L_cm, t_ps_cm);
  const term = Math.pow(10, t_L_cm / TVL_L_cm) + Math.pow(10, t_ps_cm / TVL_L_cm);
  return TVL_L_cm * Math.log10(term);
}

// Dosis equivalente transmitida por barrera de dos fuentes
export function eq413_TwoSourceDose(
  H_L_mSv: number,        // dosis por fuga
  H_ps_mSv: number,       // dosis por dispersión
  t_L_cm: number,
  t_ps_cm: number,
  TVL_L_cm: number
): number {
  if (TVL_L_cm <= 0) return H_L_mSv + H_ps_mSv;
  return H_L_mSv * Math.pow(10, -t_L_cm / TVL_L_cm) + H_ps_mSv * Math.pow(10, -t_ps_cm / TVL_L_cm);
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIONES 4.15-4.16 — Skyshine (fotones y neutrones)
// ─────────────────────────────────────────────────────────────────────────────

// =============================================================================
// FUNCIONES MAESTRAS v13.6 — Laberinto, Skyshine, Kersey, TADR, Beltline
// =============================================================================

// ─── Laberinto completo (5 componentes) ───
// φ_total = φ_A + φ_p + φ_L + φ_c + φ_n (Eq. 4.17-4.24)
export interface MazeInput {
  W_Gy_per_wk: number;
  energy_MeV: number;
  technique: string;
  // φ_A: dispersión pared
  U_A: number; alpha1: number; A1_m2: number; d1_m: number; d_r_m: number;
  // φ_p: dispersión paciente
  alpha_p: number; F_cm2: number; d_sca_m: number; d_pp_m: number;
  // φ_L: fuga
  H0: number; f_factor: number; d_L_m: number;
  // φ_c: gamma captura
  k_c: number; d2_m: number; TVD_m: number;
  // φ_n: neutrones
  Q_n: number; S0_m2: number; S1_m2: number; d1n_m: number; d2n_m: number;
}

export interface MazeResult {
  phi_A: number;    // dispersión pared (mSv/sem)
  phi_p: number;    // dispersión paciente (mSv/sem)
  phi_L: number;    // fuga cabezal (mSv/sem)
  phi_c: number;    // gamma captura (mSv/sem)
  phi_n: number;    // neutrones (mSv/sem)
  phi_total: number; // suma 5 componentes (mSv/sem)
  passes: boolean;   // cumple P?
  P_mSv: number;     // objetivo
}

export function calculateMazeComplete(input: MazeInput, P_mSv_per_wk: number): MazeResult {
  const W_L = input.W_Gy_per_wk * (C1_IMRT_FACTORS[input.technique] || 1.0);
  
  // 5 componentes
  const phi_A = eq417_MazeScatterPhoton(W_L, input.U_A, input.alpha1, input.A1_m2, input.d1_m, input.d_r_m);
  const phi_p = eq418_MazeScatterPatient(W_L, input.alpha_p, input.F_cm2, input.d_sca_m, input.d_pp_m);
  const phi_L = eq419_MazeLeakage(W_L, input.H0, input.f_factor, input.d_L_m);
  const phi_n_direct = eq421_MazeNeutronsDirect(input.Q_n, input.S0_m2, input.d1n_m);
  const phi_c = eq420_MazeCaptureGamma(input.k_c, phi_n_direct, input.d2_m, input.TVD_m);
  const phi_n_kersey = eq423_KerseyNeutrons(input.Q_n, input.S1_m2, input.d1n_m, input.d2n_m, input.TVD_m);
  const phi_n = Math.max(phi_n_direct, phi_n_kersey);
  
  const phi_total = phi_A + phi_p + phi_L + phi_c + phi_n;
  
  return {
    phi_A, phi_p, phi_L, phi_c, phi_n,
    phi_total,
    passes: phi_total <= P_mSv_per_wk,
    P_mSv: P_mSv_per_wk,
  };
}

// ─── Puerta del laberinto (neutrones + fotones) ───
export interface DoorInput {
  phi_n_mSv: number;      // neutrones del laberinto
  t_w_cm: number;         // espesor pared (cm)
  TVL_n_cm: number;       // TVL neutrones
  alpha_n: number;        // albedo neutrones
  A_w_m2: number;         // área pared (m²)
  d_c_m: number;          // distancia isocentro-pared (m)
  d_d_m: number;          // distancia pared-puerta (m)
  phi_d_mSv: number;      // fotones dispersados
  phi_p_mSv: number;      // fotones paciente
}

export interface DoorResult {
  D_Tn: number;   // neutrones transmitidos
  D_c: number;    // neutrones dispersados
  D_d: number;    // fotones dispersados
  D_nH: number;   // gamma captura
  D_p: number;    // fotones paciente
  D_total: number;
  passes: boolean;
}

export function calculateDoorShielding(input: DoorInput, P_mSv_per_wk: number): DoorResult {
  const D_Tn = eq425_NeutronDoorTransmission(input.phi_n_mSv, input.t_w_cm, input.TVL_n_cm);
  const D_c = eq426_NeutronScatterToDoor(input.phi_n_mSv, input.alpha_n, input.A_w_m2, input.d_c_m, input.d_d_m);
  const D_nH = eq427_NeutronCaptureGamma(D_Tn, D_c);
  const D_total = D_Tn + D_c + input.phi_d_mSv + D_nH + input.phi_p_mSv;
  
  return {
    D_Tn, D_c, D_d: input.phi_d_mSv, D_nH, D_p: input.phi_p_mSv,
    D_total,
    passes: D_total <= P_mSv_per_wk,
  };
}

// ─── Skyshine completo (fotones + neutrones) ───
export interface SkyshineInput {
  B_xs: number;           // transmisión techo
  D0_Gy_per_wk: number;   // dosis semanal
  Omega_sr: number;       // ángulo sólido
  d_s_m: number;          // isocentro-techo (m)
  d_i_m: number;          // techo-punto (m)
  k_n: number;            // coef. skyshine neutrones
  Q_n: number;            // fluencia neutrones
  d1_m: number;           // fuente-techo (m)
  d2_m: number;           // techo-punto (m)
}

export interface SkyshineResult {
  H_photons: number;  // mSv/sem
  H_neutrons: number; // mSv/sem
  H_total: number;    // mSv/sem
  passes: boolean;
}

export function calculateSkyshineComplete(input: SkyshineInput, P_mSv_per_wk: number): SkyshineResult {
  const H_photons = eq415_SkyshinePhotons(input.B_xs, input.D0_Gy_per_wk, input.Omega_sr, input.d_s_m, input.d_i_m);
  const H_neutrons = eq416_SkyshineNeutrons(input.k_n, input.Q_n, input.d1_m, input.d2_m);
  const H_total = H_photons + H_neutrons;
  
  return {
    H_photons, H_neutrons, H_total,
    passes: H_total <= P_mSv_per_wk,
  };
}

// ─── Caso de estudio Elekta 18 MV (Capítulo 5) ───
export interface ElektaCaseInput {
  energy_MeV: number;     // 18
  W_Gy_per_wk: number;    // 450
  technique: string;      // VMAT
  P_mSv_per_wk: number;   // 0.02
}

export interface ElektaCaseResult {
  // Pared I primaria
  paredI_pri: { d: number; t_cm: number; t_m: number };
  // Pared I secundaria
  paredI_sec: { d_sca: number; d_sec: number; t_cm: number; t_m: number };
  // Pared II secundaria
  paredII_sec: { d_sca: number; d_sec: number; t_cm: number; t_m: number };
  // Pared III primaria
  paredIII_pri: { d: number; t_cm: number; t_m: number };
  // Pared III secundaria
  paredIII_sec: { d_sca: number; d_sec: number; t_cm: number; t_m: number };
  // Puerta (5 componentes)
  puerta: { D_Tn: number; D_c: number; D_d: number; D_nH: number; D_p: number; D_total: number };
  // C1
  C1: number;
  W_modified: number;
  // Verificación
  allPass: boolean;
}

export function calculateElektaCase(input: ElektaCaseInput): ElektaCaseResult {
  const { energy_MeV, W_Gy_per_wk, technique, P_mSv_per_wk } = input;
  const C1 = C1_IMRT_FACTORS[technique] || 4.0;
  const W_L = W_Gy_per_wk * C1; // 1800 Gy/sem eq.
  
  const TVL = TVL_PRIMARIA_CM.concrete235[`${energy_MeV}MV`] || 45.0;
  
  // Pared I primaria: d=4.5m, U=0.25, T=1.0
  const B1 = eq41_TransmissionRequired(P_mSv_per_wk, 4.5, W_L, 0.25, 1.0);
  const n1 = eq42_nTVL(B1);
  const t1 = eq43_BarrierThickness(n1, TVL, TVL);
  
  // Pared I secundaria: d_sca=1.0, d_sec=3.0
  const H1s = eq48_ScatterKerma(W_L, 1.0, 7.12e-4, 400, 1.0, 3.0);
  const B1s = P_mSv_per_wk / Math.max(H1s, P_mSv_per_wk);
  const n1s = eq42_nTVL(Math.min(B1s, 1));
  const t1s = eq43_BarrierThickness(n1s, TVL * 0.85, TVL * 0.85);
  
  // Pared II secundaria: d_sca=1.0, d_sec=3.5
  const H2s = eq48_ScatterKerma(W_L, 1.0, 7.12e-4, 400, 1.0, 3.5);
  const B2s = P_mSv_per_wk / Math.max(H2s, P_mSv_per_wk);
  const n2s = eq42_nTVL(Math.min(B2s, 1));
  const t2s = eq43_BarrierThickness(n2s, TVL * 0.85, TVL * 0.85);
  
  // Pared III primaria: d=4.8m, U=0.25, T=1.0
  const B3 = eq41_TransmissionRequired(P_mSv_per_wk, 4.8, W_L, 0.25, 1.0);
  const n3 = eq42_nTVL(B3);
  const t3 = eq43_BarrierThickness(n3, TVL, TVL);
  
  // Pared III secundaria: d_sca=1.0, d_sec=2.8
  const H3s = eq48_ScatterKerma(W_L, 1.0, 7.12e-4, 400, 1.0, 2.8);
  const B3s = P_mSv_per_wk / Math.max(H3s, P_mSv_per_wk);
  const n3s = eq42_nTVL(Math.min(B3s, 1));
  const t3s = eq43_BarrierThickness(n3s, TVL * 0.85, TVL * 0.85);
  
  // Puerta (valores del caso de estudio)
  const D_Tn = 0.15; const D_c = 0.08; const D_d = 0.25; const D_nH = 0.10; const D_p = 0.05;
  const D_total = D_Tn + D_c + D_d + D_nH + D_p;
  
  return {
    paredI_pri: { d: 4.5, t_cm: t1, t_m: t1 / 100 },
    paredI_sec: { d_sca: 1.0, d_sec: 3.0, t_cm: t1s, t_m: t1s / 100 },
    paredII_sec: { d_sca: 1.0, d_sec: 3.5, t_cm: t2s, t_m: t2s / 100 },
    paredIII_pri: { d: 4.8, t_cm: t3, t_m: t3 / 100 },
    paredIII_sec: { d_sca: 1.0, d_sec: 2.8, t_cm: t3s, t_m: t3s / 100 },
    puerta: { D_Tn, D_c, D_d, D_nH, D_p, D_total },
    C1, W_modified: W_L,
    allPass: D_total <= P_mSv_per_wk && t1 > 0 && t3 > 0,
  };
}

// Skyshine de fotones (McGinley, 1998)
// H_s = 2.5×10⁻³ × (B_xs × D₀ × Ω^1.3) / (d_s² × d_i)
export function eq415_SkyshinePhotons(
  B_xs: number,           // transmisión del techo
  D0_Gy_per_wk: number,  // dosis isocéntrica semanal
  Omega_steradians: number, // ángulo sólido del haz
  d_s_m: number,          // distancia del isocentro al techo (m)
  d_i_m: number           // distancia del techo al punto de interés (m)
): number {
  if (d_s_m <= 0 || d_i_m <= 0) return 0;
  return 2.5e-3 * (B_xs * D0_Gy_per_wk * 1000 * Math.pow(Omega_steradians, 1.3)) / (d_s_m * d_s_m * d_i_m);
}

// Skyshine de neutrones (McGinley)
// H_ns = k × Q_n × (1/d₁²) × (1/d₂²)
export function eq416_SkyshineNeutrons(
  k_factor: number,       // coeficiente de ajuste (~0.0026)
  Q_n: number,            // fluencia de neutrones por Gy en isocentro
  d1_m: number,           // distancia fuente-techo (m)
  d2_m: number            // distancia techo-punto (m)
): number {
  if (d1_m <= 0 || d2_m <= 0) return 0;
  return k_factor * Q_n / (d1_m * d1_m * d2_m * d2_m);
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIONES 4.17-4.24 — Laberinto (5 componentes)
// ─────────────────────────────────────────────────────────────────────────────

// 4.17 — Dispersión del haz en la pared del laberinto (photon)
// φ_A = (W × U_A × α₁ × A₁) / (d₁² × d_r²)
export function eq417_MazeScatterPhoton(
  W_Gy_per_wk: number,
  U_A: number,
  alpha1: number,         // albedo pared laberinto
  A1_m2: number,          // área de incidencia (m²)
  d1_m: number,           // distancia fuente-pared laberinto (m)
  d_r_m: number           // distancia reflexión-puerta (m)
): number {
  if (d1_m <= 0 || d_r_m <= 0) return 0;
  return (W_Gy_per_wk * 1000 * U_A * alpha1 * A1_m2) / (d1_m * d1_m * d_r_m * d_r_m);
}

// 4.18 — Dispersión del haz en el paciente
// φ_p = (W × α_p × (F/400)) / (d_sca² × d_pp²)
export function eq418_MazeScatterPatient(
  W_Gy_per_wk: number,
  alpha_p: number,       // albedo del paciente (~0.01)
  F_cm2: number,
  d_sca_m: number,
  d_pp_m: number         // distancia paciente-puerta (m)
): number {
  if (d_sca_m <= 0 || d_pp_m <= 0) return 0;
  return (W_Gy_per_wk * 1000 * alpha_p * (F_cm2 / 400)) / (d_sca_m * d_sca_m * d_pp_m * d_pp_m);
}

// 4.19 — Radiación de fuga del cabezal
// φ_L = (W × 10⁻³ × f) / d_L²
export function eq419_MazeLeakage(
  W_Gy_per_wk: number,
  H0: number,
  f_factor: number,
  d_L_m: number
): number {
  if (d_L_m <= 0) return 0;
  return (W_Gy_per_wk * 1000 * H0 * f_factor) / (d_L_m * d_L_m);
}

// 4.20 — Neutrones capturados en el laberinto (gamma de captura)
// φ_c = k × φ_n × 10^(-d₂/TVD)
export function eq420_MazeCaptureGamma(
  k_factor: number,       // ~10⁻²
  phi_n_mSv: number,      // fluencia de neutrones (mSv/sem)
  d2_m: number,           // distancia laberinto-puerta (m)
  TVD_m: number           // TVD para neutrones (m)
): number {
  if (TVD_m <= 0) return k_factor * phi_n_mSv;
  return k_factor * phi_n_mSv * Math.pow(10, -d2_m / TVD_m);
}

// 4.21-4.22 — Neutrones directos
// φ_n = (Q_n × S₀) / (4π × d₁²)
export function eq421_MazeNeutronsDirect(
  Q_n: number,            // fluencia de neutrones por Gy (n/Gy)
  S0_m2: number,          // sección transversal del haz (m²)
  d1_m: number            // distancia isocentro-puerta (m)
): number {
  if (d1_m <= 0) return 0;
  return (Q_n * S0_m2) / (4 * Math.PI * d1_m * d1_m);
}

// 4.23-4.24 — Método de Kersey (neutrones en laberinto)
// φ_nK = (Q_n × S₁ × 10^(-d₁/TVD)) / (d₂²)
export function eq423_KerseyNeutrons(
  Q_n: number,
  S1_m2: number,          // área de sección del laberinto (m²)
  d1_m: number,           // distancia isocentro-entrada laberinto (m)
  d2_m: number,           // distancia entrada-puerta (m)
  TVD_m: number
): number {
  if (d2_m <= 0 || TVD_m <= 0) return 0;
  return (Q_n * S1_m2 * Math.pow(10, -d1_m / TVD_m)) / (d2_m * d2_m);
}

// Kersey modificado — considera reflexiones múltiples
export function eq424_KerseyModified(
  Q_n: number,
  S0_m2: number,
  S1_m2: number,
  d1_m: number,
  d2_m: number,
  d_ref_m: number,        // distancia de reflexión (m)
  TVD_m: number
): number {
  const direct = eq421_MazeNeutronsDirect(Q_n, S0_m2, d1_m);
  const scattered = eq423_KerseyNeutrons(Q_n, S1_m2, d_ref_m || d1_m, d2_m, TVD_m);
  return Math.max(direct, scattered);
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIÓN 4.25-4.27 — Método Kersey modificado (neutrones en puerta)
// ─────────────────────────────────────────────────────────────────────────────

// 4.25 — Neutrones transmitidos por la pared del laberinto
// D_Tn = φ_n × 10^(-t_w/TVL_n)
export function eq425_NeutronDoorTransmission(
  phi_n_mSv: number,      // dosis de neutrones (mSv/sem)
  t_w_cm: number,         // espesor pared (cm)
  TVL_n_cm: number        // TVL para neutrones (cm)
): number {
  if (TVL_n_cm <= 0) return phi_n_mSv;
  return phi_n_mSv * Math.pow(10, -t_w_cm / TVL_n_cm);
}

// 4.26 — Neutrones dispersos en la pared hacia la puerta
// D_c = (φ_n × α_n × A_w) / (d_c² × d_d²)
export function eq426_NeutronScatterToDoor(
  phi_n_mSv: number,
  alpha_n: number,       // albedo para neutrones (~0.1)
  A_w_m2: number,        // área de la pared (m²)
  d_c_m: number,         // distancia isocentro-pared (m)
  d_d_m: number          // distancia pared-puerta (m)
): number {
  if (d_c_m <= 0 || d_d_m <= 0) return 0;
  return (phi_n_mSv * alpha_n * A_w_m2) / (d_c_m * d_c_m * d_d_m * d_d_m);
}

// 4.27 — Gamma de captura de neutrones en la puerta
// D_nH = D_Tn + D_c (aproximación)
// Más preciso: D_nH = 6.9×10⁻¹⁶ × φ_n × 10^(-t/TVL_n)
export function eq427_NeutronCaptureGamma(
  D_Tn_mSv: number,
  D_c_mSv: number
): number {
  return D_Tn_mSv + D_c_mSv;
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIÓN 4.28 — TVD (Tenth Value Distance) para neutrones
// TVD = 3.9 m (15 MV), 5.4 m (18-25 MV)
// ─────────────────────────────────────────────────────────────────────────────
export function getTVDforNeutrons(energy_MeV: number): number {
  if (energy_MeV <= 10) return 0;       // no hay neutrones significativos
  if (energy_MeV <= 15) return 3.9;     // 15 MV
  if (energy_MeV <= 25) return 5.4;     // 18-25 MV
  return 6.0;                            // extrapolación conservadora
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIÓN 4.29 — Neutrones transmitidos por barrera primaria
// D = φ_n × 10^(-t/TVL_n)
// TVL_n para concreto: TVL₁ = 31 cm, TVLₑ = 21 cm (18 MV)
// ─────────────────────────────────────────────────────────────────────────────
export const TVL_NEUTRON_CONCRETE_CM: Record<string, { TVL1: number; TVLe: number }> = {
  '10MV': { TVL1: 25, TVLe: 18 },
  '15MV': { TVL1: 31, TVLe: 21 },
  '18MV': { TVL1: 33, TVLe: 23 },
  '25MV': { TVL1: 35, TVLe: 25 },
};

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIÓN 4.30 — Ecuación del cinturón (beltline)
// w = 0.566X + 0.6m  (ancho mínimo del cinturón)
// ─────────────────────────────────────────────────────────────────────────────
export function eq430_BeltlineWidth(X_thickness_m: number): number {
  return 0.566 * X_thickness_m + 0.6;
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIONES 4.31-4.33 — Dosis total en puerta (5 componentes)
// D_puerta = D_Tn + D_c + D_d + D_nH + D_p
// ─────────────────────────────────────────────────────────────────────────────
export function eq431_TotalDoorDose(
  D_Tn: number,  // neutrones transmitidos
  D_c: number,   // neutrones dispersados
  D_d: number,   // fotones dispersados en puerta
  D_nH: number,  // gamma de captura
  D_p: number    // fotones dispersados del paciente
): number {
  return D_Tn + D_c + D_d + D_nH + D_p;
}

// ─────────────────────────────────────────────────────────────────────────────
// ECUACIONES 4.34-4.38 — Consideraciones especiales
// ─────────────────────────────────────────────────────────────────────────────

// 4.34 — Barrera para TBI (cama rotatoria, posición lateral)
// La barrera primaria se calcula con W_TBI, U=0.25, d=d_pared
export function eq434_TBIBarrier(
  W_TBI_Gy_per_wk: number,  // carga TBI (Gy/sem)
  P_mSv_per_wk: number,
  d_m: number,
  U: number = 0.25,
  T: number = 1.0,
  TVL1_cm: number = 37.0,
  TVLe_cm: number = 37.0
): number {
  const B = eq41_TransmissionRequired(P_mSv_per_wk, d_m, W_TBI_Gy_per_wk, U, T);
  const n = eq42_nTVL(B);
  return eq43_BarrierThickness(n, TVL1_cm, TVLe_cm);
}

// 4.35 — Barrera IMRT con factor C₁
// Se usa W_L en lugar de W (ver calculateModifiedWorkload arriba)
// y se aplica el mismo procedimiento de barrera primaria/secundaria

// 4.36 — Factor de uso VMAT (U=0.25 para ángulo de 270° típico)
// ya contemplado en USE_FACTORS

// 4.37-4.38 — Verificación TADR (Tasa de Dosis Equivalente Ambiental)
// TADR = Dosis acumulada / Tiempo de irradiación
// Se compara con límites de áreas controladas (2.5 μSv/h) o público (0.25 μSv/h)
export function eq438_TADR(
  accumulatedDose_mSv: number,
  irradiationTime_hours: number
): number {
  if (irradiationTime_hours <= 0) return 0;
  return accumulatedDose_mSv / irradiationTime_hours;
}

// Verificación: ¿cumple TADR?
export function checkTADR(
  tadr_mSv_per_h: number,
  areaType: 'controlled' | 'public'
): { passes: boolean; limit: number } {
  const limit = areaType === 'controlled' ? 0.0025 : 0.00025; // mSv/h
  return { passes: tadr_mSv_per_h <= limit, limit };
}

// =============================================================================
// Función maestra — Cálculo completo de barrera primaria LINAC
// =============================================================================
export interface LINACBarrierInput {
  energy_MeV: number;           // 4, 6, 10, 15, 18, 25
  W_Gy_per_wk: number;          // carga de trabajo (Gy/sem)
  technique: string;            // '3D-CRT', 'IMRT', 'VMAT', 'SBRT', 'TBI'
  P_mSv_per_wk: number;         // objetivo de diseño (mSv/sem)
  d_pri_m: number;              // distancia fuente-punto (m)
  U: number;                    // factor de uso
  T: number;                    // factor de ocupación
  F_conv_fraction: number;      // fracción convencional
  F_IMRT_fraction: number;      // fracción IMRT
  materialCode: string;         // 'concrete235', 'steel', 'lead', 'barite'
}

export interface LINACBarrierResult {
  B: number;                    // transmisión requerida
  n: number;                    // número de TVL
  thickness_cm: number;         // espesor calculado (cm)
  thickness_mm: number;         // espesor calculado (mm)
  W_modified: number;           // carga de trabajo modificada
  C1: number;                   // factor C₁ aplicado
  TVL1_cm: number;              // primer TVL usado
  TVLe_cm: number;              // TVL de equilibrio usado
  passes: boolean;              // ¿cumple?
}

export function calculateLINACPrimaryBarrier(input: LINACBarrierInput): LINACBarrierResult {
  const {
    energy_MeV, W_Gy_per_wk, technique, P_mSv_per_wk, d_pri_m, U, T,
    F_conv_fraction, F_IMRT_fraction, materialCode
  } = input;

  // 1. Cálculo de carga modificada (IMRT/VMAT)
  const C1 = C1_IMRT_FACTORS[technique] || 1.0;
  const W_modified = calculateModifiedWorkload(
    W_Gy_per_wk, F_conv_fraction,
    W_Gy_per_wk, F_IMRT_fraction, technique
  );

  // 2. Transmisión requerida (Ecuación 4.1)
  const B = eq41_TransmissionRequired(P_mSv_per_wk, d_pri_m, W_modified, U, T);

  // 3. TVL del material
  const energyKey = `${energy_MeV}MV`;
  const tvlData = TVL_PRIMARIA_CM[materialCode] || TVL_PRIMARIA_CM.concrete235;
  const TVLe = tvlData[energyKey] || tvlData['6MV'] || 37.0;
  const tvl1Data = TVL1_PRIMARIA_CM[materialCode];
  const TVL1 = (tvl1Data && tvl1Data[energyKey]) || TVLe;

  // 4. Número de TVL (Ecuación 4.2)
  const n = eq42_nTVL(B);

  // 5. Espesor (Ecuación 4.3)
  const thickness_cm = eq43_BarrierThickness(n, TVL1, TVLe);

  return {
    B,
    n,
    thickness_cm,
    thickness_mm: thickness_cm * 10,
    W_modified,
    C1,
    TVL1_cm: TVL1,
    TVLe_cm: TVLe,
    passes: thickness_cm > 0 && B > 0,
  };
}

// =============================================================================
// Función maestra — Cálculo completo de barrera secundaria LINAC
// =============================================================================
export interface LINACSecondaryInput {
  energy_MeV: number;
  W_Gy_per_wk: number;
  technique: string;
  P_mSv_per_wk: number;
  barrierType: 'scatter' | 'leakage' | 'twosource';
  // Para dispersión
  d_sca_m?: number;
  d_sec_m?: number;
  alpha_m2?: number;
  F_cm2?: number;
  // Para fuga
  d_L_m?: number;
  // Para dos fuentes
  t_L_cm?: number;
  t_ps_cm?: number;
  materialCode: string;
  T: number;
}

export interface LINACSecondaryResult {
  H_unshielded_mSv: number;     // dosis sin blindaje
  t_required_cm: number;        // espesor requerido
  t_scatter_cm?: number;        // espesor por dispersión
  t_leakage_cm?: number;        // espesor por fuga
  t_twosource_cm?: number;      // espesor regla dos fuentes
  B: number;
  n: number;
  passes: boolean;
}

export function calculateLINACSecondaryBarrier(input: LINACSecondaryInput): LINACSecondaryResult {
  const {
    energy_MeV, W_Gy_per_wk, technique, P_mSv_per_wk, barrierType,
    d_sca_m, d_sec_m, alpha_m2, F_cm2, d_L_m, t_L_cm, t_ps_cm,
    materialCode, T
  } = input;

  const C1 = C1_IMRT_FACTORS[technique] || 1.0;
  const W_eff = W_Gy_per_wk * C1;
  const energyKey = `${energy_MeV}MV`;

  let H_unshielded = 0;
  let t_scatter = 0;
  let t_leakage = 0;
  let t_twosource = 0;

  // TVL para radiación de fuga (L)
  const tvlData = TVL_PRIMARIA_CM[materialCode] || TVL_PRIMARIA_CM.concrete235;
  const TVL_L = tvlData[energyKey] || tvlData['6MV'] || 37.0;
  const TVL1_L = (TVL1_PRIMARIA_CM[materialCode]?.[energyKey]) || TVL_L;

  if (barrierType === 'scatter' || barrierType === 'twosource') {
    // Dispersión (Ecuación 4.8)
    H_unshielded = eq48_ScatterKerma(
      W_eff, T, alpha_m2 || 7.12e-4, F_cm2 || 400,
      d_sca_m || 1.0, d_sec_m || 3.0
    );
    if (H_unshielded > P_mSv_per_wk) {
      const B_ps = P_mSv_per_wk / H_unshielded;
      const n_ps = eq42_nTVL(B_ps);
      // TVL para radiación dispersa (aproximadamente igual a primaria)
      t_scatter = eq43_BarrierThickness(n_ps, TVL1_L * 0.85, TVL_L * 0.85);
    }
  }

  if (barrierType === 'leakage' || barrierType === 'twosource') {
    // Fuga del cabezal (Ecuación 4.11)
    const H0 = HEAD_LEAKAGE_H0[`${energy_MeV}MV`] || 0.001;
    const f = energy_MeV > 10 ? (PDD_AT_30CM[`${energy_MeV}MV`] || 0.6) : 1.0;
    H_unshielded = eq411_LeakageKerma(W_eff, T, H0, f, d_L_m || 3.0);
    if (H_unshielded > P_mSv_per_wk) {
      const B_L = P_mSv_per_wk / H_unshielded;
      const n_L = eq42_nTVL(B_L);
      t_leakage = eq43_BarrierThickness(n_L, TVL1_L, TVL_L);
    }
  }

  if (barrierType === 'twosource') {
    // Regla de las dos fuentes (Ecuación 4.12)
    t_twosource = eq412_TwoSourceRule(t_L_cm || t_leakage, t_ps_cm || t_scatter, TVL_L);
  }

  const t_required = barrierType === 'twosource' ? t_twosource : Math.max(t_scatter, t_leakage);
  const B = H_unshielded > 0 ? P_mSv_per_wk / H_unshielded : 0;

  return {
    H_unshielded_mSv: H_unshielded,
    t_required_cm: t_required,
    t_scatter_cm: t_scatter || undefined,
    t_leakage_cm: t_leakage || undefined,
    t_twosource_cm: t_twosource || undefined,
    B,
    n: eq42_nTVL(B),
    passes: t_required > 0,
  };
}

// =============================================================================
// Export para cálculos de otros equipos
// =============================================================================

// Rayos X diagnóstico — método NCRP 147 simplificado
export function calculateDiagnosticXRayBarrier(
  kVp: number,
  mAs_per_week: number,
  patients_per_week: number,
  d_m: number,
  P_mSv_per_wk: number,
  materialCode: string = 'concrete235'
): { thickness_mm: number; K_unshielded_mSv: number } {
  const K1 = kVp <= 100 ? 0.5 : kVp <= 125 ? 1.5 : 3.0; // mGy/paciente @ 1m
  const N = patients_per_week;
  const K_unshielded = K1 * N / (d_m * d_m);
  if (K_unshielded <= P_mSv_per_wk) return { thickness_mm: 0, K_unshielded_mSv: K_unshielded };
  const B = P_mSv_per_wk / K_unshielded;
  // Aproximación: usar TVL de 6 MV como proxy para RX terapéutico
  const TVL = TVL_PRIMARIA_CM[materialCode]?.['6MV'] || 37.0;
  const n = Math.log10(1 / B);
  return { thickness_mm: n * TVL * 10, K_unshielded_mSv: K_unshielded };
}

// Mastografía — método NCRP 147
export function calculateMammographyBarrier(
  patients_per_week: number,
  d_m: number,
  P_mSv_per_wk: number,
  materialCode: string = 'concrete235'
): { thickness_mm: number; K_unshielded_mSv: number } {
  const K1_CC = 7.0;  // mGy/paciente CC
  const K1_MLO = 9.0; // mGy/paciente MLO
  const K_avg = (K1_CC + K1_MLO) / 2;
  const K_unshielded = K_avg * patients_per_week / (d_m * d_m);
  if (K_unshielded <= P_mSv_per_wk) return { thickness_mm: 0, K_unshielded_mSv: K_unshielded };
  const B = P_mSv_per_wk / K_unshielded;
  const TVL = TVL_PRIMARIA_CM[materialCode]?.['6MV'] || 37.0;
  const n = Math.log10(1 / B);
  return { thickness_mm: n * TVL * 10 * 0.3, K_unshielded_mSv: K_unshielded }; // *0.3: menor energía
}

// Medicina Nuclear Terapéutica — método IAEA SRS 47
export function calculateNuclearTherapyBarrier(
  activity_GBq: number,
  gamma_constant_uSv_m2_per_GBq_h: number,  // Γ
  hours_per_week: number,
  d_m: number,
  P_mSv_per_wk: number,
  materialCode: string = 'concrete235'
): { thickness_mm: number; K_unshielded_mSv: number } {
  const K_unshielded = (gamma_constant_uSv_m2_per_GBq_h * activity_GBq * hours_per_week) / (d_m * d_m) / 1000; // mSv
  if (K_unshielded <= P_mSv_per_wk) return { thickness_mm: 0, K_unshielded_mSv: K_unshielded };
  const B = P_mSv_per_wk / K_unshielded;
  const TVL = TVL_PRIMARIA_CM[materialCode]?.['6MV'] || 37.0; // aproximación
  const n = Math.log10(1 / B);
  return { thickness_mm: n * TVL * 10, K_unshielded_mSv: K_unshielded };
}

// Gamma Knife — método AAPM TG 56
export function calculateGammaKnifeBarrier(
  fractions_per_week: number,
  dose_per_fraction_Gy: number,
  d_m: number,
  P_mSv_per_wk: number,
  materialCode: string = 'concrete235'
): { thickness_mm: number; K_unshielded_mSv: number } {
  const K_unshielded = (dose_per_fraction_Gy * fractions_per_week * 1000) / (d_m * d_m);
  if (K_unshielded <= P_mSv_per_wk) return { thickness_mm: 0, K_unshielded_mSv: K_unshielded };
  const B = P_mSv_per_wk / K_unshielded;
  const TVL = TVL_PRIMARIA_CM[materialCode]?.['Co60'] || 21.8;
  const n = Math.log10(1 / B);
  return { thickness_mm: n * TVL * 10, K_unshielded_mSv: K_unshielded };
}

// PET-CT — método TG 108
export function calculatePETCTBarrier(
  activity_MBQ_per_injection: number,
  patients_per_week: number,
  gamma_constant_uSv_m2_per_GBq_h: number,
  hours_per_week: number,
  d_m: number,
  P_mSv_per_wk: number,
  materialCode: string = 'concrete235'
): { thickness_mm: number; K_unshielded_mSv: number } {
  const activity_GBq = activity_MBQ_per_injection / 1000;
  const K_unshielded = (gamma_constant_uSv_m2_per_GBq_h * activity_GBq * patients_per_week * hours_per_week) / (d_m * d_m) / 1000;
  if (K_unshielded <= P_mSv_per_wk) return { thickness_mm: 0, K_unshielded_mSv: K_unshielded };
  const B = P_mSv_per_wk / K_unshielded;
  const TVL = TVL_PRIMARIA_CM[materialCode]?.['6MV'] || 37.0;
  const n = Math.log10(1 / B);
  return { thickness_mm: n * TVL * 10, K_unshielded_mSv: K_unshielded };
}

// Braquiterapia HDR — método NCRP 151
export function calculateHDRBrachyBarrier(
  activity_Ci: number,
  gamma_constant_R_m2_per_Ci_h: number,  // Γ en unidades antiguas
  hours_per_week: number,
  d_m: number,
  P_mSv_per_wk: number,
  materialCode: string = 'concrete235'
): { thickness_mm: number; K_unshielded_mSv: number } {
  const K_unshielded_mR = (gamma_constant_R_m2_per_Ci_h * activity_Ci * hours_per_week) / (d_m * d_m);
  const K_unshielded = K_unshielded_mR * 0.00876; // R → mSv (aprox)
  if (K_unshielded <= P_mSv_per_wk) return { thickness_mm: 0, K_unshielded_mSv: K_unshielded };
  const B = P_mSv_per_wk / K_unshielded;
  const TVL = TVL_PRIMARIA_CM[materialCode]?.['Ir192'] || 11.0;
  const n = Math.log10(1 / B);
  return { thickness_mm: n * TVL * 10, K_unshielded_mSv: K_unshielded };
}

// Gammagrafía — método TG 108
export function calculateGammaCameraBarrier(
  activity_MBQ_per_injection: number,
  patients_per_week: number,
  gamma_constant_uSv_m2_per_GBq_h: number,
  hours_per_week: number,
  d_m: number,
  P_mSv_per_wk: number,
  materialCode: string = 'concrete235'
): { thickness_mm: number; K_unshielded_mSv: number } {
  const activity_GBq = activity_MBQ_per_injection / 1000;
  const K_unshielded = (gamma_constant_uSv_m2_per_GBq_h * activity_GBq * patients_per_week * hours_per_week) / (d_m * d_m) / 1000;
  if (K_unshielded <= P_mSv_per_wk) return { thickness_mm: 0, K_unshielded_mSv: K_unshielded };
  const B = P_mSv_per_wk / K_unshielded;
  const TVL = TVL_PRIMARIA_CM[materialCode]?.['6MV'] || 37.0;
  const n = Math.log10(1 / B);
  return { thickness_mm: n * TVL * 10 * 0.5, K_unshielded_mSv: K_unshielded }; // *0.5: menor energía
}
