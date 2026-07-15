/**
 * ═══════════════════════════════════════════════════════════
 * Canvas Store — Zustand
 * Floor plan, barriers, sources, tools, canvas transforms
 * ═══════════════════════════════════════════════════════════
 */

import { create } from "zustand";
import type { FloorPlan } from "@/types/radshield";

const defaultFloorPlan: FloorPlan = {
  id: "plan-1",
  name: "Plano de Blindaje 1",
  imageUrl: null,
  scale_m_per_pixel: 0.01,
  width_pixels: 1000,
  height_pixels: 800,
  barriers: [],
  sources: [],
  occupiedRegions: [],
};

interface CanvasState {
  floorPlan: FloorPlan;
  setFloorPlan: (plan: FloorPlan) => void;
  updateFloorPlan: (partial: Partial<FloorPlan>) => void;

  activeTool: string;
  setActiveTool: (tool: string) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;

  selectedBarrierId: string | null;
  setSelectedBarrierId: (id: string | null) => void;

  selectedSourceId: string | null;
  setSelectedSourceId: (id: string | null) => void;

  // Canvas transform (zoom/pan)
  zoom: number;
  setZoom: (z: number) => void;
  panX: number;
  panY: number;
  setPan: (x: number, y: number) => void;

  // Undo/redo
  history: FloorPlan[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: (plan: FloorPlan) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  floorPlan: defaultFloorPlan,
  setFloorPlan: (plan) => {
    set({ floorPlan: plan });
    get().pushHistory(plan);
  },
  updateFloorPlan: (partial) => {
    const newPlan = { ...get().floorPlan, ...partial };
    set({ floorPlan: newPlan });
    get().pushHistory(newPlan);
  },

  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  selectedBarrierId: null,
  setSelectedBarrierId: (id) => set({ selectedBarrierId: id }),

  selectedSourceId: null,
  setSelectedSourceId: (id) => set({ selectedSourceId: id }),

  zoom: 1,
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(10, z)) }),
  panX: 0,
  panY: 0,
  setPan: (x, y) => set({ panX: x, panY: y }),

  // Undo/redo with max 50 history
  history: [defaultFloorPlan],
  historyIndex: 0,
  canUndo: false,
  canRedo: false,
  pushHistory: (plan) => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(plan);
    if (newHistory.length > 50) newHistory.shift();
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false,
    });
  },
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({
        floorPlan: state.history[newIndex],
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
      });
    }
  },
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({
        floorPlan: state.history[newIndex],
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < state.history.length - 1,
      });
    }
  },
  reset: () => {
    set({
      floorPlan: defaultFloorPlan,
      history: [defaultFloorPlan],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },
}));
