/**
 * DialogShell — Componente base para todos los dialogs.
 * Elimina duplicacion de: overlay, container, header, footer.
 * SOLID: SRP (solo layout), OCP (children personalizable).
 */
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface DialogShellProps {
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  maxWidth?: string;
  footer?: ReactNode;
  children: ReactNode;
  onClose: () => void;
}

export default function DialogShell({
  title,
  subtitle,
  gradientFrom,
  gradientTo,
  maxWidth = 'max-w-4xl',
  footer,
  children,
  onClose,
}: DialogShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`bg-white rounded-lg shadow-2xl w-full ${maxWidth} max-h-[95vh] flex flex-col`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white rounded-t-lg`}
        >
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-xs opacity-80">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/20 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-between px-5 py-3 border-t bg-slate-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
