/**
 * Fase 4 — Suite de validación normativa: NCRP Report No. 147 (2004), Sección 5 «Examples of Shielding
 * Calculations» (pp. 69–101), de extremo a extremo con `normativeBarrierEngine` (espesor por barrera) y
 * `doseFieldEngine` (campo detrás de la barrera).
 *
 * Geometría de las pruebas: fuente en (0, 0), punto protegido en (d, 0), escala 1 m/px, isocentro a 0 m de
 * altura (para que la distancia sea exactamente d), barrera perpendicular al rayo a d/2.
 *
 * Tolerancias (documentadas por caso):
 * - Kerma sin blindaje: ±4 %. El informe redondea a dos cifras significativas (p. ej. §5.3.4: 1.0625 → «1.1»).
 * - Espesor: ±5 %. El informe lee los espesores de las Figuras B.2/B.3/C.2–C.4/A.2 o redondea la Ec. 4.10 a dos
 *   cifras; el motor resuelve la ecuación de Archer sin redondeo intermedio.
 * - Campo con el espesor publicado: ±10 % de P/T (el espesor publicado está redondeado).
 */
import { describe, expect, it } from 'vitest';
import { calcularBarreraNormativa, espesorMultiFuente } from '@/lib/normativeBarrierEngine';
import { dosisEnPunto } from '@/lib/doseFieldEngine';
import {
  AJUSTES_TC, TABLA_4_7, TABLA_B_1, TABLA_C_1, barreraPrimaria, espesorArcher, transmisionArcher, transmisionTC,
} from '@/lib/ncrp147';
import { MATERIALS, MODALITIES, type Barrier, type Modality, type RadiationSource } from '@/types/radshield';

const modalidad = (id: string): Modality =>
  MODALITIES.find((m) => m.id === id) ?? { id, name: id, description: id, category: 'diagnostic', standard: 'NCRP147', unit: 'mGy/paciente' };

const fuente = (id: string, N: number, extra: Partial<RadiationSource> = {}): RadiationSource => ({
  id: `s-${id}`, x: 0, y: 0, name: id, modality: modalidad(id), workloadValue: N, workloadUnit: 'pacientes/semana',
  isocenterHeight_m: 0, useFactor: 1, ...extra,
});

const barrera = (d: number, extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', x1: d / 2, y1: -2, x2: d / 2, y2: 2, name: 'barrera', barrierType: 'secondary', useFactor: 1,
  occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'PB', ...extra,
});

const normativo = (fs: RadiationSource[], d: number, b: Barrier) => {
  const r = calcularBarreraNormativa(b, fs, [{ x: d, y: 0 }], 1, MATERIALS);
  expect(r).not.toBeNull();
  return r!;
};

/** |calculado − publicado| ≤ tol·publicado */
const dentro = (calculado: number, publicado: number, tol: number) => {
  expect(Math.abs(calculado - publicado) / publicado).toBeLessThanOrEqual(tol);
};

const campo = (fs: RadiationSource[], d: number, b: Barrier, espesor_mm: number, opciones = {}) =>
  dosisEnPunto(fs, d, 0, 1, { barriers: [{ ...b, thickness_mm: espesor_mm }], materials: MATERIALS, ...opciones });

describe('NCRP 147 §5.1 — angiografía cardiaca (p. 72)', () => {
  // 25 pacientes/semana, d = 4 m, P = 0.02, T = 1; Tabla 4.7 fuga + 135° = 3.8 mGy/paciente.
  const fs = [fuente('angio-cardiac', 25)];
  const b = barrera(4);
  it('K_sec(0) = 5.9 mGy/semana, B = 3.4×10⁻³, plomo 1.3 mm (Fig. C.2 / Ec. 4.10)', () => {
    const r = normativo(fs, 4, b);
    dentro(r.kermaMax_mSv_semana, 5.9, 0.04);
    dentro(0.02 / r.kermaMax_mSv_semana, 3.4e-3, 0.04);
    dentro(r.espesores_mm.PB, 1.3, 0.05);
  });
  it('campo: con 1.3 mm de plomo el kerma en el punto es P/T (±10 %)', () => {
    dentro(campo(fs, 4, b, 1.3).kerma_mSv_semana, 0.02, 0.1);
  });
});

