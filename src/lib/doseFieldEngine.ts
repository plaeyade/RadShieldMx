/**
 * Motor de campo de dosis — fuente única para «dosis en un punto» y mallas de dosis (Fases 1 y 2).
 *
 * K(P) = Σ_fuentes Σ_componentes K₀,c(fuente, P) · Π_barreras B_c(recorrido)
 *
 * Componentes (Fase 2, docs/plan-motores-calculo.md). Las expresiones de K₀ y de TVL viven en
 * `ncrp151.ts`, `normativeBarrierEngine.ts` y `shieldingMath.ts`; aquí no se duplican fórmulas:
 * - Teleterapia NCRP 151 (`linac-*`, `tele-co60*`), W = fracciones × Gy/fracción (`fuenteTeleterapiaDe`):
 *     · primaria  W·U/d² (Ec. 2.1), TVL₁/TVLₑ de la Tabla B.2, sólo donde llega el haz (ver abajo);
 *     · fuga      10⁻³·W_L/d² (Ec. 2.8; W_L con IMRT, Ec. 3.6 vía `cargaFuga`), Tabla B.7 en concreto;
 *     · dispersión del paciente a(θ)·W·U·(F/400)/(d_sca²·d²) (Ec. 2.7, Tabla B.4), un TVL de la Tabla B.5a.
 *   En el campo las componentes se SUMAN (cálculo directo); la regla de las dos fuentes (§1.4.3) es una
 *   aproximación de diseño del espesor y sólo la usa `normativeBarrierEngine`. Las pruebas comprueban que
 *   el campo detrás del espesor así calculado queda ≤ P/T.
 * - Diagnóstico con distribución TG9 (NCRP 147): primaria K¹_P·U·N/d² (Tabla 4.5, Archer B.1) donde llega
 *   el haz y secundaria K¹_sec·N/d² (Tabla 4.7, 135°, Archer C.1) en todo el plano (`terminoNCRP147`).
 *   Preblindaje de la Tabla 4.6 opcional (`preblindaje`), sin acreditar por omisión como el motor normativo.
 * - Resto (TC κ, medicina nuclear TG-108 por paciente, braquiterapia, ciclotrón…): K₀ único de
 *   `calculateUnshieldedKerma` y la transmisión de la Fase 1 (`transmisionCapa`).
 *
 * ¿Dónde llega la primaria? Con `ejeGantry_deg` en la fuente, en la franja que barre el haz al girar el
 * gantry: |desplazamiento a lo largo del eje| ≤ 0.283·(distancia en el plano del haz + SAD 1 m) (semidiagonal
 * del campo máximo 40×40 cm en el isocentro). Sin orientación (lo habitual en el lienzo): en los rayos que
 * cruzan una barrera declarada primaria y en los que no cruzan ninguna (interior de la sala, conservador);
 * no tras barreras sólo secundarias, igual que el cálculo por barrera.
 *
 * Geometría de la barrera: banda de espesor t desde la línea dibujada (cara interior) hacia el lado
 * opuesto a las fuentes, la misma convención de `generateSamplePoints`. El recorrido es la cuerda real del
 * rayo dentro de la banda (t / cos θ si la cruza entera; menos si el punto está dentro del muro o el rayo
 * corta una esquina). En barreras laminadas la cuerda se reparte en proporción al espesor de cada capa.
 *
 * Incidencia oblicua:
 * - Primaria y fuga NCRP 151: espesor oblicuo, con la corrección del §2.4 (θ > 45° y B < 10⁻³: +1 HVL en MV,
 *   +2 HVL en Co-60; `correccionOblicuidad`) y sin crédito adicional más allá de 70° (límite de los datos de
 *   Kirn/Biggs).
 * - Dispersión del paciente: espesor normal, sin crédito por oblicuidad. NCRP 151 no da un criterio único
 *   (sus ejemplos se contradicen) y los TVL de la Tabla B.5a ya son de haz ancho: conservador.
 * - Diagnóstico y resto: espesor oblicuo con crédito limitado a θ ≤ 60° (como en la Fase 1).
 *
 * Herramienta de diseño preliminar: no sustituye la revisión de un experto calificado.
 */
