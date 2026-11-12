/**
 * Fase 11, etapa 8 (decisión del propietario): PET con la curva de transmisión de banda ancha de AAPM TG-108 a 511 keV
 * (Madsen et al., Med. Phys. 33(1):4–15, 2006; Tabla V, ajuste de Archer) en lugar de un TVL único, con el espesor por
 * inversión numérica de B(x), en `zonaControladaMotor` y en `motorProyecto`.
 *
 * Referencias de las pruebas, todas de TG-108:
 * - Tabla V: α, β (cm⁻¹) y γ de plomo, concreto (2.35 g/cm³) y hierro.
 * - Tabla IV: factores de transmisión de banda ancha (plomo en mm; concreto y hierro en cm).
 * - Ejemplos 1, 2, 4 y 5: B requerida y el espesor que el informe lee en la Tabla IV.
 */
import { describe, expect, it } from 'vitest';
import {
  TG108_TABLA_V, ajusteTG108Catalogo, espesorPET511, espesorTG108, transmisionTG108, type MaterialTG108,
} from '@/lib/transmisionTG108';
import { espesorPETZona } from '@/lib/zonaControladaMotor';
import { calcularProyecto } from '@/lib/motorProyecto';
import { exponentialThickness } from '@/lib/shieldingMath';
import { buildDefaultControlledZoneCalculationAssumptions, calculateControlledZoneShieldingPlan } from '@/lib/controlledZoneCalculationAdapter';
import { buildDefaultControlledZoneProfile, generateControlledZoneFeasibility } from '@/lib/controlledZoneFeasibility';
import { muestraFuentes, planoEjemploCompleto } from '@/lib/ejemploGuiado';
import { MATERIALS } from '@/types/radshield';

const mat = (code: string) => MATERIALS.find((m) => m.code === code)!;

/** Inversa cerrada que publica TG-108: x = (1/αγ)·ln{[B^−γ + β/α]/[1 + β/α]} (cm). */
const inversaCerrada_mm = (m: MaterialTG108, B: number) => {
  const { alpha: a, beta: b, gamma: g } = TG108_TABLA_V[m];
  return (10 * Math.log((Math.pow(B, -g) + b / a) / (1 + b / a))) / (a * g);
};

// TG-108 Tabla IV: espesor (plomo mm; concreto y hierro cm) → transmisión.
const TABLA_IV: { x: number; lead: number; concrete: number; iron?: number }[] = [
  { x: 1, lead: 0.8912, concrete: 0.9583, iron: 0.7484 },
  { x: 2, lead: 0.7873, concrete: 0.9088, iron: 0.5325 },
  { x: 3, lead: 0.6905, concrete: 0.8519, iron: 0.3614 },
  { x: 4, lead: 0.6021, concrete: 0.7889, iron: 0.2353 },
  { x: 5, lead: 0.5227, concrete: 0.7218, iron: 0.1479 },
  { x: 6, lead: 0.4522, concrete: 0.6528, iron: 0.0905 },
  { x: 7, lead: 0.3903, concrete: 0.5842, iron: 0.0542 },
  { x: 8, lead: 0.3362, concrete: 0.518, iron: 0.0319 },
  { x: 9, lead: 0.2892, concrete: 0.4558, iron: 0.0186 },
  { x: 10, lead: 0.2485, concrete: 0.3987, iron: 0.0107 },
  { x: 12, lead: 0.1831, concrete: 0.3008, iron: 0.0035 },
  { x: 14, lead: 0.1347, concrete: 0.2243, iron: 0.0011 },
  { x: 16, lead: 0.099, concrete: 0.1662, iron: 0.0004 },
  { x: 18, lead: 0.0728, concrete: 0.1227, iron: 0.0001 },
  { x: 20, lead: 0.0535, concrete: 0.0904 },
  { x: 25, lead: 0.0247, concrete: 0.0419 },
  { x: 30, lead: 0.0114, concrete: 0.0194 },
  { x: 40, lead: 0.0024, concrete: 0.0042 },
  { x: 50, lead: 0.0005, concrete: 0.0009 },
];

