/**
 * Fase 11, etapa 8 (decisión del propietario): carga de trabajo HDR con «días por semana» explícito en el plan de zona
 * controlada. Antes: horas/semana = pacientes/día × 0.5 h (la carga de un solo día). Ahora: tratamientos/día × h por
 * tratamiento × días/semana (por omisión 5 días y 0.5 h), o tratamientos/semana × h por tratamiento. Los planes
 * guardados sin el campo se migran con el valor por omisión y se recalculan sus barreras HDR.
 */
import { describe, expect, it } from 'vitest';
import {
  HDR_DIAS_SEMANA_POR_OMISION, NOTA_MIGRACION_HDR, buildDefaultControlledZoneCalculationAssumptions,
  calculateControlledZoneShieldingPlan, exportControlledZoneShieldingPlan, horasSemanaHDR, migrarPlanZonaControlada,
  parseControlledZoneShieldingPlanJson, type ControlledZoneShieldingPlan,
} from '@/lib/controlledZoneCalculationAdapter';
import {
  applyControlledZoneShieldingPlanToFloorPlan, loadControlledZoneShieldingPlanSnapshot,
  CONTROLLED_ZONE_SHIELDING_PLAN_STORAGE_KEY,
} from '@/lib/controlledZoneFloorPlanAdapter';
import { buildDefaultControlledZoneProfile, generateControlledZoneFeasibility } from '@/lib/controlledZoneFeasibility';
import { espesorHDRZona } from '@/lib/zonaControladaMotor';
import type { FloorPlan } from '@/types/radshield';

const profile = buildDefaultControlledZoneProfile({});
const opcionHDR = () => generateControlledZoneFeasibility(profile).find((o) => o.modality === 'HDR')!;

/** Plan HDR como lo guardaba la versión anterior: sin los campos HDR y con la carga de un día (24 × 0.5 = 12 h/semana). */
const planAntiguo = (): ControlledZoneShieldingPlan => {
  const plan = calculateControlledZoneShieldingPlan(opcionHDR(), profile);
  const { hdrDaysPerWeek: _d, hdrHoursPerTreatment_h: _h, ...antiguas } = plan.assumptions;
  return {
    ...plan,
    assumptions: antiguas as ControlledZoneShieldingPlan['assumptions'],
    calculations: plan.calculations.map((c) => {
      const z = espesorHDRZona({
        actividad_Ci: 10, horasSemana: 12, d_m: Math.max(c.distance_m, 0.5), P_mSv_semana: c.designGoal_mSvWeek,
        T: Math.max(c.occupancyFactor, 0.01), materialCodigo: c.materialCode,
      });
      return { ...c, requiredThickness_mm: Math.round(z.espesor_mm * 10) / 10, unshielded_mSvWeek: Math.round(z.K_sin_blindaje_mSv_semana * 1000) / 1000 };
    }),
  };
};

