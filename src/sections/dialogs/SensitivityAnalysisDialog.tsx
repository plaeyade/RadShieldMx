// SensitivityAnalysisDialog — análisis de sensibilidad (tornado) del espesor de una barrera de diagnóstico.
// Fase 7: el espesor sale de NCRP 147 (K = K¹·U·N/d², Tablas 4.5/4.7, y transmisión de Archer, Tablas B.1/C.1)
// con `espesorRequeridoHaz`. Antes: B = P·d²/(W·U·T) sin rendimiento K¹ y un TVL único de concreto.
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { BarChart3, ArrowUpDown, BookOpen } from 'lucide-react';
import {
  DISTRIBUCIONES_PRIMARIA, DISTRIBUCIONES_SECUNDARIA, ETIQUETAS_NCRP147, MATERIALES_DIAGNOSTICO, NOMBRE_MATERIAL,
  espesorRequeridoHaz, referenciaHaz, type CargaHaz,
} from '@/lib/calculadorasNormativas';
import type { DistribucionNCRP147 } from '@/lib/ncrp147';

type Clave = 'N' | 'd' | 'T' | 'U' | 'P';
const PARAMS: { key: Clave; name: string; unit: string; color: string }[] = [
  { key: 'N', name: 'Pacientes por semana (N)', unit: '', color: '#f97316' },
  { key: 'd', name: 'Distancia al punto (d)', unit: 'm', color: '#2563eb' },
  { key: 'T', name: 'Factor de ocupación (T)', unit: '', color: '#10b981' },
  { key: 'U', name: 'Factor de uso (U)', unit: '', color: '#6b7280' },
  { key: 'P', name: 'Objetivo de diseño (P)', unit: 'mSv/semana', color: '#a855f7' },
];
// Valores iniciales: NCRP 147 §5.3.3.1 (muro del receptor de tórax, 1.3 mm de plomo).
const INICIAL: Record<Clave, number> = { N: 125, d: 2.5, T: 0.2, U: 1, P: 0.02 };
const sel = 'h-7 w-full rounded-md border border-input px-1 text-xs';

