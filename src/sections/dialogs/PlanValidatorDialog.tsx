import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FloorPlan } from '@/types/radshield';
import { areaAproximadaSala } from '@/lib/areaPlano';
import {
  CheckCircle2, XCircle, AlertTriangle, Ruler, Building2,
  LayoutDashboard, ScanLine, FileCheck, Download, MapPin,
  ChevronRight, Info
} from 'lucide-react';

interface PlanValidatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorPlan: FloorPlan;
}

interface ValidationResult {
  status: 'pass' | 'fail' | 'warning' | 'info';
  category: string;
  message: string;
  detail?: string;
  recommendation?: string;
}

// ─────────────────────────────────────────────────────────
// Clearance data (meters) per equipment type from NCRP 151/147
// ─────────────────────────────────────────────────────────
const EQUIPMENT_CLEARANCE: Record<string, { front: number; sides: number; rear: number; overhead: number }> = {
  'linac-6mv': { front: 3.0, sides: 1.5, rear: 1.0, overhead: 0.5 },
  'linac-10mv': { front: 3.0, sides: 1.5, rear: 1.0, overhead: 0.5 },
  'linac-15mv': { front: 3.0, sides: 1.5, rear: 1.0, overhead: 0.5 },
  'linac-18mv': { front: 3.0, sides: 1.5, rear: 1.0, overhead: 0.5 },
  'gamma-knife': { front: 2.0, sides: 1.2, rear: 1.0, overhead: 0.3 },
  'hdr-192ir': { front: 1.5, sides: 1.0, rear: 0.8, overhead: 0.3 },
  'pet-f18': { front: 2.0, sides: 1.2, rear: 1.0, overhead: 0.3 },
  'pet-gallium': { front: 2.0, sides: 1.2, rear: 1.0, overhead: 0.3 },
  'spect-tc99m': { front: 2.0, sides: 1.2, rear: 1.0, overhead: 0.3 },
  'radioiodine-i131': { front: 2.0, sides: 1.2, rear: 1.0, overhead: 0.3 },
  'ct-head': { front: 2.0, sides: 1.0, rear: 1.0, overhead: 0.3 },
  'ct-body': { front: 2.0, sides: 1.0, rear: 1.0, overhead: 0.3 },
  'mammo-cc': { front: 1.5, sides: 1.0, rear: 0.8, overhead: 0.3 },
  'mammo-mlo': { front: 1.5, sides: 1.0, rear: 0.8, overhead: 0.3 },
  'cyclotron-16mev': { front: 4.0, sides: 2.0, rear: 2.0, overhead: 1.0 },
  'cyclotron-11mev': { front: 4.0, sides: 2.0, rear: 2.0, overhead: 1.0 },
};

// ─────────────────────────────────────────────────────────
// Room dimension requirements (m²) — minimum from CNSNS/NOM
// ─────────────────────────────────────────────────────────
const ROOM_MIN_AREA: Record<string, number> = {
  'linac-6mv': 35,
  'linac-10mv': 35,
  'linac-15mv': 40,
  'linac-18mv': 40,
  'gamma-knife': 25,
  'hdr-192ir': 15,
  'pet-f18': 30,
  'pet-gallium': 30,
  'spect-tc99m': 25,
  'radioiodine-i131': 20,
  'ct-head': 20,
  'ct-body': 20,
  'mammo-cc': 12,
  'mammo-mlo': 12,
  'cyclotron-16mev': 60,
  'cyclotron-11mev': 60,
};

// ─────────────────────────────────────────────────────────
// Adjacency rules — which equipment types must NOT be adjacent
// ─────────────────────────────────────────────────────────
const ADJACENCY_RULES: { types: [string, string]; minWallThickness_cm: number; reason: string }[] = [
  { types: ['linac-15mv', 'pet-f18'], minWallThickness_cm: 200, reason: 'LINAC 15 MV produce neutrones que pueden afectar PET-CT' },
  { types: ['linac-18mv', 'pet-f18'], minWallThickness_cm: 220, reason: 'LINAC 18 MV produce neutrones que pueden afectar PET-CT' },
  { types: ['gamma-knife', 'linac-6mv'], minWallThickness_cm: 150, reason: 'Ambos son teleterapia, requieren separación estructural' },
  { types: ['cyclotron-16mev', 'pet-f18'], minWallThickness_cm: 180, reason: 'Ciclotrón produce neutrones y activación' },
  { types: ['radioiodine-i131', 'spect-tc99m'], minWallThickness_cm: 80, reason: 'Contaminación cruzada de radionucleidos' },
  { types: ['hdr-192ir', 'mammo-cc'], minWallThickness_cm: 100, reason: 'Braquiterapia HDR requiere separación de áreas públicas' },
];

