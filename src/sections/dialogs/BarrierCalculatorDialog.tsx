// Fase 1: BarrierCalculatorDialog -- Calculo de blindajes NCRP 151/147 en webapp
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Calculator, Download, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { MATERIALS } from '@/types/radshield';
import { roundThickness } from '@/lib/shieldingMath';

interface CalcResult {
  barrierType: string;
  energy_MeV: number;
  workload_Gy_per_week: number;
  distance_m: number;
  materialCode: string;
  designGoal_mSv_per_week: number;
  useFactor: number;
  occupancyFactor: number;
  unshieldedKerma_mSv_per_week: number;
  requiredThickness_mm: number;
  requiredThickness_cm: number;
  roundedThickness_mm: number;
  transmission: number;
  shieldedKerma_mSv_per_week: number;
  passesCNSNS: boolean;
  passesALARA: boolean;
  nTVLs: number;
  tvl_mm: number;
}

const BARRIER_TYPES = [
  { value: 'primary', label: 'Barrera Primaria (haz directo)', designGoal: 0.02, useFactor: 0.25 },
  { value: 'primary_imrt', label: 'Primaria IMRT (VMAT/SBRT)', designGoal: 0.02, useFactor: 0.25 },
  { value: 'secondary_scatter', label: 'Secundaria - Dispersion', designGoal: 0.02, useFactor: 1.0 },
  { value: 'secondary_leakage', label: 'Secundaria - Fuga cabezal', designGoal: 0.02, useFactor: 1.0 },
  { value: 'secondary_twosource', label: 'Two-Source Rule', designGoal: 0.02, useFactor: 1.0 },
  { value: 'door_maze', label: 'Puerta laberinto', designGoal: 0.02, useFactor: 1.0 },
];

