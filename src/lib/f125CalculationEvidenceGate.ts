import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';
import { buildF195CalculationComparisonGate, buildF195CalculationComparisonSection } from './f195CalculationComparisonGate';
import { buildF237CalculationEngineGovernanceSection } from './f237CalculationEngineGovernance';
import { buildF238ToF247ReportSection } from './f238ToF247ReleaseExecution';
import { buildF248ToF250ReportSection } from './f248ToF250ReleaseCandidate';
import { buildF251ToF255HighRiskCadReportSection } from './f251ToF255HighRiskCadGate';
import { buildF256ToF260RoadmapSection } from './f256ToF260NextPhaseRoadmap';
import { buildF257ToF260FullExecutionSection } from './f257ToF260FullExecution';
import { getCanvasEventControllerV2Status } from './canvas/eventControllerV2';
import { summarizeDwgExternalProviderContract } from './dwgExternalProviderGate';
import { summarizeDwgFixtureGate } from './dwgFixtureGate';
import { summarizeDwgProviderSelection } from './dwgProviderSelection';
import { buildApsDwgAdapterPublicSummary } from './dwgApsDesignAutomationContract';
import { summarizeF264RealClinicalTrialGate } from './realClinicalTrialCases';
import { summarizeF268RealAnalyticMemoryIngestion } from './f268RealAnalyticMemoryIngestion';
import { summarizeF268aExternalApiReadiness } from './f268aExternalApiReadiness';
import { summarizeF269OcrCloudAdapterGate } from './f269OcrCloudAdapterGate';
import { summarizeF270ApsDwgFixtureSmoke } from './f270ApsDwgFixtureSmoke';
import { summarizeF271LiteratureDeepDiveGate } from './f271LiteratureDeepDiveGate';
import { summarizeF272ExternalMonteCarloRunnerGate } from './f272ExternalMonteCarloRunnerGate';
import { summarizeF273ToF278LiveIntegrationReadiness } from './f273ToF278LiveIntegrationReadiness';

export type F125EvidenceStatus = 'complete' | 'review-required' | 'missing-result';

export interface F125AuditableCalculationResult {
  id: string;
  barrierId: string;
  barrierName: string;
  formula: string;
  standard: string;
  inputs: string[];
  outputs: string[];
  citation: string;
  evidence: string;
  status: F125EvidenceStatus;
}

export interface F125CalculationEvidenceGate {
  phase: 'F125';
  status: 'implemented-calculation-memory-evidence-gate';
  resultCount: number;
  completeCount: number;
  reviewRequiredCount: number;
  missingResultCount: number;
  comparisonReviewRequiredCount: number;
  comparisonMissingCount: number;
  results: F125AuditableCalculationResult[];
  requiredFields: string[];
  surfaces: string[];
  nextPhase: 'F126';
  decision: string;
}

function inferStandard(floorPlan: FloorPlan | undefined, result: CanvasBarrierResult): string {
  const standards = Array.from(
    new Set((floorPlan?.sources ?? []).map(source => source.modality?.standard || source.modality?.category).filter(Boolean)),
  );
  if (standards.length > 0) return standards.join(' + ');
  const material = result.material.toLowerCase();
  if (material.includes('lead') || material.includes('concrete')) return 'NCRP 147/151 by modality';
  return 'NCRP/AAPM/IAEA/CNSNS routing required';
}

function findSampleLine(sampleLines: CanvasSampleLine[], barrierId: string): CanvasSampleLine | undefined {
  return sampleLines.find(line => line.barrierId === barrierId);
}

function buildResultEvidence(
  floorPlan: FloorPlan | undefined,
  result: CanvasBarrierResult,
  sampleLine: CanvasSampleLine | undefined,
): F125AuditableCalculationResult {
  const standard = inferStandard(floorPlan, result);
  const hasResult = Number.isFinite(result.maxBarrierThickness_mm) && result.maxBarrierThickness_mm > 0;
  const hasSample = Boolean(sampleLine && sampleLine.points.length > 0);
  const status: F125EvidenceStatus = hasResult && hasSample ? 'complete' : hasResult ? 'review-required' : 'missing-result';
  const maxKerma = Number.isFinite(result.maxKermaRate_mGy_per_wk) ? result.maxKermaRate_mGy_per_wk.toFixed(4) : 'N/A';
  const maxThickness = Number.isFinite(result.maxBarrierThickness_mm) ? result.maxBarrierThickness_mm.toFixed(1) : 'N/A';

  return {
    id: `f125-${result.barrierId}`,
    barrierId: result.barrierId,
    barrierName: result.barrierName || result.barrierId,
    formula: 'B = P d^2 / (W U T); thickness = TVL1 + (n - 1) TVLe where applicable',
    standard,
    inputs: [
      `barrier=${result.barrierName || result.barrierId}`,
      `location=${result.location || 'not specified'}`,
      `material=${result.material || 'not specified'}`,
      `samplePoints=${sampleLine?.points.length ?? 0}`,
    ],
    outputs: [
      `maxKerma_mGy_per_wk=${maxKerma}`,
      `maxThickness_mm=${maxThickness}`,
      `lead_mm=${Number.isFinite(result.thicknessLead_mm) ? result.thicknessLead_mm.toFixed(1) : 'N/A'}`,
      `concrete_mm=${Number.isFinite(result.thicknessConcrete_mm) ? result.thicknessConcrete_mm.toFixed(1) : 'N/A'}`,
    ],
    citation: `${standard}; verify final page/section against Evidence Pack before signed issue`,
    evidence: hasSample
      ? `${sampleLine?.points.length ?? 0} sampled point(s), max thickness ${maxThickness} mm, max kerma ${maxKerma} mGy/wk`
      : `No sample-line points linked to ${result.barrierId}; keep as review-required before release`,
    status,
  };
}

