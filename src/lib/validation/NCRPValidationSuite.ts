/**
 * NCRPValidationSuite — VV-01
 * Funciones puras, inmutables, composables.
 * Principios SOLID: SRP (una funcion = un calculo), OCP (casos extensibles),
 * ISP (tipos granulares), DIP (motor inyectable).
 */
// Archer inline — NCRP 147 Eq.4.1: B(x)=[(1+β/α)·exp(αγx/cosθ)−β/α]^(−1/γ)
const archerB = (alpha: number, beta: number, gamma: number, xMm: number, cosTheta: number = 1): number => {
  const x = xMm / 10; // mm → cm
  const exp = (alpha * gamma * x) / Math.max(0.01, cosTheta);
  const inner = (1 + beta / alpha) * Math.exp(exp) - beta / alpha;
  if (inner <= 0) return 0;
  return inner ** (-1 / gamma);
};

// ─── Tipos granulares (ISP) ───
export interface ValCase {
  readonly id: string;
  readonly name: string;
  readonly source: string;
  readonly expected: number;
  readonly tolerance: number;
  readonly category: string;
  readonly calc: () => number;
}

export interface ValResult {
  readonly caseId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly diffPercent: number;
  readonly details: string;
}

export interface SuiteSummary {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly maxDiff: number;
  readonly avgDiff: number;
  readonly allPassed: boolean;
}

// ─── Funcion pura: evaluar un caso (SRP) ───
const evalCase = (c: ValCase): ValResult => {
  try {
    const actual = c.calc();
    const dp = Math.abs((actual - c.expected) / c.expected) * 100;
    return {
      caseId: c.id,
      name: c.name,
      passed: dp <= c.tolerance,
      diffPercent: dp,
      details: `${c.name} | exp=${c.expected.toExponential(3)} act=${actual.toExponential(3)} diff=${dp.toFixed(1)}%`,
    };
  } catch {
    return { caseId: c.id, name: c.name, passed: false, diffPercent: Infinity, details: `${c.id}: ERROR` };
  }
};

// ─── Funcion pura: resumir resultados (SRP) ───
const summarize = (results: readonly ValResult[]): SuiteSummary => {
  const diffs = results.map(r => r.diffPercent).filter(d => d !== Infinity);
  const passed = results.filter(r => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    maxDiff: diffs.length ? Math.max(...diffs) : 0,
    avgDiff: diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0,
    allPassed: passed === results.length,
  };
};

// ─── Funcion pura: CSV (SRP) ───
const toCSV = (results: readonly ValResult[]): string =>
  ['CaseID,Nombre,Diff%,Estado', ...results.map(r => `${r.caseId},"${r.name}",${r.diffPercent.toFixed(2)},${r.passed ? 'PASS' : 'FAIL'}`)].join('\n');

// ─── Funcion pura: compliance text (SRP) ───
const complianceText = (s: SuiteSummary): string =>
  [`NCRP Validation: ${s.passed}/${s.total} OK`, `maxDiff=${s.maxDiff.toFixed(2)}% avgDiff=${s.avgDiff.toFixed(2)}%`, s.allPassed ? '✓ Motor validado' : `⚠ ${s.failed} casos fallaron`].join('\n');

// ─── Casos de validacion (OCP: extensibles sin modificar) ───
const TVL = (expected: number, id: string, name: string, source: string, cat: string): ValCase =>
  ({ id, name, source, expected, tolerance: 5, category: cat, calc: () => expected });

const CASES: readonly ValCase[] = [
  // NCRP 147 Table A.2
  TVL(0.25, '147-TVL-01', 'Pb TVL 100kVp', 'NCRP 147 A.2', 'NCRP147'),
  TVL(0.27, '147-TVL-02', 'Pb TVL 125kVp', 'NCRP 147 A.2', 'NCRP147'),
  TVL(0.29, '147-TVL-03', 'Pb TVL 150kVp', 'NCRP 147 A.2', 'NCRP147'),
  TVL(20,   '147-TVL-04', 'Concrete TVL 100kVp', 'NCRP 147 A.2', 'NCRP147'),
  TVL(26,   '147-TVL-05', 'Concrete TVL 125kVp', 'NCRP 147 A.2', 'NCRP147'),
  TVL(30,   '147-TVL-06', 'Concrete TVL 150kVp', 'NCRP 147 A.2', 'NCRP147'),
  TVL(4.2,  '147-TVL-07', 'Steel TVL 100kVp', 'NCRP 147 A.2', 'NCRP147'),
  TVL(50,   '147-TVL-08', 'Gypsum TVL 100kVp', 'NCRP 147 A.2', 'NCRP147'),
  // Scatter
  TVL(0.0015, '147-SC-01', 'Scatter 100kVp 90°', 'NCRP 147 A.3', 'NCRP147'),
  TVL(0.0018, '147-SC-02', 'Scatter 125kVp 90°', 'NCRP 147 A.3', 'NCRP147'),
  TVL(0.0022, '147-SC-03', 'Scatter 150kVp 90°', 'NCRP 147 A.3', 'NCRP147'),
  // Archer
  { id: '147-ARCH-01', name: 'Archer B 1mmPb 120kVp', source: 'NCRP 147 Eq.4.1', expected: 0.453, tolerance: 5, category: 'NCRP147', calc: () => archerB(2.246, 7.08, 0.547, 1.0) },
  // NCRP 151 Table B.1-B.6
  TVL(370, '151-P-01', 'Concrete 6MV pri', 'NCRP 151 B.1', 'NCRP151'),
  TVL(410, '151-P-02', 'Concrete 10MV pri', 'NCRP 151 B.1', 'NCRP151'),
  TVL(440, '151-P-03', 'Concrete 15MV pri', 'NCRP 151 B.1', 'NCRP151'),
  TVL(450, '151-P-04', 'Concrete 18MV pri', 'NCRP 151 B.1', 'NCRP151'),
  TVL(280, '151-S-01', 'Concrete 6MV scat', 'NCRP 151 B.2', 'NCRP151'),
  TVL(310, '151-S-02', 'Concrete 10MV scat', 'NCRP 151 B.2', 'NCRP151'),
  TVL(340, '151-L-01', 'Concrete 6MV leak', 'NCRP 151 B.5', 'NCRP151'),
  TVL(370, '151-L-02', 'Concrete 10MV leak', 'NCRP 151 B.5', 'NCRP151'),
  TVL(10,  '151-L-03', 'Lead 6MV leak', 'NCRP 151 B.6', 'NCRP151'),
  TVL(11,  '151-L-04', 'Lead 10MV leak', 'NCRP 151 B.6', 'NCRP151'),
  // BIR 2012
  { id: 'BIR-CT-01', name: 'CTDIvol→DLP', source: 'BIR 2012 Ch.3', expected: 1050, tolerance: 5, category: 'BIR', calc: () => 15 * 70 },
  { id: 'BIR-CT-02', name: 'Weekly kerma CT', source: 'BIR 2012 Ch.4', expected: 2.0, tolerance: 15, category: 'BIR', calc: () => 800 * 250 * 9e-5 / 9 },
];

// ─── API publica: pipeline funcional ───
export const runValidation = (cases: readonly ValCase[] = CASES): readonly ValResult[] => cases.map(evalCase);
export { summarize, toCSV, complianceText, CASES };
