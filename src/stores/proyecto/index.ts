/**
 * Fase 12, paso 1 — almacén (store) único del proyecto.
 *
 * Una sola fuente de verdad para el plano (con su historial), el estado del lienzo y los resultados del cálculo.
 * ShieldingDesigner, el lienzo y los diálogos leen y escriben aquí; ya no hay copias sincronizadas con efectos.
 * `useCanvasStore` (src/stores/canvasStore.ts) es un alias de este almacén para el código existente.
 */
import { create } from 'zustand';
import { crearPlanoSlice, type PlanoSlice } from './planoSlice';
import { crearLienzoSlice, type LienzoSlice } from './lienzoSlice';
import { crearCalculoSlice, type CalculoSlice } from './calculoSlice';

export type ProyectoState = PlanoSlice & LienzoSlice & CalculoSlice;

export const useProyectoStore = create<ProyectoState>()((...a) => ({
  ...crearPlanoSlice(...(a as Parameters<typeof crearPlanoSlice>)),
  ...crearLienzoSlice(...(a as unknown as Parameters<typeof crearLienzoSlice>)),
  ...crearCalculoSlice(...(a as unknown as Parameters<typeof crearCalculoSlice>)),
}));

export { PLANO_PREDETERMINADO, type Actualizador, type HerramientaLienzo, type EstadoCalculo } from './tipos';
export { MAX_HISTORIAL } from './planoSlice';
