import { describe, it, expect } from 'vitest';
import { findScanner, getKappa, getByBrand, getAllBrands, calculateCTShielding, getAllScanners } from '../ct/CTScatterDatabase';

const t = (fn: () => void): number => { const t0 = performance.now(); fn(); return performance.now() - t0; };

describe('CTScatterDatabase', () => {
  it('findScanner exacto', () => {
    const s = findScanner('Revolution CT');
    expect(s).toBeDefined();
    expect(s!.brand).toBe('GE');
  });

  it('findScanner partial match', () => {
    expect(findScanner('Force')!.brand).toBe('Siemens');
  });

  it('findScanner no existente = undefined', () => {
    expect(findScanner('NoExiste')).toBeUndefined();
  });

  it('getKappa interpola 115kVp entre 100 y 125', () => {
    const s = findScanner('Revolution CT')!;
    const k = getKappa(s, 115);
    expect(k).toBeGreaterThan(s.kappa100);
    expect(k).toBeLessThan(s.kappa125);
  });

  it('getAllBrands = 4', () => expect(getAllBrands()).toHaveLength(4));
  it('getByBrand(GE) = 4', () => expect(getByBrand('GE')).toHaveLength(4));
  it('getAllScanners = 16', () => expect(getAllScanners()).toHaveLength(16));

  it('calculateCTShielding', () => {
    const s = findScanner('Revolution CT')!;
    const r = calculateCTShielding({
      scanner: s, kVp: 120, patientsPerWeek: 50,
      avgDlp_mGycm: 800, distanceM: 3, designGoal_uSv: 100,
    });
    expect(r.weeklyKerma_uSv).toBeGreaterThan(0);
    expect(typeof r.passes).toBe('boolean');
  });

  it('lookup: 10000x en <10ms', () => {
    const ms = t(() => { for (let i = 0; i < 10000; i++) findScanner('Revolution CT'); });
    console.log(`  10000x findScanner: ${ms.toFixed(3)}ms`);
    expect(ms).toBeLessThan(10);
  });
});
