// CostOptimizerDialog — optimizador de costo de blindaje.
// Fase 8c: antes usaba un solo TVL por material y energía (sin TVL₁/TVLₑ); ahora el espesor sale de
// `espesorRequeridoHaz` (NCRP 151 Tabla B.2 / NCRP 147) y el costo de `compararMateriales` (peso de costo dominante).
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ComparadorMateriales from '@/components/ComparadorMateriales';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function CostOptimizerDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Optimizador de costos</DialogTitle>
          <DialogDescription className="text-xs">Material más económico que cumple P con el espesor normativo (TVL₁/TVLₑ o Archer). Los costos por kg son estimaciones editables.</DialogDescription>
        </DialogHeader>
        <ComparadorMateriales prefijo="cost" pesosIniciales={{ costo: 1, masa: 0, espesor: 0 }} />
      </DialogContent>
    </Dialog>
  );
}
