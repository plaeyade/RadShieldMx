import type { FloorPlan } from '@/types/radshield';
import type { F415BimMepCoordinationPlan, F415ShieldingSurfaceRole } from '@/lib/f415BimMepCoordination';

export interface F416BimContentProvider {
  id: string;
  name: string;
  url: string;
  providerType: 'community' | 'manufacturer-library' | 'spec-library' | 'marketplace';
  formats: string[];
  bestUse: string;
  radShieldUse: string;
  qaRisk: 'low' | 'medium' | 'high';
  integrationMode: 'external-link' | 'manual-download' | 'future-api';
}

export interface F417VisualObjectTemplate {
  id: string;
  label: string;
  category: 'shielding' | 'mep' | 'equipment' | 'access' | 'evidence';
  symbol: string;
  color: string;
  canvasAction: string;
  requiredMetadata: string[];
}

export interface F418CutawayMetric {
  id: string;
  label: string;
  value: string;
  status: 'ready' | 'draft' | 'blocked';
}

export interface F419SurfaceRoleAssignment {
  id: string;
  label: string;
  barrierCount: number;
  color: string;
  requirement: string;
  status: 'ready' | 'needs-geometry' | 'needs-calculation';
}

export interface F420ClashCandidate {
  id: string;
  label: string;
  risk: 'low' | 'medium' | 'high';
  affectedSurface: string;
  requiredAction: string;
  releaseBlocking: boolean;
}

export interface F416ToF420BimCanvasSequence {
  schema: 'radshield-mx.f416-f420.bim-canvas-sequence.v1';
  phaseRange: 'F416-F420';
  status: 'sequence-ready';
  providers: F416BimContentProvider[];
  objectTemplates: F417VisualObjectTemplate[];
  cutawayMetrics: F418CutawayMetric[];
  surfaceAssignments: F419SurfaceRoleAssignment[];
  clashCandidates: F420ClashCandidate[];
  nextImplementationSteps: string[];
}

function countBarriersByRole(floorPlan: FloorPlan, role: F415ShieldingSurfaceRole): number {
  if (role.id === 'primary-barrier') return floorPlan.barriers.filter((barrier) => barrier.barrierType === 'primary').length;
  if (role.id === 'secondary-barrier') return floorPlan.barriers.filter((barrier) => barrier.barrierType === 'secondary' || barrier.barrierType === 'scatter' || barrier.barrierType === 'leakage').length;
  if (role.id === 'maze') return floorPlan.barriers.filter((barrier) => /maze|laberinto/i.test(barrier.name)).length;
  if (role.id === 'door') return floorPlan.barriers.filter((barrier) => /door|puerta/i.test(barrier.name)).length;
  return 0;
}

function formatMetric(value: number, suffix: string): string {
  return `${Number.isFinite(value) ? value.toFixed(value >= 10 ? 0 : 1) : '0'} ${suffix}`;
}

