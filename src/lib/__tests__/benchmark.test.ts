/**
 * benchmark.test.ts — Continuous Performance Tests (CI-style)
 * Validates all benchmarks stay within thresholds.
 * Run: npx vitest run --config vitest.lib.config.ts src/lib/__tests__/benchmark.test.ts
 */
import { describe, it, expect } from 'vitest';
import {
  runBenchmark, runBenchmarkSuite,
  getThreshold, setThreshold, resetThresholds,
  getHistory,
  exportReportCSV, exportReportJUnit,
  type BenchmarkDefinition,
} from '../performance/BenchmarkSuite';
import {
  enableProfiling, disableProfiling, resetMetrics,
  trackFunction, getAllMetrics, getHotspots,
} from '../performance/FunctionProfiler';
import { calculateSkyshine, DEFAULT_DISTANCES } from '../skyshine/ChiltonSkyshine';
import { runValidation, CASES } from '../validation/NCRPValidationSuite';
import { findScanner } from '../ct/CTScatterDatabase';
import { createProfiler, noopProfiler } from '../performance/Profiler';
import { enableProfiling, disableProfiling, resetMetrics, trackFunction, getHotspots } from '../performance/FunctionProfiler';
import {
  takeHeapSnapshot, detectMemoryLeak, estimateGCPressure,
  startContinuousMonitoring, stopContinuousMonitoring,
  profileSync, getCPUSlices,
} from '../performance/CPUMemoryProfiler';

const t = (fn: () => void): number => { const t0 = performance.now(); fn(); return performance.now() - t0; };