export default function SensitivityAnalysisDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.sensitivityAnalysis));
  const close = () => useAppStore.getState().close('sensitivityAnalysis');
  const [values, setValues] = useState<Record<Clave, number>>(INICIAL);
  const [barrera, setBarrera] = useState<'primaria' | 'secundaria'>('primaria');
  const [distribucion, setDistribucion] = useState<DistribucionNCRP147>('rad_room_chest_bucky');
  const [material, setMaterial] = useState('lead');
  const [pct, setPct] = useState(20);
  const update = (key: Clave, val: number) => setValues(p => ({ ...p, [key]: val }));
  const distribuciones = barrera === 'primaria' ? DISTRIBUCIONES_PRIMARIA : DISTRIBUCIONES_SECUNDARIA;
  const dist = distribuciones.includes(distribucion) ? distribucion : distribuciones[0];

  const espesor = useMemo(() => (v: Record<Clave, number>): number | null => {
    const c: CargaHaz = { regimen: 'diagnostico', distribucion: dist, barrera, N_pacientes_semana: v.N, U: v.U, d_m: v.d };
    try { return espesorRequeridoHaz(c, material, v.P, Math.min(1, v.T)); } catch { return null; }
  }, [dist, barrera, material]);

  const base = espesor(values);
  const tornado = useMemo(() => {
    if (base === null) return [];
    return PARAMS.map(p => {
      const tLow = espesor({ ...values, [p.key]: values[p.key] * (1 - pct / 100) }) ?? base;
      const tHigh = espesor({ ...values, [p.key]: values[p.key] * (1 + pct / 100) }) ?? base;
      return { ...p, deltaLow: tLow - base, deltaHigh: tHigh - base };
    }).sort((a, b) => Math.max(Math.abs(b.deltaLow), Math.abs(b.deltaHigh)) - Math.max(Math.abs(a.deltaLow), Math.abs(a.deltaHigh)));
  }, [values, base, espesor, pct]);
  const maxDelta = Math.max(...tornado.map(t => Math.max(Math.abs(t.deltaLow), Math.abs(t.deltaHigh))), 1e-6);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-[#0d9488]" /> Análisis de sensibilidad del espesor
          </DialogTitle>
          <DialogDescription className="text-xs">Tornado de ±{pct} % sobre cada parámetro; espesor con NCRP 147 ({referenciaHaz({ regimen: 'diagnostico', distribucion: dist, barrera, N_pacientes_semana: 1, U: 1, d_m: 1 })}).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div><Label htmlFor="sens-barrera" className="text-[9px]">Barrera</Label>
              <select id="sens-barrera" className={sel} value={barrera} onChange={e => setBarrera(e.target.value as 'primaria' | 'secundaria')}>
                <option value="primaria">Primaria (Tabla 4.5)</option><option value="secundaria">Secundaria (Tabla 4.7)</option>
              </select></div>
            <div className="col-span-2"><Label htmlFor="sens-dist" className="text-[9px]">Distribución de carga (NCRP 147)</Label>
              <select id="sens-dist" className={sel} value={dist} onChange={e => setDistribucion(e.target.value as DistribucionNCRP147)}>
                {distribuciones.map(d => <option key={d} value={d}>{ETIQUETAS_NCRP147[d]}</option>)}
              </select></div>
            <div><Label htmlFor="sens-mat" className="text-[9px]">Material</Label>
              <select id="sens-mat" className={sel} value={material} onChange={e => setMaterial(e.target.value)}>
                {MATERIALES_DIAGNOSTICO.map(m => <option key={m} value={m}>{NOMBRE_MATERIAL[m]}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {PARAMS.map(p => (
              <div key={p.key}><Label htmlFor={`sens-${p.key}`} className="text-[9px]">{p.name}{p.unit ? ` (${p.unit})` : ''}</Label>
                <Input id={`sens-${p.key}`} type="number" step="any" value={values[p.key]} onChange={e => update(p.key, +e.target.value)} className="h-7 text-xs" /></div>
            ))}
            <div><Label htmlFor="sens-pct" className="text-[9px]">Variación (%)</Label>
              <Input id="sens-pct" type="number" value={pct} onChange={e => setPct(+e.target.value)} className="h-7 text-xs" /></div>
          </div>
          <div className="bg-gradient-to-r from-teal-50 to-white rounded-lg border border-teal-100 p-3">
            <div className="text-[11px] font-semibold text-slate-700 mb-1">
              Espesor base: <span className="font-mono text-teal-700" data-testid="sens-base">{base === null ? 'entrada inválida' : `${base.toFixed(2)} mm`}</span> de {NOMBRE_MATERIAL[material]} (total, sin descontar preblindaje)
            </div>
          </div>
          <Card className="border-slate-200"><CardContent className="p-3">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Tornado — variación ±{pct} % (mm respecto del base)</div>
            <div className="space-y-1.5">
              {tornado.map(t => {
                const lw = Math.abs(t.deltaLow) / maxDelta * 45;
                const hw = Math.abs(t.deltaHigh) / maxDelta * 45;
                return (
                  <div key={t.key} className="flex items-center gap-1 text-[9px]">
                    <span className="w-36 text-right truncate text-slate-600">{t.name}</span>
                    <div className="flex-1 flex items-center gap-0.5">
                      <div className="flex-1 flex justify-end"><div className="h-3 rounded-l" style={{ width: `${lw}%`, backgroundColor: t.color + '80' }} /></div>
                      <span className="w-10 text-center font-mono text-[8px]">{(base ?? 0).toFixed(2)}</span>
                      <div className="flex-1"><div className="h-3 rounded-r" style={{ width: `${hw}%`, backgroundColor: t.color }} /></div>
                    </div>
                    <span className="w-14 text-right font-mono text-[8px]">−{pct} %: {t.deltaLow > 0 ? '+' : ''}{t.deltaLow.toFixed(2)}</span>
                    <span className="w-14 text-right font-mono text-[8px]">+{pct} %: {t.deltaHigh > 0 ? '+' : ''}{t.deltaHigh.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent></Card>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Valores iniciales: NCRP 147 §5.3.3.1 (1.3 mm de plomo). T se acota a 1.</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
