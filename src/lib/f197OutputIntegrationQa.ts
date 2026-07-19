import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';
import { buildF125CalculationEvidenceGate } from './f125CalculationEvidenceGate';
import { buildF195CalculationComparisonGate } from './f195CalculationComparisonGate';
import { CALCULATION_CACHE_VERSION } from './calculationCacheKey';

export interface F197OutputIntegrationQa {
  phase: 'F197QA';
  status: 'implemented-menu-canvas-output-qa';
  menuScope: string[];
  canvasScope: string[];
  outputSurfaces: string[];
  evidenceStatus: ReturnType<typeof buildF125CalculationEvidenceGate>['status'];
  comparisonStatus: ReturnType<typeof buildF195CalculationComparisonGate>['status'];
  cacheVersion: string;
  releaseGuardrails: string[];
  nextPhases: string[];
  decision: string;
}

export function buildF197OutputIntegrationQa(
  floorPlan?: FloorPlan,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
): F197OutputIntegrationQa {
  const evidenceGate = buildF125CalculationEvidenceGate(floorPlan, barrierResults, sampleLines);
  const comparisonGate = buildF195CalculationComparisonGate(floorPlan, barrierResults);

  return {
    phase: 'F197QA',
    status: 'implemented-menu-canvas-output-qa',
    menuScope: [
      'Archivo: project IO, imports, exports, audit, help',
      'Canonical workflow: Design, Equipment, Shielding, Verification, Reports, Evidence, Integrations',
      'Legacy retained only where it is an explicit fallback utility',
    ],
    canvasScope: [
      'sidebar stable width',
      'main floorplan canvas visibility',
      'F191 CAD-clinical toolbar visibility',
      'F188 movable/restorable panel controls',
      'localStorage recovery for hidden panels and stale welcome state',
    ],
    outputSurfaces: [
      'MemoriaAIWizard',
      'EvidencePackDialog',
      'PdfReportDialog',
      'UpdateAppDialog',
      'manuals/version changelog',
    ],
    evidenceStatus: evidenceGate.status,
    comparisonStatus: comparisonGate.status,
    cacheVersion: CALCULATION_CACHE_VERSION,
    releaseGuardrails: [
      'Do not publish signed reports when F125 evidence is missing or review-required.',
      'Do not use cached calculations unless F196 payload matches scale, geometry, materials, sources, standards and P/T/U/W.',
      'If canvas/sidebar disappear, clear F188 canvas/sidebar localStorage keys and reload before diagnosing renderer failure.',
      'Continue menu validation function by function from Archivo before removing any remaining fallback entry.',
    ],
    nextPhases: [
      'F198 full menu function smoke by canonical group',
      'F199 report/export/Evidence Pack smoke',
      'F200 release checkpoint with public URL or static deploy lane',
    ],
    decision:
      'F197QA closes the immediate menu/canvas visibility diagnosis and links calculation evidence, comparison gate and safe cache to release-facing outputs before broader smoke testing.',
  };
}
