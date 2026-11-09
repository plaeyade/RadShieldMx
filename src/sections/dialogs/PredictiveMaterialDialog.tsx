// PredictiveMaterialDialog — selección de material por costo, masa y espesor.
// Fase 8c: antes puntuaba 1/masa + 1/costo con TVL propios (plomo «0.5 cm» a 6 MV; NCRP 151 Tabla B.2: 5.7 cm) sin
// espesores normativos. Ahora usa el comparador común (`espesorRequeridoHaz` + `compararMateriales`).
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ComparadorMateriales from '@/components/ComparadorMateriales';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function PredictiveMaterialDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selección de material</DialogTitle>
          <DialogDescription className="text-xs">Ordena los materiales con datos normativos por la suma ponderada de costo, masa y espesor; ajuste los pesos según la prioridad del proyecto.</DialogDescription>
        </DialogHeader>
        <ComparadorMateriales prefijo="pred" pesosIniciales={{ costo: 0.5, masa: 0.5, espesor: 0 }} />
      </DialogContent>
    </Dialog>
  );
}
