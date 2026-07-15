import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  analyticMemorySnapshots,
  controlledZoneCalculations,
  controlledZonePlans,
  projectReportExports,
} from "@db/schema";
import { authedQuery, createRouter } from "./middleware";
import { getDb } from "./queries/connection";
import { buildControlledZoneDbInsertBundle } from "./controlled-zone-persistence";

const calculationSchema = z.object({
  planKey: z.string().min(1).max(255),
  seedId: z.string().min(1).max(160),
  barrier: z.string().min(1).max(80),
  adjacentZone: z.string().min(1).max(40),
  calculationFamily: z.string().min(1).max(80),
  method: z.string().min(1).max(80),
  distance_m: z.number().finite(),
  occupancyFactor: z.number().finite(),
  designGoal_mSvWeek: z.number().finite(),
  unshielded_mSvWeek: z.number().finite(),
  requiredThickness_mm: z.number().finite(),
  materialCode: z.string().min(1).max(80),
  status: z.string().min(1).max(40),
  notes: z.array(z.string()),
  sortOrder: z.number().int().min(1),
});

const dbDraftSchema = z.object({
  schemaVersion: z.literal("radshield-controlled-zone-db-draft-v1"),
  generatedAt: z.string().min(1),
  planKey: z.string().min(1).max(255),
  plan: z.object({
    optionId: z.string().min(1).max(160),
    optionName: z.string().min(1).max(255),
    modality: z.string().min(1).max(80),
    generatedAt: z.string().min(1),
    profile: z.unknown(),
    assumptions: z.unknown(),
    summary: z.unknown(),
    analyticMemoryDraft: z.string(),
    missingInputs: z.array(z.string()),
  }),
  calculations: z.array(calculationSchema).min(1),
});

const reportExportSchema = z.object({
  exportId: z.string().min(1).max(255),
  reportType: z.string().min(1).max(80),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  hashSha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

async function assertPlanAccess(planKey: string, userId: string) {
  const rows = await getDb()
    .select()
    .from(controlledZonePlans)
    .where(eq(controlledZonePlans.planKey, planKey))
    .limit(1);

  const plan = rows[0];
  if (!plan) return null;
  if (plan.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Controlled-zone plan not found or access denied",
    });
  }
  return plan;
}

export const controlledZoneRouter = createRouter({
  persistDraft: authedQuery
    .input(z.object({
      projectId: z.string().max(120).optional(),
      draft: dbDraftSchema,
      reportExport: reportExportSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await assertPlanAccess(input.draft.planKey, ctx.user.unionId);
      if (existing) {
        return {
          success: true,
          mode: "exists" as const,
          planKey: input.draft.planKey,
          planId: Number(existing.id),
          calculationCount: input.draft.calculations.length,
        };
      }

      const bundle = buildControlledZoneDbInsertBundle(input.draft, {
        userId: ctx.user.unionId,
        projectId: input.projectId,
        reportExport: input.reportExport,
      });

      const planResult = await db.insert(controlledZonePlans).values(bundle.plan);
      await db.insert(controlledZoneCalculations).values(bundle.calculations);
      await db.insert(analyticMemorySnapshots).values(bundle.analyticMemorySnapshot);
      if (bundle.reportExport) {
        await db.insert(projectReportExports).values(bundle.reportExport);
      }

      return {
        success: true,
        mode: "created" as const,
        planKey: input.draft.planKey,
        planId: Number(planResult[0].insertId),
        calculationCount: bundle.calculations.length,
        analyticMemorySnapshotId: bundle.analyticMemorySnapshot.snapshotId,
        reportExportId: bundle.reportExport?.exportId ?? null,
      };
    }),

  listPlans: authedQuery
    .input(z.object({
      projectId: z.string().max(120).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      const conditions = [eq(controlledZonePlans.userId, ctx.user.unionId)];
      if (input?.projectId) {
        conditions.push(eq(controlledZonePlans.projectId, input.projectId));
      }

      return getDb()
        .select()
        .from(controlledZonePlans)
        .where(and(...conditions))
        .orderBy(desc(controlledZonePlans.updatedAt))
        .limit(input?.limit ?? 50);
    }),

  getPlan: authedQuery
    .input(z.object({ planKey: z.string().min(1).max(255) }))
    .query(async ({ ctx, input }) => {
      const plan = await assertPlanAccess(input.planKey, ctx.user.unionId);
      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Controlled-zone plan not found" });
      }

      const [calculations, memorySnapshots, reportExports] = await Promise.all([
        getDb()
          .select()
          .from(controlledZoneCalculations)
          .where(eq(controlledZoneCalculations.planKey, input.planKey))
          .orderBy(controlledZoneCalculations.sortOrder),
        getDb()
          .select()
          .from(analyticMemorySnapshots)
          .where(eq(analyticMemorySnapshots.planKey, input.planKey))
          .orderBy(desc(analyticMemorySnapshots.createdAt)),
        getDb()
          .select()
          .from(projectReportExports)
          .where(eq(projectReportExports.planKey, input.planKey))
          .orderBy(desc(projectReportExports.createdAt)),
      ]);

      return {
        plan,
        calculations,
        memorySnapshots,
        reportExports,
      };
    }),
});
