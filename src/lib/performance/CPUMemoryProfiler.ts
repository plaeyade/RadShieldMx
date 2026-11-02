/**
 * CPUMemoryProfiler — CPU timing, heap snapshots, GC pressure detection,
 * memory leak identification, and allocation tracking.
 */

export interface MemorySnapshot {
  readonly timestamp: number;
  readonly usedHeapMB: number;
  readonly totalHeapMB: number;
  readonly usedNativeMB?: number;
}

export interface CPUSlice {
  readonly startMs: number;
  readonly durationMs: number;
  readonly label: string;
}

export interface LeakReport {
  readonly suspected: boolean;
  readonly growthRateMBPerMin: number;
  readonly snapshots: readonly MemorySnapshot[];
  readonly recommendation: string;
}

export interface AllocationRecord {
  readonly sizeMB: number;
  readonly count: number;
  readonly type: string;
}

const getMemory = (): MemorySnapshot => {
  const mem = (performance as any).memory;
  if (!mem) {
    return {
      timestamp: Date.now(),
      usedHeapMB: 0,
      totalHeapMB: 0,
    };
  }
  return {
    timestamp: Date.now(),
    usedHeapMB: mem.usedJSHeapSize / 1024 / 1024,
    totalHeapMB: mem.totalJSHeapSize / 1024 / 1024,
    usedNativeMB: mem.usedJSHeapSize ? mem.usedJSHeapSize / 1024 / 1024 : undefined,
  };
};

// ─── Heap monitoring ───
const snapshots: MemorySnapshot[] = [];
const MAX_SNAPSHOTS = 200;

export const takeHeapSnapshot = (): MemorySnapshot => {
  const s = getMemory();
  snapshots.push(s);
  if (snapshots.length > MAX_SNAPSHOTS) snapshots.shift();
  return s;
};

export const getSnapshots = (): readonly MemorySnapshot[] =>
  Object.freeze([...snapshots]);

export const clearSnapshots = (): void => { snapshots.length = 0; };

