/**
 * Bloques de alta densidad (HD) TM NIPOL — certificado ININ CE.CB.LSCD-589/TD/2024 (servicio LSCD-493/24,
 * 21-11-2024): TVL y HVL medidos con Co-60 (Picker C9) y con 6 y 18 MV (Varian Clinac iX) para bloques de
 * 13 × 13 × 26 cm de densidad nominal 3.5, 4.0 y 5.0 g/cm³.
 *
 * Política de diseño: la medición queda como evidencia, pero NO se usa como TVL de diseño mientras no pase
 * la validación de `docs/validacion-bloques-hd.md`. El TVL de diseño es el de concreto de NCRP 151 (Tabla B.2,
 * TVL₁ y TVLₑ) escalado por masa a la densidad nominal — conservador para mezclas con hierro en MV.
 */
import { TABLA_B_2 } from '@/lib/ncrp151';

export type EnergiaHD = 'Co60' | '6' | '18';
export type DensidadMedida = 3.5 | 4.0 | 5.0;

/** Tabla 4: μ' de haz amplio (cm⁻¹) ± SD. */
export const MU_AMPLIO: Record<DensidadMedida, Record<EnergiaHD, [number, number]>> = {
  3.5: { Co60: [0.1833, 0.002], '6': [0.134, 0.0022], '18': [0.1094, 0.0012] },
  4.0: { Co60: [0.1943, 0.001], '6': [0.1399, 0.0025], '18': [0.1129, 0.0015] },
  5.0: { Co60: [0.2253, 0.0026], '6': [0.1706, 0.0044], '18': [0.1437, 0.0026] },
};

/** Tabla 5: TVL y HVL determinados (cm) ± SD. */
export const TVL_INFORMADO: Record<DensidadMedida, Record<EnergiaHD, { tvl: number; hvl: number }>> = {
  3.5: { Co60: { tvl: 12.4, hvl: 3.63 }, '6': { tvl: 16.4, hvl: 4.41 }, '18': { tvl: 20.6, hvl: 5.84 } },
  4.0: { Co60: { tvl: 11.7, hvl: 3.41 }, '6': { tvl: 15.6, hvl: 4.13 }, '18': { tvl: 19.8, hvl: 5.55 } },
  5.0: { Co60: { tvl: 9.9, hvl: 2.79 }, '6': { tvl: 12.4, hvl: 2.92 }, '18': { tvl: 15.2, hvl: 4.04 } },
};

/** Tablas 1–3: densidad «radiológica» (μ medido / μ/ρ calculado de la composición), no gravimétrica. */
export const DENSIDAD_RADIOLOGICA: Record<DensidadMedida, number> = { 3.5: 4.8, 4.0: 5.97, 5.0: 5.8 };

/** Tablas A.2: fracciones en masa por fluorescencia de rayos X (sin O ni H). */
export const COMPOSICION_XRF: Record<DensidadMedida, Record<string, number>> = {
  3.5: { Fe: 43.5, Ca: 22.1, Ba: 13.3, Si: 11.9, S: 4.3, Al: 3.0 },
  4.0: { Fe: 65.5, Ca: 18.7, Si: 7.4, Al: 3.3, S: 2.2, Mg: 1.1, Mn: 0.8 },
  5.0: { Fe: 62.96, Ca: 22.82, Si: 8.16, Al: 2.29, S: 1.07, Mn: 0.95, Mg: 0.68, K: 0.35 },
};

/** Incertidumbre expandida (k = 2) informada para μ', TVL y HVL (§4.4.3). */
export const U_EXPANDIDA_TVL = 0.25;

const RHO_CONCRETO = 2.35;
const RHO_ACERO = 7.87;