function runValidations(floorPlan: FloorPlan, scale_m_per_px: number): ValidationResult[] {
  const results: ValidationResult[] = [];

  // 1. Scale check
  if (!scale_m_per_px || scale_m_per_px <= 0) {
    results.push({ status: 'fail', category: 'Escala', message: 'Escala no definida o inválida', detail: 'Debe establecer la escala en m/pixel antes de validar', recommendation: 'Configurar escala en el panel izquierdo (típico: 0.01 m/px)' });
  } else {
    results.push({ status: 'pass', category: 'Escala', message: `Escala configurada: ${scale_m_per_px.toFixed(4)} m/pixel` });
  }

  // 2. Source count
  if (!floorPlan.sources || floorPlan.sources.length === 0) {
    results.push({ status: 'warning', category: 'Fuentes', message: 'No hay fuentes de radiación definidas', detail: 'Agregue al menos una fuente para validar el plano', recommendation: 'Use la herramienta "Fuente" en el panel izquierdo' });
  } else {
    results.push({ status: 'pass', category: 'Fuentes', message: `${floorPlan.sources.length} fuente(s) definida(s)` });
  }

  // 3. Barriers count
  if (!floorPlan.barriers || floorPlan.barriers.length === 0) {
    results.push({ status: 'warning', category: 'Barreras', message: 'No hay barreras definidas', detail: 'Las barreras son necesarias para cálculos de blindaje', recommendation: 'Dibuje barreras con la herramienta de líneas o rectángulos' });
  } else {
    results.push({ status: 'pass', category: 'Barreras', message: `${floorPlan.barriers.length} barrera(s) definida(s)` });
  }

  // 4. Per source validations
  floorPlan.sources?.forEach((src, idx) => {
    const modId = src.modality.id;
    const clearance = EQUIPMENT_CLEARANCE[modId];
    const minArea = ROOM_MIN_AREA[modId];

    // Equipment clearance
    if (clearance) {
      results.push({
        status: 'info' as any,
        category: `Equipo #${idx + 1} (${src.modality.name})`,
        message: `Clearance requerido: Frontal ${clearance.front}m, Lateral ${clearance.sides}m, Posterior ${clearance.rear}m`,
        detail: 'Verificar espacio libre alrededor del equipo según NCRP 151/147',
        recommendation: 'Asegure acceso para mantenimiento y evacuación de pacientes'
      });
    }

    // Área aproximada: rectángulo que contiene las barreras (o el plano completo si no hay barreras).
    const area = areaAproximadaSala(floorPlan, scale_m_per_px);
    if (!minArea) return;
    if (!area) {
      results.push({ status: 'warning', category: `Equipo #${idx + 1}`, message: 'No se pudo estimar el área de la sala', detail: 'Faltan barreras o el tamaño del plano', recommendation: 'Dibuje las barreras de la sala' });
      return;
    }
    const approxArea = area.area_m2;
    const origen = area.origen === 'barreras' ? 'rectángulo de las barreras' : 'plano completo';
    if (approxArea < minArea) {
      results.push({ status: 'fail', category: `Equipo #${idx + 1}`, message: `Área estimada (${approxArea.toFixed(1)} m², ${origen}) menor al mínimo requerido (${minArea} m²)`, detail: `Para ${src.modality.name} se requieren al menos ${minArea} m²`, recommendation: 'Aumente las dimensiones de la habitación o considere reubicación' });
    } else {
      results.push({ status: 'pass', category: `Equipo #${idx + 1}`, message: `Área estimada (${approxArea.toFixed(1)} m², ${origen}) cumple requisito mínimo (${minArea} m²)` });
    }
  });

  // 5. Adjacency validation
  for (let i = 0; i < (floorPlan.sources?.length || 0); i++) {
    for (let j = i + 1; j < (floorPlan.sources?.length || 0); j++) {
      const srcA = floorPlan.sources[i];
      const srcB = floorPlan.sources[j];
      const rule = ADJACENCY_RULES.find(r =>
        (r.types[0] === srcA.modality.id && r.types[1] === srcB.modality.id) ||
        (r.types[0] === srcB.modality.id && r.types[1] === srcA.modality.id)
      );
      if (rule) {
        results.push({ status: 'warning', category: 'Colindancia', message: `Atención: ${srcA.modality.name} adyacente a ${srcB.modality.name}`, detail: rule.reason, recommendation: `Separación mínima recomendada: ${rule.minWallThickness_cm} cm de blindaje` });
      }
    }
  }

  // 6. If no adjacency rules triggered for multiple sources
  if ((floorPlan.sources?.length || 0) >= 2 && !results.some(r => r.category === 'Colindancia')) {
    results.push({ status: 'pass', category: 'Colindancia', message: 'No se detectaron conflictos de colindancia entre equipos' });
  }

  return results;
}

