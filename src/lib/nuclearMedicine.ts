// =============================================================================
// nuclearMedicine.ts — Advanced Nuclear Medicine Shielding Calculations
// AAPM TG 108, NCRP 147/151 Ch.B.7, ICRP 106, IAEA SSG-46
// PET/CT, SPECT, Therapeutic radionuclides, MIRD dosimetry
// =============================================================================

import { P_CONTROLADA_uSv_semana, P_NO_CONTROLADA_uSv_semana } from './limitesDosis';
import { espesorTerapiaGP, metodoEspectro, nuclidoTerapiaDeSimbolo } from './terapiaEspectroGP';

// ── Radionuclide database with TG 108 constants ──
export interface Radionuclide {
  symbol: string;
  name: string;
  halfLife_hours: number;
  halfLife_text: string;
  gammaConstant_mSv_m2_GBq_h: number; // Air kerma constant Γ
  primaryEnergies_keV: number[];
  emissionType: 'gamma' | 'beta' | 'alpha' | ' positron' | 'gamma+beta' | 'alpha+gamma';
  avgBetaEnergy_MeV?: number;
  maxBetaEnergy_MeV?: number;
  // Shielding values (lead, mm)
  HVL_lead_mm: number;
  TVL_lead_mm: number;
  // Shielding values (concrete, mm)
  HVL_concrete_mm: number;
  TVL_concrete_mm: number;
  notes: string;
  category: 'PET' | 'SPECT' | 'Therapy' | 'Diagnosis';
}

/**
 * Fase 11 — contraste de las TVL de biblioteca (antes «pendientes de contraste»):
 * - I-131, Lu-177, I-123, Tc-99m, Tl-201, In-111 y Zr-89: el espesor de los diálogos sale de `terapiaEspectroGP`
 *   (espectro ENSDF completo, líneas con Iγ ≥ 0.1 %, con buildup GP de ANSI/ANS-6.4.3, y el mayor con el haz estrecho a
 *   la línea más energética con Iγ ≥ 0.1 % cuando ésta aporta ≥ 2 % del kerma sin blindaje —criterio único de la
 *   revisión del #58: I-131 722.9 keV, Lu-177 321.3 keV, Tc-99m 140.5, Tl-201 167.4, In-111 245.4 keV—; µ de XCOM en
 *   malla fina: In-111 Pb TVL 3.26 mm, I-131 20.44 mm, Lu-177 5.78 mm). Las HVL y TVL de la tabla de
 *   estos nucleidos son el primer espesor de esa regla (B = 0.5 y B = 0.1, Pb 11.35 y concreto 2.35 g/cm³) y sólo se
 *   muestran: el cálculo usa la curva entera, que en plomo tiende a la pendiente de la línea dura y en concreto incluye
 *   el buildup.
 *   I-123 ya no usa la TVL de haz estrecho a 529 keV (1.27 %): con peso 1 desde B = 1 daba 13.7 mm de Pb por TVL
 *   (≈ 6× el GP a B = 0.1 y 27.2 frente a 15.7 mm a B = 0.01; el GP sólo supera n·13.66 mm por debajo de B ≈ 1e-7) y,
 *   sin buildup, quedaba corta en concreto (113 mm por TVL frente a 164 mm del GP a B = 0.1 y 273 mm a B = 0.01).
 * - Seguimiento de #57 (N3): Tc-99m, Tl-201, In-111 y Zr-89 usaban n·TVL de haz estrecho sin buildup. En concreto,
 *   Tc-99m (76 mm por TVL) y Tl-201 (72 mm) quedaban 1.6–2.2× por debajo del GP (148/237 y 156/251 mm a B = 0.1/0.01) e
 *   In-111 (149 mm) un 15 % por debajo a B = 0.1 (176 mm). El umbral de línea de la biblioteca pasa de 1 % a 0.1 %, el mismo del espectro: en Zr-89 entra
 *   la línea de 1713 keV (0.745 %) y las de 1657 y 1744.5 keV.
 * - F-18, Ga-68 y Cu-64 usan la curva de TG-108 a 511 keV en los diálogos (la tabla sólo se muestra).
 * - Y-90, Ra-223 y Ac-225: Γ y TVL alineadas con `TherapeuticRadionuclideShielding` (revisión 8c: cadena en equilibrio,
 *   línea dura de la cadena); las de aquí eran las de las gammas blandas del padre. Y-90 (bremsstrahlung) sigue pendiente
 *   de caso publicado. Las HVL de la tabla son las de la línea principal (primer espesor), no TVL/3.32. Son los únicos que
 *   siguen con n·TVL.
 */
