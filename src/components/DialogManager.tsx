/**
 * ═══════════════════════════════════════════════════════════
 * DialogManager — C.10 Centralized Dialog Management
 *
 * This component is a NO-OP placeholder. The real C.10
 * implementation is in the Zustand store (appStore.ts):
 *
 * - openExclusive(name): closes all others, opens target
 * - goBack(): navigates to previous dialog in history
 * - dialogHistory: stack of opened dialogs
 * - isAnyOpen: derived boolean
 *
 * Dialog RENDERING stays with existing LazyDialog components
 * to avoid breaking the ~190 dialog files.
 *
 * ═══════════════════════════════════════════════════════════
 */
import { memo } from 'react';

const DialogManager = memo(function DialogManager() {
  // Intentionally empty — all dialog management is in Zustand store
  // Dialog rendering is handled by individual LazyDialog components
  return null;
});

export default DialogManager;
