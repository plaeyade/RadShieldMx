/**
 * Fase 10 — Ejemplo del asistente «Guíame»: servicio de PET/CT con cuarto de captación.
 *
 * Plano sintético generado aquí (no proviene de ningún cliente). Escala 0.02 m/px (1 px = 2 cm):
 *
 *   y=100 ┌──────────┬────────────────┬──────────┐   al norte: oficinas (T = 1, público)
 *         │Captación │  Sala PET/CT   │ Control  │
 *         │ 3 × 3 m  │   5 × 4 m      │ 3 × 2 m  │
 *   y=250 ├──────────┤                ├──────────┘
 *         │          │                │
 *   y=300 │ pasillo  └────────────────┘   al sur: pasillo de pacientes (T = 1/5)
 *       x=100      x=250            x=500     x=650
 *
 * Fuentes: F-18 FDG con el modelo por paciente de AAPM TG-108 (Ec. 2–3 en captación, Ec. 9–10 en la
 * sala de imagen), A₀ = 370 MBq, 30 pacientes/semana, captación 1 h, adquisición 0.5 h. La componente de
 * TC se omite a propósito: el motor clasifica la barrera por la primera fuente y en PET/CT la dosis de
 * 511 keV domina el diseño de muros (TG-108 §I); la TC se revisa aparte con el método DLP de NCRP 147.
 *
 * El asistente aplica el ejemplo por partes (paredes → fuentes → ocupación) y sólo si el usuario lo pide.
 */
import type { Barrier, FloorPlan, OccupiedRegion, RadiationSource } from '@/types/radshield';
import { MODALITIES } from '@/types/radshield';
import { NCRP_DESIGN_GOALS } from '@/lib/ncrpOccupancy';

export const NOMBRE_EJEMPLO_GUIADO = 'Ejemplo guiado — PET/CT con cuarto de captación';
export const ESCALA_EJEMPLO_M_PX = 0.02;

/** Plano vacío (sin plano de fondo, sin barreras ni fuentes) que usa el asistente al crear el proyecto. */
export function planoVacio(nombre = 'Proyecto nuevo'): FloorPlan {
  return {
    id: `plan-${Date.now().toString(36)}`,
    name: nombre,
    imageUrl: null,
    scale_m_per_pixel: 0.01,
    width_pixels: 1000,
    height_pixels: 800,
    barriers: [],
    sources: [],
    occupiedRegions: [],
  };
}

type MuroBase = Pick<Barrier, 'id' | 'name' | 'x1' | 'y1' | 'x2' | 'y2'>;

const MUROS: MuroBase[] = [
  { id: 'eg-captacion-oeste', name: 'Captación — muro oeste (exterior)', x1: 100, y1: 100, x2: 100, y2: 250 },
  { id: 'eg-captacion-norte', name: 'Captación — muro norte (oficinas)', x1: 100, y1: 100, x2: 250, y2: 100 },
  { id: 'eg-captacion-sur', name: 'Captación — muro sur (pasillo)', x1: 100, y1: 250, x2: 250, y2: 250 },
  { id: 'eg-captacion-pet', name: 'Muro común captación / sala PET/CT', x1: 250, y1: 100, x2: 250, y2: 300 },
  { id: 'eg-pet-norte', name: 'Sala PET/CT — muro norte (oficinas)', x1: 250, y1: 100, x2: 500, y2: 100 },
  { id: 'eg-pet-sur', name: 'Sala PET/CT — muro sur (pasillo)', x1: 250, y1: 300, x2: 500, y2: 300 },
  { id: 'eg-pet-control', name: 'Sala PET/CT — muro de la sala de control', x1: 500, y1: 100, x2: 500, y2: 300 },
];

/** Paso «importar/dibujar plano»: los muros con valores neutros (T = 1, P público) hasta el paso de ocupación. */
export function muestraParedes(): { scale_m_per_pixel: number; barriers: Barrier[] } {
  return {
    scale_m_per_pixel: ESCALA_EJEMPLO_M_PX,
    barriers: MUROS.map((m) => ({
      ...m,
      barrierType: 'nuclear',
      useFactor: 1,
      occupancyFactor: 1,
      designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.public,
      materialCode: 'CONCRETE235',
    })),
  };
}

function modalidadPET() {
  const m = MODALITIES.find((x) => x.id === 'pet-f18');
  if (!m) throw new Error('Modalidad pet-f18 no encontrada');
  return m;
}

