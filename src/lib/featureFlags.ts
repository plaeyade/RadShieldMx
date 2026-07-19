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
