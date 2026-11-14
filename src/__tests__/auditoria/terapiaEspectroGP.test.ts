/**
 * Fase 11 — terapia con I-131 y Lu-177: espectro completo con buildup GP (ANSI/ANS-6.4.3) y regla
 * «el mayor entre haz estrecho a la línea más energética y haz ancho del espectro» (`lib/terapiaEspectroGP`).
 *
 * Referencias de los casos:
 * - B(E, mfp) de la Tabla 3 de ORNL/RSIC-49 (Trubey 1988; Pb PDF p. 63, Fe p. 56, concreto p. 67): la fórmula GP con
 *   los coeficientes transcritos debe reproducirlos (≤ 3 %).
 * - Cálculo independiente en Python (`i131_espectro/gp_i131.py`, misma fórmula, xraydb/Elam y NIST), transmisión de
 *   kerma en aire de I-131 en Pb 2–35 mm y concreto 15–30 cm: (a) haz estrecho a 722.9 keV y (d) GP espectro (±0.5 %).
 *   Lu-177 (5 líneas ENSDF, Kondev 2019) e I-123 (6 líneas, Chen 2021), regenerados con un script Python independiente
 *   (xraydb 4.6.1/Elam para µ sin coherente, NIST SRD 126 para el haz estrecho y µ_en del aire, coeficientes de
 *   `gp_ans643.json`): coinciden con este módulo a < 1e-5.
 * - Monte Carlo análogo propio de losa (N = 2×10⁶, `salida_N2e6.txt`): GP vs MC ±2 % en Pb.
 * - Oumano et al., JACMP 2025;26(5):e70084: ajuste de Archer de haz ancho (I-131, Pb y concreto).
 */