/**
 * Paso «fuentes y carga de trabajo»: paciente en captación y paciente en el equipo PET/CT (TG-108).
 * `isocenterHeight_m = 0`: el motor suma esa altura como desnivel fuente–receptor; TG-108 toma la distancia
 * horizontal del paciente al punto 0.3 m más allá del muro (paciente y receptor a la misma altura). Con 1 m el
 * kerma del muro norte de captación bajaba ~23 % (d = 2.06 m en vez de 1.8 m) y el espesor ~1.9 mm de Pb.
 */
export function muestraFuentes(): RadiationSource[] {
  const modality = modalidadPET();
  const comun = { A0_MBq: 370, pacientesSemana: 30, tU_h: 1, tI_h: 0.5 };
  return [
    {
      id: 'eg-fuente-captacion', name: 'Paciente en captación (F-18 FDG)', x: 175, y: 175, modality,
      workloadValue: 370, workloadUnit: 'MBq', isocenterHeight_m: 0, useFactor: 1,
      tg108: { ...comun, sala: 'captacion' },
    },
    {
      id: 'eg-fuente-petct', name: 'Paciente en el PET/CT (F-18 FDG)', x: 375, y: 200, modality,
      workloadValue: 370, workloadUnit: 'MBq', isocenterHeight_m: 0, useFactor: 1,
      tg108: { ...comun, sala: 'imagen' },
    },
  ];
}

/** Ocupación y uso de áreas (NCRP 147 Tabla 4.1; P de NCRP 147 §1.4): por muro y por región. */
const OCUPACION_MUROS: Record<string, { T: number; P: number }> = {
  'eg-captacion-oeste': { T: 1 / 40, P: NCRP_DESIGN_GOALS.public },
  'eg-captacion-norte': { T: 1, P: NCRP_DESIGN_GOALS.public },
  'eg-captacion-sur': { T: 1 / 5, P: NCRP_DESIGN_GOALS.public },
  'eg-captacion-pet': { T: 1, P: NCRP_DESIGN_GOALS.controlled },
  'eg-pet-norte': { T: 1, P: NCRP_DESIGN_GOALS.public },
  'eg-pet-sur': { T: 1 / 5, P: NCRP_DESIGN_GOALS.public },
  'eg-pet-control': { T: 1, P: NCRP_DESIGN_GOALS.controlled },
};

export function aplicarOcupacion(barriers: Barrier[]): Barrier[] {
  return barriers.map((b) => {
    const o = OCUPACION_MUROS[b.id];
    return o ? { ...b, occupancyFactor: o.T, designGoal_mSv_per_wk: o.P } : b;
  });
}

const rect = (x1: number, y1: number, x2: number, y2: number) => [
  { x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 },
];

export function muestraRegiones(): OccupiedRegion[] {
  return [
    { id: 'eg-reg-oficinas', name: 'Oficinas (público)', occupancyFactor: 1, designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.public, points: rect(100, 40, 650, 98) },
    { id: 'eg-reg-control', name: 'Sala de control (personal)', occupancyFactor: 1, designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.controlled, points: rect(502, 102, 650, 200) },
    { id: 'eg-reg-pasillo', name: 'Pasillo de pacientes', occupancyFactor: 1 / 5, designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.public, points: rect(100, 302, 650, 380) },
  ];
}

/** El ejemplo completo (para pruebas y para «cargar todo de una vez»). */
export function planoEjemploCompleto(): FloorPlan {
  const { scale_m_per_pixel, barriers } = muestraParedes();
  return {
    ...planoVacio(NOMBRE_EJEMPLO_GUIADO),
    id: 'plan-ejemplo-guiado',
    scale_m_per_pixel,
    barriers: aplicarOcupacion(barriers),
    sources: muestraFuentes(),
    occupiedRegions: muestraRegiones(),
  };
}

/** ¿Tiene el plano algo de proyecto? Lo usan el estado vacío y el asistente. */
export function planoTieneContenido(p: Pick<FloorPlan, 'barriers' | 'sources' | 'occupiedRegions' | 'imageUrl'> | null | undefined): boolean {
  if (!p) return false;
  return Boolean(p.imageUrl) || (p.barriers?.length ?? 0) > 0 || (p.sources?.length ?? 0) > 0 || (p.occupiedRegions?.length ?? 0) > 0;
}
