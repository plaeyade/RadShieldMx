/**
 * Fase 11 — blindaje de terapia con I-131 y Lu-177 por ESPECTRO COMPLETO con buildup Geometric-Progression (GP).
 *
 * Regla regulatoria adoptada (por material, sobre la transmisión de kerma en aire T(t)):
 *
 *   T_regla(t) = max( T_a(t), T_b(t) )
 *   (a) haz estrecho a la línea más energética (I-131: 722.9 keV, lo que pide la CNSNS; Lu-177: 208.4 keV):
 *       T_a = exp(−µ·t), µ = µ/ρ total de NIST (con dispersión coherente) × ρ.
 *   (b) haz ancho del espectro completo con buildup GP de ANSI/ANS-6.4.3:
 *       T_GP = Σᵢ fᵢ·B_GP(Eᵢ, µᵢt)·exp(−µᵢt), fᵢ = Iᵢ·Eᵢ·(µ_en/ρ)_aire(Eᵢ) normalizada (peso por kerma en aire),
 *       µᵢ SIN dispersión coherente (ANS-6.4.3 §4.1, la que cuenta los mfp de los coeficientes).
 *       En concreto, cuando se dispone del ajuste de Oumano et al. 2025 (sólo I-131): T_b = max(T_Oumano, 1.2·T_GP).
 *
 * El espesor requerido es el que da T_regla(t) = P/(K·T); como cada término decrece con t, es el mayor de los
 * espesores de cada criterio, y la traza dice cuál rige.
 *
 * Buildup GP (fuente puntual isótropa, medio infinito, respuesta exposición/kerma en aire):
 *   B = 1 + (b−1)(K^x − 1)/(K − 1)  (K ≠ 1);  B = 1 + (b−1)x  (K = 1)
 *   K(x) = c·x^a + d·[tanh(x/X_k − 2) − tanh(−2)]/[1 − tanh(−2)]
 * Interpolación en energía: b, c, X_k log-log; a y d (cambian de signo) lineales en ln E. Validez 0.5–40 mfp.
 * Fuente: Trubey DK, ORNL/RSIC-49 (1988), Ap. II (borrador ANSI/ANS-6.4.3, base de ANSI/ANS-6.4.3-1991), fórmula
 * sec. 2 y coeficientes de exposición de la Tabla 5.1 (Pb, Fe, concreto NBS ordinario). Transcripción verificada
 * contra 37 valores B(E, mfp) de la Tabla 3 del mismo informe: desviación máxima 2.2 %.
 *
 * Materiales del catálogo: plomo → Pb (ρ_ref 11.35), acero → Fe (7.874); los demás por equivalencia másica con el
 * concreto ordinario 2.35 (t = t_concreto·2.35/ρ). Para materiales de Z mayor que el concreto (barita, concreto con
 * hierro, bloques de alta densidad, vidrio plomado) la equivalencia sobrestima el espesor: conservador. No hay GP de
 * barita ni de concreto pesado en las fuentes disponibles (queda abierto: MC o Z_eq).
 *
 * Lectura de los resultados (casos de referencia, `src/__tests__/auditoria/terapiaEspectroGP.test.ts`): en plomo rige el
 * haz estrecho a 723 keV (1.26–4.2 veces el GP) y el GP coincide ±2 % con el Monte Carlo de losa; en concreto rige el
 * haz ancho (el GP de medio infinito queda 1.7–2.0 veces por encima del MC de losa: cota superior, conservadora).
 */
import type { RadiationSource, ShieldingMaterial } from '@/types/radshield';

export type MaterialGP = 'Pb' | 'Fe' | 'Concreto';
export type NuclidoTerapia = 'I131' | 'Lu177';

/** Fila de coeficientes GP de exposición: [E (MeV), b, c, a, X_k, d]. */
export type FilaGP = readonly [number, number, number, number, number, number];

export const REFERENCIA_GP_ANS643 =
  'Trubey DK. New Gamma-Ray Buildup Factor Data for Point Kernel Calculations: ANS-6.4.3 Standard Reference Data. ORNL/RSIC-49, 1988, Ap. II y Tabla 5.1 (coeficientes GP de exposición)';
