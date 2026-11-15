import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FileText, Download } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { barrerasCalculadas, generarReporteCNSNSHtml, type SeccionReporte } from '@/lib/reporteCNSNSHtml';
import { construirMemoria, memoriaAJSON, type DatosInstalacion } from '@/lib/memoriaAnalitica';
import { toast } from 'sonner';

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
  const [datos, setDatos] = useState<DatosInstalacion>({});

  const descargar = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Memoria_analitica_${floorPlan.name.replace(/[^\w-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Memoria analítica estructurada (radshield/memoria@1) en DOCX, PDF o JSON; docx y jsPDF se cargan al pedirla.
  const exportarMemoria = async (formato: 'docx' | 'pdf' | 'json') => {
    try {
      const m = construirMemoria(floorPlan, datos);
      if (formato === 'json') return descargar(new Blob([memoriaAJSON(m)], { type: 'application/json' }), 'json');
      const x = await import('@/lib/memoriaAnaliticaExport');
      if (formato === 'docx') return descargar(await x.memoriaADocxBlob(m), 'docx');
      return descargar(x.memoriaAPdfBlob(m), 'pdf');
    } catch (err) {
      toast.error(`No se pudo generar la memoria: ${(err as Error).message}`);
    }
  };

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
        <div className="px-6 pb-2 space-y-2" data-testid="memoria-analitica-export">
          <div className="text-xs font-medium text-slate-700">Memoria analítica estructurada (radshield/memoria@1)</div>
          <div className="grid grid-cols-2 gap-2">
            <Input className="h-7 text-xs" placeholder="Razón social" value={datos.razonSocial ?? ''} onChange={(e) => setDatos(d => ({ ...d, razonSocial: e.target.value }))} />
            <Input className="h-7 text-xs" placeholder="Domicilio" value={datos.domicilio ?? ''} onChange={(e) => setDatos(d => ({ ...d, domicilio: e.target.value }))} />
            <Input className="h-7 text-xs" placeholder="Encargado de seguridad radiológica" value={datos.responsableSR ?? ''} onChange={(e) => setDatos(d => ({ ...d, responsableSR: e.target.value }))} />
            <Input className="h-7 text-xs" placeholder="Elaboró" value={datos.elaboro ?? ''} onChange={(e) => setDatos(d => ({ ...d, elaboro: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => exportarMemoria('docx')} disabled={calculadas === 0} data-testid="memoria-docx"><Download className="w-3.5 h-3.5" />DOCX</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => exportarMemoria('pdf')} disabled={calculadas === 0} data-testid="memoria-pdf"><Download className="w-3.5 h-3.5" />PDF</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => exportarMemoria('json')} disabled={calculadas === 0} data-testid="memoria-json"><Download className="w-3.5 h-3.5" />JSON</Button>
            <span className="text-[11px] text-slate-500">Lo que el proyecto no tiene queda «Por completar».</span>
          </div>
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
