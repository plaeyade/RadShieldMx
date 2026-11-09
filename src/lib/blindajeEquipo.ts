/**
 * Fase 8a — cálculo del asistente de blindaje por equipo (EquipmentShieldingWizard).
 *
 * Antes: B = P(mSv)·d²/W(Gy) sin el factor 10⁻³ (≈ 3 TVL de menos), primaria sin T, factor IMRT aplicado a la
 * primaria, escalera de TVL con ramas inalcanzables y un material por omisión inexistente (no calculaba nada).
 * Ahora: NCRP 151 con `barreraMV` — primaria (Ec. 2.1/2.3), fuga (Ec. 2.8, W_L de la Ec. 3.6 con C_I de la técnica)
 * y dispersión (Ec. 2.7) — para aceleradores y Gamma Knife (Co-60). Otras categorías devuelven lista vacía.
 */
import { barreraMV, energiaTabuladaMV } from './calculadorasNormativas';
import type { MaterialNCRP151 } from './ncrp151';

export interface EntradaBlindajeEquipo {
  categoria: string; energia_MeV: number; C1: number; W_Gy_semana: number; U: number; T: number;
  P_mSv_semana: number; d_m: number; materialId: string;
}

export interface FilaBlindajeEquipo {
  barrier: string;
  type: 'primary' | 'secondary' | 'leakage' | 'scatter';
  thickness_cm: number;
  thickness_mm: number;
  transmission: number;
  dose_mSv_week: number;
  meetsLimit: boolean;
}

/** Concretos pesados → TVL del concreto 2.35 (conservador: más espesor). */
export function materialNCRP151DeId(id: string): MaterialNCRP151 {
  const v = id.toLowerCase();
  if (v.includes('lead') || v.includes('plomo')) return 'lead';
  if (v.includes('steel') || v.includes('acero')) return 'steel';
  return 'concrete';
}

export function blindajeEquipo(e: EntradaBlindajeEquipo): FilaBlindajeEquipo[] {
  if (e.categoria !== 'LINAC' && e.categoria !== 'GammaKnife') return [];
  const energia = e.categoria === 'GammaKnife' ? ('Co60' as const) : energiaTabuladaMV(e.energia_MeV);
  const base = { material: materialNCRP151DeId(e.materialId), P_mSv_semana: e.P_mSv_semana, T: Math.min(1, e.T), U: e.U, d_m: e.d_m };
  const pri = barreraMV({ ...base, tipo: 'primaria', haces: [{ energia, W_Gy_semana: e.W_Gy_semana }] });
  const sec = barreraMV({
    ...base, tipo: 'secundaria', haces: [{ energia, W_Gy_semana: e.W_Gy_semana, fraccionIMRT: e.C1 > 1 ? 1 : 0, factorIMRT: e.C1 }],
  });
  const out: FilaBlindajeEquipo[] = [{
    barrier: 'Barrera primaria (NCRP 151 Ec. 2.1)', type: 'primary', thickness_cm: pri.espesorRedondeado_cm,
    thickness_mm: pri.espesorRedondeado_cm * 10, transmission: pri.componentes[0].B_requerida,
    dose_mSv_week: pri.dosisOcupacion_mSv_semana, meetsLimit: pri.cumple,
  }];
  for (const c of sec.componentes) {
    out.push({
      barrier: `Componente: ${c.nombre}`, type: c.tipo === 'fuga' ? 'leakage' : 'scatter', thickness_cm: c.espesor_cm,
      thickness_mm: c.espesor_cm * 10, transmission: c.B_requerida,
      dose_mSv_week: base.T * c.K_mSv_semana * c.transmision(c.espesor_cm), meetsLimit: true,
    });
  }
  out.push({
    barrier: 'Barrera secundaria (fuga + dispersión, dos fuentes)', type: 'secondary', thickness_cm: sec.espesorRedondeado_cm,
    thickness_mm: sec.espesorRedondeado_cm * 10, transmission: Math.min(...sec.componentes.map((c) => c.B_requerida)),
    dose_mSv_week: sec.dosisOcupacion_mSv_semana, meetsLimit: sec.cumple,
  });
  return out;
}
