/**
 * useDefaultTemplate — Precarga automática de sala R&F al iniciar
 * v67: El canvas ya NO está vacío al inicio. Se carga un ejemplo funcional.
 */
import { useCallback } from 'react';
import type { FloorPlan, Barrier, RadiationSource } from '@/types/radshield';

export function loadDefaultTemplate(floorPlan: FloorPlan): FloorPlan {
  const spm = floorPlan.scale_m_per_pixel || 0.01;
  const px = (m: number) => m / spm;
  const t = Date.now();
  let idx = 0;

  const mkB = (x1: number, y1: number, x2: number, y2: number, name: string, type: string): Barrier => ({
    id: `b-${t}-${idx++}`, x1, y1, x2, y2, name,
    barrierType: type as any, useFactor: 0.25, occupancyFactor: 0.2,
    designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235',
    thickness_mm: 0, leadEquivalence_mm: 0,
  });

  const W = px(5), H = px(6), d = px(0.9);
  const barriers: Barrier[] = [
    mkB(0, 0, W, 0,       'Pared Norte', 'primary'),
    mkB(W, 0, W, H,       'Pared Este', 'secondary'),
    mkB(W, H, 0, H,       'Pared Sur', 'secondary'),
    mkB(0, H, 0, 0,       'Pared Oeste', 'secondary'),
    mkB(d, 0, d, H,       'División Plomo', 'secondary'),
    mkB(W - d, 0, W - d, H, 'Ventana Lead', 'secondary'),
  ];

  const sources: RadiationSource[] = [
    {
      id: `s-${t}-0`, x: W / 2, y: H / 2, name: 'Tubo XR R&F',
      modality: { id: 'xr-rf', name: 'XR R&F', unit: 'mA-min/wk', isocenterHeightDefault_m: 1.0, tvlData: {} },
      workloadValue: 300, workloadUnit: 'mA-min/wk',
      isocenterHeight_m: 1.0, useFactor: 0.25, workloadHoursPerWeek: 40,
    },
    {
      id: `s-${t}-1`, x: d / 2, y: H / 2, name: 'Consola Control',
      modality: { id: 'xr-control', name: 'Control', unit: 'mA-min/wk', isocenterHeightDefault_m: 1.0, tvlData: {} },
      workloadValue: 0, workloadUnit: 'mA-min/wk',
      isocenterHeight_m: 1.0, useFactor: 0, workloadHoursPerWeek: 40,
    },
  ];

  return {
    ...floorPlan,
    name: 'Sala R&F - Ejemplo',
    barriers: [...(floorPlan.barriers || []), ...barriers],
    sources: [...(floorPlan.sources || []), ...sources],
  };
}

export function clearCanvas(floorPlan: FloorPlan): FloorPlan {
  return {
    ...floorPlan,
    name: 'Nuevo Plano',
    barriers: [],
    sources: [],
    occupiedRegions: [],
    imageUrl: null,
  };
}

export function useDefaultTemplate() {
  return { loadDefaultTemplate, clearCanvas };
}
