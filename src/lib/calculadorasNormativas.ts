/**
 * Fase 7 del motor de dosis: núcleo común de las calculadoras de diálogo.
 *
 * Antes cada diálogo traía su propia tabla de TVL (con HVL usados como TVL y valores de 6 MV diez veces menores que
 * NCRP 151), su propia fórmula de B sin rendimiento K¹, o una "carga" W = GBq × 1000 sin constante gamma. Aquí se
 * reúnen las tres familias de cálculo, todas sobre los módulos normativos ya validados en la Fase 4:
 *
 * - Megavoltaje (NCRP 151, `ncrp151.ts`): primaria (Ec. 2.1), fuga (Ec. 2.8) y dispersión del paciente (Ec. 2.7)
 *   por separado, con TVL₁/TVLₑ (Ec. 2.3, Tablas B.2, B.5a, B.7) y la regla de las dos fuentes (§1.4.3).
 * - Diagnóstico (NCRP 147, `ncrp147.ts`): K = K¹·U·N/d² (Tablas 4.5 y 4.7) y transmisión de Archer
 *   (Tablas B.1 y C.1).
 * - Fuente PET (AAPM TG-108, `tg108.ts`): dosis semanal por paciente con Γ, decaimiento y absorción del paciente
 *   (Ec. 2–3 y 9–10) y transmisión de banda ancha a 511 keV (Tabla V, ajuste de Archer).
 *
 * Unidades: objetivos P y kerma en mSv/semana (≈ mGy/semana); espesores en mm salvo donde el nombre diga _cm.
 */
import {
  combinarDosFuentes, combinarPorTipo, espesorSumaDirecta, fraccionDispersion, kermaDispersion, kermaFuga, kermaPrimaria,
  transmisionTVL, transmisionUnTVL, tvlDispersion, tvlFuga, tvlPrimaria,
  type Componente, type EnergiaMV, type FuenteTeleterapia, type MaterialNCRP151,
} from './ncrp151';
import {
  AJUSTES_TC, ETIQUETAS_NCRP147, TABLA_4_5, TABLA_4_7, TABLA_B_1, TABLA_C_1, espesorArcher, transmisionArcher,
  type Archer, type DistribucionNCRP147, type MaterialNCRP147,
} from './ncrp147';
import { NUCLIDOS_PET, dosisSemanalTG108, type EntradaTG108, type NuclidoPET } from './tg108';
import { NCRP_DESIGN_GOALS } from './ncrpOccupancy';

// ─────────────────────────────────────────────────────────────────────────────
// Objetivos de diseño (NCRP 147 §1.3 / NCRP 151 §1.2): 0.1 mSv/semana controlada, 0.02 no controlada.
// ─────────────────────────────────────────────────────────────────────────────

export const OBJETIVOS_DISENO = [
  { id: 'controlada', P_mSv_semana: NCRP_DESIGN_GOALS.controlled, etiqueta: 'Área controlada (0.1 mSv/semana)' },
  { id: 'no_controlada', P_mSv_semana: NCRP_DESIGN_GOALS.uncontrolled, etiqueta: 'Área no controlada / público (0.02 mSv/semana)' },
] as const;

/** Densidades nominales (g/cm³) de los materiales con datos normativos. Yeso: placa de yeso de NCRP 147 (0.705). */
export const DENSIDAD_G_CM3: Record<string, number> = { lead: 11.35, concrete: 2.35, steel: 7.87, iron: 7.87, gypsum: 0.705 };
export const NOMBRE_MATERIAL: Record<string, string> = {
  lead: 'Plomo', concrete: 'Concreto (2.35 g/cm³)', steel: 'Acero', iron: 'Hierro/acero', gypsum: 'Placa de yeso',
};

// ─────────────────────────────────────────────────────────────────────────────
// Megavoltaje — NCRP 151
// ─────────────────────────────────────────────────────────────────────────────

export const ENERGIAS_MV_TABULADAS = [4, 6, 10, 15, 18, 20, 25, 30] as const;
export const MATERIALES_MV: MaterialNCRP151[] = ['concrete', 'steel', 'lead'];

