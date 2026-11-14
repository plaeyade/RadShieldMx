/**
 * Fase 11, seguimiento de #57 (hallazgo N3): radionúclidos diagnósticos por espectro ENSDF completo con buildup GP.
 *
 * Tc-99m, Tl-201, In-111 (Medicina Nuclear e IPEM 109), Ga-67 y Sm-153 (IPEM 109) y Zr-89 (Medicina Nuclear) usaban
 * n·TVL de haz estrecho, sin buildup: en concreto quedaban ≈ 1.6–2× por debajo del GP. Ahora usan la regla de
 * `terapiaEspectroGP`, y la modalidad SPECT Tc-99m del motor también.
 *
 * Valores de referencia: `scripts/fase11_diagnostico_gp.py`, implementación independiente en Python (xraydb 4.6.1/Elam
 * para µ sin coherente hasta 0.8 MeV; NIST SRD 126 por encima, menos la coherente de Elam escalada como E⁻²; µ_en del
 * aire de NIST; coeficientes GP de exposición de NUREG/CR-5740, Tabla 5.1). Intensidades ENSDF de NNDC NuDat 3.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  ESPECTROS_TERAPIA,
  NIST_MU_RHO,
  PESO_MIN_LINEA_DURA,
  XCOM_MU_RHO_MALLA,
  criterioHazEstrecho,
  UMBRAL_LINEA_PCT,
  espesorTerapiaGP,
  fraccionesKerma,
  lineaEstrecha,
  nuclidoTerapiaDe,
  nuclidoTerapiaDeSimbolo,
  transmisionEspectroGP,
  transmisionEstrecha,
  transmisionRegla,
  type MaterialGP,
  type NuclidoTerapia,
} from '@/lib/terapiaEspectroGP';
import { RADIONUCLIDES, espesorRadionuclidoTerapia } from '@/lib/nuclearMedicine';
import { SPECT_RADIONUCLIDES, calculateSPECTShielding, salaSPECT, transmisionSPECT, type SPECTProcedure } from '@/lib/spect/IPEMReport109';
import { calcularProyecto } from '@/lib/motorProyecto';
import { MATERIALS, MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';

const rel = (a: number, b: number) => Math.abs(a / b - 1);
/** Salida de `scripts/fase11_xcom_malla.py` (NIST XCOM 3.1). */
const xcom = JSON.parse(readFileSync('scripts/fase11_xcom_mu_rho.json', 'utf8')) as {
  muRhoTotal: number[][]; muRhoSinCohLineas: Record<string, number[][]>; yesoVsConcreto: { filas: number[][] };
};
const PB = { code: 'PB', density: 11.35 };
const CO = { code: 'CONCRETE235', density: 2.35 };
const DIAG: NuclidoTerapia[] = ['Tc99m', 'Tl201', 'In111', 'Ga67', 'Sm153', 'Zr89', 'I123'];

