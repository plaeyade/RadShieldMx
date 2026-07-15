import { describe, expect, it } from 'vitest';
import type { FloorPlan } from '@/types/radshield';
import {
  buildDefaultControlledZoneProfile,
  generateControlledZoneFeasibility,
} from '../controlledZoneFeasibility';
import { calculateControlledZoneShieldingPlan } from '../controlledZoneCalculationAdapter';
import {
  applyControlledZoneShieldingPlanToFloorPlan,
  isControlledZoneShieldingPlan,
  loadControlledZoneShieldingPlanSnapshot,
  saveControlledZoneShieldingPlanSnapshot,
} from '../controlledZoneFloorPlanAdapter';

const baseFloorPlan: FloorPlan = {
  id: 'plan-test',
  name: 'Plan Test',
  imageUrl: null,
  scale_m_per_pixel: 0.02,
  width_pixels: 900,
  height_pixels: 700,
  barriers: [],
  sources: [],
  occupiedRegions: [],
};

describe('controlled zone floorPlan adapter', () => {
  it('applies a shielding plan as canvas barriers, source and controlled region', () => {
    const profile = buildDefaultControlledZoneProfile({ controlledZoneWidth_m: 10, controlledZoneLength_m: 12 });
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const result = applyControlledZoneShieldingPlanToFloorPlan(baseFloorPlan, plan);

    expect(isControlledZoneShieldingPlan(plan)).toBe(true);
    expect(result.addedBarriers).toBe(5);
    expect(result.addedSources).toBe(1);
    expect(result.addedRegions).toBe(1);
    expect(result.floorPlan.barriers[0].requiredThickness_mm).toHaveProperty('CONCRETE235');
    expect(result.floorPlan.barriers[0].radshieldGenerated).toBe(true);
    expect(result.floorPlan.barriers.find((barrier) => barrier.controlledZoneElement === 'ceiling')?.structuralElement).toBe('ceiling');
    expect(result.floorPlan.occupiedRegions[0].name).toContain('Zona controlada');
  });

  it('replaces previously generated objects with the same controlled-zone prefix', () => {
    const profile = buildDefaultControlledZoneProfile();
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const first = applyControlledZoneShieldingPlanToFloorPlan(baseFloorPlan, plan);
    const second = applyControlledZoneShieldingPlanToFloorPlan(first.floorPlan, plan);

    expect(first.floorPlan.barriers).toHaveLength(5);
    expect(second.floorPlan.barriers).toHaveLength(5);
    expect(second.removedGeneratedObjects).toBeGreaterThan(0);
  });

  it('persists and reloads the last controlled-zone shielding plan snapshot', () => {
    const profile = buildDefaultControlledZoneProfile();
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const data = new Map<string, string>();
    const storage = {
      setItem: (key: string, value: string) => data.set(key, value),
      getItem: (key: string) => data.get(key) || null,
    };

    expect(saveControlledZoneShieldingPlanSnapshot(plan, storage)).toBe(true);
    expect(loadControlledZoneShieldingPlanSnapshot(storage)?.optionId).toBe(plan.optionId);
  });
});
