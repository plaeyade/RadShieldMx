/**
 * ChiltonSkyshineDialog — skyshine de fotones de un acelerador (NCRP 151 §5.1, Ec. 5.1; McGinley 2002).
 *
 * Antes usaba G = (h/d)²·f(E)·e^(−μd/3) con coeficientes sin fuente. Ahora: Ḣ = 2.5×10⁷·B_xs·Ḋ₀·Ω^1.3/(dᵢ·dₛ)²,
 * con B_xs del techo por TVL₁/TVLₑ de la Tabla B.2. Validado contra la columna «calculada» de la Tabla 5.1.
 * NCRP 151 advierte que la ecuación da, a lo sumo, el orden de magnitud (medido/calculado 0.25–5.3).
 */
import { useMemo, useState } from 'react';
import { X, Cloud, BarChart3, Download } from 'lucide-react';
import {
  ENERGIAS_MV_TABULADAS, energiaTabuladaMV,
} from '@/lib/calculadorasNormativas';
import { anguloSolidoCampo, skyshineFotones, transmisionTVL, tvlPrimaria } from '@/lib/ncrp151';

const DISTANCIAS_M = [5, 7.5, 10, 15, 20, 30, 50];

function Num({ id, label, value, onChange, step }: { id: string; label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <div>
      <label htmlFor={id} className="text-[10px] font-medium text-slate-500">{label}</label>
      <input id={id} data-testid={id} type="number" step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full mt-1 p-1.5 border rounded" />
    </div>
  );
}

export default function ChiltonSkyshineDialog({ onClose }: { onClose: () => void }) {
  const [energia, setEnergia] = useState(18);
  const [W, setW] = useState(450);
  const [techo_cm, setTecho] = useState(0);
  const [campo_cm, setCampo] = useState(40);
  const [di, setDi] = useState(5.97);

  const r = useMemo(() => {
    const e = energiaTabuladaMV(energia);
    const B_xs = transmisionTVL(techo_cm, tvlPrimaria(e, 'concrete'));
    const omega = anguloSolidoCampo(campo_cm / 100, campo_cm / 100, 1);
    const puntos = DISTANCIAS_M.map(ds => ({ ds, uSv_semana: skyshineFotones({ B_xs, D0: W, omega_sr: omega, di_m: di, ds_m: ds }) / 1000 }));
    return { e, B_xs, omega, puntos };
  }, [energia, W, techo_cm, campo_cm, di]);

  const max = Math.max(...r.puntos.map(p => p.uSv_semana), 1e-9);

  const exportCSV = () => {
    const csv = [['ds_m', 'uSv_semana'], ...r.puntos.map(p => [p.ds, p.uSv_semana.toPrecision(4)])].map(x => x.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'skyshine_ncrp151.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-labelledby="sky-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3"><Cloud className="w-6 h-6" /><div><h2 id="sky-title" className="text-lg font-bold">Skyshine de fotones</h2><p className="text-xs text-sky-100">NCRP 151 §5.1, Ec. 5.1 (McGinley, 2002)</p></div></div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-slate-50 rounded-lg border text-xs">
            <div>
              <label htmlFor="sky-e" className="text-[10px] font-medium text-slate-500">Energía (MV)</label>
              <select id="sky-e" data-testid="sky-e" value={energia} onChange={e => setEnergia(Number(e.target.value))} className="w-full mt-1 p-1.5 border rounded">
                {ENERGIAS_MV_TABULADAS.map(x => <option key={x} value={x}>{x} MV</option>)}
              </select>
            </div>
            <Num id="sky-w" label="Carga W a 1 m (Gy/semana)" value={W} onChange={setW} />
            <Num id="sky-techo" label="Techo de concreto (cm)" value={techo_cm} onChange={setTecho} />
            <Num id="sky-campo" label="Campo máximo a 1 m (cm)" value={campo_cm} onChange={setCampo} />
            <Num id="sky-di" label="dᵢ: blanco → 2 m sobre el techo (m)" step={0.1} value={di} onChange={setDi} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded border"><div className="text-lg font-bold text-blue-700" data-testid="sky-bxs">{r.B_xs.toExponential(2)}</div><div className="text-[10px] text-slate-500">B_xs del techo (Tabla B.2, {r.e} MV)</div></div>
            <div className="text-center p-2 bg-sky-50 rounded border"><div className="text-lg font-bold text-sky-700" data-testid="sky-omega">{r.omega.toFixed(3)} sr</div><div className="text-[10px] text-slate-500">Ángulo sólido Ω del campo</div></div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4" />Equivalente de dosis semanal a nivel del suelo vs dₛ</div>
            <div className="p-3 space-y-1">
              {r.puntos.map(p => (
                <div key={p.ds} className="flex items-center gap-2">
                  <div className="w-12 text-right text-[10px] font-mono text-slate-600">{p.ds} m</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden"><div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" style={{ width: `${(p.uSv_semana / max) * 100}%` }} /></div>
                  <div className="w-24 text-right text-[10px] font-mono" data-testid={`sky-h-${p.ds}`}>{p.uSv_semana.toPrecision(3)} μSv</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-sky-50 rounded-lg border text-xs space-y-1">
            <p className="font-mono">Ḣ (nSv) = 2.5×10⁷ · B_xs · W · Ω^1.3 / (dᵢ · dₛ)²</p>
            <p>Con W en Gy/semana a 1 m el resultado es por semana. NCRP 151 (Tablas 5.1 y 5.2) muestra que la ecuación da, a lo sumo,
              el orden de magnitud: lo medido llega a ser 5 veces lo calculado lejos de la sala. Los neutrones (Ec. 5.2) no se incluyen.</p>
          </div>
        </div>
        <div className="flex justify-end px-5 py-3 border-t bg-slate-50 rounded-b-lg"><button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-600 text-white text-xs font-medium hover:bg-sky-700"><Download className="w-3.5 h-3.5" />Exportar CSV</button></div>
      </div>
    </div>
  );
}
