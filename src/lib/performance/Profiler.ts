/**
 * Profiler — Minimalista, funcional, sin estado mutable compartido.
 * SOLID: SRP (solo mide), DIP (inyectable), OCP (extensible por strategy).
 * Uso: const p = createProfiler(); const r = p.run('calc', () => fn());
 */

export interface Metric { readonly name: string; readonly ms: number; readonly ts: number; }
export interface Summary { readonly name: string; readonly calls: number; readonly totalMs: number; readonly avgMs: number; readonly maxMs: number; }

export interface Profiler {
  readonly run: <T>(name: string, fn: () => T) => T;
  readonly report: () => readonly Summary[];
  readonly top: (n?: number) => readonly Summary[];
  readonly export: () => string;
}

// ─── Factory pura ───
export const createProfiler = (): Profiler => {
  const metrics: Metric[] = [];

  const run = <T>(name: string, fn: () => T): T => {
    const t0 = performance.now();
    try { return fn(); }
    finally { metrics.push({ name, ms: performance.now() - t0, ts: Date.now() }); }
  };

  const report = (): Summary[] =>
    Object.entries(
      metrics.reduce<Record<string, number[]>>((acc, m) => {
        (acc[m.name] ??= []).push(m.ms);
        return acc;
      }, {})
    ).map(([name, arr]) => ({
      name, calls: arr.length,
      totalMs: arr.reduce((a, b) => a + b, 0),
      avgMs: arr.reduce((a, b) => a + b, 0) / arr.length,
      maxMs: Math.max(...arr),
    })).sort((a, b) => b.totalMs - a.totalMs);

  const top = (n = 5): Summary[] => report().slice(0, n);
  const exp = (): string => ['Function,Calls,TotalMs,AvgMs,MaxMs', ...report().map(r => `${r.name},${r.calls},${r.totalMs.toFixed(2)},${r.avgMs.toFixed(2)},${r.maxMs.toFixed(2)}`)].join('\n');

  return { run, report, top, export: exp };
};

// ─── No-op profiler para produccion (sin overhead) ───
export const noopProfiler: Profiler = {
  run: <T>(_name: string, fn: () => T): T => fn(),
  report: () => [],
  top: () => [],
  export: () => '',
};
