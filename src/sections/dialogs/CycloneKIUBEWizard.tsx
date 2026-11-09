import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  CYCLOONE_KIUBE_MODELS, CYCLOONE_KIUBE_DOSE_RATES, CYCLOONE_KIUBE_SHIELDING,
  CYCLOONE_KIUBE_NEUTRON, CYCLOONE_KIUBE_VAULT, CYCLOONE_KIUBE_RADIONUCLIDES, getNeutronTVLConcrete_KIUBE,
  calculateNeutronFluence_KIUBE, calculateDecommissioningLayer_KIUBE
} from '@/lib/cycloneKIUBEData';
import {
  Cpu, Atom, Shield, Ruler, Zap, X, Download,
  ChevronRight, ChevronLeft, FileText, Activity,
  Box, Eye
} from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface WizardState {
  step: number;
  model: string;
  beamCurrent_uA: number;
  beamMode: 'single' | 'dual';
  targetIsotope: string;
  concreteThickness_cm: number;
  direction: '0deg' | '90deg' | '180deg';
  yearsOperation: number;
  /** Fase 9: horas de haz por año (antes 4000 h fijas); 0–8760. */
  horasHazAnio: number;
  useLocalShielding: boolean;
  includeDecommissioning: boolean;
  results: CalcResult | null;
}

interface CalcResult {
  model: string;
  doseRateAt1m_uSv_h: number;
  doseRateBehindWall_uSv_h: number;
  neutronFluence_n_per_s: number;
  gammaFluence_g_per_s: number;
  requiredWallThickness_cm: number;
  neutronTVL1_cm: number;
  neutronTVLe_cm: number;
  decommissioningMin_cm: number;
  decommissioningRec_cm: number;
  annualDoseLimit_mSv: number;
  meetsLimit: boolean;
  radionuclidesProduced: string[];
  localShieldingReduction: number;
}

const STEPS = [
  { num: 1, label: 'Modelo', icon: Box },
  { num: 2, label: 'Haz', icon: Zap },
  { num: 3, label: 'Blindaje', icon: Shield },
  { num: 4, label: 'Cálculo', icon: Cpu },
  { num: 5, label: 'Resultados', icon: FileText },
];

// Isodose levels in µSv/h for visualization
const ISODOSE_LEVELS = [1e6, 1e5, 1e4, 1e3, 1e2, 10, 1, 0.1];

