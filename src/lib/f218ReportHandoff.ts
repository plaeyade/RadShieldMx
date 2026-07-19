import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';
import {
  buildF217VisualExportByScene,
  type F217VisualExportSceneId,
} from '@/lib/f217VisualExportByScene';

export type F218ReportHandoffStatus = 'ready' | 'missing' | 'review';

export interface F218ReportHandoffItem {
  id: F217VisualExportSceneId;
  label: string;
  target: 'Memoria IA' | 'PDF' | 'Evidence Pack' | 'Anexo estructural';
  requiredSnapshot: string;
  status: F218ReportHandoffStatus;
  evidenceRequirement: string;
  action: string;
}

export interface F218ReportHandoffSummary {
  schema: 'radshield-mx.report-handoff.f218.v1';
  phase: 'F218';
  status: 'report-handoff-ready' | 'report-handoff-review';
  readyCount: number;
  missingCount: number;
  reviewCount: number;
  total: number;
  items: F218ReportHandoffItem[];
  requiredAttachments: string[];
  warnings: string[];
  decision: string;
}

function countSamplePoints(sampleLines: CanvasSampleLine[]): number {
  return sampleLines.reduce((total, line) => total + line.points.length, 0);
}

function mapStatus(sceneReady: boolean, hasSomeEvidence: boolean): F218ReportHandoffStatus {
  if (sceneReady) return 'ready';
  if (hasSomeEvidence) return 'review';
  return 'missing';
}

export function buildF218ReportHandoff(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
): F218ReportHandoffSummary {
  const barrierCount = floorPlan?.barriers?.length ?? 0;
  const sourceCount = floorPlan?.sources?.length ?? 0;
  const regionCount = (floorPlan?.regions?.length ?? 0) + (floorPlan?.occupiedRegions?.length ?? 0);
  const samplePointCount = countSamplePoints(sampleLines);
  const hasGeometry = barrierCount + sourceCount + regionCount > 0;
  const hasResults = barrierResults.length > 0;

  const f217 = buildF217VisualExportByScene({
    visualMode: 'plan',
    hasGeometry,
    hasResults,
    heatmapPointCount: hasResults ? Math.max(samplePointCount, barrierResults.length) : 0,
    sampleLineCount: sampleLines.length,
    barrierCount,
  });

  const items: F218ReportHandoffItem[] = f217.scenes.map((scene) => {
    const hasSomeEvidence =
      scene.id === 'plan'
        ? hasGeometry
        : scene.id === 'heat'
          ? hasResults
          : scene.id === 'isocontours'
            ? hasResults || sampleLines.length > 0
            : barrierCount > 0;
    const status = mapStatus(scene.ready, hasSomeEvidence);
    return {
      id: scene.id,
      label: scene.label,
      target: scene.target,
      requiredSnapshot: scene.exportLabel,
      status,
      evidenceRequirement: scene.requiredEvidence,
      action:
        status === 'ready'
          ? `Adjuntar ${scene.exportLabel} en ${scene.target}.`
          : status === 'review'
            ? `Revisar ${scene.exportLabel}; hay evidencia parcial pero falta cierre visual.`
            : scene.warning ?? `Preparar ${scene.exportLabel} antes de cerrar expediente.`,
    };
  });

  const readyCount = items.filter((item) => item.status === 'ready').length;
  const missingCount = items.filter((item) => item.status === 'missing').length;
  const reviewCount = items.filter((item) => item.status === 'review').length;
  const warnings = [
    ...f217.warnings,
    missingCount > 0 ? `${missingCount} snapshot(s) visuales faltan para cierre documental.` : '',
    reviewCount > 0 ? `${reviewCount} snapshot(s) requieren revision antes de firma.` : '',
  ].filter(Boolean);

  return {
    schema: 'radshield-mx.report-handoff.f218.v1',
    phase: 'F218',
    status: missingCount === 0 && reviewCount === 0 ? 'report-handoff-ready' : 'report-handoff-review',
    readyCount,
    missingCount,
    reviewCount,
    total: items.length,
    items,
    requiredAttachments: items.map((item) => `${item.requiredSnapshot} -> ${item.target}`),
    warnings,
    decision:
      'F218 amarra los snapshots F217 al cierre documental: Memoria IA, PDF, Evidence Pack y anexo estructural deben declarar capturas listas, faltantes y acciones antes de cerrar expediente.',
  };
}

export function formatF218ReportHandoffText(summary: F218ReportHandoffSummary): string {
  return [
    'F218 VISUAL REPORT HANDOFF',
    `Estado: ${summary.status}`,
    `Listos/revision/faltantes: ${summary.readyCount}/${summary.reviewCount}/${summary.missingCount} de ${summary.total}`,
    ...summary.items.map(
      (item) =>
        `- ${item.requiredSnapshot} (${item.label}) -> ${item.target}: ${item.status}. Evidencia: ${item.evidenceRequirement}. Accion: ${item.action}`,
    ),
    `Adjuntos requeridos: ${summary.requiredAttachments.join(' | ')}`,
    `Advertencias: ${summary.warnings.join(' | ') || 'sin advertencias criticas'}`,
    `Decision: ${summary.decision}`,
  ].join('\n');
}
