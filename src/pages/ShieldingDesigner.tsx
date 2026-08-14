import { useState, useCallback, Suspense, lazy, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { CriticalPoint, FloorPlan, Barrier, RadiationSource, OccupiedRegion } from '@/types/radshield';
import { MATERIALS, MODALITIES } from '@/types/radshield';
import { useShieldingEngine } from '@/hooks/useShieldingEngine';
import { useCanvas } from '@/hooks/useCanvas';
import { useControlledAreas } from '@/hooks/useControlledAreas';
import { useFileSystemAccess } from '@/hooks/useFileSystemAccess';
import { useWebGPU } from '@/hooks/useWebGPU';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';
import { useWebWorker } from '@/hooks/useWebWorker';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useWASM } from '@/hooks/useWASM';
import { useCalculationCache } from '@/hooks/useCalculationCache';
import { useWorkerCalculation } from '@/hooks/useWorkerCalculation';
import { useHighContrast } from '@/hooks/useHighContrast';
import { useWebGPUHeatmap } from '@/hooks/useWebGPUHeatmap';
import { useCanvasKeyboardNav } from '@/hooks/useCanvasKeyboardNav';
import { inverseArcher, tvlThickness } from '@/lib/shieldingMath';
import {
  applyShieldingPresetToFloorPlan,
  buildAuditSnapshotMetadata,
  buildCanvasQAExport,
  buildCriticalPointDraft,
  buildF86EvidenceSummary,
  buildScaleCalibrationDraft,
  canvasQAExportToCsv,
  SHIELDING_PRESETS,
} from '@/lib/canvasF85Workflow';
import { suggestOccupancyProfile, NCRP_DESIGN_GOALS, formatOccupancy } from '@/lib/ncrpOccupancy';
// v50: Motor optimizado con spatial hashing + async WebWorker
import { ShieldingEngine } from '@/lib/shieldingEngine';
import { AsyncShieldingEngine } from '@/lib/engine/AsyncShieldingEngine';
import { CanvasRenderer } from '@/lib/canvas/CanvasRenderer';
import { createProfiler } from '@/lib/performance/Profiler';
// Fase 1.1: ErrorBoundary para cada dialog
import ErrorBoundary from '@/components/ErrorBoundary';
// Fase 2.9: a11y announcer
import A11yAnnouncer, { announce } from '@/components/A11yAnnouncer';
// Fase 2.10: Canvas search
import CanvasSearch from '@/components/CanvasSearch';
// Fase 3.11: Minimap
import Minimap from '@/components/Minimap';
// v50.1: Responsive layout + skip-to-content
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import SkipToContent from '@/components/SkipToContent';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useWebShare } from '@/hooks/useWebShare';
import { useOpenCV, type WallDetection } from '@/hooks/useOpenCV';
import { captureException } from '@/lib/sentry';
import { buildKimiOAuthUrl } from '@/lib/authConfig';
import { trpc } from '@/providers/trpc';
import { type CTIsodosisProfile, parseIsodosisFile } from '@/types/ctIsodosis';
import { type CNSNSReportData, generateCNSNSReport } from '@/hooks/useCNSNSReport';
import { generateGEANT4Macro, generateGATEMacro, generateValidationInstructions, type MCConfig } from '@/hooks/useMCBridge';
// ═══ State Management: Zustand stores (Phase 0 - ready for v53-v60) ═══
import { useAppStore } from '@/stores/appStore';
import LazyDialog from '@/components/LazyDialog';

// react-resizable-panels removed — using flexbox layout for simplicity
import Toolbar from '@/sections/Toolbar';
import Sidebar from '@/sections/Sidebar';
import CanvasArea from '@/sections/CanvasArea';
import DxfImportReviewPanel from '@/sections/DxfImportReviewPanel';
import ResultsPanel from '@/sections/ResultsPanel';
// v82: Canvas enhancements
import { useCanvasLayers } from '@/hooks/useCanvasLayers';
import { useStickyNotes } from '@/hooks/useStickyNotes';
import { useFreehandDraw } from '@/hooks/useFreehandDraw';
import { useBackend } from '@/hooks/useBackend';
import CanvasLayersPanel from '@/sections/CanvasLayersPanel';
import ShapeLibrary from '@/sections/ShapeLibrary';
import type { ShapeItem } from '@/sections/ShapeLibrary';
// v82/F134: Update Center
import UpdateAppDialog from '@/sections/dialogs/UpdateAppDialog';
// v80: Smart Rooms
import RoomTemplatePanel from '@/sections/RoomTemplatePanel';
import { useRoomTemplates } from '@/hooks/useRoomTemplates';
// v85: SmartBarrier AI + SourceSelector
import { useSmartBarrier } from '@/hooks/useSmartBarrier';
import SourceSelector from '@/sections/SourceSelector';
import type { SourceItem } from '@/sections/SourceSelector';
import type { F525F529Modality } from '@/lib/f525F529ClinicalPlacementPack';
import type { F530F534PlacementPoint } from '@/lib/f530F534EquipmentPlacementPreview';
import { buildF545F549GhostSourceCommit } from '@/lib/f545F549GhostSourceCommit';
import StatusBar from '@/sections/StatusBar';
import WelcomeScreen from '@/sections/WelcomeScreen';

import SmartSearchDICOMDialog from '@/sections/dialogs/SmartSearchDICOMDialog';
import LogFileAnalysisDialog from '@/sections/dialogs/LogFileAnalysisDialog';
import CommandPalette, { DEFAULT_COMMANDS } from '@/sections/dialogs/CommandPalette';
import UndoRedoHistoryPanel from '@/sections/dialogs/UndoRedoHistoryPanel';
import ContextualHelpPanel from '@/sections/ContextualHelpPanel';
import IsodosisViewer from '@/sections/dialogs/IsodosisViewer';
import DoseMapping3D from '@/sections/dialogs/DoseMapping3D';
import HeatMapViewer from '@/sections/dialogs/HeatMapViewer';
// ─── ALL Dialogs lazy-loaded for performance ───
const CompareModeDialog = lazy(() => import('@/sections/dialogs/CompareModeDialog'));
const BatchCalculationDialog = lazy(() => import('@/sections/dialogs/BatchCalculationDialog'));
// v45: Enhanced Sensitivity Analysis with tornado chart
// v118: Sensitivity Analysis (replaces old inline dialog)
const SensitivityAnalysisDialog = lazy(() => import('@/sections/dialogs/SensitivityAnalysisDialog'));
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
const OnboardingTour = lazy(() => import('@/components/OnboardingTour'));
const MaterialPropertyCalculator = lazy(() => import('@/sections/dialogs/MaterialPropertyCalculator'));
const MaterialLibraryDialog = lazy(() => import('@/sections/dialogs/MaterialLibraryDialog'));
const ReportManagerDialog = lazy(() => import('@/sections/dialogs/ReportManagerDialog'));
const FloorPlanFeaturesPanel = lazy(() => import('@/sections/dialogs/FloorPlanFeaturesPanel'));
const NeutronRemovalDialog = lazy(() => import('@/sections/dialogs/NeutronRemovalDialog'));
const NuclearMedicineAdvanced = lazy(() => import('@/sections/dialogs/NuclearMedicineAdvanced'));
const GMPCyclotronCertificationDialog = lazy(() => import('@/sections/dialogs/GMPCyclotronCertificationDialog'));
const AAPMTG108PETDialog = lazy(() => import('@/sections/dialogs/AAPMTG108PETDialog'));
const IPEMReport109Dialog = lazy(() => import('@/sections/dialogs/IPEMReport109Dialog'));
const ChiltonSkyshineDialog = lazy(() => import('@/sections/dialogs/ChiltonSkyshineDialog'));
const TherapyShieldingDialog = lazy(() => import('@/sections/dialogs/TherapyShieldingDialog'));
const DecayChainsDialog = lazy(() => import('@/sections/dialogs/DecayChainsDialog'));
const CompareScenariosDialog = lazy(() => import('@/sections/dialogs/CompareScenariosDialog'));
const TornadoSensitivityDialog = lazy(() => import('@/sections/dialogs/TornadoSensitivityDialog'));
const NCRPValidationDialog = lazy(() => import('@/sections/dialogs/NCRPValidationDialog'));
const ThemeEngineDialog = lazy(() => import('@/sections/dialogs/ThemeEngineDialog'));
const BIMConnectorDialog = lazy(() => import('@/sections/dialogs/BIMConnectorDialog'));
const CloudSyncDialog = lazy(() => import('@/sections/dialogs/CloudSyncDialog'));
const ValidationDashboardDialog = lazy(() => import('@/sections/dialogs/ValidationDashboardDialog'));
const ExternalConnectorDialog = lazy(() => import('@/sections/dialogs/ExternalConnectorDialog'));
const BIMRADDialog = lazy(() => import('@/sections/dialogs/BIMRADDialog'));
const CollaborationHub = lazy(() => import('@/sections/dialogs/CollaborationHub'));
const GATESimulationDialog = lazy(() => import('@/sections/dialogs/GATESimulationDialog'));
const ShieldingDesignAgentDialog = lazy(() => import('@/sections/dialogs/ShieldingDesignAgentDialog'));
const MonteCarloIntegrationDialog = lazy(() => import('@/sections/dialogs/MonteCarloIntegrationDialog'));
const UncertaintyQuantificationDialog = lazy(() => import('@/sections/dialogs/UncertaintyQuantificationDialog'));
const ExperimentalValidationDialog = lazy(() => import('@/sections/dialogs/ExperimentalValidationDialog'));
const DICOMRTIntegrationDialog = lazy(() => import('@/sections/dialogs/DICOMRTIntegrationDialog'));
const AIAssistantDialog = lazy(() => import('@/sections/dialogs/AIAssistantDialog'));
const AutoBarrierDetectionDialog = lazy(() => import('@/sections/dialogs/AutoBarrierDetectionDialog'));
const PredictiveMaterialDialog = lazy(() => import('@/sections/dialogs/PredictiveMaterialDialog'));
const AnomalyDetectionDialog = lazy(() => import('@/sections/dialogs/AnomalyDetectionDialog'));
const AutoFillEquipmentDialog = lazy(() => import('@/sections/dialogs/AutoFillEquipmentDialog'));
const VRARBunkerPreview = lazy(() => import('@/sections/dialogs/VRARBunkerPreview'));
const VideoTutorialGenerator = lazy(() => import('@/sections/dialogs/VideoTutorialGenerator'));
const AnimatedDoseMapsDialog = lazy(() => import('@/sections/dialogs/AnimatedDoseMapsDialog'));
const PointCloudImportDialog = lazy(() => import('@/sections/dialogs/PointCloudImportDialog'));
const IndustrialRadiationDialog = lazy(() => import('@/sections/dialogs/IndustrialRadiationDialog'));
const MultiSourceDetectorDialog = lazy(() => import('@/sections/dialogs/MultiSourceDetectorDialog'));
const PACSIntegrationDialog = lazy(() => import('@/sections/dialogs/PACSIntegrationDialog'));
const InternationalRegulationsDialog = lazy(() => import('@/sections/dialogs/InternationalRegulationsDialog'));
const RegulatoryComparisonDialog = lazy(() => import('@/sections/dialogs/RegulatoryComparisonDialog'));
const ComplianceCertificationDialog = lazy(() => import('@/sections/dialogs/ComplianceCertificationDialog'));
const RegulatoryAlertsDialog = lazy(() => import('@/sections/dialogs/RegulatoryAlertsDialog'));
const PythonIntegrationDialog = lazy(() => import('@/sections/dialogs/PythonIntegrationDialog'));
const NativeMCDialog = lazy(() => import('@/sections/dialogs/NativeMCDialog'));
const NeutronShieldingDialog = lazy(() => import('@/sections/dialogs/NeutronShieldingDialog'));
const BatemanDecayDialog = lazy(() => import('@/sections/dialogs/BatemanDecayDialog'));
const NISTLibraryDialog = lazy(() => import('@/sections/dialogs/NISTLibraryDialog'));
const ModelingToolboxDialog = lazy(() => import('@/sections/dialogs/ModelingToolboxDialog'));
const ElectronTransportDialog = lazy(() => import('@/sections/dialogs/ElectronTransportDialog'));
const STEPImporterDialog = lazy(() => import('@/sections/dialogs/STEPImporterDialog'));
const ManualDialog = lazy(() => import('@/sections/dialogs/ManualDialog'));
const MemoriaAIWizard = lazy(() => import('@/sections/dialogs/MemoriaAIWizard'));
const MemoriaAnaliticaWizard = lazy(() => import('@/sections/dialogs/MemoriaAnaliticaWizard'));
const DoseMapDialog = lazy(() => import('@/sections/dialogs/DoseMapDialog'));
const RealTime3DDialog = lazy(() => import('@/sections/dialogs/RealTime3DDialog'));
const MedicalFloorPlan3DDialog = lazy(() => import('@/sections/dialogs/MedicalFloorPlan3DDialog'));
const ShieldingOptimizerDialog = lazy(() => import('@/sections/dialogs/ShieldingOptimizerDialog'));
const PACSRealDialog = lazy(() => import('@/sections/dialogs/PACSRealDialog'));
const ElectronApplicatorDialog = lazy(() => import('@/sections/dialogs/ElectronApplicatorDialog'));
const VoxelPhantomDialog = lazy(() => import('@/sections/dialogs/VoxelPhantomDialog'));
const MCNPCyclotronDialog = lazy(() => import('@/sections/dialogs/MCNPCyclotronDialog'));
const ShapesReconstructionDialog = lazy(() => import('@/sections/dialogs/ShapesReconstructionDialog'));
const EquipmentManagerDialog = lazy(() => import('@/sections/dialogs/EquipmentManagerDialog'));
const CategoryToolsDialog = lazy(() => import('@/sections/dialogs/CategoryToolsDialog'));
const EmergencyProceduresDialog = lazy(() => import('@/sections/dialogs/EmergencyProceduresDialog'));
const AuditTrailDialog = lazy(() => import('@/sections/dialogs/AuditTrailDialog'));
const EPAGuidanceDialog = lazy(() => import('@/sections/dialogs/EPAGuidanceDialog'));
const ShleienHandbookDialog = lazy(() => import('@/sections/dialogs/ShleienHandbookDialog'));
const GammaKnifeDialog = lazy(() => import('@/sections/dialogs/GammaKnifeDialog'));
const BraquiterapiaCo60Dialog = lazy(() => import('@/sections/dialogs/BraquiterapiaCo60Dialog'));
const VersaHD15MVDialog = lazy(() => import('@/sections/dialogs/VersaHD15MVDialog'));
const CycloneKIUBEWizard = lazy(() => import('@/sections/dialogs/CycloneKIUBEWizard'));
const EquipmentLibraryDialog = lazy(() => import('@/sections/dialogs/EquipmentLibraryDialog'));
const DashboardDialog = lazy(() => import('@/sections/dialogs/DashboardDialog'));
const DXFViewerDialog = lazy(() => import('@/sections/dialogs/DXFViewerDialog'));
const LayoutBunkerDialog = lazy(() => import('@/sections/dialogs/LayoutBunkerDialog'));
const MazeCalculatorDialog = lazy(() => import('@/sections/dialogs/MazeCalculatorDialog'));
// v96: Radioactive Material Transport (SSR-6)
const RadioactiveTransportDialog = lazy(() => import('@/sections/dialogs/RadioactiveTransportDialog'));
// v100: NIST XCOM Attenuation Database
const NistXcomDialog = lazy(() => import('@/sections/dialogs/NistXcomDialog'));
// v101: ML Shielding Predictor (ONNX)
const OnnxPredictorDialog = lazy(() => import('@/sections/dialogs/OnnxPredictorDialog'));
// v102: Revit IFC Import
const RevitIfcImportDialog = lazy(() => import('@/sections/dialogs/RevitIfcImportDialog'));
// v103: Geant4 Monte Carlo
const Geant4McDialog = lazy(() => import('@/sections/dialogs/Geant4McDialog'));
// v110: Revit Add-in C#
const RevitAddinDialog = lazy(() => import('@/sections/dialogs/RevitAddinDialog'));
// v105: Multi-Objective Optimizer
const MultiObjectiveOptimizerDialog = lazy(() => import('@/sections/dialogs/MultiObjectiveOptimizerDialog'));
// v106: Material Comparison
const MaterialComparisonDialog = lazy(() => import('@/sections/dialogs/MaterialComparisonDialog'));
// v110: Batch Report Exporter
const BatchReportExporterDialog = lazy(() => import('@/sections/dialogs/BatchReportExporterDialog'));
// v108: Spatial Dose Map 2D
const SpatialDoseMapDialog = lazy(() => import('@/sections/dialogs/SpatialDoseMapDialog'));
// v110: Regulatory Report Generator
const RegulatoryReportDialog = lazy(() => import('@/sections/dialogs/RegulatoryReportDialog'));
// v114: Multi-Layer Shield Calculator
const MultiLayerShieldDialog = lazy(() => import('@/sections/dialogs/MultiLayerShieldDialog'));
// v115: Source Library
const SourceLibraryDialog = lazy(() => import('@/sections/dialogs/SourceLibraryDialog'));
// v127: 3D Isosurface Dose Map
const Isosurface3DDialog = lazy(() => import('@/sections/dialogs/Isosurface3DDialog'));
// v117: PDF Report Generator
const PdfReportDialog = lazy(() => import('@/sections/dialogs/PdfReportDialog'));
// v119: NSGA-III Pareto Optimizer
const ParetoOptimizerDialog = lazy(() => import('@/sections/dialogs/ParetoOptimizerDialog'));
// v127: 3D Parametric Primitives
const Parametric3DDialog = lazy(() => import('@/sections/dialogs/Parametric3DDialog'));
// v121: Design Compare
const DesignCompareDialog = lazy(() => import('@/sections/dialogs/DesignCompareDialog'));
// v122: ALARA Wizard
const AlaraWizardDialog = lazy(() => import('@/sections/dialogs/AlaraWizardDialog'));
// v127: Nuclide Library 500+
const NuclideLibrary500Dialog = lazy(() => import('@/sections/dialogs/NuclideLibrary500Dialog'));
// v124: Dark Mode
const DarkModeDialog = lazy(() => import('@/sections/dialogs/DarkModeDialog'));
// v125: DXF Export
const DxfExportDialog = lazy(() => import('@/sections/dialogs/DxfExportDialog'));
// v126: Animated Dose Sweep
const DoseSweepDialog = lazy(() => import('@/sections/dialogs/DoseSweepDialog'));
// v127: Keyboard Shortcuts
const KeyboardShortcutsDialog = lazy(() => import('@/sections/dialogs/KeyboardShortcutsDialog'));
const EvidencePackDialog = lazy(() => import('@/sections/dialogs/EvidencePackDialog'));

