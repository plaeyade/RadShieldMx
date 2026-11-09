// Fase 9: compara dos escenarios guardados del proyecto (o uno contra el plano actual) con el requerido del motor y la
// verificación de cada barrera (`ComparadorEscenarios`). Antes eran cuatro escenarios fijos («con laberinto», «barita»,
// «carga +20 %») con dosis y costos inventados.
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitCompare } from 'lucide-react';
import { GestorEscenarios, SelectorEscenario, TablaComparacion } from '@/components/ComparadorEscenarios';
import { useComparacion } from '@/hooks/useComparacionEscenarios';

interface CompareModeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function CompareModeDialog({ open, onOpenChange }: CompareModeDialogProps) {
  const { escenarios, idA, setIdA, idB, setIdB, comparacion, nombreA, nombreB } = useComparacion();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitCompare className="w-5 h-5 text-blue-500" />
            Modo comparación — escenarios lado a lado
          </DialogTitle>
          <DialogDescription className="text-xs">Escenarios guardados del proyecto durante esta sesión.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="space-y-4 px-6 pb-6">
            <GestorEscenarios />
            {escenarios.length > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <SelectorEscenario etiqueta="A" valor={idA} onCambio={setIdA} incluirActual={false} />
                <SelectorEscenario etiqueta="B" valor={idB} onCambio={setIdB} incluirActual />
              </div>
            )}
            {comparacion && <TablaComparacion c={comparacion} nombreA={nombreA} nombreB={nombreB} />}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
