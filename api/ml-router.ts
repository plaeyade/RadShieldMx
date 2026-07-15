// =============================================================================
// ml-router.ts — ML training data + predictions (v88: Drizzle ORM)
// =============================================================================
import { z } from "zod";
import { adminQuery, authedQuery, createRouter } from "./middleware";
import { getDb } from "./queries/connection";
import { mlTrainingData } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const mlRouter = createRouter({
  // ─── Record calculation for training data ───
  record: authedQuery
    .input(z.object({
      energy: z.string(),
      distance: z.string(),
      workload: z.string(),
      occupancy: z.string(),
      goalDose: z.string(),
      useFactor: z.string(),
      material: z.string(),
      thickness: z.string(),
      method: z.enum(["ncrp151", "ncrp147", "ml", "user"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await getDb().insert(mlTrainingData).values({
        userId: ctx.user.unionId,
        energy: input.energy,
        distance: input.distance,
        workload: input.workload,
        occupancy: input.occupancy,
        goalDose: input.goalDose,
        useFactor: input.useFactor,
        material: input.material,
        thickness: input.thickness,
        method: input.method,
      });
      return { id: Number(result[0].insertId), success: true };
    }),

  // ─── Get training history ───
  history: authedQuery
    .input(z.object({
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      let query = getDb().select().from(mlTrainingData)
        .orderBy(desc(mlTrainingData.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      query = query.where(eq(mlTrainingData.userId, ctx.user.unionId)) as typeof query;

      const items = await query;
      const [countResult] = await getDb().select({ count: sql<number>`count(*)` }).from(mlTrainingData);
      return { items, total: countResult?.count ?? 0 };
    }),

  // ─── Get dataset for training (exported) ───
  dataset: adminQuery
    .input(z.object({
      userId: z.string().optional(),
      limit: z.number().min(1).max(5000).default(1000),
    }))
    .query(async ({ input }) => {
      let query = getDb().select().from(mlTrainingData)
        .orderBy(desc(mlTrainingData.createdAt))
        .limit(input.limit);

      if (input.userId) {
        query = query.where(eq(mlTrainingData.userId, input.userId)) as typeof query;
      }

      const items = await query;
      return {
        data: items,
        count: items.length,
        csv: toCsv(items),
      };
    }),

  // ─── Stats ───
  stats: adminQuery.query(async () => {
    const db = getDb();
    const [countResult, byMaterial, byMethod] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(mlTrainingData),
      db.select({ material: mlTrainingData.material, count: sql<number>`count(*)` })
        .from(mlTrainingData).groupBy(mlTrainingData.material),
      db.select({ method: mlTrainingData.method, count: sql<number>`count(*)` })
        .from(mlTrainingData).groupBy(mlTrainingData.method),
    ]);

    return {
      count: countResult[0]?.count ?? 0,
      byMaterial,
      byMethod,
    };
  }),

  // ─── Clear all training data ───
  reset: adminQuery.mutation(async () => {
    await getDb().delete(mlTrainingData);
    return { success: true };
  }),
});

// ─── Helper: Convert to CSV ───
function toCsv(items: Array<typeof mlTrainingData.$inferSelect>): string {
  if (items.length === 0) return "energy,distance,workload,occupancy,goalDose,useFactor,material,thickness,method\n";
  const headers = ["energy", "distance", "workload", "occupancy", "goalDose", "useFactor", "material", "thickness", "method"];
  const rows = items.map(r => headers.map(h => (r as any)[h]).join(","));
  return headers.join(",") + "\n" + rows.join("\n");
}
