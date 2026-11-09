/**
 * MultiEnergySpectraDialog — Recomendación B.8: blindaje con espectros polienergéticos.
 *
 * Antes: K = carga/d² sin K¹, U ni T, y espesor = −TVL·log₁₀B con TVL "TASMIP" sin fuente (≈ 0.30 mm Pb a 120 kVp,
 * un HVL) — subestimaba el plomo varias veces. Ahora el espectro entra como lo hace NCRP 147: la transmisión de
 * banda ancha de Archer (Tablas B.1 / C.1) ya integra el espectro de la distribución de carga de cada tipo de sala,
 * y la TC usa el método DLP (§5.6.1) con las curvas de secundaria de las Figs. A.2/A.3 a 120 o 140 kVp.
 * Validado contra NCRP 147 §5.3.3.1 (1.3 mm Pb) y §5.6.1 (K = 5.2 mGy/semana, 1.5 mm Pb).
 * Los HVL de capa (Boone et al., 1997) se muestran sólo como referencia; no entran en el cálculo.
 */
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  CARGA_DIAG_INICIAL, DISTRIBUCIONES_PRIMARIA, DISTRIBUCIONES_SECUNDARIA, ETIQUETAS_NCRP147, MATERIALES_DIAGNOSTICO,
  NOMBRE_MATERIAL, OBJETIVOS_DISENO, TC_INICIAL, blindajeTC, espesorRequeridoHaz, kermaSinBlindajeHaz, referenciaHaz,
  type CargaHaz, type EntradaTC,
} from '@/lib/calculadorasNormativas';
import type { DistribucionNCRP147 } from '@/lib/ncrp147';

interface Props { open: boolean; onClose: () => void; }

/** HVL (mm Al) y energía media orientativos por kVp (Boone et al., 1997). Sólo informativos. */
const HVL_REFERENCIA: { kVp: number; hvl1_mmAl: number; hvl2_mmAl: number; meanEnergy_keV: number }[] = [
  { kVp: 30, hvl1_mmAl: 0.40, hvl2_mmAl: 0.47, meanEnergy_keV: 15 },
  { kVp: 50, hvl1_mmAl: 1.25, hvl2_mmAl: 1.50, meanEnergy_keV: 21 },
  { kVp: 80, hvl1_mmAl: 2.36, hvl2_mmAl: 2.83, meanEnergy_keV: 33 },
  { kVp: 100, hvl1_mmAl: 3.15, hvl2_mmAl: 3.75, meanEnergy_keV: 40 },
  { kVp: 120, hvl1_mmAl: 4.05, hvl2_mmAl: 4.80, meanEnergy_keV: 48 },
  { kVp: 140, hvl1_mmAl: 5.05, hvl2_mmAl: 5.95, meanEnergy_keV: 55 },
];

type Modo = 'diagnostico' | 'tc';
type CargaDiag = Extract<CargaHaz, { regimen: 'diagnostico' }>;

const num = (v: string) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

function Campo({ id, label, value, onChange, step }: { id: string; label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <div>
      <Label htmlFor={id} className="text-[11px]">{label}</Label>
      <Input id={id} data-testid={id} type="number" step={step} value={value} onChange={e => onChange(num(e.target.value))} className="h-8 text-xs" />
    </div>
  );
}

