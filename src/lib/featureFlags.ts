/**
 * C.14: Feature Flags System
 * Toggle features without redeploying
 */
export interface FeatureFlags {
  webgpuHeatmap: boolean;
  advancedMonteCarlo: boolean;
  experimentalCV: boolean;
  canvasHighRiskCad: boolean;
  canvasEventControllerV2: boolean;
  medical3DBabylonAdapter: boolean;
  medical3DUnityExternalViewer: boolean;
  realTimeCollaboration: boolean;
  aiPredictions: boolean;
  debugMode: boolean;
}

const DEFAULT: FeatureFlags = {
  webgpuHeatmap: false,
  advancedMonteCarlo: false,
  experimentalCV: false,
  canvasHighRiskCad: import.meta.env.VITE_CANVAS_HIGH_RISK_CAD === 'true',
  canvasEventControllerV2:
    import.meta.env.VITE_CANVAS_HIGH_RISK_CAD === 'true' &&
    import.meta.env.VITE_CANVAS_EVENT_CONTROLLER_V2 === 'true',
  medical3DBabylonAdapter:
    import.meta.env.VITE_MEDICAL_3D_BABYLON_ADAPTER === 'true' &&
    import.meta.env.VITE_MEDICAL_3D_BABYLON_RUNTIME === 'true',
  medical3DUnityExternalViewer:
    import.meta.env.VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER === 'true' &&
    Boolean(import.meta.env.VITE_MEDICAL_3D_UNITY_WEBGL_URL),
  realTimeCollaboration: false,
  aiPredictions: true,
  debugMode: import.meta.env.DEV,
};

const STORAGE_KEY = 'radshield_feature_flags';

function load(): FeatureFlags {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
  } catch { return { ...DEFAULT }; }
}

export const featureFlags = load();

export function isEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag] ?? false;
}

export function toggle(flag: keyof FeatureFlags) {
  featureFlags[flag] = !featureFlags[flag];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(featureFlags));
}

export function setFlag(flag: keyof FeatureFlags, value: boolean) {
  featureFlags[flag] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(featureFlags));
}

export function getAll(): FeatureFlags {
  return { ...featureFlags };
}

export function reset() {
  Object.assign(featureFlags, DEFAULT);
  localStorage.removeItem(STORAGE_KEY);
}

// ───────────────────────────────────────────────────────────────
// Fase 1 del motor de dosis unificado (docs/plan-motores-calculo.md)
// Banderas de compilación: sólo se activan con variables VITE_* en el build, no desde localStorage,
// para que una preferencia guardada no reabra visores con dosis no físicas.
// ───────────────────────────────────────────────────────────────

/**
 * `false` (por omisión): los visores en revisión quedan inactivos — sin entrada en menús, barra
 * lateral ni paleta de comandos, y sin montarse — porque muestran dosis que no salen del motor
 * de campo (`doseFieldEngine`). Su código se conserva para reactivarlos uno por uno (Fase 5).
 */
export const VISORES_EN_REVISION: boolean = import.meta.env.VITE_VISORES_EN_REVISION === 'true';

/** `false`: el heat map del lienzo se calcula en CPU con `doseFieldEngine` (el shader WebGPU no está portado). */
export const HEATMAP_GPU: boolean = import.meta.env.VITE_HEATMAP_GPU === 'true';

/** `false`: no se dibujan sobre el lienzo los HUD de depuración del renderer (F436–F445, F621–F695). */
export const DEPURACION_RENDER: boolean = import.meta.env.VITE_DEPURACION_RENDER === 'true';

/** `false`: la vista previa Babylon (F455–F474) de Inspección 3D no se monta ni descarga @babylonjs/*. */
export const VISOR_3D_BABYLON: boolean = import.meta.env.VITE_VISOR_3D_BABYLON === 'true';

export const NOTA_VISOR_EN_REVISION = 'En revisión: se reactivará con el motor de dosis unificado';

/**
 * Identificadores (diálogo o comando, sin distinguir mayúsculas) de los visores en revisión:
 * Curvas Isodosis, 3D Dose Mapping, Heat Map Avanzado e Isosuperficie 3D.
 */
export const IDS_VISORES_EN_REVISION: readonly string[] = ['isodosis', 'dose3d', 'heatmap', 'isosurface3d'];

export function esVisorEnRevision(id: string): boolean {
  return IDS_VISORES_EN_REVISION.includes(id.toLowerCase());
}

// ───────────────────────────────────────────────────────────────
// Fase 5: una bandera por visor. Los cuatro ya están conectados a `doseFieldEngine` (vía
// `src/lib/visoresDosis.ts`) y tienen prueba visor ↔ motor, pero siguen INACTIVOS hasta que el
// responsable los autorice: todas en `false` por omisión, sólo se encienden con su variable VITE_*.
// ───────────────────────────────────────────────────────────────

/** Heat Map Avanzado (`HeatMapViewer`), id `heatmap`. */
export const VISOR_HEATMAP_AVANZADO: boolean = import.meta.env.VITE_VISOR_HEATMAP_AVANZADO === 'true';
/** Curvas Isodosis (`IsodosisViewer`), id `isodosis`. */
export const VISOR_ISODOSIS: boolean = import.meta.env.VITE_VISOR_ISODOSIS === 'true';
/** Isosuperficie 3D (`Isosurface3DDialog`), id `isosurface3d`. */
export const VISOR_ISOSUPERFICIE_3D: boolean = import.meta.env.VITE_VISOR_ISOSUPERFICIE_3D === 'true';
/** 3D Dose Mapping (`DoseMapping3D`), id `dose3d`. */
export const VISOR_DOSE_MAPPING_3D: boolean = import.meta.env.VITE_VISOR_DOSE_MAPPING_3D === 'true';

/** Bandera propia de cada visor en revisión (id en minúsculas). */
export const BANDERAS_VISOR: Readonly<Record<string, boolean>> = {
  heatmap: VISOR_HEATMAP_AVANZADO,
  isodosis: VISOR_ISODOSIS,
  isosurface3d: VISOR_ISOSUPERFICIE_3D,
  dose3d: VISOR_DOSE_MAPPING_3D,
};

/**
 * ¿Se puede abrir/montar este visor? Siempre true para lo que no está en revisión; un visor en revisión
 * se habilita con `VISORES_EN_REVISION` (todos) o con su bandera propia (`BANDERAS_VISOR`).
 */
export function visorDisponible(
  id: string,
  habilitados: boolean = VISORES_EN_REVISION,
  banderas: Readonly<Record<string, boolean>> = BANDERAS_VISOR,
): boolean {
  return habilitados || !esVisorEnRevision(id) || banderas[id.toLowerCase()] === true;
}

/** Quita de una lista de menú las entradas de visores en revisión (mientras la bandera esté apagada). */
export function filtrarVisoresEnRevision<T>(
  items: readonly T[],
  idDe: (item: T) => string,
  habilitados: boolean = VISORES_EN_REVISION,
  banderas: Readonly<Record<string, boolean>> = BANDERAS_VISOR,
): T[] {
  return items.filter((item) => visorDisponible(idDe(item), habilitados, banderas));
}
