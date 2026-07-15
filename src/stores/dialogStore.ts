/**
 * ═══════════════════════════════════════════════════════════
 * Dialog Store — Zustand
 * Centralizes ALL dialog visibility states (~80 dialogs)
 * Replaces ~80 useState<boolean> in ShieldingDesigner.tsx
 * ═══════════════════════════════════════════════════════════
 */

import { create } from "zustand";

interface DialogState {
  // Map of dialog name -> boolean (open/closed)
  dialogs: Record<string, boolean>;
  // Open a dialog
  open: (name: string) => void;
  // Close a dialog
  close: (name: string) => void;
  // Toggle a dialog
  toggle: (name: string) => void;
  // Close all dialogs
  closeAll: () => void;
  // Check if any dialog is open
  isAnyOpen: () => boolean;
  // Active category for category tools
  activeCategory: string | null;
  setActiveCategory: (cat: string | null) => void;
}

// All 80+ dialog names used in the app
export const DIALOG_NAMES = [
  "export", "cnsns", "mc", "projects", "viewer3d", "maze", "quickBarrier",
  "equipmentDB", "mcCloud", "mcConfig", "mcResults", "barrierCalculator",
  "batchImport", "costOptimizer", "neutron", "seasonal", "uncertainty",
  "ventilation", "dicom", "techSpecs", "cnsnsDashboard", "dxfViewer",
  "auditTrail", "epaGuidance", "shleien", "gammaKnife", "braquiCo60",
  "versaHD", "icru57", "icru96", "equipmentLibrary", "referenceLibrary",
  "ncrp151Tables", "shieldingCalculator", "memoriaWizard", "planValidator",
  "equipmentShieldingWizard", "monteCarloSim", "cycloneKIUBE", "tutorial",
  "cbctIgrt", "layoutBunker", "maintenanceLog", "scenarioAnalysis",
  "dashboard", "checklistCNSNS", "specialCases", "bibliography",
  "compareScenarios", "tornadoSensitivity", "ncrpValidation",
  "costEstimator", "cnsnsChecklist", "dashboardCalc",
  "keyboardShortcuts", "smartSearchDICOM", "logFileAnalysis",
  // v16+
  "compareMode", "batchCalc", "sensitivity", "auditDashboard",
  "geometrySelector", "nuclideData", "decayHeat", "buildupFactor",
  "exposureRateProjection", "sketchPad", "exampleWizard", "cadImport",
  "parametricBunker", "mlPrediction", "keyboardConfig", "cnsnsAutoReport",
  "themeEngine", "bimConnector", "cloudSync", "validationDashboard",
  "externalConnector", "bimRAD", "collaborationHub", "gateSimulation",
  "monteCarloIntegration", "gumUncertainty", "experimentalValidation",
  "dicomRT", "aiAssistant", "autoBarrier", "predictiveMaterial",
  "anomalyDetection", "autoFillEquipment", "vrarPreview", "videoTutorial",
  "animatedDose", "pointCloud", "industrial", "multiSource", "pacs",
  "internationalRegulations", "regulatoryComparison", "complianceCertification",
  "regulatoryAlerts", "pythonIntegration", "nativeMC", "neutronShielding",
  "batemanDecay", "nistLibrary", "modelingToolbox", "electronTransport",
  "stepImporter", "manual", "about", "glossary", "doseMap", "realTime3D",
  "medicalFloorPlan3D",
  "shieldingOptimizer", "pacsReal", "electronApplicator", "voxelPhantom",
  "mcnpCyclotron", "shapesReconstruction", "equipmentManager",
  "categoryTools", "emergencyProcedures", "epa", "stGermain",
  "secondaryBarrierAlbedo", "concreteActivation", "certificationMode",
  "communityTemplates", "auditLog", "analytics",
  // v38+
  "barrierEditor", "airKermaOverlay", "mosaicProjectManager", "controlPoints",
  // v39+
  "phitsGenerator", "dchainActivation", "cadToMC", "jendl5Viewer",
  // v40+
  "versionHistory", "dicomRTSTRUCT", "cnsnsDigital",
  // v41
  "gammaIndex", "nuclearDoseGrid", "mcEngine", "dvhAnalyzer",
  // v41b
  "flukaGenerator", "penelopeGenerator", "therapyDosimetry", "shieldingVerification",
  // v42
  "laminatedBarrier", "performanceRecommendations",
  // v43+
  "attila4mcVR",
  // v44
  "mcnpGUIDeck", "cadAssemblyMapper", "solutionField3D",
  // v46
  "skyshine", "annualDose", "crossValidation", "obliqueIncidence",
  "multiEnergySpectra", "adaptiveSampling", "selfShielding",
  "transmissionCurve", "neutronMaze",
  // v47
  "stGermainScatter", "secondaryAlbedo", "concreteAct",
  "certification", "communityTemplates47", "auditLog47", "analytics47",
  // v50
  "performanceDashboard",
  // v51
  "cadGeometryConverter",
  // v52
  "shieldingDesignAgent",
  // Utility
  "commandPalette", "undoRedoHistory", "canvasSearch", "isodosisViewer",
  "doseMapping3D", "heatMapViewer", "welcomeScreen", "onboardingTour",
  "memoriaAI", "materialProperty", "leadFreeMaterials", "neutronRemoval",
  "nuclearMedicine", "gmpCertification", "aapmTG108", "ipem109",
  "chiltonSkyshine", "therapyShielding", "decayChains",
  "floorCeiling",
] as const;

export type DialogName = (typeof DIALOG_NAMES)[number];

export const useDialogStore = create<DialogState>((set, get) => ({
  dialogs: Object.fromEntries(DIALOG_NAMES.map((n) => [n, false])) as Record<string, boolean>,

  open: (name) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [name]: true },
    })),

  close: (name) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [name]: false },
    })),

  toggle: (name) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [name]: !state.dialogs[name] },
    })),

  closeAll: () =>
    set({
      dialogs: Object.fromEntries(DIALOG_NAMES.map((n) => [n, false])) as Record<string, boolean>,
    }),

  isAnyOpen: () => Object.values(get().dialogs).some((v) => v),

  activeCategory: null,
  setActiveCategory: (cat) => set({ activeCategory: cat }),
}));

// ─── Convenience hook for a single dialog ───
export function useDialog(name: DialogName) {
  const store = useDialogStore();
  return {
    isOpen: store.dialogs[name] || false,
    open: () => store.open(name),
    close: () => store.close(name),
    toggle: () => store.toggle(name),
  };
}
