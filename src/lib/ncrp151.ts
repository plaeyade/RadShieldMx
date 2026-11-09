/**
 * NCRP Report No. 151 (2005) — blindaje de instalaciones de radioterapia de megavoltaje.
 *
 * Datos transcritos del informe original (indexado en GAMMA, SHA-256 c540e5e3…):
 * - Tabla B.2 (p. 161): TVL₁/TVLₑ primarios en concreto 2.35, acero 7.87 y plomo 11.35 g/cm³.
 * - Tabla B.4 (p. 163): fracción de dispersión del paciente a(θ) a 1 m, campo de 400 cm².
 * - Tabla B.5a (p. 164): TVL en concreto de la radiación dispersada por el paciente según ángulo.
 * - Tabla B.7 (p. 167): TVL₁/TVLₑ de la radiación de fuga en concreto.
 * Ecuaciones 2.1 (primaria), 2.3 (espesor con TVL₁ y TVLₑ), 2.7 (dispersión del paciente),
 * 2.8 (fuga, fracción 10⁻³), 3.6 (carga de fuga con IMRT), la regla de las dos fuentes (§1.4.3) y la
 * corrección de incidencia oblicua (§2.2, p. 24).
 */

export type EnergiaMV = 4 | 6 | 10 | 15 | 18 | 20 | 25 | 30 | 'Co60';
export type MaterialNCRP151 = 'concrete' | 'steel' | 'lead';
export interface TvlPar { tvl1_cm: number; tvle_cm: number }

const par = (tvl1_cm: number, tvle_cm: number): TvlPar => ({ tvl1_cm, tvle_cm });

/** Tabla B.2 — TVL primarios (cm). */
export const TABLA_B_2: Record<MaterialNCRP151, Record<string, TvlPar>> = {
  concrete: { '4': par(35, 30), '6': par(37, 33), '10': par(41, 37), '15': par(44, 41), '18': par(45, 43), '20': par(46, 44), '25': par(49, 46), '30': par(51, 49), Co60: par(21, 21) },
  steel: { '4': par(9.9, 9.9), '6': par(10, 10), '10': par(11, 11), '15': par(11, 11), '18': par(11, 11), '20': par(11, 11), '25': par(11, 11), '30': par(11, 11), Co60: par(7.0, 7.0) },
  lead: { '4': par(5.7, 5.7), '6': par(5.7, 5.7), '10': par(5.7, 5.7), '15': par(5.7, 5.7), '18': par(5.7, 5.7), '20': par(5.7, 5.7), '25': par(5.7, 5.7), '30': par(5.7, 5.7), Co60: par(4.0, 4.0) },
};

/** Tabla B.7 — TVL de fuga en concreto (cm). */
export const TABLA_B_7: Record<string, TvlPar> = {
  '4': par(33, 28), '6': par(34, 29), '10': par(35, 31), '15': par(36, 33), '18': par(36, 34), '20': par(36, 34), '25': par(37, 35), '30': par(37, 36), Co60: par(21, 21),
};

/** Tabla B.4 — fracción de dispersión a(θ) (6, 10, 18, 24 MV). */
export const ANGULOS_B_4 = [10, 20, 30, 45, 60, 90, 135, 150] as const;
export const TABLA_B_4: Record<'6' | '10' | '18' | '24', number[]> = {
  '6': [1.04e-2, 6.73e-3, 2.77e-3, 1.39e-3, 8.24e-4, 4.26e-4, 3.00e-4, 2.87e-4],
  '10': [1.66e-2, 5.79e-3, 3.18e-3, 1.35e-3, 7.46e-4, 3.81e-4, 3.02e-4, 2.74e-4],
  '18': [1.42e-2, 5.39e-3, 2.53e-3, 8.64e-4, 4.24e-4, 1.89e-4, 1.24e-4, 1.20e-4],
  '24': [1.78e-2, 6.32e-3, 2.74e-3, 8.30e-4, 3.86e-4, 1.74e-4, 1.20e-4, 1.13e-4],
};

