/**
 * Fase 11 — terapia con I-131 y Lu-177: espectro completo con buildup GP (ANSI/ANS-6.4.3) y regla
 * «el mayor entre haz estrecho a la línea más energética y haz ancho del espectro» (`lib/terapiaEspectroGP`).
 *
 * Referencias de los casos:
 * - B(E, mfp) de la Tabla 3 de ORNL/RSIC-49 (Trubey 1988; Pb PDF p. 63, Fe p. 56, concreto p. 67): la fórmula GP con
 *   los coeficientes transcritos debe reproducirlos (≤ 3 %).
 * - Cálculo independiente en Python (`i131_espectro/gp_i131.py`, misma fórmula, xraydb/Elam y NIST), transmisión de
 *   kerma en aire de I-131 en Pb 2–35 mm y concreto 15–30 cm: (a) haz estrecho a 722.9 keV y (d) GP espectro (±0.5 %).
 * - Monte Carlo análogo propio de losa (N = 2×10⁶, `salida_N2e6.txt`): GP vs MC ±2 % en Pb.
 * - Oumano et al., JACMP 2025;26(5):e70084: ajuste de Archer de haz ancho (I-131, Pb y concreto).
 */
import { describe, expect, it } from 'vitest';
import {
  buildupGP,
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

describe('Lu-177: líneas de 112.9 y 208.4 keV (ENSDF, Kondev 2019)', () => {
  // Cálculo independiente en Python con gp_i131.py (B_at, NIST loglog): (a) 208.4 keV estrecho, (d) GP espectro.
  const casos: [MaterialGP, number, number, number][] = [
    ['Pb', 0.05, 0.5963, 0.60983],
    ['Pb', 0.1, 0.355574, 0.364153],
    ['Pb', 0.2, 0.126433, 0.139414],
    ['Pb', 0.3, 0.0449563, 0.0540592],
    ['Pb', 0.5, 0.00568396, 0.00806807],
    ['Concreto', 5, 0.226999, 0.826682],
    ['Concreto', 10, 0.0515285, 0.374422],
    ['Concreto', 15, 0.0116969, 0.141356],
    ['Concreto', 20, 0.00265519, 0.0488226],
  ];
  it('haz estrecho y GP espectro (±0.5 %); sin Oumano: (b) = GP; rige el haz ancho', () => {
    expect(fraccionesKerma('Lu177')[1]).toBeCloseTo(0.77744, 4);
    for (const [m, t, a, d] of casos) {
      expect(rel(transmisionEstrecha('Lu177', m, t), a)).toBeLessThan(0.005);
      expect(rel(transmisionEspectroGP('Lu177', m, t), d)).toBeLessThan(0.005);
      expect(transmisionOumano('Lu177', m, t)).toBeNull();
      expect(transmisionHazAncho('Lu177', m, t).criterio).toBe('GP espectro');
      expect(transmisionRegla('Lu177', m, t)).toBe(transmisionEspectroGP('Lu177', m, t));
    }
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
  const lineaDura: Record<string, number> = { 'Tc-99m': 0.1405, 'I-123': 0.529, 'In-111': 0.2454, 'Tl-201': 0.1674, 'Lu-177': 0.2084, 'I-131': 0.7229, 'Zr-89': 0.909 };

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
  });
});
