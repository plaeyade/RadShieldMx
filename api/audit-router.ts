// Batch 1: Audit trail router for regulatory compliance
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { auditTrail, collaborationLocks } from "../db/schema";
import { eq, desc, and, gt } from "drizzle-orm";

export const auditRouter = createRouter({
  log: authedQuery
    .input(z.object({
      projectId: z.string(),
      action: z.enum(["create", "update", "delete", "calculate", "export", "generate_report", "login", "logout"]),
      fieldName: z.string().optional(),
      oldValue: z.string().optional(),
      newValue: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(auditTrail).values({
        userId: ctx.user.unionId,
        projectId: input.projectId,
        action: input.action,
        fieldName: input.fieldName || null,
        oldValue: input.oldValue || null,
        newValue: input.newValue || null,
      });
      return { success: true };
    }),

  list: authedQuery
    .input(z.object({ projectId: z.string(), limit: z.number().min(1).max(100).default(100) }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(auditTrail)
        .where(eq(auditTrail.projectId, input.projectId))
        .orderBy(desc(auditTrail.createdAt))
        .limit(input.limit);
    }),

  lock: authedQuery
    .input(z.object({ projectId: z.string(), userName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const now = new Date();
      const expires = new Date(now.getTime() + 5 * 60 * 1000); // 5 min
      // Remove old locks
      await db.delete(collaborationLocks)
        .where(and(eq(collaborationLocks.projectId, input.projectId), gt(collaborationLocks.expiresAt, now)));
      await db.insert(collaborationLocks).values({
        projectId: input.projectId,
        userId: ctx.user.unionId,
        userName: input.userName || ctx.user.name || ctx.user.unionId,
        lockedAt: now,
        expiresAt: expires,
      });
      return { success: true, expiresAt: expires.toISOString() };
    }),

  whoIsEditing: authedQuery
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();
      const rows = await db.select().from(collaborationLocks)
        .where(and(eq(collaborationLocks.projectId, input.projectId), gt(collaborationLocks.expiresAt, now)))
        .limit(1);
      return rows[0] || null;
    }),
});