/** Tabla B.5a — TVL en concreto de la dispersión del paciente (cm). */
export const ANGULOS_B_5A = [15, 30, 45, 60, 90, 135] as const;
export const TABLA_B_5A: Record<string, number[]> = {
  Co60: [22, 21, 20, 19, 15, 13],
  '4': [30, 25, 22, 21, 17, 14],
  '6': [34, 26, 23, 21, 17, 15],
  '10': [39, 28, 25, 22, 18, 15],
  '15': [42, 31, 26, 23, 18, 15],
  '18': [44, 32, 27, 23, 19, 15],
  '20': [46, 33, 27, 24, 19, 15],
  '24': [49, 36, 29, 24, 19, 16],
};

const LOG10_2 = Math.log10(2); // 0.301: 1 HVL = 0.301 TVL

function clave(e: EnergiaMV): string { return String(e); }

/** Ángulo de la tabla: el inmediato inferior (fracción mayor y TVL mayor: conservador). */
function indiceAngulo(angulos: readonly number[], theta: number): number {
  let i = 0;
  for (let k = 0; k < angulos.length; k++) if (angulos[k] <= theta) i = k;
  return i;
}

/** a(θ): energías intermedias toman la mayor de las columnas vecinas (conservador). */
export function fraccionDispersion(e: EnergiaMV, theta_deg: number): number {
  const i = indiceAngulo(ANGULOS_B_4, theta_deg);
  if (e === 6 || e === 10 || e === 18) return TABLA_B_4[String(e) as '6' | '10' | '18'][i];
  if (e === 'Co60' || e < 6) return TABLA_B_4['6'][i];
  if (e === 15) return Math.max(TABLA_B_4['10'][i], TABLA_B_4['18'][i]);
  return Math.max(TABLA_B_4['18'][i], TABLA_B_4['24'][i]);
}

/**
 * TVL de la dispersión del paciente en concreto (Tabla B.5a). Por debajo de 15° (primer ángulo tabulado) el TVL
 * crece hacia el del haz primario: §7.1.3 (p. 110) usa 45 cm para 18 MV a ~10° (= TVL₁ primario, Tabla B.2) y
 * 35 cm para 6 MV (interpolado). El motor toma max(B.5a a 15°, TVL₁ primario de B.2): conservador. Antes usaba el
 * valor de 15° (44 cm a 18 MV), que subestimaba la transmisión a ángulos pequeños.
 */
export function tvlDispersionConcreto(e: EnergiaMV, theta_deg: number): number {
  const i = indiceAngulo(ANGULOS_B_5A, theta_deg);
  const fila = TABLA_B_5A[clave(e)] ?? TABLA_B_5A[e === 30 || e === 25 ? '24' : '18'];
  if (theta_deg < ANGULOS_B_5A[0]) return Math.max(fila[0], TABLA_B_2.concrete[clave(e)].tvl1_cm);
  return fila[i];
}

/** Ec. 2.3: t = TVL₁ + (n − 1)·TVLₑ; con n < 1 se usa n·TVL₁ (como en los ejemplos del §7). */
export function espesorTVL(B: number, tvl: TvlPar): number {
  if (B >= 1) return 0;
  const n = Math.log10(1 / B);
  return n < 1 ? n * tvl.tvl1_cm : tvl.tvl1_cm + (n - 1) * tvl.tvle_cm;
}

/**
 * Inversa exacta de la Ec. 2.3 (`espesorTVL`): transmisión B de un espesor t (cm).
 * t ≤ TVL₁ → B = 10^(−t/TVL₁); t > TVL₁ → B = 10^−(1 + (t − TVL₁)/TVLₑ).
 */
export function transmisionTVL(t_cm: number, tvl: TvlPar): number {
  if (!(t_cm > 0)) return 1;
  const n = t_cm <= tvl.tvl1_cm ? t_cm / tvl.tvl1_cm : 1 + (t_cm - tvl.tvl1_cm) / tvl.tvle_cm;
  return Math.pow(10, -n);
}

export interface Componente { espesor_cm: number; tvl_cm: number; nombre: string }

/** Regla de las dos fuentes (§1.4.3): si difieren menos de un TVL, se suma 1 HVL al mayor. */
export function combinarDosFuentes(componentes: Componente[]): number {
  const v = componentes.filter((c) => c.espesor_cm > 0).sort((a, b) => b.espesor_cm - a.espesor_cm);
  if (!v.length) return 0;
  let t = v[0].espesor_cm;
  const tvlMax = Math.max(...v.map((c) => c.tvl_cm));
  for (const c of v.slice(1)) if (t - c.espesor_cm < tvlMax) { t += LOG10_2 * tvlMax; break; }
  return t;
}

