import type { EvidencePack } from './evidencePack';
import type { InternalDosimetryDataset } from './internalDosimetryDataset';

export const DOSIMETRY_STORAGE_KEY = 'radshield_internal_dosimetry_workspace_v1';
export const DOSIMETRY_SYNC_QUEUE_KEY = 'radshield_internal_dosimetry_sync_queue_v1';

export type DosimetryWorkspaceSchemaVersion = 'radshield-dosimetry-workspace-v1';
export type DosimetrySyncQueueSchemaVersion = 'radshield-dosimetry-sync-queue-v1';

export interface DosimetryIdacPackRecord {
  id: string;
  createdAt: string;
  pack: unknown;
}

export interface DosimetryAttachmentRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  hashSha256: string;
  linkedProcedureId?: string;
  reviewStatus: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface DosimetryWorkspace {
  schemaVersion: DosimetryWorkspaceSchemaVersion;
  workspaceId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  dataset: InternalDosimetryDataset;
  evidencePack?: EvidencePack;
  idacPacks: DosimetryIdacPackRecord[];
  attachments: DosimetryAttachmentRecord[];
  migration: {
    dbReady: boolean;
    targetPhase: 'phase-50';
    notes: string[];
  };
}

export interface DosimetryStorageDriver {
  kind: 'memory' | 'localStorage';
  load(): DosimetryWorkspace | null;
  save(workspace: DosimetryWorkspace): void;
  clear(): void;
}

export type DosimetrySyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface DosimetrySyncQueueItem {
  id: string;
  workspaceId: string;
  status: DosimetrySyncStatus;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt?: string;
  lastError?: string;
  workspace: DosimetryWorkspace;
}

export interface DosimetrySyncQueue {
  schemaVersion: DosimetrySyncQueueSchemaVersion;
  items: DosimetrySyncQueueItem[];
}

export interface DosimetrySyncQueueDriver {
  kind: 'memory' | 'localStorage';
  load(): DosimetrySyncQueue;
  save(queue: DosimetrySyncQueue): void;
  clear(): void;
}

