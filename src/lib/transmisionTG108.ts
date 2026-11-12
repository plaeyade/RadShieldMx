/**
 * AAPM TG-108 (Madsen et al., Med. Phys. 33(1):4–15, 2006): transmisión de banda ancha de la radiación de
 * aniquilación de 511 keV en plomo, concreto (2.35 g/cm³) y hierro/acero.
 *
 * TG-108 ajusta sus resultados Monte Carlo (Tabla IV) al modelo de Archer et al. (ref. 10 del informe):
 *
 *   B(x) = [(1 + β/α)·e^(αγx) − β/α]^(−1/γ)
 *
 * con los parámetros de la **Tabla V** («Fitting parameter for broad beam 511 keV transmission data»):
 *
 *   | material | α (cm⁻¹) | β (cm⁻¹) | γ      |
 *   | plomo    | 1.543    | −0.4408  | 2.136  |
 *   | concreto | 0.1539   | −0.1161  | 2.0752 |
 *   | hierro   | 0.5704   | −0.3063  | 0.6326 |
 *
 * (El texto impreso de TG-108 escribe el exponente como 1/γ; el signo correcto es −1/γ, el de su propia inversa
 * x = (1/αγ)·ln{[B^−γ + β/α]/[1 + β/α]} y el que reproduce la Tabla IV, p. ej. plomo 10 mm → 0.2485.)
 *
 * Fase 11, etapa 8: sustituye al TVL único de 511 keV del catálogo (176 mm de concreto, 16.6 mm de plomo) en la sala
 * de captación PET. Un TVL único es la pendiente de equilibrio de la curva; con atenuaciones pequeñas (B ≈ 0.4) la curva
 * de haz ancho, con su «hombro» de acumulación, pide ≈ 3 cm más de concreto. El espesor se resuelve por **inversión
 * numérica** de B(x) (bisección sobre la función monótona), sin depender de la forma cerrada.
 *
 * Materiales del catálogo sin ajuste propio: equivalencia másica con el concreto (x = x_concreto · 2.35/ρ). A 511 keV
 * domina la dispersión Compton y μ/ρ apenas varía con Z en materiales ligeros; para materiales con Z alto (concretos
 * baritados o con hierro, vidrio plomado) la equivalencia con concreto sobrestima el espesor: conservador.
 */
import type { ShieldingMaterial } from '@/types/radshield';
import { interiorArcher } from './ncrp147';

export interface AjusteArcher { alpha: number; beta: number; gamma: number }
export type MaterialTG108 = 'lead' | 'concrete' | 'iron';

/** TG-108 Tabla V: ajuste de Archer de la transmisión de banda ancha a 511 keV (α, β en cm⁻¹). */
export const TG108_TABLA_V: Record<MaterialTG108, AjusteArcher> = {
  lead: { alpha: 1.543, beta: -0.4408, gamma: 2.136 },
  concrete: { alpha: 0.1539, beta: -0.1161, gamma: 2.0752 },
  iron: { alpha: 0.5704, beta: -0.3063, gamma: 0.6326 },
};

export const REFERENCIA_TG108_511 = 'AAPM TG-108 (Madsen et al. 2006), Tabla V: ajuste de Archer de la transmisión de banda ancha a 511 keV';

/** B(x) de TG-108 a 511 keV; x en mm. */
export function transmisionTG108(material: MaterialTG108, x_mm: number): number {
  if (!(x_mm > 0)) return 1;
  const p = TG108_TABLA_V[material];
  // α, β en cm⁻¹: x en cm. Núcleo de Archer único (`ncrp147.interiorArcher`, etapa 6).
  return Math.pow(interiorArcher(x_mm / 10, p), -1 / p.gamma);
}

/**
 * Espesor (mm) con B(x) = B por inversión numérica: B(x) decrece de forma monótona, así que se acota [0, x_max]
 * duplicando x_max y se biseca hasta 1e-9 mm. B ≥ 1 → 0; B ≤ 0 → Infinity.
 */
export function espesorTG108(material: MaterialTG108, B: number): number {
  if (B >= 1) return 0;
  if (!(B > 0)) return Infinity;
  let lo = 0;
  let hi = 10;
  while (transmisionTG108(material, hi) > B) {
    hi *= 2;
    if (hi > 1e7) return Infinity;
  }
  for (let i = 0; i < 200 && hi - lo > 1e-9; i++) {
    const mid = (lo + hi) / 2;
    if (transmisionTG108(material, mid) > B) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Ajuste de TG-108 para un material del catálogo: plomo y acero directos; el resto, concreto equivalente por densidad. */
export function ajusteTG108Catalogo(m: Pick<ShieldingMaterial, 'code' | 'density'>): { material: MaterialTG108; escala: number } {
  if (m.code === 'PB') return { material: 'lead', escala: 1 };
  if (m.code === 'STEEL') return { material: 'iron', escala: 1 };
  return { material: 'concrete', escala: 2.35 / (m.density || 2.35) };
}

/**
 * Espesor (mm) de un material del catálogo para que el kerma semanal K (sin blindaje) quede en P_efectiva = P/T,
 * con B = P_efectiva/K y la curva de TG-108 a 511 keV. Mismas unidades en K y P.
 */
export function espesorPET511(K: number, P_efectiva: number, m: Pick<ShieldingMaterial, 'code' | 'density'>): number {
  if (!(K > P_efectiva)) return 0;
  const { material, escala } = ajusteTG108Catalogo(m);
  return espesorTG108(material, P_efectiva / K) * escala;
}
