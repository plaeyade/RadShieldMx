import { describe, expect, it } from 'vitest';
import { buildKimiOAuthUrl, isKimiOAuthEnabled } from '@/lib/authConfig';

describe('authConfig static mode', () => {
  it('keeps Kimi OAuth disabled unless env is configured', () => {
    expect(isKimiOAuthEnabled()).toBe(false);
  });

  it('does not build an OAuth URL without env configuration', () => {
    expect(buildKimiOAuthUrl('http://localhost:4174')).toBeNull();
  });
});
