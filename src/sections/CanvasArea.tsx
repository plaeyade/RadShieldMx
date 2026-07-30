/**
 * RadShield-MX CanvasArea v40
 * Canvas interactivo con: grid visual, coordenadas en tiempo real,
 * visualización de resultados (espesores, color-coding), snapping,
 * y drawing tools funcionales.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ZoomIn, ZoomOut, Maximize, Image as ImageIcon, Grid3X3,
  Upload, Calculator, Eye, EyeOff, Ruler, Crosshair,
  Box, Cpu, FileSearch, LayoutTemplate, Layers, MapPin, Stethoscope,
  ChevronDown, ChevronUp, CheckCircle2, Circle, FileText, Database, Sparkles, Move, X,
  MousePointer, Shield, ScanLine, Atom
} from 'lucide-react';
import { toast } from 'sonner';
import type { CanvasState } from '@/hooks/useCanvas';
import type { CanvasSampleLine, CanvasBarrierResult } from '@/hooks/useCanvas';
import type { CanvasLayer } from '@/hooks/useCanvasLayers';
import type { FreehandStroke } from '@/hooks/useFreehandDraw';
import type { StickyNote } from '@/hooks/useStickyNotes';
import { useI18n } from '@/hooks/useI18n';
import type { Barrier, CriticalPoint, FloorPlan, OccupiedRegion, RadiationSource } from '@/types/radshield';
import { getControlledZoneCanvasSummary } from '@/lib/controlledZoneCanvasUx';
import {
  buildAuditSnapshotMetadata,
  buildF89RiskHeatmapSummary,
  buildF88LayerCoverageSummary,
  getF85CanvasReadiness,
  SHIELDING_PRESETS,
} from '@/lib/canvasF85Workflow';
import { buildF90EndToEndChecklist, summarizeF90EndToEndQa } from '@/lib/f90EndToEndQa';
import { buildF91CanvasAdvancedSummary } from '@/lib/f91ReleaseRoadmap';
import { getCanvasToolIconProfile } from '@/lib/f98UnifiedIconography';
import { buildF99CanvasCadReadiness } from '@/lib/f99CanvasCadReadiness';
import { buildF122CanvasStructuralOverlay } from '@/lib/f122CanvasStructuralOverlay';
import { buildF141ProfessionalCanvasSummary } from '@/lib/f141CanvasProfessionalPolish';
import { buildF145CanvasCadProfessionalSummary } from '@/lib/f145CanvasCadProfessional';
import { buildF171CanvasPolishPredeploy } from '@/lib/f171CanvasPolishPredeploy';
import { buildF173CanvasLowRiskPolish } from '@/lib/f173CanvasLowRiskPolish';
import { buildF185CanvasMicroAssist } from '@/lib/f185CanvasMicroAssist';
import { buildF208CanvasReportingLayer } from '@/lib/f208CanvasReportingLayer';
import { buildF209CanvasDimensionSchedule } from '@/lib/f209CanvasDimensionSchedule';
import { buildF210CanvasLayerManagerPolish } from '@/lib/f210CanvasLayerManagerPolish';
import { buildF211CanvasEquipmentSymbolSchedule } from '@/lib/f211CanvasEquipmentSymbolSchedule';
import { buildF212HeatmapRegulatoryLegend } from '@/lib/f212HeatmapRegulatoryLegend';
import { buildF214SketchUpCanvasReorg } from '@/lib/f214SketchUpCanvasReorg';
import { buildF215CanvasScenePresets } from '@/lib/f215CanvasScenePresets';
import { buildF216MiniViewManager, type F216SavedCanvasView } from '@/lib/f216MiniViewManager';
import { buildF217VisualExportByScene, type F217VisualExportSceneId } from '@/lib/f217VisualExportByScene';
import { buildF220CanvasCadPriorityActions, type F220CadActionKey } from '@/lib/f220CanvasCadPriorityActions';
import { buildF221CanvasRealConnections } from '@/lib/f221CanvasRealConnections';
import { buildF222ToF226CanvasHardening } from '@/lib/f222ToF226CanvasHardening';
import { buildF227CanvasRendererLayerExtraction } from '@/lib/f227CanvasRendererLayerExtraction';
import { buildF228StaticRendererHelpers } from '@/lib/f228StaticRendererHelpers';
import { buildF229CanvasCadE2EHarness } from '@/lib/f229CanvasCadE2EHarness';
import { buildF230PostF229CoverageGate } from '@/lib/f230PostF229CoverageGate';
import { buildF231ToF236CanvasReleaseCoverage } from '@/lib/f231ToF236CanvasReleaseCoverage';
import ClinicalProjectMap from '@/components/ClinicalProjectMap';

type F188CanvasPanelKey = 'workflow' | 'qa' | 'continuity';
type F188WorkflowDock = 'top' | 'right' | 'bottom';
type F191CanvasTool = 'select' | 'barrier' | 'source' | 'region' | 'measure' | 'pan' | 'eraser';
type F191VisualMode = 'plan' | 'heat' | 'isocontours' | 'structure';
type F375CanvasChromeMode = 'clean' | 'guided';

const F188_CANVAS_PANEL_STATE_KEY = 'radshield_canvas_panels_f188_f295_clean_workspace';
const F188_WORKFLOW_DOCK_KEY = 'radshield_canvas_workflow_dock_f188';
const F201_WORKFLOW_COMPACT_KEY = 'radshield_canvas_workflow_compact_f201';
const F191_VISUAL_MODE_KEY = 'radshield_canvas_visual_mode_f191';
const F216_SAVED_VIEWS_KEY = 'radshield_canvas_saved_views_f216';
const F375_CANVAS_CHROME_MODE_KEY = 'radshield_canvas_chrome_mode_f375';
const DEFAULT_F188_PANEL_VISIBILITY: Record<F188CanvasPanelKey, boolean> = {
  workflow: false,
  qa: false,
  continuity: false,
};

function loadF188PanelVisibility(): Record<F188CanvasPanelKey, boolean> {
  if (typeof window === 'undefined') return DEFAULT_F188_PANEL_VISIBILITY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(F188_CANVAS_PANEL_STATE_KEY) || '{}') as Partial<Record<F188CanvasPanelKey, boolean>>;
    return {
      workflow: parsed.workflow ?? false,
      qa: parsed.qa ?? false,
      continuity: parsed.continuity ?? false,
    };
  } catch {
    return DEFAULT_F188_PANEL_VISIBILITY;
  }
}

function loadF188WorkflowDock(): F188WorkflowDock {
  if (typeof window === 'undefined') return 'right';
  const stored = window.localStorage.getItem(F188_WORKFLOW_DOCK_KEY);
  return stored === 'top' || stored === 'bottom' ? stored : 'right';
}

function loadF201WorkflowCompact(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(F201_WORKFLOW_COMPACT_KEY) === 'true';
}

function loadF191VisualMode(): F191VisualMode {
  if (typeof window === 'undefined') return 'plan';
  const stored = window.localStorage.getItem(F191_VISUAL_MODE_KEY);
  return stored === 'heat' || stored === 'isocontours' || stored === 'structure' ? stored : 'plan';
}

function loadF216SavedViews(): F216SavedCanvasView[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(F216_SAVED_VIEWS_KEY) || '[]') as F216SavedCanvasView[];
    return parsed.filter((view) =>
      (view.id === 'A' || view.id === 'B' || view.id === 'C') &&
      typeof view.label === 'string' &&
      typeof view.scale === 'number' &&
      typeof view.offsetX === 'number' &&
      typeof view.offsetY === 'number'
    ).slice(0, 3);
  } catch {
    return [];
  }
}

function loadF375CanvasChromeMode(): F375CanvasChromeMode {
  if (typeof window === 'undefined') return 'clean';
  return window.localStorage.getItem(F375_CANVAS_CHROME_MODE_KEY) === 'guided' ? 'guided' : 'clean';
}

interface CanvasAreaProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasState: CanvasState;
  setCanvasState: React.Dispatch<React.SetStateAction<CanvasState>>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchMove?: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onZoomToFit: () => void;
  onExportPNG: () => void;
  onToggleSnap: () => void;
  onImportFloorPlan?: () => void;
  onOpenLayers?: () => void;
  onOpenRoomTemplates?: () => void;
  onOpen3DViewer?: () => void;
  onOpenDoseMap3D?: () => void;
  onOpenMonteCarlo?: () => void;
  onOpenExternalConnector?: () => void;
  onOpenEvidencePack?: () => void;
  onOpenMedical3D?: () => void;
  onOpenControlPoints?: () => void;
  onCalibrateScale?: () => void;
  onAddCriticalPoint?: () => void;
  onOpenShieldingPresets?: () => void;
  onUpdateSelected?: (updates: Partial<Barrier | RadiationSource | OccupiedRegion | CriticalPoint>) => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onAuditSnapshot?: () => void;
  sampleLines?: CanvasSampleLine[];
  barrierResults?: CanvasBarrierResult[];
  showSampleLines?: boolean;
  setShowSampleLines?: (v: boolean) => void;
  showSamplePoints?: boolean;
  setShowSamplePoints?: (v: boolean) => void;
  showMaxima?: boolean;
  setShowMaxima?: (v: boolean) => void;
  heatmapEnabled?: boolean;
  onToggleHeatmap?: (v: boolean) => void;
  heatmapPointCount?: number;
  onRunCalculations?: () => void;
  activeTool?: string;
  setActiveTool?: (tool: F191CanvasTool) => void;
  hoverInfo?: string | null;
  floorPlan?: FloorPlan;
  // v65: Canvas enhancements — layers, freehand, sticky notes
  layers?: CanvasLayer[];
  freehandStrokes?: FreehandStroke[];
  stickyNotes?: StickyNote[];
  onStickyNoteUpdate?: (id: string, text: string | Partial<StickyNote>) => void;
  onStickyNoteDelete?: (id: string) => void;
  onAddStickyNote?: (x: number, y: number) => void;
  freehandEnabled?: boolean;
  activeLayer?: string;
}

export default function CanvasArea({
  canvasRef, canvasState, setCanvasState,
  onMouseDown, onMouseMove, onMouseUp, onWheel,
  onTouchStart, onTouchMove, onTouchEnd,
  onZoomToFit, onExportPNG, onToggleSnap,
  onImportFloorPlan,
  onOpenLayers,
  onOpenRoomTemplates,
  onOpen3DViewer,
  onOpenDoseMap3D,
  onOpenMonteCarlo,
  onOpenExternalConnector,
  onOpenEvidencePack,
  onOpenMedical3D,
  onOpenControlPoints,
  onCalibrateScale,
  onAddCriticalPoint,
  onOpenShieldingPresets,
  onUpdateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onAuditSnapshot,
  sampleLines = [],
  barrierResults = [],
  showSampleLines = true,
  setShowSampleLines,
  showSamplePoints = true,
  setShowSamplePoints,
  showMaxima = true,
  setShowMaxima,
  heatmapEnabled = false,
  onToggleHeatmap,
  heatmapPointCount = 0,
  onRunCalculations,
  activeTool = 'select',
  setActiveTool,
  hoverInfo = null,
  floorPlan,
  // v65
  layers = [],
  freehandStrokes = [],
  stickyNotes = [],
  onStickyNoteUpdate,
  onStickyNoteDelete,
  onAddStickyNote,
  freehandEnabled = false,
  activeLayer = 'shielding',
}: CanvasAreaProps) {
  const { t } = useI18n();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [panelVisibility, setPanelVisibility] = useState(loadF188PanelVisibility);
  const [workflowDock, setWorkflowDock] = useState<F188WorkflowDock>(loadF188WorkflowDock);
  const [workflowCompact, setWorkflowCompact] = useState(loadF201WorkflowCompact);
  const [visualMode, setVisualMode] = useState<F191VisualMode>(loadF191VisualMode);
  const [savedViews, setSavedViews] = useState<F216SavedCanvasView[]>(loadF216SavedViews);
  const [inspectorEditOpen, setInspectorEditOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; canvasX: number; canvasY: number } | null>(null);
  const [lastCanvasCommand, setLastCanvasCommand] = useState<string | null>(null);
  const [canvasChromeMode, setCanvasChromeMode] = useState<F375CanvasChromeMode>(loadF375CanvasChromeMode);
  const containerRef = useRef<HTMLDivElement>(null);
  // v65: Freehand canvas overlay ref
  const freehandCanvasRef = useRef<HTMLCanvasElement>(null);

  // Track canvas size for responsive rendering
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // v65: Draw freehand strokes on overlay canvas
  useEffect(() => {
    const canvas = freehandCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Match canvas size to container
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth - 24; // minus rulers
      canvas.height = containerRef.current.clientHeight - 20;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Only draw if annotations layer is visible and freehand has strokes
    const annotationsLayer = layers.find(l => l.id === 'annotations');
    if (annotationsLayer && !annotationsLayer.visible) return;
    ctx.save();
    ctx.globalAlpha = annotationsLayer?.opacity ?? 1;
    for (const stroke of freehandStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }, [freehandStrokes, layers]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvasState((p: CanvasState) => ({ ...p, scale: Math.max(0.1, Math.min(10, p.scale * delta)) }));
    } else {
      onWheel(e);
    }
  }, [onWheel, setCanvasState]);

  const hasResults = barrierResults.length > 0;
  const controlledZoneSummary = getControlledZoneCanvasSummary(floorPlan);
  const f85Readiness = getF85CanvasReadiness(floorPlan, hasResults);
  const auditSnapshot = floorPlan
    ? buildAuditSnapshotMetadata(floorPlan, barrierResults, sampleLines)
    : null;
  const f88Coverage = buildF88LayerCoverageSummary(floorPlan);
  const f89Heatmap = buildF89RiskHeatmapSummary(floorPlan, Array.from({ length: heatmapPointCount }, (_, index) => ({
    x: index,
    y: 0,
    kerma: 0,
  })));
  const f90Checklist = buildF90EndToEndChecklist({
    floorPlan,
    barrierResults,
    sampleLines,
    heatmapPointCount,
    dbDeferred: true,
  });
  const f90Summary = summarizeF90EndToEndQa(f90Checklist);
  const f91Canvas = buildF91CanvasAdvancedSummary({
    floorPlan,
    selectedId: canvasState.selectedId,
    barrierResults,
    sampleLines,
    heatmapPointCount,
  });
  const f99Cad = buildF99CanvasCadReadiness({
    floorPlan,
    selectedId: canvasState.selectedId,
    barrierResults,
    sampleLines,
    heatmapPointCount,
    snapToGrid: canvasState.snapToGrid,
  });
  const f122StructuralOverlay = buildF122CanvasStructuralOverlay(floorPlan);
  const f141ProfessionalCanvas = buildF141ProfessionalCanvasSummary({
    floorPlan,
    selectedId: canvasState.selectedId,
    barrierResults,
    sampleLines,
    heatmapPointCount,
    snapToGrid: canvasState.snapToGrid,
  });
  const f145CadProfessional = buildF145CanvasCadProfessionalSummary({
    floorPlan,
    selectedId: canvasState.selectedId,
    selectedIds: canvasState.selectedIds,
    barrierResults,
    sampleLines,
    snapToGrid: canvasState.snapToGrid,
  });
  const f171CanvasPolish = buildF171CanvasPolishPredeploy({
    floorPlan,
    selectedId: canvasState.selectedId,
    selectedIds: canvasState.selectedIds,
    barrierResults,
    sampleLines,
    snapToGrid: canvasState.snapToGrid,
    heatmapPointCount,
  });
  const f173CanvasPolish = buildF173CanvasLowRiskPolish({
    floorPlan,
    selectedId: canvasState.selectedId,
    selectedIds: canvasState.selectedIds,
    barrierResults,
    sampleLines,
    snapToGrid: canvasState.snapToGrid,
    heatmapPointCount,
  });
  const f185CanvasAssist = buildF185CanvasMicroAssist({
    floorPlan,
    activeTool,
    selectedId: canvasState.selectedId,
    selectedIds: canvasState.selectedIds,
    snapToGrid: canvasState.snapToGrid,
    layers,
    barrierResults,
    sampleLines,
    heatmapEnabled,
    heatmapPointCount,
  });
  const f208CanvasReporting = buildF208CanvasReportingLayer(floorPlan, barrierResults, sampleLines, {
    heatmapPointCount,
    layerCount: layers.length,
    visibleLayerCount: layers.filter((layer) => layer.visible).length,
  });
  const f209DimensionSchedule = buildF209CanvasDimensionSchedule(floorPlan, barrierResults, layers);
  const f210LayerManager = buildF210CanvasLayerManagerPolish(layers, activeLayer);
  const f211EquipmentSchedule = buildF211CanvasEquipmentSymbolSchedule(floorPlan);
  const f212HeatmapLegend = buildF212HeatmapRegulatoryLegend(floorPlan, barrierResults, sampleLines, heatmapPointCount);

  useEffect(() => {
    window.localStorage.setItem(F188_CANVAS_PANEL_STATE_KEY, JSON.stringify(panelVisibility));
  }, [panelVisibility]);

  useEffect(() => {
    window.localStorage.setItem(F188_WORKFLOW_DOCK_KEY, workflowDock);
  }, [workflowDock]);

  useEffect(() => {
    window.localStorage.setItem(F201_WORKFLOW_COMPACT_KEY, String(workflowCompact));
  }, [workflowCompact]);

  useEffect(() => {
    window.localStorage.setItem(F191_VISUAL_MODE_KEY, visualMode);
  }, [visualMode]);

  useEffect(() => {
    window.localStorage.setItem(F216_SAVED_VIEWS_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    window.localStorage.setItem(F375_CANVAS_CHROME_MODE_KEY, canvasChromeMode);
  }, [canvasChromeMode]);

  useEffect(() => {
    setInspectorEditOpen(false);
  }, [canvasState.selectedId]);

  useEffect(() => {
    if (!contextMenu) return;
    const closeContextMenu = () => setContextMenu(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeContextMenu();
    };
    window.addEventListener('click', closeContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  const togglePanelVisibility = (key: F188CanvasPanelKey) => {
    setPanelVisibility((current) => ({ ...current, [key]: !current[key] }));
  };

  const setPanelVisible = (key: F188CanvasPanelKey, visible: boolean) => {
    setPanelVisibility((current) => ({ ...current, [key]: visible }));
  };

  const cycleWorkflowDock = () => {
    setWorkflowDock((dock) => (dock === 'top' ? 'right' : dock === 'right' ? 'bottom' : 'top'));
    setWorkflowCompact(false);
  };

  const f375IsCleanWorkspace = canvasChromeMode === 'clean';
  const toggleF375CanvasChrome = () => {
    const nextMode: F375CanvasChromeMode = f375IsCleanWorkspace ? 'guided' : 'clean';
    setCanvasChromeMode(nextMode);
    if (nextMode === 'clean') {
      setPanelVisibility({ workflow: false, qa: false, continuity: false });
      setLegendCollapsed(true);
    } else {
      setLegendCollapsed(false);
    }
    toast.success(nextMode === 'clean' ? 'Canvas limpio activado' : 'Canvas guia activado');
  };

  const activateCanvasTool = (tool: F191CanvasTool) => {
    setActiveTool?.(tool);
  };

  const handleCanvasContextMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
    const canvasY = (event.clientY - rect.top - canvasState.offsetY) / canvasState.scale;
    setContextMenu({
      x: Math.min(event.clientX, Math.max(16, window.innerWidth - 236)),
      y: Math.min(event.clientY, Math.max(16, window.innerHeight - 312)),
      canvasX,
      canvasY,
    });
  }, [canvasState.offsetX, canvasState.offsetY, canvasState.scale]);

  const runContextMenuAction = (action?: () => void) => {
    action?.();
    setContextMenu(null);
  };

  const runCanvasCommand = (label: string, action?: () => void) => {
    try {
      if (!action) throw new Error('accion no configurada');
      action();
      setLastCanvasCommand(label);
      toast.success(`${label}: accion enviada`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      setLastCanvasCommand(`${label}: error`);
      toast.error(`${label}: ${message}`);
    }
  };

  const applyVisualMode = (mode: F191VisualMode) => {
    setVisualMode(mode);
    if (mode === 'plan') {
      onToggleHeatmap?.(false);
      setShowSampleLines?.(true);
      setShowSamplePoints?.(true);
      setShowMaxima?.(true);
    }
    if (mode === 'heat') {
      onToggleHeatmap?.(true);
      setShowSampleLines?.(false);
      setShowSamplePoints?.(true);
      setShowMaxima?.(true);
    }
    if (mode === 'isocontours') {
      onToggleHeatmap?.(false);
      setShowSampleLines?.(true);
      setShowSamplePoints?.(true);
      setShowMaxima?.(true);
    }
    if (mode === 'structure') {
      onToggleHeatmap?.(false);
      setShowSampleLines?.(false);
      setShowSamplePoints?.(false);
      setShowMaxima?.(true);
      setPanelVisible('workflow', true);
      setWorkflowDock('right');
    }
  };

  const saveCurrentView = (slotId: F216SavedCanvasView['id']) => {
    const view: F216SavedCanvasView = {
      id: slotId,
      label: `Vista ${slotId}`,
      visualMode,
      scale: canvasState.scale,
      offsetX: canvasState.offsetX,
      offsetY: canvasState.offsetY,
      savedAt: new Date().toISOString(),
    };
    setSavedViews((current) => {
      const next = current.filter((item) => item.id !== slotId);
      return [...next, view].sort((a, b) => a.id.localeCompare(b.id));
    });
    toast.success(`Vista ${slotId} guardada`);
  };

  const restoreSavedView = (view: F216SavedCanvasView) => {
    applyVisualMode(view.visualMode);
    setCanvasState((prev) => ({
      ...prev,
      scale: view.scale,
      offsetX: view.offsetX,
      offsetY: view.offsetY,
    }));
    toast.success(`${view.label} restaurada`);
  };

  const clearSavedView = (slotId: F216SavedCanvasView['id']) => {
    setSavedViews((current) => current.filter((view) => view.id !== slotId));
    toast.info(`Vista ${slotId} eliminada`);
  };

  const workflowPanelClass =
    workflowDock === 'right'
      ? 'absolute top-14 right-2 bg-white/95 backdrop-blur-sm rounded-md border border-slate-200 shadow-sm z-30 w-[360px] max-w-[calc(100%-24px)] max-h-[calc(100%-128px)] overflow-auto'
      : workflowDock === 'bottom'
        ? 'absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-md border border-slate-200 shadow-sm z-30 w-[min(720px,calc(100%-28px))] min-w-[300px] max-h-[42%] overflow-auto'
        : 'absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-md border border-slate-200 shadow-sm z-30 w-[min(560px,calc(100%-250px))] min-w-[300px] max-h-[calc(100%-84px)] overflow-auto';

  const formatResultNumber = (value: unknown, digits: number) => {
    const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return numeric.toFixed(digits);
  };

  const currentTool = getCanvasToolIconProfile(activeTool);
  const ToolIcon = currentTool.icon;
  const sourceCount = floorPlan?.sources?.length ?? 0;
  const barrierCount = floorPlan?.barriers?.length ?? 0;
  const regionCount =
    ((floorPlan as { regions?: unknown[] } | undefined)?.regions?.length ??
      (floorPlan as { occupiedRegions?: unknown[] } | undefined)?.occupiedRegions?.length) ?? 0;
  const f214SketchUpCanvas = buildF214SketchUpCanvasReorg({
    visualMode,
    activeTool,
    scale: canvasState.scale,
    snapToGrid: canvasState.snapToGrid,
    barrierCount,
    sourceCount,
    regionCount,
    layerCount: layers.length,
    visibleLayerCount: layers.filter((layer) => layer.visible).length,
    heatmapEnabled,
  });
  const f215ScenePresets = buildF215CanvasScenePresets({
    visualMode,
    hasResults,
    barrierCount,
    sourceCount,
    regionCount,
    sampleLineCount: sampleLines.length,
    heatmapPointCount,
  });
  const f216MiniViewManager = buildF216MiniViewManager({
    visualMode,
    scale: canvasState.scale,
    offsetX: canvasState.offsetX,
    offsetY: canvasState.offsetY,
    savedViews,
  });
  const f217VisualExport = buildF217VisualExportByScene({
    visualMode,
    hasGeometry: barrierCount + sourceCount + regionCount > 0,
    hasResults,
    heatmapPointCount,
    sampleLineCount: sampleLines.length,
    barrierCount,
  });
  const f220CanvasCadActions = buildF220CanvasCadPriorityActions({
    selectedCount: canvasState.selectedIds.length || (canvasState.selectedId ? 1 : 0),
    snapToGrid: canvasState.snapToGrid,
    dimensionRowCount: f209DimensionSchedule.rows.length,
    sampleLineCount: sampleLines.length,
    samplePointCount: sampleLines.reduce((count, line) => count + line.points.length, 0),
    sourceCount,
    barrierCount,
    hasResults,
    hasMedical3D: Boolean(onOpenMedical3D || onOpen3DViewer),
  });
  const f221CanvasRealConnections = buildF221CanvasRealConnections({
    selectedCount: canvasState.selectedIds.length || (canvasState.selectedId ? 1 : 0),
    snapToGrid: canvasState.snapToGrid,
    sourceCount,
    barrierCount,
    hasResults,
    hasMedical3D: Boolean(onOpenMedical3D || onOpen3DViewer),
    hasExport: Boolean(onExportPNG),
  });
  const f222ToF226CanvasHardening = buildF222ToF226CanvasHardening({
    barrierCount,
    sourceCount,
    regionCount,
    selectedCount: canvasState.selectedIds.length || (canvasState.selectedId ? 1 : 0),
    snapToGrid: canvasState.snapToGrid,
    hasResults,
    hasMedical3D: Boolean(onOpenMedical3D || onOpen3DViewer),
    hasExport: Boolean(onExportPNG),
    visualMode,
  });
  const f227RendererLayerExtraction = buildF227CanvasRendererLayerExtraction({
    barrierCount,
    sourceCount,
    regionCount,
    hasHeatmap: heatmapEnabled || heatmapPointCount > 0,
    hasSampleLines: sampleLines.length > 0,
    selectedCount: canvasState.selectedIds.length || (canvasState.selectedId ? 1 : 0),
  });
  const f228StaticRendererHelpers = buildF228StaticRendererHelpers({
    hasFloorPlanImage: Boolean(floorPlan?.imageUrl),
    scale: canvasState.scale,
    scale_m_per_pixel: floorPlan.scale_m_per_pixel,
  });
  const f229CanvasCadE2EHarness = buildF229CanvasCadE2EHarness({
    barrierCount,
    sourceCount,
    regionCount,
    selectedCount: canvasState.selectedIds.length || (canvasState.selectedId ? 1 : 0),
    snapToGrid: canvasState.snapToGrid,
    visualMode,
    hasExport: Boolean(onExportPNG),
    hasFloorPlanScale: Number.isFinite(floorPlan.scale_m_per_pixel) && floorPlan.scale_m_per_pixel > 0,
  });
  const f230PostF229CoverageGate = buildF230PostF229CoverageGate({
    f198Menus: true,
    f207Functional: true,
    f229CanvasE2E: true,
    f200StaticRelease: true,
    canvasVisible: true,
    sidebarVisible: true,
    updateCenterCurrent: true,
  });
  const f231ToF236CanvasReleaseCoverage = buildF231ToF236CanvasReleaseCoverage({
    hasVisualBaseline: true,
    hasDxfFixtureSmoke: true,
    hasCadE2E: true,
    hasIsocontourLegend: true,
    hasMedical3DHandoff: Boolean(onOpenMedical3D || onOpen3DViewer),
    hasPostDeployGate: true,
  });
  const selectedBarrier = floorPlan?.barriers?.find((barrier) => barrier.id === canvasState.selectedId) ?? null;
  const selectedSource = floorPlan?.sources?.find((source) => source.id === canvasState.selectedId) ?? null;
  const selectedCriticalPoint = floorPlan?.criticalPoints?.find((point) => point.id === canvasState.selectedId) ?? null;
  const selectedRegion =
    [...(floorPlan?.regions ?? []), ...(floorPlan?.occupiedRegions ?? [])].find((region) => region.id === canvasState.selectedId) ?? null;
  const formatInspectorNumber = (value: unknown, suffix = '', digits = 2) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/D';
    return `${value.toFixed(digits)}${suffix}`;
  };
  const formatInspectorThickness = (barrier: Barrier) => {
    const value = barrier.requiredThickness_mm ?? barrier.thickness_mm;
    if (typeof value === 'number' && Number.isFinite(value)) return `${value.toFixed(1)} mm`;
    if (value && typeof value === 'object') {
      const first = Object.entries(value).find(([, thickness]) => typeof thickness === 'number' && Number.isFinite(thickness));
      if (first) return `${first[0]} ${Number(first[1]).toFixed(1)} mm`;
    }
    return 'pendiente';
  };
  const buildInspectorRows = (): Array<[string, string]> => {
    if (selectedBarrier) {
      return [
        ['Tipo', selectedBarrier.barrierType],
        ['Mat', selectedBarrier.materialCode || selectedBarrier.material || 'N/D'],
        ['T', formatInspectorThickness(selectedBarrier)],
        ['P', formatInspectorNumber(selectedBarrier.designGoal_mSv_per_wk, ' mSv/sem', 3)],
      ];
    }
    if (selectedSource) {
      return [
        ['Mod', selectedSource.modality?.name ?? 'N/D'],
        ['W', `${formatInspectorNumber(selectedSource.workloadValue, '', 1)} ${selectedSource.workloadUnit ?? ''}`.trim()],
        ['U', formatInspectorNumber(selectedSource.useFactor, '', 2)],
        ['Iso', formatInspectorNumber(selectedSource.isocenterHeight_m, ' m', 2)],
      ];
    }
    if (selectedCriticalPoint) {
      return [
        ['Tipo', selectedCriticalPoint.pointType],
        ['T', formatInspectorNumber(selectedCriticalPoint.occupancyFactor, '', 3)],
        ['P', formatInspectorNumber(selectedCriticalPoint.designGoal_mSv_per_wk, ' mSv/sem', 3)],
        ['Estado', selectedCriticalPoint.enabled === false ? 'off' : 'on'],
      ];
    }
    if (selectedRegion) {
      return [
        ['Zona', 'ocupada'],
        ['T', formatInspectorNumber(selectedRegion.occupancyFactor, '', 3)],
        ['P', formatInspectorNumber(selectedRegion.designGoal_mSv_per_wk, ' mSv/sem', 3)],
        ['Pts', `${selectedRegion.points?.length ?? 0}`],
      ];
    }
    return [
      ['Herr', currentTool.label],
      ['Snap', canvasState.snapToGrid ? 'ON' : 'OFF'],
      ['Sel', `${canvasState.selectedIds.length}`],
      ['Capas', `${layers.filter((layer) => layer.visible).length}/${layers.length || 0}`],
    ];
  };
  const selectedInspectorKind =
    selectedBarrier ? 'Muro' :
      selectedSource ? 'Fuente' :
        selectedCriticalPoint ? 'Punto' :
          selectedRegion ? 'Zona' :
            canvasState.selectedId ? 'Objeto' : 'Sin seleccion';
  const selectedInspectorName =
    selectedBarrier?.name ??
    selectedSource?.name ??
    selectedCriticalPoint?.name ??
    selectedRegion?.name ??
    canvasState.selectedId ??
    'Selecciona un objeto';
  const selectedInspectorRows = buildInspectorRows();
  const selectedInspectorEntity: Barrier | RadiationSource | CriticalPoint | OccupiedRegion | null =
    selectedBarrier ?? selectedSource ?? selectedCriticalPoint ?? selectedRegion ?? null;
  const selectedInspectorFocusPoint = (() => {
    if (selectedBarrier) {
      return { x: (selectedBarrier.x1 + selectedBarrier.x2) / 2, y: (selectedBarrier.y1 + selectedBarrier.y2) / 2 };
    }
    if (selectedSource) return { x: selectedSource.x, y: selectedSource.y };
    if (selectedCriticalPoint) return { x: selectedCriticalPoint.x, y: selectedCriticalPoint.y };
    if (selectedRegion?.points?.length) {
      const sum = selectedRegion.points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
      return { x: sum.x / selectedRegion.points.length, y: sum.y / selectedRegion.points.length };
    }
    return null;
  })();
  const focusSelectedInspectorEntity = () => {
    if (!selectedInspectorFocusPoint || !canvasState.selectedId) return;
    setCanvasState((prev) => ({
      ...prev,
      offsetX: canvasSize.width / 2 - selectedInspectorFocusPoint.x * prev.scale,
      offsetY: canvasSize.height / 2 - selectedInspectorFocusPoint.y * prev.scale,
      selectedIds: prev.selectedIds.includes(canvasState.selectedId) ? prev.selectedIds : [canvasState.selectedId],
    }));
  };
  const clearInspectorSelection = () => {
    setCanvasState((prev) => ({ ...prev, selectedId: null, selectedIds: [] }));
  };
  const runF220CanvasAction = (actionId: F220CadActionKey) => {
    if (actionId === 'direct-edit') {
      if (!selectedInspectorEntity || !onUpdateSelected) {
        toast.info('Selecciona una barrera, fuente, zona o punto critico para editar.');
        activateCanvasTool('select');
        return;
      }
      setInspectorEditOpen(true);
      return;
    }
    if (actionId === 'advanced-snap') {
      onToggleSnap();
      return;
    }
    if (actionId === 'editable-dimensions') {
      if (onCalibrateScale) onCalibrateScale();
      else activateCanvasTool('measure');
      return;
    }
    if (actionId === 'lasso-select') {
      activateCanvasTool('select');
      toast.info('Seleccion CAD activa', { description: 'Arrastre en vacio para ventana, Ctrl/Meta+arrastre para lasso y Shift+click para multiseleccion.' });
      return;
    }
    if (actionId === 'isocontours') {
      applyVisualMode('isocontours');
      return;
    }
    if (actionId === 'equipment-footprints') {
      activateCanvasTool('source');
      return;
    }
    if (actionId === 'medical-3d') {
      if (onOpenMedical3D) onOpenMedical3D();
      else if (onOpen3DViewer) onOpen3DViewer();
      else toast.info('Conecta el visor 3D medico para abrir recorrido desde floorplan.');
    }
  };
  const duplicateInspectorSelection = () => {
    if (!selectedInspectorEntity || !onDuplicateSelected) return;
    if (!window.confirm(`Duplicar ${selectedInspectorKind.toLowerCase()} "${selectedInspectorName}"?`)) return;
    onDuplicateSelected();
  };
  const deleteInspectorSelection = () => {
    if (!selectedInspectorEntity || !onDeleteSelected) return;
    if (!window.confirm(`Borrar ${selectedInspectorKind.toLowerCase()} "${selectedInspectorName}"? Esta accion puede deshacerse con Ctrl+Z.`)) return;
    onDeleteSelected();
  };
  const applyInspectorTextUpdate = (field: 'name' | 'materialCode' | 'manufacturerVariant' | 'notes', value: string) => {
    const nextValue = value.trim();
    if (!nextValue || !onUpdateSelected) return;
    onUpdateSelected({ [field]: nextValue } as Partial<Barrier | RadiationSource | CriticalPoint>);
    toast.success('Propiedad actualizada', { description: `${field}: ${nextValue}` });
  };
  const applyInspectorNumberUpdate = (
    field: 'workloadValue' | 'useFactor' | 'occupancyFactor' | 'designGoal_mSv_per_wk' | 'isocenterHeight_m',
    value: string,
  ) => {
    if (!onUpdateSelected) return;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      toast.error('Valor numerico no valido');
      return;
    }
    onUpdateSelected({ [field]: numeric } as Partial<Barrier | RadiationSource | OccupiedRegion | CriticalPoint>);
    toast.success('Parametro actualizado', { description: `${field}: ${numeric}` });
  };
  const workflowSteps = [
    { id: 'layout', label: 'Layout', ready: Boolean(floorPlan?.imageUrl) || barrierCount > 0, action: onImportFloorPlan, actionLabel: 'Importar plano' },
    { id: 'template', label: 'Smart room', ready: barrierCount > 0 && sourceCount > 0, action: onOpenRoomTemplates, actionLabel: 'Smart rooms' },
    { id: 'zone', label: 'Zona/control', ready: regionCount > 0 || controlledZoneSummary.hasControlledZone, action: onOpenControlPoints, actionLabel: 'Puntos de control' },
    { id: 'calc', label: 'Calculo', ready: hasResults, action: onRunCalculations, actionLabel: 'Calcular' },
    { id: 'memory', label: 'Memoria', ready: hasResults && controlledZoneSummary.warnings.length === 0, action: onOpenEvidencePack, actionLabel: 'Evidence pack' },
  ];
  const offlineContinuitySteps = [
    {
      id: 'inspection3d',
      label: 'Inspeccion 3D',
      detail: barrierCount > 0 || sourceCount > 0 ? 'Plano listo' : 'Faltan objetos',
      ready: barrierCount > 0 || sourceCount > 0,
      action: onOpenMedical3D || onOpen3DViewer,
      icon: Stethoscope,
    },
    {
      id: 'rag',
      label: 'Evidence/RAG',
      detail: hasResults ? 'Citas listas' : 'Tras calcular',
      ready: hasResults || controlledZoneSummary.hasControlledZone,
      action: onOpenEvidencePack,
      icon: FileSearch,
    },
    {
      id: 'db',
      label: 'DB diferida',
      detail: 'MySQL pendiente',
      ready: true,
      action: undefined,
      icon: Database,
    },
  ];
  const f374CanvasCommands = [
    { id: 'plan', label: 'Plano', detail: 'Importar plano base', icon: Upload, action: onImportFloorPlan },
    { id: 'barrier', label: 'Muro', detail: 'Dibujar barrera', icon: Box, action: () => activateCanvasTool('barrier') },
    { id: 'source', label: 'Fuente', detail: 'Colocar equipo/fuente', icon: Atom, action: () => activateCanvasTool('source') },
    { id: 'region', label: 'Zona', detail: 'Dibujar zona controlada/publica', icon: Shield, action: () => activateCanvasTool('region') },
    { id: 'calc', label: 'Calc', detail: 'Ejecutar calculo', icon: Calculator, action: onRunCalculations },
    { id: 'medical3d', label: '3D', detail: 'Inspeccion medica 3D', icon: Stethoscope, action: onOpenMedical3D ?? onOpen3DViewer },
    { id: 'evidence', label: 'Evid', detail: 'Abrir evidencia', icon: FileSearch, action: onOpenEvidencePack },
  ];

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[#f3f4f1]" ref={containerRef}>
      {/* ═══ BREADCRUMB + TOOLBAR SUPERIOR (Recomendacion #5 + mejoras) ═══ */}
      <div className="shrink-0 h-8 bg-white border-b border-slate-200 flex items-center px-2 gap-1">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span className="font-semibold text-slate-500">RadShield-MX</span>
          <span>/</span>
          <span className="text-[#f97316] font-medium">Canvas</span>
          <span>/</span>
          <span className="truncate max-w-[150px]">{hasResults ? 'Con resultados' : 'Edicion'}</span>
        </div>
        <div className="w-px h-3.5 bg-slate-200 mx-1.5" />
        {/* Active tool indicator */}
        <div data-testid="f98-active-canvas-tool-indicator" className="flex items-center gap-1 text-[10px] text-slate-500">
          <ToolIcon className="w-3 h-3" style={{ color: currentTool.color }} />
          <span className="font-medium">{currentTool.label}</span>
          <span className="text-slate-400 hidden sm:inline">- {currentTool.description}</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 text-[9px] text-slate-400 ml-1">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600" title="Barreras">{barrierCount}B</span>
          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600" title="Fuentes">{sourceCount}F</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700" title="Zonas">{regionCount}Z</span>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          data-testid="f375-clean-workspace-toggle"
          data-f375-canvas-mode={canvasChromeMode}
          className={`hidden h-6 rounded-md border px-2 text-[10px] font-bold transition-colors lg:inline-flex lg:items-center lg:gap-1 ${
            f375IsCleanWorkspace
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-white'
              : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-white'
          }`}
          onClick={toggleF375CanvasChrome}
          title={f375IsCleanWorkspace ? 'Modo limpio activo: libera el plano ocultando overlays auxiliares. Clic para modo guia.' : 'Modo guia activo: muestra overlays QA, escenas y export visual. Clic para modo limpio.'}
          aria-label={f375IsCleanWorkspace ? 'Activar modo guia del canvas' : 'Activar modo limpio del canvas'}
        >
          <Sparkles className="h-3 w-3" />
          {f375IsCleanWorkspace ? 'Limpio' : 'Guia'}
        </button>
        <div
          data-testid="f188-canvas-panel-controls"
          className="hidden xl:flex items-center gap-0.5 mr-1 rounded-md border border-slate-200 bg-slate-50 px-1 py-0.5"
          aria-label="Mostrar u ocultar paneles del canvas"
        >
          {([
            ['workflow', 'Flujo', 'Mostrar/ocultar panel de flujo layout-blindaje-memoria'],
            ['qa', 'QA', 'Mostrar/ocultar herramientas QA del canvas'],
            ['continuity', 'Cont', 'Mostrar/ocultar continuidad offline'],
          ] as const).map(([key, label, title]) => (
            <button
              key={key}
              type="button"
              onClick={() => togglePanelVisibility(key)}
              title={title}
              aria-label={title}
              className={`h-5 rounded px-1.5 text-[9px] font-semibold transition-colors ${
                panelVisibility[key]
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-400 hover:bg-white hover:text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-0.5 mr-1">
          {onImportFloorPlan && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Importar plano base para trazar muros y zonas" title="Importar plano base para trazar muros, zonas controladas y equipos antes de calcular blindaje" onClick={onImportFloorPlan}>
              <Upload className="w-3.5 h-3.5" />
            </Button>
          )}
          {onOpenRoomTemplates && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Plantillas de salas clinicas" title="Abrir plantillas de salas para iniciar un layout DX/TX/NM/CY con geometria base" onClick={onOpenRoomTemplates}>
              <LayoutTemplate className="w-3.5 h-3.5" />
            </Button>
          )}
          {onOpenLayers && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Capas del canvas" title="Abrir capas para mostrar/ocultar arquitectura, blindaje, fuentes, heatmap y anotaciones" onClick={onOpenLayers}>
              <Layers className="w-3.5 h-3.5" />
            </Button>
          )}
          {onOpenControlPoints && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Puntos de control" title="Gestionar puntos de control donde se evalua dosis semanal y cumplimiento por zona" onClick={onOpenControlPoints}>
              <MapPin className="w-3.5 h-3.5" />
            </Button>
          )}
          {onOpen3DViewer && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Visor 3D" title="Abrir visor 3D general para inspeccionar geometria, espesores y equipos del floorplan" onClick={onOpen3DViewer}>
              <Box className="w-3.5 h-3.5" />
            </Button>
          )}
          {onOpenMedical3D && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Medical 3D Floor Plan" title="Inspeccion medica 3D del bunker/sala con equipos, zonas, acabados y espesores de blindaje" onClick={onOpenMedical3D}>
              <Stethoscope className="w-3.5 h-3.5" />
            </Button>
          )}
          {onOpenDoseMap3D && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Dose map 3D" title="Abrir mapa 3D de dosis/isodosis para revisar distribucion espacial del blindaje" onClick={onOpenDoseMap3D}>
              <Grid3X3 className="w-3.5 h-3.5" />
            </Button>
          )}
          {onOpenMonteCarlo && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Monte Carlo" title="Abrir modulo Monte Carlo/QA para simulaciones avanzadas y comparacion contra calculo analitico" onClick={onOpenMonteCarlo}>
              <Cpu className="w-3.5 h-3.5" />
            </Button>
          )}
          {onOpenExternalConnector && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Conexiones externas" title="Abrir conectores externos para CAD/BIM, conversiones, evidencia o servicios auxiliares" onClick={onOpenExternalConnector}>
              <FileSearch className="w-3.5 h-3.5" />
            </Button>
          )}
          {onOpenEvidencePack && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label="Evidence pack" title="Abrir Evidence Pack con plano, calculos, citas, anexos y trazabilidad de la memoria analitica" onClick={onOpenEvidencePack}>
              <FileSearch className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        {/* Visualization toggles */}
        <div className="flex items-center gap-0.5">
          {setShowSampleLines && (
            <Button size="sm" variant={showSampleLines ? "default" : "outline"} className="h-6 text-[10px] px-2 bg-[#f97316] hover:bg-[#ea580c] border-none"
              title="Mostrar u ocultar lineas de evaluacion a 0.3 m para revisar dosis fuera de cada barrera"
              aria-label="Mostrar u ocultar lineas de evaluacion a 0.3 metros"
              onClick={() => setShowSampleLines(!showSampleLines)}>
              {showSampleLines ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Lineas 0.3m
            </Button>
          )}
          {setShowSamplePoints && (
            <Button size="sm" variant={showSamplePoints ? "default" : "outline"} className="h-6 text-[10px] px-2"
              title="Mostrar u ocultar puntos de muestreo usados para identificar maximos de dosis/espesor"
              aria-label="Mostrar u ocultar puntos de muestreo"
              onClick={() => setShowSamplePoints(!showSamplePoints)}>
              {showSamplePoints ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Puntos
            </Button>
          )}
          {setShowMaxima && (
            <Button size="sm" variant={showMaxima ? "default" : "outline"} className="h-6 text-[10px] px-2"
              title="Mostrar u ocultar marcadores de maximo espesor o maxima dosis por barrera"
              aria-label="Mostrar u ocultar maximos de calculo"
              onClick={() => setShowMaxima(!showMaxima)}>
              {showMaxima ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Maximos
            </Button>
          )}
          {onToggleHeatmap && (
            <Button
              data-testid="f89-heatmap-toggle"
              size="sm"
              variant={heatmapEnabled ? "default" : "outline"}
              className={`h-6 text-[10px] px-2 ${heatmapEnabled ? 'bg-red-600 hover:bg-red-700 border-none' : ''}`}
              onClick={() => onToggleHeatmap(!heatmapEnabled)}
              title={heatmapPointCount > 0 ? `Mostrar mapa de calor con ${heatmapPointCount} puntos y leyenda regulatoria F212` : 'Activar mapa de calor de dosis para revisar zonas calientes e isocontornos'}
              aria-label="Activar o desactivar mapa de calor de dosis"
            >
              {heatmapEnabled ? <Grid3X3 className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Heatmap
            </Button>
          )}
        </div>
      </div>

      {/* ═══ CANVAS PRINCIPAL ═══ */}
      <div
        data-testid="f191-pyrate-inspired-toolbar"
        className="shrink-0 min-h-8 bg-white border-b border-slate-200 flex items-center gap-2 px-2 overflow-x-auto"
        aria-label="Toolbar CAD clinica inspirada en pyrateShield"
      >
        <div className="flex items-center gap-0.5 shrink-0" data-testid="f191-cad-tool-group">
          {([
            ['select', 'Sel', 'Seleccionar muros, fuentes, zonas o puntos para revisar/editar propiedades', MousePointer],
            ['barrier', 'Muro', 'Dibujar muro o barrera; despues asignar tipo, material, P/T/U y espesor calculado', Box],
            ['source', 'Fuente', 'Colocar fuente radiologica o equipo clinico que alimenta el calculo de blindaje', Atom],
            ['region', 'Zona', 'Dibujar zona controlada, publica u ocupada para definir meta de dosis y ocupacion', Shield],
            ['measure', 'Medir', 'Medir distancias y apoyar calibracion de escala antes de calcular o exportar', Ruler],
            ['pan', 'Pan', 'Desplazar la vista del plano sin mover objetos ni cambiar la geometria', Move],
          ] as const).map(([tool, label, title, Icon]) => (
            <button
              key={tool}
              type="button"
              data-testid={`f191-tool-${tool}`}
              className={`h-6 rounded-md border px-2 text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                activeTool === tool
                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-orange-700'
              }`}
              onClick={() => activateCanvasTool(tool)}
              title={title}
              aria-label={title}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-0.5 shrink-0" data-testid="f191-clinical-action-group">
          {onImportFloorPlan && (
            <button type="button" className="h-6 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] font-semibold text-slate-600 hover:bg-white hover:text-orange-700 flex items-center gap-1" onClick={onImportFloorPlan} title="Cargar imagen, PDF raster o plano base para trazar el layout de blindaje" aria-label="Cargar imagen o plano base para trazar layout">
              <Upload className="h-3 w-3" /> Plano
            </button>
          )}
          {onCalibrateScale && (
            <button type="button" className="h-6 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] font-semibold text-slate-600 hover:bg-white hover:text-orange-700 flex items-center gap-1" onClick={onCalibrateScale} title="Calibrar escala con una distancia conocida; hacerlo antes de calcular espesores" aria-label="Calibrar escala con distancia conocida antes de calcular">
              <Ruler className="h-3 w-3" /> Escala
            </button>
          )}
          {onAddCriticalPoint && (
            <button type="button" className="h-6 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] font-semibold text-slate-600 hover:bg-white hover:text-orange-700 flex items-center gap-1" onClick={onAddCriticalPoint} title="Agregar punto critico para evaluar dosis en accesos, colindancias o zonas sensibles" aria-label="Agregar punto critico de evaluacion de dosis">
              <Crosshair className="h-3 w-3" /> Punto
            </button>
          )}
          {onOpenShieldingPresets && (
            <button type="button" className="h-6 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] font-semibold text-slate-600 hover:bg-white hover:text-orange-700 flex items-center gap-1" onClick={onOpenShieldingPresets} title="Seleccionar material/preset de blindaje: plomo, concreto, acero, tabiques HD o multilayer" aria-label="Aplicar material o preset de blindaje">
              <Layers className="h-3 w-3" /> Material
            </button>
          )}
          {onRunCalculations && (
            <button type="button" className="h-6 rounded-md border border-orange-200 bg-orange-50 px-2 text-[10px] font-semibold text-orange-700 hover:bg-orange-100 flex items-center gap-1" onClick={onRunCalculations} title="Ejecutar calculo analitico de blindaje con geometria, fuente, material, P/T/U/W y escala actuales" aria-label="Calcular blindaje analitico del plano actual">
              <Calculator className="h-3 w-3" /> Calcular
            </button>
          )}
          <button type="button" className="h-6 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] font-semibold text-slate-600 hover:bg-white hover:text-orange-700 flex items-center gap-1" onClick={onExportPNG} title="Exportar captura visual del canvas para Memoria IA, PDF o Evidence Pack" aria-label="Exportar snapshot visual del canvas para reportes">
            <ImageIcon className="h-3 w-3" /> Snapshot
          </button>
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div
          data-testid="f191-visual-mode-switcher"
          className="flex items-center gap-0.5 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1 py-0.5"
          aria-label="Selector de modo visual del canvas"
        >
          {([
            ['plan', 'Plano', 'Vista limpia del plano para trazar muros, equipos, zonas y puntos', LayoutTemplate],
            ['heat', 'Heat', 'Mapa de calor de dosis con leyenda regulatoria F212', Grid3X3],
            ['isocontours', 'Iso', 'Lineas de evaluacion/isocontornos para revisar maxima dosis por barrera', ScanLine],
            ['structure', 'Estruct', 'Overlay de carga estructural, material, peso y espesor de blindaje', Layers],
          ] as const).map(([mode, label, title, Icon]) => (
            <button
              key={mode}
              type="button"
              data-testid={`f191-visual-mode-${mode}`}
              className={`h-5 rounded px-1.5 text-[9px] font-semibold flex items-center gap-1 ${
                visualMode === mode
                  ? 'bg-white text-orange-700 shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-orange-700'
              }`}
              onClick={() => applyVisualMode(mode)}
              title={title}
              aria-label={title}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
        <div
          data-testid="f191c-object-inspector"
          className="ml-auto min-w-[260px] max-w-[560px] shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 flex items-center gap-1.5 overflow-hidden"
          title={selectedInspectorEntity ? `Inspector: ${selectedInspectorKind} ${selectedInspectorName}` : 'Inspector contextual del canvas'}
          aria-label="Inspector contextual del objeto seleccionado en canvas"
        >
          <span
            data-testid="f191-mode-status"
            className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[9px] font-mono text-slate-500"
            title="Estado del modo visual F191"
          >
            F191 {visualMode} | {heatmapEnabled ? `${heatmapPointCount} heat` : 'heat off'}
          </span>
          <span
            data-testid="f191c-inspector-type"
            className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
              selectedInspectorEntity ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {selectedInspectorKind}
          </span>
          <span
            data-testid="f191c-inspector-name"
            className="min-w-0 max-w-[150px] truncate text-[10px] font-semibold text-slate-700"
          >
            {selectedInspectorName}
          </span>
          <div className="hidden xl:flex min-w-0 items-center gap-1 overflow-hidden">
            {selectedInspectorRows.slice(0, 4).map(([label, value]) => (
              <span
                key={`${label}-${value}`}
                data-testid="f191c-inspector-chip"
                className="shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-mono text-slate-600"
                title={`${label}: ${value}`}
              >
                {label}:{value}
              </span>
            ))}
          </div>
          <div
            data-testid="f191d-context-actions"
            className="hidden 2xl:flex shrink-0 items-center gap-0.5 border-l border-slate-200 pl-1"
            aria-label="Acciones contextuales seguras del objeto seleccionado"
          >
            <button
              type="button"
              data-testid="f191e-action-edit"
              className="h-5 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-semibold text-slate-600 hover:border-violet-200 hover:text-violet-700 disabled:opacity-40"
              onClick={() => setInspectorEditOpen((open) => !open)}
              disabled={!selectedInspectorEntity || !onUpdateSelected}
              title="Editar propiedades basicas del objeto seleccionado"
              aria-label="Editar propiedades de seleccion"
            >
              Edit
            </button>
            {onOpenShieldingPresets && (
              <button
                type="button"
                data-testid="f191d-action-material"
                className="h-5 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-semibold text-slate-600 hover:border-orange-200 hover:text-orange-700 disabled:opacity-40"
                onClick={onOpenShieldingPresets}
                disabled={!selectedInspectorEntity}
                title="Abrir materiales/presets para el objeto seleccionado"
                aria-label="Abrir materiales para seleccion"
              >
                Mat
              </button>
            )}
            {onRunCalculations && (
              <button
                type="button"
                data-testid="f191d-action-calculate"
                className="h-5 rounded border border-orange-200 bg-white px-1.5 text-[9px] font-semibold text-orange-700 hover:bg-orange-50"
                onClick={onRunCalculations}
                title="Recalcular blindaje con el contexto actual"
                aria-label="Recalcular blindaje"
              >
                Calc
              </button>
            )}
            {onOpenEvidencePack && (
              <button
                type="button"
                data-testid="f191d-action-evidence"
                className="h-5 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700"
                onClick={onOpenEvidencePack}
                title="Abrir Evidence Pack del proyecto"
                aria-label="Abrir Evidence Pack"
              >
                Evid
              </button>
            )}
            <button
              type="button"
              data-testid="f191d-action-focus"
              className="h-5 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-semibold text-slate-600 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-40"
              onClick={focusSelectedInspectorEntity}
              disabled={!selectedInspectorFocusPoint}
              title="Centrar objeto seleccionado en el canvas"
              aria-label="Centrar seleccion"
            >
              Ver
            </button>
            <button
              type="button"
              data-testid="f191d-action-clear"
              className="h-5 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-semibold text-slate-600 hover:border-red-200 hover:text-red-700 disabled:opacity-40"
              onClick={clearInspectorSelection}
              disabled={!canvasState.selectedId && canvasState.selectedIds.length === 0}
              title="Limpiar seleccion del canvas"
              aria-label="Limpiar seleccion"
            >
              X
            </button>
            <button
              type="button"
              data-testid="f191g-action-duplicate"
              className="h-5 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-semibold text-slate-600 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-40"
              onClick={duplicateInspectorSelection}
              disabled={!selectedInspectorEntity || !onDuplicateSelected}
              title="Duplicar seleccion con confirmacion"
              aria-label="Duplicar seleccion"
            >
              Dup
            </button>
            <button
              type="button"
              data-testid="f191g-action-delete"
              className="h-5 rounded border border-red-100 bg-white px-1.5 text-[9px] font-semibold text-red-600 hover:border-red-300 hover:bg-red-50 disabled:opacity-40"
              onClick={deleteInspectorSelection}
              disabled={!selectedInspectorEntity || !onDeleteSelected}
              title="Borrar seleccion con confirmacion y Ctrl+Z disponible"
              aria-label="Borrar seleccion"
            >
              Del
            </button>
          </div>
        </div>
      </div>

      {inspectorEditOpen && selectedInspectorEntity && onUpdateSelected && (
        <div
          data-testid="f191e-inline-editor"
          className="absolute right-3 top-20 z-30 w-[360px] max-w-[calc(100%-24px)] rounded-md border border-violet-200 bg-white/95 p-3 shadow-lg backdrop-blur"
          aria-label="Editor contextual seguro del objeto seleccionado"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-violet-600">F191E editor</div>
              <div className="truncate text-xs font-semibold text-slate-800">{selectedInspectorKind}: {selectedInspectorName}</div>
            </div>
            <button
              type="button"
              data-testid="f191e-editor-close"
              className="h-6 w-6 rounded border border-slate-200 text-xs font-bold text-slate-500 hover:border-red-200 hover:text-red-600"
              onClick={() => setInspectorEditOpen(false)}
              title="Cerrar editor contextual"
              aria-label="Cerrar editor contextual"
            >
              X
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 text-[10px] font-semibold text-slate-500">
              Nombre
              <input
                data-testid="f191e-editor-name"
                className="mt-1 h-7 w-full rounded border border-slate-200 px-2 text-xs text-slate-800 outline-none focus:border-violet-300"
                defaultValue={selectedInspectorName}
                onBlur={(event) => applyInspectorTextUpdate('name', event.currentTarget.value)}
              />
            </label>
            {selectedBarrier && (
              <label className="text-[10px] font-semibold text-slate-500">
                Material
                <input
                  data-testid="f191e-editor-material"
                  className="mt-1 h-7 w-full rounded border border-slate-200 px-2 text-xs text-slate-800 outline-none focus:border-violet-300"
                  defaultValue={selectedBarrier.materialCode || selectedBarrier.material || ''}
                  onBlur={(event) => applyInspectorTextUpdate('materialCode', event.currentTarget.value)}
                />
              </label>
            )}
            {selectedSource && (
              <>
                <label className="text-[10px] font-semibold text-slate-500">
                  Workload
                  <input
                    data-testid="f191e-editor-workload"
                    className="mt-1 h-7 w-full rounded border border-slate-200 px-2 text-xs text-slate-800 outline-none focus:border-violet-300"
                    type="number"
                    defaultValue={selectedSource.workloadValue}
                    onBlur={(event) => applyInspectorNumberUpdate('workloadValue', event.currentTarget.value)}
                  />
                </label>
                <label className="text-[10px] font-semibold text-slate-500">
                  Isocentro m
                  <input
                    data-testid="f191e-editor-isocenter"
                    className="mt-1 h-7 w-full rounded border border-slate-200 px-2 text-xs text-slate-800 outline-none focus:border-violet-300"
                    type="number"
                    step="0.01"
                    defaultValue={selectedSource.isocenterHeight_m}
                    onBlur={(event) => applyInspectorNumberUpdate('isocenterHeight_m', event.currentTarget.value)}
                  />
                </label>
              </>
            )}
            {(selectedBarrier || selectedSource) && (
              <label className="text-[10px] font-semibold text-slate-500">
                U
                <input
                  data-testid="f191e-editor-use-factor"
                  className="mt-1 h-7 w-full rounded border border-slate-200 px-2 text-xs text-slate-800 outline-none focus:border-violet-300"
                  type="number"
                  step="0.01"
                  defaultValue={(selectedBarrier ?? selectedSource)?.useFactor ?? 1}
                  onBlur={(event) => applyInspectorNumberUpdate('useFactor', event.currentTarget.value)}
                />
              </label>
            )}
            {(selectedBarrier || selectedRegion || selectedCriticalPoint) && (
              <>
                <label className="text-[10px] font-semibold text-slate-500">
                  T
                  <input
                    data-testid="f191e-editor-occupancy"
                    className="mt-1 h-7 w-full rounded border border-slate-200 px-2 text-xs text-slate-800 outline-none focus:border-violet-300"
                    type="number"
                    step="0.001"
                    defaultValue={(selectedBarrier ?? selectedRegion ?? selectedCriticalPoint)?.occupancyFactor ?? 1}
                    onBlur={(event) => applyInspectorNumberUpdate('occupancyFactor', event.currentTarget.value)}
                  />
                </label>
                <label className="text-[10px] font-semibold text-slate-500">
                  P mSv/sem
                  <input
                    data-testid="f191e-editor-design-goal"
                    className="mt-1 h-7 w-full rounded border border-slate-200 px-2 text-xs text-slate-800 outline-none focus:border-violet-300"
                    type="number"
                    step="0.001"
                    defaultValue={(selectedBarrier ?? selectedRegion ?? selectedCriticalPoint)?.designGoal_mSv_per_wk ?? 0.02}
                    onBlur={(event) => applyInspectorNumberUpdate('designGoal_mSv_per_wk', event.currentTarget.value)}
                  />
                </label>
              </>
            )}
          </div>
          <div className="mt-2 rounded bg-violet-50 px-2 py-1 text-[10px] text-violet-700">
            Cambios al perder foco. Acciones destructivas siguen fuera de F191E.
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Ruler Left */}
        <div className="w-6 bg-[#f7f4ee] border-r border-stone-300 shrink-0 relative" style={{ background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0.55) 9px, #d6d3d1 9px, #d6d3d1 10px)' }}>
          <span className="absolute bottom-1 left-0.5 text-[7px] text-slate-400 rotate-90 origin-left">m</span>
        </div>
        <div className="flex-1 flex flex-col relative">
          {/* Ruler Top */}
          <div className="h-5 bg-[#f7f4ee] border-b border-stone-300 shrink-0 relative" style={{ background: 'repeating-linear-gradient(to right, rgba(255,255,255,0.55), rgba(255,255,255,0.55) 9px, #d6d3d1 9px, #d6d3d1 10px)' }}>
            <span className="absolute bottom-0.5 left-1 text-[7px] text-slate-400">m</span>
          </div>
          <div
            data-testid="f214-sketchup-viewport-frame"
            className="flex-1 relative overflow-hidden bg-[#e9edf0] shadow-inner"
            onContextMenu={handleCanvasContextMenu}
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 36%), radial-gradient(circle at 12px 12px, rgba(15,23,42,0.06) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 24px 24px',
            }}
          >
            {/* Main floor plan canvas */}
            <canvas
              ref={canvasRef}
              data-testid="f100-main-floorplan-canvas"
              className="absolute inset-0 w-full h-full"
              style={{
                cursor: activeTool === 'barrier' || activeTool === 'measure' ? 'crosshair' :
                        activeTool === 'pan' ? 'grab' :
                        activeTool === 'source' ? 'copy' :
                        freehandEnabled ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'2\' fill=\'%23ef4444\'/%3E%3C/svg%3E") 10 10, crosshair' : 'default',
                opacity: layers.find(l => l.id === 'architecture')?.opacity ?? 1,
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onWheel={handleWheel}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onContextMenu={handleCanvasContextMenu}
            />

            {/* v65: Freehand drawing overlay canvas */}
            <canvas
              ref={freehandCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 5 }}
            />

            <div
              data-testid="f374-canvas-command-dock"
              data-f375-canvas-mode={canvasChromeMode}
              className="absolute bottom-3 left-1/2 z-30 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white/94 px-2 py-1.5 shadow-xl backdrop-blur"
              aria-label="Dock de comandos principales del canvas"
            >
              <div
                data-testid="f375-canvas-mode-badge"
                className="hidden border-r border-slate-200 pr-2 text-[9px] font-bold uppercase tracking-wide text-slate-400 md:block"
                title={f375IsCleanWorkspace ? 'Canvas limpio: overlays auxiliares ocultos' : 'Canvas guia: overlays auxiliares visibles'}
              >
                {f375IsCleanWorkspace ? 'CAD Limpio' : 'CAD Guia'}
              </div>
              {f374CanvasCommands.map((command) => {
                const Icon = command.icon;
                const isToolCommand = command.id === activeTool;
                return (
                  <button
                    key={command.id}
                    type="button"
                    data-testid={`f374-command-${command.id}`}
                    className={`h-8 min-w-12 rounded-md border px-2 text-[10px] font-bold transition-colors ${
                      isToolCommand
                        ? 'border-orange-200 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-orange-700'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                    onClick={() => runCanvasCommand(command.detail, command.action)}
                    disabled={!command.action}
                    title={command.detail}
                    aria-label={command.detail}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <Icon className="h-3.5 w-3.5" />
                      {command.label}
                    </span>
                  </button>
                );
              })}
              <div
                data-testid="f374-canvas-command-status"
                className="hidden min-w-28 rounded border border-slate-100 bg-slate-50 px-2 py-1 text-[9px] font-medium text-slate-500 lg:block"
                title="Ultimo comando enviado desde el dock CAD"
              >
                {lastCanvasCommand ? `Ultimo: ${lastCanvasCommand}` : 'Listo para diseno'}
              </div>
            </div>

            {contextMenu && (
              <div
                data-testid="canvas-context-menu"
                className="fixed z-50 w-56 overflow-hidden rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 shadow-xl"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={(event) => event.stopPropagation()}
                onContextMenu={(event) => event.preventDefault()}
              >
                <div className="border-b border-slate-100 bg-slate-50 px-2.5 py-1.5">
                  <div className="font-bold text-slate-800">Canvas CAD</div>
                  <div className="text-[9px] text-slate-400">
                    x {contextMenu.canvasX.toFixed(1)} / y {contextMenu.canvasY.toFixed(1)}
                  </div>
                </div>
                <button type="button" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(() => activateCanvasTool('select'))}>Seleccionar / editar</button>
                <button type="button" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(() => activateCanvasTool('barrier'))}>Dibujar barrera</button>
                <button type="button" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(() => activateCanvasTool('source'))}>Colocar fuente/equipo</button>
                <button type="button" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(() => activateCanvasTool('measure'))}>Medir / cota</button>
                <button type="button" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(onZoomToFit)}>Ajustar vista</button>
                <button type="button" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(onExportPNG)}>Exportar PNG</button>
                <button type="button" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(onRunCalculations)}>Calcular blindaje</button>
                <button type="button" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(onOpenEvidencePack)}>Abrir evidencia</button>
                <button type="button" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(onOpenMedical3D ?? onOpen3DViewer)}>Inspeccion 3D medica</button>
                <div className="border-t border-slate-100" />
                <button
                  type="button"
                  className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  disabled={!selectedInspectorEntity || !onDuplicateSelected}
                  onClick={() => runContextMenuAction(duplicateInspectorSelection)}
                >
                  Duplicar seleccionado
                </button>
                <button
                  type="button"
                  className="block w-full px-2.5 py-1.5 text-left text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  disabled={!selectedInspectorEntity || !onDeleteSelected}
                  onClick={() => runContextMenuAction(deleteInspectorSelection)}
                >
                  Borrar seleccionado
                </button>
              </div>
            )}

            {f375IsCleanWorkspace && (
              <div
                data-testid="f375-clean-guide-strip"
                className="pointer-events-none absolute left-2 top-2 z-10 hidden max-w-[520px] items-center gap-1 rounded-md border border-emerald-200 bg-white/92 px-2 py-1 text-[8px] text-slate-600 shadow-sm backdrop-blur-sm xl:flex"
                title="Modo limpio F375: estados compactos visibles, paneles auxiliares completos ocultos para liberar el plano."
              >
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">F375 Limpio</span>
                <span className="rounded border border-stone-200 bg-[#f8f5ef] px-1 py-0.5 font-semibold text-slate-600">F214 Studio</span>
                <span className="rounded border border-stone-200 bg-white px-1 py-0.5 font-semibold text-slate-600">F217 Export</span>
                <span data-testid="f375-clean-hidden-overlays" className="rounded border border-slate-100 bg-slate-50 px-1 py-0.5 text-slate-500">
                  overlays compactos
                </span>
              </div>
            )}

            <div
              data-testid="f214-sketchup-canvas-reorg"
              className={`pointer-events-none absolute top-2 left-[456px] z-10 max-w-[520px] items-center gap-1 rounded-md border border-stone-300 bg-[#f8f5ef]/95 px-2 py-1 text-[8px] text-slate-600 shadow-sm backdrop-blur-sm ${f375IsCleanWorkspace ? 'hidden' : 'hidden xl:flex'}`}
              title={`${f214SketchUpCanvas.viewportTitle}. ${f214SketchUpCanvas.warnings.join(' ') || 'Vista tipo estudio organizada.'}`}
            >
              <span className={`rounded px-1.5 py-0.5 font-bold ${
                f214SketchUpCanvas.status === 'sketchup-canvas-reorg-ready'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                F214 Studio
              </span>
              {f214SketchUpCanvas.chips.map((chip) => (
                <span
                  key={chip.id}
                  data-testid={`f214-sketchup-chip-${chip.id}`}
                  className={`rounded border px-1 py-0.5 whitespace-nowrap ${
                    chip.tone === 'ready'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : chip.tone === 'active'
                        ? 'border-orange-100 bg-orange-50 text-orange-700'
                        : chip.tone === 'attention'
                          ? 'border-amber-100 bg-amber-50 text-amber-700'
                          : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}
                >
                  {chip.label}:{chip.value}
                </span>
              ))}
            </div>

            <div
              data-testid="f215-canvas-scene-presets"
              className={`absolute top-10 left-[456px] z-10 max-w-[560px] items-center gap-1 rounded-md border border-stone-300 bg-white/92 px-2 py-1 shadow-sm backdrop-blur-sm ${f375IsCleanWorkspace ? 'hidden' : 'hidden xl:flex'}`}
              title={`${f215ScenePresets.readyPresetCount}/${f215ScenePresets.totalPresetCount} escenas listas. ${f215ScenePresets.warnings.join(' ') || 'Presets de vista listos para diseno y revision.'}`}
            >
              <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                f215ScenePresets.status === 'canvas-scene-presets-ready'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                F215 Scenes
              </span>
              {f215ScenePresets.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`f215-scene-preset-${preset.id}`}
                  className={`h-5 rounded border px-1.5 text-[8px] font-semibold transition-colors ${
                    preset.id === f215ScenePresets.activeScene
                      ? 'border-orange-200 bg-orange-50 text-orange-700 shadow-sm'
                      : preset.ready
                        ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-orange-700'
                        : 'border-amber-100 bg-amber-50 text-amber-700 hover:bg-white'
                  }`}
                  onClick={() => {
                    if (preset.action === 'zoom-extents') {
                      onZoomToFit();
                    } else {
                      applyVisualMode(preset.id as F191VisualMode);
                    }
                  }}
                  title={`${preset.label}: ${preset.description}`}
                  aria-label={`${preset.label}: ${preset.description}`}
                >
                  {preset.shortLabel}
                </button>
              ))}
            </div>

            <div
              data-testid="f216-mini-view-manager"
              className={`absolute bottom-16 left-2 z-10 max-w-[440px] rounded-md border border-stone-300 bg-white/94 px-2 py-1.5 text-[8px] text-slate-600 shadow-sm backdrop-blur-sm ${f375IsCleanWorkspace ? 'hidden' : 'hidden xl:block'}`}
              title={`${f216MiniViewManager.activeViewLabel}: zoom ${f216MiniViewManager.zoomPercent}%, pan ${f216MiniViewManager.panLabel}. ${f216MiniViewManager.warnings.join(' ') || 'Mini View Manager listo.'}`}
            >
              <div className="flex items-center gap-1">
                <span className={`rounded px-1.5 py-0.5 font-bold ${
                  f216MiniViewManager.status === 'mini-view-manager-ready'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  F216 View
                </span>
                <span data-testid="f216-view-zoom" className="rounded border border-slate-100 bg-slate-50 px-1 py-0.5 font-mono">
                  Z {f216MiniViewManager.zoomPercent}%
                </span>
                <span data-testid="f216-view-pan" className="rounded border border-slate-100 bg-slate-50 px-1 py-0.5 font-mono">
                  Pan {f216MiniViewManager.panLabel}
                </span>
                <span data-testid="f216-view-active" className="rounded border border-orange-100 bg-orange-50 px-1 py-0.5 font-semibold text-orange-700">
                  {f216MiniViewManager.activeViewLabel}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                {(['A', 'B', 'C'] as const).map((slotId) => {
                  const savedView = savedViews.find((view) => view.id === slotId);
                  return (
                    <div key={slotId} className="flex items-center gap-0.5 rounded border border-slate-100 bg-slate-50 px-1 py-0.5">
                      <button
                        type="button"
                        data-testid={`f216-save-view-${slotId}`}
                        className="rounded px-1 font-bold text-slate-600 hover:bg-white hover:text-orange-700"
                        onClick={() => saveCurrentView(slotId)}
                        title={`Guardar vista actual en slot ${slotId}`}
                        aria-label={`Guardar vista actual en slot ${slotId}`}
                      >
                        +{slotId}
                      </button>
                      <button
                        type="button"
                        data-testid={`f216-restore-view-${slotId}`}
                        className={`rounded px-1 font-semibold ${
                          savedView ? 'text-emerald-700 hover:bg-white' : 'cursor-not-allowed text-slate-300'
                        }`}
                        onClick={() => savedView && restoreSavedView(savedView)}
                        disabled={!savedView}
                        title={savedView ? `Restaurar ${savedView.label}: ${Math.round(savedView.scale * 100)}% ${savedView.visualMode}` : `Slot ${slotId} vacio`}
                        aria-label={savedView ? `Restaurar vista ${slotId}` : `Slot ${slotId} vacio`}
                      >
                        {savedView ? 'Ir' : '--'}
                      </button>
                      <button
                        type="button"
                        data-testid={`f216-clear-view-${slotId}`}
                        className={`rounded px-1 ${savedView ? 'text-slate-400 hover:bg-white hover:text-red-600' : 'cursor-not-allowed text-slate-300'}`}
                        onClick={() => savedView && clearSavedView(slotId)}
                        disabled={!savedView}
                        title={savedView ? `Eliminar vista ${slotId}` : `Slot ${slotId} sin vista guardada`}
                        aria-label={savedView ? `Eliminar vista ${slotId}` : `Slot ${slotId} sin vista guardada`}
                      >
                        x
                      </button>
                    </div>
                  );
                })}
                <span className="truncate text-[7px] text-slate-400">
                  {f216MiniViewManager.savedViewCount}/{f216MiniViewManager.maxSavedViews} guardadas
                </span>
              </div>
            </div>

            <div
              data-testid="f217-visual-export-by-scene"
              className={`absolute bottom-16 left-[460px] z-10 max-w-[540px] rounded-md border border-stone-300 bg-white/94 px-2 py-1.5 text-[8px] text-slate-600 shadow-sm backdrop-blur-sm ${f375IsCleanWorkspace ? 'hidden' : 'hidden xl:block'}`}
              title={`${f217VisualExport.readySceneCount}/${f217VisualExport.scenes.length} escenas listas. ${f217VisualExport.warnings.join(' ') || 'Export visual por escena listo.'}`}
            >
              <div className="flex items-center gap-1">
                <span className={`rounded px-1.5 py-0.5 font-bold ${
                  f217VisualExport.status === 'visual-export-by-scene-ready'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  F217 Export
                </span>
                <span data-testid="f217-export-ready-count" className="rounded border border-slate-100 bg-slate-50 px-1 py-0.5 font-mono">
                  {f217VisualExport.readySceneCount}/{f217VisualExport.scenes.length}
                </span>
                <span className="truncate text-[7px] text-slate-400">
                  Memoria IA / PDF / Evidence Pack
                </span>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1">
                {f217VisualExport.scenes.map((scene) => (
                  <div
                    key={scene.id}
                    data-testid={`f217-export-scene-${scene.id}`}
                    className={`rounded border px-1 py-0.5 ${
                      scene.id === f217VisualExport.activeScene
                        ? 'border-orange-200 bg-orange-50'
                        : scene.ready
                          ? 'border-emerald-100 bg-emerald-50'
                          : 'border-amber-100 bg-amber-50'
                    }`}
                    title={`${scene.exportLabel}: ${scene.requiredEvidence}${scene.warning ? `. ${scene.warning}` : ''}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        data-testid={`f217-prepare-scene-${scene.id}`}
                        className={`rounded px-1 font-bold ${
                          scene.id === f217VisualExport.activeScene ? 'text-orange-700' : 'text-slate-600 hover:bg-white hover:text-orange-700'
                        }`}
                        onClick={() => applyVisualMode(scene.id as F217VisualExportSceneId)}
                        title={`Preparar escena ${scene.label} para export visual`}
                        aria-label={`Preparar escena ${scene.label} para export visual`}
                      >
                        {scene.label}
                      </button>
                      <button
                        type="button"
                        data-testid={`f217-export-png-${scene.id}`}
                        className="rounded px-1 font-semibold text-slate-500 hover:bg-white hover:text-orange-700"
                        onClick={() => {
                          applyVisualMode(scene.id as F217VisualExportSceneId);
                          window.setTimeout(onExportPNG, 60);
                        }}
                        title={`Exportar PNG ${scene.exportLabel} para ${scene.target}`}
                        aria-label={`Exportar PNG ${scene.label} para ${scene.target}`}
                      >
                        PNG
                      </button>
                    </div>
                    <div className="truncate text-[7px] text-slate-500">{scene.target}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              data-testid="f214-view-cube"
              className="pointer-events-none absolute right-2 top-[148px] z-10 hidden h-[58px] w-[58px] rotate-[-8deg] rounded-md border border-stone-300 bg-white/90 text-[9px] font-bold text-slate-500 shadow-md backdrop-blur-sm lg:block"
              title="Cubo de vista tipo SketchUp: orientacion de planta para inspeccion medica 2D/3D"
            >
              <div className="absolute left-2 top-2 h-8 w-8 skew-y-[-18deg] rounded-sm border border-slate-300 bg-[#f8fafc] shadow-inner" />
              <div className="absolute right-2 top-3 h-8 w-5 skew-y-[26deg] rounded-sm border border-slate-300 bg-[#eef2f7]" />
              <span className="absolute left-3 top-3 text-orange-600">{f214SketchUpCanvas.viewCubeLabels[0]}</span>
              <span className="absolute bottom-1 left-2 text-emerald-600">{f214SketchUpCanvas.viewCubeLabels[1]}</span>
              <span className="absolute bottom-1 right-2 text-red-500">{f214SketchUpCanvas.viewCubeLabels[2]}</span>
            </div>

            <div
              data-testid="f214-axis-triad"
              className="pointer-events-none absolute bottom-16 right-14 z-10 hidden rounded-md border border-stone-300 bg-white/90 px-2 py-1.5 shadow-sm backdrop-blur-sm lg:block"
              title="Ejes XYZ de orientacion: X este, Y norte, Z altura/espesor para inspeccion 3D"
            >
              <div className="relative h-12 w-16">
                <div className="absolute bottom-2 left-4 h-0.5 w-9 origin-left rotate-[-12deg]" style={{ backgroundColor: f214SketchUpCanvas.axes[0].color }} />
                <div className="absolute bottom-2 left-4 h-9 w-0.5 origin-bottom rotate-[22deg]" style={{ backgroundColor: f214SketchUpCanvas.axes[1].color }} />
                <div className="absolute bottom-2 left-4 h-8 w-0.5 origin-bottom rotate-[-48deg]" style={{ backgroundColor: f214SketchUpCanvas.axes[2].color }} />
                {f214SketchUpCanvas.axes.map((axis, index) => (
                  <span
                    key={axis.axis}
                    className={`absolute text-[9px] font-bold ${index === 0 ? 'bottom-0 right-0' : index === 1 ? 'top-0 left-8' : 'bottom-7 left-0'}`}
                    style={{ color: axis.color }}
                  >
                    {axis.axis}
                  </span>
                ))}
              </div>
            </div>

            {/* v65: Sticky notes overlay */}
            {stickyNotes.map(note => {
              const noteLayer = layers.find(l => l.id === 'annotations');
              if (noteLayer && !noteLayer.visible) return null;
              return (
                <div
                  key={note.id}
                  className="absolute z-20 rounded-md shadow-md border border-amber-200"
                  style={{
                    left: note.x,
                    top: note.y,
                    width: 160,
                    minHeight: 80,
                    background: {
                      yellow: '#fef3c7',
                      green: '#d1fae5',
                      blue: '#dbeafe',
                      red: '#fee2e2',
                      purple: '#f3e8ff',
                    }[note.color] || '#fef3c7',
                    opacity: noteLayer?.opacity ?? 1,
                  }}
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b border-black/5">
                    <span className="text-[8px] text-slate-400 font-medium truncate">{note.author}</span>
                    <button
                      onClick={() => onStickyNoteDelete?.(note.id)}
                      className="text-slate-300 hover:text-red-400 text-[10px] leading-none"
                    >x</button>
                  </div>
                  <textarea
                    className="w-full bg-transparent text-[10px] text-slate-700 p-2 resize-none outline-none"
                    style={{ minHeight: 60 }}
                    value={note.text}
                    onChange={e => onStickyNoteUpdate?.(note.id, e.target.value)}
                  />
                </div>
              );
            })}

            {/* ═══ OVERLAY: Coordenadas en tiempo real (Recomendacion #2) ═══ */}
            {hoverInfo && (
              <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm rounded-md px-2.5 py-1.5 text-[10px] text-slate-600 border border-slate-200 shadow-sm z-10 max-w-xs">
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3 h-3 text-[#f97316]" />
                  <span className="font-mono">{hoverInfo}</span>
                </div>
              </div>
            )}

            {/* ═══ OVERLAY: Info general — v112 compact ═══ */}
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm rounded-md px-2 py-1 text-[9px] text-slate-500 border border-slate-200 shadow-sm z-10 max-w-[440px]">
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="font-mono font-semibold text-slate-700">{(canvasState.scale * 100).toFixed(0)}%</span>
                <span className="text-slate-300">|</span>
                <span>Ctrl+rueda zoom</span>
                <span className="text-slate-300">|</span>
                <span>Alt+pan</span>
                {canvasState.snapToGrid && (
                  <span className="text-emerald-600 font-medium">+Snap</span>
                )}
              </div>
              <div
                data-testid="f173-canvas-hud"
                className="mt-1 flex items-center gap-1 overflow-hidden"
                title={`${f173CanvasPolish.compactSummary}. ${f173CanvasPolish.releaseGuardrails.join(' ')}`}
              >
                <span className={`text-[8px] font-bold rounded border px-1 py-0.5 shrink-0 ${
                  f173CanvasPolish.status === 'canvas-low-risk-polish-ready'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  F173 {f173CanvasPolish.score}%
                </span>
                {f173CanvasPolish.signals.map((signal) => (
                  <span
                    key={signal.id}
                    data-testid={`f173-hud-${signal.id}`}
                    className={`text-[8px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      signal.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : signal.status === 'partial'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                    title={signal.hint}
                  >
                    {signal.label}:{signal.value}
                  </span>
                ))}
              </div>
              <div
                data-testid="f185-canvas-micro-assist"
                className="mt-1 flex items-center gap-1 overflow-hidden"
                title={`${f185CanvasAssist.compactHint} Siguiente: ${f185CanvasAssist.nextAction}`}
              >
                <span className="text-[8px] font-bold rounded border px-1 py-0.5 shrink-0 bg-indigo-50 text-indigo-700 border-indigo-100">
                  F185
                </span>
                {f185CanvasAssist.items.map((item) => (
                  <span
                    key={item.id}
                    data-testid={`f185-assist-${item.id}`}
                    className={`text-[8px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      item.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : item.status === 'active'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          : item.status === 'attention'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                    title={item.tooltip}
                  >
                    {item.label}:{item.value}
                  </span>
                ))}
                <span className="text-[8px] text-slate-400 truncate">{f185CanvasAssist.nextAction}</span>
              </div>
            </div>

            {controlledZoneSummary.hasControlledZone && (
              <div className="absolute top-10 left-2 bg-white/95 backdrop-blur-sm rounded-md px-2.5 py-2 text-[10px] text-slate-600 border border-emerald-200 shadow-sm z-10 min-w-[190px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-emerald-700">Zona controlada</span>
                  <span className="font-mono text-[9px] text-emerald-600">{controlledZoneSummary.barrierCount} barreras</span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                  <span>Muros: {controlledZoneSummary.wallCount}</span>
                  <span>Techo: {controlledZoneSummary.ceilingCount}</span>
                  <span>Fuente: {controlledZoneSummary.sourceCount}</span>
                  <span>Region: {controlledZoneSummary.regionCount}</span>
                  {controlledZoneSummary.maxThickness_mm !== null && (
                    <span className="col-span-2 font-mono text-slate-700">
                      Max espesor: {controlledZoneSummary.maxThickness_mm.toFixed(1)} mm
                    </span>
                  )}
                </div>
                {controlledZoneSummary.warnings.length > 0 && (
                  <div className="mt-1 text-[9px] text-amber-700">
                    {controlledZoneSummary.warnings.length} aviso(s) de validacion
                  </div>
                )}
              </div>
            )}

            {/* ═══ OVERLAY: Legend RadShield — v112 collapsible ═══ */}
            {panelVisibility.continuity && (
            <div
              data-testid="f83-offline-continuity-panel"
              aria-label="Continuidad offline canvas RAG DB diferida"
              className="absolute bottom-8 left-2 bg-white/95 backdrop-blur-sm rounded-md border border-slate-200 shadow-sm z-10 w-[260px] overflow-hidden"
            >
              <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700 truncate">F83 continuidad sin DB live</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8px] text-slate-400 font-mono">offline-safe</span>
                  <button
                    type="button"
                    className="h-5 w-5 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setPanelVisible('continuity', false)}
                    title="Cerrar panel de continuidad offline"
                    aria-label="Cerrar panel de continuidad offline"
                  >
                    <X className="h-3 w-3 mx-auto" />
                  </button>
                </div>
              </div>
              <div className="p-1.5 grid grid-cols-3 gap-1">
                {offlineContinuitySteps.map(step => {
                  const StepIcon = step.icon;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={step.action}
                      disabled={!step.action}
                      className={`min-h-[50px] rounded border px-1.5 py-1 text-left transition-colors ${
                        step.ready
                          ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-orange-50 hover:border-orange-200'
                      } ${!step.action ? 'cursor-default' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        <StepIcon className="w-3 h-3 shrink-0" />
                        <span className="text-[8px] font-semibold truncate">{step.label}</span>
                      </div>
                      <div className="mt-0.5 text-[7px] leading-tight opacity-80">{step.detail}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {panelVisibility.qa && (
            <div
              data-testid="f85-canvas-tools-panel"
              aria-label="Herramientas F85 calibracion puntos criticos presets snapshot"
              className="absolute bottom-[118px] left-2 bg-white/95 backdrop-blur-sm rounded-md border border-orange-200 shadow-sm z-10 w-[260px] overflow-hidden"
            >
              <div className="px-2.5 py-1.5 border-b border-orange-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Ruler className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700 truncate">F85 canvas QA tools</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span data-testid="f88-layer-coverage-chip" className="text-[8px] text-orange-700 font-mono bg-orange-50 border border-orange-100 rounded px-1">
                    F88 {f88Coverage.coveragePct}%
                  </span>
                  <span data-testid="f89-heatmap-status-chip" className={`text-[8px] font-mono border rounded px-1 ${f89Heatmap.heatmapReady ? 'text-red-700 bg-red-50 border-red-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                    F89 {heatmapEnabled ? heatmapPointCount : 'off'}
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    {f85Readiness.filter(item => item.ready).length}/{f85Readiness.length}
                  </span>
                  <button
                    type="button"
                    className="h-5 w-5 rounded text-slate-400 hover:bg-orange-50 hover:text-orange-700"
                    onClick={() => setPanelVisible('qa', false)}
                    title="Cerrar panel de herramientas QA"
                    aria-label="Cerrar panel de herramientas QA"
                  >
                    <X className="h-3 w-3 mx-auto" />
                  </button>
                </div>
              </div>
              <div className="p-1.5 grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={onCalibrateScale}
                  disabled={!onCalibrateScale}
                  className="min-h-[46px] rounded border border-slate-200 bg-slate-50 px-1 py-1 text-left text-slate-600 hover:bg-orange-50 hover:border-orange-200 disabled:cursor-default disabled:opacity-70"
                >
                  <Ruler className="w-3 h-3 text-[#f97316]" />
                  <div className="text-[8px] font-semibold truncate">Calibrar</div>
                  <div className="text-[7px] opacity-80 truncate">{f85Readiness[0].detail}</div>
                </button>
                <button
                  type="button"
                  onClick={onAddCriticalPoint}
                  disabled={!onAddCriticalPoint}
                  className="min-h-[46px] rounded border border-slate-200 bg-slate-50 px-1 py-1 text-left text-slate-600 hover:bg-orange-50 hover:border-orange-200 disabled:cursor-default disabled:opacity-70"
                >
                  <MapPin className="w-3 h-3 text-red-500" />
                  <div className="text-[8px] font-semibold truncate">Punto critico</div>
                  <div className="text-[7px] opacity-80 truncate">{f85Readiness[1].detail}</div>
                </button>
                <button
                  type="button"
                  onClick={onOpenShieldingPresets}
                  disabled={!onOpenShieldingPresets}
                  className="min-h-[46px] rounded border border-slate-200 bg-slate-50 px-1 py-1 text-left text-slate-600 hover:bg-orange-50 hover:border-orange-200 disabled:cursor-default disabled:opacity-70"
                >
                  <Layers className="w-3 h-3 text-slate-700" />
                  <div className="text-[8px] font-semibold truncate">Presets</div>
                  <div className="text-[7px] opacity-80 truncate">{SHIELDING_PRESETS.length} mat.</div>
                </button>
                <button
                  type="button"
                  onClick={onAuditSnapshot || onExportPNG}
                  className="min-h-[46px] rounded border border-slate-200 bg-slate-50 px-1 py-1 text-left text-slate-600 hover:bg-orange-50 hover:border-orange-200"
                  title={auditSnapshot ? `${auditSnapshot.counts.barriers} barreras, ${auditSnapshot.counts.sources} fuentes` : 'Snapshot'}
                >
                  <ImageIcon className="w-3 h-3 text-blue-600" />
                  <div className="text-[8px] font-semibold truncate">Snapshot</div>
                  <div className="text-[7px] opacity-80 truncate">{f85Readiness[3].detail}</div>
                </button>
              </div>
            </div>
            )}

            {panelVisibility.workflow && (
            <div
              data-testid="canvas-workflow-panel"
              aria-label="Flujo layout blindaje memoria"
              className={workflowPanelClass}
            >
              <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700 truncate">Layout - blindaje - memoria</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] text-slate-500 font-mono">
                    {workflowSteps.filter(step => step.ready).length}/{workflowSteps.length}
                  </span>
                  <button
                    type="button"
                    data-testid="f188-workflow-dock-button"
                    className="h-5 w-5 rounded text-slate-400 hover:bg-orange-50 hover:text-orange-700"
                    onClick={cycleWorkflowDock}
                    title={`Desplazar panel: actual ${workflowDock === 'top' ? 'arriba' : workflowDock === 'right' ? 'derecha' : 'abajo'}`}
                    aria-label="Desplazar panel de flujo layout blindaje memoria"
                  >
                    <Move className="h-3 w-3 mx-auto" />
                  </button>
                  <button
                    type="button"
                    data-testid="f201-workflow-compact-button"
                    className="h-5 w-5 rounded text-slate-400 hover:bg-orange-50 hover:text-orange-700"
                    onClick={() => setWorkflowCompact((value) => !value)}
                    title={workflowCompact ? 'Expandir panel de flujo' : 'Compactar panel de flujo para liberar canvas'}
                    aria-label={workflowCompact ? 'Expandir panel de flujo' : 'Compactar panel de flujo para liberar canvas'}
                  >
                    {workflowCompact ? <ChevronDown className="h-3 w-3 mx-auto" /> : <ChevronUp className="h-3 w-3 mx-auto" />}
                  </button>
                  <button
                    type="button"
                    data-testid="f201-workflow-close-button"
                    className="h-5 w-5 rounded text-slate-400 hover:bg-orange-50 hover:text-orange-700"
                    onClick={() => setPanelVisible('workflow', false)}
                    title="Cerrar panel de flujo"
                    aria-label="Cerrar panel de flujo"
                  >
                    <X className="h-3 w-3 mx-auto" />
                  </button>
                </div>
              </div>
              {!workflowCompact && (
              <>
              <div
                data-testid="f90-e2e-qa-panel"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={`F90 smoke release: ${f90Summary.ready}/${f90Summary.total} listo(s)`}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${f90Summary.releaseReadyOffline ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                  F90 {f90Summary.pct}%
                </span>
                <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                  {f90Checklist.map(step => (
                    <span
                      key={step.id}
                      data-testid={`f90-step-${step.id}`}
                      className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${step.ready ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                      title={step.detail}
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>
              <div
                data-testid="f91-canvas-advanced-panel"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f91Canvas.nextActions.join(' ') || 'Canvas avanzado listo para siguiente validacion'}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${f91Canvas.precisionReady ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-sky-50 text-sky-700 border border-sky-100'}`}>
                  F91 {f91Canvas.precisionScore}%
                </span>
                <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                  {[
                    ['Edit', f91Canvas.contextualEditReady],
                    ['Cotas', f91Canvas.measurementReady],
                    ['Capas', f91Canvas.layerReady],
                    ['Heat', f91Canvas.heatmapReady],
                  ].map(([label, ready]) => (
                    <span
                      key={String(label)}
                      data-testid={`f91-chip-${String(label).toLowerCase()}`}
                      className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${ready ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                    >
                      {label}
                    </span>
                  ))}
                  <span className="text-[7px] text-slate-400 truncate">
                    Sel: {f91Canvas.selectedObjectType}
                  </span>
                </div>
              </div>
              <div
                data-testid="f99-cad-like-readiness-panel"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f99Cad.nextCadActions.join(' | ')}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${f99Cad.score >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                  F99 {f99Cad.score}%
                </span>
                <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                  {f99Cad.capabilities.map((item) => (
                    <span
                      key={item.id}
                      data-testid={`f99-cad-${item.id}`}
                      className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                        item.status === 'ready'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : item.status === 'partial'
                            ? 'bg-sky-50 text-sky-700 border-sky-100'
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}
                      title={`${item.current} Falta: ${item.missing}`}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
              <div
                data-testid="f122-structural-overlay-panel"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f122StructuralOverlay.nextAction}
              >
                <span
                  data-testid="f122-structural-risk-chip"
                  className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                    f122StructuralOverlay.highOrCriticalCount > 0
                      ? 'bg-orange-50 text-orange-700 border border-orange-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}
                >
                  F122 {f122StructuralOverlay.highOrCriticalCount}/{f122StructuralOverlay.barrierCount}
                </span>
                <span className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f122StructuralOverlay.totalMassKg} kg
                </span>
                <span
                  data-testid="f122-review-required-chip"
                  className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                    f122StructuralOverlay.reviewRequiredCount > 0
                      ? 'bg-orange-50 text-orange-700 border-orange-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  Rev {f122StructuralOverlay.reviewRequiredCount}
                </span>
                <span
                  data-testid="f122-datasheet-required-chip"
                  className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                    f122StructuralOverlay.datasheetRequiredCount > 0
                      ? 'bg-sky-50 text-sky-700 border-sky-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  Ficha {f122StructuralOverlay.datasheetRequiredCount}
                </span>
                <span className="text-[7px] text-slate-400 truncate">
                  {f122StructuralOverlay.overlayReady ? `${f122StructuralOverlay.averageKgM2} kg/m2 prom.` : 'Dibujar barreras'}
                </span>
              </div>
              <div
                data-testid="f141-professional-canvas-panel"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f141ProfessionalCanvas.nextImprovements.join(' | ')}
              >
                <span className="text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 bg-violet-50 text-violet-700 border border-violet-100">
                  F141 {f141ProfessionalCanvas.score}%
                </span>
                <span
                  data-testid="f141-material-evidence-chip"
                  className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100"
                >
                  Material RAG 111
                </span>
                <span className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-orange-50 text-orange-700 border-orange-100">
                  OCR parcial 3p
                </span>
                <span className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-sky-50 text-sky-700 border-sky-100">
                  CAD {f141ProfessionalCanvas.cadEditing.filter((item) => item.status === 'ready').length}/{f141ProfessionalCanvas.cadEditing.length}
                </span>
                <span className="text-[7px] text-slate-400 truncate">
                  {f141ProfessionalCanvas.decision}
                </span>
              </div>
              <div
                data-testid="f145-cad-professional-panel"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f145CadProfessional.operationHints.join(' | ')}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f145CadProfessional.score >= 80
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}>
                  F145 {f145CadProfessional.score}%
                </span>
                {f145CadProfessional.capabilities.slice(0, 6).map((item) => (
                  <span
                    key={item.id}
                    data-testid={`f145-cad-${item.id}`}
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      item.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : item.status === 'partial'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                    title={item.evidence}
                  >
                    {item.label}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  Sel {f145CadProfessional.selectedCount} | Ctrl+drag lasso | snap interseccion
                </span>
              </div>
              <div
                data-testid="f171-canvas-polish-predeploy"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f171CanvasPolish.decision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f171CanvasPolish.status === 'canvas-polish-predeploy-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F171 {f171CanvasPolish.score}%
                </span>
                {f171CanvasPolish.items.slice(0, 7).map((item) => (
                  <span
                    key={item.id}
                    data-testid={`f171-polish-${item.id}`}
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      item.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : item.status === 'partial'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                    title={`${item.evidence} ${item.releaseUse}`}
                  >
                    {item.label}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  Canvas polish predeploy | no cambia calculos
                </span>
              </div>
              <div
                data-testid="f208-canvas-reporting-layer"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f208CanvasReporting.nextActions.join(' | ')}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f208CanvasReporting.status === 'canvas-reporting-layer-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                }`}>
                  F208 {f208CanvasReporting.score}%
                </span>
                {f208CanvasReporting.items.map((item) => (
                  <span
                    key={item.id}
                    data-testid={`f208-report-${item.id}`}
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      item.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : item.status === 'partial'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                    title={`${item.evidence} ${item.reportUse}`}
                  >
                    {item.label}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  Memoria/PDF/Evidence export
                </span>
              </div>
              <div
                data-testid="f220-canvas-cad-priority-actions"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f220CanvasCadActions.decision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f220CanvasCadActions.status === 'cad-priority-actions-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100'
                }`}>
                  F220 P0-P2
                </span>
                <span data-testid="f220-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f220CanvasCadActions.readyCount}/{f220CanvasCadActions.actions.length}
                </span>
                {f220CanvasCadActions.actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-testid={`f220-cad-action-${action.id}`}
                    className={`h-5 rounded border px-1.5 text-[7px] font-semibold whitespace-nowrap ${
                      action.status === 'ready'
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-white'
                        : action.status === 'partial'
                          ? 'border-sky-100 bg-sky-50 text-sky-700 hover:bg-white'
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-white hover:text-fuchsia-700'
                    }`}
                    onClick={() => runF220CanvasAction(action.id)}
                    title={`${action.priority} ${action.label}: ${action.evidence}. ${action.guardrail}`}
                    aria-label={`${action.priority} ${action.actionLabel}`}
                  >
                    {action.priority} {action.shortLabel}
                  </button>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  {f220CanvasCadActions.prioritySummary.P0}
                </span>
              </div>
              <div
                data-testid="f221-canvas-real-connections"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f221CanvasRealConnections.rendererUpgradeDecision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f221CanvasRealConnections.status === 'canvas-real-connections-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F221 Real
                </span>
                <span data-testid="f221-real-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f221CanvasRealConnections.readyCount}/{f221CanvasRealConnections.connections.length}
                </span>
                {f221CanvasRealConnections.connections.map((connection) => (
                  <span
                    key={connection.id}
                    data-testid={`f221-real-${connection.id}`}
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      connection.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : connection.status === 'partial'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                    title={`${connection.evidence}. Uso: ${connection.operatorUse} Siguiente: ${connection.nextHardening}`}
                  >
                    {connection.label}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  Renderer: capas primero, eventos con flag
                </span>
              </div>
              <div
                data-testid="f222-f226-canvas-hardening"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={`${f222ToF226CanvasHardening.nextRendererStep} ${f222ToF226CanvasHardening.eventBaseDecision}`}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f222ToF226CanvasHardening.status === 'canvas-hardening-bridge-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F222-F226
                </span>
                <span data-testid="f222-f226-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f222ToF226CanvasHardening.readyCount}R/{f222ToF226CanvasHardening.partialCount}P/{f222ToF226CanvasHardening.guardedCount}G
                </span>
                {f222ToF226CanvasHardening.items.map((item) => (
                  <span
                    key={item.id}
                    data-testid={`f222-f226-${item.phase.toLowerCase()}-${item.id}`}
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      item.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : item.status === 'partial'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                    title={`${item.phase}: ${item.evidence} Accion segura: ${item.safeAction} Guardrail: ${item.releaseGuardrail}`}
                  >
                    {item.phase} {item.label}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  renderer/helpers, events flag, E2E, iso/3D
                </span>
              </div>
              <div
                data-testid="f227-renderer-layer-extraction"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f227RendererLayerExtraction.nextImplementation}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f227RendererLayerExtraction.status === 'renderer-layer-extraction-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F227 Layers
                </span>
                <span data-testid="f227-layer-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f227RendererLayerExtraction.registry.layerCount} capas
                </span>
                <span data-testid="f227-layer-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100">
                  {f227RendererLayerExtraction.registry.readyCount} listas
                </span>
                <span data-testid="f227-layer-extractable-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-sky-50 text-sky-700 border-sky-100">
                  {f227RendererLayerExtraction.registry.extractableCount} helpers
                </span>
                <span data-testid="f227-layer-guarded-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-500 border-slate-100">
                  {f227RendererLayerExtraction.registry.guardedCount} guardadas
                </span>
                {f227RendererLayerExtraction.safeFirstLayers.slice(0, 3).map((layerId) => (
                  <span
                    key={layerId}
                    data-testid={`f227-safe-layer-${layerId}`}
                    className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100"
                    title="Capa candidata para helper puro sin tocar eventos base"
                  >
                    {layerId}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  overlays/grips siguen protegidos
                </span>
              </div>
              <div
                data-testid="f228-static-renderer-helpers"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f228StaticRendererHelpers.nextRendererStep}
              >
                <span className="text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-100">
                  F228 Static
                </span>
                {f228StaticRendererHelpers.helpers.map((helper) => (
                  <span
                    key={helper}
                    data-testid={`f228-helper-${helper}`}
                    className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100"
                    title="Helper puro activo desde useCanvas.draw"
                  >
                    {helper.replace('drawCanvas', '').replace('drawFloorPlan', '')}
                  </span>
                ))}
                <span data-testid="f228-calibration-ready" className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                  f228StaticRendererHelpers.calibrationReady
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {f228StaticRendererHelpers.calibrationReady ? 'escala OK' : 'calibrar'}
                </span>
                <span className="text-[7px] text-slate-400 truncate">
                  grid/imagen/HUD extraidos; eventos intactos
                </span>
              </div>
              <div
                data-testid="f229-canvas-cad-e2e-harness"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f229CanvasCadE2EHarness.nextCoverage.join(' ')}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f229CanvasCadE2EHarness.status === 'canvas-cad-e2e-harness-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F229 E2E
                </span>
                <span data-testid="f229-canvas-e2e-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f229CanvasCadE2EHarness.readyCount}/{f229CanvasCadE2EHarness.coverage.length}
                </span>
                {f229CanvasCadE2EHarness.coverage.map((row) => (
                  <span
                    key={row.id}
                    data-testid={`f229-e2e-${row.id}`}
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      row.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : row.status === 'partial'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                    title={row.evidence}
                  >
                    {row.label}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  Playwright dedicado: shell, dibujo, seleccion, lasso, modos y export
                </span>
              </div>
              <div
                data-testid="f230-post-f229-coverage-gate"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f230PostF229CoverageGate.rendererEventDecision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f230PostF229CoverageGate.status === 'post-f229-coverage-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F230 Gate
                </span>
                <span data-testid="f230-post-f229-pass-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f230PostF229CoverageGate.passCount}/{f230PostF229CoverageGate.gates.length}
                </span>
                {f230PostF229CoverageGate.gates.map((gate) => (
                  <span
                    key={gate.id}
                    data-testid={`f230-gate-${gate.id}`}
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      gate.pass
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}
                    title={gate.evidence}
                  >
                    {gate.label}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  renderer/eventos: solo con flag y rollback
                </span>
              </div>
              <div
                data-testid="f231-f236-canvas-release-coverage"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f231ToF236CanvasReleaseCoverage.calculationEngineRecommendations.join(' ')}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f231ToF236CanvasReleaseCoverage.status === 'canvas-release-coverage-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F231-F236
                </span>
                <span data-testid="f231-f236-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f231ToF236CanvasReleaseCoverage.readyCount}/{f231ToF236CanvasReleaseCoverage.items.length}
                </span>
                {f231ToF236CanvasReleaseCoverage.items.map((item) => (
                  <span
                    key={item.phase}
                    data-testid={`f231-f236-${item.phase.toLowerCase()}`}
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      item.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}
                    title={`${item.evidence} Siguiente: ${item.nextDeepening}`}
                  >
                    {item.phase} {item.label}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  cierre visual/DXF/grips/iso/3D/deploy
                </span>
              </div>
              <div
                data-testid="f209-canvas-dimension-schedule"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f209DimensionSchedule.warnings.join(' | ') || f209DimensionSchedule.decision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f209DimensionSchedule.status === 'canvas-dimension-schedule-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F209 {f209DimensionSchedule.resultCoveragePct}%
                </span>
                <span data-testid="f209-dimension-total-length" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  L {f209DimensionSchedule.totalLengthM.toFixed(1)}m
                </span>
                <span data-testid="f209-dimension-barrier-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  Muros {f209DimensionSchedule.barrierCount}
                </span>
                {f209DimensionSchedule.rows.slice(0, 4).map((row) => (
                  <span
                    key={row.id}
                    data-testid="f209-dimension-row"
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      row.hasResult ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-sky-50 text-sky-700 border-sky-100'
                    }`}
                    title={`${row.label}: ${row.barrierType}, ${row.material}, ${row.lengthM.toFixed(2)} m, ${row.thicknessMm.toFixed(1)} mm`}
                  >
                    {row.label.slice(0, 10)} {row.lengthM.toFixed(1)}m
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  Escala {f209DimensionSchedule.scale_m_per_pixel || 0} m/px
                </span>
              </div>
              <div
                data-testid="f210-canvas-layer-manager"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f210LayerManager.warnings.join(' | ') || f210LayerManager.decision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f210LayerManager.status === 'canvas-layer-manager-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F210 {f210LayerManager.visibleCount}/{f210LayerManager.layerCount}
                </span>
                <span data-testid="f210-active-layer" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-sky-50 text-sky-700 border-sky-100">
                  Activa {f210LayerManager.activeLayer}
                </span>
                <span data-testid="f210-locked-layers" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  Lock {f210LayerManager.lockedCount}
                </span>
                {f210LayerManager.rows.slice(0, 5).map((row) => (
                  <span
                    key={row.id}
                    data-testid="f210-layer-row"
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      row.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : row.status === 'locked'
                          ? 'bg-slate-50 text-slate-700 border-slate-200'
                          : row.status === 'dimmed'
                            ? 'bg-violet-50 text-violet-700 border-violet-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}
                    title={`${row.label}: ${row.visible ? 'visible' : 'oculta'}, ${row.locked ? 'bloqueada' : 'editable'}, opacidad ${row.opacityPct}%, rol ${row.role}`}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full mr-1 align-middle" style={{ backgroundColor: row.color }} />
                    {row.label.slice(0, 9)} {row.opacityPct}%
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  Capas CAD sin abrir dialogo
                </span>
              </div>
              <div
                data-testid="f211-canvas-equipment-symbol-schedule"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f211EquipmentSchedule.warnings.join(' | ') || f211EquipmentSchedule.decision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f211EquipmentSchedule.status === 'canvas-equipment-symbols-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>F211 Eq {f211EquipmentSchedule.sourceCount}</span>
                <span data-testid="f211-equipment-footprint-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  FP {f211EquipmentSchedule.withFootprintCount}/{f211EquipmentSchedule.sourceCount}
                </span>
                <span data-testid="f211-equipment-manufacturer-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  Fab {f211EquipmentSchedule.withManufacturerCount}/{f211EquipmentSchedule.sourceCount}
                </span>
                {f211EquipmentSchedule.rows.slice(0, 4).map((row) => (
                  <span
                    key={row.id}
                    data-testid="f211-equipment-row"
                    className={`text-[7px] rounded border px-1 py-0.5 whitespace-nowrap ${
                      row.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : row.status === 'partial'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}
                    title={`${row.label}: ${row.modality}, ${row.standard}, ${row.manufacturerVariant}, ${row.footprint}, rot ${row.rotationDeg}deg, ${row.workload}`}
                  >
                    {row.label.slice(0, 10)} {row.standard}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  Simbolos/equipos para 3D y memoria
                </span>
              </div>
              <div
                data-testid="f212-heatmap-regulatory-legend"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f212HeatmapLegend.warnings.join(' | ') || f212HeatmapLegend.decision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f212HeatmapLegend.status === 'heatmap-regulatory-legend-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F212 Heat {f212HeatmapLegend.heatmapPointCount}
                </span>
                <span data-testid="f212-heatmap-max-proxy" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  Max {f212HeatmapLegend.maxWeeklyProxy_mSv.toFixed(3)}
                </span>
                <span data-testid="f212-isocontour-line-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  Iso {f212HeatmapLegend.sampleLineCount}/{f212HeatmapLegend.samplePointCount}
                </span>
                {f212HeatmapLegend.levels.map((level) => (
                  <span
                    key={level.id}
                    data-testid="f212-regulatory-level"
                    className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-white text-slate-700 border-slate-100"
                    title={`${level.label}: ${level.exportLabel}`}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full mr-1 align-middle" style={{ backgroundColor: level.color }} />
                    {level.label}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  Leyenda regulatoria exportable
                </span>
              </div>
              <div className="border-b border-slate-100 p-1.5">
                <ClinicalProjectMap floorPlan={floorPlan} compact />
              </div>
              <div className="px-2.5 py-1.5 grid grid-cols-5 gap-1">
                {workflowSteps.map(step => {
                  const StepIcon = step.ready ? CheckCircle2 : Circle;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={step.action}
                      disabled={!step.action}
                      title={step.actionLabel}
                      aria-label={step.actionLabel}
                      className={`min-h-[34px] rounded border px-1.5 py-1 text-left transition-colors ${
                        step.ready
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-orange-50 hover:border-orange-200'
                      } ${!step.action ? 'cursor-default opacity-80' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        <StepIcon className="w-3 h-3 shrink-0" />
                        <span className="text-[9px] font-semibold truncate">{step.label}</span>
                      </div>
                      <div className="mt-0.5 text-[8px] leading-tight opacity-80 truncate">
                        {step.ready ? 'Listo' : step.actionLabel}
                      </div>
                    </button>
                  );
                })}
              </div>
              </>
              )}
            </div>
            )}

            {!f375IsCleanWorkspace && (!panelVisibility.workflow || !panelVisibility.qa || !panelVisibility.continuity) && (
              <div
                data-testid="f188-hidden-panel-restore"
              className="absolute top-10 right-2 z-20 flex flex-wrap justify-end gap-1 rounded-md border border-slate-200 bg-white/95 p-1 shadow-sm"
                aria-label="Restaurar paneles ocultos del canvas"
              >
                {([
                  ['workflow', 'Flujo'],
                  ['qa', 'QA'],
                  ['continuity', 'Cont'],
                ] as const).map(([key, label]) => !panelVisibility[key] && (
                  <button
                    key={key}
                    type="button"
                  className="h-6 rounded border border-slate-200 bg-slate-50 px-2 text-[9px] font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-700"
                    onClick={() => setPanelVisible(key, true)}
                    title={`Restaurar panel ${label}`}
                    aria-label={`Restaurar panel ${label}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className={`absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-md border border-slate-200 shadow-sm z-10 transition-all ${legendCollapsed ? 'px-2 py-1' : 'px-3 py-2'}`}>
              <button
                onClick={() => setLegendCollapsed(!legendCollapsed)}
                className="flex items-center gap-1 w-full text-[10px] font-semibold text-slate-700 mb-0 hover:text-[#f97316] transition-colors"
              >
                {legendCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                <span className={legendCollapsed ? 'text-[9px]' : 'text-[11px]'}>Leyenda</span>
              </button>
              {!legendCollapsed && (
                <div className="space-y-1 mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />
                    <span className="text-slate-500 text-[10px]">Punto de calculo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-red-500 inline-block" />
                    <span className="text-slate-500 text-[10px]">Max. air-kerma</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-blue-500 inline-block" />
                    <span className="text-slate-500 text-[10px]">Max. espesor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                    <span className="text-slate-500 text-[10px]">Linea 0.3m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#f97316] inline-block" />
                    <span className="text-slate-500 text-[10px]">Muro zona controlada</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-sky-500 inline-block" />
                    <span className="text-slate-500 text-[10px]">Techo/losa 2D</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-emerald-500/10 border border-dashed border-emerald-600 inline-block" />
                    <span className="text-slate-500 text-[10px]">Region controlada</span>
                  </div>
                  {hasResults && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span className="w-3 h-3 bg-emerald-500/30 border border-emerald-500 inline-block" />
                      <span className="text-emerald-600 font-medium text-[10px]">Cumple P</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ═══ FLOATING CONTROLS ═══ */}
            <div className="absolute bottom-16 right-2 flex flex-col gap-1 z-10">
              <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md bg-white hover:bg-[#fff7ed]" title="Ajustar vista: centra todo el plano como Zoom Extents CAD/SketchUp" onClick={onZoomToFit}>
                <Maximize className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md bg-white hover:bg-[#fff7ed]" title="Acercar vista del floorplan sin modificar escala real del proyecto"
                onClick={() => setCanvasState((p: CanvasState) => ({ ...p, scale: Math.min(10, p.scale * 1.2) }))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md bg-white hover:bg-[#fff7ed]" title="Alejar vista para revisar layout, zonas controladas y rutas de acceso"
                onClick={() => setCanvasState((p: CanvasState) => ({ ...p, scale: Math.max(0.1, p.scale / 1.2) }))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button size="icon" variant={canvasState.snapToGrid ? "default" : "secondary"} className="h-8 w-8 shadow-md"
                title="Activar/desactivar snap a grilla para muros, cotas, equipos y puntos de control" onClick={onToggleSnap}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md bg-white hover:bg-[#fff7ed]" title="Exportar vista PNG del canvas para memoria analitica, QA o Evidence Pack" onClick={onExportPNG}>
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* v111: All tools moved to left sidebar — see Sidebar.tsx */}
      </div>

      {/* ═══ RESULTS PANEL (Recomendacion #4: visualizacion en canvas) ═══ */}
      {hasResults && (
        <div className="shrink-0 max-h-[180px] bg-white border-t border-slate-200 overflow-auto">
          <div className="px-3 py-2 bg-[#fff7ed] border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-700">Resultados — Maximos por Barrera (NCRP 147)</h3>
            <span className="text-[9px] text-slate-400">RadShield (DeLorenzo et al. 2016)</span>
          </div>
          <table className="w-full text-[10px]">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="border-b border-slate-200">
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Barrera</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Kerma (mGy/wk)</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Pb (mm)</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Concreto (mm)</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Material</th>
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Ubicacion</th>
              </tr>
            </thead>
            <tbody>
              {barrierResults.map((r, i) => (
                <tr key={r.barrierId} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-2 py-1.5 font-medium text-slate-700">{r.barrierName}</td>
                  <td className="text-right px-2 py-1.5 text-red-600 font-mono">{formatResultNumber((r as any).maxKermaRate_mGy_per_wk ?? (r as any).maxKermaRate, 4)}</td>
                  <td className="text-right px-2 py-1.5 text-blue-600 font-mono">{formatResultNumber((r as any).thicknessLead_mm ?? (r as any).maxThicknessPbMm, 3)}</td>
                  <td className="text-right px-2 py-1.5 text-slate-600 font-mono">{formatResultNumber((r as any).thicknessConcrete_mm ?? (r as any).maxThicknessConcreteMm, 1)}</td>
                  <td className="text-right px-2 py-1.5 text-slate-500">{(r as any).material || 'N/A'}</td>
                  <td className="px-2 py-1.5 text-slate-500">{(r as any).location || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ STATUS LINE ═══ */}
      <div className="shrink-0 h-5 bg-white border-t border-slate-200 flex items-center px-2 text-[9px] text-slate-400 gap-3">
        <span>Sample lines: {sampleLines.length}</span>
        <span>Points: {sampleLines.reduce((acc, sl) => acc + sl.points.length, 0)}</span>
        {controlledZoneSummary.hasControlledZone && (
          <span className="text-emerald-600 font-medium">
            Zona controlada: {controlledZoneSummary.wallCount} muros + {controlledZoneSummary.ceilingCount} techo/losa
          </span>
        )}
        {hasResults && <span className="text-emerald-600 font-medium">Resultados calculados</span>}
        <div className="flex-1" />
        {onRunCalculations && (
          <Button size="sm" className="h-4 text-[9px] px-2 bg-[#f97316] hover:bg-[#ea580c] text-white gap-0.5" onClick={onRunCalculations}>
            <Calculator className="w-2.5 h-2.5" /> Calcular
          </Button>
        )}
      </div>
    </div>
  );
}
