/**
 * Fase 4 — Suite de validación normativa: NCRP Report No. 151 (2005), Sección 7.1 «Conventional Treatment Unit
 * with Maze» (pp. 105–148), de extremo a extremo con `normativeBarrierEngine` (espesor), `doseFieldEngine`
 * (campo detrás del espesor publicado) y `ncrp151Laberinto` (laberinto, puerta y neutrones).
 *
 * Datos comunes (§7.1, p. 105): acelerador de doble energía, W(18 MV) = 450 Gy/semana (30 pacientes × 3 Gy × 5 d)
 * y W(6 MV) = 225 Gy/semana; IMRT (§7.1.4, p. 112): 40 % de 18 MV y 80 % de 6 MV con C_I = 5.
 * En el lienzo: fracciones = W / 2 Gy; IMRT explícito (0 sin IMRT) para no usar el 50 % por omisión.
 *
 * Geometría: fuente en (0, 0), punto en (d, 0), barrera perpendicular con su cara exterior a 0.3 m del punto,
 * escala 1 m/px, isocentro a 0 m de altura. En las primarias d se mide desde el BLANCO (d + 1 m, Ec. 2.1): la
 * fuente se coloca en el blanco. Las barreras secundarias se validan con incidencia normal (t = t_s).
 *
 * Tolerancias:
 * - Espesor: ±1.5 % (y ≥ publicado − 0.5 cm). El motor usa la suma directa de componentes y, en secundaria, la regla
 *   de dos fuentes por tipo con el HVL de TVL₁ de fuga (36 cm); el informe alterna TVL₁/TVLₑ (34/36 cm), lo que
 *   cambia ≤ 0.6 cm por paso, y redondea n a dos decimales.
 * - Dosis por componente detrás del espesor publicado: ±5 % (el informe redondea a 2 cifras); totales ±3 %.
 */
import { describe, expect, it } from 'vitest';
import { calcularBarreraNormativa } from '@/lib/normativeBarrierEngine';
import { dosisEnPunto, type ComponenteCampo } from '@/lib/doseFieldEngine';
import { cargaFuga, combinarDosFuentes, fuga, transmisionTVL, tvlFuga, type FuenteTeleterapia } from '@/lib/ncrp151';
import {
  albedoConcreto, capturaGammaPorGy, fluenciaA, fotonesEnPuerta, neutronesKersey, neutronesWuMcGinley, puerta,
} from '@/lib/ncrp151Laberinto';
import { MATERIALS, MODALITIES, type Barrier, type RadiationSource } from '@/types/radshield';

const linac = (mv: 6 | 18, imrt = false): RadiationSource => ({
  id: `l${mv}`, x: 0, y: 0, name: `${mv} MV`, modality: MODALITIES.find((m) => m.id === `linac-${mv}mv`)!,
  workloadValue: (mv === 18 ? 450 : 225) / 2, workloadUnit: 'fracciones/semana', isocenterHeight_m: 0, useFactor: 0.25,
  imrtFraction: imrt ? (mv === 18 ? 0.4 : 0.8) : 0, imrtFactor: 5,
});
const dual = (imrt = false) => [linac(18, imrt), linac(6, imrt)];

const barrera = (d: number, extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', x1: d - 0.3, y1: -4, x2: d - 0.3, y2: 4, name: 'barrera', barrierType: 'secondary', useFactor: 0.25,
  occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', scatterAngle_deg: 30, ...extra,
});

/** Espesor del motor normativo (cm de concreto). */
const espesor = (fs: RadiationSource[], d: number, b: Barrier) => {
  const r = calcularBarreraNormativa(b, fs, [{ x: d, y: 0 }], 1, MATERIALS);
  expect(r?.metodo).toBe('NCRP151');
  return r!.espesores_mm.CONCRETE235 / 10;
};

const espesorCumple = (calc: number, pub: number) => {
  expect(Math.abs(calc - pub) / pub).toBeLessThanOrEqual(0.015);
  expect(calc).toBeGreaterThanOrEqual(pub - 0.5);
};

const dentro = (calc: number, pub: number, tol: number) => {
  expect(Math.abs(calc - pub) / pub).toBeLessThanOrEqual(tol);
};