const OCCUPANCY_FACTORS = [
  { value: 1.0, label: 'Control total (POE)' },
  { value: 0.5, label: 'Recepcion / Oficinas' },
  { value: 0.2, label: 'Pasillos / Escaleras' },
  { value: 0.125, label: 'Banios publicos' },
  { value: 0.05, label: 'Estacionamiento / Ascensores' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BarrierCalculatorDialog({ open, onOpenChange }: Props) {
  const [energy, setEnergy] = useState(6);
  const [workload, setWorkload] = useState(450);
  const [distance, setDistance] = useState(4.5);
  const [materialCode, setMaterialCode] = useState('CONCRETE235');
  const [barrierType, setBarrierType] = useState('primary');
  const [occupancy, setOccupancy] = useState(0.2);
  const [leakageFraction, setLeakageFraction] = useState(0.001);
  const [results, setResults] = useState<CalcResult[]>([]);
  const [lastCalc, setLastCalc] = useState<CalcResult | null>(null);

  const material = useMemo(() => MATERIALS.find(m => m.code === materialCode) || MATERIALS[0], [materialCode]);
  const barrierConfig = useMemo(() => BARRIER_TYPES.find(b => b.value === barrierType) || BARRIER_TYPES[0], [barrierType]);

  const calculate = useCallback(() => {
    const designGoal = barrierConfig.designGoal;
    const useFactor = barrierConfig.useFactor;
    const occupancyFactor = occupancy;

    const unshieldedKerma = (workload * useFactor * occupancyFactor * 1000) / (distance ** 2);
    const requiredTransmission = designGoal / (unshieldedKerma || 1);

    const energyKey = energy <= 6 ? '6MV' : energy <= 10 ? '10MV' : energy <= 15 ? '15MV' : '18MV';
    const tvlValue = material.TVL_mm?.[energyKey] || material.TVL_mm?.['6MV'] || 350;

    const nTVLs = -Math.log10(requiredTransmission);
    const requiredThickness_mm = nTVLs * tvlValue;
    const requiredThickness_cm = requiredThickness_mm / 10;
    const rounded_mm = roundThickness(requiredThickness_mm, materialCode);
    const transmission = Math.pow(10, -rounded_mm / tvlValue);
    const shieldedKerma = unshieldedKerma * transmission;

    const passesCNSNS = shieldedKerma <= designGoal * 1.2;
    const passesALARA = shieldedKerma <= designGoal * 1.1;

    const result: CalcResult = {
      barrierType: barrierConfig.label,
      energy_MeV: energy,
      workload_Gy_per_week: workload,
      distance_m: distance,
      materialCode,
      designGoal_mSv_per_week: designGoal,
      useFactor,
      occupancyFactor,
      unshieldedKerma_mSv_per_week: unshieldedKerma,
      requiredThickness_mm,
      requiredThickness_cm,
      roundedThickness_mm: rounded_mm,
      transmission,
      shieldedKerma_mSv_per_week: shieldedKerma,
      passesCNSNS,
      passesALARA,
      nTVLs,
      tvl_mm: tvlValue,
    };

    setLastCalc(result);
    setResults(prev => [...prev, result]);
    toast.success(`Calculo completado: ${rounded_mm.toFixed(1)} mm ${material.name}`);
  }, [energy, workload, distance, materialCode, barrierType, occupancy, barrierConfig, material]);

  const exportCSV = useCallback(() => {
    if (!lastCalc) return;
    const headers = [
      'Tipo_Barrera', 'Energia_MeV', 'Workload_Gy_sem', 'Distancia_m',
      'Material', 'Espesor_Calculado_mm', 'Espesor_Redondeado_mm',
      'Espesor_cm', 'n_TVLs', 'TVL_mm', 'Kerma_Sin_Blindaje_mSv_sem',
      'Kerma_Con_Blindaje_mSv_sem', 'Cumple_CNSNS', 'Cumple_ALARA'
    ];
    const row = [
      lastCalc.barrierType, lastCalc.energy_MeV, lastCalc.workload_Gy_per_week, lastCalc.distance_m,
      lastCalc.materialCode, lastCalc.requiredThickness_mm.toFixed(2), lastCalc.roundedThickness_mm.toFixed(2),
      lastCalc.requiredThickness_cm.toFixed(2), lastCalc.nTVLs.toFixed(2), lastCalc.tvl_mm,
      lastCalc.unshieldedKerma_mSv_per_week.toFixed(4),
      lastCalc.shieldedKerma_mSv_per_week.toFixed(6), lastCalc.passesCNSNS ? 'SI' : 'NO', lastCalc.passesALARA ? 'SI' : 'NO'
    ];
    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Barrera_${lastCalc.barrierType.replace(/\s+/g, '_')}_${energy}MV.csv`;
    a.click();
    toast.success('CSV exportado');
  }, [lastCalc, energy]);

  const exportAllCSV = useCallback(() => {
    if (results.length === 0) return;
    const headers = ['Tipo_Barrera', 'Energia_MeV', 'Workload_Gy_sem', 'Distancia_m', 'Material', 'Espesor_Calculado_mm', 'Espesor_Redondeado_mm', 'Espesor_cm', 'n_TVLs', 'TVL_mm', 'Kerma_Sin_Blindaje_mSv_sem', 'Kerma_Con_Blindaje_mSv_sem', 'Cumple_CNSNS', 'Cumple_ALARA'];
    const rows = results.map(r => [
      r.barrierType, r.energy_MeV, r.workload_Gy_per_week, r.distance_m, r.materialCode,
      r.requiredThickness_mm.toFixed(2), r.roundedThickness_mm.toFixed(2), r.requiredThickness_cm.toFixed(2),
      r.nTVLs.toFixed(2), r.tvl_mm, r.unshieldedKerma_mSv_per_week.toFixed(4),
      r.shieldedKerma_mSv_per_week.toFixed(6),
      r.passesCNSNS ? 'SI' : 'NO', r.passesALARA ? 'SI' : 'NO'
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Barreras_Calculadas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success(`${results.length} barreras exportadas a CSV`);
  }, [results]);

  const clearResults = useCallback(() => {
    setResults([]);
    setLastCalc(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" />
            Calculadora de Blindajes -- NCRP 151 / 147
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left panel: Inputs */}
          <div className="w-1/2 space-y-3 overflow-auto pr-2">
            <div className="space-y-1.5">
              <Label>Tipo de Barrera</Label>
              <Select value={barrierType} onValueChange={setBarrierType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BARRIER_TYPES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Energia (MV)</Label>
                <Input type="number" min={4} max={25} step={1} value={energy} onChange={e => setEnergy(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Workload (Gy/sem)</Label>
                <Input type="number" min={10} max={2000} step={10} value={workload} onChange={e => setWorkload(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Distancia (m)</Label>
                <Input type="number" min={0.5} max={20} step={0.1} value={distance} onChange={e => setDistance(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Factor Ocupacion (T)</Label>
                <Select value={String(occupancy)} onValueChange={v => setOccupancy(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OCCUPANCY_FACTORS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Material de Blindaje</Label>
              <Select value={materialCode} onValueChange={setMaterialCode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATERIALS.map(m => <SelectItem key={m.code} value={m.code}>{m.name} (TVL 6MV: {m.TVL_mm?.['6MV'] || '?'} mm)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {barrierType.includes('leakage') && (
              <div className="space-y-1">
                <Label>Fraccion de Fuga (10^-3 default)</Label>
                <Input type="number" min={0.0001} max={0.01} step={0.0001} value={leakageFraction} onChange={e => setLeakageFraction(Number(e.target.value))} />
              </div>
            )}

            <Button onClick={calculate} className="w-full">
              <Calculator className="w-4 h-4 mr-1.5" /> Calcular Blindaje
            </Button>

            {results.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportAllCSV} className="flex-1">
                  <Download className="w-3.5 h-3.5 mr-1" /> Exportar Todo ({results.length})
                </Button>
                <Button variant="ghost" size="sm" onClick={clearResults}>Limpiar</Button>
              </div>
            )}

            <p className="text-[10px] text-gray-400">
              Metodologia: n = log10(K_sin/P), x = n x TVL. Redondeo constructivo segun material.
            </p>
          </div>

          {/* Right panel: Results */}
          <div className="w-1/2 border-l pl-4 overflow-auto">
            {lastCalc ? (
              <div className="space-y-3">
                {/* Dictamen */}
                <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                  lastCalc.passesALARA ? 'bg-green-50 border-green-300' :
                  lastCalc.passesCNSNS ? 'bg-yellow-50 border-yellow-300' :
                  'bg-red-50 border-red-300'
                }`}>
                  {lastCalc.passesCNSNS ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
                  <div>
                    <div className="font-bold text-sm">
                      {lastCalc.passesALARA ? 'CUMPLE ALARA (<10%)' :
                       lastCalc.passesCNSNS ? 'CUMPLE CNSNS (<20%)' :
                       'NO CUMPLE -- REVISAR'}
                    </div>
                    <div className="text-xs text-gray-500">
                      K con blindaje: {lastCalc.shieldedKerma_mSv_per_week.toFixed(4)} mSv/sem vs diseno {lastCalc.designGoal_mSv_per_week} mSv/sem
                    </div>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <ResultBox label="Espesor Calculado" value={`${lastCalc.requiredThickness_cm.toFixed(1)} cm`} sub={`${lastCalc.requiredThickness_mm.toFixed(1)} mm`} highlight />
                  <ResultBox label="Espesor Redondeado" value={`${lastCalc.roundedThickness_mm.toFixed(1)} mm`} sub={`${(lastCalc.roundedThickness_mm / 10).toFixed(2)} cm`} highlight />
                  <ResultBox label={`TVL (${energy}MV)`} value={`${lastCalc.tvl_mm} mm`} sub={`${lastCalc.nTVLs.toFixed(2)} TVLs`} />
                  <ResultBox label="Transmision B(x)" value={`${lastCalc.transmission}`} />
                  <ResultBox label="K sin blindaje" value={`${lastCalc.unshieldedKerma_mSv_per_week.toFixed(2)}`} unit="mSv/sem" />
                  <ResultBox label="K con blindaje" value={`${lastCalc.shieldedKerma_mSv_per_week.toFixed(4)}`} unit="mSv/sem" color={lastCalc.passesCNSNS ? 'text-green-600' : 'text-red-600'} />
                </div>

                {/* Formula reference */}
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-[10px] text-gray-500 font-mono">
                  <div>n = log10({lastCalc.unshieldedKerma_mSv_per_week.toFixed(2)} / {lastCalc.designGoal_mSv_per_week}) = {lastCalc.nTVLs.toFixed(2)}</div>
                  <div>x = {lastCalc.nTVLs.toFixed(2)} x {lastCalc.tvl_mm} = {lastCalc.requiredThickness_mm.toFixed(1)} mm</div>
                  <div>B(x) = 10^(-{lastCalc.roundedThickness_mm.toFixed(1)} / {lastCalc.tvl_mm}) = {lastCalc.transmission}</div>
                </div>

                <Button variant="outline" size="sm" onClick={exportCSV} className="w-full">
                  <Download className="w-3.5 h-3.5 mr-1" /> Exportar CSV
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Shield className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">Configure parametros y presione Calcular</p>
                <p className="text-xs mt-1">Metodologia: NCRP 151 §4.2.3</p>
              </div>
            )}

            {/* History */}
            {results.length > 1 && (
              <div className="mt-4 pt-3 border-t">
                <h4 className="text-xs font-semibold text-gray-500 mb-2">Historial ({results.length})</h4>
                <ScrollArea className="max-h-40">
                  <div className="space-y-1">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-gray-50 dark:bg-gray-800">
                        <Badge variant={r.passesCNSNS ? "default" : "destructive"} className="text-[8px] h-4 px-1">{i + 1}</Badge>
                        <span className="flex-1 truncate">{r.barrierType}</span>
                        <span className="font-mono">{r.roundedThickness_mm.toFixed(0)} mm</span>
                        <span className={r.passesCNSNS ? 'text-green-600' : 'text-red-600'}>{r.passesCNSNS ? 'OK' : 'FAIL'}</span>
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

function ResultBox({ label, value, sub, unit, highlight, color }: {
  label: string; value: string; sub?: string; unit?: string; highlight?: boolean; color?: string;
}) {
  return (
    <div className={`p-2 rounded border ${highlight ? 'bg-blue-50 dark:bg-blue-950 border-blue-200' : 'bg-gray-50 dark:bg-gray-800 border-gray-200'}`}>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-sm font-bold ${color || 'text-gray-800 dark:text-gray-200'}`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
      {unit && <div className="text-[10px] text-gray-400">{unit}</div>}
    </div>
  );
}