/** Energía tabulada más cercana por arriba (conservador: TVL mayor). Fuera de 4–30 MV se acota. */
export function energiaTabuladaMV(e: number): EnergiaMV {
  for (const t of ENERGIAS_MV_TABULADAS) if (e <= t + 1e-9) return t;
  return 30;
}

export interface HazMV { energia: EnergiaMV; W_Gy_semana: number; fraccionIMRT?: number; factorIMRT?: number }

export interface EntradaBarreraMV {
  tipo: 'primaria' | 'secundaria';
  /** Una o dos energías (equipo de doble energía, NCRP 151 §7.1). */
  haces: HazMV[];
  material: MaterialNCRP151;
  P_mSv_semana: number;
  T: number;
  /** Factor de uso de la barrera (primaria) o del haz hacia el paciente (dispersión). */
  U: number;
  /** Primaria: blanco → punto protegido (m). Secundaria: isocentro → punto (d_sec, m). */
  d_m: number;
  /** Secundaria: distancia de fuga d_L (m); por omisión d_sec. */
  dL_m?: number;
  /** Secundaria: ángulo de dispersión (°); por omisión 30° (conservador, NCRP 151 §7.1.5). */
  theta_deg?: number;
  /** Secundaria: tamaño de campo en el isocentro (cm²); por omisión 1600 (40 × 40 cm). */
  campo_cm2?: number;
}

export interface ComponenteMV {
  nombre: string;
  tipo: 'primaria' | 'fuga' | 'dispersion';
  energia: EnergiaMV;
  K_mSv_semana: number;
  B_requerida: number;
  espesor_cm: number;
  /** TVL usado por la regla de las dos fuentes (cm). */
  tvl_cm: number;
  transmision: (t_cm: number) => number;
}

export interface ResultadoBarreraMV {
  componentes: ComponenteMV[];
  /** Espesor con la regla de las dos fuentes (§1.4.3), como en los ejemplos del §7.1. */
  espesorDosFuentes_cm: number;
  /** Espesor con Σ Kᵢ·Bᵢ(t)·T = P (suma directa). */
  espesorSumaDirecta_cm: number;
  /** Espesor adoptado: el mayor de los dos (conservador). */
  espesor_cm: number;
  /** Espesor redondeado hacia arriba al paso constructivo del material. */
  espesorRedondeado_cm: number;
  K_sin_blindaje_mSv_semana: number;
  /** Kerma semanal detrás del espesor redondeado (sin T). */
  K_con_blindaje_mSv_semana: number;
  /** T·K detrás del espesor redondeado. */
  dosisOcupacion_mSv_semana: number;
  /** Cumple sólo si T·K ≤ P (NCRP 151 §1.2). */
  cumple: boolean;
  referencia: string;
}

/** Paso de redondeo constructivo: 1 cm concreto, 0.5 cm acero, 1 mm plomo. */
export function redondearEspesorMV(t_cm: number, material: MaterialNCRP151): number {
  const paso = material === 'concrete' ? 1 : material === 'steel' ? 0.5 : 0.1;
  return t_cm <= 0 ? 0 : Math.ceil(t_cm / paso - 1e-9) * paso;
}

const aSv = (mSv: number) => mSv / 1000;