describe('espectros ENSDF (NuDat 3), Iγ ≥ 0.1 %', () => {
  it('líneas e intensidades transcritas', () => {
    const l = (n: NuclidoTerapia) => ESPECTROS_TERAPIA[n].lineas.map((x) => [x.E_keV, x.I_pct]);
    expect(l('Tc99m')).toEqual([[140.511, 89.0]]);
    expect(l('Tl201')).toEqual([[30.6, 0.258], [32.19, 0.263], [135.34, 2.605], [165.88, 0.147], [167.43, 10.0]]);
    expect(l('In111')).toEqual([[171.28, 90.7], [245.35, 94.1]]);
    expect(l('Ga67')).toEqual([[91.265, 3.11], [93.31, 38.81], [184.576, 21.41], [208.95, 2.46], [300.217, 16.64], [393.527, 4.56], [887.688, 0.148]]);
    expect(l('Sm153')).toEqual([[69.673, 4.67], [75.42213, 0.19], [83.36717, 0.191], [89.48595, 0.157], [97.431, 0.763], [103.18012, 29.14]]);
    expect(l('Zr89')).toEqual([[511.0, 45.5], [909.15, 99.04], [1657.3, 0.106], [1713.0, 0.745], [1744.5, 0.123]]);
    for (const n of DIAG) expect(ESPECTROS_TERAPIA[n].lineas.every((x) => x.I_pct >= UMBRAL_LINEA_PCT), n).toBe(true);
    // Zr-89: con el umbral anterior de 1 % quedaban fuera 1657.3, 1713.0 y 1744.5 keV.
    expect(ESPECTROS_TERAPIA.Zr89.lineas.filter((x) => x.I_pct < 1).map((x) => x.E_keV)).toEqual([1657.3, 1713.0, 1744.5]);
  });

  it('fracciones de kerma (Python)', () => {
    const ref: Partial<Record<NuclidoTerapia, number[]>> = {
      Tl201: [0.02111, 0.01962, 0.15895, 0.01146, 0.78886],
      In111: [0.38479, 0.61521],
      Ga67: [0.01635, 0.20793, 0.25312, 0.03382, 0.35056, 0.1291, 0.00911],
      Sm153: [0.10704, 0.00442, 0.00465, 0.00406, 0.0212, 0.85863],
      Zr89: [0.21034, 0.77719, 0.00133, 0.00955, 0.0016],
    };
    for (const [n, f] of Object.entries(ref)) fraccionesKerma(n as NuclidoTerapia).forEach((v, i) => expect(v, n).toBeCloseTo(f[i], 4));
  });

  it('criterio único (a): línea dura (Iγ ≥ 0.1 %) con peso ≥ 2 % del kerma, para todo el catálogo; hazEstrecho derivado', () => {
    expect(PESO_MIN_LINEA_DURA).toBe(0.02);
    // Clasificación esperada y peso de la línea dura (Python). Si cambia un espectro, el umbral o el µ_en del aire de modo
    // que algún nucleido cambie de lado, esta prueba falla: el margen es estrecho (1.33 % < umbral ≤ 2.58 %).
    const esperado: Record<NuclidoTerapia, [number, number, boolean]> = {
      I131: [722.911, 0.03358, true], Lu177: [321.3159, 0.02576, true], Tc99m: [140.511, 1, true], Tl201: [167.43, 0.78886, true],
      In111: [245.35, 0.61521, true], Sm153: [103.18012, 0.85863, true],
      I123: [538.54, 0.01329, false], Ga67: [887.688, 0.00911, false], Zr89: [1744.5, 0.0016, false],
    };
    for (const n of Object.keys(ESPECTROS_TERAPIA) as NuclidoTerapia[]) {
      const c = criterioHazEstrecho(n);
      const [E, peso, aplica] = esperado[n];
      expect(c.E_keV, n).toBe(E);
      expect(c.peso, n).toBeCloseTo(peso, 4);
      expect(c.aplica, n).toBe(aplica);
      // hazEstrecho no se escribe a mano: es exactamente el criterio.
      expect(ESPECTROS_TERAPIA[n].hazEstrecho, n).toBe(aplica);
      // Mismo criterio en terapia y en diagnóstico (ya no hay regla «terapia siempre / diagnóstico ≥ 50 %»).
      expect(lineaEstrecha(n), n).toBe(aplica ? E : null);
    }
    // Margen: cualquier umbral en (1.33 %, 2.58 %] da la misma clasificación; fuera de él cambia.
    const pesos = Object.values(esperado);
    const clasif = (u: number) => pesos.map(([, p]) => p >= u);
    for (const u of [0.0134, 0.015, 0.02, 0.025, 0.0257]) expect(clasif(u)).toEqual(pesos.map(([, , a]) => a));
    expect(clasif(0.013)).not.toEqual(pesos.map(([, , a]) => a));
    expect(clasif(0.026)).not.toEqual(pesos.map(([, , a]) => a));
    for (const n of DIAG) expect(ESPECTROS_TERAPIA[n].terapia, n).toBe(false);
  });

  it('caso hipotético para la memoria: haz estrecho siempre (I-123, Ga-67, Zr-89) frente al GP (mm de Pb, B = 0.1 / 0.01)', () => {
    const muE = (E_keV: number, m: 'Pb' | 'Concreto') => {
      const t = NIST_MU_RHO[m];
      const E = E_keV / 1000;
      const i = t.findIndex(([e]) => e >= E);
      const [[e0, v0], [e1, v1]] = [t[i - 1], t[i]];
      return Math.exp(Math.log(v0) + (Math.log(E / e0) / Math.log(e1 / e0)) * Math.log(v1 / v0));
    };
    const estrecho = (E: number, B: number) => (-Math.log(B) / (muE(E, 'Pb') * 11.35)) * 10;
    expect(estrecho(1744.5, 0.1)).toBeCloseTo(41.85, 1); // Zr-89: 41.9 frente a 31.3 mm (×1.34)
    expect(espesorTerapiaGP('Zr89', 1, 0.1, PB).espesor_mm).toBeCloseTo(31.33, 1);
    expect(estrecho(1744.5, 0.01)).toBeCloseTo(83.7, 1); // frente a 62.3 mm
    expect(estrecho(887.688, 0.1)).toBeCloseTo(25.48, 1); // Ga-67: 25.5 frente a 5.0 mm (×5.1)
    expect(espesorTerapiaGP('Ga67', 1, 0.1, PB).espesor_mm).toBeCloseTo(5.04, 1);
    expect(estrecho(538.54, 0.1)).toBeCloseTo(14.02, 1); // I-123: 14.0 frente a 2.1 mm (×6.6)
  });
});

