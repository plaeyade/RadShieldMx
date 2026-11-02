import { describe, expect, it } from 'vitest';
import { combinarDosFuentes, dispersion, fuga, primaria, cargaFuga } from '@/lib/ncrp151';

// NCRP 151 §7.1: acelerador dual 6/18 MV; W(18) = 450 y W(6) = 225 Gy/semana; P = 20 µSv/semana.
const f18 = { energia: 18 as const, W_Gy_semana: 450 };
const f6 = { energia: 6 as const, W_Gy_semana: 225 };
const nc = { P_Sv_semana: 20e-6, T: 0.025 };

describe('NCRP 151 — ejemplos resueltos del §7.1', () => {
  it('§7.1.1 barrera primaria en C: B = 3.69e-4, n = 3.43, t = 149.6 cm (18 MV)', () => {
    const r = primaria(f18, { ...nc, U: 0.25, d_m: 7.2 });
    expect(r.espesor_cm).toBeCloseTo(149.6, 0);
  });

  it('§7.1.5 dispersión en A a 30°: 46.1 cm (18 MV), 30.7 cm (6 MV), combinada 55.6 cm', () => {
    const s18 = dispersion(f18, { ...nc, U: 0.25, dsec_m: 7.2, theta_deg: 30 });
    const s6 = dispersion(f6, { ...nc, U: 0.25, dsec_m: 7.2, theta_deg: 30 });
    expect(s18.espesor_cm).toBeCloseTo(46.1, 0);
    expect(s6.espesor_cm).toBeCloseTo(30.7, 0);
    expect(combinarDosFuentes([s18, s6])).toBeCloseTo(55.6, 0);
  });

  it('§7.1.5 fuga en A: 37.3 cm (18 MV), 25 cm (6 MV), combinada 48 cm', () => {
    const l18 = fuga(f18, { ...nc, dL_m: 7.2 });
    const l6 = fuga(f6, { ...nc, dL_m: 7.2 });
    expect(l18.espesor_cm).toBeCloseTo(37.3, 0);
    expect(l6.espesor_cm).toBeCloseTo(25, 0);
    expect(combinarDosFuentes([l18, l6])).toBeCloseTo(48, 0);
  });

  it('§7.1.5 total en A: 55.6 + 1 HVL(36 cm) = 66.4 cm', () => {
    const total = combinarDosFuentes([
      { espesor_cm: 55.6, tvl_cm: 32, nombre: 'dispersión' },
      { espesor_cm: 48, tvl_cm: 36, nombre: 'fuga' },
    ]);
    expect(total).toBeCloseTo(66.4, 1);
  });

  it('§7.1.4 IMRT: W_L(6 MV) = 945 Gy/semana con 80 % IMRT y C_I = 5', () => {
    expect(cargaFuga({ ...f6, fraccionIMRT: 0.8, factorIMRT: 5 })).toBeCloseTo(945, 6);
    expect(cargaFuga({ ...f18, fraccionIMRT: 0.4, factorIMRT: 5 })).toBeCloseTo(1170, 6);
  });
});
