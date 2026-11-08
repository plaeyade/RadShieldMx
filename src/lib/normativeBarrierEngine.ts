/**
 * Motor normativo por barrera: conecta el lienzo con NCRP 147 (diagnóstico) y NCRP 151
 * (teleterapia de megavoltaje). Devuelve null cuando la modalidad no está cubierta y el motor
 * anterior (punto-kernel) sigue aplicando.
 */
import type { Barrier, RadiationSource, ShieldingMaterial } from '@/types/radshield';
import {
  K1_SEC_MASTOGRAFIA_ISOCENTRO_mGy,
  TABLA_4_5,
  TABLA_4_7,
  TABLA_B_1,
  TABLA_C_1,
  transmisionArcher,
  transmisionTC,
  type Archer,
  type DistribucionNCRP147,
  type MaterialNCRP147,
} from '@/lib/ncrp147';
import {
  combinarPorTipo,
  dispersion,
  energiaDesdeClave,
  espesorSumaDirecta,
  fuga,
  kermaDispersion,
  kermaFuga,
  kermaPrimaria,
  primaria,
  transmisionTVL,
  transmisionUnTVL,
  tvlDispersion,
  tvlFuga,
  tvlPrimaria,
  type Componente,
  type TerminoDirecto,
  type EnergiaMV,
  type FuenteTeleterapia,
  type MaterialNCRP151,
} from '@/lib/ncrp151';
import { calculateUnshieldedKerma, getShieldingEnergyKey } from '@/lib/shieldingMath';
import type { CTIsodosisProfile } from '@/types/ctIsodosis';

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
  // Angiografía (NCRP 147 §5.1, Tabla 4.7): el intensificador intercepta la primaria; sólo secundaria.
  // El catálogo de modalidades aún no las expone; el motor las acepta con estos ids.
  'angio-cardiac': { secundaria: 'cardiac_angiography' },
  'angio-peripheral': { secundaria: 'peripheral_angiography' },
};

/** Modalidades de TC (NCRP 147 §5.6): κ·DLP (`calculateCTKerma`) y transmisión de las Figs. A.2/A.3. */
export const TC = /^ct-(head|body)$/;

/** kVp de las curvas de TC: 120 o 140 si la etiqueta lo fija; si no (p. ej. «120-140 kVp»), ambas (conservador). */
export function kvpTC(s: RadiationSource): 120 | 140 | undefined {
  const l = s.modality.energyLabel ?? '';
  const t120 = /120/.test(l), t140 = /140/.test(l);
  if (t120 && !t140) return 120;
  if (t140 && !t120) return 140;
  return undefined;
}

/**
 * Columna de la Tabla 4.7 según el ángulo de dispersión de la barrera: 90° («lateral», fuga + side-scatter)
 * si 60° ≤ θ ≤ 120°; si no (o sin ángulo), 135° («frontal», fuga + forward/backscatter), que la nota a de la
 * Tabla 4.7 usa también para la dispersión hacia adelante: conservador.
 */
export function geometria147(theta_deg?: number): 'lateral' | 'frontal' {
  return typeof theta_deg === 'number' && theta_deg >= 60 && theta_deg <= 120 ? 'lateral' : 'frontal';
}

/**
 * Modalidades de teleterapia de megavoltaje cubiertas por NCRP 151 en el lienzo: aceleradores
 * (`linac-*`) y unidades de Co-60 de teleterapia (`tele-co60*`; Gamma Knife queda fuera: es autoblindado).
 */
export const LINAC = /^(linac-|tele-co60)/;

/** Materiales del catálogo que el motor NCRP 151 dimensiona (resto: motor punto-kernel). */
export const MATERIALES_NCRP151 = ['CONCRETE235', 'PB', 'STEEL', 'CONCRETEBARITE', 'CONCRETEIRON'] as const;

export interface PuntoMuestreo { x: number; y: number }

