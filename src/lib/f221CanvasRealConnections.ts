export type F221CanvasConnectionStatus = 'ready' | 'partial' | 'planned';

export type F221CanvasConnectionId =
  | 'grip-drag'
  | 'advanced-snapping'
  | 'window-lasso-selection'
  | 'inline-edit'
  | 'equipment-footprints'
  | 'isocontour-overlay'
  | 'medical-3d'
  | 'export-pipeline';

export interface F221CanvasRealConnection {
  id: F221CanvasConnectionId;
  label: string;
  status: F221CanvasConnectionStatus;
  evidence: string;
  operatorUse: string;
  nextHardening: string;
}

export interface F221CanvasRealConnectionsInput {
  selectedCount: number;
  snapToGrid: boolean;
  sourceCount: number;
  barrierCount: number;
  hasResults: boolean;
  hasMedical3D: boolean;
  hasExport: boolean;
}

export interface F221CanvasRealConnections {
  schema: 'radshield-mx.canvas-real-connections.f221.v1';
  phase: 'F221';
  status: 'canvas-real-connections-ready' | 'canvas-real-connections-partial';
  readyCount: number;
  partialCount: number;
  plannedCount: number;
  connections: F221CanvasRealConnection[];
  rendererUpgradeDecision: string;
  baseEventUpgradeGate: string[];
}

export function buildF221CanvasRealConnections(input: F221CanvasRealConnectionsInput): F221CanvasRealConnections {
  const connections: F221CanvasRealConnection[] = [
    {
      id: 'grip-drag',
      label: 'Grips drag',
      status: input.selectedCount > 0 ? 'ready' : 'partial',
      evidence: input.selectedCount > 0 ? `${input.selectedCount} seleccionados; grips editables disponibles` : 'requiere seleccionar muro/fuente',
      operatorUse: 'Seleccionar objeto y arrastrar vertices, centro, punto medio o rotacion.',
      nextHardening: 'Agregar smoke Playwright de arrastre por grip antes de tocar eventos base.',
    },
    {
      id: 'advanced-snapping',
      label: 'Snap CAD',
      status: input.snapToGrid ? 'ready' : 'partial',
      evidence: input.snapToGrid ? 'endpoint, midpoint, perpendicular, interseccion, centro-equipo y angle15 activos' : 'motor CAD existe; snap apagado',
      operatorUse: 'Activar Snap y dibujar cerca de vertices, centros, intersecciones o angulos de 15 grados.',
      nextHardening: 'Exponer marcadores visuales por tipo de snap y prueba de regresion geometrica.',
    },
    {
      id: 'window-lasso-selection',
      label: 'Ventana/lasso',
      status: 'ready',
      evidence: 'select permite ventana; Ctrl/Meta+arrastre activa lasso; Shift agrega/quita seleccion',
      operatorUse: 'Arrastrar en vacio para ventana, Ctrl+arrastre para lasso, Shift+click para multiseleccion.',
      nextHardening: 'Agregar panel grupal para cambios masivos y smoke de seleccion multiple.',
    },
    {
      id: 'inline-edit',
      label: 'Inline edit',
      status: input.selectedCount > 0 ? 'ready' : 'partial',
      evidence: input.selectedCount > 0 ? 'inspector conectado a onUpdateSelected' : 'editor listo cuando exista seleccion',
      operatorUse: 'Usar el inspector compacto para nombre, material, workload, T, P o isocentro.',
      nextHardening: 'Validar campos por tipo de entidad y bloquear unidades ambiguas.',
    },
    {
      id: 'equipment-footprints',
      label: 'Footprints',
      status: input.sourceCount > 0 ? 'ready' : 'partial',
      evidence: `${input.sourceCount} fuente/equipo(s); footprint y rotacion por modalidad`,
      operatorUse: 'Colocar fuente/equipo, seleccionar y rotar con grip R.',
      nextHardening: 'Agregar variantes por fabricante y libreria SVG/PNG por equipo.',
    },
    {
      id: 'isocontour-overlay',
      label: 'Iso proxy',
      status: input.hasResults ? 'partial' : 'planned',
      evidence: input.hasResults ? 'vista isocontours visible con niveles/leyenda proxy' : 'requiere resultados de calculo',
      operatorUse: 'Usar Vista Iso para revision visual preliminar; no sustituye QA numerico.',
      nextHardening: 'Implementar interpolacion real, etiquetas por umbral y export regulatorio.',
    },
    {
      id: 'medical-3d',
      label: '3D medico',
      status: input.hasMedical3D && (input.barrierCount > 0 || input.sourceCount > 0) ? 'partial' : 'planned',
      evidence: input.hasMedical3D ? `${input.barrierCount} muros y ${input.sourceCount} equipos disponibles para handoff 3D` : 'visor 3D no conectado',
      operatorUse: 'Abrir inspeccion 3D desde el canvas despues de sembrar muros/equipos.',
      nextHardening: 'Sincronizar medidas, materiales y snapshots bidireccionales.',
    },
    {
      id: 'export-pipeline',
      label: 'Export visual',
      status: input.hasExport ? 'ready' : 'partial',
      evidence: input.hasExport ? 'exportPNG y handoff F217/F218 conectados' : 'export visual no expuesto',
      operatorUse: 'Exportar escena activa para Memoria IA, PDF, Evidence Pack o anexo estructural.',
      nextHardening: 'Adjuntar automaticamente hash, escena, escala y leyenda al expediente.',
    },
  ];

  const readyCount = connections.filter((item) => item.status === 'ready').length;
  const partialCount = connections.filter((item) => item.status === 'partial').length;
  const plannedCount = connections.filter((item) => item.status === 'planned').length;

  return {
    schema: 'radshield-mx.canvas-real-connections.f221.v1',
    phase: 'F221',
    status: plannedCount <= 1 && readyCount >= 4 ? 'canvas-real-connections-ready' : 'canvas-real-connections-partial',
    readyCount,
    partialCount,
    plannedCount,
    connections,
    rendererUpgradeDecision:
      'El renderer y los eventos base pueden mejorarse despues de F221 si pasan smoke/build. La ruta segura es extraer capas de render primero, luego controlador de eventos detras de feature flag; no reescribir ambos en la misma fase.',
    baseEventUpgradeGate: [
      'Build TypeScript y Vite pasan con CanvasArea montado.',
      'F207 functional QA confirma sidebar, toolbar, canvas y DXF.',
      'F220/F221 contratos pasan y distinguen ready/partial/planned.',
      'Antes de tocar eventos base debe existir smoke de drag, snap, lasso y seleccion.',
      'Todo nuevo event controller debe quedar detras de feature flag y rollback al useCanvas actual.',
    ],
  };
}
