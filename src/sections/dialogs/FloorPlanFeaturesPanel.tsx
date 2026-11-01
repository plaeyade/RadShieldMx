// v95: Floor Plan Features Panel — 5 SmartDraw-style tools
// Timeline AI, Easy Floor Planning, Electrical, Plumbing, Advanced Diagramming

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Clock, Grid3X3, Zap, Droplets, Shapes,
  Wand2, Plus, Trash2, Download, Lightbulb,
  ToggleLeft, ToggleRight, Ruler, ArrowRight,
  Circle, Hexagon, Type, Highlighter, Square as SquareIcon, Waves, PanelTop,
  BatteryCharging, Flame, CircleDot, X,
} from "lucide-react";
import {
  useAITimeline, useEasyFloorPlanning, useElectricalPlans,
  usePlumbingDrawings, useAdvancedDiagramming,
} from "@/hooks/useFloorPlanFeatures";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  barrierCount?: number;
  sourceCount?: number;
  hasMaze?: boolean;
}

export default function FloorPlanFeaturesPanel({ open, onOpenChange, barrierCount = 0, sourceCount = 0, hasMaze = false }: Props) {
  const [activeTab, setActiveTab] = useState("timeline");

  const timeline = useAITimeline();
  const floorPlan = useEasyFloorPlanning();
  const electrical = useElectricalPlans();
  const plumbing = usePlumbingDrawings();
  const diagramming = useAdvancedDiagramming();

  const handleGenerateTimeline = () => {
    const phases = timeline.generateTimeline(barrierCount, sourceCount, hasMaze);
    toast.success(`Timeline generado: ${phases.length} fases, ${phases.reduce((s, p) => s + p.duration, 0)} dias total`);
  };

  const totalDays = timeline.timeline.reduce((s, p) => Math.max(s, p.startDay + p.duration), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shapes className="w-5 h-5 text-orange-500" />
            Floor Plan Tools
            <Badge variant="outline" className="ml-2 text-[10px]">5 features</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="timeline" className="text-[10px]"><Clock className="w-3 h-3 mr-0.5" />Timeline</TabsTrigger>
            <TabsTrigger value="rooms" className="text-[10px]"><Grid3X3 className="w-3 h-3 mr-0.5" />Rooms</TabsTrigger>
            <TabsTrigger value="electrical" className="text-[10px]"><Zap className="w-3 h-3 mr-0.5" />Electrical</TabsTrigger>
            <TabsTrigger value="plumbing" className="text-[10px]"><Droplets className="w-3 h-3 mr-0.5" />Plumbing</TabsTrigger>
            <TabsTrigger value="diagrams" className="text-[10px]"><Shapes className="w-3 h-3 mr-0.5" />Diagrams</TabsTrigger>
          </TabsList>

          {/* 1. AI TIMELINE */}
          <TabsContent value="timeline" className="flex-1 min-h-0 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">AI Timeline Generator</p>
                <p className="text-[10px] text-slate-400">Genera cronograma de construccion basado en el floor plan</p>
              </div>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={handleGenerateTimeline} disabled={timeline.isGenerating}>
                <Wand2 className="w-3.5 h-3.5 mr-1" /> {timeline.isGenerating ? "Generando..." : "Generar"}
              </Button>
            </div>
            {timeline.timeline.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Presione &quot;Generar&quot; para crear un cronograma</p>
                <p className="text-[10px] mt-1">Usa {barrierCount} barreras y {sourceCount} fuentes del plano actual</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2 text-[10px] text-slate-500">
                  <span>Total: <strong>{totalDays} dias</strong></span>
                  <span>{timeline.timeline.length} fases</span>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => {
                    const csv = "Phase,Start Day,Duration,Category\\n" + timeline.timeline.map(p => `${p.name},${p.startDay},${p.duration},${p.category}`).join("\\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = "timeline.csv"; a.click();
                  }}>
                    <Download className="w-3 h-3 mr-1" /> Exportar CSV
                  </Button>
                </div>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-1.5 pr-2">
                    {timeline.timeline.map((phase, i) => (
                      <div key={phase.id} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-slate-50 transition-colors">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0" style={{ background: phase.color }}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate">{phase.name}</span>
                            <Badge variant="outline" className="text-[9px]">{phase.category}</Badge>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${(phase.duration / totalDays) * 100}%`, background: phase.color }} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-medium">D{phase.startDay}</p>
                          <p className="text-[10px] text-slate-400">+{phase.duration}d</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          {/* 2. EASY FLOOR PLANNING */}
          <TabsContent value="rooms" className="flex-1 min-h-0 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">Easy Floor Planning</p>
                <p className="text-[10px] text-slate-400">Plantillas clinicas predefinidas + snap-to-grid</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => floorPlan.setSnapToGrid(!floorPlan.snapToGrid)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700">
                  {floorPlan.snapToGrid ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                  Snap {floorPlan.gridSize}cm
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {floorPlan.templates.map(room => (
                <button
                  key={room.id}
                  className="p-2 rounded-lg border hover:bg-slate-50 transition-all text-left group"
                  style={{ borderLeftColor: room.color, borderLeftWidth: 3 }}
                  onClick={() => toast.success(`Plantilla "${room.name}" seleccionada`)}
                >
                  <p className="text-[11px] font-medium truncate">{room.name}</p>
                  <p className="text-[9px] text-slate-400">{room.width}x{room.height}cm</p>
                  <Badge variant="outline" className="text-[8px] mt-1">{room.type}</Badge>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* 3. ELECTRICAL PLANS */}
          <TabsContent value="electrical" className="flex-1 min-h-0 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">Electrical Plans</p>
                <p className="text-[10px] text-slate-400">Simbolos electricos para instalaciones de blindaje</p>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={electrical.clearSymbols}>
                <Trash2 className="w-3 h-3 mr-1" /> Limpiar
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[
                { icon: Zap, name: "Luz", type: "light" as const },
                { icon: PanelTop, name: "Panel", type: "panel" as const },
                { icon: CircleDot, name: "Toma", type: "outlet" as const },
                { icon: BatteryCharging, name: "UPS", type: "ups" as const },
                { icon: Lightbulb, name: "Emerg.", type: "emergency" as const },
                { icon: Flame, name: "Tierra", type: "ground" as const },
              ].map(sym => (
                <button
                  key={sym.type}
                  className="flex flex-col items-center p-2 rounded-lg border hover:bg-slate-50 hover:border-orange-300 transition-all"
                  onClick={() => { electrical.addSymbol({ name: sym.name, type: sym.type, x: 0, y: 0 }); toast.success(`Simbolo "${sym.name}" agregado`); }}
                >
                  <sym.icon className="w-4 h-4 text-slate-600 mb-0.5" />
                  <span className="text-[9px] text-slate-500">{sym.name}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">{electrical.symbols.length} simbolos colocados</p>
          </TabsContent>

          {/* 4. PLUMBING DRAWINGS */}
          <TabsContent value="plumbing" className="flex-1 min-h-0 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">Plumbing Drawings</p>
                <p className="text-[10px] text-slate-400">Simbolos hidraulicos para instalaciones</p>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={plumbing.clearSymbols}>
                <Trash2 className="w-3 h-3 mr-1" /> Limpiar
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[
                { icon: Droplets, name: "Lavabo", type: "sink" as const },
                { icon: Waves, name: "Desague", type: "drain" as const },
                { icon: SquareIcon, name: "Valvula", type: "valve" as const },
                { icon: Flame, name: "Calentador", type: "water_heater" as const },
                { icon: Circle, name: "Tuberia", type: "pipe" as const },
                { icon: X, name: "Alcant.", type: "sewer" as const },
              ].map(sym => (
                <button
                  key={sym.type}
                  className="flex flex-col items-center p-2 rounded-lg border hover:bg-slate-50 hover:border-blue-300 transition-all"
                  onClick={() => { plumbing.addSymbol({ name: sym.name, type: sym.type, x: 0, y: 0 }); toast.success(`Simbolo "${sym.name}" agregado`); }}
                >
                  <sym.icon className="w-4 h-4 text-blue-500 mb-0.5" />
                  <span className="text-[9px] text-slate-500">{sym.name}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">{plumbing.symbols.length} simbolos colocados</p>
          </TabsContent>

          {/* 5. ADVANCED DIAGRAMMING */}
          <TabsContent value="diagrams" className="flex-1 min-h-0 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">Advanced Diagramming</p>
                <p className="text-[10px] text-slate-400">Anotaciones, flechas, dimensiones y callouts</p>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={diagramming.clearElements}>
                <Trash2 className="w-3 h-3 mr-1" /> Limpiar
              </Button>
            </div>
            <div className="flex gap-1 mb-2 flex-wrap">
              {[
                { icon: ArrowRight, type: "arrow" as const, label: "Flecha" },
                { icon: Type, type: "text" as const, label: "Texto" },
                { icon: Ruler, type: "dimension" as const, label: "Dimension" },
                { icon: Hexagon, type: "callout" as const, label: "Callout" },
                { icon: Circle, type: "cloud" as const, label: "Nube" },
                { icon: Highlighter, type: "highlight" as const, label: "Resaltar" },
              ].map(tool => (
                <button
                  key={tool.type}
                  className={`flex items-center gap-0.5 px-2 py-1 rounded text-[10px] transition-all ${diagramming.activeTool === tool.type ? 'bg-orange-100 border border-orange-300 text-orange-700' : 'border hover:bg-slate-50'}`}
                  onClick={() => diagramming.setActiveTool(tool.type)}
                >
                  <tool.icon className="w-3 h-3" /> {tool.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mb-2">Herramienta activa: <strong>{diagramming.activeTool}</strong> | {diagramming.elements.length} elementos</p>
            <Button size="sm" variant="outline" className="text-[10px]" onClick={() => {
              diagramming.addElement({ type: diagramming.activeTool, x: 100, y: 100, content: "Nueva anotacion", color: "#f59e0b" });
              toast.success("Elemento agregado al canvas");
            }}>
              <Plus className="w-3 h-3 mr-1" /> Agregar {diagramming.activeTool}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