export interface ResultadoNormativo {
  metodo: 'NCRP147' | 'NCRP151';
  espesores_mm: Record<string, number>;
  kermaMax_mSv_semana: number;
  notas: string[];
}

/** Distancia fuente → punto (m), con la altura del isocentro y un mínimo de 0.3 m. */
export function distancia(s: RadiationSource, p: PuntoMuestreo, escala: number): number {
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

/**
 * Kerma sin blindaje NCRP 147 de una fuente diagnóstica a d (m), mGy/semana: primaria K¹_P·U·N/d²
 * (Tabla 4.5, ajuste B.1) si se pide y la distribución la tabula; si no, secundaria K¹_sec·N/d²
 * (Tabla 4.7, ajuste C.1) con la columna de `geometria` (por omisión 135°, fuga + dispersión frontal/retro,
 * la mayor: conservador). Mastografía: 3.6×10⁻² mGy/paciente a 1 m del isocentro (Tabla 4.7 nota f, §5.5).
 */
export function terminoNCRP147(
  s: RadiationSource, d_m: number, primariaSiAplica: boolean, U: number, geometria: 'lateral' | 'frontal' = 'frontal',
): { tipo: 'primaria' | 'secundaria'; K: number; ajustes: Record<MaterialNCRP147, Archer> } | null {
  const dist = DISTRIBUCION_POR_MODALIDAD[s.modality.id];
  if (!dist) return null;
  const N = s.workloadValue;
  const k45 = dist.primaria ? TABLA_4_5[dist.primaria] : undefined;
  if (primariaSiAplica && dist.primaria && k45) {
    return { tipo: 'primaria', K: (k45.K1P_mGy * U * N) / (d_m * d_m), ajustes: TABLA_B_1[dist.primaria] };
  }
  const k1 = dist.secundaria === 'mammography_room' ? K1_SEC_MASTOGRAFIA_ISOCENTRO_mGy : TABLA_4_7[dist.secundaria][geometria];
  return { tipo: 'secundaria', K: (k1 * N) / (d_m * d_m), ajustes: TABLA_C_1[dist.secundaria] };
}

/** Espesor x (mm) tal que Σ Kᵢ·Bᵢ(x) = P/T (bisección; cada fuente con su transmisión). */
export function espesorMultiFuente(terminos: { K: number; ajuste?: Archer; B?: (x_mm: number) => number }[], meta: number): number {
  const f = (x: number) => terminos.reduce((s, t) => s + t.K * (t.B ? t.B(x) : transmisionArcher(x, t.ajuste!)), 0);
  if (f(0) <= meta) return 0;
  let lo = 0, hi = 1;
  while (f(hi) > meta && hi < 1e5) hi *= 2;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (f(mid) > meta) lo = mid; else hi = mid; }
  return hi;
}

/** Energía NCRP 151 de una fuente de teleterapia (clave «18MV»/«Co60», o etiqueta «Co-60»). */
export function energiaTeleterapia(s: RadiationSource): EnergiaMV | null {
  return energiaDesdeClave(getShieldingEnergyKey(s)) ?? (/co-?60/i.test(s.modality.energyLabel ?? '') ? 'Co60' : null);
}

/**
 * Fuente NCRP 151 de una fuente del lienzo: W = fracciones/semana × Gy/fracción en el isocentro;
 * IMRT por omisión 50 % con C_I = 5 (ejemplo §7.1.4). null si no es teleterapia o sin energía tabulada.
 */
export function fuenteTeleterapiaDe(s: RadiationSource): FuenteTeleterapia | null {
  if (!LINAC.test(s.modality.id)) return null;
  const e = energiaTeleterapia(s);
  if (!e) return null;
  return {
    energia: e,
    W_Gy_semana: s.workloadValue * (s.modality.doseRateConstant || 2),
    fraccionIMRT: s.imrtFraction ?? 0.5,
    factorIMRT: s.imrtFactor ?? 5,
  };
}

