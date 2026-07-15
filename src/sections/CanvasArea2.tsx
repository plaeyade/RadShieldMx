/**
 * CanvasArea2 — RadShield-MX v65
 * Rediseño completo basado en SmartDraw Dashboard:
 * - Top Smart Toolbar con acciones rapidas
 * - Left Tool Palette con herramientas de dibujo
 * - Canvas principal con useCanvas2 (defensive)
 * - Bottom Quick Actions Dock para calculo de memorias
 * - Floating panels: propiedades, layers, templates
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MousePointer2, Ruler, Crosshair, Move, Square, Circle,
  ZoomIn, ZoomOut, Maximize, Grid3X3, Undo2, Redo2, Trash2,
  Calculator, FileText, FileDown, Play, Layers, Shapes,
  Palette, Type, Eraser, ChevronLeft, ChevronRight,
  Save, FolderOpen, Upload, Settings, Download,
  Stethoscope, X, Plus, Minimize2, FileCheck,
  Radiation, ScanLine, Cpu, BookOpen, Zap, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FloorPlan, Barrier, RadiationSource } from '@/types/radshield';
import type { CanvasState2, Tool } from '@/hooks/useCanvas2';
import { useI18n } from '@/hooks/useI18n';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasState: CanvasState2;
  setCanvasState: React.Dispatch<React.SetStateAction<CanvasState2>>;
  hoverInfo: string | null;
  canvasSize: { width: number; height: number };
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  onZoomToFit: () => void;
  onExportPNG: () => void;
  onDeleteSelected: () => void;
  activeTool: Tool;
  onToolChange: (t: Tool) => void;
  floorPlan: FloorPlan;
  selectedId: string | null;
  onFloorPlanChange: (fp: FloorPlan) => void;
  onCalculate?: () => void;
  onUAQ?: () => void;
  onMemoriaAI?: () => void;
  onQuickBarrier?: () => void;
  onImportFloorPlan?: () => void;
  onNewBarrierPreset?: (preset: string) => void;
}

const TOOLS: { id: Tool; label: string; icon: React.ComponentType<{className?: string}>; shortcut?: string }[] = [
  { id: 'select', label: 'Seleccionar', icon: MousePointer2, shortcut: 'V' },
  { id: 'pan', label: 'Mover vista', icon: Move, shortcut: 'H' },
  { id: 'barrier', label: 'Dibujar Barrera', icon: Ruler, shortcut: 'B' },
  { id: 'source', label: 'Colocar Fuente', icon: Crosshair, shortcut: 'S' },
  { id: 'rectangle', label: 'Rectangulo', icon: Square, shortcut: 'R' },
  { id: 'circle', label: 'Circulo', icon: Circle, shortcut: 'C' },
  { id: 'text', label: 'Texto', icon: Type, shortcut: 'T' },
  { id: 'eraser', label: 'Borrar', icon: Eraser, shortcut: 'E' },
];

// Templates de salas predefinidas
const ROOM_TEMPLATES = [
  { id: 'rf-room', name: 'R&F Room', icon: Stethoscope, desc: 'Sala de Rayos X / Fluoroscopia' },
  { id: 'ct-suite', name: 'CT Suite', icon: ScanLine, desc: 'Tomografia Computarizada' },
  { id: 'pet-ct', name: 'PET/CT', icon: Radiation, desc: 'PET/CT con blindaje FDG' },
  { id: 'linac-bunker', name: 'LINAC Bunker', icon: Cpu, desc: 'Acelerador lineal 6-18 MV' },
  { id: 'nuc-med', name: 'Nuclear Medicine', icon: Zap, desc: 'Medicina Nuclear I-131/Tc-99m' },
  { id: 'mammo', name: 'Mamografia', icon: Stethoscope, desc: 'Sala de mamografia' },
];

export default function CanvasArea2({
  canvasRef, containerRef, canvasState, setCanvasState, hoverInfo,
  onMouseDown, onMouseMove, onMouseUp, onWheel,
  onZoomToFit, onExportPNG, onDeleteSelected,
  activeTool, onToolChange, floorPlan, selectedId,
  onFloorPlanChange, onCalculate, onUAQ, onMemoriaAI,
  onQuickBarrier, onImportFloorPlan,
}: Props) {
  const { t } = useI18n();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      const map: Record<string, Tool> = { v: 'select', h: 'pan', b: 'barrier', s: 'source', r: 'rectangle', c: 'circle', t: 'text', e: 'eraser' };
      if (map[key]) { e.preventDefault(); onToolChange(map[key]); }
      if (key === 'delete' || key === 'backspace') onDeleteSelected();
      if (key === 'g') setCanvasState(p => ({ ...p, showGrid: !p.showGrid }));
      if (e.ctrlKey || e.metaKey) {
        if (key === '0') { e.preventDefault(); onZoomToFit(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onToolChange, onDeleteSelected, setCanvasState, onZoomToFit]);

  // Find selected object
  const selectedBarrier = selectedId ? (floorPlan?.barriers || []).find(b => b?.id === selectedId) : null;
  const selectedSource = selectedId ? (floorPlan?.sources || []).find(s => s?.id === selectedId) : null;

  const updateBarrier = useCallback((id: string, patch: Partial<Barrier>) => {
    if (!floorPlan) return;
    const newBarriers = (floorPlan.barriers || []).map(b =>
      b?.id === id ? { ...b, ...patch } : b
    );
    onFloorPlanChange({ ...floorPlan, barriers: newBarriers });
  }, [floorPlan, onFloorPlanChange]);

  const updateSource = useCallback((id: string, patch: Partial<RadiationSource>) => {
    if (!floorPlan) return;
    const newSources = (floorPlan.sources || []).map(s =>
      s?.id === id ? { ...s, ...patch } : s
    );
    onFloorPlanChange({ ...floorPlan, sources: newSources });
  }, [floorPlan, onFloorPlanChange]);

  // Load room template
  const loadTemplate = useCallback((templateId: string) => {
    if (!floorPlan) return;
    const safeScale = floorPlan.scale_m_per_pixel || 0.01;
    const px = (m: number) => m / safeScale;
    let newBarriers: Barrier[] = [];
    let newSources: RadiationSource[] = [];

    switch (templateId) {
      case 'rf-room': {
        const roomW = px(5);
        const roomH = px(6);
        newBarriers = [
          { id: `bar-${Date.now()}-1`, x1: 0, y1: 0, x2: roomW, y2: 0, name: 'Pared N', barrierType: 'primary', useFactor: 1, occupancyFactor: 0.2, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', thickness_mm: 0, leadEquivalence_mm: 0 },
          { id: `bar-${Date.now()}-2`, x1: roomW, y1: 0, x2: roomW, y2: roomH, name: 'Pared E', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: 0.2, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', thickness_mm: 0, leadEquivalence_mm: 0 },
          { id: `bar-${Date.now()}-3`, x1: roomW, y1: roomH, x2: 0, y2: roomH, name: 'Pared S', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: 0.2, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', thickness_mm: 0, leadEquivalence_mm: 0 },
          { id: `bar-${Date.now()}-4`, x1: 0, y1: roomH, x2: 0, y2: 0, name: 'Pared O', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: 0.2, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', thickness_mm: 0, leadEquivalence_mm: 0 },
        ];
        newSources = [
          { id: `src-${Date.now()}`, x: roomW / 2, y: roomH / 2, name: 'Tubo XR', modality: { id: 'xr-rf', name: 'XR R&F', unit: 'mA-min/wk', isocenterHeightDefault_m: 1.0, tvlData: {} }, workloadValue: 300, workloadUnit: 'mA-min/wk', isocenterHeight_m: 1.0, useFactor: 0.25, workloadHoursPerWeek: 40 },
        ];
        break;
      }
      case 'ct-suite': {
        const roomW = px(5);
        const roomH = px(6);
        newBarriers = [
          { id: `bar-${Date.now()}-1`, x1: 0, y1: 0, x2: roomW, y2: 0, name: 'Pared N', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: 0.2, designGoal_mSv_per_wk: 0.1, materialCode: 'CONCRETE235', thickness_mm: 0, leadEquivalence_mm: 0 },
          { id: `bar-${Date.now()}-2`, x1: roomW, y1: 0, x2: roomW, y2: roomH, name: 'Pared E', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: 0.2, designGoal_mSv_per_wk: 0.1, materialCode: 'CONCRETE235', thickness_mm: 0, leadEquivalence_mm: 0 },
          { id: `bar-${Date.now()}-3`, x1: roomW, y1: roomH, x2: 0, y2: roomH, name: 'Pared S', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: 0.2, designGoal_mSv_per_wk: 0.1, materialCode: 'CONCRETE235', thickness_mm: 0, leadEquivalence_mm: 0 },
          { id: `bar-${Date.now()}-4`, x1: 0, y1: roomH, x2: 0, y2: 0, name: 'Pared O', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: 0.2, designGoal_mSv_per_wk: 0.1, materialCode: 'CONCRETE235', thickness_mm: 0, leadEquivalence_mm: 0 },
        ];
        newSources = [
          { id: `src-${Date.now()}`, x: roomW / 2, y: roomH / 2, name: 'CT Gantry', modality: { id: 'ct', name: 'CT', unit: 'mGy-cm/wk', isocenterHeightDefault_m: 0.5, tvlData: {} }, workloadValue: 30000, workloadUnit: 'mGy-cm/wk', isocenterHeight_m: 0.5, useFactor: 0.25, workloadHoursPerWeek: 50 },
        ];
        break;
      }
      default: {
        toast.info('Template en desarrollo: ' + templateId);
        return;
      }
    }

    onFloorPlanChange({
      ...floorPlan,
      barriers: [...(floorPlan.barriers || []), ...newBarriers],
      sources: [...(floorPlan.sources || []), ...newSources],
    });
    toast.success(`Template cargado: ${ROOM_TEMPLATES.find(r => r.id === templateId)?.name || templateId}`);
    setShowTemplates(false);
  }, [floorPlan, onFloorPlanChange]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex-1 flex flex-col overflow-hidden bg-[#fafaf9] relative">

        {/* ═══ SMART TOP TOOLBAR (SmartDraw style) ═══ */}
        <div className="shrink-0 h-10 bg-white border-b border-slate-200 flex items-center px-2 gap-1 shadow-sm z-20">
          {/* Brand + Version */}
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-6 h-6 bg-[#f97316] rounded-md flex items-center justify-center">
              <Ruler className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 hidden md:inline">Canvas</span>
          </div>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* File actions */}
          <div className="flex items-center gap-0.5">
            <QuickBtn icon={Upload} label="Importar" onClick={onImportFloorPlan} />
            <QuickBtn icon={Download} label="Export PNG" onClick={onExportPNG} />
            <QuickBtn icon={FileDown} label="PDF" onClick={() => toast.info('PDF: use el menu principal')} />
          </div>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* View controls */}
          <div className="flex items-center gap-0.5">
            <QuickBtn icon={ZoomIn} label="Zoom In" onClick={() => setCanvasState(p => ({ ...p, scale: Math.min(20, p.scale * 1.2) }))} />
            <QuickBtn icon={ZoomOut} label="Zoom Out" onClick={() => setCanvasState(p => ({ ...p, scale: Math.max(0.05, p.scale / 1.2) }))} />
            <QuickBtn icon={Maximize} label="Fit" onClick={onZoomToFit} />
            <QuickBtn icon={Grid3X3} label="Grid" active={canvasState.showGrid} onClick={() => setCanvasState(p => ({ ...p, showGrid: !p.showGrid }))} />
          </div>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Templates */}
          <QuickBtn icon={Shapes} label="Templates" active={showTemplates} onClick={() => setShowTemplates(!showTemplates)} />
          <QuickBtn icon={Layers} label="Layers" onClick={() => {}} />

          <div className="flex-1" />

          {/* Right side: Zoom + Info */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{(canvasState.scale * 100).toFixed(0)}%</span>
            <span>Barreras: {floorPlan?.barriers?.length || 0}</span>
            <span>Fuentes: {floorPlan?.sources?.length || 0}</span>
            {hoverInfo && (
              <span className="text-[#f97316] font-mono bg-[#fff7ed] px-1.5 py-0.5 rounded">{hoverInfo}</span>
            )}
          </div>
        </div>

        {/* ═══ MAIN AREA: Sidebar + Canvas ═══ */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT TOOL PALETTE */}
          <div className={`shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ${sidebarCollapsed ? 'w-10' : 'w-14'}`}>
            <button
              className="h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-b border-slate-100"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
            <div className="flex-1 flex flex-col items-center py-2 gap-1 overflow-y-auto">
              {TOOLS.map(tool => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onToolChange(tool.id)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-[#f97316] text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="text-xs font-medium">{tool.label}</div>
                      {tool.shortcut && <div className="text-[10px] text-slate-400">{tool.shortcut}</div>}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <div className="border-t border-slate-100 py-1 flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onDeleteSelected} className="w-9 h-9 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Eliminar seleccionado (Del)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setCanvasState(p => ({ ...p, snapToGrid: !p.snapToGrid }))}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${canvasState.snapToGrid ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Snap to Grid</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* CANVAS CONTAINER */}
          <div className="flex-1 flex flex-col relative" ref={containerRef}>
            <div className="flex-1 relative overflow-hidden">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full block"
                style={{
                  cursor: activeTool === 'barrier' || activeTool === 'measure' ? 'crosshair' :
                         activeTool === 'pan' ? 'grab' :
                         activeTool === 'source' ? 'copy' :
                         activeTool === 'eraser' ? 'not-allowed' : 'default'
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onWheel={onWheel}
                onContextMenu={e => e.preventDefault()}
              />

              {/* Hover info overlay */}
              {hoverInfo && (
                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm rounded-md px-2.5 py-1 text-[10px] text-slate-600 border border-slate-200 shadow-sm z-10">
                  <span className="font-mono">{hoverInfo}</span>
                </div>
              )}

              {/* ═══ TEMPLATES PANEL ═══ */}
              {showTemplates && (
                <div className="absolute top-2 left-2 z-30 bg-white border rounded-lg shadow-lg p-3 w-64">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b">
                    <div className="flex items-center gap-1.5">
                      <Shapes className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-semibold text-slate-700">Templates de Sala</span>
                    </div>
                    <button onClick={() => setShowTemplates(false)} className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {ROOM_TEMPLATES.map(room => {
                      const Icon = room.icon;
                      return (
                        <button
                          key={room.id}
                          onClick={() => loadTemplate(room.id)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#fff7ed] transition text-left group"
                        >
                          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-[#f97316]/10">
                            <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#f97316]" />
                          </div>
                          <div>
                            <div className="text-[11px] font-medium text-slate-700 group-hover:text-[#f97316]">{room.name}</div>
                            <div className="text-[9px] text-slate-400">{room.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══ PROPERTIES PANEL (selected object) ═══ */}
              {selectedBarrier && (
                <div className="absolute top-2 right-2 z-30 bg-white border rounded-lg shadow-lg p-3 w-56">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b">
                    <span className="text-xs font-semibold text-slate-700">Propiedades — Barrera</span>
                    <button onClick={() => {}} className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-medium">Nombre</label>
                      <input
                        type="text"
                        value={selectedBarrier.name || ''}
                        onChange={e => updateBarrier(selectedBarrier.id!, { name: e.target.value })}
                        className="w-full text-[11px] border rounded px-1.5 py-1 mt-0.5 focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-medium">Tipo</label>
                        <select
                          value={selectedBarrier.barrierType || 'secondary'}
                          onChange={e => updateBarrier(selectedBarrier.id!, { barrierType: e.target.value as 'primary' | 'secondary' })}
                          className="w-full text-[10px] border rounded px-1 py-0.5 mt-0.5"
                        >
                          <option value="primary">Primaria</option>
                          <option value="secondary">Secundaria</option>
                          <option value="leakage">Fuga</option>
                          <option value="scatter">Scatter</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-medium">Uso</label>
                        <input
                          type="number"
                          step={0.05}
                          min={0}
                          max={1}
                          value={selectedBarrier.useFactor || 0.25}
                          onChange={e => updateBarrier(selectedBarrier.id!, { useFactor: parseFloat(e.target.value) })}
                          className="w-full text-[10px] border rounded px-1 py-0.5 mt-0.5"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-medium">Ocupacion</label>
                        <input
                          type="number"
                          step={0.05}
                          min={0}
                          max={1}
                          value={selectedBarrier.occupancyFactor || 0.2}
                          onChange={e => updateBarrier(selectedBarrier.id!, { occupancyFactor: parseFloat(e.target.value) })}
                          className="w-full text-[10px] border rounded px-1 py-0.5 mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-medium">Objetivo (mSv/wk)</label>
                        <input
                          type="number"
                          step={0.001}
                          value={selectedBarrier.designGoal_mSv_per_wk || 0.02}
                          onChange={e => updateBarrier(selectedBarrier.id!, { designGoal_mSv_per_wk: parseFloat(e.target.value) })}
                          className="w-full text-[10px] border rounded px-1 py-0.5 mt-0.5"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => { updateBarrier(selectedBarrier.id!, { thickness_mm: 0, leadEquivalence_mm: 0 }); }}
                      className="w-full mt-1 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition"
                    >
                      Reset Calculo
                    </button>
                  </div>
                </div>
              )}

              {selectedSource && (
                <div className="absolute top-2 right-2 z-30 bg-white border rounded-lg shadow-lg p-3 w-56">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b">
                    <span className="text-xs font-semibold text-slate-700">Propiedades — Fuente</span>
                    <button onClick={() => {}} className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-medium">Nombre</label>
                      <input
                        type="text"
                        value={selectedSource.name || ''}
                        onChange={e => updateSource(selectedSource.id!, { name: e.target.value })}
                        className="w-full text-[11px] border rounded px-1.5 py-1 mt-0.5 focus:ring-1 focus:ring-[#f97316] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-medium">Modalidad</label>
                      <input
                        type="text"
                        value={selectedSource.modality?.name || ''}
                        readOnly
                        className="w-full text-[10px] border rounded px-1.5 py-1 mt-0.5 bg-slate-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-medium">Workload</label>
                        <input
                          type="number"
                          value={selectedSource.workloadValue || 0}
                          onChange={e => updateSource(selectedSource.id!, { workloadValue: parseFloat(e.target.value) })}
                          className="w-full text-[10px] border rounded px-1 py-0.5 mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-medium">Factor Uso</label>
                        <input
                          type="number"
                          step={0.05}
                          min={0}
                          max={1}
                          value={selectedSource.useFactor || 0.25}
                          onChange={e => updateSource(selectedSource.id!, { useFactor: parseFloat(e.target.value) })}
                          className="w-full text-[10px] border rounded px-1 py-0.5 mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ BOTTOM QUICK ACTIONS DOCK ═══ */}
            <div className="shrink-0 h-12 bg-white border-t border-slate-200 flex items-center px-3 gap-1.5 z-20">
              <span className="text-[9px] text-slate-400 font-medium uppercase mr-1">Acciones:</span>
              <DockBtn icon={Play} label="Calcular Blindaje" color="#f97316" onClick={onCalculate} />
              <DockBtn icon={Calculator} label="UAQ" color="#10b981" onClick={onUAQ} />
              <DockBtn icon={FileText} label="Memoria AI" color="#8b5cf6" onClick={onMemoriaAI} />
              <DockBtn icon={Zap} label="Barrera Rapida" color="#f59e0b" onClick={onQuickBarrier} />
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <DockBtn icon={BookOpen} label="Guia" color="#64748b" onClick={() => toast.info('Guia de calculo desde croquis')} />
              <div className="flex-1" />
              <span className="text-[9px] text-slate-400">
                {floorPlan?.barriers?.length || 0} barreras | {floorPlan?.sources?.length || 0} fuentes
              </span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ─── Sub-components ─── */
function QuickBtn({ icon: Icon, label, onClick, active }: { icon: React.ComponentType<{className?: string}>; label: string; onClick?: () => void; active?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`h-7 px-2 rounded-md flex items-center gap-1 text-[10px] font-medium transition ${
            active
              ? 'bg-[#f97316] text-white'
              : 'text-slate-600 hover:bg-[#fff7ed] hover:text-[#f97316]'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function DockBtn({ icon: Icon, label, color, onClick }: { icon: React.ComponentType<{className?: string}>; label: string; color: string; onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 transition border border-slate-200"
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="hidden md:inline">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