export const RADIONUCLIDES: Radionuclide[] = [
  // ═══ PET TRACERS ═══
  {
    symbol: 'F-18', name: 'Fluorine-18 (FDG)', halfLife_hours: 1.83, halfLife_text: '109.8 min',
    gammaConstant_mSv_m2_GBq_h: 0.143, primaryEnergies_keV: [511],
    emissionType: ' positron', avgBetaEnergy_MeV: 0.242, maxBetaEnergy_MeV: 0.635,
    HVL_lead_mm: 4.1, TVL_lead_mm: 13.6, HVL_concrete_mm: 170, TVL_concrete_mm: 564,
    notes: 'Most common PET tracer. 511 keV annihilation photons. Dose: 3.7-7.4 GBq per patient.',
    category: 'PET',
  },
  {
    symbol: 'Ga-68', name: 'Gallium-68 (DOTATATE/PSMA)', halfLife_hours: 1.13, halfLife_text: '67.7 min',
    gammaConstant_mSv_m2_GBq_h: 0.134, primaryEnergies_keV: [511, 1077],
    emissionType: ' positron', avgBetaEnergy_MeV: 0.352, maxBetaEnergy_MeV: 1.899,
    HVL_lead_mm: 4.5, TVL_lead_mm: 14.9, HVL_concrete_mm: 175, TVL_concrete_mm: 580,
    notes: 'Growing use for neuroendocrine tumors (NETs) and prostate cancer. Short half-life.',
    category: 'PET',
  },
  {
    symbol: 'Cu-64', name: 'Copper-64', halfLife_hours: 12.7, halfLife_text: '12.7 h',
    gammaConstant_mSv_m2_GBq_h: 0.120, primaryEnergies_keV: [511, 1346],
    emissionType: ' positron', avgBetaEnergy_MeV: 0.150, maxBetaEnergy_MeV: 0.653,
    HVL_lead_mm: 5.2, TVL_lead_mm: 17.3, HVL_concrete_mm: 185, TVL_concrete_mm: 612,
    notes: 'Longer half-life PET tracer. Theragnostic applications.',
    category: 'PET',
  },
  {
    symbol: 'Zr-89', name: 'Zirconium-89 (Immuno-PET)', halfLife_hours: 78.4, halfLife_text: '78.4 h',
    gammaConstant_mSv_m2_GBq_h: 0.101, primaryEnergies_keV: [511, 909],
    emissionType: ' positron', avgBetaEnergy_MeV: 0.144, maxBetaEnergy_MeV: 0.902,
    HVL_lead_mm: 9.5, TVL_lead_mm: 31.3, HVL_concrete_mm: 112, TVL_concrete_mm: 261,
    notes: 'Long half-life for antibody imaging. Immuno-PET applications.',
    category: 'PET',
  },
  // ═══ SPECT TRACERS ═══
  {
    symbol: 'Tc-99m', name: 'Technetium-99m', halfLife_hours: 6.01, halfLife_text: '6.01 h',
    gammaConstant_mSv_m2_GBq_h: 0.030, primaryEnergies_keV: [140],
    emissionType: 'gamma',
    HVL_lead_mm: 0.44, TVL_lead_mm: 1.16, HVL_concrete_mm: 77, TVL_concrete_mm: 148,
    notes: 'Most common SPECT tracer. Low energy, easy to shield. Dose: 0.37-1.11 GBq.',
    category: 'SPECT',
  },
  {
    symbol: 'I-131', name: 'Iodine-131 (NaI)', halfLife_hours: 193.0, halfLife_text: '8.02 d',
    gammaConstant_mSv_m2_GBq_h: 0.059, primaryEnergies_keV: [364, 637],
    emissionType: 'gamma+beta', avgBetaEnergy_MeV: 0.192, maxBetaEnergy_MeV: 0.606,
    HVL_lead_mm: 6.15, TVL_lead_mm: 20.44, HVL_concrete_mm: 115, TVL_concrete_mm: 224,
    notes: 'Thyroid therapy and diagnosis. Long half-life, beta+gamma emitter. High shielding needs.',
    category: 'Therapy',
  },
  {
    symbol: 'I-123', name: 'Iodine-123', halfLife_hours: 13.2, halfLife_text: '13.2 h',
    gammaConstant_mSv_m2_GBq_h: 0.036, primaryEnergies_keV: [159],
    emissionType: 'gamma',
    HVL_lead_mm: 0.59, TVL_lead_mm: 2.1, HVL_concrete_mm: 83, TVL_concrete_mm: 164,
    notes: 'Thyroid imaging (preferred over I-131 for diagnosis due to lower dose).',
    category: 'SPECT',
  },
  {
    symbol: 'In-111', name: 'Indium-111 (Octreoscan)', halfLife_hours: 67.2, halfLife_text: '67.2 h',
    gammaConstant_mSv_m2_GBq_h: 0.080, primaryEnergies_keV: [172, 247],
    emissionType: 'gamma',
    HVL_lead_mm: 0.98, TVL_lead_mm: 3.26, HVL_concrete_mm: 89, TVL_concrete_mm: 176,
    notes: 'Neuroendocrine tumor imaging. Higher energy gamma, requires moderate shielding.',
    category: 'SPECT',
  },
  {
    symbol: 'Tl-201', name: 'Thallium-201', halfLife_hours: 73.0, halfLife_text: '73.0 h',
    gammaConstant_mSv_m2_GBq_h: 0.046, primaryEnergies_keV: [69, 71, 81],
    emissionType: 'gamma',
    HVL_lead_mm: 0.52, TVL_lead_mm: 1.53, HVL_concrete_mm: 79, TVL_concrete_mm: 156,
    notes: 'Cardiac perfusion imaging. Very low energy, minimal shielding needed.',
    category: 'SPECT',
  },
  // ═══ THERAPEUTIC RADIONUCLIDES ═══
  {
    symbol: 'Lu-177', name: 'Lutetium-177 (DOTATATE/PSMA)', halfLife_hours: 161.0, halfLife_text: '6.71 d',
    gammaConstant_mSv_m2_GBq_h: 0.005, primaryEnergies_keV: [113, 208],
    emissionType: 'gamma+beta', avgBetaEnergy_MeV: 0.134, maxBetaEnergy_MeV: 0.498,
    HVL_lead_mm: 1.74, TVL_lead_mm: 5.78, HVL_concrete_mm: 84, TVL_concrete_mm: 168,
    notes: 'PRRT for NETs (Lutathera) and prostate cancer (Pluvicto). 7.4 GBq/dose. Growing use.',
    category: 'Therapy',
  },
  {
    symbol: 'Y-90', name: 'Yttrium-90 (SIRT/TARE)', halfLife_hours: 64.0, halfLife_text: '64.0 h',
    gammaConstant_mSv_m2_GBq_h: 0.0085, primaryEnergies_keV: [],
    emissionType: 'beta', avgBetaEnergy_MeV: 0.935, maxBetaEnergy_MeV: 2.284,
    HVL_lead_mm: 0.01, TVL_lead_mm: 6.0, HVL_concrete_mm: 1, TVL_concrete_mm: 280,
    notes: 'Pure beta emitter. SIRT for liver tumors. Bremsstrahlung shielding important.',
    category: 'Therapy',
  },
  {
    symbol: 'Ra-223', name: 'Radium-223 (Xofigo)', halfLife_hours: 276.0, halfLife_text: '11.4 d',
    gammaConstant_mSv_m2_GBq_h: 0.045, primaryEnergies_keV: [81, 154, 269, 832],
    emissionType: 'alpha+gamma', avgBetaEnergy_MeV: 0.003, // alpha emissions
    HVL_lead_mm: 0.15, TVL_lead_mm: 24, HVL_concrete_mm: 15, TVL_concrete_mm: 250,
    notes: 'Alpha emitter for bone metastases (prostate). 55 kBq/kg. Very high energy but short range.',
    category: 'Therapy',
  },
  {
    symbol: 'Ac-225', name: 'Actinium-225 (PSMA-targeted)', halfLife_hours: 240.0, halfLife_text: '10.0 d',
    gammaConstant_mSv_m2_GBq_h: 0.065, primaryEnergies_keV: [100, 150, 1567],
    emissionType: 'alpha+gamma', // cascade of 4 alpha decays
    HVL_lead_mm: 0.20, TVL_lead_mm: 40, HVL_concrete_mm: 18, TVL_concrete_mm: 190,
    notes: 'Emerging alpha therapy. 4 alpha emissions per decay. Complex decay chain.',
    category: 'Therapy',
  },
  {
    symbol: 'I-131-NaI', name: 'I-131 (Therapy, high dose)', halfLife_hours: 193.0, halfLife_text: '8.02 d',
    gammaConstant_mSv_m2_GBq_h: 0.059, primaryEnergies_keV: [364, 637],
    emissionType: 'gamma+beta', avgBetaEnergy_MeV: 0.192, maxBetaEnergy_MeV: 0.606,
    HVL_lead_mm: 6.15, TVL_lead_mm: 20.44, HVL_concrete_mm: 115, TVL_concrete_mm: 224,
    notes: 'Thyroid ablation: 1.85-7.4 GBq. Hyperthyroidism: 0.15-0.55 GBq.',
    category: 'Therapy',
  },
];

