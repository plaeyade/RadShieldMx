import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearRadShieldServiceWorkerState,
  isServiceWorkerEnabled,
  useServiceWorker,
} from '@/hooks/useServiceWorker';

function setServiceWorkerMock(value: unknown) {
  Object.defineProperty(navigator, 'serviceWorker', {
    value,
    configurable: true,
  });
}

function setCachesMock(value: unknown) {
  Object.defineProperty(window, 'caches', {
    value,
    configurable: true,
  });
}

describe('useServiceWorker static mode', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setServiceWorkerMock(undefined);
    setCachesMock(undefined);
  });

  it('keeps service worker disabled unless explicitly configured', () => {
    expect(isServiceWorkerEnabled()).toBe(false);
  });

  it('does not register a service worker in static mode', async () => {
    const register = vi.fn();
    const getRegistrations = vi.fn().mockResolvedValue([]);
    setServiceWorkerMock({ register, getRegistrations });

    renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(getRegistrations).toHaveBeenCalled();
    });
    expect(register).not.toHaveBeenCalled();
  });

  it('unregisters legacy RadShield service workers and clears owned caches', async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister }]);
    const deleteCache = vi.fn().mockResolvedValue(true);
    setServiceWorkerMock({ getRegistrations });
    setCachesMock({
      keys: vi.fn().mockResolvedValue(['radshield-v50', 'radshield-calcs-v50', 'vendor-cache']),
      delete: deleteCache,
    });

    await clearRadShieldServiceWorkerState();

    expect(unregister).toHaveBeenCalledTimes(1);
    expect(deleteCache).toHaveBeenCalledWith('radshield-v50');
    expect(deleteCache).toHaveBeenCalledWith('radshield-calcs-v50');
    expect(deleteCache).not.toHaveBeenCalledWith('vendor-cache');
  });

  it('keeps requestSync as a no-op when disabled', async () => {
    const getRegistrations = vi.fn().mockResolvedValue([]);
    setServiceWorkerMock({ getRegistrations });

    const { result } = renderHook(() => useServiceWorker());

    await act(async () => {
      await result.current.requestSync('pending-calculations');
    });

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.hasUpdate).toBe(false);
  });
});
