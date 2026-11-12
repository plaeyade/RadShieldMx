/**
 * RadShield-MX Toolbar — Estilo Mosaic Atomics
 * Barra superior limpia, minimalista, con acento naranja coral
 */
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
  Play, Download, FileText, Microscope, FolderOpen, Box, Zap, Database, Globe, Cloud, FileDown, ArrowUpDown, Upload, TrendingDown, Atom, CalendarDays, BarChart3, Wind, ClipboardList, Gauge, Undo, Redo, Activity, Moon, Sun, Shield, DollarSign, ClipboardCheck, BookOpen, Library, Brain, GitCompareArrows, Bell, Code, Hexagon, FlaskConical, Crosshair, Calculator, Layers, FileCheck, Wand2, Cpu, Scan, GitBranch, Ruler, ChevronDown, Settings, ShieldCheck, PinOff, Keyboard, Search, FileBarChart, Star, Clock, Palette, Radio, Users, Video, Factory, ScanLine, FileBox, HelpCircle, Compass, Scale, Stethoscope, Save, Printer, Plus, Siren, PenTool, MapPin, Building2, Languages, Grid3X3, Pill, Target, Contrast, Radiation, Award, Info, LineChart, Bug, FileSearch, SearchCode, Timer, MemoryStick, Bot, Share2, Shapes, MessageSquare, RefreshCw, LayoutTemplate, Trash2, FilePlus, User, LogIn, LogOut, ScanEye, Sparkles,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { F92_REAL_WORKFLOW } from '@/lib/f92RealWorkflow';
import { F113_MODALITY_PROFILES, type F113ModalityProfileId } from '@/lib/f113ModalityProfiles';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

/* ─── mini icon component ─── */
function MiniIcon({ icon: Icon, color }: { icon: ComponentType<{className?: string}>, color: string }) {
  return (
    <span className={`w-4 h-4 rounded-[3px] ${color} flex items-center justify-center shrink-0`}>
      <Icon className="w-2.5 h-2.5 text-white" />
    </span>
  );
}

/* ─── smart menu item ─── */
function SmartItem({ icon: Icon, iconColor, label, onClick, shortcut, desc, testId }: {
  icon: ComponentType<{className?: string}>;
  iconColor: string; label: string | ReactNode;
  onClick?: () => void; shortcut?: string; desc?: string; testId?: string;
}) {
  return (
    <DropdownMenuItem
      data-testid={testId}
      onClick={onClick}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#fff7ed] cursor-pointer transition-colors group text-[11px] text-slate-700 font-medium focus:bg-[#fff7ed] focus:text-[#f97316]"
    >
      <MiniIcon icon={Icon} color={iconColor} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="group-hover:text-[#f97316] transition-colors">{label}</span>
          {shortcut && <kbd className="text-[9px] bg-slate-100 text-slate-400 px-1 rounded border border-slate-200 ml-2">{shortcut}</kbd>}
        </div>
        {desc && <p className="text-[9px] text-slate-400 truncate leading-tight">{desc}</p>}
      </div>
    </DropdownMenuItem>
  );
}

function SectionLabel({ label, color }: { label: string | ReactNode, color: string }) {
  return <div className={`px-2.5 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider ${color}`}>{label}</div>;
}

interface ToolbarProps {
  [key: string]: any;
  /* 7 functional menus */
  onNewProject: () => void; onOpenProject: () => void; onSaveProject: () => void; onSaveAs: () => void;
  onExport: () => void; onPDF: () => void; onShare: () => void; onCNSNS: () => void;
  onImportImage: () => void; onBatchImport: () => void; onDXFViewer: () => void; onSTEPImporter: () => void;
  onToggleTheme: () => void; isDarkMode: boolean;
  onUndo: () => void; onRedo: () => void;
  onTechSpecs: () => void; onAuditTrail: () => void; onLogFileAnalysis: () => void;
  onCalculate: () => void; onShieldingCalculator: () => void; onCompareScenarios: () => void; onTornadoSensitivity: () => void;
  onEquipmentShieldingWizard: () => void; onQuick: () => void; onMazeCalculator: () => void;
  onFloorCeiling: () => void; onShieldingOptimizer: () => void; onCostOptimizer: () => void;
  onCostEstimator: () => void; onUncertainty: () => void; onGUMUncertainty: () => void;
  onUAQ: () => void; onMemoriaAI: () => void;
  on3D: () => void; on3DModels: () => void; onMedicalFloorPlan3D: () => void; onPointCloud: () => void;
  onAutoBarrier: () => void;
  onRealTime3D: () => void; onBIMRAD: () => void;
  onLayoutBunker: () => void; onBIMConnector: () => void;
  onShapesReconstruction: () => void;
  onMonteCarlo: () => void; onMonteCarloSim: () => void;
  onMC: () => void; onMCCloud: () => void; onMultiSource: () => void;
  onNativeMC: () => void; onNeutronShielding: () => void;
  onElectronTransport: () => void; onVoxelPhantom: () => void;
  onMCNPCyclotron: () => void; onDoseMap: () => void; onGATEPET: () => void;
  onMaterialProps: () => void; onCyclotronSim: () => void;
  onNuclearMedicine: () => void; onGMPCertification: () => void; onAAPMTG108PET: () => void; onIPEM109: () => void; onChiltonSkyshine: () => void; onTherapyShielding: () => void; onDecayChains: () => void; onBatemanDecay: () => void;
  onGammaKnife: () => void; onBraquiCo60: () => void;
  onCBCTIGRT: () => void; onShieldingEquipos: () => void;
  onInternationalRegulations: () => void; onRegulatoryComparison: () => void;
  onComplianceCertification: () => void; onRegulatoryAlerts: () => void;
  onCNSNSDashboard: () => void; onCNSNSChecklist: () => void; onCNSNSReport: () => void;
  onNCRP151Detail: () => void; onNCRPValidation: () => void; onEPAGuidance: () => void; onShleien: () => void;
  onICRU57: () => void; onICRU96: () => void; onBibliografia: () => void;
  onDashboard: () => void; onCostDashboard: () => void; onCNSNSReportChecklist: () => void;
  onEvidencePack?: () => void;
  onReferenceLibrary?: () => void;
  onAIShielding: () => void; onPredictiveOptimizer: () => void; onAutoFillEquipo: () => void;
  onVideoTutorial: () => void; onCloudSync: () => void; onCollaborationHub: () => void;
  onAbout: () => void; onGlossary: () => void; onExternalSoftware: () => void;
  onIndustrialRadiation: () => void; onPythonTools: () => void;
  onAnimatedDoseMaps: () => void; onVentilation: () => void;
  onEquipmentLibrary: () => void; onEquipmentManager: () => void;
  onPACSReal: () => void; onElectronApplicator: () => void;
  onOnboardingTour: () => void; onManual: () => void;
  /** Fase 10: asistente «Guíame» (reanuda donde se quedó) y reinicio desde el paso 1. */
  onGuiame?: () => void; onReiniciarGuia?: () => void; guiaEnCurso?: boolean;
  onRadiationLegends: () => void;
  onUndoRedoHistory: () => void; onCommandPalette: () => void;
  onSmartSearchDICOM: () => void;
  onKeyboardShortcuts: () => void;
  onToggleSnap: () => void;
  onProjects: () => void;
  onCompareMode: () => void;
  onNistLibrary: () => void;
  onNeutronConfig: () => void;
  onBraquiHDR: () => void;
  onMemoriaAnalitica: () => void;
  onCNSNSCompliance: () => void;
  onCycloneKIUBE: () => void;
  onLabyrinthCalculator: () => void;
  onQuickShielding: () => void;
  onFloorCeilingCalculator: () => void;
  onShieldingOptimizerAdvanced: () => void;
  onTechSpecsAdv: () => void;
  onCategoryTools: (cat: string) => void;
  onEmergency: () => void;
  onBarrierEditor?: () => void;
  onAirKermaOverlay?: () => void;
  onMosaicProjectManager?: () => void;
  onControlPoints?: () => void;
  // v39: PHITS, CADMesh, JENDL-5
  onPHITSGenerator?: () => void;
  onDCHAINCalc?: () => void;
  onCADToMC?: () => void;
  onJENDL5Viewer?: () => void;
  // v40: Nuevas funcionalidades
  onVersionHistory?: () => void;
  onDICOMRTSTRUCT?: () => void;
  onCNSNSDigital?: () => void;
  // v41: GitHub-inspired integrations
  onGammaIndex?: () => void;
  onNuclearDoseGrid?: () => void;
  onMonteCarloEngine?: () => void;
  onDVHAnalyzer?: () => void;
  // v41b: FLUKA.CERN + PENELOPE2023 + Therapy Dosimetry + Shielding Verification
  onFLUKA?: () => void;
  onPENELOPE?: () => void;
  onShieldingVerification?: () => void;
  // v42: McGinley
  onLaminatedBarrier?: () => void;
  onPerformanceRecommendations?: () => void;
  onPerformanceDashboard?: () => void;
  onCADGeometryConverter?: () => void;
  onDesignAgent?: () => void;
  // v43: Attila4MC
  onAttila4MC?: () => void;
  // v44: Attila4MC GUI features
  onMCNPDeck?: () => void;
  onCADMapper?: () => void;
  onSolutionField3D?: () => void;
  // v45: WASM + Sensitivity Analysis
  onSensitivityAnalysis?: () => void;
  // v46: Recommendations A-E
  onSkyshine?: () => void;
  onAnnualDose?: () => void;
  onCrossValidation?: () => void;
  onObliqueIncidence?: () => void;
  onMultiEnergySpectra?: () => void;
  onAdaptiveSampling?: () => void;
  onSelfShielding?: () => void;
  onTransmissionCurve?: () => void;
  onNeutronMaze?: () => void;
  // v47: St-Germain + high contrast
  onStGermain?: () => void;
  highContrast?: boolean;
  onToggleHighContrast?: () => void;
  // v49: All remaining audit recommendations
  onAlbedo?: () => void;
  onConcreteActivation?: () => void;
  onCertification?: () => void;
  onCommunityTemplates?: () => void;
  onAuditLog?: () => void;
  onAnalytics?: () => void;
  // v64: Canvas enhancements
  onToggleLayers?: () => void;
  onToggleShapeLibrary?: () => void;
  onToggleFreehand?: () => void;
  onToggleStickyNotes?: () => void;
  // v79: Update Center
  onUpdate?: () => void;
  // v80: Smart Rooms
  onToggleRoomTemplates?: () => void;
  // v83: Canvas clear + new map
  onClearCanvas?: () => void;
  onNewMap?: () => void;
  // v85: SourceSelector
  onSourceTool?: () => void;
  // v92: Auth
  user?: { name?: string | null; unionId?: string } | null;
  // v95: Floor plan features
  onFloorPlanFeatures?: () => void;
  onLogin?: () => void;
  onLogout?: () => void;
  // v96: Transport + OpenCV + Pan
  onTransport?: () => void;
  onOpenCVDetect?: () => void;
  onPanMode?: () => void;
  isPanMode?: boolean;
}

