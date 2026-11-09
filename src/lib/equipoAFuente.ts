/**
 * Aplica los parámetros de un equipo del catálogo a una fuente del plano (Fase 8c). Antes el botón
 * «Apply to Shielding Calculator» del autollenado sólo mostraba un aviso y no cargaba nada.
 */
import { MODALITIES, type RadiationSource } from '@/types/radshield';

export interface EquipoCatalogo { name: string; energies: number[]; workload_Gy_week: number; isoHeight_m: number }

/** Modalidad del plano para el equipo: LINAC por la mayor energía tabulada (6/10/15/18 MV), Co-60 o PET. */
export function modalidadEquipo(e: EquipoCatalogo): string | null {
  const emax = Math.max(...e.energies);
  if (e.energies.includes(511)) return 'pet-f18';
  if (Math.abs(emax - 1.25) < 0.01) return 'gamma-knife';
  if (emax >= 1 && emax <= 30) return emax >= 18 ? 'linac-18mv' : emax >= 15 ? 'linac-15mv' : emax >= 10 ? 'linac-10mv' : 'linac-6mv';
  return null;
}

export function aplicarEquipoAFuente(f: RadiationSource, e: EquipoCatalogo): RadiationSource {
  const id = modalidadEquipo(e);
  const m = MODALITIES.find(x => x.id === id);
  if (!m) return f;
  // En terapia la fuente lleva fracciones/semana: W (Gy/semana) / Gy por fracción de la modalidad.
  const workloadValue = m.category === 'therapy' && e.workload_Gy_week > 0 && m.doseRateConstant > 0
    ? e.workload_Gy_week / m.doseRateConstant : f.workloadValue;
  return { ...f, name: e.name, modality: m, workloadUnit: m.unit, workloadValue, isocenterHeight_m: e.isoHeight_m || f.isocenterHeight_m };
}
