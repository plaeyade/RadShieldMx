/**
 * Fase 9 — referencia normativa para la integración Monte Carlo.
 *
 * La simulación «propia» del diálogo (`runMonteCarloSimulation`) usa números aleatorios y no tiene caso de validación,
 * así que se desactivó. Lo que sí se puede mostrar es la transmisión de banda ancha de NCRP 151 (Ec. 2.3, Tabla B.2,
 * primaria) para los espesores capturados: es la referencia contra la que debe compararse una corrida externa de
 * Geant4/MCNP/FLUKA hecha con el macro que exporta el diálogo.
 */
import { tvlPrimaria, transmisionTVL, type EnergiaMV, type MaterialNCRP151, type TvlPar } from './ncrp151';
import { energiaTabuladaMV } from './calculadorasNormativas';

/** Materiales de Geant4/MCNP que tienen TVL en NCRP 151 Tabla B.2 (concreto ordinario 2.35 g/cm³, acero, plomo). */
export const MATERIAL_MC_A_NCRP151: Record<string, MaterialNCRP151> = {
  G4_CONCRETE: 'concrete', concrete: 'concrete', G4_Pb: 'lead', lead: 'lead', G4_Fe: 'steel', 'G4_STAINLESS-STEEL': 'steel', steel: 'steel', iron: 'steel',
};

export interface ReferenciaNCRP151 {
  energia: EnergiaMV;
  material: MaterialNCRP151;
  tvl: TvlPar;
  filas: { t_cm: number; transmision: number }[];
}

/**
 * Transmisión primaria de NCRP 151 para fotones de `energia_MV` (Co-60 si 1.0–1.5 MeV; si no, la energía tabulada más
 * cercana por arriba entre 4 y 30 MV). Devuelve null si la partícula, la energía o el material no están tabulados.
 */
export function referenciaNCRP151(particula: string, energia_MV: number, material: string, espesores_cm: number[]): ReferenciaNCRP151 | null {
  const mat = MATERIAL_MC_A_NCRP151[material];
  if (particula !== 'photon' || !mat || !(energia_MV > 0)) return null;
  let energia: EnergiaMV;
  if (energia_MV >= 1 && energia_MV <= 1.5) energia = 'Co60';
  else if (energia_MV >= 4) energia = energiaTabuladaMV(energia_MV);
  else return null;
  const tvl = tvlPrimaria(energia, mat);
  const filas = espesores_cm.filter((t) => Number.isFinite(t) && t >= 0).map((t_cm) => ({ t_cm, transmision: transmisionTVL(t_cm, tvl) }));
  return { energia, material: mat, tvl, filas };
}
