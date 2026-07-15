export type ConversionFormat = 'dwg' | 'dxf' | 'svg' | 'ifc' | 'obj' | 'glb' | 'json';

export interface ConversionApiConfig {
  enabled: boolean;
  endpoint: string;
  apiKey?: string;
  provider: 'oda' | 'autodesk-aps' | 'custom';
}

export interface ConversionRequestDraft {
  sourceFormat: ConversionFormat;
  targetFormat: ConversionFormat;
  preserveLayers: boolean;
  preserveUnits: boolean;
  extractFloorPlan: boolean;
  extractBimMetadata: boolean;
  callbackUrl?: string;
}

export const DEFAULT_CONVERSION_API_CONFIG: ConversionApiConfig = {
  enabled: false,
  endpoint: '',
  provider: 'custom',
};

export const SUPPORTED_CONVERSION_ROUTES: Array<{
  source: ConversionFormat;
  targets: ConversionFormat[];
  note: string;
}> = [
  { source: 'dwg', targets: ['dxf', 'svg', 'ifc', 'glb', 'json'], note: 'Use external converter/API; native browser DWG parsing is not promised.' },
  { source: 'dxf', targets: ['svg', 'json', 'obj'], note: 'DXF can be parsed locally for 2D barrier extraction.' },
  { source: 'ifc', targets: ['glb', 'json'], note: 'IFC carries BIM metadata and is preferred for Revit handoff.' },
  { source: 'svg', targets: ['json'], note: 'SVG is a lightweight tracing/import overlay.' },
];

export function buildConversionRequest(draft: ConversionRequestDraft) {
  return {
    sourceFormat: draft.sourceFormat,
    targetFormat: draft.targetFormat,
    options: {
      preserveLayers: draft.preserveLayers,
      preserveUnits: draft.preserveUnits,
      extractFloorPlan: draft.extractFloorPlan,
      extractBimMetadata: draft.extractBimMetadata,
    },
    callbackUrl: draft.callbackUrl,
    expectedOutputs: [
      `${draft.targetFormat.toUpperCase()} file`,
      'Layer map',
      'Unit metadata',
      'Warnings for unsupported entities',
    ],
  };
}

export function canConvert(source: ConversionFormat, target: ConversionFormat) {
  return SUPPORTED_CONVERSION_ROUTES.some((route) => route.source === source && route.targets.includes(target));
}
