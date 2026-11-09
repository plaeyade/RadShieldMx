// =============================================================================
// CBCTIGRTDialog — Blindaje para CBCT/IGRT (v14.3)
// =============================================================================
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Scan, CheckCircle, AlertTriangle, Calculator, BookOpen } from 'lucide-react';
import { CBCT_SYSTEMS, HVL_CBCT_KV, getCBCTShieldingRecommendation } from '@/lib/cbctIGRTData';
import { OBJETIVOS_DISENO, blindajeTC } from '@/lib/calculadorasNormativas';
import { transmisionTC } from '@/lib/ncrp147';
import { toast } from 'sonner';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }
const COL = ['bg-blue-50 border-blue-200','bg-emerald-50 border-emerald-200','bg-amber-50 border-amber-200','bg-violet-50 border-violet-200'];

export default function CBCTIGRTDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ width: '100vw', height: '100vh' }} role="dialog" aria-modal="true" aria-label="Blindaje CBCT / IGRT">
      <CBCTContent onOpenChange={onOpenChange} />
    </div>
  );
}

function CBCTContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [systemIdx, setSystemIdx] = useState(0);
  const [kVp, setKVp] = useState('120');
  const [scansPerPatient, setScansPerPatient] = useState('1');
  const [patientsPerWeek, setPatientsPerWeek] = useState('25');
  const [distanceM, setDistanceM] = useState('4.5');
  const [shieldingMm, setShieldingMm] = useState('200');
  const [dlp, setDlp] = useState('500');
  const [T, setT] = useState('1');
  const [P, setP] = useState(String(OBJETIVOS_DISENO[1].P_mSv_semana));
  const [result, setResult] = useState<{ K: number; B_existente: number; dosis: number; cumple: boolean; plomo: number; concreto: number } | null>(null);
  const [recommendation, setRecommendation] = useState<ReturnType<typeof getCBCTShieldingRecommendation> | null>(null);


  // Fase 8c: antes, dosis = (kVp/100)·(mA/20)·(t/60)·0.1 sin K¹. Ahora la CBCT se trata como TC de cuerpo con el método
  // DLP de NCRP 147 §5.6.1 (K¹ = 1.2·3×10⁻⁴·DLP por estudio) y la transmisión de secundaria de TC (Figs. A.2/A.3).
  const calculate = useCallback(() => {
    const kvp: 120 | 140 = Number(kVp) <= 120 ? 120 : 140;
    const r = blindajeTC({
      N_cuerpo: Number(patientsPerWeek), DLP_cuerpo_mGy_cm: Number(dlp), N_cabeza: 0, DLP_cabeza_mGy_cm: 0,
      factorContraste: Number(scansPerPatient), kvp, d_m: Number(distanceM), P_mSv_semana: Number(P), T: Number(T),
    });
    const B_existente = transmisionTC(Number(shieldingMm), 'concrete', kvp);
    const dosis = Number(T) * r.K_mGy_semana * B_existente;
    setResult({ K: r.K_mGy_semana, B_existente, dosis, cumple: dosis <= Number(P), plomo: r.espesores_mm.lead, concreto: r.espesores_mm.concrete });
    setRecommendation(getCBCTShieldingRecommendation({
      kVp: Number(kVp), hasMaze: true, distance_to_control_m: Number(distanceM),
    }));
    toast.success('Cálculo CBCT completado');
  }, [kVp, scansPerPatient, patientsPerWeek, distanceM, shieldingMm, dlp, T, P]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-600 text-white p-2 rounded-lg"><Scan className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Blindaje CBCT / IGRT</h1>
            <p className="text-xs text-slate-500">AAPM TG-96 / NCRP 151 §4.8.7 — Todos los LINAC modernos</p>
          </div>
        </div>
        <Button
          aria-label="Cerrar Blindaje CBCT IGRT"
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Todos los LINAC modernos incluyen CBCT kV</strong> (TrueBeam, Versa HD, Halcyon, Ethos). 
              La dosis adicional de fuga CBCT al área de control es típicamente <strong>0.1–1.0 mSv/semana</strong>. 
              Este cálculo verifica si el blindaje existente del LINAC es suficiente para la carga CBCT adicional.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Left: Inputs */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Scan className="w-4 h-4"/>Sistema CBCT</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Sistema</Label>
                  <Select value={String(systemIdx)} onValueChange={v => setSystemIdx(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CBCT_SYSTEMS.map((s, i) => <SelectItem key={i} value={String(i)}>{s.manufacturer} {s.model}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">kVp</Label><Select value={kVp} onValueChange={setKVp}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[100,120,140,150].map(v => <SelectItem key={v} value={String(v)}>{v} kV</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">Scans/paciente</Label><Input value={scansPerPatient} onChange={e => setScansPerPatient(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Pacientes/sem</Label><Input value={patientsPerWeek} onChange={e => setPatientsPerWeek(e.target.value)} /></div>
                  <div><Label className="text-xs">Distancia fuente→punto (m)</Label><Input value={distanceM} onChange={e => setDistanceM(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="cbct-dlp" className="text-xs">DLP por estudio (mGy·cm, dato del equipo)</Label><Input id="cbct-dlp" data-testid="cbct-dlp" value={dlp} onChange={e => setDlp(e.target.value)} /></div>
                  <div><Label htmlFor="cbct-blindaje" className="text-xs">Concreto existente (mm)</Label><Input id="cbct-blindaje" data-testid="cbct-blindaje" value={shieldingMm} onChange={e => setShieldingMm(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="cbct-t" className="text-xs">Ocupación T</Label><Input id="cbct-t" data-testid="cbct-t" value={T} onChange={e => setT(e.target.value)} /></div>
                  <div><Label htmlFor="cbct-p" className="text-xs">Objetivo P</Label>
                    <select id="cbct-p" data-testid="cbct-p" value={P} onChange={e => setP(e.target.value)} className="w-full h-9 text-xs border rounded px-2">
                      {OBJETIVOS_DISENO.map(o => <option key={o.id} value={String(o.P_mSv_semana)}>{o.etiqueta}</option>)}
                    </select></div>
                </div>
                <Button onClick={calculate} className="w-full bg-cyan-600 hover:bg-cyan-700"><Calculator className="w-4 h-4 mr-2" />Calcular Dosis CBCT</Button>
              </CardContent>
            </Card>

            {/* Right: Results */}
            <div className="space-y-4">
              {result && (
                <>
                  <Card className={result.cumple ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">{result.cumple ? <CheckCircle className="w-4 h-4 text-green-600"/> : <AlertTriangle className="w-4 h-4 text-red-600"/>}Resultados</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`${COL[0]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">K sin blindaje</div><div className="text-2xl font-bold" data-testid="cbct-k">{result.K.toPrecision(3)} <span className="text-sm">mGy/semana</span></div></div>
                        <div className={`${COL[1]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">T·K·B tras el concreto existente</div><div className="text-2xl font-bold" data-testid="cbct-dosis">{result.dosis.toExponential(2)} <span className="text-sm">mSv/semana</span></div></div>
                        <div className={`${COL[2]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">Plomo requerido (sin otro blindaje)</div><div className="text-xl font-bold" data-testid="cbct-plomo">{result.plomo.toFixed(2)} mm</div></div>
                        <div className={`${COL[3]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">Concreto requerido</div><div className="text-xl font-bold" data-testid="cbct-concreto">{result.concreto.toFixed(0)} mm</div></div>
                      </div>
                      <div className={`text-xs p-2 rounded ${result.cumple ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{result.cumple ? 'El concreto existente basta para la carga CBCT.' : 'El concreto existente no basta para la carga CBCT.'} Aproximación: CBCT como TC de cuerpo (NCRP 147 §5.6.1, Figs. A.2/A.3).</div>
                    </CardContent>
                  </Card>

                  {recommendation && (
                    <Card className="border-indigo-300 bg-indigo-50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600"/>Recomendaciones</CardTitle></CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white border rounded-lg p-3"><div className="text-xs opacity-70">Concreto mínimo</div><div className="text-lg font-bold">{recommendation.min_concrete_mm} mm</div></div>
                          <div className="bg-white border rounded-lg p-3"><div className="text-xs opacity-70">Plomo puerta mín.</div><div className="text-lg font-bold">{recommendation.min_lead_door_mm} mm</div></div>
                        </div>
                        <ul className="space-y-1">
                          {recommendation.additional_notes.map((n: string, i: number) => <li key={i} className="text-xs text-indigo-800 flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-full bg-indigo-400 shrink-0" />{n}</li>)}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>

          {/* HVL Reference */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">HVL/TVL CBCT por material y energía (mm) — referencia, no se usa en el cálculo</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-100 border-b"><th className="px-3 py-2 text-left">Material</th>{['100 kV','120 kV','140 kV','150 kV'].map(k => <th key={k} className="px-3 py-2 text-center">{k}</th>)}</tr></thead>
                  <tbody>
                    {Object.entries(HVL_CBCT_KV).map(([mat, vals]) => (
                      <tr key={mat} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium capitalize">{mat}</td>
                        {Object.values(vals).map((v, i) => <td key={i} className="px-3 py-2 text-center font-mono">HVL={v.HVL_mm} TVL={v.TVL_mm}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
