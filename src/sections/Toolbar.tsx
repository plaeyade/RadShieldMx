/**
 * RadShield-MX Toolbar — Estilo Mosaic Atomics
 * Barra superior limpia, minimalista, con acento naranja coral
 */
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
  Play, Download, FileText, Microscope, FolderOpen, Box, Zap, Database, Cloud, ArrowUpDown, Upload, TrendingDown, Atom, CalendarDays, BarChart3, Gauge, Undo, Redo, Activity, Moon, Sun, Shield, DollarSign, ClipboardCheck, BookOpen, Library, Brain, GitCompareArrows, Crosshair, Calculator, Layers, Cpu, Scan, GitBranch, ChevronDown, Settings, ShieldCheck, PinOff, Keyboard, FileBarChart, Star, Radio, ScanLine, FileBox, HelpCircle, Compass, Stethoscope, Save, Plus, Siren, PenTool, MapPin, Languages, Pill, Contrast, Info, FileSearch, Bot, Share2, Shapes, MessageSquare, RefreshCw, LayoutTemplate, Trash2, FilePlus, User, LogIn, LogOut, ScanEye, Sparkles,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { F113_MODALITY_PROFILES, type F113ModalityProfileId } from '@/lib/f113ModalityProfiles';
import { useAppStore } from '@/stores/appStore';
import { MENU_AVANZADO } from '@/lib/featureFlags';
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