// ── Room shielding types for nuclear medicine ──
export interface RoomShieldingConfig {
  roomType: string;
  description: string;
  typicalDose_GBq: number;
  patientsPerWeek: number;
  occupancyFactor: number;
  distanceToBarrier_m: number;
  designGoal_uSv_week: number;
  recommendedMaterial: string;
}

export const NM_ROOM_CONFIGS: RoomShieldingConfig[] = [
  {
    roomType: 'PET Injection Room', description: 'Hot lab for F-18/Ga-68 dose preparation',
    typicalDose_GBq: 7.4, patientsPerWeek: 30, occupancyFactor: 1.0,
    distanceToBarrier_m: 2.0, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'PET Uptake Room', description: 'Patient waiting after tracer injection',
    typicalDose_GBq: 7.4, patientsPerWeek: 30, occupancyFactor: 0.25,
    distanceToBarrier_m: 2.5, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'PET/CT Scanner Room', description: 'PET/CT imaging room',
    typicalDose_GBq: 7.4, patientsPerWeek: 30, occupancyFactor: 1.0,
    distanceToBarrier_m: 3.5, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'SPECT Injection Room', description: 'Tc-99m dose preparation',
    typicalDose_GBq: 1.11, patientsPerWeek: 40, occupancyFactor: 1.0,
    distanceToBarrier_m: 2.0, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'SPECT Imaging Room', description: 'Gamma camera room',
    typicalDose_GBq: 1.11, patientsPerWeek: 40, occupancyFactor: 1.0,
    distanceToBarrier_m: 3.0, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'I-131 Therapy Room', description: 'I-131 oral dose administration',
    typicalDose_GBq: 7.4, patientsPerWeek: 4, occupancyFactor: 0.5,
    distanceToBarrier_m: 3.0, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'I-131 Inpatient Ward', description: 'Patient hospitalization post-I-131',
    typicalDose_GBq: 7.4, patientsPerWeek: 4, occupancyFactor: 0.25,
    distanceToBarrier_m: 4.0, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'Lu-177 Therapy Room', description: 'Lu-177 outpatient infusion',
    typicalDose_GBq: 7.4, patientsPerWeek: 8, occupancyFactor: 0.5,
    distanceToBarrier_m: 3.0, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'Lu-177 Decay Storage', description: 'Waste decay-in-storage room',
    typicalDose_GBq: 50, patientsPerWeek: 0, occupancyFactor: 0.025,
    distanceToBarrier_m: 5.0, designGoal_uSv_week: P_NO_CONTROLADA_uSv_semana, recommendedMaterial: 'Concrete',
  },
  {
    roomType: 'Y-90 SIRT Procedure Room', description: 'Y-90 selective internal radiation therapy',
    typicalDose_GBq: 2.0, patientsPerWeek: 6, occupancyFactor: 1.0,
    distanceToBarrier_m: 2.5, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'Hot Lab / Dose Prep', description: 'General radiopharmaceutical preparation',
    typicalDose_GBq: 20, patientsPerWeek: 50, occupancyFactor: 1.0,
    distanceToBarrier_m: 1.5, designGoal_uSv_week: P_CONTROLADA_uSv_semana, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'Waste Storage (general)', description: 'Short-lived waste decay storage',
    typicalDose_GBq: 100, patientsPerWeek: 0, occupancyFactor: 0.025,
    distanceToBarrier_m: 4.0, designGoal_uSv_week: P_NO_CONTROLADA_uSv_semana, recommendedMaterial: 'Concrete',
  },
];