function calculateCyclotronShielding(state: WizardState): CalcResult {
  const modelData = CYCLOONE_KIUBE_MODELS.find(m => m.model.includes(state.model.replace('KIUBE ', '')));
  const doseData = CYCLOONE_KIUBE_DOSE_RATES.find(d => d.model === state.model);
  
  if (!modelData || !doseData) {
    return {
      model: state.model, doseRateAt1m_uSv_h: 0, doseRateBehindWall_uSv_h: 0,
      neutronFluence_n_per_s: 0, gammaFluence_g_per_s: 0,
      requiredWallThickness_cm: 220, neutronTVL1_cm: 25, neutronTVLe_cm: 18,
      decommissioningMin_cm: 30, decommissioningRec_cm: 50, annualDoseLimit_mSv: 20,
      meetsLimit: false, radionuclidesProduced: [], localShieldingReduction: 1,
    };
  }

  const initialDose = state.direction === '0deg' ? doseData.at0deg_uSv_h :
                      state.direction === '90deg' ? doseData.at90deg_uSv_h :
                      doseData.at180deg_uSv_h;

  // Find dose rate behind wall of given thickness
  let doseBehindWall = initialDose;
  const shieldingData = CYCLOONE_KIUBE_SHIELDING;
  const doseKey = state.model === 'KIUBE 100' ? 'doseRate_KIUBE100_uSv_h' :
                  state.model === 'KIUBE 150' ? 'doseRate_KIUBE150_uSv_h' :
                  state.model === 'KIUBE 180' ? 'doseRate_KIUBE180_uSv_h' :
                  'doseRate_KIUBE300_uSv_h';

  // Interpolate dose rate for given thickness
  for (let i = 0; i < shieldingData.length - 1; i++) {
    const lower = shieldingData[i] as any;
    const upper = shieldingData[i + 1] as any;
    if (state.concreteThickness_cm >= lower.concreteThickness_cm && 
        state.concreteThickness_cm <= upper.concreteThickness_cm) {
      const ratio = (state.concreteThickness_cm - lower.concreteThickness_cm) / 
                    (upper.concreteThickness_cm - lower.concreteThickness_cm);
      doseBehindWall = lower[doseKey] * Math.pow(upper[doseKey] / lower[doseKey], ratio);
      break;
    }
    if (state.concreteThickness_cm < shieldingData[0].concreteThickness_cm) {
      doseBehindWall = initialDose; // extrapolation needed
    }
  }
  if (state.concreteThickness_cm >= shieldingData[shieldingData.length - 1].concreteThickness_cm) {
    // Extrapolate logarithmically beyond last data point
    const last = shieldingData[shieldingData.length - 1] as any;
    const extraCM = state.concreteThickness_cm - last.concreteThickness_cm;
    const tvl = 22; // cm for gamma in concrete
    doseBehindWall = last[doseKey] * Math.pow(10, -extraCM / tvl);
  }

  // Apply local shielding reduction if enabled (IBA shielded doors)
  const localShieldFactor = state.useLocalShielding ? 0.1 : 1.0;
  doseBehindWall *= localShieldFactor;

  // Neutron fluence
  const fluence = calculateNeutronFluence_KIUBE(state.beamCurrent_uA, state.targetIsotope);
  const gammaFluence_s = fluence.fluence_n_per_s * CYCLOONE_KIUBE_NEUTRON.gammaFluence_g_per_p;

  // TVL data
  const tvlData = getNeutronTVLConcrete_KIUBE();

  // Decommissioning
  const decomm = calculateDecommissioningLayer_KIUBE(state.yearsOperation, state.beamCurrent_uA);

  // Dosis anual tras el muro con las horas de haz por año que captura el usuario (Fase 9: antes 4000 h fijas).
  const horas = Math.min(Math.max(Number.isFinite(state.horasHazAnio) ? state.horasHazAnio : 4000, 0), 8760);
  const annualDose = (doseBehindWall * horas) / 1000; // μSv/h × h/año → mSv/año
  const meetsLimit = annualDose <= 20; // Mexican POE limit

  // Radionuclides
  const radionuclides = CYCLOONE_KIUBE_RADIONUCLIDES
    .filter(r => r.standardProduction || state.targetIsotope === r.isotope)
    .map(r => r.isotope);

  return {
    model: state.model,
    doseRateAt1m_uSv_h: initialDose,
    doseRateBehindWall_uSv_h: doseBehindWall,
    neutronFluence_n_per_s: fluence.fluence_n_per_s,
    gammaFluence_g_per_s: gammaFluence_s,
    requiredWallThickness_cm: state.concreteThickness_cm,
    neutronTVL1_cm: tvlData.TVL1_cm,
    neutronTVLe_cm: tvlData.TVLe_cm,
    decommissioningMin_cm: decomm.minThickness_cm,
    decommissioningRec_cm: decomm.recommendedThickness_cm,
    annualDoseLimit_mSv: annualDose,
    meetsLimit,
    radionuclidesProduced: radionuclides,
    localShieldingReduction: localShieldFactor,
  };
}

