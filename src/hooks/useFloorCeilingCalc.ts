// Fase 9: Calculo de blindaje de suelo y techo (NCRP 151 §5.2.3)
// Para areas ocupadas arriba/abajo del vault de radioterapia

export interface FloorCeilingConfig {
  // Source params
  energy_MeV: number;
  workload_Gy_week: number;
  useFactor: number;         // U (fraccion del tiempo que el haz apunta)
  // Geometry
  isocenterHeight_m: number;   // Altura del isocentro sobre el piso
  roomHeight_m: number;        // Altura del vault (techo)
  floorThickness_m: number;    // Espesor actual del piso (concreto)
  ceilingThickness_m: number;  // Espesor actual del techo (concreto)
  // Target areas
  areaAboveOccupied: boolean;  // Hay area ocupada arriba?
  areaBelowOccupied: boolean;  // Hay area ocupada abajo?
  distanceToAbove_m: number;   // Distancia isocentro -> punto arriba
  distanceToBelow_m: number;   // Distancia isocentro -> punto abajo
  // Design goals
  designGoalAbove_mSv_week: number;
  designGoalBelow_mSv_week: number;
  occupancyAbove: number;      // T factor above
  occupancyBelow: number;      // T factor below
}

export interface FloorCeilingResult {
  // Ceiling (techo)
  ceilingKerma_unshielded_mSv_week: number;
  ceilingRequiredThickness_mm: number;
  ceilingCompliant: boolean;
  ceilingExtraNeeded_mm: number;
  // Floor (suelo)
  floorKerma_unshielded_mSv_week: number;
  floorRequiredThickness_mm: number;
  floorCompliant: boolean;
  floorExtraNeeded_mm: number;
  // Scattering
  scatterAngle_deg: number;
  scatterFraction: number;
  // Recommendations
  recommendation: string;
}

// TVL concreto segun energia
function getTVL_cm(energy_MeV: number): number {
  if (energy_MeV <= 6) return 37;
  if (energy_MeV <= 10) return 41;
  if (energy_MeV <= 15) return 44;
  if (energy_MeV <= 18) return 45;
  if (energy_MeV <= 25) return 46;
  return 47;
}

// Fraccion de scattering hacia arriba segun angulo (NCRP 151 Tabla B.7)
function getScatterFraction(angle_deg: number): number {
  const coeffs: Record<number, number> = {
    0: 1.0, 5: 0.7, 10: 0.5, 15: 0.35, 20: 0.25,
    25: 0.18, 30: 0.14, 35: 0.10, 40: 0.08, 45: 0.06,
    50: 0.05, 55: 0.04, 60: 0.03, 70: 0.02, 80: 0.015,
    90: 0.01, 100: 0.008, 110: 0.006, 120: 0.005,
    135: 0.004, 150: 0.003,
  };
  // Interpolate
  const angles = Object.keys(coeffs).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < angles.length - 1; i++) {
    if (angle_deg >= angles[i] && angle_deg <= angles[i + 1]) {
      const t = (angle_deg - angles[i]) / (angles[i + 1] - angles[i]);
      return coeffs[angles[i]]! + t * (coeffs[angles[i + 1]]! - coeffs[angles[i]]!);
    }
  }
  return coeffs[angles[angles.length - 1]] || 0.003;
}

export function calculateFloorCeiling(config: FloorCeilingConfig): FloorCeilingResult {
  const TVL_cm = getTVL_cm(config.energy_MeV);
  const TVL_mm = TVL_cm * 10;

  // Angulo de scattering hacia techo (desde isocentro)
  const scatterAngle_deg = Math.atan2(config.roomHeight_m - config.isocenterHeight_m, 3.0) * 180 / Math.PI;
  const scatterFrac = getScatterFraction(scatterAngle_deg);

  // === CEILING (techo) ===
  let ceilingKerma = 0, ceilingRequired_mm = 0, ceilingExtra_mm = 0, ceilingOK = true;
  if (config.areaAboveOccupied) {
    const H0 = config.workload_Gy_week * 1000; // uSv/week
    ceilingKerma = H0 * config.useFactor * config.occupancyAbove * scatterFrac / (config.distanceToAbove_m ** 2);
    if (ceilingKerma > config.designGoalAbove_mSv_week * 1000) {
      const n = Math.log10((ceilingKerma / 1000) / config.designGoalAbove_mSv_week);
      ceilingRequired_mm = n * TVL_mm;
      ceilingExtra_mm = Math.max(0, ceilingRequired_mm - config.ceilingThickness_m * 1000);
      ceilingOK = ceilingExtra_mm <= 0;
    }
  }

  // === FLOOR (suelo) ===
  let floorKerma = 0, floorRequired_mm = 0, floorExtra_mm = 0, floorOK = true;
  if (config.areaBelowOccupied) {
    const H0 = config.workload_Gy_week * 1000;
    // Scatter hacia abajo (angulo cercano a 180°, pero reflejado)
    const floorScatterFrac = getScatterFraction(150); // ~150° para abajo
    floorKerma = H0 * config.useFactor * config.occupancyBelow * floorScatterFrac / (config.distanceToBelow_m ** 2);
    if (floorKerma > config.designGoalBelow_mSv_week * 1000) {
      const n = Math.log10((floorKerma / 1000) / config.designGoalBelow_mSv_week);
      floorRequired_mm = n * TVL_mm;
      floorExtra_mm = Math.max(0, floorRequired_mm - config.floorThickness_m * 1000);
      floorOK = floorExtra_mm <= 0;
    }
  }

  // Recommendations
  let rec = '';
  if (!ceilingOK && !floorOK) rec = `Aumentar techo en ${ceilingExtra_mm.toFixed(0)} mm y suelo en ${floorExtra_mm.toFixed(0)} mm de concreto. Considerar plomo laminado sobre techo.`;
  else if (!ceilingOK) rec = `Aumentar techo en ${ceilingExtra_mm.toFixed(0)} mm de concreto o agregar ${(ceilingExtra_mm * 0.15).toFixed(1)} mm de plomo laminado sobre techo.`;
  else if (!floorOK) rec = `Aumentar suelo en ${floorExtra_mm.toFixed(0)} mm de concreto en areas ocupadas debajo.`;
  else rec = 'El blindaje de suelo y techo cumple con los objetivos de diseno. No se requieren modificaciones.';

  return {
    ceilingKerma_unshielded_mSv_week: ceilingKerma / 1000,
    ceilingRequiredThickness_mm: ceilingRequired_mm,
    ceilingCompliant: ceilingOK,
    ceilingExtraNeeded_mm: ceilingExtra_mm,
    floorKerma_unshielded_mSv_week: floorKerma / 1000,
    floorRequiredThickness_mm: floorRequired_mm,
    floorCompliant: floorOK,
    floorExtraNeeded_mm: floorExtra_mm,
    scatterAngle_deg: scatterAngle_deg,
    scatterFraction: scatterFrac,
    recommendation: rec,
  };
}
