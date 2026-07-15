/**
 * CrossValidationDialog — Recomendación B.5
 * Compara resultados entre métodos NCRP 147 y NCRP 151 mostrando discrepancia.
 * 
 * Fundamento: NCRP 147 (X-ray imaging, Archer equation) vs NCRP 151
 * (megavoltage, TVL method). Para energías 6 MV, ambos métodos deberían
 * concordar dentro de ~10%. Discrepancias >20% indican error en parámetros
 * o aplicación incorrecta del método (Simpkin & Dixon, 1998; McGinley 2002).
 * 
 * Archer: B = [(1+β/α)·exp(αγx) − β/α]^(-1/γ)
 * TVL: t = TVL × log₁₀(K_unshielded / P)
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { GitCompareArrows, Download, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

interface MaterialParams {
  alpha: number; beta: number; gamma: number;
  TVL_mm: number; name: string;
}

const MATERIALS: MaterialParams[] = [
  { name: 'Concrete (235 kg/m³)', alpha: 2.246, beta: 5.73, gamma: 0.547, TVL_mm: 370 },
  { name: 'Lead (Pb)', alpha: 18.83, beta: 9.13, gamma: 0.35, TVL_mm: 16.6 },
  { name: 'Steel (Fe)', alpha: 5.5, beta: 7.8, gamma: 0.42, TVL_mm: 100 },
];

function archerThickness(B: number, mat: MaterialParams): number {
  if (B >= 1) return 0;
  const inner = ((Math.pow(B, -mat.gamma) - 1) * mat.alpha) / mat.beta;
  if (inner <= 0) return 999;
  return (Math.log(inner) / mat.alpha) * 10; // cm → mm
}

function tvlThickness(K: number, P: number, TVL: number): number {
  if (K <= P) return 0;
  return TVL * Math.log10(K / P);
}

export default function CrossValidationDialog({ open, onClose }: Props) {
  const [workload, setWorkload] = useState(350);
  const [useFactor, setUseFactor] = useState(0.25);
  const [distance, setDistance] = useState(4.5);
  const [occupancy, setOccupancy] = useState(1.0);
  const [designGoal, setDesignGoal] = useState(0.02);
  const [materialIdx, setMaterialIdx] = useState(0);

  const mat = MATERIALS[materialIdx];

  const result = useMemo(() => {
    const K = (workload * useFactor) / (distance * distance);
    const P = designGoal / occupancy;
    const B = P / K;
    const t_archer = archerThickness(B, mat);
    const t_tvl = tvlThickness(K, P, mat.TVL_mm);
    const discrepancy = t_archer > 0 && t_tvl > 0 ? Math.abs(t_archer - t_tvl) / ((t_archer + t_tvl) / 2) * 100 : 0;
    return { K, P, B, t_archer, t_tvl, discrepancy };
  }, [workload, useFactor, distance, occupancy, designGoal, mat]);

  const exportCSV = () => {
    const csv = `Metodo,Espesor_mm,Parametros
NCRP 147 (Archer),${result.t_archer.toFixed(2)},alpha=${mat.alpha} beta=${mat.beta} gamma=${mat.gamma}
NCRP 151 (TVL),${result.t_tvl.toFixed(2)},TVL=${mat.TVL_mm}mm
Discrepancia,${result.discrepancy.toFixed(1)}%,${result.discrepancy > 20 ? 'ALTA - revisar parametros' : result.discrepancy > 10 ? 'MODERADA - verificar' : 'ACEPTABLE (<10%)'}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cross_validation.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="w-5 h-5 text-indigo-500" />
            NCRP 147 vs NCRP 151 Cross-Validation
            <Badge variant="outline" className="text-[10px]">B.5</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-[11px] text-indigo-700">
          <b>Simpkin & Dixon (1998), McGinley (2002):</b> Para energías de megavoltaje,
          los métodos Archer (NCRP 147) y TVL (NCRP 151) deberían concordar dentro de ~10%.
          Discrepancias &gt;20% indican error en parámetros o aplicación incorrecta.
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Carga trabajo (Gy/sem)', value: workload, setter: setWorkload },
            { label: 'Factor uso (U)', value: useFactor, setter: setUseFactor },
            { label: 'Distancia (m)', value: distance, setter: setDistance },
            { label: 'Factor ocupación (T)', value: occupancy, setter: setOccupancy },
            { label: 'Objetivo diseño P (mSv/sem)', value: designGoal, setter: setDesignGoal },
          ].map((f, i) => (
            <div key={i}><Label className="text-[11px]">{f.label}</Label><Input type="number" step="any" value={f.value} onChange={e => f.setter(parseFloat(e.target.value) || 0)} className="h-8 text-xs" /></div>
          ))}
          <div>
            <Label className="text-[11px]">Material</Label>
            <select value={materialIdx} onChange={e => setMaterialIdx(Number(e.target.value))} className="w-full h-8 text-xs border rounded px-2">
              {MATERIALS.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border">
          <div className="text-xs font-semibold mb-2">Resultados comparativos</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded p-3 border">
              <div className="text-[9px] text-purple-500 font-semibold uppercase">NCRP 147 (Archer)</div>
              <div className="text-xl font-bold text-slate-800">{result.t_archer.toFixed(2)}</div>
              <div className="text-[9px] text-slate-400">mm</div>
              <div className="text-[8px] text-slate-400 mt-1">α={mat.alpha} β={mat.beta} γ={mat.gamma}</div>
            </div>
            <div className="bg-white rounded p-3 border">
              <div className="text-[9px] text-emerald-500 font-semibold uppercase">NCRP 151 (TVL)</div>
              <div className="text-xl font-bold text-slate-800">{result.t_tvl.toFixed(2)}</div>
              <div className="text-[9px] text-slate-400">mm</div>
              <div className="text-[8px] text-slate-400 mt-1">TVL={mat.TVL_mm}mm</div>
            </div>
            <div className="bg-white rounded p-3 border">
              <div className="text-[9px] text-slate-500 font-semibold uppercase">Discrepancia</div>
              <div className={`text-xl font-bold ${result.discrepancy > 20 ? 'text-red-600' : result.discrepancy > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {result.discrepancy.toFixed(1)}%
              </div>
              <div className="text-[9px] text-slate-400">diferencia relativa</div>
              {result.discrepancy > 20 ? <AlertTriangle className="w-4 h-4 text-red-500 mt-1" /> : <CheckCircle className="w-4 h-4 text-emerald-500 mt-1" />}
            </div>
          </div>
        </div>

        <div className={`text-[10px] p-2 rounded ${result.discrepancy > 20 ? 'bg-red-50 text-red-700' : result.discrepancy > 10 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {result.discrepancy > 20
            ? '⚠️ Discrepancia ALTA (>20%). Revise: (1) energía seleccionada vs. parámetros Archer/TVL, (2) factor de uso correcto, (3) método apropiado para la energía. NCRP 147 es para rayos X diagnóstico; NCRP 151 es para megavoltaje.'
            : result.discrepancy > 10
              ? '⚡ Discrepancia MODERADA (10-20%). Verifique los parámetros del material y la energía. Los parámetros Archer varían con la energía del haz.'
              : '✅ Discrepancia ACEPTABLE (<10%). Los métodos concuerdan. Puede reportar cualquiera de los dos valores.'}
        </div>

        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