// ── Shielding calculation functions ──

/** TG 108 method: shielding thickness for nuclear medicine
 *  K = Γ × A × t / d²
 *  Where: K = weekly air kerma, Γ = constant, A = activity, t = time, d = distance
 */
export function calculateWeeklyKerma(
  gammaConstant_mSv_m2_GBq_h: number,
  activity_GBq: number,
  hoursPerWeek: number,
  distance_m: number,
  transmission: number = 1.0,
): number {
  if (distance_m <= 0) return Infinity;
  return gammaConstant_mSv_m2_GBq_h * activity_GBq * hoursPerWeek / (distance_m * distance_m) * transmission;
}

/**
 * Espesor (mm) para la transmisión B en plomo o concreto: los nucleidos con espectro (I-131, Lu-177, I-123, Tc-99m,
 * Tl-201, In-111, Zr-89) por la regla espectral GP (`terapiaEspectroGP`); el resto, n·TVL de la biblioteca. Devuelve
 * también el método para mostrarlo.
 */
export function espesorRadionuclidoTerapia(simbolo: string, material: 'lead' | 'concrete', B: number, tvl_mm: number): { mm: number; metodo: string } {
  if (B >= 1) return { mm: 0, metodo: '—' };
  const nuc = nuclidoTerapiaDeSimbolo(simbolo);
  if (nuc) {
    const r = espesorTerapiaGP(nuc, 1, B, material === 'lead' ? { code: 'PB', density: 11.35 } : { code: 'CONCRETE235', density: 2.35 });
    return { mm: r.espesor_mm, metodo: metodoEspectro(nuc, r.rige) };
  }
  return { mm: -Math.log10(B) * tvl_mm, metodo: 'TVL de biblioteca (n·TVL; cadena en equilibrio de la revisión 8c)' };
}

