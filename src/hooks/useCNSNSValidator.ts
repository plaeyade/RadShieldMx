import type { Barrier } from '@/types/radshield';

export interface CNSNSLimitCheck {
  barrierName: string;
  maxKerma_mSv: number;
  designGoal_mSv: number;
  occupancyFactor: number;
  actualLimit_mSv: number;
  isCompliant: boolean;
  severity: 'pass' | 'warning' | 'fail';
  message: string;
}

const CNSNS_LIMITS = {
  public: 0.02,
  occupational: 0.4,
  controlled: 0.1,
};

export function validateCNSNSLimits(barriers: Barrier[]): CNSNSLimitCheck[] {
  return barriers.map(b => {
    const kerma = b.maxKerma || 0;
    const goal = b.designGoal_mSv_per_wk || 0.02;
    const occ = b.occupancyFactor || 1;
    const actualLimit = occ > 0.5 ? CNSNS_LIMITS.occupational : occ > 0.2 ? CNSNS_LIMITS.controlled : CNSNS_LIMITS.public;
    const isCompliant = kerma <= actualLimit;
    const ratio = kerma / actualLimit;
    const severity = ratio <= 1 ? 'pass' : ratio <= 1.5 ? 'warning' : 'fail';
    const messages: Record<string, string> = {
      pass: `Dosis ${kerma.toFixed(4)} mSv/sem <= limite ${actualLimit} mSv/sem`,
      warning: `Dosis ${kerma.toFixed(4)} mSv/sem excede limite ${actualLimit} mSv/sem en ${((ratio - 1) * 100).toFixed(1)}%`,
      fail: `Dosis ${kerma.toFixed(4)} mSv/sem CRITICA: excede ${actualLimit} mSv/sem por ${((ratio - 1) * 100).toFixed(1)}%`,
    };
    return { barrierName: b.name, maxKerma_mSv: kerma, designGoal_mSv: goal, occupancyFactor: occ, actualLimit_mSv: actualLimit, isCompliant, severity, message: messages[severity] };
  });
}

export function getOverallCompliance(checks: CNSNSLimitCheck[]): { allPass: boolean; passCount: number; failCount: number; worstBarrier: string | null } {
  const passCount = checks.filter(c => c.severity === 'pass').length;
  const failCount = checks.filter(c => c.severity === 'fail').length;
  const worst = checks.filter(c => c.severity === 'fail').sort((a, b) => b.maxKerma_mSv / b.actualLimit_mSv - a.maxKerma_mSv / a.actualLimit_mSv)[0];
  return { allPass: failCount === 0, passCount, failCount, worstBarrier: worst?.barrierName || null };
}
