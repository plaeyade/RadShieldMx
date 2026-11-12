/**
 * Fase 11, etapa 8 — el diálogo «Layout de búnker» (plan preliminar de zona controlada) calcula con el motor validado.
 *
 * - NCRP 151 §7.1.1 (primaria 18 MV) y §7.1.5 (secundaria 18 + 6 MV): el valor publicado y el mismo espesor que
 *   `motorProyecto` sobre el plano equivalente.
 * - TG-108 (ejemplo «Guíame», muro norte de captación): el mismo espesor que `motorProyecto` con una sola fuente.
 * - Gamma Knife y HDR Ir-192: el mismo espesor que `motorProyecto` para las modalidades `gamma-knife` y `hdr-192ir`.
 * - `calculateControlledZoneShieldingPlan` (lo que llama el diálogo) devuelve esos espesores y ya no importa `uaqProtocol`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { calcularProyecto } from '@/lib/motorProyecto';
import { espesorGammaKnifeZona, espesorHDRZona, espesorLinacZona, espesorPETZona } from '@/lib/zonaControladaMotor';
import {
  buildDefaultControlledZoneCalculationAssumptions,
  calculateControlledZoneShieldingPlan,
} from '@/lib/controlledZoneCalculationAdapter';
import {
  buildDefaultControlledZoneProfile, generateControlledZoneFeasibility,
  type ControlledZoneFeasibilityOption, type ControlledZoneProfile, type ShieldingSeedPoint,
} from '@/lib/controlledZoneFeasibility';
import { ESCALA_EJEMPLO_M_PX, muestraFuentes, planoEjemploCompleto } from '@/lib/ejemploGuiado';
import { MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';

const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);
const modalidad = (id: string) => MODALITIES.find((m) => m.id === id)!;

const plano = (nombre: string, barriers: Barrier[], sources: RadiationSource[]): FloorPlan => ({
  id: nombre, name: nombre, imageUrl: null, width_pixels: 2000, height_pixels: 2000, scale_m_per_pixel: 0.01,
  barriers, sources, regions: [], criticalPoints: [],
} as unknown as FloorPlan);

// Fuente en (0, 0); muro perpendicular al eje x a d_m: el punto de muestreo más cercano queda a d_m + 0.3 m.
const muro = (d_m: number, extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', name: 'b', x1: d_m * 100, y1: -150, x2: d_m * 100, y2: 150, barrierType: 'secondary', useFactor: 1,
  occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', ...extra,
} as Barrier);

const fuente = (id: string, extra: Partial<RadiationSource>): RadiationSource => ({
  id: `s-${id}`, x: 0, y: 0, name: id, modality: modalidad(id), workloadValue: 1, workloadUnit: '', isocenterHeight_m: 0,
  useFactor: 1, ...extra,
} as RadiationSource);

// Como en motorUnico.test.ts: W = workloadValue × 2 Gy/fracción (18 MV: 450 Gy/semana; 6 MV: 225), sin IMRT.
const linac = (mv: 6 | 18) => fuente(`linac-${mv}mv`, { workloadValue: (mv === 18 ? 450 : 225) / 2, useFactor: 0.25, imrtFraction: 0, imrtFactor: 5 });

/**
 * Espesor de motorProyecto y distancia de su punto de muestreo más cercano (los puntos van cada cierto paso a lo largo
 * del muro, 0.3 m detrás: el más cercano queda a ≥ d + 0.3 m). El cálculo preliminar se evalúa en esa misma distancia.
 */
const motor = (plan: FloorPlan, material = 'CONCRETE235') => {
  const b = calcularProyecto(plan).barriers[0];
  return { t: (b.requiredThickness_mm as Record<string, number>)[material], d: b.calculationUnitSnapshot!.minSourceDistance_m };
};

