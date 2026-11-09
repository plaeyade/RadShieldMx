import { rutaPublica } from '@/lib/rutaPublica';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  COMMERCIAL_EQUIPMENT, getEquipmentsByCategory, getAllCategories, 
  type CommercialEquipment
} from '@/types/equipmentDB';
import { MATERIALS_DB } from '@/lib/materialDatabase';
import { blindajeEquipo } from '@/lib/blindajeEquipo';
import {
  Wand2, ChevronRight, ChevronLeft, Download, Calculator, Ruler,
  Shield, FileText, Crosshair,
  Activity, X, DollarSign
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// v14.0: Equipment Shielding Wizard — Per-equipment intuitive calculation
// Integrates: PMC9084580, PMC5722598, PMC12059296, IAEA MCNPX, AAPM TG-108
// ═══════════════════════════════════════════════════════════════════════════════

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface WizardState {
  step: number;
  category: string;
  equipment: CommercialEquipment | null;
  energy_MeV: number;
  technique: string;
  workload_Gy_week: number;
  useFactor: number;
  occupancyFactor: number;
  prefactor_P: number;
  distance_m: number;
  materialId: string;
  tvl_primary_cm: number | null;
  tvl_secondary_cm: number | null;
  results: CalcResult[] | null;
}

interface CalcResult {
  barrier: string;
  type: 'primary' | 'secondary' | 'leakage' | 'scatter';
  thickness_cm: number;
  thickness_mm: number;
  transmission: number;
  dose_mSv_week: number;
  meetsLimit: boolean;
}

// C1 factors per technique (NCRP 151 §4.8.5, PMC9084580 validated)
const TECHNIQUE_C1: Record<string, { label: string; C1: number; description: string }> = {
  '3d-crt': { label: '3D-CRT', C1: 1.0, description: 'Radioterapia conformada 3D — Carga de trabajo base' },
  imrt: { label: 'IMRT', C1: 2.5, description: 'Radioterapia de intensidad modulada — Factor 2.5x (NCRP 151)' },
  vmat: { label: 'VMAT', C1: 4.0, description: 'Arcoterapia volumétrica — Factor 4.0x (Validado UAQ, PMC9084580)' },
  sbrt: { label: 'SBRT/SABR', C1: 5.0, description: 'Radiocirugía corporal — Factor 5.0x' },
  srs: { label: 'SRS', C1: 8.0, description: 'Radiocirugía estereotáctica — Factor 8.0x' },
};

// Use factors per barrier direction (NCRP 151)
const _USE_FACTORS = {
  floor: 0.25, ceiling: 0.25, wall_gantry: 0.25, wall_lateral: 0.25,
  wall_primary: 0.25, maze: 0.05, door: 0.05,
};

// Occupancy factors (NCRP 151 Table B.2)
const OCCUPANCY_FACTORS = [
  { value: 1, label: 'Control, oficina, laboratorio' },
  { value: 0.5, label: 'Sala de espera, pasillo' },
  { value: 0.2, label: 'Baño, consultorio' },
  { value: 0.125, label: 'Pasillo de pacientes' },
  { value: 0.0625, label: 'Sótano, estacionamiento' },
  { value: 0.025, label: 'Área pública exterior' },
];

// Site planning images by equipment model
const SITE_PLAN_IMAGES: Record<string, string> = {
  'TrueBeam': rutaPublica('installation-guides/8_Room_Dimensions_Requirements_to_Install.png'),
  'TrueBeam STx': rutaPublica('installation-guides/8_Room_Dimensions_Requirements_to_Install.png'),
  'Halcyon': rutaPublica('installation-guides/8_Room_Dimensions_Requirements_to_Install.png'),
  'Edge': rutaPublica('installation-guides/8_Room_Dimensions_Requirements_to_Install.png'),
  'VitalBeam': rutaPublica('installation-guides/8_Room_Dimensions_Requirements_to_Install.png'),
  'Versa HD': rutaPublica('installation-guides/6_Room_Dimensions_Requirements_to_Install.png'),
  'Infinity': rutaPublica('installation-guides/6_Room_Dimensions_Requirements_to_Install.png'),
  'Unity MR-Linac': rutaPublica('installation-guides/6_Room_Dimensions_Requirements_to_Install.png'),
  'Leksell Gamma Knife Icon': rutaPublica('installation-guides/9_Room_Dimensions_Requirements_to_Install.png'),
  'Leksell Gamma Knife Esprit': rutaPublica('installation-guides/9_Room_Dimensions_Requirements_to_Install.png'),
  'SOMATOM Force': rutaPublica('installation-guides/7_SPECT_CT_Imaging_Room_AUSHFG_202.png'),
  'SOMATOM X.ceed': rutaPublica('installation-guides/7_SPECT_CT_Imaging_Room_AUSHFG_202.png'),
};

const STEPS = [
  { num: 1, label: 'Equipo', icon: Crosshair },
  { num: 2, label: 'Instalación', icon: Ruler },
  { num: 3, label: 'Parámetros', icon: Activity },
  { num: 4, label: 'Cálculo', icon: Calculator },
  { num: 5, label: 'Resultados', icon: FileText },
];

// Fase 8a: el cálculo vive en `lib/blindajeEquipo` (NCRP 151 con `barreraMV`); ver su cabecera.
function calculateShielding(state: WizardState): CalcResult[] {
  if (!state.equipment) return [];
  return blindajeEquipo({
    categoria: state.equipment.category, energia_MeV: Number(state.energy_MeV), C1: TECHNIQUE_C1[state.technique]?.C1 || 1.0,
    W_Gy_semana: state.workload_Gy_week, U: state.useFactor, T: state.occupancyFactor, P_mSv_semana: state.prefactor_P,
    d_m: state.distance_m, materialId: state.materialId,
  });
}

export default function EquipmentShieldingWizard({ open, onOpenChange }: Props) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    category: '',
    equipment: null,
    energy_MeV: 6,
    technique: '3d-crt',
    workload_Gy_week: 400,
    useFactor: 0.25,
    occupancyFactor: 0.2,
    prefactor_P: 0.02,
    distance_m: 4,
    materialId: 'concrete-normal-235',
    tvl_primary_cm: 37,
    tvl_secondary_cm: 33,
    results: null,
  });

  const update = (partial: Partial<WizardState>) => setState(s => ({ ...s, ...partial }));

  const categories = getAllCategories();
  const equipments = state.category ? getEquipmentsByCategory(state.category as any) : [];

  const handleEquipmentSelect = (eqId: string) => {
    const eq = COMMERCIAL_EQUIPMENT.find(e => e.id === eqId) || null;
    if (eq) {
      update({
        equipment: eq,
        workload_Gy_week: eq.workload_Gy_week || 400,
      });
    }
  };

  const handleCalculate = () => {
    const results = calculateShielding(state);
    update({ results, step: 5 });
  };

  const handleExport = () => {
    if (!state.results) return;
    const lines = [
      '═══════════════════════════════════════════════════════════════════',
      '  RADSHIELD MX v14.0 — REPORTE DE CÁLCULO DE BLINDAJE',
      '═══════════════════════════════════════════════════════════════════',
      `Equipo: ${state.equipment?.manufacturer} ${state.equipment?.model}`,
      `Categoría: ${state.equipment?.category}`,
      `Energía: ${state.equipment?.energy_MeV_or_kVp}`,
      `Técnica: ${TECHNIQUE_C1[state.technique]?.label} (C₁ = ${TECHNIQUE_C1[state.technique]?.C1})`,
      `Carga de trabajo: ${state.workload_Gy_week} Gy/semana`,
      `Carga modificada (W×C₁): ${(state.workload_Gy_week * (TECHNIQUE_C1[state.technique]?.C1 || 1)).toFixed(0)} Gy/semana eq.`,
      `Factor de uso (U): ${state.useFactor}`,
      `Factor de ocupación (T): ${state.occupancyFactor}`,
      `Objetivo de diseño (P): ${state.prefactor_P} mSv/semana`,
      `Distancia: ${state.distance_m} m`,
      `Material: ${MATERIALS_DB.find(m => m.id === state.materialId)?.name}`,
      '───────────────────────────────────────────────────────────────────',
      'RESULTADOS:',
      ...state.results.map(r =>
        `${r.barrier}: ${r.thickness_cm.toFixed(1)} cm (${r.thickness_mm.toFixed(0)} mm) | ` +
        `Transmisión: ${r.transmission.toExponential(2)} | Dosis: ${r.dose_mSv_week.toFixed(4)} mSv/sem`
      ),
      '───────────────────────────────────────────────────────────────────',
      'METODOLOGÍA:',
      `• NCRP 151 (2005) — Equations 4.1, 4.4, 4.5`,
      `• PMC9084580 — Validación Monte Carlo EGSnrc para blindaje radioterapia`,
      `• UAQ IGLIN-280880 — González Aguilar (2023) — Factor VMAT validado`,
      `• Carga de trabajo modificada: W_L = W × C₁ (NCRP 151 §4.8.5)`,
      `• Material seleccionado: ${MATERIALS_DB.find(m => m.id === state.materialId)?.name}`,
      '═══════════════════════════════════════════════════════════════════',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Blindaje_${state.equipment?.model?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold">Wizard de Blindaje por Equipo — RadSHIELD Mx</h2>
          <Badge variant="outline" className="text-[10px] border-indigo-400 text-indigo-300">v14.0</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>NCRP 151 • PMC9084580 • PMC5722598 • PMC12059296 • AAPM TG-108</span>
          <Button
            aria-label="Cerrar Equipment Wizard"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-slate-700"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = state.step === s.num;
          const isDone = state.step > s.num;
          return (
            <div key={s.num} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-indigo-600 text-white' : isDone ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <Icon className="w-3 h-3" />
              <span>{s.num}. {s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* ═══ STEP 1: EQUIPO ═══ */}
        {state.step === 1 && (
          <div className="max-w-5xl mx-auto space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-indigo-600" />
                  Seleccione el tipo de equipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {categories.map(cat => (
                    <Button
                      key={cat.id}
                      variant={state.category === cat.id ? 'default' : 'outline'}
                      className={`h-auto py-3 flex flex-col items-center gap-1 ${state.category === cat.id ? 'bg-indigo-600' : ''}`}
                      onClick={() => update({ category: cat.id, equipment: null })}
                    >
                      <span className="text-lg">{cat.id === 'LINAC' ? '⚡' : cat.id === 'CT' ? '🖥️' : cat.id === 'PET-CT' ? '🔬' : cat.id === 'GammaKnife' ? '🧠' : cat.id === 'HDR' ? '💉' : cat.id === 'Mammography' ? '🩺' : cat.id === 'Cyclotron' ? '⚛️' : '📷'}</span>
                      <span className="text-xs font-medium">{cat.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{cat.count} modelos</Badge>
                    </Button>
                  ))}
                </div>

                {state.category && (
                  <>
                    <Separator className="my-3" />
                    <Label className="text-xs font-medium mb-2 block">Seleccione el modelo específico:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {equipments.map(eq => (
                        <Button
                          key={eq.id}
                          variant={state.equipment?.id === eq.id ? 'default' : 'outline'}
                          className={`h-auto py-2 justify-start ${state.equipment?.id === eq.id ? 'bg-indigo-600' : ''}`}
                          onClick={() => handleEquipmentSelect(eq.id)}
                        >
                          <div className="text-left">
                            <div className="text-xs font-medium">{eq.manufacturer}</div>
                            <div className="text-[10px] opacity-80">{eq.model}</div>
                            <div className="text-[10px] opacity-60">{eq.energy_MeV_or_kVp}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </>
                )}

                {state.equipment && (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-800">
                      <Shield className="w-4 h-4" />
                      Equipo seleccionado: {state.equipment.manufacturer} {state.equipment.model}
                    </div>
                    <div className="text-xs text-indigo-600 mt-1">
                      Energía: {state.equipment.energy_MeV_or_kVp} | Dosis máx: {state.equipment.doseRate_Gy_min || 'N/A'} Gy/min | Campo: {state.equipment.maxFieldSize_cm}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ STEP 2: INSTALACIÓN ═══ */}
        {state.step === 2 && state.equipment && (
          <div className="max-w-5xl mx-auto space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-indigo-600" />
                  Guía de Instalación — {state.equipment.manufacturer} {state.equipment.model}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {SITE_PLAN_IMAGES[state.equipment.model] && (
                      <div className="border rounded-lg overflow-hidden bg-slate-50">
                        <img
                          src={SITE_PLAN_IMAGES[state.equipment.model]}
                          alt={`${state.equipment.model} site planning`}
                          className="w-full object-contain max-h-[300px]"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="text-[10px] text-center text-slate-500 py-1">Guía de dimensiones — {state.equipment.model}</div>
                      </div>
                    )}
                    {!SITE_PLAN_IMAGES[state.equipment.model] && (
                      <div className="border rounded-lg bg-slate-50 p-4 text-center text-slate-400 text-xs">
                        Imagen de guía de instalación no disponible para este modelo.
                        <br />Consulte el manual del fabricante.
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="font-medium text-sm">Requisitos de Instalación</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-50 rounded"><strong>Clearance frontal:</strong> 3.0 m</div>
                      <div className="p-2 bg-slate-50 rounded"><strong>Clearance lateral:</strong> 1.5 m</div>
                      <div className="p-2 bg-slate-50 rounded"><strong>Clearance posterior:</strong> 1.0 m</div>
                      <div className="p-2 bg-slate-50 rounded"><strong>Altura mínima:</strong> 3.0 m</div>
                      <div className="p-2 bg-slate-50 rounded"><strong>Área mínima:</strong> 35 m²</div>
                      <div className="p-2 bg-slate-50 rounded"><strong>Isocentro:</strong> 1.0 m del piso</div>
                    </div>
                    <Separator />
                    <div className="font-medium text-sm">Metodología Aplicada</div>
                    <div className="space-y-1 text-slate-600">
                      {state.equipment.category === 'LINAC' && (
                        <>
                          <div>• <strong>NCRP 151 Eq. 4.1-4.5</strong> — Barrera primaria/secundaria</div>
                          <div>• <strong>PMC9084580</strong> — Validación Monte Carlo EGSnrc</div>
                          <div>• <strong>PMC11087655</strong> — Cálculo con DICOM RT Plan (ORSE)</div>
                          <div>• <strong>UAQ IGLIN-280880</strong> — Factor VMAT validado</div>
                          <div>• <strong>Factor C₁</strong> aplicado por técnica (NCRP 151 §4.8.5)</div>
                        </>
                      )}
                      {state.equipment.category === 'GammaKnife' && (
                        <>
                          <div>• <strong>PMC5722598</strong> — Método NCRP 151 para Gamma Knife</div>
                          <div>• <strong>Tres estados operacionales</strong>: puerta cerrada, puerta abierta, tratamiento</div>
                          <div>• <strong>Extrapolación inversa cuadrada</strong> del grid de kerma aire</div>
                          <div>• <strong>Radiación anisotrópica</strong> — 201 fuentes Co-60</div>
                        </>
                      )}
                      {state.equipment.category === 'PET-CT' && (
                        <>
                          <div>• <strong>AAPM TG-108</strong> — Método de blindaje para PET/CT</div>
                          <div>• <strong>PMC12059296</strong> — Factores de transmisión broad beam F-18</div>
                          <div>• <strong>Auto-blindaje del escáner</strong> — Factor 0.26-0.95 (Nye et al.)</div>
                          <div>• <strong>Acumulación de dosis</strong> por manejo de fuentes</div>
                        </>
                      )}
                      {state.equipment.category === 'HDR' && (
                        <>
                          <div>• <strong>NCRP 151 / IAEA TECDOC 1274</strong> — Blindaje HDR</div>
                          <div>• <strong>PMC8630660</strong> — TVL Ir-192: 16 mm plomo, 152 mm concreto</div>
                          <div>• <strong>Constante de dosis</strong> para Ir-192: 0.1091 μGy·m²/h·MBq</div>
                        </>
                      )}
                      {(state.equipment.category === 'SPECT' || state.equipment.category === 'CT' || state.equipment.category === 'Mammography') && (
                        <>
                          <div>• <strong>NCRP 147</strong> — Blindaje para radiología estructural</div>
                          <div>• <strong>PMC12059296</strong> — Factores de transmisión broad beam</div>
                          <div>• <strong>Distancia de trabajo</strong> y factor de ocupación</div>
                        </>
                      )}
                      {state.equipment.category === 'Cyclotron' && (
                        <>
                          <div>• <strong>NCRP 144</strong> — Blindaje para ciclotrones</div>
                          <div>• <strong>Producción de neutrones</strong> y activación</div>
                          <div>• <strong>Múltiples barreras</strong> concreto + plomo + polietileno borado</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ STEP 3: PARÁMETROS ═══ */}
        {state.step === 3 && state.equipment && (
          <div className="max-w-4xl mx-auto space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Parámetros de Blindaje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Técnica de tratamiento */}
                {state.equipment.category === 'LINAC' && (
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Técnica de tratamiento (Factor C₁)</Label>
                    <RadioGroup value={state.technique} onValueChange={v => update({ technique: v })} className="grid grid-cols-3 gap-2">
                      {Object.entries(TECHNIQUE_C1).map(([key, t]) => (
                        <div key={key} className={`p-2 border rounded-lg ${state.technique === key ? 'border-indigo-500 bg-indigo-50' : ''}`}>
                          <RadioGroupItem value={key} id={key} className="mr-2" />
                          <Label htmlFor={key} className="text-xs cursor-pointer">
                            <span className="font-medium">{t.label}</span>
                            <span className="ml-1 text-indigo-600 font-bold">C₁ = {t.C1}</span>
                            <div className="text-[10px] text-slate-500 mt-0.5">{t.description}</div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Carga de trabajo W (Gy/sem)</Label>
                    <Input type="number" value={state.workload_Gy_week} onChange={e => update({ workload_Gy_week: parseFloat(e.target.value) || 0 })} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Factor de uso U</Label>
                    <Select value={state.useFactor.toString()} onValueChange={v => update({ useFactor: parseFloat(v) })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.25">Pared/Floor/Ceiling (0.25)</SelectItem>
                        <SelectItem value="0.05">Laberinto/Puerta (0.05)</SelectItem>
                        <SelectItem value="1.0">Rayo directo (1.0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Factor de ocupación T</Label>
                    <Select value={state.occupancyFactor.toString()} onValueChange={v => update({ occupancyFactor: parseFloat(v) })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OCCUPANCY_FACTORS.map(o => (
                          <SelectItem key={o.value} value={o.value.toString()}>{o.label} ({o.value})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Objetivo P (mSv/sem)</Label>
                    <Select value={state.prefactor_P.toString()} onValueChange={v => update({ prefactor_P: parseFloat(v) })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.02">Público (0.02)</SelectItem>
                        <SelectItem value="0.1">POE controlada (0.1)</SelectItem>
                        <SelectItem value="1.0">POE no controlada (1.0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Distancia d (m)</Label>
                    <Input type="number" value={state.distance_m} onChange={e => update({ distance_m: parseFloat(e.target.value) || 1 })} className="h-8" step="0.1" />
                  </div>
                  <div>
                    <Label className="text-xs">Material de blindaje</Label>
                    <Select value={state.materialId} onValueChange={v => update({ materialId: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MATERIALS_DB.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name} ({m.density_g_cm3} g/cm³)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Nota metodológica:</strong> Los valores por defecto provienen de NCRP 151 (2005). 
                  Para VMAT, el factor de uso y fracción de dispersión se determinan a partir de datos DICOM RT Plan (PMC11087655). 
                  La carga de trabajo modificada W_L = W × C₁ considera el incremento por IMRT/VMAT validado en PMC9084580.
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ STEP 4: CÁLCULO ═══ */}
        {state.step === 4 && state.equipment && (
          <div className="max-w-4xl mx-auto space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  Confirmar Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium mb-1">Equipo</div>
                    <div>{state.equipment.manufacturer} {state.equipment.model}</div>
                    <div className="text-slate-500">{state.equipment.energy_MeV_or_kVp}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium mb-1">Técnica</div>
                    <div>{TECHNIQUE_C1[state.technique]?.label} (C₁ = {TECHNIQUE_C1[state.technique]?.C1})</div>
                    <div className="text-slate-500">W_L = {state.workload_Gy_week} × {TECHNIQUE_C1[state.technique]?.C1} = {(state.workload_Gy_week * (TECHNIQUE_C1[state.technique]?.C1 || 1)).toFixed(0)} Gy/sem</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium mb-1">Parámetros de blindaje</div>
                    <div>U = {state.useFactor} | T = {state.occupancyFactor}</div>
                    <div>P = {state.prefactor_P} mSv/sem | d = {state.distance_m} m</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium mb-1">Material</div>
                    <div>{MATERIALS_DB.find(m => m.id === state.materialId)?.name}</div>
                    <div className="text-slate-500">{MATERIALS_DB.find(m => m.id === state.materialId)?.density_g_cm3} g/cm³</div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="text-xs font-medium text-indigo-800 mb-1">Ecuaciones que se aplicarán:</div>
                  <div className="text-[10px] text-indigo-600 space-y-0.5">
                    <div>1. <strong>Barrera Primaria (NCRP 151 Eq. 4.1):</strong> B = P·d²/(W<sub>L</sub>·U·d₀²), t = TVL·log₁₀(1/B)</div>
                    <div>2. <strong>Fuga (NCRP 151 Eq. 4.4):</strong> B = P·d²·100/(W<sub>L</sub>·L·T)</div>
                    <div>3. <strong>Dispersión (NCRP 151 Eq. 4.5):</strong> B = P·d²·d₀²/(α·W<sub>L</sub>·F·T)</div>
                  </div>
                </div>

                <Button onClick={handleCalculate} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Calculator className="w-4 h-4 mr-2" /> Ejecutar Cálculo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ STEP 5: RESULTADOS ═══ */}
        {state.step === 5 && state.results && (
          <div className="max-w-4xl mx-auto space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    Resultados del Cálculo
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={handleExport}>
                    <Download className="w-3 h-3 mr-1" /> Exportar .txt
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {state.results.length === 0 && (
                    <p className="text-xs text-slate-600" data-testid="esw-no-aplica">Este asistente calcula aceleradores y Gamma Knife (NCRP 151). Para PET use «Espesor PET (TG-108)», para SPECT IPEM 109 y para TC el diseñador (NCRP 147 §5.6).</p>
                  )}
                  {state.results.map((r, i) => (
                    <div key={i} className={`p-3 border-l-4 rounded ${r.meetsLimit ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{r.barrier}</span>
                        <Badge variant={r.meetsLimit ? 'default' : 'destructive'} className="text-[10px]">
                          {r.meetsLimit ? 'Cumple' : 'Revisar'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                        <div>Espesor: <strong>{r.thickness_cm.toFixed(1)} cm</strong> ({r.thickness_mm.toFixed(0)} mm)</div>
                        <div>Transmisión: <strong>{r.transmission.toExponential(2)}</strong></div>
                        <div>Dosis: <strong>{r.dose_mSv_week.toFixed(4)} mSv/sem</strong></div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />

                <div className="text-[10px] text-slate-500 space-y-1">
                  <div><strong>Metodología aplicada:</strong></div>
                  <div>• NCRP 151 (2005) — Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities</div>
                  <div>• PMC9084580 — Design and Evaluation of Structural Shielding Using EGSnrc Monte Carlo (2022)</div>
                  <div>• Carga de trabajo modificada W_L = W × C₁ (NCRP 151 §4.8.5, validado PMC9084580)</div>
                  <div>• Material: {MATERIALS_DB.find(m => m.id === state.materialId)?.name} | TVL primario: {state.tvl_primary_cm} cm</div>
                </div>

                {/* Espacio reservado para costos futuros */}
                <div className="mt-4 p-3 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <DollarSign className="w-4 h-4" />
                    <span><strong>Espacio reservado v14.x:</strong> Costo estimado de materiales de blindaje. Esta función se habilitará con actualización automática de precios.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

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
          disabled={state.step === 5 || (state.step === 1 && !state.equipment)}
        >
          {state.step === 4 ? <><Calculator className="w-3 h-3 mr-1" /> Calcular</> : <><ChevronRight className="w-3 h-3 mr-1" /> Siguiente</>}
        </Button>
      </div>
    </div>
  );
}

