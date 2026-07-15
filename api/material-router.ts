// =============================================================================
// material-router.ts — CRUD materiales de blindaje (v88: Drizzle ORM)
// =============================================================================
import { z } from "zod";
import { authedQuery, createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { customMaterials } from "@db/schema";
import { and, eq, desc } from "drizzle-orm";

// Builtin materials (static, not in DB)
const BUILTIN_MATERIALS = [
  { id: "concrete_2350", name: "Normal Concrete", category: "concrete" as const, density_g_cm3: "2.35", tvlJson: '{"6MV":37,"10MV":37,"15MV":44,"18MV":45}', cost_MXN_per_m3: "3500" },
  { id: "concrete_3500", name: "Barite Concrete", category: "barite" as const, density_g_cm3: "3.50", tvlJson: '{"6MV":24,"10MV":24,"15MV":29,"18MV":29}', cost_MXN_per_m3: "8500" },
  { id: "steel", name: "Steel", category: "steel" as const, density_g_cm3: "7.80", tvlJson: '{"6MV":10,"10MV":10,"15MV":12,"18MV":12}', cost_MXN_per_m3: "25000" },
  { id: "lead", name: "Lead", category: "lead" as const, density_g_cm3: "11.34", tvlJson: '{"6MV":5.7,"10MV":5.7,"15MV":6.8,"18MV":6.8}', cost_MXN_per_m3: "120000" },
  { id: "borated_poly", name: "Borated Polyethylene", category: "borated" as const, density_g_cm3: "1.05", tvlJson: '{"neutron":"varies"}', cost_MXN_per_m3: "15000" },
  { id: "lead_glass", name: "Lead Glass", category: "special" as const, density_g_cm3: "4.80", tvlJson: '{"6MV":18,"10MV":18}', cost_MXN_per_m3: "45000" },
];

export const materialRouter = createRouter({
  // ─── List all materials (builtin + custom) ───
  list: authedQuery
    .query(async ({ ctx }) => {
      const custom = await getDb().select().from(customMaterials)
        .where(eq(customMaterials.userId, ctx.user.unionId))
        .orderBy(desc(customMaterials.createdAt));
      return { builtin: BUILTIN_MATERIALS, custom };
    }),

  listBuiltin: publicQuery.query(() => ({ builtin: BUILTIN_MATERIALS, custom: [] })),

  // ─── Get by ID ───
  getById: authedQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const builtin = BUILTIN_MATERIALS.find(m => m.id === input.id);
      if (builtin) return { ...builtin, isBuiltin: true };

      const rows = await getDb().select().from(customMaterials)
        .where(and(eq(customMaterials.id, parseInt(input.id)), eq(customMaterials.userId, ctx.user.unionId)))
        .limit(1);
      return rows[0] ? { ...rows[0], isBuiltin: false } : null;
    }),

  // ─── Create custom material ───
  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(100),
      category: z.enum(["concrete", "steel", "lead", "composite", "barite", "borated", "special"]),
      density_g_cm3: z.string(),
      tvlJson: z.string().optional(),
      cost_MXN_per_m3: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await getDb().insert(customMaterials).values({
        userId: ctx.user.unionId,
        name: input.name,
        category: input.category,
        density_g_cm3: input.density_g_cm3,
        tvlJson: input.tvlJson || null,
        cost_MXN_per_m3: input.cost_MXN_per_m3 || null,
        notes: input.notes || null,
      });
      return { id: Number(result[0].insertId), success: true };
    }),

  // ─── Delete custom material ───
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await getDb().delete(customMaterials)
        .where(and(eq(customMaterials.id, input.id), eq(customMaterials.userId, ctx.user.unionId)));
      return { success: true };
    }),
});
