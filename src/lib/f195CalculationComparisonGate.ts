import type { CanvasBarrierResult } from '@/hooks/useCanvas';
import type { Barrier, CalculationComparison, FloorPlan } from '@/types/radshield';

export type F195ComparisonStatus = 'complete' | 'review-required' | 'missing-comparison';
export type F195ComparisonSeverity = 'none' | 'low' | 'medium' | 'high';

export interface F195BarrierComparisonReview {
  barrierId: string;
  barrierName: string;
  status: F195ComparisonStatus;
  severity: F195ComparisonSeverity;
  baseThickness_mm: number | null;
  conservativeThickness_mm: number | null;
  delta_mm: number | null;
  deltaPercent: number | null;
  dominant: 'base' | 'conservative' | 'unknown';
  recommendation: string;
  evidence: string;
}

export interface F195CalculationComparisonGate {
  phase: 'F195';
  status: 'implemented-base-conservative-comparison-gate';
  resultCount: number;
  completeCount: number;
  reviewRequiredCount: number;
  missingComparisonCount: number;
  highSeverityCount: number;
  reviews: F195BarrierComparisonReview[];
  requiredFields: string[];
  surfaces: string[];
  decision: string;
}

function findBarrier(floorPlan: FloorPlan | undefined, barrierId: string): Barrier | undefined {
  return floorPlan?.barriers.find((barrier) => barrier.id === barrierId);
}

function severityFromComparison(comparison: CalculationComparison): F195ComparisonSeverity {
  if (!Number.isFinite(comparison.deltaPercent) || comparison.deltaPercent <= 0) return 'none';
  if (comparison.deltaPercent <= 5) return 'low';
  if (comparison.deltaPercent <= 20) return 'medium';
  return 'high';
}

function recommendationFromComparison(comparison: CalculationComparison, severity: F195ComparisonSeverity): string {
  if (comparison.dominant === 'base' || severity === 'none') {
    return 'Base calculation controls; keep conservative check in the evidence appendix.';
  }
  if (severity === 'low') {
    return 'Conservative check adds a small margin; document the delta and keep base design if reviewed.';
  }
  if (severity === 'medium') {
    return 'Conservative check is materially higher; review P/T/U/W, source distance, material TVL and occupancy before report release.';
  }
  return 'High conservative delta; hold signed report until qualified physicist review or design revision.';
}

function buildMissingReview(result: CanvasBarrierResult, reason: string): F195BarrierComparisonReview {
  return {
    barrierId: result.barrierId,
    barrierName: result.barrierName || result.barrierId,
    status: 'missing-comparison',
    severity: 'high',
    baseThickness_mm: null,
    conservativeThickness_mm: null,
    delta_mm: null,
    deltaPercent: null,
    dominant: 'unknown',
    recommendation: 'Run the hardened calculation engine before analytic-memory, PDF or Evidence Pack release.',
    evidence: reason,
  };
}

function buildReview(
  result: CanvasBarrierResult,
  barrier: Barrier | undefined,
): F195BarrierComparisonReview {
  const comparison = barrier?.calculationComparison;
  if (!comparison) {
    return buildMissingReview(result, `No calculationComparison linked to barrier ${result.barrierId}.`);
  }

  const severity = severityFromComparison(comparison);
  const status: F195ComparisonStatus = severity === 'high' ? 'review-required' : 'complete';
  return {
    barrierId: result.barrierId,
    barrierName: result.barrierName || barrier?.name || result.barrierId,
    status,
    severity,
    baseThickness_mm: comparison.baseThickness_mm,
    conservativeThickness_mm: comparison.conservativeThickness_mm,
    delta_mm: comparison.delta_mm,
    deltaPercent: comparison.deltaPercent,
    dominant: comparison.dominant,
    recommendation: recommendationFromComparison(comparison, severity),
    evidence: [
      `method=${comparison.method}`,
      `base=${comparison.baseThickness_mm.toFixed(1)}mm`,
      `conservative=${comparison.conservativeThickness_mm.toFixed(1)}mm`,
      `delta=${comparison.delta_mm.toFixed(1)}mm`,
      `deltaPercent=${comparison.deltaPercent.toFixed(1)}%`,
      `dominant=${comparison.dominant}`,
    ].join(' | '),
  };
}

export function buildF195CalculationComparisonGate(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
): F195CalculationComparisonGate {
  const reviews = barrierResults.map((result) => buildReview(result, findBarrier(floorPlan, result.barrierId)));
  const completeCount = reviews.filter((review) => review.status === 'complete').length;
  const reviewRequiredCount = reviews.filter((review) => review.status === 'review-required').length;
  const missingComparisonCount = reviews.filter((review) => review.status === 'missing-comparison').length;
  const highSeverityCount = reviews.filter((review) => review.severity === 'high').length;

  return {
    phase: 'F195',
    status: 'implemented-base-conservative-comparison-gate',
    resultCount: reviews.length,
    completeCount,
    reviewRequiredCount,
    missingComparisonCount,
    highSeverityCount,
    reviews,
    requiredFields: ['baseThickness_mm', 'conservativeThickness_mm', 'delta_mm', 'deltaPercent', 'dominant', 'recommendation', 'evidence'],
    surfaces: ['MemoriaAIWizard', 'EvidencePackDialog', 'PDF report', 'F125 calculation evidence gate', 'UpdateAppDialog'],
    decision:
      'Every release-facing barrier should expose base vs conservative comparison; high deltas or missing comparisons remain review-required before signed output.',
  };
}

export function buildF195CalculationComparisonSection(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
): string {
  const gate = buildF195CalculationComparisonGate(floorPlan, barrierResults);
  return [
    '9. GATE F195 COMPARADOR BASE-CONSERVADOR',
    `   Resultados comparados: ${gate.resultCount}`,
    `   Completos: ${gate.completeCount}`,
    `   Revision requerida: ${gate.reviewRequiredCount}`,
    `   Sin comparador: ${gate.missingComparisonCount}`,
    `   Severidad alta: ${gate.highSeverityCount}`,
    ...gate.reviews.slice(0, 12).map((review) => [
      `   - ${review.barrierName} [${review.status}/${review.severity}]`,
      `     Evidencia: ${review.evidence}`,
      `     Recomendacion: ${review.recommendation}`,
    ].join('\n')),
    `   Decision: ${gate.decision}`,
  ].join('\n');
}
