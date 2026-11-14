/**
 * Revisión del #58, H5: verificación independiente mínima de `terapiaEspectroGP`.
 *
 * No importa nada del cálculo del módulo ni de `scripts/fase11_diagnostico_gp.py` (el script del autor, con xraydb/Elam):
 * - µ/ρ de NIST XCOM 3.1 en cada línea (salida de `scripts/fase11_xcom_malla.py`, que lee la base de datos de XCOM):
 *   total con coherente para el haz estrecho y sin coherente para el GP;
 * - buildup de exposición de ANSI/ANS-6.4.3 con la fórmula GP evaluada aquí, con las filas de la Tabla 5.1
 *   (ORNL/RSIC-49 / NUREG/CR-5740; Pb p. impresa 92, concreto 96) copiadas sólo para las energías que encierran cada
 *   línea, e interpolando el BUILDUP B(E) en log-log entre esas dos filas a mfp fijo (el módulo interpola los
 *   coeficientes: otro esquema, de modo que la comparación también prueba la interpolación);
 * - pesos por kerma en aire con µ_en/ρ del aire de NIST SRD 126 («Air, Dry»), interpolado log-log aquí.
 * Tres casos: Tc-99m en concreto (el e2e de Medicina Nuclear, 152.2 mm), In-111 en plomo (los dos criterios) y Zr-89
 * en plomo (GP de 5 líneas, 31.3 mm). Tolerancia 1 % en espesor.
 */
import { describe, expect, it } from 'vitest';
import { espesorTerapiaGP } from '@/lib/terapiaEspectroGP';

type Fila = [number, number, number, number, number, number]; // E (MeV), b, c, a, X_k, d
const TABLA_5_1: Record<'Pb' | 'Concreto', Fila[]> = {
  Pb: [
    [0.15, 1.408, 0.362, 0.281, 21.46, -0.0964], [0.2, 1.184, 0.19, 0.381, 13.27, -0.1868], [0.3, 1.122, 0.533, 0.137, 13.69, -0.0612],
    [0.5, 1.179, 0.725, 0.072, 14.89, -0.0244], [0.6, 1.228, 0.744, 0.064, 14.47, -0.0184], [0.8, 1.283, 0.8, 0.05, 15.2, -0.0191],
    [1, 1.318, 0.86, 0.035, 16.49, -0.0154], [1.5, 1.375, 0.891, 0.029, 13.29, -0.0168], [2, 1.388, 0.939, 0.024, 13.33, -0.0266],
  ],
  Concreto: [[0.1, 2.766, 1.069, 0.001, 12.64, -0.0251], [0.15, 2.824, 1.315, -0.049, 8.66, -0.0048]],
};
const RHO = { Pb: 11.35, Concreto: 2.35 };
// NIST SRD 126, aire seco: µ_en/ρ (cm²/g).
const MUEN_AIRE: [number, number][] = [[0.1, 0.02325], [0.15, 0.02496], [0.2, 0.02672], [0.3, 0.02872], [0.5, 0.02966], [0.6, 0.02953], [0.8, 0.02882], [1, 0.02789], [1.5, 0.02547], [2, 0.02345]];
const ll = (x0: number, y0: number, x1: number, y1: number, x: number) => Math.exp(Math.log(y0) + (Math.log(x / x0) / Math.log(x1 / x0)) * Math.log(y1 / y0));
const tramo = <T extends readonly number[]>(t: T[], E: number): [T, T] => {
  const i = t.findIndex((r) => r[0] >= E);
  return [t[Math.max(0, i - 1)], t[i]];
};

