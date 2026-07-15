import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPyodideIndexUrl, getPyodideModuleUrl, isPyodideConfigured } from '@/lib/pyodideConfig';

describe('pyodideConfig static mode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps Pyodide disabled by default in offline/static mode', () => {
    expect(getPyodideModuleUrl()).toBeNull();
    expect(isPyodideConfigured()).toBe(false);
  });

  it('uses a configured local Pyodide module URL', () => {
    vi.stubEnv('VITE_PYODIDE_URL', '/vendor/pyodide/pyodide.mjs');

    expect(getPyodideModuleUrl()).toBe('/vendor/pyodide/pyodide.mjs');
    expect(getPyodideIndexUrl('/vendor/pyodide/pyodide.mjs')).toBe('/vendor/pyodide/');
  });

  it('uses the CDN only when explicitly enabled', () => {
    vi.stubEnv('VITE_ENABLE_PYODIDE_CDN', 'true');

    expect(getPyodideModuleUrl()).toBe('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs');
    expect(getPyodideIndexUrl(getPyodideModuleUrl()!)).toBe('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/');
  });
});
