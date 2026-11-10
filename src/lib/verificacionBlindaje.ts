/**
 * Verificación de blindaje: compara, barrera por barrera, el espesor INSTALADO (capas o espesor
 * declarado) con el REQUERIDO que calculó el motor para el material seleccionado.
 *
 * No recalcula el blindaje. Señala lo que falta para cerrar la memoria:
 * - barreras sin cálculo;
 * - barreras sin espesor instalado;
 * - espesores insuficientes;
 * - capas de otro material que no se pueden comparar directamente.
 *
 * Cuando hay margen y una TVL conocida, estima la dosis tras la barrera con P·10^(−margen/TVL).
 */
import type { Barrier, FloorPlan } from '@/types/radshield';
import { codigoCatalogo } from '@/lib/shieldingMath';

export type EstadoVerificacion = 'CUMPLE' | 'NO_CUMPLE' | 'SIN_CALCULO' | 'SIN_ESPESOR' | 'REVISAR_MATERIAL';

export interface FilaVerificacion {
  barreraId: string;
  barrera: string;
  material: string;
  requerido_mm: number | null;
  instalado_mm: number | null;
  margen_mm: number | null;
  dosisEstimada_mSv_sem: number | null;
  objetivo_mSv_sem: number;
  estado: EstadoVerificacion;
  nota: string;
}

export function espesorRequerido(b: Barrier): number | null {
  const r = b.requiredThickness_mm;
  if (typeof r === 'number') return Number.isFinite(r) ? r : null;
  if (r && typeof r === 'object') {
    const v = r[b.materialCode] ?? r[codigoCatalogo(b.materialCode)];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  return null;
}

export function espesorInstalado(b: Barrier): { mm: number | null; mixto: boolean } {
  if (b.shieldingLayers?.length) {
    const mismo = b.shieldingLayers.filter((c) => c.materialCode === b.materialCode);
    const total = mismo.reduce((s, c) => s + (Number.isFinite(c.thickness_mm) ? c.thickness_mm : 0), 0);
    return { mm: total > 0 ? total : null, mixto: mismo.length !== b.shieldingLayers.length };
  }
  return { mm: typeof b.thickness_mm === 'number' && b.thickness_mm > 0 ? b.thickness_mm : null, mixto: false };
}

/**
 * Fase 11: el motor calculó la barrera (traza y kerma) y no publicó espesor porque kerma·T ≤ P: no requiere blindaje
 * adicional. No aplica a ciclotrón (el motor no publica espesor por otra razón) ni a un cálculo sin traza.
 */
export function noRequiereBlindaje(b: Barrier): boolean {
  if (!b.calculationTrace || b.calculationTrace.modalityCategory === 'cyclotron') return false;
  if (typeof b.maxKerma !== 'number' || !Number.isFinite(b.maxKerma) || b.maxKerma < 0) return false;
  const r = b.requiredThickness_mm;
  const hayEspesor = typeof r === 'number' ? r > 0 : Boolean(r && Object.values(r).some((v) => typeof v === 'number' && v > 0));
  if (hayEspesor) return false;
  const T = Number.isFinite(b.occupancyFactor) && b.occupancyFactor > 0 && b.occupancyFactor <= 1 ? b.occupancyFactor : 1;
  return b.maxKerma * T <= b.designGoal_mSv_per_wk;
}

export const NOTA_NO_REQUIERE = 'No requiere blindaje adicional (kerma·T ≤ P sin barrera).';

export function verificarBarrera(b: Barrier, tvl_mm?: (material: string) => number | null): FilaVerificacion {
  if (noRequiereBlindaje(b)) {
    const { mm } = espesorInstalado(b);
    return {
      barreraId: b.id, barrera: b.name, material: b.materialCode, requerido_mm: 0, instalado_mm: mm,
      margen_mm: mm, dosisEstimada_mSv_sem: null, objetivo_mSv_sem: b.designGoal_mSv_per_wk, estado: 'CUMPLE', nota: NOTA_NO_REQUIERE,
    };
  }
  const req = espesorRequerido(b);
  const { mm: inst, mixto } = espesorInstalado(b);
  const base = {
    barreraId: b.id,
    barrera: b.name,
    material: b.materialCode,
    requerido_mm: req,
    instalado_mm: inst,
    objetivo_mSv_sem: b.designGoal_mSv_per_wk,
  };
  if (req === null) return { ...base, margen_mm: null, dosisEstimada_mSv_sem: null, estado: 'SIN_CALCULO', nota: 'Ejecutar el cálculo de la barrera.' };
  if (inst === null) return { ...base, margen_mm: null, dosisEstimada_mSv_sem: null, estado: 'SIN_ESPESOR', nota: 'Declarar el espesor o las capas instaladas.' };
  const margen = inst - req;
  if (mixto) {
    return { ...base, margen_mm: margen, dosisEstimada_mSv_sem: null, estado: 'REVISAR_MATERIAL', nota: 'Hay capas de otro material: convertir a equivalente antes de comparar.' };
  }
  const tvl = tvl_mm?.(b.materialCode) ?? null;
  const dosis = tvl && tvl > 0 ? b.designGoal_mSv_per_wk * 10 ** (-margen / tvl) : null;
  return {
    ...base,
    margen_mm: margen,
    dosisEstimada_mSv_sem: dosis,
    estado: margen >= 0 ? 'CUMPLE' : 'NO_CUMPLE',
    nota: margen >= 0 ? 'Espesor instalado ≥ requerido.' : `Faltan ${Math.ceil(-margen)} mm.`,
  };
}

export function verificarPlano(plano: FloorPlan, tvl_mm?: (material: string) => number | null) {
  const filas = plano.barriers.map((b) => verificarBarrera(b, tvl_mm));
  const cuenta = (e: EstadoVerificacion) => filas.filter((f) => f.estado === e).length;
  return {
    filas,
    resumen: {
      total: filas.length,
      cumple: cuenta('CUMPLE'),
      noCumple: cuenta('NO_CUMPLE'),
      pendientes: cuenta('SIN_CALCULO') + cuenta('SIN_ESPESOR') + cuenta('REVISAR_MATERIAL'),
    },
    apto: filas.length > 0 && filas.every((f) => f.estado === 'CUMPLE'),
  };
}
