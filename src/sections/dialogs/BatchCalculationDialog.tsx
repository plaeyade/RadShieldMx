import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layers, Play, RotateCcw, CheckCircle2, Clock } from 'lucide-react';

interface BatchBarrier {
  id: string;
  name: string;
  type: string;
  material: string;
  thickness_cm: number;
  length_m: number;
  selected: boolean;
  status: 'pending' | 'running' | 'done' | 'error';
  kerma_mSv_wk?: number;
  requiredThickness_mm?: number;
  cost_usd?: number;
}

const INITIAL_BARRIERS: BatchBarrier[] = [
  { id: 'B1', name: 'Pared Primaria N', type: 'primary', material: 'Concreto', thickness_cm: 120, length_m: 6.5, selected: true, status: 'pending' },
  { id: 'B2', name: 'Pared Primaria S', type: 'primary', material: 'Concreto', thickness_cm: 120, length_m: 6.5, selected: true, status: 'pending' },
  { id: 'B3', name: 'Pared Secundaria E', type: 'secondary', material: 'Concreto', thickness_cm: 65, length_m: 8.2, selected: true, status: 'pending' },
  { id: 'B4', name: 'Pared Secundaria O', type: 'secondary', material: 'Concreto', thickness_cm: 65, length_m: 8.2, selected: true, status: 'pending' },
  { id: 'B5', name: 'Techo', type: 'primary', material: 'Concreto', thickness_cm: 95, length_m: 7.0, selected: true, status: 'pending' },
  { id: 'B6', name: 'Suelo', type: 'secondary', material: 'Concreto', thickness_cm: 85, length_m: 7.0, selected: true, status: 'pending' },
  { id: 'B7', name: 'Puerta Laberinto', type: 'secondary', material: 'Pb+BaB2O4', thickness_cm: 2, length_m: 1.8, selected: true, status: 'pending' },
  { id: 'B8', name: 'Pared Control', type: 'secondary', material: 'Concreto', thickness_cm: 40, length_m: 4.5, selected: true, status: 'pending' },
];

interface BatchCalculationDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function BatchCalculationDialog({ open, onOpenChange }: BatchCalculationDialogProps) {
  const [barriers, setBarriers] = useState<BatchBarrier[]>(INITIAL_BARRIERS);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const selectedCount = barriers.filter(b => b.selected).length;
  const doneCount = barriers.filter(b => b.status === 'done').length;

  const toggleSelect = (id: string) => {
    if (isRunning) return;
    setBarriers(prev => prev.map(b => b.id === id ? { ...b, selected: !b.selected } : b));
  };

  const selectAll = () => {
    if (isRunning) return;
    setBarriers(prev => prev.map(b => ({ ...b, selected: true })));
  };

  const deselectAll = () => {
    if (isRunning) return;
    setBarriers(prev => prev.map(b => ({ ...b, selected: false })));
  };

  const runBatch = () => {
    if (isRunning || selectedCount === 0) return;
    setIsRunning(true);
    setProgress(0);
    setCompletedCount(0);

    const selected = barriers.filter(b => b.selected);
    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= selected.length) {
        clearInterval(interval);
        setIsRunning(false);
        setProgress(100);
        return;
      }

      const barrier = selected[idx];
      setBarriers(prev => prev.map(b => {
        if (b.id === barrier.id) {
          // Simulated calculation
          const kerma = (Math.random() * 0.04 + 0.005);
          const reqThickness = barrier.thickness_cm * 10;
          const cost = (reqThickness / 1000) * 2350 * barrier.length_m;
          return { ...b, status: 'done', kerma_mSv_wk: kerma, requiredThickness_mm: reqThickness, cost_usd: cost };
        }
        return b;
      }));

      idx++;
      setProgress((idx / selected.length) * 100);
      setCompletedCount(idx);
    }, 600);
  };

  const reset = () => {
    setBarriers(INITIAL_BARRIERS.map(b => ({ ...b, status: 'pending' as const, kerma_mSv_wk: undefined, requiredThickness_mm: undefined, cost_usd: undefined })));
    setProgress(0);
    setCompletedCount(0);
    setIsRunning(false);
  };

  const totalCost = barriers.filter(b => b.status === 'done').reduce((s, b) => s + (b.cost_usd || 0), 0);
  const avgKerma = barriers.filter(b => b.status === 'done').reduce((s, b) => s + (b.kerma_mSv_wk || 0), 0) / (doneCount || 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="w-5 h-5 text-violet-500" />
            Batch Calculation Tool
            <Badge variant="outline" className="text-[10px]">{selectedCount} seleccionadas</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3 flex items-center gap-2">
          <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={runBatch} disabled={isRunning || selectedCount === 0}>
            {isRunning ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Calculando...' : 'Ejecutar Batch'}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={reset} disabled={isRunning}>
            <RotateCcw className="w-3.5 h-3.5" />Reiniciar
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={selectAll} disabled={isRunning}>Todas</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={deselectAll} disabled={isRunning}>Ninguna</Button>
          <div className="flex-1" />
          {doneCount > 0 && (
            <div className="text-xs text-slate-500">
              Costo total: <strong className="text-slate-700">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              {' | '}Kerma prom: <strong className="text-slate-700">{avgKerma.toFixed(4)} mSv/sem</strong>
            </div>
          )}
        </div>

        {isRunning && (
          <div className="px-6 pb-3">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs text-slate-500 w-16 text-right">{completedCount}/{selectedCount}</span>
            </div>
          </div>
        )}

        <Separator />

        <ScrollArea className="px-6 pb-6 max-h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"><Checkbox checked={selectedCount === barriers.length} onCheckedChange={() => selectedCount === barriers.length ? deselectAll() : selectAll()} /></TableHead>
                <TableHead className="text-[10px]">Barrera</TableHead>
                <TableHead className="text-[10px]">Tipo</TableHead>
                <TableHead className="text-[10px]">Material</TableHead>
                <TableHead className="text-[10px] text-right">Espesor (cm)</TableHead>
                <TableHead className="text-[10px] text-right">Kerma</TableHead>
                <TableHead className="text-[10px] text-right">Costo</TableHead>
                <TableHead className="text-[10px] text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barriers.map(b => (
                <TableRow key={b.id} className={b.status === 'done' ? 'bg-emerald-50/30' : ''}>
                  <TableCell><Checkbox checked={b.selected} onCheckedChange={() => toggleSelect(b.id)} disabled={isRunning} /></TableCell>
                  <TableCell className="text-xs font-medium">{b.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] h-4 px-1 capitalize">{b.type}</Badge></TableCell>
                  <TableCell className="text-xs">{b.material}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{b.thickness_cm}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{b.kerma_mSv_wk?.toFixed(4) || '—'}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{b.cost_usd ? `$${b.cost_usd.toFixed(0)}` : '—'}</TableCell>
                  <TableCell className="text-center">
                    {b.status === 'pending' && <span className="text-xs text-slate-400">Pendiente</span>}
                    {b.status === 'running' && <Clock className="w-3.5 h-3.5 text-blue-500 animate-spin mx-auto" />}
                    {b.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
