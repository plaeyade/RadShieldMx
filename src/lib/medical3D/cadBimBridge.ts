import { extractBIMFromIFC, type BIMModel } from '@/lib/bimRAD';
import { parseDXF, type DXFParsed, type DXFPoint } from '@/lib/dxfParser';
import { inferDxfLayerRole } from '@/lib/f213DxfLayerMappingQa';
import type { Barrier, FloorPlan } from '@/types/radshield';

export type CadBimImportKind = 'dxf' | 'ifc' | 'step' | 'unknown';

export interface CadBimImportSummary {
  kind: CadBimImportKind;
  fileName: string;
  sourceEntities: number;
  mappedBarriers: number;
  detectedLayers: string[];
  warnings: string[];
}

export interface CadBimBridgeResult {
  floorPlan: FloorPlan;
  summary: CadBimImportSummary;
}

export interface CadBimDxfImportOptions {
  barrierLayerNames?: string[];
  simplifyGeometry?: boolean;
}

const DEFAULT_SCALE_M_PER_UNIT = 0.001;

function unitToMeters(unit: string) {
  const normalized = unit.toLowerCase();
  if (normalized === 'm') return 1;
  if (normalized === 'cm') return 0.01;
  if (normalized === 'mm') return 0.001;
  if (normalized === 'in') return 0.0254;
  if (normalized === 'ft') return 0.3048;
  return DEFAULT_SCALE_M_PER_UNIT;
}

function inferMaterial(text: string) {
  const value = text.toLowerCase();
  if (value.includes('lead') || value.includes('plomo') || value.includes('pb')) return 'plomo';
  if (value.includes('barit')) return 'concreto_baritado';
  if (value.includes('steel') || value.includes('acero')) return 'acero';
  if (value.includes('glass') || value.includes('window') || value.includes('vidrio')) return 'vidrio_plomo';
  if (value.includes('tungsten') || value.includes('wolfram')) return 'tungsteno';
  return 'concreto';
}

function inferBarrierType(text: string): Barrier['barrierType'] {
  const value = text.toLowerCase();
  if (value.includes('primary') || value.includes('primaria') || value.includes('prim')) return 'primary';
  if (value.includes('door') || value.includes('puerta') || value.includes('window') || value.includes('ventana')) return 'leakage';
  if (value.includes('scatter') || value.includes('secundaria') || value.includes('secondary') || value.includes('sec')) return 'secondary';
  if (value.includes('nuclear') || value.includes('pet') || value.includes('hot') || value.includes('radiofarm')) return 'nuclear';
  return 'secondary';
}

function inferThicknessMm(text: string, fallback = 200) {
  const value = text.toLowerCase();
  const match = value.match(/(\d+(?:\.\d+)?)\s*(mm|cm|m)?/);
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2] || 'mm';
  if (!Number.isFinite(amount) || amount <= 0) return fallback;
  if (unit === 'm') return amount * 1000;
  if (unit === 'cm') return amount * 10;
  return amount;
}

function makeBarrier(id: string, name: string, layer: string, start: DXFPoint, end: DXFPoint): Barrier {
  const layerText = `${layer} ${name}`;
  const materialCode = inferMaterial(layerText);
  return {
    id,
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    name,
    barrierType: inferBarrierType(layerText),
    useFactor: inferBarrierType(layerText) === 'primary' ? 1 : 0.25,
    occupancyFactor: 1,
    designGoal_mSv_per_wk: 0.02,
    materialCode,
    requiredThickness_mm: inferThicknessMm(layerText, materialCode === 'plomo' ? 3 : 200),
  };
}

interface DxfBarrierSegment {
  layer: string;
  start: DXFPoint;
  end: DXFPoint;
}

function rounded(value: number, precision = 3) {
  return Math.round(value * 10 ** precision) / 10 ** precision;
}

function pointKey(point: DXFPoint) {
  return `${rounded(point.x)},${rounded(point.y)}`;
}

function segmentKey(segment: DxfBarrierSegment) {
  const a = pointKey(segment.start);
  const b = pointKey(segment.end);
  return a < b ? `${segment.layer}:${a}:${b}` : `${segment.layer}:${b}:${a}`;
}