import type { CTIsodosisProfile } from '@/types/ctIsodosis';
import { MATERIALS, type Barrier, type RadiationSource, type ShieldingMaterial } from '@/types/radshield';
import {
  archerTransmission,
  calculateUnshieldedKerma,
  clampTransmission,
  getShieldingEnergyKey,
  heatmapGridPoints,
  tvlTransmission,
} from '@/lib/shieldingMath';
import { PREBLINDAJE_MM, TABLA_B_1, TABLA_C_1, transmisionArcher, type Archer, type MaterialNCRP147 } from '@/lib/ncrp147';
import {
  OBLICUIDAD_MAX_DATOS_DEG,
  TABLA_B_2,
  TABLA_B_7,
  correccionOblicuidad,
  energiaDesdeClave,
  kermaDispersion,
  kermaFuga,
  kermaPrimaria,
  transmisionTVL,
  transmisionUnTVL,
  tvlDispersion,
  tvlFuga,
  tvlPrimaria,
  type EnergiaMV,
  type FuenteTeleterapia,
} from '@/lib/ncrp151';
import {
  DISTRIBUCION_POR_MODALIDAD,
  LINAC,
  MATERIALES_NCRP151,
  distancia,
  fuenteTeleterapiaDe,
  material147,
  material151,
  terminoNCRP147,
} from '@/lib/normativeBarrierEngine';

/** Ángulo máximo de oblicuidad acreditado fuera de NCRP 151 (crédito máximo 1/cos 60° = ×2). */
export const ANGULO_MAX_OBLICUIDAD_DEG = 60;
/** Semidiagonal del campo máximo (40 × 40 cm) a 1 m del blanco: tan del semiángulo del haz primario. */
export const SEMIDIAGONAL_CAMPO_MAX = 0.2 * Math.SQRT2;
/** Distancia blanco–isocentro (SAD) de los aceleradores, m. */
export const SAD_M = 1;
/** Ángulo de dispersión del paciente por omisión (como `normativeBarrierEngine`; conservador). */
export const ANGULO_DISPERSION_DEG = 30;

export type ComponenteCampo = 'primaria' | 'fuga' | 'dispersion' | 'primaria147' | 'secundaria147' | 'kermaUnico';

export type MetodoTransmision =
  | 'NCRP151_TVL1_TVLe'
  | 'NCRP151_UN_TVL'
  | 'NCRP147_ARCHER'
  | 'ARCHER_MATERIAL'
  | 'TVL_MATERIAL'
  | 'SIN_MATERIAL';

export interface CapaBlindaje { materialCode: string; thickness_mm: number }

export interface CapaCruzada extends CapaBlindaje {
  recorrido_mm: number;
  transmision: number;
  metodo: MetodoTransmision;
}

export interface CruceBarrera {
  barrierId: string;
  cosTheta: number;
  /** Recorrido acreditado / espesor de la barrera (1/cos θ si la cruza entera, con el tope que aplique). */
  factorOblicuidad: number;
  capas: CapaCruzada[];
  transmision: number;
  /** HVL descontados por la corrección de oblicuidad de NCRP 151 §2.4 (0, 1 o 2). */
  hvlDescontados: number;
}

export interface ContribucionComponente {
  componente: ComponenteCampo;
  kermaSinBlindaje_mSv_semana: number;
  transmision: number;
  kerma_mSv_semana: number;
  cruces: CruceBarrera[];
}

export interface ContribucionFuente {
  sourceId: string;
  kermaSinBlindaje_mSv_semana: number;
  /** Transmisión efectiva (kerma / kerma sin blindaje) sumadas las componentes. */
  transmision: number;
  kerma_mSv_semana: number;
  /** Cruces de la primera componente (la primaria cuando existe). */
  cruces: CruceBarrera[];
  componentes: ContribucionComponente[];
}

export interface DosisEnPunto {
  kerma_mSv_semana: number;
  kermaSinBlindaje_mSv_semana: number;
  porFuente: ContribucionFuente[];
}

