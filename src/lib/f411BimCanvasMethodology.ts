import type { CanvasLayer } from '@/hooks/useCanvasLayers';
import type { FloorPlan } from '@/types/radshield';
import { REVIT_SHARED_PARAMETERS } from '@/lib/revitIntegration';

export interface F411BimProjectNode {
  id: string;
  label: string;
  count: number;
  status: 'ready' | 'empty' | 'review';
}

export interface F411BimLayerRow {
  id: string;
  label: string;
  color: string;
  visible: boolean;
  locked: boolean;
  opacityPercent: number;
}

export interface F412BimEntityRow {
  id: string;
  label: string;
  category: 'IfcWall' | 'IfcSpace' | 'RadShieldSource' | 'RadShieldControlPoint' | 'IfcPresentationLayerAssignment';
  count: number;
  radShieldBinding: string;
  requiredParameters: string[];
  status: 'ready' | 'draft' | 'external';
}

export interface F412BimRoundtripGate {
  id: string;
  label: string;
  status: 'ready' | 'blocked' | 'external';
  note: string;
}

export interface F411BimMethodologyPlan {
  schema: 'radshield-mx.f411.bim-canvas-methodology.v1';
  phase: 'F411';
  status: 'bim-canvas-adaptation-ready' | 'bim-data-required';
  projectName: string;
  activeLayer: string;
  readinessScore: number;
  projectTree: F411BimProjectNode[];
  layerRows: F411BimLayerRow[];
  details: Array<[string, string]>;
  interfacePattern: string[];
  bimDataNeeds: string[];
  workflowNeeds: string[];
  entityCatalog: F412BimEntityRow[];
  sharedParameterRows: Array<{ name: string; description: string; example: string }>;
  roundtripGates: F412BimRoundtripGate[];
}

function node(id: string, label: string, count: number, review = false): F411BimProjectNode {
  return {
    id,
    label,
    count,
    status: count > 0 ? (review ? 'review' : 'ready') : 'empty',
  };
}

function entity(
  id: string,
  label: string,
  category: F412BimEntityRow['category'],
  count: number,
  radShieldBinding: string,
  requiredParameters: string[],
  status: F412BimEntityRow['status'] = count > 0 ? 'ready' : 'draft',
): F412BimEntityRow {
  return { id, label, category, count, radShieldBinding, requiredParameters, status };
}

