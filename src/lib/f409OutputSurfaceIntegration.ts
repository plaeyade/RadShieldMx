import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';
import {
  buildF405CalculationTraceabilityBundle,
  formatF405CalculationTraceabilityBundle,
  type F405CalculationTraceabilityBundle,
} from './f405CalculationTraceabilityBundle';
import {
  buildF407ReportableHeatmapSnapshot,
  formatF407ReportableHeatmapSnapshot,
  type F407ReportableHeatmapSnapshot,
} from './f407ReportableHeatmap';
import { buildF408UnitySceneExport, validateF408UnitySceneExport, type F408UnitySceneExport } from './f408UnitySceneExport';
import type { MedicalRoomPreset } from './medical3D/sceneBuilder';

export type F409SurfaceStatus = 'ready' | 'review' | 'blocked';

export interface F409OutputSurfaceRow {
  id: string;
  label: string;
  target: string;
  status: F409SurfaceStatus;
  requiredForRelease: boolean;
  evidence: string[];
  warnings: string[];
}

export interface F409OutputSurfaceIntegration {
  schema: 'radshield-mx.f409.output-surface-integration.v1';
  phase: 'F409';
  status: 'output-surfaces-integrated' | 'output-surfaces-review' | 'output-surfaces-blocked';
  floorPlanId: string;
  floorPlanName: string;
  preset: MedicalRoomPreset;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  traceability: F405CalculationTraceabilityBundle;
  heatmap: F407ReportableHeatmapSnapshot;
  unity: F408UnitySceneExport;
  unityValidationWarnings: string[];
  surfaces: F409OutputSurfaceRow[];
  exportFiles: string[];
  warnings: string[];
  decision: string;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function inferPreset(floorPlan?: FloorPlan): MedicalRoomPreset {
  const haystack = [
    floorPlan?.name,
    ...(floorPlan?.sources ?? []).map((source) => `${source.name} ${source.modality?.name ?? ''} ${source.modality?.category ?? ''}`),
  ].join(' ').toLowerCase();

  if (haystack.includes('gamma') || haystack.includes('lgk') || haystack.includes('knife')) return 'gammaKnife';
  if (haystack.includes('pet')) return 'petct';
  if (haystack.includes('ct') || haystack.includes('rx') || haystack.includes('diagn')) return 'ct';
  if (haystack.includes('hdr') || haystack.includes('braqui')) return 'hdr';
  if (haystack.includes('radiofarm') || haystack.includes('nuclear')) return 'radiofarmacia';
  return 'linac';
}

function surfaceStatus(blocked: boolean, review: boolean): F409SurfaceStatus {
  if (blocked) return 'blocked';
  if (review) return 'review';
  return 'ready';
}

function buildSurfaceRows(
  traceability: F405CalculationTraceabilityBundle,
  heatmap: F407ReportableHeatmapSnapshot,
  unity: F408UnitySceneExport,
  unityValidationWarnings: string[],
): F409OutputSurfaceRow[] {
  const traceBlocked = traceability.blockedCount > 0;
  const traceReview = traceability.status !== 'calculation-traceability-ready';
  const heatmapReview = heatmap.status !== 'reportable-heatmap-ready';
  const unityReview = unity.status !== 'unity-scene-export-ready' || unityValidationWarnings.length > 0;

  return [
    {
      id: 'memoria-ia',
      label: 'Memoria IA',
      target: 'src/sections/dialogs/MemoriaAIWizard.tsx',
      status: surfaceStatus(traceBlocked, traceReview || heatmapReview),
      requiredForRelease: true,
      evidence: ['F405 formula/norma/citas', 'F407 leyenda regulatoria', 'F408 escena visual si existe plano'],
      warnings: unique([...traceability.warnings, ...heatmap.warnings]).slice(0, 8),
    },
    {
      id: 'evidence-pack',
      label: 'Evidence Pack',
      target: 'src/sections/dialogs/EvidencePackDialog.tsx',
      status: surfaceStatus(traceBlocked, traceReview),
      requiredForRelease: true,
      evidence: ['Fuente ev-f409', 'ledger por hash', 'JSON exportable'],
      warnings: traceability.warnings.slice(0, 8),
    },
    {
      id: 'pdf-report',
      label: 'PDF / anexo de reporte',
      target: 'PdfReportDialog + anexos',
      status: surfaceStatus(traceBlocked, traceReview || heatmapReview),
      requiredForRelease: true,
      evidence: ['F405 resultados auditables', 'F407 heatmap reportable', 'F146 materiales'],
      warnings: unique([...traceability.warnings, ...heatmap.warnings]).slice(0, 8),
    },
    {
      id: 'medical-3d',
      label: 'Medical 3D / Unity handoff',
      target: 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
      status: surfaceStatus(false, unityReview),
      requiredForRelease: false,
      evidence: ['F408 coordenadas metros Y-up', 'scene bounds', 'walls/equipment/zones'],
      warnings: unityValidationWarnings.slice(0, 8),
    },
    {
      id: 'update-center',
      label: 'Update Center / manuales',
      target: 'UpdateAppDialog + manuales',
      status: 'ready',
      requiredForRelease: true,
      evidence: ['F409 documentado', 'scripts de auditoria', 'changelog/manuales'],
      warnings: [],
    },
  ];
}

export function buildF409OutputSurfaceIntegration(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
): F409OutputSurfaceIntegration {
  const preset = inferPreset(floorPlan);
  const heatmapPointCount = sampleLines.reduce((total, line) => total + line.points.length, 0);
  const traceability = buildF405CalculationTraceabilityBundle(floorPlan);
  const heatmap = buildF407ReportableHeatmapSnapshot(floorPlan, barrierResults, sampleLines, heatmapPointCount);
  const unity = buildF408UnitySceneExport(floorPlan, preset);
  const unityValidationWarnings = validateF408UnitySceneExport(unity);
  const surfaces = buildSurfaceRows(traceability, heatmap, unity, unityValidationWarnings);
  const readyCount = surfaces.filter((surface) => surface.status === 'ready').length;
  const reviewCount = surfaces.filter((surface) => surface.status === 'review').length;
  const blockedCount = surfaces.filter((surface) => surface.status === 'blocked').length;
  const warnings = unique([
    ...traceability.warnings,
    ...heatmap.warnings,
    ...unityValidationWarnings,
    ...surfaces.flatMap((surface) => surface.warnings),
  ]);

  return {
    schema: 'radshield-mx.f409.output-surface-integration.v1',
    phase: 'F409',
    status: blockedCount > 0 ? 'output-surfaces-blocked' : reviewCount > 0 ? 'output-surfaces-review' : 'output-surfaces-integrated',
    floorPlanId: floorPlan?.id ?? 'no-floorplan',
    floorPlanName: floorPlan?.name ?? 'No active floorplan',
    preset,
    readyCount,
    reviewCount,
    blockedCount,
    traceability,
    heatmap,
    unity,
    unityValidationWarnings,
    surfaces,
    exportFiles: [
      'f409_output_surface_integration.json',
      'memoria_analitica_f409_section.txt',
      'evidence_pack_ev_f409.json',
      'medical_3d_unity_handoff_f408.json',
    ],
    warnings,
    decision: blockedCount
      ? 'No liberar salidas firmables hasta resolver superficies bloqueadas.'
      : reviewCount
        ? 'Usar como beta/control QA; completar advertencias antes de memoria firmable o entrega final.'
        : 'F405-F408 estan integradas en Memoria IA, Evidence Pack, PDF/heatmap y Medical 3D.',
  };
}

export function formatF409OutputSurfaceIntegrationText(integration: F409OutputSurfaceIntegration): string {
  return [
    `${integration.phase} ${integration.status}`,
    `Floorplan: ${integration.floorPlanName} (${integration.floorPlanId}) | preset 3D: ${integration.preset}`,
    `Superficies: listas ${integration.readyCount} | revision ${integration.reviewCount} | bloqueadas ${integration.blockedCount}`,
    `F405: ${formatF405CalculationTraceabilityBundle(integration.traceability).replace(/\n/g, ' | ')}`,
    `F407: ${formatF407ReportableHeatmapSnapshot(integration.heatmap).replace(/\n/g, ' | ')}`,
    `F408: ${integration.unity.status} | muros ${integration.unity.walls.length} | equipos ${integration.unity.equipment.length} | zonas ${integration.unity.zones.length}`,
    `Surface map: ${integration.surfaces.map((surface) => `${surface.label}:${surface.status}`).join(' | ')}`,
    `Exportables: ${integration.exportFiles.join(', ')}`,
    `Warnings: ${integration.warnings.slice(0, 10).join(' | ') || 'none'}`,
    `Decision: ${integration.decision}`,
  ].join('\n');
}
