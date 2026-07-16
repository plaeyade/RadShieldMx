/**
 * v106: Material Comparison Tool
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/appStore';
import { GitCompareArrows } from 'lucide-react';
import { SHIELDING_MATERIALS } from '@/lib/xcomAttenuation';
import { buildF123MaterialDecisionMatrix } from '@/lib/f123MaterialDecisionMatrix';
import { buildF124MaterialToolboxSummary } from '@/lib/f124MaterialToolboxConsolidation';
import { buildF172AResearchMethodology } from '@/lib/f172aArxivResearchMethodology';

const COST: Record<string, number> = { PB: 2.5, CONCRETE: 0.15, STEEL: 1.2, GYPSUM: 0.4, POLYETHYLENE: 3.5, BPE: 8.0, TUNGSTEN: 45.0 };

export default function MaterialComparisonDialog() {
  const open = useAppStore(s => s.dialogs.materialComparison?.open ?? false);
  const close = () => useAppStore.getState().close('materialComparison');
  const [energy, setEnergy] = useState('1');
  const [area, setArea] = useState('10');
  const eN = parseFloat(energy) || 1;
  const aN = parseFloat(area) || 10;
  const f123Matrix = useMemo(() => buildF123MaterialDecisionMatrix({ areaM2: aN }), [aN]);
  const f124Toolbox = useMemo(() => buildF124MaterialToolboxSummary(), []);
  const f172aMethodology = useMemo(() => buildF172AResearchMethodology(), []);
  const f172aMaterials = f172aMethodology.sources.find(source => source.modality === 'Materials');

  const data = useMemo(() => SHIELDING_MATERIALS.map(m => {
    const entry = m.data.find(d => d.energy_MeV >= eN) ?? m.data[m.data.length - 1];
    const thvl = entry.halfValueLayer_mm;
    const t2tvl = entry.tenthValueLayer_mm * 2;
    const mhvl = aN * (thvl / 1000) * m.density_g_per_cm3 * 1000;
    const m2tvl = aN * (t2tvl / 1000) * m.density_g_per_cm3 * 1000;
    return { code: m.code, name: m.nameEs, rho: m.density_g_per_cm3, z: m.effectiveZ, hvl: thvl, tvl: entry.tenthValueLayer_mm, mhvl, m2tvl, chvl: mhvl * (COST[m.code] ?? 1), c2tvl: m2tvl * (COST[m.code] ?? 1) };
  }), [eN, aN]);

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <GitCompareArrows className="w-4 h-4 text-orange-500" /> Material Comparison (v106)
            <Badge variant="outline" className="text-[9px]">7 Materiales</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-3 mb-3">
          <div className="flex-1"><label className="text-[10px] text-slate-500 font-medium mb-1 block">Energia</label>
            <Select value={energy} onValueChange={setEnergy}><SelectTrigger className="text-[11px] h-7"><SelectValue /></SelectTrigger><SelectContent>{[0.05, 0.1, 0.5, 1, 2, 4, 6, 10].map(e => <SelectItem key={e} value={e.toString()} className="text-[11px]">{e} MeV</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="flex-1"><label className="text-[10px] text-slate-500 font-medium mb-1 block">Area (m²)</label>
            <Select value={area} onValueChange={setArea}><SelectTrigger className="text-[11px] h-7"><SelectValue /></SelectTrigger><SelectContent>{['5','10','15','20','30','50'].map(a => <SelectItem key={a} value={a} className="text-[11px]">{a} m²</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="bg-slate-50"><tr><th className="text-left px-2 py-1.5">Material</th><th className="text-right px-2 py-1.5">ρ</th><th className="text-right px-2 py-1.5">Zeff</th><th className="text-right px-2 py-1.5">HVL mm</th><th className="text-right px-2 py-1.5">TVL mm</th><th className="text-right px-2 py-1.5">kg@HVL</th><th className="text-right px-2 py-1.5">$@HVL</th><th className="text-right px-2 py-1.5">kg@2TVL</th><th className="text-right px-2 py-1.5">$@2TVL</th></tr></thead>
            <tbody>{data.map((c, i) => (
              <tr key={c.code} className={`border-t ${i === 0 ? 'bg-green-50' : ''}`}>
                <td className="px-2 py-1.5 font-medium">{c.name}</td><td className="text-right px-2 py-1.5 font-mono">{c.rho.toFixed(2)}</td><td className="text-right px-2 py-1.5 font-mono">{c.z.toFixed(1)}</td>
                <td className="text-right px-2 py-1.5 font-mono">{c.hvl.toFixed(1)}</td><td className="text-right px-2 py-1.5 font-mono">{c.tvl.toFixed(1)}</td>
                <td className="text-right px-2 py-1.5 font-mono">{c.mhvl.toFixed(1)}</td><td className="text-right px-2 py-1.5 font-mono text-green-700">${c.chvl.toFixed(0)}</td>
                <td className="text-right px-2 py-1.5 font-mono">{c.m2tvl.toFixed(1)}</td><td className="text-right px-2 py-1.5 font-mono text-green-700">${c.c2tvl.toFixed(0)}</td>
              </tr>))}</tbody>
          </table>
        </div>
        <p className="text-[8px] text-slate-400 mt-2">Fila verde = menor score multi-objetivo | Costos USD/kg aprox 2024 | NIST XCOM + NCRP 147/151</p>
        <div data-testid="f172a-material-methodology" className="mt-3 rounded-md border border-violet-200 bg-violet-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-violet-950">F172A metodologia de concretos avanzados</h3>
              <p className="text-[9px] text-violet-800">{f172aMaterials?.reportLanguage}</p>
            </div>
            <Badge variant="outline" className="text-[9px] bg-white">{f172aMaterials?.adoption}</Badge>
          </div>
          <p className="mt-2 text-[8px] text-violet-700">{f172aMaterials?.calculationPolicy}</p>
          <p className="mt-1 text-[8px] text-violet-700">Flujo: {f172aMethodology.materialWorkflow.join(' | ')}</p>
        </div>
        <div data-testid="f124-material-toolbox" className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-xs font-semibold text-cyan-950">F124 toolbox unificado de materiales</h3>
              <p className="text-[9px] text-cyan-800">Editor y comparador canonico para blindaje, costo, tiempo de obra y revision estructural.</p>
            </div>
            <Badge variant="outline" className="text-[9px] bg-white">Ruta: {f124Toolbox.canonicalDialog}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {f124Toolbox.inventory.slice(0, 6).map(item => (
              <div key={item.id} data-testid="f124-toolbox-subtool" className="rounded border border-cyan-100 bg-white/75 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-cyan-950">{item.label}</span>
                  <span className="text-[8px] rounded bg-cyan-100 px-1.5 py-0.5 text-cyan-800">{item.stability}</span>
                </div>
                <p className="mt-1 text-[8px] text-cyan-700">{item.f124Role}</p>
              </div>
            ))}
          </div>
          <p data-testid="f124-toolbox-legacy-resolution" className="text-[8px] text-cyan-700 mt-2">
            Resolucion legacy: {f124Toolbox.duplicateRemoved}. Siguiente: {f124Toolbox.nextPhase} para cerrar contrato calculo-memoria-evidencia por resultado.
          </p>
        </div>
        <div data-testid="f123-material-decision-matrix" className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-xs font-semibold text-amber-950">F123 matriz decision obra</h3>
              <p className="text-[9px] text-amber-800">Ranking preliminar por peso, costo, rapidez, ficha proveedor y revision estructural.</p>
            </div>
            <Badge variant="outline" className="text-[9px] bg-white">Preferido: {f123Matrix.preferred.label}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead>
                <tr className="text-amber-900">
                  <th className="text-left px-2 py-1">#</th>
                  <th className="text-left px-2 py-1">Material</th>
                  <th className="text-right px-2 py-1">kg/m2</th>
                  <th className="text-right px-2 py-1">kg/ml</th>
                  <th className="text-right px-2 py-1">Masa</th>
                  <th className="text-center px-2 py-1">Obra</th>
                  <th className="text-center px-2 py-1">Riesgo</th>
                  <th className="text-left px-2 py-1">Criterio</th>
                </tr>
              </thead>
              <tbody>
                {f123Matrix.rows.slice(0, 7).map(row => (
                  <tr key={row.materialId} data-testid="f123-material-row" className="border-t border-amber-100 bg-white/70">
                    <td className="px-2 py-1 font-mono">{row.rank}</td>
                    <td className="px-2 py-1 font-medium">{row.label}</td>
                    <td className="text-right px-2 py-1 font-mono">{row.kgM2}</td>
                    <td className="text-right px-2 py-1 font-mono">{row.kgPerLinearM}</td>
                    <td className="text-right px-2 py-1 font-mono">{row.massKg}</td>
                    <td className="text-center px-2 py-1 font-mono">{row.scheduleIndex}/5</td>
                    <td className="text-center px-2 py-1">{row.structuralRisk}</td>
                    <td className="px-2 py-1">{row.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[8px] text-amber-700 mt-2">
            F123 no aplica cambios al plano: prepara la decision para F124, donde se conectara a barrera seleccionada, memoria y evidencia.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
