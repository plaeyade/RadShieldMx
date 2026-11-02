import { describe, expect, it } from 'vitest';
import {
  capturaGammaPorGy, fluenciaA, neutronesKersey, neutronesWuMcGinley, puerta, totalFotones,
  fuenteNeutronesConservadora, albedoConcreto,
} from '@/lib/ncrp151Laberinto';

// NCRP 151 §7.1.10–7.1.13: Varian 1800 a 18 MV, sala de 7.8 × 7.8 × 3.65 m.
const sala = { Qn: 1.22e12, d1_m: 6.4, d2_m: 8.5, Sr_m2: 236, S0_m2: 9.2, S1_m2: 8.4, H0_mSv_Gy: 1.6 };

describe('NCRP 151 — laberinto y puerta (§7.1.10–7.1.13)', () => {
  it('Ec. 2.16: φA = 7.88 × 10⁹ n/m² por Gy', () => {
    expect(fluenciaA(sala) / 1e9).toBeCloseTo(7.88, 2);
  });

  it('Ec. 2.15/2.17: hφ = 1.45 × 10⁻⁷ Sv/Gy; Hcg = 65.3 µSv/semana con W_L = 450', () => {
    const h = capturaGammaPorGy(sala, 18);
    expect(h / 1e-7).toBeCloseTo(1.45, 2);
    expect(450 * h * 1e6).toBeCloseTo(65.3, 0);
  });

  it('Ec. 2.18 Kersey: 1.7 × 10⁻⁶ Sv/Gy; Wu–McGinley ≈ 46 % de Kersey', () => {
    const k = neutronesKersey(sala);
    expect(k / 1e-6).toBeCloseTo(1.7, 1);
    expect(neutronesWuMcGinley(sala) / k).toBeCloseTo(0.45, 1);
  });

  it('Ec. 2.14 con IMRT: H_Tot = 2.64 [0.34·2.1 + 5.5 + 34.9 + 1.7] µSv = 113 µSv/semana', () => {
    expect(totalFotones(0.34, 2.1, 5.5, 34.9, 1.7)).toBeCloseTo(113, 0);
  });

  it('§7.1.13 puerta: 53 mm de BPE y 7 mm de Pb para P = 0.1 mSv/semana', () => {
    const r = puerta(1e-4, { neutrones: 450 * 1.7e-6, captura: 65.3e-6, fotones: 113e-6 });
    expect(r.bpe_mm).toBeCloseTo(53.3, 0);   // el informe redondea n a 1.19 → 53.6 mm
    expect(r.plomo_mm).toBeCloseTo(7.1, 0);  // el informe redondea n a 0.12 → 7.3 mm
  });

  it('§7.1.13 con IMRT: 72 mm de BPE y 32 mm de Pb', () => {
    const r = puerta(1e-4, { neutrones: 1989e-6, captura: 170e-6, fotones: 113e-6 });
    expect(r.bpe_mm).toBeCloseTo(72, -1);
    expect(r.plomo_mm).toBeCloseTo(32, 0);
  });

  it('Tablas B.8a y B.9: albedo y fuente conservadora sin datos del fabricante', () => {
    expect(albedoConcreto('18', 0)).toBeCloseTo(3.4e-3, 9);
    expect(albedoConcreto('0.5MeV', 0)).toBeCloseTo(19e-3, 9);
    const f15 = fuenteNeutronesConservadora(15);
    expect(f15.Qn).toBeCloseTo(0.76e12, 0);
    expect(f15.H0_mSv_Gy).toBeCloseTo(1.3, 9);
  });
});