export const REFERENCIA_OUMANO_2025 =
  'Oumano M et al. J Appl Clin Med Phys 2025;26(5):e70084 (ajuste de Archer de la transmisión de haz ancho del espectro completo de I-131)';

/**
 * ANSI/ANS-6.4.3 (ORNL/RSIC-49, Tabla 5.1): coeficientes GP de exposición, 0.06–1 MeV (Pb PDF p. 115 / impresa 92;
 * Fe p. 108; concreto NBS ordinario p. 119). En Pb la fila de 0.08 MeV está bajo el borde K (88.0 keV).
 */
export const GP_ANS643: Record<MaterialGP, readonly FilaGP[]> = {
  Pb: [
    [0.06, 1.017, 0.487, 0.18, 13.37, -0.1037],
    [0.08, 1.033, 0.523, 0.153, 13.3, -0.0777],
    [0.1, 2.037, 1.432, 0.079, 18.37, -0.0935],
    [0.15, 1.408, 0.362, 0.281, 21.46, -0.0964],
    [0.2, 1.184, 0.19, 0.381, 13.27, -0.1868],
    [0.3, 1.122, 0.533, 0.137, 13.69, -0.0612],
    [0.4, 1.135, 0.67, 0.085, 19.56, -0.0325],
    [0.5, 1.179, 0.725, 0.072, 14.89, -0.0244],
    [0.6, 1.228, 0.744, 0.064, 14.47, -0.0184],
    [0.8, 1.283, 0.8, 0.05, 15.2, -0.0191],
    [1, 1.318, 0.86, 0.035, 16.49, -0.0154],
  ],
  Fe: [
    [0.06, 1.148, 0.405, 0.208, 14.17, -0.1142],
    [0.08, 1.267, 0.47, 0.18, 14.48, -0.0974],
    [0.1, 1.389, 0.557, 0.144, 14.11, -0.0791],
    [0.15, 1.66, 0.743, 0.079, 14.12, -0.0476],
    [0.2, 1.839, 0.911, 0.034, 13.23, -0.0334],
    [0.3, 1.973, 1.095, -0.009, 11.86, -0.0183],
    [0.4, 1.992, 1.187, -0.027, 10.72, -0.014],
    [0.5, 1.967, 1.24, -0.039, 8.34, -0.0074],
    [0.6, 1.947, 1.247, -0.04, 8.2, -0.0096],
    [0.8, 1.906, 1.233, -0.038, 7.93, -0.011],
    [1, 1.841, 1.25, -0.048, 19.49, 0.014],
  ],
  Concreto: [
    [0.06, 2.125, 0.664, 0.118, 11.9, -0.0615],
    [0.08, 2.557, 0.895, 0.042, 14.37, -0.0413],
    [0.1, 2.766, 1.069, 0.001, 12.64, -0.0251],
    [0.15, 2.824, 1.315, -0.049, 8.66, -0.0048],
    [0.2, 2.716, 1.43, -0.07, 18.52, 0.0108],
    [0.3, 2.522, 1.492, -0.082, 16.59, 0.0161],
    [0.4, 2.372, 1.494, -0.085, 15.96, 0.0194],
    [0.5, 2.271, 1.466, -0.082, 16.25, 0.0195],
    [0.6, 2.192, 1.434, -0.078, 17.02, 0.0199],
    [0.8, 2.066, 1.386, -0.073, 15.07, 0.0202],
    [1, 1.982, 1.332, -0.065, 15.38, 0.0193],
  ],
};

/** Densidad de referencia de cada material GP (g/cm³): Pb y Fe NIST; concreto ordinario NIST/NBS 2.35. */
export const RHO_REF: Record<MaterialGP, number> = { Pb: 11.35, Fe: 7.874, Concreto: 2.35 };

