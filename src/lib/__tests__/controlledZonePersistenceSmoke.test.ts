import { describe, expect, it } from 'vitest';
import {
  buildDefaultControlledZoneProfile,
  generateControlledZoneFeasibility,
} from '../controlledZoneFeasibility';
import {
  buildControlledZoneDbPersistenceDraft,
  calculateControlledZoneShieldingPlan,
} from '../controlledZoneCalculationAdapter';
import { buildControlledZoneDbInsertBundle } from '../../../api/controlled-zone-persistence';

describe('controlled-zone persistence smoke', () => {
  it('builds an insert-ready backend bundle from a generated layout plan', () => {
    const profile = buildDefaultControlledZoneProfile({
      siteWidth_m: 24,
      siteLength_m: 30,
      controlledZoneWidth_m: 16,
      controlledZoneLength_m: 20,
      maxBudget_mxn: 32000000,
      targetThroughputPerDay: 28,
    });

    const [bestOption] = generateControlledZoneFeasibility(profile);
    expect(bestOption).toBeDefined();

    const plan = calculateControlledZoneShieldingPlan(bestOption, profile);
    const draft = buildControlledZoneDbPersistenceDraft(plan);
    const bundle = buildControlledZoneDbInsertBundle(draft, {
      userId: 'smoke-user',
      projectId: 'smoke-project',
      reportExport: {
        exportId: 'smoke-report-export',
        reportType: 'controlled-zone-smoke',
        fileName: 'smoke.md',
        mimeType: 'text/markdown',
        hashSha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        metadata: { phase: 'F64' },
      },
    });

    expect(draft.schemaVersion).toBe('radshield-controlled-zone-db-draft-v1');
    expect(draft.planKey).toMatch(/^cz-plan:/);
    expect(draft.calculations).toHaveLength(plan.calculations.length);
    expect(bundle.plan.planKey).toBe(draft.planKey);
    expect(bundle.plan.projectId).toBe('smoke-project');
    expect(bundle.plan.profileJson).toContain('controlledZoneWidth_m');
    expect(bundle.calculations).toHaveLength(draft.calculations.length);
    expect(bundle.analyticMemorySnapshot.snapshotId).toContain(':analytic-memory:');
    expect(bundle.analyticMemorySnapshot.contentJson).toContain('markdown');
    expect(bundle.reportExport?.exportId).toBe('smoke-report-export');
  });
});
