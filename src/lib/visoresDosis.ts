/**
 * Mallas de los visores reconectados en la Fase 3 (docs/plan-motores-calculo.md). Cada visor llama aquí
 * y aquí sólo se llama a `calcularMallaRegular` / `dosisEnPunto` de `doseFieldEngine`: los visores no
 * tienen física propia. Unidades: plano en px, distancias en m (scale_m_per_pixel), kerma en mSv/semana.
 */
import type { FloorPlan } from '@/types/radshield';
import {
  calcularMallaRegular, limitesDelPlano,
  type ComponenteCampo, type MallaRegularDosis,
} from '@/lib/doseFieldEngine';

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
