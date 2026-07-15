// tRPC router for shielding projects (Fase 5 - backend persistence)
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { projects } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const projectRouter = createRouter({
  list: authedQuery
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      // Always filter by authenticated user's unionId, ignore input userId
      return db.select().from(projects).where(eq(projects.userId, ctx.user.unionId)).orderBy(desc(projects.updatedAt));
    }),

  get: authedQuery
    .input(z.object({ id: z.number(), userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(projects).where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.unionId))).limit(1);
      if (!rows[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found or access denied" });
      }
      return rows[0];
    }),

  create: authedQuery
    .input(z.object({
      userId: z.string().optional(), name: z.string().min(1).max(255), description: z.string().optional(),
      floorPlanJson: z.string(), version: z.string().default("1.2"),
      modality: z.string().optional(), numSources: z.string().optional(),
      numBarriers: z.string().optional(), maxKerma: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(projects).values({
        userId: ctx.user.unionId, // force authenticated user's ID
        name: input.name, description: input.description || null,
        floorPlanJson: input.floorPlanJson, version: input.version,
        modality: input.modality || null, numSources: input.numSources || null,
        numBarriers: input.numBarriers || null, maxKerma: input.maxKerma || null,
      });
      return { id: Number(result[0].insertId), success: true };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(), userId: z.string().optional(), name: z.string().min(1).max(255).optional(),
      description: z.string().optional(), floorPlanJson: z.string().optional(),
      modality: z.string().optional(), numSources: z.string().optional(),
      numBarriers: z.string().optional(), maxKerma: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      // Verify ownership
      const rows = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, ctx.user.unionId))).limit(1);
      if (!rows[0]) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Project not found or access denied" });
      }
      const setData: Record<string, unknown> = {};
      if (updates.name !== undefined) setData.name = updates.name;
      if (updates.description !== undefined) setData.description = updates.description;
      if (updates.floorPlanJson !== undefined) setData.floorPlanJson = updates.floorPlanJson;
      if (updates.modality !== undefined) setData.modality = updates.modality;
      if (updates.numSources !== undefined) setData.numSources = updates.numSources;
      if (updates.numBarriers !== undefined) setData.numBarriers = updates.numBarriers;
      if (updates.maxKerma !== undefined) setData.maxKerma = updates.maxKerma;
      await db.update(projects).set(setData).where(eq(projects.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number(), userId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Verify ownership before delete
      const rows = await db.select().from(projects).where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.unionId))).limit(1);
      if (!rows[0]) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Project not found or access denied" });
      }
      await db.delete(projects).where(eq(projects.id, input.id));
      return { success: true };
    }),
});
