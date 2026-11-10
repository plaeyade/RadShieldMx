/**
 * Fase 10: filas de resultados de barreras sacadas del proyecto (sustituye tablas fijas de ejemplo en los
 * reportes) y textos de estado vacío compartidos por diálogos que necesitan plano, fuentes o cálculo.
 */
import type { FloorPlan } from '@/types/radshield';
import { codigoCatalogo } from '@/lib/shieldingMath';

export type EstadoBarrera = 'sin-calculo' | 'no-requiere' | 'requiere';

export interface FilaResultado {
  id: string;
  nombre: string;
  material: string;
  espesor_mm: number | null;
  kerma_mSv_semana: number | null;
  T: number;
  P_mSv_semana: number;
  estado: EstadoBarrera;
}

export function filasResultados(plan: Pick<FloorPlan, 'barriers'> | null | undefined): FilaResultado[] {
  return (plan?.barriers ?? []).map((b) => {
    const codigo = codigoCatalogo(b.materialCode);
    const req = b.requiredThickness_mm;
    const espesor = typeof req === 'number' ? req : (req && typeof req[codigo] === 'number' ? req[codigo] : null);
    const kerma = typeof b.maxKerma === 'number' && Number.isFinite(b.maxKerma) ? b.maxKerma : null;
    const T = Number.isFinite(b.occupancyFactor) && b.occupancyFactor > 0 ? b.occupancyFactor : 1;
    const estado: EstadoBarrera = kerma === null ? 'sin-calculo' : kerma * T <= b.designGoal_mSv_per_wk ? 'no-requiere' : 'requiere';
    return { id: b.id, nombre: b.name, material: codigo, espesor_mm: espesor !== null && Number.isFinite(espesor) ? espesor : null, kerma_mSv_semana: kerma, T, P_mSv_semana: b.designGoal_mSv_per_wk, estado };
  });
}

export type FaltaProyecto = 'plano' | 'fuentes' | 'calculo' | null;

/** Lo primero que le falta al proyecto para que un reporte o visor tenga contenido real. */
export function faltaEnProyecto(plan: Pick<FloorPlan, 'barriers' | 'sources'> | null | undefined): FaltaProyecto {
  if (!plan || plan.barriers.length === 0) return 'plano';
  if (plan.sources.length === 0) return 'fuentes';
  if (!plan.barriers.some((b) => typeof b.maxKerma === 'number')) return 'calculo';
  return null;
}

export const MENSAJE_FALTA: Record<Exclude<FaltaProyecto, null>, string> = {
  plano: 'El proyecto no tiene barreras: importe o dibuje el plano (o use Ayuda → Guíame).',
  fuentes: 'El proyecto no tiene fuentes: coloque al menos una fuente con su carga de trabajo.',
  calculo: 'Aún no se calculan las barreras: ejecute «Calcular» para obtener kerma y espesores.',
};