/** Buildup GP de exposición (ANS-6.4.3, Ap. II sec. 2) de una fila de la Tabla 5.1. */
function bGP([, b, c, a, Xk, d]: Fila, x: number): number {
  const K = c * x ** a + (d * (Math.tanh(x / Xk - 2) - Math.tanh(-2))) / (1 - Math.tanh(-2));
  return Math.abs(K - 1) < 1e-9 ? 1 + (b - 1) * x : 1 + ((b - 1) * (K ** x - 1)) / (K - 1);
}
function buildup(mat: 'Pb' | 'Concreto', E: number, x: number): number {
  const [f0, f1] = tramo(TABLA_5_1[mat], E);
  return f0 === f1 ? bGP(f0, x) : ll(f0[0], bGP(f0, x), f1[0], bGP(f1, x), E);
}

/** Líneas: [E (keV), Iγ (%), µ/ρ sin coherente XCOM (cm²/g) en el material]. */
function T_GP(lineas: [number, number, number][], mat: 'Pb' | 'Concreto', t_cm: number): number {
  const k = lineas.map(([E, I]) => {
    const [a, b] = tramo(MUEN_AIRE, E / 1000);
    return (I / 100) * E * ll(a[0], a[1], b[0], b[1], E / 1000);
  });
  const s = k.reduce((x, y) => x + y, 0);
  return lineas.reduce((acc, [E, , mu], i) => {
    const x = mu * RHO[mat] * t_cm;
    return acc + (k[i] / s) * buildup(mat, E / 1000, x) * Math.exp(-x);
  }, 0);
}
function invertir(T: (t: number) => number, B: number): number {
  let lo = 0, hi = 1;
  while (T(hi) > B) hi *= 2;
  for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (T(m) > B) lo = m; else hi = m; }
  return ((lo + hi) / 2) * 10;
}

const PB = { code: 'PB', density: 11.35 };
const CO = { code: 'CONCRETE235', density: 2.35 };
const rel = (a: number, b: number) => Math.abs(a / b - 1);

describe('H5: verificación independiente (NIST XCOM + Tabla 5.1 de ANS-6.4.3, sin el código del autor)', () => {
  it('Tc-99m, concreto, B = 0.0901 (e2e de Medicina Nuclear): 152.2 mm', () => {
    const t = invertir((x) => T_GP([[140.511, 89.0, 0.14216]], 'Concreto', x), 0.0901);
    expect(t).toBeCloseTo(152.2, 0);
    expect(rel(espesorTerapiaGP('Tc99m', 1, 0.0901, CO).espesor_mm, t)).toBeLessThan(0.01);
  });

  it('In-111, plomo, B = 0.1: haz estrecho a 245.35 keV (µ XCOM total 0.62222) 3.26 mm > GP de 2 líneas ≈ 3.13 mm', () => {
    const estrecho = (-Math.log(0.1) / (0.62222 * 11.35)) * 10;
    const gp = invertir((x) => T_GP([[171.28, 90.7, 1.37], [245.35, 94.1, 0.57901]], 'Pb', x), 0.1);
    expect(estrecho).toBeCloseTo(3.26, 2);
    expect(gp).toBeLessThan(estrecho);
    const r = espesorTerapiaGP('In111', 1, 0.1, PB);
    expect(rel(r.espesor_mm, estrecho)).toBeLessThan(0.01);
    expect(rel(r.porCriterio.hazAncho_mm, gp)).toBeLessThan(0.01);
  });

  it('Zr-89, plomo, B = 0.1: GP de las 5 líneas ≈ 31.3 mm (sin haz estrecho: 1744.5 keV pesa 0.16 %)', () => {
    const lineas: [number, number, number][] = [[511.0, 45.5, 0.14521], [909.15, 99.04, 0.074158], [1657.3, 0.106, 0.048507], [1713.0, 0.745, 0.047828], [1744.5, 0.123, 0.047475]];
    const gp = invertir((x) => T_GP(lineas, 'Pb', x), 0.1);
    expect(gp).toBeCloseTo(31.3, 0);
    expect(rel(espesorTerapiaGP('Zr89', 1, 0.1, PB).espesor_mm, gp)).toBeLessThan(0.01);
  });
});
