/**
 * ═══════════════════════════════════════════════════════════
 * App Store — Zustand (merged)
 * Single store with slices for dialogs, canvas, calculation
 * ═══════════════════════════════════════════════════════════
 */

import { create } from "zustand";

// ─── Types ───
export interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string | null;
  scale_m_per_pixel: number;
  width_pixels: number;
  height_pixels: number;
  barriers: any[];
  sources: any[];
  occupiedRegions: any[];
}

const defaultFloorPlan: FloorPlan = {
  id: "plan-1",
  name: "Plano de Blindaje 1",
  imageUrl: null,
  scale_m_per_pixel: 0.01,
  width_pixels: 1000,
  height_pixels: 800,
  barriers: [],
  sources: [],
  occupiedRegions: [],
};

// ─── Dialog registry ───
const DIALOG_NAMES = [
  "export","cnsns","mc","projects","viewer3d","maze","quickBarrier","equipmentDB",
  "mcCloud","mcConfig","barrierCalculator","batchImport","costOptimizer","neutron",
  "seasonal","uncertainty","ventilation","dicom","techSpecs","cnsnsDashboard",
  "dxfViewer","auditTrail","epaGuidance","shleien","gammaKnife","braquiCo60",
  "versaHD","icru57","icru96","equipmentLibrary","referenceLibrary","ncrp151Tables",
  "shieldingCalculator","memoriaWizard","planValidator","equipmentShieldingWizard",
  "monteCarloSim","cycloneKIUBE","tutorial","cbctIgrt","layoutBunker",
  "maintenanceLog","scenarioAnalysis","dashboard","checklistCNSNS","specialCases",
  "bibliography","compareScenarios","tornadoSensitivity","ncrpValidation",
  "costEstimator","cnsnsChecklist","dashboardCalc","keyboardShortcuts",
  "smartSearchDICOM","logFileAnalysis","compareMode","batchCalc","sensitivity",
  "auditDashboard","geometrySelector","nuclideData","decayHeat","buildupFactor",
  "exposureRateProjection","sketchPad","exampleWizard","cadImport","parametricBunker",
  "mlPrediction","keyboardConfig","cnsnsAutoReport","themeEngine","bimConnector",
  "cloudSync","validationDashboard","externalConnector","bimRAD","collaborationHub",
  "gateSimulation","monteCarloIntegration","gumUncertainty","experimentalValidation",
  "dicomRT","aiAssistant","autoBarrier","predictiveMaterial","anomalyDetection",
  "autoFillEquipment","vrarPreview","videoTutorial","animatedDose","pointCloud",
  "industrial","multiSource","pacs","internationalRegulations","regulatoryComparison",
  "complianceCertification","regulatoryAlerts","pythonIntegration","nativeMC",
  "neutronShielding","batemanDecay","nistLibrary","modelingToolbox","electronTransport",
  "stepImporter","manual","about","glossary","doseMap","realTime3D","medicalFloorPlan3D",
  "shieldingOptimizer","pacsReal","electronApplicator","voxelPhantom","mcnpCyclotron",
  "shapesReconstruction","equipmentManager","categoryTools","emergencyProcedures",
  "stGermain","secondaryAlbedo","concreteActivation","certification","communityTemplates",
  "auditLog47","analytics47","performanceDashboard","cadGeometryConverter",
  "shieldingDesignAgent","commandPalette","undoRedoHistory","splash",
  "barrierEditor","airKermaOverlay","mosaicProjectManager","controlPoints",
  "phitsGenerator","dchainActivation","cadToMC","jendl5Viewer","versionHistory",
  "dicomRTSTRUCT","cnsnsDigital","gammaIndex","nuclearDoseGrid","mcEngine",
  "dvhAnalyzer","flukaGenerator","penelopeGenerator","therapyDosimetry",
  "shieldingVerification","laminatedBarrier","performanceRecommendations",
  "attila4mcVR","mcnpGUIDeck","cadAssemblyMapper","solutionField3D","skyshine",
  "annualDose","crossValidation","obliqueIncidence","multiEnergySpectra",
  "adaptiveSampling","selfShielding","transmissionCurve","neutronMaze",
  "stGermainScatter","floorCeiling","onboardingTour","welcomeScreen",
  "updateCenter","analytics","emailNotifications","docs","materialLibrary","reportManager",
  "materialProperty","neutronRemoval","nuclearMedicine","aapmTG108","ipem109","decayChains","therapyShielding",
  // v93: C.10 migrated dialogs
  "sourceSelector","mcResults","memoriaAI","historyPanel","helpPanel",
  "isodosis","dose3D","heatMap",
  "roomTemplates","layersPanel",
  // v95: Floor plan features
  "floorPlanFeatures",
  // v96: Transport + OpenCV + Pan
  "transportDialog",
  // v100-102: NIST XCOM / ONNX / Revit IFC
  "nistXcom",
  "onnxPredictor",
  "revitIfcImport",
  // v103-104: Geant4 MC / Revit Add-in C#
  "geant4Mc",
  "revitAddin",
  // v105-107: Optimizer / Comparison / Batch Export
  "multiObjectiveOptimizer",
  "materialComparison",
  "batchReportExporter",
  // v108-110: Dose Map, Neutron Shielding, Regulatory Report
  "spatialDoseMap",
  "regulatoryReport",
  // v114-116: Multi-Layer Shield / Source Library / 3D Isosurface
  "multiLayerShield",
  "sourceLibrary",
  "isosurface3d",
  // v117-120: PDF Report / Sensitivity / Pareto / Parametric 3D
  "pdfReport",
  "sensitivityAnalysis",
  "paretoOptimizer",
  "parametric3d",
  // v121-123: Design Compare / ALARA Wizard / Nuclide Library 500+
  "designCompare",
  "alaraWizard",
  "nuclideLibrary500",
  // v124-127: Dark Mode / DXF Export / Dose Sweep / Keyboard Shortcuts
  "darkMode",
  "dxfExport",
  "doseSweep",
  "keyboardShortcuts",
  "evidencePack",
] as const;