/** TVL de diseño (cm): concreto NCRP 151 escalado por masa a la densidad nominal. */
export function tvlDisenoHD(densidad: number, energia: EnergiaHD | '10' | '15' | '25'): { tvl1_cm: number; tvle_cm: number } {
  if (!(densidad > 0)) throw new Error('Densidad inválida');
  const c = TABLA_B_2.concrete[energia];
  const f = RHO_CONCRETO / densidad;
  return { tvl1_cm: +(c.tvl1_cm * f).toFixed(1), tvle_cm: +(c.tvle_cm * f).toFixed(1) };
}

/** Cota física: una mezcla cuyo elemento más pesado relevante es Fe no atenúa por masa mejor que el acero. */
export function tvlCotaAcero(densidad: number, energia: EnergiaHD): number {
  return +((TABLA_B_2.steel[energia].tvle_cm * RHO_ACERO) / densidad).toFixed(1);
}

export interface Hallazgo { nivel: 'bloquea' | 'advierte'; texto: string }

/** Revisión del certificado: lo que impide adoptar los TVL medidos como valores de diseño. */
export function revisarCertificado(): Hallazgo[] {
  const h: Hallazgo[] = [];
  for (const d of [3.5, 4.0, 5.0] as DensidadMedida[]) {
    for (const e of ['Co60', '6', '18'] as EnergiaHD[]) {
      const desdeMu = Math.LN10 / MU_AMPLIO[d][e][0];
      const inf = TVL_INFORMADO[d][e].tvl;
      if (Math.abs(desdeMu - inf) / inf > 0.04) {
        h.push({ nivel: 'advierte', texto: `${d} g/cm³, ${e === 'Co60' ? 'Co-60' : `${e} MV`}: la Tabla 5 da ${inf} cm, pero ln10/μ' de la Tabla 4 da ${desdeMu.toFixed(1)} cm.` });
      }
      if (d === 5.0 || d === 4.0) {
        const cota = tvlCotaAcero(d, e);
        if (inf < cota) {
          const rhoImplicita = (TABLA_B_2.steel[e].tvle_cm * RHO_ACERO) / inf;
          h.push({ nivel: 'bloquea', texto: `${d} g/cm³, ${e === 'Co60' ? 'Co-60' : `${e} MV`}: TVL ${inf} cm es menor que el del acero a igual masa (${cota} cm); exigiría ρ ≥ ${rhoImplicita.toFixed(2)} g/cm³. Geometría de medición no de haz amplio o densidad mal asignada.` });
        }
      }
    }
  }
  if (DENSIDAD_RADIOLOGICA[5.0] < DENSIDAD_RADIOLOGICA[4.0]) {
    h.push({ nivel: 'bloquea', texto: 'Densidad radiológica de los bloques nominales 5.0 (5.80) menor que la de los 4.0 (5.97): falta la densidad gravimétrica (masa/volumen) de cada bloque.' });
  }
  h.push({ nivel: 'bloquea', texto: 'Espesores medidos ≤ 40 cm (≈ 2.5–3 TVL) con campo de 5 × 5 cm en isocentro: no se obtiene TVLₑ de equilibrio ni la dispersión de haz amplio que exige NCRP 151.' });
  h.push({ nivel: 'advierte', texto: 'La composición XRF no informa O ni H: no permite evaluar fotoneutrones (≥ 10 MV) ni el TVL de neutrones del muro y la puerta.' });
  h.push({ nivel: 'advierte', texto: `Incertidumbre expandida informada de ±${U_EXPANDIDA_TVL * 100} % (k = 2) en TVL; NCRP 151 diseña con el TVL de equilibrio sin restar incertidumbre.` });
  h.push({ nivel: 'bloquea', texto: 'No hay medición para 5.5 g/cm³: el certificado cubre 3.5, 4.0 y 5.0; extrapolar no es válido sin medición.' });
  return h;
}

/** Densidades ofrecidas en el catálogo (5.5 es la recomendada para linac, pendiente de medición). */
export const DENSIDADES_CATALOGO = [3.5, 4.0, 5.0, 5.5] as const;
