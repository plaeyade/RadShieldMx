/**
 * Mallas de los visores reconectados en las Fases 3 y 5 (docs/plan-motores-calculo.md). Cada visor llama aquí
 * y aquí sólo se llama a `calcularMallaRegular` / `dosisEnPunto` de `doseFieldEngine`: los visores no
 * tienen física propia. Unidades: plano en px, distancias en m (scale_m_per_pixel), kerma en mSv/semana.
 */
import type { FloorPlan } from '@/types/radshield';
import {
  calcularMallaRegular, centroCelda, limitesDelPlano,
  type ComponenteCampo, type MallaRegularDosis,
} from '@/lib/doseFieldEngine';
import { getZoneForDoseRate, type DetectorMesh, type DetectorVoxel } from '@/lib/doseMappingEngine';

export type PlanoDosis = Pick<FloorPlan, 'sources' | 'barriers' | 'scale_m_per_pixel'>;

/** Niveles de isodosis de DoseMapDialog (mSv/semana), además de P/T. */
export const NIVELES_ISODOSIS = [0.02, 0.1, 0.5, 1.0, 2.0, 5.0];

/** Columnas de la malla de SpatialDoseMapDialog (las filas salen del alto del plano). */
export const COLUMNAS_SPATIAL = 80;

/** Margen alrededor de fuentes y barreras que muestrean los mapas 2D (m). */
export const MARGEN_MAPA_M = 1;

function mallaPlano(plano: PlanoDosis, columnas: number, componentes?: readonly ComponenteCampo[]): MallaRegularDosis | null {
  const rect = limitesDelPlano(plano, MARGEN_MAPA_M);
  if (!rect || !plano.sources.length) return null;
  return calcularMallaRegular(plano.sources, plano.scale_m_per_pixel, rect, columnas, { barriers: plano.barriers, componentes });
}

/** Malla de DoseMapDialog: `resolucion` columnas sobre el plano, barreras reales. */
export function mallaDoseMap(plano: PlanoDosis, resolucion: number, componentes?: readonly ComponenteCampo[]): MallaRegularDosis | null {
  return mallaPlano(plano, resolucion, componentes);
}

/** Malla de SpatialDoseMapDialog. */
export function mallaSpatialDoseMap(
  plano: PlanoDosis, componentes?: readonly ComponenteCampo[], columnas = COLUMNAS_SPATIAL,
): MallaRegularDosis | null {
  return mallaPlano(plano, columnas, componentes);
}

// ───────────────────────────────────────────────────────────────
// Fase 5: visores en revisión reconectados al motor (siguen INACTIVOS tras sus banderas de
// `featureFlags.ts` hasta que el responsable los autorice). Antes dibujaban campos inventados
// (exponenciales, fuentes fijas «LINAC A/B, HDR», Γ = 0.11 en Ci, salas sintéticas).
// ───────────────────────────────────────────────────────────────

/** Columnas por omisión de cada visor. */
export const COLUMNAS_HEATMAP_AVANZADO = 120;
export const COLUMNAS_ISODOSIS = 80;
export const COLUMNAS_ISOSUPERFICIE = 32;
export const COLUMNAS_DOSE_MAPPING_3D = 30;

/** Heat Map Avanzado: malla del motor sobre el plano (barreras reales, componentes seleccionables). */
export function mallaHeatMapAvanzado(
  plano: PlanoDosis, componentes?: readonly ComponenteCampo[], columnas = COLUMNAS_HEATMAP_AVANZADO,
): MallaRegularDosis | null {
  return mallaPlano(plano, columnas, componentes);
}

export type EscalaColor = 'linear' | 'log' | 'sqrt';

/** Décadas que cubre la escala logarítmica bajo el máximo (10⁻⁶·máx → 0). */
export const DECADAS_LOG = 6;

/**
 * Valor de color en [0, 1] para un kerma (mSv/semana) relativo al máximo de la malla. Sólo presentación:
 * el valor físico mostrado en la leyenda es siempre el del motor.
 */
