/**
 * Legacy section DialogManager compatibility shim.
 *
 * Dialog state and rendering were migrated to the Zustand-driven
 * DialogHost/LazyDialog path. This file remains only so old imports keep
 * resolving while the recovered source is consolidated.
 */
export default function DialogManager() {
  return null;
}
