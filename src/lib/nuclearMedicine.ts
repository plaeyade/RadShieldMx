// =============================================================================
// nuclearMedicine.ts — Advanced Nuclear Medicine Shielding Calculations
// AAPM TG 108, NCRP 147/151 Ch.B.7, ICRP 106, IAEA SSG-46
// PET/CT, SPECT, Therapeutic radionuclides, MIRD dosimetry
// =============================================================================

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
    HVL_lead_mm: 6.5, TVL_lead_mm: 21.6, HVL_concrete_mm: 200, TVL_concrete_mm: 662,
    notes: 'Long half-life for antibody imaging. Immuno-PET applications.',
    category: 'PET',
  },
  // ═══ SPECT TRACERS ═══
  {
    symbol: 'Tc-99m', name: 'Technetium-99m', halfLife_hours: 6.01, halfLife_text: '6.01 h',
    gammaConstant_mSv_m2_GBq_h: 0.030, primaryEnergies_keV: [140],
    emissionType: 'gamma',
    HVL_lead_mm: 0.27, TVL_lead_mm: 0.90, HVL_concrete_mm: 23, TVL_concrete_mm: 76,
    notes: 'Most common SPECT tracer. Low energy, easy to shield. Dose: 0.37-1.11 GBq.',
    category: 'SPECT',
  },
  {
    symbol: 'I-131', name: 'Iodine-131 (NaI)', halfLife_hours: 193.0, halfLife_text: '8.02 d',
    gammaConstant_mSv_m2_GBq_h: 0.059, primaryEnergies_keV: [364, 637],
    emissionType: 'gamma+beta', avgBetaEnergy_MeV: 0.192, maxBetaEnergy_MeV: 0.606,
    HVL_lead_mm: 3.0, TVL_lead_mm: 10.0, HVL_concrete_mm: 120, TVL_concrete_mm: 398,
    notes: 'Thyroid therapy and diagnosis. Long half-life, beta+gamma emitter. High shielding needs.',
    category: 'Therapy',
  },
  {
    symbol: 'I-123', name: 'Iodine-123', halfLife_hours: 13.2, halfLife_text: '13.2 h',
    gammaConstant_mSv_m2_GBq_h: 0.036, primaryEnergies_keV: [159],
    emissionType: 'gamma',
    HVL_lead_mm: 0.30, TVL_lead_mm: 1.00, HVL_concrete_mm: 25, TVL_concrete_mm: 83,
    notes: 'Thyroid imaging (preferred over I-131 for diagnosis due to lower dose).',
    category: 'SPECT',
  },
  {
    symbol: 'In-111', name: 'Indium-111 (Octreoscan)', halfLife_hours: 67.2, halfLife_text: '67.2 h',
    gammaConstant_mSv_m2_GBq_h: 0.080, primaryEnergies_keV: [172, 247],
    emissionType: 'gamma',
    HVL_lead_mm: 1.0, TVL_lead_mm: 3.3, HVL_concrete_mm: 45, TVL_concrete_mm: 149,
    notes: 'Neuroendocrine tumor imaging. Higher energy gamma, requires moderate shielding.',
    category: 'SPECT',
  },
  {
    symbol: 'Tl-201', name: 'Thallium-201', halfLife_hours: 73.0, halfLife_text: '73.0 h',
    gammaConstant_mSv_m2_GBq_h: 0.046, primaryEnergies_keV: [69, 71, 81],
    emissionType: 'gamma',
    HVL_lead_mm: 0.15, TVL_lead_mm: 0.50, HVL_concrete_mm: 15, TVL_concrete_mm: 50,
    notes: 'Cardiac perfusion imaging. Very low energy, minimal shielding needed.',
    category: 'SPECT',
  },
  // ═══ THERAPEUTIC RADIONUCLIDES ═══
  {
    symbol: 'Lu-177', name: 'Lutetium-177 (DOTATATE/PSMA)', halfLife_hours: 161.0, halfLife_text: '6.71 d',
    gammaConstant_mSv_m2_GBq_h: 0.005, primaryEnergies_keV: [113, 208],
    emissionType: 'gamma+beta', avgBetaEnergy_MeV: 0.134, maxBetaEnergy_MeV: 0.498,
    HVL_lead_mm: 0.50, TVL_lead_mm: 1.67, HVL_concrete_mm: 30, TVL_concrete_mm: 99,
    notes: 'PRRT for NETs (Lutathera) and prostate cancer (Pluvicto). 7.4 GBq/dose. Growing use.',
    category: 'Therapy',
  },
  {
    symbol: 'Y-90', name: 'Yttrium-90 (SIRT/TARE)', halfLife_hours: 64.0, halfLife_text: '64.0 h',
    gammaConstant_mSv_m2_GBq_h: 0.001, primaryEnergies_keV: [],
    emissionType: 'beta', avgBetaEnergy_MeV: 0.935, maxBetaEnergy_MeV: 2.284,
    HVL_lead_mm: 0.01, TVL_lead_mm: 0.03, HVL_concrete_mm: 1, TVL_concrete_mm: 3,
    notes: 'Pure beta emitter. SIRT for liver tumors. Bremsstrahlung shielding important.',
    category: 'Therapy',
  },
  {
    symbol: 'Ra-223', name: 'Radium-223 (Xofigo)', halfLife_hours: 276.0, halfLife_text: '11.4 d',
    gammaConstant_mSv_m2_GBq_h: 0.026, primaryEnergies_keV: [81, 154, 269],
    emissionType: 'alpha+gamma', avgBetaEnergy_MeV: 0.003, // alpha emissions
    HVL_lead_mm: 0.15, TVL_lead_mm: 0.50, HVL_concrete_mm: 15, TVL_concrete_mm: 50,
    notes: 'Alpha emitter for bone metastases (prostate). 55 kBq/kg. Very high energy but short range.',
    category: 'Therapy',
  },
  {
    symbol: 'Ac-225', name: 'Actinium-225 (PSMA-targeted)', halfLife_hours: 240.0, halfLife_text: '10.0 d',
    gammaConstant_mSv_m2_GBq_h: 0.016, primaryEnergies_keV: [100, 150],
    emissionType: 'alpha+gamma', // cascade of 4 alpha decays
    HVL_lead_mm: 0.20, TVL_lead_mm: 0.66, HVL_concrete_mm: 18, TVL_concrete_mm: 60,
    notes: 'Emerging alpha therapy. 4 alpha emissions per decay. Complex decay chain.',
    category: 'Therapy',
  },
  {
    symbol: 'I-131-NaI', name: 'I-131 (Therapy, high dose)', halfLife_hours: 193.0, halfLife_text: '8.02 d',
    gammaConstant_mSv_m2_GBq_h: 0.059, primaryEnergies_keV: [364, 637],
    emissionType: 'gamma+beta', avgBetaEnergy_MeV: 0.192, maxBetaEnergy_MeV: 0.606,
    HVL_lead_mm: 3.0, TVL_lead_mm: 10.0, HVL_concrete_mm: 120, TVL_concrete_mm: 398,
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
    distanceToBarrier_m: 2.0, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'PET Uptake Room', description: 'Patient waiting after tracer injection',
    typicalDose_GBq: 7.4, patientsPerWeek: 30, occupancyFactor: 0.25,
    distanceToBarrier_m: 2.5, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'PET/CT Scanner Room', description: 'PET/CT imaging room',
    typicalDose_GBq: 7.4, patientsPerWeek: 30, occupancyFactor: 1.0,
    distanceToBarrier_m: 3.5, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'SPECT Injection Room', description: 'Tc-99m dose preparation',
    typicalDose_GBq: 1.11, patientsPerWeek: 40, occupancyFactor: 1.0,
    distanceToBarrier_m: 2.0, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'SPECT Imaging Room', description: 'Gamma camera room',
    typicalDose_GBq: 1.11, patientsPerWeek: 40, occupancyFactor: 1.0,
    distanceToBarrier_m: 3.0, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'I-131 Therapy Room', description: 'I-131 oral dose administration',
    typicalDose_GBq: 7.4, patientsPerWeek: 4, occupancyFactor: 0.5,
    distanceToBarrier_m: 3.0, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'I-131 Inpatient Ward', description: 'Patient hospitalization post-I-131',
    typicalDose_GBq: 7.4, patientsPerWeek: 4, occupancyFactor: 0.25,
    distanceToBarrier_m: 4.0, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'Lu-177 Therapy Room', description: 'Lu-177 outpatient infusion',
    typicalDose_GBq: 7.4, patientsPerWeek: 8, occupancyFactor: 0.5,
    distanceToBarrier_m: 3.0, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'Lu-177 Decay Storage', description: 'Waste decay-in-storage room',
    typicalDose_GBq: 50, patientsPerWeek: 0, occupancyFactor: 0.025,
    distanceToBarrier_m: 5.0, designGoal_uSv_week: 25, recommendedMaterial: 'Concrete',
  },
  {
    roomType: 'Y-90 SIRT Procedure Room', description: 'Y-90 selective internal radiation therapy',
    typicalDose_GBq: 2.0, patientsPerWeek: 6, occupancyFactor: 1.0,
    distanceToBarrier_m: 2.5, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'Hot Lab / Dose Prep', description: 'General radiopharmaceutical preparation',
    typicalDose_GBq: 20, patientsPerWeek: 50, occupancyFactor: 1.0,
    distanceToBarrier_m: 1.5, designGoal_uSv_week: 100, recommendedMaterial: 'Lead (Pb)',
  },
  {
    roomType: 'Waste Storage (general)', description: 'Short-lived waste decay storage',
    typicalDose_GBq: 100, patientsPerWeek: 0, occupancyFactor: 0.025,
    distanceToBarrier_m: 4.0, designGoal_uSv_week: 25, recommendedMaterial: 'Concrete',
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

  // Secondary: dose rate at 1m must be <= 5 mSv/h
  const doseAt1m_mSv_h = nuclideData.gammaConstant_mSv_m2_GBq_h * remainingActivity_GBq;
  const belowDoseLimit = doseAt1m_mSv_h <= 5.0;

  // Patient can be released only if BOTH criteria are met
  const canRelease = belowActivityThreshold && belowDoseLimit;

  let reason: string;
  if (!belowActivityThreshold && !belowDoseLimit) {
    reason = `Activity ${remainingActivity_GBq.toFixed(2)} GBq > threshold ${threshold} GBq AND dose at 1m = ${doseAt1m_mSv_h.toFixed(2)} mSv/h > 5.0 mSv/h. Must keep hospitalized.`;
  } else if (!belowActivityThreshold) {
    reason = `Activity ${remainingActivity_GBq.toFixed(2)} GBq > NRC threshold ${threshold} GBq (RG 8.39 Table 2). Must keep hospitalized.`;
  } else if (!belowDoseLimit) {
    reason = `Dose at 1m = ${doseAt1m_mSv_h.toFixed(2)} mSv/h > 5.0 mSv/h. Must keep hospitalized.`;
  } else {
    reason = `Activity ${remainingActivity_GBq.toFixed(2)} GBq <= ${threshold} GBq AND dose at 1m = ${doseAt1m_mSv_h.toFixed(2)} mSv/h <= 5.0 mSv/h. Patient can be released.`;
  }

  return { canRelease, reason, limit_mSv_at_1m: 5.0 };
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
