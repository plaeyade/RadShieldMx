/**
 * NCRP Report No. 151 §2.4 — laberinto y puerta de salas de teleterapia.
 *
 * Fotones (≤10 MV y componente fotónica en >10 MV): Ec. 2.9 a 2.14 (McGinley y James, 1997).
 * Alta energía (>10 MV): rayos gamma de captura (Ec. 2.15–2.17, McGinley et al., 1995) y
 * neutrones (Kersey, Ec. 2.18; Wu y McGinley, Ec. 2.19–2.21). Puerta: §2.4.3 y ejemplo §7.1.13.
 * Datos: Tabla B.8a (albedo del concreto, incidencia normal) y Tabla B.9 (Q_n y H₀).
 */
import { fraccionDispersion, type EnergiaMV } from '@/lib/ncrp151';

/** Tabla B.8a — albedo diferencial del concreto, incidencia normal (×10⁻³), ángulos 0/30/45/60/75°. */
export const ANGULOS_B_8A = [0, 30, 45, 60, 75] as const;
export const TABLA_B_8A: Record<string, number[]> = {
  '30': [3.0, 2.7, 2.6, 2.2, 1.5],
  '24': [3.2, 3.2, 2.8, 2.3, 1.5],
  '18': [3.4, 3.4, 3.0, 2.5, 1.6],
  '10': [4.3, 4.1, 3.8, 3.1, 2.1],
  '6': [5.3, 5.2, 4.7, 4.0, 2.7],
  '4': [6.7, 6.4, 5.8, 4.9, 3.1],
  Co60: [7.0, 6.5, 6.0, 5.5, 3.8],
  '0.5MeV': [19.0, 17.0, 15.0, 13.0, 8.0],
  '0.25MeV': [32.0, 28.0, 25.0, 22.0, 13.0],
};

/** Albedo del concreto (incidencia normal) a un ángulo de reflexión; ángulo inferior de la tabla. */
export function albedoConcreto(fuente: string, angulo_deg = 0): number {
  const fila = TABLA_B_8A[fuente];
  if (!fila) throw new RangeError(`Tabla B.8a no tiene la fuente ${fuente}`);
  let i = 0;
  ANGULOS_B_8A.forEach((a, k) => { if (a <= angulo_deg) i = k; });
  return fila[i] * 1e-3;
}

/** Tabla B.9 — Q_n (neutrones por Gy en el isocentro) y H₀ (mSv/Gy a 1.41 m), máximos por modelo. */
export const TABLA_B_9: { fabricante: string; modelo: string; mv: number; Qn: number; H0_mSv_Gy?: number }[] = [
  { fabricante: 'Varian', modelo: '1800', mv: 18, Qn: 1.22e12, H0_mSv_Gy: 1.6 },
  { fabricante: 'Varian', modelo: '1800', mv: 15, Qn: 0.76e12, H0_mSv_Gy: 1.3 },
  { fabricante: 'Varian', modelo: '1800', mv: 10, Qn: 0.06e12, H0_mSv_Gy: 0.04 },
  { fabricante: 'Varian', modelo: '2100C', mv: 18, Qn: 0.96e12 },
  { fabricante: 'Varian', modelo: '2300CD', mv: 18, Qn: 0.95e12 },
  { fabricante: 'Varian', modelo: '2500', mv: 24, Qn: 0.77e12 },
  { fabricante: 'Siemens', modelo: 'KD', mv: 20, Qn: 0.92e12, H0_mSv_Gy: 1.24 },
  { fabricante: 'Siemens', modelo: 'KD', mv: 18, Qn: 0.88e12 },
  { fabricante: 'Siemens', modelo: 'MD', mv: 15, Qn: 0.2e12, H0_mSv_Gy: 0.17 },
  { fabricante: 'Siemens', modelo: 'MD2', mv: 10, Qn: 0.08e12 },
  { fabricante: 'Siemens', modelo: 'Primus', mv: 15, Qn: 0.21e12 },
  { fabricante: 'Siemens', modelo: 'Primus', mv: 10, Qn: 0.02e12 },
  { fabricante: 'Philips/Elekta', modelo: 'SL25', mv: 25, Qn: 2.37e12, H0_mSv_Gy: 2.0 },
  { fabricante: 'Philips/Elekta', modelo: 'SL20', mv: 20, Qn: 0.69e12, H0_mSv_Gy: 0.44 },
  { fabricante: 'Philips/Elekta', modelo: 'SL20/SL25', mv: 18, Qn: 0.46e12 },
  { fabricante: 'GE', modelo: 'Saturne 41', mv: 15, Qn: 0.47e12, H0_mSv_Gy: 0.32 },
  { fabricante: 'GE', modelo: 'Saturne 43', mv: 18, Qn: 1.50e12, H0_mSv_Gy: 0.55 },
  { fabricante: 'GE', modelo: 'Saturne 43', mv: 25, Qn: 2.4e12, H0_mSv_Gy: 1.38 },
];