export function buildF125CalculationEvidenceGate(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
): F125CalculationEvidenceGate {
  const results = barrierResults.map(result => buildResultEvidence(floorPlan, result, findSampleLine(sampleLines, result.barrierId)));
  const completeCount = results.filter(result => result.status === 'complete').length;
  const reviewRequiredCount = results.filter(result => result.status === 'review-required').length;
  const missingResultCount = results.filter(result => result.status === 'missing-result').length;
  const comparisonGate = buildF195CalculationComparisonGate(floorPlan, barrierResults);

  return {
    phase: 'F125',
    status: 'implemented-calculation-memory-evidence-gate',
    resultCount: results.length,
    completeCount,
    reviewRequiredCount,
    missingResultCount,
    comparisonReviewRequiredCount: comparisonGate.reviewRequiredCount,
    comparisonMissingCount: comparisonGate.missingComparisonCount,
    results,
    requiredFields: ['formula', 'standard', 'inputs', 'outputs', 'citation', 'evidence', 'status'],
    surfaces: ['MemoriaAIWizard', 'EvidencePackDialog', 'PDF report', 'UpdateAppDialog', 'outputs/f125_calculation_evidence_gate.json'],
    nextPhase: 'F126',
    decision:
      'Every calculation result must carry formula, standard, inputs, outputs, citation, evidence, QA status and base-vs-conservative comparison before release-candidate reports are signed.',
  };
}

export function buildF125CalculationEvidenceSection(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
): string {
  const gate = buildF125CalculationEvidenceGate(floorPlan, barrierResults, sampleLines);
  return [
    '8. GATE F125 CALCULO-MEMORIA-EVIDENCIA',
    `   Resultados auditables: ${gate.resultCount}`,
    `   Completos: ${gate.completeCount}`,
    `   Requieren revision: ${gate.reviewRequiredCount}`,
    `   Sin resultado valido: ${gate.missingResultCount}`,
    `   Comparador F195 con revision requerida: ${gate.comparisonReviewRequiredCount}`,
    `   Comparador F195 faltante: ${gate.comparisonMissingCount}`,
    `   Campos obligatorios: ${gate.requiredFields.join(', ')}`,
    ...gate.results.slice(0, 12).map(result => [
      `   - ${result.barrierName} [${result.status}]`,
      `     Formula: ${result.formula}`,
      `     Norma: ${result.standard}`,
      `     Inputs: ${result.inputs.join(' | ')}`,
      `     Outputs: ${result.outputs.join(' | ')}`,
      `     Cita/evidencia: ${result.citation} | ${result.evidence}`,
    ].join('\n')),
    buildF195CalculationComparisonSection(floorPlan, barrierResults),
    buildF237CalculationEngineGovernanceSection(floorPlan),
    buildF238ToF247ReportSection(),
    buildF248ToF250ReportSection(),
    buildF251ToF255HighRiskCadReportSection(),
    buildF256ToF260RoadmapSection(),
    buildF257ToF260FullExecutionSection(),
    `F258 Event controller v2 enabled: ${getCanvasEventControllerV2Status().enabled ? 'yes' : 'no'}; rollback: ${getCanvasEventControllerV2Status().rollback}`,
    summarizeDwgExternalProviderContract(),
    summarizeDwgProviderSelection(),
    summarizeDwgFixtureGate(),
    buildApsDwgAdapterPublicSummary('adapter-ready-waiting-for-credentials-and-fixtures'),
    summarizeF264RealClinicalTrialGate(),
    summarizeF268RealAnalyticMemoryIngestion(),
    summarizeF268aExternalApiReadiness(),
    summarizeF269OcrCloudAdapterGate(),
    summarizeF270ApsDwgFixtureSmoke(),
    summarizeF271LiteratureDeepDiveGate(),
    summarizeF272ExternalMonteCarloRunnerGate(),
    summarizeF273ToF278LiveIntegrationReadiness(),
    `   Decision: ${gate.decision}`,
  ].join('\n');
}
