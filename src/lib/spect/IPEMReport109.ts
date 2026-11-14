import { espesorTerapiaGP, materialGPCatalogo, metodoEspectro, nuclidoTerapiaDeSimbolo, transmisionRegla, type NuclidoTerapia } from '@/lib/terapiaEspectroGP';

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
 * Material del diálogo → material del catálogo para `terapiaEspectroGP`. Yeso (placa, 0.705 g/cm³) por equivalencia
 * másica con concreto ordinario 2.35 (revisión del #58, H4): con la composición del yeso CaSO₄·2H₂O de PNNL-15870 Rev. 1
 * (McConn et al. 2011, «Gypsum (Plaster of Paris)»: H 2.34 %, O 55.76 %, S 18.62 %, Ca 23.28 % en masa) y NIST XCOM,
 * su µ/ρ es MAYOR que el del concreto ordinario de NIST en todo el intervalo útil (×1.10 a 100 keV, ×1.05 a 140 keV,
 * ×1.02 a 200 keV, ×1.007 a 400 keV, ×1.004 a 1 MeV; `scripts/fase11_xcom_mu_rho.json`). Tratarlo como concreto de la
 * misma masa subestima su atenuación: el espesor de yeso resultante es conservador. El buildup del concreto (Z efectivo
 * algo menor) tampoco queda por debajo del del yeso.
 */
const MATERIAL_SPECT: Record<'lead' | 'concrete' | 'gypsum', { code: string; density: number }> = {
  lead: { code: 'PB', density: 11.35 },
  concrete: { code: 'CONCRETE235', density: 2.35 },
  gypsum: { code: 'GYPSUM', density: 0.705 },
};

function nuclidoSPECT(symbol: string): NuclidoTerapia {
  const n = nuclidoTerapiaDeSimbolo(symbol);
  if (!n) throw new Error(`Sin espectro ENSDF para ${symbol}`);
  return n;
}

/** Espesor (mm) de la regla espectral de `terapiaEspectroGP` para la transmisión B. */
function espesorSPECT(symbol: string, material: 'lead' | 'concrete' | 'gypsum', B: number): number {
  return espesorTerapiaGP(nuclidoSPECT(symbol), 1, B, MATERIAL_SPECT[material]).espesor_mm;
}

/**
 * Fase 11 (seguimiento de #57, N3): el blindaje ya no es n·TVL. Las TVL fijas (Delacroix 2002 en plomo; haz estrecho de
 * XCOM en concreto, sin buildup) quedaban cortas en concreto (I-123: 70 mm por TVL, 140 mm a B = 0.01 frente a 273 mm
 * del GP) y daban otro resultado que el diálogo de Medicina Nuclear para el mismo nucleido. Ahora la transmisión y los
 * espesores salen de `terapiaEspectroGP` (espectro ENSDF completo con Iγ ≥ 0.1 % y buildup GP de ANSI/ANS-6.4.3; el
 * mayor con el haz estrecho a la línea dura cuando ésta aporta ≥ 2 % del kerma: I-131, Tc-99m, Tl-201, In-111, Sm-153), igual que
 * en los demás diálogos. `tenthValueLead_mm` y `tenthValueConcrete_mm` son el primer espesor de esa regla (B = 0.1) y
 * sólo se muestran. IPEM Report 109 es de pago y no se pudo contrastar; sus valores no se copian aquí.
 */
const RAD = (name: string, symbol: string, halfLife_h: number, gamma_MeV: number, photonYield: number, gammaConstant_uSvm2perGBqh: number): SPECTRadionuclide => ({
  name, symbol, halfLife_h, gamma_MeV, photonYield, gammaConstant_uSvm2perGBqh,
  tenthValueLead_mm: +espesorSPECT(symbol, 'lead', 0.1).toFixed(2),
  tenthValueConcrete_mm: +espesorSPECT(symbol, 'concrete', 0.1).toFixed(1),
});

export const SPECT_RADIONUCLIDES: SPECTRadionuclide[] = [
  RAD('Technetium-99m', 'Tc-99m', 6.01, 0.140, 0.885, 0.0593),
  RAD('Thallium-201', 'Tl-201', 73.1, 0.135, 0.53, 0.0364),
  RAD('Iodine-123', 'I-123', 13.2, 0.159, 0.83, 0.0583),
  RAD('Iodine-131', 'I-131', 193.6, 0.364, 0.81, 0.0595),
  RAD('Gallium-67', 'Ga-67', 78.3, 0.093, 0.65, 0.0215),
  RAD('Indium-111', 'In-111', 67.3, 0.171, 0.90, 0.0479),
  RAD('Samarium-153', 'Sm-153', 46.3, 0.103, 0.28, 0.0092),
];

/** Transmisión de kerma en aire de la pared (regla espectral GP) para el nucleido y el material. */
export function transmisionSPECT(rad: SPECTRadionuclide, material: 'lead' | 'concrete' | 'gypsum', t_mm: number): number {
  if (!(t_mm > 0)) return 1;
  const { mat, escala } = materialGPCatalogo(MATERIAL_SPECT[material]);
  return transmisionRegla(nuclidoSPECT(rad.symbol), mat, t_mm / 10 / escala);
}

/** Nota de la traza del yeso (H4 de la revisión del #58). */
export const NOTA_YESO_IPEM =
  'yeso = concreto ordinario de la misma masa (µ/ρ del CaSO₄·2H₂O de PNNL-15870 Rev. 1 ≥ concreto en NIST XCOM: conservador)';

/** Texto del método para el diálogo; con pared de yeso añade la nota de la equivalencia másica. */
export function metodoSPECT(rad: SPECTRadionuclide, material?: 'lead' | 'concrete' | 'gypsum'): string {
  const m = metodoEspectro(nuclidoSPECT(rad.symbol), null);
  return material === 'gypsum' ? `${m}; ${NOTA_YESO_IPEM}` : m;
}

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

/** TVL mostrada (mm): primer espesor de la regla espectral (B = 0.1) en el material; no se usa para calcular. */
export function tvlSPECT(rad: SPECTRadionuclide, material: 'lead' | 'concrete' | 'gypsum'): number {
  if (material === 'lead') return rad.tenthValueLead_mm;
  return material === 'concrete' ? rad.tenthValueConcrete_mm : espesorSPECT(rad.symbol, 'gypsum', 0.1);
}

const radDe = (symbol: string) => SPECT_RADIONUCLIDES.find(r => r.symbol === symbol) || SPECT_RADIONUCLIDES[0];

/** Sala completa: la suma de todos los procedimientos se compara con la meta una sola vez. */
export function salaSPECT(procs: SPECTProcedure[], distance_m: number, wallThickness_mm: number, wallMaterial: 'lead' | 'concrete' | 'gypsum', designGoal_uSv_week: number) {
  const r = procs.map(p => calculateSPECTShielding({ procedure: p, distance_m, wallThickness_mm, wallMaterial, designGoal_uSv_week }));
  const total = r.reduce((a, x) => a + x.weeklyKerma_uSv, 0);
  const totalBlindado = r.reduce((a, x) => a + x.shieldedKerma_uSv, 0);
  // Espesor que lleva la suma a la meta (bisección sobre Σ Kᵢ·Tᵢ(t), Tᵢ de la regla espectral de cada nucleido).
  const espesor = (mat: 'lead' | 'concrete') => {
    const rads = procs.map(p => radDe(p.radionuclide));
    const f = (t: number) => r.reduce((a, x, k) => a + x.weeklyKerma_uSv * transmisionSPECT(rads[k], mat, t), 0);
    if (f(0) <= designGoal_uSv_week) return 0;
    let lo = 0, hi = 1;
    while (f(hi) > designGoal_uSv_week && hi < 1e5) hi *= 2;
    for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (f(m) > designGoal_uSv_week) lo = m; else hi = m; }
    return hi;
  };
  return { resultados: r, total_uSv: total, totalBlindado_uSv: totalBlindado, cumple: totalBlindado <= designGoal_uSv_week, plomo_mm: espesor('lead'), concreto_mm: espesor('concrete') };
}

