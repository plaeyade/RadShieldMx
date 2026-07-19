import type { Barrier, CalculationInputWarning, FloorPlan } from '@/types/radshield';
import { getKnownNumericValidationCases } from './numericValidationCases';

export type F237GovernanceStatus = 'ready' | 'review-required' | 'blocked';

export interface F237BarrierGovernance {
  barrierId: string;
  barrierName: string;
  status: F237GovernanceStatus;
  traceReady: boolean;
  unitReady: boolean;
  warningsReady: boolean;
  comparisonReady: boolean;
  cacheReady: boolean;
  citationReady: boolean;
  clinicalReviewPresent: boolean;
  tvlVersionWarningPresent: boolean;
  gaps: string[];
  impact: string;
}

export interface F237CalculationEngineGovernance {
  phase: 'F237';
  status: 'implemented-calculation-engine-governance';
  floorPlanId: string;
  barrierCount: number;
  readyCount: number;
  reviewRequiredCount: number;
  blockedCount: number;
  numericCaseCount: number;
  numericCasesReady: number;
  requiredSurfaces: string[];
  engineImprovements: Array<{
    id: string;
    recommendation: string;
    impact: string;
    releasePriority: 'P0' | 'P1' | 'P2';
  }>;
  barriers: F237BarrierGovernance[];
  decision: string;
}

function hasWarning(warnings: CalculationInputWarning[] | undefined, predicate: (warning: CalculationInputWarning) => boolean): boolean {
  return Boolean(warnings?.some(predicate));
}

function warningHasErrors(warnings: CalculationInputWarning[] | undefined): boolean {
  return hasWarning(warnings, (warning) => warning.severity === 'error');
}

function buildBarrierGovernance(barrier: Barrier): F237BarrierGovernance {
  const traceReady = Boolean(
    barrier.calculationTrace?.formulaId &&
      barrier.calculationTrace?.standard &&
      barrier.calculationTrace?.inputs &&
      barrier.calculationTrace?.outputs &&
      barrier.calculationTrace?.citationIds?.length,
  );
  const unitReady = Boolean(
    barrier.calculationUnitSnapshot &&
      Number.isFinite(barrier.calculationUnitSnapshot.selectedThickness_mm) &&
      Number.isFinite(barrier.calculationUnitSnapshot.selectedThickness_cm) &&
      Number.isFinite(barrier.calculationUnitSnapshot.mass_kg_per_m2) &&
      Number.isFinite(barrier.calculationUnitSnapshot.structuralLoad_kPa),
  );
  const warningsReady = Boolean(barrier.calculationWarnings?.length);
  const comparisonReady = Boolean(
    barrier.calculationComparison?.method === 'base-vs-conservative' &&
      Number.isFinite(barrier.calculationComparison.baseThickness_mm) &&
      Number.isFinite(barrier.calculationComparison.conservativeThickness_mm) &&
      Number.isFinite(barrier.calculationComparison.deltaPercent),
  );
  const cacheReady = typeof barrier.calculationCacheKey === 'string' && barrier.calculationCacheKey.startsWith('calc:f196:');
  const citationReady = Boolean(barrier.calculationTrace?.citationIds?.length);
  const clinicalReviewPresent = hasWarning(
    barrier.calculationWarnings,
    (warning) => warning.field === 'clinicalReview' || warning.message.toLowerCase().includes('qualified medical physicist'),
  );
  const tvlVersionWarningPresent = hasWarning(
    barrier.calculationWarnings,
    (warning) => warning.field.includes('.TVL') || warning.message.toLowerCase().includes('tvl not versioned'),
  );

  const gaps: string[] = [];
  if (!traceReady) gaps.push('missing calculationTrace formula/standard/input/output/citations');
  if (!unitReady) gaps.push('missing normalized unit snapshot mm/cm/kg-m2/kPa');
  if (!warningsReady) gaps.push('missing clinical/numeric warning array');
  if (!comparisonReady) gaps.push('missing base-vs-conservative comparison');
  if (!cacheReady) gaps.push('missing F196 cache key');
  if (!citationReady) gaps.push('missing citationIds for Memoria IA/PDF/Evidence');
  if (!clinicalReviewPresent) gaps.push('missing RSO/qualified physicist review warning');

  const status: F237GovernanceStatus = warningHasErrors(barrier.calculationWarnings)
    ? 'blocked'
    : gaps.length
      ? 'review-required'
      : 'ready';

  return {
    barrierId: barrier.id,
    barrierName: barrier.name || barrier.id,
    status,
    traceReady,
    unitReady,
    warningsReady,
    comparisonReady,
    cacheReady,
    citationReady,
    clinicalReviewPresent,
    tvlVersionWarningPresent,
    gaps,
    impact: status === 'ready'
      ? 'Ready for Memoria IA, PDF and Evidence Pack handoff with traceable calculation evidence.'
      : 'Hold signed output until gaps are resolved or explicitly reviewed by RSO/qualified medical physicist.',
  };
}

