// Fase 9: Calculo de blindaje de suelo y techo (NCRP 151 §5.2.3)
// Para areas ocupadas arriba/abajo del vault de radioterapia
import { barreraMV, energiaTabuladaMV, fraccionDispersion } from '@/lib/calculadorasNormativas';
import { SAD_M } from '@/lib/doseFieldEngine';
import { tvlPrimaria } from '@/lib/ncrp151';
import { distanciasTechoPiso_m, type NivelesEdificio } from '@/lib/nivelesEdificio';

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
  /**
   * Distancias desde los niveles del edificio (nivelesEdificio.ts): si existe, sustituye a distanceToAbove_m /
   * distanceToBelow_m. Niveles arriba de planta baja de 5 m de piso a contrapiso por omisión; punto 0.5 m sobre el
   * piso de arriba y 1.7 m sobre el de abajo.
   */
  niveles?: {
    edificio: NivelesEdificio;
    nivelSala: number;          // 0 = planta baja
    nivelArriba?: number;       // por omisión nivelSala + 1
    nivelAbajo?: number;        // por omisión nivelSala − 1
    alturaPuntoArriba_m?: number;
    alturaPuntoAbajo_m?: number;
  };
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
  // Distancias isocentro → punto usadas y de dónde salen
  distanceToAbove_m: number;
  distanceToBelow_m: number;
  distanciasDe: 'niveles' | 'captura';
}

/**
 * Fase 8a: antes H₀ = W·1000 se rotulaba μSv cuando es mGy (W en Gy), así que el kerma quedaba 1000× bajo
 * (≈ 3 TVL de menos), y el techo se calculaba sólo con una «fracción de dispersión» sin referencia. Con un gantry que
 * rota, techo y piso son barreras PRIMARIAS (NCRP 151 §5.2/§7.1): se calcula con `barreraMV` la primaria a
 * d = d_iso + 1 m (blanco → punto, SAD = 1 m) y la secundaria (fuga + dispersión) a d_iso, y se adopta la mayor.
 */
function barreraLosa(config: FloorCeilingConfig, d_iso_m: number, P: number, T: number): { kerma: number; requerido_mm: number } {
  const energia = energiaTabuladaMV(config.energy_MeV);
  const base = { material: 'concrete' as const, P_mSv_semana: P, T: Math.min(1, T), U: config.useFactor };
  const pri = barreraMV({ ...base, tipo: 'primaria', haces: [{ energia, W_Gy_semana: config.workload_Gy_week }], d_m: d_iso_m + SAD_M });
  const sec = barreraMV({ ...base, tipo: 'secundaria', haces: [{ energia, W_Gy_semana: config.workload_Gy_week }], d_m: d_iso_m });
  return { kerma: pri.K_sin_blindaje_mSv_semana, requerido_mm: 10 * Math.max(pri.espesor_cm, sec.espesor_cm) };
}

/** Distancias isocentro → punto arriba y abajo: de los niveles del edificio si se dan; si no, las capturadas. */
export function distanciasLosas(config: FloorCeilingConfig): { arriba_m: number; abajo_m: number; de: 'niveles' | 'captura' } {
  const n = config.niveles;
  if (!n) return { arriba_m: config.distanceToAbove_m, abajo_m: config.distanceToBelow_m, de: 'captura' };
  const d = distanciasTechoPiso_m(n.nivelSala, config.isocenterHeight_m, n.edificio, n);
  return { ...d, de: 'niveles' };
}

export function calculateFloorCeiling(config: FloorCeilingConfig): FloorCeilingResult {
  const dist = distanciasLosas(config);
  const scatterAngle_deg = Math.atan2(config.roomHeight_m - config.isocenterHeight_m, 3.0) * 180 / Math.PI;
  const scatterFrac = fraccionDispersion(energiaTabuladaMV(config.energy_MeV), Math.max(10, scatterAngle_deg));

  // === CEILING (techo) ===
  let ceilingKerma = 0, ceilingRequired_mm = 0, ceilingExtra_mm = 0, ceilingOK = true;
  if (config.areaAboveOccupied) {
    const r = barreraLosa(config, dist.arriba_m, config.designGoalAbove_mSv_week, config.occupancyAbove);
    ceilingKerma = r.kerma; ceilingRequired_mm = r.requerido_mm;
    ceilingExtra_mm = Math.max(0, ceilingRequired_mm - config.ceilingThickness_m * 1000);
    ceilingOK = ceilingExtra_mm <= 0;
  }

  // === FLOOR (suelo) ===
  let floorKerma = 0, floorRequired_mm = 0, floorExtra_mm = 0, floorOK = true;
  if (config.areaBelowOccupied) {
    const r = barreraLosa(config, dist.abajo_m, config.designGoalBelow_mSv_week, config.occupancyBelow);
    floorKerma = r.kerma; floorRequired_mm = r.requerido_mm;
    floorExtra_mm = Math.max(0, floorRequired_mm - config.floorThickness_m * 1000);
    floorOK = floorExtra_mm <= 0;
  }

  // Recommendations
  let rec = '';
  if (!ceilingOK && !floorOK) rec = `Aumentar techo en ${ceilingExtra_mm.toFixed(0)} mm y suelo en ${floorExtra_mm.toFixed(0)} mm de concreto. Considerar plomo laminado sobre techo.`;
  else if (!ceilingOK) rec = `Aumentar techo en ${ceilingExtra_mm.toFixed(0)} mm de concreto o agregar ${(ceilingExtra_mm * tvlPrimaria(energiaTabuladaMV(config.energy_MeV), 'lead').tvle_cm / tvlPrimaria(energiaTabuladaMV(config.energy_MeV), 'concrete').tvle_cm).toFixed(1)} mm de plomo (equivalencia por TVLₑ, NCRP 151 Tabla B.2) sobre techo.`;
  else if (!floorOK) rec = `Aumentar suelo en ${floorExtra_mm.toFixed(0)} mm de concreto en areas ocupadas debajo.`;
  else rec = 'El blindaje de suelo y techo cumple con los objetivos de diseno. No se requieren modificaciones.';

  return {
    ceilingKerma_unshielded_mSv_week: ceilingKerma,
    ceilingRequiredThickness_mm: ceilingRequired_mm,
    ceilingCompliant: ceilingOK,
    ceilingExtraNeeded_mm: ceilingExtra_mm,
    floorKerma_unshielded_mSv_week: floorKerma,
    floorRequiredThickness_mm: floorRequired_mm,
    floorCompliant: floorOK,
    floorExtraNeeded_mm: floorExtra_mm,
    scatterAngle_deg: scatterAngle_deg,
    scatterFraction: scatterFrac,
    recommendation: rec,
    distanceToAbove_m: dist.arriba_m,
    distanceToBelow_m: dist.abajo_m,
    distanciasDe: dist.de,
  };
}
