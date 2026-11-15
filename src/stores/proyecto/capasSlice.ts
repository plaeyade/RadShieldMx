/**
 * Fase 12, paso 4 — mapeos de capas DWG/DXF (asistente de capas) en el almacén único del proyecto.
 *
 * Sustituye al «preset» de roles en `localStorage` del visor DXF: el mapeo (rol, material, espesor, ignorar) se
 * guarda aquí, por archivo, y viaja con el plano en `floorPlan.importMetadata.mapeoCapas` al aplicarlo. El asistente
 * propone para cada capa la decisión más reciente con el mismo nombre (de esta biblioteca o del plano abierto).
 */
import type { StateCreator } from 'zustand';
import type { MapeoCapas } from '@/lib/asistenteCapasTipos';
import type { PlanoSlice } from './planoSlice';

export const MAX_MAPEOS_CAPAS = 20;

export interface CapasSlice {
  /** Mapeos guardados, el más reciente primero. */
  mapeosCapas: MapeoCapas[];
  guardarMapeoCapas: (m: MapeoCapas) => void;
  borrarMapeoCapas: (id: string) => void;
  /** Mapeos a consultar al proponer: los guardados y el del plano abierto (si lo trae). */
  mapeosParaProponer: () => MapeoCapas[];
}

export const crearCapasSlice: StateCreator<CapasSlice & PlanoSlice, [], [], CapasSlice> = (set, get) => ({
  mapeosCapas: [],
  guardarMapeoCapas: (m) => set({ mapeosCapas: [m, ...get().mapeosCapas.filter((x) => x.id !== m.id)].slice(0, MAX_MAPEOS_CAPAS) }),
  borrarMapeoCapas: (id) => set({ mapeosCapas: get().mapeosCapas.filter((x) => x.id !== id) }),
  mapeosParaProponer: () => {
    const delPlano = get().floorPlan.importMetadata?.mapeoCapas;
    const guardados = get().mapeosCapas;
    return delPlano && !guardados.some((m) => m.id === delPlano.id) ? [...guardados, delPlano] : guardados;
  },
});