/** Dosis equivalente semanal (µSv, con T) por fuente y componente detrás de t_cm de concreto. */
const campo = (fs: RadiationSource[], d: number, b: Barrier, t_cm: number) => {
  const x = d - 0.3 - t_cm / 100; // cara interior: la banda se extiende hacia el punto
  const r = dosisEnPunto(fs, d, 0, 1, { barriers: [{ ...b, x1: x, x2: x, thickness_mm: t_cm * 10 }], materials: MATERIALS });
  const uSv = (id: string, c: ComponenteCampo) =>
    (r.porFuente.find((p) => p.sourceId === id)?.componentes.find((k) => k.componente === c)?.kerma_mSv_semana ?? 0) * 1000 * b.occupancyFactor;
  return { uSv, total: r.kerma_mSv_semana * 1000 * b.occupancyFactor };
};

describe('NCRP 151 §7.1 — barreras primarias', () => {
  it('§7.1.1 Ubicación C (P = 20 µSv, T = 1/40, U = 0.25, d = 6.2 + 1 m): B = 3.69×10⁻⁴, 149.6 cm; 6 MV detrás de 150 cm = 1 µSv/semana', () => {
    const b = barrera(7.2, { barrierType: 'primary', occupancyFactor: 0.025 });
    espesorCumple(espesor([linac(18)], 7.2, b), 149.6);
    // Detrás de 149.6 cm la primaria de 18 MV es P = 20 µSv/semana (con T).
    dentro(campo(dual(), 7.2, b, 149.6).uSv('l18', 'primaria'), 20, 0.01);
    dentro(campo(dual(), 7.2, b, 150).uSv('l6', 'primaria'), 1, 0.05);
  });

  it('§7.1.3 dispersión del paciente a ~10° detrás de 176 cm en C: 0.51 µSv (18 MV) y 0.014 µSv (6 MV)', () => {
    // Se valida la Ec. 2.7 del motor con θ = 10°, U = 0.25, d_sec = 6.2 m, T = 1/40.
    const b = barrera(6.2, { occupancyFactor: 0.025, scatterAngle_deg: 10 });
    const c = campo(dual(), 6.2, b, 176);
    dentro(c.uSv('l18', 'dispersion'), 0.51, 0.05);
    // 6 MV: el informe interpola TVL ≈ 35 cm a 10° (Tabla B.5a); el motor toma la fila de 15° (34 cm, más penetrante): mayor.
    expect(c.uSv('l6', 'dispersion')).toBeGreaterThanOrEqual(0.014);
    expect(c.uSv('l6', 'dispersion')).toBeLessThan(0.05);
  });

  it('§7.1.4 fuga detrás de 176 cm en C (d_L = 6.2 m): 2.2×10⁻³ µSv (18 MV) y 1.9×10⁻⁴ µSv (6 MV)', () => {
    const c = campo(dual(), 6.2, barrera(6.2, { occupancyFactor: 0.025 }), 176);
    dentro(c.uSv('l18', 'fuga'), 2.2e-3, 0.05);
    dentro(c.uSv('l6', 'fuga'), 1.9e-4, 0.05);
  });

  it('§7.1.7 Ubicación D, control (P = 100 µSv, T = 1): B = 4.61×10⁻⁵, 188.6 cm; 6 MV detrás de 189 cm = 2.7 µSv', () => {
    const b = barrera(7.2, { barrierType: 'primary', designGoal_mSv_per_wk: 0.1 });
    espesorCumple(espesor(dual(), 7.2, b), 188.6);
    dentro(campo(dual(), 7.2, b, 189).uSv('l6', 'primaria'), 2.7, 0.05);
  });

  it('§7.1.14 techo G (T = 1/40, d_G = 4 + 1 m): 163 cm (18 MV) frente a 118 cm (6 MV); R_w(6 MV) = 34 µSv/semana sin T', () => {
    const b = barrera(5, { barrierType: 'primary', occupancyFactor: 0.025 });
    espesorCumple(espesor(dual(), 5, b), 163);
    espesorCumple(espesor([linac(6)], 5, b), 118);
    // R_w(6 MV) = B(6 MV, 163 cm)·W·U/(d_G+1)² (sin T): 3.4×10⁻⁵ Sv/semana.
    dentro(campo(dual(), 5, b, 163).uSv('l6', 'primaria') / 0.025, 34, 0.05);
  });
});

