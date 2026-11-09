// Fase 2: CNSNSChecklistDialog -- Checklist interactivo con progreso visual para dictamen CNSNS
import { LIMITES_DOSIS } from '@/lib/limitesDosis';
import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Download, FileText } from 'lucide-react';

interface CheckItem {
  id: string;
  category: string;
  requirement: string;
  norm: string;
  status: 'pending' | 'pass' | 'fail' | 'na';
  notes: string;
}

const DEFAULT_CHECKLIST: CheckItem[] = [
  // NOM-008-NUCL
  { id: '008-1', category: 'NOM-008-NUCL', requirement: `Dosis POE ≤ ${LIMITES_DOSIS.icrp103.poe_mSv_anio} mSv/año (promedio 5 años; ≤ ${LIMITES_DOSIS.icrp103.poeMaxUnAnio_mSv} en un año)`, norm: `${LIMITES_DOSIS.icrp103.referencia}; RGSR 1988: ${LIMITES_DOSIS.rgsr1988.poe_mSv_anio} mSv/año (verificar norma vigente)`, status: 'pending', notes: '' },
  { id: '008-2', category: 'NOM-008-NUCL', requirement: `Dosis al público ≤ ${LIMITES_DOSIS.icrp103.publico_mSv_anio} mSv/año`, norm: `${LIMITES_DOSIS.icrp103.referencia}; RGSR 1988: ${LIMITES_DOSIS.rgsr1988.publico_mSv_anio} mSv/año (verificar norma vigente)`, status: 'pending', notes: '' },
  { id: '008-3', category: 'NOM-008-NUCL', requirement: 'Dosimetria personal obligatoria', norm: 'NOM-008 §7.1', status: 'pending', notes: '' },
  { id: '008-4', category: 'NOM-008-NUCL', requirement: 'Area controlada delimitada', norm: 'NOM-008 §5.1', status: 'pending', notes: '' },
  { id: '008-5', category: 'NOM-008-NUCL', requirement: 'Señalizacion radiologica', norm: 'NOM-008 §5.2', status: 'pending', notes: '' },

  // NOM-020-NUCL
  { id: '020-1', category: 'NOM-020-NUCL', requirement: 'Inventario fuentes selladas', norm: 'NOM-020 §3.1', status: 'pending', notes: '' },
  { id: '020-2', category: 'NOM-020-NUCL', requirement: 'Verificacion pre-implante', norm: 'NOM-020 §8.1', status: 'pending', notes: '' },
  { id: '020-3', category: 'NOM-020-NUCL', requirement: 'Control residuos radioactive', norm: 'NOM-020 §9.2', status: 'pending', notes: '' },

  // NOM-030-NUCL
  { id: '030-1', category: 'NOM-030-NUCL', requirement: 'Dosis RX convencional ESD < 0.3 mGy', norm: 'NOM-030 §5.1', status: 'pending', notes: '' },
  { id: '030-2', category: 'NOM-030-NUCL', requirement: 'CTDIvol cabeza < 50 mGy', norm: 'NOM-030 §5.2', status: 'pending', notes: '' },
  { id: '030-3', category: 'NOM-030-NUCL', requirement: 'MGD mamografia < 3 mGy', norm: 'NOM-030 §5.3', status: 'pending', notes: '' },
  { id: '030-4', category: 'NOM-030-NUCL', requirement: 'Blindaje control < 20 uSv/sem', norm: 'NOM-030 §6.1', status: 'pending', notes: '' },
  { id: '030-5', category: 'NOM-030-NUCL', requirement: 'Dosis POE ocupacional < 20 mSv/ano', norm: 'NOM-030 §7.1', status: 'pending', notes: '' },

  // NOM-034-NUCL
  { id: '034-1', category: 'NOM-034-NUCL', requirement: 'Clasificacion paquete Tipo A', norm: 'NOM-034 §4.1', status: 'pending', notes: '' },
  { id: '034-2', category: 'NOM-034-NUCL', requirement: 'Seguro obligatorio transporte', norm: 'NOM-034 §6.1', status: 'pending', notes: '' },
  { id: '034-3', category: 'NOM-034-NUCL', requirement: 'Documentacion transporte completa', norm: 'NOM-034 §8.1', status: 'pending', notes: '' },

  // NOM-040-NUCL
  { id: '040-1', category: 'NOM-040-NUCL', requirement: 'Licencia CNSNS vigente', norm: 'NOM-040 §3.1', status: 'pending', notes: '' },
  { id: '040-2', category: 'NOM-040-NUCL', requirement: 'Responsable de RP designado', norm: 'NOM-040 §4.1', status: 'pending', notes: '' },
  { id: '040-3', category: 'NOM-040-NUCL', requirement: 'Programa de proteccion radiologica', norm: 'NOM-040 §5.1', status: 'pending', notes: '' },

  // NCRP 151
  { id: '151-1', category: 'NCRP 151', requirement: 'Workload IMRT = 2x convencional', norm: 'NCRP 151 §7.2', status: 'pending', notes: '' },
  { id: '151-2', category: 'NCRP 151', requirement: 'Two-source rule aplicada', norm: 'NCRP 151 §B.4', status: 'pending', notes: '' },
  { id: '151-3', category: 'NCRP 151', requirement: 'Neutrones > 10 MV considerados', norm: 'NCRP 151 §5.2', status: 'pending', notes: '' },

  // NCRP 147
  { id: '147-1', category: 'NCRP 147', requirement: 'Workload CT-DLP validado', norm: 'NCRP 147 §4.3', status: 'pending', notes: '' },
  { id: '147-2', category: 'NCRP 147', requirement: 'Ocupancia factor correcto', norm: 'NCRP 147 Tabla 4.1', status: 'pending', notes: '' },

  // AAPM TG 108
  { id: '108-1', category: 'AAPM TG 108', requirement: `Objetivos de diseño: ${LIMITES_DOSIS.objetivosDiseno.controlada_mSv_semana} mSv/semana (controlada) y ${LIMITES_DOSIS.objetivosDiseno.noControlada_mSv_semana} mSv/semana (no controlada)`, norm: 'AAPM TG-108 (adopta los objetivos de NCRP 147)', status: 'pending', notes: '' },

  // CNSNS Especifico
  { id: 'cnsns-1', category: 'CNSNS', requirement: 'Dictamen tecnico firmado por FM', norm: 'CNSNS R4', status: 'pending', notes: '' },
  { id: 'cnsns-2', category: 'CNSNS', requirement: 'Memoria descriptiva del blindaje', norm: 'CNSNS R4', status: 'pending', notes: '' },
  { id: 'cnsns-3', category: 'CNSNS', requirement: 'Planos a escala 1:50', norm: 'CNSNS R4', status: 'pending', notes: '' },
  { id: 'cnsns-4', category: 'CNSNS', requirement: 'Analisis de riesgo preliminar', norm: 'CNSNS R4', status: 'pending', notes: '' },
  { id: 'cnsns-5', category: 'CNSNS', requirement: 'Pago de derechos tramite', norm: 'CNSNS R4', status: 'pending', notes: '' },
];

