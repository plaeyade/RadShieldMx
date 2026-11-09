// BatchCalculationDialog — cálculo por lotes de las barreras del plano abierto.
// Fase 7: antes mostraba ocho barreras fijas con kerma `Math.random()` y el espesor actual como «requerido».
// Ahora toma las barreras y fuentes del proyecto (`useCanvasStore`), calcula con el mismo motor que el botón
// «Calcular» del diseñador (`useShieldingEngine().calculateAllBarriers` → normativeBarrierEngine NCRP 147/151) y
// verifica el espesor instalado con `verificarBarrera`. «Aplicar al plano» guarda los requeridos en el proyecto.
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layers, Play, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCanvasStore } from '@/stores/canvasStore';
import { useShieldingEngine } from '@/hooks/useShieldingEngine';
import { verificarBarrera, type FilaVerificacion } from '@/lib/verificacionBlindaje';
import type { Barrier } from '@/types/radshield';

interface BatchCalculationDialogProps { open: boolean; onOpenChange: (v: boolean) => void }

const ETIQUETA_ESTADO: Record<FilaVerificacion['estado'], string> = {
  CUMPLE: 'Cumple', NO_CUMPLE: 'No cumple', SIN_CALCULO: 'Sin cálculo', SIN_ESPESOR: 'Sin espesor instalado', REVISAR_MATERIAL: 'Revisar material',
};

export default function BatchCalculationDialog({ open, onOpenChange }: BatchCalculationDialogProps) {
  const floorPlan = useCanvasStore(s => s.floorPlan);
  const setFloorPlan = useCanvasStore(s => s.setFloorPlan);
  const { calculateAllBarriers } = useShieldingEngine();
  const [excluidas, setExcluidas] = useState<Set<string>>(new Set());
  const [calculadas, setCalculadas] = useState<Barrier[] | null>(null);
  const barreras = floorPlan.barriers;
  const seleccion = barreras.filter(b => !excluidas.has(b.id));
  const escala = floorPlan.scale_m_per_pixel;

  const filas = useMemo(() => (calculadas ?? []).map(b => ({ b, v: verificarBarrera(b) })), [calculadas]);

  const toggle = (id: string) => setExcluidas(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });

  const calcular = () => {
    if (!floorPlan.sources.length) { toast.error('El plano no tiene fuentes: agregue al menos una.'); return; }
    if (!seleccion.length) { toast.error('Seleccione al menos una barrera.'); return; }
    setCalculadas(calculateAllBarriers(seleccion, floorPlan.sources, escala));
  };

  const aplicar = () => {
    if (!calculadas) return;
    const porId = new Map(calculadas.map(b => [b.id, b]));
    setFloorPlan({ ...floorPlan, barriers: floorPlan.barriers.map(b => porId.get(b.id) ?? b) });
    toast.success(`${calculadas.length} barrera(s) actualizadas en el plano`);
  };

  const largo = (b: Barrier) => Math.hypot(b.x2 - b.x1, b.y2 - b.y1) * escala;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="w-5 h-5 text-violet-500" /> Cálculo por lotes de las barreras del plano
            <Badge variant="outline" className="text-[10px]">{seleccion.length} de {barreras.length} seleccionadas</Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Mismo motor que el diseñador (NCRP 147 / NCRP 151 según las fuentes). Plano: {floorPlan.name} · {floorPlan.sources.length} fuente(s).
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-3 flex items-center gap-2">
          <Button size="sm" onClick={calcular} disabled={!barreras.length} data-testid="batch-calcular"><Play className="w-3.5 h-3.5 mr-1" /> Calcular</Button>
          <Button size="sm" variant="outline" onClick={aplicar} disabled={!calculadas}><Save className="w-3.5 h-3.5 mr-1" /> Aplicar al plano</Button>
          <Button size="sm" variant="ghost" onClick={() => setExcluidas(new Set())}>Todas</Button>
          <Button size="sm" variant="ghost" onClick={() => setExcluidas(new Set(barreras.map(b => b.id)))}>Ninguna</Button>
        </div>
        <ScrollArea className="px-6 pb-6 max-h-[60vh]">
          {!barreras.length ? (
            <p className="text-sm text-slate-500 py-8 text-center" data-testid="batch-vacio">El plano no tiene barreras. Dibuje muros o importe un DXF.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" /><TableHead>Barrera</TableHead><TableHead>Tipo</TableHead><TableHead>Material</TableHead>
                  <TableHead className="text-right">Largo (m)</TableHead><TableHead className="text-right">Requerido (mm)</TableHead>
                  <TableHead className="text-right">Instalado (mm)</TableHead><TableHead className="text-right">K máx. (mSv/sem)</TableHead>
                  <TableHead>Método</TableHead><TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barreras.map(b => {
                  const f = filas.find(x => x.b.id === b.id);
                  return (
                    <TableRow key={b.id}>
                      <TableCell><Checkbox aria-label={`Incluir ${b.name}`} checked={!excluidas.has(b.id)} onCheckedChange={() => toggle(b.id)} /></TableCell>
                      <TableCell className="text-xs font-medium">{b.name}</TableCell>
                      <TableCell className="text-xs">{b.barrierType}</TableCell>
                      <TableCell className="text-xs">{b.materialCode}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{largo(b).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right font-mono" data-testid={`batch-req-${b.id}`}>{f?.v.requerido_mm != null ? f.v.requerido_mm.toFixed(1) : '—'}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{f?.v.instalado_mm != null ? f.v.instalado_mm.toFixed(1) : (b.thickness_mm ?? '—')}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{f?.b.maxKerma != null ? f.b.maxKerma.toExponential(2) : '—'}</TableCell>
                      <TableCell className="text-xs">{f?.b.calculationTrace?.standard ?? '—'}</TableCell>
                      <TableCell className="text-xs">{f ? <Badge variant={f.v.estado === 'CUMPLE' ? 'default' : f.v.estado === 'NO_CUMPLE' ? 'destructive' : 'outline'}>{ETIQUETA_ESTADO[f.v.estado]}</Badge> : 'Pendiente'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