type ToolbarRuntimeProps = Partial<ToolbarProps> & Record<string, unknown>;

type F112FavoriteId = 'memoria' | 'evidence' | 'validate' | 'heatmap';

const F112_FAVORITES_KEY = 'radshield:f112:persistent-favorites';
const F112_DEFAULT_FAVORITES: F112FavoriteId[] = ['memoria', 'evidence', 'validate', 'heatmap'];
const F113_PROFILE_KEY = 'radshield:f113:active-modality-profile';
const F113_PROFILE_COLORS: Record<F113ModalityProfileId, string> = {
  dx: 'bg-[#f97316]',
  tx: 'bg-[#2563eb]',
  nm: 'bg-[#7c3aed]',
  cy: 'bg-[#059669]',
};
const F113_PROFILE_CHIPS: Record<F113ModalityProfileId, string> = {
  dx: 'NCRP 147 / RX-CT',
  tx: 'NCRP 151 / LINAC',
  nm: 'TG-108 / PET-SPECT',
  cy: 'Neutrones / Activacion',
};

export default function Toolbar(props: ToolbarRuntimeProps) {
  const {
    onNewProject, onOpenProject, onSaveProject, onSaveAs,
    floorPlan, barrierResults, heatmapEnabled,
    onExport, onPDF, onShare, onCNSNS, onImportImage, onBatchImport, onDXFViewer, onSTEPImporter,
    onToggleTheme, isDarkMode, onUndo, onRedo,
    onTechSpecs, onAuditTrail, onLogFileAnalysis,
    onCalculate, onShieldingCalculator, onCompareScenarios, onTornadoSensitivity, onEquipmentShieldingWizard, onQuick, onMazeCalculator,
    onFloorCeiling, onShieldingOptimizer, onCostOptimizer, onCostEstimator,
    onUncertainty, onGUMUncertainty, onUAQ, onMemoriaAI,
    on3D, on3DModels, onMedicalFloorPlan3D, onPointCloud, onAutoBarrier,
    onRealTime3D, onBIMRAD, onLayoutBunker, onBIMConnector, onShapesReconstruction,
    onMonteCarlo, onMonteCarloSim, onMC, onMCCloud, onMultiSource,
    onNativeMC, onNeutronShielding, onElectronTransport, onVoxelPhantom,
    onMCNPCyclotron, onDoseMap, onGATEPET, onMaterialProps, onCyclotronSim,
    onNuclearMedicine, onGMPCertification, onAAPMTG108PET, onIPEM109, onChiltonSkyshine, onTherapyShielding, onDecayChains, onBatemanDecay, onGammaKnife, onBraquiCo60,
    onCBCTIGRT, onShieldingEquipos,
    onInternationalRegulations, onRegulatoryComparison, onComplianceCertification,
    onRegulatoryAlerts, onCNSNSDashboard, onCNSNSChecklist, onCNSNSReport,
    onNCRP151Detail, onNCRPValidation, onEPAGuidance, onShleien, onICRU57, onICRU96, onBibliografia,
    onDashboard, onCostDashboard, onCNSNSReportChecklist,
    onEvidencePack,
    onReferenceLibrary,
    onAIShielding, onPredictiveOptimizer, onAutoFillEquipo, onVideoTutorial,
    onCloudSync, onCollaborationHub, onExternalSoftware,
    onIndustrialRadiation, onPythonTools, onAnimatedDoseMaps, onVentilation,
    onEquipmentLibrary, onEquipmentManager,
    onPACSReal, onElectronApplicator,
    onOnboardingTour, onManual, onRadiationLegends, onAbout, onGlossary,
    onGuiame, onReiniciarGuia, guiaEnCurso,
    onUndoRedoHistory, onCommandPalette, onSmartSearchDICOM,
    onKeyboardShortcuts, onToggleSnap, onProjects, onCompareMode,
    onNistLibrary, onNeutronConfig, onBraquiHDR, onMemoriaAnalitica,
    onCNSNSCompliance, onCycloneKIUBE,
    onVoxelPhantom: _vpDup,
    onMCNPCyclotron: _mcnpDup,
    onShapesReconstruction: _shapesDup,
    onEquipmentManager: _equipDup,
    onCategoryTools, onEmergency,
    onBarrierEditor, onAirKermaOverlay, onMosaicProjectManager, onControlPoints,
    onPHITSGenerator, onDCHAINCalc, onCADToMC, onJENDL5Viewer,
    onVersionHistory, onDICOMRTSTRUCT, onCNSNSDigital,
    // v41
    onGammaIndex, onNuclearDoseGrid, onMonteCarloEngine, onDVHAnalyzer,
    // v41b
    onFLUKA, onPENELOPE, onShieldingVerification,
    // v42
    onLaminatedBarrier,
    onPerformanceRecommendations,
    onPerformanceDashboard,
    onCADGeometryConverter,
    onDesignAgent,
    // v43
    onAttila4MC,
    // v44
    onMCNPDeck,
    onCADMapper,
    onSolutionField3D,
    // v45
    onSensitivityAnalysis,
    // v46
    onSkyshine,
    onAnnualDose,
    onCrossValidation,
    onObliqueIncidence,
    onMultiEnergySpectra,
    onAdaptiveSampling,
    onSelfShielding,
    onTransmissionCurve,
    onNeutronMaze,
    // v47
    onStGermain,
    highContrast: hcMode,
    onToggleHighContrast,
    // v49
    onAlbedo,
    onConcreteActivation,
    onCertification,
    onCommunityTemplates,
    onAuditLog,
    onAnalytics,
    // v64: Canvas enhancements
    onToggleLayers,
    onToggleShapeLibrary,
    onToggleFreehand,
    onToggleStickyNotes,
    // v79: Update Center
    onUpdate,
    onFloorPlanFeatures,
    // v96: Transport + OpenCV + Pan
    onTransport,
    onOpenCVDetect,
    onPanMode,
    isPanMode,
    // v80: Smart Rooms
    onToggleRoomTemplates,
    // v83: Canvas clear + new map
    onClearCanvas,
    onNewMap,
    // v85: SourceSelector
    onSourceTool,
    // v92: Auth
    user,
    onLogin,
    onLogout,
  } = props;
  const { lang, setLang, t } = useI18n();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const openDialog = useAppStore((s) => s.open);
  const [f112FavoriteIds, setF112FavoriteIds] = useState<F112FavoriteId[]>(() => {
    try {
      const raw = window.localStorage.getItem(F112_FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((id): id is F112FavoriteId => F112_DEFAULT_FAVORITES.includes(id));
        return valid.length > 0 ? valid : F112_DEFAULT_FAVORITES;
      }
    } catch {
      // Keep defaults when browser storage is unavailable.
    }
    return F112_DEFAULT_FAVORITES;
  });
  const [f113ProfileId, setF113ProfileId] = useState<F113ModalityProfileId>(() => {
    try {
      const raw = window.localStorage.getItem(F113_PROFILE_KEY);
      if (raw && F113_MODALITY_PROFILES.some((profile) => profile.id === raw)) {
        return raw as F113ModalityProfileId;
      }
    } catch {
      // Profile persistence should not block rendering.
    }
    return 'dx';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(F112_FAVORITES_KEY, JSON.stringify(f112FavoriteIds));
    } catch {
      // Persistence is an enhancement and should not block rendering.
    }
  }, [f112FavoriteIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(F113_PROFILE_KEY, f113ProfileId);
    } catch {
      // Persistence is additive only.
    }
  }, [f113ProfileId]);

  const f113ActiveProfile = useMemo(
    () => F113_MODALITY_PROFILES.find((profile) => profile.id === f113ProfileId) ?? F113_MODALITY_PROFILES[0],
    [f113ProfileId],
  );

  const activateF113Profile = (profileId: F113ModalityProfileId) => {
    const profile = F113_MODALITY_PROFILES.find((item) => item.id === profileId);
    if (!profile) return;
    setF113ProfileId(profileId);
    if (typeof onCategoryTools === 'function') {
      onCategoryTools(profile.category);
    }
  };

  const f112Plan = floorPlan as {
    barriers?: unknown[];
    sources?: unknown[];
    regions?: unknown[];
    occupiedRegions?: unknown[];
    imageUrl?: string;
  } | undefined;
  const f112BarrierCount = f112Plan?.barriers?.length ?? 0;
  const f112SourceCount = f112Plan?.sources?.length ?? 0;
  const f112ZoneCount = f112Plan?.regions?.length ?? f112Plan?.occupiedRegions?.length ?? 0;
  const f112ResultCount = Array.isArray(barrierResults) ? barrierResults.length : 0;
  const f112LayoutReady = Boolean(f112Plan?.imageUrl) || f112BarrierCount > 0;
  const invoke = (handler?: () => void, fallbackDialog?: string, label = 'Accion') => () => {
    try {
      if (typeof handler === 'function') {
        handler();
      } else if (fallbackDialog) {
        openDialog(fallbackDialog as any);
      } else {
        throw new Error('accion no configurada');
      }
      toast.success(`${label}: accion enviada`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      toast.error(`${label}: ${message}`);
    }
  };
  const f112Favorites = useMemo(() => [
    { id: 'memoria' as const, label: 'Memoria', icon: Star, className: 'text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-100', onClick: invoke(onMemoriaAI, 'memoriaAI', 'Memoria IA'), tip: 'Memoria IA' },
    { id: 'evidence' as const, label: 'Evidencia', icon: FileSearch, className: 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-100', onClick: invoke(onEvidencePack, 'evidencePack', 'Evidence Pack'), tip: 'Evidence Pack' },
    { id: 'validate' as const, label: 'Validar', icon: ShieldCheck, className: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100', onClick: invoke(onNCRPValidation, 'ncrpValidation', 'Validacion NCRP'), tip: 'NCRP Validation' },
    { id: 'heatmap' as const, label: 'Heatmap', icon: Crosshair, className: 'text-red-700 bg-red-50 hover:bg-red-100 border-red-100', onClick: invoke(onDoseMap, 'doseMap', 'Heatmap'), tip: 'Mapa de dosis/isodosis' },
  ], [onDoseMap, onEvidencePack, onMemoriaAI, onNCRPValidation]);

  const toggleF112Favorite = (id: F112FavoriteId) => {
    setF112FavoriteIds((current) => {
      if (current.includes(id)) {
        const next = current.filter((item) => item !== id);
        return next.length > 0 ? next : current;
      }
      return [...current, id];
    });
  };

  const toggleLang = () => setLang(lang === 'es' ? 'en' : 'es');

  const c = {
    file: 'bg-slate-500', design: 'bg-amber-500', calc: 'bg-emerald-500',
    physics: 'bg-cyan-500', sim: 'bg-violet-500', nucmed: 'bg-rose-500',
    regul: 'bg-indigo-500', report: 'bg-orange-500', tool: 'bg-[#f97316]', help: 'bg-sky-500',
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col">
        {/* ═══ MAIN HEADER — Estilo Mosaic Atomics ═══ */}
        <div className="h-11 bg-white border-b border-slate-200 flex items-center px-3 gap-2 shrink-0 shadow-sm">

          {/* Logo */}
          <div className="toolbar-brand flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-[#f97316] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <span className="text-[13px] font-bold text-slate-800 tracking-tight">RadShield-MX</span>
              <span className="text-[8px] text-slate-400 ml-1 font-mono">v127</span>
            </div>
          </div>

          {/* Fase 10 (arranque en Pages): «Guíame» junto al logo. Al final de la barra quedaba fuera de la ventana a
              1280–1366 px, porque los menús visibles desde xl empujaban el grupo derecho más allá del borde. */}
          {onGuiame && (
            <Button data-testid="f10-toolbar-guiame" aria-label="Guíame: asistente paso a paso" variant="ghost" size="sm" className="h-8 px-2 gap-1 shrink-0 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:text-sky-800 hover:bg-sky-100 border border-sky-100" onClick={onGuiame}>
              <Compass className="w-4 h-4" /> Guíame
            </Button>
          )}

          <Separator orientation="vertical" className="h-5 bg-slate-200" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="f295-primary-file-dropdown"
                variant="ghost"
                size="sm"
                className="flex shrink-0 text-[10px] h-7 px-2 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 gap-1 font-semibold border border-slate-100"
              >
                <MiniIcon icon={FolderOpen} color={c.file} />
                <span className="hidden sm:inline">{t('menu.file')}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="f295-primary-file-menu" align="start" side="bottom" sideOffset={5} collisionPadding={12} className="w-64 max-w-[calc(100vw-24px)] bg-white border border-slate-200 shadow-lg rounded-xl p-1.5">
              <SectionLabel label={t('sidebar.project')} color="text-slate-400" />
              <SmartItem testId="f404-file-new-project" icon={Plus} iconColor={c.file} label={t('file.new')} onClick={invoke(onNewProject)} desc="Crear proyecto desde cero" />
              <SmartItem testId="f404-file-open-projects" icon={FolderOpen} iconColor={c.file} label={t('file.open')} onClick={invoke(onProjects, 'projects')} desc="Abrir o administrar proyectos" />
              <SmartItem testId="f404-file-save-project" icon={Save} iconColor={c.file} label={t('btn.save')} shortcut="Ctrl+S" onClick={invoke(onSaveProject)} />
              <DropdownMenuSeparator />
              <SectionLabel label={t('file.import')} color="text-slate-400" />
              <SmartItem testId="f404-file-import-csv" icon={Upload} iconColor={c.file} label={t('file.import.csv')} onClick={invoke(onBatchImport, 'batchImport')} desc="Importacion batch de barreras/datos" />
              <SmartItem testId="f404-file-import-dxf" icon={Layers} iconColor={c.file} label={t('file.import.dxf')} onClick={invoke(onDXFViewer, 'dxfViewer')} desc="DXF o conversion DWG externa" />
              <SmartItem testId="f404-file-import-step" icon={FileBox} iconColor={c.file} label={t('file.import.step')} onClick={invoke(onSTEPImporter, 'stepImporter')} desc="STEP/IGES para geometria 3D" />
              <DropdownMenuSeparator />
              <SectionLabel label={t('file.export')} color="text-slate-400" />
              <SmartItem testId="f404-file-export-csv" icon={Download} iconColor={c.file} label={t('file.export.csv')} onClick={invoke(onExport, 'export')} />
              <SmartItem testId="f404-file-export-pdf" icon={FileDown} iconColor={c.file} label="Exportar PDF" onClick={invoke(onPDF, 'pdfReport')} desc="Memoria analitica PDF" />
              <SmartItem testId="f404-file-share-results" icon={Share2} iconColor={c.file} label="Compartir resultados" onClick={invoke(onShare)} desc="Web Share API" />
              <SmartItem testId="f404-file-export-cnsns" icon={Printer} iconColor={c.file} label="Exportar Reporte CNSNS" onClick={invoke(onCNSNS, 'cnsns')} desc="Salida regulatoria" />
              <DropdownMenuSeparator />
              <SmartItem testId="f404-file-tech-specs" icon={Settings} iconColor={c.file} label={t('file.techSpecs')} onClick={invoke(onTechSpecs, 'techSpecs')} desc="Especificaciones tecnicas" />
              <SmartItem testId="f404-file-audit-trail" icon={Activity} iconColor={c.file} label={t('file.auditTrail')} onClick={invoke(onAuditTrail, 'auditTrail')} desc="Trazabilidad" />
              <SmartItem testId="f404-file-log-analysis" icon={FileBarChart} iconColor={c.file} label={t('file.logAnalysis')} onClick={invoke(onLogFileAnalysis, 'logFileAnalysis')} desc="Diagnostico de eventos" />
              <DropdownMenuSeparator />
              <SectionLabel label="Ayuda" color="text-slate-400" />
              {onGuiame && <SmartItem testId="f10-help-guiame" icon={Compass} iconColor="bg-sky-500" label={guiaEnCurso ? 'Guíame (reanudar)' : 'Guíame'} onClick={onGuiame} desc="Asistente paso a paso, con ejemplo PET/CT opcional" />}
              {onReiniciarGuia && <SmartItem testId="f10-help-guia-reiniciar" icon={RefreshCw} iconColor="bg-sky-500" label="Reiniciar la guía" onClick={onReiniciarGuia} desc="Volver al paso 1 del asistente" />}
              <SmartItem testId="f404-file-glossary" icon={BookOpen} iconColor={c.file} label="Glosario" onClick={invoke(onGlossary, 'glossary')} desc="Terminologia de blindaje" />
              <SmartItem testId="f404-file-about" icon={Info} iconColor={c.file} label="Acerca de" onClick={invoke(onAbout, 'about')} desc="Version y creditos" />
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            data-testid="f92-real-workflow-nav"
            className="hidden"
            aria-label="Flujo real F92 Diseno Equipos Blindaje Verificacion Reportes Evidencia Integraciones"
          >
            {F92_REAL_WORKFLOW.map((stage) => (
              <Tooltip key={stage.id}>
                <TooltipTrigger asChild>
                  <span
                    data-testid={`f92-flow-${stage.id}`}
                    className="text-[9px] font-semibold text-slate-600 rounded px-1.5 py-0.5 hover:bg-white hover:text-[#f97316] cursor-default"
                  >
                    {stage.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-[10px] font-semibold">{stage.label}</p>
                  <p className="text-[9px] text-slate-500">{stage.goal}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="f96-migrated-design-dropdown"
                variant="ghost"
                size="sm"
                className="hidden xl:flex text-[10px] h-7 px-2 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 gap-1 font-semibold border border-amber-100"
              >
                <MiniIcon icon={Ruler} color={c.design} />
                Diseno
                <ChevronDown className="w-3 h-3 text-amber-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="f96-migrated-design-menu" className="w-60 bg-white border border-amber-100 shadow-lg rounded-xl p-1.5">
              <SectionLabel label="F96 Diseno migrado" color="text-amber-600" />
              <SmartItem icon={Box} iconColor={c.design} label="3D Bunker Viewer" onClick={on3D} desc="Three-dimensional visualization" />
              <SmartItem icon={ScanEye} iconColor={c.design} label="Floor Plan Features" onClick={onFloorPlanFeatures} desc="Plano, escala, zonas y deteccion OpenCV" />
              <SmartItem icon={Stethoscope} iconColor="bg-teal-600" label="Medical 3D Floor Plan" onClick={onMedicalFloorPlan3D} desc="Inspeccion clinica 3D del plano" />
              <SmartItem icon={Layers} iconColor={c.design} label="DXF Viewer" onClick={onDXFViewer} desc="AutoCAD/Revit floor plan" />
              <SmartItem icon={ScanLine} iconColor={c.design} label="Point Cloud (LiDAR)" onClick={onPointCloud} />
              <SmartItem icon={Scan} iconColor={c.design} label="Auto-Barrier Detection" onClick={onAutoBarrier} desc="Deteccion automatica de barreras" />
              <SmartItem icon={Box} iconColor="bg-emerald-500" label="Shapes Reconstruction (v33)" onClick={onShapesReconstruction} desc="3D from RTSTRUCT contours" />
              <DropdownMenuSeparator />
              <SmartItem icon={Box} iconColor="bg-violet-500" label="Real-Time 3D Exploration" onClick={onRealTime3D} desc="Recorrido y export 3D" />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="f97-migrated-equipment-dropdown"
                variant="ghost"
                size="sm"
                className="hidden xl:flex text-[10px] h-7 px-2 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 gap-1 font-semibold border border-rose-100"
              >
                <MiniIcon icon={Stethoscope} color={c.nucmed} />
                Equipos
                <ChevronDown className="w-3 h-3 text-rose-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="f97-migrated-equipment-menu" className="w-64 bg-white border border-rose-100 shadow-lg rounded-xl p-1.5">
              <SectionLabel label="F97 Equipos migrado" color="text-rose-600" />
              <SmartItem icon={Library} iconColor={c.nucmed} label="Equipment Library" onClick={onEquipmentLibrary} desc="Catalogo de equipos y fuentes clinicas" />
              <SmartItem icon={Library} iconColor="bg-red-600" label="Source Library" onClick={() => openDialog('sourceLibrary')} desc="Geometrias y radionucleidos fuente" />
              <SmartItem icon={Brain} iconColor={c.nucmed} label={t('nucMed.gammaKnife')} onClick={onGammaKnife} />
              <SmartItem icon={Activity} iconColor={c.nucmed} label={t('nucMed.braqui')} onClick={onBraquiCo60} />
              <SmartItem icon={ScanLine} iconColor={c.nucmed} label={t('nucMed.cbct')} onClick={onCBCTIGRT} />
              <SmartItem icon={Radio} iconColor={c.nucmed} label={t('nucMed.medicine')} onClick={onNuclearMedicine} />
              <DropdownMenuSeparator />
              <SmartItem icon={Zap} iconColor="bg-emerald-600" label="Cyclone KIUBE" onClick={onCycloneKIUBE} desc="Ciclotron y radiofarmacia" />
              <SmartItem icon={Microscope} iconColor={c.tool} label={t('tools.equipmentManager')} onClick={onEquipmentManager} />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="f107-migrated-shielding-dropdown"
                variant="ghost"
                size="sm"
                className="hidden xl:flex text-[10px] h-7 px-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 gap-1 font-semibold border border-emerald-100"
              >
                <MiniIcon icon={ShieldCheck} color={c.calc} />
                Blindaje
                <ChevronDown className="w-3 h-3 text-emerald-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="f107-migrated-shielding-menu" className="w-64 bg-white border border-emerald-100 shadow-lg rounded-xl p-1.5">
              <SectionLabel label="F107 Blindaje migrado" color="text-emerald-600" />
              <SmartItem icon={Play} iconColor={c.calc} label={t('calc.calculate')} onClick={onCalculate} shortcut="F5" desc="Ejecutar calculo global de barreras" />
              <SmartItem icon={Calculator} iconColor={c.calc} label={t('calc.uaq')} onClick={onShieldingCalculator} desc="Memoria y calculadora UAQ/NCRP" />
              <SmartItem icon={Zap} iconColor={c.calc} label={t('calc.quick')} onClick={onQuick} shortcut="Ctrl+B" desc="Calculo rapido de barrera" />
              <SmartItem icon={ArrowUpDown} iconColor={c.calc} label={t('calc.floorCeiling')} onClick={onFloorCeiling} desc="Suelo, techo y niveles adyacentes" />
              <DropdownMenuSeparator />
              <SmartItem icon={Layers} iconColor="bg-emerald-600" label="Multi-layer / Laminated" onClick={onLaminatedBarrier} desc="Pb + concreto + acero" />
              <SmartItem icon={Atom} iconColor={c.physics} label={t('physics.neutron')} onClick={onNeutronShielding} desc="Neutrones y laberinto" />
              <SmartItem icon={Cloud} iconColor="bg-sky-500" label="Skyshine" onClick={onSkyshine} desc="Dispersión por techo y exteriores" />
              <SmartItem icon={TrendingDown} iconColor={c.calc} label="Optimize Materials" onClick={onCostOptimizer} desc="Costo, espesor, peso y espacio" />
              <DropdownMenuSeparator />
              <SmartItem icon={Activity} iconColor="bg-blue-600" label="AAPM TG 108 PET Shielding" onClick={onAAPMTG108PET} desc="PET/CT semanal y areas contiguas" />
              <SmartItem icon={Activity} iconColor="bg-indigo-600" label="IPEM 109 SPECT Shielding" onClick={onIPEM109} desc="SPECT/SPECT-CT room shielding" />
              <SmartItem icon={Pill} iconColor="bg-rose-600" label="Therapy Radionuclide Shielding" onClick={onTherapyShielding} desc="Y-90, Lu-177, Ac-225, I-131" />
              <SmartItem icon={Shield} iconColor={c.nucmed} label={t('nucMed.shielding')} onClick={onShieldingEquipos} desc="Blindaje por equipo/fuente" />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="f108-migrated-verification-dropdown"
                variant="ghost"
                size="sm"
                className="hidden xl:flex text-[10px] h-7 px-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 gap-1 font-semibold border border-indigo-100"
              >
                <MiniIcon icon={ShieldCheck} color={c.regul} />
                Verificacion
                <ChevronDown className="w-3 h-3 text-indigo-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="f108-migrated-verification-menu" className="w-64 bg-white border border-indigo-100 shadow-lg rounded-xl p-1.5">
              <SectionLabel label="F108 Verificacion migrada" color="text-indigo-600" />
              <SmartItem icon={ShieldCheck} iconColor="bg-emerald-600" label="NCRP Validation Suite" onClick={onNCRPValidation} desc="NCRP 147/151 tables" />
              <SmartItem icon={GitCompareArrows} iconColor="bg-indigo-500" label="NCRP 147 vs 151 Cross-Val" onClick={onCrossValidation} desc="Consistencia numerica" />
              <SmartItem icon={ShieldCheck} iconColor="bg-emerald-600" label="Shielding Verification" onClick={onShieldingVerification} desc="HVL/TVL y pruebas de blindaje" />
              <SmartItem icon={Activity} iconColor="bg-emerald-600" label="Sensitivity Analysis" onClick={onSensitivityAnalysis} desc="Tornado y variacion parametrica" />
              <SmartItem icon={BarChart3} iconColor={c.calc} label="Uncertainty / GUM" onClick={onGUMUncertainty} desc="Propagacion JCGM 100" />
              <DropdownMenuSeparator />
              <SmartItem icon={Crosshair} iconColor={c.physics} label={t('physics.doseMap')} onClick={onDoseMap} desc="Mapa visual de dosis e isodosis" />
              <SmartItem icon={Gauge} iconColor="bg-teal-500" label="Performance Dashboard" onClick={onPerformanceDashboard} desc="Benchmarks y regresiones" />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="f109-migrated-reports-dropdown"
                variant="ghost"
                size="sm"
                className="hidden xl:flex text-[10px] h-7 px-2 text-orange-700 bg-orange-50 hover:bg-orange-100 hover:text-orange-800 gap-1 font-semibold border border-orange-100"
              >
                <MiniIcon icon={BarChart3} color={c.report} />
                Reportes
                <ChevronDown className="w-3 h-3 text-orange-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="f109-migrated-reports-menu" className="w-64 bg-white border border-orange-100 shadow-lg rounded-xl p-1.5">
              <SectionLabel label="F109 Reportes migrados" color="text-orange-600" />
              <SmartItem icon={Brain} iconColor={c.tool} label="Memoria IA" onClick={onMemoriaAI} desc="Memoria analitica guiada por flujo" />
              <SmartItem icon={FileDown} iconColor={c.report} label="PDF analitico" onClick={onPDF} desc="Reporte tecnico exportable" />
              <SmartItem icon={Printer} iconColor={c.report} label="Reporte CNSNS" onClick={onCNSNS} desc="Salida regulatoria CNSNS" />
              <SmartItem icon={BarChart3} iconColor={c.report} label={t('reports.dashboard')} onClick={onDashboard} />
              <SmartItem icon={DollarSign} iconColor={c.report} label={t('reports.costEstimator')} onClick={onCostDashboard} />
              <SmartItem icon={ClipboardCheck} iconColor={c.report} label={t('reports.cnsnsChecklist')} onClick={onCNSNSReportChecklist} />
              <DropdownMenuSeparator />
              <SmartItem icon={CalendarDays} iconColor="bg-emerald-500" label="Annual Dose Report" onClick={onAnnualDose} desc="Acumulado anual ICRP/CNSNS" />
              <SmartItem icon={FileSearch} iconColor={c.report} label="Evidence Pack bridge" onClick={onEvidencePack} desc="Trazabilidad hacia evidencia documental" />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="f110-migrated-evidence-dropdown"
                variant="ghost"
                size="sm"
                className="hidden xl:flex text-[10px] h-7 px-2 text-violet-700 bg-violet-50 hover:bg-violet-100 hover:text-violet-800 gap-1 font-semibold border border-violet-100"
              >
                <MiniIcon icon={FileSearch} color="bg-violet-600" />
                Evidencia
                <ChevronDown className="w-3 h-3 text-violet-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="f110-migrated-evidence-menu" className="w-64 bg-white border border-violet-100 shadow-lg rounded-xl p-1.5">
              <SectionLabel label="F110 Evidencia migrada" color="text-violet-600" />
              <SmartItem icon={FileSearch} iconColor="bg-violet-600" label="Evidence Pack" onClick={onEvidencePack} desc="Citas, fuentes y snapshots verificables" />
              <SmartItem icon={Search} iconColor="bg-violet-500" label="RAG deep dive" onClick={onEvidencePack} desc="Revision documental guiada por evidencia" />
              <SmartItem icon={BookOpen} iconColor={c.regul} label="Reference Library" onClick={onReferenceLibrary} desc="NCRP, IAEA, EPA, ICRU y fuentes base" />
              <SmartItem icon={Library} iconColor={c.regul} label="Bibliografia" onClick={onBibliografia} desc="Referencias versionadas para memoria" />
              <DropdownMenuSeparator />
              <SmartItem icon={Activity} iconColor={c.file} label="Audit Trail" onClick={onAuditTrail} desc="Trazabilidad de proyecto y cambios" />
              <SmartItem icon={ShieldCheck} iconColor="bg-emerald-500" label="Audit Log" onClick={onAuditLog} desc="Registro de inspeccion regulatoria" />
              <SmartItem icon={FileBarChart} iconColor={c.file} label="Log analysis" onClick={onLogFileAnalysis} desc="Diagnostico de eventos y errores" />
              <SmartItem icon={Settings} iconColor={c.file} label="Technical specs" onClick={onTechSpecs} desc="Especificaciones tecnicas auditables" />
              <DropdownMenuSeparator />
              <SmartItem icon={Brain} iconColor={c.tool} label="AI source review" onClick={onAIShielding} desc="Revision asistida para memoria analitica" />
              <SmartItem icon={SearchCode} iconColor="bg-amber-500" label="Algorithm / code audit" onClick={onPerformanceDashboard} desc="Revision tecnica y calidad de calculo" />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="f116-migrated-integrations-dropdown"
                variant="ghost"
                size="sm"
                className="hidden xl:flex text-[10px] h-7 px-2 text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-800 gap-1 font-semibold border border-teal-100"
              >
                <MiniIcon icon={Gauge} color="bg-teal-500" />
                Integraciones
                <ChevronDown className="w-3 h-3 text-teal-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid="f116-migrated-integrations-menu" className="w-64 bg-white border border-teal-100 shadow-lg rounded-xl p-1.5">
              <SectionLabel label="F116 Integraciones y eficiencia" color="text-teal-600" />
              <SmartItem icon={Gauge} iconColor="bg-teal-500" label="Performance Dashboard" onClick={onPerformanceDashboard} desc="Benchmarks, regresiones y metricas" />
              <SmartItem icon={Timer} iconColor="bg-teal-500" label="Benchmarks Suite" onClick={onPerformanceDashboard} desc="Pruebas con umbrales de tiempo" />
              <SmartItem icon={LineChart} iconColor="bg-teal-500" label="Function Profiler" onClick={onPerformanceDashboard} desc="Hotspots, llamadas y flame graphs" />
              <SmartItem icon={MemoryStick} iconColor="bg-teal-500" label="CPU & Memory Profile" onClick={onPerformanceDashboard} desc="Heap, GC y slices CPU" />
              <DropdownMenuSeparator />
              <SectionLabel label="Auditoria tecnica" color="text-teal-600" />
              <SmartItem icon={SearchCode} iconColor="bg-amber-500" label="Technical Audit" onClick={onPerformanceDashboard} desc="Complejidad, dependencias y salud TS" />
              <SmartItem icon={Bug} iconColor="bg-red-500" label="Code Quality Audit" onClick={onPerformanceDashboard} desc="Antipatrones, seguridad y performance" />
              <SmartItem icon={FileSearch} iconColor="bg-blue-500" label="Algorithm Analyzer" onClick={onPerformanceDashboard} desc="Oportunidades de cache y complejidad" />
              <DropdownMenuSeparator />
              <SectionLabel label="CAD / MC / agentes" color="text-teal-600" />
              <SmartItem icon={Box} iconColor="bg-blue-500" label="CATIA-GDML & CAD to ROOT" onClick={onCADGeometryConverter} desc="Conversion geometrica para Monte Carlo" />
              <SmartItem icon={Bot} iconColor="bg-emerald-500" label="Shielding Design Agent" onClick={onDesignAgent} desc="Diseno autonomo con validacion" />
              <SmartItem icon={Zap} iconColor="bg-yellow-500" label="Performance Recommendations" onClick={onPerformanceRecommendations} desc="Recomendaciones de optimizacion" />
              <SmartItem icon={Cpu} iconColor="bg-emerald-500" label="WASM Optimizations" onClick={onPerformanceRecommendations} desc="Funciones matematicas intensivas" />
              <SmartItem icon={Activity} iconColor="bg-indigo-500" label="Continuous Tests" onClick={onNCRPValidation} desc="Regresion de calculos y QA" />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* F116/F295: legacy utility menu retained only for source-level rollback contracts. */}
          <div data-testid="f114-deduped-legacy-menu-zone" className="hidden">
            {[
              { label: t('menu.file'), icon: FolderOpen, color: c.file, items: (
                <>
                  <SectionLabel label={t('sidebar.project')} color="text-slate-400" />
                  <SmartItem icon={Plus} iconColor={c.file} label={t('file.new')} onClick={onNewProject} desc="Create project from scratch" />
                  <SmartItem icon={FolderOpen} iconColor={c.file} label={t('file.open')} onClick={onProjects} desc="Manage saved projects" />
                  <SmartItem icon={Save} iconColor={c.file} label={t('btn.save')} shortcut="Ctrl+S" onClick={onSaveProject} />
                  <DropdownMenuSeparator />
                  <SectionLabel label={t('file.import')} color="text-slate-400" />
                  <SmartItem icon={Upload} iconColor={c.file} label={t('file.import.csv')} onClick={onBatchImport} />
                  <SmartItem icon={Layers} iconColor={c.file} label={t('file.import.dxf')} onClick={onDXFViewer} desc="AutoCAD / Revit floor plan" />
                  <SmartItem icon={FileBox} iconColor={c.file} label={t('file.import.step')} onClick={onSTEPImporter} desc="Modo compatibilidad STEP/IGES" />
                  <DropdownMenuSeparator />
                  <SectionLabel label={t('file.export')} color="text-slate-400" />
                  <SmartItem icon={Download} iconColor={c.file} label={t('file.export.csv')} onClick={onExport} />
                  <SmartItem icon={FileDown} iconColor={c.file} label="Exportar PDF" onClick={onPDF} desc="Generar memoria analitica PDF" />
                  <SmartItem icon={Share2} iconColor={c.file} label="Compartir resultados" onClick={onShare} desc="Web Share API — enviar a apps nativas" />
                  <SmartItem icon={Printer} iconColor={c.file} label="Exportar Reporte CNSNS" onClick={onCNSNS} desc="Salida regulatoria con evidencia del proyecto" />
                  <DropdownMenuSeparator />
                  <SmartItem icon={Settings} iconColor={c.file} label={t('file.techSpecs')} onClick={onTechSpecs} desc="Especificaciones tecnicas auditables" />
                  <SmartItem icon={Activity} iconColor={c.file} label={t('file.auditTrail')} onClick={onAuditTrail} desc="Trazabilidad del proyecto y cambios" />
                  <SmartItem icon={FileBarChart} iconColor={c.file} label={t('file.logAnalysis')} onClick={onLogFileAnalysis} desc="Revision de logs y diagnostico" />
                  <DropdownMenuSeparator />
                  <SectionLabel label="Ayuda" color="text-slate-400" />
                  <SmartItem icon={BookOpen} iconColor={c.file} label="Glosario" onClick={onGlossary} desc="Terminologia de blindaje radiologico" />
                  <SmartItem icon={Info} iconColor={c.file} label="Acerca de" onClick={onAbout} desc="RadShield-MX v50.3 | C.E. Cardena et al." />
                </>
              )},
              { label: t('menu.design'), icon: Ruler, color: c.design, items: (
                <>
                  <SmartItem icon={Box} iconColor={c.design} label="3D Bunker Viewer" onClick={on3D} desc="Three-dimensional visualization" />
                  <SmartItem icon={Stethoscope} iconColor="bg-teal-600" label="Medical 3D Floor Plan" onClick={onMedicalFloorPlan3D} desc="Photoreal clinical room preview" />
                  <SmartItem icon={Layers} iconColor={c.design} label="DXF Viewer" onClick={onDXFViewer} desc="AutoCAD files" />
                  <SmartItem icon={ScanLine} iconColor={c.design} label="Point Cloud (LiDAR)" onClick={onPointCloud} />
                  <SmartItem icon={Scan} iconColor={c.design} label="Auto-Barrier Detection" onClick={onAutoBarrier} desc="Automatic barrier detection" />
                  <SmartItem icon={Box} iconColor="bg-emerald-500" label="Shapes Reconstruction (v33)" onClick={onShapesReconstruction} desc="3D from RTSTRUCT contours" />
                  <SmartItem icon={Box} iconColor="bg-violet-500" label="Real-Time 3D Exploration" onClick={onRealTime3D} desc="Preview + export glTF/FBX/USD" />
                </>
              )},
              { label: t('menu.calculate'), icon: Calculator, color: c.calc, items: (
                <>
                  <SectionLabel label="F107 blindaje migrado (fallback)" color="text-emerald-500" />
                  <SmartItem icon={Play} iconColor={c.calc} label={`${t('calc.calculate')} (fallback F107)`} onClick={onCalculate} shortcut="F5" desc="Run calculation for all barriers" />
                  <SmartItem icon={Wand2} iconColor={c.calc} label="Equipment Wizard (fallback F107)" onClick={onEquipmentShieldingWizard} />
                  <SmartItem icon={ArrowUpDown} iconColor={c.calc} label={`${t('calc.floorCeiling')} (fallback F107)`} onClick={onFloorCeiling} />
                  <SmartItem icon={TrendingDown} iconColor={c.calc} label="Optimize Materials (fallback F107)" onClick={onCostOptimizer} desc="Cost/benefit optimization" />
                  <SmartItem icon={DollarSign} iconColor={c.calc} label={t('calc.costs')} onClick={onCostEstimator} />
                  <SmartItem icon={BarChart3} iconColor={c.calc} label="Uncertainty (fallback F108)" onClick={onUncertainty} />
                  <SmartItem icon={BarChart3} iconColor={c.calc} label="GUM Uncertainty (fallback F108)" onClick={onGUMUncertainty} desc="JCGM 100 propagation" />
                  <SectionLabel label="Analysis Tools (v50)" color="text-emerald-500" />
                  <SmartItem icon={GitCompareArrows} iconColor="bg-violet-600" label="Compare Scenarios" onClick={onCompareScenarios} desc="Side-by-side with delta highlights" />
                  <SmartItem icon={Wind} iconColor="bg-teal-600" label="Tornado Sensitivity (fallback F108)" onClick={onTornadoSensitivity} desc="+/-20% parameter sweep" />
                  <SmartItem icon={TrendingDown} iconColor={c.calc} label="NSGA-II Optimizer" onClick={onShieldingOptimizer} desc="Multi-objective: cost, weight, space" />
                  <SmartItem icon={ShieldCheck} iconColor="bg-emerald-600" label="Shielding Verification (fallback F108)" onClick={onShieldingVerification} desc="HVL/TVL testing — NCRP 147 Appendix" />
                  <SmartItem icon={Cloud} iconColor="bg-sky-500" label="Skyshine Calculator" onClick={onSkyshine} desc="McGinley Ch.8 — Roofless facility scatter" />
                  <SmartItem icon={CalendarDays} iconColor="bg-emerald-500" label="Annual Dose Report (fallback F109)" onClick={onAnnualDose} desc="ICRP 103 — Seasonal accumulation" />
                  <SmartItem icon={GitCompareArrows} iconColor="bg-indigo-500" label="NCRP 147 vs 151 Cross-Val (fallback F108)" onClick={onCrossValidation} desc="Consistency check <10% discrepancy" />
                </>
              )},
              { label: t('menu.physics'), icon: Atom, color: c.physics, items: (
                <>
                  <SectionLabel label={t('physics.nativeMC')} color="text-cyan-500" />
                  <SmartItem icon={Cpu} iconColor={c.physics} label={t('physics.mcIntegration')} onClick={onMonteCarlo} desc="Geant4/MCNP6/FLUKA macro gen" />
                  <SmartItem icon={Cpu} iconColor={c.physics} label={t('physics.mcConfig')} onClick={onMonteCarloSim} />
                  <SmartItem icon={Cloud} iconColor={c.physics} label={t('physics.mcCloud')} onClick={onMCCloud} />
                  <SmartItem icon={GitBranch} iconColor={c.physics} label={t('physics.multiSource')} onClick={onMultiSource} desc="Multi-source with biasing" />
                  <SmartItem icon={Atom} iconColor={c.physics} label={t('physics.nativeMC')} onClick={onNativeMC} desc="Photons, Compton, photoelectric, pairs" />
                  <SectionLabel label="Particle Transport" color="text-cyan-500" />
                  <SmartItem icon={Atom} iconColor={c.physics} label={`${t('physics.neutron')} (fallback F107)`} onClick={onNeutronShielding} desc="ENDF/B-VII.1 simplified" />
                  <SmartItem icon={Atom} iconColor={c.physics} label={t('physics.electron')} onClick={onElectronTransport} />
                  <SmartItem icon={Hexagon} iconColor={c.physics} label={t('physics.voxel')} onClick={onVoxelPhantom} />
                  <SmartItem icon={FlaskConical} iconColor={c.physics} label={t('physics.mcnp')} onClick={onMCNPCyclotron} />
                  <SmartItem icon={Crosshair} iconColor={c.physics} label={`${t('physics.doseMap')} (fallback F108)`} onClick={onDoseMap} />
                  <SmartItem icon={Microscope} iconColor={c.physics} label={t('physics.gate')} onClick={onGATEPET} />
                  <SectionLabel label={t('physics.materialProps')} color="text-cyan-500" />
                  <SmartItem icon={Database} iconColor={c.physics} label={t('physics.materialProps')} onClick={onMaterialProps} />
                  <SmartItem icon={Zap} iconColor={c.physics} label={t('physics.cyclotron')} onClick={onCyclotronSim} />
                  <SectionLabel label="PHITS / JENDL-5 (v39)" color="text-cyan-500" />
                  <SmartItem icon={Atom} iconColor="bg-purple-600" label="PHITS Input Generator" onClick={onPHITSGenerator} desc="PHITS v3.36 — JAEA/RIST/KEK" />
                  <SmartItem icon={Atom} iconColor="bg-purple-600" label="DCHAIN-PHITS Activation" onClick={onDCHAINCalc} desc="Induced radioactivity calculator" />
                  <SmartItem icon={Box} iconColor="bg-emerald-600" label="CAD-to-MC Geometry" onClick={onCADToMC} desc="STL/OBJ/PLY → PHITS/GEANT4/MCNP" />
                  <SmartItem icon={Database} iconColor="bg-blue-600" label="JENDL-5 Data Viewer" onClick={onJENDL5Viewer} desc="780+ nuclides, 0.001 eV–200 MeV" />
                  <SectionLabel label="Open-Source MC Integration (v41)" color="text-cyan-500" />
                  <SmartItem icon={Cpu} iconColor="bg-orange-600" label="Monte Carlo Dose Engine" onClick={onMonteCarloEngine} desc="OpenXRayMC — ICRP phantoms + CTDI" />
                  <SmartItem icon={Atom} iconColor="bg-blue-600" label="FLUKA.CERN Generator" onClick={onFLUKA} desc="CERN/INFN — Hadrons to cosmic rays" />
                  <SmartItem icon={Zap} iconColor="bg-yellow-600" label="PENELOPE2023 Generator" onClick={onPENELOPE} desc="NEA-1525 — e⁻/γ transport 50 eV–1 GeV" />
                  <SectionLabel label="Variance Reduction (v43)" color="text-cyan-500" />
                  <SmartItem icon={Target} iconColor="bg-red-600" label="FW-CADIS Variance Reduction" onClick={onAttila4MC} desc="Attila4MC/Cottonwood — Deep penetration" />
                  <SectionLabel label="Attila4MC GUI (v44)" color="text-cyan-500" />
                  <SmartItem icon={FileText} iconColor="bg-blue-600" label="MCNP Input Deck Generator" onClick={onMCNPDeck} desc="GUI → Heavily commented .inp" />
                  <SmartItem icon={Box} iconColor="bg-emerald-600" label="CAD Assembly Material Mapper" onClick={onCADMapper} desc="STEP/IGES → MCNP regions" />
                  <SmartItem icon={Layers} iconColor="bg-purple-600" label="3D Solution Field Visualizer" onClick={onSolutionField3D} desc="Slice planes + isocontours" />
                  <SectionLabel label="McGinley Methods (v42)" color="text-cyan-500" />
                  <SmartItem icon={Layers} iconColor="bg-emerald-600" label="Laminated Barrier Calculator" onClick={onLaminatedBarrier} desc="Pb+Concrete — Multi-layer B_total" />
                  <SectionLabel label="Advanced Physics (v46)" color="text-cyan-500" />
                  <SmartItem icon={Ruler} iconColor="bg-amber-500" label="Oblique Incidence Correction" onClick={onObliqueIncidence} desc="McGinley Eq.3-4 — t_eff = t/cos(θ)" />
                  <SmartItem icon={Zap} iconColor="bg-yellow-500" label="Multi-Energy Spectra (TASMIP)" onClick={onMultiEnergySpectra} desc="Boone 1997 — 14 kVp configs" />
                  <SmartItem icon={BarChart3} iconColor="bg-blue-500" label="Adaptive Sampling Config" onClick={onAdaptiveSampling} desc="Press 2007 — Gradient-based density" />
                  <SmartItem icon={Shield} iconColor="bg-teal-500" label="Autoatenuación del paciente" onClick={onSelfShielding} desc="AAPM TG-108 — PET: 0.36 absorbido" />
                  <SmartItem icon={Cloud} iconColor="bg-sky-500" label="Chilton Skyshine" onClick={onChiltonSkyshine} desc="NCRP 151 Sec. 5.4 — Roof scatter" />
                  <SmartItem icon={FileText} iconColor="bg-violet-500" label="Transmission Curve Import" onClick={onTransmissionCurve} desc="NCRP 147 §4.3 — Measured HVL/TVL" />
                  <SmartItem icon={GitBranch} iconColor="bg-orange-500" label="Neutron Maze Calculator" onClick={onNeutronMaze} desc="NCRP 151 §5.3 — Albedo + capture γ" />
                  <SectionLabel label="St-Germain Method (v47)" color="text-teal-600" />
                  <SmartItem icon={GitCompareArrows} iconColor="bg-teal-500" label="St-Germain Scatter" onClick={onStGermain} desc="St-Germain 2016 — 50+ clinic validations" />
                  <SectionLabel label="v49 — All Remaining" color="text-rose-500" />
                  <SmartItem icon={Layers} iconColor="bg-cyan-500" label="Secondary Barrier Albedo" onClick={onAlbedo} desc="NCRP 144 §4.3 — Multiple surface reflection" />
                  <SmartItem icon={Radiation} iconColor="bg-rose-500" label="Concrete Activation" onClick={onConcreteActivation} desc="IAEA SSG-98 §7.2 — Neutron activation" />
                  <SmartItem icon={Award} iconColor="bg-amber-500" label="CNSNS Certification" onClick={onCertification} desc="CNSNS — License checklist" />
                  <SmartItem icon={Users} iconColor="bg-blue-500" label="Community Templates" onClick={onCommunityTemplates} desc="8 pre-configured bunker templates" />
                  <SmartItem icon={ShieldCheck} iconColor="bg-emerald-500" label="Audit Log (fallback F110)" onClick={onAuditLog} desc="Regulatory inspection trail — ISO 27001" />
                  <SmartItem icon={BarChart3} iconColor="bg-indigo-500" label="Analytics" onClick={onAnalytics} desc="Usage analytics — GDPR opt-in" />
                </>
              )},
              { label: t('menu.nuclear'), icon: Stethoscope, color: c.nucmed, items: (
                <>
                  <SectionLabel label="F106 equipo migrado (fallback)" color="text-rose-500" />
                  <SmartItem icon={Brain} iconColor={c.nucmed} label={`${t('nucMed.gammaKnife')} (fallback)`} onClick={onGammaKnife} />
                  <SmartItem icon={Activity} iconColor={c.nucmed} label={`${t('nucMed.braqui')} (fallback)`} onClick={onBraquiCo60} />
                  <SmartItem icon={ScanLine} iconColor={c.nucmed} label={`${t('nucMed.cbct')} (fallback)`} onClick={onCBCTIGRT} />
                  <SmartItem icon={Radio} iconColor={c.nucmed} label={`${t('nucMed.medicine')} (fallback)`} onClick={onNuclearMedicine} />
                  <SectionLabel label="Medicina nuclear avanzada" color="text-rose-500" />
                  <SmartItem icon={BarChart3} iconColor={c.nucmed} label="DVH Analyzer" onClick={onDVHAnalyzer} desc="matRad — Dose-Volume Histograms" />
                  <SectionLabel label="Blindaje fallback F107" color="text-rose-500" />
                  <SmartItem icon={Activity} iconColor="bg-blue-600" label="AAPM TG 108 PET Shielding (fallback F107)" onClick={onAAPMTG108PET} desc="PET/CT weekly kerma" />
                  <SmartItem icon={Activity} iconColor="bg-indigo-600" label="IPEM 109 SPECT Shielding (fallback F107)" onClick={onIPEM109} desc="SPECT/SPECT-CT room shielding" />
                  <SmartItem icon={Pill} iconColor="bg-rose-600" label="Therapy Radionuclide Shielding (fallback F107)" onClick={onTherapyShielding} desc="Y-90, Lu-177, Ac-225, I-131" />
                  <SmartItem icon={Shield} iconColor={c.nucmed} label={`${t('nucMed.shielding')} (fallback F107)`} onClick={onShieldingEquipos} />
                  <SmartItem icon={Cloud} iconColor="bg-sky-500" label="Chilton Skyshine (fallback F107)" onClick={onChiltonSkyshine} desc="Roof scatter MV" />
                  <SectionLabel label="Radiofarmacia" color="text-rose-500" />
                  <SmartItem icon={FileCheck} iconColor="bg-emerald-600" label="GMP Certification — Cyclotron" onClick={onGMPCertification} desc="IAEA/WHO, EMA — 59 requisitos" />
                  <SmartItem icon={Clock} iconColor="bg-amber-600" label="Generator Decay Chains" onClick={onDecayChains} desc="Mo-99/Tc-99m, Ge-68/Ga-68" />
                  <SmartItem icon={Atom} iconColor={c.nucmed} label={t('nucMed.bateman')} onClick={onBatemanDecay} />
                  <SmartItem icon={Grid3X3} iconColor="bg-rose-600" label="Nuclear Dose Grid" onClick={onNuclearDoseGrid} desc="PET/SPECT dose maps" />
                </>
              )},
              { label: t('menu.regulations'), icon: Scale, color: c.regul, items: (
                <>
                  <SectionLabel label={t('reg.intl')} color="text-indigo-500" />
                  <SmartItem icon={Globe} iconColor={c.regul} label={t('reg.intl')} onClick={onInternationalRegulations} />
                  <SmartItem icon={GitCompareArrows} iconColor={c.regul} label={t('reg.comparison')} onClick={onRegulatoryComparison} />
                  <SmartItem icon={ClipboardCheck} iconColor={c.regul} label={t('reg.compliance')} onClick={onComplianceCertification} />
                  <SmartItem icon={Bell} iconColor={c.regul} label={t('reg.alerts')} onClick={onRegulatoryAlerts} />
                  <SectionLabel label="CNSNS Mexico" color="text-indigo-500" />
                  <SmartItem icon={FileText} iconColor={c.regul} label={t('reg.cnsnsReport')} onClick={onCNSNSReport} />
                  <SmartItem icon={ClipboardList} iconColor={c.regul} label={t('reg.cnsnsChecklist')} onClick={onCNSNSChecklist} />
                  <SmartItem icon={BarChart3} iconColor={c.regul} label={t('reg.cnsnsDashboard')} onClick={onCNSNSDashboard} />
                  <SectionLabel label="Reference" color="text-indigo-500" />
                  <SmartItem icon={BookOpen} iconColor={c.regul} label={t('reg.ncrp151')} onClick={onNCRP151Detail} />
                  <SectionLabel label="Validation (v50)" color="text-indigo-500" />
                  <SmartItem icon={ShieldCheck} iconColor="bg-emerald-600" label="NCRP Validation Suite (fallback F108)" onClick={onNCRPValidation} desc="NCRP 147/151 tables — 24 test cases" />
                  <SmartItem icon={BookOpen} iconColor={c.regul} label={t('reg.epa')} onClick={onEPAGuidance} />
                  <SmartItem icon={BookOpen} iconColor={c.regul} label={t('reg.shleien')} onClick={onShleien} />
                  <SmartItem icon={BookOpen} iconColor={c.regul} label={t('reg.icru57')} onClick={onICRU57} />
                  <SmartItem icon={BookOpen} iconColor={c.regul} label={t('reg.icru96')} onClick={onICRU96} />
                  <SmartItem icon={Library} iconColor={c.regul} label={`${t('reg.bibliography')} (fallback F110)`} onClick={onBibliografia} />
                </>
              )},
              { label: t('menu.reports'), icon: BarChart3, color: c.report, items: (
                <>
                  <SectionLabel label="Reportes fallback F109" color="text-orange-500" />
                  <SmartItem icon={BarChart3} iconColor={c.report} label={`${t('reports.dashboard')} (fallback F109)`} onClick={onDashboard} />
                  <SmartItem icon={DollarSign} iconColor={c.report} label={`${t('reports.costEstimator')} (fallback F109)`} onClick={onCostDashboard} />
                  <SmartItem icon={ClipboardCheck} iconColor={c.report} label={`${t('reports.cnsnsChecklist')} (fallback F109)`} onClick={onCNSNSReportChecklist} />
                  <SmartItem icon={FileSearch} iconColor={c.report} label="Evidence Pack (fallback F110)" onClick={onEvidencePack} desc="Fuentes trazables para memoria analitica" />
                </>
              )},
              { label: t('menu.tools'), icon: Wand2, color: c.tool, items: (
                <>
                  <SectionLabel label={t('tools.ai')} color="text-[#f97316]" />
                  <SmartItem icon={Brain} iconColor={c.tool} label={`${t('tools.aiAssistant')} (fallback F110)`} onClick={onAIShielding} />
                  <SmartItem icon={Wand2} iconColor={c.tool} label={t('tools.predictive')} onClick={onPredictiveOptimizer} />
                  <SmartItem icon={Zap} iconColor={c.tool} label="Auto-fill Equipment" onClick={onAutoFillEquipo} />
                  <SmartItem icon={Video} iconColor={c.tool} label={t('tools.videoTutorial')} onClick={onVideoTutorial} />
                  <SectionLabel label={t('tools.integration')} color="text-[#f97316]" />
                  <SmartItem icon={Cloud} iconColor={c.tool} label={t('tools.cloudSync')} onClick={onCloudSync} />
                  <SmartItem icon={Users} iconColor={c.tool} label={t('tools.collaboration')} onClick={onCollaborationHub} />
                  <SmartItem icon={Globe} iconColor={c.tool} label={t('tools.external')} onClick={onExternalSoftware} />
                  <SectionLabel label={t('tools.others')} color="text-[#f97316]" />
                  <SmartItem icon={Factory} iconColor={c.tool} label={t('tools.industrial')} onClick={onIndustrialRadiation} />
                  <SmartItem icon={Code} iconColor={c.tool} label={t('tools.python')} onClick={onPythonTools} />
                  <SmartItem icon={Hexagon} iconColor={c.tool} label={t('tools.animatedDose')} onClick={onAnimatedDoseMaps} />
                  <SmartItem icon={Wind} iconColor={c.tool} label={t('tools.ventilation')} onClick={onVentilation} />
                  <SmartItem icon={Box} iconColor={c.tool} label="Equipment Library (rollback F106)" onClick={onEquipmentLibrary} />
                  <SmartItem icon={Microscope} iconColor={c.tool} label={`${t('tools.equipmentManager')} (rollback F106)`} onClick={onEquipmentManager} />
                  <DropdownMenuSeparator />
                  <SectionLabel label="DICOM & Submission (v40)" color="text-blue-500" />
                  <SmartItem icon={ScanLine} iconColor="bg-blue-500" label="DICOM RTSTRUCT Import" onClick={onDICOMRTSTRUCT} desc="Import contours from TPS" />
                  <SmartItem icon={Shield} iconColor="bg-red-500" label="CNSNS Digital Submission" onClick={onCNSNSDigital} desc="Structured XML for CNSNS" />
                  <SmartItem icon={GitBranch} iconColor="bg-purple-500" label="Version History" onClick={onVersionHistory} desc="Auto-save snapshots" />
                  <DropdownMenuSeparator />
                  <SectionLabel label="QA & Dosimetry (v41)" color="text-[#f97316]" />
                  <SmartItem icon={Activity} iconColor="bg-orange-500" label="Gamma Index Analyzer" onClick={onGammaIndex} desc="TopasGraphSim — PDD, profiles, γ-index" />
                  <SmartItem icon={BarChart3} iconColor="bg-indigo-500" label="DVH Analyzer" onClick={onDVHAnalyzer} desc="matRad — Dose-Volume Histograms" />
                  <SmartItem icon={Cpu} iconColor="bg-slate-600" label="Performance & Optimization" onClick={onPerformanceRecommendations} desc="Recomendaciones de rendimiento v42" />
                  <DropdownMenuSeparator />
                  <SectionLabel label="WASM + Sensitivity (v45)" color="text-emerald-600" />
                  <SmartItem icon={Activity} iconColor="bg-emerald-600" label="Sensitivity Analysis (fallback F108)" onClick={onSensitivityAnalysis} desc="Tornado chart — ±20% parameter variation" />
                  <DropdownMenuSeparator />
                  <SectionLabel label={t('tools.mosaic')} color="text-[#f97316]" />
                  <SmartItem icon={PenTool} iconColor={c.tool} label={t('tools.barrierEditor')} onClick={onBarrierEditor} />
                  <SmartItem icon={FileBarChart} iconColor={c.tool} label={t('tools.airKerma')} onClick={onAirKermaOverlay} />
                  <SmartItem icon={Building2} iconColor={c.tool} label={t('tools.projectManager')} onClick={onMosaicProjectManager} />
                  <SmartItem icon={MapPin} iconColor={c.tool} label={t('tools.controlPoints')} onClick={onControlPoints} />
                  <DropdownMenuSeparator />
                  <SectionLabel label={t('tools.security')} color="text-red-500" />
                  <SmartItem icon={Siren} iconColor="bg-red-500" label={t('tools.emergency')} onClick={onEmergency} desc="CNSNS LA-007/01 — 6 scenarios" />
                </>
              )},
              { label: 'Eficiencia', icon: Gauge, color: 'bg-teal-500', items: (
                <>
                  <SectionLabel label="Performance Dashboard" color="text-teal-500" />
                  <SmartItem icon={Gauge} iconColor="bg-teal-500" label="Performance Dashboard (fallback F108)" onClick={onPerformanceDashboard} desc="Grafana-style metrics, benchmarks, profiling" />
                  <SmartItem icon={Timer} iconColor="bg-teal-500" label="Benchmarks Suite" onClick={onPerformanceDashboard} desc="42 unit tests with timing thresholds" />
                  <SmartItem icon={LineChart} iconColor="bg-teal-500" label="Function Profiler" onClick={onPerformanceDashboard} desc="Call counts, flame graphs, hotspots" />
                  <SmartItem icon={MemoryStick} iconColor="bg-teal-500" label="CPU & Memory Profile" onClick={onPerformanceDashboard} desc="Heap monitoring, GC pressure, CPU slices" />
                  <DropdownMenuSeparator />
                  <SectionLabel label="Code Audit" color="text-teal-500" />
                  <SmartItem icon={SearchCode} iconColor="bg-amber-500" label="Technical Audit (fallback F110)" onClick={onPerformanceDashboard} desc="Complexity, dependencies, TS health" />
                  <SmartItem icon={Bug} iconColor="bg-red-500" label="Code Quality Audit (fallback F110)" onClick={onPerformanceDashboard} desc="Anti-patterns, security, performance smells" />
                  <SmartItem icon={FileSearch} iconColor="bg-blue-500" label="Algorithm Analyzer (fallback F110)" onClick={onPerformanceDashboard} desc="O(n²) detection, caching opportunities" />
                  <DropdownMenuSeparator />
                  <SectionLabel label="CAD / MC Geometry" color="text-teal-500" />
                  <SmartItem icon={Box} iconColor="bg-blue-500" label="CATIA-GDML & CAD→ROOT" onClick={onCADGeometryConverter} desc="Geometry builder & conversion for Monte Carlo" />
                  <DropdownMenuSeparator />
                  <SectionLabel label="AI Agents (Fase 3)" color="text-emerald-500" />
                  <SmartItem icon={Bot} iconColor="bg-emerald-500" label="Shielding Design Agent" onClick={onDesignAgent} desc="Autonomous multi-step shielding design with validation" />
                  <DropdownMenuSeparator />
                  <SectionLabel label="Optimization" color="text-teal-500" />
                  <SmartItem icon={Zap} iconColor="bg-yellow-500" label="Performance Recommendations" onClick={onPerformanceRecommendations} desc="15 optimization recommendations" />
                  <SmartItem icon={Cpu} iconColor="bg-emerald-500" label="WASM Optimizations" onClick={onPerformanceRecommendations} desc="WebAssembly for math-heavy functions" />
                  <SmartItem icon={Activity} iconColor="bg-indigo-500" label="Continuous Tests (fallback F108)" onClick={onNCRPValidation} desc="CI-style performance regression tests" />
                </>
              )},
            ].filter(() => false).map((menu, i) => (
              <DropdownMenu key={i}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-[11px] h-8 px-2 text-slate-600 hover:text-[#f97316] hover:bg-[#fff7ed] gap-1 font-medium">
                    <MiniIcon icon={menu.icon} color={menu.color} />
                    <span className="hidden lg:inline">{menu.label}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border border-slate-200 shadow-lg rounded-xl p-1.5">
                  {menu.items}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>

          <div className="flex-1" />

          {/* Right side controls */}
          <div className="flex items-center gap-1">
            {/* Dark Mode Toggle */}
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label={isDark ? 'Light Mode' : 'Dark Mode'} variant="ghost" size="sm" className="h-8 text-[11px] text-slate-600 hover:text-[#f97316] hover:bg-[#fff7ed] gap-1 font-medium" onClick={toggleDark}>
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
              </Button>
            </TooltipTrigger><TooltipContent>{isDark ? 'Light Mode' : 'Dark Mode'}</TooltipContent></Tooltip>

            {/* High Contrast Toggle — v47 Fase 3.13 */}
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label={hcMode ? 'Normal Contrast' : 'High Contrast'} variant="ghost" size="sm" className={`h-8 text-[11px] gap-1 font-medium ${hcMode ? 'text-yellow-500 bg-yellow-50' : 'text-slate-600 hover:text-[#f97316] hover:bg-[#fff7ed]'}`} onClick={onToggleHighContrast}>
                <Contrast className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>{hcMode ? 'Normal Contrast' : 'High Contrast (WCAG)'}</TooltipContent></Tooltip>

            <Separator orientation="vertical" className="h-5 bg-slate-200" />

            {/* Language Toggle */}
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label="ES / EN" variant="ghost" size="sm" className="h-8 text-[11px] text-slate-600 hover:text-[#f97316] hover:bg-[#fff7ed] gap-1 font-medium" onClick={toggleLang}>
                <Languages className="w-3.5 h-3.5" />{lang.toUpperCase()}
              </Button>
            </TooltipTrigger><TooltipContent>ES / EN</TooltipContent></Tooltip>

            <Separator orientation="vertical" className="h-5 bg-slate-200" />

            {/* Quick Actions */}
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label="Undo" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#f97316] hover:bg-[#fff7ed]" onClick={invoke(onUndo)}><Undo className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Undo</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label="Redo" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#f97316] hover:bg-[#fff7ed]" onClick={invoke(onRedo)}><Redo className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Redo</TooltipContent></Tooltip>

            <Separator orientation="vertical" className="h-5 bg-slate-200" />

            <Tooltip><TooltipTrigger asChild>
              <Button aria-label="Command Palette" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#f97316] hover:bg-[#fff7ed]" onClick={invoke(onCommandPalette, 'commandPalette')}><Keyboard className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Cmd Palette</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label="Tour" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#f97316] hover:bg-[#fff7ed]" onClick={invoke(onOnboardingTour, 'onboardingTour')}><HelpCircle className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Tour</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label="Manual" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#f97316] hover:bg-[#fff7ed]" onClick={invoke(onManual, 'manual')}><BookOpen className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Manual</TooltipContent></Tooltip>
            {/* v79: Update Center */}
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label="Update Center" variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50" onClick={invoke(onUpdate, 'updateCenter')}><RefreshCw className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Update Center</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label="Floor Plan Tools" variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={invoke(onFloorPlanFeatures, 'floorPlanFeatures')}><Shapes className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Floor Plan Tools</TooltipContent></Tooltip>
          </div>
        </div>

        {/* ═══ QUICK ACTION BAR — v113: solo categorias rapidas, todo lo demas en sidebar ═══ */}
        <div className="h-8 bg-[#fafaf9] border-b border-slate-200 flex items-center px-3 gap-2 shrink-0">
          {/* Brand tag */}
          <div className="flex items-center gap-1.5 mr-1">
            <div className="w-5 h-5 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 hidden md:inline">Acceso Rapido</span>
          </div>
          <Separator orientation="vertical" className="h-4 bg-slate-200" />
          {/* F113: perfiles activos DX/TX/NM/CY */}
          <div data-testid="f113-modality-profiles" className="flex items-center gap-1">
            {F113_MODALITY_PROFILES.map((profile) => (
              <button
                key={profile.id}
                data-testid={`f113-profile-${profile.id}`}
                title={`${profile.name} - ${profile.standards.join(', ')}`}
                aria-pressed={f113ProfileId === profile.id}
                className={`h-6 px-2 text-[10px] text-white ${F113_PROFILE_COLORS[profile.id]} font-bold rounded-md shadow-sm transition-all hover:shadow active:scale-95 ${f113ProfileId === profile.id ? 'ring-2 ring-offset-1 ring-slate-300 scale-[1.03]' : 'opacity-85 hover:opacity-100'}`}
                onClick={() => activateF113Profile(profile.id)}
              >
                {profile.label}
              </button>
            ))}
          </div>
          <div data-testid="f113-active-profile-chip" className="hidden xl:flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 shadow-sm">
            <span className={`h-2 w-2 rounded-full ${F113_PROFILE_COLORS[f113ActiveProfile.id]}`} />
            <span className="text-[9px] font-bold text-slate-700">{f113ActiveProfile.name}</span>
            <span className="text-[8px] text-slate-400">{F113_PROFILE_CHIPS[f113ActiveProfile.id]}</span>
          </div>
          <Separator orientation="vertical" className="h-4 bg-slate-200" />
          <div data-testid="f112-persistent-favorites" className="hidden xl:flex items-center gap-1">
            {f112Favorites.filter((item) => f112FavoriteIds.includes(item.id)).map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center rounded-md border border-slate-100 bg-white shadow-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 px-2 text-[9px] border-r border-slate-100 gap-1 ${item.className}`}
                        onClick={item.onClick}
                        title={`Ejecutar acceso rapido: ${item.tip}`}
                        data-testid={`f374-toolbar-quick-${item.id}`}
                      >
                        <Icon className="w-3 h-3" />{item.label}
                      </Button>
                      <button
                        type="button"
                        data-testid={`f112-unpin-${item.id}`}
                        className="h-6 w-5 text-slate-300 hover:text-[#f97316]"
                        onClick={() => toggleF112Favorite(item.id)}
                        title={`Ocultar favorito ${item.label}`}
                      >
                        <PinOff className="mx-auto w-2.5 h-2.5" />
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Favorito persistente F112: {item.tip}</TooltipContent>
                </Tooltip>
              );
            })}
            {f112Favorites.filter((item) => !f112FavoriteIds.includes(item.id)).map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`f112-pin-${item.id}`}
                className="h-6 rounded border border-dashed border-slate-200 bg-white px-1.5 text-[8px] text-slate-400 hover:text-[#f97316] hover:border-orange-200"
                onClick={() => toggleF112Favorite(item.id)}
                title={`Fijar favorito ${item.label}`}
              >
                +{item.label}
              </button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-4 bg-slate-200 hidden xl:block" />
          <span className="text-[9px] text-slate-400 hidden lg:inline">Herramientas completas en panel lateral</span>
          <div className="flex-1" />
          <div data-testid="f112-smart-status-chips" className="hidden 2xl:flex items-center gap-1">
            <button type="button" onClick={invoke(onFloorPlanFeatures, 'floorPlanFeatures')} className={`h-5 rounded border px-1.5 text-[8px] font-semibold ${f112LayoutReady ? 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              Layout {f112BarrierCount}B/{f112SourceCount}F/{f112ZoneCount}Z
            </button>
            <button type="button" onClick={invoke(onEvidencePack, 'evidencePack')} className={`h-5 rounded border px-1.5 text-[8px] font-semibold ${f112ResultCount > 0 ? 'border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100' : 'border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
              RAG {f112ResultCount > 0 ? 'listo' : 'tras calcular'}
            </button>
            <button type="button" onClick={invoke(onDoseMap, 'doseMap')} className={`h-5 rounded border px-1.5 text-[8px] font-semibold ${heatmapEnabled ? 'border-red-100 bg-red-50 text-red-700 hover:bg-red-100' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              Heat {heatmapEnabled ? 'ON' : 'OFF'}
            </button>
            <button type="button" onClick={invoke(onUpdate, 'updateCenter')} className="h-5 rounded border border-red-100 bg-red-50 px-1.5 text-[8px] font-semibold text-red-700 hover:bg-red-100">DB diferida</button>
            <button type="button" onClick={invoke(onUpdate, 'updateCenter')} className="h-5 rounded border border-amber-100 bg-amber-50 px-1.5 text-[8px] font-semibold text-amber-700 hover:bg-amber-100">Smoke pendiente</button>
            <button type="button" onClick={() => activateF113Profile(f113ActiveProfile.id)} className="h-5 rounded border border-cyan-100 bg-cyan-50 px-1.5 text-[8px] font-semibold text-cyan-700 hover:bg-cyan-100">
              Perfil {f113ActiveProfile.label}
            </button>
          </div>
          <Separator orientation="vertical" className="h-4 bg-slate-200 mx-1 hidden 2xl:block" />
          {/* v64: Canvas tool buttons */}
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-teal-600 hover:bg-teal-50" onClick={invoke(onToggleLayers, 'layersPanel')}><Layers className="w-3.5 h-3.5" /></Button>
          </TooltipTrigger><TooltipContent>Capas del canvas</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-violet-600 hover:bg-violet-50" onClick={invoke(onToggleShapeLibrary)}><Shapes className="w-3.5 h-3.5" /></Button>
          </TooltipTrigger><TooltipContent>Libreria de formas</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-600 hover:bg-rose-50" onClick={invoke(onToggleFreehand)}><PenTool className="w-3.5 h-3.5" /></Button>
          </TooltipTrigger><TooltipContent>Dibujo libre</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600 hover:bg-amber-50" onClick={invoke(onToggleStickyNotes)}><MessageSquare className="w-3.5 h-3.5" /></Button>
          </TooltipTrigger><TooltipContent>Notas adhesivas</TooltipContent></Tooltip>
          {/* v80: Smart Rooms + Dimension Lines */}
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:bg-emerald-50" onClick={invoke(onToggleRoomTemplates, 'roomTemplates')}><LayoutTemplate className="w-3.5 h-3.5" /></Button>
          </TooltipTrigger><TooltipContent>Smart Rooms</TooltipContent></Tooltip>
          {/* v83: Canvas clear + new map */}
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={invoke(onClearCanvas)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </TooltipTrigger><TooltipContent>Borrar mapa</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:bg-green-50" onClick={invoke(onNewMap)}><FilePlus className="w-3.5 h-3.5" /></Button>
          </TooltipTrigger><TooltipContent>Nuevo mapa</TooltipContent></Tooltip>
          <Separator orientation="vertical" className="h-4 bg-slate-200 mx-1" />
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={invoke(onEmergency, 'emergencyProcedures')}><Siren className="w-3.5 h-3.5" /></Button>
          </TooltipTrigger><TooltipContent>{t('tools.emergency')}</TooltipContent></Tooltip>
          <Separator orientation="vertical" className="h-4 bg-slate-200 mx-1" />
          {/* v92: Auth UI */}
          {user?.unionId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 text-emerald-600 hover:bg-emerald-50">
                  <User className="w-3 h-3" />
                  <span className="max-w-[80px] truncate">{user.name || 'Usuario'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-[10px] text-slate-400">
                  ID: {user.unionId?.slice(0, 12)}...
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-500 text-[11px]">
                  <LogOut className="w-3 h-3 mr-1.5" /> Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={onLogin}>
                  <LogIn className="w-3 h-3" /> Entrar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Iniciar sesion con Kimi</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