export function barreraMV(e: EntradaBarreraMV): ResultadoBarreraMV {
  if (!e.haces.length) throw new RangeError('Se requiere al menos una energía');
  if (!(e.T > 0 && e.T <= 1)) throw new RangeError('T debe estar en (0, 1]');
  if (!(e.d_m > 0)) throw new RangeError('La distancia debe ser positiva');
  if (!(e.P_mSv_semana > 0)) throw new RangeError('P debe ser positivo');
  const ctx = { P_Sv_semana: aSv(e.P_mSv_semana), T: e.T, material: e.material };
  const componentes: ComponenteMV[] = [];
  const comp = (c: Omit<ComponenteMV, 'B_requerida' | 'espesor_cm'>, espesor: (B: number) => number) => {
    const B = Math.min(1, ctx.P_Sv_semana / (aSv(c.K_mSv_semana) * e.T));
    componentes.push({ ...c, B_requerida: B, espesor_cm: espesor(B) });
  };
  const nTVL = (B: number) => (B >= 1 ? 0 : Math.log10(1 / B));

  for (const h of e.haces) {
    const f: FuenteTeleterapia = h;
    if (e.tipo === 'primaria') {
      const tvl = tvlPrimaria(h.energia, e.material);
      comp({
        nombre: `Primaria ${h.energia} MV`, tipo: 'primaria', energia: h.energia,
        K_mSv_semana: kermaPrimaria(f, e.U, e.d_m) * 1000, tvl_cm: tvl.tvle_cm,
        transmision: (t) => transmisionTVL(t, tvl),
      }, (B) => (B >= 1 ? 0 : nTVL(B) < 1 ? nTVL(B) * tvl.tvl1_cm : tvl.tvl1_cm + (nTVL(B) - 1) * tvl.tvle_cm));
    } else {
      const theta = e.theta_deg ?? 30;
      const tvlS = tvlDispersion(h.energia, e.material, theta);
      comp({
        nombre: `Dispersión del paciente ${h.energia} MV a ${theta}°`, tipo: 'dispersion', energia: h.energia,
        K_mSv_semana: kermaDispersion(f, { U: e.U, dsec_m: e.d_m, theta_deg: theta, campo_cm2: e.campo_cm2 }) * 1000,
        tvl_cm: tvlS, transmision: (t) => transmisionUnTVL(t, tvlS),
      }, (B) => nTVL(B) * tvlS);
      const tvlL = tvlFuga(h.energia, e.material);
      comp({
        nombre: `Fuga del cabezal ${h.energia} MV`, tipo: 'fuga', energia: h.energia,
        K_mSv_semana: kermaFuga(f, e.dL_m ?? e.d_m) * 1000, tvl_cm: tvlL.tvl1_cm,
        transmision: (t) => transmisionTVL(t, tvlL),
      }, (B) => (B >= 1 ? 0 : nTVL(B) < 1 ? nTVL(B) * tvlL.tvl1_cm : tvlL.tvl1_cm + (nTVL(B) - 1) * tvlL.tvle_cm));
    }
  }

  const aComp = (c: ComponenteMV): Componente => ({ espesor_cm: c.espesor_cm, tvl_cm: c.tvl_cm, nombre: c.nombre });
  const dosFuentes = e.tipo === 'primaria'
    ? combinarDosFuentes(componentes.map(aComp))
    : combinarPorTipo([
      componentes.filter((c) => c.tipo === 'dispersion').map(aComp),
      componentes.filter((c) => c.tipo === 'fuga').map(aComp),
    ]);
  const sumaDirecta = espesorSumaDirecta(
    componentes.map((c) => ({ K_Sv_semana: aSv(c.K_mSv_semana), transmision: c.transmision })), ctx.P_Sv_semana, e.T,
  );
  const espesor = Math.max(dosFuentes, sumaDirecta);
  const redondeado = redondearEspesorMV(espesor, e.material);
  const K0 = componentes.reduce((a, c) => a + c.K_mSv_semana, 0);
  const K = componentes.reduce((a, c) => a + c.K_mSv_semana * c.transmision(redondeado), 0);
  return {
    componentes,
    espesorDosFuentes_cm: dosFuentes,
    espesorSumaDirecta_cm: sumaDirecta,
    espesor_cm: espesor,
    espesorRedondeado_cm: redondeado,
    K_sin_blindaje_mSv_semana: K0,
    K_con_blindaje_mSv_semana: K,
    dosisOcupacion_mSv_semana: e.T * K,
    cumple: e.T * K <= e.P_mSv_semana * (1 + 1e-9),
    referencia: e.tipo === 'primaria'
      ? 'NCRP 151 Ec. 2.1 y 2.3, Tabla B.2'
      : 'NCRP 151 Ec. 2.7 y 2.8, Tablas B.4, B.5a y B.7, regla de las dos fuentes (§1.4.3)',
  };
}

