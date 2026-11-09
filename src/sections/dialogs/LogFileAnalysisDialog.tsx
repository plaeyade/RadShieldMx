// Fase 9: «planificado contra entregado» del proyecto = espesor requerido por el motor (NCRP 147/151, TG-108) contra el
// espesor instalado que declaró el usuario, barrera por barrera (`requeridoContraInstalado`). Antes eran diez registros
// fijos de demostración; la app no lee bitácoras de equipo.
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FileBarChart, AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { requeridoContraInstalado } from '@/lib/estadoProyecto';
import type { EstadoVerificacion } from '@/lib/verificacionBlindaje';

interface LogFileAnalysisDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Grupo = 'pass' | 'pending' | 'fail';
const GRUPO: Record<EstadoVerificacion, Grupo> = { CUMPLE: 'pass', NO_CUMPLE: 'fail', SIN_CALCULO: 'pending', SIN_ESPESOR: 'pending', REVISAR_MATERIAL: 'pending' };
const statusConfig = {
  pass: { label: 'CUMPLE', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
  pending: { label: 'PENDIENTE', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: CircleDashed },
  fail: { label: 'NO CUMPLE', color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
};
const mm = (v: number | null) => (v === null ? '—' : v.toFixed(1));

export default function LogFileAnalysisDialog({ open, onOpenChange }: LogFileAnalysisDialogProps) {
  const floorPlan = useCanvasStore((s) => s.floorPlan);
  const [activeTab, setActiveTab] = useState<'all' | Grupo>('all');
  const filas = useMemo(() => requeridoContraInstalado(floorPlan), [floorPlan]);

  const stats = useMemo(() => {
    const total = filas.length;
    const pass = filas.filter((l) => GRUPO[l.estado] === 'pass').length;
    const pending = filas.filter((l) => GRUPO[l.estado] === 'pending').length;
    const fail = filas.filter((l) => GRUPO[l.estado] === 'fail').length;
    return { total, pass, pending, fail, passRate: total ? (pass / total) * 100 : 0 };
  }, [filas]);

  const filtradas = activeTab === 'all' ? filas : filas.filter((l) => GRUPO[l.estado] === activeTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileBarChart className="w-5 h-5 text-blue-500" />
            Requerido contra instalado — por barrera
          </DialogTitle>
          <DialogDescription className="text-xs">
            Proyecto «{floorPlan.name}»: espesor requerido por el motor normativo frente al espesor instalado declarado.
            No se analizan bitácoras de equipo.
          </DialogDescription>
        </DialogHeader>

        {stats.total === 0 ? (
          <div data-testid="log-vacio" className="px-6 pb-6 text-center text-sm text-slate-500">El plano no tiene barreras.</div>
        ) : (
          <>
            <div className="px-6 pb-3">
              <div className="grid grid-cols-5 gap-2 mb-3">
                <div className="bg-slate-50 rounded-lg p-2.5 text-center"><div className="text-xl font-bold text-slate-800">{stats.total}</div><div className="text-[10px] text-slate-500">Barreras</div></div>
                <div className="bg-emerald-50 rounded-lg p-2.5 text-center"><div className="text-xl font-bold text-emerald-700">{stats.pass}</div><div className="text-[10px] text-emerald-600">Cumplen</div></div>
                <div className="bg-amber-50 rounded-lg p-2.5 text-center"><div className="text-xl font-bold text-amber-700">{stats.pending}</div><div className="text-[10px] text-amber-600">Pendientes</div></div>
                <div className="bg-red-50 rounded-lg p-2.5 text-center"><div className="text-xl font-bold text-red-700">{stats.fail}</div><div className="text-[10px] text-red-600">No cumplen</div></div>
                <div className="bg-blue-50 rounded-lg p-2.5 text-center"><div data-testid="log-tasa" className="text-xl font-bold text-blue-700">{stats.passRate.toFixed(0)}%</div><div className="text-[10px] text-blue-600">Cumplimiento</div></div>
              </div>
              <Progress value={stats.passRate} className="h-2" />
            </div>

            <Separator />

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1">
              <div className="px-6 pt-3">
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs">Todas ({stats.total})</TabsTrigger>
                  <TabsTrigger value="pass" className="text-xs text-emerald-700">Cumplen ({stats.pass})</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs text-amber-700">Pendientes ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="fail" className="text-xs text-red-700">No cumplen ({stats.fail})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="m-0">
                <ScrollArea className="px-6 pb-6 max-h-[45vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] w-[90px]">Estado</TableHead>
                        <TableHead className="text-[10px]">Barrera</TableHead>
                        <TableHead className="text-[10px]">Material</TableHead>
                        <TableHead className="text-[10px] text-right">Requerido (mm)</TableHead>
                        <TableHead className="text-[10px] text-right">Instalado (mm)</TableHead>
                        <TableHead className="text-[10px] text-right">Diferencia</TableHead>
                        <TableHead className="text-[10px]">Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtradas.map((f) => {
                        const g = GRUPO[f.estado];
                        const cfg = statusConfig[g];
                        const Icon = cfg.icon;
                        return (
                          <TableRow key={f.barreraId} className={g === 'fail' ? 'bg-red-50/50' : g === 'pending' ? 'bg-amber-50/30' : ''}>
                            <TableCell><Badge className={`${cfg.color} text-[9px] h-5 px-1.5 gap-1`}><Icon className="w-3 h-3" />{cfg.label}</Badge></TableCell>
                            <TableCell className="text-xs font-medium">{f.barrera}</TableCell>
                            <TableCell className="text-xs">{f.material}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{mm(f.requerido_mm)}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{mm(f.instalado_mm)}</TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {f.diferencia_pct === null ? '—' : <span className={f.diferencia_pct < 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>{f.diferencia_pct > 0 ? '+' : ''}{f.diferencia_pct.toFixed(1)}%</span>}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 max-w-[200px]">{f.nota}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