describe('H2: µ del haz estrecho de NIST XCOM en malla fina', () => {
  it('la tabla del módulo es la que genera scripts/fase11_xcom_malla.py (JSON)', () => {
    expect(XCOM_MU_RHO_MALLA.map((r) => [...r])).toEqual(xcom.muRhoTotal);
  });
  it('incluye las energías pedidas y los bordes K/L de Pb y W (duplicados)', () => {
    const E = XCOM_MU_RHO_MALLA.map((r) => r[0]);
    for (const e of [0.17128, 0.24535, 0.3213159, 0.364489, 0.52897, 0.636989, 0.722911]) expect(E, String(e)).toContain(e);
    for (const b of [0.0880045, 0.0158608, 0.0152, 0.0130352, 0.069525, 0.0120998, 0.011544, 0.0102068]) {
      expect(E.filter((e) => e === b).length, String(b)).toBe(2);
    }
    // Saltos de borde de NIST: Pb K 1.910 → 7.684 cm²/g; W K 2.552 → 11.23 cm²/g.
    const pbK = XCOM_MU_RHO_MALLA.filter((r) => r[0] === 0.0880045);
    expect([pbK[0][1], pbK[1][1]]).toEqual([1.9098, 7.6838]);
    const wK = XCOM_MU_RHO_MALLA.filter((r) => r[0] === 0.069525);
    expect([wK[0][2], wK[1][2]]).toEqual([2.5516, 11.234]);
  });
  it('reproduce NIST SRD 126 en sus energías (±0.05 %)', () => {
    const srd: [number, number, number][] = [[0.1, 5.549, 0.1738], [0.2, 0.9985, 0.1282], [0.3, 0.4031, 0.1097], [0.6, 0.1248, 0.08236], [0.8, 0.0887, 0.07227], [1, 0.07102, 0.06495], [2, 0.04606, 0.04557]];
    for (const [E, pb, co] of srd) {
      const r = XCOM_MU_RHO_MALLA.find((x) => x[0] === E)!;
      expect(rel(r[1], pb), `Pb ${E}`).toBeLessThan(5e-4);
      expect(rel(r[4], co), `concreto ${E}`).toBeLessThan(5e-4);
    }
  });
  it('M1 (2.ª revisión del #58): el haz estrecho usa µ SIN coherente (ORNL/RSIC-49): In-111/Pb B = 0.1 3.50 mm (con coherente 3.26); I-131 TVL 21.68 mm (20.44)', () => {
    expect(espesorTerapiaGP('In111', 1, 0.1, PB).espesor_mm).toBeCloseTo(3.504, 2);
    expect(espesorTerapiaGP('In111', 1, 0.1, PB).rige).toBe('haz estrecho');
    // µ/ρ sin coherente de XCOM en la línea dura (`muRhoSinCohLineas`): 245.35 keV 0.57901, 722.911 keV 0.093614.
    const sc = (n: NuclidoTerapia, E: number) => xcom.muRhoSinCohLineas[n].find((x) => x[0] === E)![1];
    expect(rel(sc('In111', 245.35), 0.57901)).toBeLessThan(2e-4);
    expect(transmisionEstrecha('In111', 'Pb', 0.35)).toBeCloseTo(Math.exp(-0.579 * 11.35 * 0.35), 8);
    expect(rel(-Math.log(transmisionEstrecha('In111', 'Pb', 1)), sc('In111', 245.35) * 11.35)).toBeLessThan(2e-4);
    expect(rel(-Math.log(transmisionEstrecha('I131', 'Pb', 1)), sc('I131', 722.911) * 11.35)).toBeLessThan(1e-3);
    expect(transmisionRegla('I131', 'Pb', 2)).toBeCloseTo(Math.exp(-0.09356 * 11.35 * 2), 8);
    expect(espesorTerapiaGP('I131', 1, 0.1, PB).espesor_mm).toBeCloseTo(21.684, 2);
    // Nunca por debajo de la componente sin colisión del GP: con un nucleido de una línea, (a) = e^(−µ_sc·t) exacto.
    for (const t of [0.05, 0.2, 1]) expect(transmisionEstrecha('Tc99m', 'Pb', t)).toBeCloseTo(Math.exp(-2.25074 * 11.35 * t), 10);
  });
  it('H5: el µ sin coherente de Elam (GP) frente al de XCOM, línea por línea: ≤ 1.5 % con peso ≥ 1 % del kerma', () => {
    const sinCoh = xcom.muRhoSinCohLineas;
    for (const n of Object.keys(ESPECTROS_TERAPIA) as NuclidoTerapia[]) {
      const f = fraccionesKerma(n);
      ESPECTROS_TERAPIA[n].lineas.forEach((l, i) => {
        const x = sinCoh[n][i];
        expect(x[0]).toBe(l.E_keV);
        if (f[i] < 0.01) return;
        (['Pb', 'Fe', 'Concreto'] as const).forEach((m, k) => expect(rel(l.muRhoSinCoh[m], x[k + 1]), `${n} ${l.E_keV} ${m}`).toBeLessThan(0.015));
      });
    }
  });
  it('H4: el yeso CaSO₄·2H₂O (PNNL-15870) atenúa más por unidad de masa que el concreto (equivalencia másica conservadora)', () => {
    for (const [E, yeso, concreto] of xcom.yesoVsConcreto.filas) expect(yeso, String(E)).toBeGreaterThanOrEqual(concreto);
  });
});