export { fraccionDispersion };

// ─────────────────────────────────────────────────────────────────────────────
// Haz único (primaria MV o diagnóstico NCRP 147): kerma sin blindaje y transmisión por material.
// Usado por los optimizadores (Pareto), el blindaje multicapa y el análisis de sensibilidad.
// ─────────────────────────────────────────────────────────────────────────────

export type CargaHaz =
  | { regimen: 'megavoltaje'; energia: EnergiaMV; W_Gy_semana: number; U: number; d_m: number }
  | {
    regimen: 'diagnostico'; distribucion: DistribucionNCRP147; barrera: 'primaria' | 'secundaria';
    N_pacientes_semana: number; U: number; d_m: number; geometria?: 'lateral' | 'frontal';
  };

export const MATERIALES_DIAGNOSTICO: MaterialNCRP147[] = ['lead', 'concrete', 'gypsum'];
export const DISTRIBUCIONES_PRIMARIA = Object.keys(TABLA_4_5) as DistribucionNCRP147[];
export const DISTRIBUCIONES_SECUNDARIA = Object.keys(TABLA_4_7) as DistribucionNCRP147[];
export { ETIQUETAS_NCRP147 };

export function materialesDe(c: CargaHaz): string[] {
  return c.regimen === 'megavoltaje' ? MATERIALES_MV : MATERIALES_DIAGNOSTICO;
}

/** Kerma semanal sin blindaje (mSv/semana): W·U/d² (NCRP 151 Ec. 2.1) o K¹·U·N/d² (NCRP 147 Ec. 4.3/4.4). */
export function kermaSinBlindajeHaz(c: CargaHaz): number {
  if (!(c.d_m > 0)) throw new RangeError('La distancia debe ser positiva');
  if (c.regimen === 'megavoltaje') return kermaPrimaria(c, c.U, c.d_m) * 1000;
  if (c.barrera === 'primaria') {
    const t = TABLA_4_5[c.distribucion];
    if (!t) throw new RangeError(`NCRP 147 Tabla 4.5 no tabula K¹_P para ${ETIQUETAS_NCRP147[c.distribucion]}`);
    return (t.K1P_mGy * c.U * c.N_pacientes_semana) / (c.d_m * c.d_m);
  }
  return (TABLA_4_7[c.distribucion][c.geometria ?? 'lateral'] * c.N_pacientes_semana) / (c.d_m * c.d_m);
}

function ajusteArcher(c: Extract<CargaHaz, { regimen: 'diagnostico' }>, material: string): Archer {
  const tabla = c.barrera === 'primaria' ? TABLA_B_1 : TABLA_C_1;
  const a = tabla[c.distribucion][material as MaterialNCRP147];
  if (!a) throw new RangeError(`Sin ajuste de Archer para ${material}`);
  return a;
}

/** Transmisión de banda ancha de t mm de material. */
export function transmisionHaz(c: CargaHaz, material: string, t_mm: number): number {
  if (c.regimen === 'megavoltaje') return transmisionTVL(t_mm / 10, tvlPrimaria(c.energia, material as MaterialNCRP151));
  return transmisionArcher(t_mm, ajusteArcher(c, material));
}

/** Espesor (mm) que da la transmisión B. */
export function espesorHaz(c: CargaHaz, material: string, B: number): number {
  if (B >= 1) return 0;
  if (c.regimen === 'megavoltaje') {
    const tvl = tvlPrimaria(c.energia, material as MaterialNCRP151);
    const n = Math.log10(1 / B);
    return 10 * (n < 1 ? n * tvl.tvl1_cm : tvl.tvl1_cm + (n - 1) * tvl.tvle_cm);
  }
  return espesorArcher(B, ajusteArcher(c, material));
}