/* ─── Fase 12, paso 2: menú de una etapa del flujo de diseño ─── */
interface TonoMenu { boton: string; borde: string; icono: string; chevron: string }
const TONOS = {
  proyecto: { boton: 'text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 border-slate-100', borde: 'border-slate-200', icono: 'bg-slate-500', chevron: 'text-slate-400' },
  fuentes: { boton: 'text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border-rose-100', borde: 'border-rose-100', icono: 'bg-rose-500', chevron: 'text-rose-500' },
  barreras: { boton: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-100', borde: 'border-emerald-100', icono: 'bg-emerald-500', chevron: 'text-emerald-500' },
  verificacion: { boton: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 border-indigo-100', borde: 'border-indigo-100', icono: 'bg-indigo-500', chevron: 'text-indigo-500' },
  reportes: { boton: 'text-orange-700 bg-orange-50 hover:bg-orange-100 hover:text-orange-800 border-orange-100', borde: 'border-orange-100', icono: 'bg-orange-500', chevron: 'text-orange-500' },
  ayuda: { boton: 'text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-800 border-sky-100', borde: 'border-sky-100', icono: 'bg-sky-500', chevron: 'text-sky-500' },
  avanzado: { boton: 'text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-800 border-teal-100', borde: 'border-teal-100', icono: 'bg-teal-500', chevron: 'text-teal-500' },
} satisfies Record<string, TonoMenu>;

function MenuEtapa({ numero, etiqueta, titulo, id, icon, tono, siempreVisible = false, children }: {
  numero?: number; etiqueta: string; titulo: string; id: string;
  icon: ComponentType<{className?: string}>; tono: TonoMenu; siempreVisible?: boolean; children: ReactNode;
}) {
  const nombre = numero ? `${numero}. ${titulo}` : titulo;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid={`f12-menu-${id}`}
          aria-label={nombre}
          title={nombre}
          variant="ghost"
          size="sm"
          className={`${siempreVisible ? 'flex' : 'hidden lg:flex'} shrink-0 text-[10px] h-7 px-2 gap-1 font-semibold border ${tono.boton}`}
        >
          {numero ? (
            <span className={`w-4 h-4 rounded-[3px] ${tono.icono} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>{numero}</span>
          ) : (
            <MiniIcon icon={icon} color={tono.icono} />
          )}
          {/* Fase 12, paso 4: por debajo de 1280 px sólo el número de etapa (la etiqueta sigue en aria-label/title);
              a 1024 px los menús 4, 5 y Ayuda quedaban debajo de los controles de la derecha. */}
          <span className={numero ? 'hidden xl:inline' : 'hidden sm:inline'}>{etiqueta}</span>
          <ChevronDown className={`w-3 h-3 ${tono.chevron}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-testid={`f12-menu-${id}-contenido`} align="start" side="bottom" sideOffset={5} collisionPadding={12} className={`w-64 max-w-[calc(100vw-24px)] max-h-[calc(100vh-80px)] overflow-y-auto bg-white border ${tono.borde} shadow-lg rounded-xl p-1.5`}>
        <div className="px-2.5 pt-1 pb-1.5 text-[11px] font-bold text-slate-700">{nombre}</div>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ToolbarProps {
  [key: string]: any;
  /* 7 functional menus */
  onNewProject: () => void; onOpenProject: () => void; onSaveProject: () => void; onSaveAs: () => void;
  onExport: () => void; onShare: () => void;
  /** Fase 12, paso 3: memoria analítica y CNSNS (radshield/memoria@1), única salida de memoria e informe. */
  onMemoria: () => void;
  onImportImage: () => void; onBatchImport: () => void; onDXFViewer: () => void; onSTEPImporter: () => void;
  onToggleTheme: () => void; isDarkMode: boolean;
  onUndo: () => void; onRedo: () => void;
  onTechSpecs: () => void; onAuditTrail: () => void; onLogFileAnalysis: () => void;
  onCalculate: () => void; onShieldingCalculator: () => void; onCompareScenarios: () => void; onTornadoSensitivity: () => void;
  onEquipmentShieldingWizard: () => void; onQuick: () => void; onMazeCalculator: () => void;
  onFloorCeiling: () => void; onShieldingOptimizer: () => void; onCostOptimizer: () => void;
  onCostEstimator: () => void; onUncertainty: () => void; onGUMUncertainty: () => void;
  onUAQ: () => void;
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
  onCNSNSDashboard: () => void; onCNSNSChecklist: () => void;
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
    onNewProject, onSaveProject, floorPlan, barrierResults, heatmapEnabled, onExport, onShare, onMemoria,
    onBatchImport, onDXFViewer, onSTEPImporter, onUndo, onRedo, onTechSpecs, onAuditTrail, onLogFileAnalysis,
    onCalculate, onShieldingCalculator, onQuick, onFloorCeiling, onCostOptimizer, onGUMUncertainty,
    on3D, onMedicalFloorPlan3D, onPointCloud, onAutoBarrier, onRealTime3D, onShapesReconstruction,
    onNeutronShielding, onDoseMap, onMaterialProps, onNuclearMedicine, onAAPMTG108PET, onIPEM109,
    onTherapyShielding, onGammaKnife, onBraquiCo60, onCBCTIGRT, onShieldingEquipos, onNCRPValidation,
    onBibliografia, onDashboard, onCostDashboard, onCNSNSReportChecklist, onEvidencePack, onReferenceLibrary,
    onAIShielding, onEquipmentLibrary, onEquipmentManager, onOnboardingTour, onManual, onAbout, onGlossary,
    onGuiame, onReiniciarGuia, guiaEnCurso, onCommandPalette, onProjects, onCycloneKIUBE, onCategoryTools,
    onEmergency, onControlPoints, onVersionHistory, onShieldingVerification, onLaminatedBarrier,
    onPerformanceRecommendations, onPerformanceDashboard, onCADGeometryConverter, onDesignAgent,
    onSensitivityAnalysis, onSkyshine, onAnnualDose, onCrossValidation, highContrast: hcMode, onToggleHighContrast,
    onAuditLog, onToggleLayers, onToggleShapeLibrary, onToggleFreehand, onToggleStickyNotes, onUpdate,
    onFloorPlanFeatures, onToggleRoomTemplates, onClearCanvas, onNewMap, user, onLogin, onLogout,
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      toast.error(`${label}: ${message}`);
    }
  };
  const f112Favorites = useMemo(() => [
    { id: 'memoria' as const, label: 'Memoria', icon: Star, className: 'text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-100', onClick: invoke(onMemoria, 'memoria', 'Memoria'), tip: 'Memoria analítica y CNSNS' },
    { id: 'evidence' as const, label: 'Evidencia', icon: FileSearch, className: 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-100', onClick: invoke(onEvidencePack, 'evidencePack', 'Evidence Pack'), tip: 'Evidence Pack' },
    { id: 'validate' as const, label: 'Validar', icon: ShieldCheck, className: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100', onClick: invoke(onNCRPValidation, 'ncrpValidation', 'Validacion NCRP'), tip: 'NCRP Validation' },
    { id: 'heatmap' as const, label: 'Heatmap', icon: Crosshair, className: 'text-red-700 bg-red-50 hover:bg-red-100 border-red-100', onClick: invoke(onDoseMap, 'doseMap', 'Heatmap'), tip: 'Mapa de dosis/isodosis' },
  ], [onDoseMap, onEvidencePack, onMemoria, onNCRPValidation]);

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
          <div className="toolbar-brand flex items-center gap-2 shrink-0" title="RadShield-MX v127">
            <div className="w-7 h-7 bg-[#f97316] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            {/* El nombre también está en el panel lateral; por debajo de 1536 px sólo el logotipo, para que los cinco
                menús quepan sin montarse en los controles de la derecha (desborde de 46 px a 1280 × 720). */}
            <div className="leading-none hidden 2xl:block">
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

          {/* ═══ Fase 12, paso 2: 5 menús por etapa del flujo de diseño (el de «Guíame»: proyecto → plano → fuentes →
              ocupación → cálculo → cumplimiento → reporte), un solo botón «Calcular» entre la etapa 3 y la 4, Ayuda y,
              tras la bandera MENU_AVANZADO, «Avanzado». Cada acción tiene UNA entrada (antes: Archivo, Diseño, Equipos,
              Blindaje, Verificación, Reportes, Evidencia e Integraciones, con acciones repetidas y una zona oculta de
              menús de respaldo). ═══ */}
          <nav data-testid="f12-menus-etapa" aria-label="Etapas del diseño de blindaje" className="flex items-center gap-1 min-w-0">
            <MenuEtapa numero={1} etiqueta="Proyecto" titulo="Proyecto y plano" id="proyecto" icon={FolderOpen} tono={TONOS.proyecto} siempreVisible>
              <SectionLabel label="Proyecto" color="text-slate-400" />
              <SmartItem testId="f404-file-new-project" icon={Plus} iconColor={c.file} label={t('file.new')} onClick={invoke(onNewProject)} desc="Crear proyecto desde cero" />
              <SmartItem testId="f404-file-open-projects" icon={FolderOpen} iconColor={c.file} label={t('file.open')} onClick={invoke(onProjects, 'projects')} desc="Abrir o administrar proyectos" />
              <SmartItem testId="f404-file-save-project" icon={Save} iconColor={c.file} label={t('btn.save')} shortcut="Ctrl+S" onClick={invoke(onSaveProject)} />
              <SmartItem testId="f12-proyecto-versiones" icon={GitBranch} iconColor={c.file} label="Historial de versiones" onClick={invoke(onVersionHistory, 'versionHistory')} desc="Instantáneas guardadas del proyecto" />
              <DropdownMenuSeparator />
              <SectionLabel label="Plano" color="text-slate-400" />
              <SmartItem testId="f404-file-import-dxf" icon={Layers} iconColor={c.design} label={t('file.import.dxf')} onClick={invoke(onDXFViewer, 'dxfViewer')} desc="DXF o conversión DWG externa" />
              <SmartItem testId="f404-file-import-step" icon={FileBox} iconColor={c.design} label={t('file.import.step')} onClick={invoke(onSTEPImporter, 'stepImporter')} desc="STEP/IGES para geometría 3D" />
              <SmartItem testId="f404-file-import-csv" icon={Upload} iconColor={c.design} label={t('file.import.csv')} onClick={invoke(onBatchImport, 'batchImport')} desc="Importación por lotes de barreras/datos" />
              <SmartItem testId="f12-plano-herramientas" icon={ScanEye} iconColor={c.design} label="Herramientas del plano" onClick={invoke(onFloorPlanFeatures, 'floorPlanFeatures')} desc="Escala, zonas y detección OpenCV" />
              <SmartItem testId="f12-plano-autobarreras" icon={Scan} iconColor={c.design} label="Detección automática de barreras" onClick={invoke(onAutoBarrier, 'autoBarrier')} />
              <DropdownMenuSeparator />
              <SectionLabel label="Vista 3D" color="text-slate-400" />
              <SmartItem testId="f12-plano-3d-medico" icon={Stethoscope} iconColor="bg-teal-600" label="Inspección 3D del plano" onClick={invoke(onMedicalFloorPlan3D, 'medicalFloorPlan3D')} desc="Sala clínica en 3D" />
              <SmartItem testId="f12-plano-3d-bunker" icon={Box} iconColor={c.design} label="Visor 3D del búnker" onClick={invoke(on3D, 'viewer3d')} />
            </MenuEtapa>

            <MenuEtapa numero={2} etiqueta="Fuentes" titulo="Fuentes y cargas de trabajo" id="fuentes" icon={Radio} tono={TONOS.fuentes}>
              <SectionLabel label="Equipos y fuentes" color="text-rose-500" />
              <SmartItem testId="f12-fuentes-equipos" icon={Library} iconColor={c.nucmed} label="Biblioteca de equipos" onClick={invoke(onEquipmentLibrary, 'equipmentLibrary')} desc="Catálogo de equipos clínicos" />
              <SmartItem testId="f12-fuentes-radionuclidos" icon={Library} iconColor="bg-red-600" label="Biblioteca de fuentes" onClick={() => openDialog('sourceLibrary')} desc="Geometrías y radionúclidos" />
              <SmartItem testId="f12-fuentes-gestor" icon={Microscope} iconColor={c.nucmed} label={t('tools.equipmentManager')} onClick={invoke(onEquipmentManager)} />
              <DropdownMenuSeparator />
              <SectionLabel label="Ocupación" color="text-rose-500" />
              <SmartItem testId="f12-fuentes-puntos-control" icon={MapPin} iconColor={c.nucmed} label={t('tools.controlPoints')} onClick={invoke(onControlPoints)} desc="Puntos de cálculo, objetivo y ocupación" />
              <DropdownMenuSeparator />
              <SectionLabel label="Por modalidad" color="text-rose-500" />
              <SmartItem testId="f12-fuentes-medicina-nuclear" icon={Radio} iconColor={c.nucmed} label={t('nucMed.medicine')} onClick={invoke(onNuclearMedicine, 'nuclearMedicine')} />
              <SmartItem icon={Brain} iconColor={c.nucmed} label={t('nucMed.gammaKnife')} onClick={invoke(onGammaKnife)} />
              <SmartItem icon={Activity} iconColor={c.nucmed} label={t('nucMed.braqui')} onClick={invoke(onBraquiCo60)} />
              <SmartItem icon={ScanLine} iconColor={c.nucmed} label={t('nucMed.cbct')} onClick={invoke(onCBCTIGRT)} />
              <SmartItem icon={Zap} iconColor="bg-emerald-600" label="Cyclone KIUBE" onClick={invoke(onCycloneKIUBE)} desc="Ciclotrón y radiofarmacia" />
            </MenuEtapa>

            <MenuEtapa numero={3} etiqueta="Barreras" titulo="Barreras y materiales" id="barreras" icon={Shield} tono={TONOS.barreras}>
              <SectionLabel label="Calculadoras de barrera" color="text-emerald-600" />
              <SmartItem testId="f12-barreras-uaq" icon={Calculator} iconColor={c.calc} label={t('calc.uaq')} onClick={invoke(onShieldingCalculator, 'shieldingCalculator')} desc="Calculadora UAQ/NCRP de una barrera" />
              <SmartItem icon={Zap} iconColor={c.calc} label={t('calc.quick')} onClick={invoke(onQuick, 'quickBarrier')} shortcut="Ctrl+B" desc="Barrera aislada, sin plano" />
              <SmartItem icon={ArrowUpDown} iconColor={c.calc} label={t('calc.floorCeiling')} onClick={invoke(onFloorCeiling, 'floorCeiling')} desc="Suelo, techo y niveles adyacentes" />
              <SmartItem icon={GitBranch} iconColor={c.calc} label="Laberinto" onClick={() => openDialog('maze')} shortcut="Ctrl+L" desc="Puerta y laberinto (NCRP 151)" />
              <SmartItem icon={Layers} iconColor="bg-emerald-600" label="Barrera multicapa" onClick={invoke(onLaminatedBarrier)} desc="Pb + concreto + acero" />
              <SmartItem icon={Atom} iconColor={c.physics} label={t('physics.neutron')} onClick={invoke(onNeutronShielding, 'neutronShielding')} desc="Neutrones" />
              <SmartItem icon={Cloud} iconColor="bg-sky-500" label="Skyshine" onClick={invoke(onSkyshine, 'skyshine')} desc="Dispersión por techo y exteriores" />
              <DropdownMenuSeparator />
              <SectionLabel label="Medicina nuclear y terapia" color="text-emerald-600" />
              <SmartItem icon={Activity} iconColor="bg-blue-600" label="AAPM TG-108 (PET)" onClick={invoke(onAAPMTG108PET, 'aapmTG108')} desc="PET/CT y áreas contiguas" />
              <SmartItem icon={Activity} iconColor="bg-indigo-600" label="IPEM 109 (SPECT)" onClick={invoke(onIPEM109)} />
              <SmartItem icon={Pill} iconColor="bg-rose-600" label="Terapia con radionúclidos" onClick={invoke(onTherapyShielding)} desc="Y-90, Lu-177, Ac-225, I-131" />
              <SmartItem icon={Shield} iconColor={c.nucmed} label={t('nucMed.shielding')} onClick={invoke(onShieldingEquipos)} desc="Blindaje por equipo/fuente" />
              <DropdownMenuSeparator />
              <SectionLabel label="Materiales" color="text-emerald-600" />
              <SmartItem icon={TrendingDown} iconColor={c.calc} label="Optimizar materiales" onClick={invoke(onCostOptimizer)} desc="Costo, espesor, peso y espacio" />
              <SmartItem icon={Database} iconColor={c.physics} label={t('physics.materialProps')} onClick={invoke(onMaterialProps)} />
            </MenuEtapa>

            {/* El ÚNICO botón «Calcular» (mismo cálculo que F5, la paleta de comandos y el menú contextual del lienzo). */}
            <Tooltip><TooltipTrigger asChild>
              <Button
                data-testid="f12-calcular"
                aria-label="Calcular blindaje (F5)"
                size="sm"
                className="h-7 px-2.5 gap-1 shrink-0 text-[11px] font-bold text-white bg-[#f97316] hover:bg-[#ea580c] shadow-sm"
                onClick={() => { if (typeof onCalculate === 'function') void onCalculate(); }}
              >
                <Play className="w-3.5 h-3.5" /> Calcular
              </Button>
            </TooltipTrigger><TooltipContent>Calcular todas las barreras: NCRP 147 / NCRP 151 / TG-108 (F5)</TooltipContent></Tooltip>

            <MenuEtapa numero={4} etiqueta="Verificación" titulo="Verificación y cumplimiento" id="verificacion" icon={ShieldCheck} tono={TONOS.verificacion}>
              <SectionLabel label="Verificación" color="text-indigo-600" />
              <SmartItem testId="f12-verificacion-ncrp" icon={ShieldCheck} iconColor="bg-emerald-600" label="Validación NCRP" onClick={invoke(onNCRPValidation, 'ncrpValidation')} desc="Casos de las tablas NCRP 147/151" />
              <SmartItem icon={GitCompareArrows} iconColor="bg-indigo-500" label="NCRP 147 frente a 151" onClick={invoke(onCrossValidation, 'crossValidation')} desc="Consistencia numérica" />
              <SmartItem icon={ShieldCheck} iconColor="bg-emerald-600" label="Verificación del blindaje" onClick={invoke(onShieldingVerification, 'shieldingVerification')} desc="HVL/TVL y pruebas de blindaje" />
              <SmartItem icon={Crosshair} iconColor={c.physics} label={t('physics.doseMap')} onClick={invoke(onDoseMap, 'doseMap')} desc="Mapa de dosis e isodosis" />
              <DropdownMenuSeparator />
              <SectionLabel label="Incertidumbre" color="text-indigo-600" />
              <SmartItem icon={Activity} iconColor="bg-emerald-600" label="Análisis de sensibilidad" onClick={invoke(onSensitivityAnalysis, 'sensitivityAnalysis')} desc="Tornado y variación paramétrica" />
              <SmartItem icon={BarChart3} iconColor={c.calc} label="Incertidumbre (GUM)" onClick={invoke(onGUMUncertainty, 'gumUncertainty')} desc="Propagación JCGM 100" />
            </MenuEtapa>

            <MenuEtapa numero={5} etiqueta="Memoria" titulo="Memoria analítica y CNSNS" id="reportes" icon={FileText} tono={TONOS.reportes}>
              <SectionLabel label="Memoria y CNSNS" color="text-orange-600" />
              {/* Fase 12, paso 3: un solo flujo (antes Memoria IA, Exportar PDF y Reporte CNSNS por separado). */}
              <SmartItem testId="f12-reportes-memoria" icon={FileText} iconColor={c.report} label="Memoria analítica y CNSNS" onClick={invoke(onMemoria, 'memoria')} desc="Datos, revisión y DOCX/PDF/JSON (radshield/memoria@1)" />
              <SmartItem icon={ClipboardCheck} iconColor={c.report} label={t('reports.cnsnsChecklist')} onClick={invoke(onCNSNSReportChecklist)} />
              <SmartItem icon={CalendarDays} iconColor="bg-emerald-500" label="Dosis anual" onClick={invoke(onAnnualDose, 'annualDose')} desc="Acumulado anual ICRP/CNSNS" />
              <SmartItem icon={BarChart3} iconColor={c.report} label={t('reports.dashboard')} onClick={invoke(onDashboard)} />
              <SmartItem icon={DollarSign} iconColor={c.report} label={t('reports.costEstimator')} onClick={invoke(onCostDashboard)} />
              <DropdownMenuSeparator />
              <SectionLabel label="Exportar" color="text-orange-600" />
              <SmartItem testId="f404-file-export-csv" icon={Download} iconColor={c.file} label={t('file.export.csv')} onClick={invoke(onExport, 'export')} />
              <SmartItem testId="f404-file-share-results" icon={Share2} iconColor={c.file} label="Compartir resultados" onClick={invoke(onShare)} desc="Web Share API" />
              <DropdownMenuSeparator />
              <SectionLabel label="Evidencia y trazabilidad" color="text-orange-600" />
              <SmartItem testId="f12-reportes-evidencia" icon={FileSearch} iconColor="bg-violet-600" label="Paquete de evidencia" onClick={invoke(onEvidencePack, 'evidencePack')} desc="Citas, fuentes y snapshots verificables" />
              <SmartItem icon={BookOpen} iconColor={c.regul} label="Biblioteca de referencias" onClick={invoke(onReferenceLibrary, 'referenceLibrary')} desc="NCRP, IAEA, EPA, ICRU" />
              <SmartItem icon={Library} iconColor={c.regul} label="Bibliografía" onClick={invoke(onBibliografia)} />
              <SmartItem testId="f404-file-audit-trail" icon={Activity} iconColor={c.file} label={t('file.auditTrail')} onClick={invoke(onAuditTrail, 'auditTrail')} desc="Trazabilidad" />
              <SmartItem icon={ShieldCheck} iconColor="bg-emerald-500" label="Bitácora de auditoría" onClick={invoke(onAuditLog)} desc="Registro de inspección regulatoria" />
              <SmartItem testId="f404-file-log-analysis" icon={FileBarChart} iconColor={c.file} label={t('file.logAnalysis')} onClick={invoke(onLogFileAnalysis, 'logFileAnalysis')} desc="Diagnóstico de eventos" />
              <SmartItem testId="f404-file-tech-specs" icon={Settings} iconColor={c.file} label={t('file.techSpecs')} onClick={invoke(onTechSpecs, 'techSpecs')} desc="Especificaciones técnicas" />
            </MenuEtapa>

            <MenuEtapa etiqueta="Ayuda" titulo="Ayuda" id="ayuda" icon={HelpCircle} tono={TONOS.ayuda}>
              {onGuiame && <SmartItem testId="f10-help-guiame" icon={Compass} iconColor="bg-sky-500" label={guiaEnCurso ? 'Guíame (reanudar)' : 'Guíame'} onClick={onGuiame} desc="Asistente paso a paso, con ejemplo PET/CT opcional" />}
              {onReiniciarGuia && <SmartItem testId="f10-help-guia-reiniciar" icon={RefreshCw} iconColor="bg-sky-500" label="Reiniciar la guía" onClick={onReiniciarGuia} desc="Volver al paso 1 del asistente" />}
              <SmartItem testId="f12-ayuda-tour" icon={HelpCircle} iconColor="bg-sky-500" label="Recorrido de la interfaz" onClick={invoke(onOnboardingTour, 'onboardingTour')} />
              <SmartItem testId="f12-ayuda-manual" icon={BookOpen} iconColor="bg-sky-500" label="Manual" onClick={invoke(onManual, 'manual')} />
              <SmartItem testId="f12-ayuda-asistente" icon={Bot} iconColor={c.tool} label="Asistente IA (RAG)" onClick={invoke(onAIShielding)} desc="Preguntas con citas de la biblioteca" />
              <SmartItem testId="f404-file-glossary" icon={BookOpen} iconColor={c.file} label="Glosario" onClick={invoke(onGlossary, 'glossary')} desc="Terminología de blindaje" />
              <SmartItem testId="f404-file-about" icon={Info} iconColor={c.file} label="Acerca de" onClick={invoke(onAbout, 'about')} desc="Versión y créditos" />
            </MenuEtapa>

            {MENU_AVANZADO && (
              <MenuEtapa etiqueta="Avanzado" titulo="Avanzado (investigación e integraciones)" id="avanzado" icon={Cpu} tono={TONOS.avanzado}>
                <SmartItem icon={Gauge} iconColor="bg-teal-500" label="Rendimiento y auditoría técnica" onClick={invoke(onPerformanceDashboard, 'performanceDashboard')} desc="Benchmarks, perfiles y calidad de código" />
                <SmartItem icon={Zap} iconColor="bg-yellow-500" label="Recomendaciones de rendimiento" onClick={invoke(onPerformanceRecommendations)} />
                <SmartItem icon={Box} iconColor="bg-blue-500" label="CAD → Monte Carlo (GDML/ROOT)" onClick={invoke(onCADGeometryConverter, 'cadGeometryConverter')} />
                <SmartItem icon={Bot} iconColor="bg-emerald-500" label="Agente de diseño de blindaje" onClick={invoke(onDesignAgent, 'shieldingDesignAgent')} />
                <DropdownMenuSeparator />
                <SmartItem icon={Box} iconColor="bg-violet-500" label="3D en tiempo real" onClick={invoke(onRealTime3D, 'realTime3D')} />
                <SmartItem icon={ScanLine} iconColor={c.design} label="Nube de puntos (LiDAR)" onClick={invoke(onPointCloud)} />
                <SmartItem icon={Box} iconColor="bg-emerald-500" label="Reconstrucción desde RTSTRUCT" onClick={invoke(onShapesReconstruction, 'shapesReconstruction')} />
              </MenuEtapa>
            )}
          </nav>

          <div className="flex-1" />

          {/* Right side controls */}
          <div className="flex items-center gap-1 shrink-0">
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
            {/* v79: Update Center */}
            <Tooltip><TooltipTrigger asChild>
              <Button aria-label="Update Center" variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50" onClick={invoke(onUpdate, 'updateCenter')}><RefreshCw className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Update Center</TooltipContent></Tooltip>
            {/* Fase 12: Tour, Manual y «Floor Plan Tools» pasaron a los menús Ayuda y 1. Proyecto y plano. */}
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
