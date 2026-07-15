/**
 * ═══════════════════════════════════════════════════════════
 * Calculation Store — Zustand
 * Results, MC jobs, cache, running state
 * ═══════════════════════════════════════════════════════════
 */

import { create } from "zustand";

interface MCJobConfig {
  jobId: number;
  format: string;
  particles: number;
  jobName: string;
}

interface CalculationState {
  // Running state
  isCalculating: boolean;
  setIsCalculating: (v: boolean) => void;

  // Results
  lastResult: string | null;
  setLastResult: (r: string | null) => void;

  // MC Job
  mcJobConfig: MCJobConfig | null;
  setMcJobConfig: (c: MCJobConfig | null) => void;

  // Notifications
  notification: string | null;
  setNotification: (n: string | null) => void;
  clearNotification: () => void;

  // Validation results
  validationIssues: Array<{
    severity: "error" | "warning" | "info";
    message: string;
  }>;
  setValidationIssues: (issues: CalculationState["validationIssues"]) => void;
  addValidationIssue: (issue: CalculationState["validationIssues"][number]) => void;
}

export const useCalculationStore = create<CalculationState>((set) => ({
  isCalculating: false,
  setIsCalculating: (v) => set({ isCalculating: v }),

  lastResult: null,
  setLastResult: (r) => set({ lastResult: r }),

  mcJobConfig: null,
  setMcJobConfig: (c) => set({ mcJobConfig: c }),

  notification: null,
  setNotification: (n) => {
    set({ notification: n });
    setTimeout(() => set({ notification: null }), 5000);
  },
  clearNotification: () => set({ notification: null }),

  validationIssues: [],
  setValidationIssues: (issues) => set({ validationIssues: issues }),
  addValidationIssue: (issue) =>
    set((state) => ({ validationIssues: [...state.validationIssues, issue] })),
}));