export function buildF416ToF420BimCanvasSequence(args: {
  floorPlan: FloorPlan;
  f415: F415BimMepCoordinationPlan;
}): F416ToF420BimCanvasSequence {
  const { floorPlan, f415 } = args;
  const hasScale = Number.isFinite(floorPlan.scale_m_per_pixel) && floorPlan.scale_m_per_pixel > 0;
  const visibleWidth_m = hasScale ? floorPlan.width_pixels * floorPlan.scale_m_per_pixel : 0;
  const visibleHeight_m = hasScale ? floorPlan.height_pixels * floorPlan.scale_m_per_pixel : 0;
  const barrierCount = floorPlan.barriers.length;
  const sourceCount = floorPlan.sources.length;
  const zoneCount = (floorPlan.regions?.length ?? 0) + floorPlan.occupiedRegions.length;
  const pointCount = floorPlan.criticalPoints?.length ?? 0;
  const calculatedBarrierCount = floorPlan.barriers.filter((barrier) => Boolean(barrier.requiredThickness_mm ?? barrier.thickness_mm)).length;
  const estimatedShieldedFootprint_m = hasScale ? Math.max(visibleWidth_m, 12) * Math.max(visibleHeight_m, 12) : 0;
  const visibleFootprint_m = hasScale ? visibleWidth_m * visibleHeight_m : 0;
  const expansionRatio = visibleFootprint_m > 0 ? estimatedShieldedFootprint_m / visibleFootprint_m : 0;

  const providers: F416BimContentProvider[] = [
    {
      id: 'mepcontent',
      name: 'MEPcontent',
      url: 'https://www.mepcontent.com/en/',
      providerType: 'manufacturer-library',
      formats: ['RFA', 'IFC', 'DWG', 'DXF'],
      bestUse: 'Familias MEP con geometria y metadatos para ductos, tuberias, HVAC y accesorios.',
      radShieldUse: 'Usar como fuente externa para catalogo de penetraciones y coordinacion MEP/blindaje.',
      qaRisk: 'medium',
      integrationMode: 'manual-download',
    },
    {
      id: 'prodlib',
      name: 'ProdLib',
      url: 'https://www.prodlib.com/',
      providerType: 'manufacturer-library',
      formats: ['RFA', 'DWG', 'IFC', 'PDF', 'DOC'],
      bestUse: 'Bibliotecas de productos con contenido CAD/BIM y documentacion por fabricante.',
      radShieldUse: 'Modelo para Product/Spec Library con version, proveedor, ficha tecnica y evidencia.',
      qaRisk: 'medium',
      integrationMode: 'external-link',
    },
    {
      id: 'arcat',
      name: 'ARCAT',
      url: 'https://www.arcat.com/',
      providerType: 'spec-library',
      formats: ['RFA', 'DWG', 'IFC', 'GLB', 'Specs'],
      bestUse: 'Especificaciones, detalles CAD/BIM y fichas para documentacion de proyecto.',
      radShieldUse: 'Vincular producto -> especificacion -> memoria -> Evidence Pack.',
      qaRisk: 'low',
      integrationMode: 'external-link',
    },
    {
      id: 'revitcity',
      name: 'RevitCity',
      url: 'https://www.revitcity.com/',
      providerType: 'community',
      formats: ['RFA', 'RVT'],
      bestUse: 'Referencia comunitaria para familias Revit no certificadas.',
      radShieldUse: 'Solo fixtures o inspiracion; no usar como fuente canonica clinica sin QA.',
      qaRisk: 'high',
      integrationMode: 'external-link',
    },
  ];

  const objectTemplates: F417VisualObjectTemplate[] = [
    { id: 'linac', label: 'LINAC', category: 'equipment', symbol: 'LINAC', color: '#ef4444', canvasAction: 'Colocar fuente TX con footprint, isocentro y energia.', requiredMetadata: ['fabricante', 'modelo', 'energia', 'workload', 'isocentro'] },
    { id: 'gamma-knife', label: 'Gamma Knife', category: 'equipment', symbol: 'GK', color: '#8b5cf6', canvasAction: 'Colocar fuente TX/GK con bunker y puntos criticos.', requiredMetadata: ['modelo', 'Co-60', 'actividad', 'colindancias'] },
    { id: 'cyclotron', label: 'Ciclotron', category: 'equipment', symbol: 'CY', color: '#f97316', canvasAction: 'Colocar fuente CY con vault, targets, gases y ventilacion.', requiredMetadata: ['energia', 'corriente', 'targets', 'produccion', 'ventilacion'] },
    { id: 'primary-wall', label: 'Barrera primaria', category: 'shielding', symbol: 'P', color: '#ef4444', canvasAction: 'Asignar rol primario a barrera seleccionada.', requiredMetadata: ['U', 'T', 'P', 'distancia', 'TVL', 'material'] },
    { id: 'secondary-wall', label: 'Barrera secundaria', category: 'shielding', symbol: 'S', color: '#f59e0b', canvasAction: 'Asignar rol secundario/leakage/scatter.', requiredMetadata: ['leakage', 'scatter', 'T', 'P', 'TVL'] },
    { id: 'maze', label: 'Laberinto', category: 'access', symbol: 'M', color: '#0ea5e9', canvasAction: 'Dibujar ruta indirecta y puntos de control.', requiredMetadata: ['longitud', 'giros', 'puerta', 'punto-control'] },
    { id: 'shielded-door', label: 'Puerta blindada', category: 'access', symbol: 'D', color: '#8b5cf6', canvasAction: 'Agregar puerta con equivalente y solapes.', requiredMetadata: ['Pb/concreto equivalente', 'marco', 'interlock', 'proveedor'] },
    { id: 'duct-penetration', label: 'Ducto/penetracion', category: 'mep', symbol: 'MEP', color: '#38bdf8', canvasAction: 'Marcar cruce MEP/blindaje y evidencia requerida.', requiredMetadata: ['sistema', 'diametro', 'ubicacion', 'mitigacion'] },
  ];

  const cutawayMetrics: F418CutawayMetric[] = [
    { id: 'visible-space', label: 'Espacio visible', value: hasScale ? `${formatMetric(visibleWidth_m, 'm')} x ${formatMetric(visibleHeight_m, 'm')}` : 'escala pendiente', status: hasScale ? 'ready' : 'blocked' },
    { id: 'shielded-footprint', label: 'Huella blindada estimada', value: hasScale ? formatMetric(estimatedShieldedFootprint_m, 'm2') : 'escala pendiente', status: hasScale ? 'draft' : 'blocked' },
    { id: 'visible-vs-real-ratio', label: 'Relacion visible/real', value: expansionRatio > 0 ? `${expansionRatio.toFixed(1)}x` : 'pendiente', status: hasScale ? 'draft' : 'blocked' },
    { id: 'calculated-surfaces', label: 'Superficies calculadas', value: `${calculatedBarrierCount}/${barrierCount}`, status: barrierCount > 0 ? (calculatedBarrierCount === barrierCount ? 'ready' : 'draft') : 'blocked' },
  ];

  const surfaceAssignments: F419SurfaceRoleAssignment[] = f415.surfaceRoles.map((role) => {
    const count = countBarriersByRole(floorPlan, role);
    return {
      id: role.id,
      label: role.label,
      barrierCount: count,
      color: role.color,
      requirement: role.memoryRequirement,
      status: count > 0 ? (calculatedBarrierCount > 0 ? 'ready' : 'needs-calculation') : 'needs-geometry',
    };
  });

  const clashCandidates: F420ClashCandidate[] = [
    {
      id: 'duct-primary-crossing',
      label: 'Ducto cruzando barrera primaria',
      risk: 'high',
      affectedSurface: 'Barrera primaria',
      requiredAction: 'Agregar penetracion con dimensiones, sleeve/laberinto y compensacion de blindaje.',
      releaseBlocking: barrierCount > 0,
    },
    {
      id: 'door-continuity',
      label: 'Continuidad de puerta blindada',
      risk: 'high',
      affectedSurface: 'Puerta/laberinto',
      requiredAction: 'Validar equivalente de puerta, marco, solapes e interlocks.',
      releaseBlocking: surfaceAssignments.some((assignment) => assignment.id === 'door' && assignment.barrierCount > 0),
    },
    {
      id: 'cable-tray-secondary',
      label: 'Charola por barrera secundaria',
      risk: 'medium',
      affectedSurface: 'Barrera secundaria',
      requiredAction: 'Registrar canalizacion, blindaje local y acceso de mantenimiento.',
      releaseBlocking: barrierCount > 0,
    },
    {
      id: 'unclassified-mep',
      label: 'MEP sin capa/categoria',
      risk: 'medium',
      affectedSurface: 'Modelo BIM',
      requiredAction: 'Clasificar sistema como HVAC, tuberia, charola, opening o soporte antes de exportar.',
      releaseBlocking: false,
    },
  ];

  return {
    schema: 'radshield-mx.f416-f420.bim-canvas-sequence.v1',
    phaseRange: 'F416-F420',
    status: 'sequence-ready',
    providers,
    objectTemplates,
    cutawayMetrics,
    surfaceAssignments,
    clashCandidates,
    nextImplementationSteps: [
      'F416: usar provider registry como lista blanca de contenido BIM externo y marcar RevitCity como no canonico.',
      'F417: convertir templates en paleta visual con acciones reales por herramienta.',
      'F418: renderizar cutaway 2.5D en vista 3D/Medical FloorPlan con espesores y huella blindada.',
      'F419: persistir rol de superficie en barreras y pedir evidencia por rol antes de Memoria IA.',
      'F420: reemplazar candidatos por geometria real cuando existan objetos MEP nativos/importados.',
    ],
  };
}