export function referenciaHaz(c: CargaHaz): string {
  if (c.regimen === 'megavoltaje') return 'NCRP 151 Ec. 2.1/2.3, Tabla B.2';
  return c.barrera === 'primaria' ? 'NCRP 147 Ec. 4.3, Tablas 4.5 y B.1' : 'NCRP 147 Ec. 4.4, Tablas 4.7 y C.1';
}

// ─────────────────────────────────────────────────────────────────────────────
// Fuente PET — AAPM TG-108
// ─────────────────────────────────────────────────────────────────────────────

/** TG-108 Tabla V: ajuste de Archer de la transmisión de banda ancha a 511 keV (α, β en cm⁻¹). */
export const TG108_TABLA_V: Record<'lead' | 'concrete' | 'iron', Archer> = {
  lead: { alpha: 1.543, beta: -0.4408, gamma: 2.136 },
  concrete: { alpha: 0.1539, beta: -0.1161, gamma: 2.0752 },
  iron: { alpha: 0.5704, beta: -0.3063, gamma: 0.6326 },
};
export const MATERIALES_PET = ['lead', 'concrete', 'iron'] as const;
export type MaterialPET = (typeof MATERIALES_PET)[number];
export const NUCLIDOS_PET_LISTA = Object.keys(NUCLIDOS_PET) as NuclidoPET[];

const porMm = (a: Archer): Archer => ({ alpha: a.alpha / 10, beta: a.beta / 10, gamma: a.gamma });

export function transmisionPET(material: MaterialPET, t_mm: number): number {
  return transmisionArcher(t_mm, porMm(TG108_TABLA_V[material]));
}

export function espesorPET(material: MaterialPET, B: number): number {
  return espesorArcher(B, porMm(TG108_TABLA_V[material]));
}

export type EntradaPET = EntradaTG108 & { P_mSv_semana: number; T: number };

export interface ResultadoPET {
  /** Dosis semanal sin blindaje (mSv/semana), TG-108 Ec. 2–3 (captación) o 9–10 (imagen). */
  D_mSv_semana: number;
  B_requerida: number;
  espesores_mm: Record<MaterialPET, number>;
  referencia: string;
}

export function blindajePET(e: EntradaPET): ResultadoPET {
  const D = dosisSemanalTG108(e) / 1000;
  const B = Math.min(1, e.P_mSv_semana / (e.T * D));
  const espesores_mm = Object.fromEntries(MATERIALES_PET.map((m) => [m, espesorPET(m, B)])) as Record<MaterialPET, number>;
  return {
    D_mSv_semana: D, B_requerida: B, espesores_mm,
    referencia: e.sala === 'captacion' ? 'AAPM TG-108 Ec. 2–3 y Tabla V' : 'AAPM TG-108 Ec. 9–10 y Tabla V',
  };
}

