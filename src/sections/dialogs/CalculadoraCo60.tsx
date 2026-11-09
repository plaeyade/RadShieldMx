/**
 * Calculadora de blindaje para fuentes de Co-60 (Gamma Knife, braquiterapia HDR) con NCRP 151 Tabla B.2.
 * Dos formas de dar el kerma semanal sin blindaje en el punto:
 * - «carga»: W (mGy·m²/semana) a la distancia d → K = W/d²;
 * - «tasa»: tasas en el punto con haz encendido y apagado (μSv/h) × horas por semana (guía del fabricante).
 */
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MATERIALES_MV, NOMBRE_MATERIAL, OBJETIVOS_DISENO, blindajeCo60 } from '@/lib/calculadorasNormativas';

export interface Co60Inicial {
  modo: 'carga' | 'tasa';
  W_mGy_m2?: number; d_m?: number;
  tasaOn_uSv_h?: number; horasOn?: number; tasaOff_uSv_h?: number; horasOff?: number;
  P_mSv: number; T: number; U?: number;
}

function Campo({ id, label, value, onChange, step }: { id: string; label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <div>
      <Label htmlFor={id} className="text-[10px]">{label}</Label>
      <Input id={id} data-testid={id} type="number" step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="h-7 text-xs" />
    </div>
  );
}

export default function CalculadoraCo60({ inicial }: { inicial: Co60Inicial }) {
  const [v, setV] = useState({
    W: inicial.W_mGy_m2 ?? 0, d: inicial.d_m ?? 1,
    on: inicial.tasaOn_uSv_h ?? 0, hOn: inicial.horasOn ?? 0, off: inicial.tasaOff_uSv_h ?? 0, hOff: inicial.horasOff ?? 0,
    P: inicial.P_mSv, T: inicial.T, U: inicial.U ?? 1,
  });
  const set = (k: keyof typeof v) => (n: number) => setV(s => ({ ...s, [k]: n }));

  const r = useMemo(() => {
    try {
      const K_mSv = inicial.modo === 'carga' ? v.W / (v.d * v.d) : (v.on * v.hOn + v.off * v.hOff) / 1000;
      if (!Number.isFinite(K_mSv)) throw new RangeError('Revise la distancia');
      return { K_mSv, ...blindajeCo60(K_mSv, v.P, v.T, v.U), error: null as string | null };
    } catch (e) {
      return { K_mSv: NaN, B_requerida: NaN, espesores_cm: null, error: (e as Error).message };
    }
  }, [v, inicial.modo]);

  return (
    <div className="bg-gray-50 rounded-md p-3 border border-gray-100 space-y-2" data-testid="calc-co60">
      <div className="grid grid-cols-4 gap-2">
        {inicial.modo === 'carga' ? (
          <>
            <Campo id="co60-w" label="W (mGy·m²/semana)" value={v.W} onChange={set('W')} />
            <Campo id="co60-d" label="Distancia d (m)" step={0.1} value={v.d} onChange={set('d')} />
          </>
        ) : (
          <>
            <Campo id="co60-on" label="Tasa haz encendido (μSv/h)" step={0.01} value={v.on} onChange={set('on')} />
            <Campo id="co60-hon" label="Horas/semana encendido" value={v.hOn} onChange={set('hOn')} />
            <Campo id="co60-off" label="Tasa haz apagado (μSv/h)" step={0.01} value={v.off} onChange={set('off')} />
            <Campo id="co60-hoff" label="Horas/semana apagado" value={v.hOff} onChange={set('hOff')} />
          </>
        )}
        <div>
          <Label htmlFor="co60-p" className="text-[10px]">Objetivo P</Label>
          <select id="co60-p" data-testid="co60-p" value={v.P} onChange={e => set('P')(Number(e.target.value))} className="w-full h-7 text-xs border rounded px-1">
            {OBJETIVOS_DISENO.map(o => <option key={o.id} value={o.P_mSv_semana}>{o.etiqueta}</option>)}
            {!OBJETIVOS_DISENO.some(o => o.P_mSv_semana === v.P) && <option value={v.P}>{v.P} mSv/semana (expediente)</option>}
          </select>
        </div>
        <Campo id="co60-t" label="Ocupación T" step={0.05} value={v.T} onChange={set('T')} />
        <Campo id="co60-u" label="Uso U" step={0.05} value={v.U} onChange={set('U')} />
      </div>
      {r.error || !r.espesores_cm ? <div className="text-xs text-red-600">{r.error}</div> : (
        <div className="p-2 bg-white rounded border text-[11px] space-y-1">
          <p>K sin blindaje = <strong data-testid="co60-k">{r.K_mSv.toPrecision(3)}</strong> mSv/semana; B = P/(T·U·K) = <strong data-testid="co60-b">{r.B_requerida.toExponential(3)}</strong></p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {MATERIALES_MV.map(m => (
              <div key={m} className="border rounded p-1"><div className="text-[9px] text-slate-500">{NOMBRE_MATERIAL[m]}</div><div className="font-bold" data-testid={`co60-${m}`}>{r.espesores_cm![m].toFixed(1)} cm</div></div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">t = TVL₁ + (log₁₀(1/B) − 1)·TVLₑ con NCRP 151 Tabla B.2 para Co-60 (concreto 21, acero 7.0, plomo 4.0 cm).</p>
        </div>
      )}
    </div>
  );
}