function simplifyDxfBarrierSegments(segments: DxfBarrierSegment[], tolerance = 0.001) {
  const exact = new Map<string, DxfBarrierSegment>();
  for (const segment of segments) exact.set(segmentKey(segment), segment);

  const merged: DxfBarrierSegment[] = [];
  const horizontal = new Map<string, Array<{ min: number; max: number; layer: string; y: number }>>();
  const vertical = new Map<string, Array<{ min: number; max: number; layer: string; x: number }>>();

  for (const segment of exact.values()) {
    const dx = segment.end.x - segment.start.x;
    const dy = segment.end.y - segment.start.y;
    if (Math.abs(dy) <= tolerance) {
      const y = rounded((segment.start.y + segment.end.y) / 2);
      const key = `${segment.layer}:h:${y}`;
      const list = horizontal.get(key) || [];
      list.push({ min: Math.min(segment.start.x, segment.end.x), max: Math.max(segment.start.x, segment.end.x), layer: segment.layer, y });
      horizontal.set(key, list);
      continue;
    }
    if (Math.abs(dx) <= tolerance) {
      const x = rounded((segment.start.x + segment.end.x) / 2);
      const key = `${segment.layer}:v:${x}`;
      const list = vertical.get(key) || [];
      list.push({ min: Math.min(segment.start.y, segment.end.y), max: Math.max(segment.start.y, segment.end.y), layer: segment.layer, x });
      vertical.set(key, list);
      continue;
    }
    merged.push(segment);
  }

  for (const intervals of horizontal.values()) {
    intervals.sort((a, b) => a.min - b.min);
    let current = intervals[0];
    for (const interval of intervals.slice(1)) {
      if (interval.min <= current.max + tolerance) {
        current.max = Math.max(current.max, interval.max);
      } else {
        merged.push({ layer: current.layer, start: { x: current.min, y: current.y }, end: { x: current.max, y: current.y } });
        current = interval;
      }
    }
    merged.push({ layer: current.layer, start: { x: current.min, y: current.y }, end: { x: current.max, y: current.y } });
  }

  for (const intervals of vertical.values()) {
    intervals.sort((a, b) => a.min - b.min);
    let current = intervals[0];
    for (const interval of intervals.slice(1)) {
      if (interval.min <= current.max + tolerance) {
        current.max = Math.max(current.max, interval.max);
      } else {
        merged.push({ layer: current.layer, start: { x: current.x, y: current.min }, end: { x: current.x, y: current.max } });
        current = interval;
      }
    }
    merged.push({ layer: current.layer, start: { x: current.x, y: current.min }, end: { x: current.x, y: current.max } });
  }

  return {
    segments: merged,
    removed: segments.length - merged.length,
  };
}

function collectDxfBarriers(parsed: DXFParsed, options: CadBimDxfImportOptions = {}) {
  const barrierSegments: DxfBarrierSegment[] = [];
  const warnings: string[] = [];
  let ignored = 0;
  let skippedNonBarrierSegments = 0;
  const selectedBarrierLayers = Array.isArray(options.barrierLayerNames) ? new Set(options.barrierLayerNames) : null;
  const barrierLayerNames = new Set(
    Array.from(parsed.layers.values())
      .filter((layer) => inferDxfLayerRole(layer.name) === 'barrier')
      .filter((layer) => selectedBarrierLayers === null || selectedBarrierLayers.has(layer.name))
      .map((layer) => layer.name),
  );

  const addSegment = (layer: string, start: DXFPoint, end: DXFPoint) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (Math.sqrt(dx * dx + dy * dy) < 0.01) {
      ignored += 1;
      return;
    }
    barrierSegments.push({ layer, start, end });
  };

  for (const entity of parsed.entities) {
    if (!barrierLayerNames.has(entity.layer)) {
      if (entity.type === 'LINE') skippedNonBarrierSegments += 1;
      if (entity.type === 'LWPOLYLINE') skippedNonBarrierSegments += Math.max(entity.points.length - 1, 0) + (entity.closed && entity.points.length > 2 ? 1 : 0);
      continue;
    }
    if (entity.type === 'LINE') addSegment(entity.layer, entity.start, entity.end);
    if (entity.type === 'LWPOLYLINE') {
      entity.points.forEach((point, index) => {
        const next = entity.points[index + 1] || (entity.closed ? entity.points[0] : null);
        if (next) addSegment(entity.layer, point, next);
      });
    }
  }

  const simplification = options.simplifyGeometry ? simplifyDxfBarrierSegments(barrierSegments) : { segments: barrierSegments, removed: 0 };
  const barriers = simplification.segments.map((segment, index) => makeBarrier(
    `dxf-barrier-${index + 1}`,
    `DXF ${index + 1} (${segment.layer})`,
    segment.layer,
    segment.start,
    segment.end,
  ));

  if (ignored > 0) warnings.push(`${ignored} segmentos DXF degenerados fueron ignorados.`);
  if (skippedNonBarrierSegments > 0) warnings.push(`${skippedNonBarrierSegments} segmentos en capas no clasificadas como barrera fueron conservados solo como referencia.`);
  if (selectedBarrierLayers && selectedBarrierLayers.size > 0) warnings.push(`Importacion filtrada a ${selectedBarrierLayers.size} capa(s) de barrera visibles.`);
  if (simplification.removed > 0) warnings.push(`Limpieza geometrica: ${simplification.removed} segmento(s) duplicados o colineales fueron consolidados antes de aplicar al canvas.`);
  if (barriers.length === 0) warnings.push('No se detectaron LINE/LWPOLYLINE en capas de muro/barrera; revise nombres de capas o remapee manualmente.');
  return { barriers, warnings };
}