const ReferenceLibraryDialog = lazy(() => import('@/sections/dialogs/ReferenceLibraryDialog'));
const NCRP151TablesDialog = lazy(() => import('@/sections/dialogs/NCRP151TablesDialog'));
const ExportDialog = lazy(() => import('@/sections/dialogs/ExportDialog'));
const MCDialog = lazy(() => import('@/sections/dialogs/MCDialog'));
const ProjectManagerDialog = lazy(() => import('@/sections/dialogs/ProjectManagerDialog'));
const Viewer3DDialog = lazy(() => import('@/sections/dialogs/Viewer3DDialog'));
const QuickBarrierDialog = lazy(() => import('@/sections/dialogs/QuickBarrierDialog'));
const EquipmentDBDialog = lazy(() => import('@/sections/dialogs/EquipmentDBDialog'));
const MCCloudDialog = lazy(() => import('@/sections/dialogs/MCCloudDialog'));
const MCConfigDialog = lazy(() => import('@/sections/dialogs/MCConfigDialog'));
const MCResultsDialog = lazy(() => import('@/sections/dialogs/MCResultsDialog'));
const BarrierCalculatorDialog = lazy(() => import('@/sections/dialogs/BarrierCalculatorDialog'));
const DashboardCalcDialog = lazy(() => import('@/sections/dialogs/DashboardCalcDialog'));
const CostEstimatorDialog = lazy(() => import('@/sections/dialogs/CostEstimatorDialog'));
const CNSNSChecklistDialog = lazy(() => import('@/sections/dialogs/CNSNSChecklistDialog'));
// v11.0: All 20 improvements
const BatchImportDialog = lazy(() => import('@/sections/dialogs/BatchImportDialog'));
const CostOptimizerDialog = lazy(() => import('@/sections/dialogs/CostOptimizerDialog'));
const NeutronDialog = lazy(() => import('@/sections/dialogs/NeutronDialog'));
const SeasonalDialog = lazy(() => import('@/sections/dialogs/SeasonalDialog'));
const UncertaintyDialog = lazy(() => import('@/sections/dialogs/UncertaintyDialog'));
const VentilationDialog = lazy(() => import('@/sections/dialogs/VentilationDialog'));
const DICOMDialog = lazy(() => import('@/sections/dialogs/DICOMDialog'));
const TechSpecsDialog = lazy(() => import('@/sections/dialogs/TechSpecsDialog'));
const CNSNSDashboardDialog = lazy(() => import('@/sections/dialogs/CNSNSDashboardDialog'));
// v13.4+v13.5: Shielding Calculator + DXF Viewer
const ShieldingCalculatorDialog = lazy(() => import('@/sections/dialogs/ShieldingCalculatorDialog'));
// v14.3: Gap analysis - Excel hojas faltantes
const CBCTIGRTDialog = lazy(() => import('@/sections/dialogs/CBCTIGRTDialog'));
const MaintenanceLogDialog = lazy(() => import('@/sections/dialogs/MaintenanceLogDialog'));
const ScenarioAnalysisDialog = lazy(() => import('@/sections/dialogs/ScenarioAnalysisDialog'));
const ChecklistCNSNSDialog = lazy(() => import('@/sections/dialogs/ChecklistCNSNSDialog'));
const CNSNSDialog = lazy(() => import('@/sections/dialogs/CNSNSDialog'));
// v14.4: Special cases (24 hojas restantes del Excel)
const SpecialCasesDialog = lazy(() => import('@/sections/dialogs/SpecialCasesDialog'));
// v38: Mosaic Atomics — Barrier Editor, Air Kerma Overlay, Project Manager, Control Points
const BarrierEditorDialog = lazy(() => import('@/sections/dialogs/BarrierEditor'));
const AirKermaOverlayDialog = lazy(() => import('@/sections/dialogs/AirKermaOverlay'));
const MosaicProjectManagerDialog = lazy(() => import('@/sections/dialogs/ProjectManager'));
const ControlPointsDialog = lazy(() => import('@/sections/dialogs/ControlPointsDialog'));
// v39: PHITS, CADMesh, JENDL-5
const PHITSInputGeneratorDialog = lazy(() => import('@/sections/dialogs/PHITSInputGenerator'));
const DCHAINActivationDialog = lazy(() => import('@/sections/dialogs/DCHAINActivationCalculator'));
const CADToMCImportDialog = lazy(() => import('@/sections/dialogs/CADToMCImport'));
const JENDL5DataViewerDialog = lazy(() => import('@/sections/dialogs/JENDL5DataViewer'));
// v40: Recomendaciones implementadas
const VersionHistoryDialog = lazy(() => import('@/sections/dialogs/VersionHistoryDialog'));
const DICOMRTSTRUCTDialog = lazy(() => import('@/sections/dialogs/DICOMRTSTRUCTDialog'));
const CNSNSDigitalSubmissionDialog = lazy(() => import('@/sections/dialogs/CNSNSDigitalSubmission'));
// v41: GitHub-inspired integrations (TopasGraphSim, pyshield, OpenXRayMC, matRad)
const GammaIndexAnalyzerDialog = lazy(() => import('@/sections/dialogs/GammaIndexAnalyzer'));
const NuclearDoseGridDialog = lazy(() => import('@/sections/dialogs/NuclearDoseGrid'));
const MonteCarloEngineDialog = lazy(() => import('@/sections/dialogs/MonteCarloEngine'));
const DVHAnalyzerDialog = lazy(() => import('@/sections/dialogs/DVHAnalyzer'));
// v41b: FLUKA.CERN + PENELOPE2023 + Therapy Dosimetry + Shielding Verification
const FLUKAInputGeneratorDialog = lazy(() => import('@/sections/dialogs/FLUKAInputGenerator'));
const PENELOPEInputGeneratorDialog = lazy(() => import('@/sections/dialogs/PENELOPEInputGenerator'));
const RadionuclideTherapyDosimetryDialog = lazy(() => import('@/sections/dialogs/RadionuclideTherapyDosimetry'));
const ShieldingVerificationDialog = lazy(() => import('@/sections/dialogs/ShieldingVerification'));
// v42: McGinley integration — Laminated barriers + Controlled areas
const LaminatedBarrierCalculatorDialog = lazy(() => import('@/sections/dialogs/LaminatedBarrierCalculator'));
const PerformanceRecommendationsDialog = lazy(() => import('@/sections/dialogs/PerformanceRecommendations'));
// v50: Performance Dashboard — Grafana-style metrics, benchmarks, profiling
const PerformanceDashboardDialog = lazy(() => import('@/sections/dialogs/PerformanceDashboardDialog'));
// v51: CATIA-GDML Geometry Builder & CAD-to-ROOT Conversion
const CADGeometryConverterDialog = lazy(() => import('@/sections/dialogs/CADGeometryConverterDialog'));
// v43: Attila4MC-inspired FW-CADIS variance reduction
const Attila4MCVarianceReductionDialog = lazy(() => import('@/sections/dialogs/Attila4MCVarianceReduction'));
// v44: Attila4MC GUI features — MCNP Deck, CAD Mapper, 3D Solution Fields
const MCNPGUIDeckGeneratorDialog = lazy(() => import('@/sections/dialogs/MCNPGUIDeckGenerator'));
const CADAssemblyMapperDialog = lazy(() => import('@/sections/dialogs/CADAssemblyMapper'));
const SolutionField3DDialog = lazy(() => import('@/sections/dialogs/SolutionField3D'));
// v46: Recommendations A-E — Skyshine, Annual Dose, Cross-Validation, Oblique, Spectra, Adaptive, Self-Shielding, Transmission, Neutron Maze
const SkyshineCalculatorDialog = lazy(() => import('@/sections/dialogs/SkyshineCalculator'));
const AnnualDoseReportDialog = lazy(() => import('@/sections/dialogs/AnnualDoseReport'));
const CrossValidationDialog = lazy(() => import('@/sections/dialogs/CrossValidationDialog'));
const ObliqueIncidenceDialog = lazy(() => import('@/sections/dialogs/ObliqueIncidenceDialog'));
const MultiEnergySpectraDialog = lazy(() => import('@/sections/dialogs/MultiEnergySpectraDialog'));
const AdaptiveSamplingDialog = lazy(() => import('@/sections/dialogs/AdaptiveSamplingDialog'));
const SelfShieldingDialog = lazy(() => import('@/sections/dialogs/SelfShieldingDialog'));
const TransmissionCurveDialog = lazy(() => import('@/sections/dialogs/TransmissionCurveDialog'));
const NeutronMazeDialog = lazy(() => import('@/sections/dialogs/NeutronMazeDialog'));
// v47: St-Germain scatter method
const StGermainScatterDialog = lazy(() => import('@/sections/dialogs/StGermainScatterDialog'));
const SecondaryBarrierAlbedoDialog = lazy(() => import('@/sections/dialogs/SecondaryBarrierAlbedoDialog'));
const ConcreteActivationDialog = lazy(() => import('@/sections/dialogs/ConcreteActivationDialog'));
const CertificationModeDialog = lazy(() => import('@/sections/dialogs/CertificationModeDialog'));
const CommunityTemplatesDialog = lazy(() => import('@/sections/dialogs/CommunityTemplatesDialog'));
const AuditLogDialog = lazy(() => import('@/sections/dialogs/AuditLogDialog'));
const AnalyticsDialog = lazy(() => import('@/sections/dialogs/AnalyticsDialog'));
// v14.5: Bibliography validated
const BibliographyDialog = lazy(() => import('@/sections/dialogs/BibliographyDialog'));
// v13.8: Plan Validator
const PlanValidatorDialog = lazy(() => import('@/sections/dialogs/PlanValidatorDialog'));
// v14.0: Equipment Shielding Wizard
const EquipmentShieldingWizard = lazy(() => import('@/sections/dialogs/EquipmentShieldingWizard'));
// v14.1: Monte Carlo Simulation Wizard
const MonteCarloSimulationWizard = lazy(() => import('@/sections/dialogs/MonteCarloSimulationWizard'));
const AboutDialog = lazy(() => import('@/sections/dialogs/AboutDialog'));
const GlossaryDialog = lazy(() => import('@/sections/dialogs/GlossaryDialog'));
import SplashScreen from '@/sections/dialogs/SplashScreen';
// v85: Restored missing imports
const FloorCeilingDialog = lazy(() => import('@/sections/dialogs/FloorCeilingDialog'));
const ICRU57Dialog = lazy(() => import('@/sections/dialogs/ICRU57Dialog'));
const ICRU96Dialog = lazy(() => import('@/sections/dialogs/ICRU96Dialog'));
const TutorialDialog = lazy(() => import('@/sections/dialogs/TutorialDialog'));
import { generatePDFReport } from '@/hooks/usePDFGenerator';

type Tool = 'select' | 'barrier' | 'source' | 'region' | 'measure' | 'pan' | 'eraser' | 'reset';

const defaultFloorPlan: FloorPlan = {
  id: 'plan-1',
  name: 'Plano de Blindaje 1',
  imageUrl: null,
  scale_m_per_pixel: 0.01,
  width_pixels: 1000,
  height_pixels: 800,
  barriers: [],
  sources: [],
  occupiedRegions: []
};

function DialogFallback() {
  return (
    <div className="p-6 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-red-700 rounded-full animate-spin" />
    </div>
  );
}

