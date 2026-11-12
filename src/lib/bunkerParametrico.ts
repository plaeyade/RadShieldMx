/**
 * Generador de plano a partir del diseñador paramétrico de búnker (Fase 8c). Antes «Generar» esperaba 2 s y llamaba a
 * un `onGenerate` que nadie pasaba: no hacía nada. Ahora crea una sala rectangular (4 barreras de concreto, sin espesor
 * calculado) con la fuente en el centro; el cálculo lo hace después el motor sobre el plano.
 */
import { MATERIALS, MODALITIES, type Barrier, type RadiationSource } from '@/types/radshield';
import { P_NO_CONTROLADA_mSv_semana } from './limitesDosis';

export interface ConfigBunker {
  template: string;
  energy?: number; workload?: number;
  roomLength?: number; roomWidth?: number;
  occupancy?: number; designGoal?: number;
}

const MODALIDAD_POR_PLANTILLA: Record<string, string> = {
  'linac-6mv': 'linac-6mv', 'linac-dual': 'linac-15mv', 'pet-ct': 'pet-f18', gammaknife: 'gamma-knife',
  hdr: 'hdr-192ir', cyclotron: 'cyclotron-16mev',
};

/** En terapia la fuente lleva fracciones/semana (W = fracciones × Gy/fracción); el diseñador da W en Gy/semana. */
function cargaFuente(m: (typeof MODALITIES)[number], W?: number): number {
  if (W === undefined) return m.workloadDefault ?? 0;
  return m.category === 'therapy' && m.doseRateConstant > 0 ? W / m.doseRateConstant : W;
}

export function generarBunker(c: ConfigBunker, scale_m_per_pixel: number): { barriers: Barrier[]; sources: RadiationSource[]; ancho_px: number; alto_px: number } {
  const escala = scale_m_per_pixel > 0 ? scale_m_per_pixel : 0.01;
  const L = c.roomLength ?? 7.5, W = c.roomWidth ?? 7;
  const margen = 80;
  const x0 = margen, y0 = margen, x1 = margen + Math.round(W / escala), y1 = margen + Math.round(L / escala);
  const modalidad = MODALITIES.find(m => m.id === MODALIDAD_POR_PLANTILLA[c.template]) ?? MODALITIES.find(m => m.id === 'linac-6mv') ?? MODALITIES[0];
  const terapia = c.template.startsWith('linac') || c.template === 'gammaknife';
  const concreto = MATERIALS.find(m => m.code === 'CONCRETE235');
  const muro = (id: string, nombre: string, xa: number, ya: number, xb: number, yb: number, primaria: boolean): Barrier => ({
    id: `param-${id}`, x1: xa, y1: ya, x2: xb, y2: yb, name: nombre,
    barrierType: primaria ? 'primary' : 'secondary',
    useFactor: primaria ? 0.25 : 1,
    occupancyFactor: c.occupancy ?? 0.25,
    designGoal_mSv_per_wk: c.designGoal ?? P_NO_CONTROLADA_mSv_semana,
    materialCode: 'CONCRETE235',
    material: concreto?.name ?? 'Concreto',
  });
  // En terapia, los muros laterales (perpendiculares al eje del gantry) son primarios.
  const barriers = [
    muro('n', 'Muro norte', x0, y0, x1, y0, false),
    muro('e', 'Muro este', x1, y0, x1, y1, terapia),
    muro('s', 'Muro sur', x1, y1, x0, y1, false),
    muro('o', 'Muro oeste', x0, y1, x0, y0, terapia),
  ];
  const sources: RadiationSource[] = [{
    id: 'param-fuente', x: Math.round((x0 + x1) / 2), y: Math.round((y0 + y1) / 2), name: modalidad.name ?? 'Fuente',
    modality: modalidad, workloadValue: cargaFuente(modalidad, c.workload), workloadUnit: modalidad.unit,
    isocenterHeight_m: modalidad.isocenterHeightDefault_m || 1.2, useFactor: terapia ? 0.25 : 1,
  }];
  return { barriers, sources, ancho_px: x1 + margen, alto_px: y1 + margen };
}
