/**
 * Fase 8a — malla de dosis de medicina nuclear (NuclearDoseGrid).
 *
 * Antes: Γ (en μSv·m²/(MBq·h)) multiplicado por la actividad en GBq rotulado «μSv/h» (1000× bajo) y atenuación
 * «espesor_mm/10 TVL» o un número de TVL fijo por barrera. Ahora: H = Γ·A[MBq]/d² (μSv/h) y, para emisores de
 * 511 keV (F-18, Ga-68), la transmisión de banda ancha de AAPM TG-108 Tabla V (`transmisionPET`) en plomo, concreto o
 * hierro. Para los demás nucleidos no hay aquí datos de banda ancha validados: la barrera NO se acredita (conservador)
 * y `sinDatosBandaAncha` lo indica.
 */
import { transmisionPET, type MaterialPET } from './calculadorasNormativas';
import { NUCLIDOS_PET } from './tg108';

export interface RadionuclidoMalla {
  name: string;
  halfLife_h: number;
  /** Constante de tasa de kerma Γ (μSv·m²/(MBq·h)). PET: TG-108 Tabla 1. */
  gammaConstant_uSv_m2_per_MBq_h: number;
  betaPlus_frac: number;
  avgBetaPlusEnergy_MeV: number;
  gammaKeV: number[];
  gammaIntensity: number[];
  /** Emisor de aniquilación (se atenúa con TG-108 Tabla V). */
  pet511: boolean;
}

export const RADIONUCLIDOS_MALLA: Record<string, RadionuclidoMalla> = {
  'F-18': { name: 'Flúor-18', halfLife_h: 1.83, gammaConstant_uSv_m2_per_MBq_h: NUCLIDOS_PET.F18.gamma, betaPlus_frac: 0.967, avgBetaPlusEnergy_MeV: 0.250, gammaKeV: [511], gammaIntensity: [1.939], pet511: true },
  'Ga-68': { name: 'Galio-68', halfLife_h: 1.13, gammaConstant_uSv_m2_per_MBq_h: NUCLIDOS_PET.Ga68.gamma, betaPlus_frac: 0.891, avgBetaPlusEnergy_MeV: 0.836, gammaKeV: [511, 1077], gammaIntensity: [1.782, 0.032], pet511: true },
  'Tc-99m': { name: 'Tecnecio-99m', halfLife_h: 6.01, gammaConstant_uSv_m2_per_MBq_h: 0.0303, betaPlus_frac: 0, avgBetaPlusEnergy_MeV: 0, gammaKeV: [140], gammaIntensity: [0.885], pet511: false },
  'I-131': { name: 'Yodo-131', halfLife_h: 193.5, gammaConstant_uSv_m2_per_MBq_h: 0.0595, betaPlus_frac: 0, avgBetaPlusEnergy_MeV: 0, gammaKeV: [364, 637], gammaIntensity: [0.812, 0.071], pet511: false },
  'Y-90': { name: 'Itrio-90', halfLife_h: 64.0, gammaConstant_uSv_m2_per_MBq_h: 0.0045, betaPlus_frac: 0, avgBetaPlusEnergy_MeV: 0, gammaKeV: [], gammaIntensity: [], pet511: false },
  'Lu-177': { name: 'Lutecio-177', halfLife_h: 161.1, gammaConstant_uSv_m2_per_MBq_h: 0.0056, betaPlus_frac: 0, avgBetaPlusEnergy_MeV: 0, gammaKeV: [113, 208], gammaIntensity: [0.064, 0.105], pet511: false },
};

export interface ShieldingBarrier {
  name: string;
  /** 'Pb' | 'concrete' | 'iron' (o 'lead', 'concreto', 'hierro', 'acero'). */
  material: string;
  thickness_mm: number;
  position_x?: number;
}

export interface FuenteMalla { x: number; y: number; activity_GBq: number; nuclide: string; useTime_h: number }

export function materialPET(m: string): MaterialPET | null {
  const v = m.toLowerCase();
  if (v === 'pb' || v.includes('lead') || v.includes('plomo')) return 'lead';
  if (v.includes('concr')) return 'concrete';
  if (v.includes('iron') || v.includes('hierro') || v.includes('steel') || v.includes('acero') || v === 'fe') return 'iron';
  return null;
}

/** Tasa (μSv/h) y dosis acumulada (μSv) en (px, py), barreras planas en x = position_x. */
export function calculateDoseAtPoint(px: number, py: number, sources: FuenteMalla[], barriers: ShieldingBarrier[]): {
  doseRate: number; cumulative: number; sinDatosBandaAncha: boolean;
} {
  let totalDoseRate = 0, cumulative = 0, sinDatos = false;
  for (const src of sources) {
    const nuc = RADIONUCLIDOS_MALLA[src.nuclide];
    if (!nuc) continue;
    const d = Math.hypot(px - src.x, py - src.y);
    if (d < 0.1) continue;
    let rate = (nuc.gammaConstant_uSv_m2_per_MBq_h * src.activity_GBq * 1000) / (d * d);
    for (const b of barriers) {
      if (b.position_x === undefined || !(px > b.position_x && src.x < b.position_x)) continue;
      const mat = materialPET(b.material);
      if (nuc.pet511 && mat) rate *= transmisionPET(mat, b.thickness_mm);
      else sinDatos = true;
    }
    totalDoseRate += rate;
    cumulative += rate * src.useTime_h;
  }
  return { doseRate: totalDoseRate, cumulative, sinDatosBandaAncha: sinDatos };
}