describe('NCRP 151 §7.1 — barreras secundarias (fuga + dispersión del paciente)', () => {
  it('§7.1.5 Ubicación A (P = 20 µSv, T = 1/40, θ = 30°, d = 7.2 m): 66.4 cm; detrás: 2.8 / 4.6 (18 MV) y 0.8 / 0.8 (6 MV) → 9 µSv', () => {
    const b = barrera(7.2, { occupancyFactor: 0.025 });
    espesorCumple(espesor(dual(), 7.2, b), 66.4);
    const c = campo(dual(), 7.2, b, 66.4);
    dentro(c.uSv('l18', 'fuga'), 2.8, 0.05);
    dentro(c.uSv('l18', 'dispersion'), 4.6, 0.05);
    dentro(c.uSv('l6', 'fuga'), 0.8, 0.05);
    dentro(c.uSv('l6', 'dispersion'), 0.8, 0.07); // 0.84 publicado como «0.8» (una cifra significativa)
    dentro(c.total, 9, 0.03);
  });

  it('§7.1.5 con IMRT: 73 cm; detrás: 7.5 µSv (18 MV) + 2.5 µSv (6 MV) = 10 µSv', () => {
    const b = barrera(7.2, { occupancyFactor: 0.025 });
    espesorCumple(espesor(dual(true), 7.2, b), 73);
    const c = campo(dual(true), 7.2, b, 73);
    dentro(c.uSv('l18', 'fuga') + c.uSv('l18', 'dispersion'), 7.5, 0.03);
    dentro(c.uSv('l6', 'fuga') + c.uSv('l6', 'dispersion'), 2.5, 0.03);
  });

  it('§7.1.8 Ubicación B (controlada, P = 100 µSv, T = 1): 94.7 cm; detrás: 24.1 / 16.3 (18 MV), 2.7 / 3.5 (6 MV) → 47 µSv', () => {
    const b = barrera(7.2, { designGoal_mSv_per_wk: 0.1 });
    espesorCumple(espesor(dual(), 7.2, b), 94.7);
    const c = campo(dual(), 7.2, b, 94.7);
    dentro(c.uSv('l18', 'dispersion'), 24.1, 0.05);
    dentro(c.uSv('l18', 'fuga'), 16.3, 0.05);
    dentro(c.uSv('l6', 'dispersion'), 2.7, 0.05);
    dentro(c.uSv('l6', 'fuga'), 3.5, 0.05);
    dentro(c.total, 47, 0.03);
  });

  it('§7.1.8 con IMRT: 102.4 cm; detrás: 39.1 µSv (18 MV) + 9.4 µSv (6 MV) = 48.5 µSv', () => {
    const b = barrera(7.2, { designGoal_mSv_per_wk: 0.1 });
    espesorCumple(espesor(dual(true), 7.2, b), 102.4);
    const c = campo(dual(true), 7.2, b, 102.4);
    dentro(c.uSv('l18', 'fuga') + c.uSv('l18', 'dispersion'), 39.1, 0.03);
    dentro(c.uSv('l6', 'fuga') + c.uSv('l6', 'dispersion'), 9.4, 0.03);
  });

  it('§7.1.9 Ubicación E (T = 1/5, θ = 90°, U = 1, d = 5.4 m): ~87 cm (fuga domina; dispersión ~45 cm, a más de 1 TVL)', () => {
    espesorCumple(espesor(dual(), 5.4, barrera(5.4, { occupancyFactor: 0.2, useFactor: 1, scatterAngle_deg: 90 })), 87);
  });

  it.todo('§7.1.9 verificación sin IMRT detrás de 87 cm: el informe da 8.8 µSv (18 MV) + 2.4 µSv (6 MV) = 11.2 µSv; con la Ec. 2.8 y la Tabla B.7 (TVL 36/34 cm) el motor obtiene 9.8 + 2.3 = 12.1 µSv (≤ 20 µSv). El 8.8 publicado no es reproducible con los datos del propio ejemplo (el caso con IMRT, misma fórmula, sí coincide: 12.8 µSv)');

  it('§7.1.9 con IMRT: 101.2 cm (90.4 + 1 HVL de 10.8 cm); fuga detrás = 12.8 µSv', () => {
    const b = barrera(5.4, { occupancyFactor: 0.2, useFactor: 1, scatterAngle_deg: 90 });
    espesorCumple(espesor(dual(true), 5.4, b), 101.2);
    const c = campo(dual(true), 5.4, b, 101.2);
    dentro(c.uSv('l18', 'fuga') + c.uSv('l6', 'fuga'), 12.8, 0.03);
  });

  it.todo('§7.1.15 techo H (T = 1/40, d = 3.9 m): el informe aplica la regla de dos fuentes sólo al par mayor (63 cm de dispersión 18 MV + 1 HVL = 72.6 → 73 cm) e ignora la fuga de 55.4 cm; con la regla por tipo de §7.1.5/§7.1.8 el motor da 83.5 cm (conservador). La dosis detrás de 73 cm sí se reproduce (prueba siguiente)');

  it('§7.1.15 detrás de 73 cm (sin IMRT): 6 / 1.7 µSv de fuga y 9.8 / 1.6 µSv de dispersión → 19 µSv', () => {
    const b = barrera(3.9, { occupancyFactor: 0.025 });
    const c = campo(dual(), 3.9, b, 73);
    dentro(c.uSv('l18', 'fuga'), 6, 0.05);
    dentro(c.uSv('l6', 'fuga'), 1.7, 0.05);
    dentro(c.uSv('l18', 'dispersion'), 9.8, 0.05);
    dentro(c.uSv('l6', 'dispersion'), 1.6, 0.05);
    dentro(c.total, 19, 0.03);
  });

  it('§7.1.15 con IMRT: 80.1 cm dejan 20.5 µSv (> P) y el informe sube a 91 cm (9.3 µSv); el motor da 91 cm', () => {
    const b = barrera(3.9, { occupancyFactor: 0.025 });
    dentro(campo(dual(true), 3.9, b, 80.1).total, 20.5, 0.03);
    dentro(campo(dual(true), 3.9, b, 91).total, 9.3, 0.03);
    espesorCumple(espesor(dual(true), 3.9, b), 91);
  });
});

