import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';

export interface F212RegulatoryThreshold {
  id: 'alara' | 'public' | 'controlled' | 'project-min' | 'project-max';
  label: string;
  value_mSv_per_wk: number;
  color: string;
  source: string;
}

export interface F212HeatmapLevel {
  id: 'low' | 'review' | 'controlled' | 'exceed';
  label: string;
  min_mSv_per_wk: number;
  max_mSv_per_wk: number | null;
  color: string;
  exportLabel: string;
}

export interface F212HeatmapRegulatoryLegend {
  schema: 'radshield-mx.heatmap-regulatory-legend.f212.v1';
  phase: 'F212';
  status: 'heatmap-regulatory-legend-ready' | 'heatmap-regulatory-legend-review';
  heatmapPointCount: number;
  samplePointCount: number;
  sampleLineCount: number;
  resultCount: number;
  maxWeeklyProxy_mSv: number;
  maxSource: string;
  thresholds: F212RegulatoryThreshold[];
  levels: F212HeatmapLevel[];
  warnings: string[];
  exportColumns: string[];
  decision: string;
}

const DEFAULT_THRESHOLDS: F212RegulatoryThreshold[] = [
  { id: 'alara', label: 'ALARA', value_mSv_per_wk: 0.001, color: '#10b981', source: 'RadShield design goal' },
  { id: 'public', label: 'Publico', value_mSv_per_wk: 0.02, color: '#f59e0b', source: 'RadShield public design goal' },
  { id: 'controlled', label: 'Controlado', value_mSv_per_wk: 0.1, color: '#ef4444', source: 'RadShield controlled-area design goal' },
];