export interface OpcionesCampoDosis {
  /** Barreras del plano (coordenadas en px). Sin barreras el campo es el kerma sin blindaje. */
  barriers?: Barrier[];
  /** Catálogo de materiales; por omisión `MATERIALS`. */
  materials?: ShieldingMaterial[];
  ctIsodosisProfile?: CTIsodosisProfile;
  /** Tope de oblicuidad fuera de NCRP 151 (por omisión 60°). */
  anguloMaxOblicuidad_deg?: number;
  /** NCRP 147 Tabla 4.6: preblindaje del receptor acreditado a la primaria diagnóstica (por omisión, ninguno). */
  preblindaje?: keyof typeof PREBLINDAJE_MM;
}

export interface PuntoMallaDosis {
  x: number;
  y: number;
  /** Kerma con barreras (mGy ≈ mSv por semana). */
  kerma: number;
  kermaSinBlindaje: number;
}

const EPS = 1e-9;
const RAD = Math.PI / 180;

function positivo(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function fraccion(v: unknown): number | undefined {
  return typeof v === 'number' && v > 0 && v <= 1 ? v : undefined;
}

/**
 * Capas instaladas de una barrera, en este orden de prioridad:
 * `shieldingLayers` (preset laminado) → `thickness_mm` (espesor capturado) →
 * `requiredThickness_mm` del material seleccionado (resultado del cálculo). Sin espesor: sin capas.
 */
export function capasDeBarrera(barrier: Barrier): CapaBlindaje[] {
  const capas = (barrier.shieldingLayers ?? []).filter((c) => c.materialCode && positivo(c.thickness_mm));
  if (capas.length) return capas.map((c) => ({ materialCode: c.materialCode, thickness_mm: c.thickness_mm }));
  if (positivo(barrier.thickness_mm)) return [{ materialCode: barrier.materialCode, thickness_mm: barrier.thickness_mm }];
  const req = barrier.requiredThickness_mm;
  const t = typeof req === 'number' ? req : req?.[barrier.materialCode];
  return positivo(t) ? [{ materialCode: barrier.materialCode, thickness_mm: t }] : [];
}

/**
 * Cruce del segmento A→B (fuente → punto) con la línea de la barrera. Devuelve |cos θ| del rayo respecto
 * de la normal de la barrera, o null si no la cruza. Los extremos del rayo no cuentan como cruce.
 */
export function cruceSegmentoBarrera(
  ax: number, ay: number, bx: number, by: number, barrier: Pick<Barrier, 'x1' | 'y1' | 'x2' | 'y2'>,
): { t: number; cosTheta: number } | null {
  const rx = bx - ax, ry = by - ay;
  const sx = barrier.x2 - barrier.x1, sy = barrier.y2 - barrier.y1;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < EPS) return null; // paralelos o degenerados
  const qx = barrier.x1 - ax, qy = barrier.y1 - ay;
  const t = (qx * sy - qy * sx) / den; // posición sobre el rayo
  const u = (qx * ry - qy * rx) / den; // posición sobre la barrera
  if (t <= EPS || t >= 1 - EPS || u < -EPS || u > 1 + EPS) return null;
  const lr = Math.hypot(rx, ry), ls = Math.hypot(sx, sy);
  const cosTheta = Math.abs(den) / (lr * ls); // |r × s| / (|r||s|) = |cos| respecto de la normal
  return { t, cosTheta };
}

/**
 * Normal unitaria de la barrera hacia el lado protegido: opuesta al centroide de las fuentes
 * (misma regla que `generateSamplePoints`).
 */
export function normalProtegida(
  barrier: Pick<Barrier, 'x1' | 'y1' | 'x2' | 'y2'>, centro?: { x: number; y: number },
): { nx: number; ny: number } {
  const dx = barrier.x2 - barrier.x1, dy = barrier.y2 - barrier.y1;
  const L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L, ny = dx / L;
  if (centro) {
    const mx = (barrier.x1 + barrier.x2) / 2, my = (barrier.y1 + barrier.y2) / 2;
    if ((centro.x - mx) * nx + (centro.y - my) * ny > 0) { nx = -nx; ny = -ny; }
  }
  return { nx, ny };
}

/**
 * Cuerda del segmento A→B dentro de la banda de la barrera (0 ≤ u ≤ L a lo largo, 0 ≤ v ≤ espesor hacia
 * la normal protegida), en las unidades del lienzo. Recorte paramétrico de Liang–Barsky. null si no entra.
 */
