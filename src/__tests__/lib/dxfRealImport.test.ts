import { describe, expect, it } from 'vitest';
import { parseDXF } from '@/lib/dxfParser';
import { importDXFToFloorPlan } from '@/lib/medical3D/cadBimBridge';

const sample = [
  '0', 'SECTION',
  '2', 'HEADER',
  '9', '$INSUNITS',
  '70', '6',
  '0', 'ENDSEC',
  '0', 'SECTION',
  '2', 'TABLES',
  '0', 'TABLE',
  '2', 'LAYER',
  '0', 'LAYER',
  '2', 'MUROS',
  '62', '3',
  '0', 'LAYER',
  '2', 'MOBILIARIO',
  '62', '161',
  '0', 'ENDTAB',
  '0', 'ENDSEC',
  '0', 'SECTION',
  '2', 'ENTITIES',
  '0', 'LWPOLYLINE',
  '8', 'MUROS',
  '90', '4',
  '70', '1',
  '10', '0',
  '20', '0',
  '10', '10',
  '20', '0',
  '10', '10',
  '20', '5',
  '10', '0',
  '20', '5',
  '0', 'LINE',
  '8', 'MOBILIARIO',
  '10', '100',
  '20', '100',
  '11', '110',
  '21', '100',
  '0', 'ENDSEC',
  '0', 'EOF',
].join('\n');

const splitWallSample = [
  '0', 'SECTION',
  '2', 'TABLES',
  '0', 'TABLE',
  '2', 'LAYER',
  '0', 'LAYER',
  '2', 'MUROS',
  '62', '3',
  '0', 'ENDTAB',
  '0', 'ENDSEC',
  '0', 'SECTION',
  '2', 'ENTITIES',
  '0', 'LINE',
  '8', 'MUROS',
  '10', '0',
  '20', '0',
  '11', '5',
  '21', '0',
  '0', 'LINE',
  '8', 'MUROS',
  '10', '5',
  '20', '0',
  '11', '10',
  '21', '0',
  '0', 'LINE',
  '8', 'MUROS',
  '10', '10',
  '20', '0',
  '11', '5',
  '21', '0',
  '0', 'ENDSEC',
  '0', 'EOF',
].join('\n');

describe('DXF real import hardening', () => {
  it('preserves repeated LWPOLYLINE vertices', () => {
    const parsed = parseDXF(sample);
    const polyline = parsed.entities.find((entity) => entity.type === 'LWPOLYLINE');
    expect(polyline?.type).toBe('LWPOLYLINE');
    if (polyline?.type !== 'LWPOLYLINE') return;
    expect(polyline.points).toHaveLength(4);
    expect(polyline.closed).toBe(true);
  });

  it('maps only barrier-like layers into floorplan barriers', () => {
    const result = importDXFToFloorPlan(sample, 'real-sample.dxf');
    expect(result.summary.mappedBarriers).toBe(4);
    expect(result.floorPlan.barriers.every((barrier) => barrier.name.includes('MUROS'))).toBe(true);
    expect(result.summary.warnings.join(' ')).toContain('capas no clasificadas');
  });

  it('filters imported barriers by selected visible layers', () => {
    const result = importDXFToFloorPlan(sample, 'real-sample.dxf', { barrierLayerNames: [] });
    expect(result.summary.mappedBarriers).toBe(0);
    expect(result.summary.warnings.join(' ')).toContain('No se detectaron LINE/LWPOLYLINE');
  });

  it('can consolidate duplicate or collinear wall segments before applying to canvas', () => {
    const raw = importDXFToFloorPlan(splitWallSample, 'split-wall.dxf');
    const simplified = importDXFToFloorPlan(splitWallSample, 'split-wall.dxf', { simplifyGeometry: true });

    expect(raw.summary.mappedBarriers).toBe(3);
    expect(simplified.summary.mappedBarriers).toBe(1);
    expect(simplified.floorPlan.barriers[0]).toMatchObject({ x1: 0, y1: 0, x2: 10, y2: 0 });
    expect(simplified.summary.warnings.join(' ')).toContain('Limpieza geometrica');
  });
});
