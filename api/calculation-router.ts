// =============================================================================
// calculation-router.ts — CRUD historial de cálculos (v88: Drizzle ORM)
// =============================================================================
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { calculations } from "@db/schema";
import { and, eq, desc, sql } from "drizzle-orm";

export const calculationRouter = createRouter({
  // ─── List calculations (paginated) ───
  list: authedQuery
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [items, countResult] = await Promise.all([
        db.select().from(calculations)
          .where(eq(calculations.userId, ctx.user.unionId))
          .orderBy(desc(calculations.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db.select({ count: sql<number>`count(*)` })
          .from(calculations)
          .where(eq(calculations.userId, ctx.user.unionId)),
      ]);
      return { items, total: countResult[0]?.count ?? 0 };
    }),

  // ─── Create calculation record ───
  create: authedQuery
    .input(z.object({
      type: z.string().min(1),
      equipment: z.string().optional(),
      modality: z.string().optional(),
      energy: z.string().optional(),
      parametersJson: z.string(),
      resultsJson: z.string(),
      materialId: z.string().optional(),
      passes: z.enum(["pass", "fail", "warning"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(calculations).values({
        userId: ctx.user.unionId,
        type: input.type,
        equipment: input.equipment || null,
        modality: input.modality || null,
        energy: input.energy || null,
        parametersJson: input.parametersJson,
        resultsJson: input.resultsJson,
        materialId: input.materialId || null,
        passes: input.passes || "pass",
      });
      return { id: Number(result[0].insertId), success: true };
    }),

  // ─── Get by ID ───
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(calculations)
        .where(and(eq(calculations.id, input.id), eq(calculations.userId, ctx.user.unionId)))
        .limit(1);
      return rows[0] ?? null;
    }),

  // ─── Delete ───
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(calculations).where(and(eq(calculations.id, input.id), eq(calculations.userId, ctx.user.unionId)));
      return { success: true };
    }),

  // ─── Stats per user ───
  stats: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      const [total, byType, passRate] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(calculations)
          .where(eq(calculations.userId, ctx.user.unionId)),
        db.select({
          type: calculations.type,
          count: sql<number>`count(*)`,
        })
          .from(calculations)
          .where(eq(calculations.userId, ctx.user.unionId))
          .groupBy(calculations.type),
        db.select({
          passed: sql<number>`sum(case when passes = 'pass' then 1 else 0 end)`,
          total: sql<number>`count(*)`,
        })
          .from(calculations)
          .where(eq(calculations.userId, ctx.user.unionId)),
      ]);
      return {
        total: total[0]?.count ?? 0,
        byType,
        passRate: passRate[0]?.total > 0
          ? Math.round((passRate[0].passed / passRate[0].total) * 100)
          : 100,
      };
    }),
});
