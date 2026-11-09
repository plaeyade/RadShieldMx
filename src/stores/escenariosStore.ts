/**
 * Fase 9 — escenarios del proyecto para los comparadores (CompareScenarios, CompareMode).
 *
 * Un escenario es una copia del plano que el usuario guardó en algún momento de la sesión; los comparadores lo
 * enfrentan con el plano actual o con otro escenario. No se persisten fuera de la sesión: para conservarlos, guarde el
 * proyecto.
 */
import { create } from 'zustand';
import type { FloorPlan } from '@/types/radshield';

export interface EscenarioProyecto {
  id: string;
  nombre: string;
  /** ISO 8601. */
  fecha: string;
  plano: FloorPlan;
}

interface EscenariosState {
  escenarios: EscenarioProyecto[];
  guardar: (nombre: string, plano: FloorPlan) => EscenarioProyecto;
  eliminar: (id: string) => void;
}

let contador = 0;

export const useEscenariosStore = create<EscenariosState>((set) => ({
  escenarios: [],
  guardar: (nombre, plano) => {
    contador += 1;
    const e: EscenarioProyecto = {
      id: `esc-${Date.now().toString(36)}-${contador}`,
      nombre: nombre.trim() || `Escenario ${contador}`,
      fecha: new Date().toISOString(),
      plano: structuredClone(plano),
    };
    set((s) => ({ escenarios: [...s.escenarios, e] }));
    return e;
  },
  eliminar: (id) => set((s) => ({ escenarios: s.escenarios.filter((e) => e.id !== id) })),
}));
