import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MATERIALS } from '@/types/radshield';
import type { FloorPlan } from '@/types/radshield';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, TrendingUp, Info, Circle, Square } from 'lucide-react';

interface ResultsPanelProps {
  floorPlan: FloorPlan;
  roundThickness: (thickness_mm: number, materialCode: string) => number;
}

type PassFailStatus = 'pass' | 'warn' | 'fail';

function getPassFailStatus(kerma: number, goal: number): { status: PassFailStatus; percentOfGoal: number } {
  const percent = goal > 0 ? (kerma / goal) * 100 : 0;
  if (percent <= 100) return { status: 'pass', percentOfGoal: percent };
  if (percent <= 150) return { status: 'warn', percentOfGoal: percent };
  return { status: 'fail', percentOfGoal: percent };
}

// v50.6: Status icons visuales ✓/⚠/✗ + Lucide icons — WCAG 1.4.1 (not color alone)
const STATUS_CONFIG: Record<PassFailStatus, { label: string; badgeClass: string; rowClass: string; iconChar: string; Icon: typeof CheckCircle2 }> = {
  pass: {
    label: 'PASS',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    rowClass: 'hover:bg-emerald-50/30',
    iconChar: '\u2713', // ✓
    Icon: CheckCircle2,
  },
  warn: {
    label: 'WARN',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-300',
    rowClass: 'hover:bg-amber-50/30',
    iconChar: '\u26A0', // ⚠
    Icon: AlertTriangle,
  },
  fail: {
    label: 'FAIL',
    badgeClass: 'bg-red-100 text-red-700 border-red-300',
    rowClass: 'bg-red-50/40 hover:bg-red-50/60',
    iconChar: '\u2717', // ✗
    Icon: XCircle,
  },
};