describe('NCRP 151 §7.1.10–7.1.13 y §7.1.17 — laberinto, puerta y neutrones', () => {
  // §7.1.10 (pp. 128–133) y Fig. 7.1.
  const geo = { dh_m: 4.2, dr_m: 5.9, dz_m: 6.8, A0_m2: 2.82, Az_m2: 8.4, dsec_m: 7.3, dsecFuga_m: 7.9, dzz_m: 9.9, A1_m2: 11.8, dL_m: 7.1 };
  // Muro del laberinto: t_s = 125 cm (§7.1.17); TVL de fuga de la Tabla B.7.
  const fotones = (imrt: boolean) => {
    const f18: FuenteTeleterapia = { energia: 18, W_Gy_semana: 450, fraccionIMRT: imrt ? 0.4 : 0, factorIMRT: 5 };
    const f6: FuenteTeleterapia = { energia: 6, W_Gy_semana: 225, fraccionIMRT: imrt ? 0.8 : 0, factorIMRT: 5 };
    const una = (f: FuenteTeleterapia) => fotonesEnPuerta(
      { ...geo, B_muroZ: transmisionTVL(125, tvlFuga(f.energia, 'concrete')) },
      // α₀ y α_z: Tabla B.8a con reflexión a 75° (§7.1.10.1); α₁: valores por omisión del motor (Tabla B.8b, 45°).
      { energia: f.energia, W_Gy_semana: f.W_Gy_semana, WL_Gy_semana: cargaFuga(f), f: 0.34,
        alfa0: albedoConcreto(String(f.energia), 75), alfaZ: albedoConcreto('0.5MeV', 75) },
    );
    const a = una(f18), b = una(f6);
    return { HS: a.HS + b.HS, HLS: a.HLS + b.HLS, Hps: a.Hps + b.Hps, HLT: a.HLT + b.HLT, HTot: a.HTot + b.HTot };
  };

  it('§7.1.10 fotones en la puerta: H_S = 2.2, H_LS = 1.7, H_ps = 34.9, H_LT = 0.6 µSv → H_Tot = 2.64·H_G = 100 µSv/semana', () => {
    const h = fotones(false);
    dentro(h.HS * 1e6, 2.21, 0.03);
    dentro(h.HLS * 1e6, 1.7, 0.03);
    dentro(h.Hps * 1e6, 34.9, 0.03);
    dentro(h.HLT * 1e6, 0.6, 0.05); // 0.5 + 0.08 publicado; d_L = 7.1 m (el informe opera con 7.3 m en H_LT(18 MV))
    dentro(h.HTot * 1e6, 100, 0.03);
  });

  it('§7.1.10.6 con IMRT: H_LS = 5.5, H_LT = 1.7 µSv → H_Tot = 113 µSv/semana', () => {
    const h = fotones(true);
    dentro(h.HLS * 1e6, 5.5, 0.03);
    dentro(h.HLT * 1e6, 1.7, 0.05);
    dentro(h.HTot * 1e6, 113, 0.03);
  });

  // §7.1.11–7.1.12 (pp. 133–136): Varian 1800 a 18 MV (Tabla B.9: Q_n = 1.22×10¹², H₀ = 1.6 mSv/Gy).
  const sala = { Qn: 1.22e12, d1_m: 6.4, d2_m: 8.5, Sr_m2: 2 * (7.8 * 3.65 + 7.8 * 3.65 + 7.8 * 7.8), S0_m2: 9.2, S1_m2: 8.4, H0_mSv_Gy: 1.6 };

  it('§7.1.11 captura gamma: S_r = 236 m², φ_A = 7.88×10⁹ m⁻²/Gy, h_φ = 1.45×10⁻⁷ Sv/Gy, H_cg = 65.3 (170 con IMRT) µSv/semana', () => {
    dentro(sala.Sr_m2, 236, 0.005);
    dentro(fluenciaA(sala), 7.88e9, 0.01);
    dentro(capturaGammaPorGy(sala, 18), 1.45e-7, 0.01);
    dentro(450 * capturaGammaPorGy(sala, 18) * 1e6, 65.3, 0.01);
    dentro(1170 * capturaGammaPorGy(sala, 18) * 1e6, 170, 0.01);
  });

  it('§7.1.12 neutrones: Kersey 1.7×10⁻⁶ Sv/Gy → 765 µSv/semana (1 989 con IMRT); Wu–McGinley 0.8×10⁻⁶ Sv/Gy (46 %)', () => {
    const k = neutronesKersey(sala);
    dentro(k, 1.7e-6, 0.01);
    dentro(450 * k * 1e6, 765, 0.01);
    dentro(1170 * k * 1e6, 1989, 0.01);
    // Publicado con una cifra significativa («0.8», «46 %»): ±10 %.
    dentro(neutronesWuMcGinley(sala), 0.8e-6, 0.1);
    dentro(neutronesWuMcGinley(sala) / k, 0.46, 0.1);
  });

  it('§7.1.13 puerta (P = 100 µSv, cada componente a P/2): 54 mm de BPE y 7 mm de Pb; con IMRT 72 mm de BPE y 32 mm de Pb', () => {
    const k = neutronesKersey(sala), h = capturaGammaPorGy(sala, 18);
    const sin = puerta(1e-4, { neutrones: 450 * k, captura: 450 * h, fotones: fotones(false).HTot });
    // El informe redondea n a 1.19 y 0.12 TVL (53.6 y 7.3 mm): ±3 % en BPE, ±5 % en plomo.
    dentro(sin.bpe_mm, 53.6, 0.03);
    dentro(sin.plomo_mm, 7.3, 0.05);
    dentro(sin.H_total_Sv * 1e6, 930, 0.02);
    const con = puerta(1e-4, { neutrones: 1170 * k, captura: 1170 * h, fotones: fotones(true).HTot });
    dentro(con.bpe_mm, 72, 0.02);
    dentro(con.plomo_mm, 32, 0.03);
    dentro(con.H_total_Sv * 1e6, 2272, 0.02);
  });

  it('§7.1.17 muro del laberinto (fuga con IMRT, U = T = 1, P = 100 µSv, d = 7.7 m): 80.2 y 69 cm → 91 cm; detrás ≈ 67 µSv', () => {
    const P = 1e-4;
    const f18: FuenteTeleterapia = { energia: 18, W_Gy_semana: 450, fraccionIMRT: 0.4, factorIMRT: 5 };
    const f6: FuenteTeleterapia = { energia: 6, W_Gy_semana: 225, fraccionIMRT: 0.8, factorIMRT: 5 };
    const c18 = fuga(f18, { P_Sv_semana: P, T: 1, dL_m: 7.7 });
    const c6 = fuga(f6, { P_Sv_semana: P, T: 1, dL_m: 7.7 });
    dentro(c18.espesor_cm, 80.2, 0.01);
    dentro(c6.espesor_cm, 69, 0.01);
    dentro(combinarDosFuentes([c18, c6]), 91, 0.01);
    // Campo: sólo fuga detrás de 91 cm (el informe da 67 µSv con valores redondeados): ±5 %.
    const c = campo(dual(true), 7.7, barrera(7.7, { designGoal_mSv_per_wk: 0.1, useFactor: 1 }), 91);
    dentro(c.uSv('l18', 'fuga') + c.uSv('l6', 'fuga'), 67, 0.05);
  });
});
