// =============================================================================
// ReportManagerDialog.tsx — v91: Cloud report management
// =============================================================================
import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  FileText, Trash2, Search, Cloud, Download, RefreshCw,
  Plus, FileJson, Calendar, Beaker,
} from 'lucide-react';

interface Report {
  id: number;
  title: string;
  installation: string | null;
  equipment: string | null;
  modality: string | null;
  content: string;
  format: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reports: Report[];
  isLoading: boolean;
  onFetch: () => void;
  onDelete: (data: { id: number; userId: string }) => void;
  onCreate: (data: {
    userId: string;
    title: string;
    content: string;
    format: "txt" | "pdf" | "json";
    installation?: string;
    equipment?: string;
    modality?: string;
  }) => void;
  currentFloorPlan?: { name: string; sources: any[]; barriers: any[] };
}

const FORMAT_LABELS: Record<string, string> = {
  txt: 'Texto',
  pdf: 'PDF',
  json: 'JSON',
};

const FORMAT_COLORS: Record<string, string> = {
  txt: 'bg-slate-100 text-slate-700',
  pdf: 'bg-red-50 text-red-700',
  json: 'bg-blue-50 text-blue-700',
};

export default function ReportManagerDialog({
  open, onOpenChange, reports, isLoading,
  onFetch, onDelete, onCreate, currentFloorPlan,
}: Props) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', content: '', format: 'txt' as 'txt' | 'pdf' | 'json',
    installation: '', equipment: '', modality: '',
  });

  const filtered = useMemo(() =>
    reports.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.installation || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.equipment || '').toLowerCase().includes(search.toLowerCase())
    ),
    [reports, search]
  );

  const handleQuickCreate = () => {
    if (!currentFloorPlan) {
      toast.error('No hay un proyecto activo');
      return;
    }
    const title = `Memoria - ${currentFloorPlan.name} - ${new Date().toLocaleDateString()}`;
    const content = generateReportContent(currentFloorPlan);
    setFormData({
      title, content, format: 'txt',
      installation: currentFloorPlan.name,
      equipment: currentFloorPlan.sources[0]?.name || '',
      modality: currentFloorPlan.sources[0]?.modality?.name || '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Titulo y contenido son requeridos');
      return;
    }
    onCreate({
      userId: 'anonymous',
      title: formData.title.trim(),
      content: formData.content.trim(),
      format: formData.format,
      installation: formData.installation.trim() || undefined,
      equipment: formData.equipment.trim() || undefined,
      modality: formData.modality.trim() || undefined,
    });
    setShowForm(false);
    setFormData({ title: '', content: '', format: 'txt', installation: '', equipment: '', modality: '' });
    toast.success('Reporte guardado en la nube');
  };

  const handleExport = (report: Report) => {
    const blob = new Blob([report.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.${report.format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte descargado');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Administrador de Reportes
            <Badge variant="outline" className="ml-2 text-xs">{reports.length} en nube</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Actions */}
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="outline" onClick={handleQuickCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Generar del Proyecto
          </Button>
          <Button size="sm" variant="outline" onClick={() => onFetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Recargar
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar reportes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {showForm ? (
          <div className="space-y-2 p-3 border rounded-lg bg-slate-50 flex-1 overflow-auto">
            <p className="text-sm font-medium">Nuevo Reporte</p>
            <Input placeholder="Titulo *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Instalacion" value={formData.installation} onChange={e => setFormData(p => ({ ...p, installation: e.target.value }))} />
              <Input placeholder="Equipo" value={formData.equipment} onChange={e => setFormData(p => ({ ...p, equipment: e.target.value }))} />
              <Input placeholder="Modalidad" value={formData.modality} onChange={e => setFormData(p => ({ ...p, modality: e.target.value }))} />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={formData.format}
              onChange={e => setFormData(p => ({ ...p, format: e.target.value as 'txt' | 'pdf' | 'json' }))}
            >
              {Object.entries(FORMAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <textarea
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent p-3 text-sm font-mono resize-none"
              placeholder="Contenido del reporte..."
              value={formData.content}
              onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={handleSubmit}>Guardar en Nube</Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            {isLoading ? (
              <div className="text-center text-slate-400 py-12">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Cargando reportes...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                <Cloud className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay reportes en la nube</p>
                <p className="text-xs mt-1">Genere un reporte desde el proyecto actual</p>
              </div>
            ) : (
              <div className="space-y-1.5 pr-2">
                {filtered.map(report => (
                  <div key={report.id} className="flex items-start gap-3 p-2.5 rounded-lg border hover:bg-slate-50 transition-colors group">
                    <FileText className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{report.title}</p>
                        <Badge variant="outline" className={`text-[9px] ${FORMAT_COLORS[report.format] || ''}`}>
                          {FORMAT_LABELS[report.format] || report.format}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-0.5 text-[10px] text-slate-400">
                        {report.equipment && <span className="flex items-center gap-0.5"><Beaker className="w-3 h-3" /> {report.equipment}</span>}
                        {report.modality && <span>{report.modality}</span>}
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{report.content.substring(0, 120)}...</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleExport(report)} title="Descargar">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => { if (confirm('Eliminar reporte?')) onDelete({ id: report.id, userId: 'anonymous' }); }} title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function generateReportContent(floorPlan: { name: string; sources: any[]; barriers: any[] }): string {
  const lines = [
    `MEMORIA DE CALCULO - ${floorPlan.name}`,
    `Fecha: ${new Date().toLocaleString()}`,
    `Generado por: RadShield-MX`,
    '',
    '=== FUENTES ===',
    ...floorPlan.sources.map((s, i) => `${i + 1}. ${s.name} | Energia: ${s.modality?.energies?.join(', ') || 'N/A'} | Carga: ${s.workloadValue} ${s.workloadUnit}`),
    '',
    '=== BARRERAS ===',
    ...floorPlan.barriers.map((b, i) => `${i + 1}. ${b.name} | Tipo: ${b.barrierType} | Material: ${b.materialCode} | Kerma: ${(b.maxKerma || 0).toFixed(4)} mSv/sem | Estado: ${(b.maxKerma || 0) <= (b.designGoal_mSv_per_wk || 0.02) ? 'PASS' : 'FAIL'}`),
    '',
    '=== REFERENCIAS ===',
    'NCRP 147: Structural Shielding Design for Medical X-Ray Imaging Facilities',
    'NCRP 151: Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities',
    'NCRP 155: Management of Radionuclide Therapy Patients',
  ];
  return lines.join('\n');
}