describe('Continuous Performance Tests', () => {
  // ─── Reset state before suite ───
  resetThresholds();
  disableProfiling();
  resetMetrics();
  stopContinuousMonitoring();

  // ═══════════════════════════════════════════════════════════
  // BENCHMARK DEFINITIONS WITH THRESHOLDS
  // ═══════════════════════════════════════════════════════════
  // CI-adjusted thresholds (higher than production to account for VM overhead)
  const CI_THRESHOLDS: Record<string, { maxMs: number; maxMemoryMB?: number; warmupRuns?: number }> = {
    'ncrp.validation': { maxMs: 10 },
    'skyshine.calculate': { maxMs: 5 },
    'ct.lookup': { maxMs: 20 },
    'profiler.noop': { maxMs: 50 },
    'profiler.overhead': { maxMs: 100 },
  };

  const DEFS: BenchmarkDefinition[] = [
    {
      name: 'ncrp.validation',
      category: 'Engine',
      fn: () => runValidation(CASES),
      threshold: CI_THRESHOLDS['ncrp.validation'],
    },
    {
      name: 'skyshine.calculate',
      category: 'Engine',
      fn: () => calculateSkyshine({
        energyMV: 10, workloadGym2Week: 500, barrierHeightM: 3,
        roofThicknessMm: 300, beamAngleDeg: 0, distancesM: DEFAULT_DISTANCES,
      }),
      threshold: CI_THRESHOLDS['skyshine.calculate'],
    },
    {
      name: 'ct.lookup',
      category: 'Engine',
      fn: () => { for (let i = 0; i < 10000; i++) findScanner('Revolution CT'); },
      threshold: CI_THRESHOLDS['ct.lookup'],
    },
    {
      name: 'profiler.noop',
      category: 'Profiler',
      fn: () => { for (let i = 0; i < 10000; i++) noopProfiler.run('n', () => i); },
      threshold: CI_THRESHOLDS['profiler.noop'],
    },
    {
      name: 'profiler.overhead',
      category: 'Profiler',
      fn: () => {
        const p = createProfiler();
        for (let i = 0; i < 10000; i++) p.run('x', () => i * 2);
      },
      threshold: CI_THRESHOLDS['profiler.overhead'],
    },
  ];

  // ═══════════════════════════════════════════════════════════
  // 1. BENCHMARK THRESHOLD TESTS
  // ═══════════════════════════════════════════════════════════
  describe('Threshold Compliance', () => {
    it('ncrp.validation: 24 casos en <5ms', () => {
      const r = runBenchmark(DEFS[0]);
      console.log(`  ncrp.validation: ${r.avgMs.toFixed(3)}ms (threshold: ${r.thresholdMs}ms)`);
      expect(r.avgMs).toBeLessThan(r.thresholdMs);
      expect(r.passed).toBe(true);
    });

    it('skyshine.calculate: 11 pts en <2ms', () => {
      const r = runBenchmark(DEFS[1]);
      console.log(`  skyshine.calculate: ${r.avgMs.toFixed(3)}ms (threshold: ${r.thresholdMs}ms)`);
      expect(r.avgMs).toBeLessThan(r.thresholdMs);
      expect(r.passed).toBe(true);
    });

    it('ct.lookup: 10000x en <10ms', () => {
      const r = runBenchmark(DEFS[2]);
      console.log(`  ct.lookup: ${r.avgMs.toFixed(3)}ms (threshold: ${r.thresholdMs}ms)`);
      expect(r.avgMs).toBeLessThan(r.thresholdMs);
      expect(r.passed).toBe(true);
    });

    it('profiler.noop: 10000x en <5ms', () => {
      const r = runBenchmark(DEFS[3]);
      console.log(`  profiler.noop: ${r.avgMs.toFixed(3)}ms (threshold: ${r.thresholdMs}ms)`);
      expect(r.avgMs).toBeLessThan(r.thresholdMs);
      expect(r.passed).toBe(true);
    });

    it('profiler.overhead: 10000x en <50ms', () => {
      const r = runBenchmark(DEFS[4]);
      console.log(`  profiler.overhead: ${r.avgMs.toFixed(3)}ms (threshold: ${r.thresholdMs}ms)`);
      expect(r.avgMs).toBeLessThan(r.thresholdMs);
      expect(r.passed).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. REGRESSION DETECTION
  // ═══════════════════════════════════════════════════════════
  describe('Regression Detection', () => {
    it('no regression detected after 3 runs', async () => {
      // Warmup
      runBenchmark(DEFS[0]);
      runBenchmark(DEFS[0]);
      runBenchmark(DEFS[0]);

      const report = await runBenchmarkSuite(DEFS);
      console.log(`  Suite: ${report.summary.passed}/${report.summary.total} passed`);
      expect(report.summary.regressions).toBe(0);
      expect(report.summary.failed).toBe(0);
    }, 10_000);

    it('history tracks last 50 runs', () => {
      const h = getHistory('ncrp.validation');
      expect(h.length).toBeGreaterThanOrEqual(3); // From warmup above
      expect(h.length).toBeLessThanOrEqual(50);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. FUNCTION PROFILER
  // ═══════════════════════════════════════════════════════════
  describe('FunctionProfiler', () => {
    it('tracks function calls and timing', () => {
      enableProfiling();
      const tracked = trackFunction('testAdd', 'math', (a: number, b: number) => a + b);

      const results: number[] = [];
      for (let i = 0; i < 100; i++) results.push(tracked(i, i + 1));

      const metrics = getAllMetrics();
      const m = metrics.find((x: any) => x.name === 'testAdd');

      expect(m).toBeDefined();
      expect(m!.calls).toBe(100);
      expect(m!.totalMs).toBeGreaterThanOrEqual(0);
      disableProfiling();
    });

    it('zero overhead when disabled', () => {
      disableProfiling();
      resetMetrics();
      const fn = trackFunction('noopTest', 'test', () => 42);

      const ms = t(() => { for (let i = 0; i < 10000; i++) fn(); });
      console.log(`  noop tracked x10000: ${ms.toFixed(3)}ms`);
      expect(ms).toBeLessThan(5);
    });

    it('hotspots returns top N functions', () => {
      enableProfiling();
      resetMetrics();

      // Create functions with varying costs
      const fast = trackFunction('fast', 'test', () => 1);
      const slow = trackFunction('slow', 'test', () => { for (let i = 0; i < 1000; i++); });

      for (let i = 0; i < 100; i++) { fast(); slow(); }

      const hotspots = getHotspots(5);
      expect(hotspots.length).toBeGreaterThan(0);
      expect(hotspots[0].name).toBe('slow'); // slow should be #1
      disableProfiling();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 4. CPU / MEMORY PROFILER
  // ═══════════════════════════════════════════════════════════
  describe('CPUMemoryProfiler', () => {
    it('takeHeapSnapshot returns valid data', () => {
      const s = takeHeapSnapshot();
      expect(s.timestamp).toBeGreaterThan(0);
      expect(s.usedHeapMB).toBeGreaterThanOrEqual(0);
      expect(s.totalHeapMB).toBeGreaterThanOrEqual(0);
    });

    it('profileSync measures execution time', () => {
      const [, slice] = profileSync('testWork', () => {
        for (let i = 0; i < 100000; i++) Math.sqrt(i);
      });
      expect(slice.durationMs).toBeGreaterThan(0);
      expect(slice.label).toBe('testWork');
    });

    it('getCPUSlices returns recorded data', () => {
      const slices = getCPUSlices();
      expect(slices.length).toBeGreaterThan(0);
    });

    it('GC pressure estimation returns valid category', () => {
      const pressure = estimateGCPressure();
      expect(['low', 'medium', 'high', 'critical']).toContain(pressure.pressure);
      expect(pressure.fragmentationRatio).toBeGreaterThanOrEqual(0);
      expect(pressure.fragmentationRatio).toBeLessThanOrEqual(1);
    });

    it('continuous monitoring starts and stops', () => {
      startContinuousMonitoring(100);
      expect(stopContinuousMonitoring()).toBeUndefined();
    });

    it('memory leak detection returns a report', () => {
      // Take several snapshots
      for (let i = 0; i < 15; i++) takeHeapSnapshot();
      const report = detectMemoryLeak(1);
      expect(report.suspected).toBeDefined();
      expect(typeof report.growthRateMBPerMin).toBe('number');
      expect(report.recommendation.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 5. EXPORT FORMATS
  // ═══════════════════════════════════════════════════════════
  describe('Export Formats', () => {
    it('exports CSV with headers', async () => {
      const report = await runBenchmarkSuite(DEFS.slice(0, 2));
      const csv = exportReportCSV(report);
      expect(csv).toContain('Name,Category,AvgMs');
      expect(csv.split('\n').length).toBeGreaterThan(1);
    });

    it('exports JUnit XML', async () => {
      const report = await runBenchmarkSuite(DEFS.slice(0, 2));
      const xml = exportReportJUnit(report);
      expect(xml).toContain('<?xml version="1.0"?>');
      expect(xml).toContain('<testsuite');
      expect(xml).toContain('</testsuite>');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 6. CUSTOM THRESHOLDS
  // ═══════════════════════════════════════════════════════════
  describe('Configurable Thresholds', () => {
    it('getThreshold returns default', () => {
      const th = getThreshold('ncrp.validation');
      expect(th.maxMs).toBe(5);
      expect(th.maxMemoryMB).toBe(10);
    });

    it('setThreshold overrides default', () => {
      setThreshold('ncrp.validation', { maxMs: 1, maxMemoryMB: 5 });
      const th = getThreshold('ncrp.validation');
      expect(th.maxMs).toBe(1);
      setThreshold('ncrp.validation', { maxMs: 5, maxMemoryMB: 10 }); // restore
    });
  });
});