/** Required shielding thickness for nuclear medicine room (mm)
 *  Uses the TVL method: B = P × d² / (Γ × A × t × T)
 *  n = -log10(B), thickness = n × TVL
 */
export function calculateNMBarrierThickness(
  gammaConstant_mSv_m2_GBq_h: number,
  activity_GBq: number,
  hoursPerWeek: number,
  distance_m: number,
  designGoal_uSv_week: number,
  tvl_mm: number,
): number {
  // Weekly unshielded kerma
  const kermaUnshielded = calculateWeeklyKerma(gammaConstant_mSv_m2_GBq_h, activity_GBq, hoursPerWeek, distance_m);
  // Convert design goal to same units
  const P = designGoal_uSv_week / 1000; // mSv/week
  if (kermaUnshielded <= P) return 0; // Already below limit
  // Number of TVLs needed
  const B = P / kermaUnshielded;
  const nTVLs = -Math.log10(B);
  return Math.max(0, nTVLs * tvl_mm);
}

/** Decay-in-storage: time required for waste to decay below limit */
export function decayInStorageTime(
  initialActivity_GBq: number,
  limit_GBq: number,
  halfLife_hours: number,
): number {
  if (initialActivity_GBq <= limit_GBq) return 0;
  if (limit_GBq <= 0) return Infinity;
  return halfLife_hours * Math.log2(initialActivity_GBq / limit_GBq);
}

/** Activity after decay time */
export function decayedActivity(
  initialActivity_GBq: number,
  halfLife_hours: number,
  elapsedTime_hours: number,
): number {
  return initialActivity_GBq * Math.pow(0.5, elapsedTime_hours / halfLife_hours);
}

