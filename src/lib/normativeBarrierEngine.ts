/**
 * Motor normativo por barrera: conecta el lienzo con NCRP 147 (diagnóstico) y NCRP 151
 * (teleterapia de megavoltaje). Devuelve null cuando la modalidad no está cubierta y el motor
 * anterior (punto-kernel) sigue aplicando.
 */
import type { Barrier, RadiationSource, ShieldingMaterial } from '@/types/radshield';
import {
  TABLA_4_5,
  TABLA_4_7,
  TABLA_B_1,
  TABLA_C_1,
  transmisionArcher,
  type Archer,
  type DistribucionNCRP147,
  type MaterialNCRP147,
} from '@/lib/ncrp147';
import {
  combinarDosFuentes,
  dispersion,
  energiaDesdeClave,
  fraccionDispersion,
  fuga,
  primaria,
  type Componente,
  type FuenteTeleterapia,
  type MaterialNCRP151,
} from '@/lib/ncrp151';
import { getShieldingEnergyKey } from '@/lib/shieldingMath';

/** Distribución de carga de NCRP 147 (TG9) por modalidad del catálogo. */
export const DISTRIBUCION_POR_MODALIDAD: Record<string, { primaria?: DistribucionNCRP147; secundaria: DistribucionNCRP147 }> = {
  'rad-chest': { primaria: 'chest_room', secundaria: 'chest_room' },
  'rad-abdomen': { primaria: 'rad_room_floor_other', secundaria: 'rad_room_all' },
  'rad-extremity': { primaria: 'rad_room_floor_other', secundaria: 'rad_room_all' },
  // Fluoroscopía y mastografía: el receptor intercepta el haz primario (NCRP 147 §4.1.6); sólo secundaria.
  'fluoro-routine': { secundaria: 'fluoro_tube_rf' },
  'fluoro-gi': { secundaria: 'fluoro_tube_rf' },
  'mammo-cc': { secundaria: 'mammography_room' },
  'mammo-mlo': { secundaria: 'mammography_room' },
};

/** Modalidades de teleterapia de megavoltaje cubiertas por NCRP 151 en el lienzo. */
export const LINAC = /^linac-/;

/** Materiales del catálogo que el motor NCRP 151 dimensiona (resto: motor punto-kernel). */
export const MATERIALES_NCRP151 = ['CONCRETE235', 'PB', 'STEEL', 'CONCRETEBARITE', 'CONCRETEIRON'] as const;

export interface PuntoMuestreo { x: number; y: number }

export interface ResultadoNormativo {
  metodo: 'NCRP147' | 'NCRP151';
  espesores_mm: Record<string, number>;
  kermaMax_mSv_semana: number;
  notas: string[];
}

function distancia(s: RadiationSource, p: PuntoMuestreo, escala: number): number {
  const dx = (p.x - s.x) * escala;
  const dy = (p.y - s.y) * escala;
  const dz = s.isocenterHeight_m || 0;
  return Math.max(0.3, Math.sqrt(dx * dx + dy * dy + dz * dz));
}

/** Material del catálogo → material de las tablas NCRP 147 (null si no está tabulado). */
export function material147(m: ShieldingMaterial): MaterialNCRP147 | null {
  if (m.code === 'PB') return 'lead';
  if (m.code === 'CONCRETE235') return 'concrete';
  if (m.code === 'GYPSUM') return 'gypsum';
  return null;
}

/** Material del catálogo → material NCRP 151; `escala` convierte espesor de concreto equivalente a espesor real. */
export function material151(m: ShieldingMaterial): { mat: MaterialNCRP151; escala: number } {
  if (m.code === 'PB') return { mat: 'lead', escala: 1 };
  if (m.code === 'STEEL') return { mat: 'steel', escala: 1 };
  // Concreto y materiales de baja Z: equivalencia másica con concreto de 2.35 g/cm³.
  return { mat: 'concrete', escala: 2.35 / (m.density || 2.35) };
}

/** Espesor x (mm) tal que Σ Kᵢ·Bᵢ(x) = P/T (bisección; cada fuente con su ajuste de Archer). */
function espesorMultiFuente(terminos: { K: number; ajuste: Archer }[], meta: number): number {
  const f = (x: number) => terminos.reduce((s, t) => s + t.K * transmisionArcher(x, t.ajuste), 0);
  if (f(0) <= meta) return 0;
  let lo = 0, hi = 1;
  while (f(hi) > meta && hi < 1e5) hi *= 2;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (f(mid) > meta) lo = mid; else hi = mid; }
  return hi;
}

export function calcularBarreraNormativa(
  barrera: Barrier,
  fuentes: RadiationSource[],
  puntos: PuntoMuestreo[],
  escala: number,
  materiales: ShieldingMaterial[],
): ResultadoNormativo | null {
  if (!fuentes.length || !puntos.length) return null;
  const T = barrera.occupancyFactor > 0 && barrera.occupancyFactor <= 1 ? barrera.occupancyFactor : 1;
  const P = barrera.designGoal_mSv_per_wk; // mGy ≈ mSv por semana (NCRP 147 usa kerma en aire)
  const esPrimaria = barrera.barrierType === 'primary';

  const diag = fuentes.filter((s) => DISTRIBUCION_POR_MODALIDAD[s.modality.id]);
  const tele = fuentes.filter((s) => LINAC.test(s.modality.id));
  if (diag.length && diag.length === fuentes.length) return diagnostico(diag, puntos, escala, materiales, P, T, esPrimaria, barrera);
  if (tele.length && tele.length === fuentes.length) return teleterapia(tele, puntos, escala, materiales, P, T, esPrimaria, barrera);
  return null;
}

