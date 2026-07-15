// =============================================================================
// MaintenanceLogDialog — Registro de mantenimiento post-construcción CNSNS (v14.3)
// NOM-008-NUCL-2018, CNSNS-LA-001/2018
// =============================================================================
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, CalendarDays, CheckCircle, AlertTriangle, ClipboardList } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

interface MaintenanceEntry {
  id: string; date: string; type: string; description: string; responsible: string;
  nextDate: string; status: 'completed' | 'pending' | 'overdue';
}

const DEFAULT_ENTRIES: MaintenanceEntry[] = [
  { id: '1', date: '2026-01-15', type: 'Dosimetría áreas', description: 'Medición de dosis en áreas adyacentes con TLD', responsible: 'Físico Médico', nextDate: '2027-01-15', status: 'pending' },
  { id: '2', date: '2026-01-15', type: 'Verificación blindaje', description: 'Inspección visual de integridad de blindajes', responsible: 'Ingeniero', nextDate: '2028-01-15', status: 'pending' },
  { id: '3', date: '2026-01-15', type: 'Calibración dosímetros', description: 'Calibración de dosímetros de área y personales', responsible: 'Laboratorio acreditado', nextDate: '2027-01-15', status: 'pending' },
  { id: '4', date: '2026-01-15', type: 'Prueba hermeticidad', description: 'Verificación de hermeticidad en sala (Si aplica radionúclidos)', responsible: 'Físico Médico', nextDate: '2027-01-15', status: 'pending' },
  { id: '5', date: '2026-01-15', type: 'Control de desechos', description: 'Revisión de acumulación y disposición de desechos radioactivos', responsible: 'Responsable RSS', nextDate: '2026-07-15', status: 'pending' },
];

const INTERVALS: Record<string, number> = {
  'Dosimetría áreas': 365, 'Verificación blindaje': 730, 'Calibración dosímetros': 365,
  'Prueba hermeticidad': 365, 'Control de desechos': 180, 'QC equipo': 90,
  'Auditoría interna': 365, 'Entrenamiento personal': 365, 'Inspección CNSNS': 730,
};

export default function MaintenanceLogDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <MaintenanceContent onOpenChange={onOpenChange} />;
}

function MaintenanceContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [entries, setEntries] = useState<MaintenanceEntry[]>(DEFAULT_ENTRIES);
  const [newType, setNewType] = useState('Dosimetría áreas');
  const [newDesc, setNewDesc] = useState('');
  const [newResp, setNewResp] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const addEntry = () => {
    const interval = INTERVALS[newType] || 365;
    const next = new Date(newDate);
    next.setDate(next.getDate() + interval);
    const entry: MaintenanceEntry = {
      id: Date.now().toString(), date: newDate, type: newType,
      description: newDesc || newType, responsible: newResp || 'Físico Médico',
      nextDate: next.toISOString().split('T')[0], status: 'pending',
    };
    setEntries([...entries, entry]);
    setNewDesc('');
  };

  const toggleStatus = (id: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, status: e.status === 'completed' ? 'pending' : 'completed' as const } : e));
  };

  const overdue = entries.filter(e => e.status !== 'completed' && new Date(e.nextDate) < new Date());
  const pending = entries.filter(e => e.status === 'pending' && new Date(e.nextDate) >= new Date());
  const completed = entries.filter(e => e.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ width: '100vw', height: '100vh' }}>
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-green-700 text-white p-2 rounded-lg"><CalendarDays className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Registro de Mantenimiento</h1>
            <p className="text-xs text-slate-500">NOM-008-NUCL-2018 / CNSNS-LA-001/2018 — Programa de verificación post-construcción</p>
          </div>
        </div>
        <Button
          aria-label="Cerrar Registro de Mantenimiento"
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-red-300 bg-red-50"><CardContent className="p-4"><div className="text-2xl font-bold text-red-700">{overdue.length}</div><div className="text-xs text-red-600">Vencidos</div></CardContent></Card>
            <Card className="border-amber-300 bg-amber-50"><CardContent className="p-4"><div className="text-2xl font-bold text-amber-700">{pending.length}</div><div className="text-xs text-amber-600">Pendientes</div></CardContent></Card>
            <Card className="border-green-300 bg-green-50"><CardContent className="p-4"><div className="text-2xl font-bold text-green-700">{completed.length}</div><div className="text-xs text-green-600">Completados</div></CardContent></Card>
          </div>

          {/* Add entry */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4"/>Nueva entrada</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div><Label className="text-xs">Tipo</Label><Select value={newType} onValueChange={setNewType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(INTERVALS).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Fecha</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
                <div><Label className="text-xs">Responsable</Label><Input value={newResp} onChange={e => setNewResp(e.target.value)} placeholder="Físico Médico" /></div>
                <div className="flex items-end"><Button onClick={addEntry} className="bg-green-600 hover:bg-green-700 w-full">Agregar</Button></div>
              </div>
              <div><Label className="text-xs">Descripción</Label><Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={`Intervalo: ${INTERVALS[newType]} días`} /></div>
            </CardContent>
          </Card>

          {/* Entries table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left text-xs">Estado</th><th className="px-3 py-2 text-left text-xs">Tipo</th><th className="px-3 py-2 text-left text-xs">Descripción</th><th className="px-3 py-2 text-left text-xs">Responsable</th><th className="px-3 py-2 text-left text-xs">Próxima fecha</th></tr></thead>
              <tbody>
                {entries.map(e => {
                  const isOverdue = e.status !== 'completed' && new Date(e.nextDate) < new Date();
                  return (
                    <tr key={e.id} className={`border-b hover:bg-slate-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-2"><button onClick={() => toggleStatus(e.id)}>{e.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-500"/> : isOverdue ? <AlertTriangle className="w-5 h-5 text-red-500"/> : <div className="w-5 h-5 rounded-full border-2 border-slate-300"/>}</button></td>
                      <td className="px-3 py-2 font-medium text-xs">{e.type}</td>
                      <td className="px-3 py-2 text-xs">{e.description}</td>
                      <td className="px-3 py-2 text-xs">{e.responsible}</td>
                      <td className="px-3 py-2 text-xs font-mono">{e.nextDate} {isOverdue && <Badge variant="destructive" className="ml-1 text-[10px]">VENCIDO</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