/** MIRD-style dose estimate for nuclear medicine procedures */
export interface MIRDDose {
  organ: string;
  absorbedDose_mGy: number;
  effectiveDose_mSv: number;
}

export function estimateMIRDDose(
  nuclide: string,
  administeredActivity_MBQ: number,
  _procedureType: 'PET' | 'SPECT' | 'Therapy',
): MIRDDose[] {
  const A = administeredActivity_MBQ;
  switch (nuclide) {
    case 'F-18':
      return [
        { organ: 'Bladder wall', absorbedDose_mGy: A * 0.19, effectiveDose_mSv: A * 0.019 },
        { organ: 'Brain', absorbedDose_mGy: A * 0.053, effectiveDose_mSv: A * 0.0072 },
        { organ: 'Heart wall', absorbedDose_mGy: A * 0.030, effectiveDose_mSv: A * 0.0051 },
        { organ: 'Kidneys', absorbedDose_mGy: A * 0.021, effectiveDose_mSv: A * 0.0025 },
        { organ: 'Liver', absorbedDose_mGy: A * 0.016, effectiveDose_mSv: A * 0.0021 },
        { organ: 'Effective Dose (total)', absorbedDose_mGy: 0, effectiveDose_mSv: A * 0.019 },
      ];
    case 'Tc-99m':
      return [
        { organ: 'Bladder wall', absorbedDose_mGy: A * 0.061, effectiveDose_mSv: A * 0.0059 },
        { organ: 'Thyroid', absorbedDose_mGy: A * 0.026, effectiveDose_mSv: A * 0.0016 },
        { organ: 'Gallbladder wall', absorbedDose_mGy: A * 0.036, effectiveDose_mSv: A * 0.0043 },
        { organ: 'Effective Dose (total)', absorbedDose_mGy: 0, effectiveDose_mSv: A * 0.0093 },
      ];
    case 'I-131':
      return [
        { organ: 'Thyroid', absorbedDose_mGy: A * 370, effectiveDose_mSv: A * 22 }, // Therapy dose
        { organ: 'Bladder wall', absorbedDose_mGy: A * 0.082, effectiveDose_mSv: A * 0.0092 },
        { organ: 'Stomach wall', absorbedDose_mGy: A * 0.035, effectiveDose_mSv: A * 0.0045 },
        { organ: 'Red marrow', absorbedDose_mGy: A * 0.016, effectiveDose_mSv: A * 0.002 },
        { organ: 'Effective Dose (total)', absorbedDose_mGy: 0, effectiveDose_mSv: A * 0.92 },
      ];
    case 'Lu-177':
      return [
        { organ: 'Kidneys', absorbedDose_mGy: A * 0.62, effectiveDose_mSv: A * 0.037 },
        { organ: 'Bone marrow', absorbedDose_mGy: A * 0.035, effectiveDose_mSv: A * 0.0052 },
        { organ: 'Liver', absorbedDose_mGy: A * 0.15, effectiveDose_mSv: A * 0.0091 },
        { organ: 'Spleen', absorbedDose_mGy: A * 0.30, effectiveDose_mSv: A * 0.018 },
        { organ: 'Tumor (target)', absorbedDose_mGy: A * 1.5, effectiveDose_mSv: A * 0.092 },
        { organ: 'Effective Dose (total)', absorbedDose_mGy: 0, effectiveDose_mSv: A * 0.046 },
      ];
    default:
      return [{ organ: 'Effective Dose (approx)', absorbedDose_mGy: 0, effectiveDose_mSv: A * 0.02 }];
  }
}

/** Patient release criteria (NRC Reg Guide 8.39 / CNSNS)
 *  Uses activity thresholds from NRC RG 8.39 Table 2 as primary criterion,
 *  with dose rate at 1m as secondary check.
 */