function diagnostico(
  fuentes: RadiationSource[], puntos: PuntoMuestreo[], escala: number, materiales: ShieldingMaterial[],
  P: number, T: number, esPrimaria: boolean, barrera: Barrier,
): ResultadoNormativo {
  const notas: string[] = ['NCRP 147: Ec. 4.3/4.4, Tablas 4.5, 4.7, B.1 y C.1; sin acreditar preblindaje (conservador).'];
  const U = barrera.useFactor > 0 && barrera.useFactor <= 1 ? barrera.useFactor : 1;
  const espesores: Record<string, number> = {};
  let kermaMax = 0;
  for (const m of materiales) {
    const mat = material147(m);
    if (!mat) continue;
    let peor = 0;
    for (const p of puntos) {
      const terminos: { K: number; ajuste: Archer }[] = [];
      for (const s of fuentes) {
        const d = distancia(s, p, escala);
        const dist = DISTRIBUCION_POR_MODALIDAD[s.modality.id];
        const N = s.workloadValue;
        const k45 = dist.primaria ? TABLA_4_5[dist.primaria] : undefined;
        if (esPrimaria && dist.primaria && k45) {
          terminos.push({ K: (k45.K1P_mGy * U * N) / (d * d), ajuste: TABLA_B_1[dist.primaria][mat] });
        } else {
          // Fuga + dispersión 135° (columna mayor de la Tabla 4.7: conservador).
          terminos.push({ K: (TABLA_4_7[dist.secundaria].frontal * N) / (d * d), ajuste: TABLA_C_1[dist.secundaria][mat] });
        }
      }
      kermaMax = Math.max(kermaMax, terminos.reduce((a, t) => a + t.K, 0));
      peor = Math.max(peor, espesorMultiFuente(terminos, P / T));
    }
    if (peor > 0) espesores[m.code] = peor;
  }
  if (esPrimaria && fuentes.some((s) => !DISTRIBUCION_POR_MODALIDAD[s.modality.id].primaria)) {
    notas.push('Fluoroscopía/mastografía: el haz primario lo intercepta el receptor; se calcula como secundaria.');
  }
  return { metodo: 'NCRP147', espesores_mm: espesores, kermaMax_mSv_semana: kermaMax, notas };
}

function teleterapia(
  fuentes: RadiationSource[], puntos: PuntoMuestreo[], escala: number, materiales: ShieldingMaterial[],
  P_mSv: number, T: number, esPrimaria: boolean, barrera: Barrier,
): ResultadoNormativo {
  const P = P_mSv / 1000; // Sv/semana
  const U = barrera.useFactor > 0 && barrera.useFactor <= 1 ? barrera.useFactor : 0.25;
  const theta = barrera.scatterAngle_deg ?? 30;
  const notas: string[] = [
    esPrimaria
      ? 'NCRP 151: primaria (Ec. 2.1, 2.3; Tabla B.2).'
      : `NCRP 151: fuga (Ec. 2.8, Tabla B.7) + dispersión del paciente a ${theta}° (Ec. 2.7, Tablas B.4/B.5a), regla de dos fuentes.`,
  ];
  const fts: (FuenteTeleterapia | null)[] = fuentes.map((s) => {
    const e = energiaDesdeClave(getShieldingEnergyKey(s));
    if (!e) return null;
    return {
      energia: e,
      W_Gy_semana: s.workloadValue * (s.modality.doseRateConstant || 2),
      fraccionIMRT: s.imrtFraction ?? 0.5,
      factorIMRT: s.imrtFactor ?? 5,
    };
  });
  if (!esPrimaria && fuentes.some((s) => s.imrtFraction === undefined)) {
    notas.push('Fuga con IMRT por omisión: 50 % de la carga con C_I = 5 (valores del ejemplo §7.1.4).');
  }
  const espesores: Record<string, number> = {};
  let kermaMax = 0;
  for (const m of materiales) {
    if (!(MATERIALES_NCRP151 as readonly string[]).includes(m.code)) continue;
    const { mat, escala: esc } = material151(m);
    let peor = 0;
    for (const p of puntos) {
      const comps: Componente[] = [];
      fuentes.forEach((s, i) => {
        const f = fts[i];
        if (!f) return;
        const d = distancia(s, p, escala);
        if (esPrimaria) {
          comps.push(primaria(f, { P_Sv_semana: P, T, U, d_m: d, material: mat }));
          kermaMax = Math.max(kermaMax, (f.W_Gy_semana * U * 1000) / (d * d));
        } else {
          comps.push(fuga(f, { P_Sv_semana: P, T, dL_m: d, material: mat }));
          comps.push(dispersion(f, { P_Sv_semana: P, T, U, dsec_m: d, theta_deg: theta, material: mat }));
          const WL = f.W_Gy_semana * (1 - (f.fraccionIMRT ?? 0)) + (f.factorIMRT ?? 1) * (f.fraccionIMRT ?? 0) * f.W_Gy_semana;
          const a = fraccionDispersion(f.energia, theta);
          kermaMax = Math.max(kermaMax, ((1e-3 * WL + (a * f.W_Gy_semana * U * 1600) / 400) * 1000) / (d * d));
        }
      });
      peor = Math.max(peor, esPrimaria ? Math.max(0, ...comps.map((c) => c.espesor_cm)) : combinarDosFuentes(comps));
    }
    if (peor > 0) espesores[m.code] = peor * 10 * esc;
    if (esc !== 1) notas.push(`${m.code}: espesor por equivalencia másica con concreto (ρ = ${m.density} g/cm³).`);
  }
  return { metodo: 'NCRP151', espesores_mm: espesores, kermaMax_mSv_semana: kermaMax, notas };
}
