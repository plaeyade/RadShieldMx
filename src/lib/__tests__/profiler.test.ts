import { describe, it, expect } from 'vitest';
import { createProfiler, noopProfiler } from '../performance/Profiler';

const t = (fn: () => void): number => { const t0 = performance.now(); fn(); return performance.now() - t0; };

describe('Profiler', () => {
  it('createProfiler tiene 4 metodos', () => {
    const p = createProfiler();
    expect(p.run).toBeTypeOf('function');
    expect(p.report).toBeTypeOf('function');
    expect(p.top).toBeTypeOf('function');
    expect(p.export).toBeTypeOf('function');
  });

  it('run retorna valor correcto', () => {
    expect(createProfiler().run('add', () => 2 + 2)).toBe(4);
  });

  it('report: 2 calls, datos correctos', () => {
    const p = createProfiler();
    p.run('x', () => { for (let i = 0; i < 1000; i++); });
    p.run('x', () => { for (let i = 0; i < 2000; i++); });
    const r = p.report();
    expect(r).toHaveLength(1);
    expect(r[0].name).toBe('x');
    expect(r[0].calls).toBe(2);
    expect(r[0].totalMs).toBeGreaterThan(0);
  });

  it('top(2) retorna 2', () => {
    const p = createProfiler();
    p.run('a', () => 1); p.run('b', () => 2); p.run('c', () => 3);
    expect(p.top(2)).toHaveLength(2);
  });

  it('export genera CSV', () => {
    const p = createProfiler();
    p.run('x', () => 1);
    expect(p.export()).toContain('x,1');
  });

  it('noopProfiler: 10000x en <5ms', () => {
    let c = 0;
    const ms = t(() => { for (let i = 0; i < 10000; i++) noopProfiler.run('n', () => c++); });
    console.log(`  noop x10000: ${ms.toFixed(3)}ms`);
    expect(c).toBe(10000);
    expect(ms).toBeLessThan(5);
  });

  it('overhead createProfiler: 10000x en <50ms', () => {
    const p = createProfiler();
    const ms = t(() => { for (let i = 0; i < 10000; i++) p.run('x', () => i * 2); });
    console.log(`  profiler overhead x10000: ${ms.toFixed(3)}ms`);
    expect(ms).toBeLessThan(50);
  });
});
