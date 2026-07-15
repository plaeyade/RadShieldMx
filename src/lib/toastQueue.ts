/**
 * A.17: Toast Notification Queue — Rate limiting
 * Prevents toast spam, groups by type, auto-dismisses
 */
interface QueuedToast { id: string; message: string; type: 'success' | 'error' | 'warning' | 'info'; group?: string; }

class ToastQueue {
  private queue: QueuedToast[] = [];
  private visible: Set<string> = new Set();
  private maxVisible = 3;
  private groupTimers = new Map<string, number>();
  private onShow: ((t: QueuedToast) => void) | null = null;

  setHandler(fn: (t: QueuedToast) => void) { this.onShow = fn; }

  enqueue(message: string, type: QueuedToast['type'] = 'info', group?: string) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    // Rate limit by group: max 1 per 2 seconds
    if (group) {
      const last = this.groupTimers.get(group);
      if (last && Date.now() - last < 2000) return;
      this.groupTimers.set(group, Date.now());
    }
    this.queue.push({ id, message, type, group });
    this.process();
  }

  private process() {
    if (!this.onShow) return;
    while (this.visible.size < this.maxVisible && this.queue.length > 0) {
      const toast = this.queue.shift()!;
      this.visible.add(toast.id);
      this.onShow(toast);
      setTimeout(() => this.visible.delete(toast.id), 4000);
    }
  }

  clear() { this.queue = []; this.visible.clear(); }
}

export const toastQueue = new ToastQueue();
export type { QueuedToast };
