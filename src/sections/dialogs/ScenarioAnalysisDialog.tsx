// =============================================================================
// ScenarioAnalysisDialog — Análisis what-if de escenarios de una barrera primaria de megavoltaje.
// Fase 7: espesor con NCRP 151 (Ec. 2.1/2.3, TVL₁/TVLₑ de la Tabla B.2) mediante `barreraMV`; P según el tipo de
// área (0.1 controlada, 0.02 no controlada). Antes usaba P = 0.1 rotulado «público» y TVL por densidad.
// =============================================================================
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, GitBranch, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { MATERIALES_MV, NOMBRE_MATERIAL, OBJETIVOS_DISENO, barreraMV, energiaTabuladaMV } from '@/lib/calculadorasNormativas';
import type { MaterialNCRP151 } from '@/lib/ncrp151';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

interface ScenarioParam {
  name: string; base: number; optimist: number; pessimist: number;
  unit: string; step: number; min: number; max: number;
}

const DEFAULT_PARAMS: ScenarioParam[] = [
  { name: 'Longitud bunker', base: 7.0, optimist: 8.5, pessimist: 6.0, unit: 'm', step: 0.5, min: 4, max: 12 },
  { name: 'Ancho bunker', base: 6.0, optimist: 7.0, pessimist: 5.0, unit: 'm', step: 0.5, min: 3, max: 10 },
  { name: 'Altura bunker', base: 3.0, optimist: 3.5, pessimist: 2.7, unit: 'm', step: 0.1, min: 2.4, max: 5 },
  { name: 'Energía (se usa la tabulada siguiente)', base: 15, optimist: 6, pessimist: 18, unit: 'MV', step: 1, min: 4, max: 30 },
  { name: 'Carga de trabajo W', base: 500, optimist: 300, pessimist: 800, unit: 'Gy/sem', step: 50, min: 50, max: 2000 },
  { name: 'Distancia blanco → punto protegido', base: 4.5, optimist: 5.5, pessimist: 3.5, unit: 'm', step: 0.5, min: 2, max: 12 },
  { name: 'Factor ocupación T', base: 0.05, optimist: 0.025, pessimist: 0.20, unit: '', step: 0.025, min: 0.01, max: 1 },
  { name: 'Factor uso U', base: 0.25, optimist: 0.125, pessimist: 0.50, unit: '', step: 0.05, min: 0.01, max: 1 },
];

export default function ScenarioAnalysisDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <ScenarioContent onOpenChange={onOpenChange} />;
}

function ScenarioContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [params, setParams] = useState<ScenarioParam[]>(DEFAULT_PARAMS);
  const [material, setMaterial] = useState<MaterialNCRP151>('concrete');
  const [areaId, setAreaId] = useState<string>('no_controlada');
  const [costPerM3, setCostPerM3] = useState(3500);

  const updateParam = (index: number, field: 'base' | 'optimist' | 'pessimist', value: string) => {
    const newParams = [...params];
    newParams[index][field] = Number(value);
    setParams(newParams);
  };

  const P = OBJETIVOS_DISENO.find((o) => o.id === areaId)!.P_mSv_semana;
  const results = useMemo(() => {
    // Barrera primaria NCRP 151 (Ec. 2.1 + 2.3); devuelve el espesor adoptado en cm (0 si no hace falta blindaje).
    const calc = (vals: number[]) => {
      const W = vals[4], U = vals[7], T = vals[6], d = vals[5];
      if (!(d > 0) || !(W > 0) || !(U > 0) || !(T > 0) || T > 1) return 0;
      return barreraMV({ tipo: 'primaria', haces: [{ energia: energiaTabuladaMV(vals[3]), W_Gy_semana: W }], material, P_mSv_semana: P, T, U, d_m: d }).espesor_cm;
    };

    const baseVals = params.map(p => p.base);
    const optVals = params.map(p => p.optimist);
    const pesVals = params.map(p => p.pessimist);

    const tBase = calc(baseVals);
    const tOpt = calc(optVals);
    const tPes = calc(pesVals);

    // Área paredes aprox
    const L = baseVals[0], W = baseVals[1], H = baseVals[2];
    const area = 2 * (L + W) * H;
    const volBase = area * (tBase / 100);
    const volOpt = area * (tOpt / 100);
    const volPes = area * (tPes / 100);

    return { tBase, tOpt, tPes, volBase, volOpt, volPes, costBase: volBase * costPerM3, costOpt: volOpt * costPerM3, costPes: volPes * costPerM3 };
  }, [params, material, P, costPerM3]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ width: '100vw', height: '100vh' }}>
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 text-white p-2 rounded-lg"><GitBranch className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Análisis de Escenarios — What-If</h1>
            <p className="text-xs text-slate-500">Compare escenarios base, optimista y pesimista para toma de decisiones</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Parameters */}
            <div className="col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Parámetros de entrada</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100"><tr><th className="px-2 py-1 text-left text-xs">Parámetro</th><th className="px-2 py-1 text-center text-xs">Base</th><th className="px-2 py-1 text-center text-xs text-emerald-700">Optimista</th><th className="px-2 py-1 text-center text-xs text-red-700">Pesimista</th><th className="px-2 py-1 text-left text-xs">Unidad</th></tr></thead>
                      <tbody>
                        {params.map((p, i) => (
                          <tr key={i} className="border-b hover:bg-slate-50">
                            <td className="px-2 py-1.5 text-xs font-medium">{p.name}</td>
                            <td className="px-1 py-1"><Input type="number" value={p.base} onChange={e => updateParam(i, 'base', e.target.value)} className="h-7 text-xs text-center" step={p.step} /></td>
                            <td className="px-1 py-1"><Input type="number" value={p.optimist} onChange={e => updateParam(i, 'optimist', e.target.value)} className="h-7 text-xs text-center border-emerald-300" step={p.step} /></td>
                            <td className="px-1 py-1"><Input type="number" value={p.pessimist} onChange={e => updateParam(i, 'pessimist', e.target.value)} className="h-7 text-xs text-center border-red-300" step={p.step} /></td>
                            <td className="px-2 py-1.5 text-xs text-slate-500">{p.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Material & Cost */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Material</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label htmlFor="sa-material" className="text-xs">Material (NCRP 151 Tabla B.2)</Label>
                    <select id="sa-material" className="h-9 w-full rounded-md border border-input px-2 text-sm" value={material} onChange={e => setMaterial(e.target.value as MaterialNCRP151)}>
                      {MATERIALES_MV.map(m => <option key={m} value={m}>{NOMBRE_MATERIAL[m]}</option>)}
                    </select></div>
                  <div><Label htmlFor="sa-area" className="text-xs">Objetivo de diseño P</Label>
                    <select id="sa-area" className="h-9 w-full rounded-md border border-input px-2 text-sm" value={areaId} onChange={e => setAreaId(e.target.value)}>
                      {OBJETIVOS_DISENO.map(o => <option key={o.id} value={o.id}>{o.etiqueta}</option>)}
                    </select></div>
                  <div><Label className="text-xs">Costo (MXN/m³)</Label><Input type="number" value={costPerM3} onChange={e => setCostPerM3(Number(e.target.value))} /></div>
                </CardContent>
              </Card>

              {/* Results */}
              <Card className="border-purple-300 bg-purple-50">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="w-4 h-4"/>Resultados</CardTitle><p className="text-[10px] text-slate-500">Primaria NCRP 151 (Ec. 2.1/2.3), P = {P} mSv/semana</p></CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-white border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-emerald-600"/><span className="text-xs font-semibold text-emerald-700">Optimista</span></div><div className="text-lg font-bold">{results.tOpt.toFixed(1)} cm</div><div className="text-xs text-slate-500">{results.volOpt.toFixed(1)} m³ | ${(results.costOpt/1000).toFixed(0)}k MXN</div></div>
                  <div className="bg-white border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-slate-700">Base</span></div><div className="text-lg font-bold" data-testid="sa-base">{results.tBase.toFixed(1)} cm</div><div className="text-xs text-slate-500">{results.volBase.toFixed(1)} m³ | ${(results.costBase/1000).toFixed(0)}k MXN</div></div>
                  <div className="bg-white border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-red-600"/><span className="text-xs font-semibold text-red-700">Pesimista</span></div><div className="text-lg font-bold">{results.tPes.toFixed(1)} cm</div><div className="text-xs text-slate-500">{results.volPes.toFixed(1)} m³ | ${(results.costPes/1000).toFixed(0)}k MXN</div></div>
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-2"><div className="text-xs text-amber-800">Variación de espesor: <strong>{results.tBase > 0 ? `${((results.tPes/results.tBase-1)*100).toFixed(0)} %` : '—'}</strong> pesimista frente a base</div></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
