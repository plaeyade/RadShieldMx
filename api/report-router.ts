// =============================================================================
// report-router.ts — CRUD reportes/memorias analíticas (v88: Drizzle ORM)
// =============================================================================
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reports } from "@db/schema";
import { and, eq, desc, sql } from "drizzle-orm";

export const reportRouter = createRouter({
  // ─── List reports (paginated) ───
  list: authedQuery
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      projectId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      let query = db.select().from(reports)
        .where(eq(reports.userId, ctx.user.unionId))
        .orderBy(desc(reports.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const items = await query;

      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(reports)
        .where(eq(reports.userId, ctx.user.unionId));

      return { items, total: countResult?.count ?? 0 };
    }),

  // ─── Create report ───
  create: authedQuery
    .input(z.object({
      title: z.string().min(1).max(255),
      installation: z.string().optional(),
      equipment: z.string().optional(),
      modality: z.string().optional(),
      content: z.string().min(1),
      format: z.enum(["txt", "pdf", "json"]).default("txt"),
      projectId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await getDb().insert(reports).values({
        userId: ctx.user.unionId,
        title: input.title,
        installation: input.installation || null,
        equipment: input.equipment || null,
        modality: input.modality || null,
        content: input.content,
        format: input.format,
        projectId: input.projectId || null,
      });
      return { id: Number(result[0].insertId), success: true };
    }),

  // ─── Update report ───
  update: authedQuery
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      content: z.string().min(1).optional(),
      installation: z.string().optional(),
      equipment: z.string().optional(),
      modality: z.string().optional(),
      format: z.enum(["txt", "pdf", "json"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const setData: Record<string, unknown> = {};
      if (updates.title !== undefined) setData.title = updates.title;
      if (updates.content !== undefined) setData.content = updates.content;
      if (updates.installation !== undefined) setData.installation = updates.installation;
      if (updates.equipment !== undefined) setData.equipment = updates.equipment;
      if (updates.modality !== undefined) setData.modality = updates.modality;
      if (updates.format !== undefined) setData.format = updates.format;

      await getDb().update(reports).set(setData).where(and(eq(reports.id, id), eq(reports.userId, ctx.user.unionId)));
      return { success: true };
    }),

  // ─── Get by ID ───
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const rows = await getDb().select().from(reports)
        .where(and(eq(reports.id, input.id), eq(reports.userId, ctx.user.unionId)))
        .limit(1);
      return rows[0] ?? null;
    }),

  // ─── Delete ───
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await getDb().delete(reports).where(and(eq(reports.id, input.id), eq(reports.userId, ctx.user.unionId)));
      return { success: true };
    }),
});
