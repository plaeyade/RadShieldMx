// BarrierCalculatorDialog — calculadora de barreras de megavoltaje (NCRP 151).
// Fase 7: primaria, fuga y dispersión del paciente por separado, TVL₁/TVLₑ, regla de las dos fuentes y criterio
// de cumplimiento T·K ≤ P, con el núcleo común `barreraMV` (calculadorasNormativas → ncrp151).
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Calculator, Download, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  ENERGIAS_MV_TABULADAS, MATERIALES_MV, NOMBRE_MATERIAL, OBJETIVOS_DISENO, barreraMV,
  type EntradaBarreraMV, type ResultadoBarreraMV,
} from '@/lib/calculadorasNormativas';
import type { EnergiaMV, MaterialNCRP151 } from '@/lib/ncrp151';

/** NCRP 151 Tabla B.1 (factores de ocupación sugeridos). */
const OCUPACION = [
  { value: 1, label: '1 — oficinas, consultorios, sala de control' },
  { value: 0.5, label: '1/2 — salas de tratamiento contiguas, exploración' },
  { value: 0.2, label: '1/5 — pasillos, salas de descanso del personal' },
  { value: 0.125, label: '1/8 — puertas de sala de tratamiento' },
  { value: 0.05, label: '1/20 — baños públicos, almacenes, salas de espera' },
  { value: 0.025, label: '1/40 — exteriores, estacionamientos, escaleras' },
];

interface Props { open: boolean; onOpenChange: (open: boolean) => void }

interface Registro { entrada: EntradaBarreraMV; resultado: ResultadoBarreraMV }

const sel = 'h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm';

