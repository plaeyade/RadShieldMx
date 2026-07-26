/**
 * DialogShell — Componente base para todos los dialogs.
 * Elimina duplicacion de: overlay, container, header, footer.
 * SOLID: SRP (solo layout), OCP (children personalizable).
 */
import { Maximize2, Minimize2, Move, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

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
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const shellStyle = useMemo(() => {
    if (maximized) return { transform: 'none' };
    return { transform: `translate(${position.x}px, ${position.y}px)` };
  }, [maximized, position.x, position.y]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (maximized) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button')) return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [maximized, position.x, position.y]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setPosition({
      x: dragRef.current.originX + event.clientX - dragRef.current.startX,
      y: dragRef.current.originY + event.clientY - dragRef.current.startY,
    });
  }, []);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`bg-white rounded-lg shadow-2xl w-full ${maximized ? 'max-w-[calc(100vw-24px)] h-[calc(100vh-24px)]' : maxWidth} ${minimized ? 'max-h-[58px]' : 'max-h-[95vh]'} flex flex-col overflow-hidden`}
        style={shellStyle}
        data-testid="draggable-dialog-shell"
        data-dialog-minimized={minimized ? 'true' : 'false'}
        data-dialog-maximized={maximized ? 'true' : 'false'}
      >
        {/* Header */}
        <div
          className={`flex cursor-move select-none items-center justify-between px-5 py-3 border-b bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white rounded-t-lg`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          title="Arrastrar ventana"
        >
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 truncate text-lg font-bold">
              <Move className="h-4 w-4 opacity-80" />
              {title}
            </h2>
            <p className="text-xs opacity-80">{subtitle}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized((value) => !value)}
              className="p-1.5 rounded hover:bg-white/20 transition"
              aria-label={minimized ? 'Restaurar' : 'Minimizar'}
              title={minimized ? 'Restaurar ventana' : 'Minimizar ventana'}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setMaximized((value) => !value);
                setMinimized(false);
              }}
              className="p-1.5 rounded hover:bg-white/20 transition"
              aria-label={maximized ? 'Restaurar tamano' : 'Expandir'}
              title={maximized ? 'Restaurar tamano' : 'Expandir ventana'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-white/20 transition"
              aria-label="Cerrar"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!minimized && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {children}
          </div>
        )}

        {/* Footer */}
        {!minimized && footer && (
          <div className="flex justify-between px-5 py-3 border-t bg-slate-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