describe('NCRP 147 §5.2 — unidad de tórax dedicada (pp. 73–74)', () => {
  const fs = [fuente('rad-chest', 300)];
  it('primaria (bucky de pared, d_P = 3 m, U = 1): K_P(0) = 40 mGy/semana, B = 5×10⁻⁴, 2.2 mm Pb total', () => {
    const r = normativo(fs, 3, barrera(3, { barrierType: 'primary' }));
    dentro(r.kermaMax_mSv_semana, 40, 0.04);
    dentro(r.espesores_mm.PB, 2.2, 0.05);
  });
  it('primaria con preblindaje (Tabla 4.6, 0.85 mm): x_barrier = 1.4 mm («2.2 − 0.85», p. 73)', () => {
    // El informe resta 0.85 del total ya redondeado a 2.2 mm; sin redondeo intermedio el neto es 2.157 − 0.85 = 1.31 mm.
    // Tolerancia: el neto publicado (1.4) queda del lado seguro (primaria ≤ P/T) y el neto exacto deja P/T (±1 %).
    const b = barrera(3, { barrierType: 'primary' });
    const prim = (t: number) => campo(fs, 3, b, t, { preblindaje: 'bucky_de_pared' })
      .porFuente[0].componentes.find((c) => c.componente === 'primaria147')!.kerma_mSv_semana;
    const total = normativo(fs, 3, b).espesores_mm.PB;
    expect(Math.abs(total - 0.85 - 1.4)).toBeLessThanOrEqual(0.1);
    expect(prim(1.4)).toBeLessThanOrEqual(0.02);
    dentro(prim(total - 0.85), 0.02, 0.01);
  });
  it('secundaria (muro adyacente, d_sec = 2.1 m, fuga + 90°): K = 0.18, B = 1.1×10⁻¹, 0.42 mm Pb', () => {
    const r = normativo(fs, 2.1, barrera(2.1, { scatterAngle_deg: 90 }));
    dentro(r.kermaMax_mSv_semana, 0.18, 0.04);
    dentro(0.02 / r.kermaMax_mSv_semana, 1.1e-1, 0.04);
    dentro(r.espesores_mm.PB, 0.42, 0.05);
  });
});

