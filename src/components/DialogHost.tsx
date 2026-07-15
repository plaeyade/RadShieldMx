/**
 * ═══════════════════════════════════════════════════════════
 * DialogHost — C.11 Centralized dialog rendering
 * Encapsulates ALL dialogs from ShieldingDesigner.tsx
 * Reduces parent from ~200 lines of dialog JSX to 1 component
 * ═══════════════════════════════════════════════════════════
 */
import { Suspense, lazy, memo } from 'react';
import { toast } from 'sonner';
import type { FloorPlan } from '@/types/radshield';
import type { MCConfig } from '@/hooks/useMCBridge';
import LazyDialog from './LazyDialog';
import ErrorBoundary from './ErrorBoundary';
// Static imports for always-needed dialogs
import KeyboardShortcutsDialog from '@/sections/dialogs/KeyboardShortcutsDialog';
import SmartSearchDICOMDialog from '@/sections/dialogs/SmartSearchDICOMDialog';
import LogFileAnalysisDialog from '@/sections/dialogs/LogFileAnalysisDialog';
import CommandPalette, { DEFAULT_COMMANDS } from '@/sections/dialogs/CommandPalette';
import UndoRedoHistoryPanel from '@/sections/dialogs/UndoRedoHistoryPanel';
import ContextualHelpPanel from '@/sections/ContextualHelpPanel';
import IsodosisViewer from '@/sections/dialogs/IsodosisViewer';
import DoseMapping3D from '@/sections/dialogs/DoseMapping3D';
import HeatMapViewer from '@/sections/dialogs/HeatMapViewer';

// ─── Lazy dialog components ───
const MCResultsDialog = lazy(() => import('@/sections/dialogs/MCResultsDialog'));
const MemoriaAnaliticaWizard = lazy(() => import('@/sections/dialogs/MemoriaAnaliticaWizard'));
const MemoriaAIWizard = lazy(() => import('@/sections/dialogs/MemoriaAIWizard'));
const PlanValidatorDialog = lazy(() => import('@/sections/dialogs/PlanValidatorDialog'));
const EquipmentShieldingWizard = lazy(() => import('@/sections/dialogs/EquipmentShieldingWizard'));
const MonteCarloSimulationWizard = lazy(() => import('@/sections/dialogs/MonteCarloSimulationWizard'));
const CycloneKIUBEWizard = lazy(() => import('@/sections/dialogs/CycloneKIUBEWizard'));
const TutorialDialog = lazy(() => import('@/sections/dialogs/TutorialDialog'));
const CBCTIGRTDialog = lazy(() => import('@/sections/dialogs/CBCTIGRTDialog'));
const LayoutBunkerDialog = lazy(() => import('@/sections/dialogs/LayoutBunkerDialog'));
const MaintenanceLogDialog = lazy(() => import('@/sections/dialogs/MaintenanceLogDialog'));
const ScenarioAnalysisDialog = lazy(() => import('@/sections/dialogs/ScenarioAnalysisDialog'));
const ChecklistCNSNSDialog = lazy(() => import('@/sections/dialogs/ChecklistCNSNSDialog'));
const SpecialCasesDialog = lazy(() => import('@/sections/dialogs/SpecialCasesDialog'));
const CompareModeDialog = lazy(() => import('@/sections/dialogs/CompareModeDialog'));
const BatchCalculationDialog = lazy(() => import('@/sections/dialogs/BatchCalculationDialog'));
const SensitivityAnalysisDialog = lazy(() => import('@/sections/dialogs/SensitivityAnalysis'));
const AuditDashboardDialog = lazy(() => import('@/sections/dialogs/AuditDashboardDialog'));
const GeometrySelectorDialog = lazy(() => import('@/sections/dialogs/GeometrySelectorDialog'));
const NuclideDataViewer = lazy(() => import('@/sections/dialogs/NuclideDataViewer'));
const DecayHeatCalculator = lazy(() => import('@/sections/dialogs/DecayHeatCalculator'));
const BuildupFactorDialog = lazy(() => import('@/sections/dialogs/BuildupFactorDialog'));
const ExposureRateProjectionDialog = lazy(() => import('@/sections/dialogs/ExposureRateProjectionDialog'));
const SketchPadDialog = lazy(() => import('@/sections/dialogs/SketchPadDialog'));
const ExampleWizardDialog = lazy(() => import('@/sections/dialogs/ExampleWizardDialog'));
const CADImportDialog = lazy(() => import('@/sections/dialogs/CADImportDialog'));
const ParametricBunkerDesigner = lazy(() => import('@/sections/dialogs/ParametricBunkerDesigner'));
const MLPredictionDialog = lazy(() => import('@/sections/dialogs/MLPredictionDialog'));
const KeyboardConfigDialog = lazy(() => import('@/sections/dialogs/KeyboardConfigDialog'));
const CNSNSAutoReportDialog = lazy(() => import('@/sections/dialogs/CNSNSAutoReportDialog'));
const MaterialPropertyCalculator = lazy(() => import('@/sections/dialogs/MaterialPropertyCalculator'));
const LeadFreeMaterialsDialog = lazy(() => import('@/sections/dialogs/LeadFreeMaterialsDialog'));
const NeutronRemovalDialog = lazy(() => import('@/sections/dialogs/NeutronRemovalDialog'));
const NuclearMedicineAdvanced = lazy(() => import('@/sections/dialogs/NuclearMedicineAdvanced'));
const GMPCyclotronCertificationDialog = lazy(() => import('@/sections/dialogs/GMPCyclotronCertificationDialog'));
const OnboardingTour = lazy(() => import('@/sections/dialogs/OnboardingTour'));
const ManualDialog = lazy(() => import('@/sections/dialogs/ManualDialog'));

function DialogFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-3 text-sm text-slate-600">Cargando...</p>
      </div>
    </div>
  );
}

interface DialogHostProps {
  floorPlan: FloorPlan;
  setFloorPlan: (fp: FloorPlan | ((prev: FloorPlan) => FloorPlan)) => void;
  mcConfig: MCConfig;
  mcJobConfig: { jobId: number; format: string; particles: number; jobName: string } | null;
  setMcJobConfig: (c: any) => void;
  // Dialog states
  showMCResultsDialog: boolean; setShowMCResultsDialog: (v: boolean) => void;
  showMemoriaWizard: boolean; setShowMemoriaWizard: (v: boolean) => void;
  showMemoriaAI: boolean; setShowMemoriaAI: (v: boolean) => void;
  showPlanValidator: boolean; setShowPlanValidator: (v: boolean) => void;
  showEquipmentShieldingWizard: boolean; setShowEquipmentShieldingWizard: (v: boolean) => void;
  showMonteCarloSim: boolean; setShowMonteCarloSim: (v: boolean) => void;
  showCycloneKIUBE: boolean; setShowCycloneKIUBE: (v: boolean) => void;
  showTutorial: boolean; setShowTutorial: (v: boolean) => void;
  showCBCTIGRT: boolean; setShowCBCTIGRT: (v: boolean) => void;
  showLayoutBunker: boolean; setShowLayoutBunker: (v: boolean) => void;
  showMaintenanceLog: boolean; setShowMaintenanceLog: (v: boolean) => void;
  showScenarioAnalysis: boolean; setShowScenarioAnalysis: (v: boolean) => void;
  showChecklistCNSNS: boolean; setShowChecklistCNSNS: (v: boolean) => void;
  showSpecialCases: boolean; setShowSpecialCases: (v: boolean) => void;
  showCompareMode: boolean; setShowCompareMode: (v: boolean) => void;
  showBatchCalc: boolean; setShowBatchCalc: (v: boolean) => void;
  showSensitivity: boolean; setShowSensitivity: (v: boolean) => void;
  showAuditDashboard: boolean; setShowAuditDashboard: (v: boolean) => void;
  showGeometrySelector: boolean; setShowGeometrySelector: (v: boolean) => void;
  showNuclideData: boolean; setShowNuclideData: (v: boolean) => void;
  showDecayHeat: boolean; setShowDecayHeat: (v: boolean) => void;
  showBuildupFactor: boolean; setShowBuildupFactor: (v: boolean) => void;
  showExposureRateProjection: boolean; setShowExposureRateProjection: (v: boolean) => void;
  showSketchPad: boolean; setShowSketchPad: (v: boolean) => void;
  showExampleWizard: boolean; setShowExampleWizard: (v: boolean) => void;
  showCADImport: boolean; setShowCADImport: (v: boolean) => void;
  showParametricBunker: boolean; setShowParametricBunker: (v: boolean) => void;
  showMLPrediction: boolean; setShowMLPrediction: (v: boolean) => void;
  showKeyboardConfig: boolean; setShowKeyboardConfig: (v: boolean) => void;
  showCNSNSAutoReport: boolean; setShowCNSNSAutoReport: (v: boolean) => void;
  showMaterialProperty: boolean; setShowMaterialProperty: (v: boolean) => void;
  showLeadFreeMaterials: boolean; setShowLeadFreeMaterials: (v: boolean) => void;
  showNeutronRemoval: boolean; setShowNeutronRemoval: (v: boolean) => void;
  showNuclearMedicine: boolean; setShowNuclearMedicine: (v: boolean) => void;
  showGMPCertification: boolean; setShowGMPCertification: (v: boolean) => void;
  showAAPMTG108PET: boolean; setShowAAPMTG108PET: (v: boolean) => void;
  showIPEM109: boolean; setShowIPEM109: (v: boolean) => void;
  showChiltonSkyshine: boolean; setShowChiltonSkyshine: (v: boolean) => void;
  showTherapyShielding: boolean; setShowTherapyShielding: (v: boolean) => void;
  showDecayChains: boolean; setShowDecayChains: (v: boolean) => void;
  showBatemanDecay: boolean; setShowBatemanDecay: (v: boolean) => void;
  showCollaboration: boolean; setShowCollaboration: (v: boolean) => void;
  showGATE: boolean; setShowGATE: (v: boolean) => void;
  showBIMRAD: boolean; setShowBIMRAD: (v: boolean) => void;
  showMonteCarlo: boolean; setShowMonteCarlo: (v: boolean) => void;
  showGUMUncertainty: boolean; setShowGUMUncertainty: (v: boolean) => void;
  showExperimental: boolean; setShowExperimental: (v: boolean) => void;
  showDICOMRT: boolean; setShowDICOMRT: (v: boolean) => void;
  showAutoBarrier: boolean; setShowAutoBarrier: (v: boolean) => void;
  showPredictiveMaterial: boolean; setShowPredictiveMaterial: (v: boolean) => void;
  showAnomalyDetection: boolean; setShowAnomalyDetection: (v: boolean) => void;
  showAutoFillEquipment: boolean; setShowAutoFillEquipment: (v: boolean) => void;
  showVRAR: boolean; setShowVRAR: (v: boolean) => void;
  showVideoTutorial: boolean; setShowVideoTutorial: (v: boolean) => void;
  showAnimatedDose: boolean; setShowAnimatedDose: (v: boolean) => void;
  showPointCloud: boolean; setShowPointCloud: (v: boolean) => void;
  showIndustrial: boolean; setShowIndustrial: (v: boolean) => void;
  showMultiSource: boolean; setShowMultiSource: (v: boolean) => void;
  showPACS: boolean; setShowPACS: (v: boolean) => void;
  showInternationalRegulations: boolean; setShowInternationalRegulations: (v: boolean) => void;
  showRegulatoryComparison: boolean; setShowRegulatoryComparison: (v: boolean) => void;
  showComplianceCertification: boolean; setShowComplianceCertification: (v: boolean) => void;
  showRegulatoryAlerts: boolean; setShowRegulatoryAlerts: (v: boolean) => void;
  showPythonIntegration: boolean; setShowPythonIntegration: (v: boolean) => void;
  showNativeMC: boolean; setShowNativeMC: (v: boolean) => void;
  showNeutronShielding: boolean; setShowNeutronShielding: (v: boolean) => void;
  showNISTLibrary: boolean; setShowNISTLibrary: (v: boolean) => void;
  showModelingToolbox: boolean; setShowModelingToolbox: (v: boolean) => void;
  showElectronTransport: boolean; setShowElectronTransport: (v: boolean) => void;
  showSTEPImporter: boolean; setShowSTEPImporter: (v: boolean) => void;
  showIsodosis: boolean; setShowIsodosis: (v: boolean) => void;
  showDose3D: boolean; setShowDose3D: (v: boolean) => void;
  showHeatMap: boolean; setShowHeatMap: (v: boolean) => void;
  showHelpPanel: boolean; setShowHelpPanel: (v: boolean) => void;
  helpContext: string;
  showKeyboardShortcuts: boolean; setShowKeyboardShortcuts: (v: boolean) => void;
  showSmartSearchDICOM: boolean; setShowSmartSearchDICOM: (v: boolean) => void;
  showLogFileAnalysis: boolean; setShowLogFileAnalysis: (v: boolean) => void;
  showCommandPalette: boolean; setShowCommandPalette: (v: boolean) => void;
  showHistoryPanel: boolean; setShowHistoryPanel: (v: boolean) => void;
  actionHistory: any[]; historyIndex: number; setHistoryIndex: (i: number) => void;
  undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean;
  paletteActions: any[];
  exportCSV: () => void; exportJSON: () => void; exportExcel: () => void;
  reportMeta: any; setReportMeta: (v: any) => void;
  generateReport: () => void;
  generateMCMacro: () => void;
  lastMCResult: string;
  // Category tools
  activeCategory: string | null;
  setActiveCategory: (c: string | null) => void;
  setShowCategoryTools: (v: boolean) => void;
  // Projects
  projects: any[];
  cloudProjects: any[];
  currentProjectName: string;
  onSaveProject: (name: string) => void;
  onLoadProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onExportProject: () => void;
  onImportProject: (f: File) => void;
  isLoggedIn: boolean;
  // LazyDialog props
  setShowMCNPCyclotron: (v: boolean) => void;
  setShowVoxelPhantom: (v: boolean) => void;
  setShowDICOMRTSTRUCT: (v: boolean) => void;
  setShowCNSNSDigital: (v: boolean) => void;
  setShowEmergency: (v: boolean) => void;
  setShowBarrierEditor: (v: boolean) => void;
  setShowAirKermaOverlay: (v: boolean) => void;
  setShowMosaicProjectManager: (v: boolean) => void;
  setShowControlPoints: (v: boolean) => void;
  setShowPHITSGenerator: (v: boolean) => void;
  setShowDCHAINCalc: (v: boolean) => void;
  setShowCADToMC: (v: boolean) => void;
  setShowJENDL5Viewer: (v: boolean) => void;
  setShowVersionHistory: (v: boolean) => void;
  setShowNuclearMedicine: (v: boolean) => void;
  setShowRealTime3D: (v: boolean) => void;
  setShowDoseMap: (v: boolean) => void;
  setShowShieldingOptimizer: (v: boolean) => void;
  setShowPACSReal: (v: boolean) => void;
  setShowElectronApplicator: (v: boolean) => void;
  setShowShapesReconstruction: (v: boolean) => void;
  setShowEquipmentManager: (v: boolean) => void;
  setShowPerformanceRecommendations: (v: boolean) => void;
  setShowPerformanceDashboard: (v: boolean) => void;
  setShowCADGeometryConverter: (v: boolean) => void;
  setShowDesignAgent: (v: boolean) => void;
  setShowStGermain: (v: boolean) => void;
  setShowAlbedo: (v: boolean) => void;
  setShowConcreteActivation: (v: boolean) => void;
  setShowCertification: (v: boolean) => void;
  setShowCommunityTemplates: (v: boolean) => void;
  setShowAuditLog: (v: boolean) => void;
  setShowFloorCeiling: (v: boolean) => void;
  setShowMazeCalculator: (v: boolean) => void;
  setShowUAQ: (v: boolean) => void;
  setShowQuickShielding: (v: boolean) => void;
  setShowDVHAnalyzer: (v: boolean) => void;
  setShowFLUKA: (v: boolean) => void;
  setShowPENELOPE: (v: boolean) => void;
  setShowTherapyDosimetry: (v: boolean) => void;
  setShowShieldingVerification: (v: boolean) => void;
  setShowLaminatedBarrier: (v: boolean) => void;
  setShowSkyshine: (v: boolean) => void;
  setShowAnnualDose: (v: boolean) => void;
  setShowCrossValidation: (v: boolean) => void;
  setShowObliqueIncidence: (v: boolean) => void;
  setShowMultiEnergySpectra: (v: boolean) => void;
  setShowAdaptiveSampling: (v: boolean) => void;
  setShowSelfShielding: (v: boolean) => void;
  setShowTransmissionCurve: (v: boolean) => void;
  setShowNeutronMaze: (v: boolean) => void;
  setShowAttila4MC: (v: boolean) => void;
  setShowMCNPDeck: (v: boolean) => void;
  setShowCADMapper: (v: boolean) => void;
  setShowSolutionField3D: (v: boolean) => void;
  setShowGammaIndex: (v: boolean) => void;
  setShowNuclearDoseGrid: (v: boolean) => void;
  setShowMonteCarloEngine: (v: boolean) => void;
  setShowNeutronConfig: (v: boolean) => void;
  setShowBraquiHDR: (v: boolean) => void;
  setShowMemoriaAnalitica: (v: boolean) => void;
  setShowCNSNSCompliance: (v: boolean) => void;
  setShowCycloneKIUBE: (v: boolean) => void;
  setShowLabyrinthCalculator: (v: boolean) => void;
  setShowQuickShielding2: (v: boolean) => void;
  setShowFloorCeilingCalculator: (v: boolean) => void;
  setShowShieldingOptimizerAdvanced: (v: boolean) => void;
  setShowTechSpecsAdv: (v: boolean) => void;
  setShowLoadingScreen: (v: boolean) => void;
  setShowLoadingProgress: (v: number) => void;
  setShowLoadingMessage: (v: string) => void;
  setShowLoadingError: (v: string | null) => void;
  setShowWelcomeScreen: (v: boolean) => void;
}

