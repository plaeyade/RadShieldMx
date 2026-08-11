import type { F646F650RendererSelectionTransaction } from '@/lib/f646F650RendererSelectionTransaction';

export interface F651LegacySelectionExpectation {
  phase: 'F651';
  expectedSelectedId: string | null;
  expectedSelectedIds: string[];
  source: 'transaction-after' | 'legacy-before' | 'none';
}

export interface F652ActivationComparison {
  phase: 'F652';
  selectionMatches: boolean;
  rollbackMatches: boolean;
  operationSupported: boolean;
  evidence: string;
}

export interface F653ActivationRisk {
  phase: 'F653';
  level: 'low' | 'medium' | 'high';
  reasons: string[];
}

export interface F654ActivationQaGate {
  id: string;
  phase: 'F654' | 'F655';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F651F655RendererActivationQa {
  schema: 'radshield-mx.canvas.renderer-activation-qa.f651-f655.v1';
  phaseRange: 'F651-F655';
  status: 'activation-qa-ready' | 'activation-qa-preview' | 'activation-qa-blocked';
  expectation: F651LegacySelectionExpectation;
  comparison: F652ActivationComparison;
  risk: F653ActivationRisk;
  gates: F654ActivationQaGate[];
  metrics: {
    passCount: number;
    gateCount: number;
    riskScore: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'keep-preview' | 'eligible-for-flagged-e2e' | 'blocked';
    reason: string;
  };
  rollback: string[];
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export function buildF651F655RendererActivationQa(
  transaction: F646F650RendererSelectionTransaction,
  options: { highRiskRendererEnabled?: boolean; legacyE2eObserved?: boolean } = {},
): F651F655RendererActivationQa {
  const expectedSelectedIds = transaction.snapshot.changed
    ? transaction.snapshot.afterSelectedIds
    : transaction.snapshot.beforeSelectedIds;
  const expectation: F651LegacySelectionExpectation = {
    phase: 'F651',
    expectedSelectedId: transaction.snapshot.changed ? transaction.snapshot.afterSelectedId : transaction.snapshot.beforeSelectedId,
    expectedSelectedIds,
    source: transaction.snapshot.changed ? 'transaction-after' : transaction.snapshot.beforeSelectedIds.length ? 'legacy-before' : 'none',
  };
  const selectionMatches = transaction.snapshot.changed
    ? sameIds(transaction.snapshot.afterSelectedIds, expectation.expectedSelectedIds)
    : sameIds(transaction.snapshot.beforeSelectedIds, expectation.expectedSelectedIds);
  const rollbackMatches = transaction.rollbackToken.canRollback
    && sameIds(transaction.rollbackToken.restoresSelectedIds, transaction.snapshot.beforeSelectedIds)
    && transaction.rollbackToken.restoresSelectedId === transaction.snapshot.beforeSelectedId;
  const operationSupported = ['select-preview', 'noop-preview'].includes(transaction.draft.operation);
  const comparison: F652ActivationComparison = {
    phase: 'F652',
    selectionMatches,
    rollbackMatches,
    operationSupported,
    evidence: `selection=${selectionMatches ? 'match' : 'mismatch'}; rollback=${rollbackMatches ? 'match' : 'mismatch'}; operation=${transaction.draft.operation}`,
  };

  const riskReasons: string[] = [];
  if (!operationSupported) riskReasons.push('Operacion no soportada para activacion controlada.');
  if (!rollbackMatches) riskReasons.push('Rollback token no restaura snapshot before.');
  if (!options.legacyE2eObserved) riskReasons.push('Falta E2E con click legacy observado.');
  if (options.highRiskRendererEnabled) riskReasons.push('Flag alto riesgo activo; requiere smoke antes/despues.');
  const riskScore = riskReasons.length;
  const risk: F653ActivationRisk = {
    phase: 'F653',
    level: riskScore >= 3 ? 'high' : riskScore >= 1 ? 'medium' : 'low',
    reasons: riskReasons.length ? riskReasons : ['Ruta candidata: faltaria solo activar bajo flag y repetir E2E.'],
  };

  const gates: F654ActivationQaGate[] = [
    {
      id: 'f654-transaction-ready',
      phase: 'F654',
      label: 'Transaccion F646 disponible',
      pass: transaction.status !== 'selection-transaction-blocked',
      evidence: transaction.status,
    },
    {
      id: 'f654-selection-consistent',
      phase: 'F654',
      label: 'Seleccion consistente',
      pass: comparison.selectionMatches,
      evidence: comparison.evidence,
    },
    {
      id: 'f654-rollback-consistent',
      phase: 'F654',
      label: 'Rollback consistente',
      pass: comparison.rollbackMatches,
      evidence: transaction.rollbackToken.token,
    },
    {
      id: 'f655-legacy-e2e-required',
      phase: 'F655',
      label: 'E2E legacy requerido',
      pass: options.legacyE2eObserved === true,
      evidence: options.legacyE2eObserved ? 'E2E legacy observado.' : 'Aun no se ejecuta click legacy real; mantener preview.',
    },
  ];
  const blocked = gates.slice(0, 3).some((gate) => !gate.pass);
  const ready = !blocked && gates.every((gate) => gate.pass) && options.highRiskRendererEnabled === true;
  const status = blocked ? 'activation-qa-blocked' : ready ? 'activation-qa-ready' : 'activation-qa-preview';
  const passCount = gates.filter((gate) => gate.pass).length;
  const recommendation = blocked
    ? 'blocked'
    : options.legacyE2eObserved
      ? 'eligible-for-flagged-e2e'
      : 'keep-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-activation-qa.f651-f655.v1',
    phaseRange: 'F651-F655',
    status,
    expectation,
    comparison,
    risk,
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      riskScore,
      cacheKey: `f651-${stableHash(`${transaction.metrics.cacheKey}:${comparison.evidence}:${risk.level}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'eligible-for-flagged-e2e'
        ? 'Puede probarse bajo feature flag con E2E antes/despues.'
        : recommendation === 'blocked'
          ? 'No activar: revisar transaccion, seleccion o rollback.'
          : 'Mantener preview hasta observar click legacy real en E2E.',
    },
    rollback: [
      'Mantener F646-F650 en preview y no activar owner de eventos.',
      'Repetir E2E legacy antes de habilitar seleccion profunda bajo flag.',
      'Si hay mismatch, volver a F641-F645 dry-run y revisar target/capa.',
    ],
  };
}
