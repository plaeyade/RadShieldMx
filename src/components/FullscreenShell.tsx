import { Maximize2, Minimize2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface FullscreenShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  accentClassName?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  traceId: string;
}

export default function FullscreenShell({
  title,
  subtitle,
  icon,
  accentClassName = 'bg-slate-700',
  toolbar,
  children,
  onClose,
  traceId,
}: FullscreenShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [contained, setContained] = useState(false);

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-white ${contained ? 'items-center justify-center bg-black/35 p-4' : 'flex-col'}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid={traceId}
      data-fullscreen-shell-contained={contained ? 'true' : 'false'}
      data-fullscreen-shell-collapsed={collapsed ? 'true' : 'false'}
    >
      <div className={`flex min-h-0 flex-col bg-white shadow-2xl ${contained ? 'h-[92vh] w-[94vw] overflow-hidden rounded-xl border border-slate-200' : 'h-full w-full'}`}>
        <div className="flex shrink-0 items-center justify-between border-b bg-slate-50 px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-2 text-white ${accentClassName}`}>
              {icon}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {toolbar}
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="rounded p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              aria-label={collapsed ? 'Restaurar contenido' : 'Minimizar contenido'}
              title={collapsed ? 'Restaurar contenido' : 'Minimizar contenido'}
              data-testid={`${traceId}-minimize`}
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setContained((value) => !value);
                setCollapsed(false);
              }}
              className="rounded p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              aria-label={contained ? 'Restaurar pantalla completa' : 'Vista contenida'}
              title={contained ? 'Restaurar pantalla completa' : 'Vista contenida'}
              data-testid={`${traceId}-contained-toggle`}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Cerrar"
              title="Cerrar"
              data-testid={`${traceId}-close`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {!collapsed && <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>}
      </div>
    </div>
  );
}