export default function PlanValidatorDialog({ open, onOpenChange, floorPlan }: PlanValidatorDialogProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [scaleInput, setScaleInput] = useState<string>((floorPlan as any).scale?.toString() || floorPlan.scale_m_per_pixel?.toString() || '0.01');
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const handleValidate = () => {
    const scale = parseFloat(scaleInput) || 0.01;
    const res = runValidations(floorPlan, scale);
    setResults(res);
    setHasRun(true);
  };

  const handleExport = () => {
    const lines = [
      '═══════════════════════════════════════════════════════════════════',
      '  RADSHIELD MX — REPORTE DE VALIDACIÓN DE PLANOS',
      '═══════════════════════════════════════════════════════════════════',
      `Proyecto: ${floorPlan.name}`,
      `Fecha: ${new Date().toLocaleDateString('es-MX')}`,
      `Escala: ${scaleInput} m/pixel`,
      `Fuentes: ${floorPlan.sources?.length || 0}`,
      `Barreras: ${floorPlan.barriers?.length || 0}`,
      '───────────────────────────────────────────────────────────────────',
      ...results.map(r => `[${r.status.toUpperCase()}] ${r.category}: ${r.message}${r.detail ? '\n    Detalle: ' + r.detail : ''}${r.recommendation ? '\n    Recomendación: ' + r.recommendation : ''}`),
      '═══════════════════════════════════════════════════════════════════',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Validacion_Plano_${floorPlan.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredResults = selectedEquipment === 'all'
    ? results
    : results.filter(r => r.category.includes(selectedEquipment) || r.category === 'Escala' || r.category === 'Fuentes' || r.category === 'Barreras' || r.category === 'Colindancia');

  const passCount = results.filter(r => r.status === 'pass').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const infoCount = results.filter(r => r.status === 'info').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Validador de Planos — RadSHIELD Mx
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          <p className="text-xs text-slate-500">
            Verifica dimensiones, colindancias, clearances y sembrado de equipos conforme a NCRP 151/147, CNSNS y NOM-008-NUCL-2018
          </p>
        </div>

        <Tabs defaultValue="validar" className="w-full">
          <TabsList className="mx-6">
            <TabsTrigger value="validar"><Ruler className="w-3 h-3 mr-1" />Validar</TabsTrigger>
            <TabsTrigger value="equipos"><ScanLine className="w-3 h-3 mr-1" />Equipos</TabsTrigger>
            <TabsTrigger value="colindancias"><Building2 className="w-3 h-3 mr-1" />Colindancias</TabsTrigger>
            <TabsTrigger value="resultados"><LayoutDashboard className="w-3 h-3 mr-1" />Resultados</TabsTrigger>
          </TabsList>

          {/* Tab: Validar */}
          <TabsContent value="validar" className="px-6 pb-4">
            <Card className="mb-3">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Escala (m/pixel)</Label>
                    <Input type="number" step="0.001" value={scaleInput} onChange={e => setScaleInput(e.target.value)} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Filtrar por equipo</Label>
                    <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los equipos</SelectItem>
                        {floorPlan.sources?.map((s, i) => (
                          <SelectItem key={s.modality.id + i} value={`#${i + 1}`}>{s.modality.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleValidate} className="flex-1">
                    <FileCheck className="w-4 h-4 mr-2" /> Ejecutar Validación
                  </Button>
                  {hasRun && (
                    <Button variant="outline" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" /> Exportar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {hasRun && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                <Card className="bg-green-50"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-green-700">{passCount}</div><div className="text-xs text-green-600">Correctos</div></CardContent></Card>
                <Card className="bg-yellow-50"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-yellow-700">{warningCount}</div><div className="text-xs text-yellow-600">Advertencias</div></CardContent></Card>
                <Card className="bg-red-50"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-red-700">{failCount}</div><div className="text-xs text-red-600">Errores</div></CardContent></Card>
                <Card className="bg-blue-50"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-blue-700">{infoCount}</div><div className="text-xs text-blue-600">Info</div></CardContent></Card>
              </div>
            )}

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredResults.map((r, i) => (
                  <Card key={i} className={
                    r.status === 'pass' ? 'border-l-4 border-l-green-500' :
                    r.status === 'fail' ? 'border-l-4 border-l-red-500' :
                    r.status === 'warning' ? 'border-l-4 border-l-yellow-500' :
                    'border-l-4 border-l-blue-400'
                  }>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {r.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />}
                        {r.status === 'fail' && <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />}
                        {r.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />}
                        {r.status === 'info' && <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                            <span className={`text-xs font-medium ${
                              r.status === 'pass' ? 'text-green-700' :
                              r.status === 'fail' ? 'text-red-700' :
                              r.status === 'warning' ? 'text-yellow-700' :
                              'text-blue-600'
                            }`}>{r.message}</span>
                          </div>
                          {r.detail && <p className="text-xs text-slate-500 mt-1">{r.detail}</p>}
                          {r.recommendation && <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-1.5 rounded">💡 {r.recommendation}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">Ejecute la validación para ver resultados</div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Equipos */}
          <TabsContent value="equipos" className="px-6 pb-4">
            <ScrollArea className="h-[520px]">
              <div className="space-y-3">
                {floorPlan.sources?.map((src, idx) => {
                  const mod = src.modality;
                  const clearance = EQUIPMENT_CLEARANCE[mod.id];
                  const minArea = ROOM_MIN_AREA[mod.id];
                  const imgMap: Record<string, string> = {
                    'linac-6mv': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
                    'linac-10mv': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
                    'linac-15mv': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
                    'linac-18mv': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
                    'gamma-knife': '/equipment-images/7_Leksell_Gamma_Knife_Icon_.png',
                    'hdr-192ir': '/equipment-images/4_Elekta_Flexitron_Afterloader_For.png',
                    'pet-f18': '/equipment-images/1_Biograph_Vision_PET_CT_Scanner.png',
                    'pet-gallium': '/equipment-images/1_Biograph_Vision_PET_CT_Scanner.png',
                    'spect-tc99m': '/equipment-images/3_NM_CT_860_SPECT_CT_Sytem_GE_HealthCare.png',
                    'radioiodine-i131': '/equipment-images/3_NM_CT_860_SPECT_CT_Sytem_GE_HealthCare.png',
                    'ct-head': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
                    'ct-body': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
                    'mammo-cc': '/equipment-images/2_Selenia_Dimensions_Mammography_System.png',
                    'mammo-mlo': '/equipment-images/2_Selenia_Dimensions_Mammography_System.png',
                    'cyclotron-16mev': '/equipment-images/1_Biograph_Vision_PET_CT_Scanner.png',
                    'cyclotron-11mev': '/equipment-images/1_Biograph_Vision_PET_CT_Scanner.png',
                  };
                  return (
                    <Card key={idx}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <CardTitle className="text-sm">Equipo #{idx + 1}: {mod.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-[120px_1fr] gap-3">
                          <div className="bg-slate-50 rounded overflow-hidden flex items-center justify-center h-[100px]">
                            <img
                              src={imgMap[mod.id] || '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png'}
                              alt={mod.name}
                              className="max-h-full max-w-full object-contain"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div><strong>Categoría:</strong> {mod.category}</div>
                            <div><strong>Energía:</strong> {mod.energyLabel}</div>
                            <div><strong>Norma:</strong> {mod.standard}</div>
                            <div><strong>Constante dosis:</strong> {mod.doseRateConstant} {mod.unit}</div>
                            {clearance && (
                              <div className="text-slate-500 mt-1">
                                <strong>Clearance mínimo:</strong> Frontal {clearance.front}m | Lateral {clearance.sides}m | Posterior {clearance.rear}m
                              </div>
                            )}
                            {minArea && (
                              <div className="text-slate-500">
                                <strong>Área mínima requerida:</strong> {minArea} m²
                              </div>
                            )}
                            <div className="text-slate-500">
                              <strong>Altura isocentro:</strong> {mod.isocenterHeightDefault_m} m
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {(!floorPlan.sources || floorPlan.sources.length === 0) && (
                  <div className="text-center py-8 text-slate-400">No hay equipos definidos. Agregue fuentes desde el canvas.</div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Colindancias */}
          <TabsContent value="colindancias" className="px-6 pb-4">
            <ScrollArea className="h-[520px]">
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Reglas de Colindancia — NCRP 151 / CNSNS</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs">
                      {ADJACENCY_RULES.map((rule, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded">
                          <AlertTriangle className="w-3 h-3 text-yellow-600 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-medium">{rule.types[0]} ↔ {rule.types[1]}</div>
                            <div className="text-slate-500">{rule.reason}</div>
                            <div className="text-slate-600">Blindaje mínimo: <strong>{rule.minWallThickness_cm} cm</strong></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Análisis Actual del Plano</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {floorPlan.sources && floorPlan.sources.length >= 2 ? (
                      <div className="space-y-2 text-xs">
                        {(() => {
                          const conflicts: string[] = [];
                          for (let i = 0; i < floorPlan.sources.length; i++) {
                            for (let j = i + 1; j < floorPlan.sources.length; j++) {
                              const rule = ADJACENCY_RULES.find(r =>
                                (r.types[0] === floorPlan.sources![i].modality.id && r.types[1] === floorPlan.sources![j].modality.id) ||
                                (r.types[0] === floorPlan.sources![j].modality.id && r.types[1] === floorPlan.sources![i].modality.id)
                              );
                              if (rule) {
                                conflicts.push(`${floorPlan.sources[i].modality.name} + ${floorPlan.sources[j].modality.name}: ${rule.reason} (mín ${rule.minWallThickness_cm} cm)`);
                              }
                            }
                          }
                          if (conflicts.length === 0) return <div className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> No se detectaron conflictos de colindancia</div>;
                          return conflicts.map((c, i) => <div key={i} className="text-yellow-700 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5" /> {c}</div>);
                        })()}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs">Se requieren al menos 2 equipos para analizar colindancias</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Resultados */}
          <TabsContent value="resultados" className="px-6 pb-4">
            <ScrollArea className="h-[520px]">
              <div className="space-y-2">
                {hasRun ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-sm font-medium">Resumen de Validación</div>
                      <Badge className={failCount > 0 ? 'bg-red-100 text-red-700' : warningCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}>
                        {failCount > 0 ? 'Requiere Corrección' : warningCount > 0 ? 'Revisar Advertencias' : 'Aprobado'}
                      </Badge>
                    </div>
                    {results.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-slate-50">
                        <ChevronRight className={`w-3 h-3 mt-0.5 shrink-0 ${
                          r.status === 'pass' ? 'text-green-500' : r.status === 'fail' ? 'text-red-500' : r.status === 'warning' ? 'text-yellow-500' : 'text-blue-400'
                        }`} />
                        <div>
                          <span className="font-medium">{r.category}:</span> {r.message}
                          {r.recommendation && <div className="text-slate-500 mt-0.5">→ {r.recommendation}</div>}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400">Ejecute la validación en la pestaña "Validar"</div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
