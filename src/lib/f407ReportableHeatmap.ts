import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';
import { buildF212HeatmapRegulatoryLegend, type F212HeatmapRegulatoryLegend } from './f212HeatmapRegulatoryLegend';

export interface F407ReportableHeatmapPoint {
  id: string;
  x: number;
  y: number;
  value_mSv_per_wk: number;
  levelId: string;
  label: string;
  source: 'sample-line' | 'barrier-result';
}

export interface F407ReportableHeatmapSnapshot {
  schema: 'radshield-mx.f407.reportable-heatmap.v1';
  phase: 'F407';
  status: 'reportable-heatmap-ready' | 'reportable-heatmap-review';
  legend: F212HeatmapRegulatoryLegend;
  points: F407ReportableHeatmapPoint[];
  exportTargets: string[];
  requiredEvidence: string[];
  warnings: string[];
  decision: string;
}

function classifyLevel(legend: F212HeatmapRegulatoryLegend, value: number): { id: string; label: string } {
  const level = legend.levels.find((item) => value >= item.min_mSv_per_wk && (item.max_mSv_per_wk === null || value < item.max_mSv_per_wk));
  return { id: level?.id ?? 'unknown', label: level?.label ?? 'Sin clasificar' };
}

export function buildF407ReportableHeatmapSnapshot(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
  heatmapPointCount = 0,
): F407ReportableHeatmapSnapshot {
  const legend = buildF212HeatmapRegulatoryLegend(floorPlan, barrierResults, sampleLines, heatmapPointCount);
  const samplePoints = sampleLines.flatMap((line) => line.points.map((point, index) => {
    const level = classifyLevel(legend, point.kermaRate);
    return {
      id: `${line.barrierId}-sample-${index}`,
      x: point.x,
      y: point.y,
      value_mSv_per_wk: point.kermaRate,
      levelId: level.id,
      label: level.label,
      source: 'sample-line' as const,
    };
  }));
  const resultPoints = barrierResults.map((result, index) => {
    const value = result.maxKermaRate_mGy_per_wk;
    const level = classifyLevel(legend, value);
    return {
      id: `${result.barrierId || 'barrier'}-result-${index}`,
      x: 0,
      y: 0,
      value_mSv_per_wk: value,
      levelId: level.id,
      label: level.label,
      source: 'barrier-result' as const,
    };
  });
  const warnings = [
    ...legend.warnings,
    ...(samplePoints.length === 0 ? ['No sample-line points available for exportable isocontours.'] : []),
  ];

  return {
    schema: 'radshield-mx.f407.reportable-heatmap.v1',
    phase: 'F407',
    status: warnings.length === 0 ? 'reportable-heatmap-ready' : 'reportable-heatmap-review',
    legend,
    points: [...samplePoints, ...resultPoints],
    exportTargets: ['Canvas PNG', 'PdfReportDialog', 'Evidence Pack', 'Memoria IA annex'],
    requiredEvidence: [
      'floorPlan.scale_m_per_pixel',
      'sampleLines at 0.3 m',
      'barrierResults with max kerma',
      'F212 regulatory legend thresholds',
      'visual snapshot hash when exported',
    ],
    warnings,
    decision: warnings.length === 0
      ? 'Heatmap/isocontours can be exported as report evidence with regulatory legend.'
      : 'Heatmap remains useful for design review, but report export needs the listed evidence.',
  };
}

export function formatF407ReportableHeatmapSnapshot(snapshot: F407ReportableHeatmapSnapshot): string {
  return [
    `${snapshot.phase} ${snapshot.status}`,
    `Points: ${snapshot.points.length}`,
    `Max proxy: ${snapshot.legend.maxWeeklyProxy_mSv.toFixed(3)} mSv/sem`,
    `Targets: ${snapshot.exportTargets.join(', ')}`,
    `Warnings: ${snapshot.warnings.join(' | ') || 'none'}`,
  ].join('\n');
}
