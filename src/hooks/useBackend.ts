// =============================================================================
// useBackend.ts — Capa de conexion al backend via tRPC (v89)
// =============================================================================
// Este hook encapsula TODAS las llamadas al backend.
// Frontend -> tRPC -> Hono -> Drizzle ORM -> MySQL
//
// NOTA DE SEGURIDAD: Nunca importar @api/router desde el frontend.
// Usamos AppRouterStub en trpc.tsx para type safety sin bundlear
// codigo del servidor.
// =============================================================================

import { useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ControlledZoneDbPersistenceDraft } from "@/lib/controlledZoneCalculationAdapter";

// ═══════════════════════════════════════════════════════════════════════════════
// User ID helper — uses Kimi OAuth when authenticated, falls back to anonymous
// ═══════════════════════════════════════════════════════════════════════════════
function useUserId(): string {
  const { user } = useAuth();
  return user?.unionId || localStorage.getItem("radshield_user_id") || "anonymous";
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CALCULATIONS — Historial de calculos NCRP
// ═══════════════════════════════════════════════════════════════════════════════

export function useCalculations() {
  const utils = trpc.useUtils();

  const listQuery = trpc.calculation.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: false } // Manual fetch to avoid unnecessary calls
  );

  const createMutation = trpc.calculation.create.useMutation({
    onSuccess: () => {
      utils.calculation.list.invalidate();
      utils.calculation.stats.invalidate();
    },
    onError: (err) => {
      console.warn("[Backend] Calculation save failed:", err.message);
    },
  });

  const statsQuery = trpc.calculation.stats.useQuery(
    undefined,
    { enabled: false }
  );

  const deleteMutation = trpc.calculation.delete.useMutation({
    onSuccess: () => {
      utils.calculation.list.invalidate();
      utils.calculation.stats.invalidate();
    },
  });

  const persistCalculation = useCallback(
    (data: {
      type: string;
      equipment?: string;
      modality?: string;
      energy?: string;
      parametersJson: Record<string, unknown>;
      resultsJson: Record<string, unknown>;
      materialId?: string;
      passes?: "pass" | "fail" | "warning";
    }) => {
      createMutation.mutate({
        type: data.type,
        equipment: data.equipment,
        modality: data.modality,
        energy: data.energy,
        parametersJson: JSON.stringify(data.parametersJson),
        resultsJson: JSON.stringify(data.resultsJson),
        materialId: data.materialId,
        passes: data.passes || "pass",
      });
    },
    [createMutation]
  );

  return {
    calculations: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    stats: statsQuery.data,
    isLoading: listQuery.isLoading || createMutation.isPending,
    fetchCalculations: listQuery.refetch,
    fetchStats: statsQuery.refetch,
    persistCalculation,
    deleteCalculation: deleteMutation.mutate,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MATERIALS — Biblioteca de materiales (builtin + custom desde DB)
// ═══════════════════════════════════════════════════════════════════════════════

export function useMaterials() {
  const utils = trpc.useUtils();

  const builtinQuery = trpc.material.listBuiltin.useQuery(
    undefined,
    { enabled: false }
  );

  const listQuery = trpc.material.list.useQuery(
    undefined,
    { enabled: false, retry: false }
  );

  const createMutation = trpc.material.create.useMutation({
    onSuccess: () => {
      utils.material.list.invalidate();
      toast.success("Material guardado en la nube");
    },
    onError: (err) => {
      toast.error("Error al guardar material: " + err.message);
    },
  });

  const deleteMutation = trpc.material.delete.useMutation({
    onSuccess: () => {
      utils.material.list.invalidate();
      toast.success("Material eliminado");
    },
  });

  return {
    builtinMaterials: listQuery.data?.builtin ?? builtinQuery.data?.builtin ?? [],
    customMaterials: listQuery.data?.custom ?? [],
    isLoading: listQuery.isLoading || builtinQuery.isLoading,
    fetchMaterials: async () => {
      await builtinQuery.refetch();
      return listQuery.refetch();
    },
    createMaterial: createMutation.mutate,
    deleteMaterial: deleteMutation.mutate,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. REPORTS — Memorias analiticas
// ═══════════════════════════════════════════════════════════════════════════════

export function useReports() {
  const utils = trpc.useUtils();

  const listQuery = trpc.report.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: false }
  );

  const createMutation = trpc.report.create.useMutation({
    onSuccess: () => {
      utils.report.list.invalidate();
      toast.success("Reporte guardado en la nube");
    },
    onError: (err) => {
      toast.error("Error al guardar reporte: " + err.message);
    },
  });

  const deleteMutation = trpc.report.delete.useMutation({
    onSuccess: () => {
      utils.report.list.invalidate();
    },
  });

  return {
    reports: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    isLoading: listQuery.isLoading,
    fetchReports: listQuery.refetch,
    createReport: createMutation.mutate,
    deleteReport: deleteMutation.mutate,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PROJECTS — Proyectos en la nube
// ═══════════════════════════════════════════════════════════════════════════════

export function useProjects() {
  const utils = trpc.useUtils();

  const listQuery = trpc.project.list.useQuery(
    {},
    { enabled: false }
  );

  const createMutation = trpc.project.create.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      toast.success("Proyecto guardado en la nube");
    },
    onError: (err) => {
      toast.error("Error al guardar proyecto: " + err.message);
    },
  });

  const deleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
    },
  });

  return {
    projects: listQuery.data ?? [],
    total: listQuery.data?.length ?? 0,
    isLoading: listQuery.isLoading,
    fetchProjects: listQuery.refetch,
    createProject: createMutation.mutate,
    deleteProject: deleteMutation.mutate,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ML TRAINING DATA — Dataset para modelos predictivos
// ═══════════════════════════════════════════════════════════════════════════════

export function useMLTraining() {
  const utils = trpc.useUtils();

  const recordMutation = trpc.ml.record.useMutation({
    onSuccess: () => {
      utils.ml.stats.invalidate();
    },
    onError: (err) => {
      console.warn("[Backend] ML record failed:", err.message);
    },
  });

  const statsQuery = trpc.ml.stats.useQuery(undefined, { enabled: false });

  const recordTrainingData = useCallback(
    (data: {
      energy: string;
      distance: string;
      workload: string;
      occupancy: string;
      goalDose: string;
      useFactor: string;
      material: string;
      thickness: string;
      method: "ncrp151" | "ncrp147" | "ml" | "user";
    }) => {
      recordMutation.mutate(data);
    },
    [recordMutation]
  );

  return {
    stats: statsQuery.data,
    isRecording: recordMutation.isPending,
    recordTrainingData,
    fetchStats: statsQuery.refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. AGENT — Autonomous shielding designer
// ═══════════════════════════════════════════════════════════════════════════════

export function useAgent() {
  const designMutation = trpc.agent.design.useMutation({
    onError: (err) => {
      toast.error("Agent error: " + err.message);
    },
  });

  return {
    design: designMutation.mutate,
    isDesigning: designMutation.isPending,
    result: designMutation.data,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. UNIFIED HOOK — Todo en uno para ShieldingDesigner
// ═══════════════════════════════════════════════════════════════════════════════

export function useControlledZonePersistence() {
  const persistMutation = trpc.controlledZone.persistDraft.useMutation({
    onSuccess: (result?: { mode?: string } | null) => {
      toast.success(
        result?.mode === "exists"
          ? "Plan ya estaba guardado"
          : "Plan de zona controlada guardado"
      );
    },
    onError: (err) => {
      toast.error("Error al guardar zona controlada: " + err.message);
    },
  });

  const listQuery = trpc.controlledZone.listPlans.useQuery(
    { limit: 50 },
    { enabled: false }
  );

  const persistDraft = useCallback(
    (data: { projectId?: string; draft: ControlledZoneDbPersistenceDraft }) => {
      return persistMutation.mutateAsync({
        projectId: data.projectId,
        draft: data.draft,
      });
    },
    [persistMutation]
  );

  return {
    plans: listQuery.data ?? [],
    isLoading: listQuery.isLoading || persistMutation.isPending,
    fetchPlans: listQuery.refetch,
    persistDraft,
    lastPersistResult: persistMutation.data,
  };
}

export function useBackend() {
  const calculations = useCalculations();
  const materials = useMaterials();
  const reports = useReports();
  const projects = useProjects();
  const mlTraining = useMLTraining();
  const agent = useAgent();
  const controlledZone = useControlledZonePersistence();

  // v89: Persist calculation results to backend after local execution
  const persistCalculationResults = useCallback(
    (floorPlan: {
      name: string;
      barriers: Array<{ name?: string; barrierType?: string; materialCode?: string; maxKerma?: number; designGoal_mSv_per_wk?: number; requiredThickness_mm?: number }>;
      sources: Array<{ name?: string; modality?: { id?: string; name?: string } | null; energy?: number }>;
    }) => {
      const failing = floorPlan.barriers.filter(
        (b) => (b.maxKerma || 0) > (b.designGoal_mSv_per_wk || 0.02)
      ).length;

      calculations.persistCalculation({
        type: "ncrp147_barrier",
        equipment: floorPlan.name,
        modality: floorPlan.sources[0]?.modality?.name || undefined,
        energy: floorPlan.sources[0]?.energy
          ? String(floorPlan.sources[0].energy)
          : undefined,
        parametersJson: {
          barrierCount: floorPlan.barriers.length,
          sourceCount: floorPlan.sources.length,
          barrierTypes: floorPlan.barriers.map((b) => b.barrierType),
          materials: floorPlan.barriers.map((b) => b.materialCode),
        },
        resultsJson: {
          barriers: floorPlan.barriers.map((b) => ({
            name: b.name,
            maxKerma: b.maxKerma,
            requiredThickness_mm: b.requiredThickness_mm,
            designGoal: b.designGoal_mSv_per_wk,
          })),
          failing,
          total: floorPlan.barriers.length,
        },
        passes:
          failing === 0
            ? "pass"
            : failing > floorPlan.barriers.length / 2
              ? "fail"
              : "warning",
      });
    },
    [calculations]
  );

  // v89: Save report to backend
  const persistReport = useCallback(
    (data: { title: string; content: string; format?: "txt" | "pdf" | "json"; installation?: string; equipment?: string; modality?: string }) => {
      reports.createReport({
        title: data.title,
        content: data.content,
        format: data.format || "txt",
        installation: data.installation,
        equipment: data.equipment,
        modality: data.modality,
      });
    },
    [reports]
  );

  // v89: Save project to backend
  const persistProject = useCallback(
    (data: { name: string; floorPlanJson: string; reportText?: string }) => {
      projects.createProject({
        name: data.name,
        floorPlanJson: data.floorPlanJson,
      });
    },
    [projects]
  );

  return {
    calculations,
    materials,
    reports,
    projects,
    mlTraining,
    agent,
    controlledZone,
    persistCalculationResults,
    persistReport,
    persistProject,
  };
}