import { describe, expect, it } from 'vitest';
import {
  buildupGP,
  buildupPorAtenuacion,
  ESPECTROS_TERAPIA,
  lineaEstrecha,
  UMBRAL_LINEA_PCT,
  coeficientesGP,
  espesorTerapiaGP,
  fraccionesKerma,
  nuclidoTerapiaDe,
  transmisionEspectroGP,
  transmisionEstrecha,
  transmisionHazAncho,
  transmisionOumano,
  transmisionRegla,
  type MaterialGP,
} from '@/lib/terapiaEspectroGP';
import { calcularProyecto } from '@/lib/motorProyecto';
import { MATERIALS, MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';

const rel = (a: number, b: number) => Math.abs(a / b - 1);

describe('buildup GP: coeficientes transcritos frente a la Tabla 3 de ORNL/RSIC-49', () => {
  // [E (MeV), mfp, B tabulado]
  const tabla3: Record<MaterialGP, [number, number, number][]> = {
    Pb: [[0.4, 1, 1.13], [0.4, 4, 1.37], [0.4, 10, 1.64], [0.5, 1, 1.18], [0.5, 10, 1.98], [0.6, 4, 1.69], [0.6, 20, 2.97], [0.8, 10, 2.83], [0.8, 40, 5.74], [1, 10, 3.37], [0.3, 5, 1.31]],
    Fe: [[0.4, 1, 2.01], [0.4, 10, 18.1], [0.6, 5, 7.61], [0.8, 10, 17.5], [1, 20, 41.3]],
    Concreto: [[0.4, 1, 2.37], [0.4, 5, 13.5], [0.4, 10, 42.1], [0.6, 10, 31.8], [0.8, 20, 75.7], [1, 10, 20.7], [0.3, 10, 48.2]],
  };
  for (const mat of Object.keys(tabla3) as MaterialGP[]) {
    it(`${mat}: ${tabla3[mat].length} valores ≤ 3 %`, () => {
      for (const [E, x, B] of tabla3[mat]) expect(rel(buildupGP(coeficientesGP(mat, E), x), B)).toBeLessThan(0.03);
    });
  }
  // Pb 0.1–0.2 MeV (Tabla 3, PDF p. 63), las filas que gobiernan Lu-177 en plomo.
  const X = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 25, 30, 35, 40];
  const pbBaja: Record<string, number[]> = {
    '0.1': [1.52, 2.05, 3.44, 5.72, 9.9, 17.7, 32.2, 58.3, 102, 320, 6550, 1.55e5, 4.01e6, 1.09e8, 3.02e9, 8.51e10],
    '0.15': [1.25, 1.41, 1.6, 1.72, 1.82, 1.9, 1.96, 2.03, 2.11, 2.27, 2.77, 3.36, 4.26, 5.71, 8.13, 12.2],
    '0.2': [1.14, 1.19, 1.23, 1.25, 1.26, 1.28, 1.29, 1.31, 1.31, 1.34, 1.37, 1.4, 1.42, 1.44, 1.45, 1.47],
  };
  it('Pb 0.15 y 0.2 MeV: las 32 filas de 0.5–40 mfp ≤ 1.5 %', () => {
    for (const E of ['0.15', '0.2']) X.forEach((x, i) => expect(rel(buildupGP(coeficientesGP('Pb', +E), x), pbBaja[E][i]), `${E} MeV ${x} mfp`).toBeLessThan(0.015));
  });
  it('Pb 0.1 MeV (encima del borde K): el ajuste GP publicado reproduce su tabla a ±11 % (calidad del ajuste, no de la transcripción)', () => {
    const d = X.map((x, i) => buildupGP(coeficientesGP('Pb', 0.1), x) / pbBaja['0.1'][i] - 1);
    for (const v of d) expect(Math.abs(v)).toBeLessThan(0.11);
    expect(Math.min(...d)).toBeCloseTo(-0.106, 2); // 40 mfp
    expect(Math.max(...d)).toBeCloseTo(0.101, 2); // 25 mfp
  });

  it('más allá de 40 mfp: K congelado en K(40), B creciente y B·e^(−x) finito (sin desbordamiento)', () => {
    const p = coeficientesGP('Pb', 0.11295);
    expect(buildupGP(p, 60)).toBeGreaterThan(buildupGP(p, 40));
    const K40 = (buildupGP(p, 41) - 1) / (buildupGP(p, 40) - 1); // razón de la progresión ≈ K(40)
    expect((buildupGP(p, 51) - 1) / (buildupGP(p, 50) - 1)).toBeCloseTo(K40, 3);
    for (const x of [100, 1000, 5000]) {
      const v = buildupPorAtenuacion(p, x);
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
    expect(buildupPorAtenuacion(p, 20)).toBeCloseTo(buildupGP(p, 20) * Math.exp(-20), 15);
    // Espesor extremo: el motor no devuelve NaN y marca la línea fuera del rango del GP.
    const r = espesorTerapiaGP('Lu177', 1, 1e-30, { code: 'PB', density: 11.35 });
    expect(Number.isFinite(r.espesor_mm)).toBe(true);
    expect(r.fueraRangoGP).toBe(true);
    expect(espesorTerapiaGP('Lu177', 1, 1e-2, { code: 'PB', density: 11.35 }).fueraRangoGP).toBe(false);
  });

  it('B(0) = 1 y B crece con el espesor', () => {
    const p = coeficientesGP('Concreto', 0.364);
    expect(buildupGP(p, 0)).toBe(1);
    expect(buildupGP(p, 5)).toBeGreaterThan(buildupGP(p, 1));
  });
});

describe('I-131: espectro ENSDF ponderado por kerma en aire', () => {
  it('fracciones de kerma (364 keV 78.4 %, 637 keV 12.1 %, 723 keV 3.4 %)', () => {
    const f = fraccionesKerma('I131');
    expect(f.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(f[4]).toBeCloseTo(0.78421, 4);
    expect(f[6]).toBeCloseTo(0.12099, 4);
    expect(f[8]).toBeCloseTo(0.03358, 4);
  });

  // t (cm), (a) haz estrecho 722.9 keV, (d) GP espectro, MC espectro (losa, N = 2e6), Oumano 2025
  const pb: [number, number, number, number, number][] = [
    [0.2, 0.7968567, 0.6348567, 0.645, 0.5647511],
    [0.5, 0.5668271, 0.3260318, 0.330, 0.2797101],
    [1.0, 0.3212930, 0.1195111, 0.121, 0.1086078],
    [2.0, 0.1032292, 0.0258121, 0.0260, 0.0241115],
    [3.5, 0.0187998, 0.0045201, 0.00454, 0.0036691],
  ];
  const conc: [number, number, number, number, number][] = [
    [15, 0.0694240, 0.2569420, 0.151, 0.1735633],
    [20, 0.0285329, 0.1215037, 0.066, 0.0795721],
    [25, 0.0117269, 0.0546446, 0.0280, 0.0339285],
    [30, 0.0048197, 0.0238046, 0.0118, 0.0136934],
  ];

  it('Pb 2–35 mm: haz estrecho, GP (±0.5 % del cálculo en Python), GP vs MC ±2 %, Oumano', () => {
    for (const [t, a, d, mc, ou] of pb) {
      expect(rel(transmisionEstrecha('I131', 'Pb', t), a)).toBeLessThan(0.005);
      expect(rel(transmisionEspectroGP('I131', 'Pb', t), d)).toBeLessThan(0.005);
      expect(rel(transmisionEspectroGP('I131', 'Pb', t), mc)).toBeLessThan(0.02);
      expect(rel(transmisionOumano('I131', 'Pb', t)!, ou)).toBeLessThan(1e-4);
      // En plomo rige el haz estrecho a 723 keV (1.26–4.2 veces el GP).
      expect(transmisionRegla('I131', 'Pb', t)).toBe(transmisionEstrecha('I131', 'Pb', t));
    }
  });

  it('concreto 15–30 cm: GP (±0.5 %), cota superior del MC de losa (1.7–2.1×) y regla max(Oumano, 1.2·GP)', () => {
    for (const [t, a, d, mc, ou] of conc) {
      expect(rel(transmisionEstrecha('I131', 'Concreto', t), a)).toBeLessThan(0.005);
      const gp = transmisionEspectroGP('I131', 'Concreto', t);
      expect(rel(gp, d)).toBeLessThan(0.005);
      expect(gp / mc).toBeGreaterThan(1.6);
      expect(gp / mc).toBeLessThan(2.1);
      expect(rel(transmisionOumano('I131', 'Concreto', t)!, ou)).toBeLessThan(1e-4);
      const b = transmisionHazAncho('I131', 'Concreto', t);
      expect(b.criterio).toBe('GP espectro ×1.2');
      expect(b.T).toBeCloseTo(1.2 * gp, 12);
      // En concreto rige el haz ancho; el haz estrecho a 723 keV queda 3.7–5 veces por debajo del GP.
      expect(transmisionRegla('I131', 'Concreto', t)).toBe(b.T);
      expect(gp / a).toBeGreaterThan(3.6);
    }
  });

  it('espesor: inversión de la regla y criterio que rige', () => {
    // Pb: B = T_a(20 mm) → 20 mm, rige el haz estrecho.
    const pbE = espesorTerapiaGP('I131', 1, 0.1032292, { code: 'PB', density: 11.35 });
    expect(pbE.espesor_mm).toBeCloseTo(20, 2);
    expect(pbE.rige).toBe('haz estrecho');
    expect(pbE.porCriterio.hazAncho_mm).toBeLessThan(pbE.espesor_mm);
    // Concreto: B = 1.2·T_GP(30 cm) → 300 mm, rige 1.2·GP.
    const cE = espesorTerapiaGP('I131', 1, 1.2 * 0.0238046, { code: 'CONCRETE235', density: 2.35 });
    expect(cE.espesor_mm).toBeGreaterThan(299);
    expect(cE.espesor_mm).toBeLessThan(301);
    expect(cE.rige).toBe('GP espectro ×1.2');
    // Equivalencia másica: barita 3.5 g/cm³ = concreto × 2.35/3.5.
    const ba = espesorTerapiaGP('I131', 1, 1.2 * 0.0238046, { code: 'CONCRETEBARITE', density: 3.5 });
    expect(ba.espesor_mm).toBeCloseTo((cE.espesor_mm * 2.35) / 3.5, 6);
    // Sin blindaje necesario → 0.
    expect(espesorTerapiaGP('I131', 1, 2, { code: 'PB', density: 11.34 }).espesor_mm).toBe(0);
  });
});

describe('Lu-177: 5 líneas ENSDF ≥ 0.1 % (Kondev 2019: 71.6, 112.9, 208.4, 249.7 y 321.3 keV)', () => {
  it('espectro ENSDF e intensidades (NR = 0.1041; 208.4 keV es la línea de normalización)', () => {
    const ls = ESPECTROS_TERAPIA.Lu177.lineas.map((l) => [l.E_keV, l.I_pct]);
    expect(ls).toEqual([[71.6418, 0.164], [112.9498, 6.23], [208.3662, 10.41], [249.6742, 0.1997], [321.3159, 0.2186]]);
    expect(ESPECTROS_TERAPIA.Lu177.lineas.every((l) => l.I_pct >= UMBRAL_LINEA_PCT)).toBe(true);
  });
  it('criterio (a): la línea más energética con Iγ ≥ 0.1 % (I-131 722.9 keV, Lu-177 321.3 keV; I-123 no aplica)', () => {
    expect(UMBRAL_LINEA_PCT).toBe(0.1);
    expect(lineaEstrecha('I131')).toBe(722.911);
    expect(lineaEstrecha('Lu177')).toBe(321.3159);
    expect(lineaEstrecha('I123')).toBeNull();
  });
  // Python independiente (xraydb/Elam, NIST, gp_ans643.json): (a) 321.3 keV estrecho, (d) GP espectro.
  const casos: [MaterialGP, number, number, number][] = [
    ['Pb', 0.05, 0.818264, 0.617643],
    ['Pb', 0.1, 0.669557, 0.376354],
    ['Pb', 0.2, 0.448306, 0.152201],
    ['Pb', 0.3, 0.300166, 0.0643709],
    ['Pb', 0.5, 0.134566, 0.0134886],
    ['Pb', 0.8, 0.0403923, 0.00228384],
    ['Pb', 1.2, 0.00811798, 0.000430862],
    ['Concreto', 5, 0.285295, 0.825978],
    ['Concreto', 10, 0.0813933, 0.377283],
    ['Concreto', 15, 0.0232211, 0.144059],
    ['Concreto', 20, 0.00662487, 0.0504275],
  ];
  it('haz estrecho y GP espectro (±0.5 %); sin Oumano: (b) = GP; Pb: rige el haz estrecho a 321 keV; concreto: el GP', () => {
    const f = fraccionesKerma('Lu177');
    expect(f[2]).toBeCloseTo(0.74070, 4);
    expect(f[4]).toBeCloseTo(0.02576, 4);
    for (const [m, t, a, d] of casos) {
      expect(rel(transmisionEstrecha('Lu177', m, t), a)).toBeLessThan(0.005);
      expect(rel(transmisionEspectroGP('Lu177', m, t), d)).toBeLessThan(0.005);
      expect(transmisionOumano('Lu177', m, t)).toBeNull();
      expect(transmisionHazAncho('Lu177', m, t).criterio).toBe('GP espectro');
      expect(transmisionRegla('Lu177', m, t)).toBe(m === 'Pb' ? transmisionEstrecha('Lu177', m, t) : transmisionEspectroGP('Lu177', m, t));
    }
  });
  it('espesores de plomo (Python): GP 2.48 / 5.43 / 9.86 / 15.96 mm a B = 1e-1…1e-4; rige el haz estrecho (5.74 mm por TVL)', () => {
    const pb = { code: 'PB', density: 11.35 };
    [[0.1, 2.482], [1e-2, 5.431], [1e-3, 9.856], [1e-4, 15.959]].forEach(([B, gp], i) => {
      const r = espesorTerapiaGP('Lu177', 1, B, pb);
      expect(r.porCriterio.hazAncho_mm).toBeCloseTo(gp, 2);
      expect(r.porCriterio.estrecho_mm).toBeCloseTo(5.74 * (i + 1), 2);
      expect(r.rige).toBe('haz estrecho');
    });
    const c = espesorTerapiaGP('Lu177', 1, 1e-2, { code: 'CONCRETE235', density: 2.35 });
    expect(c.espesor_mm).toBeCloseTo(272.82, 1);
    expect(c.rige).toBe('GP espectro');
  });
});

describe('I-123 (diálogos): 6 líneas ENSDF ≥ 0.1 % (Chen 2021), sólo haz ancho GP', () => {
  const casos: [MaterialGP, number, number][] = [
    ['Pb', 0.05, 0.566964], ['Pb', 0.1, 0.29004], ['Pb', 0.2, 0.107706], ['Pb', 0.5, 0.0477467], ['Pb', 1, 0.0231124], ['Pb', 2, 0.00528922],
    ['Concreto', 5, 0.834688], ['Concreto', 10, 0.366564], ['Concreto', 20, 0.0466987], ['Concreto', 30, 0.00571325],
  ];
  it('GP espectro (±0.5 % del Python); sin criterio (a)', () => {
    expect(fraccionesKerma('I123')[0]).toBeCloseTo(0.90475, 4);
    for (const [m, t, d] of casos) {
      expect(rel(transmisionEspectroGP('I123', m, t), d)).toBeLessThan(0.005);
      expect(transmisionEstrecha('I123', m, t)).toBe(0);
      expect(transmisionRegla('I123', m, t)).toBe(transmisionEspectroGP('I123', m, t));
    }
  });
  it('frente al haz estrecho a 529 keV desde B = 1: menos plomo a B ≥ 0.1, más plomo a B = 0.01 y más concreto siempre', () => {
    const pb = (B: number) => espesorTerapiaGP('I123', 1, B, { code: 'PB', density: 11.35 });
    const co = (B: number) => espesorTerapiaGP('I123', 1, B, { code: 'CONCRETE235', density: 2.35 });
    expect(pb(0.1).espesor_mm).toBeCloseTo(2.115, 2); // estrecho 529 keV: 13.6 mm
    expect(pb(0.01).espesor_mm).toBeCloseTo(15.704, 2); // estrecho: 27.2 mm; asintótico de 1 TVL a B = 0.1: 13.6
    expect(co(0.1).espesor_mm).toBeCloseTo(164.21, 1); // estrecho: 112.6 mm
    expect(co(0.01).espesor_mm).toBeCloseTo(272.79, 1); // estrecho: 225.3 mm
    expect(pb(0.1).rige).toBe('GP espectro');
  });
});

describe('selección del nucleido espectral en el motor', () => {
  const fuente = (id: string) => ({ modality: MODALITIES.find((m) => m.id === id)! }) as RadiationSource;
  it('I-131 y Lu-177 del catálogo; mezcla con otra modalidad → camino anterior', () => {
    expect(nuclidoTerapiaDe([fuente('radioiodine-i131')])).toBe('I131');
    expect(nuclidoTerapiaDe([fuente('lu177')])).toBe('Lu177');
    expect(nuclidoTerapiaDe([fuente('lu177'), fuente('radioiodine-i131')])).toBe('I131');
    expect(nuclidoTerapiaDe([fuente('lu177'), fuente('spect-tc99m')])).toBeNull();
    expect(nuclidoTerapiaDe([])).toBeNull();
  });
});

describe('motor validado (motorProyecto): I-131 y Lu-177 usan la regla espectral GP', () => {
  const muro = (id: string, d_m: number, materialCode: string, designGoal = 0.02): Barrier => ({
    id, name: id, x1: d_m * 100, y1: -150, x2: d_m * 100, y2: 150, barrierType: 'secondary', useFactor: 1,
    occupancyFactor: 1, designGoal_mSv_per_wk: designGoal, materialCode,
  } as Barrier);
  const fuente = (id: string, A0_MBq: number): RadiationSource => ({
    id: `n-${id}`, x: 0, y: 0, name: id, modality: MODALITIES.find((m) => m.id === id)!, workloadValue: 2,
    workloadUnit: 'pacientes/semana', isocenterHeight_m: 1, useFactor: 1,
    tg108: { A0_MBq, pacientesSemana: 2, tU_h: 24, tI_h: 0.5, sala: 'captacion' },
  } as RadiationSource);
  const plano = (id: string, barriers: Barrier[], sources: RadiationSource[]): FloorPlan => ({
    id, name: id, imageUrl: null, width_pixels: 2000, height_pixels: 2000, scale_m_per_pixel: 0.01,
    barriers, sources, regions: [], criticalPoints: [],
  } as unknown as FloorPlan);

  for (const [id, nuc] of [['radioiodine-i131', 'I131'], ['lu177', 'Lu177']] as const) {
    it(`${id}: espesores = espesorTerapiaGP(kerma máximo) en todos los materiales, traza ANS-6.4.3`, () => {
      const r = calcularProyecto(plano(id, [muro('pb', 2, 'PB', 1e-6), muro('c', 3, 'CONCRETE235', 1e-6), muro('lejos', 3, 'PB', 1e6)], [fuente(id, 7400)]));
      for (const b of r.barriers.slice(0, 2)) {
        const t = b.requiredThickness_mm as Record<string, number>;
        expect(b.calculationTrace?.formulaId).toBe('ANS643_GP_ESPECTRO_MAX_HAZ_ESTRECHO');
        expect(b.calculationTrace?.assumptions.join(' ')).toMatch(/PB: (haz estrecho|GP espectro)/);
        for (const m of MATERIALS) {
          expect(t[m.code]).toBeCloseTo(espesorTerapiaGP(nuc, b.maxKerma!, b.designGoal_mSv_per_wk, m).espesor_mm, 9);
        }
        expect(t.PB).toBeGreaterThan(0);
      }
      // Etapa 2: barrera sin blindaje necesario → requerido 0 (no «sin cálculo»).
      const lejos = r.barriers[2];
      expect(Object.values(lejos.requiredThickness_mm as Record<string, number>).every((v) => v === 0)).toBe(true);
      expect(r.barrierResults[2].estado).not.toBe('SIN_CALCULO');
    });
  }
});

describe('bibliotecas de los diálogos: nuclearMedicine y TherapeuticRadionuclideShielding', () => {
  // TVL de haz estrecho (NIST, log-log) de la línea más penetrante con rendimiento ≥ 1 %: cota inferior de la TVL.
  const PB: [number, number][] = [[0.1, 5.549], [0.15, 2.014], [0.2, 0.9985], [0.3, 0.4031], [0.4, 0.2323], [0.5, 0.1614], [0.6, 0.1248], [0.8, 0.0887], [1, 0.07102]];
  const CO: [number, number][] = [[0.1, 0.1738], [0.15, 0.1436], [0.2, 0.1282], [0.3, 0.1097], [0.4, 0.09783], [0.5, 0.08915], [0.6, 0.08236], [0.8, 0.07227], [1, 0.06495]];
  const ll = (t: [number, number][], E: number) => {
    const i = t.findIndex(([e]) => e >= E) - 1;
    const [[e0, v0], [e1, v1]] = [t[i], t[i + 1]];
    return Math.exp(Math.log(v0) + (Math.log(E / e0) / Math.log(e1 / e0)) * Math.log(v1 / v0));
  };
  const tvl = (t: [number, number][], E: number, rho: number) => (10 * Math.log(10)) / (ll(t, E) * rho);
  const lineaDura: Record<string, number> = { 'Tc-99m': 0.1405, 'In-111': 0.2454, 'Tl-201': 0.1674, 'Zr-89': 0.909 };

  it('I-131, Lu-177 e I-123: HVL y TVL de la tabla = primer espesor de la regla espectral (B = 0.5 y 0.1)', async () => {
    const { RADIONUCLIDES } = await import('@/lib/nuclearMedicine');
    const casos = [['I-131', 'I131'], ['I-131-NaI', 'I131'], ['Lu-177', 'Lu177'], ['I-123', 'I123']] as const;
    for (const [sym, nuc] of casos) {
      const r = RADIONUCLIDES.find((x) => x.symbol === sym)!;
      const t = (B: number, code: string, density: number) => espesorTerapiaGP(nuc, 1, B, { code, density }).espesor_mm;
      expect(Math.abs(r.HVL_lead_mm - t(0.5, 'PB', 11.35)), sym).toBeLessThanOrEqual(0.05);
      expect(Math.abs(r.TVL_lead_mm - t(0.1, 'PB', 11.35)), sym).toBeLessThanOrEqual(0.05);
      expect(Math.abs(r.HVL_concrete_mm - t(0.5, 'CONCRETE235', 2.35)), sym).toBeLessThanOrEqual(0.5);
      expect(Math.abs(r.TVL_concrete_mm - t(0.1, 'CONCRETE235', 2.35)), sym).toBeLessThanOrEqual(0.5);
    }
  });

  it('ninguna TVL de plomo ni de concreto por debajo de la de haz estrecho de la línea dura', async () => {
    const { RADIONUCLIDES } = await import('@/lib/nuclearMedicine');
    for (const [sym, E] of Object.entries(lineaDura)) {
      const r = RADIONUCLIDES.find((x) => x.symbol === sym)!;
      expect(r.TVL_lead_mm, sym).toBeGreaterThanOrEqual(Math.floor(tvl(PB, E, 11.35) * 10) / 10);
      expect(r.TVL_concrete_mm, sym).toBeGreaterThanOrEqual(Math.floor(tvl(CO, E, 2.35)));
    }
  });

  it('Y-90, Ra-223 y Ac-225 alineados con el módulo de terapia (revisión 8c)', async () => {
    const { RADIONUCLIDES } = await import('@/lib/nuclearMedicine');
    const { THERAPY_NUCLIDES } = await import('@/lib/therapy/TherapeuticRadionuclideShielding');
    for (const s of ['Y-90', 'Ra-223', 'Ac-225']) {
      const a = RADIONUCLIDES.find((x) => x.symbol === s)!;
      const b = THERAPY_NUCLIDES.find((x) => x.symbol === s)!;
      expect(a.TVL_lead_mm).toBe(b.tenthValueLead_mm);
      expect(a.TVL_concrete_mm).toBe(b.tenthValueConcrete_mm);
      expect(a.gammaConstant_mSv_m2_GBq_h).toBe(b.gammaConstant_uSvm2perGBqh);
    }
  });

  it('I-131 y Lu-177: los diálogos usan la regla espectral GP', async () => {
    const { espesorRadionuclidoTerapia } = await import('@/lib/nuclearMedicine');
    const { calculateTaskDose } = await import('@/lib/therapy/TherapeuticRadionuclideShielding');
    const e = espesorRadionuclidoTerapia('I-131-NaI', 'lead', 0.1032292, 20.5);
    expect(e.mm).toBeCloseTo(20, 2);
    expect(e.metodo).toMatch(/ANS-6\.4\.3/);
    const r = calculateTaskDose({ name: 'x', nuclide: 'I-131', activity_MBq: 5550, frequency_perWeek: 2, duration_min: 30, distance_m: 2, taskType: 'patient_handling' });
    const B = 100 / r.weeklyDose_uSv;
    expect(r.minLead_mm).toBeCloseTo(espesorTerapiaGP('I131', 1, B, { code: 'PB', density: 11.35 }).espesor_mm, 9);
    expect(r.minConcrete_mm).toBeCloseTo(espesorTerapiaGP('I131', 1, B, { code: 'CONCRETE235', density: 2.35 }).espesor_mm, 9);
    expect(espesorRadionuclidoTerapia('Tc-99m', 'lead', 0.01, 0.9).mm).toBeCloseTo(1.8, 9);
    // I-123 también por el GP del espectro (no n·TVL).
    const i123 = espesorRadionuclidoTerapia('I-123', 'concrete', 0.01, 164);
    expect(i123.mm).toBeCloseTo(espesorTerapiaGP('I123', 1, 0.01, { code: 'CONCRETE235', density: 2.35 }).espesor_mm, 9);
    expect(i123.metodo).toMatch(/GP espectro/);
  });
});