export function buildF411BimCanvasMethodology(args: {
  floorPlan: FloorPlan;
  layers: CanvasLayer[];
  activeLayer: string;
  selectedKind: string;
  selectedName: string;
}): F411BimMethodologyPlan {
  const { floorPlan, layers, activeLayer, selectedKind, selectedName } = args;
  const barrierCount = floorPlan.barriers?.length ?? 0;
  const sourceCount = floorPlan.sources?.length ?? 0;
  const regionCount = (floorPlan.regions?.length ?? 0) + (floorPlan.occupiedRegions?.length ?? 0);
  const criticalPointCount = floorPlan.criticalPoints?.length ?? 0;
  const visibleLayerCount = layers.filter((layer) => layer.visible).length;
  const hasScale = Number.isFinite(floorPlan.scale_m_per_pixel) && floorPlan.scale_m_per_pixel > 0;
  const readinessBits = [
    hasScale,
    barrierCount > 0,
    sourceCount > 0,
    regionCount > 0,
    criticalPointCount > 0,
    visibleLayerCount > 0,
  ];
  const readinessScore = Math.round((readinessBits.filter(Boolean).length / readinessBits.length) * 100);

  return {
    schema: 'radshield-mx.f411.bim-canvas-methodology.v1',
    phase: 'F411',
    status: readinessScore >= 67 ? 'bim-canvas-adaptation-ready' : 'bim-data-required',
    projectName: floorPlan.name || 'Proyecto sin nombre',
    activeLayer,
    readinessScore,
    projectTree: [
      node('floorplans', 'Planos base / DXF', floorPlan.imageUrl ? 1 : 0, !hasScale),
      node('models', 'Modelo medico 3D', sourceCount + barrierCount + regionCount),
      node('equipment', 'Equipos y fuentes', sourceCount),
      node('shielding', 'Barreras / blindaje', barrierCount),
      node('zones', 'Zonas controladas/publicas', regionCount),
      node('points', 'Puntos criticos', criticalPointCount),
      node('reports', 'Memoria / reportes', barrierCount + sourceCount > 0 ? 1 : 0, true),
      node('evidence', 'Evidencia / citas', barrierCount + sourceCount > 0 ? 1 : 0, true),
    ],
    layerRows: layers.slice(0, 10).map((layer) => ({
      id: layer.id,
      label: layer.nameEs || layer.name,
      color: layer.color,
      visible: layer.visible,
      locked: layer.locked,
      opacityPercent: Math.round(layer.opacity * 100),
    })),
    details: [
      ['Estado', hasScale ? 'Escala disponible' : 'Calibrar escala'],
      ['Plano', `${floorPlan.width_pixels || 0} x ${floorPlan.height_pixels || 0}px`],
      ['Escala', hasScale ? `${floorPlan.scale_m_per_pixel.toFixed(6)} m/px` : 'pendiente'],
      ['Seleccion', `${selectedKind}: ${selectedName}`],
      ['Capas', `${visibleLayerCount}/${layers.length || 0} visibles`],
      ['Readiness', `${readinessScore}%`],
    ],
    interfacePattern: [
      'Ribbon disciplinar: Proyecto, Modelo, Equipos, Blindaje, Anotar, Verificar, Reportar, Evidencia.',
      'Project Manager: arbol de floorplans, modelos, equipos, barreras, zonas, reportes y evidencia.',
      'Details + Properties: seleccion, escala, material, carga, TVL, norma, hash y estado de revision.',
      'Layers: visibilidad, bloqueo, color y opacidad por disciplina del plano.',
      'Viewport BIM: vista 2D/3D con cubo de vista, navegacion, leyenda y linea de comando.',
    ],
    bimDataNeeds: [
      'IDs persistentes por objeto y categoria tipo IFC/Revit: Wall, Equipment, Source, Opening, Zone, Annotation.',
      'Geometria normalizada 2D/3D con unidades, escala, orientacion, niveles y elevaciones.',
      'Materiales versionados con densidad, TVL/HVL, peso, costo, tiempo, proveedor, pagina y hash.',
      'Relaciones: equipo -> termino fuente -> barrera -> punto critico -> formula -> cita -> reporte.',
      'Importadores auditados: DXF/SVG hoy; DWG/IFC/Revit mediante proveedor externo con hash y validacion de capas.',
    ],
    workflowNeeds: [
      'Modelo central persistente en DB/API para multiusuario, revisiones y permisos.',
      'Motor de seleccion/eventos por entidad BIM, no solo por primitivas del canvas.',
      'Clash/penetration checker para puertas, ductos, pasos de cable, laberintos y colindancias.',
      'Sincronizacion 2D/3D: cualquier cambio de plano debe actualizar renderer, memoria y Evidence Pack.',
      'QA de exportacion: PDF, anexos, snapshots visuales, JSON reproducible y restore de proyecto.',
    ],
    entityCatalog: [
      entity(
        'barriers',
        'Barreras de blindaje',
        'IfcWall',
        barrierCount,
        'FloorPlan.barriers -> calculo NCRP/IAEA/UAQ -> RS_RequiredThickness',
        ['RS_ShieldingType', 'RS_MaterialCode', 'RS_RequiredThickness', 'RS_PassFail'],
      ),
      entity(
        'zones',
        'Zonas / espacios',
        'IfcSpace',
        regionCount,
        'FloorPlan.regions/occupiedRegions -> ocupacion T/P -> memoria analitica',
        ['RS_DesignGoal_mSv', 'RS_EvidencePackId'],
      ),
      entity(
        'sources',
        'Equipos y fuentes',
        'RadShieldSource',
        sourceCount,
        'FloorPlan.sources -> termino fuente/workload/energia -> barreras dominantes',
        ['RS_SourceTrace', 'RS_EvidencePackId'],
      ),
      entity(
        'control-points',
        'Puntos criticos',
        'RadShieldControlPoint',
        criticalPointCount,
        'FloorPlan.criticalPoints -> dosis esperada -> pass/fail por zona',
        ['RS_DesignGoal_mSv', 'RS_PassFail'],
      ),
      entity(
        'layers',
        'Capas disciplinares',
        'IfcPresentationLayerAssignment',
        layers.length,
        'CanvasLayer -> visibilidad/bloqueo/color/opacidad -> revision CAD/BIM',
        ['RS_SourceTrace'],
        layers.length > 0 ? 'ready' : 'draft',
      ),
    ],
    sharedParameterRows: REVIT_SHARED_PARAMETERS,
    roundtripGates: [
      {
        id: 'ifc-dxf-in',
        label: 'Entrada IFC/DXF',
        status: 'ready',
        note: 'IFC/DXF ya tienen rutas parciales/funcionales. Deben validar unidades, capas, escala y hash antes de aplicar al floorplan.',
      },
      {
        id: 'rs-parameters',
        label: 'Parametros RS_*',
        status: 'ready',
        note: 'Parametros compartidos listos para schedules Revit/Add-in: tipo, meta, material, espesor, pass/fail, evidencia y trazabilidad.',
      },
      {
        id: 'native-rvt',
        label: 'RVT nativo',
        status: 'external',
        note: 'Requiere Revit API/Add-in/Autodesk Platform Services. No debe ejecutarse dentro del navegador.',
      },
      {
        id: 'dwg-native',
        label: 'DWG nativo',
        status: 'external',
        note: 'Mantener conversion externa a DXF/SVG/IFC con ODA/APS, hash, timeout y confirmacion del operador.',
      },
      {
        id: 'db-versioning',
        label: 'DB/API versionada',
        status: 'blocked',
        note: 'Necesaria para BIM multiusuario serio: revisiones, permisos, restore, diffs, evidence y control de cambios.',
      },
    ],
  };
}