/** Sin datos del fabricante: el máximo de la Tabla B.9 para esa energía nominal (conservador). */
export function fuenteNeutronesConservadora(mv: number): { Qn: number; H0_mSv_Gy: number; nota: string } {
  const filas = TABLA_B_9.filter((f) => f.mv === mv);
  if (!filas.length) throw new RangeError(`Tabla B.9 no tiene equipos de ${mv} MV`);
  const Qn = Math.max(...filas.map((f) => f.Qn));
  const H0 = Math.max(...filas.map((f) => f.H0_mSv_Gy ?? 0));
  return { Qn, H0_mSv_Gy: H0, nota: `Máximo de la Tabla B.9 para ${mv} MV; sustituir por el dato del fabricante.` };
}

// ── Fotones en la puerta (Ec. 2.9–2.14) ──────────────────────────────────────────────────────

export interface GeometriaLaberinto {
  /** Ec. 2.9: blanco → primera superficie (d_h = d_pp + 1 m), centro del haz → punto b (d_r), b → puerta (d_z). */
  dh_m: number; dr_m: number; dz_m: number;
  /** Área del haz en la primera superficie A₀ y sección de la entrada interior proyectada A_z (m²). */
  A0_m2: number; Az_m2: number;
  /** Ec. 2.10–2.11: blanco → muro G en la línea del laberinto (d_sec), longitud del laberinto (d_zz), área A₁ vista desde la puerta. */
  dsec_m: number; dzz_m: number; A1_m2: number;
  /** Ec. 2.12: blanco → centro de la puerta a través del muro interior (d_L) y transmisión de ese muro (B). */
  dL_m: number; B_muroZ: number;
  dsca_m?: number;
}

export interface CargaLaberinto {
  energia: EnergiaMV;
  W_Gy_semana: number;
  WL_Gy_semana: number;
  UG?: number;            // factor de uso hacia el muro G (0.25)
  campo_cm2?: number;     // F (1600 = 40 × 40)
  f?: number;             // fracción transmitida por el paciente (~0.25 para 6–10 MV)
  Lf?: number;            // fracción de fuga (10⁻³)
  alfa0?: number; alfaZ?: number; alfa1Fuga?: number; alfa1Paciente?: number;
}

export interface FotonesPuerta { HS: number; HLS: number; Hps: number; HLT: number; HG: number; HTot: number }

/** Componentes en Sv/semana con el haz hacia el muro G; H_Tot = 2.64·H_G (Ec. 2.14). */
export function fotonesEnPuerta(g: GeometriaLaberinto, c: CargaLaberinto): FotonesPuerta {
  const UG = c.UG ?? 0.25;
  const F = c.campo_cm2 ?? 1600;
  const Lf = c.Lf ?? 1e-3;
  const f = c.f ?? 0.25;
  const e = String(c.energia);
  const alfa0 = c.alfa0 ?? albedoConcreto(e, 0);
  const alfaZ = c.alfaZ ?? albedoConcreto('0.5MeV', 0);           // §2.4.1: 0.5 MeV en la segunda reflexión
  const alfa1F = c.alfa1Fuga ?? albedoConcreto(Number(c.energia) >= 10 ? '10' : '6', 0); // 1.4–1.5 MeV ≈ fila de 6–10 MV
  const alfa1P = c.alfa1Paciente ?? albedoConcreto('0.5MeV', 0);  // §2.4.1: 0.5 MeV, conservador
  const HS = (c.W_Gy_semana * UG * alfa0 * g.A0_m2 * alfaZ * g.Az_m2) / (g.dh_m * g.dr_m * g.dz_m) ** 2;
  const HLS = (Lf * c.WL_Gy_semana * UG * alfa1F * g.A1_m2) / (g.dsec_m * g.dzz_m) ** 2;
  const a = fraccionDispersion(c.energia, 45);
  const Hps = (a * c.W_Gy_semana * UG * (F / 400) * alfa1P * g.A1_m2) / ((g.dsca_m ?? 1) * g.dsec_m * g.dzz_m) ** 2;
  const HLT = (Lf * c.WL_Gy_semana * UG * g.B_muroZ) / (g.dL_m * g.dL_m);
  const HG = f * HS + HLS + Hps + HLT;
  return { HS, HLS, Hps, HLT, HG, HTot: 2.64 * HG };
}

/** Ec. 2.14 a partir de componentes ya calculados (útil para verificar contra el informe). */
export function totalFotones(f: number, HS: number, HLS: number, Hps: number, HLT: number): number {
  return 2.64 * (f * HS + HLS + Hps + HLT);
}

// ── Alta energía (>10 MV) ────────────────────────────────────────────────────────────────────

