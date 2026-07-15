// Batch 3: Neutron shielding calculator for >10 MV (NCRP 151 Annex A)
export interface NeutronConfig {
  energy_MeV: number;        // 15, 18, 20, 25 MV
  workload_Gy_week: number;
  distance_m: number;
  target_mSv_week: number;
  hasBoratedPolyethylene: boolean; // BPE door
  hasWaterBarrier: boolean;
}

export interface NeutronResult {
  neutronDose_mSv_week: number;
  gammaCaptureDose_mSv_week: number;
  totalDose_mSv_week: number;
  compliant: boolean;
  // Recommendations
  bpeThickness_mm: number;        // Borated polyethylene
  waterThickness_mm: number;      // Water barrier
  concreteExtra_mm: number;       // Extra concrete
  doorRecommendation: string;
}

// Neutron dose per Gy at 1m for various energies (NCRP 151 Table A.1)
const NEUTRON_YIELD: Record<number, number> = {
  15: 0.08,   // Sv/Gy at 1m
  18: 0.12,
  20: 0.15,
  25: 0.25,
};

// HVL for neutrons in various materials (cm)
const NEUTRON_HVL: Record<string, number> = {
  'concrete': 25,
  'bpe': 8,      // 5% borated polyethylene
  'water': 10,
  'polyethylene': 12,
};

export function calculateNeutronShielding(config: NeutronConfig): NeutronResult {
  const yieldFactor = NEUTRON_YIELD[config.energy_MeV] || 0.15;
  const Hn = config.workload_Gy_week * yieldFactor * 1000 / (config.distance_m ** 2); // uSv/week
  
  // Gamma capture dose (neutrons captured in concrete produce gamma)
  const Hgamma = Hn * 0.3; // ~30% of neutron dose as capture gamma
  const total = (Hn + Hgamma) / 1000; // mSv/week

  const compliant = total <= config.target_mSv_week;

  // Calculate required BPE for door
  const bpeHVL = NEUTRON_HVL['bpe'] * 10; // mm
  const nBPE = Math.log10((Hn / 1000) / config.target_mSv_week) || 0;
  const bpe_mm = Math.max(0, nBPE * bpeHVL);

  // Water barrier (for maze)
  const waterHVL = NEUTRON_HVL['water'] * 10;
  const nWater = Math.log10((Hn / 1000) / (config.target_mSv_week * 0.5)) || 0;
  const water_mm = Math.max(0, nWater * waterHVL);

  // Extra concrete
  const concreteHVL = NEUTRON_HVL['concrete'] * 10;
  const nConcrete = Math.log10((Hgamma / 1000) / config.target_mSv_week) || 0;
  const concreteExtra_mm = Math.max(0, nConcrete * concreteHVL);

  let doorRec = '';
  if (bpe_mm > 0) {
    doorRec = `Puerta con ${Math.ceil(bpe_mm / 5) * 5} mm de polietileno borado al ${(bpe_mm > 50 ? 10 : 5)}% + plomo externo`;
  } else {
    doorRec = 'Puerta estandar con plomo suficiente para fotones (neutrones atenuados por laberinto)';
  }

  return {
    neutronDose_mSv_week: Hn / 1000,
    gammaCaptureDose_mSv_week: Hgamma / 1000,
    totalDose_mSv_week: total,
    compliant,
    bpeThickness_mm: bpe_mm,
    waterThickness_mm: water_mm,
    concreteExtra_mm,
    doorRecommendation: doorRec,
  };
}
