/**
 * Fase 10 — Lógica del asistente «Guíame» (sin React): pasos, detección de avance sobre el plano y
 * progreso persistente (saltar, pausar, reanudar y reiniciar).
 */
import type { FloorPlan } from '@/types/radshield';
import { P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana } from '@/lib/limitesDosis';

export type IdPaso = 'proyecto' | 'plano' | 'fuentes' | 'ocupacion' | 'calculo' | 'cumplimiento' | 'reporte';

export interface PasoGuia {
  id: IdPaso;
  titulo: string;
  explicacion: string;
  /** Qué hacer con un proyecto propio (sin el ejemplo). */
  comoHacerlo: string;
  /** Qué aporta el ejemplo PET/CT en este paso (si aplica). */
  ejemplo?: string;
}

export const PASOS_GUIA: readonly PasoGuia[] = [
  {
    id: 'proyecto', titulo: 'Crear el proyecto',
    explicacion: 'Empieza con un lienzo vacío o abre un proyecto guardado. Nada de lo que hagas aquí toca otros proyectos.',
    comoHacerlo: 'Pulsa «Crear proyecto vacío» o abre uno con «Abrir proyecto».',
  },
  {
    id: 'plano', titulo: 'Importar o dibujar el plano',
    explicacion: 'Las barreras (muros, puertas, losas) son los segmentos que se van a blindar. Puedes importar un DXF, cargar una imagen y calibrar la escala, o dibujar los muros a mano.',
    comoHacerlo: 'Importa un DXF o elige la herramienta «Barrera» y traza cada muro.',
    ejemplo: 'Servicio de PET/CT sintético: cuarto de captación de 3 × 3 m, sala PET/CT de 5 × 4 m y sala de control (escala 2 cm/px).',
  },
  {
    id: 'fuentes', titulo: 'Definir fuentes y carga de trabajo',
    explicacion: 'Cada fuente lleva su modalidad y su carga de trabajo. En PET se usa el modelo por paciente de AAPM TG-108: actividad administrada, pacientes por semana y tiempos de captación e imagen.',
    comoHacerlo: 'Elige la herramienta «Fuente», colócala en el plano y edita modalidad y carga en el panel lateral.',
    ejemplo: 'Dos pacientes con F-18 FDG: 370 MBq, 30 pacientes/semana, captación 1 h e imagen 0.5 h (TG-108).',
  },
  {
    id: 'ocupacion', titulo: 'Ocupación y uso de las áreas',
    explicacion: `Para cada muro, el factor de ocupación T del lado protegido y el objetivo de diseño P: ${P_CONTROLADA_mSv_semana} mSv/semana en zona controlada, ${P_NO_CONTROLADA_mSv_semana} mSv/semana en zona pública (NCRP 147).`,
    comoHacerlo: 'Selecciona cada barrera y ajusta T y P en el panel lateral, o dibuja regiones ocupadas con la herramienta «Región».',
    ejemplo: 'Oficinas al norte (T = 1, público), pasillo al sur (T = 1/5), exterior al oeste (T = 1/40) y control (T = 1, controlada).',
  },
  {
    id: 'calculo', titulo: 'Calcular espesores',
    explicacion: 'El cálculo usa el motor validado del botón «Calcular» (NCRP 147, NCRP 151 y TG-108 según la modalidad) y escribe en cada barrera el kerma sin blindaje y el espesor requerido por material.',
    comoHacerlo: 'Pulsa «Calcular espesores» (o F5).',
  },
  {
    id: 'cumplimiento', titulo: 'Revisar cumplimiento',
    explicacion: 'Compara la dosis de cada barrera con su objetivo de diseño y revisa los avisos de auditoría (datos faltantes, distancias muy cortas, factores fuera de rango).',
    comoHacerlo: 'Abre el validador del plano y el panel de resultados.',
  },
  {
    id: 'reporte', titulo: 'Exportar el reporte',
    explicacion: 'Genera la memoria analítica en PDF o la tabla CSV. Es un resultado preliminar: requiere revisión y firma de un experto calificado (OSR) antes de uso regulatorio.',
    comoHacerlo: 'Pulsa «Exportar PDF» o «Exportar CSV».',
  },
];