/**
 * Regla de las dos fuentes aplicada por tipo, como en los ejemplos §7.1.5 (pp. 114–115) y §7.1.8 (p. 123):
 * primero se combinan las energías de cada tipo (dispersión del paciente; fuga) y después los dos resultados,
 * sumando el mayor HVL de todos si difieren menos de un TVL. Con la fuga se usa siempre TVL₁ (≥ TVLₑ): el
 * informe alterna TVL₁ (§7.1.5, §7.1.9 IMRT) y TVLₑ (§7.1.8); la diferencia es ≤ 0.301 × 2 cm ≈ 0.6 cm por paso.
 * El §7.1.15 aplica la regla sólo al par mayor (73 cm); este criterio da más espesor (conservador).
 */
export function combinarPorTipo(grupos: Componente[][]): number {
  const parciales: Componente[] = grupos
    .filter((g) => g.length)
    .map((g, i) => ({ espesor_cm: combinarDosFuentes(g), tvl_cm: Math.max(...g.map((c) => c.tvl_cm)), nombre: `grupo ${i + 1}` }));
  return combinarDosFuentes(parciales);
}

export interface FuenteTeleterapia {
  energia: EnergiaMV;
  /** Carga semanal en el isocentro (Gy/semana). */
  W_Gy_semana: number;
  /** Fracción de la carga con IMRT y factor C_I (Ec. 3.6). */
  fraccionIMRT?: number;
  factorIMRT?: number;
}

export function cargaFuga(f: FuenteTeleterapia): number {
  const fr = f.fraccionIMRT ?? 0;
  const ci = f.factorIMRT ?? 1;
  return f.W_Gy_semana * (1 - fr) + ci * fr * f.W_Gy_semana;
}

export interface Contexto {
  /** Objetivo de diseño en Sv/semana (NCRP 151: 1e-4 controlada, 2e-5 no controlada). */
  P_Sv_semana: number;
  T: number;
  material?: MaterialNCRP151;
}

// ───────────────────────────────────────────────────────────────
// Kerma sin blindaje por componente (Sv/semana ≈ Gy/semana). Fuente única: las funciones de espesor
// de abajo (B = P / (T·K)) y el motor de campo (`doseFieldEngine`, K·B) usan estas mismas expresiones.
// ───────────────────────────────────────────────────────────────

/** Ec. 2.1 sin blindaje: primaria W·U/d² (d: blanco → punto, m). */
export function kermaPrimaria(f: FuenteTeleterapia, U: number, d_m: number): number {
  return (f.W_Gy_semana * U) / (d_m * d_m);
}

/** Ec. 2.8 sin blindaje: fuga 10⁻³·W_L/d_L² (W_L con IMRT, Ec. 3.6; sin U). */
export function kermaFuga(f: FuenteTeleterapia, dL_m: number): number {
  return (1e-3 * cargaFuga(f)) / (dL_m * dL_m);
}

export interface GeometriaDispersion { U: number; dsec_m: number; dsca_m?: number; theta_deg: number; campo_cm2?: number }

/** Ec. 2.7 sin blindaje: dispersión del paciente a(θ)·W·U·(F/400)/(d_sca²·d_sec²); F = 1600 cm², d_sca = 1 m por omisión. */
export function kermaDispersion(f: FuenteTeleterapia, g: GeometriaDispersion): number {
  const a = fraccionDispersion(f.energia, g.theta_deg);
  const F = g.campo_cm2 ?? 1600;
  const dsca = g.dsca_m ?? 1;
  return (a * f.W_Gy_semana * g.U * (F / 400)) / (dsca * dsca * g.dsec_m * g.dsec_m);
}

// TVL por componente y material (cm).

/** Primaria: Tabla B.2. */
export function tvlPrimaria(e: EnergiaMV, mat: MaterialNCRP151): TvlPar {
  return TABLA_B_2[mat][clave(e)];
}

/** Fuga: Tabla B.7 en concreto; en acero/plomo los TVL primarios de B.2 (conservador). */
export function tvlFuga(e: EnergiaMV, mat: MaterialNCRP151): TvlPar {
  return mat === 'concrete' ? TABLA_B_7[clave(e)] : TABLA_B_2[mat][clave(e)];
}

