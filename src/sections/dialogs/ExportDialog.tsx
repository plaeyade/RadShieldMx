import type { FloorPlan } from '@/types/radshield';
import { Button } from '@/components/ui/button';
import AvisoProyectoVacio from '@/components/AvisoProyectoVacio';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, FileSpreadsheet } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onExportExcel?: () => void;
  /** Fase 10: para avisar si el proyecto está vacío o sin calcular. */
  floorPlan?: Pick<FloorPlan, 'barriers' | 'sources'>;
}

export default function ExportDialog({ open, onOpenChange, onExportCSV, onExportJSON, onExportExcel, floorPlan }: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Exportar Resultados</DialogTitle></DialogHeader>
        <div className="space-y-3 py-3">
          {floorPlan && <AvisoProyectoVacio floorPlan={floorPlan} />}
          <p className="text-sm text-gray-600">
            Exporte resultados para importar a Excel (hoja IMPORT_RADSHIELD_MX) o usar en memoria analitica.
          </p>
          {onExportExcel && (
            <Button onClick={onExportExcel} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <FileSpreadsheet className="w-4 h-4 mr-2" />Exportar Excel (.xls) — Multi-hoja
            </Button>
          )}
          <Button onClick={onExportCSV} className="w-full">
            <Download className="w-4 h-4 mr-2" />Exportar CSV (compatible Excel)
          </Button>
          <Button onClick={onExportJSON} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />Exportar JSON (datos completos)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
