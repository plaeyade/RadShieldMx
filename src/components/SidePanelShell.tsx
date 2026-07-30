import { Maximize2, Minimize2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface SidePanelShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  widthClass?: string;
  accentClass?: string;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

export default function SidePanelShell({
  title,
  subtitle,
  icon,
  widthClass = 'w-[520px]',
  accentClass = 'from-slate-50 to-white',
  onClose,
  actions,
  children,
}: SidePanelShellProps) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 flex ${minimized ? 'pointer-events-none w-auto items-end pb-4 pr-4' : widthClass}`}
      data-testid="f377-side-panel-shell"
      data-f377-side-panel-minimized={minimized ? 'true' : 'false'}
    >
      <div
        className={`pointer-events-auto flex max-h-full flex-col border-l border-slate-200 bg-white shadow-2xl ${minimized ? 'mb-0 w-[340px] rounded-lg border border-slate-200' : 'h-full w-full'}`}
      >
        <div className={`flex items-center justify-between border-b border-slate-200 bg-gradient-to-r ${accentClass} px-4 py-3`}>
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-800">{title}</h2>
              {subtitle && <p className="truncate text-[10px] text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!minimized && actions}
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
              onClick={() => setMinimized((value) => !value)}
              aria-label={minimized ? `Restaurar ${title}` : `Minimizar ${title}`}
              title={minimized ? 'Restaurar panel' : 'Minimizar panel'}
              data-testid="f377-side-panel-minimize"
            >
              {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
              onClick={onClose}
              aria-label={`Cerrar ${title}`}
              title="Cerrar panel"
              data-testid="f377-side-panel-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {minimized ? (
          <button
            type="button"
            className="px-4 py-2 text-left text-[11px] font-medium text-slate-600 hover:bg-slate-50"
            onClick={() => setMinimized(false)}
            data-testid="f377-side-panel-restore"
          >
            Panel minimizado. Pulse para restaurar.
          </button>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
