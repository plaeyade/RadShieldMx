import { describe, expect, it } from 'vitest';
import type { FloorPlan } from '@/types/radshield';
import {
  getControlledZoneBarrierCanvasStyle,
  getControlledZoneCanvasSummary,
  isControlledZoneBarrier,
  isControlledZoneRegion,
  isControlledZoneSource,
} from '../controlledZoneCanvasUx';
import {
  buildDefaultControlledZoneProfile,
  generateControlledZoneFeasibility,
} from '../controlledZoneFeasibility';
import { calculateControlledZoneShieldingPlan } from '../controlledZoneCalculationAdapter';
import { applyControlledZoneShieldingPlanToFloorPlan } from '../controlledZoneFloorPlanAdapter';

const baseFloorPlan: FloorPlan = {
  id: 'canvas-ux-test',
  name: 'Canvas UX Test',
  imageUrl: null,
  scale_m_per_pixel: 0.02,
  width_pixels: 900,
  height_pixels: 700,
  barriers: [],
  sources: [],
  occupiedRegions: [],
};

describe('controlled-zone canvas UX metadata', () => {
  it('summarizes generated barriers, source, region and warnings for canvas overlays', () => {
    const profile = buildDefaultControlledZoneProfile({ controlledZoneWidth_m: 10, controlledZoneLength_m: 12 });
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const { floorPlan } = applyControlledZoneShieldingPlanToFloorPlan(baseFloorPlan, plan);
    const summary = getControlledZoneCanvasSummary(floorPlan);

    expect(summary.hasControlledZone).toBe(true);
    expect(summary.barrierCount).toBe(5);
    expect(summary.wallCount).toBe(4);
    expect(summary.ceilingCount).toBe(1);
    expect(summary.sourceCount).toBe(1);
    expect(summary.regionCount).toBe(1);
    expect(summary.maxThickness_mm).toBeGreaterThan(0);
    expect(summary.warnings.some((warning) => warning.includes('Piso/suelo'))).toBe(true);
  });

  it('classifies controlled-zone objects and returns visual styles', () => {
    const profile = buildDefaultControlledZoneProfile();
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const { floorPlan } = applyControlledZoneShieldingPlanToFloorPlan(baseFloorPlan, plan);
    const wall = floorPlan.barriers.find((barrier) => barrier.controlledZoneElement === 'north');
    const ceiling = floorPlan.barriers.find((barrier) => barrier.controlledZoneElement === 'ceiling');

    expect(wall && isControlledZoneBarrier(wall)).toBe(true);
    expect(ceiling && getControlledZoneBarrierCanvasStyle(ceiling).dash.length).toBeGreaterThan(0);
    expect(isControlledZoneRegion(floorPlan.occupiedRegions[0])).toBe(true);
    expect(isControlledZoneSource(floorPlan.sources[0])).toBe(true);
  });

  it('returns an empty summary for regular plans', () => {
    expect(getControlledZoneCanvasSummary(baseFloorPlan).hasControlledZone).toBe(false);
    expect(getControlledZoneCanvasSummary(null).barrierCount).toBe(0);
  });
});