export function valorEscala(kerma: number, maximo: number, escala: EscalaColor): number {
  if (!(maximo > 0) || !(kerma > 0)) return 0;
  const r = Math.min(1, kerma / maximo);
  if (escala === 'sqrt') return Math.sqrt(r);
  if (escala === 'log') return Math.max(0, 1 + Math.log10(r) / DECADAS_LOG);
  return r;
}

/** Máximo finito de una malla (las celdas a < 0.1 m de una fuente valen 10⁶ como centinela). */
export function maximoVisible(valores: Float32Array, tope = 1e5): number {
  let max = 0;
  for (const v of valores) if (Number.isFinite(v) && v < tope && v > max) max = v;
  return max;
}

/** Curvas Isodosis: malla del motor y niveles absolutos (mSv/semana), P/T incluido. */
export interface IsodosisPlano {
  malla: MallaRegularDosis;
  niveles: number[];
}

export function isodosisPlano(
  plano: PlanoDosis,
  objetivo_mSv_semana = 0.02,
  ocupacion = 1,
  componentes?: readonly ComponenteCampo[],
  columnas = COLUMNAS_ISODOSIS,
): IsodosisPlano | null {
  const malla = mallaPlano(plano, columnas, componentes);
  if (!malla) return null;
  const pt = objetivo_mSv_semana / (ocupacion > 0 ? ocupacion : 1);
  const niveles = Array.from(new Set([pt, ...NIVELES_ISODOSIS])).sort((a, b) => a - b);
  return { malla, niveles };
}

/** Punto 3D (m) de los visores 3D. x, y en planta (y = eje vertical del plano), z altura sobre el piso. */
export interface PuntoDosis3D {
  x_m: number;
  y_m: number;
  z_m: number;
  /** Centro de la celda en px del plano (para comparar con `dosisEnPunto`). */
  x_px: number;
  y_px: number;
  kerma_mSv_semana: number;
}

/** Distancia mínima a una fuente para evaluar un punto 3D (m): más cerca el motor devuelve un centinela. */
export const DISTANCIA_MIN_FUENTE_3D_M = 0.3;

/**
 * Fuentes vistas desde la altura `z_m`: el motor es de planta y toma `isocenterHeight_m` como distancia
 * vertical fuente–punto (en 2D el punto está en z = 0). Aquí la fuente queda a su altura de isocentro y el
 * punto a z_m: distancia vertical |h − z|. La oblicuidad vertical en las barreras no se acredita (conservador).
 */
export function fuentesAAltura(plano: PlanoDosis, z_m: number): PlanoDosis['sources'] {
  return plano.sources.map((s) => ({ ...s, isocenterHeight_m: Math.abs((s.isocenterHeight_m ?? 0) - z_m) }));
}

/** Alturas por omisión de los cortes 3D (m): 0.25 a 2.75 cada 0.5 m. */
export const ALTURAS_3D_M: readonly number[] = [0.25, 0.75, 1.25, 1.75, 2.25, 2.75];

/**
 * Malla 3D del motor: un corte `calcularMallaRegular` por altura sobre el plano. Se omiten los puntos a menos
 * de `DISTANCIA_MIN_FUENTE_3D_M` de una fuente.
 */
export function malla3DPlano(
  plano: PlanoDosis,
  opciones: { columnas?: number; alturas_m?: readonly number[]; componentes?: readonly ComponenteCampo[] } = {},
): PuntoDosis3D[] {
  const rect = limitesDelPlano(plano, MARGEN_MAPA_M);
  if (!rect || !plano.sources.length || !(plano.scale_m_per_pixel > 0)) return [];
  const s = plano.scale_m_per_pixel;
  const puntos: PuntoDosis3D[] = [];
  for (const z_m of opciones.alturas_m ?? ALTURAS_3D_M) {
    const fuentes = fuentesAAltura(plano, z_m);
    const malla = calcularMallaRegular(fuentes, s, rect, opciones.columnas ?? COLUMNAS_ISOSUPERFICIE, {
      barriers: plano.barriers, componentes: opciones.componentes,
    });
    for (let iy = 0; iy < malla.ny; iy++) {
      for (let ix = 0; ix < malla.nx; ix++) {
        const { x, y } = centroCelda(malla, ix, iy);
        const cerca = plano.sources.some((f) =>
          Math.hypot((x - f.x) * s, (y - f.y) * s, (f.isocenterHeight_m ?? 0) - z_m) < DISTANCIA_MIN_FUENTE_3D_M);
        if (cerca) continue;
        puntos.push({ x_m: (x - rect.x0) * s, y_m: (y - rect.y0) * s, z_m, x_px: x, y_px: y, kerma_mSv_semana: malla.valores[iy * malla.nx + ix] });
      }
    }
  }
  return puntos;
}