function nowIso() {
  return new Date().toISOString();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isDosimetryWorkspace(value: unknown): value is DosimetryWorkspace {
  if (!isObject(value)) return false;
  if (value.schemaVersion !== 'radshield-dosimetry-workspace-v1') return false;
  if (typeof value.workspaceId !== 'string') return false;
  if (!isObject(value.dataset) || value.dataset.schemaVersion !== 'radshield-internal-dosimetry-dataset-v1') return false;
  return Array.isArray(value.idacPacks) && Array.isArray(value.attachments);
}

export function isDosimetrySyncQueue(value: unknown): value is DosimetrySyncQueue {
  if (!isObject(value)) return false;
  if (value.schemaVersion !== 'radshield-dosimetry-sync-queue-v1') return false;
  if (!Array.isArray(value.items)) return false;
  return value.items.every((item) => {
    if (!isObject(item)) return false;
    if (typeof item.id !== 'string' || typeof item.workspaceId !== 'string') return false;
    if (!['pending', 'syncing', 'synced', 'failed'].includes(String(item.status))) return false;
    if (typeof item.attemptCount !== 'number') return false;
    return isDosimetryWorkspace(item.workspace);
  });
}

export function createDefaultDosimetryWorkspace(
  dataset: InternalDosimetryDataset,
  projectName = 'RadShield-MX',
  evidencePack?: EvidencePack,
): DosimetryWorkspace {
  const timestamp = nowIso();
  return {
    schemaVersion: 'radshield-dosimetry-workspace-v1',
    workspaceId: `dosimetry-workspace-${timestamp.slice(0, 10)}`,
    projectName,
    createdAt: timestamp,
    updatedAt: timestamp,
    dataset,
    evidencePack,
    idacPacks: [],
    attachments: [],
    migration: {
      dbReady: true,
      targetPhase: 'phase-50',
      notes: [
        'Local workspace is intentionally JSON/localStorage first.',
        'Database migration should preserve dataset, Evidence Pack links, IDAC/DCAL/OLINDA attachments and hashes.',
        'Do not treat paper-example coefficients as externally validated outputs.',
      ],
    },
  };
}

export function upsertDataset(workspace: DosimetryWorkspace, dataset: InternalDosimetryDataset): DosimetryWorkspace {
  return {
    ...workspace,
    dataset,
    updatedAt: nowIso(),
  };
}

export function addIdacPack(workspace: DosimetryWorkspace, pack: unknown): DosimetryWorkspace {
  const timestamp = nowIso();
  return {
    ...workspace,
    updatedAt: timestamp,
    idacPacks: [
      {
        id: `idac-pack-${timestamp}`,
        createdAt: timestamp,
        pack,
      },
      ...workspace.idacPacks,
    ],
  };
}

export function addAttachmentRecord(
  workspace: DosimetryWorkspace,
  attachment: Omit<DosimetryAttachmentRecord, 'id' | 'createdAt' | 'reviewStatus'> & Partial<Pick<DosimetryAttachmentRecord, 'reviewStatus'>>,
): DosimetryWorkspace {
  const timestamp = nowIso();
  return {
    ...workspace,
    updatedAt: timestamp,
    attachments: [
      {
        id: `dosimetry-attachment-${timestamp}`,
        createdAt: timestamp,
        reviewStatus: attachment.reviewStatus ?? 'pending',
        ...attachment,
      },
      ...workspace.attachments,
    ],
  };
}

export function createMemoryDosimetryStorage(initial?: DosimetryWorkspace): DosimetryStorageDriver {
  let current = initial ?? null;
  return {
    kind: 'memory',
    load: () => current,
    save: (workspace) => {
      current = workspace;
    },
    clear: () => {
      current = null;
    },
  };
}

export function createLocalStorageDosimetryStorage(
  storage: Storage = window.localStorage,
  key = DOSIMETRY_STORAGE_KEY,
): DosimetryStorageDriver {
  return {
    kind: 'localStorage',
    load: () => {
      const raw = storage.getItem(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return isDosimetryWorkspace(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save: (workspace) => {
      storage.setItem(key, JSON.stringify(workspace));
    },
    clear: () => {
      storage.removeItem(key);
    },
  };
}

export function createEmptyDosimetrySyncQueue(): DosimetrySyncQueue {
  return {
    schemaVersion: 'radshield-dosimetry-sync-queue-v1',
    items: [],
  };
}

export function createMemoryDosimetrySyncQueue(initial?: DosimetrySyncQueue): DosimetrySyncQueueDriver {
  let current = initial ?? createEmptyDosimetrySyncQueue();
  return {
    kind: 'memory',
    load: () => current,
    save: (queue) => {
      current = queue;
    },
    clear: () => {
      current = createEmptyDosimetrySyncQueue();
    },
  };
}

export function createLocalStorageDosimetrySyncQueue(
  storage: Storage = window.localStorage,
  key = DOSIMETRY_SYNC_QUEUE_KEY,
): DosimetrySyncQueueDriver {
  return {
    kind: 'localStorage',
    load: () => {
      const raw = storage.getItem(key);
      if (!raw) return createEmptyDosimetrySyncQueue();
      try {
        const parsed = JSON.parse(raw);
        return isDosimetrySyncQueue(parsed) ? parsed : createEmptyDosimetrySyncQueue();
      } catch {
        return createEmptyDosimetrySyncQueue();
      }
    },
    save: (queue) => {
      storage.setItem(key, JSON.stringify(queue));
    },
    clear: () => {
      storage.removeItem(key);
    },
  };
}

export function enqueueDosimetryWorkspaceSync(
  driver: DosimetrySyncQueueDriver,
  workspace: DosimetryWorkspace,
  error?: string,
): DosimetrySyncQueueItem {
  const queue = driver.load();
  const timestamp = nowIso();
  const existing = queue.items.find((item) => item.workspaceId === workspace.workspaceId);
  const item: DosimetrySyncQueueItem = {
    id: existing?.id ?? `dosimetry-sync-${workspace.workspaceId}`,
    workspaceId: workspace.workspaceId,
    status: error ? 'failed' : 'pending',
    attemptCount: existing?.attemptCount ?? 0,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    lastError: error,
    workspace,
  };
  const next = {
    ...queue,
    items: [item, ...queue.items.filter((entry) => entry.workspaceId !== workspace.workspaceId)],
  };
  driver.save(next);
  return item;
}

export function markDosimetrySyncAttempt(
  driver: DosimetrySyncQueueDriver,
  workspaceId: string,
): DosimetrySyncQueueItem | null {
  const queue = driver.load();
  const timestamp = nowIso();
  let updatedItem: DosimetrySyncQueueItem | null = null;
  const items = queue.items.map((item) => {
    if (item.workspaceId !== workspaceId) return item;
    updatedItem = {
      ...item,
      status: 'syncing',
      attemptCount: item.attemptCount + 1,
      lastAttemptAt: timestamp,
      updatedAt: timestamp,
    };
    return updatedItem;
  });
  driver.save({ ...queue, items });
  return updatedItem;
}

export function markDosimetrySyncSuccess(
  driver: DosimetrySyncQueueDriver,
  workspaceId: string,
): DosimetrySyncQueueItem | null {
  const queue = driver.load();
  const timestamp = nowIso();
  let updatedItem: DosimetrySyncQueueItem | null = null;
  const items = queue.items.map((item) => {
    if (item.workspaceId !== workspaceId) return item;
    updatedItem = {
      ...item,
      status: 'synced',
      lastError: undefined,
      updatedAt: timestamp,
    };
    return updatedItem;
  });
  driver.save({ ...queue, items });
  return updatedItem;
}

export function markDosimetrySyncFailure(
  driver: DosimetrySyncQueueDriver,
  workspaceId: string,
  error: string,
): DosimetrySyncQueueItem | null {
  const queue = driver.load();
  const timestamp = nowIso();
  let updatedItem: DosimetrySyncQueueItem | null = null;
  const items = queue.items.map((item) => {
    if (item.workspaceId !== workspaceId) return item;
    updatedItem = {
      ...item,
      status: 'failed',
      lastError: error,
      updatedAt: timestamp,
    };
    return updatedItem;
  });
  driver.save({ ...queue, items });
  return updatedItem;
}

export function getPendingDosimetrySyncItems(queue: DosimetrySyncQueue) {
  return queue.items.filter((item) => item.status === 'pending' || item.status === 'failed');
}

export function persistDosimetryDataset(
  driver: DosimetryStorageDriver,
  dataset: InternalDosimetryDataset,
  projectName = 'RadShield-MX',
): DosimetryWorkspace {
  const current = driver.load();
  const next = current
    ? upsertDataset(current, dataset)
    : createDefaultDosimetryWorkspace(dataset, projectName);
  driver.save(next);
  return next;
}

export function summarizeDosimetryWorkspace(workspace: DosimetryWorkspace | null) {
  if (!workspace) {
    return {
      hasWorkspace: false,
      coefficientCount: 0,
      idacPackCount: 0,
      attachmentCount: 0,
      dbReady: false,
      updatedAt: null as string | null,
    };
  }
  return {
    hasWorkspace: true,
    coefficientCount: workspace.dataset.effectiveDoseCoefficients.length,
    idacPackCount: workspace.idacPacks.length,
    attachmentCount: workspace.attachments.length,
    dbReady: workspace.migration.dbReady,
    updatedAt: workspace.updatedAt,
  };
}

export function summarizeDosimetrySyncQueue(queue: DosimetrySyncQueue) {
  const pendingCount = queue.items.filter((item) => item.status === 'pending').length;
  const failedCount = queue.items.filter((item) => item.status === 'failed').length;
  const syncedCount = queue.items.filter((item) => item.status === 'synced').length;
  const syncingCount = queue.items.filter((item) => item.status === 'syncing').length;
  return {
    totalCount: queue.items.length,
    pendingCount,
    failedCount,
    syncedCount,
    syncingCount,
    hasPending: pendingCount + failedCount > 0,
    lastUpdatedAt: queue.items[0]?.updatedAt ?? null,
  };
}

export async function sha256HexFromArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('SHA-256 requires Web Crypto API.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
