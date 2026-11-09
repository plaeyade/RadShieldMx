/**
 * Fase 7 — núcleo de las calculadoras de diálogo (`calculadorasNormativas`) contra ejemplos publicados:
 * NCRP 151 §7.1 (pp. 105–115), NCRP 147 §5.2–5.3 (pp. 73–83) y AAPM TG-108 (Ejemplos 1 y 2, Tablas IV y V).
 */
import { describe, expect, it } from 'vitest';
import {
  barreraMV, blindajePET, energiaTabuladaMV, espesorHaz, espesorPET, kermaSinBlindajeHaz, transmisionHaz, transmisionPET,
} from '@/lib/calculadorasNormativas';
import { barreraPrimaria } from '@/lib/ncrp147';
import { primaria } from '@/lib/ncrp151';

const dentro = (calculado: number, publicado: number, tol: number) =>
  expect(Math.abs(calculado - publicado) / publicado).toBeLessThanOrEqual(tol);

describe('Megavoltaje (NCRP 151 §7.1: W(18 MV) = 450, W(6 MV) = 225 Gy/semana, P = 0.02, T = 0.025)', () => {
  const base = { material: 'concrete' as const, P_mSv_semana: 0.02, T: 0.025 };

  it('§7.1.1 primaria en C (18 MV, U = 0.25, d = 7.2 m): 149.6 cm de concreto y cumple con el redondeo', () => {
    const r = barreraMV({ ...base, tipo: 'primaria', haces: [{ energia: 18, W_Gy_semana: 450 }], U: 0.25, d_m: 7.2 });
    dentro(r.espesorDosFuentes_cm, 149.6, 0.005);
    expect(r.espesor_cm).toBeCloseTo(primaria({ energia: 18, W_Gy_semana: 450 }, { P_Sv_semana: 2e-5, T: 0.025, U: 0.25, d_m: 7.2 }).espesor_cm, 6);
    expect(r.espesorRedondeado_cm).toBe(150);
    expect(r.cumple).toBe(true);
    expect(r.dosisOcupacion_mSv_semana).toBeLessThanOrEqual(0.02);
  });

  it('§7.1.5 secundaria en A (doble energía, d = 7.2 m, 30°): dispersión 46.1/30.7, fuga 37.3/25 cm, total 66.4 cm', () => {
    const r = barreraMV({
      ...base, tipo: 'secundaria', U: 0.25, d_m: 7.2, theta_deg: 30,
      haces: [{ energia: 18, W_Gy_semana: 450 }, { energia: 6, W_Gy_semana: 225 }],
    });
    const c = (n: string) => r.componentes.find((x) => x.nombre.startsWith(n))!;
    dentro(c('Dispersión del paciente 18').espesor_cm, 46.1, 0.01);
    dentro(c('Dispersión del paciente 6').espesor_cm, 30.7, 0.01);
    dentro(c('Fuga del cabezal 18').espesor_cm, 37.3, 0.01);
    dentro(c('Fuga del cabezal 6').espesor_cm, 25, 0.02);
    dentro(r.espesorDosFuentes_cm, 66.4, 0.015);
    expect(r.espesor_cm).toBeGreaterThanOrEqual(r.espesorSumaDirecta_cm);
    expect(r.cumple).toBe(true);
  });

  it('sólo cumple si T·K ≤ P: un espesor 10 % menor ya no cumple (antes se aceptaba hasta 1.2·P)', () => {
    const r = barreraMV({ ...base, tipo: 'primaria', haces: [{ energia: 18, W_Gy_semana: 450 }], U: 0.25, d_m: 7.2 });
    const comp = r.componentes[0];
    const dosis = (t: number) => base.T * comp.K_mSv_semana * comp.transmision(t);
    expect(dosis(r.espesor_cm)).toBeCloseTo(0.02, 6);
    expect(dosis(0.9 * r.espesor_cm)).toBeGreaterThan(0.02);
  });

  it('la energía no tabulada toma la siguiente por arriba (conservador) y B > 1 da espesor 0', () => {
    expect(energiaTabuladaMV(7)).toBe(10);
    expect(energiaTabuladaMV(18)).toBe(18);
    const r = barreraMV({ ...base, tipo: 'primaria', haces: [{ energia: 6, W_Gy_semana: 1e-6 }], U: 0.25, d_m: 7.2 });
    expect(r.espesor_cm).toBe(0);
  });
});

