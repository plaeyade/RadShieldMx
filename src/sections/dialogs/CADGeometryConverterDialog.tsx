/**
 * CADGeometryConverterDialog — CATIA-GDML Geometry Builder & CAD-to-ROOT Conversion
 * Based on: Belogurov et al. 2011 (CHEP) & Neuhaus et al. 2025 (CHEP)
 * References: REF075, REF076
 */

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Box, FileCode, ArrowRight, Layers, Copy, CheckCircle,
  AlertTriangle, BookOpen, Cpu, Grid3X3, RefreshCw,
  GitCompare, Download, Info, ChevronRight, Shapes,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MethodStep {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

const catiaWorkflow: MethodStep[] = [
  { step: 1, title: 'Aprehende CSG', description: 'Analiza la representación CSG de la pieza CAD existente. Identifica sólidos primitivos y operaciones booleanas.', icon: Box },
  { step: 2, title: 'Crea elementos auxiliares', description: 'Crea planos, líneas y puntos auxiliares en el modelo existente para medir parámetros CSG.', icon: Grid3X3 },
  { step: 3, title: 'Mide parámetros', description: 'Mide parámetros para el sólido CSG usando workbenches de análisis de CATIA.', icon: Cpu },
  { step: 4, title: 'Crea sólido CSG + material', description: 'Crea el sólido CSG parametrizado, asigna material del catálogo G4Material y posiciónalo.', icon: Shapes },
  { step: 5, title: 'Exporta GDML', description: 'Exporta el árbol completo a formato GDML para importar en GEANT4/ROOT.', icon: FileCode },
];

const cadToRootWorkflow: MethodStep[] = [
  { step: 1, title: 'Diseño CAD (CATIA)', description: 'Crea o importa el modelo CAD detallado en CATIA v.5. Incluye todos los componentes del detector/blindaje.', icon: Box },
  { step: 2, title: 'Exporta STEP', description: 'Exporta el modelo a formato STEP (ISO 10303) para intercambio neutral entre CAD.', icon: Download },
  { step: 3, title: 'Convierte a GDML', description: 'Usa FreeCAD/CATIA-GDML para convertir STEP a formato GDML con primitivas CSG.', icon: RefreshCw },
  { step: 4, title: 'Tessellation (opcional)', description: 'Para geometrías complejas, aplica tessellation con VecGeom o TGeoArbN desde STL mesh.', icon: Layers },
  { step: 5, title: 'Importa en ROOT/GEANT4', description: 'Carga el archivo GDML en ROOT (TGDMLParser) o GEANT4 (GDMLParser) para simulación.', icon: CheckCircle },
];

const primitives = [
  { name: 'G4Box', params: 'x, y, z (half-lengths)', catia: 'Pad en sketch rectangular' },
  { name: 'G4Tubs', params: 'rMin, rMax, dz, sPhi, dPhi', catia: 'Shaft / Revolve' },
  { name: 'G4Cons', params: 'rMin1, rMax1, rMin2, rMax2, dz, sPhi, dPhi', catia: 'Conical shaft (UDF)' },
  { name: 'G4Sphere', params: 'rMin, rMax, sPhi, dPhi, sTheta, dTheta', catia: 'Sphere' },
  { name: 'G4Torus', params: 'rMin, rMax, rTor, sPhi, dPhi', catia: 'Torus (UDF)' },
  { name: 'G4Trd', params: 'dx1, dx2, dy1, dy2, dz', catia: 'Trapezoid pad' },
  { name: 'G4Polycone', params: 'pSPhi, pDPhi, pNumRZ, pRmin[], pRmax[], pZ[]', catia: 'Multi-section revolve' },
  { name: 'G4Boolean', params: 'union | intersection | subtraction', catia: 'Add / Intersect / Remove' },
];

const instantiationMethods = [
  {
    name: 'Replica (G4Replica)',
    description: 'Divide un volumen madre en N copias idénticas que lo llenan completamente sin gaps.',
    pros: ['Geometría más compacta', 'Simulación más rápida', 'Menor uso de memoria'],
    cons: ['Restricciones geométricas estrictas', 'Slice debe llenar el mother'],
    example: 'Calorímetro sampling: placas de plomo + plástico alternadas',
  },
  {
    name: 'Array (Placement Array)',
    description: 'Crea N volúmenes físicos independientes usando CATIA Pattern. Genera lista de <physvol> en GDML.',
    pros: ['Sin restricciones geométricas', 'Gaps permitidos', 'Flexibilidad total'],
    cons: ['GDML más grande', 'Mayor uso de memoria', 'Simulación más lenta'],
    example: 'Array circular de cristales en calorímetro R3B',
  },
  {
    name: 'SimplePlacementArray',
    description: 'Para sub-arrays donde el contenedor violaría reglas G4/ROOT. Coloca hijos directamente en el mother común.',
    pros: ['Evita violaciones de reglas', 'Mantiene referencia de posición', 'Útil para assemblies complejos'],
    cons: ['Pierde jerarquía intermedia', 'Más difícil de mantener'],
    example: 'Contenedor de referencia para posicionar cristales en slice',
  },
];

const tessellationComparison = [
  { feature: 'Requisitos ROOT', vecgeom: '≥6.32 compilado con VecGeom', tgeoarb: 'Instalación ROOT existente' },
  { feature: 'Formato entrada', vecgeom: 'GDML (STEP→GDML)', tgeoarb: 'STL mesh directo' },
  { feature: 'Navegación', vecgeom: 'VecGeom nativo (SIMD/SIMT)', tgeoarb: 'Navegación independiente' },
  { feature: 'Optimización', vecgeom: 'Vectorización automática', tgeoarb: 'Octree partitioning opcional' },
  { feature: 'Tiempo sim.', vecgeom: '+7.6 min (vs baseline)', tgeoarb: '+10 min con Octree' },
  { feature: 'Facilidad', vecgeom: 'Recompilación ROOT necesaria', tgeoarb: 'Fácil integración' },
  { feature: 'Uso recomendado', vecgeom: 'Simulación final (más rápido)', tgeoarb: 'Desarrollo iterativo (más fácil)' },
];

export default function CADGeometryConverterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('catia-gdml');
  const [copied, setCopied] = useState(false);

  const copyBibRef = (id: string) => {
    const refs: Record<string, string> = {
      REF075: 'Belogurov S et al. CATIA-GDML geometry builder. J Phys Conf Ser. 2011;331:032035. doi:10.1088/1742-6596/331/3/032035',
      REF076: 'Neuhaus S et al. CAD to ROOT conversion for Detector Geometries. EPJ Web Conf. 2025;337:01268. doi:10.1051/epjconf/202533701268',
    };
    navigator.clipboard.writeText(refs[id] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] bg-slate-950 border-slate-700 p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Box className="text-blue-400" size={24} />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold">CATIA-GDML & CAD-to-ROOT Geometry Converter</DialogTitle>
                <p className="text-slate-400 text-xs mt-0.5">
                  Metodologías para conversión de geometrías CAD a simulación Monte Carlo (GEANT4/ROOT)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => copyBibRef('REF075')}>
                {copied ? <CheckCircle size={14} className="mr-1 text-emerald-400" /> : <BookOpen size={14} className="mr-1" />}
                {copied ? 'Copiado' : 'Citar'}
              </Button>
              <Badge className="bg-blue-600/30 text-blue-400 text-xs">v51</Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 bg-slate-900 border border-slate-700 shrink-0 overflow-x-auto flex-nowrap w-[calc(100%-3rem)] flex">
            <TabsTrigger value="catia-gdml" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white text-xs whitespace-nowrap flex-shrink-0">
              <Box size={14} className="mr-1.5 flex-shrink-0" /> CATIA-GDML
            </TabsTrigger>
            <TabsTrigger value="cad-root" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white text-xs whitespace-nowrap flex-shrink-0">
              <GitCompare size={14} className="mr-1.5 flex-shrink-0" /> CAD→ROOT
            </TabsTrigger>
            <TabsTrigger value="primitives" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white text-xs whitespace-nowrap flex-shrink-0">
              <Shapes size={14} className="mr-1.5 flex-shrink-0" /> CSG Prims
            </TabsTrigger>
            <TabsTrigger value="tessellation" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white text-xs whitespace-nowrap flex-shrink-0">
              <Layers size={14} className="mr-1.5 flex-shrink-0" /> Tessellation
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            {/* ─── CATIA-GDML BUILDER ─── */}
            <TabsContent value="catia-gdml" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
                      <BookOpen size={16} /> Referencia Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-blue-600/30 text-blue-400 shrink-0 mt-0.5">REF075</Badge>
                      <p className="text-slate-300 text-sm">
                        Belogurov S, Berchun Yu, Chernogorov A, Malzacher P, Ovcharenko E, Semennikov A.
                        <strong className="text-white"> CATIA-GDML geometry builder.</strong>{' '}
                        J Phys Conf Ser. 2011;331:032035.
                      </p>
                    </div>
                    <p className="text-slate-400 text-xs">doi:10.1088/1742-6596/331/3/032035 — CHEP 2010</p>
                    <p className="text-slate-500 text-xs mt-2">
                      <strong>Instituciones:</strong> ITEP Moscow, BMSTU Moscow, GSI Darmstadt
                    </p>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 mt-2" onClick={() => copyBibRef('REF075')}>
                      <Copy size={12} className="mr-1" /> Copiar cita
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
                      <Info size={16} /> Conceptos Clave
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <ChevronRight size={14} className="text-blue-400 shrink-0 mt-1" />
                      <span className="text-slate-300"><strong>CAD→MC incompatibility:</strong> CAD usa BRep (surfaces/curves); GEANT4/ROOT usa CSG (primitivas)</span>
                    </div>
                    <div className="flex gap-2">
                      <ChevronRight size={14} className="text-blue-400 shrink-0 mt-1" />
                      <span className="text-slate-300"><strong>GDML:</strong> Geometry Description Markup Language — formato XML para intercambio</span>
                    </div>
                    <div className="flex gap-2">
                      <ChevronRight size={14} className="text-blue-400 shrink-0 mt-1" />
                      <span className="text-slate-300"><strong>UDF:</strong> User Defined Features — primitivas CSG parametrizadas en CATIA</span>
                    </div>
                    <div className="flex gap-2">
                      <ChevronRight size={14} className="text-blue-400 shrink-0 mt-1" />
                      <span className="text-slate-300"><strong>Bidireccional:</strong> Exporta CATIA→GDML e importa GDML→CATIA</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-300 text-sm">Flujo de Trabajo CATIA-GDML (5 pasos)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {catiaWorkflow.map((s, i) => (
                      <div key={s.step} className="flex gap-4 mb-4 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/30">
                            {s.step}
                          </div>
                          {i < catiaWorkflow.length - 1 && <div className="w-0.5 h-8 bg-slate-700 my-1" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <s.icon size={14} className="text-blue-400" />
                            <h4 className="text-slate-200 font-medium text-sm">{s.title}</h4>
                          </div>
                          <p className="text-slate-400 text-sm">{s.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-300 text-sm">Métodos de Instanciación Múltiple</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {instantiationMethods.map((m) => (
                      <div key={m.name} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <h4 className="text-slate-200 font-medium text-sm mb-2">{m.name}</h4>
                        <p className="text-slate-400 text-xs mb-3">{m.description}</p>
                        <div className="space-y-1 mb-3">
                          {m.pros.map((p, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs">
                              <CheckCircle size={10} className="text-emerald-400 shrink-0" />
                              <span className="text-slate-300">{p}</span>
                            </div>
                          ))}
                          {m.cons.map((c, i) => (
                            <div key={`c-${i}`} className="flex items-center gap-1 text-xs">
                              <AlertTriangle size={10} className="text-amber-400 shrink-0" />
                              <span className="text-slate-400">{c}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Ejemplo</p>
                          <p className="text-slate-300 text-xs">{m.example}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── CAD→ROOT CONVERSION ─── */}
            <TabsContent value="cad-root" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
                      <BookOpen size={16} /> Referencia Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-emerald-600/30 text-emerald-400 shrink-0 mt-0.5">REF076</Badge>
                      <p className="text-slate-300 text-sm">
                        Neuhaus S, Shiroya M, Singh O, Dahm P.
                        <strong className="text-white"> Experiences from the CBM collaboration: CAD to ROOT conversion for Detector Geometries.</strong>{' '}
                        EPJ Web Conf. 2025;337:01268. CHEP 2024.
                      </p>
                    </div>
                    <p className="text-slate-400 text-xs">doi:10.1051/epjconf/202533701268</p>
                    <p className="text-slate-500 text-xs mt-2">
                      <strong>Instituciones:</strong> Uni Wuppertal, Goethe Uni Frankfurt, GSI Darmstadt
                    </p>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 mt-2" onClick={() => copyBibRef('REF076')}>
                      <Copy size={12} className="mr-1" /> Copiar cita
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
                      <GitCompare size={16} /> Contexto CBM/FAIR
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-slate-300">
                      El experimento <strong>CBM</strong> (Compressed Baryonic Matter) usará haces de iones pesados del
                      sincrotrón <strong>SIS100</strong> en <strong>FAIR</strong> (Darmstadt, Alemania).
                    </p>
                    <p className="text-slate-400">
                      Requiere representación precisa de la geometría de simulación para analizar el fondo de
                      partículas secundarias. La conversión automatizada CAD→ROOT reduce la carga de trabajo
                      y acelera el ciclo de iteración ingenieros→físicos.
                    </p>
                    <Separator className="my-2 bg-slate-700" />
                    <p className="text-slate-500 text-xs">
                      Datos de inicio esperados: 2028. Energías: √sNN = 2.9–4.9 GeV.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-300 text-sm">Flujo de Trabajo CAD→ROOT (5 pasos)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {cadToRootWorkflow.map((s, i) => (
                      <div key={s.step} className="flex gap-4 mb-4 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-600/30 flex items-center justify-center text-emerald-400 font-bold text-sm border border-emerald-500/30">
                            {s.step}
                          </div>
                          {i < cadToRootWorkflow.length - 1 && <div className="w-0.5 h-8 bg-slate-700 my-1" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <s.icon size={14} className="text-emerald-400" />
                            <h4 className="text-slate-200 font-medium text-sm">{s.title}</h4>
                          </div>
                          <p className="text-slate-400 text-sm">{s.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-300 text-sm">Herramientas en el Ecosistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3 text-center">
                    {[
                      { name: 'CATIA v.5', role: 'CAD Design', org: 'Dassault', color: 'text-blue-400' },
                      { name: 'FreeCAD', role: 'STEP→GDML', org: 'Open Source', color: 'text-emerald-400' },
                      { name: 'CATIA-GDML', role: 'Direct GDML', org: 'ITEP/BMSTU', color: 'text-purple-400' },
                      { name: 'VecGeom', role: 'Tessellation A', org: 'CERN', color: 'text-amber-400' },
                      { name: 'TGeoArbN', role: 'Tessellation B', org: 'Uni Bonn', color: 'text-red-400' },
                    ].map((tool) => (
                      <div key={tool.name} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <p className={`font-medium text-sm ${tool.color}`}>{tool.name}</p>
                        <p className="text-slate-300 text-xs mt-1">{tool.role}</p>
                        <p className="text-slate-500 text-[10px] mt-1">{tool.org}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── PRIMITIVES ─── */}
            <TabsContent value="primitives" className="m-0 space-y-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-300 text-sm">Primitivas CSG: G4/ROOT ↔ CATIA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-slate-400 font-medium">Primitiva G4</th>
                          <th className="text-left py-2 px-3 text-slate-400 font-medium">Parámetros</th>
                          <th className="text-left py-2 px-3 text-slate-400 font-medium">Equivalencia CATIA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {primitives.map((p) => (
                          <tr key={p.name} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 text-blue-400 font-mono text-xs">{p.name}</td>
                            <td className="py-2 px-3 text-slate-300 text-xs font-mono">{p.params}</td>
                            <td className="py-2 px-3 text-slate-400 text-xs">{p.catia}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm">Jerarquía de Volúmenes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Box size={14} className="text-red-400" />
                      <span><strong>World Volume:</strong> Volumen raíz que contiene todo. No puede ser posicionado.</span>
                    </div>
                    <div className="pl-6 flex items-center gap-2 text-slate-300">
                      <Copy size={14} className="text-blue-400" />
                      <span><strong>Logical Volume:</strong> Solid + Material + Sensitivo + Campo magnético.</span>
                    </div>
                    <div className="pl-12 flex items-center gap-2 text-slate-300">
                      <ArrowRight size={14} className="text-emerald-400" />
                      <span><strong>Physical Volume:</strong> Copia posicionada del Logical dentro del mother.</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-3">
                      En CATIA: Partbody = Logical Volume (CSG solid + material).
                      Publication del Partbody = inserción en mother volume.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm">Optimización para Simulación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <CheckCircle size={12} className="text-emerald-400 shrink-0 mt-1" />
                      <span className="text-slate-300">Insertar placas de scintilador en volumen madre de plomo (más compacto)</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle size={12} className="text-emerald-400 shrink-0 mt-1" />
                      <span className="text-slate-300">Usar placement simple en lugar de union para sólidos adyacentes del mismo material</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle size={12} className="text-emerald-400 shrink-0 mt-1" />
                      <span className="text-slate-300">Agrupar volúmenes del mismo material para reducir árbol de geometría</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle size={12} className="text-emerald-400 shrink-0 mt-1" />
                      <span className="text-slate-300">Usar réplicas en lugar de arrays cuando las restricciones geométricas lo permitan</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── TESSELLATION ─── */}
            <TabsContent value="tessellation" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
                      <Layers size={16} /> ¿Qué es Tessellation?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="text-slate-300">
                      La <strong>tessellation</strong> es el proceso de reemplazar una forma 3D con una malla
                      triangular 2D sin rupturas ni solapamientos de la superficie.
                    </p>
                    <p className="text-slate-400">
                      Permite convertir geometrías CAD complejas (BRep) a un formato que ROOT/GEANT4
                      puede simular, sin necesidad de simplificar manualmente a primitivas CSG.
                    </p>
                    <Separator className="my-2 bg-slate-700" />
                    <p className="text-slate-500 text-xs">
                      <strong>Formato:</strong> STL (Standard Triangle Language) desde CAD → malla triangular
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
                      <AlertTriangle size={16} /> Recomendación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="text-slate-300">
                      Usar geometrías <strong>tessellated solo en desarrollo</strong> para acelerar el ciclo de iteración.
                    </p>
                    <p className="text-slate-400">
                      Una vez finalizado el diseño, <strong>reemplazar con geometrías ROOT simples</strong> (primitivas CSG)
                      para la simulación final, ya que las tessellated aumentan significativamente el tiempo de ejecución.
                    </p>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 mt-2">
                      <p className="text-amber-400 text-xs">
                        <strong>Trade-off:</strong> Precisión vs Velocidad. Tessellation = precisión perfecta pero 5-15x más lento.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-300 text-sm">Comparación VecGeom vs TGeoArbN</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-slate-400 font-medium">Característica</th>
                          <th className="text-left py-2 px-3 text-amber-400 font-medium">VecGeom (Sol. A)</th>
                          <th className="text-left py-2 px-3 text-red-400 font-medium">TGeoArbN (Sol. B)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {tessellationComparison.map((row) => (
                          <tr key={row.feature} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 text-slate-300 font-medium text-xs">{row.feature}</td>
                            <td className="py-2 px-3 text-slate-400 text-xs">{row.vecgeom}</td>
                            <td className="py-2 px-3 text-slate-400 text-xs">{row.tgeoarb}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-300 text-sm">Resultados de Comparación (CBM Beamcross)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Baseline (sin Beamcross)', value: '16.73', unit: 'min', color: 'text-slate-400' },
                      { label: 'VecGeom', value: '24.28', unit: 'min (+45%)', color: 'text-emerald-400' },
                      { label: 'TGeoArbN + Octree', value: '34.37', unit: 'min (+105%)', color: 'text-amber-400' },
                      { label: 'TGeoArbN sin Octree', value: '110.56', unit: 'min (+561%)', color: 'text-red-400' },
                    ].map((r) => (
                      <div key={r.label} className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700/50">
                        <p className={`text-2xl font-bold ${r.color}`}>{r.value}</p>
                        <p className="text-slate-400 text-xs">{r.unit}</p>
                        <p className="text-slate-500 text-[10px] mt-1">{r.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-500 text-xs mt-3 text-center">
                    Simulación: UrQMD 8 AGeV/c Au-Au, 10,000 eventos. GSI cluster Virgo3.
                    Mesh Beamcross: 2,274 triángulos. Posición: z=310-360 cm.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-300 text-sm">Particionamiento Octree (TGeoArbN)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="text-slate-300">
                    El <strong>Octree</strong> subdivide recursivamente el cuboide que contiene el objeto en 8 cuboides
                    más pequeños del mismo tamaño. Evita iterar sobre todos los triángulos de la malla usando
                    un árbol de decisión binario en 3D.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-slate-800/50 rounded p-3 text-center">
                      <p className="text-slate-200 font-bold text-lg">8x</p>
                      <p className="text-slate-500 text-xs">Subdivisión por nivel</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-3 text-center">
                      <p className="text-slate-200 font-bold text-lg">O(log n)</p>
                      <p className="text-slate-500 text-xs">Búsqueda triángulos</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-3 text-center">
                      <p className="text-slate-200 font-bold text-lg">3x</p>
                      <p className="text-slate-500 text-xs">Speedup con Octree</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Un sub-cuboide se considera vacío si el número de elementos de malla dentro es inferior a un umbral predefinido.
                    Esto acelera significativamente la navegación de partículas sin afectar la precisión de los resultados.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
