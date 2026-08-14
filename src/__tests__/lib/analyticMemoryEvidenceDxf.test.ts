import { describe, expect, it } from 'vitest';
import { createFloorPlanEvidenceSources } from '@/lib/analyticMemoryEvidence';
import type { FloorPlan } from '@/types/radshield';

function makeFloorPlan(status: 'preliminary' | 'final'): FloorPlan {
  return {
    id: `plan-${status}`,
    name: 'CAD sample-floorplan.dxf',
    imageUrl: null,
    scale_m_per_pixel: 0.01,
    width_pixels: 1000,
    height_pixels: 800,
    barriers: [
      {
        id: 'b1',
        name: 'DXF 1 (WALL_PRIMARY)',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        barrierType: 'primary',
        useFactor: 1,
        occupancyFactor: 1,
        designGoal_mSv_per_wk: 0.02,
        materialCode: 'CONCRETE',
        thickness_mm: 300,
        material: 'concrete',
      },
    ],
    sources: [],
    occupiedRegions: [],
    importMetadata: {
      source: 'dxf',
      fileName: 'sample-floorplan.dxf',
      mode: status === 'preliminary' ? 'preview' : 'light',
      status,
      mappedBarriers: 1,
      importedAt: '2026-08-14T12:00:00.000Z',
      confirmedAt: status === 'final' ? '2026-08-14T12:05:00.000Z' : undefined,
      warnings: status === 'preliminary' ? ['Revise escala antes de memoria.'] : [],
    },
  };
}

describe('analytic memory DXF evidence', () => {
  it('adds a draft evidence source for preliminary DXF geometry', () => {
    const sources = createFloorPlanEvidenceSources(makeFloorPlan('preliminary'));
    const dxf = sources.find(source => source.id === 'ev-dxf-import-review');

    expect(dxf).toBeDefined();
    expect(dxf?.verificationStatus).toBe('draft');
    expect(dxf?.excerpt).toContain('estado: preliminary');
    expect(dxf?.notes).toContain('sigue preliminar');
  });

  it('marks confirmed DXF geometry as reviewed evidence', () => {
    const sources = createFloorPlanEvidenceSources(makeFloorPlan('final'));
    const dxf = sources.find(source => source.id === 'ev-dxf-import-review');

    expect(dxf).toBeDefined();
    expect(dxf?.verificationStatus).toBe('reviewed');
    expect(dxf?.confidence).toBe('high');
    expect(dxf?.excerpt).toContain('estado: final');
  });
});