describe('transmisión GP del espectro frente al Python (±0.5 %)', () => {
  const casos: [NuclidoTerapia, MaterialGP, number, number][] = [
    ['Tc99m', 'Pb', 0.05, 0.440036], ['Tc99m', 'Pb', 0.2, 0.014019], ['Tc99m', 'Pb', 0.5, 1.0896e-5],
    ['Tc99m', 'Concreto', 5, 0.80427], ['Tc99m', 'Concreto', 10, 0.307982], ['Tc99m', 'Concreto', 20, 0.0265325], ['Tc99m', 'Concreto', 30, 0.00173857],
    ['Tl201', 'Pb', 0.1, 0.235832], ['Tl201', 'Pb', 0.5, 0.000363768], ['Tl201', 'Concreto', 10, 0.337659], ['Tl201', 'Concreto', 30, 0.00288953],
    ['In111', 'Pb', 0.2, 0.219341], ['In111', 'Pb', 1, 0.00112852], ['In111', 'Concreto', 10, 0.415857], ['In111', 'Concreto', 30, 0.00700154],
    ['Ga67', 'Pb', 0.5, 0.101135], ['Ga67', 'Pb', 2, 0.00372002], ['Ga67', 'Concreto', 20, 0.0660274], ['Ga67', 'Concreto', 30, 0.00990394],
    ['Sm153', 'Pb', 0.1, 0.0645818], ['Sm153', 'Concreto', 20, 0.00838914],
    ['Zr89', 'Pb', 1, 0.480829], ['Zr89', 'Pb', 2, 0.230169], ['Zr89', 'Concreto', 10, 0.554477], ['Zr89', 'Concreto', 30, 0.0627917],
  ];
  it.each(casos)('%s en %s, t = %s cm', (n, m, t, ref) => {
    expect(rel(transmisionEspectroGP(n, m, t), ref)).toBeLessThan(0.005);
  });
});

