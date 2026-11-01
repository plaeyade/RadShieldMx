/** Historial de deshacer/rehacer: lista las acciones y permite saltar a cualquiera. */
import DialogShell from '@/components/DialogShell';

interface Accion {
  id: number | string;
  timestamp: number;
  action: string;
  description: string;
  type?: string;
}

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  history?: Accion[];
  currentIndex?: number;
  onJumpTo?: (index: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function UndoRedoHistoryPanel({ open = false, onOpenChange, history = [], currentIndex = -1, onJumpTo, onUndo, onRedo, canUndo, canRedo }: Props) {
  if (!open) return null;
  return (
    <DialogShell title="Historial de acciones" subtitle={`${history.length} acciones · posición ${currentIndex + 1}`} gradientFrom="from-slate-600" gradientTo="to-slate-800" maxWidth="max-w-md" onClose={() => onOpenChange?.(false)}>
      <div className="space-y-2 p-4 text-sm" data-testid="undo-history">
        <div className="flex gap-2">
          <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={!canUndo} onClick={onUndo}>Deshacer</button>
          <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={!canRedo} onClick={onRedo}>Rehacer</button>
        </div>
        {history.length === 0 ? (
          <p className="text-slate-500">Todavía no hay acciones.</p>
        ) : (
          <ol className="max-h-80 space-y-1 overflow-auto">
            {history.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onJumpTo?.(i)}
                  className={`w-full rounded px-2 py-1 text-left ${i === currentIndex ? 'bg-violet-100 font-medium' : i > currentIndex ? 'text-slate-400' : ''}`}
                >
                  <span className="text-xs text-slate-500">{new Date(a.timestamp).toLocaleTimeString()}</span> {a.description || a.action}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </DialogShell>
  );
}
