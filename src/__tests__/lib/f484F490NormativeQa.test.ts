import { describe, expect, it } from 'vitest';
import {
  F484_F490_QA_CASES,
  buildF484F490NormativeQa,
  evaluateF484F490QaCase,
  formatF484F490NormativeQaMarkdown,
} from '@/lib/f484F490NormativeQa';

describe('F484-F490 normative calculation QA', () => {
  it('builds a passable beta QA gate across NCRP/IAEA/UAQ modalities', () => {
    const contract = buildF484F490NormativeQa();

    expect(contract.schema).toBe('radshield-mx.calc.normative-qa.f484-f490.v1');
    expect(contract.status).toBe('qa-pass');
    expect(contract.summary.totalCases).toBeGreaterThanOrEqual(6);
    expect(contract.summary.reviewCases).toBe(0);
    expect(contract.summary.standardsCovered).toEqual(expect.arrayContaining(['NCRP151', 'NCRP147', 'IAEA-SRS47', 'UAQ', 'AAPM-TG108']));
    expect(contract.releaseGate.requiredBeforeClinicalUse.join(' ')).toContain('qualified medical physicist');
  });

  it('evaluates every fixture within tolerance and preserves citations', () => {
    const results = F484_F490_QA_CASES.map(evaluateF484F490QaCase);

    expect(results.every((result) => result.status === 'pass')).toBe(true);
    expect(results.every((result) => result.citationIds.length > 0)).toBe(true);
    expect(results.map((result) => result.phase)).toEqual(expect.arrayContaining(['F484', 'F485', 'F486', 'F487', 'F488', 'F489']));
  });

  it('documents the heavy asset route separately from calculation QA', () => {
    const markdown = formatF484F490NormativeQaMarkdown();

    expect(markdown).toContain('F484-F490 MOTOR CALCULO QA NCRP/IAEA/UAQ');
    expect(markdown).toContain('public/medical3d/photoreal');
    expect(markdown).toContain('public/unity/radshield-medical-3d');
    expect(markdown).toContain('Antes de uso clinico');
  });
});