export function calcularBarreraNormativa(
  barrera: Barrier,
  fuentes: RadiationSource[],
  puntos: PuntoMuestreo[],
  escala: number,
  materiales: ShieldingMaterial[],
  ctIsodosisProfile?: CTIsodosisProfile,
): ResultadoNormativo | null {
  if (!fuentes.length || !puntos.length) return null;
  const T = barrera.occupancyFactor > 0 && barrera.occupancyFactor <= 1 ? barrera.occupancyFactor : 1;
  const P = barrera.designGoal_mSv_per_wk; // mGy ≈ mSv por semana (NCRP 147 usa kerma en aire)
  const esPrimaria = barrera.barrierType === 'primary';

  const diag = fuentes.filter((s) => DISTRIBUCION_POR_MODALIDAD[s.modality.id]);
  const tele = fuentes.filter((s) => LINAC.test(s.modality.id));
  if (diag.length && diag.length === fuentes.length) return diagnostico(diag, puntos, escala, materiales, P, T, esPrimaria, barrera);
  if (tele.length && tele.length === fuentes.length) return teleterapia(tele, puntos, escala, materiales, P, T, esPrimaria, barrera);
  if (fuentes.every((s) => TC.test(s.modality.id))) return tomografia(fuentes, puntos, escala, materiales, P, T, ctIsodosisProfile);
  return null;
}

/**
 * TC (NCRP 147 §5.6): K = Σ κ·DLP·N/d² (`calculateUnshieldedKerma`, Ec. 5.10) y transmisión de las Figs. A.2/A.3
 * (plomo y concreto; no hay curva de TC para otros materiales). Antes el espesor de TC salía de los parámetros
 * de Archer genéricos del material, no de la secundaria de TC.
 */
function tomografia(
  fuentes: RadiationSource[], puntos: PuntoMuestreo[], escala: number, materiales: ShieldingMaterial[],
  P: number, T: number, perfil?: CTIsodosisProfile,
): ResultadoNormativo {
  const notas = ['NCRP 147 §5.6: κ·DLP (Ec. 5.10) y secundaria de TC de las Figs. A.2/A.3 (Simpkin, 1991).'];
  const espesores: Record<string, number> = {};
  let kermaMax = 0;
  for (const m of materiales) {
    const mat = material147(m);
    if (mat !== 'lead' && mat !== 'concrete') continue;
    let peor = 0;
    for (const p of puntos) {
      const terminos = fuentes.map((s) => {
        const kvp = kvpTC(s);
        return { K: calculateUnshieldedKerma(s, p.x, p.y, escala, perfil), B: (x: number) => transmisionTC(x, mat, kvp) };
      });
      kermaMax = Math.max(kermaMax, terminos.reduce((a, t) => a + t.K, 0));
      peor = Math.max(peor, espesorMultiFuente(terminos, P / T));
    }
    if (peor > 0) espesores[m.code] = peor;
  }
  if (fuentes.some((s) => !kvpTC(s))) notas.push('kVp no definido (120–140): se toma la mayor transmisión de las curvas de 120 y 140 kVp.');
  return { metodo: 'NCRP147', espesores_mm: espesores, kermaMax_mSv_semana: kermaMax, notas };
}