export function canReleasePatient(
  remainingActivity_GBq: number,
  nuclide: string,
): { canRelease: boolean; reason: string; limit_mSv_at_1m: number } {
  const nuclideData = RADIONUCLIDES.find(r => r.symbol === nuclide);
  if (!nuclideData) return { canRelease: false, reason: 'Unknown nuclide', limit_mSv_at_1m: 0 };

  // NRC RG 8.39 Table 2 — Activity thresholds (GBq) above which patient should NOT be released
  const nrcThresholds_GBq: Record<string, number> = {
    'F-18': 3.0,      // PET FDG
    'I-131': 1.22,    // Thyroid therapy (cancer)
    'Y-90': 0.74,     // Microspheres
    'Lu-177': 2.22,   // PRRT
    'I-131-NaI': 1.22,// Same as I-131
  };

  const threshold = nrcThresholds_GBq[nuclide] ?? Infinity; // Unknown nuclides = conservative (don't release)
  const belowActivityThreshold = remainingActivity_GBq <= threshold;

  // Secundario: tasa a 1 m ≤ la que corresponde al umbral de actividad (RG 8.39 Tabla 1; para I-131
  // 1.22 GBq ≈ 0.07 mSv/h). Antes se comparaba con 5 mSv/h, que es el límite de DOSA total al público
  // (5 mSv), no una tasa: era ~70× permisivo. Revisión física 2026-11.
  const doseAt1m_mSv_h = nuclideData.gammaConstant_mSv_m2_GBq_h * remainingActivity_GBq;
  const limitRate_mSv_h = Number.isFinite(threshold) ? nuclideData.gammaConstant_mSv_m2_GBq_h * threshold : 0;
  const belowDoseLimit = doseAt1m_mSv_h <= limitRate_mSv_h + 1e-12;

  // Patient can be released only if BOTH criteria are met
  const canRelease = belowActivityThreshold && belowDoseLimit;

  let reason: string;
  if (!belowActivityThreshold && !belowDoseLimit) {
    reason = `Activity ${remainingActivity_GBq.toFixed(2)} GBq > threshold ${threshold} GBq AND dose at 1m = ${doseAt1m_mSv_h.toFixed(2)} mSv/h > ${limitRate_mSv_h.toFixed(3)} mSv/h. Must keep hospitalized.`;
  } else if (!belowActivityThreshold) {
    reason = `Activity ${remainingActivity_GBq.toFixed(2)} GBq > NRC threshold ${threshold} GBq (RG 8.39 Table 2). Must keep hospitalized.`;
  } else if (!belowDoseLimit) {
    reason = `Dose at 1m = ${doseAt1m_mSv_h.toFixed(3)} mSv/h > ${limitRate_mSv_h.toFixed(3)} mSv/h. Must keep hospitalized.`;
  } else {
    reason = `Activity ${remainingActivity_GBq.toFixed(2)} GBq <= ${threshold} GBq AND dose at 1m = ${doseAt1m_mSv_h.toFixed(2)} mSv/h <= ${limitRate_mSv_h.toFixed(3)} mSv/h. Patient can be released.`;
  }

  return { canRelease, reason, limit_mSv_at_1m: limitRate_mSv_h };
}

/** Bremsstrahlung shielding for beta emitters (Y-90) */
export function bremsstrahlungShielding(
  activity_GBq: number,
  maxBetaEnergy_MeV: number,
  distance_m: number,
  designGoal_uSv_week: number,
  tvl_mm_lead: number = 1.5, // approximate for bremsstrahlung
): { leadThickness_mm: number; concreteThickness_mm: number; xrayFraction: number } {
  const xrayFraction = maxBetaEnergy_MeV * 0.0007; // ~0.07% per MeV
  const bremsstrahlungDose_uSv_h = activity_GBq * maxBetaEnergy_MeV * 0.5; // empirical
  const weeklyDose_uSv = bremsstrahlungDose_uSv_h * 40 / (distance_m * distance_m); // 40h/week
  if (weeklyDose_uSv <= designGoal_uSv_week) return { leadThickness_mm: 0, concreteThickness_mm: 0, xrayFraction };
  const B = designGoal_uSv_week / weeklyDose_uSv;
  const n = -Math.log10(B);
  return {
    leadThickness_mm: n * tvl_mm_lead,
    concreteThickness_mm: n * tvl_mm_lead * 40, // concrete ~40x thicker than lead for this energy
    xrayFraction,
  };
}
