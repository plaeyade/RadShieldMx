import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getOpenCVScriptUrl, isOpenCVConfigured, useOpenCV } from '@/hooks/useOpenCV';

describe('useOpenCV static mode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('keeps OpenCV disabled unless a local URL or explicit CDN flag is configured', () => {
    expect(getOpenCVScriptUrl()).toBeNull();
    expect(isOpenCVConfigured()).toBe(false);
  });

  it('does not append the CDN script in default offline mode', async () => {
    const appendChild = vi.spyOn(document.head, 'appendChild');
    const { result } = renderHook(() => useOpenCV());

    let error: unknown;
    await act(async () => {
      try {
        await result.current.load();
      } catch (err) {
        error = err;
      }
    });

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('OpenCV no configurado');
    expect(appendChild).not.toHaveBeenCalled();
    expect(result.current.isLoaded).toBe(false);
  });

  it('uses a configured local OpenCV URL instead of the CDN', async () => {
    vi.stubEnv('VITE_OPENCV_URL', '/vendor/opencv.min.js');
    let appendedScript: HTMLScriptElement | undefined;
    vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
      appendedScript = node as HTMLScriptElement;
      setTimeout(() => appendedScript?.onload?.(new Event('load')), 0);
      return node;
    });

    const { result } = renderHook(() => useOpenCV());

    await act(async () => {
      await result.current.load();
    });

    expect(appendedScript?.src).toContain('/vendor/opencv.min.js');
    expect(appendedScript?.src).not.toContain('cdn.jsdelivr.net');
    expect(result.current.isLoaded).toBe(true);
  });
});
