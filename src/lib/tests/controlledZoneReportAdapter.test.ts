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

  it('returns an empty context for a normal floorPlan without generated barriers', () => {
    const context = extractControlledZoneReportContext(baseFloorPlan);

    expect(context.hasGeneratedControlledZone).toBe(false);
    expect(context.barriers).toHaveLength(0);
    expect(context.warnings).toHaveLength(0);
  });
});
