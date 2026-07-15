/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v32 — Shielding Optimizer Dialog
 *  Multi-objective genetic algorithm for cost/weight/space optimization
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { TrendingDown, Play, Download, CheckCircle, AlertTriangle, Star, BarChart3, Layers, DollarSign, Weight, ArrowRight } from 'lucide-react';
import {
  runShieldingOptimization, OPTIMIZATION_MATERIALS,
  type OptimizerConfig, type OptimizationBarrier, type OptimizationResult, type ObjectiveFunction,
} from '@/lib/shieldingOptimizer';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const DEFAULT_BARRIERS: OptimizationBarrier[] = [
  { id: 'p1', name: 'Pared Primaria (gantro)', area_m2: 18, distance_to_source_m: 4.2, use_factor: 0.25, occupancy_factor: 0.2, dose_limit_mSv_week: 0.02, workload_Gy_week: 40, is_primary: true, is_maze: false, current_thickness_mm: 1400, current_material: 'concreto_ordinario' },
  { id: 's1', name: 'Pared Secundaria (control)', area_m2: 15, distance_to_source_m: 4.5, use_factor: 1.0, occupancy_factor: 1.0, dose_limit_mSv_week: 0.4, workload_Gy_week: 40, is_primary: false, is_maze: false, current_thickness_mm: 900, current_material: 'concreto_ordinario' },
  { id: 's2', name: 'Pared Secundaria (pasillo)', area_m2: 15, distance_to_source_m: 3.8, use_factor: 1.0, occupancy_factor: 0.125, dose_limit_mSv_week: 0.02, workload_Gy_week: 40, is_primary: false, is_maze: false, current_thickness_mm: 700, current_material: 'concreto_ordinario' },
  { id: 'm1', name: 'Maze (laberinto)', area_m2: 8, distance_to_source_m: 5.5, use_factor: 0.25, occupancy_factor: 0.125, dose_limit_mSv_week: 0.02, workload_Gy_week: 40, is_primary: false, is_maze: true, current_thickness_mm: 1000, current_material: 'concreto_ordinario' },
  { id: 't1', name: 'Techo', area_m2: 36, distance_to_source_m: 3.5, use_factor: 0.25, occupancy_factor: 0.025, dose_limit_mSv_week: 0.02, workload_Gy_week: 40, is_primary: true, is_maze: false, current_thickness_mm: 1200, current_material: 'concreto_ordinario' },
];