export function buildF237CalculationEngineGovernance(floorPlan?: FloorPlan): F237CalculationEngineGovernance {
  const barriers = (floorPlan?.barriers ?? []).map(buildBarrierGovernance);
  const readyCount = barriers.filter((barrier) => barrier.status === 'ready').length;
  const reviewRequiredCount = barriers.filter((barrier) => barrier.status === 'review-required').length;
  const blockedCount = barriers.filter((barrier) => barrier.status === 'blocked').length;
  const numericCases = getKnownNumericValidationCases();
  const numericCasesReady = numericCases.filter((item) => item.status === 'implemented-reference').length;

  return {
    phase: 'F237',
    status: 'implemented-calculation-engine-governance',
    floorPlanId: floorPlan?.id ?? 'no-floorplan',
    barrierCount: barriers.length,
    readyCount,
    reviewRequiredCount,
    blockedCount,
    numericCaseCount: numericCases.length,
    numericCasesReady,
    requiredSurfaces: [
      'MemoriaAIWizard',
      'PdfReportDialog',
      'EvidencePackDialog',
      'MaterialComparisonDialog',
      'UpdateAppDialog',
      'manual_usuario.html',
    ],
    engineImprovements: [
      {
        id: 'trace-formula-standard',
        recommendation: 'Return formulaId, standard, inputs, outputs, assumptions, warnings and citationIds for every barrier.',
        impact: 'Each analytic-memory result can be traced to formula, norm and evidence without manual reconstruction.',
        releasePriority: 'P0',
      },
      {
        id: 'unit-normalization',
        recommendation: 'Normalize mm/cm/m, mSv/wk, Gy/wk, uSv/h, density, kg/m2, cost and structural load in one snapshot.',
        impact: 'Prevents silent unit mismatch when comparing material thickness, cost, time and structural load.',
        releasePriority: 'P0',
      },
      {
        id: 'versioned-tvl-hvl',
        recommendation: 'Link every TVL/HVL to document, page, hash, provider and validity note.',
        impact: 'Makes TM Nipoll, concrete HD, Pb, Nelco, VeriShield and custom material choices defensible in reports.',
        releasePriority: 'P1',
      },
      {
        id: 'base-conservative-comparison',
        recommendation: 'Expose base vs conservative check for each barrier.',
        impact: 'Highlights whether primary, leakage, scatter, neutron or point-source assumptions dominate the design.',
        releasePriority: 'P1',
      },
      {
        id: 'safe-cache',
        recommendation: 'Cache by hash of scale, geometry, equipment, material, source, norms and P/T/U/W.',
        impact: 'Improves speed while invalidating correctly when the floorplan or shielding assumptions change.',
        releasePriority: 'P2',
      },
    ],
    barriers,
    decision: blockedCount
      ? 'Calculation output is blocked for signed release until error-level warnings are resolved.'
      : reviewRequiredCount
        ? 'Calculation output may be used for design iteration, but signed reports require review of listed gaps.'
        : 'Calculation governance is ready for release-facing report surfaces.',
  };
}

export function buildF237CalculationEngineGovernanceSection(floorPlan?: FloorPlan): string {
  const gate = buildF237CalculationEngineGovernance(floorPlan);
  return [
    'F237 GOBIERNO DEL MOTOR DE CALCULO',
    `Estado: ${gate.decision}`,
    `Barreras: ${gate.barrierCount} | listas: ${gate.readyCount} | revision: ${gate.reviewRequiredCount} | bloqueadas: ${gate.blockedCount}`,
    `Casos numericos: ${gate.numericCasesReady}/${gate.numericCaseCount}`,
    'Mejoras activas:',
    ...gate.engineImprovements.map((item) => `- ${item.releasePriority} ${item.id}: ${item.impact}`),
    'Superficies requeridas:',
    `- ${gate.requiredSurfaces.join(', ')}`,
  ].join('\n');
}
