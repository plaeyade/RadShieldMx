/**
 * Revisión del #58: equivalencia W ↔ Pb dependiente de la energía y de la aleación (`src/lib/equivalenciaWPb.ts`).
 * Referencias: NIST XCOM 3.1 (µ/ρ por elemento, `scripts/fase11_xcom_malla.py`; reproduce SRD 126 a ±0.05 %) y
 * composiciones de ASTM B777. Valores de control calculados en Python con la misma tabla (regla de mezcla de Bragg).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  ALEACIONES_W, ENERGIAS_HAZ_W, XCOM_MU_RHO_W_PB, espesorWDesdePb, factorPbAleacion, factorWPbEnergias, factorWPbHaz,
  muRhoAleacion, muRhoElemento,
} from '@/lib/equivalenciaWPb';

const xcom = JSON.parse(readFileSync('scripts/fase11_xcom_mu_rho.json', 'utf8')) as { muRhoWPb: { filas: number[][] } };
const puro = [ALEACIONES_W.puro];

describe('equivalencia W↔Pb por energía (NIST XCOM, ASTM B777)', () => {
  it('la tabla del módulo es la del generador y reproduce NIST SRD 126 (Pb, W)', () => {
    expect(XCOM_MU_RHO_W_PB.map((r) => [...r])).toEqual(xcom.muRhoWPb.filas);
    const srd: [number, number, number][] = [[1.25, 0.05876, 0.05577], [2, 0.04606, 0.04433], [6, 0.04391, 0.0421], [10, 0.04972, 0.04747], [20, 0.06206, 0.05893]];
    for (const [E, pb, w] of srd) {
      expect(Math.abs(muRhoElemento('Pb', E) / pb - 1), `Pb ${E}`).toBeLessThan(5e-4);
      expect(Math.abs(muRhoElemento('W', E) / w - 1), `W ${E}`).toBeLessThan(5e-4);
    }
  });

  it.each([
    // [E (MeV), W puro, aleación clase 1 (peor caso)]
    [0.140511, 1.2705, 1.3923], [0.511, 1.1673, 1.2117], [1.25, 1.0536, 1.0569],
  ])('f(%s MeV): W puro %s, aleación 17.0 g/cm³ %s', (E, fPuro, fAleacion) => {
    expect(factorPbAleacion(E, puro)).toBeCloseTo(fPuro, 3);
    expect(factorPbAleacion(E)).toBeCloseTo(fAleacion, 3);
    expect(factorPbAleacion(E)).toBeGreaterThan(factorPbAleacion(E, puro));
  });

  it('6 y 18 MV (1.0 MeV–nominal): 1.082 y 1.098 (W puro 1.073; el factor único 1.054 dejaba el TVL 2.7 % y 4 % corto)', () => {
    expect(factorWPbHaz('6')).toBeCloseTo(1.0824, 3);
    expect(factorWPbHaz('18')).toBeCloseTo(1.0975, 3);
    expect(factorWPbHaz('6', puro)).toBeCloseTo(1.0732, 3);
    expect(factorWPbHaz('18', puro)).toBeCloseTo(1.0732, 3);
    // Más W en la aleación → factor menor (clase 4 entre la clase 1 y el W puro).
    const c4 = [ALEACIONES_W['B777-4-NiFe']];
    expect(factorWPbHaz('18', c4)).toBeLessThan(factorWPbHaz('18'));
    expect(factorWPbHaz('18', c4)).toBeGreaterThan(factorWPbHaz('18', puro));
  });

  it('entre los bordes K de W (69.5 keV) y Pb (88.0 keV) el W atenúa más por gramo (f < 1); fuera, f > 1', () => {
    for (const E of [0.07, 0.08, 0.087]) expect(factorPbAleacion(E, puro), String(E)).toBeLessThan(0.35);
    for (const E of [0.05, 0.1, 0.2, 0.5, 1, 2, 10]) expect(factorPbAleacion(E), String(E)).toBeGreaterThan(1);
  });

  it('B2 (2.ª revisión del #58): F(MV) cubre f(E) en todo 1 MeV–nominal, es ≥ F(Co-60) y no decrece con la energía nominal', () => {
    // f(1 MeV) = 1.082 > f(1.25 MeV) = 1.057: antes F(6 MV) = 1.069 quedaba por debajo de f(1 MeV).
    expect(factorPbAleacion(1.0)).toBeCloseTo(1.0824, 3);
    const mv = ['6', '10', '15', '18', '25'] as const;
    const nominal = { '6': 6, '10': 10, '15': 15, '18': 18, '25': 20 } as const;
    for (const e of mv) {
      expect(ENERGIAS_HAZ_W[e][0], e).toBe(1.0);
      expect(factorWPbHaz(e), e).toBeGreaterThanOrEqual(factorWPbHaz('Co60'));
      // Malla fina de 1 MeV a la nominal: ningún f(E) por encima de F.
      for (let i = 0; i <= 200; i++) {
        const E = 1.0 * (nominal[e] / 1.0) ** (i / 200);
        expect(factorPbAleacion(E), `${e} ${E}`).toBeLessThanOrEqual(factorWPbHaz(e) + 1e-12);
      }
    }
    for (let i = 1; i < mv.length; i++) expect(factorWPbHaz(mv[i])).toBeGreaterThanOrEqual(factorWPbHaz(mv[i - 1]));
    // Bajo el corte: f(0.8 MeV) sólo 3 % mayor y con ≈ 5 % del peso relativo tras 5.7 cm de Pb (efecto ≤ 0.2 %).
    expect(factorPbAleacion(0.8) / factorPbAleacion(1.0)).toBeLessThan(1.04);
    expect(Math.exp(-(muRhoElemento('Pb', 0.8) - muRhoElemento('Pb', 4)) * 11.35 * 5.7)).toBeLessThan(0.05);
  });

  it('medicina nuclear (referencia; el motor no la usa): F sobre las líneas (Tc-99m 1.39, PET 1.21)', () => {
    expect(factorWPbEnergias([0.140511])).toBeCloseTo(1.3923, 3);
    expect(factorPbAleacion(0.511)).toBeCloseTo(1.2117, 3);
  });

  it('conservador: la aleación equivalente nunca transmite más que el Pb al que sustituye, línea por línea', () => {
    // Haz estrecho a cada energía de control: e^(−µ_W·ρ_W·t_W) ≤ e^(−µ_Pb·ρ_Pb·t_Pb) con t_W = t_Pb·ρ_Pb·F/ρ_W.
    const a = ALEACIONES_W['B777-1-NiFe'];
    for (const [E, F] of [[0.140511, factorWPbEnergias([0.140511])], [0.511, factorPbAleacion(0.511)], [1.25, factorWPbHaz('Co60')], [6, factorWPbHaz('6')], [18, factorWPbHaz('18')]] as const) {
      const tW = espesorWDesdePb(10, F, a.densidad) / 10;
      expect(muRhoAleacion(a, E) * a.densidad * tW, String(E)).toBeGreaterThanOrEqual(muRhoElemento('Pb', E) * 11.35 * 1 - 1e-12);
    }
  });
});
