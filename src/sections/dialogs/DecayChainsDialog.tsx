/**
 * DecayChainsDialog — MC-13 UI: Decaimiento con cadenas
 * Mo-99/Tc-99m, Ge-68/Ga-68, Sr-82/Rb-82, W-188/Re-188
 */
import { useState, useMemo } from 'react';
import { X, Clock, Activity, Download } from 'lucide-react';
import { DECAY_CHAINS, eluateActivity, timeToMaxDaughter } from '@/lib/decay/DecayChains';

export default function DecayChainsDialog({ onClose }: { onClose: () => void }) {
  const [chainIdx, setChainIdx] = useState(0);
  const [parentActivity, setParentActivity] = useState(37); // GBq
  const [hours, setHours] = useState(24);

  const chain = DECAY_CHAINS[chainIdx];
  const eluate = useMemo(() => eluateActivity(chain.name, parentActivity, hours), [chain.name, parentActivity, hours]);
  const tMax = useMemo(() => timeToMaxDaughter(chain.name), [chain.name]);

  // Generate timeline
  const timeline = useMemo(() => {
    const times: number[] = [];
    for (let t = 0; t <= 72; t += 2) times.push(t);
    return times.map(t => ({ time: t, activity: eluateActivity(chain.name, parentActivity, t) }));
  }, [chain.name, parentActivity]);
  const maxAct = Math.max(...timeline.map(t => t.activity), 0.1);

  const exportCSV = () => {
    const h = ['Time_h', 'Eluate_Activity_GBq'];
    const csv = [h, ...timeline.map(t => [t.time, t.activity.toFixed(4)])].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `DecayChain_${chain.nodes[0].symbol}_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-labelledby="decay-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3"><Clock className="w-6 h-6" /><div><h2 id="decay-title" className="text-lg font-bold">Decay Chain Calculator</h2><p className="text-xs text-amber-100">Mo-99/Tc-99m, Ge-68/Ga-68, Sr-82/Rb-82, W-188/Re-188 — v50</p></div></div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border">
            <div><label className="text-[10px] font-medium text-slate-500">Cadena</label><select value={chainIdx} onChange={e => setChainIdx(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded">{DECAY_CHAINS.map((c, i) => <option key={i} value={i}>{c.name}</option>)}</select></div>
            <div><label className="text-[10px] font-medium text-slate-500">Actividad parent (GBq)</label><input type="number" value={parentActivity} onChange={e => setParentActivity(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" min={0} /></div>
            <div><label className="text-[10px] font-medium text-slate-500">Tiempo post-elucion (h)</label><input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" min={0} /></div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border">
            <p className="text-sm font-semibold text-amber-800">{chain.name}</p>
            <p className="text-xs text-amber-700">{chain.description}</p>
            <p className="text-xs text-amber-600 mt-1">Uso clinico: {chain.clinicalUse}</p>
            <div className="flex gap-2 mt-2">{chain.nodes.map((n, i) => (
              <div key={i} className="flex items-center gap-1"><span className="px-2 py-1 rounded bg-white text-xs font-mono font-bold">{n.symbol}</span>{i < chain.nodes.length - 1 && <span className="text-amber-500">→</span>}</div>
            ))}</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-amber-50 rounded border"><div className="text-lg font-bold text-amber-700">{eluate.toFixed(2)}</div><div className="text-[10px] text-slate-500">Eluato a {hours}h (GBq)</div></div>
            <div className="text-center p-2 bg-emerald-50 rounded border"><div className="text-lg font-bold text-emerald-700">{tMax.toFixed(1)}</div><div className="text-[10px] text-slate-500">t_max daugher (h)</div></div>
            <div className="text-center p-2 bg-blue-50 rounded border"><div className="text-lg font-bold text-blue-700">{(eluate / parentActivity * 100).toFixed(1)}%</div><div className="text-[10px] text-slate-500">Rendimiento</div></div>
          </div>

          {/* Timeline chart */}
          <div className="border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4" />Actividad del Eluato vs Tiempo</div>
            <div className="p-3">
              <div className="flex items-end gap-0.5 h-32">
                {timeline.map((t, i) => {
                  const h = Math.max((t.activity / maxAct) * 100, 1);
                  return <div key={i} className="flex-1 flex flex-col items-center justify-end"><div className="w-full bg-gradient-to-t from-amber-400 to-orange-500 rounded-t transition-all" style={{ height: `${h}%` }} title={`${t.time}h: ${t.activity.toFixed(2)} GBq`} />{t.time % 12 === 0 && <span className="text-[8px] text-slate-500 mt-0.5">{t.time}h</span>}</div>;
                })}
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border text-xs space-y-1">
            <p className="font-semibold text-amber-800">Propiedades de la cadena:</p>
            {chain.nodes.map((n, i) => (
              <p key={i}>• <strong>{n.symbol}</strong> ({n.name}): T1/2 = {n.halfLife_h === Infinity ? '∞' : n.halfLife_h + ' h'}{n.halfLife_h !== Infinity && n.halfLife_h < 1 ? ` (${(n.halfLife_h * 60).toFixed(1)} min)` : ''}</p>
            ))}
          </div>
        </div>
        <div className="flex justify-between px-5 py-3 border-t bg-slate-50 rounded-b-lg"><span className="text-xs text-slate-500">Decay Chains v50</span><button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"><Download className="w-3.5 h-3.5" />Exportar CSV</button></div>
      </div>
    </div>
  );
}