describe('AAPM TG-108 a 511 keV: curva de banda ancha (Tabla V) e inversión numérica', () => {
  it('Tabla V: los parámetros publicados', () => {
    expect(TG108_TABLA_V.lead).toEqual({ alpha: 1.543, beta: -0.4408, gamma: 2.136 });
    expect(TG108_TABLA_V.concrete).toEqual({ alpha: 0.1539, beta: -0.1161, gamma: 2.0752 });
    expect(TG108_TABLA_V.iron).toEqual({ alpha: 0.5704, beta: -0.3063, gamma: 0.6326 });
  });

  it('reproduce la Tabla IV de TG-108 (al redondeo de 4 decimales)', () => {
    for (const fila of TABLA_IV) {
      expect(Math.abs(transmisionTG108('lead', fila.x) - fila.lead)).toBeLessThanOrEqual(6e-5);
      expect(Math.abs(transmisionTG108('concrete', fila.x * 10) - fila.concrete)).toBeLessThanOrEqual(6e-5);
      if (fila.iron !== undefined) expect(Math.abs(transmisionTG108('iron', fila.x * 10) - fila.iron)).toBeLessThanOrEqual(6e-5);
    }
  });

  it('la inversión numérica coincide con la inversa cerrada de TG-108 y es la inversa de B(x)', () => {
    for (const m of ['lead', 'concrete', 'iron'] as const) {
      for (const B of [0.9, 0.6, 0.4, 0.189, 0.1, 0.05, 1e-2, 1e-4, 1e-7]) {
        const x = espesorTG108(m, B);
        expect(x).toBeCloseTo(inversaCerrada_mm(m, B), 6);
        expect(transmisionTG108(m, x) / B).toBeCloseTo(1, 8);
      }
      expect(espesorTG108(m, 1)).toBe(0);
      expect(espesorTG108(m, 1.5)).toBe(0);
      expect(espesorTG108(m, 0)).toBe(Infinity);
    }
  });

  it.each([
    // [ejemplo, B, plomo (mm) y concreto (cm) que TG-108 lee en la Tabla IV]
    ['Ejemplo 1 (captación, 4 m)', 0.189, 12, 15],
    ['Ejemplo 2 (imagen, 3 m)', 0.34, 8, 11],
    ['Ejemplo 4 (sala superior)', 0.17, 13, 17],
    ['Ejemplo 5 (sala inferior)', 0.15, 13, 17],
  ])('%s: B = %s → %s mm de plomo, %s cm de concreto', (_n, B, pb_mm, conc_cm) => {
    // TG-108 redondea la lectura de la Tabla IV hacia el escalón publicado: la curva queda a ≤ 0.6 mm de plomo y ≤ 1.2 cm
    // de concreto del valor del informe.
    expect(Math.abs(espesorTG108('lead', B) - pb_mm)).toBeLessThanOrEqual(0.6);
    expect(Math.abs(espesorTG108('concrete', B) / 10 - conc_cm)).toBeLessThanOrEqual(1.2);
  });

  it('Ejemplo 1 completo: 555 MBq, 40 pacientes, tU = 1 h, 4 m, P = 20 μSv, T = 1 → B = 0.189', () => {
    const z = espesorPETZona({ A0_MBq: 555, pacientesSemana: 40, tU_h: 1, d_m: 4, P_mSv_semana: 0.02, T: 1, materialCodigo: 'PB' });
    expect(0.02 / z.K_sin_blindaje_mSv_semana).toBeCloseTo(0.189, 2);
    expect(z.espesor_mm).toBeCloseTo(espesorTG108('lead', 0.02 / z.K_sin_blindaje_mSv_semana), 9);
    expect(z.espesor_mm / 10).toBeCloseTo(1.2, 1);
  });

  it('B ≈ 0.4 (PET Sur del perfil por omisión): la curva pide ≈ 3 cm más de concreto que el TVL único de 176 mm', () => {
    const profile = buildDefaultControlledZoneProfile({});
    const option = generateControlledZoneFeasibility(profile).find((o) => o.shieldingSeeds[0].calculationFamily === 'TG108')!;
    const sur = calculateControlledZoneShieldingPlan(option, profile, buildDefaultControlledZoneCalculationAssumptions())
      .calculations.find((c) => c.barrier === 'Sur')!;
    const B = (sur.designGoal_mSvWeek / sur.occupancyFactor) / sur.unshielded_mSvWeek;
    expect(B).toBeGreaterThan(0.35);
    expect(B).toBeLessThan(0.45);
    const tvlUnico = exponentialThickness(sur.unshielded_mSvWeek, sur.designGoal_mSvWeek / sur.occupancyFactor, mat('CONCRETE235'), '511keV');
    expect(tvlUnico).toBeCloseTo(68, 0);
    // K del plan va redondeado a 3 decimales: B recalculada con él difiere < 1 % (≤ 1 mm de concreto).
    expect(Math.abs(sur.requiredThickness_mm - inversaCerrada_mm('concrete', B))).toBeLessThanOrEqual(1);
    expect(sur.requiredThickness_mm - tvlUnico).toBeGreaterThan(25);
    expect(sur.requiredThickness_mm - tvlUnico).toBeLessThan(35);
  });

  it('con B pequeña (≤ 0.05) la curva y el TVL de equilibrio quedan cerca (≤ 1.5 cm de concreto)', () => {
    const K = 1;
    const P = 0.01;
    const curva = espesorPET511(K, P, mat('CONCRETE235'));
    const tvl = exponentialThickness(K, P, mat('CONCRETE235'), '511keV');
    expect(Math.abs(curva - tvl)).toBeLessThan(15);
  });

  it('materiales del catálogo: plomo y acero con su ajuste; el resto, concreto equivalente por densidad', () => {
    expect(ajusteTG108Catalogo(mat('PB'))).toEqual({ material: 'lead', escala: 1 });
    expect(ajusteTG108Catalogo(mat('STEEL'))).toEqual({ material: 'iron', escala: 1 });
    expect(ajusteTG108Catalogo(mat('CONCRETE235'))).toEqual({ material: 'concrete', escala: 1 });
    const barita = ajusteTG108Catalogo(mat('CONCRETEBARITE'));
    expect(barita.material).toBe('concrete');
    expect(barita.escala).toBeCloseTo(2.35 / 3.5, 9);
    expect(espesorPET511(0.5, 0.5, mat('PB'))).toBe(0);
  });

  it('motorProyecto («Guíame», muro norte de captación) usa la curva de TG-108, no el TVL único', () => {
    const ej = planoEjemploCompleto();
    const captacion = muestraFuentes().find((s) => s.id === 'eg-fuente-captacion')!;
    const norte = ej.barriers.find((b) => b.id === 'eg-captacion-norte')!;
    const calc = calcularProyecto({ ...ej, barriers: [norte], sources: [captacion] }).barriers[0];
    const r = calc.requiredThickness_mm as Record<string, number>;
    const K = calc.maxKerma!;
    const P = norte.designGoal_mSv_per_wk / norte.occupancyFactor;
    for (const [code, m] of [['PB', 'lead'], ['CONCRETE235', 'concrete'], ['STEEL', 'iron']] as const) {
      expect(r[code]).toBeCloseTo(inversaCerrada_mm(m, P / K), 6);
    }
  });
});