export function cuerdaEnBarrera(
  ax: number, ay: number, bx: number, by: number,
  barrier: Pick<Barrier, 'x1' | 'y1' | 'x2' | 'y2'>,
  espesor_px: number,
  normal: { nx: number; ny: number },
): { t0: number; t1: number; cuerda: number; profundidad: number } | null {
  const sx = barrier.x2 - barrier.x1, sy = barrier.y2 - barrier.y1;
  const L = Math.hypot(sx, sy);
  if (!(L > EPS) || !(espesor_px > 0)) return null;
  const ux = sx / L, uy = sy / L;
  const qx = ax - barrier.x1, qy = ay - barrier.y1;
  const rx = bx - ax, ry = by - ay;
  const u0 = qx * ux + qy * uy, du = rx * ux + ry * uy;
  const v0 = qx * normal.nx + qy * normal.ny, dv = rx * normal.nx + ry * normal.ny;
  let t0 = 0, t1 = 1;
  const recorta = (p: number, q: number): boolean => {
    if (Math.abs(p) < EPS) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  if (!recorta(-du, u0) || !recorta(du, L - u0) || !recorta(-dv, v0) || !recorta(dv, espesor_px - v0)) return null;
  if (t1 - t0 <= EPS) return null;
  return { t0, t1, cuerda: (t1 - t0) * Math.hypot(rx, ry), profundidad: (t1 - t0) * Math.abs(dv) };
}

/** ¿Está el punto en la franja que barre el haz primario? null si la fuente no trae `ejeGantry_deg`. */
export function enHazPrimario(source: RadiationSource, x: number, y: number, scale_m_per_pixel: number): boolean | null {
  if (typeof source.ejeGantry_deg !== 'number' || !Number.isFinite(source.ejeGantry_deg)) return null;
  const ax = Math.cos(source.ejeGantry_deg * RAD), ay = Math.sin(source.ejeGantry_deg * RAD);
  const dx = (x - source.x) * scale_m_per_pixel, dy = (y - source.y) * scale_m_per_pixel;
  const aLoLargo = Math.abs(dx * ax + dy * ay);
  const enPlano = Math.abs(dx * ay - dy * ax);
  return aLoLargo <= SEMIDIAGONAL_CAMPO_MAX * (enPlano + SAD_M) + EPS;
}

/** Transmisión de una capa con el modelo de la Fase 1 (K₀ único): se conserva para el resto de modalidades. */
export function transmisionCapa(
  source: RadiationSource,
  barrierType: Barrier['barrierType'],
  material: ShieldingMaterial | undefined,
  recorrido_mm: number,
): { transmision: number; metodo: MetodoTransmision } {
  if (!(recorrido_mm > 0)) return { transmision: 1, metodo: 'TVL_MATERIAL' };
  if (!material) return { transmision: 1, metodo: 'SIN_MATERIAL' };
  const mod = source.modality;
  const esPrimaria = barrierType === 'primary';

  if (LINAC.test(mod.id) && (MATERIALES_NCRP151 as readonly string[]).includes(material.code)) {
    const e = energiaDesdeClave(getShieldingEnergyKey(source));
    if (e) {
      const { mat, escala } = material151(material);
      const tvl = esPrimaria || mat !== 'concrete' ? TABLA_B_2[mat][String(e)] : TABLA_B_7[String(e)];
      if (tvl) {
        // espesor real = espesor de concreto equivalente × escala  ⇒  concreto equivalente = real / escala
        return { transmision: clampTransmission(transmisionTVL(recorrido_mm / 10 / escala, tvl)), metodo: 'NCRP151_TVL1_TVLe' };
      }
    }
  }

  if (mod.category === 'diagnostic') {
    const dist = DISTRIBUCION_POR_MODALIDAD[mod.id];
    const mat = material147(material);
    if (dist && mat) {
      const ajuste = esPrimaria && dist.primaria ? TABLA_B_1[dist.primaria][mat] : TABLA_C_1[dist.secundaria][mat];
      return { transmision: clampTransmission(transmisionArcher(recorrido_mm, ajuste)), metodo: 'NCRP147_ARCHER' };
    }
    return { transmision: archerTransmission(recorrido_mm, material, 0), metodo: 'ARCHER_MATERIAL' };
  }

  return { transmision: tvlTransmission(recorrido_mm, material, getShieldingEnergyKey(source)), metodo: 'TVL_MATERIAL' };
}

/** Barrera cruzada por un rayo: geometría común a todas las componentes. */
interface CruceGeometrico {
  barrier: Barrier;
  capas: CapaBlindaje[];
  espesor_mm: number;
  cosTheta: number;
  /** Profundidad normal atravesada (mm): el espesor si el rayo cruza la barrera entera. */
  profundidad_mm: number;
}

function crucesGeometricos(
  source: RadiationSource, x: number, y: number, barriers: Barrier[], scale: number, centro: { x: number; y: number },
): { tocadas: Barrier[]; atenuantes: CruceGeometrico[] } {
  const tocadas: Barrier[] = [];
  const atenuantes: CruceGeometrico[] = [];
  const lr = Math.hypot(x - source.x, y - source.y);
  for (const barrier of barriers) {
    const capas = capasDeBarrera(barrier);
    const espesor_mm = capas.reduce((a, c) => a + c.thickness_mm, 0);
    const cuerda = espesor_mm > 0 && scale > 0
      ? cuerdaEnBarrera(source.x, source.y, x, y, barrier, espesor_mm / 1000 / scale, normalProtegida(barrier, centro))
      : null;
    const linea = cruceSegmentoBarrera(source.x, source.y, x, y, barrier);
    if (!cuerda && !linea) continue;
    tocadas.push(barrier);
    if (!cuerda || !(lr > EPS)) continue;
    const sx = barrier.x2 - barrier.x1, sy = barrier.y2 - barrier.y1;
    const cosTheta = Math.abs((x - source.x) * sy - (y - source.y) * sx) / (lr * Math.hypot(sx, sy));
    // Profundidad normal atravesada; si cruza la banda entera se toma el espesor exacto (sin redondeo).
    const prof_mm = cuerda.profundidad * scale * 1000;
    const profundidad_mm = Math.abs(prof_mm - espesor_mm) <= 1e-9 * espesor_mm ? espesor_mm : Math.min(espesor_mm, prof_mm);
    atenuantes.push({ barrier, capas, espesor_mm, cosTheta, profundidad_mm });
  }
  return { tocadas, atenuantes };
}

interface ModeloComponente {
  componente: ComponenteCampo;
  K0: number;
  /** Transmisión de una barrera para esta componente. */
  transmitir: (g: CruceGeometrico) => CruceBarrera;
  /** Factor que no depende de las barreras (preblindaje no consumido). */
  factorExtra?: () => number;
}

function cruce(g: CruceGeometrico, recorridoTotal_mm: number, capas: CapaCruzada[], transmision: number, hvl = 0): CruceBarrera {
  return {
    barrierId: g.barrier.id,
    cosTheta: g.cosTheta,
    factorOblicuidad: g.espesor_mm > 0 ? recorridoTotal_mm / g.espesor_mm : 1,
    capas,
    transmision,
    hvlDescontados: hvl,
  };
}

/** Recorrido acreditado con tope de oblicuidad: profundidad / max(cos θ, cos θ_max). */
function recorridoConTope(g: CruceGeometrico, anguloMax_deg: number): number {
  const cosMin = Math.cos(Math.min(Math.max(anguloMax_deg, 0), 89) * RAD);
  return g.profundidad_mm / Math.max(g.cosTheta, cosMin);
}

function material(materials: ShieldingMaterial[], code: string): ShieldingMaterial | undefined {
  return materials.find((m) => m.code === code);
}

/** Primaria o fuga NCRP 151: TVL₁/TVLₑ por capa, espesor oblicuo y corrección del §2.4. */
function transmitirTVL151(
  g: CruceGeometrico, componente: 'primaria' | 'fuga', e: EnergiaMV, source: RadiationSource, materials: ShieldingMaterial[],
): CruceBarrera {
  const recorrido = recorridoConTope(g, OBLICUIDAD_MAX_DATOS_DEG);
  let Bo = 1, Bn = 1;
  const capas = g.capas.map((capa): CapaCruzada => {
    const parte = capa.thickness_mm / g.espesor_mm;
    const rec = recorrido * parte, prof = g.profundidad_mm * parte;
    const m = material(materials, capa.materialCode);
    let bo = 1, bn = 1, metodo: MetodoTransmision = 'SIN_MATERIAL';
    if (m && (MATERIALES_NCRP151 as readonly string[]).includes(m.code)) {
      const { mat, escala } = material151(m);
      const tvl = componente === 'primaria' ? tvlPrimaria(e, mat) : tvlFuga(e, mat);
      bo = transmisionTVL(rec / 10 / escala, tvl);
      bn = transmisionTVL(prof / 10 / escala, tvl);
      metodo = 'NCRP151_TVL1_TVLe';
    } else if (m) {
      bo = tvlTransmission(rec, m, getShieldingEnergyKey(source));
      bn = tvlTransmission(prof, m, getShieldingEnergyKey(source));
      metodo = 'TVL_MATERIAL';
    }
    Bo *= bo; Bn *= bn;
    return { ...capa, recorrido_mm: rec, transmision: bo, metodo };
  });
  const theta = Math.acos(Math.min(1, g.cosTheta)) / RAD;
  const c = correccionOblicuidad(Bo, Bn, theta, e);
  return cruce(g, recorrido, capas, clampTransmission(c.transmision), c.hvlDescontados);
}

/** Dispersión del paciente NCRP 151: un TVL (B.5a) sobre el espesor normal (sin crédito de oblicuidad). */
function transmitirDispersion151(
  g: CruceGeometrico, e: EnergiaMV, theta_deg: number, source: RadiationSource, materials: ShieldingMaterial[],
): CruceBarrera {
  let B = 1;
  const capas = g.capas.map((capa): CapaCruzada => {
    const prof = g.profundidad_mm * (capa.thickness_mm / g.espesor_mm);
    const m = material(materials, capa.materialCode);
    let b = 1, metodo: MetodoTransmision = 'SIN_MATERIAL';
    if (m && (MATERIALES_NCRP151 as readonly string[]).includes(m.code)) {
      const { mat, escala } = material151(m);
      b = transmisionUnTVL(prof / 10 / escala, tvlDispersion(e, mat, theta_deg));
      metodo = 'NCRP151_UN_TVL';
    } else if (m) {
      b = tvlTransmission(prof, m, getShieldingEnergyKey(source));
      metodo = 'TVL_MATERIAL';
    }
    B *= b;
    return { ...capa, recorrido_mm: prof, transmision: b, metodo };
  });
  return cruce(g, g.profundidad_mm, capas, clampTransmission(B));
}

/** Diagnóstico NCRP 147: Archer (B.1 primaria / C.1 secundaria) con el tope de oblicuidad general. */
function transmitirArcher147(
  g: CruceGeometrico, ajustes: Record<MaterialNCRP147, Archer>, materials: ShieldingMaterial[], anguloMax_deg: number,
  pre: { restante_mm?: Partial<Record<MaterialNCRP147, number>> },
): CruceBarrera {
  const recorrido = recorridoConTope(g, anguloMax_deg);
  let B = 1;
  const capas = g.capas.map((capa): CapaCruzada => {
    let rec = recorrido * (capa.thickness_mm / g.espesor_mm);
    const m = material(materials, capa.materialCode);
    if (!m) return { ...capa, recorrido_mm: rec, transmision: 1, metodo: 'SIN_MATERIAL' };
    const mat = material147(m);
    if (!mat) {
      const b = archerTransmission(rec, m, 0);
      B *= b;
      return { ...capa, recorrido_mm: rec, transmision: b, metodo: 'ARCHER_MATERIAL' };
    }
    // Preblindaje (Tabla 4.6): se suma una vez al primer espesor de plomo o concreto que cruza la primaria.
    const xpre = pre.restante_mm?.[mat];
    if (xpre !== undefined) { rec += xpre; pre.restante_mm = undefined; }
    const b = clampTransmission(transmisionArcher(rec, ajustes[mat]));
    B *= b;
    return { ...capa, recorrido_mm: rec, transmision: b, metodo: 'NCRP147_ARCHER' };
  });
  return cruce(g, recorrido, capas, clampTransmission(B));
}

function modelosDeFuente(
  source: RadiationSource, x: number, y: number, scale: number, tocadas: Barrier[], opciones: OpcionesCampoDosis,
  materials: ShieldingMaterial[],
): ModeloComponente[] {
  const anguloMax = opciones.anguloMaxOblicuidad_deg ?? ANGULO_MAX_OBLICUIDAD_DEG;
  const haz = enHazPrimario(source, x, y, scale);
  const llegaPrimaria = haz ?? (tocadas.length === 0 || tocadas.some((b) => b.barrierType === 'primary'));
  const bPrim = tocadas.find((b) => b.barrierType === 'primary');
  const bSec = tocadas.find((b) => b.barrierType !== 'primary') ?? tocadas[0];

  const f: FuenteTeleterapia | null = fuenteTeleterapiaDe(source);
  if (f) {
    const d = distancia(source, { x, y }, scale);
    const U = fraccion(bPrim?.useFactor) ?? fraccion(source.useFactor) ?? 0.25;
    const Us = fraccion(bSec?.useFactor) ?? fraccion(source.useFactor) ?? 0.25;
    const theta = bSec?.scatterAngle_deg ?? ANGULO_DISPERSION_DEG;
    const modelos: ModeloComponente[] = [];
    if (llegaPrimaria) {
      modelos.push({ componente: 'primaria', K0: kermaPrimaria(f, U, d) * 1000, transmitir: (g) => transmitirTVL151(g, 'primaria', f.energia, source, materials) });
    }
    modelos.push(
      { componente: 'fuga', K0: kermaFuga(f, d) * 1000, transmitir: (g) => transmitirTVL151(g, 'fuga', f.energia, source, materials) },
      {
        componente: 'dispersion',
        K0: kermaDispersion(f, { U: Us, dsec_m: d, theta_deg: theta }) * 1000,
        transmitir: (g) => transmitirDispersion151(g, f.energia, theta, source, materials),
      },
    );
    return modelos;
  }

  if (DISTRIBUCION_POR_MODALIDAD[source.modality.id]) {
    const d = distancia(source, { x, y }, scale);
    const U = fraccion(bPrim?.useFactor) ?? fraccion(source.useFactor) ?? 1;
    const modelos: ModeloComponente[] = [];
    const prim = llegaPrimaria ? terminoNCRP147(source, d, true, U) : null;
    if (prim?.tipo === 'primaria') {
      const xpre = opciones.preblindaje ? PREBLINDAJE_MM[opciones.preblindaje] : undefined;
      const pre: { restante_mm?: Partial<Record<MaterialNCRP147, number>> } = {
        restante_mm: xpre ? { lead: xpre.lead, concrete: xpre.concrete } : undefined,
      };
      modelos.push({
        componente: 'primaria147',
        K0: prim.K,
        transmitir: (g) => transmitirArcher147(g, prim.ajustes, materials, anguloMax, pre),
        // Si ninguna barrera de plomo/concreto consumió el preblindaje, se acredita como plomo.
        factorExtra: () => (pre.restante_mm?.lead !== undefined ? clampTransmission(transmisionArcher(pre.restante_mm.lead, prim.ajustes.lead)) : 1),
      });
    }
    const sec = terminoNCRP147(source, d, false, U);
    if (sec) {
      modelos.push({ componente: 'secundaria147', K0: sec.K, transmitir: (g) => transmitirArcher147(g, sec.ajustes, materials, anguloMax, {}) });
    }
    return modelos;
  }

  return [{
    componente: 'kermaUnico',
    K0: calculateUnshieldedKerma(source, x, y, scale, opciones.ctIsodosisProfile),
    transmitir: (g) => {
      const recorrido = recorridoConTope(g, anguloMax);
      let B = 1;
      const capas = g.capas.map((capa): CapaCruzada => {
        const rec = recorrido * (capa.thickness_mm / g.espesor_mm);
        const r = transmisionCapa(source, g.barrier.barrierType, material(materials, capa.materialCode), rec);
        B *= r.transmision;
        return { ...capa, recorrido_mm: rec, ...r };
      });
      return cruce(g, recorrido, capas, clampTransmission(B));
    },
  }];
}

function centroide(sources: RadiationSource[]): { x: number; y: number } {
  const n = sources.length || 1;
  return { x: sources.reduce((a, s) => a + s.x, 0) / n, y: sources.reduce((a, s) => a + s.y, 0) / n };
}

/** Contribución de una fuente en el punto, por componentes. */
export function contribucionFuente(
  source: RadiationSource,
  x: number,
  y: number,
  scale_m_per_pixel: number,
  opciones: OpcionesCampoDosis = {},
  centro: { x: number; y: number } = { x: source.x, y: source.y },
): ContribucionFuente {
  const barriers = opciones.barriers ?? [];
  const materials = opciones.materials ?? MATERIALS;
  const { tocadas, atenuantes } = crucesGeometricos(source, x, y, barriers, scale_m_per_pixel, centro);
  const componentes = modelosDeFuente(source, x, y, scale_m_per_pixel, tocadas, opciones, materials).map((m): ContribucionComponente => {
    const cruces = atenuantes.map(m.transmitir);
    const transmision = clampTransmission(cruces.reduce((a, c) => a * c.transmision, 1) * (m.factorExtra?.() ?? 1));
    return { componente: m.componente, kermaSinBlindaje_mSv_semana: m.K0, transmision, kerma_mSv_semana: m.K0 * transmision, cruces };
  });
  const k0 = componentes.reduce((a, c) => a + c.kermaSinBlindaje_mSv_semana, 0);
  const k = componentes.reduce((a, c) => a + c.kerma_mSv_semana, 0);
  return {
    sourceId: source.id,
    kermaSinBlindaje_mSv_semana: k0,
    transmision: k0 > 0 ? k / k0 : 1,
    kerma_mSv_semana: k,
    cruces: componentes[0]?.cruces ?? [],
    componentes,
  };
}

/** Dosis (kerma semanal) en un punto del plano, con desglose por fuente, componente y barrera. */
export function dosisEnPunto(
  sources: RadiationSource[],
  x: number,
  y: number,
  scale_m_per_pixel: number,
  opciones: OpcionesCampoDosis = {},
): DosisEnPunto {
  const centro = centroide(sources);
  let kerma = 0, sinBlindaje = 0;
  const porFuente = sources.map((source) => {
    const c = contribucionFuente(source, x, y, scale_m_per_pixel, opciones, centro);
    kerma += c.kerma_mSv_semana;
    sinBlindaje += c.kermaSinBlindaje_mSv_semana;
    return c;
  });
  return { kerma_mSv_semana: kerma, kermaSinBlindaje_mSv_semana: sinBlindaje, porFuente };
}

/** Atajo: sólo el kerma total en el punto. */
export function kermaEnPunto(
  sources: RadiationSource[], x: number, y: number, scale_m_per_pixel: number, opciones: OpcionesCampoDosis = {},
): number {
  return dosisEnPunto(sources, x, y, scale_m_per_pixel, opciones).kerma_mSv_semana;
}

/** Componente concreta de una fuente en el punto (0 si no existe). */
export function kermaComponente(d: DosisEnPunto, componente: ComponenteCampo, sourceId?: string): number {
  return d.porFuente
    .filter((f) => sourceId === undefined || f.sourceId === sourceId)
    .flatMap((f) => f.componentes)
    .filter((c) => c.componente === componente)
    .reduce((a, c) => a + c.kerma_mSv_semana, 0);
}

/** Malla de dosis del heat map (misma malla que `calculateHeatmapGrid`), atenuada por barreras. */
export function calcularMallaDosis(
  sources: RadiationSource[],
  scale_m_per_pixel: number,
  gridSize: number = 50,
  opciones: OpcionesCampoDosis = {},
): PuntoMallaDosis[] {
  return heatmapGridPoints(sources, gridSize).map(({ x, y }) => {
    const d = dosisEnPunto(sources, x, y, scale_m_per_pixel, opciones);
    return { x, y, kerma: d.kerma_mSv_semana, kermaSinBlindaje: d.kermaSinBlindaje_mSv_semana };
  });
}
