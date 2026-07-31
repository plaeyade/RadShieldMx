import type { Barrier, CalculationInputWarning, FloorPlan } from '@/types/radshield';
import { buildF237CalculationEngineGovernance } from './f237CalculationEngineGovernance';

export interface F405TraceableBarrierResult {
  barrierId: string;
  barrierName: string;
  status: 'ready' | 'review-required' | 'blocked';
  formulaId: string;
  standard: string;
  citationIds: string[];
  inputs: Record<string, number | string | boolean>;
  outputs: Record<string, number | string | boolean>;
  assumptions: string[];
  warnings: CalculationInputWarning[];
  units: Barrier['calculationUnitSnapshot'] | null;
  comparison: Barrier['calculationComparison'] | null;
  cacheKey: string | null;
  handoffTargets: string[];
}

export interface F405CalculationTraceabilityBundle {
  schema: 'radshield-mx.f405.calculation-traceability-bundle.v1';
  phase: 'F405';
  status: 'calculation-traceability-ready' | 'calculation-traceability-review';
  floorPlanId: string;
  floorPlanName: string;
  barrierCount: number;
  readyCount: number;
  reviewRequiredCount: number;
  blockedCount: number;
  traceableResults: F405TraceableBarrierResult[];
  requiredFields: string[];
  reportHandoff: string[];
  warnings: string[];
  decision: string;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function isTraceableBarrierReady(barrier: Barrier): boolean {
  return Boolean(
    barrier.calculationTrace?.formulaId &&
      barrier.calculationTrace?.standard &&
      barrier.calculationTrace?.inputs &&
      barrier.calculationTrace?.outputs &&
      barrier.calculationTrace?.citationIds?.length &&
      barrier.calculationWarnings?.length &&
      barrier.calculationUnitSnapshot &&
      barrier.calculationComparison,
  );
}

function barrierStatus(barrier: Barrier): F405TraceableBarrierResult['status'] {
  if (barrier.calculationWarnings?.some((warning) => warning.severity === 'error')) return 'blocked';
  return isTraceableBarrierReady(barrier) ? 'ready' : 'review-required';
}

export function buildF405CalculationTraceabilityBundle(floorPlan?: FloorPlan): F405CalculationTraceabilityBundle {
  const barriers = floorPlan?.barriers ?? [];
  const governance = buildF237CalculationEngineGovernance(floorPlan);
  const traceableResults = barriers.map((barrier): F405TraceableBarrierResult => {
    const trace = barrier.calculationTrace;
    return {
      barrierId: barrier.id,
      barrierName: barrier.name || barrier.id,
      status: barrierStatus(barrier),
      formulaId: trace?.formulaId ?? 'missing-formula',
      standard: trace?.standard ?? 'missing-standard',
      citationIds: unique(trace?.citationIds ?? []),
      inputs: trace?.inputs ?? {},
      outputs: trace?.outputs ?? {},
      assumptions: trace?.assumptions ?? [],
      warnings: barrier.calculationWarnings ?? [],
      units: barrier.calculationUnitSnapshot ?? null,
      comparison: barrier.calculationComparison ?? null,
      cacheKey: barrier.calculationCacheKey ?? null,
      handoffTargets: ['Memoria IA', 'PDF Report', 'Evidence Pack', 'Update Center'],
    };
  });

  const readyCount = traceableResults.filter((result) => result.status === 'ready').length;
  const blockedCount = traceableResults.filter((result) => result.status === 'blocked').length;
  const reviewRequiredCount = traceableResults.length - readyCount - blockedCount;
  const warnings = [
    ...traceableResults.flatMap((result) => result.warnings.map((warning) => `${result.barrierId}:${warning.field}:${warning.message}`)),
    ...governance.barriers.flatMap((barrier) => barrier.gaps.map((gap) => `${barrier.barrierId}:${gap}`)),
  ];

  return {
    schema: 'radshield-mx.f405.calculation-traceability-bundle.v1',
    phase: 'F405',
    status: blockedCount === 0 && reviewRequiredCount === 0 ? 'calculation-traceability-ready' : 'calculation-traceability-review',
    floorPlanId: floorPlan?.id ?? 'no-floorplan',
    floorPlanName: floorPlan?.name ?? 'No active floorplan',
    barrierCount: barriers.length,
    readyCount,
    reviewRequiredCount,
    blockedCount,
    traceableResults,
    requiredFields: [
      'formulaId',
      'standard',
      'inputs',
      'outputs',
      'assumptions',
      'warnings',
      'citationIds',
      'calculationUnitSnapshot',
      'calculationComparison',
      'calculationCacheKey',
    ],
    reportHandoff: ['MemoriaAIWizard', 'PdfReportDialog', 'EvidencePackDialog', 'manual_usuario.html'],
    warnings: unique(warnings),
    decision: blockedCount
      ? 'Bloquear salida firmable hasta resolver errores numericos o entradas invalidas.'
      : reviewRequiredCount
        ? 'Usar para iteracion; completar trazas/citas/unidades/comparador antes de memoria firmable.'
        : 'Resultados listos para entregar a Memoria IA, PDF y Evidence Pack con trazabilidad completa.',
  };
}

export function formatF405CalculationTraceabilityBundle(bundle: F405CalculationTraceabilityBundle): string {
  return [
    `${bundle.phase} ${bundle.status}`,
    `Floorplan: ${bundle.floorPlanName} (${bundle.floorPlanId})`,
    `Barriers: ${bundle.readyCount}/${bundle.barrierCount} ready | review ${bundle.reviewRequiredCount} | blocked ${bundle.blockedCount}`,
    `Required: ${bundle.requiredFields.join(', ')}`,
    `Handoff: ${bundle.reportHandoff.join(', ')}`,
    `Decision: ${bundle.decision}`,
  ].join('\n');
}