describe('NCRP 147 §5.3 — sala radiográfica, N = 125 pacientes/semana (pp. 74–86)', () => {
  const fs = [fuente('rad-abdomen', 125)];

  it('§5.3.1.1 piso bajo la mesa (primaria, Rad Room floor, d_P = 4.1 m): K = 39, B = 5.1×10⁻⁴, 107 mm de concreto total, 35 mm netos', () => {
    const r = normativo(fs, 4.1, barrera(4.1, { barrierType: 'primary', materialCode: 'CONCRETE235' }));
    dentro(r.kermaMax_mSv_semana, 39, 0.04);
    dentro(0.02 / r.kermaMax_mSv_semana, 5.1e-4, 0.04);
    dentro(r.espesores_mm.CONCRETE235, 107, 0.05);
    // Neto = total − x_pre (72 mm de concreto, Tabla 4.6): tolerancia ±2 mm (el informe resta de 107 redondeado).
    expect(Math.abs(r.espesores_mm.CONCRETE235 - 72 - 35)).toBeLessThanOrEqual(2);
  });

  it('§5.3.1.2 piso fuera de la mesa (secundaria, Rad Room all, fuga + 90°, d = 3 m): K = 0.47, B = 4.3×10⁻², 33 mm de concreto', () => {
    const r = normativo(fs, 3, barrera(3, { scatterAngle_deg: 90, materialCode: 'CONCRETE235' }));
    dentro(r.kermaMax_mSv_semana, 0.47, 0.04);
    dentro(0.02 / r.kermaMax_mSv_semana, 4.3e-2, 0.04);
    dentro(r.espesores_mm.CONCRETE235, 33, 0.05);
  });

  it('§5.3.2 techo (secundaria, fuga + 135°, d = 2.7 m; geometría por omisión del motor): K = 0.84, B = 2.4×10⁻², 44 mm', () => {
    const b = barrera(2.7, { materialCode: 'CONCRETE235' });
    const r = normativo(fs, 2.7, b);
    dentro(r.kermaMax_mSv_semana, 0.84, 0.04);
    dentro(0.02 / r.kermaMax_mSv_semana, 2.4e-2, 0.04);
    dentro(r.espesores_mm.CONCRETE235, 44, 0.05);
    dentro(campo(fs, 2.7, b, 44).kerma_mSv_semana, 0.02, 0.1);
  });

  it('§5.3.3.1 muro del receptor de tórax (Rad Room chest bucky, P/T = 0.1, d = 2.5 m): K = 46, B = 2.2×10⁻³, 1.3 mm total, 0.45 mm netos', () => {
    // La distribución «Rad Room (chest bucky)» no tiene modalidad en el catálogo: se valida con `ncrp147`.
    const r = barreraPrimaria({
      distribucion: 'rad_room_chest_bucky', material: 'lead', P_mGy_semana: 0.02, T: 0.2, U: 1,
      N_pacientes_semana: 125, dP_m: 2.5, xpre_mm: 0.85,
    });
    dentro(r.K_sin_blindaje_mGy_semana, 46, 0.04);
    dentro(r.B_requerida, 2.2e-3, 0.04);
    dentro(r.espesor_total_mm, 1.3, 0.05);
    // Neto: el informe resta 0.85 de 1.3 redondeado; ±0.05 mm.
    expect(Math.abs(r.espesor_barrera_mm - 0.45)).toBeLessThanOrEqual(0.05);
  });

  it('§5.3.3.2 secundaria del muro de tórax: 0.14 + (0.96 + 0.008) = 1.1 mGy/semana, B = 9.1×10⁻²', () => {
    const t = TABLA_4_7;
    const sobreMesa = (t.rad_room_floor_other.lateral * 125) / 4.5 ** 2;
    const torax = (t.rad_room_chest_bucky.dispersion90 / 0.8 ** 2 + t.rad_room_chest_bucky.fuga / 2.5 ** 2) * 125;
    dentro(sobreMesa, 0.14, 0.04);
    dentro(torax, 0.97, 0.04);
    dentro(sobreMesa + torax, 1.1, 0.04);
    dentro(0.1 / (sobreMesa + torax), 9.1e-2, 0.04);
    // Con la distribución chest bucky (más penetrante), Fig. C.2: 0.35 mm Pb.
    dentro(espesorArcher(0.1 / (sobreMesa + torax), TABLA_C_1.rad_room_chest_bucky.lead), 0.35, 0.05);
  });

  it('§5.3.4 cuarto oscuro (película, P = 0.025, fuga + 90°, d = 2 m): K = 1.1, B = 2.3×10⁻², 0.53 mm Pb', () => {
    const r = normativo(fs, 2, barrera(2, { scatterAngle_deg: 90, designGoal_mSv_per_wk: 0.025 }));
    dentro(r.kermaMax_mSv_semana, 1.1, 0.04);
    dentro(0.025 / r.kermaMax_mSv_semana, 2.3e-2, 0.04);
    dentro(r.espesores_mm.PB, 0.53, 0.05);
  });

  it('§5.3.5 muro de proyección lateral: K_P = 7.5 (U = 0.09, d = 2.8 m), K_sec = 0.72 (d = 2 m); K_tot(0.8 mm) = 0.014 < 0.02', () => {
    const Kp = (TABLA_4_5_RAD_FLOOR * 0.09 * 125) / 2.8 ** 2;
    const Ks = (TABLA_4_7.rad_room_floor_other.lateral * 125) / 2 ** 2;
    dentro(Kp, 7.5, 0.04);
    dentro(Ks, 0.72, 0.04);
    const Bs = (x: number) => transmisionArcher(x, TABLA_C_1.rad_room_floor_other.lead);
    const Bp = (x: number) => transmisionArcher(x + 0.3, TABLA_B_1.rad_room_floor_other.lead); // x_pre = 0.3 mm (Tabla 4.6)
    const Ktot = Ks * Bs(0.8) + Kp * Bp(0.8);
    // El informe lee B_sec = 5×10⁻³ y B_P = 1.4×10⁻³ de las Figs. C.2/B.2 (una cifra): tolerancia ±15 %.
    dentro(Ktot, 0.014, 0.15);
    expect(Ktot).toBeLessThan(0.02);
    // El espesor de las dos componentes queda por debajo de 0.8 mm («0.78 mm» con todas las fuentes, no tabuladas).
    expect(espesorMultiFuente([{ K: Kp, B: Bp }, { K: Ks, B: Bs }], 0.02)).toBeLessThan(0.8);
  });

  it('§5.3.6 muro de control (controlada, P = 0.1, fuga + 90°, d = 1.8 m): K = 1.3, B = 7.7×10⁻², 0.27 mm Pb', () => {
    const r = normativo(fs, 1.8, barrera(1.8, { scatterAngle_deg: 90, designGoal_mSv_per_wk: 0.1 }));
    dentro(r.kermaMax_mSv_semana, 1.3, 0.04);
    dentro(0.1 / r.kermaMax_mSv_semana, 7.7e-2, 0.04);
    dentro(r.espesores_mm.PB, 0.27, 0.05);
  });
});

