/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v27 — Electron & Positron Transport Dialog
 * ═══════════════════════════════════════════════════════════════════════════
 *  Tabs: Setup, Stopping Power, Range & MCS, Bremsstrahlung, TTB Dose
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Zap, Activity, ArrowRight, ScatterChart, Target, Radio,
  FlaskConical, Download, Play, RotateCcw
} from 'lucide-react';
import {
  ELECTRON_MATERIALS, runElectronTransport, runEnergySweep,
  calculateBremsstrahlungSpectrum,
  type ElectronSource, type ElectronTransportResult,
} from '@/lib/electronEngine';

interface ElectronTransportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ElectronTransportDialog({ open, onOpenChange }: ElectronTransportDialogProps) {
  const [activeTab, setActiveTab] = useState('setup');
  const [particle, setParticle] = useState<'electron' | 'positron'>('electron');
  const [energy, setEnergy] = useState('6');
  const [current_nA, setCurrent_nA] = useState('1');
  const [materialCode, setMaterialCode] = useState('H2O');
  const [thickness_mm, setThickness_mm] = useState('100');
  const [angle_degrees, setAngle_degrees] = useState('0');
  const [result, setResult] = useState<ElectronTransportResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [spectrum, setSpectrum] = useState<ReturnType<typeof calculateBremsstrahlungSpectrum>>([]);
  const [energySweep, setEnergySweep] = useState<ReturnType<typeof runEnergySweep>>([]);

  const mat = useMemo(() => ELECTRON_MATERIALS.find(m => m.code === materialCode), [materialCode]);

  const handleCalculate = useCallback(() => {
    setIsCalculating(true);
    const t0 = performance.now();
    try {
      const source: ElectronSource = {
        particle,
        energy_MeV: parseFloat(energy) || 1,
        current_nA: parseFloat(current_nA) || 1,
        materialCode,
        thickness_mm: parseFloat(thickness_mm) || 100,
        angle_degrees: parseFloat(angle_degrees) || 0,
        targetShape: 'slab',
      };
      const res = runElectronTransport(source);
      setResult(res);

      // Bremsstrahlung spectrum
      const spec = calculateBremsstrahlungSpectrum(source.energy_MeV, materialCode, 50);
      setSpectrum(spec);

      // Energy sweep
      const sweep = runEnergySweep(materialCode, 0.01, Math.max(source.energy_MeV * 2, 20), 100);
      setEnergySweep(sweep);

      const dt = performance.now() - t0;
      toast.success(`Calculo completado en ${dt.toFixed(1)} ms`);
      setActiveTab('results');
    } catch (e) {
      toast.error('Error: ' + (e as Error).message);
    } finally {
      setIsCalculating(false);
    }
  }, [particle, energy, current_nA, materialCode, thickness_mm, angle_degrees]);

  const handleReset = useCallback(() => {
    setEnergy('6');
    setCurrent_nA('1');
    setMaterialCode('H2O');
    setThickness_mm('100');
    setAngle_degrees('0');
    setParticle('electron');
    setResult(null);
    setSpectrum([]);
    setEnergySweep([]);
    setActiveTab('setup');
  }, []);

