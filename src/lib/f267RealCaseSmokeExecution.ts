import { runRealClinicalTrialCases, type RealClinicalTrialResult } from './realClinicalTrialCases';
import { buildF266RealCaseEvidenceKit, type F266DeviationRow } from './f266RealCaseEvidenceKit';

export type F267SmokeStatus = 'pass' | 'operator-input-required' | 'blocked';

export interface F267SmokeCase {
  caseId: string;
  modalityProfile: 'DX' | 'TX' | 'NM';
  scenario: string;
  sourceDocument: string;
  calculatedThickness_mm: number;
  calculatedKerma_mSv_per_wk: number;
  baselineThickness_mm: number;
  tolerancePercent: number;
  differencePercent: number;
  evidenceComplete: boolean;
  openBlockerMajorCount: number;
  status: F267SmokeStatus;
  deviationRows: F266DeviationRow[];
}

export interface F267RealCaseSmokeExecution {
  phase: 'F267';
  schema: 'radshield-mx.real-case-smoke-execution.f267.v1';
  status: 'ready-for-real-case-replacement' | 'blocked';
  generatedAt: string;
  f266Status: string;
  smokeCases: F267SmokeCase[];
  passCount: number;
  operatorInputRequiredCount: number;
  blockedCount: number;
  nextActions: string[];
}

const selectedProfiles = new Set(['DX', 'TX', 'NM']);

function percentDiff(expected: number, actual: number): number {
  if (!Number.isFinite(expected) || expected === 0) return actual === expected ? 0 : Infinity;
  return Math.abs((actual - expected) / expected) * 100;
}

function baselineFor(result: RealClinicalTrialResult): number {
  // F267 is a smoke harness, not clinical validation. Keep the synthetic
  // baseline equal to the engine output so the operator can replace it with a
  // signed analytic memory in the generated CSV.
  return result.selectedThickness_mm;
}

function deviationFor(result: RealClinicalTrialResult, differencePercent: number, tolerancePercent: number): F266DeviationRow {
  const overTolerance = differencePercent > tolerancePercent;
  return {
    caseId: result.id,
    modalityProfile: result.modalityProfile as 'DX' | 'TX' | 'NM',
    sourceDocument: 'synthetic-F264-baseline-replace-with-signed-memory',
    expectedFromSignedMemory: `${baselineFor(result).toFixed(2)} mm`,
    radshieldOutput: `${result.selectedThickness_mm.toFixed(2)} mm`,
    difference: `${differencePercent.toFixed(3)}%`,
    classification: 'calculation',
    severity: overTolerance ? 'major' : 'observation',
    disposition: overTolerance ? 'open' : 'accepted-limitation',
    owner: 'operator',
    evidencePath: `outputs/f267_real_case_smoke_execution/${result.id}.json`,
    notes: overTolerance
      ? 'Synthetic smoke exceeded tolerance; replace baseline and investigate before real release.'
      : 'Synthetic smoke only. Replace expected value with signed memory or measured/professional criterion during real testing.',
  };
}

function buildSmokeCase(result: RealClinicalTrialResult): F267SmokeCase {
  const baselineThickness_mm = baselineFor(result);
  const tolerancePercent = 5;
  const differencePercent = percentDiff(baselineThickness_mm, result.selectedThickness_mm);
  const deviationRows = [deviationFor(result, differencePercent, tolerancePercent)];
  const openBlockerMajorCount = deviationRows.filter((row) =>
    row.disposition === 'open' && (row.severity === 'blocker' || row.severity === 'major')
  ).length;
  const evidenceComplete = result.traceReady && result.citationReady && result.comparisonReady && result.cacheReady && result.errorCount === 0;
  const status: F267SmokeStatus = !evidenceComplete || openBlockerMajorCount > 0
    ? 'blocked'
    : 'operator-input-required';

  return {
    caseId: result.id,
    modalityProfile: result.modalityProfile as 'DX' | 'TX' | 'NM',
    scenario: result.scenario,
    sourceDocument: 'synthetic-F264-baseline-replace-with-signed-memory',
    calculatedThickness_mm: result.selectedThickness_mm,
    calculatedKerma_mSv_per_wk: result.maxKerma_mSv_per_wk,
    baselineThickness_mm,
    tolerancePercent,
    differencePercent,
    evidenceComplete,
    openBlockerMajorCount,
    status,
    deviationRows,
  };
}

export function buildF267RealCaseSmokeExecution(): F267RealCaseSmokeExecution {
  const kit = buildF266RealCaseEvidenceKit();
  const smokeCases = runRealClinicalTrialCases()
    .filter((result) => selectedProfiles.has(result.modalityProfile))
    .reduce<F267SmokeCase[]>((cases, result) => {
      if (cases.some((item) => item.modalityProfile === result.modalityProfile)) return cases;
      return [...cases, buildSmokeCase(result)];
    }, []);
  const passCount = smokeCases.filter((item) => item.status === 'pass').length;
  const operatorInputRequiredCount = smokeCases.filter((item) => item.status === 'operator-input-required').length;
  const blockedCount = smokeCases.filter((item) => item.status === 'blocked').length;

  return {
    phase: 'F267',
    schema: 'radshield-mx.real-case-smoke-execution.f267.v1',
    status: kit.status === 'ready-for-real-case-capture' && blockedCount === 0
      ? 'ready-for-real-case-replacement'
      : 'blocked',
    generatedAt: new Date().toISOString(),
    f266Status: kit.status,
    smokeCases,
    passCount,
    operatorInputRequiredCount,
    blockedCount,
    nextActions: [
      'Replace synthetic baseline values with one signed/prior analytic memory for DX, TX and NM.',
      'Attach canvas, material, calculation trace, Memoria IA, PDF and Evidence Pack outputs per F266.',
      'Classify every mismatch in the F266 deviation CSV before signing clinical/regulatory output.',
      'Keep CY gated until a real cyclotron project with current, target, maze and activation data is available.',
    ],
  };
}

export function summarizeF267RealCaseSmokeExecution(summary = buildF267RealCaseSmokeExecution()): string {
  return [
    'F267 REAL CASE SMOKE EXECUTION',
    `Status: ${summary.status}`,
    `Cases: ${summary.smokeCases.length} | operator input required: ${summary.operatorInputRequiredCount} | blocked: ${summary.blockedCount}`,
    ...summary.smokeCases.map((item) =>
      `- ${item.modalityProfile} ${item.caseId}: ${item.status} thickness=${item.calculatedThickness_mm.toFixed(2)} mm diff=${item.differencePercent.toFixed(3)}%`
    ),
  ].join('\n');
}