/** Tabla 4.5, Rad Room (floor or other barriers): K¹_P = 5.2 mGy/paciente. */
const TABLA_4_5_RAD_FLOOR = 5.2;

describe('NCRP 147 §5.4 — sala R&F: 20 fluoroscopias + 60 radiografías por semana (pp. 86–91)', () => {
  const t = TABLA_4_7;
  // Fuga y dispersión por separado (Tabla 4.7): d_L = 2.4 m y d_S = 3 m (fluoro); d_L = 4.1 m y d_S = 3 m (rad).
  const Kf = (t.fluoro_tube_rf.fuga / 2.4 ** 2 + t.fluoro_tube_rf.dispersion135 / 3 ** 2) * 20;
  const Kr = (t.rad_room_all.fuga / 4.1 ** 2 + t.rad_room_all.dispersion90 / 3 ** 2) * 60
    + (t.rad_tube_rf.fuga / 4.1 ** 2 + t.rad_tube_rf.dispersion90 / 3 ** 2) * 20;

  it('§5.4.1 piso, secundaria: K = 1 + 0.29 = 1.3 mGy/semana, B = 1.5×10⁻², 62 mm de concreto (Fig. C.3, Rad Tube R&F)', () => {
    dentro(Kf, 1, 0.04);
    dentro(Kr, 0.29, 0.04);
    dentro(Kf + Kr, 1.3, 0.04);
    dentro(0.02 / (Kf + Kr), 1.5e-2, 0.04);
    dentro(espesorArcher(0.02 / (Kf + Kr), TABLA_C_1.rad_tube_rf.concrete), 62, 0.05);
  });

  it('§5.4.2 piso bajo la mesa: K_P = 18.6 y 7 mGy/semana; K_tot(72 mm) = 0.017; espesor mínimo 69 mm', () => {
    const KpR = (TABLA_4_5_RAD_FLOOR * 60) / 4.1 ** 2;
    const KpF = (5.9 * 20) / 4.1 ** 2; // Tabla 4.5, Rad Tube (R&F room)
    dentro(KpR, 18.6, 0.04);
    dentro(KpF, 7, 0.04);
    // Secundaria del tubo de fluoroscopia = 1 mGy/semana (§5.4.1); primarias con x_pre = 72 mm de concreto.
    const total = (x: number) => 1 * transmisionArcher(x, TABLA_C_1.fluoro_tube_rf.concrete)
      + KpR * transmisionArcher(x + 72, TABLA_B_1.rad_room_floor_other.concrete)
      + KpF * transmisionArcher(x + 72, TABLA_B_1.rad_tube_rf.concrete);
    dentro(total(72), 0.017, 0.05);
    dentro(espesorMultiFuente([{ K: 1, B: total }], 0.02), 69, 0.05);
  });

  it('el motor de campo con una fuente de fluoroscopia (sólo secundaria, Tabla 4.7/C.1) usa el mismo K¹_sec', () => {
    const fs = [fuente('fluoro-routine', 20)];
    const d = dosisEnPunto(fs, 3, 0, 1, { materials: MATERIALS });
    expect(d.porFuente[0].componentes.map((c) => c.componente)).toEqual(['secundaria147']);
    dentro(d.kermaSinBlindaje_mSv_semana, (t.fluoro_tube_rf.frontal * 20) / 9, 1e-9);
  });
});