/** Espesor (mm) para que T·K·B ≤ P con la carga c (B = P/(T·K), Ec. 4.8 / 2.1). */
export function espesorRequeridoHaz(c: CargaHaz, material: string, P_mSv_semana: number, T: number): number {
  if (!(T > 0 && T <= 1)) throw new RangeError('T debe estar en (0, 1]');
  const K = kermaSinBlindajeHaz(c);
  return espesorHaz(c, material, Math.min(1, P_mSv_semana / (T * K)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Tomografía computarizada — NCRP 147 §5.6.1 (método DLP) y Figs. A.2/A.3.
// ─────────────────────────────────────────────────────────────────────────────

/** κ (cm⁻¹) de NCRP 147 §5.6.1: cabeza 9×10⁻⁵; cuerpo 3×10⁻⁴ con el factor 1.2 del DLP de cuerpo (Ec. 5.7). */
export const KAPPA_TC = { cabeza: 9e-5, cuerpo: 1.2 * 3e-4 } as const;

export interface EntradaTC {
  /** Procedimientos por semana y DLP por procedimiento (mGy·cm), por tipo. */
  N_cuerpo: number; DLP_cuerpo_mGy_cm: number;
  N_cabeza: number; DLP_cabeza_mGy_cm: number;
  /** Factor por estudios con y sin contraste (NCRP 147 usa 1.4). */
  factorContraste: number;
  kvp: 120 | 140;
  d_m: number; P_mSv_semana: number; T: number;
}

export interface ResultadoTC {
  K1_cuerpo_mGy: number; K1_cabeza_mGy: number;
  K_mGy_semana: number; B_requerida: number;
  espesores_mm: { lead: number; concrete: number };
}

/** Kerma secundario semanal de TC a d m del isocentro y espesores de plomo y concreto (Figs. A.2/A.3). */
export function blindajeTC(e: EntradaTC): ResultadoTC {
  if (!(e.d_m > 0)) throw new RangeError('La distancia debe ser positiva');
  if (!(e.T > 0 && e.T <= 1)) throw new RangeError('T debe estar en (0, 1]');
  const K1_cuerpo_mGy = KAPPA_TC.cuerpo * e.DLP_cuerpo_mGy_cm * e.factorContraste;
  const K1_cabeza_mGy = KAPPA_TC.cabeza * e.DLP_cabeza_mGy_cm * e.factorContraste;
  const K_mGy_semana = (e.N_cuerpo * K1_cuerpo_mGy + e.N_cabeza * K1_cabeza_mGy) / (e.d_m * e.d_m);
  const B_requerida = K_mGy_semana > 0 ? Math.min(1, e.P_mSv_semana / (e.T * K_mGy_semana)) : 1;
  const t = (m: 'lead' | 'concrete') => (B_requerida >= 1 ? 0 : espesorArcher(B_requerida, AJUSTES_TC[e.kvp][m]));
  return { K1_cuerpo_mGy, K1_cabeza_mGy, K_mGy_semana, B_requerida, espesores_mm: { lead: t('lead'), concrete: t('concrete') } };
}

/** NCRP 147 §5.6.1: 150 de cuerpo (DLP 550) y 30 de cabeza (DLP 1 200), ×1.4, 120 kVp, muro a 3 m, P = 0.02, T = 1. */
export const TC_INICIAL: EntradaTC = {
  N_cuerpo: 150, DLP_cuerpo_mGy_cm: 550, N_cabeza: 30, DLP_cabeza_mGy_cm: 1200, factorContraste: 1.4, kvp: 120,
  d_m: 3, P_mSv_semana: 0.02, T: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// Comparación de materiales (costo, masa, espesor) y frente de Pareto.
// ─────────────────────────────────────────────────────────────────────────────

/** Costos de referencia (USD/kg) para la comparación; son estimaciones editables, no datos normativos. */
export const COSTO_REFERENCIA_USD_KG: Record<string, number> = { lead: 2.5, concrete: 0.05, steel: 0.8, iron: 0.8, gypsum: 0.3 };

export interface OpcionMaterial {
  material: string;
  espesor_mm: number;
  masa_kg: number;
  costo_usd: number;
  /** No dominada en (costo, masa, espesor). */
  pareto: boolean;
  /** Suma ponderada de los tres objetivos normalizados al máximo (menor es mejor). */
  puntaje: number;
}

export function compararMateriales(
  espesores_mm: Record<string, number>, area_m2: number, costos: Record<string, number>,
  pesos: { costo: number; masa: number; espesor: number },
): OpcionMaterial[] {
  const base = Object.entries(espesores_mm).map(([material, espesor_mm]) => {
    const masa_kg = (espesor_mm / 1000) * area_m2 * DENSIDAD_G_CM3[material] * 1000;
    return { material, espesor_mm, masa_kg, costo_usd: masa_kg * (costos[material] ?? 0) };
  });
  const max = (k: 'espesor_mm' | 'masa_kg' | 'costo_usd') => Math.max(...base.map((b) => b[k]), 1e-12);
  const [mc, mm, me] = [max('costo_usd'), max('masa_kg'), max('espesor_mm')];
  const domina = (a: typeof base[number], b: typeof base[number]) =>
    a.costo_usd <= b.costo_usd && a.masa_kg <= b.masa_kg && a.espesor_mm <= b.espesor_mm
    && (a.costo_usd < b.costo_usd || a.masa_kg < b.masa_kg || a.espesor_mm < b.espesor_mm);
  return base
    .map((b) => ({
      ...b,
      pareto: !base.some((o) => o !== b && domina(o, b)),
      puntaje: pesos.costo * b.costo_usd / mc + pesos.masa * b.masa_kg / mm + pesos.espesor * b.espesor_mm / me,
    }))
    .sort((a, b) => a.puntaje - b.puntaje);
}

// ─────────────────────────────────────────────────────────────────────────────
// Barrera multicapa: B_total = Π Bᵢ(tᵢ), cada capa con su curva de banda ancha (NCRP 151 §2.1 para barreras
// laminadas con TVL por material; en NCRP 147 la aproximación es conservadora porque el endurecimiento del haz en
// la primera capa reduce la transmisión de las siguientes).
// ─────────────────────────────────────────────────────────────────────────────

export interface CapaMulticapa { material: string; espesor_mm: number }

export interface ResultadoMulticapa {
  capas: (CapaMulticapa & { transmision: number; masa_kg: number })[];
  B_total: number;
  K_sin_blindaje_mSv_semana: number;
  K_con_blindaje_mSv_semana: number;
  dosisOcupacion_mSv_semana: number;
  cumple: boolean;
  /** Espesor de plomo con la misma transmisión total (mm). */
  equivalentePlomo_mm: number;
  masaTotal_kg: number;
  espesorTotal_mm: number;
}

export function blindajeMulticapa(c: CargaHaz, capas: CapaMulticapa[], P_mSv_semana: number, T: number, area_m2: number): ResultadoMulticapa {
  const K0 = kermaSinBlindajeHaz(c);
  const det = capas.map((l) => ({
    ...l,
    transmision: transmisionHaz(c, l.material, Math.max(0, l.espesor_mm)),
    masa_kg: (Math.max(0, l.espesor_mm) / 1000) * area_m2 * DENSIDAD_G_CM3[l.material] * 1000,
  }));
  const B = det.reduce((a, l) => a * l.transmision, 1);
  const K = K0 * B;
  return {
    capas: det, B_total: B, K_sin_blindaje_mSv_semana: K0, K_con_blindaje_mSv_semana: K, dosisOcupacion_mSv_semana: T * K,
    cumple: T * K <= P_mSv_semana * (1 + 1e-9),
    equivalentePlomo_mm: espesorHaz(c, 'lead', B),
    masaTotal_kg: det.reduce((a, l) => a + l.masa_kg, 0),
    espesorTotal_mm: det.reduce((a, l) => a + Math.max(0, l.espesor_mm), 0),
  };
}

// Valores iniciales de los diálogos (ejemplos publicados).
/** NCRP 151 §7.1.1: 18 MV, W = 450 Gy/semana, U = 0.25, d = 7.2 m. */
export const CARGA_MV_INICIAL: CargaHaz = { regimen: 'megavoltaje', energia: 18, W_Gy_semana: 450, U: 0.25, d_m: 7.2 };
/** NCRP 147 §5.3.3.1: Rad Room (chest bucky), N = 125, U = 1, d = 2.5 m. */
export const CARGA_DIAG_INICIAL: CargaHaz = {
  regimen: 'diagnostico', distribucion: 'rad_room_chest_bucky', barrera: 'primaria', N_pacientes_semana: 125, U: 1, d_m: 2.5,
};
/** TG-108 Ejemplo 1: 555 MBq de F-18, 40 pacientes/semana, 1 h de captación, punto a 4 m, no controlada, T = 1. */
export const PET_INICIAL: EntradaPET = {
  nuclido: 'F18', A0_MBq: 555, pacientesSemana: 40, tU_h: 1, tI_h: 0.5, sala: 'captacion', d_m: 4, P_mSv_semana: 0.02, T: 1,
};
