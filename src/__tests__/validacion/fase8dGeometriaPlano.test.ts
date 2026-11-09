/**
 * Fase 8d — prioridad baja, geometría del plano: material por nombre de pieza CAD y área de la sala.
 */
import { describe, expect, it } from 'vitest';
import { mapearNombrePieza, palabrasPieza } from '@/lib/cadMaterialMapping';
import { areaAproximadaSala } from '@/lib/areaPlano';
import type { Barrier } from '@/types/radshield';


describe('Asignación de material por nombre de pieza (CADAssemblyMapper)', () => {
  it('compara palabras completas: Water ≠ tungsteno, Hall ≠ aluminio, Concrete ≠ aire', () => {
    expect(palabrasPieza('Part001_Wall_Steel')).toEqual(['part', 'wall', 'steel']);
    expect(palabrasPieza('LeadGlassWindow')).toEqual(['lead', 'glass', 'window']);
    const casos: Array<[string, string]> = [
      ['Moderator_Water_Tank', 'M009'],
      ['Instrument_Hall_Air', 'M001'],
      ['Floor_Concrete_Slab', 'M002'],
      ['Part001_Wall_Steel', 'M005'],
      ['Part011_Wall_Barite', 'M003'],
      ['Lead_Glass_Window', 'M013'],
      ['Shielding_Lead_Door', 'M004'],
      ['BPE_Shield_Panel', 'M008'],
      ['Maze_Poly_Barrier', 'M007'],
      ['Target_Tungsten_Plugs', 'M006'],
      ['Part015_Al_Flange', 'M010'],
      ['Aluminum_Flange', 'M010'],
      ['Beam_Stop_Copper', 'M011'],
      ['Bunker_Concrete_Wall', 'M002'],
      ['Pieza_sin_pista', 'M001'],
    ];
    for (const [nombre, codigo] of casos) expect(mapearNombrePieza(nombre), nombre).toBe(codigo);
  });
});

describe('Área de la sala (PlanValidator)', () => {
  const muro = (x1: number, y1: number, x2: number, y2: number) => ({ x1, y1, x2, y2 }) as Barrier;
  it('usa el rectángulo de las barreras, no un lienzo fijo de 1200×800 px', () => {
    const plano = { barriers: [muro(100, 100, 700, 100), muro(700, 100, 700, 600)], width_pixels: 2000, height_pixels: 1500 };
    const a = areaAproximadaSala(plano, 0.01)!;
    expect(a).toMatchObject({ origen: 'barreras', ancho_m: 6, fondo_m: 5 });
    expect(a.area_m2).toBeCloseTo(30, 9);
    // La misma sala dibujada a otra escala da la misma área.
    const b = areaAproximadaSala({ barriers: [muro(50, 50, 350, 50), muro(350, 50, 350, 300)], width_pixels: 1000, height_pixels: 750 }, 0.02)!;
    expect(b.area_m2).toBeCloseTo(30, 9);
  });

  it('sin barreras usa el plano; sin plano ni escala, null', () => {
    expect(areaAproximadaSala({ barriers: [], width_pixels: 1000, height_pixels: 500 }, 0.01)).toMatchObject({ origen: 'plano', area_m2: 50 });
    expect(areaAproximadaSala({ barriers: [], width_pixels: 0, height_pixels: 0 }, 0.01)).toBeNull();
    expect(areaAproximadaSala({ barriers: [], width_pixels: 1000, height_pixels: 500 }, 0)).toBeNull();
  });
});
