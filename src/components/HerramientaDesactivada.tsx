/**
 * Fase 9 — diálogo desactivado: herramientas que en la Fase 8c sólo se rotularon como «datos de ejemplo» y que no
 * tienen una fuente real (transporte Monte Carlo propio sin validar, métricas simuladas, contornos aleatorios, mapas en
 * unidades arbitrarias). En lugar de mostrar cifras inventadas, el diálogo explica por qué está desactivado y qué usar.
 */
import type { ReactNode } from 'react';
import { Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  titulo: string;
  motivo: string;
  alternativa?: ReactNode;
}

export default function HerramientaDesactivada({ open, onClose, titulo, motivo, alternativa }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Ban className="h-5 w-5 text-slate-500" />{titulo}</DialogTitle>
          <DialogDescription>Herramienta desactivada: no tiene una fuente de datos real.</DialogDescription>
        </DialogHeader>
        <div data-testid="herramienta-desactivada" role="note" className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <p>{motivo}</p>
          {alternativa ? <p className="mt-2 text-xs text-slate-600">{alternativa}</p> : null}
        </div>
        <div className="flex justify-end"><Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button></div>
      </DialogContent>
    </Dialog>
  );
}
