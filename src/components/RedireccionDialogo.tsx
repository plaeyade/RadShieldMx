/**
 * Diálogo que sustituye a una calculadora duplicada sin validar (Fase 8c): explica por qué se retiró su modelo y
 * abre la calculadora validada que hace el mismo trabajo.
 */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';

export interface RedireccionProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  motivo: string;
  destino: string;
  etiquetaDestino: string;
}

export default function RedireccionDialogo({ open, onClose, titulo, motivo, destino, etiquetaDestino }: RedireccionProps) {
  const abrir = () => { onClose(); useAppStore.getState().open(destino); };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription className="text-xs">{motivo}</DialogDescription>
        </DialogHeader>
        <Button size="sm" onClick={abrir} data-testid="redireccion-abrir">{etiquetaDestino}</Button>
      </DialogContent>
    </Dialog>
  );
}
