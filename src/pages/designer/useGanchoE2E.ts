/**
 * Gancho de pruebas E2E del diseñador (sólo con la bandera local `radshield-e2e-controls`).
 *
 * Abre/cierra diálogos del store y, desde la Fase 11, lee el plano y los resultados del cálculo para comparar las
 * rutas (barra superior, lateral, F5). Fase 12: sale de ShieldingDesigner y lee todo del almacén único del proyecto;
 * `proyecto()` expone el estado completo para la prueba E2E de «Guíame».
 */
import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useProyectoStore } from '@/stores/proyecto';

export function useGanchoE2E() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem('radshield-e2e-controls') !== 'true') return;
      const s = useAppStore.getState();
      (window as unknown as { __radshieldE2E?: unknown }).__radshieldE2E = {
        dialogos: () => Object.keys(useAppStore.getState().dialogs),
        abrir: (n: string) => useAppStore.getState().open(n),
        cerrarTodo: () => s.closeAll(),
        plano: () => useProyectoStore.getState().floorPlan,
        resultados: () => useProyectoStore.getState().barrierResults,
        // Fase 12, paso 4: mapeos de capas guardados por el asistente de capas.
        mapeosCapas: () => useProyectoStore.getState().mapeosCapas,
        proyecto: () => {
          const p = useProyectoStore.getState();
          return {
            nombre: p.floorPlan.name,
            barreras: p.floorPlan.barriers.length,
            fuentes: p.floorPlan.sources.length,
            resultados: p.barrierResults.length,
            calculationStatus: p.calculationStatus,
            activeTool: p.activeTool,
            canUndo: p.canUndo,
            // Fase 12, paso 2: tamaño del historial, para comprobar que Ctrl+Z/Ctrl+Y mueven UN paso.
            pasado: p.pasado.length,
            futuro: p.futuro.length,
          };
        },
        limpiarCalculo: (instalado: Record<string, number> = {}) => useProyectoStore.getState().setFloorPlan(p => ({
          ...p,
          barriers: p.barriers.map(({ maxKerma: _k, requiredThickness_mm: _r, calculationTrace: _t, ...b }) =>
            (b.id in instalado ? { ...b, thickness_mm: instalado[b.id], shieldingLayers: undefined } : b)),
        })),
      };
    } catch { /* sin almacenamiento: sin gancho */ }
  }, []);
}
