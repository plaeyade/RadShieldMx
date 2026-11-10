import type { FloorPlan } from '@/types/radshield';
import { Button } from '@/components/ui/button';
import AvisoProyectoVacio from '@/components/AvisoProyectoVacio';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

export interface CNSNSMeta {
  preparerName: string;
  reviewerName: string;
  institution: string;
  licenseNumber: string;
}

interface CNSNSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: CNSNSMeta;
  setMeta: React.Dispatch<React.SetStateAction<CNSNSMeta>>;
  onGenerate: () => void;
  /** Fase 10: para avisar si el proyecto está vacío o sin calcular. */
  floorPlan?: Pick<FloorPlan, 'barriers' | 'sources'>;
}

export default function CNSNSDialog({ open, onOpenChange, meta, setMeta, onGenerate, floorPlan }: CNSNSDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Generar Memoria Analitica CNSNS</DialogTitle></DialogHeader>
        <div className="space-y-3 py-3">
          {floorPlan && <AvisoProyectoVacio floorPlan={floorPlan} />}
          <p className="text-sm text-gray-600">
            Genere el documento Word de memoria analitica listo para tramite ante la CNSNS. Incluye portada, tabla de resultados, metodologia, referencias normativas y espacios para firmas.
          </p>
          <div>
            <Label className="text-xs">Nombre del Fisico Medico (elaboro)</Label>
            <Input value={meta.preparerName} onChange={e => setMeta(p => ({ ...p, preparerName: e.target.value }))} className="h-8 text-sm" placeholder="Dr. [Nombre]" />
          </div>
          <div>
            <Label className="text-xs">Nombre del Revisor (RPO / Supervisor)</Label>
            <Input value={meta.reviewerName} onChange={e => setMeta(p => ({ ...p, reviewerName: e.target.value }))} className="h-8 text-sm" placeholder="[Nombre del revisor]" />
          </div>
          <div>
            <Label className="text-xs">Institucion / Hospital</Label>
            <Input value={meta.institution} onChange={e => setMeta(p => ({ ...p, institution: e.target.value }))} className="h-8 text-sm" placeholder="[Nombre de la institucion]" />
          </div>
          <div>
            <Label className="text-xs">Licencia CNSNS</Label>
            <Input value={meta.licenseNumber} onChange={e => setMeta(p => ({ ...p, licenseNumber: e.target.value }))} className="h-8 text-sm" placeholder="[Numero de licencia]" />
          </div>
          <Button onClick={onGenerate} className="w-full bg-red-700 hover:bg-red-800">
            <FileText className="w-4 h-4 mr-2" />Generar y Descargar DOCX
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
