/**
 * CrossValidationDialog — comparación de métodos de espesor primario NCRP 151.
 *
 * Fase 8a: antes comparaba un «Archer de concreto» que en realidad era el ajuste de PLOMO de TC a 120 kVp (NCRP 147
 * Fig. A.2) con una inversa mal escrita, y calculaba B = P/K mezclando mSv con Gy. La ecuación de Archer de NCRP 147
 * no tiene ajustes de megavoltaje, así que esa comparación no tiene sentido físico. Ahora compara, con `barreraMV`
 * (Ec. 2.1), el espesor con TVL₁/TVLₑ (Ec. 2.3) frente al método simplificado de un solo TVL (n·TVLₑ) y verifica que
 * T·K·B(t) = P con el espesor de la Ec. 2.3.
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { GitCompareArrows, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { barreraMV, ENERGIAS_MV_TABULADAS, MATERIALES_MV, NOMBRE_MATERIAL } from '@/lib/calculadorasNormativas';
import { tvlPrimaria, type EnergiaMV, type MaterialNCRP151 } from '@/lib/ncrp151';

interface Props { open: boolean; onClose: () => void; }

export default function CrossValidationDialog({ open, onClose }: Props) {
  const [workload, setWorkload] = useState(450);
  const [useFactor, setUseFactor] = useState(0.25);
  const [distance, setDistance] = useState(7.2);
  const [occupancy, setOccupancy] = useState(0.025);
  const [designGoal, setDesignGoal] = useState(0.02);
  const [energia, setEnergia] = useState<EnergiaMV>(18);
  const [material, setMaterial] = useState<MaterialNCRP151>('concrete');

  const result = useMemo(() => {
    const r = barreraMV({ tipo: 'primaria', haces: [{ energia, W_Gy_semana: workload }], material, P_mSv_semana: designGoal, T: Math.min(1, occupancy), U: useFactor, d_m: distance });
    const c = r.componentes[0];
    const tvl = tvlPrimaria(energia, material);
    const n = c.B_requerida >= 1 ? 0 : Math.log10(1 / c.B_requerida);
    const t_ec23 = r.espesorDosFuentes_cm * 10;
    const t_unico = n * tvl.tvle_cm * 10;
    const dosis = Math.min(1, occupancy) * c.K_mSv_semana * c.transmision(t_ec23 / 10);
    const discrepancy = t_ec23 > 0 ? Math.abs(t_ec23 - t_unico) / t_ec23 * 100 : 0;
    return { K: c.K_mSv_semana, B: c.B_requerida, n, t_ec23, t_unico, tvl, dosis, discrepancy };
  }, [workload, useFactor, distance, occupancy, designGoal, energia, material]);

  const exportCSV = () => {
    const csv = `Metodo,Espesor_mm,Parametros
NCRP 151 Ec. 2.3 (TVL1/TVLe),${result.t_ec23.toFixed(1)},TVL1=${result.tvl.tvl1_cm}cm TVLe=${result.tvl.tvle_cm}cm
TVL unico (n x TVLe),${result.t_unico.toFixed(1)},n=${result.n.toFixed(3)}
Diferencia,${result.discrepancy.toFixed(1)}%,T*K*B(t) = ${result.dosis.toExponential(3)} mSv/sem (P = ${designGoal})`;
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
            Comparación de métodos: NCRP 151 Ec. 2.3 frente a TVL único
          </DialogTitle>
          <DialogDescription className="text-[11px]">Barrera primaria de megavoltaje (Ec. 2.1). Valores iniciales: ejemplo §7.1.1 (149.6 cm de concreto).</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'cv-w', label: 'Carga de trabajo W (Gy/semana)', value: workload, setter: setWorkload },
            { id: 'cv-u', label: 'Factor de uso U', value: useFactor, setter: setUseFactor },
            { id: 'cv-d', label: 'Distancia blanco → punto (m)', value: distance, setter: setDistance },
            { id: 'cv-t', label: 'Factor de ocupación T', value: occupancy, setter: setOccupancy },
            { id: 'cv-p', label: 'Objetivo de diseño P (mSv/semana)', value: designGoal, setter: setDesignGoal },
          ].map((f) => (
            <div key={f.id}><Label htmlFor={f.id} className="text-[11px]">{f.label}</Label><Input id={f.id} type="number" step="any" value={f.value} onChange={e => f.setter(parseFloat(e.target.value) || 0)} className="h-8 text-xs" /></div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div><Label htmlFor="cv-e" className="text-[11px]">Energía</Label>
              <select id="cv-e" value={String(energia)} onChange={e => setEnergia(Number(e.target.value) as EnergiaMV)} className="w-full h-8 text-xs border rounded px-2">
                {ENERGIAS_MV_TABULADAS.map(x => <option key={x} value={x}>{x} MV</option>)}
              </select></div>
            <div><Label htmlFor="cv-m" className="text-[11px]">Material</Label>
              <select id="cv-m" value={material} onChange={e => setMaterial(e.target.value as MaterialNCRP151)} className="w-full h-8 text-xs border rounded px-2">
                {MATERIALES_MV.map(m => <option key={m} value={m}>{NOMBRE_MATERIAL[m]}</option>)}
              </select></div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border">
          <div className="text-xs font-semibold mb-2">K sin blindaje = {result.K.toPrecision(4)} mSv/semana · B = {result.B.toExponential(3)} · n = {result.n.toFixed(2)}</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded p-3 border">
              <div className="text-[9px] text-emerald-600 font-semibold uppercase">Ec. 2.3 (TVL₁ / TVLₑ)</div>
              <div className="text-xl font-bold text-slate-800" data-testid="cv-ec23">{result.t_ec23.toFixed(1)}</div>
              <div className="text-[9px] text-slate-400">mm · TVL₁ = {result.tvl.tvl1_cm} cm, TVLₑ = {result.tvl.tvle_cm} cm</div>
            </div>
            <div className="bg-white rounded p-3 border">
              <div className="text-[9px] text-purple-600 font-semibold uppercase">TVL único (n·TVLₑ)</div>
              <div className="text-xl font-bold text-slate-800">{result.t_unico.toFixed(1)}</div>
              <div className="text-[9px] text-slate-400">mm</div>
            </div>
            <div className="bg-white rounded p-3 border">
              <div className="text-[9px] text-slate-500 font-semibold uppercase">Diferencia</div>
              <div className={`text-xl font-bold ${result.t_unico < result.t_ec23 ? 'text-red-600' : 'text-emerald-600'}`}>{result.discrepancy.toFixed(1)}%</div>
              {result.t_unico < result.t_ec23 ? <AlertTriangle className="w-4 h-4 text-red-500 mt-1" /> : <CheckCircle className="w-4 h-4 text-emerald-500 mt-1" />}
            </div>
          </div>
        </div>

        <div className="text-[10px] p-2 rounded bg-slate-50 text-slate-700">
          Con el espesor de la Ec. 2.3, T·K·B(t) = <strong>{result.dosis.toExponential(3)}</strong> mSv/semana (P = {designGoal}).{' '}
          {result.t_unico < result.t_ec23 ? 'El método de un solo TVL da menos espesor (no conservador) porque TVLₑ < TVL₁.' : 'Con TVL₁ = TVLₑ ambos métodos coinciden.'}
          <Badge variant="outline" className="ml-2 text-[9px]">NCRP 151 Ec. 2.1/2.3, Tabla B.2</Badge>
        </div>

        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Exportar CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
