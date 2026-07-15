// Batch 8: tRPC router for Monte Carlo simulation jobs with dual-output (CSV/ROOT/BOTH)
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { simulationJobs } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const simulationRouter = createRouter({
  list: authedQuery
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.select()
        .from(simulationJobs)
        .where(and(
          eq(simulationJobs.projectId, input.projectId),
          eq(simulationJobs.userId, ctx.user.unionId)
        ))
        .orderBy(desc(simulationJobs.createdAt));
    }),

  get: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select()
        .from(simulationJobs)
        .where(and(
          eq(simulationJobs.id, input.id),
          eq(simulationJobs.userId, ctx.user.unionId)
        ))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      return rows[0];
    }),

  create: authedQuery
    .input(z.object({
      projectId: z.string(),
      name: z.string().min(1).max(255),
      format: z.enum(["csv", "root", "both"]).default("csv"),
      particles: z.string().default("1000000"),
      geometryJson: z.string(),
      modality: z.string().optional(),
      energy: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(simulationJobs).values({
        projectId: input.projectId,
        userId: ctx.user.unionId,
        name: input.name,
        format: input.format,
        particles: input.particles,
        geometryJson: input.geometryJson,
        modality: input.modality || null,
        energy: input.energy || null,
        status: "pending",
      });
      return { id: Number(result[0].insertId), success: true };
    }),

  updateStatus: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "running", "done", "failed", "cancelled"]),
      resultCsvUrl: z.string().optional(),
      resultRootUrl: z.string().optional(),
      resultSummaryJson: z.string().optional(),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      const rows = await db.select()
        .from(simulationJobs)
        .where(and(
          eq(simulationJobs.id, id),
          eq(simulationJobs.userId, ctx.user.unionId)
        ))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

      const setData: Record<string, unknown> = { status: updates.status };
      if (updates.resultCsvUrl !== undefined) setData.resultCsvUrl = updates.resultCsvUrl;
      if (updates.resultRootUrl !== undefined) setData.resultRootUrl = updates.resultRootUrl;
      if (updates.resultSummaryJson !== undefined) setData.resultSummaryJson = updates.resultSummaryJson;
      if (updates.errorMessage !== undefined) setData.errorMessage = updates.errorMessage;
      if (updates.status === "running") setData.startedAt = new Date();
      if (updates.status === "done" || updates.status === "failed") setData.completedAt = new Date();

      await db.update(simulationJobs).set(setData).where(eq(simulationJobs.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select()
        .from(simulationJobs)
        .where(and(
          eq(simulationJobs.id, input.id),
          eq(simulationJobs.userId, ctx.user.unionId)
        ))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      await db.delete(simulationJobs).where(eq(simulationJobs.id, input.id));
      return { success: true };
    }),
});
