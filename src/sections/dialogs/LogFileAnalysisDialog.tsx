import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FileBarChart, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  operation: string;
  plannedValue: number;
  deliveredValue: number;
  unit: string;
  difference: number;
  percentDiff: number;
  status: 'pass' | 'warn' | 'fail';
  barrier?: string;
  source?: string;
  notes: string;
}

const MOCK_LOGS: LogEntry[] = [
  { id: 'L001', timestamp: '2026-05-28 14:32:15', operation: 'Espesor barrera primaria', plannedValue: 120.5, deliveredValue: 121.0, unit: 'cm concreto', difference: 0.5, percentDiff: 0.41, status: 'pass', barrier: 'Pared primaria N', source: 'LINAC 6MV-1', notes: 'Dentro de tolerancia (+/- 2%)' },
  { id: 'L002', timestamp: '2026-05-28 14:32:15', operation: 'Espesor barrera secundaria', plannedValue: 65.0, deliveredValue: 68.2, unit: 'cm concreto', difference: 3.2, percentDiff: 4.92, status: 'warn', barrier: 'Pared secundaria E', source: 'LINAC 6MV-1', notes: 'Exceso de 4.9%, verificar si fue intencional' },
  { id: 'L003', timestamp: '2026-05-28 14:32:15', operation: 'TADR area controlada', plannedValue: 0.020, deliveredValue: 0.019, unit: 'mSv/semana', difference: -0.001, percentDiff: -5.0, status: 'pass', barrier: 'Techo', source: 'LINAC 6MV-1', notes: 'Cumple limite de 0.020 mSv/sem' },
  { id: 'L004', timestamp: '2026-05-28 14:45:22', operation: 'Kerma en punto de control', plannedValue: 0.100, deliveredValue: 0.135, unit: 'mSv/semana', difference: 0.035, percentDiff: 35.0, status: 'fail', barrier: 'Pared laberinto', source: 'LINAC 6MV-1', notes: 'EXCEDE LIMITE: Revisar configuracion del laberinto o aumentar espesor' },
  { id: 'L005', timestamp: '2026-05-28 14:45:22', operation: 'Dosis acumulada anual', plannedValue: 5.0, deliveredValue: 4.2, unit: 'mSv/ano', difference: -0.8, percentDiff: -16.0, status: 'pass', barrier: 'Puerta bunker', source: 'LINAC 6MV-1', notes: 'Dosis bien por debajo del limite anual de 5 mSv' },
  { id: 'L006', timestamp: '2026-05-28 15:10:05', operation: 'Transmitancia puerta', plannedValue: 0.001, deliveredValue: 0.0012, unit: 'fraccion', difference: 0.0002, percentDiff: 20.0, status: 'warn', barrier: 'Puerta lead-lined', source: 'HDR Co-60', notes: 'Ligeramente mayor, aun aceptable para proteccion' },
  { id: 'L007', timestamp: '2026-05-28 15:10:05', operation: 'Blindaje suelo', plannedValue: 85.0, deliveredValue: 85.0, unit: 'cm concreto', difference: 0, percentDiff: 0, status: 'pass', barrier: 'Suelo', source: 'HDR Co-60', notes: 'Coincidencia exacta con calculo' },
  { id: 'L008', timestamp: '2026-05-28 15:22:18', operation: 'Dosis en feto (embarazada)', plannedValue: 0.5, deliveredValue: 0.47, unit: 'mSv/mes', difference: -0.03, percentDiff: -6.0, status: 'pass', barrier: 'Pared adyacente consultorio', source: 'LINAC 6MV-1', notes: 'Cumple limite de 0.5 mSv/mes para personal embarazado' },
  { id: 'L009', timestamp: '2026-05-28 15:22:18', operation: 'Espesor minimo requerido', plannedValue: 95.0, deliveredValue: 90.0, unit: 'cm concreto', difference: -5.0, percentDiff: -5.26, status: 'fail', barrier: 'Pared primaria S', source: 'LINAC 15MV', notes: 'INSUFICIENTE: Blindaje real 5.3% menor al calculado. RIESGO DE NO CUMPLIMIENTO' },
  { id: 'L010', timestamp: '2026-05-28 15:35:40', operation: 'Tiempo de calculo MC', plannedValue: 45.0, deliveredValue: 42.0, unit: 'minutos', difference: -3.0, percentDiff: -6.67, status: 'pass', source: 'Monte Carlo', notes: 'Simulacion completada en 42 min con 1M particulas' },
];

