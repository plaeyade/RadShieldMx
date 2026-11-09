/**
 * IPEMReport109 — MC-02: SPECT Shielding segun IPEM Report 109 (2014)
 * Metodologia para blindaje de salas SPECT y SPECT/CT con factores
 * de dispersion especificos por radiofarmaco.
 * Referencia: IPEM Report 109 (2014). Institute of Physics and Engineering in Medicine.
 */

export interface SPECTRadionuclide {
  name: string; symbol: string; halfLife_h: number;
  gamma_MeV: number; photonYield: number; // photons per decay
  gammaConstant_uSvm2perGBqh: number; // AAPM TG 108 / IPEM 109
  tenthValueLead_mm: number; tenthValueConcrete_mm: number;
}

/**
 * TVL (mm). Revisión independiente de la Fase 8c: varias TVL eran en realidad HVL o menores (no conservador).
 * - Plomo: TVL de Delacroix et al. (2002), Radionuclide and Radiation Protection Data Handbook, recogidas en las
 *   fichas de isótopos de la Universidad de Cincinnati: I-123 2 mm, I-131 11 mm, In-111 3 mm, Ga-67 6 mm.
 *   Tl-201: 1.3 mm = TVL de haz estrecho (XCOM) a 167 keV, la línea más penetrante (10 %), que domina tras 1–2 TVL.
 * - Concreto (2.35 g/cm³): TVL de haz estrecho de XCOM a la línea más penetrante relevante (Tc-99m 140 keV → 66 mm,
 *   Tl-201 167 keV → 72, I-123 159 keV → 70, Ga-67 300 keV → 92, In-111 245 keV → 85, Sm-153 103 keV → 58).
 *   Sin acumulación siguen siendo un mínimo: en concreto la TVL de banda ancha es mayor.
 */
export const SPECT_RADIONUCLIDES: SPECTRadionuclide[] = [
  { name: 'Technetium-99m', symbol: 'Tc-99m', halfLife_h: 6.01, gamma_MeV: 0.140, photonYield: 0.885, gammaConstant_uSvm2perGBqh: 0.0593, tenthValueLead_mm: 0.83, tenthValueConcrete_mm: 66 },
  { name: 'Thallium-201', symbol: 'Tl-201', halfLife_h: 73.1, gamma_MeV: 0.135, photonYield: 0.53, gammaConstant_uSvm2perGBqh: 0.0364, tenthValueLead_mm: 1.3, tenthValueConcrete_mm: 72 },
  { name: 'Iodine-123', symbol: 'I-123', halfLife_h: 13.2, gamma_MeV: 0.159, photonYield: 0.83, gammaConstant_uSvm2perGBqh: 0.0583, tenthValueLead_mm: 2.0, tenthValueConcrete_mm: 70 },
  { name: 'Iodine-131', symbol: 'I-131', halfLife_h: 193.6, gamma_MeV: 0.364, photonYield: 0.81, gammaConstant_uSvm2perGBqh: 0.0595, tenthValueLead_mm: 11, tenthValueConcrete_mm: 170 },
  { name: 'Gallium-67', symbol: 'Ga-67', halfLife_h: 78.3, gamma_MeV: 0.093, photonYield: 0.65, gammaConstant_uSvm2perGBqh: 0.0215, tenthValueLead_mm: 6.0, tenthValueConcrete_mm: 92 },
  { name: 'Indium-111', symbol: 'In-111', halfLife_h: 67.3, gamma_MeV: 0.171, photonYield: 0.90, gammaConstant_uSvm2perGBqh: 0.0479, tenthValueLead_mm: 3.0, tenthValueConcrete_mm: 85 },
  { name: 'Samarium-153', symbol: 'Sm-153', halfLife_h: 46.3, gamma_MeV: 0.103, photonYield: 0.28, gammaConstant_uSvm2perGBqh: 0.0092, tenthValueLead_mm: 0.55, tenthValueConcrete_mm: 58 },
];

// IPEM 109 — Scatter factors per procedure type (kerma scatter per patient at 1m, uGy)
export interface SPECTProcedure {
  name: string; radionuclide: string;
  avgAdminActivity_MBQ: number; avgImagingTime_min: number;
  patientsPerWeek: number; scatterFactor_1m_uGy: number;
}

export const DEFAULT_SPECT_PROCEDURES: SPECTProcedure[] = [
  { name: 'Bone scan (MDP/HDP)', radionuclide: 'Tc-99m', avgAdminActivity_MBQ: 740, avgImagingTime_min: 25, patientsPerWeek: 30, scatterFactor_1m_uGy: 4.8 },
  { name: 'Myocardial perfusion (rest)', radionuclide: 'Tc-99m', avgAdminActivity_MBQ: 1110, avgImagingTime_min: 20, patientsPerWeek: 15, scatterFactor_1m_uGy: 7.2 },
  { name: 'Myocardial perfusion (stress)', radionuclide: 'Tc-99m', avgAdminActivity_MBQ: 1110, avgImagingTime_min: 20, patientsPerWeek: 15, scatterFactor_1m_uGy: 7.2 },
  { name: 'Renal scan (DTPA/MAG3)', radionuclide: 'Tc-99m', avgAdminActivity_MBQ: 370, avgImagingTime_min: 30, patientsPerWeek: 10, scatterFactor_1m_uGy: 2.4 },
  { name: 'Lung scan (MAA)', radionuclide: 'Tc-99m', avgAdminActivity_MBQ: 185, avgImagingTime_min: 15, patientsPerWeek: 5, scatterFactor_1m_uGy: 1.2 },
  { name: 'Thyroid scan', radionuclide: 'I-131', avgAdminActivity_MBQ: 185, avgImagingTime_min: 20, patientsPerWeek: 3, scatterFactor_1m_uGy: 8.5 },
  { name: 'MIBG scan', radionuclide: 'I-123', avgAdminActivity_MBQ: 370, avgImagingTime_min: 30, patientsPerWeek: 2, scatterFactor_1m_uGy: 4.2 },
];

