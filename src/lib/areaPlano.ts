/**
 * Área aproximada de la sala para el validador de planos (Fase 8d). Antes se suponía un lienzo fijo de
 * 1200×800 px, de modo que el área dependía sólo de la escala (a 0.01 m/px, 96 m² para cualquier plano).
 * Ahora: rectángulo que contiene las barreras; si no hay barreras, el tamaño del plano; si tampoco, null.
 */
import type { FloorPlan } from '@/types/radshield';

export interface AreaAproximada {
  area_m2: number;
  ancho_m: number;
  fondo_m: number;
  origen: 'barreras' | 'plano';
}

export function areaAproximadaSala(plano: Pick<FloorPlan, 'barriers' | 'width_pixels' | 'height_pixels'>, escala_m_px: number): AreaAproximada | null {
  if (!(escala_m_px > 0)) return null;
  const b = plano.barriers ?? [];
  if (b.length) {
    const xs = b.flatMap((m) => [m.x1, m.x2]);
    const ys = b.flatMap((m) => [m.y1, m.y2]);
    const ancho_m = (Math.max(...xs) - Math.min(...xs)) * escala_m_px;
    const fondo_m = (Math.max(...ys) - Math.min(...ys)) * escala_m_px;
    if (ancho_m > 0 && fondo_m > 0) return { area_m2: ancho_m * fondo_m, ancho_m, fondo_m, origen: 'barreras' };
  }
  const w = plano.width_pixels, h = plano.height_pixels;
  if (w > 0 && h > 0) {
    const ancho_m = w * escala_m_px, fondo_m = h * escala_m_px;
    return { area_m2: ancho_m * fondo_m, ancho_m, fondo_m, origen: 'plano' };
  }
  return null;
}
