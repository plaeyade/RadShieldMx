// ParetoOptimizerDialog — comparación de materiales por costo, masa y espesor con frente de Pareto.
// Fase 7: el espesor de cada material sale de NCRP 151 (TVL₁/TVLₑ, Tabla B.2) o NCRP 147 (K¹ y Archer, Tablas
// 4.5/4.7, B.1/C.1) con `espesorRequeridoHaz`. Antes: tabla TVL local con HVL como TVL y valores de 6 MV erróneos.
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { TrendingDown } from 'lucide-react';
import ComparadorMateriales from '@/components/ComparadorMateriales';

export default function ParetoOptimizerDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.paretoOptimizer));
  const close = () => useAppStore.getState().close('paretoOptimizer');
  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="w-5 h-5 text-[#7c3aed]" /> Comparación de materiales — frente de Pareto
          </DialogTitle>
          <DialogDescription className="text-xs">Espesor requerido por material con NCRP 151 (Tabla B.2) o NCRP 147 (K¹ y Archer); ordenado por suma ponderada de costo, masa y espesor.</DialogDescription>
        </DialogHeader>
        <ComparadorMateriales prefijo="par" />
      </DialogContent>
    </Dialog>
  );
}
