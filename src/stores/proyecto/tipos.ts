/**
 * Fase 12, paso 1 — tipos comunes del almacén único del proyecto (`useProyectoStore`).
 */
import type { FloorPlan } from '@/types/radshield';

/** Valor nuevo o función del valor anterior, igual que el `setState` de React. */
export type Actualizador<T> = T | ((prev: T) => T);

export const aplicar = <T>(actual: T, a: Actualizador<T>): T =>
  typeof a === 'function' ? (a as (prev: T) => T)(actual) : a;

/** Plano vacío con el que arranca el diseñador (antes repetido en ShieldingDesigner, canvasStore y appStore). */
export const PLANO_PREDETERMINADO: FloorPlan = {
  id: 'plan-1',
  name: 'Plano de Blindaje 1',
  imageUrl: null,
  scale_m_per_pixel: 0.01,
  width_pixels: 1000,
  height_pixels: 800,
  barriers: [],
  sources: [],
  occupiedRegions: [],
};

export type HerramientaLienzo = 'select' | 'barrier' | 'source' | 'region' | 'measure' | 'pan' | 'eraser' | 'reset';
export type EstadoCalculo = 'idle' | 'running' | 'success' | 'error';