describe('espesores (Python): GP del espectro y haz estrecho a la línea dura', () => {
  // [nucleido, material, B, GP (mm), haz estrecho (mm) o null]
  const casos: [NuclidoTerapia, 'PB' | 'CO', number, number, number | null][] = [
    ['Tc99m', 'PB', 0.1, 1.164, 0.901], ['Tc99m', 'PB', 0.01, 2.142, 1.803], ['Tc99m', 'CO', 0.1, 148.024, 68.924], ['Tc99m', 'CO', 0.01, 236.56, 137.848],
    ['Tl201', 'PB', 0.1, 1.53, 1.399], ['Tl201', 'PB', 0.01, 2.949, 2.798], ['Tl201', 'CO', 0.1, 156.413, 73.368], ['Tl201', 'CO', 0.01, 251.495, 146.735],
    ['In111', 'PB', 0.1, 3.129, 3.504], ['In111', 'PB', 0.01, 6.641, 7.008], ['In111', 'CO', 0.1, 176.025, 83.889], ['In111', 'CO', 0.01, 284.0, 167.778],
    ['Sm153', 'PB', 0.01, 1.674, 0.824], ['Sm153', 'CO', 0.01, 194.48, 121.589],
    ['Ga67', 'PB', 0.1, 5.036, null], ['Ga67', 'PB', 0.01, 14.041, null], ['Ga67', 'CO', 0.01, 299.5, null],
    ['Zr89', 'PB', 0.1, 31.333, null], ['Zr89', 'PB', 0.01, 62.321, null], ['Zr89', 'CO', 0.1, 261.333, null], ['Zr89', 'CO', 0.01, 445.342, null],
  ];
  it.each(casos)('%s %s B = %s: GP %s mm, estrecho %s mm', (n, m, B, gp, estrecho) => {
    const r = espesorTerapiaGP(n, 1, B, m === 'PB' ? PB : CO);
    expect(r.porCriterio.hazAncho_mm).toBeCloseTo(gp, 1);
    expect(r.porCriterio.estrecho_mm).toBeCloseTo(estrecho ?? 0, 1);
    expect(r.espesor_mm).toBeCloseTo(Math.max(gp, estrecho ?? 0), 1);
    expect(r.rige).toBe(estrecho !== null && estrecho > gp ? 'haz estrecho' : 'GP espectro');
  });

  it('el haz estrecho sólo rige en In-111/Pb (con µ sin coherente, hasta B = 1e-3: 10.51 frente a 10.19 mm); en concreto rige siempre el GP', () => {
    for (const n of ['Tc99m', 'Tl201', 'Sm153'] as const) {
      for (const B of [0.5, 0.1, 1e-2, 1e-4]) expect(espesorTerapiaGP(n, 1, B, PB).rige).toBe('GP espectro');
    }
    expect(espesorTerapiaGP('In111', 1, 0.1, PB).rige).toBe('haz estrecho');
    for (const B of [0.5, 0.01, 1e-3]) expect(espesorTerapiaGP('In111', 1, B, PB).rige).toBe('haz estrecho');
    for (const n of DIAG) for (const B of [0.5, 0.1, 1e-3]) expect(espesorTerapiaGP(n, 1, B, CO).rige, n).toBe('GP espectro');
  });
});

