/**
 * Fase 12, paso 1 — estado de edición del lienzo: herramienta activa, selección, vista y panel lateral.
 * Antes: `useState` en ShieldingDesigner y copias sin uso en `canvasStore` y `appStore`.
 */
import type { StateCreator } from 'zustand';
import { aplicar, type Actualizador, type HerramientaLienzo } from './tipos';

export interface LienzoSlice {
  activeTool: HerramientaLienzo;
  setActiveTool: (a: Actualizador<HerramientaLienzo>) => void;
  selectedSourceId: string | null;
  setSelectedSourceId: (id: string | null) => void;
  selectedBarrierId: string | null;
  setSelectedBarrierId: (id: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  zoom: number;
  setZoom: (z: number) => void;
  panX: number;
  panY: number;
  setPan: (x: number, y: number) => void;
}

export const crearLienzoSlice: StateCreator<LienzoSlice, [], [], LienzoSlice> = (set, get) => ({
  activeTool: 'select',
  setActiveTool: (a) => set({ activeTool: aplicar(get().activeTool, a) }),
  selectedSourceId: null,
  setSelectedSourceId: (id) => set({ selectedSourceId: id }),
  selectedBarrierId: null,
  setSelectedBarrierId: (id) => set({ selectedBarrierId: id }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  zoom: 1,
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(10, z)) }),
  panX: 0,
  panY: 0,
  setPan: (x, y) => set({ panX: x, panY: y }),
});
