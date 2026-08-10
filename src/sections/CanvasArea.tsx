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
import { buildRendererBaseV2Summary } from '@/lib/canvas/renderDynamicHelpers';
import { buildF228StaticRendererHelpers } from '@/lib/f228StaticRendererHelpers';
import { buildF229CanvasCadE2EHarness } from '@/lib/f229CanvasCadE2EHarness';
import { buildF230PostF229CoverageGate } from '@/lib/f230PostF229CoverageGate';
import { buildF231ToF236CanvasReleaseCoverage } from '@/lib/f231ToF236CanvasReleaseCoverage';
import { buildF411BimCanvasMethodology } from '@/lib/f411BimCanvasMethodology';
import { buildF413BimExecutionPlan } from '@/lib/f413BimExecutionPlan';
import { buildF414BimVideoReferencePlan } from '@/lib/f414BimVideoReference';
import { buildF415BimMepCoordinationPlan } from '@/lib/f415BimMepCoordination';
import { buildF416ToF420BimCanvasSequence } from '@/lib/f416ToF420BimCanvasSequence';
import { buildF421ToF425BimHandoffPlan } from '@/lib/f421ToF425BimHandoff';
import { buildF426ToF430CalcRendererClosure } from '@/lib/f426ToF430CalcRendererClosure';
import { buildF431ToF435RendererReleaseGate } from '@/lib/f431ToF435RendererReleaseGate';
import { buildF436ToF438RendererV2Bridge } from '@/lib/f436ToF438RendererV2Bridge';
import { buildF439ToF441RendererGeometryCore } from '@/lib/f439ToF441RendererGeometryCore';
import { buildF442ToF445RendererV2Runtime, drawF442ToF445RendererV2Overlay } from '@/lib/f442ToF445RendererV2Runtime';
import { buildF446ToF448CanvasStrongQa } from '@/lib/f446ToF448CanvasStrongQa';
import { buildF449ToF453BimMemoryVisual } from '@/lib/f449ToF453BimMemoryVisual';
import { buildF520F524DeepRendererBabylonContract } from '@/lib/f520F524DeepRendererBabylon';
import { buildF525F529ClinicalPlacementPack, type F525F529Modality } from '@/lib/f525F529ClinicalPlacementPack';
import { buildF530F534EquipmentPlacementPreview, type F530F534PlacementPoint } from '@/lib/f530F534EquipmentPlacementPreview';
import { buildF540F544GhostDragGate } from '@/lib/f540F544GhostDragGate';
import { buildF545F549GhostSourceCommit } from '@/lib/f545F549GhostSourceCommit';
import { buildF550F555FunctionalBetaClosure } from '@/lib/f550F555FunctionalBetaClosure';
import { buildF556F560PostBetaDeepStack } from '@/lib/f556F560PostBetaDeepStack';
import { buildF561F565RendererEventControllerV2 } from '@/lib/f561F565RendererEventControllerV2';
import { buildF566F570PostBetaProductionReadiness } from '@/lib/f566F570PostBetaProductionReadiness';
import { buildF571F580UnityDbTechnicalClosure } from '@/lib/f571F580UnityDbTechnicalClosure';
import { buildF581F585ExpandedNormativeNumericQa } from '@/lib/f581F585ExpandedNormativeNumericQa';
import { buildF586F590NormativeDatasetQa } from '@/lib/f586F590NormativeDatasetQa';
import { buildF591F620GeneralImprovements, type F591F620InspectorMode } from '@/lib/f591F620GeneralImprovements';
import { buildF621F625RendererBaseDeep, drawF621F625RendererBaseDeepHud } from '@/lib/f621F625RendererBaseDeep';
import { buildF626F630RendererBaseScheduler, drawF626F630RendererSchedulerHud } from '@/lib/f626F630RendererBaseScheduler';
import { buildF631F635RendererTileInvalidation, drawF631F635TileInvalidationOverlay } from '@/lib/f631F635RendererTileInvalidation';
import { buildF636F640RendererHitTestShadow, drawF636F640HitTestShadowOverlay } from '@/lib/f636F640RendererHitTestShadow';
import { buildF641F645RendererEventDryRun } from '@/lib/f641F645RendererEventDryRun';
import { buildF646F650RendererSelectionTransaction } from '@/lib/f646F650RendererSelectionTransaction';
import { buildF484F490NormativeQa } from '@/lib/f484F490NormativeQa';
import { buildF491F498RegulatoryMaterialsDb } from '@/lib/f491F498RegulatoryMaterialsDb';
import { buildF501F504HeavyAssetsDbPrep } from '@/lib/f501F504HeavyAssetsDbPrep';
import { buildMedicalScene, type MedicalRoomPreset } from '@/lib/medical3D/sceneBuilder';
import { buildBabylonDeepRuntimeContract } from '@/lib/medical3D/babylonDeepRuntime';
import { buildUnityWebglExportedBuildContract } from '@/lib/medical3D/unityWebglExportedBuild';
import { buildAdvancedPhotorealPackContract } from '@/lib/medical3D/advancedPhotorealPack';
import { buildDefaultPbrMaterialDatabase, buildPbrMaterialDbUpdate } from '@/lib/medical3D/pbrMaterialDatabase';
import { isEnabled } from '@/lib/featureFlags';
import { buildF515CanvasEventHardening, routeCanvasEventV2WithGate } from '@/lib/f515CanvasEventHardening';
import type { CanvasEventModeV2 } from '@/lib/canvas/eventControllerV2';
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
const F525_PLACEMENT_MODE_KEY = 'radshield_canvas_f525_placement_mode';
const F591_QA_INSPECTOR_MODE_KEY = 'radshield_canvas_qa_inspector_mode_f591';
const DEFAULT_F188_PANEL_VISIBILITY: Record<F188CanvasPanelKey, boolean> = {
  workflow: false,
  qa: false,
  continuity: false,
};
const DEFAULT_CANVAS_FLOOR_PLAN: FloorPlan = {
  id: 'canvas-default-floorplan',
  name: 'Plano sin cargar',
  imageUrl: null,
  scale_m_per_pixel: 0.01,
  width_pixels: 1200,
  height_pixels: 800,
  barriers: [],
  sources: [],
  occupiedRegions: [],
  regions: [],
  criticalPoints: [],
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

function loadF591QaInspectorMode(): F591F620InspectorMode {
  if (typeof window === 'undefined') return 'compact';
  return window.localStorage.getItem(F591_QA_INSPECTOR_MODE_KEY) === 'expanded' ? 'expanded' : 'compact';
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

function loadF525PlacementMode(): F525F529Modality {
  if (typeof window === 'undefined') return 'TX';
  const stored = window.localStorage.getItem(F525_PLACEMENT_MODE_KEY);
  return stored === 'TX' || stored === 'NM' || stored === 'DX' || stored === 'CY' ? stored : 'TX';
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
  onCommitGhostSource?: (payload: {
    point: F530F534PlacementPoint;
    equipment: string;
    modality: F525F529Modality;
    room: string;
    material: string;
    memoryProfile: string;
    footprint_m: [number, number];
  }) => string | void;
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
  onCommitGhostSource,
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
  floorPlan = DEFAULT_CANVAS_FLOOR_PLAN,
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
  const [lastF515EventAction, setLastF515EventAction] = useState<string>('stable');
  const [canvasChromeMode, setCanvasChromeMode] = useState<F375CanvasChromeMode>(loadF375CanvasChromeMode);
  const [f525PlacementMode, setF525PlacementMode] = useState<F525F529Modality>(loadF525PlacementMode);
  const [f591QaInspectorMode, setF591QaInspectorMode] = useState<F591F620InspectorMode>(loadF591QaInspectorMode);
  const [f530PlacementPoint, setF530PlacementPoint] = useState<F530F534PlacementPoint | null>(null);
  const [f540DraggingGhost, setF540DraggingGhost] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const f540DragStartRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPoint: F530F534PlacementPoint;
  } | null>(null);
  // v65: Freehand canvas overlay ref
  const freehandCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererV2OverlayCanvasRef = useRef<HTMLCanvasElement>(null);

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
      const routed = routeCanvasEventV2WithGate({
        type: 'wheel',
        mode: 'zoom',
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      }, true);
      setLastF515EventAction(routed.action);
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvasState((p: CanvasState) => ({ ...p, scale: Math.max(0.1, Math.min(10, p.scale * delta)) }));
    } else {
      onWheel(e);
    }
  }, [onWheel, setCanvasState]);

  const getF561PointerMode = (eventType: 'pointerdown' | 'pointermove' | 'pointerup'): CanvasEventModeV2 => {
    if (activeTool === 'pan') return 'pan';
    if (canvasState.snapToGrid && eventType === 'pointermove') return 'snap';
    if (activeTool === 'select') return 'select';
    return 'tool';
  };

  const routeF561PointerEvent = (
    event: React.MouseEvent<HTMLCanvasElement>,
    eventType: 'pointerdown' | 'pointermove' | 'pointerup',
  ) => {
    const routed = routeCanvasEventV2WithGate({
      type: eventType,
      mode: getF561PointerMode(eventType),
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
    }, true);
    setLastF515EventAction(routed.action);
  };

  const handleF561MouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    routeF561PointerEvent(event, 'pointerdown');
    onMouseDown(event);
  };

  const handleF561MouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    routeF561PointerEvent(event, 'pointermove');
    onMouseMove(event);
  };

  const handleF561MouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    routeF561PointerEvent(event, 'pointerup');
    onMouseUp(event);
  };

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

  const toggleF591QaInspector = () => {
    setF591QaInspectorMode((previousMode) => {
      const nextMode: F591F620InspectorMode = previousMode === 'compact' ? 'expanded' : 'compact';
      if (typeof window !== 'undefined') window.localStorage.setItem(F591_QA_INSPECTOR_MODE_KEY, nextMode);
      toast.success(nextMode === 'compact' ? 'Inspector QA compacto' : 'Inspector QA expandido');
      return nextMode;
    });
  };

  const activateCanvasTool = (tool: F191CanvasTool) => {
    setActiveTool?.(tool);
  };

  const activateCanvasToolFromContext = (tool: F191CanvasTool) => {
    const routed = routeCanvasEventV2WithGate({
      type: 'pointerdown',
      mode: 'tool',
      x: contextMenu?.canvasX ?? 0,
      y: contextMenu?.canvasY ?? 0,
    }, true);
    setLastF515EventAction(routed.action);
    activateCanvasTool(tool);
  };

  const fitCanvasViewFromContext = () => {
    const routed = routeCanvasEventV2WithGate({
      type: 'pointerdown',
      mode: 'fit',
      x: contextMenu?.canvasX ?? 0,
      y: contextMenu?.canvasY ?? 0,
    }, true);
    setLastF515EventAction(routed.action);
    onZoomToFit();
  };

  const exportCanvasPngFromContext = () => {
    const routed = routeCanvasEventV2WithGate({
      type: 'pointerdown',
      mode: 'export',
      x: contextMenu?.canvasX ?? 0,
      y: contextMenu?.canvasY ?? 0,
    }, true);
    setLastF515EventAction(routed.action);
    onExportPNG();
  };

  const openEvidencePackFromContext = () => {
    const routed = routeCanvasEventV2WithGate({
      type: 'pointerdown',
      mode: 'evidence',
      x: contextMenu?.canvasX ?? 0,
      y: contextMenu?.canvasY ?? 0,
    }, true);
    setLastF515EventAction(routed.action);
    onOpenEvidencePack?.();
  };

  const runCalculationsFromContext = () => {
    const routed = routeCanvasEventV2WithGate({
      type: 'pointerdown',
      mode: 'calculation',
      x: contextMenu?.canvasX ?? 0,
      y: contextMenu?.canvasY ?? 0,
    }, true);
    setLastF515EventAction(routed.action);
    onRunCalculations?.();
  };

  const openMedical3DFromContext = () => {
    const routed = routeCanvasEventV2WithGate({
      type: 'pointerdown',
      mode: 'medical3d',
      x: contextMenu?.canvasX ?? 0,
      y: contextMenu?.canvasY ?? 0,
    }, true);
    setLastF515EventAction(routed.action);
    if (onOpenMedical3D) onOpenMedical3D();
    else onOpen3DViewer?.();
  };

  const selectF525PlacementMode = (mode: F525F529Modality) => {
    setF525PlacementMode(mode);
    if (typeof window !== 'undefined') window.localStorage.setItem(F525_PLACEMENT_MODE_KEY, mode);
    const nextPack = buildF525F529ClinicalPlacementPack({
      deepLane: f520ToF524DeepRendererBabylon,
      selectedModality: mode,
    });
    const selected = nextPack.defaultSelection;
    setLastCanvasCommand(`F525 ${selected.modality}: ${selected.equipment}`);
    toast.success(`Perfil ${selected.modality} seleccionado`, {
      description: `${selected.room} / ${selected.material}`,
    });
  };

  const runF525PlacementHandoff = () => {
    const selected = f525ToF529ClinicalPlacement.defaultSelection;
    setLastCanvasCommand(`F529 handoff: ${selected.equipment}`);
    toast.success('Handoff visual enviado a 3D', {
      description: `${selected.memoryProfile}: ${selected.room}`,
    });
    openMedical3DFromContext();
  };

  const makeF530ViewportCenterPoint = (): F530F534PlacementPoint => ({
    x: (canvasSize.width / 2 - canvasState.offsetX) / canvasState.scale,
    y: (canvasSize.height / 2 - canvasState.offsetY) / canvasState.scale,
    source: 'viewport-center',
  });

  const previewF530EquipmentAtCenter = () => {
    const point = makeF530ViewportCenterPoint();
    setF530PlacementPoint(point);
    setLastCanvasCommand(`F530 preview: ${f525ToF529ClinicalPlacement.defaultSelection.equipment}`);
    toast.success('Preview fantasma preparado', {
      description: `x ${point.x.toFixed(1)} / y ${point.y.toFixed(1)}`,
    });
  };

  const previewF530EquipmentAtContext = () => {
    const point: F530F534PlacementPoint = {
      x: contextMenu?.canvasX ?? makeF530ViewportCenterPoint().x,
      y: contextMenu?.canvasY ?? makeF530ViewportCenterPoint().y,
      source: 'context-menu',
    };
    setF530PlacementPoint(point);
    setLastCanvasCommand(`F530 context: ${f525ToF529ClinicalPlacement.defaultSelection.equipment}`);
    toast.success('Preview fantasma en punto CAD', {
      description: `x ${point.x.toFixed(1)} / y ${point.y.toFixed(1)}`,
    });
  };

  const confirmF531EquipmentPoint = () => {
    const point = f530PlacementPoint ?? makeF530ViewportCenterPoint();
    setF530PlacementPoint(point);
    setLastCanvasCommand(`F531 confirmado: ${f530ToF534EquipmentPreview.selected.equipment}`);
    toast.success('Punto candidato confirmado', {
      description: `No se escribio geometria permanente. x ${point.x.toFixed(1)} / y ${point.y.toFixed(1)}`,
    });
  };

  const commitF545GhostSource = () => {
    if (!onCommitGhostSource) {
      toast.error('Persistencia de fuente no conectada', {
        description: 'F545 requiere callback desde ShieldingDesigner.',
      });
      return;
    }
    const point = f530PlacementPoint ?? makeF530ViewportCenterPoint();
    const sourceId = onCommitGhostSource({
      point,
      equipment: f530ToF534EquipmentPreview.selected.equipment,
      modality: f530ToF534EquipmentPreview.selected.modality as F525F529Modality,
      room: f530ToF534EquipmentPreview.selected.room,
      material: f530ToF534EquipmentPreview.selected.material,
      memoryProfile: f530ToF534EquipmentPreview.selected.memoryProfile,
      footprint_m: f530ToF534EquipmentPreview.ghost.footprint_m,
    });
    setF530PlacementPoint(null);
    setLastCanvasCommand(`F545 fuente creada: ${f530ToF534EquipmentPreview.selected.equipment}`);
    toast.success('Fuente creada desde ghost', {
      description: sourceId ? `Seleccionada: ${sourceId}` : 'Alta enviada al floorplan.',
    });
  };

  const startF540GhostDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const point = f530PlacementPoint ?? makeF530ViewportCenterPoint();
    f540DragStartRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPoint: point,
    };
    setF540DraggingGhost(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    setLastCanvasCommand(`F540 drag start: ${f530ToF534EquipmentPreview.selected.equipment}`);
  };

  const moveF540GhostDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = f540DragStartRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const scale = canvasState.scale > 0 ? canvasState.scale : 1;
    const dx = (event.clientX - drag.startClientX) / scale;
    const dy = (event.clientY - drag.startClientY) / scale;
    setF530PlacementPoint({
      x: drag.startPoint.x + dx,
      y: drag.startPoint.y + dy,
      source: 'drag',
    });
  };

  const endF540GhostDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = f540DragStartRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    f540DragStartRef.current = null;
    setF540DraggingGhost(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already be released by the browser on cancel.
    }
    setLastCanvasCommand(`F541 drag end: ${f530ToF534EquipmentPreview.selected.equipment}`);
    toast.success('Ghost reubicado', {
      description: 'Preview no persistente; use Confirmar para handoff.',
    });
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
  const floorPlanScale = Number.isFinite(floorPlan?.scale_m_per_pixel) && (floorPlan?.scale_m_per_pixel ?? 0) > 0
    ? floorPlan!.scale_m_per_pixel
    : 0.05;
  const f228StaticRendererHelpers = buildF228StaticRendererHelpers({
    hasFloorPlanImage: Boolean(floorPlan?.imageUrl),
    scale: canvasState.scale,
    scale_m_per_pixel: floorPlanScale,
  });
  const f387RendererBaseV2 = buildRendererBaseV2Summary({
    heatmapPointCount,
    sampleLineCount: sampleLines.length,
    rendererHelpersActive: f228StaticRendererHelpers.helpers,
    eventControllerTouched: false,
  });
  const f229CanvasCadE2EHarness = buildF229CanvasCadE2EHarness({
    barrierCount,
    sourceCount,
    regionCount,
    selectedCount: canvasState.selectedIds.length || (canvasState.selectedId ? 1 : 0),
    snapToGrid: canvasState.snapToGrid,
    visualMode,
    hasExport: Boolean(onExportPNG),
    hasFloorPlanScale: Number.isFinite(floorPlanScale) && floorPlanScale > 0,
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
  const f411BimMethodology = buildF411BimCanvasMethodology({
    floorPlan,
    layers,
    activeLayer,
    selectedKind: selectedInspectorKind,
    selectedName: selectedInspectorName,
  });
  const f413BimExecutionPlan = buildF413BimExecutionPlan(f411BimMethodology);
  const f414BimVideoReference = buildF414BimVideoReferencePlan(true);
  const f415BimMepCoordination = buildF415BimMepCoordinationPlan();
  const f416ToF420BimCanvasSequence = buildF416ToF420BimCanvasSequence({
    floorPlan,
    f415: f415BimMepCoordination,
  });
  const f421ToF425BimHandoff = buildF421ToF425BimHandoffPlan({
    floorPlan,
    sequence: f416ToF420BimCanvasSequence,
  });
  const f426ToF430CalcRendererClosure = buildF426ToF430CalcRendererClosure({
    floorPlan,
    sequence: f416ToF420BimCanvasSequence,
    handoff: f421ToF425BimHandoff,
  });
  const f431ToF435RendererReleaseGate = buildF431ToF435RendererReleaseGate(f426ToF430CalcRendererClosure);
  const f436ToF438RendererV2Bridge = buildF436ToF438RendererV2Bridge({
    floorPlan,
    closure: f426ToF430CalcRendererClosure,
    releaseGate: f431ToF435RendererReleaseGate,
  });
  const f439ToF441RendererGeometryCore = buildF439ToF441RendererGeometryCore({
    floorPlan,
    closure: f426ToF430CalcRendererClosure,
    bridge: f436ToF438RendererV2Bridge,
    highRiskFlagEnabled: isEnabled('canvasHighRiskCad'),
  });
  const f442ToF445RendererV2Runtime = buildF442ToF445RendererV2Runtime(f439ToF441RendererGeometryCore);
  const f621ToF625RendererBaseDeep = buildF621F625RendererBaseDeep(f442ToF445RendererV2Runtime, {
    width: canvasSize.width,
    height: canvasSize.height,
    scale: canvasState.scale,
    offsetX: canvasState.offsetX,
    offsetY: canvasState.offsetY,
  });
  const f626ToF630RendererBaseScheduler = buildF626F630RendererBaseScheduler(f621ToF625RendererBaseDeep, {
    targetFps: 60,
    maxCommandsPerFrame: canvasChromeMode === 'guided' ? 6 : 10,
    highRiskRendererEnabled: isEnabled('canvasHighRiskCad'),
  });
  const f631ToF635RendererTileInvalidation = buildF631F635RendererTileInvalidation(
    f621ToF625RendererBaseDeep,
    f626ToF630RendererBaseScheduler,
    {
      width: canvasSize.width,
      height: canvasSize.height,
      tileSize: canvasChromeMode === 'guided' ? 160 : 220,
      highRiskRendererEnabled: isEnabled('canvasHighRiskCad'),
    },
  );
  const f636ToF640RendererHitTestShadow = buildF636F640RendererHitTestShadow(
    f621ToF625RendererBaseDeep,
    f631ToF635RendererTileInvalidation,
    {
      pointer: {
        x: Math.round(canvasSize.width * 0.48),
        y: Math.round(canvasSize.height * 0.44),
      },
      highRiskRendererEnabled: isEnabled('canvasHighRiskCad'),
    },
  );
  const f641ToF645RendererEventDryRun = buildF641F645RendererEventDryRun(
    f636ToF640RendererHitTestShadow,
    {
      activeTool,
      selectedId: canvasState.selectedId,
      selectedIds: canvasState.selectedIds,
      snapToGrid: canvasState.snapToGrid,
      highRiskRendererEnabled: isEnabled('canvasHighRiskCad'),
    },
  );
  const f646ToF650RendererSelectionTransaction = buildF646F650RendererSelectionTransaction(
    f641ToF645RendererEventDryRun,
    {
      highRiskRendererEnabled: isEnabled('canvasHighRiskCad'),
    },
  );
  const f556MedicalPresetByModality: Record<F525F529Modality, MedicalRoomPreset> = {
    TX: 'linac',
    NM: 'petct',
    DX: 'ct',
    CY: 'radiofarmacia',
  };
  const f556MedicalScene = buildMedicalScene(floorPlan, f556MedicalPresetByModality[f525PlacementMode]);
  const f556BabylonDeepRuntime = buildBabylonDeepRuntimeContract(f556MedicalScene);
  const f520ToF524DeepRendererBabylon = buildF520F524DeepRendererBabylonContract({
    renderer: f442ToF445RendererV2Runtime,
    babylon: f556BabylonDeepRuntime,
  });
  const f525ToF529ClinicalPlacement = buildF525F529ClinicalPlacementPack({
    deepLane: f520ToF524DeepRendererBabylon,
    selectedModality: f525PlacementMode,
  });
  const f530ToF534EquipmentPreview = buildF530F534EquipmentPlacementPreview({
    pack: f525ToF529ClinicalPlacement,
    point: f530PlacementPoint ?? undefined,
    scale_m_per_pixel: floorPlanScale,
  });
  const f540ToF544GhostDragGate = buildF540F544GhostDragGate();
  const f545ToF549GhostSourceCommit = buildF545F549GhostSourceCommit();
  const f550ToF555FunctionalBetaClosure = buildF550F555FunctionalBetaClosure({
    babylonRuntimePresent: true,
    e2eVisualReady: false,
  });
  const f556PbrMaterialDb = buildPbrMaterialDbUpdate(buildDefaultPbrMaterialDatabase('2026-08-09T00:00:00.000Z'), '2026-08-09T00:00:00.000Z');
  const f556UnityExportedBuild = buildUnityWebglExportedBuildContract(f556MedicalScene);
  const f556AdvancedPhotoreal = buildAdvancedPhotorealPackContract({
    scene: f556MedicalScene,
    pbrMaterialDb: f556PbrMaterialDb,
    photorealEnabled: true,
  });
  const f556NormativeQa = buildF484F490NormativeQa();
  const f556ToF560PostBetaDeepStack = buildF556F560PostBetaDeepStack({
    betaClosure: f550ToF555FunctionalBetaClosure,
    deepRenderer: f520ToF524DeepRendererBabylon,
    unity: f556UnityExportedBuild,
    photoreal: f556AdvancedPhotoreal,
    pbrDb: f556PbrMaterialDb,
    normativeQa: f556NormativeQa,
  });
  const f561ToF565RendererEventController = buildF561F565RendererEventControllerV2({
    postBeta: f556ToF560PostBetaDeepStack,
    eventHardening: buildF515CanvasEventHardening(),
    rendererRuntime: f442ToF445RendererV2Runtime,
    pointerWrappersActive: true,
  });
  const f566ToF570PostBetaProductionReadiness = buildF566F570PostBetaProductionReadiness({
    postBeta: f556ToF560PostBetaDeepStack,
    eventController: f561ToF565RendererEventController,
    visualScreenshotsReady: true,
    publicBetaAlreadyTested: true,
  });
  const f571ToF580UnityDbTechnicalClosure = buildF571F580UnityDbTechnicalClosure({
    unity: f556UnityExportedBuild,
    regulatoryDb: buildF491F498RegulatoryMaterialsDb(),
    heavyAssetsDbPrep: buildF501F504HeavyAssetsDbPrep(),
  });
  const f581ToF585ExpandedNormativeQa = buildF581F585ExpandedNormativeNumericQa();
  const f586ToF590NormativeDatasetQa = buildF586F590NormativeDatasetQa();
  const f591ToF620GeneralImprovements = buildF591F620GeneralImprovements({
    inspectorMode: f591QaInspectorMode,
    canvasPanelsVisible: panelVisibility.workflow || panelVisibility.qa || panelVisibility.continuity,
    unity: f571ToF580UnityDbTechnicalClosure,
    numericQa: f581ToF585ExpandedNormativeQa,
    datasetQa: f586ToF590NormativeDatasetQa,
  });
  const f446ToF448CanvasStrongQa = buildF446ToF448CanvasStrongQa({
    sidebarVisible: true,
    canvasVisible: true,
    commandDockVisible: true,
    contextMenuAvailable: true,
    dialogControlsAvailable: true,
    sourceSelectorControlsAvailable: true,
    rendererRuntime: f442ToF445RendererV2Runtime,
    quickCommandCount: 7,
    selectedCount: canvasState.selectedIds.length || (canvasState.selectedId ? 1 : 0),
  });
  const f449ToF453BimMemoryVisual = buildF449ToF453BimMemoryVisual({
    floorPlan,
    closure: f426ToF430CalcRendererClosure,
    runtime: f442ToF445RendererV2Runtime,
    strongQa: f446ToF448CanvasStrongQa,
  });
  const f411BimRibbon = [
    { id: 'project', label: 'Proyecto', detail: 'Importar o actualizar plano base', icon: Upload, action: onImportFloorPlan },
    { id: 'model', label: 'Modelo', detail: 'Abrir modelo o inspeccion 3D medica', icon: Box, action: onOpenMedical3D ?? onOpen3DViewer },
    { id: 'equipment', label: 'Equipos', detail: 'Colocar fuente o equipo con footprint', icon: Atom, action: () => activateCanvasTool('source') },
    { id: 'shielding', label: 'Blindaje', detail: 'Dibujar barrera y revisar espesor', icon: Shield, action: () => activateCanvasTool('barrier') },
    { id: 'annotate', label: 'Anotar', detail: 'Medir, acotar o preparar llamada visual', icon: Ruler, action: () => activateCanvasTool('measure') },
    { id: 'verify', label: 'Verificar', detail: 'Ejecutar calculo de blindaje', icon: Calculator, action: onRunCalculations },
    { id: 'reports', label: 'Reportar', detail: 'Exportar captura PNG del canvas', icon: ImageIcon, action: onExportPNG },
    { id: 'evidence', label: 'Evidencia', detail: 'Abrir Evidence Pack del proyecto', icon: FileSearch, action: onOpenEvidencePack },
  ];

  useEffect(() => {
    const canvas = rendererV2OverlayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const shouldShowRendererV2Overlay =
      f442ToF445RendererV2Runtime.activationMode === 'flagged-active' ||
      canvasChromeMode === 'guided' ||
      visualMode === 'structure' ||
      visualMode === 'isocontours';
    if (!shouldShowRendererV2Overlay) return;

    drawF442ToF445RendererV2Overlay(
      ctx,
      f442ToF445RendererV2Runtime,
      {
        scale: canvasState.scale,
        offsetX: canvasState.offsetX,
        offsetY: canvasState.offsetY,
      },
      {
        showLabels: canvasChromeMode === 'guided' || visualMode === 'structure',
        previewOpacity: canvasChromeMode === 'guided' ? 0.62 : 0.82,
      },
    );
    drawF621F625RendererBaseDeepHud(ctx, f621ToF625RendererBaseDeep, {
      showDirtyRegions: visualMode === 'structure' || canvasChromeMode === 'guided',
    });
    drawF626F630RendererSchedulerHud(ctx, f626ToF630RendererBaseScheduler);
    drawF631F635TileInvalidationOverlay(ctx, f631ToF635RendererTileInvalidation, {
      showCleanTiles: visualMode === 'structure',
    });
    drawF636F640HitTestShadowOverlay(ctx, f636ToF640RendererHitTestShadow, {
      showAllCandidates: visualMode === 'structure',
    });
  }, [
    canvasChromeMode,
    canvasSize.height,
    canvasSize.width,
    canvasState.offsetX,
    canvasState.offsetY,
    canvasState.scale,
    f442ToF445RendererV2Runtime,
    f621ToF625RendererBaseDeep,
    f626ToF630RendererBaseScheduler,
    f631ToF635RendererTileInvalidation,
    f636ToF640RendererHitTestShadow,
    visualMode,
  ]);

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
        data-testid="f411-bim-ribbon"
        className={`shrink-0 border-b border-slate-950 bg-[#17202a] px-2 py-1 text-slate-100 shadow-sm ${f375IsCleanWorkspace ? 'hidden' : 'hidden lg:block'}`}
        aria-label="Ribbon BIM RadShield-MX inspirado en CAD/Revit"
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          <div className="mr-1 flex shrink-0 items-center gap-1 border-r border-slate-600 pr-2">
            <Database className="h-3.5 w-3.5 text-cyan-300" />
            <div className="leading-tight">
              <div className="text-[9px] font-bold uppercase tracking-wide text-cyan-200">BIM Studio</div>
              <div className="max-w-[160px] truncate text-[8px] text-slate-400">{f411BimMethodology.projectName}</div>
            </div>
          </div>
          {f411BimRibbon.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`f411-bim-ribbon-${item.id}`}
                className="group flex h-10 min-w-[74px] shrink-0 flex-col items-center justify-center rounded border border-slate-700 bg-[#202b37] px-2 text-[9px] font-semibold text-slate-200 transition-colors hover:border-cyan-400 hover:bg-[#263545] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={item.action}
                disabled={!item.action}
                title={item.detail}
                aria-label={item.detail}
              >
                <Icon className="mb-0.5 h-3.5 w-3.5 text-cyan-300 group-hover:text-cyan-200" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div
            data-testid="f411-bim-readiness"
            className="ml-auto flex shrink-0 items-center gap-1 rounded border border-slate-700 bg-[#101821] px-2 py-1 text-[9px]"
            title={f411BimMethodology.workflowNeeds.join(' ')}
          >
            <span className="font-bold text-cyan-200">BIM</span>
            <span className={f411BimMethodology.status === 'bim-canvas-adaptation-ready' ? 'text-emerald-300' : 'text-amber-300'}>
              {f411BimMethodology.readinessScore}%
            </span>
          </div>
        </div>
      </div>

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
            {!f375IsCleanWorkspace && (
              <div
                data-testid="f411-bim-project-manager"
                className="absolute left-2 top-2 z-20 hidden w-[228px] overflow-hidden rounded-md border border-slate-700 bg-[#1c2631]/96 text-slate-100 shadow-2xl backdrop-blur xl:block"
                aria-label="Project Manager BIM del canvas"
              >
                <div className="border-b border-slate-700 bg-[#131b24] px-2 py-1.5">
                  <div className="text-[9px] font-bold uppercase tracking-wide text-cyan-200">Project Manager</div>
                  <select
                    data-testid="f411-bim-current-project"
                    className="mt-1 h-6 w-full rounded border border-slate-600 bg-[#263545] px-1 text-[10px] font-semibold text-slate-100 outline-none"
                    value={f411BimMethodology.projectName}
                    onChange={() => undefined}
                    title="Proyecto actual del canvas BIM"
                    aria-label="Proyecto actual del canvas BIM"
                  >
                    <option>{f411BimMethodology.projectName}</option>
                  </select>
                </div>
                <div className="max-h-[238px] overflow-y-auto px-2 py-1.5">
                  {f411BimMethodology.projectTree.map((nodeItem) => (
                    <div
                      key={nodeItem.id}
                      data-testid={`f411-bim-tree-${nodeItem.id}`}
                      className="mb-0.5 flex items-center gap-1 rounded px-1 py-0.5 text-[10px] hover:bg-[#263545]"
                      title={`${nodeItem.label}: ${nodeItem.count}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        nodeItem.status === 'ready' ? 'bg-emerald-300' :
                          nodeItem.status === 'review' ? 'bg-amber-300' : 'bg-slate-500'
                      }`} />
                      <span className="min-w-0 flex-1 truncate">{nodeItem.label}</span>
                      <span className="rounded bg-[#101821] px-1 text-[9px] text-slate-300">{nodeItem.count}</span>
                    </div>
                  ))}
                </div>
                <div data-testid="f411-bim-details" className="border-t border-slate-700 px-2 py-1.5">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Details</div>
                  {f411BimMethodology.details.map(([label, value]) => (
                    <div key={`${label}-${value}`} className="flex items-center justify-between gap-2 text-[9px]">
                      <span className="text-slate-400">{label}</span>
                      <span className="max-w-[120px] truncate font-mono text-slate-100" title={value}>{value}</span>
                    </div>
                  ))}
                </div>
                <div data-testid="f411-bim-layers" className="border-t border-slate-700 px-2 py-1.5">
                  <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    <span>Layers</span>
                    <span>{f411BimMethodology.activeLayer}</span>
                  </div>
                  <div className="space-y-0.5">
                    {f411BimMethodology.layerRows.map((layerRow) => (
                      <div key={layerRow.id} className="grid grid-cols-[10px_1fr_18px_18px_28px] items-center gap-1 text-[8px]">
                        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: layerRow.color }} />
                        <span className="truncate text-slate-200" title={layerRow.label}>{layerRow.label}</span>
                        <span title={layerRow.visible ? 'Visible' : 'Oculta'}>{layerRow.visible ? 'ON' : 'OFF'}</span>
                        <span title={layerRow.locked ? 'Bloqueada' : 'Editable'}>{layerRow.locked ? 'L' : '-'}</span>
                        <span className="text-right font-mono text-slate-400">{layerRow.opacityPercent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!f375IsCleanWorkspace && (
              <div
                data-testid="f517-f519-canvas-visual-reference-panel"
                className="pointer-events-auto absolute right-3 top-3 z-20 hidden max-h-[calc(100vh-96px)] w-[292px] overflow-y-auto rounded-xl border border-[#d8d6cd] bg-[#fffdf8]/96 p-2 text-[#252525] shadow-xl backdrop-blur xl:block"
                aria-label="F517 a F519: referencias visuales aplicadas al canvas"
                title="F517-F519: paleta Project Manager, catalogo clinico, variantes, materiales y export BIM/PDF"
              >
                <div className="flex items-start justify-between gap-2 border-b border-[#d8d6cd] pb-1.5">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-[#238a61]">F517-F519 Canvas Visual</div>
                    <div className="text-[11px] font-black text-[#252525]">Project Manager palette</div>
                    <div className="text-[9px] text-[#71706a]">Catalogo clinico + variantes + materiales + export</div>
                  </div>
                  <div className="rounded-lg border border-[#bde6d1] bg-[#e8f6ef] px-2 py-1 text-[9px] font-bold text-[#238a61]">
                    Snap
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-1" aria-label="Paleta de modalidad del canvas">
                  {[
                    ['TX', 'bg-[#f6d8ce]', 'Bunker'],
                    ['NM', 'bg-[#dcebf7]', 'Hot lab'],
                    ['DX', 'bg-[#fff2bd]', 'Rayos X'],
                    ['CY', 'bg-[#eee8ed]', 'Ciclotron'],
                  ].map(([label, className, title]) => (
                    <button
                      key={label}
                      type="button"
                      data-testid={`f525-modality-${label}`}
                      className={`rounded-lg border ${f525PlacementMode === label ? 'border-[#238a61] ring-2 ring-[#bde6d1]' : 'border-[#5f6368]/60'} ${className} px-1.5 py-1 text-center transition hover:scale-[1.02]`}
                      title={`${label}: ${title}. Selecciona perfil F525-F529 para sembrado visual y Memoria IA.`}
                      onClick={() => selectF525PlacementMode(label as F525F529Modality)}
                    >
                      <div className="text-[10px] font-black">{label}</div>
                      <div className="truncate text-[8px] text-[#71706a]">{title}</div>
                    </button>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[
                    ['Catalogo clinico', 'Salas, laberintos, puertas y penetraciones'],
                    ['Variantes A-E', 'Escenarios de layout antes del calculo'],
                    ['Materiales', 'TVL, densidad, peso, costo y cita'],
                    ['PDF/DXF/IFC/GLB', 'Paquete visual + Evidence Pack'],
                  ].map(([label, detail]) => (
                    <div key={label} className="rounded-lg border border-[#d8d6cd] bg-white/80 px-2 py-1">
                      <div className="text-[9px] font-black text-[#252525]">{label}</div>
                      <div className="text-[8px] leading-tight text-[#71706a]">{detail}</div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  data-testid="f517-f519-furnish-render-action"
                  className="mt-2 w-full rounded-lg bg-[#252525] px-2 py-1.5 text-[10px] font-black text-white shadow-sm transition-colors hover:bg-[#111111]"
                  title="Abrir inspeccion 3D medica para sembrar equipos y render visual del bunker o sala"
                  aria-label="Sembrar equipos y abrir render 3D medico"
                  onClick={runF525PlacementHandoff}
                >
                  Sembrar equipos + Render 3D
                </button>

                <div
                  data-testid="f525-f529-clinical-placement-pack"
                  className="mt-2 rounded-lg border border-[#d8d6cd] bg-[#eef3ec]/80 p-2"
                  title="F525-F529: seleccion clinica de sala/equipo/material con handoff a 3D y Memoria IA"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[9px] font-black uppercase tracking-wide text-[#238a61]">F525-F529 Placement</div>
                    <span className="rounded border border-[#d8d6cd] bg-white px-1.5 py-0.5 text-[8px] font-bold text-[#252525]">
                      {f525ToF529ClinicalPlacement.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-black text-[#252525]">
                    {f525ToF529ClinicalPlacement.defaultSelection.equipment}
                  </div>
                  <div className="mt-0.5 text-[8px] leading-tight text-[#71706a]">
                    {f525ToF529ClinicalPlacement.defaultSelection.room} / {f525ToF529ClinicalPlacement.defaultSelection.material}
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1 text-[8px] text-[#71706a]">
                    <span className="rounded bg-white/80 px-1 py-0.5">{f525ToF529ClinicalPlacement.defaultSelection.memoryProfile}</span>
                    <span className="rounded bg-white/80 px-1 py-0.5">Catalogo {f525ToF529ClinicalPlacement.catalog.length}</span>
                  </div>
                  <div className="mt-1 text-[8px] leading-tight text-[#71706a]">
                    {f525ToF529ClinicalPlacement.handoff.rule}
                  </div>
                </div>

                <div
                  data-testid="f530-f534-equipment-placement-preview"
                  className="mt-2 rounded-lg border border-[#d8d6cd] bg-white/90 p-2"
                  title="F530-F534: preview fantasma, punto candidato y propiedades sin persistir geometria"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[9px] font-black uppercase tracking-wide text-[#252525]">F530-F534 Ghost</div>
                    <span className="rounded border border-[#d8d6cd] bg-[#eef3ec] px-1.5 py-0.5 text-[8px] font-bold text-[#238a61]">
                      {f530ToF534EquipmentPreview.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[8px] leading-tight text-[#71706a]">
                    {f530ToF534EquipmentPreview.ghost.label} / {f530ToF534EquipmentPreview.ghost.footprint_m.join(' x ')} m
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      data-testid="f530-preview-equipment-ghost"
                      className="rounded bg-[#252525] px-1.5 py-1 text-[8px] font-black text-white hover:bg-[#111111]"
                      title="Coloca un footprint fantasma en el centro visible del canvas"
                      onClick={previewF530EquipmentAtCenter}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      data-testid="f531-confirm-equipment-point"
                      className="rounded border border-[#238a61] bg-[#e8f6ef] px-1.5 py-1 text-[8px] font-black text-[#238a61] hover:bg-[#d9f0e5]"
                      title="Confirma el punto candidato para 3D/Memoria IA sin escribir geometria permanente"
                      onClick={confirmF531EquipmentPoint}
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      data-testid="f545-commit-ghost-source"
                      className="rounded border border-[#f97316] bg-[#fff7ed] px-1.5 py-1 text-[8px] font-black text-[#c2410c] hover:bg-[#ffedd5]"
                      title="Crea una fuente real seleccionable desde el ghost. Reversible por undo."
                      onClick={commitF545GhostSource}
                    >
                      Crear fuente
                    </button>
                  </div>
                  <div className="mt-1 text-[8px] leading-tight text-[#71706a]">
                    Persistencia CAD: {String(f530ToF534EquipmentPreview.ghost.canPersistGeometry)}. Handoff alimenta 3D/Memoria/Evidence.
                  </div>
                  <div
                    data-testid="f540-f544-ghost-drag-gate"
                    className="mt-1 rounded border border-[#bde6d1] bg-[#eef3ec] px-1.5 py-1 text-[8px] font-bold text-[#238a61]"
                    title="F540-F544: el ghost se puede arrastrar, pero sigue sin crear geometria CAD permanente"
                  >
                    Drag {f540ToF544GhostDragGate.interaction.canDragPreview ? 'activo' : 'bloqueado'} / Persistencia CAD {String(f540ToF544GhostDragGate.interaction.canPersistGeometry)}
                    {f540DraggingGhost ? ' / moviendo' : ''}
                  </div>
                  <div
                    data-testid="f545-f549-ghost-source-commit-gate"
                    className="mt-1 rounded border border-[#fed7aa] bg-[#fff7ed] px-1.5 py-1 text-[8px] font-bold text-[#c2410c]"
                    title="F545-F549: crea fuente real desde el ghost, sin escribir barreras ni reemplazar renderer"
                  >
                    Crear fuente {f545ToF549GhostSourceCommit.gate.canCreateRadiationSource ? 'activo' : 'bloqueado'} / Barreras {String(f545ToF549GhostSourceCommit.gate.canWriteBarriers)}
                  </div>
                </div>

                <div
                  data-testid="f520-f524-deep-renderer-babylon-canvas"
                  className="mt-2 rounded-lg border border-[#d8d6cd] bg-white/85 p-2"
                  title="F520-F524: renderer profundo como overlay seguro; Babylon profundo se valida en Inspeccion 3D"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[9px] font-black uppercase tracking-wide text-[#252525]">F520+ Deep lane</div>
                    <span className="rounded border border-[#bde6d1] bg-[#e8f6ef] px-1.5 py-0.5 text-[8px] font-bold text-[#238a61]">
                      {f520ToF524DeepRendererBabylon.status}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-1 text-[8px] text-[#71706a]">
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">Instr {f520ToF524DeepRendererBabylon.rendererV2.instructions}</span>
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">Passes {f520ToF524DeepRendererBabylon.rendererV2.passes}</span>
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">Overlay {f520ToF524DeepRendererBabylon.activationPolicy.canRunAsOverlay ? 'si' : 'no'}</span>
                  </div>
                  <div className="mt-1 text-[8px] leading-tight text-[#71706a]">
                    Renderer v2 sigue pointer-events:none; CanvasArea/useCanvas no se reemplazan sin F197/F207/F229/F446.
                  </div>
                </div>

                <div
                  data-testid="f621-f625-renderer-base-deep"
                  className="mt-2 rounded-lg border border-[#bdd7e7] bg-[#f7fbff]/95 p-2"
                  title="F621-F625: renderer base profundo con comandos, clipping, dirty regions y HUD seguro"
                  aria-label="F621 a F625 renderer base profundo"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#075985]">F621-F625 renderer profundo</div>
                      <div className="text-[8px] leading-tight text-[#64748b]">Comandos + viewport clipping + dirty regions</div>
                    </div>
                    <span
                      data-testid="f621-f625-status"
                      className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${
                        f621ToF625RendererBaseDeep.status === 'renderer-base-deep-ready'
                          ? 'border-[#bbf7d0] bg-[#e8f6ef] text-[#238a61]'
                          : f621ToF625RendererBaseDeep.status === 'renderer-base-deep-blocked'
                            ? 'border-[#fecdd3] bg-[#fff1f2] text-[#b91c1c]'
                            : 'border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1]'
                      }`}
                    >
                      {f621ToF625RendererBaseDeep.status}
                    </span>
                  </div>
                  <div
                    data-testid="f621-f625-metrics"
                    className="mt-1 grid grid-cols-4 gap-1 text-[8px]"
                    title={`Viewport ${f621ToF625RendererBaseDeep.metrics.viewport}`}
                  >
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#0369a1]">Cmd {f621ToF625RendererBaseDeep.metrics.visibleCommands}/{f621ToF625RendererBaseDeep.metrics.totalCommands}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#238a61]">Pass {f621ToF625RendererBaseDeep.metrics.passGroups}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#a16207]">Warn {f621ToF625RendererBaseDeep.metrics.warningCommands}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#475569]">Hidden {f621ToF625RendererBaseDeep.metrics.hiddenCommands}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {f621ToF625RendererBaseDeep.passGroups.slice(0, 4).map((group) => (
                      <div
                        key={group.id}
                        data-testid={`f621-f625-pass-${group.layer}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={group.dirtyBounds ? `Dirty ${Math.round(group.dirtyBounds.width)}x${Math.round(group.dirtyBounds.height)}` : 'Sin dirty region visible'}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{group.layer}</span>
                          <span className="rounded bg-[#e0f2fe] px-1 py-0.5 text-[7px] font-black text-[#0369a1]">{group.visibleCommandCount}/{group.commandIds.length}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f621-f625-gates"
                    className="mt-1 rounded border border-[#d8d6cd] bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={f621ToF625RendererBaseDeep.rollback.join(' | ')}
                  >
                    {f621ToF625RendererBaseDeep.gates.map((gate) => `${gate.label}:${gate.pass ? 'OK' : 'NO'}`).join(' | ')}
                  </div>
                </div>

                <div
                  data-testid="f626-f630-renderer-scheduler"
                  className="mt-2 rounded-lg border border-[#c7d2fe] bg-[#f8fbff]/95 p-2"
                  title="F626-F630: scheduler de renderer profundo con presupuesto de frame, queue, cache key e invalidacion segura"
                  aria-label="F626 a F630 scheduler renderer base profundo"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#3730a3]">F626-F630 scheduler</div>
                      <div className="text-[8px] leading-tight text-[#64748b]">Frame budget + queue + cache key</div>
                    </div>
                    <span
                      data-testid="f626-f630-status"
                      className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${
                        f626ToF630RendererBaseScheduler.status === 'renderer-scheduler-ready'
                          ? 'border-[#bbf7d0] bg-[#e8f6ef] text-[#238a61]'
                          : f626ToF630RendererBaseScheduler.status === 'renderer-scheduler-blocked'
                            ? 'border-[#fecdd3] bg-[#fff1f2] text-[#b91c1c]'
                            : 'border-[#c7d2fe] bg-[#eef2ff] text-[#3730a3]'
                      }`}
                    >
                      {f626ToF630RendererBaseScheduler.status}
                    </span>
                  </div>
                  <div
                    data-testid="f626-f630-metrics"
                    className="mt-1 grid grid-cols-4 gap-1 text-[8px]"
                    title={`Cache ${f626ToF630RendererBaseScheduler.invalidation.cacheKey}`}
                  >
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#3730a3]">Q {f626ToF630RendererBaseScheduler.queue.length}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#0369a1]">F {f626ToF630RendererBaseScheduler.telemetry.estimatedFrames}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#238a61]">{f626ToF630RendererBaseScheduler.telemetry.estimatedFrameMs}ms</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#a16207]">W {f626ToF630RendererBaseScheduler.telemetry.warningQueueItems}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {f626ToF630RendererBaseScheduler.queue.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        data-testid={`f626-f630-queue-${item.layer}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${item.reason}; dirty ${item.dirtyAreaPx}px2; frame ${item.scheduledFrame}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{item.layer}</span>
                          <span className="rounded bg-[#eef2ff] px-1 py-0.5 text-[7px] font-black text-[#3730a3]">P{item.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f626-f630-invalidation"
                    className="mt-1 truncate rounded border border-[#d8d6cd] bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={f626ToF630RendererBaseScheduler.rollback.join(' | ')}
                  >
                    {f626ToF630RendererBaseScheduler.invalidation.cacheKey} | invalida: {f626ToF630RendererBaseScheduler.invalidation.invalidatesOn.slice(0, 4).join(', ')}
                  </div>
                </div>

                <div
                  data-testid="f631-f635-renderer-tile-invalidation"
                  className="mt-2 rounded-lg border border-[#ddd6fe] bg-[#fbfaff]/95 p-2"
                  title="F631-F635: atlas de tiles e invalidacion parcial para renderer profundo"
                  aria-label="F631 a F635 atlas de tiles renderer profundo"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#6d28d9]">F631-F635 tile atlas</div>
                      <div className="text-[8px] leading-tight text-[#64748b]">Invalidacion parcial por tiles</div>
                    </div>
                    <span
                      data-testid="f631-f635-status"
                      className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${
                        f631ToF635RendererTileInvalidation.status === 'tile-invalidation-ready'
                          ? 'border-[#bbf7d0] bg-[#e8f6ef] text-[#238a61]'
                          : f631ToF635RendererTileInvalidation.status === 'tile-invalidation-blocked'
                            ? 'border-[#fecdd3] bg-[#fff1f2] text-[#b91c1c]'
                            : 'border-[#ddd6fe] bg-[#f3e8ff] text-[#6d28d9]'
                      }`}
                    >
                      {f631ToF635RendererTileInvalidation.status}
                    </span>
                  </div>
                  <div
                    data-testid="f631-f635-metrics"
                    className="mt-1 grid grid-cols-4 gap-1 text-[8px]"
                    title={f631ToF635RendererTileInvalidation.metrics.cacheKey}
                  >
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#6d28d9]">Tiles {f631ToF635RendererTileInvalidation.metrics.dirtyTiles}/{f631ToF635RendererTileInvalidation.metrics.totalTiles}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#0369a1]">{f631ToF635RendererTileInvalidation.metrics.cols}x{f631ToF635RendererTileInvalidation.metrics.rows}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#238a61]">{f631ToF635RendererTileInvalidation.tileSize}px</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#a16207]">{f631ToF635RendererTileInvalidation.metrics.dirtyRatio}%</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {f631ToF635RendererTileInvalidation.coverage.slice(0, 4).map((item) => (
                      <div
                        key={item.layer}
                        data-testid={`f631-f635-coverage-${item.layer}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${item.tileIds.join(', ') || 'sin tiles sucios'} | comandos ${item.commandCount}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{item.layer}</span>
                          <span className="rounded bg-[#f3e8ff] px-1 py-0.5 text-[7px] font-black text-[#6d28d9]">{item.dirtyTileCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f631-f635-gates"
                    className="mt-1 truncate rounded border border-[#d8d6cd] bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={f631ToF635RendererTileInvalidation.rollback.join(' | ')}
                  >
                    {f631ToF635RendererTileInvalidation.gates.map((gate) => `${gate.label}:${gate.pass ? 'OK' : 'NO'}`).join(' | ')}
                  </div>
                </div>

                <div
                  data-testid="f636-f640-renderer-hit-test-shadow"
                  className="mt-2 rounded-lg border border-[#99f6e4] bg-[#f0fdfa]/95 p-2"
                  title="F636-F640: shadow map de hit-test y candidatos de seleccion sin tocar eventos legacy"
                  aria-label="F636 a F640 hit test shadow renderer profundo"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#0f766e]">F636-F640 hit shadow</div>
                      <div className="text-[8px] leading-tight text-[#64748b]">Candidatos por tile, preview reversible</div>
                    </div>
                    <span
                      data-testid="f636-f640-status"
                      className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${
                        f636ToF640RendererHitTestShadow.status === 'hit-test-shadow-ready'
                          ? 'border-[#bbf7d0] bg-[#e8f6ef] text-[#238a61]'
                          : f636ToF640RendererHitTestShadow.status === 'hit-test-shadow-blocked'
                            ? 'border-[#fecdd3] bg-[#fff1f2] text-[#b91c1c]'
                            : 'border-[#99f6e4] bg-[#ccfbf1] text-[#0f766e]'
                      }`}
                    >
                      {f636ToF640RendererHitTestShadow.status}
                    </span>
                  </div>
                  <div
                    data-testid="f636-f640-metrics"
                    className="mt-1 grid grid-cols-4 gap-1 text-[8px]"
                    title={f636ToF640RendererHitTestShadow.metrics.cacheKey}
                  >
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#0f766e]">T {f636ToF640RendererHitTestShadow.metrics.selectableTargets}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#0369a1]">B {f636ToF640RendererHitTestShadow.metrics.occupiedBuckets}/{f636ToF640RendererHitTestShadow.metrics.bucketCount}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#a16207]">Max {f636ToF640RendererHitTestShadow.metrics.maxTargetsPerBucket}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#334155]">{f636ToF640RendererHitTestShadow.probe.candidateIds.length} cand</span>
                  </div>
                  <div
                    data-testid="f636-f640-probe"
                    className="mt-1 truncate rounded border border-[#ccfbf1] bg-white/85 px-1.5 py-1 text-[8px] font-bold text-[#0f766e]"
                    title={f636ToF640RendererHitTestShadow.probe.candidateIds.join(', ') || 'sin candidatos'}
                  >
                    {f636ToF640RendererHitTestShadow.probe.tileId ?? 'sin tile'} | {f636ToF640RendererHitTestShadow.probe.primaryCandidateId ?? 'sin candidato'} | {f636ToF640RendererHitTestShadow.probe.reversibleAction}
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {f636ToF640RendererHitTestShadow.targets.filter((target) => target.selectable).slice(0, 4).map((target) => (
                      <div
                        key={target.id}
                        data-testid={`f636-f640-target-${target.layer}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${target.primitive}; ${target.reason}; tiles ${target.tileIds.join(', ')}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{target.layer}</span>
                          <span className="rounded bg-[#ccfbf1] px-1 py-0.5 text-[7px] font-black text-[#0f766e]">Z{target.zIndex}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f636-f640-gates"
                    className="mt-1 truncate rounded border border-[#d8d6cd] bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={f636ToF640RendererHitTestShadow.rollback.join(' | ')}
                  >
                    {f636ToF640RendererHitTestShadow.gates.map((gate) => `${gate.label}:${gate.pass ? 'OK' : 'NO'}`).join(' | ')}
                  </div>
                </div>

                <div
                  data-testid="f641-f645-renderer-event-dry-run"
                  className="mt-2 rounded-lg border border-[#fed7aa] bg-[#fff7ed]/95 p-2"
                  title="F641-F645: dry-run de eventos compara candidato del renderer profundo contra seleccion legacy sin ejecutar acciones"
                  aria-label="F641 a F645 dry run de eventos del renderer profundo"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#c2410c]">F641-F645 event dry-run</div>
                      <div className="text-[8px] leading-tight text-[#64748b]">Intent preview vs legacy useCanvas</div>
                    </div>
                    <span
                      data-testid="f641-f645-status"
                      className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${
                        f641ToF645RendererEventDryRun.status === 'event-dry-run-ready'
                          ? 'border-[#bbf7d0] bg-[#e8f6ef] text-[#238a61]'
                          : f641ToF645RendererEventDryRun.status === 'event-dry-run-blocked'
                            ? 'border-[#fecdd3] bg-[#fff1f2] text-[#b91c1c]'
                            : 'border-[#fed7aa] bg-[#ffedd5] text-[#c2410c]'
                      }`}
                    >
                      {f641ToF645RendererEventDryRun.status}
                    </span>
                  </div>
                  <div
                    data-testid="f641-f645-metrics"
                    className="mt-1 grid grid-cols-4 gap-1 text-[8px]"
                    title={f641ToF645RendererEventDryRun.metrics.cacheKey}
                  >
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#c2410c]">Cand {f641ToF645RendererEventDryRun.metrics.candidateCount}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#0369a1]">Sel {f641ToF645RendererEventDryRun.metrics.selectedCount}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#238a61]">{f641ToF645RendererEventDryRun.legacy.activeTool}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#334155]">{f641ToF645RendererEventDryRun.legacy.snapToGrid ? 'Snap' : 'Free'}</span>
                  </div>
                  <div
                    data-testid="f641-f645-intent"
                    className="mt-1 truncate rounded border border-[#fed7aa] bg-white/85 px-1.5 py-1 text-[8px] font-bold text-[#c2410c]"
                    title={f641ToF645RendererEventDryRun.intent.reason}
                  >
                    {f641ToF645RendererEventDryRun.intent.action} | {f641ToF645RendererEventDryRun.intent.predictedLayer ?? 'sin capa'} | {f641ToF645RendererEventDryRun.intent.predictedTargetId ?? 'sin target'}
                  </div>
                  <div
                    data-testid="f641-f645-comparison"
                    className="mt-1 rounded border border-[#d8d6cd] bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={f641ToF645RendererEventDryRun.comparison.mismatchReason}
                  >
                    Legacy match: {f641ToF645RendererEventDryRun.comparison.legacySelectionMatchesCandidate ? 'SI' : 'NO'} | selection: {f641ToF645RendererEventDryRun.comparison.legacySelectionPresent ? 'SI' : 'NO'} | candidate: {f641ToF645RendererEventDryRun.comparison.candidatePresent ? 'SI' : 'NO'}
                  </div>
                  <div
                    data-testid="f641-f645-gates"
                    className="mt-1 truncate rounded border border-[#d8d6cd] bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={f641ToF645RendererEventDryRun.rollback.join(' | ')}
                  >
                    {f641ToF645RendererEventDryRun.gates.map((gate) => `${gate.label}:${gate.pass ? 'OK' : 'NO'}`).join(' | ')}
                  </div>
                </div>

                <div
                  data-testid="f646-f650-renderer-selection-transaction"
                  className="mt-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff]/95 p-2"
                  title="F646-F650: transaccion simulada de seleccion con before/after y rollback token sin commit real"
                  aria-label="F646 a F650 transaccion simulada de seleccion renderer profundo"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#1d4ed8]">F646-F650 selection tx</div>
                      <div className="text-[8px] leading-tight text-[#64748b]">Commit/rollback simulado, sin setCanvasState</div>
                    </div>
                    <span
                      data-testid="f646-f650-status"
                      className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${
                        f646ToF650RendererSelectionTransaction.status === 'selection-transaction-ready'
                          ? 'border-[#bbf7d0] bg-[#e8f6ef] text-[#238a61]'
                          : f646ToF650RendererSelectionTransaction.status === 'selection-transaction-blocked'
                            ? 'border-[#fecdd3] bg-[#fff1f2] text-[#b91c1c]'
                            : 'border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8]'
                      }`}
                    >
                      {f646ToF650RendererSelectionTransaction.status}
                    </span>
                  </div>
                  <div
                    data-testid="f646-f650-metrics"
                    className="mt-1 grid grid-cols-4 gap-1 text-[8px]"
                    title={f646ToF650RendererSelectionTransaction.metrics.cacheKey}
                  >
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#1d4ed8]">Chg {f646ToF650RendererSelectionTransaction.metrics.changedCount}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#0369a1]">B {f646ToF650RendererSelectionTransaction.metrics.beforeCount}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#238a61]">A {f646ToF650RendererSelectionTransaction.metrics.afterCount}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#334155]">{f646ToF650RendererSelectionTransaction.draft.operation}</span>
                  </div>
                  <div
                    data-testid="f646-f650-draft"
                    className="mt-1 truncate rounded border border-[#bfdbfe] bg-white/85 px-1.5 py-1 text-[8px] font-bold text-[#1d4ed8]"
                    title={f646ToF650RendererSelectionTransaction.draft.reason}
                  >
                    {f646ToF650RendererSelectionTransaction.draft.operationId} | {f646ToF650RendererSelectionTransaction.draft.instructionId ?? 'sin instruction'} | {f646ToF650RendererSelectionTransaction.draft.layer ?? 'sin capa'}
                  </div>
                  <div
                    data-testid="f646-f650-snapshot"
                    className="mt-1 rounded border border-[#d8d6cd] bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={`before ${f646ToF650RendererSelectionTransaction.snapshot.beforeSelectedIds.join(', ') || 'none'} -> after ${f646ToF650RendererSelectionTransaction.snapshot.afterSelectedIds.join(', ') || 'none'}`}
                  >
                    before: {f646ToF650RendererSelectionTransaction.snapshot.beforeSelectedId ?? 'none'} | after: {f646ToF650RendererSelectionTransaction.snapshot.afterSelectedId ?? 'none'} | changed: {f646ToF650RendererSelectionTransaction.snapshot.changed ? 'SI' : 'NO'}
                  </div>
                  <div
                    data-testid="f646-f650-rollback-token"
                    className="mt-1 truncate rounded border border-[#bfdbfe] bg-white/85 px-1.5 py-1 text-[8px] font-bold text-[#1d4ed8]"
                    title={`Restaura ${f646ToF650RendererSelectionTransaction.rollbackToken.restoresSelectedIds.join(', ') || 'sin seleccion'}`}
                  >
                    {f646ToF650RendererSelectionTransaction.rollbackToken.token} | rollback {f646ToF650RendererSelectionTransaction.rollbackToken.canRollback ? 'OK' : 'NO'}
                  </div>
                  <div
                    data-testid="f646-f650-gates"
                    className="mt-1 truncate rounded border border-[#d8d6cd] bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={f646ToF650RendererSelectionTransaction.rollback.join(' | ')}
                  >
                    {f646ToF650RendererSelectionTransaction.gates.map((gate) => `${gate.label}:${gate.pass ? 'OK' : 'NO'}`).join(' | ')}
                  </div>
                </div>

                <div
                  data-testid="f591-f620-general-improvements"
                  className="mt-2 rounded-lg border border-[#b7c9bc] bg-[#f8faf6]/95 p-2"
                  title="F591-F620: mejoras generales prioritarias, inspector QA compacto, DB live gate, Unity visual-only, memorias reales y release consolidation"
                  aria-label="F591 a F620 mejoras generales prioritarias"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#252525]">F591-F620 mejoras generales</div>
                      <div className="text-[8px] leading-tight text-[#71706a]">Canvas limpio + DB gate + Unity visual + Memoria IA</div>
                    </div>
                    <span
                      data-testid="f591-f620-status"
                      className="rounded border border-[#238a61]/30 bg-white px-1.5 py-0.5 text-[8px] font-black text-[#238a61]"
                    >
                      {f591ToF620GeneralImprovements.status}
                    </span>
                  </div>
                  <div
                    data-testid="f591-f620-summary"
                    className="mt-1 grid grid-cols-3 gap-1 text-[8px]"
                    title={`Tracks criticos release: ${f591ToF620GeneralImprovements.summary.releaseCriticalTracks}`}
                  >
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#238a61]">Listos {f591ToF620GeneralImprovements.summary.implementedTracks}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#a16207]">Gates {f591ToF620GeneralImprovements.summary.gatedTracks}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#1d4ed8]">Modo {f591ToF620GeneralImprovements.inspectorMode}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {f591ToF620GeneralImprovements.tracks.map((track) => (
                      <div
                        key={track.id}
                        data-testid={`f591-f620-track-${track.id}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${track.impact} Siguiente: ${track.nextAction}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{track.phaseRange} {track.label}</span>
                          <span className={`rounded px-1 py-0.5 text-[7px] font-black ${
                            track.status === 'implemented' || track.status === 'ready'
                              ? 'bg-[#e8f6ef] text-[#238a61]'
                              : track.status === 'requires-db' || track.status === 'requires-real-cases'
                                ? 'bg-[#fff1f2] text-[#b91c1c]'
                                : 'bg-[#fffbeb] text-[#a16207]'
                          }`}>
                            {track.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 rounded border border-[#d8d6cd] bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]">
                    <span data-testid="f591-f620-gates">DB real SI; memorias reales SI; Unity visual-only; certificacion clinica NO.</span>
                    <button
                      type="button"
                      data-testid="f591-toggle-qa-inspector"
                      className="rounded border border-[#238a61]/30 bg-[#e8f6ef] px-2 py-0.5 text-[8px] font-black text-[#238a61] hover:bg-white"
                      onClick={toggleF591QaInspector}
                      title="Alternar inspector QA compacto/expandido. Compacto reduce saturacion; expandido muestra F550-F590 completo."
                    >
                      {f591QaInspectorMode === 'compact' ? 'Expandir QA' : 'Compactar QA'}
                    </button>
                  </div>
                </div>

                {f591QaInspectorMode === 'expanded' && (
                  <>
                <div
                  data-testid="f550-f555-functional-beta-closure"
                  className="mt-2 rounded-lg border border-[#b7c9bc] bg-[#eef3ec]/95 p-2"
                  title="F550-F555: cierre beta funcional con conexiones reales, reversibilidad, paleta BIM, motores visuales y gates productivos"
                  aria-label="F550 a F555 cierre beta funcional"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#238a61]">F550-F555 Beta funcional</div>
                      <div className="text-[8px] leading-tight text-[#71706a]">Conexiones reales + reversibles + motores gated</div>
                    </div>
                    <span
                      data-testid="f550-f555-release-status"
                      className="rounded border border-[#238a61]/30 bg-white px-1.5 py-0.5 text-[8px] font-black text-[#238a61]"
                    >
                      {f550ToF555FunctionalBetaClosure.releaseStatus}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-4 gap-1 text-[8px]">
                    <span className="rounded bg-white px-1 py-0.5 text-center font-bold text-[#238a61]">Real {f550ToF555FunctionalBetaClosure.counts.realTracks}</span>
                    <span className="rounded bg-white px-1 py-0.5 text-center font-bold text-[#a16207]">Gate {f550ToF555FunctionalBetaClosure.counts.gatedTracks}</span>
                    <span className="rounded bg-white px-1 py-0.5 text-center font-bold text-[#b91c1c]">Assets {f550ToF555FunctionalBetaClosure.counts.missingAssetTracks}</span>
                    <span className="rounded bg-white px-1 py-0.5 text-center font-bold text-[#1d4ed8]">E2E {f550ToF555FunctionalBetaClosure.counts.needsE2ETracks}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {f550ToF555FunctionalBetaClosure.tracks.slice(0, 6).map((track) => (
                      <div
                        key={track.id}
                        data-testid={`f550-f555-track-${track.id}`}
                        className="rounded border border-white/70 bg-white/85 px-1.5 py-1"
                        title={`${track.realConnection} Reversible: ${track.reversibleBy} Siguiente gate: ${track.nextGate}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{track.phase} {track.label}</span>
                          <span className={`rounded px-1 py-0.5 text-[7px] font-black ${
                            track.status === 'real'
                              ? 'bg-[#e8f6ef] text-[#238a61]'
                              : track.status === 'missing-assets'
                                ? 'bg-[#fff1f2] text-[#b91c1c]'
                                : track.status === 'needs-e2e'
                                  ? 'bg-[#eff6ff] text-[#1d4ed8]'
                                  : 'bg-[#fffbeb] text-[#a16207]'
                          }`}>
                            {track.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f551-bim-complete-palette"
                    className="mt-1 grid grid-cols-8 gap-1"
                    aria-label="Paleta BIM completa F551"
                  >
                    {f550ToF555FunctionalBetaClosure.palette.map((token) => (
                      <span
                        key={token.id}
                        data-testid={`f551-palette-${token.id}`}
                        className="h-5 rounded border border-white shadow-sm"
                        style={{ backgroundColor: token.hex }}
                        title={`${token.label}: ${token.role} (${token.hex})`}
                        aria-label={`${token.label} ${token.hex}`}
                      />
                    ))}
                  </div>
                  <div
                    data-testid="f550-f555-rollback-policy"
                    className="mt-1 rounded border border-white/70 bg-white/80 px-1.5 py-1 text-[8px] leading-tight text-[#71706a]"
                  >
                    Reversible: callbacks existentes, fallback Three/R3F, assets lazy y renderer base sin reemplazo.
                  </div>
                </div>

                <div
                  data-testid="f556-f560-post-beta-deep-stack"
                  className="mt-2 rounded-lg border border-[#c9c4b6] bg-[#fffdf8]/95 p-2"
                  title="F556-F560: post-beta profunda con renderer base v2, Babylon real, Unity real, DB tecnica y QA normativo ampliado"
                  aria-label="F556 a F560 post beta profunda"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#252525]">F556-F560 Post-beta profunda</div>
                      <div className="text-[8px] leading-tight text-[#71706a]">Renderer v2 + Babylon + Unity + DB tecnica + QA</div>
                    </div>
                    <span
                      data-testid="f556-f560-status"
                      className="rounded border border-[#d8d6cd] bg-[#eef3ec] px-1.5 py-0.5 text-[8px] font-black text-[#238a61]"
                    >
                      {f556ToF560PostBetaDeepStack.status}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-4 gap-1 text-[8px]">
                    <span className="rounded bg-[#e8f6ef] px-1 py-0.5 text-center font-bold text-[#238a61]">Ready {f556ToF560PostBetaDeepStack.matrix.ready}</span>
                    <span className="rounded bg-[#eff6ff] px-1 py-0.5 text-center font-bold text-[#1d4ed8]">Preview {f556ToF560PostBetaDeepStack.matrix.preview}</span>
                    <span className="rounded bg-[#fffbeb] px-1 py-0.5 text-center font-bold text-[#a16207]">Gate {f556ToF560PostBetaDeepStack.matrix.gated}</span>
                    <span className="rounded bg-[#fff1f2] px-1 py-0.5 text-center font-bold text-[#b91c1c]">Block {f556ToF560PostBetaDeepStack.matrix.blocked}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {f556ToF560PostBetaDeepStack.lanes.map((lane) => (
                      <div
                        key={lane.id}
                        data-testid={`f556-f560-lane-${lane.id}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${lane.evidence} Siguiente gate: ${lane.nextGate}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{lane.phase} {lane.label}</span>
                          <span className={`rounded px-1 py-0.5 text-[7px] font-black ${
                            lane.status === 'ready'
                              ? 'bg-[#e8f6ef] text-[#238a61]'
                              : lane.status === 'preview'
                                ? 'bg-[#eff6ff] text-[#1d4ed8]'
                                : lane.status === 'blocked'
                                  ? 'bg-[#fff1f2] text-[#b91c1c]'
                                  : 'bg-[#fffbeb] text-[#a16207]'
                          }`}>
                            {lane.status}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[7px] text-[#71706a]">{lane.evidence}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f559-technical-db-summary"
                    className="mt-1 grid grid-cols-3 gap-1 text-[8px]"
                    title={f556ToF560PostBetaDeepStack.technicalDb.requiredCollections.join(' | ')}
                  >
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">PBR {f556ToF560PostBetaDeepStack.technicalDb.pbrMaterials}</span>
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">QA {f556ToF560PostBetaDeepStack.normativeQa.passedCases}/{f556ToF560PostBetaDeepStack.normativeQa.totalCases}</span>
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">Unity {f556ToF560PostBetaDeepStack.visualStack.unityBuild}</span>
                  </div>
                  <div
                    data-testid="f556-f560-activation-rules"
                    className="mt-1 rounded border border-[#d8d6cd] bg-[#eef3ec]/70 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                  >
                    Reglas: renderer base no reemplaza canvas; Babylon no es primario; Unity no firma calculos; PBR no cambia TVL/densidad/costo; QA normativo manda release clinico.
                  </div>
                </div>

                <div
                  data-testid="f561-f565-renderer-event-controller"
                  className="mt-2 rounded-lg border border-[#c9c4b6] bg-[#f8fbff]/95 p-2"
                  title="F561-F565: renderer/event controller v2 conectado como observador seguro antes del handler estable"
                  aria-label="F561 a F565 renderer event controller v2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#252525]">F561-F565 Event controller v2</div>
                      <div className="text-[8px] leading-tight text-[#71706a]">Pointer wrappers + overlay + rollback</div>
                    </div>
                    <span
                      data-testid="f561-f565-status"
                      className="rounded border border-[#d8d6cd] bg-[#eff6ff] px-1.5 py-0.5 text-[8px] font-black text-[#1d4ed8]"
                    >
                      {f561ToF565RendererEventController.status}
                    </span>
                  </div>
                  <div
                    data-testid="f561-event-harness-summary"
                    className="mt-1 grid grid-cols-3 gap-1 text-[8px]"
                    title={`Politica: ${f561ToF565RendererEventController.eventHarness.mutationPolicy}`}
                  >
                    <span className="rounded bg-white px-1 py-0.5">Wrap {f561ToF565RendererEventController.eventHarness.pointerWrappersActive ? 'ON' : 'OFF'}</span>
                    <span className="rounded bg-white px-1 py-0.5">QA {f561ToF565RendererEventController.qa.passedScenarioCount}/{f561ToF565RendererEventController.qa.totalScenarioCount}</span>
                    <span className="rounded bg-white px-1 py-0.5">Instr {f561ToF565RendererEventController.rendererBridge.instructions}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {f561ToF565RendererEventController.lanes.map((lane) => (
                      <div
                        key={lane.id}
                        data-testid={`f561-f565-lane-${lane.id}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${lane.evidence} Rollback: ${lane.rollback}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{lane.phase} {lane.label}</span>
                          <span className={`rounded px-1 py-0.5 text-[7px] font-black ${
                            lane.status === 'ready'
                              ? 'bg-[#e8f6ef] text-[#238a61]'
                              : lane.status === 'preview'
                                ? 'bg-[#eff6ff] text-[#1d4ed8]'
                                : 'bg-[#fffbeb] text-[#a16207]'
                          }`}>
                            {lane.status}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[7px] text-[#71706a]">{lane.evidence}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f561-f565-rollback"
                    className="mt-1 rounded border border-[#d8d6cd] bg-[#eef3ec]/70 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                  >
                    Reversible: handlers estables siguen canonicos, overlay sin pointer-events, sin mutar geometria ni calculos.
                  </div>
                </div>

                <div
                  data-testid="f566-f570-post-beta-readiness"
                  className="mt-2 rounded-lg border border-[#c9c4b6] bg-[#fffaf1]/95 p-2"
                  title="F566-F570: readiness productivo post-beta con capturas, conexiones reales, assets, activacion reversible y smoke"
                  aria-label="F566 a F570 readiness productivo post beta"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#252525]">F566-F570 Readiness post-beta</div>
                      <div className="text-[8px] leading-tight text-[#71706a]">Capturas + conexiones + assets + rollback + smoke</div>
                    </div>
                    <span
                      data-testid="f566-f570-status"
                      className="rounded border border-[#d8d6cd] bg-[#fffbeb] px-1.5 py-0.5 text-[8px] font-black text-[#a16207]"
                    >
                      {f566ToF570PostBetaProductionReadiness.status}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-4 gap-1 text-[8px]">
                    <span className="rounded bg-[#e8f6ef] px-1 py-0.5 text-center font-bold text-[#238a61]">Ready {f566ToF570PostBetaProductionReadiness.matrix.ready}</span>
                    <span className="rounded bg-[#eff6ff] px-1 py-0.5 text-center font-bold text-[#1d4ed8]">Preview {f566ToF570PostBetaProductionReadiness.matrix.preview}</span>
                    <span className="rounded bg-[#fffbeb] px-1 py-0.5 text-center font-bold text-[#a16207]">Gate {f566ToF570PostBetaProductionReadiness.matrix.gated}</span>
                    <span className="rounded bg-[#fff1f2] px-1 py-0.5 text-center font-bold text-[#b91c1c]">Block {f566ToF570PostBetaProductionReadiness.matrix.blocked}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {f566ToF570PostBetaProductionReadiness.tracks.map((track) => (
                      <div
                        key={track.id}
                        data-testid={`f566-f570-track-${track.id}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${track.evidence} Siguiente: ${track.nextAction}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{track.phase} {track.label}</span>
                          <span className={`rounded px-1 py-0.5 text-[7px] font-black ${
                            track.status === 'ready'
                              ? 'bg-[#e8f6ef] text-[#238a61]'
                              : track.status === 'preview'
                                ? 'bg-[#eff6ff] text-[#1d4ed8]'
                                : track.status === 'blocked'
                                  ? 'bg-[#fff1f2] text-[#b91c1c]'
                                  : 'bg-[#fffbeb] text-[#a16207]'
                          }`}>
                            {track.status}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[7px] text-[#71706a]">{track.evidence}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f566-f570-activation-matrix"
                    className="mt-1 grid grid-cols-2 gap-1 text-[7px] leading-tight text-[#4b5563]"
                    title={`Screenshots: ${f566ToF570PostBetaProductionReadiness.requiredScreenshots.join(', ')}`}
                  >
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">Renderer {f566ToF570PostBetaProductionReadiness.activationMatrix.rendererBaseV2}</span>
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">Babylon {f566ToF570PostBetaProductionReadiness.activationMatrix.babylonDeep}</span>
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">Unity {f566ToF570PostBetaProductionReadiness.activationMatrix.unityWebgl}</span>
                    <span className="rounded bg-[#eef3ec] px-1 py-0.5">DB {f566ToF570PostBetaProductionReadiness.activationMatrix.technicalDb}</span>
                  </div>
                  <div
                    data-testid="f566-f570-release-rules"
                    className="mt-1 rounded border border-[#d8d6cd] bg-[#eef3ec]/70 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                  >
                    Beta estatica {f566ToF570PostBetaProductionReadiness.releaseRules.canPublishStaticBeta ? 'permitida' : 'gated'}; no reemplazar renderer; no Monte Carlo clinico; Unity visual-only; rollback obligatorio.
                  </div>
                </div>

                <div
                  data-testid="f571-f580-unity-db-closure"
                  className="mt-2 rounded-lg border border-[#c9c4b6] bg-[#f7fbff]/95 p-2"
                  title="F571-F580: Unity WebGL real con build exportado + DB tecnica regulatoria/materiales versionada"
                  aria-label="F571 a F580 Unity WebGL y DB tecnica"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#252525]">F571-F580 Unity + DB tecnica</div>
                      <div className="text-[8px] leading-tight text-[#71706a]">Build Unity real + materiales regulatorios versionables</div>
                    </div>
                    <span
                      data-testid="f571-f580-status"
                      className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${
                        f571ToF580UnityDbTechnicalClosure.status === 'unity-db-ready'
                          ? 'border-[#bbf7d0] bg-[#e8f6ef] text-[#238a61]'
                          : f571ToF580UnityDbTechnicalClosure.status === 'unity-build-blocked'
                            ? 'border-[#fecdd3] bg-[#fff1f2] text-[#b91c1c]'
                            : 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]'
                      }`}
                    >
                      {f571ToF580UnityDbTechnicalClosure.status}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1 text-[8px]">
                    <span
                      data-testid="f571-f575-unity-build-summary"
                      className="rounded bg-white/85 px-1 py-0.5 font-bold text-[#334155]"
                      title={`Esperados: ${f571ToF580UnityDbTechnicalClosure.unity.expectedFiles.join(', ')}. Faltantes: ${f571ToF580UnityDbTechnicalClosure.unity.missing.join(', ') || 'ninguno'}`}
                    >
                      Unity {f571ToF580UnityDbTechnicalClosure.unity.liveBuildReady ? 'ready' : 'blocked'} - {f571ToF580UnityDbTechnicalClosure.unity.launchMode}
                    </span>
                    <span
                      data-testid="f576-f580-technical-db-summary"
                      className="rounded bg-white/85 px-1 py-0.5 font-bold text-[#334155]"
                      title={`Colecciones: ${f571ToF580UnityDbTechnicalClosure.technicalDb.requiredCollections.join(' | ')}`}
                    >
                      DB {f571ToF580UnityDbTechnicalClosure.technicalDb.totalSources} src / {f571ToF580UnityDbTechnicalClosure.technicalDb.totalMaterials} mat
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {f571ToF580UnityDbTechnicalClosure.tracks.map((track) => (
                      <div
                        key={track.id}
                        data-testid={`f571-f580-track-${track.id}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${track.evidence} Requerido: ${track.requiredAction}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{track.phase} {track.label}</span>
                          <span className={`rounded px-1 py-0.5 text-[7px] font-black ${
                            track.status === 'ready'
                              ? 'bg-[#e8f6ef] text-[#238a61]'
                              : track.status === 'preview'
                                ? 'bg-[#eff6ff] text-[#1d4ed8]'
                                : track.status === 'blocked'
                                  ? 'bg-[#fff1f2] text-[#b91c1c]'
                                  : 'bg-[#fffbeb] text-[#a16207]'
                          }`}>
                            {track.status}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[7px] text-[#71706a]">{track.evidence}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f571-f580-release-rules"
                    className="mt-1 rounded border border-[#d8d6cd] bg-[#eef3ec]/70 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                  >
                    Unity real {f571ToF580UnityDbTechnicalClosure.releaseRules.canClaimUnityRealRuntime ? 'ready' : 'blocked'}; seed live NO; DB completa {f571ToF580UnityDbTechnicalClosure.releaseRules.canClaimCompleteRegulatoryDb ? 'ready' : 'gated'}; calculo clinico certificado NO.
                  </div>
                </div>

                <div
                  data-testid="f581-f585-expanded-normative-qa"
                  className="mt-2 rounded-lg border border-[#b7c9bc] bg-[#f8fff8]/95 p-2"
                  title="F581-F585: QA normativo numerico ampliado NCRP/IAEA/UAQ con tolerancias, advertencias y gate clinico"
                  aria-label="F581 a F585 QA normativo numerico ampliado"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#252525]">F581-F585 QA normativo</div>
                      <div className="text-[8px] leading-tight text-[#71706a]">NCRP / IAEA / UAQ + unidades + warnings</div>
                    </div>
                    <span
                      data-testid="f581-f585-status"
                      className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${
                        f581ToF585ExpandedNormativeQa.status === 'qa-expanded-pass'
                          ? 'border-[#bbf7d0] bg-[#e8f6ef] text-[#238a61]'
                          : 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]'
                      }`}
                    >
                      {f581ToF585ExpandedNormativeQa.status}
                    </span>
                  </div>
                  <div
                    data-testid="f581-f585-summary"
                    className="mt-1 grid grid-cols-4 gap-1 text-[8px]"
                    title={`Heredado: F484-F490 ${f581ToF585ExpandedNormativeQa.baseCoverage.f484F490Cases} casos; F519 ${f581ToF585ExpandedNormativeQa.baseCoverage.f519Cases} casos`}
                  >
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#238a61]">Pass {f581ToF585ExpandedNormativeQa.summary.passedCases}/{f581ToF585ExpandedNormativeQa.summary.totalCases}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#1d4ed8]">Norm {f581ToF585ExpandedNormativeQa.summary.standardsCovered.length}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#7c3aed]">Roles {f581ToF585ExpandedNormativeQa.summary.rolesCovered.length}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#c2410c]">Delta {f581ToF585ExpandedNormativeQa.summary.maxDeltaPct}%</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {f581ToF585ExpandedNormativeQa.results.slice(0, 5).map((item) => (
                      <div
                        key={item.caseId}
                        data-testid={`f581-f585-case-${item.caseId}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${item.citationIds.join(', ')} | ${item.warnings.join(' | ')}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{item.phase} {item.label}</span>
                          <span className={`rounded px-1 py-0.5 text-[7px] font-black ${
                            item.status === 'pass' ? 'bg-[#e8f6ef] text-[#238a61]' : 'bg-[#fffbeb] text-[#a16207]'
                          }`}>
                            {item.calculatedThickness_mm} mm
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[7px] text-[#71706a]">{item.standard} / {item.barrierRole} / delta {item.deltaPct}%</div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f581-f585-gates"
                    className="mt-1 rounded border border-[#d8d6cd] bg-[#eef3ec]/70 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={f581ToF585ExpandedNormativeQa.releaseBlockers.join(' | ')}
                  >
                    Beta QA {f581ToF585ExpandedNormativeQa.gates.canPublishBetaNumericQa ? 'permitida' : 'review'}; DB-backed SI; fisico/RSO SI; certificacion clinica NO.
                  </div>
                </div>

                <div
                  data-testid="f586-f590-normative-dataset-qa"
                  className="mt-2 rounded-lg border border-[#d6c7a8] bg-[#fffaf0]/95 p-2"
                  title="F586-F590: dataset normativo versionado con source/page/hash/tolerancia y gate DB"
                  aria-label="F586 a F590 dataset normativo QA"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wide text-[#252525]">F586-F590 dataset normativo</div>
                      <div className="text-[8px] leading-tight text-[#71706a]">fuente / pagina / hash / tolerancia / DB gate</div>
                    </div>
                    <span
                      data-testid="f586-f590-status"
                      className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${
                        f586ToF590NormativeDatasetQa.status === 'dataset-qa-ready'
                          ? 'border-[#bbf7d0] bg-[#e8f6ef] text-[#238a61]'
                          : 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]'
                      }`}
                    >
                      {f586ToF590NormativeDatasetQa.status}
                    </span>
                  </div>
                  <div
                    data-testid="f586-f590-summary"
                    className="mt-1 grid grid-cols-4 gap-1 text-[8px]"
                    title={`F581-F585 heredado: ${f586ToF590NormativeDatasetQa.inheritedF581F585Status}`}
                  >
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#1d4ed8]">Casos {f586ToF590NormativeDatasetQa.summary.totalCases}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#238a61]">Fuentes {f586ToF590NormativeDatasetQa.summary.canonicalSources}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#a16207]">Seed {f586ToF590NormativeDatasetQa.summary.dbSeedRequired}</span>
                    <span className="rounded bg-white/85 px-1 py-0.5 text-center font-bold text-[#be123c]">Clin {f586ToF590NormativeDatasetQa.summary.clinicalBlocked}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {f586ToF590NormativeDatasetQa.cases.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        data-testid={`f586-f590-case-${item.id}`}
                        className="rounded border border-[#d8d6cd] bg-white/85 px-1.5 py-1"
                        title={`${item.sourceId} | ${item.sourcePage} | ${item.sourceHash}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-black text-[#252525]">{item.phase} {item.standard} {item.barrierRole}</span>
                          <span className="rounded bg-[#fef3c7] px-1 py-0.5 text-[7px] font-black text-[#92400e]">
                            tol {item.tolerancePct}%
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[7px] text-[#71706a]">{item.sourcePage} / {item.sourceHash}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    data-testid="f586-f590-gates"
                    className="mt-1 rounded border border-[#d8d6cd] bg-[#f7f2e8]/80 px-1.5 py-1 text-[8px] leading-tight text-[#4b5563]"
                    title={f586ToF590NormativeDatasetQa.releaseBlockers.join(' | ')}
                  >
                    Beta dataset {f586ToF590NormativeDatasetQa.gates.canPublishBetaDatasetQa ? 'permitida' : 'review'}; document_chunks SI; seed live NO; certificacion clinica NO.
                  </div>
                </div>
                  </>
                )}
              </div>
            )}

            {f530PlacementPoint && (
              <div
                data-testid="f530-equipment-ghost-overlay"
                data-f540-can-persist="false"
                data-f540-dragging={String(f540DraggingGhost)}
                className="pointer-events-none absolute z-10 rounded-xl border-2 border-dashed border-[#238a61] bg-[#e8f6ef]/35 shadow-[0_0_0_4px_rgba(35,138,97,0.12)]"
                style={{
                  left: f530PlacementPoint.x * canvasState.scale + canvasState.offsetX - (f530ToF534EquipmentPreview.ghost.footprint_px[0] * canvasState.scale) / 2,
                  top: f530PlacementPoint.y * canvasState.scale + canvasState.offsetY - (f530ToF534EquipmentPreview.ghost.footprint_px[1] * canvasState.scale) / 2,
                  width: Math.max(f530ToF534EquipmentPreview.ghost.footprint_px[0] * canvasState.scale, 42),
                  height: Math.max(f530ToF534EquipmentPreview.ghost.footprint_px[1] * canvasState.scale, 42),
                }}
                title="F530 ghost overlay: previsualizacion no persistente del equipo"
              >
                <div
                  data-testid="f540-equipment-ghost-drag-handle"
                  className="pointer-events-auto absolute inset-0 cursor-grab rounded-xl touch-none active:cursor-grabbing"
                  role="button"
                  tabIndex={0}
                  aria-label="Mover ghost no persistente del equipo"
                  title="Arrastre para mover el ghost. No crea geometria permanente."
                  onPointerDown={startF540GhostDrag}
                  onPointerMove={moveF540GhostDrag}
                  onPointerUp={endF540GhostDrag}
                  onPointerCancel={endF540GhostDrag}
                />
                <div className="absolute left-1 top-1 max-w-[180px] rounded bg-[#252525] px-2 py-1 text-[9px] font-black text-white shadow">
                  {f530ToF534EquipmentPreview.selected.modality} / {f530ToF534EquipmentPreview.selected.equipment}
                </div>
                <div className="absolute bottom-1 right-1 rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-bold text-[#238a61]">
                  ghost no persistente
                </div>
              </div>
            )}

            {/* Main floor plan canvas */}
            <canvas
              ref={canvasRef}
              data-testid="f100-main-floorplan-canvas"
              data-f515b-last-event-action={lastF515EventAction}
              className="absolute inset-0 w-full h-full"
              style={{
                cursor: activeTool === 'barrier' || activeTool === 'measure' ? 'crosshair' :
                        activeTool === 'pan' ? 'grab' :
                        activeTool === 'source' ? 'copy' :
                        freehandEnabled ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'2\' fill=\'%23ef4444\'/%3E%3C/svg%3E") 10 10, crosshair' : 'default',
                opacity: layers.find(l => l.id === 'architecture')?.opacity ?? 1,
              }}
              onMouseDown={handleF561MouseDown}
              onMouseMove={handleF561MouseMove}
              onMouseUp={handleF561MouseUp}
              onWheel={handleWheel}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onContextMenu={handleCanvasContextMenu}
            />

            <span
              data-testid="f515b-canvas-event-action"
              className="sr-only"
              aria-label="Ultima accion F515b del canvas"
            >
              {lastF515EventAction}
            </span>

            <canvas
              ref={rendererV2OverlayCanvasRef}
              data-testid="f442-f445-renderer-v2-overlay-canvas"
              className="absolute inset-0 h-full w-full pointer-events-none"
              style={{ zIndex: 6 }}
              aria-label="Overlay renderer v2 F442-F445"
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
                <button type="button" data-testid="canvas-context-action-select" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(() => activateCanvasToolFromContext('select'))}>Seleccionar / editar</button>
                <button type="button" data-testid="canvas-context-action-barrier" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(() => activateCanvasToolFromContext('barrier'))}>Dibujar barrera</button>
                <button type="button" data-testid="canvas-context-action-source" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(() => activateCanvasToolFromContext('source'))}>Colocar fuente/equipo</button>
                <button type="button" data-testid="canvas-context-action-measure" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(() => activateCanvasToolFromContext('measure'))}>Medir / cota</button>
                <button type="button" data-testid="canvas-context-action-fit" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(fitCanvasViewFromContext)}>Ajustar vista</button>
                <button type="button" data-testid="canvas-context-action-export" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(exportCanvasPngFromContext)}>Exportar PNG</button>
                <button type="button" data-testid="canvas-context-action-calc" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(runCalculationsFromContext)}>Calcular blindaje</button>
                <button type="button" data-testid="canvas-context-action-evidence" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(openEvidencePackFromContext)}>Abrir evidencia</button>
                <button type="button" data-testid="canvas-context-action-3d" className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50" onClick={() => runContextMenuAction(openMedical3DFromContext)}>Inspeccion 3D medica</button>
                <button type="button" data-testid="canvas-context-action-f530-ghost" className="block w-full px-2.5 py-1.5 text-left font-semibold text-emerald-700 hover:bg-emerald-50" onClick={() => runContextMenuAction(previewF530EquipmentAtContext)}>Preview equipo aqui</button>
                <div className="border-t border-slate-100" />
                <button
                  type="button"
                  data-testid="canvas-context-action-duplicate"
                  className="block w-full px-2.5 py-1.5 text-left hover:bg-orange-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  disabled={!selectedInspectorEntity || !onDuplicateSelected}
                  onClick={() => runContextMenuAction(duplicateInspectorSelection)}
                >
                  Duplicar seleccionado
                </button>
                <button
                  type="button"
                  data-testid="canvas-context-action-delete"
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
              className={`pointer-events-none absolute right-2 z-10 hidden h-[58px] w-[58px] rotate-[-8deg] rounded-md border text-[9px] font-bold shadow-md backdrop-blur-sm lg:block ${
                f375IsCleanWorkspace
                  ? 'top-[148px] border-stone-300 bg-white/90 text-slate-500'
                  : 'top-[214px] border-slate-600 bg-[#1c2631]/92 text-slate-200'
              }`}
              title="Cubo de vista tipo SketchUp: orientacion de planta para inspeccion medica 2D/3D"
            >
              <div className="absolute left-2 top-2 h-8 w-8 skew-y-[-18deg] rounded-sm border border-slate-300 bg-[#f8fafc] shadow-inner" />
              <div className="absolute right-2 top-3 h-8 w-5 skew-y-[26deg] rounded-sm border border-slate-300 bg-[#eef2f7]" />
              <span className="absolute left-3 top-3 text-orange-600">{f214SketchUpCanvas.viewCubeLabels[0]}</span>
              <span className="absolute bottom-1 left-2 text-emerald-600">{f214SketchUpCanvas.viewCubeLabels[1]}</span>
              <span className="absolute bottom-1 right-2 text-red-500">{f214SketchUpCanvas.viewCubeLabels[2]}</span>
            </div>

            {!f375IsCleanWorkspace && (
              <>
                <div
                  data-testid="f411-bim-navigation-rail"
                  className="absolute right-2 top-2 z-20 hidden w-10 rounded-md border border-slate-700 bg-[#1c2631]/94 p-1 text-slate-100 shadow-xl backdrop-blur lg:flex lg:flex-col lg:gap-1"
                  aria-label="Navegacion BIM del viewport"
                >
                  {([
                    ['zoom-in', 'Acercar vista', ZoomIn, () => setCanvasState((prev: CanvasState) => ({ ...prev, scale: Math.min(10, prev.scale * 1.2) }))],
                    ['zoom-out', 'Alejar vista', ZoomOut, () => setCanvasState((prev: CanvasState) => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }))],
                    ['fit', 'Ajustar a pantalla', Maximize, onZoomToFit],
                    ['pan', 'Activar desplazamiento de vista', Move, () => activateCanvasTool('pan')],
                    ['top', 'Vista superior / planta', Crosshair, () => applyVisualMode('plan')],
                    ['3d', 'Abrir recorrido medico 3D', Stethoscope, onOpenMedical3D ?? onOpen3DViewer],
                  ] as const).map(([id, title, Icon, action]) => (
                    <button
                      key={id}
                      type="button"
                      data-testid={`f411-bim-nav-${id}`}
                      className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-[#263545] text-cyan-200 hover:border-cyan-400 hover:bg-[#33465a] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={action}
                      disabled={!action}
                      title={title}
                      aria-label={title}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
                <div
                  data-testid="f411-bim-methodology-card"
                  className="pointer-events-none absolute right-14 top-2 z-20 hidden w-[304px] rounded-md border border-slate-700 bg-[#1c2631]/94 p-2 text-slate-100 shadow-xl backdrop-blur xl:block"
                  title={f411BimMethodology.bimDataNeeds.join(' ')}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-cyan-200">BIM methodology</div>
                    <span className={f411BimMethodology.status === 'bim-canvas-adaptation-ready' ? 'text-[9px] font-bold text-emerald-300' : 'text-[9px] font-bold text-amber-300'}>
                      {f411BimMethodology.readinessScore}%
                    </span>
                  </div>
                  <div data-testid="f412-bim-entity-catalog" className="space-y-1">
                    {f411BimMethodology.entityCatalog.slice(0, 5).map((entityRow) => (
                      <div key={entityRow.id} className="grid grid-cols-[20px_1fr_42px] items-center gap-1 text-[9px] leading-snug text-slate-300">
                        <span className={`h-2 w-2 rounded-full ${
                          entityRow.status === 'ready' ? 'bg-emerald-300' :
                            entityRow.status === 'external' ? 'bg-cyan-300' : 'bg-amber-300'
                        }`} />
                        <span className="truncate" title={`${entityRow.category}: ${entityRow.radShieldBinding}`}>{entityRow.label}</span>
                        <span className="rounded bg-[#101821] px-1 text-right font-mono text-cyan-200">{entityRow.count}</span>
                      </div>
                    ))}
                  </div>
                  <div data-testid="f412-bim-rs-parameters" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>RS_* Parameters</span>
                      <span className="text-cyan-200">{f411BimMethodology.sharedParameterRows.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {f411BimMethodology.sharedParameterRows.slice(0, 5).map((parameter) => (
                        <span key={parameter.name} className="rounded bg-[#263545] px-1 text-[8px] text-slate-200" title={`${parameter.description}: ${parameter.example}`}>
                          {parameter.name.replace('RS_', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f413-bim-execution-plan" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>BIM Execution</span>
                      <span className={f413BimExecutionPlan.status === 'bim-execution-ready' ? 'text-emerald-300' : 'text-amber-300'}>
                        {f413BimExecutionPlan.readinessScore}%
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {f413BimExecutionPlan.steps.map((step) => (
                        <span
                          key={step.id}
                          data-testid={`f413-bim-step-${step.id}`}
                          className={`rounded px-1 py-0.5 text-center text-[7px] font-bold ${
                            step.status === 'ready'
                              ? 'bg-emerald-950/50 text-emerald-200'
                              : step.status === 'external'
                                ? 'bg-cyan-950/50 text-cyan-200'
                                : step.status === 'blocked'
                                  ? 'bg-red-950/50 text-red-200'
                                  : 'bg-amber-950/50 text-amber-200'
                          }`}
                          title={`${step.owner}: ${step.purpose}`}
                        >
                          {step.label.slice(0, 4)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f414-bim-video-reference" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Video/UI reference</span>
                      <span className={f414BimVideoReference.status === 'reference-ready' ? 'text-emerald-300' : 'text-amber-300'}>
                        {f414BimVideoReference.status === 'reference-ready' ? 'frames' : 'image'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {f414BimVideoReference.patterns.slice(0, 6).map((pattern) => (
                        <span
                          key={pattern.id}
                          data-testid={`f414-bim-pattern-${pattern.id}`}
                          className="truncate rounded bg-[#263545] px-1 py-0.5 text-[7px] text-cyan-100"
                          title={`${pattern.canvasApplication} Regla: ${pattern.releaseRule}`}
                        >
                          {pattern.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f415-bim-mep-coordination" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>MEP coordination</span>
                      <span className="text-emerald-300">{f415BimMepCoordination.gates.filter((gate) => gate.releaseBlocking).length} gates</span>
                    </div>
                    <div className="space-y-1">
                      {f415BimMepCoordination.systemLayers.slice(0, 5).map((layer) => (
                        <div key={layer.id} className="grid grid-cols-[10px_1fr_32px] items-center gap-1 text-[8px] text-slate-300">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: layer.color }} />
                          <span className="truncate" title={`${layer.bimCategory}: ${layer.requiredChecks.join(', ')}`}>{layer.label}</span>
                          <span className={`rounded px-1 text-center font-bold ${
                            layer.radiologicalRisk === 'high'
                              ? 'bg-red-950/50 text-red-200'
                              : layer.radiologicalRisk === 'medium'
                                ? 'bg-amber-950/50 text-amber-200'
                                : 'bg-emerald-950/50 text-emerald-200'
                          }`}>
                            {layer.radiologicalRisk}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f415-shielding-story-sequence" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Shielding story</span>
                      <span className="text-cyan-200">{f415BimMepCoordination.surfaceRoles.length} roles</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {f415BimMepCoordination.shieldingStory.slice(0, 4).map((step) => (
                        <span
                          key={step.id}
                          data-testid={`f415-story-${step.id}`}
                          className="truncate rounded bg-[#263545] px-1 py-0.5 text-[7px] text-cyan-100"
                          title={`${step.message} Uso canvas: ${step.canvasUse}`}
                        >
                          {step.label}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {f415BimMepCoordination.surfaceRoles.map((role) => (
                        <span
                          key={role.id}
                          data-testid={`f415-surface-role-${role.id}`}
                          className="rounded border px-1 py-0.5 text-[7px] text-slate-100"
                          style={{ borderColor: role.color }}
                          title={`${role.function} Memoria: ${role.memoryRequirement}`}
                        >
                          {role.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f415-design-questions" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Before first patient</span>
                      <span className="text-cyan-200">{f415BimMepCoordination.referenceStandards.length} refs</span>
                    </div>
                    <div className="space-y-1">
                      {f415BimMepCoordination.designQuestions.slice(0, 3).map((item) => (
                        <div key={item.id} data-testid={`f415-question-${item.id}`} className="truncate text-[8px] text-slate-300" title={item.requiredEvidence}>
                          <span className="font-bold text-cyan-200">?</span> {item.question}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f416-provider-registry" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>BIM providers</span>
                      <span className="text-cyan-200">{f416ToF420BimCanvasSequence.providers.length}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {f416ToF420BimCanvasSequence.providers.map((provider) => (
                        <span
                          key={provider.id}
                          data-testid={`f416-provider-${provider.id}`}
                          className={`truncate rounded px-1 py-0.5 text-[7px] ${
                            provider.qaRisk === 'low'
                              ? 'bg-emerald-950/50 text-emerald-200'
                              : provider.qaRisk === 'medium'
                                ? 'bg-amber-950/50 text-amber-200'
                                : 'bg-red-950/50 text-red-200'
                          }`}
                          title={`${provider.url} | ${provider.formats.join(', ')} | ${provider.radShieldUse}`}
                        >
                          {provider.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f417-object-library" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Object library</span>
                      <span className="text-cyan-200">{f416ToF420BimCanvasSequence.objectTemplates.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {f416ToF420BimCanvasSequence.objectTemplates.slice(0, 8).map((template) => (
                        <span
                          key={template.id}
                          data-testid={`f417-object-${template.id}`}
                          className="rounded border px-1 py-0.5 text-[7px] text-slate-100"
                          style={{ borderColor: template.color }}
                          title={`${template.canvasAction} Metadata: ${template.requiredMetadata.join(', ')}`}
                        >
                          {template.symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f418-cutaway-metrics" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Cutaway 2.5D</span>
                      <span className="text-cyan-200">visible/real</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {f416ToF420BimCanvasSequence.cutawayMetrics.map((metric) => (
                        <div key={metric.id} data-testid={`f418-cutaway-${metric.id}`} className="truncate rounded bg-[#263545] px-1 py-0.5 text-[7px] text-slate-200" title={metric.label}>
                          <span className={metric.status === 'ready' ? 'text-emerald-300' : metric.status === 'draft' ? 'text-amber-300' : 'text-red-300'}>{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f419-surface-role-assignments" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Surface roles</span>
                      <span className="text-cyan-200">{f416ToF420BimCanvasSequence.surfaceAssignments.filter((item) => item.status === 'ready').length} ready</span>
                    </div>
                    <div className="space-y-1">
                      {f416ToF420BimCanvasSequence.surfaceAssignments.map((assignment) => (
                        <div key={assignment.id} data-testid={`f419-role-${assignment.id}`} className="grid grid-cols-[10px_1fr_28px] items-center gap-1 text-[8px] text-slate-300">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: assignment.color }} />
                          <span className="truncate" title={assignment.requirement}>{assignment.label}</span>
                          <span className={assignment.status === 'ready' ? 'text-emerald-300' : assignment.status === 'needs-calculation' ? 'text-amber-300' : 'text-red-300'}>
                            {assignment.barrierCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f420-mep-clash-candidates" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>MEP clash checks</span>
                      <span className="text-red-200">{f416ToF420BimCanvasSequence.clashCandidates.filter((item) => item.releaseBlocking).length} block</span>
                    </div>
                    <div className="space-y-1">
                      {f416ToF420BimCanvasSequence.clashCandidates.slice(0, 3).map((candidate) => (
                        <div key={candidate.id} data-testid={`f420-clash-${candidate.id}`} className="truncate text-[8px] text-slate-300" title={`${candidate.affectedSurface}: ${candidate.requiredAction}`}>
                          <span className={candidate.risk === 'high' ? 'font-bold text-red-300' : candidate.risk === 'medium' ? 'font-bold text-amber-300' : 'font-bold text-emerald-300'}>!</span> {candidate.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f421-visual-export-bim" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Visual exports</span>
                      <span className="text-cyan-200">{f421ToF425BimHandoff.visualExports.filter((item) => item.status === 'ready').length} ready</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {f421ToF425BimHandoff.visualExports.map((item) => (
                        <span
                          key={item.id}
                          data-testid={`f421-export-${item.id}`}
                          className={`truncate rounded px-1 py-0.5 text-[7px] ${item.status === 'ready' ? 'bg-emerald-950/50 text-emerald-200' : 'bg-amber-950/50 text-amber-200'}`}
                          title={`${item.format}: ${item.includes.join(', ')} | ${item.releaseUse}`}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f422-intake-pipeline" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Intake pipeline</span>
                      <span className="text-cyan-200">{f421ToF425BimHandoff.intakeRoutes.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {f421ToF425BimHandoff.intakeRoutes.map((route) => (
                        <span
                          key={route.id}
                          data-testid={`f422-intake-${route.id}`}
                          className={`rounded border px-1 py-0.5 text-[7px] ${
                            route.risk === 'low'
                              ? 'border-emerald-700 text-emerald-200'
                              : route.risk === 'medium'
                                ? 'border-amber-700 text-amber-200'
                                : 'border-red-700 text-red-200'
                          }`}
                          title={`${route.mode}: ${route.intakeRule}`}
                        >
                          {route.format}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f423-normalization-map" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Normalize RS_*</span>
                      <span className="text-cyan-200">{f421ToF425BimHandoff.normalizationMap.length}</span>
                    </div>
                    <div className="space-y-1">
                      {f421ToF425BimHandoff.normalizationMap.slice(0, 3).map((item) => (
                        <div key={item.id} data-testid={`f423-map-${item.id}`} className="truncate text-[8px] text-slate-300" title={`${item.sourceCategory} -> ${item.targetCategory}: ${item.validationRule}`}>
                          <span className="font-bold text-cyan-200">RS</span> {item.targetCategory}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f424-product-spec-library" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>Product/spec</span>
                      <span className="text-cyan-200">{f421ToF425BimHandoff.productSpecRecords.length}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {f421ToF425BimHandoff.productSpecRecords.slice(0, 6).map((record) => (
                        <span
                          key={record.id}
                          data-testid={`f424-product-${record.id}`}
                          className="truncate rounded bg-[#263545] px-1 py-0.5 text-[7px] text-slate-200"
                          title={`${record.source}: ${record.requiredFields.join(', ')} | ${record.evidenceRule}`}
                        >
                          {record.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f425-bim-handoff" className="mt-2 rounded border border-slate-700 bg-[#101821]/80 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>BIM handoff</span>
                      <span className="text-amber-200" title={f421ToF425BimHandoff.rendererDeepRationale}>renderer after F425</span>
                    </div>
                    <div className="space-y-1">
                      {f421ToF425BimHandoff.handoffDeliverables.slice(0, 4).map((item) => (
                        <div key={item.id} data-testid={`f425-handoff-${item.id}`} className="truncate text-[8px] text-slate-300" title={`${item.target}: ${item.blockingFields.join(', ')} | ${item.handoffRule}`}>
                          <span className="font-bold text-cyan-200">-</span> {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f426-f430-calc-renderer-closure" className="mt-2 rounded border border-cyan-800 bg-[#08131d]/90 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>F426-F430 Calc/Renderer</span>
                      <span className={f426ToF430CalcRendererClosure.releaseBlocks.length ? 'text-amber-200' : 'text-emerald-200'}>
                        {f426ToF430CalcRendererClosure.releaseBlocks.length} blocks
                      </span>
                    </div>
                    <div data-testid="f426-surface-role-calculation" className="grid grid-cols-5 gap-1">
                      {f426ToF430CalcRendererClosure.surfaceRoleCalculations.map((item) => (
                        <span
                          key={item.id}
                          className={`truncate rounded px-1 py-0.5 text-center text-[7px] ${
                            item.status === 'ready'
                              ? 'bg-emerald-950/50 text-emerald-200'
                              : item.status === 'needs-calculation'
                                ? 'bg-amber-950/50 text-amber-200'
                                : 'bg-red-950/50 text-red-200'
                          }`}
                          title={`${item.formulaFamily} | ${item.standard} | ${item.rendererOverlay}`}
                        >
                          {item.label}:{item.barrierCount}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f427-penetration-penalties" className="mt-1 flex flex-wrap gap-1">
                      {f426ToF430CalcRendererClosure.penetrationPenalties.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className={`rounded border px-1 py-0.5 text-[7px] ${item.blocking ? 'border-red-700 text-red-200' : 'border-amber-700 text-amber-200'}`}
                          title={`${item.trigger} Factor ${item.defaultPenaltyFactor.toFixed(2)} | ${item.penaltyModel}`}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-1 text-[8px] text-slate-300">
                      <div data-testid="f428-structural-loads" className="truncate rounded bg-[#263545] px-1 py-0.5" title="Carga estructural integrada por material, muro, losa, puerta y equipo">
                        <span className="font-bold text-cyan-200">{f426ToF430CalcRendererClosure.totalStructuralLoadKgPerM2}</span> kg/m2
                      </div>
                      <div data-testid="f429-normative-qa-cases" className="truncate rounded bg-[#263545] px-1 py-0.5" title="Casos conocidos NCRP/IAEA/UAQ pendientes/listos por modalidad">
                        <span className="font-bold text-cyan-200">{f426ToF430CalcRendererClosure.normativeQaCases.length}</span> QA cases
                      </div>
                    </div>
                    <div data-testid="f430-auto-memory-flow" className="mt-1 truncate text-[8px] text-slate-300" title={f426ToF430CalcRendererClosure.autoMemorySteps.map((step) => `${step.label}: ${step.output}`).join(' | ')}>
                      <span className="font-bold text-cyan-200">Memoria:</span> {'plano -> equipo -> barreras -> calculo -> evidencia -> PDF'}
                    </div>
                    <div data-testid="f426-f430-renderer-deep-plan" className="mt-1 flex flex-wrap gap-1">
                      {f426ToF430CalcRendererClosure.rendererDeepPlan.map((step) => (
                        <span
                          key={step.id}
                          className={`rounded px-1 py-0.5 text-[7px] ${
                            step.status === 'ready'
                              ? 'bg-emerald-950/50 text-emerald-200'
                              : step.status === 'draft'
                                ? 'bg-amber-950/50 text-amber-200'
                                : 'bg-red-950/50 text-red-200'
                          }`}
                          title={`${step.phase}: ${step.implementation} | ${step.connectedEvidence.join(', ')}`}
                        >
                          {step.phase}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f431-f435-renderer-release-gate" className="mt-2 rounded border border-emerald-800 bg-[#07140f]/90 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>F431-F435 Release gate</span>
                      <span className={f431ToF435RendererReleaseGate.status === 'renderer-release-gate-ready' ? 'text-emerald-200' : 'text-amber-200'}>
                        {f431ToF435RendererReleaseGate.status === 'renderer-release-gate-ready' ? 'ready' : 'gated'}
                      </span>
                    </div>
                    <div data-testid="f431-visual-smoke-surfaces" className="grid grid-cols-3 gap-1">
                      {f431ToF435RendererReleaseGate.visualSmokeSurfaces.slice(0, 6).map((surface) => (
                        <span key={surface.id} className="truncate rounded bg-emerald-950/40 px-1 py-0.5 text-[7px] text-emerald-200" title={`${surface.testId}: ${surface.expected}`}>
                          {surface.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f432-evidence-memory-manifest" className="mt-1 truncate text-[8px] text-slate-300" title={f431ToF435RendererReleaseGate.evidenceMemoryManifest.map((item) => `${item.label}: ${item.evidenceOutput}`).join(' | ')}>
                      <span className="font-bold text-emerald-200">{f431ToF435RendererReleaseGate.evidenceMemoryManifest.length}</span> manifests Evidence/Memoria
                    </div>
                    <div data-testid="f433-release-block-review" className="mt-1 truncate text-[8px] text-slate-300" title={f431ToF435RendererReleaseGate.releaseBlockReview.map((item) => item.blocker).join(' | ')}>
                      <span className="font-bold text-amber-200">{f431ToF435RendererReleaseGate.releaseBlockReview.length}</span> release checks
                    </div>
                    <div data-testid="f434-renderer-base-decision" className="mt-1 truncate rounded bg-[#263545] px-1 py-0.5 text-[8px] text-slate-200" title={`${f431ToF435RendererReleaseGate.rendererBaseDecision.rationale} Rollback: ${f431ToF435RendererReleaseGate.rendererBaseDecision.rollback}`}>
                      Renderer: <span className="font-bold text-cyan-200">{f431ToF435RendererReleaseGate.rendererBaseDecision.decision}</span>
                    </div>
                    <div data-testid="f435-next-phase-handoff" className="mt-1 flex flex-wrap gap-1">
                      {f431ToF435RendererReleaseGate.nextPhaseHandoff.map((item) => (
                        <span key={item.id} className="rounded border border-emerald-700 px-1 py-0.5 text-[7px] text-emerald-200" title={`${item.deliverable} | ${item.acceptanceCriteria.join(', ')}`}>
                          {item.nextPhase}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div data-testid="f436-f438-renderer-v2-bridge" className="mt-2 rounded border border-violet-800 bg-[#120b1f]/90 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>F436-F438 Renderer v2</span>
                      <span className={f436ToF438RendererV2Bridge.status === 'renderer-v2-bridge-ready' ? 'text-emerald-200' : 'text-amber-200'}>
                        {f436ToF438RendererV2Bridge.status === 'renderer-v2-bridge-ready' ? 'ready' : 'gated'}
                      </span>
                    </div>
                    <div data-testid="f436-visual-baseline" className="grid grid-cols-2 gap-1">
                      {f436ToF438RendererV2Bridge.visualBaselines.map((baseline) => (
                        <span key={baseline.id} className="truncate rounded bg-violet-950/50 px-1 py-0.5 text-[7px] text-violet-200" title={`${baseline.width}x${baseline.height}: ${baseline.acceptance}`}>
                          {baseline.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f437-pdf-evidence-live-link" className="mt-1 truncate text-[8px] text-slate-300" title={f436ToF438RendererV2Bridge.pdfEvidenceLinks.map((link) => `${link.target}: ${link.payloadFields.join(', ')}`).join(' | ')}>
                      <span className="font-bold text-violet-200">{f436ToF438RendererV2Bridge.pdfEvidenceLinks.length}</span> PDF/Evidence links
                    </div>
                    <div data-testid="f438-renderer-geometry-core" className="mt-1 flex flex-wrap gap-1">
                      {f436ToF438RendererV2Bridge.geometryCoreEntities.map((entity) => (
                        <span key={entity.id} className={`rounded px-1 py-0.5 text-[7px] ${entity.enabledByFlag ? 'bg-emerald-950/50 text-emerald-200' : 'bg-amber-950/50 text-amber-200'}`} title={`${entity.rendererLayer}: ${entity.normalizedFields.join(', ')}`}>
                          {entity.entityType}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f438-feature-flag-policy" className="mt-1 truncate text-[8px] text-slate-300" title={f436ToF438RendererV2Bridge.featureFlagPolicy.rollback.join(' ')}>
                      Flag: <span className="font-bold text-violet-200">{f436ToF438RendererV2Bridge.featureFlagPolicy.masterFlag}</span> / eventos off
                    </div>
                  </div>
                  <div data-testid="f439-f441-renderer-geometry-core" className="mt-2 rounded border border-cyan-800 bg-[#061923]/90 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>F439-F441 Geometry core</span>
                      <span className={f439ToF441RendererGeometryCore.status === 'geometry-core-ready' ? 'text-emerald-200' : 'text-amber-200'}>
                        {f439ToF441RendererGeometryCore.status === 'geometry-core-ready' ? 'ready' : 'gated'}
                      </span>
                    </div>
                    <div data-testid="f439-normalized-entities" className="grid grid-cols-5 gap-1">
                      {(['barrier', 'source', 'region', 'penetration', 'overlay'] as const).map((type) => (
                        <span key={type} className="truncate rounded bg-cyan-950/50 px-1 py-0.5 text-center text-[7px] text-cyan-100" title={`Entidades normalizadas tipo ${type}`}>
                          {type}:{f439ToF441RendererGeometryCore.normalizedEntities.filter((entity) => entity.type === type).length}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f440-overlay-render-plan" className="mt-1 flex flex-wrap gap-1">
                      {f439ToF441RendererGeometryCore.overlayPlans.map((plan) => (
                        <span key={plan.id} className="rounded border border-cyan-700 px-1 py-0.5 text-[7px] text-cyan-200" title={`${plan.layer}: ${plan.entityIds.length} entidades | ${plan.evidenceOutput}`}>
                          {plan.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f441-renderer-core-preflight" className="mt-1 flex flex-wrap gap-1">
                      {f439ToF441RendererGeometryCore.preflight.map((item) => (
                        <span key={item.id} className={`rounded px-1 py-0.5 text-[7px] ${item.pass ? 'bg-emerald-950/50 text-emerald-200' : 'bg-amber-950/50 text-amber-200'}`} title={`${item.evidence} Rollback: ${item.rollback}`}>
                          {item.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f441-renderer-core-decision" className="mt-1 truncate text-[8px] text-slate-300" title={f439ToF441RendererGeometryCore.releaseDecision}>
                      {f439ToF441RendererGeometryCore.enabledByFeatureFlag ? 'Flag staging activo' : 'Flag staging apagado'} / eventos legacy intactos
                    </div>
                  </div>
                  <div data-testid="f442-f445-renderer-v2-runtime" className="mt-2 rounded border border-sky-800 bg-[#04131f]/90 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>F442-F445 Renderer v2 runtime</span>
                      <span className={f442ToF445RendererV2Runtime.status === 'renderer-v2-runtime-ready' ? 'text-emerald-200' : f442ToF445RendererV2Runtime.status === 'renderer-v2-runtime-preview' ? 'text-sky-200' : 'text-amber-200'}>
                        {f442ToF445RendererV2Runtime.activationMode}
                      </span>
                    </div>
                    <div data-testid="f442-render-instructions" className="grid grid-cols-4 gap-1">
                      {(['polyline', 'polygon', 'footprint', 'badge'] as const).map((primitive) => (
                        <span key={primitive} className="truncate rounded bg-sky-950/50 px-1 py-0.5 text-center text-[7px] text-sky-100" title={`Primitivas ${primitive}`}>
                          {primitive}:{f442ToF445RendererV2Runtime.instructions.filter((instruction) => instruction.primitive === primitive).length}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f443-render-passes" className="mt-1 flex flex-wrap gap-1">
                      {f442ToF445RendererV2Runtime.passes.slice(0, 6).map((pass) => (
                        <span key={pass.id} className="rounded border border-sky-700 px-1 py-0.5 text-[7px] text-sky-200" title={pass.acceptance}>
                          {pass.label}:{pass.instructionIds.length}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f444-runtime-gates" className="mt-1 flex flex-wrap gap-1">
                      {f442ToF445RendererV2Runtime.gates.map((gate) => (
                        <span key={gate.id} className={`rounded px-1 py-0.5 text-[7px] ${gate.pass ? 'bg-emerald-950/50 text-emerald-200' : 'bg-amber-950/50 text-amber-200'}`} title={gate.evidence}>
                          {gate.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f445-rollback-plan" className="mt-1 truncate text-[8px] text-slate-300" title={f442ToF445RendererV2Runtime.rollbackPlan.map((item) => `${item.trigger}: ${item.action}`).join(' | ')}>
                      Helper: <span className="font-bold text-sky-200">{f442ToF445RendererV2Runtime.drawHelper}</span> / rollback listo
                    </div>
                  </div>
                  <div data-testid="f446-f448-canvas-strong-qa" className="mt-2 rounded border border-lime-800 bg-[#0b1809]/90 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between font-bold uppercase tracking-wide text-slate-400">
                      <span>F446-F448 Canvas QA</span>
                      <span className={f446ToF448CanvasStrongQa.status === 'canvas-strong-qa-ready' ? 'text-emerald-200' : f446ToF448CanvasStrongQa.status === 'canvas-strong-qa-review' ? 'text-amber-200' : 'text-red-200'}>
                        {f446ToF448CanvasStrongQa.status.replace('canvas-strong-qa-', '')}
                      </span>
                    </div>
                    <div data-testid="f446-surface-checks" className="grid grid-cols-2 gap-1">
                      {f446ToF448CanvasStrongQa.surfaceChecks.map((check) => (
                        <span key={check.id} className={`truncate rounded px-1 py-0.5 text-[7px] ${check.status === 'ready' ? 'bg-emerald-950/50 text-emerald-200' : check.status === 'review' ? 'bg-amber-950/50 text-amber-200' : 'bg-red-950/50 text-red-200'}`} title={`${check.surface}: ${check.evidence}`}>
                          {check.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f447-interaction-checks" className="mt-1 flex flex-wrap gap-1">
                      {f446ToF448CanvasStrongQa.interactionChecks.map((check) => (
                        <span key={check.id} className={`rounded px-1 py-0.5 text-[7px] ${check.status === 'ready' ? 'bg-lime-950/50 text-lime-200' : check.status === 'review' ? 'bg-amber-950/50 text-amber-200' : 'bg-red-950/50 text-red-200'}`} title={`${check.action}: ${check.expected}`}>
                          {check.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f448-regression-gates" className="mt-1 flex flex-wrap gap-1">
                      {f446ToF448CanvasStrongQa.regressionGates.map((gate) => (
                        <span key={gate.id} className={`rounded border px-1 py-0.5 text-[7px] ${gate.pass ? 'border-emerald-700 text-emerald-200' : 'border-red-700 text-red-200'}`} title={`${gate.blockingRule} Rollback: ${gate.rollback}`}>
                          {gate.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f448-release-decision" className="mt-1 truncate text-[8px] text-slate-300" title={f446ToF448CanvasStrongQa.releaseDecision}>
                      E2E: <span className="font-bold text-lime-200">{f446ToF448CanvasStrongQa.e2eSpec}</span>
                    </div>
                  </div>
                  <div data-testid="f449-f453-bim-memory-visual" className="mt-2 rounded border border-indigo-800 bg-[#0b1020]/92 p-1.5 text-[9px]">
                    <div className="mb-1 flex items-center justify-between gap-2 font-bold uppercase tracking-wide text-slate-400">
                      <span>{f449ToF453BimMemoryVisual.boardTitle}</span>
                      <span className={f449ToF453BimMemoryVisual.status === 'bim-memory-visual-ready' ? 'text-emerald-200' : 'text-amber-200'}>
                        {f449ToF453BimMemoryVisual.status.replace('bim-memory-visual-', '')}
                      </span>
                    </div>
                    <svg
                      data-testid="f451-bim-visual-board"
                      viewBox="0 0 520 245"
                      role="img"
                      aria-label="Tablero BIM de blindaje con corte del bunker, roles de muros, evidencia y flujo a memoria"
                      className="h-auto w-full rounded border border-slate-700 bg-[#111827]"
                    >
                      <rect x="0" y="0" width="520" height="245" fill="#111827" />
                      <rect x="8" y="12" width="88" height="184" rx="4" fill="#1f2937" stroke="#475569" />
                      <text x="16" y="27" fill="#cbd5e1" fontSize="9" fontWeight="700">PROJECT</text>
                      {['Plano', 'Equipos', 'Muros', 'MEP', 'Evidencia'].map((label, index) => (
                        <g key={label}>
                          <rect x="16" y={40 + index * 24} width="68" height="14" rx="2" fill={index === 2 ? '#312e81' : '#334155'} stroke="#64748b" />
                          <circle cx="23" cy={47 + index * 24} r="3" fill={index === 0 ? '#38bdf8' : index === 1 ? '#ef4444' : index === 2 ? '#22c55e' : index === 3 ? '#06b6d4' : '#f59e0b'} />
                          <text x="31" y={50 + index * 24} fill="#e5e7eb" fontSize="7">{label}</text>
                        </g>
                      ))}
                      <rect x="112" y="12" width="286" height="28" rx="4" fill="#1f2937" stroke="#475569" />
                      {['Diseno', 'Equipo', 'Blindaje', 'Verificar', 'Memoria'].map((label, index) => (
                        <g key={label}>
                          <rect x={122 + index * 54} y="20" width="44" height="12" rx="2" fill="#334155" stroke="#64748b" />
                          <text x={129 + index * 54} y="28" fill="#e5e7eb" fontSize="6">{label}</text>
                        </g>
                      ))}
                      <polygon points="178,80 270,50 354,86 258,126" fill="#374151" stroke="#94a3b8" strokeWidth="2" />
                      <polygon points="198,88 268,66 331,91 257,115" fill="#f87171" opacity="0.82" stroke="#fecaca" />
                      <polygon points="198,88 257,115 257,151 198,124" fill="#475569" stroke="#94a3b8" />
                      <polygon points="257,115 331,91 331,128 257,151" fill="#334155" stroke="#94a3b8" />
                      <polygon points="218,96 265,82 306,98 258,112" fill="#111827" stroke="#e5e7eb" strokeWidth="1.5" />
                      <rect x="238" y="91" width="38" height="16" rx="7" fill="#d1d5db" stroke="#f8fafc" />
                      <circle cx="257" cy="99" r="8" fill="#9ca3af" stroke="#f8fafc" />
                      <path d="M257 99 L342 77" stroke="#60a5fa" strokeWidth="2" markerEnd="url(#f451-arrow)" />
                      <path d="M258 113 C290 128 311 142 340 158" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#f451-arrow)" />
                      <path d="M198 124 L161 154" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 3" markerEnd="url(#f451-arrow)" />
                      <rect x="333" y="63" width="74" height="24" rx="3" fill="#0f172a" stroke="#60a5fa" />
                      <text x="340" y="74" fill="#bfdbfe" fontSize="7" fontWeight="700">Primary beam</text>
                      <text x="340" y="82" fill="#dbeafe" fontSize="6">formulaId + P/T/U/W</text>
                      <rect x="337" y="146" width="74" height="25" rx="3" fill="#082f49" stroke="#06b6d4" />
                      <text x="344" y="157" fill="#cffafe" fontSize="7" fontWeight="700">MEP sleeves</text>
                      <text x="344" y="165" fill="#e0f2fe" fontSize="6">penalty + continuity</text>
                      <rect x="118" y="146" width="68" height="25" rx="3" fill="#451a03" stroke="#f59e0b" />
                      <text x="125" y="157" fill="#fde68a" fontSize="7" fontWeight="700">Maze route</text>
                      <text x="125" y="165" fill="#fef3c7" fontSize="6">indirect path</text>
                      <rect x="418" y="12" width="92" height="126" rx="4" fill="#1f2937" stroke="#475569" />
                      <text x="428" y="27" fill="#cbd5e1" fontSize="9" fontWeight="700">PROPERTIES</text>
                      {f449ToF453BimMemoryVisual.traceBindings.slice(0, 5).map((binding, index) => (
                        <g key={binding.id}>
                          <rect x="428" y={38 + index * 18} width="70" height="11" rx="2" fill={binding.status === 'ready' ? '#064e3b' : '#78350f'} />
                          <text x="434" y={46 + index * 18} fill={binding.status === 'ready' ? '#bbf7d0' : '#fde68a'} fontSize="6">{binding.label}</text>
                        </g>
                      ))}
                      <rect x="418" y="148" width="92" height="48" rx="4" fill="#0f172a" stroke="#64748b" />
                      <text x="428" y="162" fill="#cbd5e1" fontSize="8" fontWeight="700">Evidence</text>
                      {['NCRP', 'IAEA', 'AAPM', 'UAQ'].map((label, index) => (
                        <g key={label}>
                          <rect x={428 + index * 19} y="170" width="16" height="12" rx="2" fill="#312e81" stroke="#818cf8" />
                          <text x={431 + index * 19} y="178" fill="#e0e7ff" fontSize="5">{label}</text>
                        </g>
                      ))}
                      <rect x="112" y="203" width="386" height="28" rx="4" fill="#0f172a" stroke="#475569" />
                      {['Plano', 'Equipo', 'Barreras', 'Calculo', 'Citas', 'PDF'].map((label, index) => (
                        <g key={label}>
                          <circle cx={135 + index * 68} cy="217" r="8" fill={index < 4 ? '#065f46' : '#312e81'} stroke="#cbd5e1" />
                          <text x={126 + index * 68} y="235" fill="#cbd5e1" fontSize="6">{label}</text>
                          {index < 5 ? <path d={`M${143 + index * 68} 217 L${194 + index * 68} 217`} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#f451-arrow)" /> : null}
                        </g>
                      ))}
                      <defs>
                        <marker id="f451-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                        </marker>
                      </defs>
                    </svg>
                    <div data-testid="f449-trace-bindings" className="mt-1 grid grid-cols-2 gap-1">
                      {f449ToF453BimMemoryVisual.traceBindings.map((binding) => (
                        <span key={binding.id} className={`truncate rounded px-1 py-0.5 text-[7px] ${binding.status === 'ready' ? 'bg-emerald-950/50 text-emerald-200' : 'bg-amber-950/50 text-amber-200'}`} title={`${binding.calculationTrace} | ${binding.standard} | ${binding.memorySection}`}>
                          {binding.label}:{binding.status === 'ready' ? 'ok' : 'data'}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f450-citation-bindings" className="mt-1 flex flex-wrap gap-1">
                      {f449ToF453BimMemoryVisual.citationBindings.map((binding) => (
                        <span key={binding.id} className={`rounded border px-1 py-0.5 text-[7px] ${binding.status === 'ready' ? 'border-indigo-700 text-indigo-200' : 'border-amber-700 text-amber-200'}`} title={`${binding.citationRule} Hash: ${binding.hashRule}`}>
                          {binding.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f451-visual-adaptations" className="mt-1 flex flex-wrap gap-1">
                      {f449ToF453BimMemoryVisual.visualAdaptations.map((adaptation) => (
                        <span key={adaptation.id} className="rounded bg-slate-800 px-1 py-0.5 text-[7px] text-slate-200" title={`${adaptation.fromReference} -> ${adaptation.adaptedToRadShield}`}>
                          {adaptation.canvasLayer}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f452-graphic-panels" className="mt-1 flex flex-wrap gap-1">
                      {f449ToF453BimMemoryVisual.graphicPanels.map((panel) => (
                        <span key={panel.id} className="rounded border border-sky-700 px-1 py-0.5 text-[7px] text-sky-200" title={`${panel.purpose} Acciones: ${panel.connectedActions.join(', ')}`}>
                          {panel.label}
                        </span>
                      ))}
                    </div>
                    <div data-testid="f453-release-handoff" className="mt-1 truncate text-[8px] text-slate-300" title={f449ToF453BimMemoryVisual.releaseHandoff.map((item) => `${item.label}: ${item.acceptance}`).join(' | ')}>
                      {f449ToF453BimMemoryVisual.boardSubtitle}
                    </div>
                  </div>
                  <div data-testid="f412-bim-roundtrip-gates" className="mt-2 flex flex-wrap gap-1">
                    {f411BimMethodology.roundtripGates.slice(0, 4).map((gate) => (
                      <span
                        key={gate.id}
                        className={`rounded border px-1 py-0.5 text-[8px] ${
                          gate.status === 'ready'
                            ? 'border-emerald-700 bg-emerald-950/40 text-emerald-200'
                            : gate.status === 'external'
                              ? 'border-cyan-700 bg-cyan-950/40 text-cyan-200'
                              : 'border-amber-700 bg-amber-950/40 text-amber-200'
                        }`}
                        title={gate.note}
                      >
                        {gate.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  data-testid="f411-bim-callout-legend"
                  className="absolute bottom-16 right-2 z-20 hidden w-[220px] rounded-md border border-slate-700 bg-[#101821]/94 p-2 text-[9px] text-slate-200 shadow-xl backdrop-blur lg:block"
                  aria-label="Leyenda BIM de blindaje"
                >
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-cyan-200">Legend</div>
                  {[
                    ['Fuente/equipo', '#ef4444', 'arrow'],
                    ['Barrera primaria/sec.', '#10b981', 'solid'],
                    ['Zona controlada/publica', '#0ea5e9', 'dash'],
                    ['Heatmap/isocontorno', '#f59e0b', 'dot'],
                  ].map(([label, color, style]) => (
                    <div key={label} className="flex items-center gap-2 py-0.5">
                      <span
                        className={`h-0.5 w-10 ${style === 'dash' ? 'border-t border-dashed' : style === 'dot' ? 'border-t border-dotted' : ''}`}
                        style={{ backgroundColor: style === 'solid' || style === 'arrow' ? color : 'transparent', borderColor: color }}
                      />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div
                  data-testid="f411-bim-command-line"
                  className="absolute bottom-2 left-[244px] right-2 z-20 hidden min-h-7 items-center rounded border border-slate-700 bg-[#101821]/94 px-2 text-[10px] text-slate-300 shadow-xl backdrop-blur xl:flex"
                  title="Linea de comando visual: refleja la ultima accion enviada desde toolbar o dock"
                >
                  <span className="mr-2 font-bold text-cyan-200">Command:</span>
                  <span className="font-mono">{lastCanvasCommand || `tool=${currentTool.label}; layer=${f411BimMethodology.activeLayer}; selection=${selectedInspectorName}`}</span>
                </div>
              </>
            )}

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
                data-testid="f387-renderer-base-v2"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f387RendererBaseV2.guardrails.join(' ')}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f387RendererBaseV2.status === 'renderer-base-v2-active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F387 Render v2
                </span>
                <span data-testid="f387-renderer-helper-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f387RendererBaseV2.activeHelpers.length} helpers
                </span>
                <span data-testid="f387-renderer-heatmap-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-rose-50 text-rose-700 border-rose-100">
                  heat {f387RendererBaseV2.heatmapPointCount}
                </span>
                <span data-testid="f387-renderer-sample-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-amber-50 text-amber-700 border-amber-100">
                  muestras {f387RendererBaseV2.sampleLineCount}
                </span>
                {f387RendererBaseV2.dynamicHelpers.map((helper) => (
                  <span
                    key={helper}
                    data-testid={`f387-helper-${helper}`}
                    className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100"
                    title="Helper dinamico activo; no modifica eventos, grips ni seleccion"
                  >
                    {helper.replace('drawCanvas', '').replace('Layer', '')}
                  </span>
                ))}
                <span className="text-[7px] text-slate-400 truncate">
                  eventos/grips intactos
                </span>
              </div>
              <div
                data-testid="f436-f438-renderer-v2-bridge-row"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f436ToF438RendererV2Bridge.acceptanceGates.join(' ')}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f436ToF438RendererV2Bridge.status === 'renderer-v2-bridge-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-violet-50 text-violet-700 border border-violet-100'
                }`}>
                  F436-F438
                </span>
                <span data-testid="f436-baseline-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f436ToF438RendererV2Bridge.visualBaselines.length} baselines
                </span>
                <span data-testid="f437-link-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f436ToF438RendererV2Bridge.pdfEvidenceLinks.length} links
                </span>
                <span data-testid="f438-core-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f436ToF438RendererV2Bridge.geometryCoreEntities.length} core
                </span>
                <span className="text-[7px] text-slate-400 truncate">
                  renderer bajo flag; eventos off
                </span>
              </div>
              <div
                data-testid="f439-f441-renderer-geometry-core-row"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f439ToF441RendererGeometryCore.releaseDecision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f439ToF441RendererGeometryCore.status === 'geometry-core-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                }`}>
                  F439-F441
                </span>
                <span data-testid="f439-entity-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f439ToF441RendererGeometryCore.normalizedEntities.length} entities
                </span>
                <span data-testid="f440-overlay-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f439ToF441RendererGeometryCore.overlayPlans.length} overlays
                </span>
                <span data-testid="f441-preflight-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f439ToF441RendererGeometryCore.preflight.filter((item) => item.pass).length}/{f439ToF441RendererGeometryCore.preflight.length} preflight
                </span>
                <span className="text-[7px] text-slate-400 truncate">
                  geometry core observable; eventos intactos
                </span>
              </div>
              <div
                data-testid="f442-f445-renderer-v2-runtime-row"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f442ToF445RendererV2Runtime.releaseDecision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f442ToF445RendererV2Runtime.status === 'renderer-v2-runtime-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : f442ToF445RendererV2Runtime.status === 'renderer-v2-runtime-preview'
                      ? 'bg-sky-50 text-sky-700 border border-sky-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F442-F445
                </span>
                <span data-testid="f442-instruction-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f442ToF445RendererV2Runtime.instructions.length} instr
                </span>
                <span data-testid="f443-pass-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f442ToF445RendererV2Runtime.passes.length} passes
                </span>
                <span data-testid="f444-gate-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f442ToF445RendererV2Runtime.gates.filter((gate) => gate.pass).length}/{f442ToF445RendererV2Runtime.gates.length} gates
                </span>
                <span className="text-[7px] text-slate-400 truncate">
                  overlay v2 sin eventos
                </span>
              </div>
              <div
                data-testid="f446-f448-canvas-strong-qa-row"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f446ToF448CanvasStrongQa.releaseDecision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f446ToF448CanvasStrongQa.status === 'canvas-strong-qa-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : f446ToF448CanvasStrongQa.status === 'canvas-strong-qa-review'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  F446-F448
                </span>
                <span data-testid="f446-surface-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f446ToF448CanvasStrongQa.surfaceChecks.filter((check) => check.status === 'ready').length}/{f446ToF448CanvasStrongQa.surfaceChecks.length} surfaces
                </span>
                <span data-testid="f447-interaction-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f446ToF448CanvasStrongQa.interactionChecks.filter((check) => check.status === 'ready').length}/{f446ToF448CanvasStrongQa.interactionChecks.length} actions
                </span>
                <span data-testid="f448-regression-pass-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f446ToF448CanvasStrongQa.regressionGates.filter((gate) => gate.pass).length}/{f446ToF448CanvasStrongQa.regressionGates.length} gates
                </span>
                <span className="text-[7px] text-slate-400 truncate">
                  QA fuerte canvas
                </span>
              </div>
              <div
                data-testid="f449-f453-bim-memory-visual-row"
                className="px-2.5 py-1 border-b border-slate-100 flex items-center gap-1.5 overflow-hidden"
                title={f449ToF453BimMemoryVisual.releaseDecision}
              >
                <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
                  f449ToF453BimMemoryVisual.status === 'bim-memory-visual-ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  F449-F453
                </span>
                <span data-testid="f449-trace-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f449ToF453BimMemoryVisual.traceBindings.filter((binding) => binding.status === 'ready').length}/{f449ToF453BimMemoryVisual.traceBindings.length} traces
                </span>
                <span data-testid="f450-citation-ready-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f449ToF453BimMemoryVisual.citationBindings.filter((binding) => binding.status === 'ready').length}/{f449ToF453BimMemoryVisual.citationBindings.length} citas
                </span>
                <span data-testid="f451-visual-adaptation-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f449ToF453BimMemoryVisual.visualAdaptations.length} adaptaciones
                </span>
                <span data-testid="f452-panel-count" className="text-[7px] rounded border px-1 py-0.5 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-100">
                  {f449ToF453BimMemoryVisual.graphicPanels.length} paneles
                </span>
                <span className="text-[7px] text-slate-400 truncate">
                  BIM grafico + Memoria IA
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
