import type { FloorPlan } from '@/types/radshield';
import type { F416ToF420BimCanvasSequence } from '@/lib/f416ToF420BimCanvasSequence';

export interface F421BimVisualExport {
  id: string;
  label: string;
  format: 'PNG' | 'PDF' | 'JSON' | 'Evidence Pack';
  includes: string[];
  releaseUse: string;
  status: 'ready' | 'draft';
}

export interface F422BimIntakeRoute {
  id: string;
  format: 'DXF' | 'SVG' | 'IFC' | 'GLB' | 'DWG' | 'RFA/RVT';
  mode: 'native-browser' | 'external-converter' | 'future-provider';
  risk: 'low' | 'medium' | 'high';
  intakeRule: string;
}

export interface F423BimNormalizationMap {
  id: string;
  sourceCategory: string;
  targetCategory: 'Barrier' | 'RadiationSource' | 'OccupiedRegion' | 'CriticalPoint' | 'MepPenetration' | 'EvidenceAsset';
  rsParameters: string[];
  validationRule: string;
}

export interface F424ProductSpecRecord {
  id: string;
  label: string;
  source: 'MEPcontent' | 'ProdLib' | 'ARCAT' | 'RevitCity' | 'RadShield DB';
  category: 'equipment' | 'shielding-material' | 'door' | 'mep' | 'specification';
  requiredFields: string[];
  evidenceRule: string;
}

export interface F425BimHandoffDeliverable {
  id: string;
  label: string;
  target: 'Revit Schedule' | 'IFC PropertySet' | 'Evidence Pack' | 'Memoria IA' | 'QA Manifest';
  blockingFields: string[];
  handoffRule: string;
}

export interface F421ToF425BimHandoffPlan {
  schema: 'radshield-mx.f421-f425.bim-handoff.v1';
  phaseRange: 'F421-F425';
  status: 'handoff-ready';
  rendererDeepTouchpoint: 'after-f425';
  rendererDeepRationale: string;
  visualExports: F421BimVisualExport[];
  intakeRoutes: F422BimIntakeRoute[];
  normalizationMap: F423BimNormalizationMap[];
  productSpecRecords: F424ProductSpecRecord[];
  handoffDeliverables: F425BimHandoffDeliverable[];
}

