import { useCallback } from 'react';
import { type RadiationSource, type Barrier, MATERIALS } from '@/types/radshield';
import { type CTIsodosisProfile } from '@/types/ctIsodosis';
import { roundThickness } from '@/lib/shieldingMath';
import { calcularMallaDosis } from '@/lib/doseFieldEngine';
import { calcularBarrerasValidadas } from '@/lib/motorProyecto';

export function useShieldingEngine() {

  // Fase 11: el cálculo por barrera vive en `motorProyecto` (motor único de todas las rutas de cálculo).
  const calculateAllBarriers = useCallback((
    barriers: Barrier[],
    sources: RadiationSource[],
    scale_m_per_pixel: number,
    ctIsodosisProfile?: CTIsodosisProfile
  ): Barrier[] => calcularBarrerasValidadas(barriers, sources, scale_m_per_pixel, ctIsodosisProfile), []);

  const calculateHeatmap = useCallback((
    sources: RadiationSource[],
    scale_m_per_pixel: number,
    gridSize: number = 50,
    ctIsodosisProfile?: CTIsodosisProfile,
    barriers: Barrier[] = [],
  ) => {
    // Fases 1–2 (docs/plan-motores-calculo.md): el heat map usa el motor de campo único, por componentes
    // (primaria/fuga/dispersión en teleterapia), y atenúa por las barreras que cruza cada rayo.
    return calcularMallaDosis(sources, scale_m_per_pixel, gridSize, { barriers, ctIsodosisProfile, materials: MATERIALS });
  }, []);

  return { calculateAllBarriers, calculateHeatmap, roundThickness };
}