export interface SalaNeutrones {
  Qn: number;              // neutrones por Gy en el isocentro (Tabla B.9)
  beta?: number;           // 1 cabezal de plomo, 0.85 tungsteno
  d1_m: number;            // isocentro → punto A (entrada interior)
  d2_m: number;            // A → puerta a lo largo del laberinto
  Sr_m2: number;           // superficie total de la sala
  S0_m2: number;           // sección de la entrada interior
  S1_m2: number;           // sección a lo largo del laberinto
  H0_mSv_Gy?: number;      // Tabla B.9, para Kersey
}

/** Ec. 2.16: fluencia total en A por Gy en el isocentro (m⁻²·Gy⁻¹). */
export function fluenciaA(s: SalaNeutrones): number {
  const b = s.beta ?? 1;
  return (b * s.Qn) / (4 * Math.PI * s.d1_m ** 2) + (5.4 * b * s.Qn) / (2 * Math.PI * s.Sr_m2) + (1.3 * s.Qn) / (2 * Math.PI * s.Sr_m2);
}

/** Ec. 2.15: rayos gamma de captura en la puerta por Gy (Sv/Gy); TVD 5.4 m (18–25 MV) o 3.9 m (15 MV). */
export function capturaGammaPorGy(s: SalaNeutrones, mv: number): number {
  const TVD = mv <= 15 ? 3.9 : 5.4;
  return 6.9e-16 * fluenciaA(s) * 10 ** (-s.d2_m / TVD);
}

/** Ec. 2.18 (Kersey, TVD 5 m): neutrones en la puerta por Gy (Sv/Gy). */
export function neutronesKersey(s: SalaNeutrones): number {
  if (!s.H0_mSv_Gy) throw new RangeError('Kersey requiere H₀ (Tabla B.9)');
  return s.H0_mSv_Gy * 1e-3 * (s.S0_m2 / s.S1_m2) * (1.41 / s.d1_m) ** 2 * 10 ** (-s.d2_m / 5);
}

/** Ec. 2.19–2.20 (Wu y McGinley): neutrones en la puerta por Gy (Sv/Gy). */
export function neutronesWuMcGinley(s: SalaNeutrones): number {
  const TVD = 2.06 * Math.sqrt(s.S1_m2);
  return 2.4e-15 * fluenciaA(s) * Math.sqrt(s.S0_m2 / s.S1_m2) * (1.64 * 10 ** (-s.d2_m / 1.9) + 10 ** (-s.d2_m / TVD));
}

// ── Puerta (§2.4.3, ejemplo §7.1.13) ─────────────────────────────────────────────────────────

export const TVL_PUERTA = {
  bpe_neutrones_mm: 45,      // polietileno borado 5 %, §2.4.3 (conservador)
  plomo_captura_mm: 61,      // rayos gamma de captura, NCRP 1984
  plomo_dispersos_mm: 6,     // fotones dispersos ≤10 MV: 3–6 mm según el laberinto (McGinley 2002); se toma 6
} as const;

export interface ResultadoPuerta {
  H_neutrones_Sv: number; H_captura_Sv: number; H_fotones_Sv: number; H_total_Sv: number;
  bpe_mm: number; plomo_mm: number; notas: string[];
}

/**
 * Puerta: como en §7.1.13, cada componente se lleva por separado a P/2 cuando hay neutrones
 * (el plomo es casi transparente a neutrones y el BPE atenúa poco la captura). Con ≤10 MV sólo
 * fotones dispersos y de fuga, llevados a P.
 */
export function puerta(P_Sv_semana: number, H: { neutrones?: number; captura?: number; fotones: number }): ResultadoPuerta {
  const notas: string[] = [];
  const Hn = H.neutrones ?? 0;
  const Hc = H.captura ?? 0;
  const Hf = H.fotones;
  const n = (h: number, meta: number) => (h > meta ? Math.log10(h / meta) : 0);
  let bpe = 0, plomo = 0;
  if (Hn > 0 || Hc > 0) {
    bpe = n(Hn, P_Sv_semana / 2) * TVL_PUERTA.bpe_neutrones_mm;
    plomo = n(Hc, P_Sv_semana / 2) * TVL_PUERTA.plomo_captura_mm;
    notas.push('>10 MV: neutrones con BPE y captura con plomo, cada uno a P/2 (§7.1.13). La captura (3.6 MeV) domina sobre los fotones dispersos.');
  } else {
    plomo = n(Hf, P_Sv_semana) * TVL_PUERTA.plomo_dispersos_mm;
    notas.push('≤10 MV: plomo para fotones dispersos con TVL de 6 mm (conservador; 3–6 mm según el laberinto).');
  }
  return { H_neutrones_Sv: Hn, H_captura_Sv: Hc, H_fotones_Sv: Hf, H_total_Sv: Hn + Hc + Hf, bpe_mm: bpe, plomo_mm: plomo, notas };
}
