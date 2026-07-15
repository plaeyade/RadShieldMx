/**
 * ═══════════════════════════════════════════════════════════
 * Dialog Registry — C.10 DialogManager
 * Lightweight name registry WITHOUT static imports.
 * Dialog rendering stays with LazyDialog components.
 * ═══════════════════════════════════════════════════════════
 */

// All known dialog names for validation and introspection
const DIALOG_NAMES = new Set([
  'export','cnsns','mc','projects','viewer3d','maze','quickBarrier','equipmentDB',
  'mcCloud','mcConfig','barrierCalculator','batchImport','costOptimizer','neutron',
  'seasonal','uncertainty','ventilation','dicom','techSpecs','cnsnsDashboard',
  'dxfViewer','auditTrail','epaGuidance','shleien','gammaKnife','braquiCo60',
  'versaHD','icru57','icru96','equipmentLibrary','referenceLibrary','ncrp151Tables',
  'shieldingCalculator','memoriaWizard','planValidator','equipmentShieldingWizard',
  'monteCarloSim','cycloneKIUBE','tutorial','cbctIgrt','layoutBunker',
  'maintenanceLog','scenarioAnalysis','dashboard','checklistCNSNS','specialCases',
  'bibliography','compareScenarios','tornadoSensitivity','ncrpValidation',
  'costEstimator','cnsnsChecklist','dashboardCalc','keyboardShortcuts',
  'smartSearchDICOM','logFileAnalysis','compareMode','batchCalc','sensitivity',
  'auditDashboard','geometrySelector','nuclideData','decayHeat','buildupFactor',
  'exposureRateProjection','sketchPad','exampleWizard','cadImport','parametricBunker',
  'mlPrediction','keyboardConfig','cnsnsAutoReport','themeEngine','bimConnector',
  'cloudSync','validationDashboard','externalConnector','bimRAD','collaborationHub',
  'gateSimulation','monteCarloIntegration','gumUncertainty','experimentalValidation',
  'dicomRT','aiAssistant','autoBarrier','predictiveMaterial','anomalyDetection',
  'autoFillEquipment','vrarPreview','videoTutorial','animatedDose','pointCloud',
  'industrial','multiSource','pacs','internationalRegulations','regulatoryComparison',
  'complianceCertification','regulatoryAlerts','pythonIntegration','nativeMC',
  'neutronShielding','batemanDecay','nistLibrary','modelingToolbox','electronTransport',
  'stepImporter','manual','about','glossary','doseMap','realTime3D','medicalFloorPlan3D',
  'shieldingOptimizer','pacsReal','electronApplicator','voxelPhantom','mcnpCyclotron',
  'shapesReconstruction','equipmentManager','categoryTools','emergencyProcedures',
  'stGermain','secondaryAlbedo','concreteActivation','certification','communityTemplates',
  'auditLog47','analytics47','performanceDashboard','cadGeometryConverter',
  'shieldingDesignAgent','commandPalette','undoRedoHistory','splash',
  'barrierEditor','airKermaOverlay','mosaicProjectManager','controlPoints',
  'phitsGenerator','dchainActivation','cadToMC','jendl5Viewer','versionHistory',
  'dicomRTSTRUCT','cnsnsDigital','gammaIndex','nuclearDoseGrid','mcEngine',
  'dvhAnalyzer','flukaGenerator','penelopeGenerator','therapyDosimetry',
  'shieldingVerification','laminatedBarrier','performanceRecommendations',
  'attila4mcVR','mcnpGUIDeck','cadAssemblyMapper','solutionField3D','skyshine',
  'annualDose','crossValidation','obliqueIncidence','multiEnergySpectra',
  'adaptiveSampling','selfShielding','transmissionCurve','neutronMaze',
  'stGermainScatter','floorCeiling','onboardingTour','welcomeScreen',
  'updateCenter','analytics','emailNotifications','docs','materialLibrary',
  'materialProperty','neutronRemoval','nuclearMedicine','aapmTG108','ipem109','decayChains','therapyShielding','evidencePack',
]);

/** Check if a dialog name is registered */
export function isDialogRegistered(name: string): boolean {
  return DIALOG_NAMES.has(name);
}

/** Get all registered dialog names */
export function getRegisteredDialogNames(): string[] {
  return Array.from(DIALOG_NAMES);
}

/** Get dialog count */
export function getDialogCount(): number {
  return DIALOG_NAMES.size;
}

export { DIALOG_NAMES };