/** ¿El plano ya muestra el paso como hecho? (sirve para marcarlo en verde, no obliga a nada). */
export function pasoCumplido(id: IdPaso, plan: FloorPlan | null | undefined, visitados: readonly IdPaso[] = []): boolean {
  if (visitados.includes(id)) return true;
  if (!plan) return false;
  switch (id) {
    case 'proyecto': return plan.id !== 'plan-1';
    case 'plano': return plan.barriers.length > 0 || Boolean(plan.imageUrl);
    case 'fuentes': return plan.sources.length > 0;
    case 'ocupacion': return plan.occupiedRegions.length > 0 || plan.barriers.some((b) => b.occupancyFactor !== 1);
    case 'calculo': return plan.barriers.some((b) => typeof b.maxKerma === 'number');
    default: return false;
  }
}

export type EstadoGuia = 'inactivo' | 'activo' | 'pausado' | 'terminado';

export interface ProgresoGuia {
  estado: EstadoGuia;
  paso: number;
  saltados: IdPaso[];
  visitados: IdPaso[];
  /** El usuario pidió el ejemplo PET/CT en este recorrido. */
  usaEjemplo: boolean;
}

export const CLAVE_PROGRESO_GUIA = 'radshield-guia-v1';
export const PROGRESO_INICIAL: ProgresoGuia = { estado: 'inactivo', paso: 0, saltados: [], visitados: [], usaEjemplo: false };

const acotar = (n: number) => Math.max(0, Math.min(PASOS_GUIA.length - 1, Math.trunc(Number.isFinite(n) ? n : 0)));

export type AccionGuia =
  | { tipo: 'iniciar' }
  | { tipo: 'reanudar' }
  | { tipo: 'pausar' }
  | { tipo: 'siguiente' }
  | { tipo: 'anterior' }
  | { tipo: 'saltar' }
  | { tipo: 'ir'; paso: number }
  | { tipo: 'visitar'; id: IdPaso }
  | { tipo: 'usarEjemplo' };

export function reducirGuia(p: ProgresoGuia, a: AccionGuia): ProgresoGuia {
  const ultimo = PASOS_GUIA.length - 1;
  switch (a.tipo) {
    case 'iniciar': return { ...PROGRESO_INICIAL, estado: 'activo' };
    case 'reanudar': return p.estado === 'terminado' || p.estado === 'inactivo' ? { ...PROGRESO_INICIAL, estado: 'activo' } : { ...p, estado: 'activo' };
    case 'pausar': return p.estado === 'activo' ? { ...p, estado: 'pausado' } : p;
    case 'siguiente': return p.paso >= ultimo ? { ...p, estado: 'terminado' } : { ...p, paso: p.paso + 1 };
    case 'anterior': return { ...p, paso: acotar(p.paso - 1) };
    case 'saltar': {
      const id = PASOS_GUIA[p.paso].id;
      const saltados = p.saltados.includes(id) ? p.saltados : [...p.saltados, id];
      return p.paso >= ultimo ? { ...p, saltados, estado: 'terminado' } : { ...p, saltados, paso: p.paso + 1 };
    }
    case 'ir': return { ...p, paso: acotar(a.paso) };
    case 'visitar': return p.visitados.includes(a.id) ? p : { ...p, visitados: [...p.visitados, a.id] };
    case 'usarEjemplo': return { ...p, usaEjemplo: true };
  }
}

export function leerProgreso(storage: Pick<Storage, 'getItem'> | null | undefined): ProgresoGuia {
  try {
    const raw = storage?.getItem(CLAVE_PROGRESO_GUIA);
    if (!raw) return PROGRESO_INICIAL;
    const v = JSON.parse(raw) as Partial<ProgresoGuia>;
    const ids = new Set(PASOS_GUIA.map((x) => x.id));
    const estados: EstadoGuia[] = ['inactivo', 'activo', 'pausado', 'terminado'];
    return {
      estado: estados.includes(v.estado as EstadoGuia) ? (v.estado as EstadoGuia) : 'inactivo',
      paso: acotar(Number(v.paso)),
      saltados: Array.isArray(v.saltados) ? v.saltados.filter((x): x is IdPaso => ids.has(x as IdPaso)) : [],
      visitados: Array.isArray(v.visitados) ? v.visitados.filter((x): x is IdPaso => ids.has(x as IdPaso)) : [],
      usaEjemplo: v.usaEjemplo === true,
    };
  } catch {
    return PROGRESO_INICIAL;
  }
}

export function guardarProgreso(storage: Pick<Storage, 'setItem'> | null | undefined, p: ProgresoGuia): void {
  try { storage?.setItem(CLAVE_PROGRESO_GUIA, JSON.stringify(p)); } catch { /* almacenamiento bloqueado: la guía sigue en memoria */ }
}