function diagnostico(
  fuentes: RadiationSource[], puntos: PuntoMuestreo[], escala: number, materiales: ShieldingMaterial[],
  P: number, T: number, esPrimaria: boolean, barrera: Barrier,
): ResultadoNormativo {
  const notas: string[] = [
    'NCRP 147: Ec. 4.3/4.4, Tablas 4.5, 4.7, B.1 y C.1; sin acreditar preblindaje (conservador).',
    `Secundaria: columna de ${geometria147(barrera.scatterAngle_deg) === 'lateral' ? '90°' : '135°'} de la Tabla 4.7.`,
  ];
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
        const t = terminoNCRP147(s, distancia(s, p, escala), esPrimaria, U, geometria147(barrera.scatterAngle_deg));
        if (t) terminos.push({ K: t.K, ajuste: t.ajustes[mat] });
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
      : `NCRP 151: fuga (Ec. 2.8, Tabla B.7) + dispersión del paciente a ${theta}° (Ec. 2.7, Tablas B.4/B.5a), regla de dos fuentes por tipo (§7.1.5).`,
  ];
  const fts = fuentes.map(fuenteTeleterapiaDe);
  if (!esPrimaria && fuentes.some((s) => s.imrtFraction === undefined)) {
    notas.push('Fuga con IMRT por omisión: 50 % de la carga con C_I = 5 (valores del ejemplo §7.1.4).');
  }
  const espesores: Record<string, number> = {};
  let kermaMax = 0;
  for (const m of materiales) {
    if (!(MATERIALES_NCRP151 as readonly string[]).includes(m.code)) continue;
    const { mat, escala: esc } = material151(m);
    let peor = 0;
    let porSumaDirecta = false;
    for (const p of puntos) {
      const comps: Componente[] = [];
      const porTipo: Record<'fuga' | 'dispersion', Componente[]> = { fuga: [], dispersion: [] };
      const directos: TerminoDirecto[] = [];
      let kPunto = 0;
      fuentes.forEach((s, i) => {
        const f = fts[i];
        if (!f) return;
        const d = distancia(s, p, escala);
        if (esPrimaria) {
          comps.push(primaria(f, { P_Sv_semana: P, T, U, d_m: d, material: mat }));
          const tvl = tvlPrimaria(f.energia, mat);
          directos.push({ K_Sv_semana: kermaPrimaria(f, U, d), transmision: (t) => transmisionTVL(t, tvl) });
        } else {
          const g = { U, dsec_m: d, theta_deg: theta };
          const cf = fuga(f, { P_Sv_semana: P, T, dL_m: d, material: mat });
          const cd = dispersion(f, { P_Sv_semana: P, T, ...g, material: mat });
          comps.push(cf, cd);
          porTipo.fuga.push(cf);
          porTipo.dispersion.push(cd);
          const tvlL = tvlFuga(f.energia, mat);
          const tvlS = tvlDispersion(f.energia, mat, theta);
          directos.push(
            { K_Sv_semana: kermaFuga(f, d), transmision: (t) => transmisionTVL(t, tvlL) },
            { K_Sv_semana: kermaDispersion(f, g), transmision: (t) => transmisionUnTVL(t, tvlS) },
          );
        }
      });
      for (const x of directos) kPunto += x.K_Sv_semana * 1000;
      kermaMax = Math.max(kermaMax, kPunto);
      // Regla del informe (primaria: la mayor; secundaria: dos fuentes) y verificación con la suma directa
      // Σ K·B ≤ P/T del motor de campo; se toma el mayor de los dos espesores.
      // Secundaria (§7.1.5, pp. 114–115; §7.1.8, p. 123): dos fuentes por tipo (dispersión entre energías, fuga
      // entre energías) y después dispersión vs. fuga con el mayor HVL.
      const regla = esPrimaria ? Math.max(0, ...comps.map((c) => c.espesor_cm)) : combinarPorTipo([porTipo.dispersion, porTipo.fuga]);
      const directo = espesorSumaDirecta(directos, P, T);
      if (directo > regla + 1e-6) porSumaDirecta = true;
      peor = Math.max(peor, regla, directo);
    }
    if (porSumaDirecta) notas.push(`${m.code}: la suma directa de componentes exige más espesor que la regla de NCRP 151; se usa la suma directa.`);
    if (peor > 0) espesores[m.code] = peor * 10 * esc;
    if (esc !== 1) notas.push(`${m.code}: espesor por equivalencia másica con concreto (ρ = ${m.density} g/cm³).`);
  }
  return { metodo: 'NCRP151', espesores_mm: espesores, kermaMax_mSv_semana: kermaMax, notas };
}
