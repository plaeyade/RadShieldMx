/**
 * FunctionProfiler — Per-function call counting, timing, and flame-graph data.
 * Zero-overhead when disabled (noop mode for production).
 */

export interface FunctionMetrics {
  readonly name: string;
  readonly module: string;
  readonly calls: number;
  readonly totalMs: number;
  readonly avgMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly lastMs: number;
  readonly children: readonly string[];
}

export interface FlameNode {
  readonly name: string;
  readonly value: number;
  readonly children: readonly FlameNode[];
}

// ─── Internal state ───
const metricsMap = new Map<string, FunctionMetrics>();
const activeStack: string[] = [];
const childMap = new Map<string, Set<string>>();
let enabled = false;
let _totalTrackedCalls = 0;

// ─── Control ───
export const enableProfiling = (): void => { enabled = true; };
export const disableProfiling = (): void => { enabled = false; };
export const isProfilingEnabled = (): boolean => enabled;
export const resetMetrics = (): void => {
  metricsMap.clear();
  activeStack.length = 0;
  childMap.clear();
  _totalTrackedCalls = 0;
};

export const getTotalTrackedCalls = (): number => _totalTrackedCalls;

// ─── Core tracking ───
export const trackFunction = <T extends (...args: unknown[]) => unknown>(
  name: string,
  module: string,
  fn: T
): T => {
  const wrapped = ((...args: unknown[]): unknown => {
    if (!enabled) return fn(...args);

    const key = `${module}.${name}`;
    const t0 = performance.now();
    _totalTrackedCalls++;

    // Track parent-child relationship
    if (activeStack.length > 0) {
      const parent = activeStack[activeStack.length - 1];
      const siblings = childMap.get(parent) ?? new Set();
      siblings.add(key);
      childMap.set(parent, siblings);
    }
    activeStack.push(key);

    try {
      return fn(...args);
    } finally {
      activeStack.pop();
      const elapsed = performance.now() - t0;

      const existing = metricsMap.get(key);
      if (existing) {
        metricsMap.set(key, {
          ...existing,
          calls: existing.calls + 1,
          totalMs: existing.totalMs + elapsed,
          avgMs: (existing.totalMs + elapsed) / (existing.calls + 1),
          minMs: Math.min(existing.minMs, elapsed),
          maxMs: Math.max(existing.maxMs, elapsed),
          lastMs: elapsed,
        });
      } else {
        metricsMap.set(key, {
          name, module, calls: 1, totalMs: elapsed,
          avgMs: elapsed, minMs: elapsed, maxMs: elapsed, lastMs: elapsed,
          children: [],
        });
      }
    }
  }) as T;

  return wrapped;
};

// ─── Decorator-style wrapper for class methods ───
export const profileMethod = (module: string, name?: string) =>
  <T extends (...args: unknown[]) => unknown>(
    _target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> => {
    const fnName = name ?? String(propertyKey);
    const original = descriptor.value!;
    descriptor.value = trackFunction(fnName, module, original) as T;
    return descriptor;
  };

// ─── Getters ───
export const getAllMetrics = (): readonly FunctionMetrics[] =>
  [...metricsMap.values()].map(m => ({
    ...m,
    children: Object.freeze([...(childMap.get(`${m.module}.${m.name}`) ?? [])]),
  })).sort((a, b) => b.totalMs - a.totalMs);

export const getMetric = (module: string, name: string): FunctionMetrics | undefined =>
  metricsMap.get(`${module}.${name}`);

export const getMetricsByModule = (module: string): readonly FunctionMetrics[] =>
  getAllMetrics().filter(m => m.module === module);

export const getHotspots = (limit = 10): readonly FunctionMetrics[] =>
  getAllMetrics()
    .filter(m => m.calls > 0)
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, limit);

// ─── Flame graph data ───
export const buildFlameGraph = (minMs = 0.01): FlameNode => {
  const buildNode = (key: string, visited: Set<string>): FlameNode => {
    const m = metricsMap.get(key);
    const children = [...(childMap.get(key) ?? [])]
      .filter(c => !visited.has(c) && (metricsMap.get(c)?.totalMs ?? 0) >= minMs)
      .map(c => {
        visited.add(c);
        return buildNode(c, visited);
      });
    return {
      name: key.split('.').pop() ?? key,
      value: m?.totalMs ?? 0,
      children: Object.freeze(children),
    };
  };

  const roots = [...metricsMap.keys()].filter(k => {
    // Root = not a child of any other
    for (const [, set] of childMap) if (set.has(k)) return false;
    return true;
  });

  return {
    name: 'root',
    value: roots.reduce((s, k) => s + (metricsMap.get(k)?.totalMs ?? 0), 0),
    children: Object.freeze(roots.map(r => buildNode(r, new Set()))),
  };
};

// ─── Export formats ───
export const exportMetricsCSV = (): string =>
  ['Module,Function,Calls,TotalMs,AvgMs,MinMs,MaxMs,LastMs',
    ...getAllMetrics().map(m =>
      `${m.module},${m.name},${m.calls},${m.totalMs.toFixed(4)},${m.avgMs.toFixed(4)},${m.minMs.toFixed(4)},${m.maxMs.toFixed(4)},${m.lastMs.toFixed(4)}`
    )
  ].join('\n');

// ─── Auto-instrumentation for lib modules ───
export const instrumentModule = (
  moduleName: string,
  exports: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(exports)) {
    if (typeof value === 'function' && key !== 'default') {
      result[key] = trackFunction(key, moduleName, value as (...args: unknown[]) => unknown);
    } else {
      result[key] = value;
    }
  }
  return result;
};