// 3D Dose Visualization Component
function DoseVisualization3D({ result, direction }: { result: CalcResult; direction: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw vault cross-section
    const vaultW = 400;
    const vaultH = 300;
    const offsetX = (w - vaultW) / 2;
    const offsetY = (h - vaultH) / 2;

    // Vault walls
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(offsetX, offsetY, vaultW, vaultH);
    
    // Concrete wall (right side = target direction)
    const wallThick = result.requiredWallThickness_cm / 10; // scale down
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(offsetX + vaultW - wallThick, offsetY, wallThick, vaultH);

    // Cyclotron (center)
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(offsetX + vaultW / 2, offsetY + vaultH / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cyclotron', offsetX + vaultW / 2, offsetY + vaultH / 2 + 4);

    // Target direction arrow
    const angle = direction === '0deg' ? 0 : direction === '90deg' ? Math.PI / 2 : Math.PI;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(offsetX + vaultW / 2, offsetY + vaultH / 2);
    ctx.lineTo(
      offsetX + vaultW / 2 + Math.cos(angle) * 80,
      offsetY + vaultH / 2 + Math.sin(angle) * 80
    );
    ctx.stroke();

    // Isodose curves (simplified as concentric arcs)
    const centerX = offsetX + vaultW / 2;
    const centerY = offsetY + vaultH / 2;
    const maxRadius = Math.min(vaultW, vaultH) / 2;

    ISODOSE_LEVELS.forEach((level, i) => {
      const ratio = level / result.doseRateAt1m_uSv_h;
      if (ratio > 0 && ratio <= 1) {
        const radius = maxRadius * (1 - Math.log10(ratio) / 8);
        if (radius > 0 && radius < maxRadius) {
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + (1 - i / ISODOSE_LEVELS.length) * 0.7})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Label
          ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + (1 - i / ISODOSE_LEVELS.length) * 0.5})`;
          ctx.font = '8px sans-serif';
          ctx.fillText(
            level >= 1e6 ? `${(level / 1e6).toFixed(0)}M` : 
            level >= 1e3 ? `${(level / 1e3).toFixed(0)}k` : 
            level >= 1 ? `${level.toFixed(0)}` : `${(level * 1000).toFixed(0)}m`,
            centerX + radius * Math.cos(0.3),
            centerY + radius * Math.sin(0.3)
          );
        }
      }
    });

    // Dose rate behind wall
    ctx.fillStyle = result.meetsLimit ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Dosis tras muro: ${result.doseRateBehindWall_uSv_h.toExponential(2)} µSv/h`,
      offsetX + vaultW + 10,
      offsetY + vaultH / 2
    );
    ctx.fillText(
      `Dosis anual: ${result.annualDoseLimit_mSv.toFixed(2)} mSv/año`,
      offsetX + vaultW + 10,
      offsetY + vaultH / 2 + 20
    );
    ctx.fillText(
      result.meetsLimit ? '✓ Cumple límite (20 mSv/año)' : '✗ Excede límite',
      offsetX + vaultW + 10,
      offsetY + vaultH / 2 + 40
    );

    // Legend
    ctx.fillStyle = '#000';
    ctx.font = '9px sans-serif';
    ctx.fillText('Curvas isodosis (µSv/h):', 10, h - 60);
    ISODOSE_LEVELS.slice(0, 4).forEach((level, i) => {
      ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + i * 0.15})`;
      ctx.fillRect(10, h - 50 + i * 12, 8, 8);
      ctx.fillStyle = '#000';
      ctx.fillText(
        level >= 1e6 ? `${(level / 1e6).toFixed(0)}M µSv/h` :
        level >= 1e3 ? `${(level / 1e3).toFixed(0)}k µSv/h` :
        `${level.toFixed(0)} µSv/h`,
        22, h - 42 + i * 12
      );
    });
  }, [result, direction]);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="text-xs font-medium p-2 bg-slate-100 border-b">Visualización 3D — Curvas Isodosis</div>
      <canvas ref={canvasRef} width={700} height={350} className="w-full" />
    </div>
  );
}

// Heat Map Component
function HeatMapVisualization({ result }: { result: CalcResult }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);

    // Generate heat map based on inverse square law + attenuation
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - w / 2;
        const dy = y - h / 2;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        
        // Simplified dose field: 1/r² falloff with wall attenuation on right side
        let dose = result.doseRateAt1m_uSv_h / (dist * dist / 100);
        if (x > w * 0.7) {
          const wallDist = (x - w * 0.7) / (w * 0.3);
          dose *= Math.exp(-wallDist * result.requiredWallThickness_cm / 50);
        }
        
        // Color mapping (log scale)
        const logDose = Math.log10(Math.max(dose, 0.001));
        const normalized = Math.max(0, Math.min(1, (logDose + 3) / 8));
        
        const idx = (y * w + x) * 4;
        // Heat color scale: black → blue → green → yellow → red → white
        if (normalized < 0.2) {
          imgData.data[idx] = 0;
          imgData.data[idx + 1] = 0;
          imgData.data[idx + 2] = normalized * 5 * 255;
        } else if (normalized < 0.4) {
          imgData.data[idx] = 0;
          imgData.data[idx + 1] = (normalized - 0.2) * 5 * 255;
          imgData.data[idx + 2] = 255;
        } else if (normalized < 0.6) {
          imgData.data[idx] = (normalized - 0.4) * 5 * 255;
          imgData.data[idx + 1] = 255;
          imgData.data[idx + 2] = (0.6 - normalized) * 5 * 255;
        } else if (normalized < 0.8) {
          imgData.data[idx] = 255;
          imgData.data[idx + 1] = (0.8 - normalized) * 5 * 255;
          imgData.data[idx + 2] = 0;
        } else {
          imgData.data[idx] = 255;
          imgData.data[idx + 1] = (normalized - 0.8) * 5 * 255;
          imgData.data[idx + 2] = (normalized - 0.8) * 5 * 255;
        }
        imgData.data[idx + 3] = 200; // alpha
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Legend
    ctx.fillStyle = '#000';
    ctx.font = '10px sans-serif';
    ctx.fillText('Heat Map — Dosis (µSv/h, escala log):', 10, 15);
    
    const legendColors = [
      { label: '>1M', color: 'rgb(255,255,255)' },
      { label: '100k', color: 'rgb(255,0,0)' },
      { label: '10k', color: 'rgb(255,255,0)' },
      { label: '1k', color: 'rgb(0,255,0)' },
      { label: '100', color: 'rgb(0,255,255)' },
      { label: '10', color: 'rgb(0,0,255)' },
      { label: '<1', color: 'rgb(0,0,0)' },
    ];
    legendColors.forEach((lc, i) => {
      ctx.fillStyle = lc.color;
      ctx.fillRect(w - 80, 30 + i * 18, 12, 12);
      ctx.fillStyle = '#000';
      ctx.fillText(lc.label, w - 60, 40 + i * 18);
    });
  }, [result]);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="text-xs font-medium p-2 bg-slate-100 border-b">Heat Map — Distribución de Dosis 2D</div>
      <canvas ref={canvasRef} width={400} height={300} className="w-full" />
    </div>
  );
}

export default function CycloneKIUBEWizard({ open, onOpenChange }: Props) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    model: 'KIUBE 180',
    beamCurrent_uA: 180,
    beamMode: 'dual',
    targetIsotope: '18F',
    concreteThickness_cm: 220,
    direction: '0deg',
    yearsOperation: 10,
    horasHazAnio: 4000,
    useLocalShielding: false,
    includeDecommissioning: true,
    results: null,
  });

  const update = (partial: Partial<WizardState>) => setState(s => ({ ...s, ...partial }));

  const handleCalculate = () => {
    const results = calculateCyclotronShielding(state);
    update({ results, step: 5 });
  };

  const handleExport = () => {
    if (!state.results) return;
    const lines = [
      '═══════════════════════════════════════════════════════════════════',
      '  RADSHIELD MX v14.1 — CÁLCULO DE BLINDAJE CICLOTRÓN IBA KIUBE',
      '  Basado en: MID 55672 Rev G — Site Requirement Guide',
      '═══════════════════════════════════════════════════════════════════',
      `Modelo: ${state.results.model}`,
      `Corriente de haz: ${state.beamCurrent_uA} µA (${state.beamMode})`,
      `Isótopo objetivo: ${state.targetIsotope}`,
      `Espesor de concreto: ${state.concreteThickness_cm} cm (densidad 2350 kg/m³)`,
      `Dirección: ${state.direction}`,
      `Blindaje local IBA: ${state.useLocalShielding ? 'Sí (factor 0.1)' : 'No'}`,
      '───────────────────────────────────────────────────────────────────',
      'RESULTADOS:',
      `Dosis a 1m (dentro de bóveda): ${state.results.doseRateAt1m_uSv_h.toExponential(2)} µSv/h`,
      `Dosis tras muro: ${state.results.doseRateBehindWall_uSv_h.toExponential(2)} µSv/h`,
      `Fluencia de neutrones: ${state.results.neutronFluence_n_per_s.toExponential(2)} n/s`,
      `Fluencia de gamma: ${state.results.gammaFluence_g_per_s.toExponential(2)} γ/s`,
      `TVL neutrones: ${state.results.neutronTVL1_cm} cm (1ª) / ${state.results.neutronTVLe_cm} cm (eq.)`,
      `Dosis anual estimada: ${state.results.annualDoseLimit_mSv.toFixed(3)} mSv/año`,
      `Cumple límite POE (20 mSv/año): ${state.results.meetsLimit ? 'SÍ' : 'NO'}`,
      `Capa desmantelamiento mín: ${state.results.decommissioningMin_cm} cm`,
      `Capa desmantelamiento rec: ${state.results.decommissioningRec_cm} cm`,
      `Radionúclidos producidos: ${state.results.radionuclidesProduced.join(', ')}`,
      '───────────────────────────────────────────────────────────────────',
      'DATOS DEL FABRICANTE (IBA):',
      `Energía de protones: 18 MeV`,
      `Fluencia n/p: ${CYCLOONE_KIUBE_NEUTRON.fluence_n_per_p}`,
      `Energía máxima neutrones: ${CYCLOONE_KIUBE_NEUTRON.maxNeutronEnergy_MeV} MeV (pico ~${CYCLOONE_KIUBE_NEUTRON.neutronEnergyPeak_MeV} MeV)`,
      '───────────────────────────────────────────────────────────────────',
      'REFERENCIAS:',
      '• IBA Cyclone KIUBE Site Requirement Guide — MID 55672 Rev G (2023)',
      '• NCRP 144 — Radiation Protection for Particle Accelerator Facilities',
      '• IAEA SRS 44 — Radiation Safety of Accelerator Facilities',
      '• NOM-008-NUCL-2018 — Límites de dosis en México',
      '═══════════════════════════════════════════════════════════════════',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Blindaje_KIUBE_${state.model}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold">Wizard Ciclotrón IBA KIUBE — RadSHIELD Mx</h2>
          <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-300">v14.1</Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>IBA MID 55672 Rev G | NCRP 144 | IAEA SRS 44</span>
          <Button aria-label="Cerrar Cyclone KIUBE Wizard" size="sm" variant="ghost" className="text-white hover:bg-slate-700" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b">
        {STEPS.map(s => {
          const Icon = s.icon;
          const isActive = state.step === s.num;
          const isDone = state.step > s.num;
          return (
            <div key={s.num} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-amber-600 text-white' : isDone ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <Icon className="w-3 h-3" />
              <span>{s.num}. {s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-5xl mx-auto">
          {/* ═══ STEP 1: MODELO ═══ */}
          {state.step === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Box className="w-4 h-4 text-amber-600" />
                    Seleccione modelo IBA Cyclone KIUBE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {CYCLOONE_KIUBE_MODELS.map(m => (
                      <Button
                        key={m.model}
                        variant={state.model === m.model.replace('Cyclone ', '') ? 'default' : 'outline'}
                        className={`h-auto py-3 flex flex-col items-center ${state.model === m.model.replace('Cyclone ', '') ? 'bg-amber-600' : ''}`}
                        onClick={() => update({ 
                          model: m.model.replace('Cyclone ', ''),
                          beamCurrent_uA: m.maxBeamCurrent_uA,
                          beamMode: m.maxBeamCurrent_dual_uA ? 'dual' : 'single'
                        })}
                      >
                        <span className="text-lg">⚛️</span>
                        <span className="text-xs font-medium">{m.model}</span>
                        <span className="text-[10px] opacity-80">{m.protonEnergy_MeV} MeV / {m.maxBeamCurrent_uA} µA</span>
                      </Button>
                    ))}
                  </div>
                  {state.model && (
                    <div className="p-3 bg-amber-50 rounded-lg text-xs space-y-1">
                      <div className="font-medium text-amber-800">Datos del equipo seleccionado:</div>
                      {(() => {
                        const m = CYCLOONE_KIUBE_MODELS.find(x => x.model.includes(state.model.replace('KIUBE ', '')));
                        if (!m) return null;
                        return (
                          <>
                            <div>• Peso: {m.weight_kg.toLocaleString()} kg en 4 pilares ({m.pillarFootprint_mm.width}x{m.pillarFootprint_mm.depth} mm)</div>
                            <div>• Dimensiones: {m.dimensions_mm.width}x{m.dimensions_mm.depth}x{m.dimensions_mm.height} mm</div>
                            <div>• Carga en piso: {m.weightOnFloor_kg_cm2} kg/cm²</div>
                            <div>• Energía: {m.protonEnergy_MeV} MeV | Corriente: {m.maxBeamCurrent_uA} µA</div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ STEP 2: HAZ ═══ */}
          {state.step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Configuración del Haz y Objetivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Corriente de haz (µA)</Label>
                      <Input type="number" value={state.beamCurrent_uA} onChange={e => update({ beamCurrent_uA: parseInt(e.target.value) || 100 })} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs">Modo de haz</Label>
                      <RadioGroup value={state.beamMode} onValueChange={v => update({ beamMode: v as any })} className="flex gap-2 mt-1">
                        <div className="flex items-center gap-1"><RadioGroupItem value="single" id="single" /><Label htmlFor="single" className="text-xs">Single beam</Label></div>
                        <div className="flex items-center gap-1"><RadioGroupItem value="dual" id="dual" /><Label htmlFor="dual" className="text-xs">Dual beam</Label></div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label className="text-xs">Isótopo objetivo</Label>
                      <Select value={state.targetIsotope} onValueChange={v => update({ targetIsotope: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CYCLOONE_KIUBE_RADIONUCLIDES.map(r => (
                            <SelectItem key={r.isotope} value={r.isotope}>{r.isotope} ({r.targetType}) {r.standardProduction ? '— Estándar' : '— Opcional'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Años de operación</Label>
                      <Input type="number" value={state.yearsOperation} onChange={e => update({ yearsOperation: parseInt(e.target.value) || 10 })} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs" htmlFor="kiube-horas">Horas de haz por año (0–8760)</Label>
                      <Input id="kiube-horas" type="number" min={0} max={8760} value={state.horasHazAnio} onChange={e => update({ horasHazAnio: Math.min(Math.max(Number(e.target.value) || 0, 0), 8760) })} className="h-8" />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg text-xs space-y-1">
                    <div className="font-medium text-amber-800">Datos de neutrones (IBA MID 55672):</div>
                    <div>• Reacción: {CYCLOONE_KIUBE_NEUTRON.reaction}</div>
                    <div>• Energía máxima neutrones: {CYCLOONE_KIUBE_NEUTRON.maxNeutronEnergy_MeV} MeV (pico ~{CYCLOONE_KIUBE_NEUTRON.neutronEnergyPeak_MeV} MeV)</div>
                    <div>• Fluencia: {CYCLOONE_KIUBE_NEUTRON.fluence_n_per_p} n/p</div>
                    <div>• Fluencia a {state.beamCurrent_uA} µA: {calculateNeutronFluence_KIUBE(state.beamCurrent_uA, state.targetIsotope).fluence_n_per_s.toExponential(2)} n/s</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ STEP 3: BLINDAJE ═══ */}
          {state.step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    Configuración de Blindaje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Espesor concreto (cm)</Label>
                      <Select value={state.concreteThickness_cm.toString()} onValueChange={v => update({ concreteThickness_cm: parseInt(v) })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="200">200 cm (mínimo EU)</SelectItem>
                          <SelectItem value="220">220 cm (recomendado)</SelectItem>
                          <SelectItem value="230">230 cm (optimizado)</SelectItem>
                          <SelectItem value="240">240 cm (máximo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Dirección de evaluación</Label>
                      <Select value={state.direction} onValueChange={v => update({ direction: v as any })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0deg">0° — Frente al target</SelectItem>
                          <SelectItem value="90deg">90° — Pared perpendicular</SelectItem>
                          <SelectItem value="180deg">180° — Pared opuesta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="localShield" checked={state.useLocalShielding} onChange={e => update({ useLocalShielding: e.target.checked })} />
                      <Label htmlFor="localShield" className="text-xs">Blindaje local IBA (puertas blindadas en ports) — reduce 10x</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="decomm" checked={state.includeDecommissioning} onChange={e => update({ includeDecommissioning: e.target.checked })} />
                      <Label htmlFor="decomm" className="text-xs">Incluir capa de desmantelamiento</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs space-y-1">
                    <div className="font-medium">Requisitos de bóveda (IBA MID 55672):</div>
                    <div>• Dimensiones mínimas: {CYCLOONE_KIUBE_VAULT.internalDimensions_min_mm.length}x{CYCLOONE_KIUBE_VAULT.internalDimensions_min_mm.width} mm</div>
                    <div>• Dimensiones recomendadas: {CYCLOONE_KIUBE_VAULT.internalDimensions_rec_mm.length}x{CYCLOONE_KIUBE_VAULT.internalDimensions_rec_mm.width} mm</div>
                    <div>• Altura: {CYCLOONE_KIUBE_VAULT.height_mm} mm</div>
                    <div>• Densidad concreto: {CYCLOONE_KIUBE_VAULT.concreteDensity_kg_m3} kg/m³ (mínimo)</div>
                    <div>• Puerta mínima: {CYCLOONE_KIUBE_VAULT.doorMinWidth_mm}x{CYCLOONE_KIUBE_VAULT.doorMinHeight_mm} mm</div>
                    <div>• Foso: {CYCLOONE_KIUBE_VAULT.pitDepth_mm} mm profundidad</div>
                    <div>• Tolerancia nivel piso: ±{CYCLOONE_KIUBE_VAULT.floorLevelTolerance_mm} mm</div>
                  </div>

                  <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded">
                    <strong>Nota IBA:</strong> El blindaje interno de concreto se activará por neutrones. 
                    Se recomienda construir una primera capa independiente (desmantelamiento) sin barras de acero rectas 
                    (evitan canales de neutrones). IBA proporciona simulación Monte Carlo estándar o personalizada bajo pedido.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ STEP 4: CÁLCULO ═══ */}
          {state.step === 4 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-600" />
                    Confirmar Cálculo de Blindaje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 bg-slate-50 rounded"><strong>Modelo:</strong> {state.model}</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Haz:</strong> {state.beamCurrent_uA} µA ({state.beamMode})</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Isótopo:</strong> {state.targetIsotope}</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Concreto:</strong> {state.concreteThickness_cm} cm (2350 kg/m³)</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Dirección:</strong> {state.direction}</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Años:</strong> {state.yearsOperation}</div>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] space-y-1">
                    <div className="font-medium text-indigo-800">Metodología aplicada:</div>
                    <div>• NCRP 144 — Particle Accelerator Shielding</div>
                    <div>• IBA MID 55672 Rev G — Dose rate tables at 1m and behind concrete walls</div>
                    <div>• Interpolación log-lineal para espesores intermedios</div>
                    <div>• Factor de atenuación por blindaje local IBA (opcional, 0.1x)</div>
                    <div>• Cálculo de capa de desmantelamiento basado en años de operación</div>
                  </div>

                  <Button onClick={handleCalculate} className="w-full bg-amber-600 hover:bg-amber-700">
                    <Cpu className="w-4 h-4 mr-2" /> Ejecutar Cálculo
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ STEP 5: RESULTADOS ═══ */}
          {state.step === 5 && state.results && (
            <div className="space-y-4">
              <Tabs defaultValue="results">
                <TabsList>
                  <TabsTrigger value="results"><FileText className="w-3 h-3 mr-1" />Resultados</TabsTrigger>
                  <TabsTrigger value="3d"><Eye className="w-3 h-3 mr-1" />3D Isodosis</TabsTrigger>
                  <TabsTrigger value="heatmap"><Activity className="w-3 h-3 mr-1" />Heat Map</TabsTrigger>
                  <TabsTrigger value="vault"><Ruler className="w-3 h-3 mr-1" />Bóveda</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Card className={state.results.meetsLimit ? 'border-green-400' : 'border-red-400'}>
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold">{state.results.doseRateBehindWall_uSv_h.toExponential(1)}</div>
                        <div className="text-xs text-slate-500">µSv/h tras muro</div>
                      </CardContent>
                    </Card>
                    <Card className={state.results.meetsLimit ? 'border-green-400' : 'border-red-400'}>
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold">{state.results.annualDoseLimit_mSv.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">mSv/año</div>
                      </CardContent>
                    </Card>
                    <Card className={state.results.meetsLimit ? 'bg-green-50' : 'bg-red-50'}>
                      <CardContent className="p-3 text-center">
                        <div className={`text-lg font-bold ${state.results.meetsLimit ? 'text-green-700' : 'text-red-700'}`}>
                          {state.results.meetsLimit ? '✓ CUMPLE' : '✗ EXCEDE'}
                        </div>
                        <div className="text-xs text-slate-500">Límite POE: 20 mSv/año</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="p-3 space-y-2 text-xs">
                      <div className="font-medium">Detalles del cálculo:</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>Dosis a 1m (bóveda): <strong>{state.results.doseRateAt1m_uSv_h.toExponential(2)} µSv/h</strong></div>
                        <div>Fluencia neutrones: <strong>{state.results.neutronFluence_n_per_s.toExponential(2)} n/s</strong></div>
                        <div>Fluencia gamma: <strong>{state.results.gammaFluence_g_per_s.toExponential(2)} γ/s</strong></div>
                        <div>TVL neutrones: <strong>{state.results.neutronTVL1_cm} cm / {state.results.neutronTVLe_cm} cm</strong></div>
                        <div>Capa desmantelamiento mín: <strong>{state.results.decommissioningMin_cm} cm</strong></div>
                        <div>Capa desmantelamiento rec: <strong>{state.results.decommissioningRec_cm} cm</strong></div>
                        <div>Radionúclidos: <strong>{state.results.radionuclidesProduced.join(', ')}</strong></div>
                        <div>Reducción blindaje local: <strong>{state.results.localShieldingReduction === 0.1 ? '10x (puertas IBA)' : 'Ninguna'}</strong></div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleExport}>
                      <Download className="w-3 h-3 mr-1" /> Exportar .txt
                    </Button>
                    <Badge variant="outline" className="text-[10px]">IBA MID 55672 Rev G</Badge>
                    <Badge variant="outline" className="text-[10px]">NCRP 144</Badge>
                    <Badge variant="outline" className="text-[10px]">IAEA SRS 44</Badge>
                  </div>
                </TabsContent>

                <TabsContent value="3d">
                  <DoseVisualization3D result={state.results} direction={state.direction} />
                </TabsContent>

                <TabsContent value="heatmap">
                  <HeatMapVisualization result={state.results} />
                </TabsContent>

                <TabsContent value="vault">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Requisitos de Bóveda — IBA KIUBE</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-50 rounded"><strong>Dimensiones mín:</strong> {CYCLOONE_KIUBE_VAULT.internalDimensions_min_mm.length/1000}x{CYCLOONE_KIUBE_VAULT.internalDimensions_min_mm.width/1000} m</div>
                        <div className="p-2 bg-slate-50 rounded"><strong>Dimensiones rec:</strong> {CYCLOONE_KIUBE_VAULT.internalDimensions_rec_mm.length/1000}x{CYCLOONE_KIUBE_VAULT.internalDimensions_rec_mm.width/1000} m</div>
                        <div className="p-2 bg-slate-50 rounded"><strong>Altura:</strong> {CYCLOONE_KIUBE_VAULT.height_mm/1000} m</div>
                        <div className="p-2 bg-slate-50 rounded"><strong>Muros totales:</strong> {CYCLOONE_KIUBE_VAULT.wallThicknessTotal_mm/1000}-{CYCLOONE_KIUBE_VAULT.wallThicknessTotal_mm/1000 + 0.2} m</div>
                        <div className="p-2 bg-slate-50 rounded"><strong>Techo:</strong> {CYCLOONE_KIUBE_VAULT.roofThickness_mm/1000}-{CYCLOONE_KIUBE_VAULT.roofThickness_mm/1000 + 0.3} m</div>
                        <div className="p-2 bg-slate-50 rounded"><strong>Densidad:</strong> {CYCLOONE_KIUBE_VAULT.concreteDensity_kg_m3} kg/m³</div>
                        <div className="p-2 bg-slate-50 rounded"><strong>Foso:</strong> {CYCLOONE_KIUBE_VAULT.pitDepth_mm} mm prof.</div>
                        <div className="p-2 bg-slate-50 rounded"><strong>Puerta mín:</strong> {CYCLOONE_KIUBE_VAULT.doorMinWidth_mm}x{CYCLOONE_KIUBE_VAULT.doorMinHeight_mm} mm</div>
                      </div>
                      <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded mt-2">
                        <strong>Notas IBA sobre construcción:</strong>
                        <div>• Evitar capas horizontales planas sucesivas (fugas de neutrones)</div>
                        <div>• Usar trozos de madera entre vaciados para crear escalones</div>
                        <div>• Evitar barras de acero rectas de adentro hacia afuera (canales de neutrones)</div>
                        <div>• Primera capa (desmantelamiento): sin función estructural, sin hierro o fibras de vidrio</div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t">
        <Button size="sm" variant="outline" onClick={() => update({ step: Math.max(1, state.step - 1) })} disabled={state.step === 1}>
          <ChevronLeft className="w-3 h-3 mr-1" /> Anterior
        </Button>
        <span className="text-xs text-slate-500">Paso {state.step} de 5</span>
        <Button
          size="sm"
          variant={state.step === 5 ? 'outline' : 'default'}
          onClick={() => {
            if (state.step < 4) update({ step: state.step + 1 });
            else if (state.step === 4) handleCalculate();
          }}
          disabled={state.step === 5 || (state.step === 1 && !state.model)}
        >
          {state.step === 4 ? <><Cpu className="w-3 h-3 mr-1" /> Calcular</> : <><ChevronRight className="w-3 h-3 mr-1" /> Siguiente</>}
        </Button>
      </div>
    </div>
  );
}
