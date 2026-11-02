import { describe, expect, it } from 'vitest';
import { barreraPrimaria, barreraSecundaria, TABLA_B_1, transmisionArcher, espesorArcher } from '@/lib/ncrp147';

describe('NCRP 147 — ejemplos resueltos del informe', () => {
  it('§5.2 unidad de tórax: muro primario del bucky → 2.2 mm Pb total, 1.4 mm con preblindaje', () => {
    const r = barreraPrimaria({
      distribucion: 'chest_room', material: 'lead', P_mGy_semana: 0.02, T: 1, U: 1,
      N_pacientes_semana: 300, dP_m: 3, xpre_mm: 0.85,
    });
    expect(r.K_sin_blindaje_mGy_semana).toBeCloseTo(40, 6);
    expect(r.B_requerida).toBeCloseTo(5e-4, 9);
    // El informe redondea el total a 2.2 mm y resta 0.85 → «1.4 mm»; sin redondeo intermedio: 2.16 − 0.85
    expect(r.espesor_total_mm).toBeCloseTo(2.16, 2);
    expect(Number(r.espesor_total_mm.toFixed(1))).toBe(2.2);
    expect(r.espesor_barrera_mm).toBeCloseTo(1.31, 2);
  });

  it('Apéndice A: 1.66 mm Pb con la distribución Rad Room (chest bucky) transmite 9.3×10⁻⁴', () => {
    expect(transmisionArcher(1.66, TABLA_B_1.rad_room_chest_bucky.lead)).toBeCloseTo(9.3e-4, 5);
  });

  it('la inversa cerrada es exacta en todo el rango', () => {
    for (const p of Object.values(TABLA_B_1)) {
      for (const B of [0.5, 1e-2, 1e-4, 1e-6]) {
        expect(transmisionArcher(espesorArcher(B, p.lead), p.lead)).toBeCloseTo(B, 10);
      }
    }
  });

  it('secundaria: más pacientes o menos distancia exigen más espesor', () => {
    const base = { distribucion: 'rad_room_all' as const, material: 'lead' as const, P_mGy_semana: 0.02, T: 1, dsec_m: 2 };
    const a = barreraSecundaria({ ...base, N_pacientes_semana: 100 });
    const b = barreraSecundaria({ ...base, N_pacientes_semana: 400 });
    expect(b.espesor_total_mm).toBeGreaterThan(a.espesor_total_mm);
    expect(a.K_sin_blindaje_mGy_semana).toBeCloseTo((3.4e-2 * 100) / 4, 9);
  });

  it('no inventa K¹_P para distribuciones que la Tabla 4.5 no tabula', () => {
    expect(() => barreraPrimaria({ distribucion: 'mammography_room', material: 'lead', P_mGy_semana: 0.02, T: 1, U: 1, N_pacientes_semana: 10, dP_m: 2 })).toThrow(/Tabla 4.5/);
  });
});
