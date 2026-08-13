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
});
