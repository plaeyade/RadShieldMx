/**
 * Pendientes de la revisión independiente de la Fase 8c (PR #35):
 * 1. Oblicuidad (NCRP 151 §2.2 / NCRP 147): para θ > 45° la transmisión nunca es menor que la de incidencia normal y no
 *    tiene salto en B = 10⁻³ (antes, justo por encima del umbral, podía ser ×2 menos conservadora).
 * 2. TVL de Ac-225, Pb-212 y Ra-223 con hijas en equilibrio (XCOM de haz estrecho a la línea más penetrante).
 * 3. Gamma Knife: objetivo P de NCRP 147/151 (0.1 mSv/semana, controlada) en lugar del 400 μSv/semana del expediente.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OBLICUIDAD_UMBRAL_DEG, TABLA_B_2, correccionOblicuidad, espesorTVL, transmisionTVL } from '@/lib/ncrp151';
import { OBJETIVO_GAMMA_KNIFE, blindajeCo60, incidenciaOblicua } from '@/lib/calculadorasNormativas';
import { NCRP_DESIGN_GOALS } from '@/lib/ncrpOccupancy';
import { THERAPY_NUCLIDES, calculateTaskDose } from '@/lib/therapy/TherapeuticRadionuclideShielding';
import GammaKnifeDialog from '@/sections/dialogs/GammaKnifeDialog';

afterEach(cleanup);

describe('oblicuidad: nunca menos conservadora que la incidencia normal', () => {
  it('frontera B = 10⁻³: sin salto; a ambos lados la transmisión es la normal', () => {
    // Espesor normal t₀ tal que la oblicua a 60° (recorrido 2·t₀) da exactamente B = 10⁻³ con 18 MV en concreto.
    const tvl = TABLA_B_2.concrete['18'];
    const t0 = espesorTVL(1e-3, tvl) / 2;
    const lado = (f: number) => incidenciaOblicua(18, 'concrete', t0 * f, 60);
    const abajo = lado(1 + 1e-6), arriba = lado(1 - 1e-6);
    expect(abajo.B_oblicua).toBeLessThan(1e-3);
    expect(arriba.B_oblicua).toBeGreaterThan(1e-3);
    expect(abajo.B_corregida).toBeCloseTo(abajo.B_normal, 15);
    expect(arriba.B_corregida).toBeCloseTo(arriba.B_normal, 15);
    expect(arriba.B_corregida / abajo.B_corregida).toBeLessThan(1 + 1e-4); // antes: ≈ 0.5
  });

  it('θ > 45°, cualquier material, energía y espesor: B_corregida ≥ B_normal (y ≥ la oblicua con 1 o 2 HVL)', () => {
    for (const e of [6, 18, 'Co60'] as const) {
      for (const m of ['concrete', 'steel', 'lead'] as const) {
        for (const t of [1, 10, 40, 120, 250]) {
          for (const th of [46, 60, 70, 85]) {
            const r = incidenciaOblicua(e, m, t, th);
            expect(r.B_corregida).toBeGreaterThanOrEqual(r.B_normal * (1 - 1e-12));
            expect(r.B_corregida).toBeGreaterThanOrEqual(Math.min(r.B_normal, r.B_oblicua * (e === 'Co60' ? 4 : 2)) * (1 - 1e-12));
            expect(r.espesorEquivalenteNormal_cm).toBeLessThanOrEqual(t + 1e-9);
          }
        }
      }
    }
  });

  it('θ ≤ 45°: se conserva el espesor oblicuo t/cos θ (válido según §2.2)', () => {
    const tvl = TABLA_B_2.concrete['6'];
    const Bo = transmisionTVL(100 / Math.cos(Math.PI / 4), tvl), Bn = transmisionTVL(100, tvl);
    expect(correccionOblicuidad(Bo, Bn, OBLICUIDAD_UMBRAL_DEG).transmision).toBe(Bo);
    expect(correccionOblicuidad(Bo, Bn, OBLICUIDAD_UMBRAL_DEG + 0.01).transmision).toBe(Bn);
  });
});

describe('alfa-emisores con hijas en equilibrio (XCOM de haz estrecho)', () => {
  const n = (s: string) => THERAPY_NUCLIDES.find(x => x.symbol === s)!;
  // μ/ρ de NIST (Hubbell y Seltzer) interpolado log-log; Pb 11.35 g/cm³, concreto 2.35 g/cm³.
  const tvl = (mu_rho: number, rho: number) => (Math.LN10 / (mu_rho * rho)) * 10;
  const ll = (e: number, e1: number, m1: number, e2: number, m2: number) => Math.exp(Math.log(m1) + Math.log(e / e1) / Math.log(e2 / e1) * Math.log(m2 / m1));

  it('Ac-225 (Tl-209 1567 keV): Pb ≥ 39.6 mm, concreto ≥ 189 mm', () => {
    expect(n('Ac-225').tenthValueLead_mm).toBeGreaterThanOrEqual(tvl(ll(1.567, 1.5, 0.05222, 2, 0.04606), 11.35));
    expect(n('Ac-225').tenthValueConcrete_mm).toBeGreaterThanOrEqual(tvl(ll(1.567, 1.5, 0.05288, 2, 0.04557), 2.35));
  });

  it('Pb-212 (Tl-208 2614 keV): Pb ≥ 46.6 mm, concreto ≥ 246 mm; Γ con Bi-212 y Tl-208 ≥ 0.18', () => {
    expect(n('Pb-212').tenthValueLead_mm).toBeGreaterThanOrEqual(tvl(ll(2.6145, 2, 0.04606, 3, 0.04234), 11.35));
    expect(n('Pb-212').tenthValueConcrete_mm).toBeGreaterThanOrEqual(tvl(ll(2.6145, 2, 0.04557, 3, 0.03701), 2.35));
    expect(n('Pb-212').gammaConstant_uSvm2perGBqh).toBeGreaterThanOrEqual(0.18);
  });

  it('Ra-223 (Pb-211 832 keV): Pb ≥ 23.7 mm, concreto ≥ 138 mm; Γ de la cadena ≥ 0.040', () => {
    expect(n('Ra-223').tenthValueLead_mm).toBeGreaterThanOrEqual(tvl(ll(0.832, 0.8, 0.0887, 1, 0.07102), 11.35));
    expect(n('Ra-223').tenthValueConcrete_mm).toBeGreaterThanOrEqual(tvl(ll(0.832, 0.8, 0.07227, 1, 0.06495), 2.35));
    expect(n('Ra-223').gammaConstant_uSvm2perGBqh).toBeGreaterThanOrEqual(0.040);
  });

  it('Ac-225: Γ ≥ 0.0326 μSv·m²/(MBq·h) de Infantino et al. (2022); los desechos piden ahora cm de plomo, no décimas de mm', () => {
    expect(n('Ac-225').gammaConstant_uSvm2perGBqh).toBeGreaterThanOrEqual(0.0326);
    const r = calculateTaskDose({ name: 'x', nuclide: 'Ac-225', activity_MBq: 1000, frequency_perWeek: 5, duration_min: 60, distance_m: 0.5, taskType: 'waste' });
    expect(r.minLead_mm).toBeGreaterThan(10);
  });
});

describe('Gamma Knife: objetivo P de NCRP 147/151, configurable', () => {
  it('P = 0.1 mSv/semana (controlada) con fuente; S1a (140.4 μSv/semana) requiere blindaje', () => {
    expect(OBJETIVO_GAMMA_KNIFE.P_mSv_semana).toBe(NCRP_DESIGN_GOALS.controlled);
    expect(OBJETIVO_GAMMA_KNIFE.P_mSv_semana).toBeLessThan(OBJETIVO_GAMMA_KNIFE.P_expediente_mSv_semana);
    expect(OBJETIVO_GAMMA_KNIFE.fuente).toMatch(/NCRP 147/);
    const r = blindajeCo60(0.1404, OBJETIVO_GAMMA_KNIFE.P_mSv_semana, 1);
    expect(r.B_requerida).toBeCloseTo(100 / 140.4, 9);
    expect(r.espesores_cm.concrete).toBeCloseTo(21 * Math.log10(140.4 / 100), 6); // ≈ 3.1 cm (Tabla B.2, Co-60)
    render(<GammaKnifeDialog open onOpenChange={() => {}} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