  const exportCSV = useCallback(() => {
    if (!result) return;
    const rows = [
      ['Parametro', 'Valor', 'Unidad'],
      ['Particula', particle === 'electron' ? 'Electron' : 'Positron', ''],
      ['Energia incidente', energy, 'MeV'],
      ['Corriente', current_nA, 'nA'],
      ['Material', mat?.name || materialCode, ''],
      ['Densidad', mat?.density_g_cm3.toString() || '', 'g/cm3'],
      ['Espesor', thickness_mm, 'mm'],
      ['SP collision', result.collisionStoppingPower_MeV_cm2_g.toFixed(4), 'MeV cm2/g'],
      ['SP radiative', result.radiativeStoppingPower_MeV_cm2_g.toFixed(4), 'MeV cm2/g'],
      ['SP total', result.totalStoppingPower_MeV_cm2_g.toFixed(4), 'MeV cm2/g'],
      ['CSDA Range', result.CSDArange_mm.toFixed(2), 'mm'],
      ['Range proyectado', result.projectedRange_mm.toFixed(2), 'mm'],
      ['Detour factor', result.detourFactor.toFixed(4), ''],
      ['Energia salida', result.exitEnergy_MeV.toFixed(4), 'MeV'],
      ['Energia depositada', result.energyDeposition_MeV.toFixed(4), 'MeV'],
      ['Fraccion depositada', (result.energyDepositionFraction * 100).toFixed(2), '%'],
      ['Bremsstrahlung yield', (result.bremsstrahlungYield * 100).toFixed(2), '%'],
      ['Energia critica', result.criticalEnergy_MeV.toFixed(2), 'MeV'],
      ['Longitud radiacion', result.radiationLength_mm.toFixed(2), 'mm'],
      ['MCS RMS', result.MCS_rms_degrees.toFixed(2), 'deg'],
      ['MCS FWHM', result.MCS_fwhm_degrees.toFixed(2), 'deg'],
      ['TTB dose @ 1m', result.ttbDoseRate_uSv_h_at_1m.toExponential(2), 'uSv/h'],
    ];
    if (particle === 'positron') {
      rows.push(['Fotones aniquilacion', result.annihilationPhotonsPerIncident.toExponential(2), 'per e+']);
      rows.push(['Fotones 511 keV', result.annihilation511keVPhotons.toExponential(2), 'per e+']);
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ElectronTransport_${particle}_${energy}MeV_${materialCode}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  }, [result, particle, energy, current_nA, materialCode, thickness_mm, mat]);

  // Simple ASCII chart for spectrum
  const spectrumChart = useMemo(() => {
    if (!spectrum.length) return null;
    const maxVal = Math.max(...spectrum.map(s => s.differentialCrossSection_barn_MeV));
    const width = 50;
    return (
      <div className="font-mono text-[10px] leading-3 text-slate-600 space-y-0.5">
        <div className="text-[9px] text-slate-400 mb-1">d²σ/dΩdk (arb. units, log scale)</div>
        {spectrum.filter((_, i) => i % 5 === 0).map((s, i) => {
          const barLen = Math.round((s.differentialCrossSection_barn_MeV / maxVal) * width);
          return (
            <div key={i} className="flex items-center gap-1">
              <span className="w-8 text-right">{s.photonEnergy_MeV.toFixed(1)}</span>
              <span className="w-1">|</span>
              <span className="text-blue-500">{'█'.repeat(Math.max(barLen, 1))}</span>
              <span className="text-slate-400">{s.differentialCrossSection_barn_MeV.toExponential(1)}</span>
            </div>
          );
        })}
      </div>
    );
  }, [spectrum]);

  // ASCII chart for energy sweep (stopping power)
  const sweepChart = useMemo(() => {
    if (!energySweep.length) return null;
    const maxSP = Math.max(...energySweep.map(s => s.stoppingPower_MeV_cm2_g));
    const width = 40;
    return (
      <div className="font-mono text-[10px] leading-3 text-slate-600 space-y-0.5">
        <div className="text-[9px] text-slate-400 mb-1">S/ρ (MeV·cm²/g) vs E (MeV)</div>
        {energySweep.filter((_, i) => i % 7 === 0).map((s, i) => {
          const barLen = Math.round((s.stoppingPower_MeV_cm2_g / maxSP) * width);
          return (
            <div key={i} className="flex items-center gap-1">
              <span className="w-8 text-right">{s.energy_MeV.toFixed(2)}</span>
              <span className="w-1">|</span>
              <span className="text-emerald-500">{'█'.repeat(Math.max(barLen, 1))}</span>
            </div>
          );
        })}
      </div>
    );
  }, [energySweep]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-amber-500" />
            Electron & Positron Transport Engine — v27
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <TabsList className="mx-6 mt-2 grid grid-cols-5 h-8">
            <TabsTrigger value="setup" className="text-[11px]">Setup</TabsTrigger>
            <TabsTrigger value="results" className="text-[11px]">Results</TabsTrigger>
            <TabsTrigger value="spectrum" className="text-[11px]">Bremsstrahlung</TabsTrigger>
            <TabsTrigger value="sweep" className="text-[11px]">Energy Sweep</TabsTrigger>
            <TabsTrigger value="ttb" className="text-[11px]">TTB Dose</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 h-[60vh] px-6 py-4">
            <TabsContent value="setup" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] font-medium">Particula</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant={particle === 'electron' ? 'default' : 'outline'}
                      className="text-xs flex-1"
                      onClick={() => setParticle('electron')}
                    >
                      <Zap className="w-3 h-3 mr-1" /> Electron
                    </Button>
                    <Button
                      size="sm"
                      variant={particle === 'positron' ? 'default' : 'outline'}
                      className="text-xs flex-1"
                      onClick={() => setParticle('positron')}
                    >
                      <Radio className="w-3 h-3 mr-1" /> Positron
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-medium">Energia (MeV)</Label>
                  <Input value={energy} onChange={e => setEnergy(e.target.value)} type="number" step="0.1" min="0.01" max="1000" className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-medium">Corriente (nA)</Label>
                  <Input value={current_nA} onChange={e => setCurrent_nA(e.target.value)} type="number" step="0.1" min="0.001" className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-medium">Espesor (mm)</Label>
                  <Input value={thickness_mm} onChange={e => setThickness_mm(e.target.value)} type="number" step="1" min="0.1" className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-medium">Angulo incidencia (°)</Label>
                  <Input value={angle_degrees} onChange={e => setAngle_degrees(e.target.value)} type="number" step="1" min="0" max="89" className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-medium">Material</Label>
                  <Select value={materialCode} onValueChange={setMaterialCode}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ELECTRON_MATERIALS.map(m => (
                        <SelectItem key={m.code} value={m.code} className="text-xs">
                          {m.name} (ρ={m.density_g_cm3} g/cm³, Z={m.Z_eff})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {mat && (
                <div className="bg-slate-50 rounded-md p-3 text-[11px] space-y-1 border">
                  <div className="font-medium text-slate-700 flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" /> Propiedades del material
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-slate-600">
                    <span>Densidad: <strong>{mat.density_g_cm3}</strong> g/cm³</span>
                    <span>Z_eff: <strong>{mat.Z_eff}</strong></span>
                    <span>A_eff: <strong>{mat.A_eff}</strong></span>
                    <span>I: <strong>{mat.I_eV}</strong> eV</span>
                    <span>X₀: <strong>{mat.X0_g_cm2}</strong> g/cm²</span>
                    <span>E_c: <strong>{mat.Ec_MeV}</strong> MeV</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" className="text-xs" onClick={handleCalculate} disabled={isCalculating}>
                  <Play className="w-3.5 h-3.5 mr-1" />
                  {isCalculating ? 'Calculando...' : 'Ejecutar Transporte'}
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={handleReset}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                </Button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-[11px] text-amber-800">
                <strong>Nota:</strong> Motor basado en NIST ESTAR + ICRU-37/90. Stopping power CSDA con correccion de efecto de densidad (Sternheimer). Bremsstrahlung: aproximacion Koch-Motz. MCS: formula Highland-Lynch-Dahl. TTB: formula IAEA para dosis de frenado.
              </div>
            </TabsContent>

            <TabsContent value="results" className="mt-0 space-y-3">
              {!result ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Ejecute el calculo en la pestana Setup para ver resultados.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px]">
                      {particle === 'electron' ? 'e-' : 'e+'} @ {energy} MeV en {mat?.name}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-emerald-600">
                      <Activity className="w-2.5 h-2.5 mr-1" /> {result.calculationTime_ms.toFixed(1)} ms
                    </Badge>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={exportCSV}>
                      <Download className="w-3 h-3 mr-1" /> Export CSV
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Stopping Power Card */}
                    <div className="bg-slate-50 rounded-md p-3 border space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-red-500" /> Stopping Power @ {energy} MeV
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between"><span className="text-slate-500">Collision (dE/dx)_col:</span><strong>{result.collisionStoppingPower_MeV_cm2_g.toFixed(4)} MeV·cm²/g</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">Radiative (dE/dx)_rad:</span><strong className="text-amber-600">{result.radiativeStoppingPower_MeV_cm2_g.toFixed(4)} MeV·cm²/g</strong></div>
                        <Separator className="my-1" />
                        <div className="flex justify-between"><span className="text-slate-700 font-medium">Total S/ρ:</span><strong className="text-blue-600">{result.totalStoppingPower_MeV_cm2_g.toFixed(4)} MeV·cm²/g</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">S_col / S_total:</span><strong>{((result.collisionStoppingPower_MeV_cm2_g / result.totalStoppingPower_MeV_cm2_g) * 100).toFixed(1)}%</strong></div>
                      </div>
                    </div>

                    {/* Range Card */}
                    <div className="bg-slate-50 rounded-md p-3 border space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-emerald-500" /> Range & Transporte
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between"><span className="text-slate-500">CSDA Range:</span><strong>{result.CSDArange_mm.toFixed(2)} mm</strong> ({result.CSDArange_g_cm2.toFixed(3)} g/cm²)</div>
                        <div className="flex justify-between"><span className="text-slate-500">Range proyectado:</span><strong>{result.projectedRange_mm.toFixed(2)} mm</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">Detour factor:</span><strong>{result.detourFactor.toFixed(4)}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">Energia critica E_c:</span><strong>{result.criticalEnergy_MeV.toFixed(2)} MeV</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">Longitud radiacion X0:</span><strong>{result.radiationLength_mm.toFixed(2)} mm</strong></div>
                      </div>
                    </div>

                    {/* Energy Deposition Card */}
                    <div className="bg-slate-50 rounded-md p-3 border space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Target className="w-3 h-3 text-blue-500" /> Deposicion de Energia
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between"><span className="text-slate-500">Energia incidente:</span><strong>{energy} MeV</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">Energia salida:</span><strong>{result.exitEnergy_MeV.toFixed(4)} MeV</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">Energia depositada:</span><strong className="text-red-600">{result.energyDeposition_MeV.toFixed(4)} MeV</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">Fraccion depositada:</span><strong className="text-red-600">{(result.energyDepositionFraction * 100).toFixed(2)}%</strong></div>
                        <Separator className="my-1" />
                        <div className="flex justify-between"><span className="text-slate-500">Brems yield:</span><strong className="text-amber-600">{(result.bremsstrahlungYield * 100).toFixed(2)}%</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">Energia Bremss.:</span><strong>{result.totalBremsstrahlungEnergy_MeV.toFixed(4)} MeV</strong></div>
                      </div>
                    </div>

                    {/* MCS Card */}
                    <div className="bg-slate-50 rounded-md p-3 border space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <ScatterChart className="w-3 h-3 text-purple-500" /> Multiple Coulomb Scattering
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between"><span className="text-slate-500">RMS angle (Highland):</span><strong>{result.MCS_rms_degrees.toFixed(2)}°</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500">FWHM angle:</span><strong>{result.MCS_fwhm_degrees.toFixed(2)}°</strong></div>
                        <Separator className="my-1" />
                        <div className="text-[10px] text-slate-400">Metodo: Highland-Lynch-Dahl con correccion de screening.</div>
                      </div>
                    </div>
                  </div>

                  {particle === 'positron' && result && (
                    <div className="bg-pink-50 rounded-md p-3 border border-pink-200 space-y-2">
                      <div className="text-[11px] font-semibold text-pink-700 flex items-center gap-1">
                        <Radio className="w-3 h-3" /> Aniquilacion e+ e-
                      </div>
                      <div className="space-y-1 text-[11px] text-pink-800">
                        <div className="flex justify-between"><span>Fotones de aniquilacion por e+:</span><strong>{result.annihilationPhotonsPerIncident.toExponential(2)}</strong></div>
                        <div className="flex justify-between"><span>Fotones 511 keV producidos:</span><strong>{result.annihilation511keVPhotons.toExponential(2)}</strong></div>
                        <div className="text-[10px] mt-1">e+ + e- → γ + γ (511 keV cada uno, acolinealidad ~0.5° FWHM)</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="spectrum" className="mt-0">
              {!spectrum.length ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <ScatterChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Ejecute el calculo para ver el espectro de Bremsstrahlung.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[11px] text-slate-600">
                    Espectro de Bremsstrahlung diferencial: d²σ/dΩdk (Koch-Motz 1959)
                    para {particle === 'electron' ? 'electrones' : 'positrones'} de {energy} MeV en {mat?.name}.
                  </div>
                  {spectrumChart}
                  <div className="text-[10px] text-slate-400 mt-2">
                    Total yield: {((result?.bremsstrahlungYield || 0) * 100).toFixed(2)}% de la energia cinetica convertida a radiacion.
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sweep" className="mt-0">
              {!energySweep.length ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Ejecute el calculo para ver el barrido de energia.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[11px] text-slate-600">
                    Stopping power total vs energia para {mat?.name}. Rango: 0.01–{Math.max(parseFloat(energy) * 2, 20)} MeV.
                  </div>
                  {sweepChart}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-slate-50 rounded p-2 border text-[10px]">
                      <strong>Range @ {energy} MeV:</strong> {result?.CSDArange_mm.toFixed(2) || '-'} mm
                    </div>
                    <div className="bg-slate-50 rounded p-2 border text-[10px]">
                      <strong>Bremss. yield:</strong> {((result?.bremsstrahlungYield || 0) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ttb" className="mt-0 space-y-3">
              {!result ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Ejecute el calculo para ver la dosis TTB.
                </div>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-3">
                    <div className="text-[12px] font-semibold text-red-800 flex items-center gap-1">
                      <Target className="w-4 h-4" /> Thick Target Bremsstrahlung (TTB)
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="bg-white rounded p-2 border">
                        <div className="text-slate-500">Dosis @ 1 m</div>
                        <div className="text-lg font-bold text-red-600">{result.ttbDoseRate_uSv_h_at_1m.toExponential(2)}</div>
                        <div className="text-[10px] text-slate-400">μSv/h</div>
                      </div>
                      <div className="bg-white rounded p-2 border">
                        <div className="text-slate-500">Dosis en Gy/s</div>
                        <div className="text-lg font-bold text-red-600">{result.ttbDose_Gy_at_1m.toExponential(2)}</div>
                        <div className="text-[10px] text-slate-400">Gy/s @ 1 m</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-red-700 space-y-1">
                      <div><strong>Parametros de entrada:</strong></div>
                      <div>Particula: {particle === 'electron' ? 'e-' : 'e+'} | E = {energy} MeV | I = {current_nA} nA</div>
                      <div>Blanco: {mat?.name} | Espesor: {thickness_mm} mm</div>
                      <Separator className="my-1 bg-red-200" />
                      <div className="text-[10px]">
                        Formula IAEA: Ḋ = Y · I · E / (4πr²) · f(θ) · (μ_en/ρ)_air
                      </div>
                      <div className="text-[10px]">
                        Y = {((result.bremsstrahlungYield) * 100).toFixed(2)}% (radiation yield) | f(θ) = 0.7 (forward cone fraction)
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-[11px] text-amber-800">
                    <strong>Aplicaciones tipicas de TTB:</strong>
                    <ul className="list-disc ml-4 mt-1 space-y-0.5">
                      <li>Aceleradores lineales médicos (6–25 MV): blindaje contra radiacion de frenado</li>
                      <li>Instalaciones de irradiacion industrial (10 MeV e-)</li>
                      <li>Blindajes de bunkers de terapia con electrones de alta energia</li>
                      <li>Proteccion del publico y personal contra componente de fotones del haz de e-</li>
                    </ul>
                  </div>
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
