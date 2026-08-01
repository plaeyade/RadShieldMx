import type { EvidenceSource } from './evidencePack';

export type RevitIntegrationMode = 'ifc-export' | 'dxf-export' | 'revit-addin' | 'autodesk-platform-services';

export interface RevitReadinessItem {
  id: string;
  label: string;
  status: 'ready' | 'planned' | 'external';
  note: string;
}

export interface RevitSharedParameter {
  name: string;
  description: string;
  example: string;
}

export interface RevitCompatibilityManifest {
  schemaVersion: 'radshield-revit-bim-readiness-v1';
  integrationMode: RevitIntegrationMode;
  sourceFile: string;
  generatedAt: string;
  detected: {
    walls: number;
    spaces: number;
  };
  directRvtSupport: 'external-only';
  notes: string[];
  sharedParameters: RevitSharedParameter[];
  checklist: RevitReadinessItem[];
}

export const REVIT_EXTERNAL_INTEGRATION_NOTE =
  'Revit/Autodesk queda como integracion BIM externa: RadShield-MX importa IFC/DXF hoy; RVT nativo, Revit Add-in y Autodesk Platform Services quedan para una fase posterior con licencia/API controlada.';

export const REVIT_SHARED_PARAMETERS: RevitSharedParameter[] = [
  { name: 'RS_BimEntityId', description: 'Identificador persistente RadShield para roundtrip BIM', example: 'barrier-east-001' },
  { name: 'RS_ShieldingType', description: 'Clasificacion radiologica de barrera', example: 'Primaria / Secundaria' },
  { name: 'RS_DesignGoal_mSv', description: 'Meta de diseno usada en memoria analitica', example: '0.02' },
  { name: 'RS_MaterialCode', description: 'Material normalizado para calculo', example: 'CONCRETE235 / LEAD' },
  { name: 'RS_RequiredThickness', description: 'Espesor requerido calculado', example: '178 mm' },
  { name: 'RS_ControlledZone', description: 'Clasificacion de zona asociada al objeto', example: 'Publica / Controlada / No ocupada' },
  { name: 'RS_StructuralLoad_kg_m2', description: 'Carga superficial estimada por material de blindaje', example: '512 kg/m2' },
  { name: 'RS_CalculationHash', description: 'Hash reproducible de entradas de calculo', example: 'f196-cache-v1:ab12cd34' },
  { name: 'RS_RevisionStatus', description: 'Estado de revision tecnica del objeto', example: 'Draft / RSO Review / Approved' },
  { name: 'RS_PassFail', description: 'Resultado de verificacion', example: 'PASS / FAIL' },
  { name: 'RS_EvidencePackId', description: 'Paquete de evidencia que sustenta el calculo', example: 'pack-20260711' },
  { name: 'RS_SourceTrace', description: 'Trazabilidad de fuente BIM/importacion', example: 'IFC export + revision A' },
];

export const REVIT_READINESS_CHECKLIST: RevitReadinessItem[] = [
  {
    id: 'ifc-export',
    label: 'Exportar IFC2X3/IFC4 desde Revit',
    status: 'ready',
    note: 'Ruta soportada ahora para recuperar muros y espacios sin depender de RVT propietario.',
  },
  {
    id: 'wall-types',
    label: 'Preservar tipos de muro y materiales',
    status: 'ready',
    note: 'Necesario para mapear materiales a codigos de blindaje y revisar espesores.',
  },
  {
    id: 'spaces',
    label: 'Nombrar Rooms/Spaces de ocupacion',
    status: 'ready',
    note: 'Permite sugerir factores de ocupacion NCRP por nombre de espacio.',
  },
  {
    id: 'shared-parameters',
    label: 'Parametros compartidos RS_*',
    status: 'planned',
    note: 'Base de contrato para escribir resultados de RadShield-MX hacia Revit en fase Add-in.',
  },
  {
    id: 'native-rvt',
    label: 'Lectura directa de RVT',
    status: 'external',
    note: 'Requiere Revit API, add-in de escritorio o Autodesk Platform Services; no se embebe en el frontend.',
  },
];

export function buildRevitCompatibilityManifest(input: {
  sourceFile: string;
  wallCount: number;
  spaceCount: number;
  integrationMode?: RevitIntegrationMode;
}): RevitCompatibilityManifest {
  return {
    schemaVersion: 'radshield-revit-bim-readiness-v1',
    integrationMode: input.integrationMode || 'ifc-export',
    sourceFile: input.sourceFile,
    generatedAt: new Date().toISOString(),
    detected: {
      walls: input.wallCount,
      spaces: input.spaceCount,
    },
    directRvtSupport: 'external-only',
    notes: [
      REVIT_EXTERNAL_INTEGRATION_NOTE,
      'Validar unidades, niveles, fases y origen de coordenadas antes de firmar memoria analitica.',
      'No incluir PHI ni datos sensibles de pacientes en archivos BIM o paquetes de evidencia.',
    ],
    sharedParameters: REVIT_SHARED_PARAMETERS,
    checklist: REVIT_READINESS_CHECKLIST,
  };
}

export function createRevitEvidenceSource(fileName: string, wallCount: number, spaceCount: number): EvidenceSource {
  const now = new Date().toISOString();
  return {
    id: `ev-revit-${Date.now()}`,
    title: `Modelo BIM Revit/IFC: ${fileName || 'sin nombre'}`,
    url: 'local://revit-ifc-import',
    sourceType: 'technicalReport',
    capturedAt: now,
    author: 'RadShield-MX',
    publishedDate: now.slice(0, 10),
    claim: `Modelo BIM importado por IFC con ${wallCount} muros y ${spaceCount} espacios detectados.`,
    excerpt: 'Registro local de importacion BIM para trazabilidad de geometria y ocupacion.',
    notes: REVIT_EXTERNAL_INTEGRATION_NOTE,
    confidence: 'medium',
    tags: ['Revit', 'IFC', 'BIM', 'trazabilidad'],
  };
}