/** Niveles de isosuperficie del visor (mSv/semana). */
export const NIVELES_ISOSUPERFICIE = [0.002, 0.02, 0.1, 0.5, 1, 5, 20];

/** Isosuperficie 3D: puntos con kerma ≥ nivel (mSv/semana). */
export function isosuperficie3D(
  plano: PlanoDosis, nivel_mSv_semana: number,
  opciones: { columnas?: number; alturas_m?: readonly number[]; componentes?: readonly ComponenteCampo[] } = {},
): PuntoDosis3D[] {
  return malla3DPlano(plano, opciones).filter((p) => p.kerma_mSv_semana >= nivel_mSv_semana);
}

/** Horas de operación por semana para pasar el kerma semanal a tasa media (zonificación por µSv/h). */
export const HORAS_OPERACION_SEMANA = 40;

/** Tasa media (µSv/h) de un kerma semanal repartido en `HORAS_OPERACION_SEMANA` h. */
export function tasaMedia_uSv_h(kerma_mSv_semana: number, horas = HORAS_OPERACION_SEMANA): number {
  return (kerma_mSv_semana * 1000) / horas;
}

/**
 * 3D Dose Mapping desde el plano del lienzo (Fase 5; en la Fase 3 sólo tenía su sala sintética): vóxeles de
 * `malla3DPlano` en coordenadas de la escena (x = x del plano, y = altura, z = y del plano, m). La zonificación
 * del visor es por tasa (µSv/h): se usa la tasa media `tasaMedia_uSv_h` (kerma semanal / 40 h);
 * `cumulativeDose_uSv` es el kerma semanal en µSv.
 */
export function meshDoseMapping3D(
  plano: PlanoDosis,
  opciones: { columnas?: number; alturas_m?: readonly number[]; componentes?: readonly ComponenteCampo[] } = {},
): DetectorMesh {
  const columnas = opciones.columnas ?? COLUMNAS_DOSE_MAPPING_3D;
  const puntos = malla3DPlano(plano, { ...opciones, columnas });
  const rect = limitesDelPlano(plano, MARGEN_MAPA_M);
  const s = plano.scale_m_per_pixel;
  const alturas = opciones.alturas_m ?? ALTURAS_3D_M;
  const paso_m = rect && s > 0 ? (rect.ancho * s) / Math.max(1, Math.round(columnas)) : 0;
  const voxels: DetectorVoxel[] = puntos.map((p) => {
    const tasa = tasaMedia_uSv_h(p.kerma_mSv_semana);
    return {
      x: p.x_m, y: p.z_m, z: p.y_m, doseRate_uSv_h: tasa, particleType: 'photon',
      zone: getZoneForDoseRate(tasa).id, cumulativeDose_uSv: p.kerma_mSv_semana * 1000, flux_cm2_s: Number.NaN,
    };
  });
  const f = plano.sources[0];
  return {
    resolution_cm: Math.round(paso_m * 100),
    dimensions: rect && s > 0
      ? { x: rect.ancho * s, y: Math.max(...alturas, 0) + 0.25, z: rect.alto * s }
      : { x: 0, y: 0, z: 0 },
    voxels,
    particleType: 'photon',
    sourcePosition: f && rect ? { x: (f.x - rect.x0) * s, y: f.isocenterHeight_m ?? 0, z: (f.y - rect.y0) * s } : { x: 0, y: 0, z: 0 },
    sourceActivity_GBq: Number.NaN,
    shieldThickness_cm: 0,
    shieldMaterial: 'plano',
    shieldDistance_m: 0,
    computedAt: new Date().toISOString(),
    nota: plano.sources.length ? undefined : 'El plano no tiene fuentes.',
  };
}
