// =============================================================================
// cbctIGRTData.ts — Blindaje para CBCT/IGRT en LINAC (v14.3)
// AAPM TG-96 / NCRP 147 / NCRP 151 §4.8.7
// Todos los LINAC modernos (TrueBeam, Versa HD, Halcyon, Ethos) incluyen CBCT kV
// =============================================================================

export interface CBCTSystem {
  manufacturer: string;
  model: string;
  kVp_range: [number, number];
  mA_max: number;
  exposure_per_scan_mAs: number;
  scans_per_patient: number;
  patients_per_week: number;
  dose_per_scan_mGy: number; // a isocentro
}

export const CBCT_SYSTEMS: CBCTSystem[] = [
  { manufacturer: 'Varian', model: 'TrueBeam / Edge', kVp_range: [100, 140], mA_max: 20, exposure_per_scan_mAs: 1200, scans_per_patient: 1, patients_per_week: 25, dose_per_scan_mGy: 0.1 },
  { manufacturer: 'Varian', model: 'Halcyon', kVp_range: [100, 120], mA_max: 16, exposure_per_scan_mAs: 800, scans_per_patient: 1, patients_per_week: 30, dose_per_scan_mGy: 0.08 },
  { manufacturer: 'Varian', model: 'Ethos', kVp_range: [100, 140], mA_max: 20, exposure_per_scan_mAs: 1200, scans_per_patient: 2, patients_per_week: 25, dose_per_scan_mGy: 0.1 },
  { manufacturer: 'Elekta', model: 'Versa HD / Unity', kVp_range: [100, 140], mA_max: 20, exposure_per_scan_mAs: 1100, scans_per_patient: 1, patients_per_week: 25, dose_per_scan_mGy: 0.09 },
  { manufacturer: 'Elekta', model: 'Harmony', kVp_range: [100, 120], mA_max: 16, exposure_per_scan_mAs: 900, scans_per_patient: 1, patients_per_week: 30, dose_per_scan_mGy: 0.07 },
  { manufacturer: 'Accuray', model: 'CyberKnife', kVp_range: [100, 150], mA_max: 25, exposure_per_scan_mAs: 1500, scans_per_patient: 2, patients_per_week: 15, dose_per_scan_mGy: 0.15 },
];

// ── HVL/TVL para sistemas kV CBCT ──
export const HVL_CBCT_KV: Record<string, Record<string, { HVL_mm: number; TVL_mm: number }>> = {
  concrete: {
    '100': { HVL_mm: 28, TVL_mm: 92 },
    '120': { HVL_mm: 30, TVL_mm: 100 },
    '140': { HVL_mm: 34, TVL_mm: 112 },
    '150': { HVL_mm: 37, TVL_mm: 120 },
  },
  lead: {
    '100': { HVL_mm: 0.15, TVL_mm: 0.50 },
    '120': { HVL_mm: 0.20, TVL_mm: 0.65 },
    '140': { HVL_mm: 0.27, TVL_mm: 0.88 },
    '150': { HVL_mm: 0.32, TVL_mm: 1.05 },
  },
  steel: {
    '100': { HVL_mm: 6, TVL_mm: 20 },
    '120': { HVL_mm: 7, TVL_mm: 23 },
    '140': { HVL_mm: 8, TVL_mm: 26 },
    '150': { HVL_mm: 9, TVL_mm: 30 },
  },
  gypsum: {
    '100': { HVL_mm: 22, TVL_mm: 72 },
    '120': { HVL_mm: 24, TVL_mm: 78 },
    '140': { HVL_mm: 27, TVL_mm: 88 },
    '150': { HVL_mm: 30, TVL_mm: 98 },
  },
};

/**
 * Calcular dosis semanal de fuga CBCT en puerta del laberinto
 * Método: NCRP 151 §4.8.7 + AAPM TG-96
 */
export function calculateCBCTDose({
  kVp,
  mA,
  exposure_time_s,
  scans_per_patient,
  patients_per_week,
  distance_m,
  isocenter_shielding_mm,
}: {
  kVp: number;
  mA: number;
  exposure_time_s: number;
  scans_per_patient: number;
  patients_per_week: number;
  distance_m: number;
  isocenter_shielding_mm: number;
}): {
  weekly_dose_mSv: number;
  annual_dose_mSv: number;
  passes: boolean;
  notes: string;
} {
  // Dosis por scan a 1m (mGy) — interpolación aproximada
  const baseDose_1m = (kVp / 100) * (mA / 20) * (exposure_time_s / 60) * 0.1;
  
  // Corrección por distancia (ley inversa del cuadrado)
  const dose_at_distance = baseDose_1m / (distance_m ** 2);
  
  // Corrección por blindaje del isocentro (atenuación aproximada)
  const HVL_mm = HVL_CBCT_KV.concrete[String(kVp) as keyof typeof HVL_CBCT_KV.concrete]?.HVL_mm || 30;
  const n_HVL = isocenter_shielding_mm / HVL_mm;
  const transmission = Math.pow(2, -n_HVL);
  
  const dose_per_scan = dose_at_distance * transmission;
  const weekly_dose_mSv = dose_per_scan * scans_per_patient * patients_per_week;
  const annual_dose_mSv = weekly_dose_mSv * 50; // 50 semanas/año
  
  const limit_mSv_year = 5; // PúblicO (México)
  const passes = annual_dose_mSv < limit_mSv_year;
  
  return {
    weekly_dose_mSv: Math.round(weekly_dose_mSv * 1000) / 1000,
    annual_dose_mSv: Math.round(annual_dose_mSv * 100) / 100,
    passes,
    notes: passes 
      ? `Cumple: ${annual_dose_mSv.toFixed(2)} mSv/año < ${limit_mSv_year} mSv/año (público)`
      : `NO CUMPLE: ${annual_dose_mSv.toFixed(2)} mSv/año > ${limit_mSv_year} mSv/año. Aumentar blindaje o distancia.`,
  };
}

/**
 * Recomendaciones de blindaje CBCT por configuración
 */
export function getCBCTShieldingRecommendation({
  kVp,
  hasMaze,
  distance_to_control_m,
}: {
  kVp: number;
  hasMaze: boolean;
  distance_to_control_m: number;
}): {
  min_concrete_mm: number;
  min_lead_door_mm: number;
  additional_notes: string[];
} {
  const notes: string[] = [];
  let min_concrete = 200; // mm base
  let min_lead = 0.5; // mm base
  
  if (kVp >= 140) {
    min_concrete = 250;
    min_lead = 1.0;
    notes.push('kV ≥ 140: requiere blindaje reforzado (TVL mayor)');
  }
  
  if (!hasMaze) {
    min_concrete += 50;
    min_lead += 0.5;
    notes.push('Sin laberinto: aumentar blindaje puerta +50 mm concreto equivalente');
  }
  
  if (distance_to_control_m < 4) {
    notes.push(`Distancia ${distance_to_control_m}m < 4m recomendado: considerar aumentar blindaje`);
  }
  
  notes.push('AAPM TG-96: blindaje CBCT generalmente incluido en diseño LINAC');
  notes.push('NCRP 151 §4.8.7: dosis CBCT adicional ~0.1-1.0 mSv/sem a puerta');
  
  return { min_concrete_mm: min_concrete, min_lead_door_mm: min_lead, additional_notes: notes };
}
