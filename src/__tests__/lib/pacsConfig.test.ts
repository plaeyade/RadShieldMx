import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDefaultOrthancUrl, isOrthancConfigured, isPacsRealEnabled } from '@/lib/pacsConfig';

describe('pacsConfig static mode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not configure Orthanc by default', () => {
    expect(getDefaultOrthancUrl()).toBe('');
    expect(isPacsRealEnabled()).toBe(false);
    expect(isOrthancConfigured()).toBe(false);
  });

  it('keeps Orthanc disabled when only VITE_ORTHANC_URL is configured', () => {
    vi.stubEnv('VITE_ORTHANC_URL', 'http://127.0.0.1:8042');

    expect(getDefaultOrthancUrl()).toBe('http://127.0.0.1:8042');
    expect(isPacsRealEnabled()).toBe(false);
    expect(isOrthancConfigured()).toBe(false);
  });

  it('enables Orthanc only with explicit PACS opt-in and URL', () => {
    vi.stubEnv('VITE_ENABLE_PACS_REAL', 'true');
    vi.stubEnv('VITE_ORTHANC_URL', 'http://127.0.0.1:8042');

    expect(getDefaultOrthancUrl()).toBe('http://127.0.0.1:8042');
    expect(isPacsRealEnabled()).toBe(true);
    expect(isOrthancConfigured()).toBe(true);
  });
});