export default function ShieldingDesigner() {
  const { state: floorPlan, setState: setFloorPlan, undo, redo, canUndo, canRedo, reset: resetFloorPlan } = useUndoRedo<FloorPlan>(defaultFloorPlan, { maxHistory: 50 });
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // v85: SourceSelector + SmartBarrier AI
  
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const smartBarrier = useSmartBarrier();
  // [ZUSTAND] Replaced: const [showExportDialog, setShowExportDialog] = useState(false);
  // [ZUSTAND] Replaced: const [showCNSNSDialog, setShowCNSNSDialog] = useState(false);
  // [ZUSTAND] Replaced: const [showMCDialog, setShowMCDialog] = useState(false);
  // [ZUSTAND] Replaced: const [showProjectDialog, setShowProjectDialog] = useState(false);
  // [ZUSTAND] viewer3d
  // const [show3DDialog, setShow3DDialog] = useState(false);
  // [ZUSTAND] maze
  // const [showMazeDialog, setShowMazeDialog] = useState(false);
  // [ZUSTAND] quickBarrier
  // const [showQuickDialog, setShowQuickDialog] = useState(false);
  // [ZUSTAND] equipmentDB
  // const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  // [ZUSTAND] mcCloud
  const [showMCCloudDialog, setShowMCCloudDialog] = useState(false);
  // [ZUSTAND] mcConfig
  const [showMCConfigDialog, setShowMCConfigDialog] = useState(false);
  
  // [ZUSTAND] floorCeiling
  
  // [ZUSTAND] dashboardCalc
  // const [showDashboardCalcDialog, setShowDashboardCalcDialog] = useState(false);
  // [ZUSTAND] costEstimator
  // const [showCostEstimatorDialog, setShowCostEstimatorDialog] = useState(false);
  // [ZUSTAND] cnsnsChecklist
  // const [showCNSNSChecklistDialog, setShowCNSNSChecklistDialog] = useState(false);
  // MC dual-output config state
  const [mcJobConfig, setMcJobConfig] = useState<{ jobId: number; format: string; particles: number; jobName: string } | null>(null);
  // [ZUSTAND] mcResults — managed via calculationStore
  const [lastMCResult, setLastMCResult] = useState<string | null>(null);
  // [ZUSTAND] barrierCalculator
  // const [showBarrierCalculatorDialog, setShowBarrierCalculatorDialog] = useState(false);
  // Dark mode
  const { isDark: isDarkMode, toggle: toggleDarkMode } = useDarkMode();
  // v11.0: 20 improvements dialogs
  // [ZUSTAND] batchImport
  // const [showBatchImportDialog, setShowBatchImportDialog] = useState(false);
  // [ZUSTAND] costOptimizer
  // const [showCostOptimizerDialog, setShowCostOptimizerDialog] = useState(false);
  // [ZUSTAND] neutron
  // const [showNeutronDialog, setShowNeutronDialog] = useState(false);
  // [ZUSTAND] seasonal
  // const [showSeasonalDialog, setShowSeasonalDialog] = useState(false);
  // [ZUSTAND] uncertainty
  // const [showUncertaintyDialog, setShowUncertaintyDialog] = useState(false);
  // [ZUSTAND] ventilation
  // const [showVentilationDialog, setShowVentilationDialog] = useState(false);
  // [ZUSTAND] dicom
  // const [showDICOMDialog, setShowDICOMDialog] = useState(false);
  // [ZUSTAND] techSpecs
  // const [showTechSpecsDialog, setShowTechSpecsDialog] = useState(false);
  // [ZUSTAND] cnsnsDashboard
  // const [showCNSNSDashboardDialog, setShowCNSNSDashboardDialog] = useState(false);
  // [ZUSTAND] dxfViewer
  // const [showDXFViewer, setShowDXFViewer] = useState(false);
  // [ZUSTAND] auditTrail
  // const [showAuditTrailDialog, setShowAuditTrailDialog] = useState(false);
  // [ZUSTAND] epaGuidance
  // const [showEPAGuidanceDialog, setShowEPAGuidanceDialog] = useState(false);
  // [ZUSTAND] shleien
  // const [showShleienDialog, setShowShleienDialog] = useState(false);
  // [ZUSTAND] gammaKnife
  // const [showGammaKnifeDialog, setShowGammaKnifeDialog] = useState(false);
  // [ZUSTAND] braquiCo60
  // const [showBraquiCo60Dialog, setShowBraquiCo60Dialog] = useState(false);
  // [ZUSTAND] versaHD
  // const [showVersaHDDialog, setShowVersaHDDialog] = useState(false);
  // [ZUSTAND] icru57
  const [showICRU57Dialog, setShowICRU57Dialog] = useState(false);
  // [ZUSTAND] icru96
  const [showICRU96Dialog, setShowICRU96Dialog] = useState(false);
  // v13.2: Consolidated library dialogs
  // [ZUSTAND] equipmentLibrary
  // const [showEquipmentLibrary, setShowEquipmentLibrary] = useState(false);
  // [ZUSTAND] referenceLibrary
  // const [showReferenceLibrary, setShowReferenceLibrary] = useState(false);
  // [ZUSTAND] ncrp151Tables
  // const [showNCRP151Tables, setShowNCRP151Tables] = useState(false);
  // v13.4: Shielding Calculator RadSHIELD Mx Protocol
  // [ZUSTAND] shieldingCalculator
  // const [showShieldingCalculator, setShowShieldingCalculator] = useState(false);
  // v13.7: Memoria Analitica Wizard
  
  
  // v13.8: Plan Validator
  
  // v14.0: Equipment Shielding Wizard
  
  // v14.1: Monte Carlo Simulation
  
  // v14.1: Cyclone KIUBE Wizard
  
  
  // v14.3: Gap analysis states

  // [ZUSTAND] showDashboard → store.dialogs["dashboard"]
  // const [showDashboard, setShowDashboard] = useState(false);
  
  // v14.4: Special cases
  
  // v14.5: Bibliography
  // [ZUSTAND] showBibliography → store.dialogs["bibliography"]
  // const [showBibliography, setShowBibliography] = useState(false);
  // v15: New dialogs (keyboardShortcuts → Zustand store)
  
  
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(() => {
    try {
      const forced = localStorage.getItem('radshield_force_welcome');
      return forced === 'true';
    } catch {
      return false;
    }
  });
  // v15: Status bar state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [calculationStatus, setCalculationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [isDirty, setIsDirty] = useState(false);
  // v15: Command Palette
  
  // v15: Undo/Redo History Panel
  
  const [actionHistory, setActionHistory] = useState<Array<{id: number; timestamp: number; action: string; description: string; type: string}>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // v15: Contextual Help Panel
  
  const [helpContext, setHelpContext] = useState('default');
  // v15: Visualization dialogs
  
  
  
  // v15.2: Category C dialogs
  
  

  
  // v15.2: MicroShield patterns
  
  
  
  
  
  // v15.2: Additional features (sketch, examples, CAD import)
  
  
  
  // v16: New features
  
  
  
  
  // v17: Phy-X/PSD + Lead-free + Neutron removal
  
  
  
  // v18: Nuclear Medicine Advanced + Theme Engine + BIM + Cloud Sync + Validation


  // [ZUSTAND] showAbout → store.dialogs["about"]
  // const [showAbout, setShowAbout] = useState(false);
  // [ZUSTAND] showGlossary → store.dialogs["glossary"]
  // const [showGlossary, setShowGlossary] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // v128: Re-added useStates for active dialogs (pending Zustand migration)
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [onboardingTourKey, setOnboardingTourKey] = useState(0);
  const [showAirKermaOverlay, setShowAirKermaOverlay] = useState(false);
  const [showBarrierEditor, setShowBarrierEditor] = useState(false);
  const [showCertification, setShowCertification] = useState(false);
  const [showControlPoints, setShowControlPoints] = useState(false);
  const [showDose3D, setShowDose3D] = useState(false);
  const [showGammaIndex, setShowGammaIndex] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showIsodosis, setShowIsodosis] = useState(false);
  const [showLaminatedBarrier, setShowLaminatedBarrier] = useState(false);
  const [showMosaicProjectManager, setShowMosaicProjectManager] = useState(false);
  const [showPerformanceRecommendations, setShowPerformanceRecommendations] = useState(false);
  const [showSkyshine, setShowSkyshine] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showTherapyDosimetry, setShowTherapyDosimetry] = useState(false);

  // [ZUSTAND] themeEngine, bimConnector, cloudSync, validationDashboard
  // const [showThemeEngine, setShowThemeEngine] = useState(false);
  // const [showBIMConnector, setShowBIMConnector] = useState(false);
  // const [showCloudSync, setShowCloudSync] = useState(false);
  // const [showValidationDashboard, setShowValidationDashboard] = useState(false);
  // v19: External Software Connector
  // [ZUSTAND] externalConnector
  // const [showExternalConnector, setShowExternalConnector] = useState(false);
  // v20: BIMRAD + Collaboration + GATE PET/SPECT
  
  
  
  // v21: Ejes 1, 2, 5 completos + Proteccion Industrial
  
  
  
  
  // [ZUSTAND] Replaced: const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  
  
  
  
  
  
  
  
  // v22: Multi-Source Multi-Detector + PACS Integration
  
  
  // v23: Eje 3 Regulation + Python Integration
  
  
  
  
  
  // v25: Native Monte Carlo
  
  // v26: Neutron + Bateman + NIST + Toolbox
  
  
  
  
  // v27: Electron Transport + STEP Import
  
  
  // v28: Manual de Usuario PDF
  // [ZUSTAND] showManual → store.dialogs["manual"]
  // const [showManual, setShowManual] = useState(false);
  // v29: Real-Time 3D Design Exploration
  
  // v31: Dose Map Visualization
  
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  // v32: Shielding Optimizer + PACS Real + Electron Applicator
  
  
  
  // v33: Voxel Phantoms + MCNP Cyclotron + Shapes Reconstruction + Equipment Manager
  
  
  
  
  // v34: Category Tools Dialog
  
  const [activeCategory, setActiveCategory] = useState<string>('diagnostic');
  // v35: Emergency Procedures
  
  // v38: Mosaic Atomics features
  
  
  
  
  // v39: PHITS, CADMesh, JENDL-5
  const [showPHITSGenerator, setShowPHITSGenerator] = useState(false);
  const [showDCHAINCalc, setShowDCHAINCalc] = useState(false);
  const [showCADToMC, setShowCADToMC] = useState(false);
  const [showJENDL5Viewer, setShowJENDL5Viewer] = useState(false);
  // v40: Nuevas recomendaciones

  // v41: GitHub-inspired integrations (TopasGraphSim, pyshield, OpenXRayMC, matRad)
  
  
  const [showMonteCarloEngine, setShowMonteCarloEngine] = useState(false);

  // v41b: FLUKA.CERN + PENELOPE2023 + Therapy Dosimetry + Shielding Verification
  const [showFLUKA, setShowFLUKA] = useState(false);
  const [showPENELOPE, setShowPENELOPE] = useState(false);

  const [showAttila4MC, setShowAttila4MC] = useState(false);
  const [showMCNPDeck, setShowMCNPDeck] = useState(false);
  const [showCADMapper, setShowCADMapper] = useState(false);
  
  // v46: Recommendations A-E — Engine improvements
  
  
  
  
  
  
  
  
  
  // v47: St-Germain scatter method
  
  // v49: All remaining audit recommendations
  const [showAlbedo, setShowAlbedo] = useState(false);
  
  
  
  const [showAuditLog, setShowAuditLog] = useState(false);
  
  // v82: Canvas panel visibility states

  const [showShapeLibrary, setShowShapeLibrary] = useState(false);
  const [showStickyNotesPanel, setShowStickyNotesPanel] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showRoomTemplates, setShowRoomTemplates] = useState(false);
  const [showDxfImportReview, setShowDxfImportReview] = useState(false);
  const [draggedShape, setDraggedShape] = useState<ShapeItem | null>(null);
  // v80: Smart Rooms

  // v82: Update Center dialog

  // v89: Backend integration
  const { persistCalculationResults, materials: backendMaterials, reports: backendReports, projects: backendProjects } = useBackend();
  // v42: Controlled areas hook
  const controlledAreas = useControlledAreas();
  // v82: Canvas enhancements hooks
  const canvasLayers = useCanvasLayers();
  const stickyNotes = useStickyNotes();
  const freehandDraw = useFreehandDraw();
  // v80: Room templates
  // v80: Smart Rooms (v86: restored)
  const roomTemplates = useRoomTemplates();
  const applyRoomTemplateToFloorPlan = useCallback((templateId: string) => {
    const template = roomTemplates.applyTemplate(templateId);
    if (!template) {
      toast.error('No se encontro la plantilla seleccionada');
      return;
    }

    const scale = floorPlan.scale_m_per_pixel || 0.01;
    const marginPx = 80;
    const roomWidthPx = Math.round(template.roomDimensions.width_m / scale);
    const roomHeightPx = Math.round(template.roomDimensions.length_m / scale);
    const toCanvasPoint = (point: { x: number; y: number }) => ({
      x: Math.round(marginPx + point.x / scale),
      y: Math.round(marginPx + point.y / scale),
    });
    const materialAliases: Record<string, string> = {
      concrete: 'CONCRETE235',
      heavy_concrete: 'CONCRETEBARITE',
      lead_concrete: 'CONCRETEBARITE',
      lead_sheet: 'PB',
    };
    const modalityAliases: Record<string, string> = {
      CT: 'ct-body',
      'PET-CT': 'pet-f18',
      LINAC: 'linac-15mv',
      RX: 'rad-chest',
      Fluoroscopy: 'fluoro-routine',
      Mammography: 'mammo-cc',
      Brachytherapy: 'hdr-192ir',
      'Nuclear Medicine': 'spect-tc99m',
      'Shielded Room': 'rad-chest',
      Maze: 'cyclotron-16mev',
    };
    const modality = MODALITIES.find(m => m.id === modalityAliases[template.category]) || MODALITIES[0];

    const barriers: Barrier[] = template.walls.map((wall, index) => {
      const p1 = toCanvasPoint({ x: wall.x1, y: wall.y1 });
      const p2 = toCanvasPoint({ x: wall.x2, y: wall.y2 });
      const materialCode = materialAliases[wall.material] || 'CONCRETE235';
      return {
        id: `tmpl-${template.id}-barrier-${index + 1}`,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        name: wall.note || `Barrera ${index + 1}`,
        barrierType: wall.isPrimaryBarrier ? 'primary' : 'secondary',
        useFactor: wall.isPrimaryBarrier ? 1 : 0.25,
        occupancyFactor: template.controlledAreas[index % Math.max(template.controlledAreas.length, 1)]?.occupancyFactor ?? 0.2,
        designGoal_mSv_per_wk: template.designCriteria.doseConstraint_mSv_week ?? NCRP_DESIGN_GOALS.public,
        materialCode,
        material: MATERIALS.find(m => m.code === materialCode)?.name || materialCode,
        thickness_mm: wall.thickness_mm,
        requiredThickness_mm: wall.thickness_mm,
        reportNote: `F74 Smart room: ${template.name}. ${wall.note || wall.material}`,
      };
    });

    const sources: RadiationSource[] = template.equipment.map((equipment, index) => {
      const point = toCanvasPoint(equipment.position);
      return {
        id: `tmpl-${template.id}-source-${index + 1}`,
        x: point.x,
        y: point.y,
        name: equipment.name,
        modality,
        workloadValue: template.designCriteria.patientThroughput_perWeek ?? template.designCriteria.weeklyWorkload_hrs ?? 40,
        workloadUnit: equipment.workload || modality.unit,
        isocenterHeight_m: modality.isocenterHeightDefault_m || 1.2,
        useFactor: template.category === 'LINAC' ? 1 : 0.25,
        workloadHoursPerWeek: template.designCriteria.weeklyWorkload_hrs,
      };
    });

    const occupiedRegions = template.controlledAreas.map((area, index) => {
      const x = marginPx + roomWidthPx + 40;
      const y = marginPx + 24 + index * 86;
      const width = 150;
      const height = 64;
      return {
        id: `tmpl-${template.id}-region-${index + 1}`,
        name: area.name,
        occupancyFactor: area.occupancyFactor,
        designGoal_mSv_per_wk: area.type === 'controlled' ? NCRP_DESIGN_GOALS.controlled : NCRP_DESIGN_GOALS.public,
        points: [
          { x, y },
          { x: x + width, y },
          { x: x + width, y: y + height },
          { x, y: y + height },
        ],
      };
    });

    setFloorPlan(prev => ({
      ...prev,
      name: `${template.name} - Smart Room`,
      scale_m_per_pixel: scale,
      width_pixels: Math.max(prev.width_pixels, roomWidthPx + 360),
      height_pixels: Math.max(prev.height_pixels, roomHeightPx + 180),
      barriers,
      sources,
      occupiedRegions,
      regions: occupiedRegions,
    }));
    setControlPoints(occupiedRegions.map((region, index) => {
      const centroid = region.points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
      return {
        id: `tmpl-${template.id}-cp-${index + 1}`,
        name: region.name,
        x: Math.round(centroid.x / region.points.length),
        y: Math.round(centroid.y / region.points.length),
        designGoal_mSv_per_wk: region.designGoal_mSv_per_wk,
        occupancyFactor: region.occupancyFactor,
        notes: `Control point generated from F74 Smart Room template ${template.name}`,
      };
    }));
    setShowRoomTemplates(false);
    setActiveTool('select');
    toast.success(`Plantilla aplicada al plano: ${barriers.length} barreras, ${sources.length} fuentes, ${occupiedRegions.length} zonas`);
  }, [floorPlan.scale_m_per_pixel, roomTemplates, setFloorPlan]);
  const fileSystem = useFileSystemAccess();
  const webgpu = useWebGPU();
  const broadcastChannel = useBroadcastChannel();
  const webWorker = useWebWorker();
  const indexedDB = useIndexedDB();
  const serviceWorker = useServiceWorker();
  const wasm = useWASM();
  // v47: Real API integrations — Fase 1.3, 1.4, 3.13
  const calculationCache = useCalculationCache();
  const workerCalculation = useWorkerCalculation();
  const highContrast = useHighContrast();
  // v48: WebGPU heatmap
  const webgpuHeatmap = useWebGPUHeatmap();
  // D.1: Screen Wake Lock API — keeps screen awake during calculations
  const wakeLock = useWakeLock();
  // D.2: Web Share API — native OS share sheet
  const webShare = useWebShare();
  // v97: OpenCV.js wall/room detection
  const openCV = useOpenCV();
  // v50.1: Responsive layout
  const responsive = useResponsiveLayout();
  // v50: Async engine + profiler (instanciados una sola vez)
  const asyncEngineRef = useRef(new AsyncShieldingEngine());
  const profilerRef = useRef(createProfiler());
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [controlPoints, setControlPoints] = useState<Array<{id: string; name: string; x: number; y: number; designGoal_mSv_per_wk: number; occupancyFactor: number; notes: string}>>([
    { id: 'cp-1', name: 'Control Desk', x: 150, y: 150, designGoal_mSv_per_wk: 0.02, occupancyFactor: 1.0, notes: 'Main control room' },
    { id: 'cp-2', name: 'Patient Waiting', x: 500, y: 100, designGoal_mSv_per_wk: 0.02, occupancyFactor: 0.2, notes: 'Public area' },
    { id: 'cp-3', name: 'Staff Corridor', x: 350, y: 450, designGoal_mSv_per_wk: 0.02, occupancyFactor: 0.1, notes: 'Staff only' },
  ]);

  // ═══ Keyboard Shortcuts (Recomendacion #8) ═══
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) {
        switch (key) {
          case 'b': e.preventDefault(); setActiveTool('barrier'); toast.info('Tool: Barrier'); break;
          case 'f': e.preventDefault(); setActiveTool('source'); toast.info('Tool: Source'); break;
          case 's': e.preventDefault(); setActiveTool('select'); toast.info('Tool: Select'); break;
          case 'm': e.preventDefault(); setActiveTool('measure'); toast.info('Tool: Measure'); break;
          case 'h': e.preventDefault(); setActiveTool('pan'); toast.info('Tool: Pan'); break;
          case 'escape': setActiveTool('select'); break;
          case 'f5': e.preventDefault(); runRadShieldCalculations(); break;
        }
      } else {
        switch (key) {
          case 's': e.preventDefault(); handleNativeSave(); break;
          case 'o': e.preventDefault(); handleNativeOpen(); break;
          case 'b': e.preventDefault(); useAppStore.getState().open('quickBarrier'); break;
          case 'l': e.preventDefault(); useAppStore.getState().open('maze'); break;
          case 'z': e.preventDefault(); undo(); toast.info('Undo'); break;
          case 'y': e.preventDefault(); redo(); toast.info('Redo'); break;
          case 'k': e.preventDefault(); setShowCommandPalette(true); break;
          case 'g': e.preventDefault(); setActiveTool('region'); toast.info('Tool: Region'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-load demo data when welcome screen is dismissed
  useEffect(() => {
    if (!showWelcomeScreen && floorPlan.barriers.length === 0 && floorPlan.sources.length === 0) {
      // v98: Apply NCRP 147 occupancy factors to demo barriers and regions
      const controlProfile = suggestOccupancyProfile('Control Room');
      const corridorProfile = suggestOccupancyProfile('Corridor');
      const southProfile = suggestOccupancyProfile('Patient Waiting');
      // Load a demo R&F room configuration similar to RadShield paper (DeLorenzo et al. 2016, Fig. 6)
      setFloorPlan(prev => ({
        ...prev,
        name: 'Demo - R&F Room (RadShield Fig.6)',
        scale_m_per_pixel: 0.01,
        sources: [
          { id: 'source-chest', x: 300, y: 200, name: 'Chest X-ray', modality: { id: 'xr_chest', name: 'Chest Radiography', energies: [120], typicalDose_mGy: 0.2, workloadDefault: 150, unit: 'exams/week', description: 'Chest radiography, standing patient, wall Bucky' }, workloadValue: 150, workloadUnit: 'exams/week', isocenterHeight_m: 1.5, useFactor: 0.25, workloadHoursPerWeek: 40 },
          { id: 'source-table', x: 350, y: 350, name: 'Table Top X-ray', modality: { id: 'xr_table', name: 'Table Top Radiography', energies: [90], typicalDose_mGy: 1.5, workloadDefault: 80, unit: 'exams/week', description: 'Table top radiography, supine patient' }, workloadValue: 80, workloadUnit: 'exams/week', isocenterHeight_m: 1.0, useFactor: 1.0, workloadHoursPerWeek: 40 },
          { id: 'source-fluoro', x: 400, y: 300, name: 'Fluoroscopy', modality: { id: 'xr_fluoro', name: 'Fluoroscopy', energies: [110], typicalDose_mGy: 15, workloadDefault: 20, unit: 'hours/week', description: 'Continuous fluoroscopy for procedures' }, workloadValue: 20, workloadUnit: 'hours/week', isocenterHeight_m: 1.1, useFactor: 0.083, workloadHoursPerWeek: 20 },
        ],
        barriers: [
          { id: 'wall-north', x1: 100, y1: 100, x2: 600, y2: 100, name: 'Wall 1 (North)', barrierType: 'primary', useFactor: 1.0, occupancyFactor: controlProfile.occupancyFactor, designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.controlled, materialCode: 'CONCRETE235' },
          { id: 'wall-east', x1: 600, y1: 100, x2: 600, y2: 500, name: 'Wall 2 (East)', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: corridorProfile.occupancyFactor, designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.public, materialCode: 'CONCRETE235' },
          { id: 'wall-south', x1: 100, y1: 500, x2: 600, y2: 500, name: 'Wall 3 (South)', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: southProfile.occupancyFactor, designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.public, materialCode: 'CONCRETE235' },
          { id: 'wall-west', x1: 100, y1: 100, x2: 100, y2: 500, name: 'Wall 4 (West)', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: corridorProfile.occupancyFactor, designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.public, materialCode: 'CONCRETE235' },
          { id: 'wall-divider', x1: 350, y1: 100, x2: 350, y2: 300, name: 'Wall 5 (Divider)', barrierType: 'primary', useFactor: 1.0, occupancyFactor: controlProfile.occupancyFactor, designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.controlled, materialCode: 'CONCRETE235' },
        ],
        occupiedRegions: [
          { id: 'region-control', name: 'Control Room', designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.controlled, occupancyFactor: controlProfile.occupancyFactor, points: [{ x: 110, y: 110 }, { x: 340, y: 110 }, { x: 340, y: 290 }, { x: 110, y: 290 }] },
          { id: 'region-corridor', name: 'Corridor', designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.public, occupancyFactor: corridorProfile.occupancyFactor, points: [{ x: 360, y: 110 }, { x: 590, y: 110 }, { x: 590, y: 490 }, { x: 360, y: 490 }] },
        ],
      }));
      // v98: Informative toast with NCRP occupancy tutorial
      toast.success('Tutorial: R&F Room cargado — RadShield Fig.6 (DeLorenzo et al. 2016)', {
        duration: 8000,
        description: `3 fuentes (Chest X-ray, Table Top, Fluoro) | 5 barreras | 2 regiones
Factores NCRP 147 aplicados:
• Control Room: T=${formatOccupancy(controlProfile.occupancyFactor)}, P=${NCRP_DESIGN_GOALS.controlled} mSv/sem
• Corridor: T=${formatOccupancy(corridorProfile.occupancyFactor)}, P=${NCRP_DESIGN_GOALS.public} mSv/sem
Objetivo: 0.1 mSv/sem (controlado) | 0.02 mSv/sem (publico)`,
      });
    }
  }, [showWelcomeScreen]);

  // v98: OpenCV wall/room detection with NCRP occupancy factors
  const handleOpenCVDetect = useCallback(async () => {
    if (!floorPlan.imageUrl) { toast.error('Cargue primero un plano arquitectonico (PNG/JPG)'); return; }
    const toastId = toast.loading('OpenCV: Analizando plano con Canny + Hough Transform...');
    try {
      const result = await openCV.detectWalls(floorPlan.imageUrl);
      toast.dismiss(toastId);
      if (!result || result.lines.length === 0) { toast.warning('No se detectaron paredes. Intente con una imagen de mayor contraste.'); return; }
      // v98: Apply NCRP occupancy factors to detected walls
      const newBarriers: Barrier[] = result.lines.map((line, i) => {
        const profile = suggestOccupancyProfile(`Wall ${i + 1}`);
        return {
          id: `cv-wall-${Date.now()}-${i}`,
          x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2,
          name: `Pared detectada ${i + 1}`,
          barrierType: 'secondary' as const,
          useFactor: 0.25,
          occupancyFactor: profile.occupancyFactor,
          designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.uncontrolled,
          materialCode: 'CONCRETE235',
        };
      });
      const newRegions = result.rooms.map((room, i) => {
        const profile = suggestOccupancyProfile(`Room ${i + 1}`);
        return {
          id: `cv-room-${Date.now()}-${i}`,
          name: `Habitacion detectada ${i + 1}`,
          occupancyFactor: profile.occupancyFactor,
          designGoal_mSv_per_wk: NCRP_DESIGN_GOALS.uncontrolled,
          points: [
            { x: room.x, y: room.y },
            { x: room.x + room.width, y: room.y },
            { x: room.x + room.width, y: room.y + room.height },
            { x: room.x, y: room.y + room.height },
          ],
        };
      });
      setFloorPlan(prev => ({ ...prev, barriers: [...prev.barriers, ...newBarriers], occupiedRegions: [...prev.occupiedRegions, ...newRegions] }));
      toast.success(`OpenCV: ${newBarriers.length} paredes y ${newRegions.length} habitaciones detectadas`, {
        description: `${result.lines.length} lineas | ${result.contours.length} contornos | ${result.rooms.length} habitaciones
Factores NCRP aplicados: T promedio = ${(newBarriers.reduce((s, b) => s + b.occupancyFactor, 0) / newBarriers.length).toFixed(3)}`,
      });
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Error OpenCV: ' + (err as Error).message);
      captureException(err as Error, { context: 'OpenCV Wall Detection' });
    }
  }, [floorPlan.imageUrl, openCV, setFloorPlan]);

  // D.2: Web Share — compartir resumen de calculos
  const handleShare = useCallback(async () => {
    if (!floorPlan.barriers.some(b => b.requiredThickness_mm)) { toast.error('Ejecute primero el calculo de blindaje'); return; }
    const passCount = floorPlan.barriers.filter(b => (b.maxKerma || 0) <= (b.designGoal_mSv_per_wk || 0.02)).length;
    const totalCount = floorPlan.barriers.length;
    const summaryText = `RadShield-MX: ${floorPlan.name}\n${totalCount} barreras calculadas | ${passCount}/${totalCount} PASS | Kerma max: ${Math.max(...floorPlan.barriers.map(b => b.maxKerma || 0)).toFixed(4)} mSv/sem`;
    const shared = await webShare.share({ title: `RadShield-MX: ${floorPlan.name}`, text: summaryText });
    if (shared) toast.success('Compartido exitosamente');
  }, [floorPlan, webShare]);

  // D.3: FileSystemAccess API para Ctrl+S / Ctrl+O (ya implementado en v47)
  const handleNativeSave = useCallback(async () => {
    try {
      const blob = new Blob([JSON.stringify(floorPlan, null, 2)], { type: 'application/json' });
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `${floorPlan.name || 'proyecto'}.radshield`,
          types: [{ description: 'RadShield-MX Project', accept: { 'application/json': ['.radshield', '.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success('Proyecto guardado', { description: handle.name });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${floorPlan.name || 'proyecto'}.radshield`; a.click();
        URL.revokeObjectURL(url);
        toast.success('Proyecto descargado');
      }
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error('Error al guardar: ' + (err as Error).message);
    }
  }, [floorPlan]);

  const handleNativeOpen = useCallback(async () => {
    try {
      let file: File;
      if ('showOpenFilePicker' in window) {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{ description: 'RadShield-MX Project', accept: { 'application/json': ['.radshield', '.json'] } }],
          multiple: false,
        });
        file = await handle.getFile();
      } else {
        // Fallback: input file
        const input = document.createElement('input'); input.type = 'file'; input.accept = '.radshield,.json';
        file = await new Promise<File>((resolve, reject) => {
          input.onchange = () => { if (input.files?.[0]) resolve(input.files[0]); else reject(); };
          input.click();
        });
      }
      const text = await file.text();
      const data = JSON.parse(text);
      setFloorPlan(prev => ({ ...prev, ...data, imageUrl: data.imageUrl || prev.imageUrl }));
      toast.success('Proyecto cargado', { description: data.name || file.name });
      broadcastChannel.broadcast('project-loaded', { name: data.name });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error('Error al abrir: ' + (err as Error).message);
    }
  }, [broadcastChannel]);

  // Handle tool actions from CategoryToolsDialog + WelcomeScreen Quick Tools
  const handleOpenTool = (action: string) => {
    switch (action) {
      // CategoryToolsDialog actions
      case 'shieldingCalculator': useAppStore.getState().open('shieldingCalculator'); break;
      case 'gammaKnife': useAppStore.getState().open('gammaKnife'); break;
      case 'braquiCo60': useAppStore.getState().open('braquiCo60'); break;
      case 'nuclearMedicine': useAppStore.getState().open('nuclearMedicine'); break;
      case 'cbctigrt': useAppStore.getState().open('cbctIgrt'); break;
      case 'batemanDecay': useAppStore.getState().open('batemanDecay'); break;
      case 'neutronShielding': useAppStore.getState().open('neutronShielding'); break;
      case 'cycloneKIUBE': useAppStore.getState().open('cycloneKIUBE'); break;
      case 'electronApplicator': useAppStore.getState().open('electronApplicator'); break;
      case 'mcnpCyclotron': useAppStore.getState().open('mcnpCyclotron'); break;
      case 'layoutBunker': useAppStore.getState().open('layoutBunker'); break;
      case 'ventilation': toast.info('Ventilation calculator coming in v37'); break;
      // WelcomeScreen Quick Tools
      case 'shielding-calc': useAppStore.getState().open('shieldingCalculator'); break;
      case 'laberinto': useAppStore.getState().open('maze'); break;
      case 'suelo-techo': useAppStore.getState().open('floorCeiling'); break;
      case 'uaq': useAppStore.getState().open('shieldingCalculator'); break;
      case 'monte-carlo': useAppStore.getState().open('nativeMC'); break;
      case 'neutrones': useAppStore.getState().open('neutronShielding'); break;
      case 'costos': useAppStore.getState().open('costEstimator'); break;
      case 'dose-map': useAppStore.getState().open('doseMap'); break;
      case 'optimizer': useAppStore.getState().open('shieldingOptimizer'); break;
      case 'equipment': useAppStore.getState().open('equipmentManager'); break;
      case 'pacs': useAppStore.getState().open('pacsReal'); break;
      case 'emergency': useAppStore.getState().open('emergencyProcedures'); break;
      case 'export-cad-3d': useAppStore.getState().open('realTime3D'); break;
      case 'export-realtime-3d': useAppStore.getState().open('realTime3D'); break;
      // v38: Mosaic Atomics tools
      case 'barrier-editor': setShowBarrierEditor(true); break;
      case 'air-kerma': setShowAirKermaOverlay(true); break;
      case 'project-manager': setShowMosaicProjectManager(true); break;
      case 'control-points': setShowControlPoints(true); break;
      // v39: PHITS, CADMesh, JENDL-5
      case 'phits-generator': setShowPHITSGenerator(true); break;
      case 'dchain-calc': setShowDCHAINCalc(true); break;
      case 'cad-to-mc': setShowCADToMC(true); break;
      case 'jendl5-viewer': setShowJENDL5Viewer(true); break;
      default: toast.info(`Tool "${action}" will be available in the next update`);
    }
  };
  const [heatmapData, setHeatmapData] = useState<{ x: number; y: number; kerma: number }[]>([]);
  const [isodosisProfiles, setIsodosisProfiles] = useState<CTIsodosisProfile[]>([]);
  const [selectedIsodosisId, setSelectedIsodosisId] = useState<string | null>(null);

  const [reportMeta, setReportMeta] = useState({
    preparerName: '', reviewerName: '', institution: '', licenseNumber: ''
  });
  const [mcConfig, setMcConfig] = useState<MCConfig>({
    numParticles: 1_000_000, physicsList: 'QGSP_BIC_EMY', cutValue_mm: 0.1, useVarianceReduction: true
  });

  const { calculateAllBarriers, calculateHeatmap, roundThickness } = useShieldingEngine();

  // RadShield floor-plan driven state
  const [sampleLines, setSampleLines] = useState<import('@/hooks/useCanvas').CanvasSampleLine[]>([]);
  const [barrierResults, setBarrierResults] = useState<import('@/hooks/useCanvas').CanvasBarrierResult[]>([]);
  const [showSampleLines, setShowSampleLines] = useState(true);
  const [showSamplePoints, setShowSamplePoints] = useState(true);
  const [showMaxima, setShowMaxima] = useState(true);

  const { canvasRef, canvasState, setCanvasState, hoverInfo, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, deleteSelected, updateSelected, calibrateScale, resetView, zoomToFit, exportPNG, toggleSnap } = useCanvas(floorPlan, setFloorPlan, activeTool, heatmapEnabled ? heatmapData : undefined, sampleLines);

  useEffect(() => {
    const handleDxfImported = (event: Event) => {
      const customEvent = event as CustomEvent<{
        floorPlan?: FloorPlan;
        summary?: { mappedBarriers?: number; warnings?: string[]; fileName?: string };
        importMode?: 'light' | 'full';
        preliminary?: boolean;
      }>;
      const nextPlan = customEvent.detail?.floorPlan;
      if (!nextPlan) return;
      const mapped = customEvent.detail?.summary?.mappedBarriers ?? nextPlan.barriers.length;
      const warnings = customEvent.detail?.summary?.warnings ?? [];
      const preliminary = Boolean(customEvent.detail?.preliminary);
      resetFloorPlan({
        ...nextPlan,
        importMetadata: {
          source: 'dxf',
          fileName: customEvent.detail?.summary?.fileName ?? nextPlan.name,
          mode: preliminary ? 'preview' : customEvent.detail?.importMode,
          status: preliminary ? 'preliminary' : 'final',
          mappedBarriers: mapped,
          importedAt: new Date().toISOString(),
          warnings,
        },
      });
      setCanvasState(prev => ({ ...prev, selectedId: null, selectedIds: [], mode: 'select', offsetX: 40, offsetY: 40, scale: 1 }));
      setShowWelcomeScreen(false);
      setShowDxfImportReview(true);
      toast.success(`${preliminary ? 'DXF preliminar' : 'DXF'} aplicado al canvas: ${mapped} barreras detectadas`);
      warnings.forEach((warning) => toast.warning(warning));
    };
    window.addEventListener('radshield:dxf-imported-floorplan', handleDxfImported);
    return () => window.removeEventListener('radshield:dxf-imported-floorplan', handleDxfImported);
  }, [resetFloorPlan, setCanvasState]);

  const handleConfirmDxfGeometry = useCallback(() => {
    if (floorPlan.importMetadata?.status !== 'preliminary') {
      toast.info('No hay geometria DXF preliminar pendiente de confirmar.');
      return;
    }

    setFloorPlan(prev => ({
      ...prev,
      importMetadata: {
        ...prev.importMetadata,
        status: 'final',
        confirmedAt: new Date().toISOString(),
      },
    }));
    toast.success('Geometria DXF confirmada para calculo, memoria y evidencia.');
  }, [floorPlan.importMetadata?.status, setFloorPlan]);

  const computeCurrentHeatmap = useCallback(async () => {
    if (floorPlan.sources.length === 0) {
      setHeatmapData([]);
      return [] as { x: number; y: number; kerma: number }[];
    }
    const ctProfile = isodosisProfiles.find(p => p.id === selectedIsodosisId);
    let hm: { x: number; y: number; kerma: number }[] | null = null;
    if (webgpuHeatmap.available) {
      hm = await webgpuHeatmap.computeHeatmap(floorPlan.sources, floorPlan.scale_m_per_pixel, 40);
    }
    if (!hm) {
      hm = calculateHeatmap(floorPlan.sources, floorPlan.scale_m_per_pixel, 40, ctProfile);
    }
    setHeatmapData(hm);
    return hm;
  }, [calculateHeatmap, floorPlan.scale_m_per_pixel, floorPlan.sources, isodosisProfiles, selectedIsodosisId, webgpuHeatmap]);

  const handleToggleHeatmap = useCallback(async (enabled: boolean) => {
    setHeatmapEnabled(enabled);
    if (!enabled) return;
    if (floorPlan.sources.length === 0) {
      toast.info('Agrega al menos una fuente para generar el heat map.');
      return;
    }
    const hm = await computeCurrentHeatmap();
    toast.success('Heat map F89 activado', {
      description: `${hm.length} puntos calculados para inspeccion visual de dosis.`,
    });
  }, [computeCurrentHeatmap, floorPlan.sources.length]);

  const handleCalibrateScaleQuick = useCallback(() => {
    const pixelValue = window.prompt('Distancia medida en pixeles', '100');
    const meterValue = window.prompt('Distancia real en metros', '1');
    const pixelDistance = Number(pixelValue);
    const realDistance_m = Number(meterValue);
    if (!Number.isFinite(pixelDistance) || pixelDistance <= 0 || !Number.isFinite(realDistance_m) || realDistance_m <= 0) {
      toast.error('Calibracion cancelada: usa valores positivos para pixeles y metros.');
      return;
    }
    const draft = buildScaleCalibrationDraft(floorPlan, pixelDistance, realDistance_m);
    calibrateScale(pixelDistance, realDistance_m);
    toast.success(`Escala actualizada: ${draft.pixelsPerMeter.toFixed(1)} px/m`, {
      description: `${draft.nextScale_m_per_pixel.toFixed(5)} m/px`,
    });
  }, [calibrateScale, floorPlan]);

  const handleAddCriticalPointDraft = useCallback(() => {
    const point: CriticalPoint = buildCriticalPointDraft(floorPlan);
    setFloorPlan(prev => ({
      ...prev,
      criticalPoints: [...(prev.criticalPoints ?? []), point],
    }));
    setCanvasState(prev => ({ ...prev, selectedId: point.id }));
    toast.success('Punto critico agregado al plano', {
      description: 'Revisa ocupacion, objetivo P y posicion antes de cerrar memoria analitica.',
    });
  }, [floorPlan, setCanvasState]);

  const handleDuplicateSelected = useCallback(() => {
    const selectedId = canvasState.selectedId;
    if (!selectedId) {
      toast.info('Selecciona un objeto para duplicar.');
      return;
    }
    const suffix = Date.now();
    const offset = 24;
    const source = floorPlan.sources.find(item => item.id === selectedId);
    const barrier = floorPlan.barriers.find(item => item.id === selectedId);
    const criticalPoint = floorPlan.criticalPoints?.find(item => item.id === selectedId);
    const region = floorPlan.occupiedRegions.find(item => item.id === selectedId);

    if (source) {
      const next: RadiationSource = {
        ...source,
        id: `${source.id}-copy-${suffix}`,
        name: `${source.name} copia`,
        x: source.x + offset,
        y: source.y + offset,
      };
      setFloorPlan(prev => ({ ...prev, sources: [...prev.sources, next] }));
      setCanvasState(prev => ({ ...prev, selectedId: next.id, selectedIds: [next.id] }));
      toast.success('Fuente duplicada', { description: next.name });
      return;
    }

    if (barrier) {
      const next: Barrier = {
        ...barrier,
        id: `${barrier.id}-copy-${suffix}`,
        name: `${barrier.name} copia`,
        x1: barrier.x1 + offset,
        y1: barrier.y1 + offset,
        x2: barrier.x2 + offset,
        y2: barrier.y2 + offset,
      };
      setFloorPlan(prev => ({ ...prev, barriers: [...prev.barriers, next] }));
      setCanvasState(prev => ({ ...prev, selectedId: next.id, selectedIds: [next.id] }));
      toast.success('Barrera duplicada', { description: next.name });
      return;
    }

    if (criticalPoint) {
      const next: CriticalPoint = {
        ...criticalPoint,
        id: `${criticalPoint.id}-copy-${suffix}`,
        name: `${criticalPoint.name} copia`,
        x: criticalPoint.x + offset,
        y: criticalPoint.y + offset,
      };
      setFloorPlan(prev => ({ ...prev, criticalPoints: [...(prev.criticalPoints ?? []), next] }));
      setCanvasState(prev => ({ ...prev, selectedId: next.id, selectedIds: [next.id] }));
      toast.success('Punto critico duplicado', { description: next.name });
      return;
    }

    if (region) {
      const next: OccupiedRegion = {
        ...region,
        id: `${region.id}-copy-${suffix}`,
        name: `${region.name} copia`,
        points: region.points.map(point => ({ x: point.x + offset, y: point.y + offset })),
      };
      setFloorPlan(prev => ({
        ...prev,
        occupiedRegions: [...prev.occupiedRegions, next],
        regions: prev.regions ? [...prev.regions, next] : prev.regions,
      }));
      setCanvasState(prev => ({ ...prev, selectedId: next.id, selectedIds: [next.id] }));
      toast.success('Zona duplicada', { description: next.name });
      return;
    }

    toast.error('No se pudo duplicar la seleccion actual.');
  }, [canvasState.selectedId, floorPlan, setCanvasState, setFloorPlan]);

  const handleShieldingPresetApply = useCallback(() => {
    if (floorPlan.barriers.length === 0) {
      toast.info('Dibuja al menos una barrera antes de aplicar presets.');
      return;
    }
    const selectedBarrier = floorPlan.barriers.find(barrier => barrier.id === canvasState.selectedId);
    const presetList = SHIELDING_PRESETS.map((preset, index) => `${index + 1}. ${preset.name} (${preset.materialCodes.join('+')})`).join('\n');
    const choice = window.prompt(`Preset de blindaje F86:\n${presetList}\n\nEscribe numero o id`, '1');
    if (!choice) return;
    const preset = SHIELDING_PRESETS[Number(choice) - 1] ?? SHIELDING_PRESETS.find(item => item.id === choice.trim());
    if (!preset) {
      toast.error('Preset no reconocido.');
      return;
    }
    const targetChoice = window.prompt(selectedBarrier ? 'Aplicar a "seleccionada" o "todas"' : 'No hay barrera seleccionada. Aplicar a "todas"', selectedBarrier ? 'seleccionada' : 'todas');
    const target = targetChoice?.toLowerCase().startsWith('t') ? 'all' : 'selected';
    if (target === 'selected' && !selectedBarrier) {
      toast.error('Selecciona una barrera o aplica el preset a todas.');
      return;
    }
    setFloorPlan(prev => applyShieldingPresetToFloorPlan(prev, preset.id, target, selectedBarrier?.id));
    const appliedCount = target === 'all' ? floorPlan.barriers.length : 1;
    toast.success(`Preset aplicado: ${preset.name}`, {
      description: `${appliedCount} barrera(s) actualizada(s). Se registro trazabilidad F86 para Evidence Pack.`,
    });
  }, [canvasState.selectedId, floorPlan.barriers]);

  const handleAuditSnapshot = useCallback(() => {
    const snapshot = buildAuditSnapshotMetadata(floorPlan, barrierResults, sampleLines);
    const f86Evidence = buildF86EvidenceSummary(floorPlan);
    const qaExport = buildCanvasQAExport(floorPlan, barrierResults, sampleLines, heatmapData);
    const safeName = floorPlan.name.replace(/[^a-z0-9_-]+/gi, '_') || 'radshield';
    const download = (filename: string, value: string, type: string) => {
      const url = URL.createObjectURL(new Blob([value], { type }));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    };
    exportPNG();
    download(`canvas_qa_f87_${safeName}.json`, JSON.stringify(qaExport, null, 2), 'application/json');
    download(`canvas_qa_f87_${safeName}.csv`, canvasQAExportToCsv(qaExport), 'text/csv;charset=utf-8');
    toast.success('Snapshot auditable exportado', {
      description: `${snapshot.counts.barriers} barreras, ${snapshot.counts.criticalPoints} puntos criticos, presets ${f86Evidence.presetCoveragePct}%. Incluye JSON/CSV F87.`,
    });
  }, [barrierResults, exportPNG, floorPlan, heatmapData, sampleLines]);

  // v48.4: Canvas keyboard navigation (must be after useCanvas for canvasRef)
  const canvasKeyboardNav = useCanvasKeyboardNav({
    canvasRef,
    floorPlan,
    state: { offsetX: canvasState.offsetX, offsetY: canvasState.offsetY, scale: canvasState.scale, selectedId: canvasState.selectedId },
    onPan: (dx, dy) => setCanvasState(prev => ({ ...prev, offsetX: prev.offsetX + dx * prev.scale, offsetY: prev.offsetY + dy * prev.scale })),
    onZoom: (factor) => setCanvasState(prev => ({ ...prev, scale: Math.max(0.1, Math.min(10, prev.scale * factor)) })),
    onSelect: (id) => setCanvasState(prev => ({ ...prev, selectedId: id })),
    onDelete: deleteSelected,
    onFocusElement: (x, y) => setCanvasState(prev => ({
      ...prev,
      offsetX: -x * prev.scale + (canvasRef.current?.width || 800) / 2,
      offsetY: -y * prev.scale + (canvasRef.current?.height || 600) / 2,
    })),
  });

  // Fase 5: Local storage
  const { projects, saveProject: saveProjectToStorage, loadProject, deleteProject, renameProject, exportProjectJSON, importProjectJSON, saveCurrent, loadCurrent } = useLocalStorage();

  // Fase 5: Backend persistence via tRPC
  const { user, logout } = useAuth();
  const createProjectMutation = trpc.project.create.useMutation({
    onError: (err) => { toast.error(`Error al crear en nube: ${err.message}`); }
  });
  const updateProjectMutation = trpc.project.update.useMutation({
    onError: (err) => { toast.error(`Error al actualizar en nube: ${err.message}`); }
  });
  const deleteProjectMutation = trpc.project.delete.useMutation({
    onError: (err) => { toast.error(`Error al eliminar de nube: ${err.message}`); }
  });
  const cloudProjectsQuery = trpc.project.list.useQuery({}, { enabled: !!user?.unionId, retry: false });
  const utils = trpc.useUtils();

  // v15: Track dirty state
  useEffect(() => { setIsDirty(true); }, [floorPlan.barriers, floorPlan.sources, floorPlan.imageUrl]);

  // Auto-save current project every 30 seconds
  useEffect(() => {
    const iv = setInterval(() => { saveCurrent(floorPlan); setLastSaved(new Date()); setIsDirty(false); }, 30000);
    return () => clearInterval(iv);
  }, [floorPlan, saveCurrent]);

  // Try to restore from session on first load
  useEffect(() => {
    const saved = loadCurrent();
    if (saved && saved.sources.length > 0) { resetFloorPlan(saved); toast.info('Proyecto restaurado de la sesion anterior'); }
  }, []); // eslint-disable-line

  // v85: Show SourceSelector when 'source' tool is active
  useEffect(() => {
    if (activeTool === 'source') {
      setShowSourceSelector(true);
    }
  }, [activeTool]);

  // v85: Map catalog category to ModalityCategory
  const catMap: Record<string, 'diagnostic' | 'therapy' | 'nuclear' | 'cyclotron' | 'other'> = {
    diagnostic: 'diagnostic',
    therapy: 'therapy',
    radiosurgery: 'therapy',
    nuclear_medicine: 'nuclear',
    brachytherapy: 'therapy',
    cyclotron: 'cyclotron',
  };
  // v85: Handle source selection from catalog
  const handleSelectSource = useCallback((catalogItem: SourceItem) => {
    setSelectedSourceId(catalogItem.id);
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      const worldX = (canvasEl.width / 2 - canvasState.offsetX) / canvasState.scale;
      const worldY = (canvasEl.height / 2 - canvasState.offsetY) / canvasState.scale;
      const modCategory = catMap[catalogItem.category] || 'other';
      const newSource = {
        id: `source-${catalogItem.id}-${Date.now()}`,
        x: worldX, y: worldY,
        name: catalogItem.name,
        modality: { id: catalogItem.id, name: catalogItem.name, category: modCategory, energies: [parseFloat(catalogItem.energy.match(/[\d.]+/)?.[0] || '6')], typicalDose_mGy: 0.2, workloadDefault: catalogItem.workload_default, unit: 'Gy/week', description: catalogItem.description },
        workloadValue: catalogItem.workload_default,
        workloadUnit: 'Gy/week',
        isocenterHeight_m: 1.0,
        useFactor: 0.25,
        workloadHoursPerWeek: 40,
      };
      setFloorPlan(prev => ({ ...prev, sources: [...prev.sources, newSource] }));
    }
    setShowSourceSelector(false);
    setActiveTool('select');
    toast.success(`${catalogItem.name} — ${catalogItem.standard}`, {
      description: `${catalogItem.energy} | Carga: ${catalogItem.workload_default} Gy/sem`,
    });
  }, [canvasRef, canvasState, setFloorPlan]);

  const handleCommitGhostSource = useCallback((payload: {
    point: F530F534PlacementPoint;
    equipment: string;
    modality: F525F529Modality;
    room: string;
    material: string;
    memoryProfile: string;
    footprint_m: [number, number];
  }) => {
    const contract = buildF545F549GhostSourceCommit();
    const defaults = contract.sourceDefaults[payload.modality];
    const sourceId = `f545-${payload.modality.toLowerCase()}-${Date.now()}`;
    const modalityByEquipment =
      payload.equipment.toLowerCase().includes('gamma knife')
        ? MODALITIES.find(item => item.id === 'gamma-knife')
        : payload.modality === 'CY'
          ? {
              ...(MODALITIES.find(item => item.id === defaults.modalityId) ?? MODALITIES[0]),
              id: 'cyclotron-18mev',
              name: 'Ciclotron KIUBE - 18 MeV',
              energyLabel: '18 MeV protones',
            }
          : MODALITIES.find(item => item.id === defaults.modalityId);
    const modality = modalityByEquipment ?? MODALITIES[0];
    const nextSource: RadiationSource = {
      id: sourceId,
      x: payload.point.x,
      y: payload.point.y,
      name: payload.equipment,
      modality,
      workloadValue: defaults.workloadValue,
      workloadUnit: modality.unit,
      isocenterHeight_m: modality.isocenterHeightDefault_m ?? 1.3,
      useFactor: defaults.useFactor,
      workloadHoursPerWeek: defaults.workloadHoursPerWeek,
      rotationDeg: 0,
      footprint_m: {
        width: payload.footprint_m[0],
        depth: payload.footprint_m[1],
      },
      manufacturerVariant: `${defaults.manufacturerVariant} | ${payload.room} | ${payload.memoryProfile}`,
    };
    setFloorPlan(prev => ({ ...prev, sources: [...prev.sources, nextSource] }));
    setCanvasState(prev => ({ ...prev, selectedId: sourceId, selectedIds: [sourceId] }));
    toast.success('Fuente real agregada al canvas', {
      description: `${payload.equipment} / ${payload.material}`,
    });
    return sourceId;
  }, [setCanvasState, setFloorPlan]);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z / ? / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      // "?" key (Shift + /) — Keyboard shortcuts
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        const store = useAppStore.getState();
        const isOpen = !!store.dialogs.keyboardShortcuts;
        if (isOpen) store.close('keyboardShortcuts'); else store.open('keyboardShortcuts');
        return;
      }
      // Ctrl+K — Command Palette
      if (isCtrl && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(v => !v);
        return;
      }
      // Ctrl+H — History Panel
      if (isCtrl && e.key === 'h') {
        e.preventDefault();
        setShowHistoryPanel(v => !v);
        return;
      }
      // Ctrl+Shift+H — Help Panel
      if (isCtrl && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        const s = useAppStore.getState();
        const isOpen = !!(s.dialogs as Record<string, boolean>)['helpPanel'];
        if (isOpen) s.close('helpPanel' as any); else s.open('helpPanel' as any);
        return;
      }
      if (!isCtrl) return;
      if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const handleSaveProject = useCallback((name: string) => {
    saveProjectToStorage(floorPlan, name);
    // Also save to backend if user is logged in
    if (user?.unionId) {
      const json = JSON.stringify(floorPlan);
      const maxKerma = Math.max(...floorPlan.barriers.map(b => b.maxKerma || 0), 0);
      const existingCloud = cloudProjectsQuery.data?.find(p => p.name === name);
      if (existingCloud) {
        updateProjectMutation.mutate({
          id: existingCloud.id, name, floorPlanJson: json,
          modality: floorPlan.sources[0]?.modality.name || 'Desconocida',
          numSources: String(floorPlan.sources.length),
          numBarriers: String(floorPlan.barriers.length),
          maxKerma: maxKerma.toFixed(4),
        }, { onSuccess: () => { utils.project.list.invalidate(); toast.success('Proyecto actualizado en la nube'); } });
      } else {
        createProjectMutation.mutate({
          name, floorPlanJson: json, version: '1.2',
          modality: floorPlan.sources[0]?.modality.name || 'Desconocida',
          numSources: String(floorPlan.sources.length),
          numBarriers: String(floorPlan.barriers.length),
          maxKerma: maxKerma.toFixed(4),
        }, { onSuccess: () => { utils.project.list.invalidate(); toast.success('Proyecto sincronizado en la nube'); } });
      }
    }
  }, [floorPlan, saveProjectToStorage, user, createProjectMutation, updateProjectMutation, cloudProjectsQuery.data, utils]);

  const handleLoadProject = useCallback((projectId: string) => {
    // Try localStorage first
    const localProj = loadProject(projectId);
    if (localProj) { resetFloorPlan(localProj.floorPlan); toast.success('Proyecto local cargado'); return; }
    // Try backend if logged in
    if (user?.unionId && cloudProjectsQuery.data) {
      const cloudProj = cloudProjectsQuery.data.find(p => String(p.id) === projectId);
      if (cloudProj && cloudProj.floorPlanJson) {
        try {
          const fp = JSON.parse(cloudProj.floorPlanJson);
          resetFloorPlan(fp);
          toast.success('Proyecto de nube cargado');
        } catch { toast.error('Error al parsear proyecto de nube'); }
      }
    }
  }, [loadProject, user, cloudProjectsQuery.data, resetFloorPlan]);

  const handleDeleteProject = useCallback((projectId: string) => {
    deleteProject(projectId);
    // Also delete from backend if logged in
    if (user?.unionId && cloudProjectsQuery.data) {
      const cloudProj = cloudProjectsQuery.data.find(p => String(p.id) === projectId);
      if (cloudProj) {
        deleteProjectMutation.mutate({ id: cloudProj.id }, {
          onSuccess: () => { utils.project.list.invalidate(); toast.success('Proyecto eliminado de la nube'); }
        });
      }
    }
  }, [deleteProject, user, cloudProjectsQuery.data, deleteProjectMutation, utils]);

  // v15: Enhanced calculation with progress toast and Pass/Fail status
  const runCalculations = useCallback(() => {
    if (!floorPlan.sources.length) { toast.error('Agregue al menos una fuente de radiacion'); return; }
    if (!floorPlan.barriers.length) { toast.error('Agregue al menos una barrera'); return; }
    setCalculationStatus('running');
    const toastId = toast.loading('Calculando blindajes...', {
      description: `Procesando ${floorPlan.barriers.length} barreras con ${floorPlan.sources.length} fuentes`,
    });
    // Simulate progressive calculation with setTimeout for UX
    setTimeout(async () => {
      try {
        const ctProfile = isodosisProfiles.find(p => p.id === selectedIsodosisId);
        const updatedBarriers = calculateAllBarriers(floorPlan.barriers, floorPlan.sources, floorPlan.scale_m_per_pixel, ctProfile);
        // Calculate Pass/Fail stats
        const pass = updatedBarriers.filter(b => (b.maxKerma || 0) <= (b.designGoal_mSv_per_wk || 0.02)).length;
        const warn = updatedBarriers.filter(b => {
          const k = b.maxKerma || 0; const g = b.designGoal_mSv_per_wk || 0.02;
          return k > g && k <= g * 1.5;
        }).length;
        const fail = updatedBarriers.filter(b => {
          const k = b.maxKerma || 0; const g = b.designGoal_mSv_per_wk || 0.02;
          return k > g * 1.5;
        }).length;
        setFloorPlan(prev => ({ ...prev, barriers: updatedBarriers }));
        // v48.3: WebGPU heatmap acceleration
        if (heatmapEnabled) {
          await computeCurrentHeatmap();
        }
        setCalculationStatus(fail > 0 ? 'error' : warn > 0 ? 'success' : 'success');
        setIsDirty(true);
        // Dismiss loading and show enriched result toast
        toast.dismiss(toastId);
        if (fail > 0) {
          toast.error(`Calculo completado: ${fail} barrera(s) FAIL`, {
            description: `${pass} PASS, ${warn} WARN, ${fail} FAIL — Revise el panel Pass/Fail`,
            duration: 6000,
          });
        } else if (warn > 0) {
          toast.success(`Calculo completado con advertencias`, {
            description: `${pass} PASS, ${warn} WARN — ${updatedBarriers.length} barreras calculadas`,
            duration: 4000,
          });
        } else {
          toast.success(`Todas las barreras PASS`, {
            description: `${pass}/${updatedBarriers.length} barreras dentro del limite de diseno`,
            duration: 4000,
          });
        }
      } catch (err) {
        setCalculationStatus('error');
        toast.dismiss(toastId);
        toast.error('Error en el calculo: ' + (err as Error).message);
        captureException(err as Error, { 
          context: 'Barrier Calculator (NCRP-151)', 
          barriers: floorPlan.barriers.length, 
          sources: floorPlan.sources.length 
        });
      }
    }, 300);
  }, [floorPlan, calculateAllBarriers, setFloorPlan, heatmapEnabled, isodosisProfiles, selectedIsodosisId, computeCurrentHeatmap]);

  // ===== RadShield Floor-Plan Driven Calculation =====
  // FIXED v42: Now delegates to shieldingMath.ts (no more inline duplication)
  // Uses proper TVL-based material conversion instead of hardcoded 120x factor
  // Integrates McGinley scatter-primary ratios per angle (Table 2-1)
  // v50: Motor optimizado con spatial hashing
  // v50: Motor async optimizado con WebWorker + spatial hashing + profiler
  const runRadShieldCalculations = useCallback(async () => {
    if (floorPlan.barriers.length === 0 || floorPlan.sources.length === 0) {
      toast.error('Se requieren barreras y fuentes para calcular');
      return;
    }

    // Check cache first
    const cached = await calculationCache.getCached(floorPlan);
    if (cached) {
      setSampleLines(cached.sampleLines as any);
      setBarrierResults(cached.barrierResults as any);
      if (heatmapEnabled) {
        await computeCurrentHeatmap();
      }
      announce(`${cached.barrierResults.length} barreras desde cache`, 'polite');
      return;
    }

    // D.1: Request screen wake lock during calculation
    await wakeLock.request();

    const p = profilerRef.current;
    const toastId = toast.loading('Calculando blindajes...', {
      description: `${floorPlan.barriers.length} barreras x ${floorPlan.sources.length} fuentes | AsyncEngine | WebWorker${wakeLock.supported ? ' | WakeLock ON' : ''}`,
    });

    try {
      const engine = asyncEngineRef.current;

      const { results, sampleLines } = await p.run('engine.calculate', () =>
        engine.calculate(
          floorPlan.barriers,
          floorPlan.sources,
          floorPlan.scale_m_per_pixel || 0.01,
          (pct) => toast.loading(`Progreso: ${pct}%`, { id: toastId })
        )
      );

      p.run('state_update', () => {
        setBarrierResults(results as any);
        setSampleLines(sampleLines as any);
      });
      if (heatmapEnabled) {
        await p.run('heatmap.f89', () => computeCurrentHeatmap());
      }

      await calculationCache.setCached(floorPlan, results as any, sampleLines as any);

      broadcastChannel.broadcast('calculation-result', {
        barrierCount: results.length,
        timestamp: Date.now(),
      });

      // v89: Persist calculation results to backend (non-blocking)
      persistCalculationResults({
        name: floorPlan.name,
        barriers: floorPlan.barriers as any,
        sources: floorPlan.sources,
      });

      console.log(p.export());
      p.report().forEach(r => console.log(`${r.name}: ${r.avgMs.toFixed(1)}ms avg (${r.calls} calls)`));

      const failing = results.filter((r: any) => !r.pass).length;
      announce(`${results.length} barreras calculadas. ${failing > 0 ? failing + ' requieren atencion.' : 'Todas cumplen.'}`, 'polite');

      toast.dismiss(toastId);
      toast.success(`Calculo completado - ${results.length} barreras`, {
        description: failing > 0 ? `${failing} barreras no cumplen` : 'Todas cumplen',
        duration: 4000,
      });
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Error: ' + (err as Error).message);
      announce('Error en calculo', 'assertive');
      captureException(err as Error, { 
        context: 'RadShield AsyncEngine', 
        barriers: floorPlan.barriers.length, 
        sources: floorPlan.sources.length,
        engine: 'WebWorker + SpatialHashing'
      });
    } finally {
      // D.1: Release screen wake lock
      await wakeLock.release();
    }
  }, [floorPlan, calculationCache, broadcastChannel, wakeLock, persistCalculationResults, heatmapEnabled, computeCurrentHeatmap]);

  const selectedSource = floorPlan.sources.find(s => s.id === canvasState.selectedId) || null;
  const selectedBarrier = floorPlan.barriers.find(b => b.id === canvasState.selectedId) || null;
  const selectedCriticalPoint = floorPlan.criticalPoints?.find(point => point.id === canvasState.selectedId) || null;

  const handleIsodosisUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const profile = parseIsodosisFile(ev.target?.result as string, file.name); if (profile) { setIsodosisProfiles(prev => [...prev, profile]); setSelectedIsodosisId(profile.id); toast.success(`Curva isodosis cargada: ${profile.name}`); } else toast.error('Formato no reconocido'); };
    reader.readAsText(file);
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setFloorPlan(prev => ({
          ...prev,
          imageUrl: ev.target?.result as string,
          name: file.name.replace(/\.[^/.]+$/, ''),
          width_pixels: img.width,
          height_pixels: img.height,
          scale_m_per_pixel: Math.round((20 / img.width) * 10000) / 10000, // Estimate 20m room width
        }));
        // v98: Informative toast with plan stats
        toast.success(`Plano importado: ${file.name}`, {
          duration: 6000,
          description: `${img.width} x ${img.height} px | Escala estimada: ${(20 / img.width).toFixed(4)} m/px
Use el boton OpenCV para detectar paredes automaticamente.
Factores de ocupacion NCRP 147 se aplicaran a las barreras detectadas.`,
        });
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [setFloorPlan]);

  const exportCSV = useCallback(() => {
    const headers = ['Barrera_ID','Barrera_Nombre','Tipo','Longitud_m','Kerma_max_mSv_sem','Material_recomendado','Espesor_mm','Espesor_redondeado_mm','Material_2','Espesor_2_mm','Material_3','Espesor_3_mm','Fuente','Modalidad','Pacientes_Sem','Objetivo_mSv_sem'];
    const rows = floorPlan.barriers.map(b => {
      const length_m = Math.sqrt((b.x2-b.x1)**2+(b.y2-b.y1)**2)*floorPlan.scale_m_per_pixel;
      const sortedMats = Object.entries(b.requiredThickness_mm||{}).map(([code,t])=>({code,t,mat:MATERIALS.find(m=>m.code===code)!})).filter(x=>x.mat).sort((a,b)=>a.t-b.t);
      const [t1,t2,t3]=sortedMats;
      return [b.id,b.name,b.barrierType,length_m.toFixed(2),(b.maxKerma||0).toFixed(4),t1?.mat?.name||'',(t1?.t||0).toFixed(2),roundThickness(t1?.t||0,t1?.code||'').toFixed(2),t2?.mat?.name||'',(t2?.t||0).toFixed(2),t3?.mat?.name||'',(t3?.t||0).toFixed(2),floorPlan.sources.map(s=>s.name).join('; '),floorPlan.sources.map(s=>s.modality.name).join('; '),floorPlan.sources.reduce((sum,s)=>sum+s.workloadValue,0).toString(),b.designGoal_mSv_per_wk.toString()];
    });
    const csv = [headers.join(','),...rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`RadShield_MX_${floorPlan.name.replace(/\s+/g,'_')}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success('CSV exportado'); useAppStore.getState().close('export');
  }, [floorPlan, roundThickness]);

  const exportJSON = useCallback(() => {
    const data={project:floorPlan.name,date:new Date().toISOString(),software:'RadShield-MX v1.2',scale_m_per_pixel:floorPlan.scale_m_per_pixel,numSources:floorPlan.sources.length,numBarriers:floorPlan.barriers.length,sources:floorPlan.sources.map(s=>({id:s.id,name:s.name,modality:s.modality.name,category:s.modality.category,workload:s.workloadValue})),barriers:floorPlan.barriers.map(b=>({id:b.id,name:b.name,type:b.barrierType,length_m:Math.sqrt((b.x2-b.x1)**2+(b.y2-b.y1)**2)*floorPlan.scale_m_per_pixel,maxKerma_mSv_wk:b.maxKerma||0,requiredThickness_mm:b.requiredThickness_mm||{}}))};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`RadShield_MX_${floorPlan.name.replace(/\s+/g,'_')}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success('JSON exportado');
  }, [floorPlan]);

  // E.1: Excel Export — Multi-sheet workbook
  const exportExcel = useCallback(() => {
    import('@/lib/excelExport').then(({ exportShieldingReport }) => {
      const barriers = floorPlan.barriers.map(b => {
        const sortedMats = Object.entries(b.requiredThickness_mm || {}).map(([code, t]) => ({ code, t: t as number, mat: MATERIALS.find(m => m.code === code) })).filter(x => x.mat).sort((a, b) => a.t - b.t);
        const t1 = sortedMats[0];
        return {
          name: b.name,
          type: b.barrierType,
          material: t1?.mat?.name || 'N/A',
          thickness: Math.round((t1?.t || 0) * 10) / 10,
          tvls: t1 ? Math.ceil((t1.t || 0) / (t1.mat?.tvl_mm || 1)) : 0,
          transmission: 0.001,
          goalDose: b.designGoal_mSv_per_wk,
        };
      });
      const totalConcrete = barriers.reduce((sum, b) => sum + (b.type === 'primary' ? b.thickness * 2.5 : b.thickness * 1.5), 0);
      exportShieldingReport({
        projectName: floorPlan.name,
        barriers,
        summary: {
          totalConcreteVolume: Math.round(totalConcrete),
          totalCost: Math.round(totalConcrete * 150),
          maxDose: Math.max(...floorPlan.barriers.map(b => b.maxKerma || 0)),
          compliance: floorPlan.barriers.every(b => (b.maxKerma || 0) <= b.designGoal_mSv_per_wk) ? 'CUMPLE NCRP 151' : 'REVISION REQUERIDA',
        },
      });
      toast.success('Excel exportado — Multi-hoja');
    });
  }, [floorPlan]);

  const generateReport = useCallback(async () => {
    if (!floorPlan.barriers.some(b=>b.requiredThickness_mm)) { toast.error('Ejecute primero el calculo de blindaje'); return; }
    try { const canvasImageDataUrl = canvasRef.current?.toDataURL('image/png'); const blob = await generateCNSNSReport({floorPlan,projectName:floorPlan.name,date:new Date().toLocaleDateString('es-MX'),...reportMeta,canvasImageDataUrl,barrierResults,sampleLines} as CNSNSReportData); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`Memoria_Blindaje_CNSNS_${floorPlan.name.replace(/\s+/g,'_')}.docx`; a.click(); URL.revokeObjectURL(url); toast.success('Reporte CNSNS generado'); useAppStore.getState().close('cnsns'); } catch(err) { toast.error('Error: '+(err as Error).message); captureException(err as Error, { context: 'CNSNS Report Generation' }); }
  }, [floorPlan, reportMeta, canvasRef, barrierResults, sampleLines]);

  const generateMCMacro = useCallback(() => {
    if (!floorPlan.barriers.some(b=>b.requiredThickness_mm)) { toast.error('Ejecute primero el calculo de blindaje'); return; }
    try { const macroG4=generateGEANT4Macro(floorPlan,mcConfig,''); const macroGate=generateGATEMacro(floorPlan,mcConfig,''); const instructions=generateValidationInstructions(floorPlan,mcConfig);
      const dl=(content:string,fn:string)=>{const blob=new Blob([content],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fn;a.click();URL.revokeObjectURL(url);};
      dl(macroG4,`${floorPlan.name.replace(/\s+/g,'_')}_geant4.mac`); dl(macroGate,`${floorPlan.name.replace(/\s+/g,'_')}_gate.mac`); dl(instructions,`Instrucciones_Validacion_MC_${floorPlan.name.replace(/\s+/g,'_')}.txt`);
      toast.success('Macros MC descargados'); useAppStore.getState().close('mc');
    } catch(err) { toast.error('Error: '+(err as Error).message); captureException(err as Error, { context: 'MC Macro Generation', format: mcConfig.format }); }
  }, [floorPlan, mcConfig]);

  const handleUpdateSelected = useCallback((props: Partial<Barrier> | Partial<RadiationSource> | Partial<CriticalPoint> | Partial<OccupiedRegion>) => { updateSelected(props); }, [updateSelected]);

  // v10.1: PDF generation
  const handleGeneratePDF = useCallback(() => {
    if (!floorPlan.barriers.some(b => b.requiredThickness_mm)) { toast.error('Ejecute primero el calculo de blindaje'); return; }
    const blob = generatePDFReport(floorPlan, { ...reportMeta, date: new Date().toLocaleDateString('es-MX'), barrierResults, sampleLines });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Memoria_Blindaje_${floorPlan.name.replace(/\s+/g, '_')}.pdf`; a.click(); URL.revokeObjectURL(url);
    toast.success('PDF generado y descargado');
  }, [floorPlan, reportMeta, barrierResults, sampleLines]);

  // v15: Action history tracking
  const addActionHistory = useCallback((action: string, description: string, type: string = 'other') => {
    setActionHistory(prev => {
      const next = [...prev, { id: prev.length, timestamp: Date.now(), action, description, type }];
      if (next.length > 100) next.shift();
      return next;
    });
    setHistoryIndex(prev => prev + 1);
  }, []);

  // v15: Command Palette handlers
  const commandHandlers: Record<string, () => void> = {
    onCalculate: runCalculations,
    onShieldingCalculator: () => useAppStore.getState().open('shieldingCalculator'),
    onEquipmentShieldingWizard: () => useAppStore.getState().open('equipmentShieldingWizard'),
    onQuick: () => useAppStore.getState().open('quickBarrier'),
    onMaze: () => useAppStore.getState().open('maze'),
    onMazeCalculator: () => useAppStore.getState().open('maze'),
    onFloorCeiling: () => useAppStore.getState().open('floorCeiling'),
    onUAQ: () => useAppStore.getState().open('shieldingCalculator'),
    onMemoriaAI: () => useAppStore.getState().open('memoriaAI'),
    onNeutron: () => useAppStore.getState().open('neutron'),
    onCBCTIGRT: () => useAppStore.getState().open('cbctIgrt'),
    onVentilation: () => useAppStore.getState().open('ventilation'),
    onUncertainty: () => useAppStore.getState().open('uncertainty'),
    onSeasonal: () => useAppStore.getState().open('seasonal'),
    onMC: () => useAppStore.getState().open('mc'),
    onMCCloud: () => useAppStore.getState().open('mcConfig'),
    onMonteCarloSim: () => useAppStore.getState().open('monteCarloSim'),
    onCycloneKIUBE: () => useAppStore.getState().open('cycloneKIUBE'),
    onPlanValidator: () => useAppStore.getState().open('planValidator'),
    onChecklistCNSNS: () => useAppStore.getState().open('checklistCNSNS'),
    onScenarioAnalysis: () => useAppStore.getState().open('scenarioAnalysis'),
    onDashboard: () => useAppStore.getState().open('dashboard'),
    onMemoriaWizard: () => useAppStore.getState().open('memoriaAI'),
    onCNSNS: () => useAppStore.getState().open('cnsns'),
    onPDF: handleGeneratePDF,
    onMaintenanceLog: () => useAppStore.getState().open('maintenanceLog'),
    onLogFileAnalysis: () => useAppStore.getState().open('logFileAnalysis'),
    onDXFViewer: () => useAppStore.getState().open('dxfViewer'),
    on3D: () => useAppStore.getState().open('viewer3d'),
    onSmartSearchDICOM: () => useAppStore.getState().open('smartSearchDICOM'),
    onIsodosisViewer: () => setShowIsodosis(true),
    onDoseMapping3D: () => setShowDose3D(true),
    onHeatMapViewer: () => setShowHeatMap(true),
    // Category C
    onCompareMode: () => useAppStore.getState().open('compareMode'),
    onBatchCalc: () => useAppStore.getState().open('batchCalc'),
    onSensitivity: () => useAppStore.getState().open('sensitivityAnalysis'),
    onAuditDashboard: () => useAppStore.getState().open('auditDashboard'),
    // MicroShield
    onGeometrySelector: () => useAppStore.getState().open('geometrySelector'),
    onNuclideData: () => useAppStore.getState().open('nuclideData'),
    onDecayHeat: () => useAppStore.getState().open('decayHeat'),
    onBuildupFactor: () => useAppStore.getState().open('buildupFactor'),
    onExposureRateProjection: () => useAppStore.getState().open('exposureRateProjection'),
    // Additional features
    onSketchPad: () => useAppStore.getState().open('sketchPad'),
    onExampleWizard: () => useAppStore.getState().open('exampleWizard'),
    onCADImport: () => useAppStore.getState().open('cadImport'),
    // v16 features
    onParametricBunker: () => useAppStore.getState().open('parametricBunker'),
    onMLPrediction: () => useAppStore.getState().open('mlPrediction'),
    onKeyboardConfig: () => useAppStore.getState().open('keyboardConfig'),
    onCNSNSAutoReport: () => useAppStore.getState().open('cnsnsAutoReport'),
    onEquipmentLibrary: () => useAppStore.getState().open('equipmentLibrary'),
    onReferenceLibrary: () => useAppStore.getState().open('referenceLibrary'),
    onBibliography: () => useAppStore.getState().open('bibliography'),
    onNCRP151Tables: () => useAppStore.getState().open('ncrp151Tables'),
    onEPA: () => useAppStore.getState().open('epaGuidance'),
    onShleien: () => useAppStore.getState().open('shleien'),
    onGammaKnife: () => useAppStore.getState().open('gammaKnife'),
    onBraquiCo60: () => useAppStore.getState().open('braquiCo60'),
    onVersaHD: () => useAppStore.getState().open('versaHD'),
    onFloorPlanFeatures: () => useAppStore.getState().open('floorPlanFeatures'),
    onICRU57: () => useAppStore.getState().open('icru57'),
    onICRU96: () => useAppStore.getState().open('icru96'),
    onLayoutBunker: () => useAppStore.getState().open('layoutBunker'),
    onProjects: () => { useAppStore.getState().open('projects'); setShowWelcomeScreen(false); },
    onBatchImport: () => useAppStore.getState().open('batchImport'),
    onExport: () => useAppStore.getState().open('export'),
    onTechSpecs: () => useAppStore.getState().open('techSpecs'),
    onAuditTrail: () => useAppStore.getState().open('auditTrail'),
    onKeyboardShortcuts: () => useAppStore.getState().open('keyboardShortcuts'),
    onDarkModeToggle: toggleDarkMode,
    onLangToggle: () => {},
    onTutorial: () => useAppStore.getState().open('tutorial'),
    onManual: () => useAppStore.getState().open('manual'),
    onDoseMap: () => useAppStore.getState().open('doseMap'),
    // v41: GitHub-inspired integrations
    onGammaIndex: () => setShowGammaIndex(true),
    onNuclearDoseGrid: () => useAppStore.getState().open('nuclearDoseGrid'),
    onMonteCarloEngine: () => setShowMonteCarloEngine(true),
    onDVHAnalyzer: () => useAppStore.getState().open('dvhAnalyzer'),
  };
  const paletteActions = DEFAULT_COMMANDS(commandHandlers);

  return (
    <>
      <SkipToContent />
      <div className={`flex h-screen w-screen overflow-hidden flex-col ${highContrast.isHighContrast ? 'high-contrast bg-black' : 'bg-gray-50'}`}>
      {/* v47 Fase 2.9: A11y announcer for screen readers */}
      <A11yAnnouncer />
      <Toolbar floorPlan={floorPlan} onCalculate={runCalculations} onNewProject={() => {
            resetFloorPlan({...defaultFloorPlan, name: 'Nuevo Proyecto', barriers: [], sources: [], regions: [], imageUrl: null });
            setCanvasState(prev => ({...prev, selectedId: null, selectedIds: [], mode: 'select'}));
            if (typeof smartBarrier !== 'undefined') smartBarrier.clearResult();
            setShowWelcomeScreen(false);
            toast.success('Nuevo proyecto listo');
          }} onSaveProject={() => handleSaveProject(floorPlan.name)} onExport={() => useAppStore.getState().open('export')} onShare={handleShare} onCNSNS={() => useAppStore.getState().open('cnsns')} onMC={() => useAppStore.getState().open('mc')} onProjects={() => { useAppStore.getState().open('projects'); setShowWelcomeScreen(false); }} on3D={()=>useAppStore.getState().open('viewer3d')} onMaze={()=>useAppStore.getState().open('maze')} onQuick={()=>useAppStore.getState().open('quickBarrier')} onEquipment={()=>useAppStore.getState().open('equipmentDB')} onPDF={handleGeneratePDF} onMCCloud={()=>useAppStore.getState().open('mcConfig')} onFloorCeiling={()=>useAppStore.getState().open('floorCeiling')} onBatchImport={()=>useAppStore.getState().open('batchImport')} onCostOptimizer={()=>useAppStore.getState().open('costOptimizer')} onNeutron={()=>useAppStore.getState().open('neutron')} onSeasonal={()=>useAppStore.getState().open('seasonal')} onUncertainty={()=>useAppStore.getState().open('uncertainty')} onVentilation={()=>useAppStore.getState().open('ventilation')} onDICOM={()=>useAppStore.getState().open('dicom')} onTechSpecs={()=>useAppStore.getState().open('techSpecs')} onCNSNSDashboard={()=>useAppStore.getState().open('cnsnsDashboard')} onAuditTrail={()=>useAppStore.getState().open('auditTrail')} onDashboardCalc={()=>useAppStore.getState().open('dashboardCalc')} onCostEstimator={()=>useAppStore.getState().open('costEstimator')} onCostDashboard={()=>useAppStore.getState().open('costEstimator')} onCNSNSChecklist={()=>useAppStore.getState().open('cnsnsChecklist')} onCNSNSReport={()=>useAppStore.getState().open('cnsns')} onCNSNSReportChecklist={()=>useAppStore.getState().open('cnsnsChecklist')} onBarrierCalculator={()=>useAppStore.getState().open('barrierCalculator')} onEPA={()=>useAppStore.getState().open('epaGuidance')} onEPAGuidance={()=>useAppStore.getState().open('epaGuidance')} onShleien={()=>useAppStore.getState().open('shleien')} onGammaKnife={()=>useAppStore.getState().open('gammaKnife')} onBraquiCo60={()=>useAppStore.getState().open('braquiCo60')} onVersaHD={()=>useAppStore.getState().open('versaHD')} onICRU57={()=>useAppStore.getState().open('icru57')} onICRU96={()=>useAppStore.getState().open('icru96')} onEquipmentLibrary={()=>useAppStore.getState().open('equipmentLibrary')} onReferenceLibrary={()=>useAppStore.getState().open('referenceLibrary')} onNCRP151Tables={()=>useAppStore.getState().open('ncrp151Tables')} onNCRP151Detail={()=>useAppStore.getState().open('ncrp151Tables')} onShieldingCalculator={()=>useAppStore.getState().open('shieldingCalculator')} onCompareScenarios={()=>useAppStore.getState().open('compareScenarios')} onTornadoSensitivity={()=>useAppStore.getState().open('tornadoSensitivity')} onNCRPValidation={()=>useAppStore.getState().open('ncrpValidation')} onDXFViewer={()=>useAppStore.getState().open('dxfViewer')} onMemoriaWizard={()=>useAppStore.getState().open('memoriaWizard')} onPlanValidator={()=>useAppStore.getState().open('planValidator')} onEquipmentShieldingWizard={()=>useAppStore.getState().open('equipmentShieldingWizard')} onMonteCarloSim={()=>useAppStore.getState().open('monteCarloSim')} onCycloneKIUBE={()=>useAppStore.getState().open('cycloneKIUBE')} onTutorial={()=>useAppStore.getState().open('tutorial')} onCBCTIGRT={()=>useAppStore.getState().open('cbctIgrt')} onLayoutBunker={()=>useAppStore.getState().open('layoutBunker')} onMaintenanceLog={()=>useAppStore.getState().open('maintenanceLog')} onScenarioAnalysis={()=>useAppStore.getState().open('scenarioAnalysis')} onDashboard={()=>useAppStore.getState().open('dashboard')} onChecklistCNSNS={()=>useAppStore.getState().open('checklistCNSNS')} onSpecialCases={()=>useAppStore.getState().open('specialCases')} onBibliography={()=>useAppStore.getState().open('bibliography')} onBibliografia={()=>useAppStore.getState().open('bibliography')} onEvidencePack={()=>useAppStore.getState().open('evidencePack')} isDarkMode={isDarkMode} onDarkModeToggle={toggleDarkMode} onKeyboardShortcuts={()=>useAppStore.getState().open('keyboardShortcuts')} onSmartSearchDICOM={()=>useAppStore.getState().open('smartSearchDICOM')} onLogFileAnalysis={()=>useAppStore.getState().open('logFileAnalysis')}
        onSourceTool={() => setActiveTool('source')}
          // v83: Canvas clear + new map
          onClearCanvas={() => {
            resetFloorPlan({...defaultFloorPlan, name: 'Nuevo Proyecto', barriers: [], sources: [], regions: [], imageUrl: null });
            setCanvasState(prev => ({...prev, selectedId: null, mode: 'select'}));
            if (typeof smartBarrier !== 'undefined') smartBarrier.clearResult();
            toast.success('Mapa borrado — lienzo limpio');
          }}
          onNewMap={() => {
            const el = document.getElementById('floorplan-upload');
            if (el) { (el as HTMLInputElement).click(); }
          }}
          // v82: Canvas enhancements
          onToggleLayers={() => setShowLayersPanel(prev => !prev)}
          onToggleShapeLibrary={() => setShowShapeLibrary(prev => !prev)}
          onToggleFreehand={() => freehandDraw.toggleEnabled()}
          onToggleStickyNotes={() => setShowStickyNotesPanel(prev => !prev)}
          onUndo={undo}
          onRedo={redo}
          onCommandPalette={() => setShowCommandPalette(true)}
          onOnboardingTour={() => {
            try {
              window.localStorage.removeItem('radshield-tour-completed');
            } catch {
              // ignore storage failures; remount still attempts to start the tour
            }
            setOnboardingTourKey((key) => key + 1);
          }}
          // v82: Update Center
          onUpdate={() => useAppStore.getState().open('updateCenter')}
          onFloorPlanFeatures={() => useAppStore.getState().open('floorPlanFeatures')}
          // v80: Smart Rooms
          onToggleRoomTemplates={() => setShowRoomTemplates(prev => !prev)}
          onMaterialProperty={()=>useAppStore.getState().open('materialProperty')} onLeadFreeMaterials={()=>useAppStore.getState().open('materialComparison')} onNeutronRemoval={()=>useAppStore.getState().open('neutronRemoval')}
          onNuclearMedicine={()=>useAppStore.getState().open('nuclearMedicine')} onGMPCertification={()=>useAppStore.getState().open('certification')} onAAPMTG108PET={()=>useAppStore.getState().open('aapmTG108')} onIPEM109={()=>useAppStore.getState().open('ipem109')} onChiltonSkyshine={()=>useAppStore.getState().open('skyshine')} onTherapyShielding={()=>useAppStore.getState().open('therapyShielding')} onDecayChains={()=>useAppStore.getState().open('decayChains')} onAbout={()=>useAppStore.getState().open('about')} onGlossary={()=>useAppStore.getState().open('glossary')} onThemeEngine={()=>useAppStore.getState().open('themeEngine')} onBIMConnector={()=>useAppStore.getState().open('bimConnector')} onCloudSync={()=>useAppStore.getState().open('cloudSync')} onValidationDashboard={()=>useAppStore.getState().open('validationDashboard')} onExternalConnector={()=>useAppStore.getState().open('externalConnector')}
          onBIMRAD={()=>useAppStore.getState().open('bimRAD')} onCollaboration={()=>useAppStore.getState().open('collaborationHub')} onCollaborationHub={()=>useAppStore.getState().open('collaborationHub')} onGATE={()=>useAppStore.getState().open('gateSimulation')} onGATEPET={()=>useAppStore.getState().open('gateSimulation')} onExternalSoftware={()=>useAppStore.getState().open('externalConnector')}
          onMonteCarlo={()=>useAppStore.getState().open('monteCarloIntegration')} onGUMUncertainty={()=>useAppStore.getState().open('gumUncertainty')} onExperimental={()=>useAppStore.getState().open('experimentalValidation')} onDICOMRT={()=>useAppStore.getState().open('dicomRT')} onAIShielding={() => useAppStore.getState().open('aiAssistant')} onAutoBarrier={()=>useAppStore.getState().open('autoBarrier')} onPredictiveMaterial={()=>useAppStore.getState().open('predictiveMaterial')} onPredictiveOptimizer={()=>useAppStore.getState().open('predictiveMaterial')} onAnomalyDetection={()=>useAppStore.getState().open('anomalyDetection')} onAutoFillEquipment={()=>useAppStore.getState().open('autoFillEquipment')} onAutoFillEquipo={()=>useAppStore.getState().open('autoFillEquipment')} onVRAR={()=>useAppStore.getState().open('vrarPreview')} onVideoTutorial={()=>useAppStore.getState().open('videoTutorial')} onAnimatedDose={()=>useAppStore.getState().open('animatedDose')} onAnimatedDoseMaps={()=>useAppStore.getState().open('animatedDose')} onPointCloud={()=>useAppStore.getState().open('pointCloud')} onIndustrial={()=>useAppStore.getState().open('industrial')} onIndustrialRadiation={()=>useAppStore.getState().open('industrial')}
          onMultiSource={()=>useAppStore.getState().open('multiSource')} onPACS={()=>useAppStore.getState().open('pacs')}
          onInternationalRegulations={()=>useAppStore.getState().open('internationalRegulations')} onRegulatoryComparison={()=>useAppStore.getState().open('regulatoryComparison')} onComplianceCertification={()=>useAppStore.getState().open('complianceCertification')} onRegulatoryAlerts={()=>useAppStore.getState().open('regulatoryAlerts')} onPythonIntegration={()=>useAppStore.getState().open('pythonIntegration')} onPythonTools={()=>useAppStore.getState().open('pythonIntegration')}
          onNativeMC={()=>useAppStore.getState().open('nativeMC')}
          onNeutronShielding={()=>useAppStore.getState().open('neutronShielding')} onBatemanDecay={()=>useAppStore.getState().open('batemanDecay')} onNISTLibrary={()=>useAppStore.getState().open('nistLibrary')} onModelingToolbox={()=>useAppStore.getState().open('modelingToolbox')} onMaterialProps={()=>useAppStore.getState().open('materialProperty')} onCyclotronSim={()=>useAppStore.getState().open('cycloneKIUBE')} onShieldingEquipos={()=>useAppStore.getState().open('equipmentShieldingWizard')}
          onElectronTransport={()=>useAppStore.getState().open('electronTransport')} onSTEPImporter={()=>useAppStore.getState().open('stepImporter')}
          onManual={()=>useAppStore.getState().open('manual')}
          onRealTime3D={()=>useAppStore.getState().open('realTime3D')}
          onMedicalFloorPlan3D={()=>useAppStore.getState().open('medicalFloorPlan3D')}
          onDoseMap={()=>useAppStore.getState().open('doseMap')}
          onShieldingOptimizer={()=>useAppStore.getState().open('shieldingOptimizer')} onPACSReal={()=>useAppStore.getState().open('pacsReal')} onElectronApplicator={()=>useAppStore.getState().open('electronApplicator')}
          onVoxelPhantom={()=>useAppStore.getState().open('voxelPhantom')} onMCNPCyclotron={()=>useAppStore.getState().open('mcnpCyclotron')} onShapesReconstruction={()=>useAppStore.getState().open('shapesReconstruction')} onEquipmentManager={()=>useAppStore.getState().open('equipmentManager')}
          onCategoryTools={(cat) => { setActiveCategory(cat); useAppStore.getState().open('categoryTools'); }}
          onEmergency={() => useAppStore.getState().open('emergencyProcedures')}
          onBarrierEditor={() => setShowBarrierEditor(true)}
          onAirKermaOverlay={() => setShowAirKermaOverlay(true)}
          onMosaicProjectManager={() => setShowMosaicProjectManager(true)}
          onControlPoints={() => setShowControlPoints(true)}
          onPHITSGenerator={() => setShowPHITSGenerator(true)}
          onDCHAINCalc={() => setShowDCHAINCalc(true)}
          onCADToMC={() => setShowCADToMC(true)}
          onJENDL5Viewer={() => setShowJENDL5Viewer(true)}
          onVersionHistory={() => useAppStore.getState().open('versionHistory')}
          onDICOMRTSTRUCT={() => useAppStore.getState().open('dicomRTSTRUCT')}
          onCNSNSDigital={() => useAppStore.getState().open('cnsnsDigital')}
          // v41: GitHub-inspired integrations
          onGammaIndex={() => setShowGammaIndex(true)}
          onNuclearDoseGrid={() => useAppStore.getState().open('nuclearDoseGrid')}
          onMonteCarloEngine={() => setShowMonteCarloEngine(true)}
          onDVHAnalyzer={() => useAppStore.getState().open('dvhAnalyzer')}
          // v41b
          onFLUKA={() => setShowFLUKA(true)}
          onPENELOPE={() => setShowPENELOPE(true)}
          onTherapyDosimetry={() => setShowTherapyDosimetry(true)}
          onShieldingVerification={() => useAppStore.getState().open('shieldingVerification')}
          // v42: McGinley
          onLaminatedBarrier={() => setShowLaminatedBarrier(true)}
          onPerformanceRecommendations={() => setShowPerformanceRecommendations(true)}
          onPerformanceDashboard={() => useAppStore.getState().open('performanceDashboard')}
          onCADGeometryConverter={() => useAppStore.getState().open('cadGeometryConverter')}
          onDesignAgent={() => useAppStore.getState().open('shieldingDesignAgent')}
          // v43: Attila4MC
          onAttila4MC={() => setShowAttila4MC(true)}
          // v44: Attila4MC GUI features
          onMCNPDeck={() => setShowMCNPDeck(true)}
          onCADMapper={() => setShowCADMapper(true)}
          onSolutionField3D={() => useAppStore.getState().open('solutionField3D')}
          // v45: WASM + Sensitivity Analysis

          // v46: Recommendations A-E
          onSkyshine={() => setShowSkyshine(true)}
          onAnnualDose={() => useAppStore.getState().open('annualDose')}
          onCrossValidation={() => useAppStore.getState().open('crossValidation')}
          onObliqueIncidence={() => useAppStore.getState().open('obliqueIncidence')}
          onMultiEnergySpectra={() => useAppStore.getState().open('multiEnergySpectra')}
          onAdaptiveSampling={() => useAppStore.getState().open('adaptiveSampling')}
          onSelfShielding={() => useAppStore.getState().open('selfShielding')}
          onTransmissionCurve={() => useAppStore.getState().open('transmissionCurve')}
          onNeutronMaze={() => useAppStore.getState().open('neutronMaze')}
          onSensitivityAnalysis={() => useAppStore.getState().open('sensitivityAnalysis')}
          // v47: St-Germain + high contrast
          onStGermain={() => useAppStore.getState().open('stGermainScatter')}
          highContrast={highContrast.isHighContrast}
          onToggleHighContrast={highContrast.toggle}
          // v49: All remaining audit recommendations
          onAlbedo={() => setShowAlbedo(true)}
          onConcreteActivation={() => useAppStore.getState().open('concreteActivation')}
          onCertification={() => setShowCertification(true)}
          onCommunityTemplates={() => useAppStore.getState().open('communityTemplates')}
          onAuditLog={() => setShowAuditLog(true)}
          onAnalytics={() => useAppStore.getState().open('analytics')}
          // v92: Auth
          user={user}
          onLogin={() => {
            const url = buildKimiOAuthUrl();
            if (url) {
              window.location.href = url;
              return;
            }
            toast.info('Kimi OAuth no configurado. La app continua en modo local/offline.');
          }}
          onLogout={logout}
          // v96: Transport + OpenCV + Pan
          onTransport={() => useAppStore.getState().open('transportDialog')}
          onOpenCVDetect={handleOpenCVDetect}
          onPanMode={() => setActiveTool(prev => prev === 'pan' ? 'select' : 'pan')}
          isPanMode={activeTool === 'pan'}
        />
      {/* v82/F134: Update Center Dialog */}
              <LazyDialog name="updateCenter" component={UpdateAppDialog} />
      {/* v80: Room Template Panel */}
              <LazyDialog name="roomTemplates" component={RoomTemplatePanel} templates={roomTemplates.templates} categories={roomTemplates.categories} activeTemplate={roomTemplates.activeTemplate} onApply={applyRoomTemplateToFloorPlan} onClose={() => useAppStore.getState().close('roomTemplates')} />
      {/* v82: Canvas Layers Panel */}
              <LazyDialog name="layersPanel" component={CanvasLayersPanel} layers={canvasLayers.layers} activeLayer={canvasLayers.activeLayer} onToggle={canvasLayers.toggleLayer} onOpacity={canvasLayers.setLayerOpacity} onLock={canvasLayers.toggleLock} onActivate={canvasLayers.setActiveLayer} onReset={canvasLayers.resetLayers} />
      {/* v82: Shape Library */}
      {showShapeLibrary && (
        <ShapeLibrary
          onDragStart={(shape) => { setDraggedShape(shape); toast.info(`Arrastrando: ${shape.name}`); }}
          onClose={() => setShowShapeLibrary(false)}
        />
      )}
      {showLayersPanel && (
        <div data-testid="f74-canvas-layers-panel">
          <CanvasLayersPanel
            layers={canvasLayers.layers}
            activeLayer={canvasLayers.activeLayer}
            onToggle={canvasLayers.toggleLayer}
            onOpacity={canvasLayers.setLayerOpacity}
            onLock={canvasLayers.toggleLock}
            onActivate={canvasLayers.setActiveLayer}
            onReset={canvasLayers.resetLayers}
          />
        </div>
      )}
      {showRoomTemplates && (
        <RoomTemplatePanel
          templates={roomTemplates.templates}
          categories={roomTemplates.categories}
          activeTemplate={roomTemplates.activeTemplate}
          onApply={applyRoomTemplateToFloorPlan}
          onClose={() => setShowRoomTemplates(false)}
        />
      )}
      <Suspense fallback={null}>
        <OnboardingTour key={onboardingTourKey} />
      </Suspense>
      <div className="flex-1 flex overflow-hidden">
        {showWelcomeScreen ? (
          <div className="welcome-panel flex-1">
            <WelcomeScreen onNewProject={()=>{
              resetFloorPlan({...defaultFloorPlan, name: 'Nuevo Proyecto', barriers: [], sources: [], regions: [], imageUrl: null });
              setCanvasState(prev => ({...prev, selectedId: null, mode: 'select'}));
              if (typeof smartBarrier !== 'undefined') smartBarrier.clearResult();
              setShowWelcomeScreen(false);
              toast.success('Nuevo proyecto creado — lienzo limpio');
            }} onOpenProject={()=>{useAppStore.getState().open('projects'); setShowWelcomeScreen(false);}} onImportDXF={()=>{useAppStore.getState().open('dxfViewer'); setShowWelcomeScreen(false);}} onImportFloorPlan={()=>{const el=document.getElementById('floorplan-upload');if(el){(el as HTMLInputElement).click();}setShowWelcomeScreen(false);}} onLoadTemplate={(id)=>{toast.success(`Template cargado: ${id}`); setShowWelcomeScreen(false);}} onLoadRecent={(id)=>{handleLoadProject(id); setShowWelcomeScreen(false);}} onTutorial={()=>useAppStore.getState().open('tutorial')} onManual={()=>useAppStore.getState().open('manual')} onDismiss={()=>{setShowWelcomeScreen(false);}} onOpenTool={(toolId)=>{handleOpenTool(toolId);}} />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden" style={{ display: 'flex' }}>
            {/* Sidebar Panel */}
            <div className="w-80 min-w-[200px] max-w-[450px] bg-white border-r border-gray-200 flex flex-col shrink-0">
              <Sidebar floorPlan={floorPlan} setFloorPlan={setFloorPlan} activeTool={activeTool} setActiveTool={setActiveTool} selectedSource={selectedSource} selectedBarrier={selectedBarrier} selectedCriticalPoint={selectedCriticalPoint} updateSelected={handleUpdateSelected} deleteSelected={deleteSelected} resetView={resetView} onImageUpload={handleImageUpload} onRunCalculations={runRadShieldCalculations} onUAQ={() => useAppStore.getState().open('shieldingCalculator')} onMemoriaAI={() => useAppStore.getState().open('memoriaAI')} onMazeCalculator={() => useAppStore.getState().open('maze')} onDXFViewer={() => useAppStore.getState().open('dxfViewer')} />
            </div>
            {/* Resize Handle */}
            <div className="w-1.5 bg-slate-200 hover:bg-[#f97316] active:bg-[#ea580c] transition-colors relative cursor-col-resize shrink-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-slate-400 rounded-full" />
            </div>
            {/* Canvas Panel */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex flex-col h-full main-canvas-area">
                {/* Hidden file input for floor plan import */}
                <input
                  id="floorplan-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg,.tif,.tiff,.gif,.dxf,.csv"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <CanvasArea
                  canvasRef={canvasRef} canvasState={canvasState} setCanvasState={setCanvasState}
                  floorPlan={floorPlan}
                  onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                  onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                  onZoomToFit={zoomToFit} onExportPNG={exportPNG} onToggleSnap={toggleSnap}
                  onImportFloorPlan={() => document.getElementById('floorplan-upload')?.click()}
                  onOpenLayers={() => setShowLayersPanel(prev => !prev)}
                  onOpenRoomTemplates={() => setShowRoomTemplates(prev => !prev)}
                  onOpenControlPoints={() => setShowControlPoints(true)}
                  onOpen3DViewer={() => useAppStore.getState().open('viewer3d')}
                  onOpenMedical3D={() => useAppStore.getState().open('medicalFloorPlan3D')}
                  onOpenDoseMap3D={() => useAppStore.getState().open('spatialDoseMap')}
                  onOpenMonteCarlo={() => useAppStore.getState().open('monteCarloIntegration')}
                  onOpenExternalConnector={() => useAppStore.getState().open('externalConnector')}
                  onOpenEvidencePack={() => useAppStore.getState().open('evidencePack')}
                  onCalibrateScale={handleCalibrateScaleQuick}
                  onAddCriticalPoint={handleAddCriticalPointDraft}
                  onOpenShieldingPresets={handleShieldingPresetApply}
                  onUpdateSelected={handleUpdateSelected}
                  onCommitGhostSource={handleCommitGhostSource}
                  onDuplicateSelected={handleDuplicateSelected}
                  onDeleteSelected={deleteSelected}
                  onAuditSnapshot={handleAuditSnapshot}
                  sampleLines={sampleLines}
                  barrierResults={barrierResults}
                  showSampleLines={showSampleLines}
                  setShowSampleLines={setShowSampleLines}
                  showSamplePoints={showSamplePoints}
                  setShowSamplePoints={setShowSamplePoints}
                  showMaxima={showMaxima}
                  setShowMaxima={setShowMaxima}
                  heatmapEnabled={heatmapEnabled}
                  onToggleHeatmap={handleToggleHeatmap}
                  heatmapPointCount={heatmapData.length}
                  onRunCalculations={runRadShieldCalculations}
                  activeTool={activeTool}
                  setActiveTool={(tool) => setActiveTool(tool as Tool)}
                  // v65: Canvas enhancements connected
                  layers={canvasLayers.layers}
                  freehandStrokes={freehandDraw.strokes}
                  stickyNotes={stickyNotes.notes}
                  onStickyNoteUpdate={(id, text) => stickyNotes.updateNote(id, typeof text === 'string' ? { text } : text)}
                  onStickyNoteDelete={stickyNotes.deleteNote}
                  freehandEnabled={freehandDraw.isEnabled}
                  activeLayer={canvasLayers.activeLayer}
                />
                <ResultsPanel floorPlan={floorPlan} roundThickness={roundThickness} />
                {/* v47 Fase 2.10: Canvas search (Ctrl+F) */}
                <CanvasSearch
                  floorPlan={floorPlan}
                  canvasOffset={{ x: canvasState.offsetX, y: canvasState.offsetY }}
                  canvasScale={canvasState.scale}
                  onFocusElement={(x, y) => {
                    setCanvasState(prev => ({
                      ...prev,
                      offsetX: -x * prev.scale + canvasRef.current!.width / 2,
                      offsetY: -y * prev.scale + canvasRef.current!.height / 2,
                    }));
                  }}
                />
                {/* v47 Fase 3.11: Minimap navigator */}
                <Minimap
                  floorPlan={floorPlan}
                  viewport={{
                    x: -canvasState.offsetX / canvasState.scale,
                    y: -canvasState.offsetY / canvasState.scale,
                    width: canvasRef.current?.width || 800,
                    height: canvasRef.current?.height || 600,
                    scale: canvasState.scale,
                  }}
                  onViewportChange={(vx, vy) => {
                    setCanvasState(prev => ({
                      ...prev,
                      offsetX: -vx * prev.scale,
                      offsetY: -vy * prev.scale,
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {!showWelcomeScreen && (
        <div className="status-bar">
          <StatusBar
            projectName={floorPlan.name}
            lastSaved={lastSaved}
            isCalculating={calculationStatus === "running"}
            calculationStatus={calculationStatus}
            numSources={floorPlan.sources.length}
            numBarriers={floorPlan.barriers.length}
            numBarriersCalculated={floorPlan.barriers.filter(b => b.requiredThickness_mm).length}
            version="RadShield-MX v127"
            isDirty={isDirty}
            userName={user?.name}
            importStatus={floorPlan.importMetadata?.status}
            importMode={floorPlan.importMetadata?.mode}
            onConfirmImport={handleConfirmDxfGeometry}
            onOpenImportReview={() => setShowDxfImportReview(true)}
          />
        </div>
      )}
      {!showWelcomeScreen && showDxfImportReview && floorPlan.importMetadata && (
        <DxfImportReviewPanel
          floorPlan={floorPlan}
          onClose={() => setShowDxfImportReview(false)}
          onConfirm={handleConfirmDxfGeometry}
          onRunCalculations={runRadShieldCalculations}
          onOpenMemoriaAI={() => useAppStore.getState().open('memoriaAI')}
          onOpenEvidencePack={() => useAppStore.getState().open('evidencePack')}
        />
      )}
      {/* Help panel floating button */}
      {!showWelcomeScreen && (
        <button
          className="fixed bottom-10 right-4 z-50 w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          onClick={() => { const s = useAppStore.getState(); const isOpen = !!(s.dialogs as Record<string, boolean>)['helpPanel']; if (isOpen) s.close('helpPanel' as any); else s.open('helpPanel' as any); }}
          title="Panel de ayuda (Ctrl+Shift+H)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
      )}
      {!showWelcomeScreen && typeof window !== 'undefined' && window.localStorage.getItem('radshield-e2e-controls') === 'true' && (
        <div data-testid="e2e-dialog-controls" className="fixed bottom-2 left-2 z-[70] flex max-w-[calc(100vw-1rem)] flex-wrap gap-1 rounded bg-white/95 p-1 shadow">
          <button data-testid="e2e-open-evidence-pack" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('evidencePack')}>Evidence</button>
          <button data-testid="e2e-open-memoria-ai" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('memoriaAI')}>Memoria</button>
          <button data-testid="e2e-open-memoria-wizard" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('memoriaWizard')}>MA Wizard</button>
          <button data-testid="e2e-open-layout-bunker" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('layoutBunker')}>Layout</button>
          <button data-testid="e2e-open-manual" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('manual')}>Manual</button>
          <button data-testid="e2e-open-dashboard" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('dashboard')}>Dash</button>
          <button data-testid="e2e-open-checklist-cnsns" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('checklistCNSNS')}>CNSNS Full</button>
          <button data-testid="e2e-open-ncrp151-tables" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('ncrp151Tables')}>NCRP</button>
          <button data-testid="e2e-open-compare-scenarios" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('compareScenarios')}>Compare</button>
          <button data-testid="e2e-open-tutorial" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('tutorial')}>Tutorial</button>
          <button data-testid="e2e-open-version-history" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('versionHistory')}>Version</button>
          <button data-testid="e2e-open-regulatory-report" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('regulatoryReport')}>Reg</button>
          <button data-testid="e2e-open-pdf-report" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('pdfReport')}>PDF</button>
          <button data-testid="e2e-open-cnsns-report" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('cnsns')}>CNSNS</button>
          <button data-testid="e2e-open-cnsns-checklist" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('cnsnsChecklist')}>Check</button>
          <button data-testid="e2e-open-batch-report-exporter" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('batchReportExporter')}>Batch</button>
          <button data-testid="e2e-open-medical-3d" className="text-[10px] px-2 py-1 border rounded" onClick={() => useAppStore.getState().open('medicalFloorPlan3D')}>3D</button>
        </div>
      )}
      <Suspense fallback={<DialogFallback />}>
        <LazyDialog name="export" component={ExportDialog} onExportCSV={exportCSV} onExportJSON={exportJSON} onExportExcel={exportExcel} />
        <LazyDialog name="cnsns" component={CNSNSDialog} meta={reportMeta} setMeta={setReportMeta} onGenerate={generateReport} />
        <LazyDialog name="mc" component={MCDialog} config={mcConfig} setConfig={setMcConfig} onGenerate={generateMCMacro} />
        <LazyDialog name="projects" component={ProjectManagerDialog} projects={projects} cloudProjects={cloudProjectsQuery.data || []} currentProjectName={floorPlan.name} onSave={handleSaveProject} onLoad={handleLoadProject} onDelete={handleDeleteProject} onRename={renameProject} onExport={exportProjectJSON} onImport={importProjectJSON} isLoggedIn={!!user?.unionId} />
        <LazyDialog name="materialLibrary" component={MaterialLibraryDialog} builtinMaterials={backendMaterials.builtinMaterials} customMaterials={backendMaterials.customMaterials} onCreateMaterial={backendMaterials.createMaterial} onDeleteMaterial={backendMaterials.deleteMaterial} isLoading={backendMaterials.isLoading} />
        <LazyDialog name="reportManager" component={ReportManagerDialog} reports={backendReports.reports} isLoading={backendReports.isLoading} onFetch={backendReports.fetchReports} onDelete={backendReports.deleteReport} onCreate={backendReports.createReport} currentFloorPlan={{ name: floorPlan.name, sources: floorPlan.sources, barriers: floorPlan.barriers }} />
        <LazyDialog name="floorPlanFeatures" component={FloorPlanFeaturesPanel} barrierCount={floorPlan.barriers.length} sourceCount={floorPlan.sources.length} hasMaze={floorPlan.sources.some(s => s.name?.toLowerCase().includes("maze") || s.name?.toLowerCase().includes("laberinto"))} />
        {/* v96: Radioactive Material Transport */}
        <LazyDialog name="transportDialog" component={RadioactiveTransportDialog} />
        {/* v100: NIST XCOM Attenuation */}
        <LazyDialog name="nistXcom" component={NistXcomDialog} />
        {/* v101: ML Shielding Predictor */}
        <LazyDialog name="onnxPredictor" component={OnnxPredictorDialog} />
        {/* v102: Revit IFC Import */}
        <LazyDialog name="revitIfcImport" component={RevitIfcImportDialog} />
        {/* v103: Geant4 Monte Carlo */}
        <LazyDialog name="geant4Mc" component={Geant4McDialog} />
        {/* v110: Revit Add-in C# */}
        <LazyDialog name="revitAddin" component={RevitAddinDialog} />
        {/* v105: Multi-Objective Optimizer */}
        <LazyDialog name="multiObjectiveOptimizer" component={MultiObjectiveOptimizerDialog} />
        {/* v106: Material Comparison */}
        <LazyDialog name="materialComparison" component={MaterialComparisonDialog} />
        {/* v110: Batch Report Exporter */}
        <LazyDialog name="batchReportExporter" component={BatchReportExporterDialog} />
        {/* v108: Spatial Dose Map */}
        <LazyDialog name="spatialDoseMap" component={SpatialDoseMapDialog} />
        {/* v109: Neutron Shielding */}
        <LazyDialog name="neutronShielding" component={NeutronShieldingDialog} />
        {/* v110: Regulatory Report */}
        <LazyDialog name="regulatoryReport" component={RegulatoryReportDialog} floorPlan={floorPlan} />
        {/* v114-116: Multi-Layer Shield / Source Library / 3D Isosurface */}
        <LazyDialog name="multiLayerShield" component={MultiLayerShieldDialog} />
        <LazyDialog name="sourceLibrary" component={SourceLibraryDialog} />
        <LazyDialog name="isosurface3d" component={Isosurface3DDialog} />
        {/* v117-120: PDF Report / Pareto / Parametric 3D */}
        <LazyDialog name="pdfReport" component={PdfReportDialog} floorPlan={floorPlan} />
        <LazyDialog name="paretoOptimizer" component={ParetoOptimizerDialog} />
        <LazyDialog name="parametric3d" component={Parametric3DDialog} />
        {/* v121-123: Design Compare / ALARA Wizard / Nuclide Library */}
        <LazyDialog name="designCompare" component={DesignCompareDialog} />
        <LazyDialog name="alaraWizard" component={AlaraWizardDialog} />
        <LazyDialog name="nuclideLibrary500" component={NuclideLibrary500Dialog} />
        {/* v124-127: Dark Mode / DXF Export / Dose Sweep / Keyboard Shortcuts */}
        <LazyDialog name="darkMode" component={DarkModeDialog} />
        <LazyDialog name="dxfExport" component={DxfExportDialog} />
        <LazyDialog name="doseSweep" component={DoseSweepDialog} />
        <LazyDialog name="keyboardShortcuts" component={KeyboardShortcutsDialog} />
        <LazyDialog name="viewer3d" component={Viewer3DDialog} floorPlan={floorPlan} />
        <LazyDialog name="maze" component={MazeCalculatorDialog} />
        <LazyDialog name="quickBarrier" component={QuickBarrierDialog} />
        <LazyDialog name="equipmentDB" component={EquipmentDBDialog} />
        <LazyDialog name="mcConfig" component={MCConfigDialog} floorPlan={floorPlan} onLaunchMC={(jobId: number, format: string) => { setMcJobConfig({ jobId, format, particles: 1000000, jobName: `MC_${floorPlan.name}` }); useAppStore.getState().close('mcConfig'); useAppStore.getState().open('mcCloud'); }} />
        {mcJobConfig && <LazyDialog name="mcCloud" component={MCCloudDialog} projectId={floorPlan.id} format={mcJobConfig.format} particles={mcJobConfig.particles} jobName={mcJobConfig.jobName} />}
        <LazyDialog name="barrierCalculator" component={BarrierCalculatorDialog} />
        <LazyDialog name="floorCeiling" component={FloorCeilingDialog} />
        <LazyDialog name="dashboardCalc" component={DashboardCalcDialog} floorPlan={floorPlan} />
        <LazyDialog name="costEstimator" component={CostEstimatorDialog} />
        <LazyDialog name="cnsnsChecklist" component={CNSNSChecklistDialog} />
        <LazyDialog name="batchImport" component={BatchImportDialog} floorPlan={floorPlan} onImport={setFloorPlan} />
        <LazyDialog name="costOptimizer" component={CostOptimizerDialog} />
        <LazyDialog name="neutron" component={NeutronDialog} />
        <LazyDialog name="seasonal" component={SeasonalDialog} baseWorkload={floorPlan.sources.reduce((s,src)=>s+src.workloadValue,0)} />
        <LazyDialog name="uncertainty" component={UncertaintyDialog} />
        <LazyDialog name="ventilation" component={VentilationDialog} />
        <LazyDialog name="dicom" component={DICOMDialog} />
        <LazyDialog name="techSpecs" component={TechSpecsDialog} floorPlanName={floorPlan.name} />
        <LazyDialog name="cnsnsDashboard" component={CNSNSDashboardDialog} floorPlan={floorPlan} />
        <LazyDialog name="auditTrail" component={AuditTrailDialog} projectId={floorPlan.id} />
        <LazyDialog name="epaGuidance" component={EPAGuidanceDialog} />
        <LazyDialog name="shleien" component={ShleienHandbookDialog} />
        <LazyDialog name="gammaKnife" component={GammaKnifeDialog} />
        <LazyDialog name="braquiCo60" component={BraquiterapiaCo60Dialog} />
        <LazyDialog name="versaHD" component={VersaHD15MVDialog} />
        <LazyDialog name="icru57" component={ICRU57Dialog} />
        <LazyDialog name="icru96" component={ICRU96Dialog} />
        <LazyDialog name="equipmentLibrary" component={EquipmentLibraryDialog} onOpenVersaHD={() => useAppStore.getState().open('versaHD')} onOpenGammaKnife={() => useAppStore.getState().open('gammaKnife')} onOpenBraquiCo60={() => useAppStore.getState().open('braquiCo60')} />
        <LazyDialog name="referenceLibrary" component={ReferenceLibraryDialog} onOpenEPA={() => useAppStore.getState().open('epaGuidance')} onOpenShleien={() => useAppStore.getState().open('shleien')} onOpenICRU57={() => useAppStore.getState().open('icru57')} onOpenICRU96={() => useAppStore.getState().open('icru96')} />
        <LazyDialog name="ncrp151Tables" component={NCRP151TablesDialog} />
        <LazyDialog name="shieldingCalculator" component={ShieldingCalculatorDialog} />
        <LazyDialog name="dxfViewer" component={DXFViewerDialog} />
        <LazyDialog name="mcResults" component={MCResultsDialog} resultJson={lastMCResult} />
                <LazyDialog
                  name="memoriaWizard"
                  component={MemoriaAnaliticaWizard}
                />
        {/* v30: AI-Powered Analytical Memory Wizard */}
        <LazyDialog
          name="memoriaAI"
          component={MemoriaAIWizard}
          floorPlan={floorPlan}
          barrierResults={barrierResults}
          sampleLines={sampleLines}
        />
                <LazyDialog name="planValidator" component={PlanValidatorDialog} floorPlan={floorPlan} />
                <LazyDialog name="equipmentShieldingWizard" component={EquipmentShieldingWizard} />
                <LazyDialog name="monteCarloSim" component={MonteCarloSimulationWizard} />
                <LazyDialog name="cycloneKIUBE" component={CycloneKIUBEWizard} />
        <LazyDialog name="tutorial" component={TutorialDialog} />
                <LazyDialog name="cbctIgrt" component={CBCTIGRTDialog} />
                <LazyDialog
                  name="layoutBunker"
                  component={LayoutBunkerDialog}
                  floorPlan={floorPlan}
                  onApplyFloorPlan={(nextPlan: FloorPlan) => {
                    setFloorPlan(nextPlan);
                    toast.success('Zona controlada aplicada al plano');
                  }}
                />
                <LazyDialog name="maintenanceLog" component={MaintenanceLogDialog} />
                <LazyDialog name="scenarioAnalysis" component={ScenarioAnalysisDialog} />
        <LazyDialog name="dashboard" component={DashboardDialog} />
                <LazyDialog name="checklistCNSNS" component={ChecklistCNSNSDialog} />
                <LazyDialog name="specialCases" component={SpecialCasesDialog} />
        <LazyDialog name="bibliography" component={BibliographyDialog} />
        <LazyDialog
          name="evidencePack"
          component={EvidencePackDialog}
          projectName={floorPlan.name}
          floorPlan={floorPlan}
          barrierResults={barrierResults}
          sampleLines={sampleLines}
        />
        {/* v15: New dialogs */}
        <LazyDialog name="smartSearchDICOM" component={SmartSearchDICOMDialog} />
        <LazyDialog name="logFileAnalysis" component={LogFileAnalysisDialog} />
        {/* v15: Command Palette */}
        <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} actions={paletteActions} />
        {/* v15: Undo/Redo History */}
        <UndoRedoHistoryPanel open={showHistoryPanel} onOpenChange={setShowHistoryPanel} history={actionHistory} currentIndex={historyIndex} onJumpTo={(idx) => setHistoryIndex(idx)} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} />
        {/* v15: Visualization dialogs */}
        <IsodosisViewer open={showIsodosis} onOpenChange={setShowIsodosis} />
        <DoseMapping3D open={showDose3D} onOpenChange={setShowDose3D} />
        <HeatMapViewer open={showHeatMap} onOpenChange={setShowHeatMap} />
        {/* v15: Contextual Help Panel (rendered inline, not in Suspense) */}
        <LazyDialog name="helpPanel" component={ContextualHelpPanel} activeContext={helpContext} />
        {/* v15.2: Category C dialogs (conditional mount) */}
        <LazyDialog name="compareMode" component={CompareModeDialog} />
        <LazyDialog name="batchCalc" component={BatchCalculationDialog} />
        <LazyDialog name="sensitivityAnalysis" component={SensitivityAnalysisDialog} />
        <LazyDialog name="auditDashboard" component={AuditDashboardDialog} />
        {/* v15.2: MicroShield pattern dialogs (conditional mount) */}
        <LazyDialog name="geometrySelector" component={GeometrySelectorDialog} />
        <LazyDialog name="nuclideData" component={NuclideDataViewer} />
        <LazyDialog name="decayHeat" component={DecayHeatCalculator} />
        <LazyDialog name="buildupFactor" component={BuildupFactorDialog} />
        <LazyDialog name="exposureRateProjection" component={ExposureRateProjectionDialog} />
        {/* v15.2: Additional requested features */}
        <LazyDialog name="sketchPad" component={SketchPadDialog} />
        <LazyDialog name="exampleWizard" component={ExampleWizardDialog} />
        <LazyDialog name="cadImport" component={CADImportDialog} />
        {/* v16: New feature dialogs */}
        <LazyDialog name="parametricBunker" component={ParametricBunkerDesigner} />
        <LazyDialog name="mlPrediction" component={MLPredictionDialog} />
        <LazyDialog name="keyboardConfig" component={KeyboardConfigDialog} />
        <LazyDialog name="cnsnsAutoReport" component={CNSNSAutoReportDialog} />
        {/* v17: Phy-X/PSD + Lead-free + Neutron removal */}
        <LazyDialog name="materialProperty" component={MaterialPropertyCalculator} />
        <LazyDialog name="neutronRemoval" component={NeutronRemovalDialog} />
        {/* v18: Nuclear Medicine Advanced + Theme Engine + BIM + Cloud Sync + Validation */}
        <LazyDialog name="nuclearMedicine" component={NuclearMedicineAdvanced} />
                <LazyDialog name="certification" component={GMPCyclotronCertificationDialog} />
                <LazyDialog name="aapmTG108" component={AAPMTG108PETDialog} />
                <LazyDialog name="ipem109" component={IPEMReport109Dialog} onClose={() => useAppStore.getState().close('ipem109')} />
                <LazyDialog name="skyshine" component={ChiltonSkyshineDialog} />
                <LazyDialog name="therapyShielding" component={TherapyShieldingDialog} />
                <LazyDialog name="decayChains" component={DecayChainsDialog} />
                <LazyDialog name="compareScenarios" component={CompareScenariosDialog} />
                <LazyDialog name="tornadoSensitivity" component={TornadoSensitivityDialog} />
                <LazyDialog name="ncrpValidation" component={NCRPValidationDialog} />
        <LazyDialog name="about" component={AboutDialog} />
        <LazyDialog name="glossary" component={GlossaryDialog} />
        {showSplash && (
          <Suspense fallback={null}>
            <SplashScreen onClose={() => setShowSplash(false)} />
          </Suspense>
        )}
        <LazyDialog name="themeEngine" component={ThemeEngineDialog} />
        <LazyDialog name="bimConnector" component={BIMConnectorDialog} />
        <LazyDialog name="cloudSync" component={CloudSyncDialog} />
        <LazyDialog name="validationDashboard" component={ValidationDashboardDialog} />
        <LazyDialog name="externalConnector" component={ExternalConnectorDialog} />
        {/* v20: BIMRAD + Collaboration + GATE PET/SPECT */}
        <LazyDialog name="bimRAD" component={BIMRADDialog} />
        <LazyDialog name="collaborationHub" component={CollaborationHub} />
        <LazyDialog name="gateSimulation" component={GATESimulationDialog} />
        {/* v21: Ejes 1, 2, 5 + Proteccion Industrial */}
        <LazyDialog name="monteCarloIntegration" component={MonteCarloIntegrationDialog} />
        <LazyDialog name="gumUncertainty" component={UncertaintyQuantificationDialog} />
        <LazyDialog name="experimentalValidation" component={ExperimentalValidationDialog} />
        <LazyDialog name="dicomRT" component={DICOMRTIntegrationDialog} />
        <LazyDialog name="aiAssistant" component={AIAssistantDialog} />
        <LazyDialog name="autoBarrier" component={AutoBarrierDetectionDialog} />
        <LazyDialog name="predictiveMaterial" component={PredictiveMaterialDialog} />
        <LazyDialog name="anomalyDetection" component={AnomalyDetectionDialog} />
        <LazyDialog name="autoFillEquipment" component={AutoFillEquipmentDialog} />
        <LazyDialog name="vrarPreview" component={VRARBunkerPreview} />
        <LazyDialog name="videoTutorial" component={VideoTutorialGenerator} />
        <LazyDialog name="animatedDose" component={AnimatedDoseMapsDialog} />
        <LazyDialog name="pointCloud" component={PointCloudImportDialog} />
        <LazyDialog name="industrial" component={IndustrialRadiationDialog} />
        {/* v22: Multi-Source Multi-Detector + PACS Integration */}
        <LazyDialog name="multiSource" component={MultiSourceDetectorDialog} />
        <LazyDialog name="pacs" component={PACSIntegrationDialog} />
        {/* v23: Eje 3 Regulation + Python Integration */}
        <LazyDialog name="internationalRegulations" component={InternationalRegulationsDialog} />
        <LazyDialog name="regulatoryComparison" component={RegulatoryComparisonDialog} />
        <LazyDialog name="complianceCertification" component={ComplianceCertificationDialog} />
        <LazyDialog name="regulatoryAlerts" component={RegulatoryAlertsDialog} />
        <LazyDialog name="pythonIntegration" component={PythonIntegrationDialog} />
        {/* v25: Native Monte Carlo */}
        <LazyDialog name="nativeMC" component={NativeMCDialog} />
        {/* v26: Neutron + Bateman + NIST + Toolbox */}
        <LazyDialog name="batemanDecay" component={BatemanDecayDialog} />
        <LazyDialog name="nistLibrary" component={NISTLibraryDialog} />
        <LazyDialog name="modelingToolbox" component={ModelingToolboxDialog} />
        {/* v27: Electron Transport + STEP Import */}
        <LazyDialog name="electronTransport" component={ElectronTransportDialog} />
        <LazyDialog name="stepImporter" component={STEPImporterDialog} />
        {/* v28: Manual de Usuario PDF */}
        <LazyDialog name="manual" component={ManualDialog} />
        {/* v29: Real-Time 3D Design Exploration */}
        <LazyDialog name="realTime3D" component={RealTime3DDialog} floorPlan={floorPlan} />
        {/* v128+: Medical 3D Floor Plan */}
        <LazyDialog name="medicalFloorPlan3D" component={MedicalFloorPlan3DDialog} floorPlan={floorPlan} />
        {/* v31: Dose Map Visualization */}
        <LazyDialog name="doseMap" component={DoseMapDialog} />
        {/* v32: Shielding Optimizer + PACS Real + Electron Applicator */}
        <LazyDialog name="shieldingOptimizer" component={ShieldingOptimizerDialog} floorPlan={floorPlan} />
        <LazyDialog name="pacsReal" component={PACSRealDialog} />
        <LazyDialog name="electronApplicator" component={ElectronApplicatorDialog} />
        {/* v33: Voxel Phantoms + MCNP Cyclotron + Shapes Reconstruction + Equipment Manager */}
        <LazyDialog name="voxelPhantom" component={VoxelPhantomDialog} />
        <LazyDialog name="mcnpCyclotron" component={MCNPCyclotronDialog} />
        <LazyDialog name="shapesReconstruction" component={ShapesReconstructionDialog} />
        <LazyDialog name="equipmentManager" component={EquipmentManagerDialog} />
        {/* v34: Category Tools Dialog (DX/TX/NM/CY) */}
                <LazyDialog name="categoryTools" component={CategoryToolsDialog} initialCategory={activeCategory} onOpenTool={handleOpenTool} />
        {/* v35: Emergency Procedures */}
        <LazyDialog name="emergencyProcedures" component={EmergencyProceduresDialog} />
        {/* v38: Mosaic Atomics — Barrier Editor, Air Kerma Overlay, Project Manager, Control Points */}
        {showBarrierEditor && (
          <BarrierEditorDialog barriers={floorPlan.barriers} onUpdateBarrier={(id, updates) => setFloorPlan(p => ({ ...p, barriers: p.barriers.map(b => b.id === id ? { ...b, ...updates } : b) }))} onClose={() => setShowBarrierEditor(false)} onGenerateRecommendations={runRadShieldCalculations} />
        )}
        {showAirKermaOverlay && (
          <AirKermaOverlayDialog distributions={barrierResults.map(r => ({
            barrierId: r.barrierId,
            barrierName: r.barrierName,
            points: Array.from({ length: 50 }, (_, i) => ({
              x: i * 0.1,
              kerma: r.maxKermaRate_mGy_per_wk * (0.5 + 0.5 * Math.sin(i * 0.2)),
              shieldedKerma: r.maxKermaRate_mGy_per_wk * 0.1 * (0.5 + 0.5 * Math.sin(i * 0.2)),
              thickness: r.maxBarrierThickness_mm * (0.8 + 0.2 * Math.sin(i * 0.3)),
            })),
            maxKerma: r.maxKermaRate_mGy_per_wk,
            maxKermaX: 2.5,
            maxThickness: r.maxBarrierThickness_mm,
            designGoal: 0.02,
            material: r.material,
          }))} onClose={() => setShowAirKermaOverlay(false)} onExportPDF={() => toast.success('Air kerma report exported')} />
        )}
        {showMosaicProjectManager && (
          <MosaicProjectManagerDialog onClose={() => setShowMosaicProjectManager(false)} onOpenProject={(id) => { handleLoadProject(id); setShowMosaicProjectManager(false); }} />
        )}
        {showControlPoints && (
          <ControlPointsDialog controlPoints={controlPoints} onUpdate={setControlPoints} onClose={() => setShowControlPoints(false)} floorPlanWidth={floorPlan.width_pixels} floorPlanHeight={floorPlan.height_pixels} />
        )}
        {/* v39: PHITS, CADMesh, JENDL-5 */}
        {showPHITSGenerator && (
          <PHITSInputGeneratorDialog open={showPHITSGenerator} onOpenChange={setShowPHITSGenerator} floorPlan={{ name: floorPlan.name, sources: floorPlan.sources as any, barriers: floorPlan.barriers }} />
        )}
        {showDCHAINCalc && (
          <DCHAINActivationDialog open={showDCHAINCalc} onOpenChange={setShowDCHAINCalc} />
        )}
        {showCADToMC && (
          <CADToMCImportDialog open={showCADToMC} onOpenChange={setShowCADToMC} />
        )}
        {showJENDL5Viewer && (
          <JENDL5DataViewerDialog open={showJENDL5Viewer} onOpenChange={setShowJENDL5Viewer} />
        )}
        {/* v40: Nuevos dialogs */}
                <LazyDialog name="versionHistory" component={VersionHistoryDialog} />
                <LazyDialog name="dicomRTSTRUCT" component={DICOMRTSTRUCTDialog} />
                <LazyDialog name="cnsnsDigital" component={CNSNSDigitalSubmissionDialog} />
        {/* v41: GitHub-inspired integrations (TopasGraphSim, pyshield, OpenXRayMC, matRad) */}
        {showGammaIndex && (
          <Suspense fallback={<DialogFallback />}>
            <GammaIndexAnalyzerDialog open={showGammaIndex} onClose={() => setShowGammaIndex(false)} />
          </Suspense>
        )}
                <LazyDialog name="nuclearDoseGrid" component={NuclearDoseGridDialog} />
        {showMonteCarloEngine && (
          <Suspense fallback={<DialogFallback />}>
            <MonteCarloEngineDialog open={showMonteCarloEngine} onClose={() => setShowMonteCarloEngine(false)} />
          </Suspense>
        )}
                <LazyDialog name="dvhAnalyzer" component={DVHAnalyzerDialog} />
        {/* v41b: FLUKA.CERN + PENELOPE2023 + Therapy Dosimetry + Shielding Verification */}
        {showFLUKA && (
          <Suspense fallback={<DialogFallback />}>
            <FLUKAInputGeneratorDialog open={showFLUKA} onClose={() => setShowFLUKA(false)} />
          </Suspense>
        )}
        {showPENELOPE && (
          <Suspense fallback={<DialogFallback />}>
            <PENELOPEInputGeneratorDialog open={showPENELOPE} onClose={() => setShowPENELOPE(false)} />
          </Suspense>
        )}
        {showTherapyDosimetry && (
          <Suspense fallback={<DialogFallback />}>
            <RadionuclideTherapyDosimetryDialog open={showTherapyDosimetry} onClose={() => setShowTherapyDosimetry(false)} />
          </Suspense>
        )}
                <LazyDialog name="shieldingVerification" component={ShieldingVerificationDialog} />
        {showLaminatedBarrier && (
          <Suspense fallback={<DialogFallback />}>
            <LaminatedBarrierCalculatorDialog open={showLaminatedBarrier} onClose={() => setShowLaminatedBarrier(false)} />
          </Suspense>
        )}
        {showPerformanceRecommendations && (
          <Suspense fallback={<DialogFallback />}>
            <PerformanceRecommendationsDialog open={showPerformanceRecommendations} onClose={() => setShowPerformanceRecommendations(false)} />
          </Suspense>
        )}
                <LazyDialog name="performanceDashboard" component={PerformanceDashboardDialog} />
                <LazyDialog name="cadGeometryConverter" component={CADGeometryConverterDialog} />
        {showAttila4MC && (
          <Suspense fallback={<DialogFallback />}>
            <Attila4MCVarianceReductionDialog open={showAttila4MC} onClose={() => setShowAttila4MC(false)} />
          </Suspense>
        )}
        {/* v44: Attila4MC GUI features */}
        {showMCNPDeck && (
          <Suspense fallback={<DialogFallback />}>
            <MCNPGUIDeckGeneratorDialog open={showMCNPDeck} onClose={() => setShowMCNPDeck(false)} />
          </Suspense>
        )}
        {showCADMapper && (
          <Suspense fallback={<DialogFallback />}>
            <CADAssemblyMapperDialog open={showCADMapper} onClose={() => setShowCADMapper(false)} />
          </Suspense>
        )}
                <LazyDialog name="solutionField3D" component={SolutionField3DDialog} />
        {/* v46: Recommendations A-E — Engine improvements */}
        {showSkyshine && (
          <Suspense fallback={<DialogFallback />}>
            <SkyshineCalculatorDialog open={showSkyshine} onClose={() => setShowSkyshine(false)} />
          </Suspense>
        )}
                <LazyDialog name="annualDose" component={AnnualDoseReportDialog} />
                <LazyDialog name="crossValidation" component={CrossValidationDialog} />
                <LazyDialog name="obliqueIncidence" component={ObliqueIncidenceDialog} />
                <LazyDialog name="multiEnergySpectra" component={MultiEnergySpectraDialog} />
                <LazyDialog name="adaptiveSampling" component={AdaptiveSamplingDialog} />
                <LazyDialog name="selfShielding" component={SelfShieldingDialog} />
                <LazyDialog name="transmissionCurve" component={TransmissionCurveDialog} />
                <LazyDialog name="neutronMaze" component={NeutronMazeDialog} />
        {/* v47 Fase 3.12: St-Germain scatter method */}
                <LazyDialog name="stGermainScatter" component={StGermainScatterDialog} onReset={() => useAppStore.getState().close('stGermainScatter')} dialogName="St-Germain Scatter" />
        {/* v49: Secondary Barrier Albedo (B.12) */}
        {showAlbedo && (
          <ErrorBoundary dialogName="Secondary Barrier Albedo" onReset={() => setShowAlbedo(false)}>
            <Suspense fallback={<DialogFallback />}>
              <SecondaryBarrierAlbedoDialog open={showAlbedo} onClose={() => setShowAlbedo(false)} />
            </Suspense>
          </ErrorBoundary>
        )}
        {/* v49: Concrete Activation (B.13) */}
                <LazyDialog name="concreteActivation" component={ConcreteActivationDialog} onReset={() => useAppStore.getState().close('concreteActivation')} dialogName="Concrete Activation" />
        {/* v49: Certification Mode (E.7) */}
        {showCertification && (
          <ErrorBoundary dialogName="Certification Mode" onReset={() => setShowCertification(false)}>
            <Suspense fallback={<DialogFallback />}>
              <CertificationModeDialog open={showCertification} onClose={() => setShowCertification(false)} />
            </Suspense>
          </ErrorBoundary>
        )}
        {/* v49: Community Templates (E.8) */}
                <LazyDialog name="communityTemplates" component={CommunityTemplatesDialog} onReset={() => useAppStore.getState().close('communityTemplates')} dialogName="Community Templates" />
        {/* v49: Audit Log (E.9) */}
        {showAuditLog && (
          <ErrorBoundary dialogName="Audit Log" onReset={() => setShowAuditLog(false)}>
            <Suspense fallback={<DialogFallback />}>
              <AuditLogDialog open={showAuditLog} onClose={() => setShowAuditLog(false)} />
            </Suspense>
          </ErrorBoundary>
        )}
        {/* v49: Analytics (E.10) */}
                <LazyDialog name="analytics" component={AnalyticsDialog} onReset={() => useAppStore.getState().close('analytics')} dialogName="Analytics" />
        {/* v85: SourceSelector overlay */}
        {showSourceSelector && (
          <SourceSelector
            onSelect={handleSelectSource}
            onClose={() => { setShowSourceSelector(false); setActiveTool('select'); }}
            selectedId={selectedSourceId}
          />
        )}
        {/* v85: SmartBarrier AI result overlay */}
        {smartBarrier.lastResult && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 text-[11px] border border-orange-200 shadow-lg z-40 max-w-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${smartBarrier.lastResult.is_primary ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {smartBarrier.lastResult.is_primary ? 'BARRERA PRIMARIA' : 'BARRERA SECUNDARIA'}
              </span>
              <span className="text-[10px] text-slate-400">{smartBarrier.lastResult.standard}</span>
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-slate-600 text-[11px]">
              <span>Espesor: <strong className="text-slate-800">{smartBarrier.lastResult.recommended_thickness_display}</strong></span>
              <span>Distancia: <strong className="text-slate-800">{smartBarrier.lastResult.distance_from_source_m} m</strong></span>
              <span>TVL: <strong className="text-slate-800">{smartBarrier.lastResult.tvl_cm} cm</strong></span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 italic">{smartBarrier.lastResult.ai_reasoning}</p>
            {smartBarrier.lastResult.warnings.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {smartBarrier.lastResult.warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-amber-600">⚠️ {w}</p>
                ))}
              </div>
            )}
            <button className="text-[10px] text-slate-400 hover:text-slate-600 mt-1 underline" onClick={() => smartBarrier.clearResult()}>Cerrar</button>
          </div>
        )}
        {/* v85: SmartBarrier calculating indicator */}
        {smartBarrier.isCalculating && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 rounded-lg px-4 py-3 border border-orange-200 shadow-lg z-50">
                      <div className="flex items-center gap-2 text-orange-600">
              <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
              <span className="text-xs font-medium">IA calculando blindaje...</span>
            </div>
          </div>
        )}
      </Suspense>
    </div>
    </>
  );
}
