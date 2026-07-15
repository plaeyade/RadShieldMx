import { describe, expect, it } from 'vitest';
import type { FloorPlan } from '@/types/radshield';
import {
  buildDefaultControlledZoneProfile,
  generateControlledZoneFeasibility,
} from '../controlledZoneFeasibility';
import {
  buildControlledZoneDbPersistenceDraft,
  calculateControlledZoneShieldingPlan,
  exportControlledZoneDbPersistenceDraft,
  exportControlledZoneShieldingPlan,
  parseControlledZoneShieldingPlanJson,
} from '../controlledZoneCalculationAdapter';
import {
  applyControlledZoneShieldingPlanToFloorPlan,
  loadControlledZoneShieldingPlanSnapshot,
  saveControlledZoneShieldingPlanSnapshot,
} from '../controlledZoneFloorPlanAdapter';
import { extractControlledZoneReportContext } from '../controlledZoneReportAdapter';
import { generateCNSNSReport } from '../../hooks/useCNSNSReport';

const emptyFloorPlan: FloorPlan = {
  id: 'f65-functional-smoke',
  name: 'F65 Functional Smoke',
  imageUrl: null,
  scale_m_per_pixel: 0.02,
  width_pixels: 900,
  height_pixels: 700,
  barriers: [],
  sources: [],
  occupiedRegions: [],
};

describe('controlled-zone functional smoke flow', () => {
  it('runs layout, calculation, canvas, report, export and import as one flow', async () => {
    const profile = buildDefaultControlledZoneProfile({
      siteWidth_m: 24,
      siteLength_m: 30,
      controlledZoneWidth_m: 14,
      controlledZoneLength_m: 18,
      targetThroughputPerDay: 18,
    });

    const options = generateControlledZoneFeasibility(profile);
    const bestOption = options[0];
    expect(bestOption.name).toBeTruthy();
    expect(bestOption.rooms.length).toBeGreaterThan(0);
    expect(bestOption.shieldingSeeds.length).toBeGreaterThanOrEqual(5);

    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    expect(plan.summary.barrierCount).toBe(plan.calculations.length);
    expect(plan.analyticMemoryDraft).toContain('Memoria analitica preliminar');

    const exportedPlan = exportControlledZoneShieldingPlan(plan);
    const importedPlan = parseControlledZoneShieldingPlanJson(exportedPlan.body);
    expect(importedPlan.optionId).toBe(plan.optionId);

    const storage = new Map<string, string>();
    const memoryStorage = {
      setItem: (key: string, value: string) => storage.set(key, value),
      getItem: (key: string) => storage.get(key) || null,
    };
    expect(saveControlledZoneShieldingPlanSnapshot(importedPlan, memoryStorage)).toBe(true);
    expect(loadControlledZoneShieldingPlanSnapshot(memoryStorage)?.optionId).toBe(plan.optionId);

    const canvasResult = applyControlledZoneShieldingPlanToFloorPlan(emptyFloorPlan, importedPlan);
    expect(canvasResult.addedBarriers).toBe(5);
    expect(canvasResult.addedSources).toBe(1);
    expect(canvasResult.addedRegions).toBe(1);
    expect(canvasResult.floorPlan.barriers.every((barrier) => barrier.radshieldGenerated)).toBe(true);

    const reportContext = extractControlledZoneReportContext(canvasResult.floorPlan);
    expect(reportContext.hasGeneratedControlledZone).toBe(true);
    expect(reportContext.wallCount).toBe(4);
    expect(reportContext.ceilingCount).toBe(1);
    expect(reportContext.warnings.some((warning) => warning.includes('piso/suelo'))).toBe(true);

    const dbDraft = buildControlledZoneDbPersistenceDraft(importedPlan);
    const exportedDbDraft = exportControlledZoneDbPersistenceDraft(importedPlan);
    expect(dbDraft.calculations).toHaveLength(importedPlan.calculations.length);
    expect(JSON.parse(exportedDbDraft.body).planKey).toBe(dbDraft.planKey);

    const reportBlob = await generateCNSNSReport({
      floorPlan: canvasResult.floorPlan,
      projectName: 'F65 Smoke - Zona Controlada',
      date: '2026-07-12',
      preparerName: 'RadShield MX',
      reviewerName: 'QA',
      institution: 'Codex Stabilization',
      licenseNumber: 'SMOKE-F65',
    });
    expect(reportBlob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(reportBlob.size).toBeGreaterThan(1000);
  });
});
