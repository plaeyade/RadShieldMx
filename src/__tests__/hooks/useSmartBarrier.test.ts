import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateSmartBarrierLocally,
  isSmartBarrierBackendEnabled,
  useSmartBarrier,
} from '@/hooks/useSmartBarrier';

const baseInput = {
  barrierStart: { x: 0, y: 0 },
  barrierEnd: { x: 400, y: 0 },
  sourcePosition: { x: 200, y: 300 },
  energyLabel: '6 MV',
  workloadGyWeek: 500,
  scaleMPerPixel: 0.01,
  material: 'concreto',
};

describe('useSmartBarrier offline mode', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps backend disabled unless VITE_API_URL is explicitly configured', () => {
    expect(isSmartBarrierBackendEnabled()).toBe(false);
  });

  it('calculates locally without calling localhost or any backend in static mode', async () => {
    const { result } = renderHook(() => useSmartBarrier());

    let calculated: ReturnType<typeof calculateSmartBarrierLocally> | undefined;
    await act(async () => {
      calculated = await result.current.calculateBarrier(
        baseInput.barrierStart,
        baseInput.barrierEnd,
        baseInput.sourcePosition,
        baseInput.energyLabel,
        baseInput.workloadGyWeek,
        baseInput.scaleMPerPixel,
        baseInput.material,
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(calculated?.standard).toBe('NCRP-151');
    expect(calculated?.recommended_thickness_mm).toBeGreaterThan(0);
    expect(result.current.lastResult?.material).toBe('concreto');
  });

  it('does not reuse cached geometry when energy changes', async () => {
    const { result } = renderHook(() => useSmartBarrier());

    let sixMv: ReturnType<typeof calculateSmartBarrierLocally> | undefined;
    let eighteenMv: ReturnType<typeof calculateSmartBarrierLocally> | undefined;

    await act(async () => {
      sixMv = await result.current.calculateBarrier(
        baseInput.barrierStart,
        baseInput.barrierEnd,
        baseInput.sourcePosition,
        '6 MV',
        baseInput.workloadGyWeek,
        baseInput.scaleMPerPixel,
        baseInput.material,
      );
    });

    await act(async () => {
      eighteenMv = await result.current.calculateBarrier(
        baseInput.barrierStart,
        baseInput.barrierEnd,
        baseInput.sourcePosition,
        '18 MV',
        baseInput.workloadGyWeek,
        baseInput.scaleMPerPixel,
        baseInput.material,
      );
    });

    expect(eighteenMv?.tvl_cm).not.toBe(sixMv?.tvl_cm);
    expect(eighteenMv?.warnings).toContain('Energia >10 MV: requiere blindaje de neutrones adicional');
  });
});
