import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  dosimetryEffectiveCoefficients,
  dosimetryPhantoms,
  dosimetryProcedures,
  dosimetryReferences,
  dosimetryValidationAttachments,
  dosimetryWorkspaces,
} from "@db/schema";
import { authedQuery, createRouter } from "./middleware";
import { getDb } from "./queries/connection";

const jsonTextSchema = z.string().refine(
  (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Expected a valid JSON string" },
);

const workspaceInput = z.object({
  workspaceId: z.string().min(1).max(120),
  projectId: z.string().max(120).optional(),
  projectName: z.string().min(1).max(255),
  datasetVersion: z.string().min(1).max(80),
  datasetJson: jsonTextSchema,
  evidencePackJson: jsonTextSchema.optional(),
  migrationPlanJson: jsonTextSchema.optional(),
});

const attachmentInput = z.object({
  attachmentId: z.string().min(1).max(160),
  workspaceId: z.string().max(120).optional(),
  projectId: z.string().max(120).optional(),
  procedureId: z.string().max(120).optional(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.string().regex(/^\d+$/).max(40),
  hashSha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  storageUri: z.string().max(500).optional(),
  notes: z.string().optional(),
});

async function assertWorkspaceAccess(workspaceId: string, userId: string) {
  const rows = await getDb()
    .select()
    .from(dosimetryWorkspaces)
    .where(eq(dosimetryWorkspaces.workspaceId, workspaceId))
    .limit(1);

  const workspace = rows[0];
  if (!workspace) return null;
  if (workspace.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Dosimetry workspace not found or access denied",
    });
  }
  return workspace;
}

export const dosimetryRouter = createRouter({
  listReferences: authedQuery.query(async () => {
    return getDb()
      .select()
      .from(dosimetryReferences)
      .orderBy(desc(dosimetryReferences.year), desc(dosimetryReferences.createdAt));
  }),

  listPhantoms: authedQuery.query(async () => {
    return getDb().select().from(dosimetryPhantoms).orderBy(dosimetryPhantoms.ageGroup);
  }),

  listProcedures: authedQuery
    .input(z.object({ radionuclideSymbol: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const query = getDb().select().from(dosimetryProcedures);
      if (input?.radionuclideSymbol) {
        return query
          .where(eq(dosimetryProcedures.radionuclideSymbol, input.radionuclideSymbol))
          .orderBy(dosimetryProcedures.displayName);
      }
      return query.orderBy(dosimetryProcedures.displayName);
    }),

  listCoefficients: authedQuery
    .input(z.object({ procedureId: z.string().optional(), phantomAgeGroup: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const conditions = [];
      if (input?.procedureId) {
        conditions.push(eq(dosimetryEffectiveCoefficients.procedureId, input.procedureId));
      }
      if (input?.phantomAgeGroup) {
        conditions.push(eq(dosimetryEffectiveCoefficients.phantomAgeGroup, input.phantomAgeGroup));
      }

      const query = getDb().select().from(dosimetryEffectiveCoefficients);
      return conditions.length > 0
        ? query
            .where(and(...conditions))
            .orderBy(
              dosimetryEffectiveCoefficients.procedureId,
              dosimetryEffectiveCoefficients.phantomAgeGroup,
            )
        : query.orderBy(
            dosimetryEffectiveCoefficients.procedureId,
            dosimetryEffectiveCoefficients.phantomAgeGroup,
          );
    }),

  listWorkspaces: authedQuery
    .input(z.object({ projectId: z.string().optional(), limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const conditions = [eq(dosimetryWorkspaces.userId, ctx.user.unionId)];
      if (input?.projectId) {
        conditions.push(eq(dosimetryWorkspaces.projectId, input.projectId));
      }

      return getDb()
        .select()
        .from(dosimetryWorkspaces)
        .where(and(...conditions))
        .orderBy(desc(dosimetryWorkspaces.updatedAt))
        .limit(input?.limit ?? 50);
    }),

  getWorkspace: authedQuery
    .input(z.object({ workspaceId: z.string().min(1).max(120) }))
    .query(async ({ ctx, input }) => {
      const workspace = await assertWorkspaceAccess(input.workspaceId, ctx.user.unionId);
      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dosimetry workspace not found" });
      }
      return workspace;
    }),

  upsertWorkspace: authedQuery.input(workspaceInput).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const existing = await assertWorkspaceAccess(input.workspaceId, ctx.user.unionId);
    const values = {
      workspaceId: input.workspaceId,
      userId: ctx.user.unionId,
      projectId: input.projectId ?? null,
      projectName: input.projectName,
      datasetVersion: input.datasetVersion,
      datasetJson: input.datasetJson,
      evidencePackJson: input.evidencePackJson ?? null,
      migrationPlanJson: input.migrationPlanJson ?? null,
    };

    if (existing) {
      await db
        .update(dosimetryWorkspaces)
        .set(values)
        .where(
          and(
            eq(dosimetryWorkspaces.workspaceId, input.workspaceId),
            eq(dosimetryWorkspaces.userId, ctx.user.unionId),
          ),
        );
      return { workspaceId: input.workspaceId, success: true, mode: "updated" as const };
    }

    await db.insert(dosimetryWorkspaces).values(values);
    return { workspaceId: input.workspaceId, success: true, mode: "created" as const };
  }),

  listAttachments: authedQuery
    .input(z.object({ workspaceId: z.string().optional(), projectId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (input?.workspaceId) {
        await assertWorkspaceAccess(input.workspaceId, ctx.user.unionId);
      }

      const conditions = [];
      if (input?.workspaceId) {
        conditions.push(eq(dosimetryValidationAttachments.workspaceId, input.workspaceId));
      }
      if (input?.projectId) {
        conditions.push(eq(dosimetryValidationAttachments.projectId, input.projectId));
      }

      const query = getDb().select().from(dosimetryValidationAttachments);
      return conditions.length > 0
        ? query.where(and(...conditions)).orderBy(desc(dosimetryValidationAttachments.createdAt))
        : query.orderBy(desc(dosimetryValidationAttachments.createdAt)).limit(100);
    }),

  createAttachment: authedQuery.input(attachmentInput).mutation(async ({ ctx, input }) => {
    if (input.workspaceId) {
      await assertWorkspaceAccess(input.workspaceId, ctx.user.unionId);
    }

    await getDb().insert(dosimetryValidationAttachments).values({
      attachmentId: input.attachmentId,
      workspaceId: input.workspaceId ?? null,
      projectId: input.projectId ?? null,
      procedureId: input.procedureId ?? null,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      hashSha256: input.hashSha256.toLowerCase(),
      storageUri: input.storageUri ?? null,
      notes: input.notes ?? null,
      reviewStatus: "pending",
    });

    return { attachmentId: input.attachmentId, success: true };
  }),
});