const STATUS_CONFIG = {
  pass: { label: 'CUMPLE', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  fail: { label: 'NO CUMPLE', color: 'bg-red-100 text-red-700', icon: XCircle },
  na: { label: 'N/A', color: 'bg-gray-100 text-gray-500', icon: AlertTriangle },
  pending: { label: 'PENDIENTE', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CNSNSChecklistDialog({ open, onOpenChange }: Props) {
  const [items, setItems] = useState<CheckItem[]>(DEFAULT_CHECKLIST);
  const [filter, setFilter] = useState<string>('all');

  const updateStatus = useCallback((id: string, status: CheckItem['status']) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const pass = items.filter(i => i.status === 'pass').length;
    const fail = items.filter(i => i.status === 'fail').length;
    const pending = items.filter(i => i.status === 'pending').length;
    const na = items.filter(i => i.status === 'na').length;
    const progress = Math.round(((pass + na) / total) * 100);
    const dictamen = fail > 0 ? 'CON OBSERVACIONES' : pending > 0 ? 'EN PROCESO' : 'FAVORABLE';
    return { total, pass, fail, pending, na, progress, dictamen };
  }, [items]);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category));
    return Array.from(cats);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'pending') return items.filter(i => i.status === 'pending');
    if (filter === 'fail') return items.filter(i => i.status === 'fail');
    return items.filter(i => i.category === filter);
  }, [items, filter]);

  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Categoria', 'Requisito', 'Norma', 'Estado', 'Notas'];
    const rows = items.map(i => [i.id, i.category, i.requirement, i.norm, i.status, i.notes].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `CNSNS_Checklist_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Checklist exportado');
  }, [items]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-500" />
            Checklist CNSNS -- Dictamen Tecnico
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progreso: {stats.progress}%</span>
            <Badge className={stats.dictamen === 'FAVORABLE' ? 'bg-green-100 text-green-700' : stats.dictamen === 'EN PROCESO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
              {stats.dictamen}
            </Badge>
          </div>
          <Progress value={stats.progress} className="h-2" />
          <div className="flex gap-3 text-[10px]">
            <span className="text-green-600">CUMPLE: {stats.pass}</span>
            <span className="text-red-600">NO CUMPLE: {stats.fail}</span>
            <span className="text-yellow-600">PENDIENTE: {stats.pending}</span>
            <span className="text-gray-500">N/A: {stats.na}</span>
            <span className="text-gray-400">Total: {stats.total}</span>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 flex-wrap">
          <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer text-[10px] h-5" onClick={() => setFilter('all')}>Todas</Badge>
          <Badge variant={filter === 'pending' ? 'default' : 'outline'} className="cursor-pointer text-[10px] h-5" onClick={() => setFilter('pending')}>Pendientes</Badge>
          <Badge variant={filter === 'fail' ? 'default' : 'outline'} className="cursor-pointer text-[10px] h-5" onClick={() => setFilter('fail')}>Fallidas</Badge>
          {categories.map(cat => (
            <Badge key={cat} variant={filter === cat ? 'default' : 'outline'} className="cursor-pointer text-[10px] h-5" onClick={() => setFilter(cat)}>{cat}</Badge>
          ))}
        </div>

        {/* Items */}
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {filteredItems.map(item => {
              const cfg = STATUS_CONFIG[item.status];
              const Icon = cfg.icon;
              return (
                <div key={item.id} className="flex items-start gap-2 p-2 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className={`mt-0.5 p-1 rounded shrink-0 ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-xs">{item.requirement}</span>
                      <Badge variant="outline" className="text-[8px] h-3 px-1">{item.norm}</Badge>
                    </div>
                    <input
                      type="text"
                      placeholder="Notas..."
                      value={item.notes}
                      onChange={e => updateNotes(item.id, e.target.value)}
                      className="mt-1 w-full text-[10px] px-1.5 py-0.5 rounded border bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Button size="sm" variant={item.status === 'pass' ? 'default' : 'outline'} className="h-5 text-[9px] px-1.5"
                      onClick={() => updateStatus(item.id, 'pass')}>SI</Button>
                    <Button size="sm" variant={item.status === 'fail' ? 'destructive' : 'outline'} className="h-5 text-[9px] px-1.5"
                      onClick={() => updateStatus(item.id, 'fail')}>NO</Button>
                    <Button size="sm" variant={item.status === 'na' ? 'secondary' : 'outline'} className="h-5 text-[9px] px-1.5"
                      onClick={() => updateStatus(item.id, 'na')}>N/A</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={exportCSV} className="flex-1">
            <Download className="w-3.5 h-3.5 mr-1" /> Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const report = `DICTAMEN TECNICO CNSNS\n\nFecha: ${new Date().toLocaleDateString('es-MX')}\nResultado: ${stats.dictamen}\n\nRequisitos cumplidos: ${stats.pass} de ${stats.total}\nRequisitos no cumplidos: ${stats.fail}\nPendientes: ${stats.pending}\nN/A: ${stats.na}\n\nDetalle:\n${items.map(i => `- [${i.status.toUpperCase()}] ${i.requirement} (${i.norm})${i.notes ? ': ' + i.notes : ''}`).join('\n')}\n`;
            const blob = new Blob([report], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Dictamen_CNSNS_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
          }}>
            <FileText className="w-3.5 h-3.5 mr-1" /> Dictamen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