describe('Diagnóstico (NCRP 147 §5)', () => {
  it('§5.3.1.1 piso bajo la mesa: K = 39 mGy/semana, 107 mm de concreto (Rad Room floor, N = 125, d = 4.1 m)', () => {
    const c = { regimen: 'diagnostico' as const, distribucion: 'rad_room_floor_other' as const, barrera: 'primaria' as const, N_pacientes_semana: 125, U: 1, d_m: 4.1 };
    const K = kermaSinBlindajeHaz(c);
    dentro(K, 39, 0.04);
    dentro(espesorHaz(c, 'concrete', 0.02 / K), 107, 0.05);
  });

  it('§5.3.3.1 muro del receptor de tórax: K = 46, 1.3 mm de plomo (T = 0.2) y coincide con barreraPrimaria', () => {
    const c = { regimen: 'diagnostico' as const, distribucion: 'rad_room_chest_bucky' as const, barrera: 'primaria' as const, N_pacientes_semana: 125, U: 1, d_m: 2.5 };
    const K = kermaSinBlindajeHaz(c);
    const t = espesorHaz(c, 'lead', 0.02 / (0.2 * K));
    dentro(t, 1.3, 0.05);
    const ref = barreraPrimaria({ distribucion: 'rad_room_chest_bucky', material: 'lead', P_mGy_semana: 0.02, T: 0.2, U: 1, N_pacientes_semana: 125, dP_m: 2.5 });
    expect(t).toBeCloseTo(ref.espesor_total_mm, 9);
    expect(transmisionHaz(c, 'lead', t)).toBeCloseTo(0.02 / (0.2 * K), 9);
  });

  it('megavoltaje por la misma vía: 149.6 cm (§7.1.1) y la transmisión es la inversa del espesor', () => {
    const c = { regimen: 'megavoltaje' as const, energia: 18 as const, W_Gy_semana: 450, U: 0.25, d_m: 7.2 };
    const B = 0.02 / (0.025 * kermaSinBlindajeHaz(c));
    const t = espesorHaz(c, 'concrete', B);
    dentro(t, 1496, 0.005);
    expect(transmisionHaz(c, 'concrete', t)).toBeCloseTo(B, 9);
  });
});

describe('Fuente PET (AAPM TG-108)', () => {
  it('Tabla V reproduce la Tabla IV (±5 %): Pb 10 mm 0.2485, concreto 10 cm 0.3987, hierro 5 cm 0.1479', () => {
    dentro(transmisionPET('lead', 10), 0.2485, 0.05);
    dentro(transmisionPET('concrete', 100), 0.3987, 0.05);
    dentro(transmisionPET('iron', 50), 0.1479, 0.05);
    expect(transmisionPET('lead', espesorPET('lead', 0.1))).toBeCloseTo(0.1, 9);
  });

  it('Ejemplo 1 (captación, 555 MBq, 40 pacientes, 1 h, d = 4 m, T = 1): B = 0.189, 1.2 cm Pb o 15 cm de concreto', () => {
    const r = blindajePET({ nuclido: 'F18', A0_MBq: 555, pacientesSemana: 40, tU_h: 1, tI_h: 0.5, sala: 'captacion', d_m: 4, P_mSv_semana: 0.02, T: 1 });
    dentro(r.B_requerida, 0.189, 0.02);
    expect(Math.abs(r.espesores_mm.lead - 12)).toBeLessThanOrEqual(1);
    expect(Math.abs(r.espesores_mm.concrete - 150)).toBeLessThanOrEqual(10);
  });

  it('Ejemplo 2 (imagen, d = 3 m): 59.7 μSv/semana, B = 0.34, 0.8 cm Pb o 11 cm de concreto', () => {
    const r = blindajePET({ nuclido: 'F18', A0_MBq: 555, pacientesSemana: 40, tU_h: 1, tI_h: 0.5, sala: 'imagen', d_m: 3, P_mSv_semana: 0.02, T: 1 });
    dentro(r.D_mSv_semana, 0.0597, 0.02);
    dentro(r.B_requerida, 0.34, 0.02);
    expect(Math.abs(r.espesores_mm.lead - 8)).toBeLessThanOrEqual(1);
    expect(Math.abs(r.espesores_mm.concrete - 110)).toBeLessThanOrEqual(10);
  });
});
