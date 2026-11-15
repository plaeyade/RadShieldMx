/**
 * Fase 12, paso 4 — vista del lienzo 2D: zoom a extensión, zoom centrado en el cursor y límites de zoom.
 *
 * Antes cada control acotaba la escala a [0.1, 10] por su cuenta (rueda, Ctrl+rueda, botones, teclado, pellizco) y
 * Ctrl+rueda no se centraba en el cursor. Con un DXF en mm (≈ 10 000 unidades de ancho) el encuadre necesita una
 * escala < 0.1: el «zoom a extensión» quedaba recortado y el plano no cabía. Los límites ahora dependen del plano:
 * en unidades físicas (px de pantalla por metro) y siempre con margen alrededor de la escala de encuadre.
 *
 * Convención de pantalla: x_pantalla = x_mundo · escala + offsetX (igual que `useCanvas`).
 */
import type { FloorPlan } from '@/types/radshield';

export interface Vista { scale: number; offsetX: number; offsetY: number }
export interface Caja { minX: number; minY: number; maxX: number; maxY: number }
export interface LimitesZoom { min: number; max: number }

/** Límites históricos (plano en blanco a 1 cm/px: 10 px/m … 1000 px/m). */
export const LIMITES_ZOOM_BASE: LimitesZoom = { min: 0.1, max: 10 };
/** Px de pantalla por metro: de un hospital entero (10 px/m) al detalle de un muro (1000 px/m). */
const PX_POR_M_MIN = 10;
const PX_POR_M_MAX = 1000;
/** Margen alrededor de la escala de encuadre: alejar hasta ¼ y acercar hasta ×400 del encuadre. */
const ALEJAR_SOBRE_ENCUADRE = 4;
const ACERCAR_SOBRE_ENCUADRE = 400;

/** Caja que envuelve muros, fuentes (con su radio de dibujo) y regiones ocupadas; null si el plano está vacío. */
export function extensionPlano(plan: Pick<FloorPlan, 'barriers' | 'sources' | 'occupiedRegions'>, radioFuente = 50): Caja | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const punto = (x: number, y: number, r = 0) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    minX = Math.min(minX, x - r); minY = Math.min(minY, y - r);
    maxX = Math.max(maxX, x + r); maxY = Math.max(maxY, y + r);
  };
  for (const b of plan.barriers ?? []) { punto(b.x1, b.y1); punto(b.x2, b.y2); }
  for (const s of plan.sources ?? []) punto(s.x, s.y, radioFuente);
  for (const r of plan.occupiedRegions ?? []) for (const p of r.points ?? []) punto(p.x, p.y);
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

/** Vista que encuadra la caja centrada en un lienzo de ancho × alto con `margen` px por lado. */
export function encuadrar(caja: Caja, ancho: number, alto: number, margen = 40): Vista {
  const w = Math.max(caja.maxX - caja.minX, 1e-9);
  const h = Math.max(caja.maxY - caja.minY, 1e-9);
  const utilW = Math.max(ancho - 2 * margen, 1);
  const utilH = Math.max(alto - 2 * margen, 1);
  const scale = Math.min(utilW / w, utilH / h);
  return {
    scale,
    offsetX: (ancho - w * scale) / 2 - caja.minX * scale,
    offsetY: (alto - h * scale) / 2 - caja.minY * scale,
  };
}

/**
 * Límites de zoom del plano: [10, 1000] px/m de pantalla según la escala del plano, ampliados para que el encuadre
 * del contenido siempre quepa con margen (¼ … ×400 del encuadre).
 */
export function limitesZoom(mPorPx: number | undefined, escalaEncuadre?: number | null): LimitesZoom {
  const m = Number.isFinite(mPorPx) && (mPorPx as number) > 0 ? (mPorPx as number) : 0.01;
  let min = PX_POR_M_MIN * m;
  let max = PX_POR_M_MAX * m;
  if (escalaEncuadre && Number.isFinite(escalaEncuadre) && escalaEncuadre > 0) {
    min = Math.min(min, escalaEncuadre / ALEJAR_SOBRE_ENCUADRE);
    max = Math.max(max, escalaEncuadre * ACERCAR_SOBRE_ENCUADRE);
  }
  return { min, max };
}

export const acotar = (v: number, l: LimitesZoom) => Math.min(l.max, Math.max(l.min, v));

/**
 * Zoom por `factor` manteniendo fijo el punto de pantalla (sx, sy): lo que está bajo el cursor sigue bajo el cursor.
 * Con la escala en un límite la vista no cambia (no «deriva» el desplazamiento).
 */
export function zoomEnPunto(v: Vista, sx: number, sy: number, factor: number, l: LimitesZoom): Vista {
  const scale = acotar(v.scale * factor, l);
  if (scale === v.scale) return v;
  const k = scale / v.scale;
  return { scale, offsetX: sx - (sx - v.offsetX) * k, offsetY: sy - (sy - v.offsetY) * k };
}

/**
 * Factor de zoom de un evento de rueda: proporcional al desplazamiento (ratón de muescas ≈ ±10 %, panel táctil
 * suave), con `deltaMode` de líneas o páginas convertido a píxeles y acotado a [½, 2] por evento.
 */
export function factorRueda(deltaY: number, deltaMode = 0): number {
  const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY;
  if (!Number.isFinite(px) || px === 0) return 1;
  const f = Math.exp(-px * 0.001);
  return Math.min(2, Math.max(0.5, f));
}
