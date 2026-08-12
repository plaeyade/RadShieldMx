import { buildF671F675RendererPredictionAlignment } from '../src/lib/f671F675RendererPredictionAlignment.ts';
import { buildF676F680RendererOwnerSmoke } from '../src/lib/f676F680RendererOwnerSmoke.ts';

function stabilizerFixture({ sampled = true, expected = 'f442:barrier:wall-east', settled = null } = {}) {
  const settledIds = settled ? [settled] : [];
  return {
    schema: 'radshield-mx.canvas.renderer-selection-stabilizer.f666-f670.v1',
    phaseRange: 'F666-F670',
    status: settled ? 'selection-stabilizer-ready' : 'selection-stabilizer-preview',
    sample: { phase: 'F666', sampled, selectedId: settled, selectedIds: settledIds, sampleDelayMs: 80, evidenceId: 'fixture' },
    review: {
      phase: 'F667',
      expectedSelectedId: expected,
      expectedSelectedIds: [expected],
      settledSelectedId: settled,
      settledSelectedIds: settledIds,
      matchesPrediction: expected === settled,
      evidence: `expected ${expected} / settled ${settled ?? 'none'}`,
    },
    guard: {
      phase: 'F668',
      clickObserved: true,
      selectionStable: settledIds.length > 0,
      ownerPreserved: true,
      geometryMutationObserved: false,
      evidence: settled ? 'Seleccion legacy estabilizada despues del click.' : 'Click observado pero seleccion legacy aun no estabiliza.',
    },
    gates: [],
    metrics: { passCount: settled ? 6 : 4, gateCount: 6, settledCount: settledIds.length, cacheKey: `fixture-${settled ?? 'none'}` },
    decision: { recommendation: settled ? 'eligible-for-owner-smoke' : 'keep-preview', reason: 'fixture' },
    rollback: [],
  };
}

const missing = buildF671F675RendererPredictionAlignment(stabilizerFixture());
const exact = buildF671F675RendererPredictionAlignment(stabilizerFixture({ settled: 'f442:barrier:wall-east' }));
const alias = buildF671F675RendererPredictionAlignment(stabilizerFixture({ expected: 'f442:barrier:wall-east', settled: 'wall-east' }));
const blockedSmoke = buildF676F680RendererOwnerSmoke(missing);
const previewSmoke = buildF676F680RendererOwnerSmoke(exact, { highRiskRendererEnabled: true });
const readySmoke = buildF676F680RendererOwnerSmoke(exact, { highRiskRendererEnabled: true, beforeAfterSmokePassed: true });

const failures = [];
const expect = (label, condition) => { if (!condition) failures.push(label); };

expect('missing review', missing.status === 'prediction-alignment-review');
expect('missing diagnosis', missing.diagnosis.alignment === 'missing-selection');
expect('exact ready', exact.status === 'prediction-alignment-ready');
expect('alias ready', alias.status === 'prediction-alignment-ready' && alias.diagnosis.alignment === 'alias-match');
expect('blocked smoke', blockedSmoke.status === 'owner-smoke-blocked');
expect('preview smoke', previewSmoke.status === 'owner-smoke-preview');
expect('ready smoke', readySmoke.status === 'owner-smoke-ready');
expect('ready recommendation', readySmoke.decision.recommendation === 'run-flagged-owner-smoke');
expect('cache prefixes', exact.metrics.cacheKey.startsWith('f671-') && readySmoke.metrics.cacheKey.startsWith('f676-'));

if (failures.length) {
  console.error(`F671-F680 renderer alignment/owner smoke values failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`[F671-F680] Alignment/owner smoke values OK (missing ${missing.metrics.passCount}/${missing.metrics.gateCount}; exact ${exact.metrics.passCount}/${exact.metrics.gateCount}; smoke ${readySmoke.metrics.passCount}/${readySmoke.metrics.gateCount}).`);