describe('HDR: días por semana explícitos en la carga de trabajo', () => {
  it('valores por omisión documentados: 5 días/semana y 0.5 h por tratamiento', () => {
    const a = buildDefaultControlledZoneCalculationAssumptions();
    expect(a.hdrDaysPerWeek).toBe(5);
    expect(HDR_DIAS_SEMANA_POR_OMISION).toBe(5);
    expect(a.hdrHoursPerTreatment_h).toBe(0.5);
    expect(a.hdrTreatmentsPerWeek).toBeUndefined();
  });

  it('horas/semana = tratamientos/día × h × días/semana, o tratamientos/semana × h', () => {
    const a = buildDefaultControlledZoneCalculationAssumptions();
    expect(horasSemanaHDR({ targetThroughputPerDay: 24 }, a)).toBe(60);
    expect(horasSemanaHDR({ targetThroughputPerDay: 8 }, { ...a, hdrDaysPerWeek: 3, hdrHoursPerTreatment_h: 0.25 })).toBe(6);
    expect(horasSemanaHDR({ targetThroughputPerDay: 24 }, { ...a, hdrTreatmentsPerWeek: 10 })).toBe(5);
    // Días fuera de rango: más de 7 se limita a 7; no positivos → valor por omisión. Mínimo 1 h/semana.
    expect(horasSemanaHDR({ targetThroughputPerDay: 2 }, { ...a, hdrDaysPerWeek: 9 })).toBe(7);
    expect(horasSemanaHDR({ targetThroughputPerDay: 2 }, { ...a, hdrDaysPerWeek: 0 })).toBe(5);
    expect(horasSemanaHDR({ targetThroughputPerDay: 1 }, { ...a, hdrDaysPerWeek: 1 })).toBe(1);
  });

  it('el plan HDR usa la carga semanal (5× la de un día con el perfil por omisión)', () => {
    const plan = calculateControlledZoneShieldingPlan(opcionHDR(), profile);
    const techo = plan.calculations.find((c) => c.barrier === 'Techo')!;
    // 10 Ci, 60 h/semana, 3 m: K = 0.111 · 370 000 · 60 / 9 / 1000 = 273.8 mGy/semana.
    expect(techo.unshielded_mSvWeek).toBeCloseTo(273.8, 1);
    expect(techo.notes[0]).toContain('5 dias/semana');
    expect(plan.analyticMemoryDraft).toContain('Carga HDR: 60 h/semana');
    const tresDias = calculateControlledZoneShieldingPlan(opcionHDR(), profile, buildDefaultControlledZoneCalculationAssumptions({ hdrDaysPerWeek: 3 }));
    expect(tresDias.calculations.find((c) => c.barrier === 'Techo')!.unshielded_mSvWeek).toBeCloseTo(273.8 * 0.6, 1);
  });

  it('migración: un plan guardado sin el campo toma 5 días/semana y recalcula sus barreras HDR', () => {
    const antiguo = planAntiguo();
    const actual = calculateControlledZoneShieldingPlan(opcionHDR(), profile);
    const migrado = parseControlledZoneShieldingPlanJson(JSON.stringify(antiguo));
    expect(migrado.assumptions.hdrDaysPerWeek).toBe(5);
    expect(migrado.assumptions.hdrHoursPerTreatment_h).toBe(0.5);
    migrado.calculations.forEach((c, i) => {
      // La distancia guardada va redondeada a 2 decimales (16/2.4 → 6.67 m): ±0.15 mm.
      expect(Math.abs(c.requiredThickness_mm - actual.calculations[i].requiredThickness_mm)).toBeLessThanOrEqual(0.15);
      expect(c.requiredThickness_mm).toBeGreaterThan(antiguo.calculations[i].requiredThickness_mm);
      expect(c.notes).toContain(NOTA_MIGRACION_HDR);
    });
    expect(Math.abs(migrado.summary.maxThickness_mm - actual.summary.maxThickness_mm)).toBeLessThanOrEqual(0.15);
    expect(migrado.analyticMemoryDraft).toContain('Carga HDR: 60 h/semana');
  });

  it('un plan que ya trae el campo no se toca; el snapshot local también se migra', () => {
    const actual = calculateControlledZoneShieldingPlan(opcionHDR(), profile);
    expect(migrarPlanZonaControlada(actual)).toBe(actual);
    expect(parseControlledZoneShieldingPlanJson(exportControlledZoneShieldingPlan(actual).body)).toEqual(actual);
    const almacen = { getItem: (k: string) => (k === CONTROLLED_ZONE_SHIELDING_PLAN_STORAGE_KEY ? JSON.stringify(planAntiguo()) : null) };
    const recuperado = loadControlledZoneShieldingPlanSnapshot(almacen)!;
    expect(recuperado.assumptions.hdrDaysPerWeek).toBe(5);
    recuperado.calculations.forEach((c, i) => expect(Math.abs(c.requiredThickness_mm - actual.calculations[i].requiredThickness_mm)).toBeLessThanOrEqual(0.15));
  });

  it('al aplicar al plano, la fuente HDR lleva las mismas horas/semana que el plan (antes el motor tomaba 40 h)', () => {
    const plano = { id: 'p', name: 'p', imageUrl: null, width_pixels: 2000, height_pixels: 2000, scale_m_per_pixel: 0.01, barriers: [], sources: [], regions: [], criticalPoints: [] } as unknown as FloorPlan;
    const actual = calculateControlledZoneShieldingPlan(opcionHDR(), profile);
    const fuente = applyControlledZoneShieldingPlanToFloorPlan(plano, actual).floorPlan.sources.find((s) => s.modality.id === 'hdr-192ir')!;
    expect(fuente.workloadHoursPerWeek).toBe(60);
    const antiguo = applyControlledZoneShieldingPlanToFloorPlan(plano, planAntiguo()).floorPlan.sources.find((s) => s.modality.id === 'hdr-192ir')!;
    expect(antiguo.workloadHoursPerWeek).toBe(60);
  });
});