/** Dispersión del paciente: un solo TVL (B.5a en concreto; TVL₁ de B.2 en acero/plomo, conservador). */
export function tvlDispersion(e: EnergiaMV, mat: MaterialNCRP151, theta_deg: number): number {
  return mat === 'concrete' ? tvlDispersionConcreto(e, theta_deg) : TABLA_B_2[mat][clave(e)].tvl1_cm;
}

/** Transmisión con un solo TVL: B = 10^(−t/TVL) (inversa de n·TVL, como en `dispersion`). */
export function transmisionUnTVL(t_cm: number, tvl_cm: number): number {
  return t_cm > 0 ? Math.pow(10, -t_cm / tvl_cm) : 1;
}

// ───────────────────────────────────────────────────────────────
// Incidencia oblicua (NCRP 151 §2.2, p. 24). Hasta 45° el espesor oblicuo t/cos θ es válido. Para θ > 45° el
// espesor oblicuo sobrestima la atenuación y NCRP 151 sólo da una corrección aproximada (≈ 2 HVL en baja energía,
// ≈ 1 HVL en alta energía) y sólo para concreto; NCRP 147 (§4) calcula a incidencia normal. Revisión 8c: el motor
// antes aplicaba esa corrección sólo con B < 10⁻³, de modo que justo por encima del umbral la transmisión podía ser
// hasta ×2 menor (menos conservadora) que justo por debajo. Ahora, para θ > 45° y cualquier B o material, la
// transmisión es la de incidencia normal: nunca menor que la del espesor perpendicular y continua en B.
// ───────────────────────────────────────────────────────────────

/** Por encima de este ángulo la aproximación de espesor oblicuo t/cos θ sobrestima la atenuación. */
export const OBLICUIDAD_UMBRAL_DEG = 45;
/** Tope del motor para el espesor oblicuo (conservador): no se acredita recorrido adicional más allá de 70°. */
export const OBLICUIDAD_MAX_DATOS_DEG = 70;

/**
 * Corrección de oblicuidad (NCRP 151 §2.2, p. 24; NCRP 147 §4): para θ ≤ 45° se usa la transmisión con el espesor
 * oblicuo t/cos θ; para θ > 45° se devuelve la transmisión a incidencia normal (sin crédito por oblicuidad), que es
 * siempre ≥ la oblicua con 1 o 2 HVL descontados (la corrección aproximada del §2.2) y no depende de B ni del
 * material. `hvlDescontados` es el número de HVL que se restituyen respecto del espesor oblicuo: log₂(B_n/B_o).
 */
export function correccionOblicuidad(
  B_oblicua: number, B_normal: number, theta_deg: number,
): { transmision: number; hvlDescontados: number } {
  if (!(theta_deg > OBLICUIDAD_UMBRAL_DEG + 1e-9)) return { transmision: B_oblicua, hvlDescontados: 0 };
  const transmision = Math.max(B_normal, B_oblicua);
  const hvl = B_oblicua > 0 && transmision > B_oblicua ? Math.log2(transmision / B_oblicua) : 0;
  return { transmision, hvlDescontados: Number.isFinite(hvl) ? hvl : 0 };
}

export interface TerminoDirecto { K_Sv_semana: number; transmision: (t_cm: number) => number }

/**
 * Espesor t (cm) con Σ Kᵢ·Bᵢ(t)·T = P, por bisección: la suma directa de las componentes que usa el motor
 * de campo. Complementa la regla de las dos fuentes (§1.4.3), que con más de dos componentes (p. ej. fuga
 * y dispersión de un equipo de doble energía) puede quedar hasta ~10 % por encima de P.
 */
export function espesorSumaDirecta(terminos: TerminoDirecto[], P_Sv_semana: number, T: number): number {
  const meta = P_Sv_semana / T;
  const f = (t: number) => terminos.reduce((a, x) => a + x.K_Sv_semana * x.transmision(t), 0);
  if (f(0) <= meta) return 0;
  let lo = 0, hi = 50;
  while (f(hi) > meta && hi < 1e5) hi *= 2;
  for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (f(mid) > meta) lo = mid; else hi = mid; }
  return hi;
}

