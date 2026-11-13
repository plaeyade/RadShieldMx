import { describe, expect, it } from 'vitest';
import type { FloorPlan } from '@/types/radshield';
import {
  buildDefaultControlledZoneProfile,
  generateControlledZoneFeasibility,
} from '../controlledZoneFeasibility';
import { calculateControlledZoneShieldingPlan } from '../controlledZoneCalculationAdapter';
import { applyControlledZoneShieldingPlanToFloorPlan } from '../controlledZoneFloorPlanAdapter';
import { extractControlledZoneReportContext } from '../controlledZoneReportAdapter';

const baseFloorPlan: FloorPlan = {
  id: 'report-plan-test',
  name: 'Report Plan Test',
  imageUrl: null,
  scale_m_per_pixel: 0.02,
  width_pixels: 900,
  height_pixels: 700,
  barriers: [],
  sources: [],
  occupiedRegions: [],
};

describe('controlled zone report adapter', () => {
  it('extracts wall and ceiling context from generated controlled-zone floorPlan barriers', () => {
    const profile = buildDefaultControlledZoneProfile();
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const result = applyControlledZoneShieldingPlanToFloorPlan(baseFloorPlan, plan);
    const context = extractControlledZoneReportContext(result.floorPlan);

    expect(context.hasGeneratedControlledZone).toBe(true);
    expect(context.wallCount).toBe(4);
    expect(context.ceilingCount).toBe(1);
    expect(context.floorCount).toBe(0);
    expect(context.warnings.some((warning) => warning.includes('piso/suelo'))).toBe(true);
    expect(context.barriers.every((barrier) => barrier.thickness_mm > 0)).toBe(true);
  });

  it('Fase 11 etapa 2: un requerido 0 del motor se reporta como 0, no como el espesor instalado', () => {
    const barrera = (id: string, requiredThickness_mm: Record<string, number> | undefined) => ({
      id, name: id, x1: 0, y1: 0, x2: 100, y2: 0, barrierType: 'secondary', useFactor: 1, occupancyFactor: 1,
      designGoal_mSv_per_wk: 0.02, materialCode: 'PB', thickness_mm: 5, radshieldGenerated: true,
      controlledZoneElement: 'wall', requiredThickness_mm,
    });
    const plan = { ...baseFloorPlan, barriers: [barrera('cz-a-barrier-0', { PB: 0 }), barrera('cz-a-barrier-1', undefined)] } as unknown as FloorPlan;
    const [cero, sinCalculo] = extractControlledZoneReportContext(plan).barriers;
    expect(cero.thickness_mm).toBe(0);
    expect(sinCalculo.thickness_mm).toBe(5);
  });

  it('returns an empty context for a normal floorPlan without generated barriers', () => {
    const context = extractControlledZoneReportContext(baseFloorPlan);

    expect(context.hasGeneratedControlledZone).toBe(false);
    expect(context.barriers).toHaveLength(0);
    expect(context.warnings).toHaveLength(0);
  });
});