export default function BarrierCalculatorDialog({ open, onOpenChange }: Props) {
  const [tipo, setTipo] = useState<'primaria' | 'secundaria'>('primaria');
  const [e1, setE1] = useState<EnergiaMV>(18);
  const [w1, setW1] = useState(450);
  const [doble, setDoble] = useState(false);
  const [e2, setE2] = useState<EnergiaMV>(6);
  const [w2, setW2] = useState(225);
  const [imrt, setImrt] = useState(0);
  const [ci, setCi] = useState(5);
  const [material, setMaterial] = useState<MaterialNCRP151>('concrete');
  const [areaId, setAreaId] = useState<string>('no_controlada');
  const [T, setT] = useState(0.025);
  const [U, setU] = useState(0.25);
  const [d, setD] = useState(7.2);
  const [dL, setDL] = useState<number | ''>('');
  const [theta, setTheta] = useState(30);
  const [historial, setHistorial] = useState<Registro[]>([]);
  const [error, setError] = useState<string | null>(null);
  const ultimo = historial[historial.length - 1] ?? null;
  const P = OBJETIVOS_DISENO.find((o) => o.id === areaId)!.P_mSv_semana;

  const calcular = useCallback(() => {
    const haz = (energia: EnergiaMV, W: number) => ({ energia, W_Gy_semana: W, fraccionIMRT: imrt / 100, factorIMRT: ci });
    const entrada: EntradaBarreraMV = {
      tipo, material, P_mSv_semana: P, T, U, d_m: d,
      haces: doble ? [haz(e1, w1), haz(e2, w2)] : [haz(e1, w1)],
      ...(tipo === 'secundaria' ? { theta_deg: theta, ...(dL !== '' ? { dL_m: dL } : {}) } : {}),
    };
    try {
      const resultado = barreraMV(entrada);
      setError(null);
      setHistorial((h) => [...h, { entrada, resultado }]);
      toast.success(`Espesor ${resultado.espesorRedondeado_cm.toFixed(1)} cm de ${NOMBRE_MATERIAL[material]}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [tipo, material, P, T, U, d, doble, e1, w1, e2, w2, imrt, ci, theta, dL]);

  const exportarCSV = useCallback(() => {
    if (!historial.length) return;
    const enc = ['Tipo', 'Energias_MV', 'W_Gy_sem', 'Material', 'P_mSv_sem', 'T', 'U', 'd_m', 'K_sin_mSv_sem',
      'Espesor_dos_fuentes_cm', 'Espesor_suma_directa_cm', 'Espesor_redondeado_cm', 'T_K_con_blindaje_mSv_sem', 'Cumple'];
    const filas = historial.map(({ entrada: e, resultado: r }) => [
      e.tipo, e.haces.map((h) => h.energia).join('/'), e.haces.map((h) => h.W_Gy_semana).join('/'), e.material,
      e.P_mSv_semana, e.T, e.U, e.d_m, r.K_sin_blindaje_mSv_semana.toFixed(4), r.espesorDosFuentes_cm.toFixed(2),
      r.espesorSumaDirecta_cm.toFixed(2), r.espesorRedondeado_cm.toFixed(1), r.dosisOcupacion_mSv_semana.toExponential(3),
      r.cumple ? 'SI' : 'NO',
    ].join(','));
    const blob = new Blob([[enc.join(','), ...filas].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Barreras_NCRP151_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`${historial.length} cálculo(s) exportados a CSV`);
  }, [historial]);

  const energiaSelect = (v: EnergiaMV, set: (e: EnergiaMV) => void, id: string) => (
    <select id={id} className={sel} value={String(v)} onChange={(ev) => set(Number(ev.target.value) as EnergiaMV)}>
      {ENERGIAS_MV_TABULADAS.map((e) => <option key={e} value={e}>{e} MV</option>)}
    </select>
  );
  const num = (id: string, label: string, v: number, set: (n: number) => void, step = 0.1) => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" step={step} value={v} onChange={(ev) => set(Number(ev.target.value))} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" />
            Calculadora de barreras de megavoltaje — NCRP 151
          </DialogTitle>
          <DialogDescription>
            Primaria (Ec. 2.1), dispersión del paciente (Ec. 2.7) y fuga (Ec. 2.8) por separado, con TVL₁/TVLₑ y la regla de las dos fuentes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className="w-1/2 space-y-3 overflow-auto pr-2">
            <div className="space-y-1">
              <Label htmlFor="bc-tipo">Tipo de barrera</Label>
              <select id="bc-tipo" className={sel} value={tipo} onChange={(ev) => setTipo(ev.target.value as 'primaria' | 'secundaria')}>
                <option value="primaria">Primaria (haz directo)</option>
                <option value="secundaria">Secundaria (dispersión del paciente + fuga del cabezal)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label htmlFor="bc-e1">Energía</Label>{energiaSelect(e1, setE1, 'bc-e1')}</div>
              {num('bc-w1', 'Carga W (Gy/semana en el isocentro)', w1, setW1, 10)}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={doble} onChange={(ev) => setDoble(ev.target.checked)} /> Equipo de doble energía
            </label>
            {doble && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label htmlFor="bc-e2">Segunda energía</Label>{energiaSelect(e2, setE2, 'bc-e2')}</div>
                {num('bc-w2', 'Carga W₂ (Gy/semana)', w2, setW2, 10)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="bc-material">Material</Label>
                <select id="bc-material" className={sel} value={material} onChange={(ev) => setMaterial(ev.target.value as MaterialNCRP151)}>
                  {MATERIALES_MV.map((m) => <option key={m} value={m}>{NOMBRE_MATERIAL[m]}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bc-area">Objetivo de diseño P</Label>
                <select id="bc-area" className={sel} value={areaId} onChange={(ev) => setAreaId(ev.target.value)}>
                  {OBJETIVOS_DISENO.map((o) => <option key={o.id} value={o.id}>{o.etiqueta}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="bc-T">Factor de ocupación T</Label>
                <select id="bc-T" className={sel} value={String(T)} onChange={(ev) => setT(Number(ev.target.value))}>
                  {OCUPACION.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {num('bc-U', tipo === 'primaria' ? 'Factor de uso U' : 'Factor de uso U (haz al paciente)', U, setU, 0.05)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {num('bc-d', tipo === 'primaria' ? 'Distancia blanco → punto protegido (m)' : 'Distancia isocentro → punto, d_sec (m)', d, setD)}
              {tipo === 'secundaria' && num('bc-theta', 'Ángulo de dispersión θ (°)', theta, setTheta, 5)}
            </div>
            {tipo === 'secundaria' && (
              <div className="space-y-1">
                <Label htmlFor="bc-dL">Distancia de fuga d_L (m; vacío = d_sec)</Label>
                <Input id="bc-dL" type="number" step={0.1} value={dL} onChange={(ev) => setDL(ev.target.value === '' ? '' : Number(ev.target.value))} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {num('bc-imrt', 'Fracción IMRT de la carga (%)', imrt, setImrt, 5)}
              {num('bc-ci', 'Factor IMRT C_I (Ec. 3.6)', ci, setCi, 0.5)}
            </div>
            <Button onClick={calcular} className="w-full" data-testid="bc-calcular">
              <Calculator className="w-4 h-4 mr-1.5" /> Calcular
            </Button>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            {historial.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportarCSV} className="flex-1">
                  <Download className="w-3.5 h-3.5 mr-1" /> Exportar CSV ({historial.length})
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setHistorial([])}>Limpiar</Button>
              </div>
            )}
          </div>

          <div className="w-1/2 border-l pl-4 overflow-auto">
            {ultimo ? (
              <div className="space-y-3" data-testid="bc-resultado">
                <div className={`p-3 rounded-lg border flex items-center gap-3 ${ultimo.resultado.cumple ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  {ultimo.resultado.cumple ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
                  <div>
                    <div className="font-bold text-sm" data-testid="bc-dictamen">{ultimo.resultado.cumple ? 'CUMPLE: T·K ≤ P' : 'NO CUMPLE: T·K > P'}</div>
                    <div className="text-xs text-gray-500">
                      T·K con {ultimo.resultado.espesorRedondeado_cm.toFixed(1)} cm: {ultimo.resultado.dosisOcupacion_mSv_semana.toExponential(2)} mSv/semana; P = {ultimo.entrada.P_mSv_semana} mSv/semana
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Caja etiqueta="Espesor adoptado" valor={`${ultimo.resultado.espesor_cm.toFixed(1)} cm`} sub="mayor de los dos métodos" destacado testid="bc-espesor" />
                  <Caja etiqueta="Espesor redondeado" valor={`${ultimo.resultado.espesorRedondeado_cm.toFixed(1)} cm`} destacado />
                  <Caja etiqueta="Regla de dos fuentes" valor={`${ultimo.resultado.espesorDosFuentes_cm.toFixed(1)} cm`} sub="NCRP 151 §1.4.3" />
                  <Caja etiqueta="Suma directa Σ K·B·T = P" valor={`${ultimo.resultado.espesorSumaDirecta_cm.toFixed(1)} cm`} />
                  <Caja etiqueta="K sin blindaje" valor={`${ultimo.resultado.K_sin_blindaje_mSv_semana.toPrecision(3)} mSv/semana`} />
                  <Caja etiqueta="K con blindaje" valor={`${ultimo.resultado.K_con_blindaje_mSv_semana.toExponential(2)} mSv/semana`} />
                </div>
                <table className="w-full text-[11px]">
                  <thead><tr className="text-left text-gray-500"><th>Componente</th><th>K (mSv/sem)</th><th>B</th><th>t (cm)</th><th>TVL (cm)</th></tr></thead>
                  <tbody>
                    {ultimo.resultado.componentes.map((c) => (
                      <tr key={c.nombre} className="border-t">
                        <td>{c.nombre}</td><td className="font-mono">{c.K_mSv_semana.toPrecision(3)}</td>
                        <td className="font-mono">{c.B_requerida.toExponential(2)}</td><td className="font-mono">{c.espesor_cm.toFixed(1)}</td>
                        <td className="font-mono">{c.tvl_cm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-gray-400">{ultimo.resultado.referencia}. Kerma en aire ≈ dosis equivalente (Sv ≈ Gy).</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Shield className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">Configure los parámetros y presione Calcular</p>
                <p className="text-xs mt-1">Valores iniciales: ejemplo §7.1.1 de NCRP 151 (149.6 cm de concreto)</p>
              </div>
            )}
            {historial.length > 1 && (
              <div className="mt-4 pt-3 border-t">
                <h4 className="text-xs font-semibold text-gray-500 mb-2">Historial ({historial.length})</h4>
                <ScrollArea className="max-h-40">
                  <div className="space-y-1">
                    {historial.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-gray-50 dark:bg-gray-800">
                        <Badge variant={r.resultado.cumple ? 'default' : 'destructive'} className="text-[8px] h-4 px-1">{i + 1}</Badge>
                        <span className="flex-1 truncate">{r.entrada.tipo} {r.entrada.haces.map((h) => `${h.energia} MV`).join('/')}</span>
                        <span className="font-mono">{r.resultado.espesorRedondeado_cm.toFixed(1)} cm</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Caja({ etiqueta, valor, sub, destacado, testid }: { etiqueta: string; valor: string; sub?: string; destacado?: boolean; testid?: string }) {
  return (
    <div className={`p-2 rounded border ${destacado ? 'bg-blue-50 dark:bg-blue-950 border-blue-200' : 'bg-gray-50 dark:bg-gray-800 border-gray-200'}`}>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{etiqueta}</div>
      <div className="text-sm font-bold text-gray-800 dark:text-gray-200" data-testid={testid}>{valor}</div>
      {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
    </div>
  );
}