/**
 * µ/ρ total con dispersión coherente (cm²/g), NIST X-Ray Mass Attenuation Coefficients (Hubbell y Seltzer, NIST SRD
 * 126; Pb z82, Fe z26, «Concrete, Ordinary»): haz estrecho. Filas [E (MeV), µ/ρ]; en Pb sólo por encima del borde K
 * salvo la fila de 0.08 (bajo el borde), que no se usa para el haz estrecho.
 */
export const NIST_MU_RHO: Record<MaterialGP, readonly (readonly [number, number])[]> = {
  Pb: [[0.1, 5.549], [0.15, 2.014], [0.2, 0.9985], [0.3, 0.4031], [0.4, 0.2323], [0.5, 0.1614], [0.6, 0.1248], [0.8, 0.0887], [1, 0.07102]],
  Fe: [[0.08, 0.5952], [0.1, 0.3717], [0.15, 0.1964], [0.2, 0.146], [0.3, 0.1099], [0.4, 0.094], [0.5, 0.08414], [0.6, 0.07704], [0.8, 0.06699], [1, 0.05995]],
  Concreto: [[0.08, 0.2014], [0.1, 0.1738], [0.15, 0.1436], [0.2, 0.1282], [0.3, 0.1097], [0.4, 0.09783], [0.5, 0.08915], [0.6, 0.08236], [0.8, 0.07227], [1, 0.06495]],
};

/** µ_en/ρ del aire (cm²/g), NIST SRD 126 («Air, Dry»): peso de cada línea en el kerma en aire. */
export const NIST_MUEN_AIRE: readonly (readonly [number, number])[] = [
  [0.06, 0.03041], [0.08, 0.02407], [0.1, 0.02325], [0.15, 0.02496], [0.2, 0.02672], [0.3, 0.02872], [0.4, 0.02949],
  [0.5, 0.02966], [0.6, 0.02953], [0.8, 0.02882], [1, 0.02789],
];

export interface LineaGamma {
  E_keV: number;
  /** Fotones por 100 desintegraciones. */
  I_pct: number;
  /** µ/ρ sin dispersión coherente (fotoeléctrico + incoherente), cm²/g: Elam, Ravel y Sieber 2002 (= NIST ±1 %). */
  muRhoSinCoh: Record<MaterialGP, number>;
}

export interface EspectroTerapia {
  nuclido: NuclidoTerapia;
  etiqueta: string;
  fuente: string;
  lineas: LineaGamma[];
  /** Línea del criterio (a), haz estrecho. */
  E_estrecho_keV: number;
  /** Ajuste de Archer (x en mm) de haz ancho del espectro completo, si está publicado. */
  oumano?: Partial<Record<MaterialGP, { alpha: number; beta: number; gamma: number }>>;
}

const L = (E_keV: number, I_pct: number, Pb: number, Fe: number, Concreto: number): LineaGamma => ({ E_keV, I_pct, muRhoSinCoh: { Pb, Fe, Concreto } });

/** Espectros (ENSDF). I-131: líneas ≥ 0.1 %, sin rayos X de Xe. Lu-177: líneas de 112.9 y 208.4 keV. */
export const ESPECTROS_TERAPIA: Record<NuclidoTerapia, EspectroTerapia> = {
  I131: {
    nuclido: 'I131',
    etiqueta: 'I-131',
    fuente: 'ENSDF: Khazov Yu, Mitropolsky I, Rodionov A. Nucl Data Sheets 2006;107:2715',
    lineas: [
      L(80.185, 2.62, 2.09897, 0.53629, 0.18565),
      L(177.214, 0.269, 1.25899, 0.15032, 0.13093),
      L(284.305, 6.12, 0.41816, 0.10821, 0.11072),
      L(325.789, 0.273, 0.31552, 0.10079, 0.10521),
      L(364.489, 81.5, 0.25409, 0.09541, 0.10076),
      L(503.004, 0.359, 0.1486, 0.08219, 0.08849),
      L(636.989, 7.16, 0.10831, 0.07376, 0.07992),
      L(642.719, 0.217, 0.10714, 0.07345, 0.0796),
      L(722.911, 1.77, 0.09356, 0.06953, 0.0755),
    ],
    E_estrecho_keV: 722.911,
    // Oumano et al. 2025 (GATE 9.2 + MCNP6, espectro ICRP-107): Pb y concreto de peso normal; aplicado al concreto
    // 2.35 sin reescalar (conservador si el concreto del artículo es ≤ 2.35 g/cm³).
    oumano: {
      Pb: { alpha: 0.1082, beta: 0.2072, gamma: 0.5385 },
      Concreto: { alpha: 0.02062, beta: -0.0122, gamma: 0.4179 },
    },
  },
  Lu177: {
    nuclido: 'Lu177',
    etiqueta: 'Lu-177',
    fuente: 'ENSDF: Kondev FG. Nucl Data Sheets 2019;159:1 (A = 177)',
    lineas: [
      L(112.9498, 6.23, 3.90923, 0.26757, 0.15481),
      L(208.3662, 10.41, 0.84816, 0.13156, 0.12375),
    ],
    E_estrecho_keV: 208.3662,
  },
};