describe('N3: la biblioteca de n·TVL quedaba corta en concreto', () => {
  // TVL de concreto anteriores (sin buildup): Tc-99m 76, Tl-201 72, In-111 149 mm (nuclearMedicine). In-111 sólo quedaba
  // corto hasta B ≈ 0.02 (176 frente a 149 mm a B = 0.1; a B = 0.01 daba 298 frente a 284 mm del GP).
  it.each([['Tc-99m', 76, [0.1, 0.01, 1e-3]], ['Tl-201', 72, [0.1, 0.01, 1e-3]], ['In-111', 149, [0.5, 0.1]]] as const)('%s: GP > n·TVL anterior', (s, tvl, Bs) => {
    for (const B of Bs) {
      const e = espesorRadionuclidoTerapia(s, 'concrete', B, tvl);
      expect(e.mm).toBeGreaterThan(-Math.log10(B) * tvl);
      expect(e.metodo).toMatch(/ANS-6\.4\.3 GP/);
    }
  });

  it('las tablas HVL/TVL de los diagnósticos son el primer espesor de la regla (B = 0.5 y 0.1)', () => {
    for (const s of ['Tc-99m', 'Tl-201', 'In-111', 'Zr-89']) {
      const r = RADIONUCLIDES.find((x) => x.symbol === s)!;
      const n = nuclidoTerapiaDeSimbolo(s)!;
      expect(Math.abs(r.TVL_lead_mm - espesorTerapiaGP(n, 1, 0.1, PB).espesor_mm), s).toBeLessThanOrEqual(0.05);
      expect(Math.abs(r.HVL_lead_mm - espesorTerapiaGP(n, 1, 0.5, PB).espesor_mm), s).toBeLessThanOrEqual(0.05);
      expect(Math.abs(r.HVL_concrete_mm - espesorTerapiaGP(n, 1, 0.5, CO).espesor_mm), s).toBeLessThanOrEqual(0.5);
      expect(Math.abs(r.TVL_concrete_mm - espesorTerapiaGP(n, 1, 0.1, CO).espesor_mm), s).toBeLessThanOrEqual(0.5);
    }
  });

  it('N2: el método sólo dice «vs haz estrecho» si el nucleido tiene criterio (a)', () => {
    expect(espesorRadionuclidoTerapia('Tc-99m', 'lead', 0.01, 1).metodo).toMatch(/vs haz estrecho a 140\.5 keV/);
    expect(espesorRadionuclidoTerapia('Zr-89', 'lead', 0.01, 1).metodo).not.toMatch(/haz estrecho/);
    expect(espesorRadionuclidoTerapia('I-123', 'concrete', 0.01, 1).metodo).toMatch(/espectro completo \(6 líneas ENSDF ≥ 0\.1 %; rige: GP espectro\)/);
  });
});