export function calculateSPECTShielding(i: SPECTShieldingInput): SPECTShieldingResult {
  const rad = radDe(i.procedure.radionuclide);
  const admin_GBq = i.procedure.avgAdminActivity_MBQ / 1000;
  const time_h = i.procedure.avgImagingTime_min / 60;
  const weeklyKerma = i.procedure.patientsPerWeek * admin_GBq * rad.gammaConstant_uSvm2perGBqh * time_h * 1000 / (i.distance_m * i.distance_m);
  const transmission = transmisionSPECT(rad, i.wallMaterial, i.wallThickness_mm);
  const shieldedKerma = weeklyKerma * transmission;
  // Espesor total requerido (sin descontar la pared actual) por la regla espectral; requiredTVL = décadas de atenuación.
  const ratio0 = weeklyKerma > 0 ? i.designGoal_uSv_week / weeklyKerma : Infinity;
  const necesita = ratio0 > 0 && ratio0 < 1;
  const reqTvl = necesita ? -Math.log10(ratio0) : 0;
  return {
    weeklyKerma_uSv: weeklyKerma, shieldedKerma_uSv: shieldedKerma, withinGoal: shieldedKerma <= i.designGoal_uSv_week,
    requiredLead_mm: necesita ? espesorSPECT(rad.symbol, 'lead', ratio0) : 0,
    requiredConcrete_mm: necesita ? espesorSPECT(rad.symbol, 'concrete', ratio0) : 0,
    requiredTVL: reqTvl, transmission,
  };
}

export function getSPECTWeeklyTotal(procedures: SPECTProcedure[], distance_m: number): number {
  return procedures.reduce((sum, p) => {
    const r = SPECT_RADIONUCLIDES.find(x => x.symbol === p.radionuclide) || SPECT_RADIONUCLIDES[0];
    return sum + p.patientsPerWeek * (p.avgAdminActivity_MBQ / 1000) * r.gammaConstant_uSvm2perGBqh * (p.avgImagingTime_min / 60) * 1000 / (distance_m * distance_m);
  }, 0);
}