/** Factor sobre T_GP en concreto cuando hay ajuste de Oumano (regla adoptada: max(Oumano, 1.2·GP)). */
export const FACTOR_GP_CONCRETO = 1.2;

function interpLogLog(tab: readonly (readonly [number, number])[], E_MeV: number): number {
  if (E_MeV <= tab[0][0]) return tab[0][1];
  for (let i = 0; i < tab.length - 1; i++) {
    const [e0, v0] = tab[i];
    const [e1, v1] = tab[i + 1];
    if (E_MeV <= e1) {
      const w = Math.log(E_MeV / e0) / Math.log(e1 / e0);
      return Math.exp(Math.log(v0) + w * Math.log(v1 / v0));
    }
  }
  return tab[tab.length - 1][1];
}

export interface CoefGP { b: number; c: number; a: number; Xk: number; d: number }

/** Coeficientes GP interpolados a E (MeV): b, c, X_k log-log; a, d lineales en ln E. */
export function coeficientesGP(mat: MaterialGP, E_MeV: number): CoefGP {
  const filas = GP_ANS643[mat];
  const f = (r: FilaGP): CoefGP => ({ b: r[1], c: r[2], a: r[3], Xk: r[4], d: r[5] });
  if (E_MeV <= filas[0][0]) return f(filas[0]);
  if (E_MeV >= filas[filas.length - 1][0]) return f(filas[filas.length - 1]);
  let i = 0;
  while (i < filas.length - 2 && filas[i + 1][0] < E_MeV) i++;
  const r0 = filas[i], r1 = filas[i + 1];
  const w = Math.log(E_MeV / r0[0]) / Math.log(r1[0] / r0[0]);
  const lg = (k: number) => Math.exp(Math.log(r0[k]) + w * Math.log(r1[k] / r0[k]));
  const li = (k: number) => r0[k] + w * (r1[k] - r0[k]);
  return { b: lg(1), c: lg(2), a: li(3), Xk: lg(4), d: li(5) };
}

const TANH_M2 = Math.tanh(-2);

/** Buildup GP de exposición a x mfp (ANS-6.4.3, Ap. II sec. 2). */
export function buildupGP(p: CoefGP, x: number): number {
  if (!(x > 0)) return 1;
  const K = p.c * Math.pow(x, p.a) + (p.d * (Math.tanh(x / p.Xk - 2) - TANH_M2)) / (1 - TANH_M2);
  if (Math.abs(K - 1) < 1e-9) return 1 + (p.b - 1) * x;
  return 1 + ((p.b - 1) * (Math.pow(K, x) - 1)) / (K - 1);
}

/** Fracción del kerma en aire sin blindaje de cada línea (Iᵢ·Eᵢ·(µ_en/ρ)_aire normalizado). */
export function fraccionesKerma(nuc: NuclidoTerapia): number[] {
  const ls = ESPECTROS_TERAPIA[nuc].lineas;
  const k = ls.map((l) => (l.I_pct / 100) * l.E_keV * interpLogLog(NIST_MUEN_AIRE, l.E_keV / 1000));
  const s = k.reduce((a, b) => a + b, 0);
  return k.map((v) => v / s);
}

