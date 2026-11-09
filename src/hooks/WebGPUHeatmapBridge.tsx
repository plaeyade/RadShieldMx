/**
 * Puente perezoso del heat map WebGPU (Fase 6). El shader (`useWebGPU`/`useWebGPUHeatmap`) sólo se
 * descarga cuando `HEATMAP_GPU` está activa: ShieldingDesigner monta este componente con `lazy()` y
 * recibe la API del hook por `onReady`, en lugar de llamar el hook (y empaquetar el shader) siempre.
 */
import { useEffect } from 'react';
import { useWebGPUHeatmap } from './useWebGPUHeatmap';

export type WebGPUHeatmapApi = ReturnType<typeof useWebGPUHeatmap>;

export default function WebGPUHeatmapBridge({ onReady }: { onReady: (api: WebGPUHeatmapApi) => void }) {
  const api = useWebGPUHeatmap();
  useEffect(() => { onReady(api); }, [api, onReady]);
  return null;
}