function finiteNumbers(values: unknown[]): number[] {
  return values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function collectDesignGoals(floorPlan?: FloorPlan): number[] {
  if (!floorPlan) return [];
  return finiteNumbers([
    ...(floorPlan.barriers ?? []).map((barrier) => barrier.designGoal_mSv_per_wk),
    ...(floorPlan.criticalPoints ?? []).map((point) => point.designGoal_mSv_per_wk),
    ...((floorPlan.regions ?? []) as Array<{ designGoal_mSv_per_wk?: number }>).map((region) => region.designGoal_mSv_per_wk),
    ...((floorPlan.occupiedRegions ?? []) as Array<{ designGoal_mSv_per_wk?: number }>).map((region) => region.designGoal_mSv_per_wk),
  ]).filter((value) => value > 0);
}

function collectSampleValues(sampleLines: CanvasSampleLine[]): number[] {
  return finiteNumbers(sampleLines.flatMap((line) => line.points.map((point) => point.kermaRate))).filter((value) => value >= 0);
}

function collectResultValues(barrierResults: CanvasBarrierResult[]): number[] {
  return finiteNumbers(barrierResults.map((result) => result.maxKermaRate_mGy_per_wk)).filter((value) => value >= 0);
}

function buildLevels(publicLimit: number, controlledLimit: number): F212HeatmapLevel[] {
  return [
    {
      id: 'low',
      label: 'Bajo / ALARA',
      min_mSv_per_wk: 0,
      max_mSv_per_wk: publicLimit,
      color: '#10b981',
      exportLabel: `<= ${publicLimit} mSv/sem`,
    },
    {
      id: 'review',
      label: 'Revision publica',
      min_mSv_per_wk: publicLimit,
      max_mSv_per_wk: controlledLimit,
      color: '#f59e0b',
      exportLabel: `${publicLimit}-${controlledLimit} mSv/sem`,
    },
    {
      id: 'controlled',
      label: 'Zona controlada',
      min_mSv_per_wk: controlledLimit,
      max_mSv_per_wk: controlledLimit * 1.5,
      color: '#ef4444',
      exportLabel: `${controlledLimit}-${controlledLimit * 1.5} mSv/sem`,
    },
    {
      id: 'exceed',
      label: 'Excede / corregir',
      min_mSv_per_wk: controlledLimit * 1.5,
      max_mSv_per_wk: null,
      color: '#7f1d1d',
      exportLabel: `> ${controlledLimit * 1.5} mSv/sem`,
    },
  ];
}

export function buildF212HeatmapRegulatoryLegend(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
  heatmapPointCount = 0,
): F212HeatmapRegulatoryLegend {
  const designGoals = collectDesignGoals(floorPlan);
  const thresholds = [...DEFAULT_THRESHOLDS];
  if (designGoals.length > 0) {
    thresholds.push({
      id: 'project-min',
      label: 'P min proyecto',
      value_mSv_per_wk: Math.min(...designGoals),
      color: '#0ea5e9',
      source: 'FloorPlan design goals',
    });
    thresholds.push({
      id: 'project-max',
      label: 'P max proyecto',
      value_mSv_per_wk: Math.max(...designGoals),
      color: '#9333ea',
      source: 'FloorPlan design goals',
    });
  }

  const sampleValues = collectSampleValues(sampleLines);
  const resultValues = collectResultValues(barrierResults);
  const values = [...sampleValues, ...resultValues];
  const maxWeeklyProxy_mSv = values.length > 0 ? Math.max(...values) : 0;
  const maxSource = sampleValues.includes(maxWeeklyProxy_mSv)
    ? 'sampleLines.kermaRate'
    : resultValues.includes(maxWeeklyProxy_mSv)
      ? 'barrierResults.maxKermaRate_mGy_per_wk'
      : 'N/D';

  const publicLimit = thresholds.find((threshold) => threshold.id === 'public')?.value_mSv_per_wk ?? 0.02;
  const controlledLimit = thresholds.find((threshold) => threshold.id === 'controlled')?.value_mSv_per_wk ?? 0.1;
  const warnings: string[] = [];

  if (!floorPlan) warnings.push('No hay floorplan activo.');
  if (heatmapPointCount === 0) warnings.push('Heatmap sin puntos generados.');
  if (sampleLines.length === 0) warnings.push('No hay lineas 0.3 m para isocontornos.');
  if (barrierResults.length === 0) warnings.push('No hay resultados de barreras para etiquetar maxima.');
  if (maxWeeklyProxy_mSv > controlledLimit) warnings.push('El maximo proxy supera el umbral controlado.');

  return {
    schema: 'radshield-mx.heatmap-regulatory-legend.f212.v1',
    phase: 'F212',
    status: warnings.length === 0 ? 'heatmap-regulatory-legend-ready' : 'heatmap-regulatory-legend-review',
    heatmapPointCount,
    samplePointCount: sampleValues.length,
    sampleLineCount: sampleLines.length,
    resultCount: barrierResults.length,
    maxWeeklyProxy_mSv,
    maxSource,
    thresholds,
    levels: buildLevels(publicLimit, controlledLimit),
    warnings,
    exportColumns: ['Nivel', 'Umbral mSv/sem', 'Color', 'Max proxy', 'Fuente', 'Decision'],
    decision:
      warnings.length === 0
        ? 'Leyenda regulatoria lista para export visual, Memoria IA, PDF y Evidence Pack.'
        : 'Completar heatmap, lineas 0.3 m o resultados antes de declarar isocontornos reportables.',
  };
}

export function formatF212HeatmapRegulatoryLegendText(legend: F212HeatmapRegulatoryLegend): string {
  return [
    `${legend.phase} ${legend.status}`,
    `Heatmap points: ${legend.heatmapPointCount}`,
    `Sample lines: ${legend.sampleLineCount}`,
    `Max proxy: ${legend.maxWeeklyProxy_mSv.toFixed(3)} mSv/sem (${legend.maxSource})`,
    `Thresholds: ${legend.thresholds.map((threshold) => `${threshold.label}=${threshold.value_mSv_per_wk}`).join(' | ')}`,
    `Warnings: ${legend.warnings.join(' | ') || 'ninguna'}`,
  ].join('\n');
}