/** (a) Transmisión de haz estrecho a la línea del criterio; t en cm del material de referencia. */
export function transmisionEstrecha(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): number {
  const E = ESPECTROS_TERAPIA[nuc].E_estrecho_keV / 1000;
  return Math.exp(-interpLogLog(NIST_MU_RHO[mat], E) * RHO_REF[mat] * Math.max(0, t_cm));
}

/** (b) Transmisión de haz ancho del espectro completo con buildup GP; t en cm del material de referencia. */
export function transmisionEspectroGP(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): number {
  const ls = ESPECTROS_TERAPIA[nuc].lineas;
  const f = fraccionesKerma(nuc);
  return ls.reduce((s, l, i) => {
    const x = l.muRhoSinCoh[mat] * RHO_REF[mat] * Math.max(0, t_cm);
    return s + f[i] * buildupGP(coeficientesGP(mat, l.E_keV / 1000), x) * Math.exp(-x);
  }, 0);
}

/** Ajuste de Oumano 2025 (Archer, x en mm); null si no está publicado para ese nucleido y material. */
export function transmisionOumano(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): number | null {
  const p = ESPECTROS_TERAPIA[nuc].oumano?.[mat];
  if (!p) return null;
  const x = Math.max(0, t_cm) * 10;
  return Math.pow((1 + p.beta / p.alpha) * Math.exp(p.alpha * p.gamma * x) - p.beta / p.alpha, -1 / p.gamma);
}

export type CriterioTerapia = 'haz estrecho' | 'GP espectro' | 'GP espectro ×1.2' | 'Oumano 2025';

/** Término (b) de la regla: GP; en concreto con ajuste de Oumano, max(Oumano, 1.2·GP). */
export function transmisionHazAncho(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): { T: number; criterio: CriterioTerapia } {
  const gp = transmisionEspectroGP(nuc, mat, t_cm);
  const ou = mat === 'Concreto' ? transmisionOumano(nuc, mat, t_cm) : null;
  if (ou === null) return { T: gp, criterio: 'GP espectro' };
  return FACTOR_GP_CONCRETO * gp >= ou ? { T: FACTOR_GP_CONCRETO * gp, criterio: 'GP espectro ×1.2' } : { T: ou, criterio: 'Oumano 2025' };
}

/** Regla adoptada: max(haz estrecho, haz ancho). */
export function transmisionRegla(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): number {
  return Math.max(transmisionEstrecha(nuc, mat, t_cm), transmisionHazAncho(nuc, mat, t_cm).T);
}

