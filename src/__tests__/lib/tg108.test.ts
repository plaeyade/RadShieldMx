import { describe, expect, it } from 'vitest';
import { dosisSemanalTG108, factorRt, PROTOCOLOS_MN, transmisionRequerida } from '@/lib/tg108';

describe('AAPM TG-108 por paciente', () => {
  it('Rₜ de F-18 a 30, 60 y 90 min: 0.91, 0.83, 0.76 (TG-108)', () => {
    expect(factorRt(0.5, 109.77)).toBeCloseTo(0.91, 2);
    expect(factorRt(1, 109.77)).toBeCloseTo(0.83, 2);
    expect(factorRt(1.5, 109.77)).toBeCloseTo(0.76, 2);
  });

  it('sala de captación reproduce B = 10.9·P·d²/(T·N·A₀·t_U·R_tU)', () => {
    const e = { nuclido: 'F18' as const, A0_MBq: 555, pacientesSemana: 40, tU_h: 1, tI_h: 0.5, sala: 'captacion' as const, d_m: 2 };
    const B = transmisionRequerida(20, 1, dosisSemanalTG108(e));
    const Btg = (10.9 * 20 * 4) / (1 * 40 * 555 * 1 * factorRt(1, 109.77));
    expect(B / Btg).toBeCloseTo(1, 2);
  });

  it('sala de imagen reproduce B = 12.8·P·d²/(T·N·A₀·F_U·t_I·R_tI)', () => {
    const e = { nuclido: 'F18' as const, A0_MBq: 555, pacientesSemana: 40, tU_h: 1, tI_h: 0.5, sala: 'imagen' as const, d_m: 3 };
    const FU = Math.exp((-0.693 * 60) / 109.77);
    const Btg = (12.8 * 20 * 9) / (40 * 555 * FU * 0.5 * factorRt(0.5, 109.77));
    expect(transmisionRequerida(20, 1, dosisSemanalTG108(e)) / Btg).toBeCloseTo(1, 2);
  });

  it('las actividades de referencia citan su guía y tienen rango válido', () => {
    for (const p of PROTOCOLOS_MN) {
      expect(p.fuente.length).toBeGreaterThan(5);
      expect(p.A_MBq[0]).toBeLessThanOrEqual(p.A_MBq[1]);
    }
  });
});
