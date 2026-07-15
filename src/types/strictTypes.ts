/**
 * C.12: Strict type replacements for common 'any' patterns
 * Replaces generic 'any' with proper domain types
 */

import type { FloorPlan, Barrier, RadiationSource } from './radshield';

/** Calculation result with strict typing */
export interface CalculationResult {
  barrierName: string;
  requiredThickness_mm: number;
  material: string;
  maxKerma_mSv: number;
  designGoal_mSv: number;
  isPassing: boolean;
  tvl_mm?: number;
  n_tenths?: number;
}

/** Dialog action handler - always void return */
export type DialogAction = () => void;

/** Dialog toggle handler - accepts boolean or toggle function */
export type DialogToggle = (v: boolean | ((p: boolean) => boolean)) => void;

/** Project data for save/load operations */
export interface ProjectData {
  id: string;
  name: string;
  floorPlan: FloorPlan;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** Export format options */
export type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

/** Toast notification type */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Keyboard shortcut definition */
export interface KeyboardShortcut {
  key: string;
  action: string;
  handler?: () => void;
}

/** Menu item for command palette */
export interface CommandPaletteItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  group: string;
  action: () => void;
}

/** Progress state for long operations */
export interface OperationProgress {
  id: string;
  label: string;
  percent: number;
  status: 'running' | 'success' | 'error' | 'cancelled';
  startTime: number;
}

/** Canvas state */
export interface CanvasViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  tool: string;
  isDragging: boolean;
  snapEnabled: boolean;
}

/** Theme configuration */
export interface ThemeConfig {
  isDarkMode: boolean;
  isHighContrast: boolean;
  accentColor: string;
}