export interface SPECTShieldingInput {
  procedure: SPECTProcedure; distance_m: number;
  wallThickness_mm: number; wallMaterial: 'lead' | 'concrete' | 'gypsum';
  designGoal_uSv_week: number;
}

export interface SPECTShieldingResult {
  weeklyKerma_uSv: number; shieldedKerma_uSv: number;
  withinGoal: boolean; requiredLead_mm: number;
  requiredConcrete_mm: number; requiredTVL: number;
  transmission: number;
}

/**
 * TVL por material (Fase 8c). Tc-99m y Tl-201 traían la HVL como TVL (0.25 y 0.21 mm Pb); ahora 3.32 × HVL
 * (Tc-99m: 0.83 mm, coherente con μ/ρ = 2.3 cm²/g de XCOM a 140 keV). El yeso se escala por densidad desde el
 * concreto (2.35/0.705), en lugar del factor 1.5 sin fuente. Siguen siendo TVL de haz estrecho: sin acumulación.
 */
export function tvlSPECT(rad: SPECTRadionuclide, material: 'lead' | 'concrete' | 'gypsum'): number {
  if (material === 'lead') return rad.tenthValueLead_mm;
  return material === 'concrete' ? rad.tenthValueConcrete_mm : rad.tenthValueConcrete_mm * (2.35 / 0.705);
}

/** Sala completa: la suma de todos los procedimientos se compara con la meta una sola vez. */
export function salaSPECT(procs: SPECTProcedure[], distance_m: number, wallThickness_mm: number, wallMaterial: 'lead' | 'concrete' | 'gypsum', designGoal_uSv_week: number) {
  const r = procs.map(p => calculateSPECTShielding({ procedure: p, distance_m, wallThickness_mm, wallMaterial, designGoal_uSv_week }));
  const total = r.reduce((a, x) => a + x.weeklyKerma_uSv, 0);
  const totalBlindado = r.reduce((a, x) => a + x.shieldedKerma_uSv, 0);
  // Espesor que lleva la suma a la meta (bisección sobre Σ Kᵢ·10^(−t/TVLᵢ)).
  const espesor = (mat: 'lead' | 'concrete') => {
    const tv = procs.map(p => tvlSPECT(SPECT_RADIONUCLIDES.find(x => x.symbol === p.radionuclide) || SPECT_RADIONUCLIDES[0], mat));
    const f = (t: number) => r.reduce((a, x, k) => a + x.weeklyKerma_uSv * Math.pow(10, -t / tv[k]), 0);
    if (f(0) <= designGoal_uSv_week) return 0;
    let lo = 0, hi = 1;
    while (f(hi) > designGoal_uSv_week && hi < 1e5) hi *= 2;
    for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (f(m) > designGoal_uSv_week) lo = m; else hi = m; }
    return hi;
  };
  return { resultados: r, total_uSv: total, totalBlindado_uSv: totalBlindado, cumple: totalBlindado <= designGoal_uSv_week, plomo_mm: espesor('lead'), concreto_mm: espesor('concrete') };
}

export function calculateSPECTShielding(i: SPECTShieldingInput): SPECTShieldingResult {
  const rad = SPECT_RADIONUCLIDES.find(r => r.symbol === i.procedure.radionuclide) || SPECT_RADIONUCLIDES[0];
  const admin_GBq = i.procedure.avgAdminActivity_MBQ / 1000;
  const time_h = i.procedure.avgImagingTime_min / 60;
  const weeklyKerma = i.procedure.patientsPerWeek * admin_GBq * rad.gammaConstant_uSvm2perGBqh * time_h * 1000 / (i.distance_m * i.distance_m);
  const tvl = tvlSPECT(rad, i.wallMaterial);
  const transmission = i.wallThickness_mm > 0 ? Math.pow(10, -i.wallThickness_mm / tvl) : 1;
  const shieldedKerma = weeklyKerma * transmission;
  // Número de TVL continuo (antes Math.ceil); espesor total requerido (sin descontar la pared actual).
  const ratio0 = weeklyKerma > 0 ? i.designGoal_uSv_week / weeklyKerma : Infinity;
  const reqTvl = ratio0 > 0 && ratio0 < 1 ? -Math.log10(ratio0) : 0;
  return { weeklyKerma_uSv: weeklyKerma, shieldedKerma_uSv: shieldedKerma, withinGoal: shieldedKerma <= i.designGoal_uSv_week, requiredLead_mm: reqTvl * rad.tenthValueLead_mm, requiredConcrete_mm: reqTvl * rad.tenthValueConcrete_mm, requiredTVL: reqTvl, transmission };
}

export function getSPECTWeeklyTotal(procedures: SPECTProcedure[], distance_m: number): number {
  return procedures.reduce((sum, p) => {
    const r = SPECT_RADIONUCLIDES.find(x => x.symbol === p.radionuclide) || SPECT_RADIONUCLIDES[0];
    return sum + p.patientsPerWeek * (p.avgAdminActivity_MBQ / 1000) * r.gammaConstant_uSvm2perGBqh * (p.avgImagingTime_min / 60) * 1000 / (distance_m * distance_m);
  }, 0);
}
