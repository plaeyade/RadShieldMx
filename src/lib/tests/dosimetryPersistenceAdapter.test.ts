import { describe, expect, it } from 'vitest';
import { buildInternalDosimetryDataset } from '../internalDosimetryDataset';
import {
  addAttachmentRecord,
  addIdacPack,
  createDefaultDosimetryWorkspace,
  createMemoryDosimetryStorage,
  createMemoryDosimetrySyncQueue,
  enqueueDosimetryWorkspaceSync,
  getPendingDosimetrySyncItems,
  isDosimetryWorkspace,
  markDosimetrySyncAttempt,
  markDosimetrySyncFailure,
  markDosimetrySyncSuccess,
  persistDosimetryDataset,
  summarizeDosimetrySyncQueue,
  summarizeDosimetryWorkspace,
} from '../dosimetryPersistenceAdapter';

describe('Dosimetry persistence adapter', () => {
  it('creates a DB-ready workspace around the internal dosimetry dataset', () => {
    const dataset = buildInternalDosimetryDataset(new Date('2026-07-11T12:00:00.000Z'));
    const workspace = createDefaultDosimetryWorkspace(dataset, 'Demo Project');

    expect(workspace.schemaVersion).toBe('radshield-dosimetry-workspace-v1');
    expect(workspace.projectName).toBe('Demo Project');
    expect(workspace.dataset.effectiveDoseCoefficients).toHaveLength(23);
    expect(workspace.migration.dbReady).toBe(true);
    expect(isDosimetryWorkspace(workspace)).toBe(true);
  });

  it('persists and reloads from the memory driver', () => {
    const dataset = buildInternalDosimetryDataset(new Date('2026-07-11T12:00:00.000Z'));
    const driver = createMemoryDosimetryStorage();
    const saved = persistDosimetryDataset(driver, dataset, 'Local Demo');
    const loaded = driver.load();

    expect(loaded?.workspaceId).toBe(saved.workspaceId);
    expect(summarizeDosimetryWorkspace(loaded).coefficientCount).toBe(23);
    expect(summarizeDosimetryWorkspace(loaded).dbReady).toBe(true);
  });

  it('tracks IDAC packs and validation attachment metadata', () => {
    const dataset = buildInternalDosimetryDataset(new Date('2026-07-11T12:00:00.000Z'));
    const workspace = createDefaultDosimetryWorkspace(dataset);
    const withPack = addIdacPack(workspace, { schemaVersion: 'radshield-idac-dose-readiness-v1' });
    const withAttachment = addAttachmentRecord(withPack, {
      fileName: 'idac-dose-output.json',
      mimeType: 'application/json',
      sizeBytes: 128,
      hashSha256: 'abc123',
      linkedProcedureId: 'f18-fdg-iv',
    });

    const summary = summarizeDosimetryWorkspace(withAttachment);
    expect(summary.idacPackCount).toBe(1);
    expect(summary.attachmentCount).toBe(1);
    expect(withAttachment.attachments[0].reviewStatus).toBe('pending');
  });

  it('queues local workspaces for deferred server synchronization', () => {
    const dataset = buildInternalDosimetryDataset(new Date('2026-07-11T12:00:00.000Z'));
    const workspace = createDefaultDosimetryWorkspace(dataset, 'Queued Project');
    const queueDriver = createMemoryDosimetrySyncQueue();

    const queued = enqueueDosimetryWorkspaceSync(queueDriver, workspace);
    expect(queued.status).toBe('pending');
    expect(summarizeDosimetrySyncQueue(queueDriver.load()).pendingCount).toBe(1);
    expect(getPendingDosimetrySyncItems(queueDriver.load())).toHaveLength(1);

    const attempt = markDosimetrySyncAttempt(queueDriver, workspace.workspaceId);
    expect(attempt?.status).toBe('syncing');
    expect(attempt?.attemptCount).toBe(1);

    const failure = markDosimetrySyncFailure(queueDriver, workspace.workspaceId, 'offline');
    expect(failure?.status).toBe('failed');
    expect(summarizeDosimetrySyncQueue(queueDriver.load()).failedCount).toBe(1);

    const success = markDosimetrySyncSuccess(queueDriver, workspace.workspaceId);
    expect(success?.status).toBe('synced');
    expect(summarizeDosimetrySyncQueue(queueDriver.load()).syncedCount).toBe(1);
  });
});
