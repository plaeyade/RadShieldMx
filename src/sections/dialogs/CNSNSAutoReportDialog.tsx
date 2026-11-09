import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { barrerasCalculadas, generarReporteCNSNSHtml, type SeccionReporte } from '@/lib/reporteCNSNSHtml';

interface ReportSection {
  id: string;
  title: string;
  description: string;
  selected: boolean;
}

const DEFAULT_SECTIONS: ReportSection[] = [
  { id: 'cover', title: 'Portada e Identificacion', description: 'Institucion, proyecto, fecha, responsables', selected: true },
  { id: 'objective', title: 'Objetivo y Alcance', description: 'Proposito del calculo, normativa aplicable', selected: true },
  { id: 'facility', title: 'Descripcion de la Instalacion', description: 'Tipo de equipo, ubicacion, caracteristicas', selected: true },
  { id: 'methodology', title: 'Metodologia de Calculo', description: 'NCRP 151, factores de uso, ocupacion, trabajo', selected: true },
  { id: 'sources', title: 'Fuentes de Radiacion', description: 'Especificaciones tecnicas de cada fuente', selected: true },
  { id: 'barriers', title: 'Barreras de Blindaje', description: 'Espesores calculados, materiales, verificacion', selected: true },
  { id: 'results', title: 'Resultados y Verificacion', description: 'Tabla comparativa, Pass/Fail, cumplimiento', selected: true },
  { id: 'conclusions', title: 'Conclusiones y Recomendaciones', description: 'Resumen ejecutivo, acciones recomendadas', selected: true },
  { id: 'references', title: 'Referencias Bibliograficas', description: 'NCRP, ICRP, ICRU, CNSNS lineamientos', selected: true },
];

interface CNSNSAutoReportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function CNSNSAutoReportDialog({ open, onOpenChange }: CNSNSAutoReportDialogProps) {
  const [sections, setSections] = useState<ReportSection[]>(DEFAULT_SECTIONS);
  const floorPlan = useCanvasStore(st => st.floorPlan);
  const calculadas = barrerasCalculadas(floorPlan).length;

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const selectedCount = sections.filter(s => s.selected).length;

  // Fase 8b: el reporte sale del proyecto (lib/reporteCNSNSHtml); antes era un HTML con resultados fijos.
  const handleExport = () => {
    const html = generarReporteCNSNSHtml(floorPlan, new Set(sections.filter(s => s.selected).map(s => s.id as SeccionReporte)));
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CNSNS_${floorPlan.name.replace(/[^\w-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-red-500" />
            Reporte CNSNS desde el proyecto
            <Badge variant="outline" className="text-[10px]">HTML</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 text-xs text-slate-500">
          Memoria en HTML a partir del proyecto «{floorPlan.name}»: fuentes, barreras, espesores requeridos del motor y verificación.
        </div>

        <div className="px-6 pb-2 flex items-center gap-2">
          <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={handleExport} disabled={calculadas === 0 || selectedCount === 0} data-testid="cnsns-exportar">
            <Download className="w-3.5 h-3.5" />Generar y descargar HTML
          </Button>
          <span className="text-xs text-slate-500 ml-auto">{selectedCount} secciones seleccionadas</span>
        </div>
        {calculadas === 0 && (
          <p className="px-6 pb-2 text-xs text-amber-700" data-testid="cnsns-vacio">El proyecto no tiene barreras calculadas: ejecute el cálculo de blindaje antes de generar el reporte.</p>
        )}

        <Separator />

        <ScrollArea className="px-6 pb-4 max-h-[45vh]">
          <div className="space-y-1">
            {sections.map(s => (
              <div key={s.id} className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors ${s.selected ? 'bg-blue-50/50' : ''}`}>
                <Checkbox checked={s.selected} onCheckedChange={() => toggleSection(s.id)} className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.title}</span>
                    {s.selected && <Badge className="text-[8px] h-3.5 px-1 bg-blue-100 text-blue-700">Incluido</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