export function importDXFToFloorPlan(content: string, fileName = 'import.dxf', options: CadBimDxfImportOptions = {}): CadBimBridgeResult {
  const parsed = parseDXF(content);
  const { barriers, warnings } = collectDxfBarriers(parsed, options);
  const scale = unitToMeters(parsed.unit);
  const width = Math.max(parsed.bounds.maxX - parsed.bounds.minX, 1);
  const height = Math.max(parsed.bounds.maxY - parsed.bounds.minY, 1);
  const detectedLayers = Array.from(parsed.layers.keys());

  return {
    floorPlan: {
      id: `cad-dxf-${Date.now()}`,
      name: `CAD ${fileName}`,
      imageUrl: null,
      scale_m_per_pixel: scale,
      width_pixels: Math.ceil(width),
      height_pixels: Math.ceil(height),
      barriers,
      sources: [],
      occupiedRegions: [],
    },
    summary: {
      kind: 'dxf',
      fileName,
      sourceEntities: parsed.entities.length,
      mappedBarriers: barriers.length,
      detectedLayers,
      warnings,
    },
  };
}

function makeIfcRoomBarriers(model: BIMModel) {
  const walls = model.elements.filter((element) => element.ifcType.toLowerCase().includes('wall'));
  const wallCount = Math.max(walls.length || 4, 4);
  const side = Math.max(7, Math.ceil(Math.sqrt(wallCount) * 2.2));
  const corners = [
    { x: 0, y: 0 },
    { x: side, y: 0 },
    { x: side, y: side },
    { x: 0, y: side },
  ];

  return Array.from({ length: Math.min(wallCount, 16) }, (_, index): Barrier => {
    const start = corners[index % 4];
    const end = corners[(index + 1) % 4];
    const sourceWall = walls[index] || walls[index % walls.length];
    const label = sourceWall?.name || `IFC Wall ${index + 1}`;
    const materialText = `${label} ${sourceWall?.material?.name || ''} ${sourceWall?.shieldingMaterial || ''}`;
    const materialCode = inferMaterial(materialText);
    return {
      id: `ifc-barrier-${index + 1}`,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      name: label,
      barrierType: inferBarrierType(materialText),
      useFactor: 0.25,
      occupancyFactor: 1,
      designGoal_mSv_per_wk: 0.02,
      materialCode,
      requiredThickness_mm: sourceWall?.shieldingValue_mm || inferThicknessMm(materialText, materialCode === 'plomo' ? 3 : 200),
    };
  });
}

export function importIFCToFloorPlan(content: string, fileName = 'import.ifc'): CadBimBridgeResult {
  const model = extractBIMFromIFC(content);
  const barriers = makeIfcRoomBarriers(model);
  const warnings = [
    'IFC se mapea en modo preliminar: el parser actual extrae entidades y genera geometria de revision, no B-Rep completo.',
  ];

  return {
    floorPlan: {
      id: `cad-ifc-${Date.now()}`,
      name: `BIM ${model.projectName || fileName}`,
      imageUrl: null,
      scale_m_per_pixel: 1,
      width_pixels: 12,
      height_pixels: 12,
      barriers,
      sources: [],
      occupiedRegions: [],
    },
    summary: {
      kind: 'ifc',
      fileName,
      sourceEntities: model.elements.length + model.spaces.length,
      mappedBarriers: barriers.length,
      detectedLayers: model.levels,
      warnings,
    },
  };
}

export async function importCadBimFile(file: File): Promise<CadBimBridgeResult> {
  const content = await file.text();
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.dxf')) return importDXFToFloorPlan(content, file.name);
  if (lowerName.endsWith('.ifc')) return importIFCToFloorPlan(content, file.name);
  throw new Error('Formato no soportado en visor Medical 3D. Use DXF o IFC para Fase 42.');
}