// ─── Memory leak detection ───
export const detectMemoryLeak = (windowMinutes = 5): LeakReport => {
  const recent = snapshots.slice(-Math.max(20, windowMinutes * 12)); // ~5s interval
  if (recent.length < 10) {
    return { suspected: false, growthRateMBPerMin: 0, snapshots: recent, recommendation: 'Insufficient data — run monitoring for at least 1 minute.' };
  }

  // Linear regression on heap usage over time
  const n = recent.length;
  const sumX = recent.reduce((s, _, i) => s + i, 0);
  const sumY = recent.reduce((s, r) => s + r.usedHeapMB, 0);
  const sumXY = recent.reduce((s, r, i) => s + i * r.usedHeapMB, 0);
  const sumXX = recent.reduce((s, _, i) => s + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Convert slope (MB per snapshot) to MB per minute
  // Assume snapshots every ~5 seconds
  const growthRateMBPerMin = slope * 12; // 12 snapshots/minute

  const suspected = growthRateMBPerMin > 1; // >1 MB/min growth = suspicious

  let recommendation = 'Heap stable. No action needed.';
  if (suspected && growthRateMBPerMin > 5) {
    recommendation = `CRITICAL: Heap growing at ${growthRateMBPerMin.toFixed(1)} MB/min. Check for: (1) unclosed event listeners, (2) growing caches without eviction, (3) detached DOM nodes, (4) interval timeouts not cleared. Force GC if possible.`;
  } else if (suspected) {
    recommendation = `WARNING: Heap growing at ${growthRateMBPerMin.toFixed(1)} MB/min. Monitor closely and review object retention patterns.`;
  }

  return { suspected, growthRateMBPerMin, snapshots: recent, recommendation };
};

// ─── CPU profiling via User Timing API ───
const cpuSlices: CPUSlice[] = [];

export const markStart = (label: string): string => {
  const mark = `cpu-${label}-${Date.now()}`;
  performance.mark(`${mark}-start`);
  return mark;
};

export const markEnd = (mark: string, label: string): CPUSlice => {
  performance.mark(`${mark}-end`);
  performance.measure(mark, `${mark}-start`, `${mark}-end`);
  const entries = performance.getEntriesByName(mark, 'measure');
  const duration = entries.length > 0 ? entries[entries.length - 1].duration : 0;
  performance.clearMarks(`${mark}-start`);
  performance.clearMarks(`${mark}-end`);
  performance.clearMeasures(mark);

  const slice: CPUSlice = { startMs: Date.now() - duration, durationMs: duration, label };
  cpuSlices.push(slice);
  if (cpuSlices.length > 500) cpuSlices.shift();
  return slice;
};

export const profileAsync = async <T>(
  label: string,
  fn: () => Promise<T>
): Promise<[T, CPUSlice]> => {
  const m = markStart(label);
  try {
    const result = await fn();
    return [result, markEnd(m, label)];
  } catch (e) {
    markEnd(m, label);
    throw e;
  }
};

export const profileSync = <T>(label: string, fn: () => T): [T, CPUSlice] => {
  const m = markStart(label);
  try {
    const result = fn();
    return [result, markEnd(m, label)];
  } catch (e) {
    markEnd(m, label);
    throw e;
  }
};

export const getCPUSlices = (): readonly CPUSlice[] =>
  Object.freeze([...cpuSlices]);

export const getTopCPUSlices = (limit = 10): readonly CPUSlice[] =>
  [...cpuSlices].sort((a, b) => b.durationMs - a.durationMs).slice(0, limit);

export const clearCPUSlices = (): void => { cpuSlices.length = 0; };

// ─── GC pressure estimation ───
export const estimateGCPressure = (): { pressure: 'low' | 'medium' | 'high' | 'critical'; fragmentationRatio: number; recommendation: string } => {
  const mem = getMemory();
  if (!mem.totalHeapMB) {
    return { pressure: 'low', fragmentationRatio: 0, recommendation: 'Memory API not available in this environment.' };
  }

  const ratio = mem.usedHeapMB / mem.totalHeapMB;
  let pressure: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let recommendation = 'Heap healthy.';

  if (ratio > 0.9) {
    pressure = 'critical';
    recommendation = `CRITICAL: Heap ${(ratio * 100).toFixed(1)}% full (${mem.usedHeapMB.toFixed(0)} MB used). Imminent OOM risk. Reduce allocations immediately.`;
  } else if (ratio > 0.75) {
    pressure = 'high';
    recommendation = `HIGH: Heap ${(ratio * 100).toFixed(0)}% utilized. Consider: (1) object pooling, (2) streaming instead of buffering, (3) TypedArrays for numeric data.`;
  } else if (ratio > 0.5) {
    pressure = 'medium';
    recommendation = `MEDIUM: Heap ${(ratio * 100).toFixed(0)}% utilized. Monitor growth trends.`;
  }

  return { pressure, fragmentationRatio: ratio, recommendation };
};

// ─── Continuous monitoring ───
let monitorInterval: ReturnType<typeof setInterval> | null = null;

export const startContinuousMonitoring = (intervalMs = 5000): void => {
  stopContinuousMonitoring();
  monitorInterval = setInterval(() => {
    takeHeapSnapshot();
  }, intervalMs);
};

export const stopContinuousMonitoring = (): void => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
};

export const isMonitoring = (): boolean => monitorInterval !== null;

// ─── Allocation tracking (approximate via heap deltas) ───
export interface AllocationTracker {
  readonly label: string;
  readonly startSnapshot: MemorySnapshot;
  readonly deltaMB: number;
  readonly peakMB: number;
}

const activeTrackers = new Map<string, AllocationTracker>();

export const startAllocationTrack = (label: string): void => {
  activeTrackers.set(label, {
    label,
    startSnapshot: takeHeapSnapshot(),
    deltaMB: 0,
    peakMB: 0,
  });
};

export const stopAllocationTrack = (label: string): AllocationTracker | undefined => {
  const tracker = activeTrackers.get(label);
  if (!tracker) return undefined;
  activeTrackers.delete(label);

  const endSnapshot = takeHeapSnapshot();
  const deltaMB = endSnapshot.usedHeapMB - tracker.startSnapshot.usedHeapMB;

  return { ...tracker, deltaMB, peakMB: Math.max(deltaMB, 0) };
};

export const getActiveTrackers = (): readonly AllocationTracker[] =>
  Object.freeze([...activeTrackers.values()]);
