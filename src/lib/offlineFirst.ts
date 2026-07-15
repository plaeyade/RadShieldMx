/**
 * E.13: Offline-First Architecture
 * Service Worker helpers + offline detection + queue
 */
export function isOnline(): boolean { return navigator.onLine; }

export function onOnline(callback: () => void) {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

export function onOffline(callback: () => void) {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}

interface QueuedOperation { id: string; type: string; payload: any; timestamp: number; retries: number; }

const QUEUE_KEY = 'radshield_offline_queue';

function loadQueue(): QueuedOperation[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function saveQueue(q: QueuedOperation[]) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }

export function queueOperation(type: string, payload: any): string {
  const queue = loadQueue();
  const id = `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  queue.push({ id, type, payload, timestamp: Date.now(), retries: 0 });
  saveQueue(queue);
  return id;
}

export function getPendingOperations(): QueuedOperation[] {
  return loadQueue();
}

export function clearPendingOperations() {
  localStorage.removeItem(QUEUE_KEY);
}

export function syncPendingOperations(handler: (op: QueuedOperation) => Promise<boolean>) {
  const queue = loadQueue();
  const remaining: QueuedOperation[] = [];
  let processed = 0;
  for (const op of queue) {
    handler(op).then(success => {
      if (!success) remaining.push(op);
      else processed++;
    }).catch(() => remaining.push(op));
  }
  saveQueue(remaining);
  return processed;
}