export default function ResultsPanel({ floorPlan, roundThickness }: ResultsPanelProps) {
  const barriersWithResults = floorPlan.barriers.filter(b => b.requiredThickness_mm);
  const hasResults = barriersWithResults.length > 0;
  if (!hasResults) return null;

  // Calculate overall stats
  const statusCounts = { pass: 0, warn: 0, fail: 0 };
  barriersWithResults.forEach(b => {
    const { status } = getPassFailStatus(b.maxKerma || 0, b.designGoal_mSv_per_wk || 0.02);
    statusCounts[status]++;
  });
  const totalChecked = barriersWithResults.length;
  const passRate = totalChecked > 0 ? (statusCounts.pass / totalChecked) * 100 : 0;

  return (
    <div className="h-80 bg-white border-t border-gray-200">
      <Tabs defaultValue="table" className="h-full">
        <div className="flex items-center justify-between px-3 h-9 border-b border-gray-200">
          <TabsList className="h-7">
            <TabsTrigger value="table" className="text-xs">Tabla de Resultados</TabsTrigger>
            <TabsTrigger value="materials" className="text-xs">Comparativa Materiales</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs">Resumen</TabsTrigger>
            <TabsTrigger value="passfail" className="text-xs">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Pass/Fail
            </TabsTrigger>
            <TabsTrigger value="leyendas" className="text-xs">
              <Info className="w-3 h-3 mr-1" />
              Leyendas
            </TabsTrigger>
          </TabsList>
          {/* Mini semaforo en la barra de tabs */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {statusCounts.pass} PASS
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {statusCounts.warn} WARN
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {statusCounts.fail} FAIL
            </span>
            <div className="w-20 ml-1">
              <Progress value={passRate} className="h-1.5" />
            </div>
            <span className="text-slate-500">{passRate.toFixed(0)}%</span>
          </div>
        </div>

        <TabsContent value="table" className="h-[calc(100%-36px)] m-0 p-0">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] w-[60px]">Estado</TableHead>
                  <TableHead className="text-[10px]">Barrera</TableHead>
                  <TableHead className="text-[10px]">Tipo</TableHead>
                  <TableHead className="text-[10px] text-right">Long. (m)</TableHead>
                  <TableHead className="text-[10px] text-right">Kerma max</TableHead>
                  <TableHead className="text-[10px] text-right">Limite</TableHead>
                  <TableHead className="text-[10px] text-right">% Uso</TableHead>
                  {MATERIALS.slice(0, 6).map(m => (
                    <TableHead key={m.code} className="text-[10px] text-right" style={{ color: m.color }}>{m.code}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {barriersWithResults.map(b => {
                  const length_m = Math.sqrt((b.x2 - b.x1) ** 2 + (b.y2 - b.y1) ** 2) * floorPlan.scale_m_per_pixel;
                  const kerma = b.maxKerma || 0;
                  const goal = b.designGoal_mSv_per_wk || 0.02;
                  const { status, percentOfGoal } = getPassFailStatus(kerma, goal);
                  const cfg = STATUS_CONFIG[status];
                  const Icon = cfg.Icon;

                  return (
                    <TableRow key={b.id} className={cfg.rowClass}>
                      <TableCell>
                        <Badge className={`${cfg.badgeClass} text-[9px] h-5 px-1 gap-1`}>
                          <span className="font-bold mr-0.5" aria-hidden="true">{cfg.iconChar}</span>
                          <Icon className="w-3 h-3" />
                          <span>{cfg.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{b.name}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={b.barrierType === 'primary' ? 'destructive' : 'secondary'} className="text-[9px] capitalize">
                          {b.barrierType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">{length_m.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{kerma.toFixed(4)}</TableCell>
                      <TableCell className="text-xs text-right font-mono text-slate-500">{goal.toFixed(4)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-10">
                            <Progress
                              value={Math.min(percentOfGoal, 100)}
                              className={`h-1.5 ${status === 'pass' ? '[&>div]:bg-emerald-500' : status === 'warn' ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                            />
                          </div>
                          <span className={`font-mono font-bold ${status === 'pass' ? 'text-emerald-600' : status === 'warn' ? 'text-amber-600' : 'text-red-600'}`}>
                            {percentOfGoal.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      {MATERIALS.slice(0, 6).map(m => (
                        <TableCell key={m.code} className="text-xs text-right font-mono">
                          {roundThickness(b.requiredThickness_mm?.[m.code] || 0, m.code).toFixed(m.code === 'PB' ? 2 : 1)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="materials" className="h-[calc(100%-36px)] m-0 p-3">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Material</TableHead>
                  <TableHead className="text-xs text-right">Espesor total (mm)</TableHead>
                  <TableHead className="text-xs text-right">Costo est. (USD)</TableHead>
                  <TableHead className="text-xs">Certificacion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MATERIALS.map(mat => {
                  let totalThickness = 0;
                  let totalCost = 0;
                  floorPlan.barriers.forEach(b => {
                    if (!b.requiredThickness_mm) return;
                    const t = b.requiredThickness_mm[mat.code] || 0;
                    const rounded = roundThickness(t, mat.code);
                    const length_m = Math.sqrt((b.x2 - b.x1) ** 2 + (b.y2 - b.y1) ** 2) * floorPlan.scale_m_per_pixel;
                    totalThickness += rounded;
                    totalCost += (rounded / 1000) * mat.cost_per_m3 * length_m;
                  });
                  return (
                    <TableRow key={mat.code}>
                      <TableCell className="text-xs font-medium" style={{ color: mat.color }}>
                        {mat.name}
                        {mat.certifiedLab && <Badge variant="outline" className="ml-1 text-[9px]">{mat.certifiedLab}</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">{totalThickness.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right font-mono">${totalCost.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{mat.manufacturer || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="summary" className="h-[calc(100%-36px)] m-0 p-3">
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Barreras calculadas', value: barriersWithResults.length, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Puntos de muestreo', value: floorPlan.barriers.reduce((s, b) => s + (b.points?.length || 0), 0), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Kerma max (mSv/sem)', value: Math.max(...floorPlan.barriers.map(b => b.maxKerma || 0), 0).toFixed(4), icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Fuentes activas', value: floorPlan.sources.length, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(s => (
              <Card key={s.label} className={s.bg}>
                <CardContent className="p-3">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-600">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Pass/Fail summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-emerald-700">{statusCounts.pass}</div>
                <div className="text-[10px] text-emerald-600">Barreras PASS</div>
                <div className="text-[10px] text-emerald-500">Dentro del limite de diseno</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3 text-center">
                <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-amber-700">{statusCounts.warn}</div>
                <div className="text-[10px] text-amber-600">Barreras WARN</div>
                <div className="text-[10px] text-amber-500">Entre 100-150% del limite</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3 text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-red-700">{statusCounts.fail}</div>
                <div className="text-[10px] text-red-600">Barreras FAIL</div>
                <div className="text-[10px] text-red-500">Excede 150% del limite</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="passfail" className="h-[calc(100%-36px)] m-0 p-3">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {barriersWithResults.map(b => {
                const kerma = b.maxKerma || 0;
                const goal = b.designGoal_mSv_per_wk || 0.02;
                const { status, percentOfGoal } = getPassFailStatus(kerma, goal);
                const cfg = STATUS_CONFIG[status];
                const Icon = cfg.Icon;
                const length_m = Math.sqrt((b.x2 - b.x1) ** 2 + (b.y2 - b.y1) ** 2) * floorPlan.scale_m_per_pixel;

                return (
                  <div key={b.id} className={`border rounded-lg p-3 ${status === 'fail' ? 'border-red-300 bg-red-50/30' : status === 'warn' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" aria-hidden="true">{cfg.iconChar}</span>
                        <Icon className={`w-5 h-5 ${status === 'pass' ? 'text-emerald-600' : status === 'warn' ? 'text-amber-600' : 'text-red-600'}`} />
                        <span className="font-medium text-sm">{b.name}</span>
                        <Badge variant="outline" className="text-[9px] capitalize">{b.barrierType}</Badge>
                      </div>
                      <Badge className={`${cfg.badgeClass} text-[10px] h-6 px-2`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Kerma real:</span>
                        <span className="ml-1 font-mono font-bold">{kerma.toFixed(4)} mSv/sem</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Limite:</span>
                        <span className="ml-1 font-mono">{goal.toFixed(4)} mSv/sem</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Longitud:</span>
                        <span className="ml-1 font-mono">{length_m.toFixed(2)} m</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Progress
                            value={Math.min(percentOfGoal, 100)}
                            className={`h-2 ${status === 'pass' ? '[&>div]:bg-emerald-500' : status === 'warn' ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                          />
                        </div>
                        <span className={`font-mono font-bold text-sm ${status === 'pass' ? 'text-emerald-600' : status === 'warn' ? 'text-amber-600' : 'text-red-600'}`}>
                          {percentOfGoal.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {status === 'fail' && (
                      <div className="mt-2 text-[10px] text-red-600 bg-red-100 rounded px-2 py-1">
                        <strong>Accion requerida:</strong> Aumentar espesor de blindaje o reducir carga de trabajo. La barrera no cumple con el limite de diseno.
                      </div>
                    )}
                    {status === 'warn' && (
                      <div className="mt-2 text-[10px] text-amber-700 bg-amber-100 rounded px-2 py-1">
                        <strong>Advertencia:</strong> El kerma se acerca al limite. Considerar margen adicional.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* A.3: Leyendas mejoradas — visual reference for colors, symbols, materials */}
        <TabsContent value="leyendas" className="h-[calc(100%-36px)] m-0 p-3">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {/* Semaforo legend */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Semaforo de Cumplimiento</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-[10px] font-bold text-emerald-700">PASS</div>
                      <div className="text-[9px] text-emerald-600">Kerma dentro del limite de diseno</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-[10px] font-bold text-amber-700">WARN</div>
                      <div className="text-[9px] text-amber-600">Entre 100-150% del limite</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-red-50 border border-red-200">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="text-[10px] font-bold text-red-700">FAIL</div>
                      <div className="text-[9px] text-red-600">Excede 150% del limite</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barrier type legend */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tipos de Barrera</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-1 bg-red-500 rounded" />
                    <div>
                      <div className="text-[10px] font-bold">Primaria</div>
                      <div className="text-[9px] text-slate-500">Haz directo, uso factor = 1.0</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-1 bg-blue-500 rounded border-dashed border-t border-blue-500" style={{borderTopStyle:'dashed'}} />
                    <div>
                      <div className="text-[10px] font-bold">Secundaria</div>
                      <div className="text-[9px] text-slate-500">Dispersion, uso factor &lt; 1.0</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-1 bg-emerald-500 rounded" />
                    <div>
                      <div className="text-[10px] font-bold">Maze/Laberinto</div>
                      <div className="text-[9px] text-slate-500">Entrada con scatter multiple</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Material color legend */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Materiales de Blindaje</h4>
                <div className="grid grid-cols-4 gap-2">
                  {MATERIALS.map(m => (
                    <div key={m.code} className="flex items-center gap-2 p-1.5 rounded border border-slate-100">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: m.color }} />
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium truncate" style={{ color: m.color }}>{m.code}</div>
                        <div className="text-[9px] text-slate-500 truncate">{m.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Symbol legend */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Simbolos del Canvas</h4>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 text-orange-500 fill-orange-500" />
                    <span className="text-slate-600">Fuente de radiacion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="w-3 h-3 text-blue-500" />
                    <span className="text-slate-600">Region ocupada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-purple-500" />
                    <span className="text-slate-600">Punto de muestreo</span>
                  </div>
                </div>
              </div>

              {/* NCRP reference legend */}
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <h4 className="text-xs font-bold text-slate-600 mb-1">Referencias Normativas Aplicables</h4>
                <div className="text-[9px] text-slate-500 space-y-0.5">
                  <div>NCRP 151: Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities</div>
                  <div>NCRP 147: Structural Shielding Design for Medical X-Ray Imaging Facilities</div>
                  <div>NOM-008-ENER: Lineamientos para proteccion radiologica en instalaciones medicas (Mexico)</div>
                  <div>IAEA Safety Standards Series No. 47: Radiation Protection in the Design of Radiotherapy Facilities</div>
                  <div>AAPM TG 108: PET and PET/CT Shielding Requirements</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
