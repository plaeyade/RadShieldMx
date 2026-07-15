import { describe, expect, it } from 'vitest';
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

describe('controlled zone calculation adapter', () => {
  it('turns the best feasibility option into a preliminary shielding plan', () => {
    const profile = buildDefaultControlledZoneProfile();
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);

    expect(plan.schemaVersion).toBe('radshield-controlled-zone-shielding-plan-v1');
    expect(plan.summary.barrierCount).toBeGreaterThanOrEqual(5);
    expect(plan.summary.maxThickness_mm).toBeGreaterThanOrEqual(0);
    expect(plan.analyticMemoryDraft).toContain('Memoria analitica preliminar');
    expect(plan.missingInputs).toContain('Plano arquitectonico definitivo con escala verificada.');
  });

  it('exports the preliminary shielding plan as JSON', () => {
    const profile = buildDefaultControlledZoneProfile({ targetThroughputPerDay: 8 });
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const exported = exportControlledZoneShieldingPlan(plan);

    expect(exported.fileName).toContain('-shielding-plan.json');
    expect(exported.mimeType).toBe('application/json');
    expect(JSON.parse(exported.body).optionId).toBe(plan.optionId);
  });

  it('parses a shielding plan JSON and rejects invalid payloads', () => {
    const profile = buildDefaultControlledZoneProfile({ targetThroughputPerDay: 8 });
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const exported = exportControlledZoneShieldingPlan(plan);

    expect(parseControlledZoneShieldingPlanJson(exported.body).optionId).toBe(plan.optionId);
    expect(() => parseControlledZoneShieldingPlanJson('{"schemaVersion":"otro"}')).toThrow('ControlledZoneShieldingPlan');
    expect(() => parseControlledZoneShieldingPlanJson('{')).toThrow('JSON valido');
  });

  it('builds a DB persistence draft without requiring DB reconstruction yet', () => {
    const profile = buildDefaultControlledZoneProfile();
    const [bestOption] = generateControlledZoneFeasibility(profile);
    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const draft = buildControlledZoneDbPersistenceDraft(plan);
    const exported = exportControlledZoneDbPersistenceDraft(plan);

    expect(draft.schemaVersion).toBe('radshield-controlled-zone-db-draft-v1');
    expect(draft.planKey).toContain(plan.optionId);
    expect(draft.plan.summary.barrierCount).toBe(plan.summary.barrierCount);
    expect(draft.calculations).toHaveLength(plan.calculations.length);
    expect(draft.calculations[0].sortOrder).toBe(1);
    expect(JSON.parse(exported.body).plan.optionId).toBe(plan.optionId);
  });
});