describe('Etapa 8 — zona controlada con el motor validado', () => {
  it('NCRP 151 §7.1.1: primaria 18 MV (T = 1/40, d = 7.2 m) → 149.6 cm de concreto, igual que motorProyecto', () => {
    const e = { tipo: 'primaria' as const, haces: [{ energia_MV: 18, W_Gy_semana: 450 }], fraccionIMRT: 0, P_mSv_semana: 0.02, T: 0.025, U: 0.25 };
    const z = espesorLinacZona({ ...e, d_m: 7.2, materialCodigo: 'concrete235' });
    expect(rel(z.espesor_mm / 10, 149.6)).toBeLessThanOrEqual(0.015);
    expect(z.material).toBe('CONCRETE235');
    const m = motor(plano('7.1.1', [muro(6.9, { barrierType: 'primary', occupancyFactor: 0.025, useFactor: 0.25 })], [linac(18)]));
    expect(m.d).toBeCloseTo(7.2, 2);
    expect(espesorLinacZona({ ...e, d_m: m.d, materialCodigo: 'concrete235' }).espesor_mm).toBeCloseTo(m.t, 6);
  });

  it('NCRP 151 §7.1.5: secundaria 18 + 6 MV (θ = 30°, T = 1/40, d = 7.2 m) → 66.4 cm de concreto, igual que motorProyecto', () => {
    const e = {
      tipo: 'secundaria' as const, haces: [{ energia_MV: 18, W_Gy_semana: 450 }, { energia_MV: 6, W_Gy_semana: 225 }], fraccionIMRT: 0,
      P_mSv_semana: 0.02, T: 0.025, U: 0.25, theta_deg: 30, materialCodigo: 'CONCRETE235',
    };
    expect(rel(espesorLinacZona({ ...e, d_m: 7.2 }).espesor_mm / 10, 66.4)).toBeLessThanOrEqual(0.015);
    const m = motor(plano('7.1.5', [muro(6.9, { occupancyFactor: 0.025, useFactor: 0.25, scatterAngle_deg: 30 })], [linac(18), linac(6)]));
    expect(espesorLinacZona({ ...e, d_m: m.d }).espesor_mm).toBeCloseTo(m.t, 6);
  });

  it('plomo y acero en LINAC: el mismo espesor que motorProyecto', () => {
    for (const material of ['PB', 'STEEL']) {
      const m = motor(plano(`pri-${material}`, [muro(6.9, { barrierType: 'primary', occupancyFactor: 0.025, useFactor: 0.25, materialCode: material })], [linac(18)]), material);
      const z = espesorLinacZona({
        tipo: 'primaria', haces: [{ energia_MV: 18, W_Gy_semana: 450 }], fraccionIMRT: 0,
        P_mSv_semana: 0.02, T: 0.025, U: 0.25, d_m: m.d, materialCodigo: material,
      });
      expect(z.espesor_mm).toBeCloseTo(m.t, 6);
    }
  });

  it('TG-108 («Guíame», muro norte de captación, sólo la fuente de captación): el mismo espesor que motorProyecto', () => {
    const ej = planoEjemploCompleto();
    const captacion = muestraFuentes().find((s) => s.id === 'eg-fuente-captacion')!;
    const norte = ej.barriers.find((b) => b.id === 'eg-captacion-norte')!;
    const calc = calcularProyecto({ ...ej, barriers: [norte], sources: [captacion] }).barriers[0];
    const r = calc.requiredThickness_mm as Record<string, number>;
    // Paciente en (175, 175) px y muro en y = 100 px: 75 px × 0.02 m/px + 0.3 m = 1.8 m (el motor muestrea a ≥ 1.8 m).
    const d = calc.calculationUnitSnapshot!.minSourceDistance_m;
    expect(d).toBeCloseTo((captacion.y - norte.y1) * ESCALA_EJEMPLO_M_PX + 0.3, 1);
    for (const material of ['PB', 'CONCRETE235']) {
      const z = espesorPETZona({
        A0_MBq: 370, pacientesSemana: 30, tU_h: 1, d_m: d, P_mSv_semana: norte.designGoal_mSv_per_wk, T: norte.occupancyFactor,
        materialCodigo: material,
      });
      expect(z.espesor_mm).toBeCloseTo(r[material], 6);
    }
  });

  it('Gamma Knife y HDR Ir-192: el mismo espesor que motorProyecto', () => {
    const mgk = motor(plano('gk', [muro(4, { occupancyFactor: 0.2 })], [fuente('gamma-knife', { workloadValue: 20 })]));
    const gk = espesorGammaKnifeZona({ fraccionesSemana: 20, dosisFraccion_Gy: 15, d_m: mgk.d, P_mSv_semana: 0.02, T: 0.2, materialCodigo: 'CONCRETE235' });
    expect(gk.espesor_mm).toBeCloseTo(mgk.t, 6);
    const mhdr = motor(plano('hdr', [muro(3, { materialCode: 'PB' })], [fuente('hdr-192ir', { workloadValue: 10, workloadHoursPerWeek: 4 })]), 'PB');
    const hdr = espesorHDRZona({ actividad_Ci: 10, horasSemana: 4, d_m: mhdr.d, P_mSv_semana: 0.02, T: 1, materialCodigo: 'PB' });
    expect(hdr.espesor_mm).toBeCloseTo(mhdr.t, 6);
    // Kerma de HDR con Γδ = 0.111 μGy·m²/(MBq·h): 10 Ci × 4 h a d m (a 3.3 m ≈ 15.1 mGy/semana).
    expect(hdr.K_sin_blindaje_mSv_semana).toBeCloseTo((0.111 * 370000 * 4) / (mhdr.d * mhdr.d) / 1000, 9);
  });

  it('el plan del diálogo (calculateControlledZoneShieldingPlan) devuelve los espesores del motor en cada familia', () => {
    const seed = (id: string, barrier: string, calculationFamily: ShieldingSeedPoint['calculationFamily'], distance_m: number): ShieldingSeedPoint => ({
      id, barrier, adjacentZone: 'publica', distance_m, occupancyFactor: 0.25, designGoal_mSvWeek: 0.02, calculationFamily,
    });
    const option = {
      id: 'op', name: 'op', modality: 'LINAC',
      shieldingSeeds: [
        seed('n', 'Norte', 'NCRP151', 7), seed('e', 'Este', 'NCRP151', 5), seed('p', 'Oeste', 'TG108', 3),
        seed('g', 'Techo', 'GammaKnife', 4), seed('h', 'Puerta', 'HDR', 3),
      ],
    } as unknown as ControlledZoneFeasibilityOption;
    const profile = { targetThroughputPerDay: 6 } as unknown as ControlledZoneProfile;
    const a = buildDefaultControlledZoneCalculationAssumptions();
    const plan = calculateControlledZoneShieldingPlan(option, profile, a);
    const base = { P_mSv_semana: 0.02, T: 0.25, materialCodigo: a.materialCode };
    const esperado = [
      espesorLinacZona({ ...base, tipo: 'primaria', haces: [{ energia_MV: 15, W_Gy_semana: 500 }], fraccionIMRT: 0.5, factorIMRT: 5, U: 0.25, d_m: 7 }),
      espesorLinacZona({ ...base, tipo: 'secundaria', haces: [{ energia_MV: 15, W_Gy_semana: 500 }], fraccionIMRT: 0.5, factorIMRT: 5, U: 0.25, d_m: 5 }),
      espesorPETZona({ ...base, A0_MBq: 370, pacientesSemana: 30, tU_h: 1, d_m: 3 }),
      espesorGammaKnifeZona({ ...base, fraccionesSemana: 30, dosisFraccion_Gy: 15, d_m: 4 }),
      // HDR: 6 tratamientos/día × 0.5 h × 5 días/semana (valores por omisión) = 15 h/semana.
      espesorHDRZona({ ...base, actividad_Ci: 10, horasSemana: 15, d_m: 3 }),
    ];
    expect(plan.calculations.map((c) => c.method)).toEqual(['NCRP151-primary', 'NCRP151-secondary', 'TG108-PETCT', 'GammaKnife', 'HDR']);
    plan.calculations.forEach((c, i) => {
      expect(c.requiredThickness_mm).toBeCloseTo(Math.round(esperado[i].espesor_mm * 10) / 10, 6);
      expect(c.requiredThickness_mm).toBeGreaterThan(0);
    });
  });

  it('«Enviar a calculo» con el perfil por omisión del diálogo: cada barrera de cada modalidad sale del motor', () => {
    // Lo mismo que hace LayoutBunkerDialog: calculateControlledZoneShieldingPlan(mejor opción, perfil), aquí para todas las opciones.
    const profile = buildDefaultControlledZoneProfile({});
    const a = buildDefaultControlledZoneCalculationAssumptions();
    const familias = new Set<string>();
    for (const option of generateControlledZoneFeasibility(profile)) {
      const plan = calculateControlledZoneShieldingPlan(option, profile, a);
      option.shieldingSeeds.forEach((seed, i) => {
        const c = plan.calculations[i];
        const base = { P_mSv_semana: seed.designGoal_mSvWeek, T: Math.max(seed.occupancyFactor, 0.01), d_m: Math.max(seed.distance_m, 0.5), materialCodigo: a.materialCode };
        const N = Math.max(1, profile.targetThroughputPerDay * a.workDaysPerWeek);
        let z;
        if (seed.calculationFamily === 'NCRP151') {
          z = espesorLinacZona({
            ...base, tipo: ['Norte', 'Sur', 'Techo'].includes(seed.barrier) ? 'primaria' : 'secundaria',
            haces: [{ energia_MV: a.linacEnergy_MeV, W_Gy_semana: a.linacWorkload_Gy_per_wk }], fraccionIMRT: 0.5, factorIMRT: 5, U: 0.25,
          });
        } else if (seed.calculationFamily === 'TG108') z = espesorPETZona({ ...base, A0_MBq: a.petActivity_MBQ_per_injection, pacientesSemana: N, tU_h: 1 });
        else if (seed.calculationFamily === 'GammaKnife') z = espesorGammaKnifeZona({ ...base, fraccionesSemana: N, dosisFraccion_Gy: a.gammaKnifeDose_Gy_per_fraction });
        else if (seed.calculationFamily === 'HDR') z = espesorHDRZona({ ...base, actividad_Ci: a.hdrActivity_Ci, horasSemana: Math.max(1, profile.targetThroughputPerDay * a.hdrHoursPerTreatment_h * a.hdrDaysPerWeek) });
        else return;
        familias.add(seed.calculationFamily);
        expect(c.requiredThickness_mm).toBe(Math.round(Math.max(0, z.espesor_mm) * 10) / 10);
      });
    }
    expect(familias.size).toBeGreaterThanOrEqual(3);
  });

  it('revisión: techo LINAC primario y valores independientes de HDR/PET/Gamma Knife (perfil por omisión)', () => {
    const profile = buildDefaultControlledZoneProfile({});
    const a = buildDefaultControlledZoneCalculationAssumptions();
    const porFamilia = (f: string) => {
      const option = generateControlledZoneFeasibility(profile).find((o) => o.shieldingSeeds[0].calculationFamily === f)!;
      return calculateControlledZoneShieldingPlan(option, profile, a).calculations;
    };
    const lg = Math.log10;
    // LINAC 15 MV, techo a 3 m, T = 1, P = 0.02: primaria NCRP 151 Ec. 2.1/2.3 con TVL₁ 44 / TVLₑ 41 cm → 242.5 cm.
    const techo = porFamilia('NCRP151').find((c) => c.barrier === 'Techo')!;
    expect(techo.method).toBe('NCRP151-primary');
    const nT = lg((500e3 * 0.25) / 9 / 0.02);
    expect(techo.requiredThickness_cm).toBeCloseTo(44 + (nT - 1) * 41, 0);
    // HDR 10 Ci, 24 tratamientos/día × 0.5 h × 5 días/semana = 60 h/semana, techo a 3 m:
    // K = 0.111·370 000·60/9/1000 = 273.8 mGy; TVL de concreto Ir-192 152 mm (IAEA SRS-47).
    const hdr = porFamilia('HDR').find((c) => c.barrier === 'Techo')!;
    expect(hdr.unshielded_mSvWeek).toBeCloseTo(273.8, 1);
    expect(hdr.requiredThickness_mm).toBeCloseTo(lg(273.8 / 0.02) * 152, 0);
    // PET F-18 TG-108: 0.143 × (1 − 0.36) × 120 × 370 MBq × Rt(1 h) / 3² → 0.376 mSv; B = 0.0532 y la curva de banda
    // ancha de TG-108 (Tabla V, concreto): x = ln{[B^−γ + β/α]/[1 + β/α]}/(αγ) = 23.45 cm (con TVL único: 224 mm).
    const pet = porFamilia('TG108').find((c) => c.barrier === 'Techo')!;
    expect(pet.unshielded_mSvWeek).toBeCloseTo(0.376, 3);
    const B = 0.02 / pet.unshielded_mSvWeek;
    const r = -0.1161 / 0.1539;
    expect(pet.requiredThickness_mm).toBeCloseTo((10 * Math.log((B ** -2.0752 + r) / (1 + r))) / (0.1539 * 2.0752), 0);
    expect(pet.requiredThickness_mm).toBeCloseTo(234.5, 0);
    // Gamma Knife: B = P/(T·K) con T (Este, T = 0.25): K = 15 Gy × 120 / 36 m² = 50 Gy; TVL Co-60 210 mm.
    const gk = porFamilia('GammaKnife').find((c) => c.barrier === 'Este')!;
    expect(gk.requiredThickness_mm).toBeCloseTo(lg((0.25 * 50000) / 0.1) * 210, 0);
  });

  it('el adaptador y el diálogo ya no usan las fórmulas propias de uaqProtocol', () => {
    expect(readFileSync('src/lib/controlledZoneCalculationAdapter.ts', 'utf8')).not.toMatch(/from '\.\/uaqProtocol'|calculate(LINAC|PETCT|GammaKnife|HDRBrachy)\w*Barrier/);
    expect(readFileSync('src/sections/dialogs/LayoutBunkerDialog.tsx', 'utf8')).not.toMatch(/uaqProtocol/);
  });
});
