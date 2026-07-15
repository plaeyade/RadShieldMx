import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  apiGetCurrentUser,
  apiGetSyncStatus,
  apiHealthCheck,
  apiListProjects,
  apiLogin,
  apiSyncAll,
  isCloudSyncEnabled,
} from '@/lib/cloudSync';

describe('cloudSync offline-first mode', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'radshield_projects') return JSON.stringify([{ id: 'local-1' }]);
      if (key === 'radshield_pending_changes') return '2';
      if (key === 'radshield_last_sync') return '2026-07-05T00:00:00.000Z';
      return null;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is disabled when no API URL is explicitly configured', () => {
    expect(isCloudSyncEnabled()).toBe(false);
  });

  it('returns offline health without network access', async () => {
    await expect(apiHealthCheck()).resolves.toMatchObject({ status: 'offline', version: 'static' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns offline sync status without network access', async () => {
    await expect(apiGetSyncStatus()).resolves.toMatchObject({
      status: 'offline',
      pendingChanges: 2,
      serverProjects: 0,
      localProjects: 1,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('lists no cloud projects and syncs as offline without network access', async () => {
    await expect(apiListProjects()).resolves.toEqual([]);
    await expect(apiSyncAll()).resolves.toMatchObject({ status: 'offline' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not validate stored auth tokens without configured cloud API', async () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'radshield_auth_token') return 'token';
      return null;
    });

    await expect(apiGetCurrentUser()).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fails login with a controlled offline message', async () => {
    await expect(apiLogin('demo@example.com', 'secret')).rejects.toThrow('Cloud Sync is offline');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