describe('NCRP 147 §5.5 — mastografía, 150 pacientes/semana, d = 2.1 m (pp. 91–94)', () => {
  const fs = [fuente('mammo-cc', 150)];
  const b = barrera(2.1, { materialCode: 'GYPSUM' });

  it('K_sec(0) = 3.6×10⁻² × 150 / 2.1² = 1.2 mGy/semana (K¹ a 1 m del isocentro, Tabla 4.7 nota f), B = 1.7×10⁻²', () => {
    const r = normativo(fs, 2.1, b);
    dentro(r.kermaMax_mSv_semana, 1.2, 0.04);
    dentro(0.02 / r.kermaMax_mSv_semana, 1.7e-2, 0.04);
    // El campo usa el mismo K¹ que el normativo.
    dentro(dosisEnPunto(fs, 2.1, 0, 1, { materials: MATERIALS }).kermaSinBlindaje_mSv_semana, r.kermaMax_mSv_semana, 1e-9);
  });

  it('muro de yeso: 9.8 mm (Fig. C.4)', () => {
    dentro(normativo(fs, 2.1, b).espesores_mm.GYPSUM, 9.8, 0.05);
    dentro(campo(fs, 2.1, b, 9.8).kerma_mSv_semana, 0.02, 0.1);
  });

  it.todo('puerta de madera al pasillo (T = 1/8, B = 1.3×10⁻¹): 41 mm de madera (Fig. C.7) — el catálogo MATERIALS no tiene madera ni el motor transcribe el ajuste de madera de la Tabla C.1');
});

describe('NCRP 147 §5.6 — tomografía computarizada (pp. 94–101)', () => {
  it('ejemplo CTDI₁₀₀ (p. 96–97): K¹ cabeza 0.12 y cuerpo 0.38 mGy/paciente, K = 3.1 mGy/semana a 3 m, B = 6.5×10⁻³, 1.3 mm Pb (Fig. A.2)', () => {
    const cabeza = 9e-5 * 20 * 300 * 0.223; // Ec. 5.6: κ_cabeza · L/p · mAs · nCTDI₁₀₀
    const cuerpo = 3e-4 * (50 / 1.35) * 250 * 0.138;
    dentro(cabeza, 0.12, 0.04);
    dentro(cuerpo, 0.38, 0.04);
    const K = (40 * cabeza + 60 * cuerpo) / 3 ** 2;
    dentro(K, 3.1, 0.04);
    dentro(0.02 / K, 6.5e-3, 0.04);
    dentro(espesorArcher(0.02 / K, AJUSTES_TC[120].lead), 1.3, 0.05);
  });

  // §5.6.1 (método DLP, pp. 99–100): 150 procedimientos de cuerpo (DLP 550 × 1.4) y 30 de cabeza (1 200 × 1.4),
  // 120 kVp, muro a 3 m del isocentro, P = 0.02, T = 1.
  const tc = (id: 'ct-body' | 'ct-head', N: number, dlp: number): RadiationSource => fuente(id, N, {
    id: `s-${id}`, ctDLP_mGy_cm: dlp, ctScansPerPatient: 1.4, modality: { ...modalidad(id), energyLabel: '120 kVp' },
  });
  const fs = [tc('ct-body', 150, 550), tc('ct-head', 30, 1200)];
  const b = barrera(3);

  it('método DLP: K¹ cuerpo 0.28 y cabeza 0.15 mGy/procedimiento, K = 5.2 mGy/semana, B = 3.9×10⁻³, 1.5 mm Pb (Fig. A.2)', () => {
    dentro(1.2 * 3e-4 * 550 * 1.4, 0.28, 0.04);
    dentro(9e-5 * 1200 * 1.4, 0.15, 0.04);
    const r = normativo(fs, 3, b);
    dentro(r.kermaMax_mSv_semana, 5.2, 0.04);
    dentro(0.02 / r.kermaMax_mSv_semana, 3.9e-3, 0.04);
    dentro(r.espesores_mm.PB, 1.5, 0.05);
  });

  it('campo: la TC atenúa con la curva de la Fig. A.2 (1.5 mm Pb → P/T ±10 %); sin kVp fijo, la mayor de 120/140 kVp', () => {
    const d = campo(fs, 3, b, 1.5);
    expect(d.porFuente[0].cruces[0].capas[0].metodo).toBe('NCRP147_ARCHER');
    dentro(d.kerma_mSv_semana, 0.02, 0.1);
    expect(transmisionTC(1.5, 'lead')).toBeCloseTo(Math.max(transmisionTC(1.5, 'lead', 120), transmisionTC(1.5, 'lead', 140)), 12);
  });
});
