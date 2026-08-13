import type { DXFParsed } from '@/lib/dxfParser';

export type F213DxfLayerRole = 'barrier' | 'equipment' | 'zone' | 'dimension' | 'reference' | 'text' | 'unmapped';

export interface F213DxfLayerRow {
  name: string;
  role: F213DxfLayerRole;
  entityCount: number;
  lineLikeCount: number;
  textCount: number;
  visible: boolean;
  confidence: 'high' | 'medium' | 'low';
  canvasUse: string;
  warning?: string;
}

export interface F213DxfLayerMappingQa {
  schema: 'radshield-mx.dxf-layer-mapping-qa.f213.v1';
  phase: 'F213';
  status: 'dxf-layer-mapping-ready' | 'dxf-layer-mapping-review';
  layerCount: number;
  mappedBarrierLayers: number;
  equipmentLayers: number;
  zoneLayers: number;
  dimensionLayers: number;
  unmappedLayers: number;
  rows: F213DxfLayerRow[];
  warnings: string[];
  decision: string;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function inferDxfLayerRole(layerName: string): F213DxfLayerRole {
  const value = normalize(layerName);
  if (/(wall|muro|barrier|barrera|shield|blind|lead|plomo|concrete|concreto|primary|secondary|primaria|secundaria|bunker|tablaroca|columna|column|estructura|structural|losa|puerta|door)/.test(value)) return 'barrier';
  if (/(source|fuente|linac|ct|pet|spect|gamma|knife|hdr|cyclotron|ciclotron|equipo|equipment|machine)/.test(value)) return 'equipment';
  if (/(zone|zona|controlled|controlada|public|publica|hot|room|sala|area)/.test(value)) return 'zone';
  if (/(dim|cota|dimension|measure|medida|axis|eje)/.test(value)) return 'dimension';
  if (/(grid|xref|ref|arquitectura|architecture|background|fondo)/.test(value)) return 'reference';
  if (/(text|txt|label|etiqueta|nota|note)/.test(value)) return 'text';
  return 'unmapped';
}

function canvasUse(role: F213DxfLayerRole): string {
  if (role === 'barrier') return 'LINE/LWPOLYLINE se aplican como barreras del floorplan.';
  if (role === 'equipment') return 'Se conserva como pista para colocar fuente/equipo; no se crea equipo automaticamente.';
  if (role === 'zone') return 'Se conserva como pista de zona controlada/ocupada; revisar antes de calcular.';
  if (role === 'dimension') return 'Se conserva como referencia de cotas; no cambia escala automaticamente.';
  if (role === 'reference') return 'Referencia visual/arquitectonica; no genera calculo.';
  if (role === 'text') return 'Texto/etiquetas para revision; no genera geometria de blindaje.';
  return 'Sin regla clara; revisar nombre de capa o remapear manualmente.';
}

export function buildF213DxfLayerMappingQa(parsed: DXFParsed | null): F213DxfLayerMappingQa {
  const warnings: string[] = [];
  const rows: F213DxfLayerRow[] = parsed
    ? Array.from(parsed.layers.values()).map((layer) => {
      const role = inferDxfLayerRole(layer.name);
      const lineLikeCount = layer.entities.filter((entity) => entity.type === 'LINE' || entity.type === 'LWPOLYLINE').length;
      const textCount = layer.entities.filter((entity) => entity.type === 'TEXT' || entity.type === 'MTEXT').length;
      const confidence: F213DxfLayerRow['confidence'] =
        role === 'unmapped' ? 'low' : lineLikeCount > 0 || textCount > 0 ? 'high' : 'medium';
      const warning =
        role === 'unmapped'
          ? 'Capa sin rol inferido; no se aplicara al canvas salvo revision.'
          : role !== 'barrier' && lineLikeCount > 0
            ? 'Contiene lineas pero no se clasifico como barrera; revisar si debe remapearse.'
            : undefined;

      return {
        name: layer.name,
        role,
        entityCount: layer.entities.length,
        lineLikeCount,
        textCount,
        visible: layer.visible,
        confidence,
        canvasUse: canvasUse(role),
        warning,
      };
    })
    : [];

  const mappedBarrierLayers = rows.filter((row) => row.role === 'barrier').length;
  const equipmentLayers = rows.filter((row) => row.role === 'equipment').length;
  const zoneLayers = rows.filter((row) => row.role === 'zone').length;
  const dimensionLayers = rows.filter((row) => row.role === 'dimension').length;
  const unmappedLayers = rows.filter((row) => row.role === 'unmapped').length;

  if (!parsed) warnings.push('No hay DXF cargado.');
  if (parsed && mappedBarrierLayers === 0) warnings.push('No se detectaron capas de muros/barreras por nombre.');
  if (unmappedLayers > 0) warnings.push(`${unmappedLayers} capa(s) requieren revision manual.`);
  if (rows.some((row) => row.warning)) warnings.push('Algunas capas tienen lineas o texto que requieren remapeo QA.');

  return {
    schema: 'radshield-mx.dxf-layer-mapping-qa.f213.v1',
    phase: 'F213',
    status: warnings.length === 0 ? 'dxf-layer-mapping-ready' : 'dxf-layer-mapping-review',
    layerCount: rows.length,
    mappedBarrierLayers,
    equipmentLayers,
    zoneLayers,
    dimensionLayers,
    unmappedLayers,
    rows,
    warnings,
    decision:
      warnings.length === 0
        ? 'Mapeo DXF listo para aplicar al canvas con trazabilidad por capa.'
        : 'Revisar capas no mapeadas o lineas en capas no estructurales antes de aplicar al canvas.',
  };
}

export function formatF213DxfLayerMappingText(summary: F213DxfLayerMappingQa): string {
  return [
    `${summary.phase} ${summary.status}`,
    `Capas: ${summary.layerCount}`,
    `Muros: ${summary.mappedBarrierLayers}`,
    `Equipos: ${summary.equipmentLayers}`,
    `Zonas: ${summary.zoneLayers}`,
    `Cotas: ${summary.dimensionLayers}`,
    `Sin mapa: ${summary.unmappedLayers}`,
    `Advertencias: ${summary.warnings.join(' | ') || 'ninguna'}`,
  ].join('\n');
}
