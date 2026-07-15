import { describe, expect, it } from 'vitest';
import {
  CONTROLLED_ZONE_CONTRACTS,
  buildControlledZoneMigrationDecision,
  shouldRebuildControlledZoneDatabase,
} from '../controlledZoneContracts';

describe('controlled zone contracts', () => {
  it('freezes F55-F59 schema versions for F60 handoff', () => {
    expect(CONTROLLED_ZONE_CONTRACTS.feasibilityPacket).toBe('radshield-controlled-zone-feasibility-v1');
    expect(CONTROLLED_ZONE_CONTRACTS.shieldingPlan).toBe('radshield-controlled-zone-shielding-plan-v1');
    expect(CONTROLLED_ZONE_CONTRACTS.dbDraft).toBe('radshield-controlled-zone-db-draft-v1');
    expect(CONTROLLED_ZONE_CONTRACTS.floorPlanMetadata).toBe('radshield-controlled-zone-floorplan-metadata-v1');
    expect(CONTROLLED_ZONE_CONTRACTS.reportAppendix).toBe('radshield-controlled-zone-report-appendix-v1');
  });

  it('recommends incremental migration instead of full DB reconstruction', () => {
    const decision = buildControlledZoneMigrationDecision();

    expect(decision.strategy).toBe('incremental_migration');
    expect(shouldRebuildControlledZoneDatabase(decision)).toBe(false);
    expect(decision.proposedTables.map((table) => table.tableName)).toEqual([
      'controlled_zone_plans',
      'controlled_zone_calculations',
      'analytic_memory_snapshots',
      'project_report_exports',
    ]);
    expect(decision.rollbackPlan.some((item) => item.includes('newly added controlled-zone tables'))).toBe(true);
    expect(decision.smokeTest).toContain('Generate CNSNS report and confirm section 3.1 appears.');
  });
});