describe('IPEM 109: misma regla que Medicina Nuclear', () => {
  it('I-123 da el mismo espesor en los dos diálogos (antes 4.0 / 140 mm frente a 15.7 / 273 mm a B = 0.01)', () => {
    const p: SPECTProcedure = { name: 'x', radionuclide: 'I-123', avgAdminActivity_MBQ: 370, avgImagingTime_min: 30, patientsPerWeek: 2, scatterFactor_1m_uGy: 0 };
    const r = calculateSPECTShielding({ procedure: p, distance_m: 2, wallThickness_mm: 0, wallMaterial: 'lead', designGoal_uSv_week: 1 });
    const B = 1 / r.weeklyKerma_uSv;
    expect(r.requiredLead_mm).toBeCloseTo(espesorRadionuclidoTerapia('I-123', 'lead', B, 0).mm, 9);
    expect(r.requiredConcrete_mm).toBeCloseTo(espesorRadionuclidoTerapia('I-123', 'concrete', B, 0).mm, 9);
    expect(espesorRadionuclidoTerapia('I-123', 'lead', 0.01, 0).mm).toBeCloseTo(15.704, 2);
    expect(espesorRadionuclidoTerapia('I-123', 'concrete', 0.01, 0).mm).toBeCloseTo(272.79, 1);
  });

  it('todos los nucleidos de IPEM 109 tienen espectro; transmisión de pared = regla espectral; yeso por masa', () => {
    for (const r of SPECT_RADIONUCLIDES) {
      const n = nuclidoTerapiaDeSimbolo(r.symbol);
      expect(n, r.symbol).not.toBeNull();
      expect(transmisionSPECT(r, 'lead', 3)).toBeCloseTo(transmisionRegla(n!, 'Pb', 0.3), 12);
      expect(transmisionSPECT(r, 'concrete', 150)).toBeCloseTo(transmisionRegla(n!, 'Concreto', 15), 12);
      expect(transmisionSPECT(r, 'gypsum', 150)).toBeCloseTo(transmisionRegla(n!, 'Concreto', (15 * 0.705) / 2.35), 12);
      expect(r.tenthValueConcrete_mm).toBeCloseTo(espesorTerapiaGP(n!, 1, 0.1, CO).espesor_mm, 0);
    }
  });

  it('sala de Tc-99m con 50 mm de concreto: el GP pide más que el n·TVL anterior (66 mm por TVL)', () => {
    const p: SPECTProcedure[] = [{ name: 'Óseo', radionuclide: 'Tc-99m', avgAdminActivity_MBQ: 740, avgImagingTime_min: 30, patientsPerWeek: 60, scatterFactor_1m_uGy: 0 }];
    const s = salaSPECT(p, 2, 50, 'concrete', 20);
    expect(s.concreto_mm).toBeCloseTo(espesorTerapiaGP('Tc99m', s.total_uSv, 20, CO).espesor_mm, 3);
    expect(s.concreto_mm).toBeGreaterThan(-Math.log10(20 / s.total_uSv) * 66);
    expect(s.cumple).toBe(false);
  });
});

describe('motor: la modalidad SPECT Tc-99m usa la regla espectral', () => {
  const muro = (id: string, d_m: number, materialCode: string): Barrier => ({
    id, name: id, x1: d_m * 100, y1: -150, x2: d_m * 100, y2: 150, barrierType: 'secondary', useFactor: 1,
    occupancyFactor: 1, designGoal_mSv_per_wk: 1e-4, materialCode,
  } as Barrier);
  const fuente = (id: string): RadiationSource => ({
    id: `n-${id}`, x: 0, y: 0, name: id, modality: MODALITIES.find((m) => m.id === id)!, workloadValue: 2,
    workloadUnit: 'pacientes/semana', isocenterHeight_m: 1, useFactor: 1,
    tg108: { A0_MBq: 740, pacientesSemana: 30, tU_h: 1, tI_h: 0.5, sala: 'captacion' },
  } as RadiationSource);

  it('spect-tc99m → Tc99m; espesores = espesorTerapiaGP en todos los materiales; traza ANS-6.4.3', () => {
    expect(nuclidoTerapiaDe([fuente('spect-tc99m')])).toBe('Tc99m');
    expect(nuclidoTerapiaDe([fuente('spect-tc99m'), fuente('lu177')])).toBeNull();
    const plano = { id: 'tc', name: 'tc', imageUrl: null, width_pixels: 2000, height_pixels: 2000, scale_m_per_pixel: 0.01,
      barriers: [muro('pb', 2, 'PB'), muro('c', 3, 'CONCRETE235')], sources: [fuente('spect-tc99m')], regions: [], criticalPoints: [] } as unknown as FloorPlan;
    const r = calcularProyecto(plano);
    for (const b of r.barriers) {
      expect(b.calculationTrace?.formulaId).toBe('ANS643_GP_ESPECTRO_MAX_HAZ_ESTRECHO');
      expect(b.calculationTrace?.standard).toBe('ANSI/ANS-6.4.3 GP + haz estrecho');
      const t = b.requiredThickness_mm as Record<string, number>;
      for (const m of MATERIALS) expect(t[m.code]).toBeCloseTo(espesorTerapiaGP('Tc99m', b.maxKerma!, b.designGoal_mSv_per_wk, m).espesor_mm, 9);
      expect(t.CONCRETE235).toBeGreaterThan(0);
    }
  });
});