interface LogFileAnalysisDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function LogFileAnalysisDialog({ open, onOpenChange }: LogFileAnalysisDialogProps) {
  const [activeTab, setActiveTab] = useState('all');

  const stats = useMemo(() => {
    const total = MOCK_LOGS.length;
    const pass = MOCK_LOGS.filter(l => l.status === 'pass').length;
    const warn = MOCK_LOGS.filter(l => l.status === 'warn').length;
    const fail = MOCK_LOGS.filter(l => l.status === 'fail').length;
    const avgDiff = MOCK_LOGS.reduce((s, l) => s + Math.abs(l.percentDiff), 0) / total;
    return { total, pass, warn, fail, avgDiff, passRate: (pass / total) * 100 };
  }, []);

  const filteredLogs = useMemo(() => {
    if (activeTab === 'all') return MOCK_LOGS;
    return MOCK_LOGS.filter(l => l.status === activeTab);
  }, [activeTab]);

  const statusConfig = {
    pass: { label: 'PASS', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
    warn: { label: 'WARN', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: AlertTriangle },
    fail: { label: 'FAIL', color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileBarChart className="w-5 h-5 text-blue-500" />
            Log File Analysis — Planificado vs Entregado
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3">
          {/* Summary cards */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-[10px] text-slate-500">Total checks</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-emerald-700">{stats.pass}</div>
              <div className="text-[10px] text-emerald-600">PASS</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-amber-700">{stats.warn}</div>
              <div className="text-[10px] text-amber-600">WARN</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-red-700">{stats.fail}</div>
              <div className="text-[10px] text-red-600">FAIL</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-blue-700">{stats.passRate.toFixed(0)}%</div>
              <div className="text-[10px] text-blue-600">Tasa de exito</div>
            </div>
          </div>

          {/* Pass rate progress bar */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-500">Tasa cumplimiento:</span>
            <Progress value={stats.passRate} className="h-2 flex-1" />
            <span className="text-[10px] font-medium text-slate-700">{stats.avgDiff.toFixed(1)}% diff. promedio</span>
          </div>
        </div>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6 pt-3">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="pass" className="text-xs text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />PASS ({stats.pass})
              </TabsTrigger>
              <TabsTrigger value="warn" className="text-xs text-amber-700">
                <AlertTriangle className="w-3 h-3 mr-1" />WARN ({stats.warn})
              </TabsTrigger>
              <TabsTrigger value="fail" className="text-xs text-red-700">
                <AlertTriangle className="w-3 h-3 mr-1" />FAIL ({stats.fail})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="px-6 pb-6 max-h-[45vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-[80px]">Estado</TableHead>
                    <TableHead className="text-[10px]">Operacion</TableHead>
                    <TableHead className="text-[10px] text-right">Planificado</TableHead>
                    <TableHead className="text-[10px] text-right">Entregado</TableHead>
                    <TableHead className="text-[10px] text-right">Diferencia %</TableHead>
                    <TableHead className="text-[10px]">Barrera/Fuente</TableHead>
                    <TableHead className="text-[10px]">Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => {
                    const cfg = statusConfig[log.status];
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={log.id} className={log.status === 'fail' ? 'bg-red-50/50' : log.status === 'warn' ? 'bg-amber-50/30' : ''}>
                        <TableCell>
                          <Badge className={`${cfg.color} text-[9px] h-5 px-1.5 gap-1`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{log.operation}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{log.plannedValue.toFixed(2)} <span className="text-slate-400">{log.unit}</span></TableCell>
                        <TableCell className="text-xs text-right font-mono">{log.deliveredValue.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-right">
                          <span className={`font-mono font-bold ${log.percentDiff > 0 ? 'text-emerald-600' : log.percentDiff < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {log.percentDiff > 0 ? '+' : ''}{log.percentDiff.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {log.barrier && <div>{log.barrier}</div>}
                          {log.source && <div className="text-slate-400">{log.source}</div>}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-[200px]">{log.notes}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