/** Barrera primaria (Ec. 2.1 + 2.3). d: blanco → punto protegido (m). */
export function primaria(f: FuenteTeleterapia, c: Contexto & { U: number; d_m: number }): Componente {
  const B = c.P_Sv_semana / (kermaPrimaria(f, c.U, c.d_m) * c.T);
  const tvl = tvlPrimaria(f.energia, c.material ?? 'concrete');
  return { espesor_cm: espesorTVL(B, tvl), tvl_cm: tvl.tvle_cm, nombre: `primaria ${f.energia} MV` };
}

/** Fuga (Ec. 2.8). En acero/plomo se usan los TVL primarios de B.2 (conservador). */
export function fuga(f: FuenteTeleterapia, c: Contexto & { dL_m: number }): Componente {
  const B = c.P_Sv_semana / (kermaFuga(f, c.dL_m) * c.T);
  const tvl = tvlFuga(f.energia, c.material ?? 'concrete');
  return { espesor_cm: espesorTVL(B, tvl), tvl_cm: tvl.tvl1_cm, nombre: `fuga ${f.energia} MV` };
}

/**
 * Dispersión del paciente (Ec. 2.7): B = P·d_sca²·d_sec²·400 / (a·W·U·T·F).
 * Como en el ejemplo §7.1.5, la dispersión usa un solo TVL (B.5a) y U de la barrera (0.25 típico).
 */
export function dispersion(
  f: FuenteTeleterapia,
  c: Contexto & GeometriaDispersion,
): Componente {
  const B = c.P_Sv_semana / (kermaDispersion(f, c) * c.T);
  const tvl = tvlDispersion(f.energia, c.material ?? 'concrete', c.theta_deg);
  const n = B >= 1 ? 0 : Math.log10(1 / B);
  return { espesor_cm: n * tvl, tvl_cm: tvl, nombre: `dispersión ${f.energia} MV a ${c.theta_deg}°` };
}

export function energiaDesdeClave(k: string): EnergiaMV | null {
  if (/co-?60/i.test(k)) return 'Co60';
  const m = k.match(/(\d+)\s*MV/i);
  if (!m) return null;
  const e = Number(m[1]);
  return ([4, 6, 10, 15, 18, 20, 25, 30] as const).find((x) => x === e) ?? null;
}

// ───────────────────────────────────────────────────────────────
// Skyshine de fotones (NCRP 151 §5.1, Ec. 5.1, método de McGinley 2002).
// Ḣ (nSv/h) = 2.5×10⁷ · B_xs · Ḋ₀ · Ω^1.3 / (dᵢ · dₛ)². Con Ḋ₀ en Gy/h da nSv/h; con la carga W en Gy/semana
// a 1 m da nSv/semana (la ecuación es lineal en Ḋ₀). NCRP 151 advierte que es, a lo sumo, una estimación de orden
// de magnitud (Tabla 5.1: medido/calculado entre 0.25 y 5.3).
// ───────────────────────────────────────────────────────────────

export interface EntradaSkyshine {
  /** Transmisión del techo para la primaria (B_xs). */
  B_xs: number;
  /** Rendimiento a 1 m del blanco: Gy/h (tasa) o Gy/semana (carga W). */
  D0: number;
  /** Ángulo sólido del haz máximo (sr). */
  omega_sr: number;
  /** Distancia vertical del blanco a un punto 2 m sobre el techo (m). */
  di_m: number;
  /** Distancia horizontal del isocentro al punto de cálculo (m). */
  ds_m: number;
}

/** Ec. 5.1: nSv por unidad de tiempo de D0 (h o semana). */
export function skyshineFotones(e: EntradaSkyshine): number {
  if (!(e.di_m > 0 && e.ds_m > 0)) throw new RangeError('dᵢ y dₛ deben ser positivas');
  return (2.5e7 * e.B_xs * e.D0 * Math.pow(e.omega_sr, 1.3)) / Math.pow(e.di_m * e.ds_m, 2);
}

/** Ángulo sólido (sr) de un campo rectangular a × b definido a la distancia d (Ω = 4·asin(ab / √((a²+4d²)(b²+4d²)))). */
export function anguloSolidoCampo(a_m: number, b_m: number, d_m = 1): number {
  return 4 * Math.asin((a_m * b_m) / Math.sqrt((a_m * a_m + 4 * d_m * d_m) * (b_m * b_m + 4 * d_m * d_m)));
}
