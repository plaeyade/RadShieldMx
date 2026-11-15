/**
 * Fase 12, paso 1 — el plano del proyecto y su historial (deshacer/rehacer).
 *
 * Sustituye a dos copias que se sincronizaban con efectos: `useUndoRedo` local en ShieldingDesigner y el
 * `floorPlan` de `canvasStore` (con un historial propio que nadie leía). La semántica es la de `useUndoRedo`,
 * que es la que veía el usuario: 50 pasos, un cambio sin diferencias (JSON igual) no se apila, y una acción
 * nueva descarta el «futuro».
 */
import type { StateCreator } from 'zustand';
import type { FloorPlan } from '@/types/radshield';
import { aplicar, PLANO_PREDETERMINADO, type Actualizador } from './tipos';

export const MAX_HISTORIAL = 50;

export interface PlanoSlice {
  floorPlan: FloorPlan;
  /** Estados anteriores (el último es el inmediato anterior). */
  pasado: FloorPlan[];
  /** Estados deshechos (el primero es el siguiente a rehacer). */
  futuro: FloorPlan[];
  canUndo: boolean;
  canRedo: boolean;
  setFloorPlan: (a: Actualizador<FloorPlan>) => void;
  updateFloorPlan: (parcial: Partial<FloorPlan>) => void;
  undo: () => void;
  redo: () => void;
  /** Sustituye el plano y vacía el historial (nuevo proyecto, abrir proyecto). */
  reset: (plano?: FloorPlan) => void;
}

const banderas = (pasado: FloorPlan[], futuro: FloorPlan[]) => ({ canUndo: pasado.length > 0, canRedo: futuro.length > 0 });

export const crearPlanoSlice: StateCreator<PlanoSlice, [], [], PlanoSlice> = (set, get) => ({
  floorPlan: PLANO_PREDETERMINADO,
  pasado: [],
  futuro: [],
  canUndo: false,
  canRedo: false,
  setFloorPlan: (a) => {
    const { floorPlan: actual, pasado } = get();
    const siguiente = aplicar(actual, a);
    if (siguiente === actual) return;
    if (JSON.stringify(actual) === JSON.stringify(siguiente)) {
      set({ floorPlan: siguiente });
      return;
    }
    const nuevoPasado = [...pasado, actual];
    if (nuevoPasado.length > MAX_HISTORIAL) nuevoPasado.shift();
    set({ floorPlan: siguiente, pasado: nuevoPasado, futuro: [], ...banderas(nuevoPasado, []) });
  },
  updateFloorPlan: (parcial) => get().setFloorPlan((p) => ({ ...p, ...parcial })),
  undo: () => {
    const { pasado, futuro, floorPlan } = get();
    if (pasado.length === 0) return;
    const nuevoPasado = pasado.slice(0, -1);
    const nuevoFuturo = [floorPlan, ...futuro];
    set({ floorPlan: pasado[pasado.length - 1], pasado: nuevoPasado, futuro: nuevoFuturo, ...banderas(nuevoPasado, nuevoFuturo) });
  },
  redo: () => {
    const { pasado, futuro, floorPlan } = get();
    if (futuro.length === 0) return;
    const nuevoPasado = [...pasado, floorPlan];
    const nuevoFuturo = futuro.slice(1);
    set({ floorPlan: futuro[0], pasado: nuevoPasado, futuro: nuevoFuturo, ...banderas(nuevoPasado, nuevoFuturo) });
  },
  reset: (plano = PLANO_PREDETERMINADO) => set({ floorPlan: plano, pasado: [], futuro: [], canUndo: false, canRedo: false }),
});