export type DialogName = (typeof DIALOG_NAMES)[number];

// ─── MC Job ───
interface MCJob {
  jobId: number;
  format: string;
  particles: number;
  jobName: string;
}

// ─── Single Store ───
interface AppState {
  // ── Dialogs ──
  dialogs: Record<string, any>;
  open: (name: DialogName | string) => void;
  close: (name: DialogName | string) => void;
  closeAll: () => void;
  /** C.10: Open exclusively — closes all others then opens target */
  openExclusive: (name: DialogName | string) => void;
  /** C.10: Dialog history stack for Escape/back navigation */
  dialogHistory: string[];
  /** C.10: Go back to previous dialog */
  goBack: () => void;
  /** C.10: Check if any dialog is open */
  readonly isAnyOpen: boolean;

  // ── Canvas / FloorPlan ──
  floorPlan: FloorPlan;
  setFloorPlan: (p: FloorPlan) => void;
  activeTool: string;
  setActiveTool: (t: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // ── Calculation ──
  isCalculating: boolean;
  setIsCalculating: (v: boolean) => void;
  mcJob: MCJob | null;
  setMcJob: (j: MCJob | null) => void;
  lastResult: string | null;
  setLastResult: (r: string | null) => void;

  // ── App ──
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showSplash: boolean;
  setShowSplash: (v: boolean) => void;
  activeCategory: string | null;
  setActiveCategory: (c: string | null) => void;
}

/**
 * Diálogos de menú que duplicaban a otro ya implementado (etapa 3, 2026-11-01): abrir la clave
 * antigua abre el diálogo real. Los menús, atajos y accesos rápidos existentes siguen funcionando.
 */
export const DIALOGOS_REDIRIGIDOS: Readonly<Record<string, string>> = {
  shieldingCalculator: 'barrierCalculator',
  quickBarrier: 'barrierCalculator',
  shleien: 'referenceLibrary',
  solutionField3D: 'viewer3d',
  uncertainty: 'gumUncertainty',
  validationDashboard: 'ncrpValidation',
};

export const resolverDialogo = (name: string): string => DIALOGOS_REDIRIGIDOS[name] ?? name;

/**
 * Estado abierto de un diálogo. `dialogs[nombre]` es booleano (`open()` guarda `true`); varios diálogos
 * leían `dialogs.x?.open ?? false`, que sobre un booleano siempre da `false`, y nunca se abrían (Fase 6).
 * Se acepta también la forma `{ open: true }` por compatibilidad.
 */
export const dialogoAbierto = (d: unknown): boolean =>
  d === true || (typeof d === "object" && d !== null && (d as { open?: unknown }).open === true);

export const useAppStore = create<AppState>((set, get) => ({
  // Dialogs
  dialogs: Object.fromEntries(DIALOG_NAMES.map((n) => [n, false])) as Record<string, any>,
  dialogHistory: [],
  open: (alias) => set((s) => {
    const name = resolverDialogo(alias);
    return {
    dialogs: { ...s.dialogs, [name]: true },
    dialogHistory: s.dialogHistory.includes(name) ? s.dialogHistory : [...s.dialogHistory, name],
    };
  }),
  close: (name) => set((s) => ({
    dialogs: { ...s.dialogs, [name]: false },
    dialogHistory: s.dialogHistory.filter((n) => n !== name),
  })),
  closeAll: () => set({ dialogs: Object.fromEntries(DIALOG_NAMES.map((n) => [n, false])) as Record<string, any>, dialogHistory: [] }),
  openExclusive: (alias) => set((s) => {
    const name = resolverDialogo(alias);
    const allClosed = Object.fromEntries(DIALOG_NAMES.map((n) => [n, false])) as Record<string, any>;
    allClosed[name] = true;
    return { dialogs: allClosed, dialogHistory: [...s.dialogHistory.filter((n) => n !== name), name] };
  }),
  goBack: () => {
    const s = get();
    if (s.dialogHistory.length <= 1) {
      set({ dialogs: Object.fromEntries(DIALOG_NAMES.map((n) => [n, false])) as Record<string, boolean>, dialogHistory: [] });
      return;
    }
    const prev = s.dialogHistory[s.dialogHistory.length - 2];
    const newHistory = s.dialogHistory.slice(0, -1);
    const allClosed = Object.fromEntries(DIALOG_NAMES.map((n) => [n, false])) as Record<string, boolean>;
    if (prev) allClosed[prev] = true;
    set({ dialogs: allClosed, dialogHistory: newHistory });
  },
  get isAnyOpen() {
    return Object.values(get().dialogs).some((v) => v);
  },

  // Canvas
  floorPlan: defaultFloorPlan,
  setFloorPlan: (p) => set({ floorPlan: p }),
  activeTool: "select",
  setActiveTool: (t) => set({ activeTool: t }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Calculation
  isCalculating: false,
  setIsCalculating: (v) => set({ isCalculating: v }),
  mcJob: null,
  setMcJob: (j) => set({ mcJob: j }),
  lastResult: null,
  setLastResult: (r) => set({ lastResult: r }),

  // App
  isDarkMode: false,
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  showSplash: true,
  setShowSplash: (v) => set({ showSplash: v }),
  activeCategory: null,
  setActiveCategory: (c) => set({ activeCategory: c }),
}));

// Convenience hook
export function useDialog(name: DialogName) {
  const store = useAppStore();
  return {
    isOpen: store.dialogs[name] || false,
    open: () => store.open(name),
    close: () => store.close(name),
  };
}