const DialogHost = memo(function DialogHost(p: DialogHostProps) {
  const setFalse = () => false;
  const setters = {
    mcResults: p.setShowMCResultsDialog, memoria: p.setShowMemoriaWizard,
    memoriaAI: p.setShowMemoriaAI, planValidator: p.setShowPlanValidator,
    equipShield: p.setShowEquipmentShieldingWizard, mcSim: p.setShowMonteCarloSim,
    kiube: p.setShowCycloneKIUBE, tutorial: p.setShowTutorial,
    cbct: p.setShowCBCTIGRT, layout: p.setShowLayoutBunker,
    maint: p.setShowMaintenanceLog, scenario: p.setShowScenarioAnalysis,
    checklist: p.setShowChecklistCNSNS, special: p.setShowSpecialCases,
    compare: p.setShowCompareMode, batch: p.setShowBatchCalc,
    sensitivity: p.setShowSensitivity, audit: p.setShowAuditDashboard,
    geometry: p.setShowGeometrySelector, nuclide: p.setShowNuclideData,
    decayHeat: p.setShowDecayHeat, buildup: p.setShowBuildupFactor,
    exposure: p.setShowExposureRateProjection, sketch: p.setShowSketchPad,
    example: p.setShowExampleWizard, cad: p.setShowCADImport,
    bunker: p.setShowParametricBunker, ml: p.setShowMLPrediction,
    kbConfig: p.setShowKeyboardConfig, cnsnsAuto: p.setShowCNSNSAutoReport,
    matProp: p.setShowMaterialProperty, leadFree: p.setShowLeadFreeMaterials,
    neutronRem: p.setShowNeutronRemoval, nucMed: p.setShowNuclearMedicine,
    gmp: p.setShowGMPCertification, aapm: p.setShowAAPMTG108PET,
    ipem: p.setShowIPEM109, chilton: p.setShowChiltonSkyshine,
    therapy: p.setShowTherapyShielding, decay: p.setShowDecayChains,
    bateman: p.setShowBatemanDecay, collab: p.setShowCollaboration,
    gate: p.setShowGATE, bimrad: p.setShowBIMRAD,
    mc: p.setShowMonteCarlo, gum: p.setShowGUMUncertainty,
    experimental: p.setShowExperimental, dicomrt: p.setShowDICOMRT,
    autoBarrier: p.setShowAutoBarrier, predictive: p.setShowPredictiveMaterial,
    anomaly: p.setShowAnomalyDetection, autoFill: p.setShowAutoFillEquipment,
    vrar: p.setShowVRAR, video: p.setShowVideoTutorial,
    animated: p.setShowAnimatedDose, pointCloud: p.setShowPointCloud,
    industrial: p.setShowIndustrial, multiSource: p.setShowMultiSource,
    pacs: p.setShowPACS, intlRegs: p.setShowInternationalRegulations,
    regCompare: p.setShowRegulatoryComparison, compliance: p.setShowComplianceCertification,
    regAlerts: p.setShowRegulatoryAlerts, python: p.setShowPythonIntegration,
    nativeMC: p.setShowNativeMC, neutronShield: p.setShowNeutronShielding,
    nist: p.setShowNISTLibrary, toolbox: p.setShowModelingToolbox,
    electron: p.setShowElectronTransport, step: p.setShowSTEPImporter,
  };

  return (
    <>
      <Suspense fallback={<DialogFallback />}>
        {/* Zustand LazyDialogs */}
        <LazyDialog name="export" onExportCSV={p.exportCSV} onExportJSON={p.exportJSON} onExportExcel={p.exportExcel} />
        <LazyDialog name="cnsns" meta={p.reportMeta} setMeta={p.setReportMeta} onGenerate={p.generateReport} />
        <LazyDialog name="mc" config={p.mcConfig} onGenerate={p.generateMCMacro} />
        <LazyDialog name="projects" projects={p.projects} cloudProjects={p.cloudProjects} currentProjectName={p.currentProjectName} onSave={p.onSaveProject} onLoad={p.onLoadProject} onDelete={p.onDeleteProject} onRename={p.onRenameProject} onExport={p.onExportProject} onImport={p.onImportProject} isLoggedIn={p.isLoggedIn} />
        <LazyDialog name="viewer3d" floorPlan={p.floorPlan} />
        <LazyDialog name="maze" />
        <LazyDialog name="quickBarrier" />
        <LazyDialog name="equipmentDB" />
        <LazyDialog name="mcConfig" floorPlan={p.floorPlan} />
        <LazyDialog name="barrierCalculator" />
        <LazyDialog name="floorCeiling" />
        <LazyDialog name="dashboardCalc" floorPlan={p.floorPlan} />
        <LazyDialog name="costEstimator" />
        <LazyDialog name="cnsnsChecklist" />
        <LazyDialog name="batchImport" floorPlan={p.floorPlan} onImport={p.setFloorPlan} />
        <LazyDialog name="costOptimizer" />
        <LazyDialog name="neutron" />
        <LazyDialog name="seasonal" />
        <LazyDialog name="uncertainty" />
        <LazyDialog name="ventilation" />
        <LazyDialog name="dicom" />
        <LazyDialog name="techSpecs" floorPlanName={p.floorPlan.name} />
        <LazyDialog name="cnsnsDashboard" floorPlan={p.floorPlan} />
        <LazyDialog name="auditTrail" projectId={p.floorPlan.id} />
        <LazyDialog name="epaGuidance" />
        <LazyDialog name="shleien" />
        <LazyDialog name="gammaKnife" />
        <LazyDialog name="braquiCo60" />
        <LazyDialog name="versaHD" />
        <LazyDialog name="icru57" />
        <LazyDialog name="icru96" />
        <LazyDialog name="equipmentLibrary" />
        <LazyDialog name="referenceLibrary" />
        <LazyDialog name="ncrp151Tables" />
        <LazyDialog name="shieldingCalculator" />
        <LazyDialog name="dxfViewer" />
        <LazyDialog name="dashboard" />
        <LazyDialog name="bibliography" />
        <LazyDialog name="about" />
        <LazyDialog name="glossary" />
        <LazyDialog name="manual" />
        <LazyDialog name="doseMap" />
        <LazyDialog name="realTime3D" />
        <LazyDialog name="shieldingOptimizer" />
        <LazyDialog name="pacsReal" />
        <LazyDialog name="electronApplicator" />
        <LazyDialog name="voxelPhantom" />
        <LazyDialog name="mcnpCyclotron" />
        <LazyDialog name="shapesReconstruction" />
        <LazyDialog name="equipmentManager" />
        <LazyDialog name="categoryTools" activeCategory={p.activeCategory} onCategory={p.setActiveCategory} onOpen={() => p.setShowCategoryTools(true)} />
        <LazyDialog name="emergencyProcedures" />
        <LazyDialog name="stGermain" />
        <LazyDialog name="secondaryAlbedo" />
        <LazyDialog name="concreteActivation" />
        <LazyDialog name="certification" />
        <LazyDialog name="communityTemplates" />
        <LazyDialog name="auditLog47" />
        <LazyDialog name="analytics47" />
        <LazyDialog name="performanceDashboard" />
        <LazyDialog name="cadGeometryConverter" />
        <LazyDialog name="shieldingDesignAgent" />
        <LazyDialog name="updateCenter" />
        <LazyDialog name="analytics" />
        <LazyDialog name="emailNotifications" />
        <LazyDialog name="docs" />

        {/* Conditional dialogs */}
        {p.showMCResultsDialog && <MCResultsDialog open={p.showMCResultsDialog} onOpenChange={p.setShowMCResultsDialog} />}
        {p.showMemoriaWizard && <MemoriaAnaliticaWizard open={p.showMemoriaWizard} onOpenChange={p.setShowMemoriaWizard} />}
        {p.showMemoriaAI && <MemoriaAIWizard open={p.showMemoriaAI} onOpenChange={p.setShowMemoriaAI} />}
        {p.showPlanValidator && <PlanValidatorDialog open={p.showPlanValidator} onOpenChange={p.setShowPlanValidator} floorPlan={p.floorPlan} />}
        {p.showEquipmentShieldingWizard && <EquipmentShieldingWizard open={p.showEquipmentShieldingWizard} onOpenChange={p.setShowEquipmentShieldingWizard} />}
        {p.showMonteCarloSim && <MonteCarloSimulationWizard open={p.showMonteCarloSim} onOpenChange={p.setShowMonteCarloSim} />}
        {p.showCycloneKIUBE && <CycloneKIUBEWizard open={p.showCycloneKIUBE} onOpenChange={p.setShowCycloneKIUBE} />}
        {p.showTutorial && <TutorialDialog open={p.showTutorial} onOpenChange={p.setShowTutorial} />}
        {p.showCBCTIGRT && <CBCTIGRTDialog open={p.showCBCTIGRT} onOpenChange={p.setShowCBCTIGRT} />}
        {p.showLayoutBunker && <LayoutBunkerDialog open={p.showLayoutBunker} onOpenChange={p.setShowLayoutBunker} />}
        {p.showMaintenanceLog && <MaintenanceLogDialog open={p.showMaintenanceLog} onOpenChange={p.setShowMaintenanceLog} />}
        {p.showScenarioAnalysis && <ScenarioAnalysisDialog open={p.showScenarioAnalysis} onOpenChange={p.setShowScenarioAnalysis} />}
        {p.showChecklistCNSNS && <ChecklistCNSNSDialog open={p.showChecklistCNSNS} onOpenChange={p.setShowChecklistCNSNS} />}
        {p.showSpecialCases && <SpecialCasesDialog open={p.showSpecialCases} onOpenChange={p.setShowSpecialCases} />}
        {p.showCompareMode && <CompareModeDialog open={p.showCompareMode} onOpenChange={p.setShowCompareMode} />}
        {p.showBatchCalc && <BatchCalculationDialog open={p.showBatchCalc} onOpenChange={p.setShowBatchCalc} />}
        {p.showSensitivity && <SensitivityAnalysisDialog open={p.showSensitivity} onOpenChange={p.setShowSensitivity} />}
        {p.showAuditDashboard && <AuditDashboardDialog open={p.showAuditDashboard} onOpenChange={p.setShowAuditDashboard} />}
        {p.showGeometrySelector && <GeometrySelectorDialog open={p.showGeometrySelector} onOpenChange={p.setShowGeometrySelector} />}
        {p.showNuclideData && <NuclideDataViewer open={p.showNuclideData} onOpenChange={p.setShowNuclideData} />}
        {p.showDecayHeat && <DecayHeatCalculator open={p.showDecayHeat} onOpenChange={p.setShowDecayHeat} />}
        {p.showBuildupFactor && <BuildupFactorDialog open={p.showBuildupFactor} onOpenChange={p.setShowBuildupFactor} />}
        {p.showExposureRateProjection && <ExposureRateProjectionDialog open={p.showExposureRateProjection} onOpenChange={p.setShowExposureRateProjection} />}
        {p.showSketchPad && <SketchPadDialog open={p.showSketchPad} onOpenChange={p.setShowSketchPad} />}
        {p.showExampleWizard && <ExampleWizardDialog open={p.showExampleWizard} onOpenChange={p.setShowExampleWizard} />}
        {p.showCADImport && <CADImportDialog open={p.showCADImport} onOpenChange={p.setShowCADImport} />}
        {p.showParametricBunker && <ParametricBunkerDesigner open={p.showParametricBunker} onOpenChange={p.setShowParametricBunker} />}
        {p.showMLPrediction && <MLPredictionDialog open={p.showMLPrediction} onOpenChange={p.setShowMLPrediction} />}
        {p.showKeyboardConfig && <KeyboardConfigDialog open={p.showKeyboardConfig} onOpenChange={p.setShowKeyboardConfig} />}
        {p.showCNSNSAutoReport && <CNSNSAutoReportDialog open={p.showCNSNSAutoReport} onOpenChange={p.setShowCNSNSAutoReport} />}
        {p.showMaterialProperty && <MaterialPropertyCalculator open={p.showMaterialProperty} onOpenChange={p.setShowMaterialProperty} />}
        {p.showLeadFreeMaterials && <LeadFreeMaterialsDialog open={p.showLeadFreeMaterials} onOpenChange={p.setShowLeadFreeMaterials} />}
        {p.showNeutronRemoval && <NeutronRemovalDialog open={p.showNeutronRemoval} onOpenChange={p.setShowNeutronRemoval} />}

        {/* Static imports (always rendered via Suspense) */}
        <KeyboardShortcutsDialog open={p.showKeyboardShortcuts} onOpenChange={p.setShowKeyboardShortcuts} />
        <SmartSearchDICOMDialog open={p.showSmartSearchDICOM} onOpenChange={p.setShowSmartSearchDICOM} />
        <LogFileAnalysisDialog open={p.showLogFileAnalysis} onOpenChange={p.setShowLogFileAnalysis} />
        <CommandPalette open={p.showCommandPalette} onOpenChange={p.setShowCommandPalette} actions={p.paletteActions} />
        <UndoRedoHistoryPanel open={p.showHistoryPanel} onOpenChange={p.setShowHistoryPanel} history={p.actionHistory} currentIndex={p.historyIndex} onJumpTo={p.setHistoryIndex} onUndo={p.undo} onRedo={p.redo} canUndo={p.canUndo} canRedo={p.canRedo} />
        <IsodosisViewer open={p.showIsodosis} onOpenChange={p.setShowIsodosis} />
        <DoseMapping3D open={p.showDose3D} onOpenChange={p.setShowDose3D} />
        <HeatMapViewer open={p.showHeatMap} onOpenChange={p.setShowHeatMap} />
        {p.showHelpPanel && <ContextualHelpPanel activeContext={p.helpContext} onClose={() => p.setShowHelpPanel(false)} />}
        <ErrorBoundary fallback={null}><OnboardingTour /></ErrorBoundary>
      </Suspense>
    </>
  );
});

export default DialogHost;