export default function MultiEnergySpectraDialog({ open, onClose }: Props) {
  const [modo, setModo] = useState<Modo>('diagnostico');
  const [carga, setCarga] = useState<CargaDiag>(CARGA_DIAG_INICIAL as CargaDiag);
  const [tc, setTc] = useState<EntradaTC>(TC_INICIAL);
  const [P, setP] = useState<number>(OBJETIVOS_DISENO[1].P_mSv_semana);
  const [T, setT] = useState(0.2);

  const distribuciones = carga.barrera === 'primaria' ? DISTRIBUCIONES_PRIMARIA : DISTRIBUCIONES_SECUNDARIA;

  const resultado = useMemo(() => {
    try {
      if (modo === 'tc') {
        const r = blindajeTC({ ...tc, P_mSv_semana: P, T });
        return {
          K: r.K_mGy_semana, B: r.B_requerida, filas: [
            { material: 'lead', mm: r.espesores_mm.lead },
            { material: 'concrete', mm: r.espesores_mm.concrete },
          ],
          referencia: `NCRP 147 §5.6.1 (método DLP) y Figs. A.2/A.3 a ${tc.kvp} kVp`, error: null as string | null,
        };
      }
      const K = kermaSinBlindajeHaz(carga);
      return {
        K, B: Math.min(1, P / (T * K)),
        filas: MATERIALES_DIAGNOSTICO.map(m => ({ material: m as string, mm: espesorRequeridoHaz(carga, m, P, T) })),
        referencia: referenciaHaz(carga), error: null as string | null,
      };
    } catch (e) {
      return { K: NaN, B: NaN, filas: [], referencia: '', error: (e as Error).message };
    }
  }, [modo, carga, tc, P, T]);

  const cambiarBarrera = (barrera: 'primaria' | 'secundaria') => {
    const lista = barrera === 'primaria' ? DISTRIBUCIONES_PRIMARIA : DISTRIBUCIONES_SECUNDARIA;
    setCarga(c => ({ ...c, barrera, distribucion: lista.includes(c.distribucion) ? c.distribucion : lista[0] }));
  };

  const exportCSV = () => {
    const lineas = [
      'modo,referencia,K_mGy_semana,P_mSv_semana,T,B_requerida',
      `${modo},"${resultado.referencia}",${resultado.K},${P},${T},${resultado.B}`,
      '',
      'material,espesor_mm',
      ...resultado.filas.map(f => `${NOMBRE_MATERIAL[f.material] ?? f.material},${f.mm.toFixed(2)}`),
      '',
      'kVp,HVL1_mmAl,HVL2_mmAl,energia_media_keV (referencia Boone 1997; no usada en el cálculo)',
      ...HVL_REFERENCIA.map(v => `${v.kVp},${v.hvl1_mmAl},${v.hvl2_mmAl},${v.meanEnergy_keV}`),
    ];
    const blob = new Blob([lineas.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'blindaje_espectros.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="multi-energy-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Blindaje con espectros polienergéticos
            <Badge variant="outline" className="text-[10px]">NCRP 147</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-[11px] text-yellow-800">
          El espectro entra en el cálculo a través de la transmisión de banda ancha de NCRP 147: los ajustes de Archer
          de las Tablas B.1 y C.1 están medidos sobre la distribución real de kVp de cada tipo de sala, y la TC usa las
          curvas de secundaria a 120 o 140 kVp (Figs. A.2/A.3). Un único TVL por kVp no sirve para blindaje diagnóstico.
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant={modo === 'diagnostico' ? 'default' : 'outline'} className="text-xs" data-testid="modo-diagnostico" onClick={() => setModo('diagnostico')}>Radiografía / fluoroscopía / mamografía</Button>
          <Button size="sm" variant={modo === 'tc' ? 'default' : 'outline'} className="text-xs" data-testid="modo-tc" onClick={() => setModo('tc')}>Tomografía (DLP)</Button>
        </div>

        {modo === 'diagnostico' ? (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="mes-barrera" className="text-[11px]">Barrera</Label>
              <select id="mes-barrera" data-testid="mes-barrera" value={carga.barrera} onChange={e => cambiarBarrera(e.target.value as 'primaria' | 'secundaria')} className="w-full h-8 text-xs border rounded px-2">
                <option value="primaria">Primaria</option>
                <option value="secundaria">Secundaria</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="mes-distribucion" className="text-[11px]">Distribución de carga (NCRP 147 Tabla {carga.barrera === 'primaria' ? '4.5' : '4.7'})</Label>
              <select id="mes-distribucion" data-testid="mes-distribucion" value={carga.distribucion} onChange={e => setCarga(c => ({ ...c, distribucion: e.target.value as DistribucionNCRP147 }))} className="w-full h-8 text-xs border rounded px-2">
                {distribuciones.map(d => <option key={d} value={d}>{ETIQUETAS_NCRP147[d]}</option>)}
              </select>
            </div>
            <Campo id="mes-n" label="Pacientes / semana" value={carga.N_pacientes_semana} onChange={n => setCarga(c => ({ ...c, N_pacientes_semana: n }))} />
            {carga.barrera === 'primaria'
              ? <Campo id="mes-u" label="Factor de uso U" step={0.05} value={carga.U} onChange={n => setCarga(c => ({ ...c, U: n }))} />
              : <div />}
            <Campo id="mes-d" label="Distancia (m)" step={0.1} value={carga.d_m} onChange={n => setCarga(c => ({ ...c, d_m: n }))} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Campo id="mes-tc-nc" label="Estudios de cuerpo / semana" value={tc.N_cuerpo} onChange={n => setTc(t => ({ ...t, N_cuerpo: n }))} />
            <Campo id="mes-tc-dlpc" label="DLP cuerpo (mGy·cm)" value={tc.DLP_cuerpo_mGy_cm} onChange={n => setTc(t => ({ ...t, DLP_cuerpo_mGy_cm: n }))} />
            <Campo id="mes-tc-f" label="Factor contraste" step={0.1} value={tc.factorContraste} onChange={n => setTc(t => ({ ...t, factorContraste: n }))} />
            <Campo id="mes-tc-nh" label="Estudios de cabeza / semana" value={tc.N_cabeza} onChange={n => setTc(t => ({ ...t, N_cabeza: n }))} />
            <Campo id="mes-tc-dlph" label="DLP cabeza (mGy·cm)" value={tc.DLP_cabeza_mGy_cm} onChange={n => setTc(t => ({ ...t, DLP_cabeza_mGy_cm: n }))} />
            <div>
              <Label htmlFor="mes-tc-kvp" className="text-[11px]">kVp</Label>
              <select id="mes-tc-kvp" data-testid="mes-tc-kvp" value={tc.kvp} onChange={e => setTc(t => ({ ...t, kvp: Number(e.target.value) as 120 | 140 }))} className="w-full h-8 text-xs border rounded px-2">
                <option value={120}>120 kVp</option>
                <option value={140}>140 kVp</option>
              </select>
            </div>
            <Campo id="mes-tc-d" label="Distancia al isocentro (m)" step={0.1} value={tc.d_m} onChange={n => setTc(t => ({ ...t, d_m: n }))} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="mes-p" className="text-[11px]">Objetivo de diseño P</Label>
            <select id="mes-p" data-testid="mes-p" value={P} onChange={e => setP(Number(e.target.value))} className="w-full h-8 text-xs border rounded px-2">
              {OBJETIVOS_DISENO.map(o => <option key={o.id} value={o.P_mSv_semana}>{o.etiqueta}</option>)}
            </select>
          </div>
          <Campo id="mes-t" label="Factor de ocupación T" step={0.05} value={T} onChange={setT} />
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border" data-testid="mes-resultado">
          {resultado.error ? (
            <div className="text-xs text-red-600">{resultado.error}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-center mb-3">
                <div className="bg-white rounded p-2 border"><div className="text-[9px] text-slate-500">Kerma sin blindaje K</div><div className="font-bold" data-testid="mes-k">{resultado.K.toPrecision(3)} mGy/semana</div></div>
                <div className="bg-white rounded p-2 border"><div className="text-[9px] text-slate-500">Transmisión requerida B = P/(T·K)</div><div className="font-bold" data-testid="mes-b">{resultado.B.toExponential(2)}</div></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {resultado.filas.map(f => (
                  <div key={f.material} className="bg-white rounded p-3 border text-center">
                    <div className="text-[9px] text-slate-500">{NOMBRE_MATERIAL[f.material] ?? f.material}</div>
                    <div className="text-xl font-bold text-slate-800" data-testid={`mes-espesor-${f.material}`}>{f.mm.toFixed(f.material === 'lead' ? 2 : 1)} <span className="text-sm">mm</span></div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-slate-500 mt-2">{resultado.referencia}. Sin preblindaje del receptor (NCRP 147 Tabla 4.6).</div>
            </>
          )}
        </div>

        <details className="text-[11px]">
          <summary className="cursor-pointer text-slate-600">Calidad de haz de referencia (HVL, no se usa en el cálculo)</summary>
          <table className="w-full mt-2 text-center">
            <thead><tr className="text-slate-500"><th>kVp</th><th>HVL₁ (mm Al)</th><th>HVL₂ (mm Al)</th><th>E media (keV)</th></tr></thead>
            <tbody>{HVL_REFERENCIA.map(v => <tr key={v.kVp}><td>{v.kVp}</td><td>{v.hvl1_mmAl}</td><td>{v.hvl2_mmAl}</td><td>{v.meanEnergy_keV}</td></tr>)}</tbody>
          </table>
          <div className="text-slate-500 mt-1">Boone J.M. et al. (1997), Med Phys 24(11) (TASMIP).</div>
        </details>

        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV} data-testid="mes-exportar">
          <Download className="w-3 h-3 mr-1" /> Exportar CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