/** Inversión por bisección de una transmisión monótona decreciente (t en cm). */
function invertir(T: (t_cm: number) => number, B: number): number {
  if (B >= 1) return 0;
  if (!(B > 0)) return Infinity;
  let lo = 0, hi = 1;
  while (T(hi) > B) {
    hi *= 2;
    if (hi > 1e5) return Infinity;
  }
  for (let i = 0; i < 200 && hi - lo > 1e-10; i++) {
    const m = (lo + hi) / 2;
    if (T(m) > B) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/** Material del catálogo → material GP y factor de espesor (equivalencia másica: ρ_ref/ρ). */
export function materialGPCatalogo(m: Pick<ShieldingMaterial, 'code' | 'density'>): { mat: MaterialGP; escala: number } {
  const rho = m.density > 0 ? m.density : undefined;
  if (m.code === 'PB') return { mat: 'Pb', escala: RHO_REF.Pb / (rho ?? RHO_REF.Pb) };
  if (m.code === 'STEEL') return { mat: 'Fe', escala: RHO_REF.Fe / (rho ?? RHO_REF.Fe) };
  return { mat: 'Concreto', escala: RHO_REF.Concreto / (rho ?? RHO_REF.Concreto) };
}

export interface EspesorTerapia {
  espesor_mm: number;
  rige: CriterioTerapia | null;
  /** Espesor de cada criterio en el material del catálogo (mm). */
  porCriterio: { estrecho_mm: number; hazAncho_mm: number };
  /** mfp de la línea de mayor peso en kerma al espesor resultante (validez GP 0.5–40 mfp). */
  mfpLineaPrincipal: number;
}

/** Espesor (mm) en B = P_efectiva/K por la regla adoptada; mismas unidades en K y P. */
export function espesorTerapiaGP(nuc: NuclidoTerapia, K: number, P_efectiva: number, m: Pick<ShieldingMaterial, 'code' | 'density'>): EspesorTerapia {
  const { mat, escala } = materialGPCatalogo(m);
  if (!(K > P_efectiva)) return { espesor_mm: 0, rige: null, porCriterio: { estrecho_mm: 0, hazAncho_mm: 0 }, mfpLineaPrincipal: 0 };
  const B = P_efectiva / K;
  const ta = invertir((t) => transmisionEstrecha(nuc, mat, t), B);
  const tb = invertir((t) => transmisionHazAncho(nuc, mat, t).T, B);
  const t = Math.max(ta, tb);
  const rige: CriterioTerapia = ta >= tb ? 'haz estrecho' : transmisionHazAncho(nuc, mat, tb).criterio;
  const f = fraccionesKerma(nuc);
  const iMax = f.indexOf(Math.max(...f));
  const linea = ESPECTROS_TERAPIA[nuc].lineas[iMax];
  return {
    espesor_mm: t * 10 * escala,
    rige,
    porCriterio: { estrecho_mm: ta * 10 * escala, hazAncho_mm: tb * 10 * escala },
    mfpLineaPrincipal: linea.muRhoSinCoh[mat] * RHO_REF[mat] * t,
  };
}

/** Modalidades del catálogo con modelo espectral. */
export const MODALIDAD_NUCLIDO_TERAPIA: Record<string, NuclidoTerapia> = { 'radioiodine-i131': 'I131', lu177: 'Lu177' };

/**
 * Nucleido espectral que dimensiona un conjunto de fuentes: sólo si TODAS tienen modelo espectral; con I-131 presente
 * rige I-131 (el más penetrante). Mezclas con otras modalidades siguen el camino anterior.
 */
export function nuclidoTerapiaDe(fuentes: RadiationSource[]): NuclidoTerapia | null {
  if (!fuentes.length) return null;
  const n = fuentes.map((s) => MODALIDAD_NUCLIDO_TERAPIA[s.modality.id]);
  if (n.some((x) => !x)) return null;
  return n.includes('I131') ? 'I131' : 'Lu177';
}

/** Símbolos de las bibliotecas de los diálogos (`nuclearMedicine`, `TherapeuticRadionuclideShielding`). */
export function nuclidoTerapiaDeSimbolo(simbolo: string): NuclidoTerapia | null {
  if (/^I-131/.test(simbolo)) return 'I131';
  if (simbolo === 'Lu-177') return 'Lu177';
  return null;
}

/** Notas de traza para el motor. */
export function notasTerapia(nuc: NuclidoTerapia): string[] {
  const e = ESPECTROS_TERAPIA[nuc];
  return [
    `${e.etiqueta}: espesor = el mayor entre (a) haz estrecho a ${e.E_estrecho_keV.toFixed(1)} keV (µ NIST con coherente) y (b) haz ancho del espectro completo (${e.lineas.length} líneas, ${e.fuente}) con buildup GP de ANSI/ANS-6.4.3 (ORNL/RSIC-49, Tabla 5.1).`,
    e.oumano
      ? 'Concreto y materiales por equivalencia másica: (b) = max(Oumano 2025, 1.2·GP).'
      : 'Sin ajuste publicado de haz ancho (Oumano 2025) para este nucleido: (b) = GP.',
    'Acero → Fe; materiales distintos de Pb/acero por equivalencia másica con concreto 2.35 (conservador para Z alto).',
  ];
}
