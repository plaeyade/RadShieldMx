/**
 * Función anunciada en menús pero sin implementación en esta versión.
 *
 * Antes, 16 diálogos eran `Stub` que devolvían `null`: el usuario pulsaba la opción del menú y no
 * pasaba nada. Ahora se dice explícitamente que la función no está disponible y nunca se muestra un
 * resultado inventado.
 */
import type { ComponentType } from 'react';
import DialogShell from '@/components/DialogShell';

interface UnavailableFeatureProps {
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  /** Los puntos de montaje pasan props del diálogo real previsto; aquí se ignoran. */
  [prop: string]: unknown;
}

export function createUnavailableFeatureDialog(titulo: string, detalle?: string): ComponentType<UnavailableFeatureProps> {
  function UnavailableFeatureDialog({ open = true, onClose, onOpenChange }: UnavailableFeatureProps) {
    if (!open) return null;
    return (
      <DialogShell
        title={titulo}
        subtitle="Función no disponible en esta versión"
        gradientFrom="from-slate-600"
        gradientTo="to-slate-700"
        maxWidth="max-w-md"
        onClose={() => {
          onClose?.();
          onOpenChange?.(false);
        }}
      >
        <div className="space-y-3 p-4 text-sm text-slate-700" data-testid="unavailable-feature">
          <p>
            <strong>{titulo}</strong> aparece en el menú pero todavía no está implementada. No se ha
            calculado nada.
          </p>
          {detalle ? <p className="text-slate-500">{detalle}</p> : null}
          <p className="text-slate-500">
            Ningún resultado de esta función se incluye en memorias ni reportes.
          </p>
        </div>
      </DialogShell>
    );
  }
  UnavailableFeatureDialog.displayName = `Unavailable(${titulo})`;
  return UnavailableFeatureDialog;
}