export default function ShieldingOptimizerDialog({ open, onOpenChange }: Props) {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [objective, setObjective] = useState<ObjectiveFunction>('multi');
  const [generations, setGenerations] = useState('50');
  const [popSize, setPopSize] = useState('40');
  const [energy, setEnergy] = useState('6');
  const [barriers, setBarriers] = useState<OptimizationBarrier[]>(DEFAULT_BARRIERS);
  const [activeTab, setActiveTab] = useState('setup');

  const handleOptimize = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      try {
        const config: OptimizerConfig = {
          barriers,
          materialOptions: OPTIMIZATION_MATERIALS,
          objective,
          populationSize: parseInt(popSize) || 40,
          generations: parseInt(generations) || 50,
          mutationRate: 0.1,
          crossoverRate: 0.8,
          eliteFraction: 0.1,
          energy_MV: parseInt(energy) || 6,
        };
        const res = runShieldingOptimization(config);
        setResult(res);
        setActiveTab('results');
        toast.success(`Optimizacion completada: ${res.paretoFront.length} soluciones en frente de Pareto en ${res.calculationTime_ms.toFixed(0)} ms`);
      } catch (e) {
        toast.error('Error: ' + (e as Error).message);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  }, [barriers, objective, popSize, generations, energy]);

  const exportCSV = useCallback(() => {
    if (!result) return;
    const rows = [
      ['Rank', 'Material', 'Espesor_mm', 'Costo_USD', 'Peso_kg', 'Cumple'],
    ];
    result.paretoFront.forEach((sol, si) => {
      sol.materialKeys.forEach((m, mi) => {
        rows.push([String(si+1), m, sol.thicknesses_mm[mi].toFixed(1), sol.totalCost_USD.toFixed(0), sol.totalWeight_kg.toFixed(0), sol.doseCompliance[mi] ? 'SI' : 'NO']);
      });
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Optimizacion_Blindaje_${energy}MV.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  }, [result, energy]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="w-5 h-5 text-emerald-500" />
            Shielding Optimizer — Algoritmo Genetico (NSGA-II)
            <Badge className="text-[9px] bg-emerald-100 text-emerald-700">v32</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <TabsList className="mx-5 mt-2 grid grid-cols-4 h-8">
            <TabsTrigger value="setup" className="text-[11px]">Configuracion</TabsTrigger>
            <TabsTrigger value="results" className="text-[11px]">Resultados</TabsTrigger>
            <TabsTrigger value="pareto" className="text-[11px]">Frente Pareto</TabsTrigger>
            <TabsTrigger value="convergence" className="text-[11px]">Convergencia</TabsTrigger>
          </TabsList>

          <div className="h-[58vh]">
            <TabsContent value="setup" className="mt-0 h-full m-0">
              <ScrollArea className="h-full px-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Parametros del Algoritmo
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-[10px]">Objetivo</Label>
                        <Select value={objective} onValueChange={(v) => setObjective(v as ObjectiveFunction)}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cost" className="text-xs"><DollarSign className="w-3 h-3 inline" /> Minimizar costo</SelectItem>
                            <SelectItem value="weight" className="text-xs"><Weight className="w-3 h-3 inline" /> Minimizar peso</SelectItem>
                            <SelectItem value="thickness" className="text-xs"><Layers className="w-3 h-3 inline" /> Minimizar espesor</SelectItem>
                            <SelectItem value="multi" className="text-xs"><Star className="w-3 h-3 inline" /> Multi-objetivo (NSGA-II)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-[10px]">Energia (MV)</Label><Input value={energy} onChange={e => setEnergy(e.target.value)} type="number" className="h-7 text-xs" /></div>
                      <div><Label className="text-[10px]">Generaciones</Label><Input value={generations} onChange={e => setGenerations(e.target.value)} type="number" className="h-7 text-xs" /></div>
                      <div><Label className="text-[10px]">Poblacion</Label><Input value={popSize} onChange={e => setPopSize(e.target.value)} type="number" className="h-7 text-xs" /></div>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-700 mt-2">Barreras ({barriers.length})</div>
                    <div className="space-y-1.5">
                      {barriers.map((b, i) => (
                        <div key={b.id} className="bg-slate-50 rounded p-2 border text-[10px] space-y-1">
                          <div className="flex justify-between"><strong>{b.name}</strong><span>{b.area_m2} m2, d={b.distance_to_source_m}m</span></div>
                          <div className="flex gap-2 text-slate-500">
                            <span>U={b.use_factor}</span><span>T={b.occupancy_factor}</span><span>P={b.dose_limit_mSv_week} mSv/sem</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" /> Materiales Disponibles
                    </div>
                    <div className="space-y-1">
                      {OPTIMIZATION_MATERIALS.map(m => (
                        <div key={m.key} className="flex justify-between text-[10px] bg-slate-50 p-1.5 rounded border">
                          <span><strong>{m.name}</strong></span>
                          <span className="text-slate-500">${m.cost_per_m3.toLocaleString()}/m3 | {m.density_kg_m3} kg/m3 | TVL={m.tvl_primary_6MV_mm}mm</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-[10px] text-emerald-700">
                      <strong>Algoritmo NSGA-II</strong> (Deb, 2002): Poblacion de {popSize} individuos, {generations} generaciones. Seleccion por ranking no-dominado + crowding distance. Cruce de un punto + mutacion gaussiana. Elitismo 10%.
                    </div>
                    <Button size="sm" className="w-full text-xs gap-1" onClick={handleOptimize} disabled={isRunning}>
                      <Play className="w-3.5 h-3.5" /> {isRunning ? 'Optimizando...' : 'Ejecutar Optimizacion'}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="results" className="mt-0 h-full m-0">
              <ScrollArea className="h-full px-5 py-4">
                {!result ? (
                  <div className="text-center py-8 text-slate-400"><TrendingDown className="w-8 h-8 mx-auto mb-2" />Ejecute la optimizacion para ver resultados.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{result.paretoFront.length} soluciones Pareto</Badge>
                      <span className="text-[10px] text-slate-400">{result.calculationTime_ms.toFixed(0)} ms</span>
                      <div className="flex-1" />
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={exportCSV}><Download className="w-3 h-3 mr-1" /> CSV</Button>
                    </div>
                    {result.paretoFront.slice(0, 5).map((sol, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3 border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">{i + 1}</span>
                          <span className="text-[11px] font-semibold">Solucion #{i + 1}</span>
                          {sol.doseCompliance.every(Boolean) ? <Badge className="text-[9px] bg-emerald-100 text-emerald-700"><CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Cumple dosis</Badge> : <Badge variant="destructive" className="text-[9px]"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> No cumple</Badge>}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px]">
                          <div className="bg-white rounded p-1.5 border"><div className="text-slate-400">Costo</div><div className="font-bold text-emerald-700">${sol.totalCost_USD.toLocaleString(undefined, {maximumFractionDigits: 0})} USD</div></div>
                          <div className="bg-white rounded p-1.5 border"><div className="text-slate-400">Peso</div><div className="font-bold text-blue-700">{sol.totalWeight_kg.toLocaleString(undefined, {maximumFractionDigits: 0})} kg</div></div>
                          <div className="bg-white rounded p-1.5 border"><div className="text-slate-400">Espesor total</div><div className="font-bold text-amber-700">{(sol.totalThickness_mm / 1000).toFixed(2)} m</div></div>
                          <div className="bg-white rounded p-1.5 border"><div className="text-slate-400">Complejidad</div><div className="font-bold text-purple-700">{sol.maxComplexity}/10</div></div>
                        </div>
                        <div className="mt-2 space-y-0.5">
                          {sol.materialKeys.map((m, mi) => (
                            <div key={mi} className="flex justify-between text-[10px]">
                              <span>{barriers[mi]?.name}: <strong>{OPTIMIZATION_MATERIALS.find(x => x.key === m)?.name || m}</strong></span>
                              <span>{sol.thicknesses_mm[mi].toFixed(0)} mm {sol.doseCompliance[mi] ? <CheckCircle className="w-2.5 h-2.5 inline text-emerald-500" /> : <AlertTriangle className="w-2.5 h-2.5 inline text-red-500" />}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pareto" className="mt-0 h-full m-0">
              <ScrollArea className="h-full px-5 py-4">
                {result ? (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold">Comparacion Costo vs Peso (frente de Pareto)</div>
                    <div className="font-mono text-[10px] space-y-0.5">
                      {result.paretoFront.map((s, i) => {
                        const costBar = Math.round((s.totalCost_USD / Math.max(...result.paretoFront.map(x => x.totalCost_USD))) * 40);
                        const weightBar = Math.round((s.totalWeight_kg / Math.max(...result.paretoFront.map(x => x.totalWeight_kg))) * 40);
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-4 text-right">{i + 1}</span>
                            <span className="w-16 text-right">${(s.totalCost_USD / 1000).toFixed(0)}k</span>
                            <span className="text-emerald-500">{'█'.repeat(costBar)}</span>
                            <span className="w-20 text-right">{(s.totalWeight_kg / 1000).toFixed(1)}t</span>
                            <span className="text-blue-500">{'█'.repeat(weightBar)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : <div className="text-center py-8 text-slate-400">Ejecute primero.</div>}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="convergence" className="mt-0 h-full m-0">
              <ScrollArea className="h-full px-5 py-4">
                {result ? (
                  <div>
                    <div className="text-[11px] font-semibold mb-2">Historial de convergencia (costo promedio frente Pareto)</div>
                    <div className="font-mono text-[9px] space-y-0.5">
                      {result.convergenceHistory.filter((_, i) => i % 5 === 0).map(([gen, cost], i) => {
                        const barLen = Math.min(50, Math.round(cost / 1000));
                        return (
                          <div key={i} className="flex items-center gap-1">
                            <span className="w-8 text-right">G{String(gen).padStart(2, '0')}</span>
                            <span className="w-1">|</span>
                            <span className="text-emerald-500">{'█'.repeat(barLen)}</span>
                            <span className="text-slate-400">${cost.toFixed(0)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : <div className="text-center py-8 text-slate-400">Ejecute primero.</div>}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
