/**
 * ═══════════════════════════════════════════════════════════
 * Dialog Imports — All lazy-loaded dialogs in one place
 * Centralized for ShieldingDesigner decomposicion
 * ═══════════════════════════════════════════════════════════
 */
import { lazy } from "react";

// Eagerly loaded (small, always needed)
export { default as KeyboardShortcutsDialog } from "@/sections/dialogs/KeyboardShortcutsDialog";
export { default as SmartSearchDICOMDialog } from "@/sections/dialogs/SmartSearchDICOMDialog";
export { default as LogFileAnalysisDialog } from "@/sections/dialogs/LogFileAnalysisDialog";

// ─── Lazy-loaded dialogs ───
export const CompareModeDialog = lazy(() => import("@/sections/dialogs/CompareModeDialog"));
export const BatchCalculationDialog = lazy(() => import("@/sections/dialogs/BatchCalculationDialog"));
export const SensitivityAnalysisDialog = lazy(() => import("@/sections/dialogs/SensitivityAnalysis"));
export const AuditDashboardDialog = lazy(() => import("@/sections/dialogs/AuditDashboardDialog"));
export const GeometrySelectorDialog = lazy(() => import("@/sections/dialogs/GeometrySelectorDialog"));
export const NuclideDataViewer = lazy(() => import("@/sections/dialogs/NuclideDataViewer"));
export const DecayHeatCalculator = lazy(() => import("@/sections/dialogs/DecayHeatCalculator"));
export const BuildupFactorDialog = lazy(() => import("@/sections/dialogs/BuildupFactorDialog"));
export const ExposureRateProjectionDialog = lazy(() => import("@/sections/dialogs/ExposureRateProjectionDialog"));
export const SketchPadDialog = lazy(() => import("@/sections/dialogs/SketchPadDialog"));
export const ExampleWizardDialog = lazy(() => import("@/sections/dialogs/ExampleWizardDialog"));
export const CADImportDialog = lazy(() => import("@/sections/dialogs/CADImportDialog"));
export const ParametricBunkerDesigner = lazy(() => import("@/sections/dialogs/ParametricBunkerDesigner"));
export const MLPredictionDialog = lazy(() => import("@/sections/dialogs/MLPredictionDialog"));
export const KeyboardConfigDialog = lazy(() => import("@/sections/dialogs/KeyboardConfigDialog"));
export const CNSNSAutoReportDialog = lazy(() => import("@/sections/dialogs/CNSNSAutoReportDialog"));
export const OnboardingTour = lazy(() => import("@/components/OnboardingTour"));
export const MaterialPropertyCalculator = lazy(() => import("@/sections/dialogs/MaterialPropertyCalculator"));
export const LeadFreeMaterialsDialog = lazy(() => import("@/sections/dialogs/LeadFreeMaterialsDialog"));
export const NeutronRemovalDialog = lazy(() => import("@/sections/dialogs/NeutronRemovalDialog"));
export const NuclearMedicineAdvanced = lazy(() => import("@/sections/dialogs/NuclearMedicineAdvanced"));
export const GMPCyclotronCertificationDialog = lazy(() => import("@/sections/dialogs/GMPCyclotronCertificationDialog"));
export const AAPMTG108PETDialog = lazy(() => import("@/sections/dialogs/AAPMTG108PETDialog"));
export const IPEMReport109Dialog = lazy(() => import("@/sections/dialogs/IPEMReport109Dialog"));
export const ChiltonSkyshineDialog = lazy(() => import("@/sections/dialogs/ChiltonSkyshineDialog"));
export const TherapyShieldingDialog = lazy(() => import("@/sections/dialogs/TherapyShieldingDialog"));
export const DecayChainsDialog = lazy(() => import("@/sections/dialogs/DecayChainsDialog"));
export const CompareScenariosDialog = lazy(() => import("@/sections/dialogs/CompareScenariosDialog"));
export const TornadoSensitivityDialog = lazy(() => import("@/sections/dialogs/TornadoSensitivityDialog"));
export const NCRPValidationDialog = lazy(() => import("@/sections/dialogs/NCRPValidationDialog"));
export const ThemeEngineDialog = lazy(() => import("@/sections/dialogs/ThemeEngineDialog"));
export const BIMConnectorDialog = lazy(() => import("@/sections/dialogs/BIMConnectorDialog"));
export const CloudSyncDialog = lazy(() => import("@/sections/dialogs/CloudSyncDialog"));
export const ValidationDashboardDialog = lazy(() => import("@/sections/dialogs/ValidationDashboardDialog"));
export const ExternalConnectorDialog = lazy(() => import("@/sections/dialogs/ExternalConnectorDialog"));
export const BIMRADDialog = lazy(() => import("@/sections/dialogs/BIMRADDialog"));
export const CollaborationHub = lazy(() => import("@/sections/dialogs/CollaborationHub"));
export const GATESimulationDialog = lazy(() => import("@/sections/dialogs/GATESimulationDialog"));
export const ShieldingDesignAgentDialog = lazy(() => import("@/sections/dialogs/ShieldingDesignAgentDialog"));
export const MonteCarloIntegrationDialog = lazy(() => import("@/sections/dialogs/MonteCarloIntegrationDialog"));
export const UncertaintyQuantificationDialog = lazy(() => import("@/sections/dialogs/UncertaintyQuantificationDialog"));
export const ExperimentalValidationDialog = lazy(() => import("@/sections/dialogs/ExperimentalValidationDialog"));
export const DICOMRTIntegrationDialog = lazy(() => import("@/sections/dialogs/DICOMRTIntegrationDialog"));
export const AIAssistantDialog = lazy(() => import("@/sections/dialogs/AIAssistantDialog"));
export const AutoBarrierDetectionDialog = lazy(() => import("@/sections/dialogs/AutoBarrierDetectionDialog"));
export const PredictiveMaterialDialog = lazy(() => import("@/sections/dialogs/PredictiveMaterialDialog"));
export const AnomalyDetectionDialog = lazy(() => import("@/sections/dialogs/AnomalyDetectionDialog"));
export const AutoFillEquipmentDialog = lazy(() => import("@/sections/dialogs/AutoFillEquipmentDialog"));
export const VRARBunkerPreview = lazy(() => import("@/sections/dialogs/VRARBunkerPreview"));
export const VideoTutorialGenerator = lazy(() => import("@/sections/dialogs/VideoTutorialGenerator"));
export const AnimatedDoseMapsDialog = lazy(() => import("@/sections/dialogs/AnimatedDoseMapsDialog"));
export const PointCloudImportDialog = lazy(() => import("@/sections/dialogs/PointCloudImportDialog"));
export const IndustrialRadiationDialog = lazy(() => import("@/sections/dialogs/IndustrialRadiationDialog"));
export const MultiSourceDetectorDialog = lazy(() => import("@/sections/dialogs/MultiSourceDetectorDialog"));
export const PACSIntegrationDialog = lazy(() => import("@/sections/dialogs/PACSIntegrationDialog"));
export const InternationalRegulationsDialog = lazy(() => import("@/sections/dialogs/InternationalRegulationsDialog"));
export const RegulatoryComparisonDialog = lazy(() => import("@/sections/dialogs/RegulatoryComparisonDialog"));
export const ComplianceCertificationDialog = lazy(() => import("@/sections/dialogs/ComplianceCertificationDialog"));
export const RegulatoryAlertsDialog = lazy(() => import("@/sections/dialogs/RegulatoryAlertsDialog"));
export const PythonIntegrationDialog = lazy(() => import("@/sections/dialogs/PythonIntegrationDialog"));
export const NativeMCDialog = lazy(() => import("@/sections/dialogs/NativeMCDialog"));
export const NeutronShieldingDialog = lazy(() => import("@/sections/dialogs/NeutronShieldingDialog"));
export const BatemanDecayDialog = lazy(() => import("@/sections/dialogs/BatemanDecayDialog"));
export const NISTLibraryDialog = lazy(() => import("@/sections/dialogs/NISTLibraryDialog"));
export const ModelingToolboxDialog = lazy(() => import("@/sections/dialogs/ModelingToolboxDialog"));
export const ElectronTransportDialog = lazy(() => import("@/sections/dialogs/ElectronTransportDialog"));
export const STEPImporterDialog = lazy(() => import("@/sections/dialogs/STEPImporterDialog"));
export const ManualDialog = lazy(() => import("@/sections/dialogs/ManualDialog"));
export const MemoriaAIWizard = lazy(() => import("@/sections/dialogs/MemoriaAIWizard"));
export const DoseMapDialog = lazy(() => import("@/sections/dialogs/DoseMapDialog"));
export const RealTime3DDialog = lazy(() => import("@/sections/dialogs/RealTime3DDialog"));
export const ShieldingOptimizerDialog = lazy(() => import("@/sections/dialogs/ShieldingOptimizerDialog"));
export const PACSRealDialog = lazy(() => import("@/sections/dialogs/PACSRealDialog"));
export const ElectronApplicatorDialog = lazy(() => import("@/sections/dialogs/ElectronApplicatorDialog"));
export const VoxelPhantomDialog = lazy(() => import("@/sections/dialogs/VoxelPhantomDialog"));
export const MCNPCyclotronDialog = lazy(() => import("@/sections/dialogs/MCNPCyclotronDialog"));
export const ShapesReconstructionDialog = lazy(() => import("@/sections/dialogs/ShapesReconstructionDialog"));
export const EquipmentManagerDialog = lazy(() => import("@/sections/dialogs/EquipmentManagerDialog"));
export const CategoryToolsDialog = lazy(() => import("@/sections/dialogs/CategoryToolsDialog"));
export const EmergencyProceduresDialog = lazy(() => import("@/sections/dialogs/EmergencyProceduresDialog"));
export const AuditTrailDialog = lazy(() => import("@/sections/dialogs/AuditTrailDialog"));
export const EPAGuidanceDialog = lazy(() => import("@/sections/dialogs/EPAGuidanceDialog"));
export const ShleienHandbookDialog = lazy(() => import("@/sections/dialogs/ShleienHandbookDialog"));
export const GammaKnifeDialog = lazy(() => import("@/sections/dialogs/GammaKnifeDialog"));
export const BraquiterapiaCo60Dialog = lazy(() => import("@/sections/dialogs/BraquiterapiaCo60Dialog"));
export const VersaHD15MVDialog = lazy(() => import("@/sections/dialogs/VersaHD15MVDialog"));
export const CycloneKIUBEWizard = lazy(() => import("@/sections/dialogs/CycloneKIUBEWizard"));
export const EquipmentLibraryDialog = lazy(() => import("@/sections/dialogs/EquipmentLibraryDialog"));
export const DashboardDialog = lazy(() => import("@/sections/dialogs/DashboardDialog"));
export const DXFViewerDialog = lazy(() => import("@/sections/dialogs/DXFViewerDialog"));
export const LayoutBunkerDialog = lazy(() => import("@/sections/dialogs/LayoutBunkerDialog"));
export const MazeCalculatorDialog = lazy(() => import("@/sections/dialogs/MazeCalculatorDialog"));
export const ReferenceLibraryDialog = lazy(() => import("@/sections/dialogs/ReferenceLibraryDialog"));
export const NCRP151TablesDialog = lazy(() => import("@/sections/dialogs/NCRP151TablesDialog"));
export const ExportDialog = lazy(() => import("@/sections/dialogs/ExportDialog"));
export const MCDialog = lazy(() => import("@/sections/dialogs/MCDialog"));
export const ProjectManagerDialog = lazy(() => import("@/sections/dialogs/ProjectManagerDialog"));
export const Viewer3DDialog = lazy(() => import("@/sections/dialogs/Viewer3DDialog"));
export const QuickBarrierDialog = lazy(() => import("@/sections/dialogs/QuickBarrierDialog"));
export const EquipmentDBDialog = lazy(() => import("@/sections/dialogs/EquipmentDBDialog"));
export const MCCloudDialog = lazy(() => import("@/sections/dialogs/MCCloudDialog"));
export const MCConfigDialog = lazy(() => import("@/sections/dialogs/MCConfigDialog"));
export const MCResultsDialog = lazy(() => import("@/sections/dialogs/MCResultsDialog"));
export const BarrierCalculatorDialog = lazy(() => import("@/sections/dialogs/BarrierCalculatorDialog"));
export const DashboardCalcDialog = lazy(() => import("@/sections/dialogs/DashboardCalcDialog"));
export const CostEstimatorDialog = lazy(() => import("@/sections/dialogs/CostEstimatorDialog"));
export const CNSNSChecklistDialog = lazy(() => import("@/sections/dialogs/CNSNSChecklistDialog"));
export const BatchImportDialog = lazy(() => import("@/sections/dialogs/BatchImportDialog"));
export const CostOptimizerDialog = lazy(() => import("@/sections/dialogs/CostOptimizerDialog"));
export const NeutronDialog = lazy(() => import("@/sections/dialogs/NeutronDialog"));
export const SeasonalDialog = lazy(() => import("@/sections/dialogs/SeasonalDialog"));
export const UncertaintyDialog = lazy(() => import("@/sections/dialogs/UncertaintyDialog"));
export const VentilationDialog = lazy(() => import("@/sections/dialogs/VentilationDialog"));
export const DICOMDialog = lazy(() => import("@/sections/dialogs/DICOMDialog"));
export const TechSpecsDialog = lazy(() => import("@/sections/dialogs/TechSpecsDialog"));
export const CNSNSDashboardDialog = lazy(() => import("@/sections/dialogs/CNSNSDashboardDialog"));
export const ShieldingCalculatorDialog = lazy(() => import("@/sections/dialogs/ShieldingCalculatorDialog"));
export const CBCTIGRTDialog = lazy(() => import("@/sections/dialogs/CBCTIGRTDialog"));
export const MaintenanceLogDialog = lazy(() => import("@/sections/dialogs/MaintenanceLogDialog"));
export const ScenarioAnalysisDialog = lazy(() => import("@/sections/dialogs/ScenarioAnalysisDialog"));
export const ChecklistCNSNSDialog = lazy(() => import("@/sections/dialogs/ChecklistCNSNSDialog"));
export const CNSNSDialog = lazy(() => import("@/sections/dialogs/CNSNSDialog"));
export const SpecialCasesDialog = lazy(() => import("@/sections/dialogs/SpecialCasesDialog"));
export const BibliographyDialog = lazy(() => import("@/sections/dialogs/BibliographyDialog"));
export const PlanValidatorDialog = lazy(() => import("@/sections/dialogs/PlanValidatorDialog"));
export const EquipmentShieldingWizard = lazy(() => import("@/sections/dialogs/EquipmentShieldingWizard"));
export const MonteCarloSimulationWizard = lazy(() => import("@/sections/dialogs/MonteCarloSimulationWizard"));
export const AboutDialog = lazy(() => import("@/sections/dialogs/AboutDialog"));
export const GlossaryDialog = lazy(() => import("@/sections/dialogs/GlossaryDialog"));
export const SplashScreen = lazy(() => import("@/sections/dialogs/SplashScreen"));
export const FloorCeilingDialog = lazy(() => import("@/sections/dialogs/FloorCeilingDialog"));
// v38
export const BarrierEditorDialog = lazy(() => import("@/sections/dialogs/BarrierEditor"));
export const AirKermaOverlayDialog = lazy(() => import("@/sections/dialogs/AirKermaOverlay"));
export const MosaicProjectManagerDialog = lazy(() => import("@/sections/dialogs/ProjectManager"));
export const ControlPointsDialog = lazy(() => import("@/sections/dialogs/ControlPointsDialog"));
// v39
export const PHITSInputGeneratorDialog = lazy(() => import("@/sections/dialogs/PHITSInputGenerator"));
export const DCHAINActivationDialog = lazy(() => import("@/sections/dialogs/DCHAINActivationCalculator"));
export const CADToMCImportDialog = lazy(() => import("@/sections/dialogs/CADToMCImport"));
export const JENDL5DataViewerDialog = lazy(() => import("@/sections/dialogs/JENDL5DataViewer"));
// v40
export const VersionHistoryDialog = lazy(() => import("@/sections/dialogs/VersionHistoryDialog"));
export const DICOMRTSTRUCTDialog = lazy(() => import("@/sections/dialogs/DICOMRTSTRUCTDialog"));
export const CNSNSDigitalSubmissionDialog = lazy(() => import("@/sections/dialogs/CNSNSDigitalSubmission"));
// v41
export const GammaIndexAnalyzerDialog = lazy(() => import("@/sections/dialogs/GammaIndexAnalyzer"));
export const NuclearDoseGridDialog = lazy(() => import("@/sections/dialogs/NuclearDoseGrid"));
export const MonteCarloEngineDialog = lazy(() => import("@/sections/dialogs/MonteCarloEngine"));
export const DVHAnalyzerDialog = lazy(() => import("@/sections/dialogs/DVHAnalyzer"));
// v41b
export const FLUKAInputGeneratorDialog = lazy(() => import("@/sections/dialogs/FLUKAInputGenerator"));
export const PENELOPEInputGeneratorDialog = lazy(() => import("@/sections/dialogs/PENELOPEInputGenerator"));
export const RadionuclideTherapyDosimetryDialog = lazy(() => import("@/sections/dialogs/RadionuclideTherapyDosimetry"));
export const ShieldingVerificationDialog = lazy(() => import("@/sections/dialogs/ShieldingVerification"));
// v42
export const LaminatedBarrierCalculatorDialog = lazy(() => import("@/sections/dialogs/LaminatedBarrierCalculator"));
export const PerformanceRecommendationsDialog = lazy(() => import("@/sections/dialogs/PerformanceRecommendations"));
// v43+
export const Attila4MCVarianceReductionDialog = lazy(() => import("@/sections/dialogs/Attila4MCVarianceReduction"));
// v44
export const MCNPGUIDeckGeneratorDialog = lazy(() => import("@/sections/dialogs/MCNPGUIDeckGenerator"));
export const CADAssemblyMapperDialog = lazy(() => import("@/sections/dialogs/CADAssemblyMapper"));
export const SolutionField3DDialog = lazy(() => import("@/sections/dialogs/SolutionField3D"));
// v46
export const SkyshineCalculatorDialog = lazy(() => import("@/sections/dialogs/SkyshineCalculator"));
export const AnnualDoseReportDialog = lazy(() => import("@/sections/dialogs/AnnualDoseReport"));
export const CrossValidationDialog = lazy(() => import("@/sections/dialogs/CrossValidationDialog"));
export const ObliqueIncidenceDialog = lazy(() => import("@/sections/dialogs/ObliqueIncidenceDialog"));
export const MultiEnergySpectraDialog = lazy(() => import("@/sections/dialogs/MultiEnergySpectraDialog"));
export const AdaptiveSamplingDialog = lazy(() => import("@/sections/dialogs/AdaptiveSamplingDialog"));
export const SelfShieldingDialog = lazy(() => import("@/sections/dialogs/SelfShieldingDialog"));
export const TransmissionCurveDialog = lazy(() => import("@/sections/dialogs/TransmissionCurveDialog"));
export const NeutronMazeDialog = lazy(() => import("@/sections/dialogs/NeutronMazeDialog"));
// v47
export const StGermainScatterDialog = lazy(() => import("@/sections/dialogs/StGermainScatterDialog"));
export const SecondaryBarrierAlbedoDialog = lazy(() => import("@/sections/dialogs/SecondaryBarrierAlbedoDialog"));
export const ConcreteActivationDialog = lazy(() => import("@/sections/dialogs/ConcreteActivationDialog"));
export const CertificationModeDialog = lazy(() => import("@/sections/dialogs/CertificationModeDialog"));
export const CommunityTemplatesDialog = lazy(() => import("@/sections/dialogs/CommunityTemplatesDialog"));
export const AuditLogDialog47 = lazy(() => import("@/sections/dialogs/AuditLogDialog"));
export const AnalyticsDialog47 = lazy(() => import("@/sections/dialogs/AnalyticsDialog"));
// v50
export const PerformanceDashboardDialog = lazy(() => import("@/sections/dialogs/PerformanceDashboardDialog"));
// v51
export const CADGeometryConverterDialog = lazy(() => import("@/sections/dialogs/CADGeometryConverterDialog"));
