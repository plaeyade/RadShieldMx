/**
 * Motor de campo de dosis — fuente única para «dosis en un punto» y mallas de dosis (Fase 1).
 *
 * K(P) = Σ_fuentes K₀(fuente, P) · Π_barreras B(recorrido oblicuo)
 *
 * - K₀: kerma sin blindaje de `calculateUnshieldedKerma` (shieldingMath, mGy ≈ mSv por semana).
 * - B: transmisión de cada barrera que cruza el segmento fuente → punto, con las fórmulas que ya
 *   existen en el proyecto (no se duplican):
 *     · LINAC (NCRP 151): TVL₁/TVLₑ de la Tabla B.2 (primaria) o B.7 (fuga, concreto), vía
 *       `transmisionTVL` (inversa exacta de la Ec. 2.3) y la equivalencia másica de `material151`.
 *     · Diagnóstico tabulado (NCRP 147): ajuste de Archer de la Tabla B.1 (primaria) o C.1
 *       (secundaria) vía `transmisionArcher`.
 *     · Diagnóstico no tabulado: `archerTransmission` con los parámetros del material.
 *     · Resto (medicina nuclear, braquiterapia, Co-60…): `tvlTransmission` (un solo TVL del material).
 * - Oblicuidad: el recorrido dentro de la barrera es t / cos θ (θ respecto de la normal, en el plano).
 *   El crédito se limita a θ ≤ `ANGULO_MAX_OBLICUIDAD_DEG` (conservador); el ajuste con datos de
 *   incidencia oblicua y la separación primaria/fuga/dispersión del campo quedan para la Fase 2
 *   (ver docs/plan-motores-calculo.md).
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
import { TABLA_B_1, TABLA_C_1, transmisionArcher } from '@/lib/ncrp147';
import { TABLA_B_2, TABLA_B_7, energiaDesdeClave, transmisionTVL } from '@/lib/ncrp151';
import {
  DISTRIBUCION_POR_MODALIDAD,
  LINAC,
  MATERIALES_NCRP151,
  material147,
  material151,
} from '@/lib/normativeBarrierEngine';

/** Ángulo máximo de oblicuidad acreditado (crédito máximo 1/cos 60° = ×2). */
export const ANGULO_MAX_OBLICUIDAD_DEG = 60;

export type MetodoTransmision =
  | 'NCRP151_TVL1_TVLe'
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
  factorOblicuidad: number;
  capas: CapaCruzada[];
  transmision: number;
}

export interface ContribucionFuente {
  sourceId: string;
  kermaSinBlindaje_mSv_semana: number;
  transmision: number;
  kerma_mSv_semana: number;
  cruces: CruceBarrera[];
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
  anguloMaxOblicuidad_deg?: number;
}

export interface PuntoMallaDosis {
  x: number;
  y: number;
  /** Kerma con barreras (mGy ≈ mSv por semana). */
  kerma: number;
  kermaSinBlindaje: number;
}

const EPS = 1e-9;

function positivo(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
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
 * Cruce del segmento A→B (fuente → punto) con la barrera. Devuelve |cos θ| del rayo respecto de la
 * normal de la barrera, o null si no la cruza. Los extremos del rayo no cuentan como cruce.
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

/** Transmisión de una capa con recorrido `recorrido_mm` para la fuente y el tipo de barrera dados. */
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

/** Transmisión total fuente → punto por todas las barreras cruzadas. */
export function transmisionTrayecto(
  source: RadiationSource,
  x: number,
  y: number,
  barriers: Barrier[],
  materials: ShieldingMaterial[] = MATERIALS,
  anguloMax_deg: number = ANGULO_MAX_OBLICUIDAD_DEG,
): { transmision: number; cruces: CruceBarrera[] } {
  const cosMin = Math.cos((Math.min(Math.max(anguloMax_deg, 0), 89) * Math.PI) / 180);
  const cruces: CruceBarrera[] = [];
  let transmision = 1;
  for (const barrier of barriers) {
    const capas = capasDeBarrera(barrier);
    if (!capas.length) continue;
    const cruce = cruceSegmentoBarrera(source.x, source.y, x, y, barrier);
    if (!cruce) continue;
    const factorOblicuidad = 1 / Math.max(cruce.cosTheta, cosMin);
    let tb = 1;
    const capasCruzadas: CapaCruzada[] = capas.map((capa) => {
      const material = materials.find((m) => m.code === capa.materialCode);
      const recorrido_mm = capa.thickness_mm * factorOblicuidad;
      const r = transmisionCapa(source, barrier.barrierType, material, recorrido_mm);
      tb *= r.transmision;
      return { ...capa, recorrido_mm, ...r };
    });
    transmision *= tb;
    cruces.push({ barrierId: barrier.id, cosTheta: cruce.cosTheta, factorOblicuidad, capas: capasCruzadas, transmision: tb });
  }
  return { transmision: clampTransmission(transmision), cruces };
}

/** Dosis (kerma semanal) en un punto del plano, con desglose por fuente y barrera. */
export function dosisEnPunto(
  sources: RadiationSource[],
  x: number,
  y: number,
  scale_m_per_pixel: number,
  opciones: OpcionesCampoDosis = {},
): DosisEnPunto {
  const barriers = opciones.barriers ?? [];
  const materials = opciones.materials ?? MATERIALS;
  let kerma = 0, sinBlindaje = 0;
  const porFuente: ContribucionFuente[] = sources.map((source) => {
    const k0 = calculateUnshieldedKerma(source, x, y, scale_m_per_pixel, opciones.ctIsodosisProfile);
    const { transmision, cruces } = barriers.length
      ? transmisionTrayecto(source, x, y, barriers, materials, opciones.anguloMaxOblicuidad_deg)
      : { transmision: 1, cruces: [] };
    const k = k0 * transmision;
    kerma += k;
    sinBlindaje += k0;
    return { sourceId: source.id, kermaSinBlindaje_mSv_semana: k0, transmision, kerma_mSv_semana: k, cruces };
  });
  return { kerma_mSv_semana: kerma, kermaSinBlindaje_mSv_semana: sinBlindaje, porFuente };
}

/** Atajo: sólo el kerma total en el punto. */
export function kermaEnPunto(
  sources: RadiationSource[], x: number, y: number, scale_m_per_pixel: number, opciones: OpcionesCampoDosis = {},
): number {
  return dosisEnPunto(sources, x, y, scale_m_per_pixel, opciones).kerma_mSv_semana;
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