export function buildF421ToF425BimHandoffPlan(args: {
  floorPlan: FloorPlan;
  sequence: F416ToF420BimCanvasSequence;
}): F421ToF425BimHandoffPlan {
  const { floorPlan, sequence } = args;
  const hasScale = Number.isFinite(floorPlan.scale_m_per_pixel) && floorPlan.scale_m_per_pixel > 0;
  const hasGeometry = floorPlan.barriers.length > 0 || floorPlan.sources.length > 0;
  const hasCalculations = floorPlan.barriers.some((barrier) => Boolean(barrier.requiredThickness_mm ?? barrier.thickness_mm));
  const blockingRoleCount = sequence.surfaceAssignments.filter((assignment) => assignment.status !== 'ready').length;

  return {
    schema: 'radshield-mx.f421-f425.bim-handoff.v1',
    phaseRange: 'F421-F425',
    status: 'handoff-ready',
    rendererDeepTouchpoint: 'after-f425',
    rendererDeepRationale:
      'El renderer profundo debe tocarse despues de F425: primero se fija que exportar, que importar, como normalizar categorias, que campos de producto/spec son obligatorios y que debe viajar a Revit/IFC/Evidence. Cambiar renderer antes genera UI bonita pero sin contrato de datos.',
    visualExports: [
      {
        id: 'canvas-bim-png',
        label: 'Snapshot BIM del canvas',
        format: 'PNG',
        includes: ['plano', 'roles de barrera', 'leyenda regulatoria', 'cutaway visible/real', 'MEP clash markers'],
        releaseUse: 'Captura visual para revision de usuario, Memoria IA y anexos PDF.',
        status: hasGeometry ? 'ready' : 'draft',
      },
      {
        id: 'bim-report-pdf',
        label: 'Anexo BIM PDF',
        format: 'PDF',
        includes: ['roles', 'espesores', 'materiales', 'penetraciones', 'proveedores', 'citas/hash'],
        releaseUse: 'Anexo documental para auditoria tecnica y entrega.',
        status: hasGeometry && hasCalculations ? 'ready' : 'draft',
      },
      {
        id: 'bim-handoff-json',
        label: 'BIM handoff JSON',
        format: 'JSON',
        includes: ['RS_*', 'objetos normalizados', 'proveedores', 'clash candidates', 'estado QA'],
        releaseUse: 'Paquete reproducible para DB/API, Revit add-in o IFC property sets.',
        status: hasScale ? 'ready' : 'draft',
      },
      {
        id: 'evidence-visual-pack',
        label: 'Evidence visual pack',
        format: 'Evidence Pack',
        includes: ['snapshots', 'documentos fuente', 'paginas/hash', 'warnings', 'bloqueos'],
        releaseUse: 'Trazabilidad visual y documental para memoria firmable.',
        status: hasGeometry ? 'ready' : 'draft',
      },
    ],
    intakeRoutes: [
      { id: 'dxf', format: 'DXF', mode: 'native-browser', risk: 'low', intakeRule: 'Aceptar DXF solo tras validar unidades, capas, escala y bounding box.' },
      { id: 'svg', format: 'SVG', mode: 'native-browser', risk: 'low', intakeRule: 'Aceptar SVG para plano/vector 2D con escala confirmada por usuario.' },
      { id: 'ifc', format: 'IFC', mode: 'native-browser', risk: 'medium', intakeRule: 'Aceptar IFC como geometria/categorias si se mapean IfcWall/IfcSpace/IfcOpening/IfcFlowSegment a RS_*.' },
      { id: 'glb', format: 'GLB', mode: 'native-browser', risk: 'medium', intakeRule: 'Aceptar GLB para visualizacion 3D; no usar para calculo sin escala y mapeo BIM verificable.' },
      { id: 'dwg', format: 'DWG', mode: 'external-converter', risk: 'high', intakeRule: 'DWG requiere ODA/APS u otro proveedor externo, hash, timeout, revision de capas y conversion a DXF/SVG/IFC.' },
      { id: 'rfa-rvt', format: 'RFA/RVT', mode: 'future-provider', risk: 'high', intakeRule: 'RFA/RVT no se procesa en navegador; usar Revit add-in/APS/exports IFC/GLB y schedules RS_*.' },
    ],
    normalizationMap: [
      { id: 'ifc-wall-to-barrier', sourceCategory: 'IfcWall/IfcSlab', targetCategory: 'Barrier', rsParameters: ['RS_BimEntityId', 'RS_ShieldingType', 'RS_MaterialCode', 'RS_RequiredThickness'], validationRule: 'Debe tener longitud, espesor/material, escala y rol de barrera.' },
      { id: 'ifc-space-to-region', sourceCategory: 'IfcSpace', targetCategory: 'OccupiedRegion', rsParameters: ['RS_ControlledZone', 'RS_DesignGoal_mSv'], validationRule: 'Debe mapear ocupacion, colindancia y limite de diseno.' },
      { id: 'equipment-to-source', sourceCategory: 'Equipment/RadShieldSource', targetCategory: 'RadiationSource', rsParameters: ['RS_SourceTrace', 'RS_EvidencePackId'], validationRule: 'Debe tener modalidad, energia/actividad/workload, isocentro y fabricante/modelo.' },
      { id: 'opening-to-penetration', sourceCategory: 'IfcOpeningElement/MEP crossing', targetCategory: 'MepPenetration', rsParameters: ['RS_BimEntityId', 'RS_PassFail', 'RS_SourceTrace'], validationRule: 'Debe tener dimensiones, sistema, barrera afectada y mitigacion.' },
      { id: 'control-point', sourceCategory: 'Point/Annotation', targetCategory: 'CriticalPoint', rsParameters: ['RS_DesignGoal_mSv', 'RS_PassFail'], validationRule: 'Debe tener coordenadas, ocupacion, meta y estado activo.' },
      { id: 'spec-to-evidence', sourceCategory: 'PDF/Spec/Product sheet', targetCategory: 'EvidenceAsset', rsParameters: ['RS_EvidencePackId', 'RS_SourceTrace'], validationRule: 'Debe tener proveedor, version, pagina/hash y relacion con material/equipo/superficie.' },
    ],
    productSpecRecords: [
      { id: 'linac-spec', label: 'Equipo LINAC', source: 'RadShield DB', category: 'equipment', requiredFields: ['fabricante', 'modelo', 'energia', 'workload', 'isocentro', 'manual/cita'], evidenceRule: 'Debe enlazar equipo colocado en canvas con fuente tecnica y perfil TX.' },
      { id: 'gk-spec', label: 'Gamma Knife', source: 'RadShield DB', category: 'equipment', requiredFields: ['modelo', 'actividad', 'carga', 'bunker', 'manual/cita'], evidenceRule: 'Debe enlazar fuente Co-60/GK con memoria y normativa aplicable.' },
      { id: 'shielding-material', label: 'Material de blindaje', source: 'RadShield DB', category: 'shielding-material', requiredFields: ['densidad', 'TVL/HVL', 'peso kg/m2', 'costo', 'proveedor', 'hash'], evidenceRule: 'No usar en memoria firmable sin densidad/TVL versionada.' },
      { id: 'shielded-door', label: 'Puerta blindada', source: 'ARCAT', category: 'door', requiredFields: ['equivalente', 'marco', 'solape', 'interlock', 'ficha tecnica'], evidenceRule: 'Debe vincularse al rol puerta y al gate de continuidad.' },
      { id: 'mep-product', label: 'Ducto/tuberia/charola', source: 'MEPcontent', category: 'mep', requiredFields: ['sistema', 'diametro/seccion', 'material', 'trayectoria', 'penetracion'], evidenceRule: 'Debe crear o resolver candidato F420 si cruza blindaje.' },
      { id: 'spec-package', label: 'Especificacion constructiva', source: 'ProdLib', category: 'specification', requiredFields: ['producto', 'version', 'formato', 'proveedor', 'documento'], evidenceRule: 'Debe alimentar Evidence Pack y anexo BIM PDF.' },
    ],
    handoffDeliverables: [
      { id: 'revit-schedule', label: 'Schedule RS_*', target: 'Revit Schedule', blockingFields: ['RS_BimEntityId', 'RS_ShieldingType', 'RS_MaterialCode', 'RS_RequiredThickness', 'RS_PassFail'], handoffRule: 'Exportar como tabla/JSON para add-in Revit o captura manual controlada.' },
      { id: 'ifc-property-set', label: 'IFC PropertySet RadShield', target: 'IFC PropertySet', blockingFields: ['RS_BimEntityId', 'RS_ControlledZone', 'RS_SourceTrace'], handoffRule: 'Mapear entidades a PSet_RadShield con unidades SI y hash de revision.' },
      { id: 'evidence-pack', label: 'Evidence Pack BIM', target: 'Evidence Pack', blockingFields: ['citationIds', 'pageHash', 'provider', 'revision'], handoffRule: 'Toda salida debe traer fuente, pagina/hash, estado QA y advertencias.' },
      { id: 'memory-ai', label: 'Memoria IA BIM', target: 'Memoria IA', blockingFields: ['formulaId', 'standard', 'inputs', 'outputs', 'surfaceRole'], handoffRule: 'Cada resultado por barrera debe explicar formula, norma, inputs, outputs y rol.' },
      { id: 'qa-manifest', label: 'QA manifest F421-F425', target: 'QA Manifest', blockingFields: ['scale', 'geometry', 'roles', 'clashes', 'exports'], handoffRule: `Bloquear release si faltan escala/geometria o si quedan ${blockingRoleCount} roles sin resolver.`,
      },
    ],
  };
}
