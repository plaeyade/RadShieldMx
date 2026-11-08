import { describe, expect, it } from 'vitest';
import {
  DEPURACION_RENDER,
  HEATMAP_GPU,
  NOTA_VISOR_EN_REVISION,
  VISOR_3D_BABYLON,
  VISORES_EN_REVISION,
  esVisorEnRevision,
  filtrarVisoresEnRevision,
  visorDisponible,
} from '@/lib/featureFlags';
import { DEFAULT_COMMANDS } from '@/sections/dialogs/CommandPalette';

describe('banderas de la Fase 1 del motor de dosis', () => {
  it('están apagadas por omisión', () => {
    expect(VISORES_EN_REVISION).toBe(false);
    expect(HEATMAP_GPU).toBe(false);
    expect(DEPURACION_RENDER).toBe(false);
    expect(VISOR_3D_BABYLON).toBe(false);
    expect(NOTA_VISOR_EN_REVISION).toMatch(/En revisión/);
  });

  it('identifica los visores en revisión sin distinguir mayúsculas', () => {
    for (const id of ['isodosis', 'dose3D', 'heatMap', 'isosurface3d', 'heatmap', 'dose3d']) {
      expect(esVisorEnRevision(id)).toBe(true);
      expect(visorDisponible(id)).toBe(false);
      expect(visorDisponible(id, true)).toBe(true);
    }
    expect(esVisorEnRevision('spatialDoseMap')).toBe(false);
    expect(visorDisponible('spatialDoseMap')).toBe(true);
  });

  it('filtra entradas de menú sólo mientras la bandera esté apagada', () => {
    const items = [{ id: 'isodosis' }, { id: 'calc' }, { id: 'isosurface3d' }];
    expect(filtrarVisoresEnRevision(items, (i) => i.id).map((i) => i.id)).toEqual(['calc']);
    expect(filtrarVisoresEnRevision(items, (i) => i.id, true)).toHaveLength(3);
  });

  it('la paleta de comandos no ofrece los visores en revisión', () => {
    const ids = DEFAULT_COMMANDS({}).map((c) => c.id);
    expect(ids).not.toContain('isodosis');
    expect(ids).not.toContain('dose3d');
    expect(ids).not.toContain('heatmap');
    expect(ids).toContain('calc');
  });
});
