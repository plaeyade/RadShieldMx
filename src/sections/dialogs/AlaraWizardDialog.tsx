// AlaraWizardDialog — sustitución de materiales (costo / espacio / masa).
// Fase 8c: antes mostraba porcentajes fijos («+320 %», «−65 %») y citaba un producto comercial; ahora las
// equivalencias salen del espesor normativo de cada material (`espesorRequeridoHaz`) y de `compararMateriales`.
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { Wand2 } from 'lucide-react';
import ComparadorMateriales from '@/components/ComparadorMateriales';

export default function AlaraWizardDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.alaraWizard));
  const close = () => useAppStore.getState().close('alaraWizard');
  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-emerald-600" /> Asistente ALARA — sustitución de materiales</DialogTitle>
          <DialogDescription className="text-xs">Compare el espesor, la masa y el costo que necesita cada material para la misma barrera; el espacio ahorrado es la diferencia de espesores.</DialogDescription>
        </DialogHeader>
        <ComparadorMateriales prefijo="alara" pesosIniciales={{ costo: 0.3, masa: 0.2, espesor: 0.5 }} />
      </DialogContent>
    </Dialog>
  );
}
