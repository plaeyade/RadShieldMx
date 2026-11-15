/**
 * Fase 12, paso 1 — resultados del último «Calcular» y estado del guardado.
 * Antes: `useState` en ShieldingDesigner; los diálogos sólo los veían si se les pasaban por props.
 */
import type { StateCreator } from 'zustand';
import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import { aplicar, type Actualizador, type EstadoCalculo } from './tipos';

export interface CalculoSlice {
  barrierResults: CanvasBarrierResult[];
  setBarrierResults: (a: Actualizador<CanvasBarrierResult[]>) => void;
  sampleLines: CanvasSampleLine[];
  setSampleLines: (a: Actualizador<CanvasSampleLine[]>) => void;
  calculationStatus: EstadoCalculo;
  setCalculationStatus: (e: EstadoCalculo) => void;
  isDirty: boolean;
  setIsDirty: (v: boolean) => void;
  lastSaved: Date | null;
  setLastSaved: (d: Date | null) => void;
  /** Olvida los resultados (nuevo proyecto, plano cambiado por fuera del cálculo). */
  limpiarResultados: () => void;
}

export const crearCalculoSlice: StateCreator<CalculoSlice, [], [], CalculoSlice> = (set, get) => ({
  barrierResults: [],
  setBarrierResults: (a) => set({ barrierResults: aplicar(get().barrierResults, a) }),
  sampleLines: [],
  setSampleLines: (a) => set({ sampleLines: aplicar(get().sampleLines, a) }),
  calculationStatus: 'idle',
  setCalculationStatus: (e) => set({ calculationStatus: e }),
  isDirty: false,
  setIsDirty: (v) => set({ isDirty: v }),
  lastSaved: null,
  setLastSaved: (d) => set({ lastSaved: d }),
  limpiarResultados: () => set({ barrierResults: [], sampleLines: [] }),
});
