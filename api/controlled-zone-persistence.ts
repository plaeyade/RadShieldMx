import type {
  InsertAnalyticMemorySnapshotRecord,
  InsertControlledZoneCalculationRecord,
  InsertControlledZonePlanRecord,
  InsertProjectReportExportRecord,
} from "@db/schema";

export interface ControlledZoneDbDraftInput {
  schemaVersion: "radshield-controlled-zone-db-draft-v1";
  generatedAt: string;
  planKey: string;
  plan: {
    optionId: string;
    optionName: string;
    modality: string;
    generatedAt: string;
    profile: unknown;
    assumptions: unknown;
    summary: unknown;
    analyticMemoryDraft: string;
    missingInputs: string[];
  };
  calculations: Array<{
    planKey: string;
    seedId: string;
    barrier: string;
    adjacentZone: string;
    calculationFamily: string;
    method: string;
    distance_m: number;
    occupancyFactor: number;
    designGoal_mSvWeek: number;
    unshielded_mSvWeek: number;
    requiredThickness_mm: number;
    materialCode: string;
    status: string;
    notes: string[];
    sortOrder: number;
  }>;
}

export interface ControlledZoneDbInsertBundle {
  plan: InsertControlledZonePlanRecord;
  calculations: InsertControlledZoneCalculationRecord[];
  analyticMemorySnapshot: InsertAnalyticMemorySnapshotRecord;
  reportExport?: InsertProjectReportExportRecord;
}

export interface ControlledZoneDbInsertOptions {
  userId: string;
  projectId?: string;
  reportExport?: {
    exportId: string;
    reportType: string;
    fileName: string;
    mimeType: string;
    hashSha256: string;
    metadata?: Record<string, unknown>;
  };
}

export function buildControlledZoneDbInsertBundle(
  draft: ControlledZoneDbDraftInput,
  options: ControlledZoneDbInsertOptions,
): ControlledZoneDbInsertBundle {
  const plan: InsertControlledZonePlanRecord = {
    planKey: draft.planKey,
    projectId: options.projectId ?? null,
    userId: options.userId,
    optionId: draft.plan.optionId,
    optionName: draft.plan.optionName,
    modality: draft.plan.modality,
    schemaVersion: draft.schemaVersion,
    generatedAt: new Date(draft.plan.generatedAt),
    profileJson: JSON.stringify(draft.plan.profile),
    assumptionsJson: JSON.stringify(draft.plan.assumptions),
    summaryJson: JSON.stringify(draft.plan.summary),
    missingInputsJson: JSON.stringify(draft.plan.missingInputs),
  };

  const calculations: InsertControlledZoneCalculationRecord[] = draft.calculations.map((calculation) => ({
    planKey: draft.planKey,
    seedId: calculation.seedId,
    barrier: calculation.barrier,
    adjacentZone: calculation.adjacentZone,
    calculationFamily: calculation.calculationFamily,
    method: calculation.method,
    distanceM: calculation.distance_m,
    occupancyFactor: calculation.occupancyFactor,
    designGoalMSvWeek: calculation.designGoal_mSvWeek,
    unshieldedMSvWeek: calculation.unshielded_mSvWeek,
    requiredThicknessMm: calculation.requiredThickness_mm,
    materialCode: calculation.materialCode,
    status: calculation.status,
    sortOrder: calculation.sortOrder,
    notesJson: JSON.stringify(calculation.notes),
  }));

  const analyticMemorySnapshot: InsertAnalyticMemorySnapshotRecord = {
    snapshotId: `${draft.planKey}:analytic-memory:${draft.generatedAt}`,
    projectId: options.projectId ?? null,
    planKey: draft.planKey,
    userId: options.userId,
    format: "markdown",
    status: "draft",
    contentJson: JSON.stringify({
      markdown: draft.plan.analyticMemoryDraft,
      sourceSchemaVersion: draft.schemaVersion,
    }),
    evidenceLinksJson: JSON.stringify([]),
  };

  const reportExport: InsertProjectReportExportRecord | undefined = options.reportExport
    ? {
        exportId: options.reportExport.exportId,
        projectId: options.projectId ?? null,
        planKey: draft.planKey,
        userId: options.userId,
        reportType: options.reportExport.reportType,
        fileName: options.reportExport.fileName,
        mimeType: options.reportExport.mimeType,
        hashSha256: options.reportExport.hashSha256,
        metadataJson: JSON.stringify(options.reportExport.metadata ?? {}),
      }
    : undefined;

  return {
    plan,
    calculations,
    analyticMemorySnapshot,
    reportExport,
  };
}
