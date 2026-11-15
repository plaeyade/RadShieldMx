/**
 * Fase 12, paso 1 — resultados del cálculo y estado del guardado, leídos del almacén único del proyecto.
 * Un solo `useShallow` en lugar de diez `useState` en ShieldingDesigner.
 */
import { useShallow } from 'zustand/react/shallow';
import { useProyectoStore } from '@/stores/proyecto';

export function useCalculoProyecto() {
  return useProyectoStore(useShallow((s) => ({
    barrierResults: s.barrierResults,
    setBarrierResults: s.setBarrierResults,
    sampleLines: s.sampleLines,
    setSampleLines: s.setSampleLines,
    calculationStatus: s.calculationStatus,
    setCalculationStatus: s.setCalculationStatus,
    isDirty: s.isDirty,
    setIsDirty: s.setIsDirty,
    lastSaved: s.lastSaved,
    setLastSaved: s.setLastSaved,
  })));
}
