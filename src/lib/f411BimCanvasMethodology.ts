import type { CanvasLayer } from '@/hooks/useCanvasLayers';
import type { FloorPlan } from '@/types/radshield';

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
}

function node(id: string, label: string, count: number, review = false): F411BimProjectNode {
  return {
    id,
    label,
    count,
    status: count > 0 ? (review ? 'review' : 'ready') : 'empty',
  };
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
  };
}
