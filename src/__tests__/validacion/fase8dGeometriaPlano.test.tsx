/**
 * Fase 8d — prioridad baja, geometría del plano: material por nombre de pieza CAD y área de la sala.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PlanValidatorDialog from '@/sections/dialogs/PlanValidatorDialog';
import { mapearNombrePieza, palabrasPieza } from '@/lib/cadMaterialMapping';
import { areaGauss, areaSalaDeFuente, carasDeBarreras } from '@/lib/areaPlano';
import type { Barrier, FloorPlan } from '@/types/radshield';

afterEach(cleanup);


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

describe('Área de la sala (PlanValidator): polígono que encierra la fuente', () => {
  const muro = (x1: number, y1: number, x2: number, y2: number) => ({ x1, y1, x2, y2 }) as Barrier;
  // Rectángulo cerrado de (x0,y0) a (x1,y1).
  const caja = (x0: number, y0: number, x1: number, y1: number) => [muro(x0, y0, x1, y0), muro(x1, y0, x1, y1), muro(x1, y1, x0, y1), muro(x0, y1, x0, y0)];

  it('fórmula de Gauss sobre el contorno: rectángulo y sala en L', () => {
    expect(areaGauss([{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 5 }, { x: 0, y: 5 }])).toBe(30);
    // L de 6×5 menos 3×2 = 24.
    const L = [muro(0, 0, 600, 0), muro(600, 0, 600, 300), muro(600, 300, 300, 300), muro(300, 300, 300, 500), muro(300, 500, 0, 500), muro(0, 500, 0, 0)];
    const a = areaSalaDeFuente({ barriers: L }, { x: 100, y: 100 }, 0.01);
    expect(a.origen).toBe('contorno');
    expect(a.area_m2).toBeCloseTo(24, 9);
    // El rectángulo envolvente habría dado 30 m².
  });

  it('varias salas con muro compartido (unión en T): cada fuente toma su sala, no el rectángulo de todas', () => {
    // Sala A 4×5 m y sala B 6×5 m comparten el muro x = 400; el muro de B empieza a media pared superior.
    const barreras = [muro(0, 0, 1000, 0), muro(1000, 0, 1000, 500), muro(1000, 500, 0, 500), muro(0, 500, 0, 0), muro(400, 0, 400, 500)];
    expect(carasDeBarreras(barreras, 1).length).toBeGreaterThanOrEqual(2);
    const A = areaSalaDeFuente({ barriers: barreras }, { x: 200, y: 250 }, 0.01);
    const B = areaSalaDeFuente({ barriers: barreras }, { x: 700, y: 250 }, 0.01);
    expect(A).toMatchObject({ origen: 'contorno' });
    expect(A.area_m2).toBeCloseTo(20, 9);
    expect(B.area_m2).toBeCloseTo(30, 9);
    // Dos salas separadas: tampoco se suman.
    const sep = [...caja(0, 0, 300, 300), ...caja(1000, 0, 1600, 800)];
    expect(areaSalaDeFuente({ barriers: sep }, { x: 150, y: 150 }, 0.01).area_m2).toBeCloseTo(9, 9);
    // La misma sala dibujada a otra escala da la misma área.
    expect(areaSalaDeFuente({ barriers: caja(0, 0, 150, 150) }, { x: 75, y: 75 }, 0.02).area_m2).toBeCloseTo(9, 9);
  });

  it('extremos casi coincidentes se unen con tolerancia (5 cm por omisión)', () => {
    const casi = [muro(0, 0, 400, 0), muro(402, 1, 400, 300), muro(400, 300, 0, 300), muro(0, 300, 0, 2)];
    expect(areaSalaDeFuente({ barriers: casi }, { x: 200, y: 150 }, 0.01).area_m2).toBeCloseTo(12, 0);
  });

  it('sin contorno cerrado exige captura manual (no estima con el plano ni con un rectángulo)', () => {
    const abierta = [muro(0, 0, 600, 0), muro(600, 0, 600, 500), muro(600, 500, 0, 500)]; // falta un muro
    expect(areaSalaDeFuente({ barriers: abierta }, { x: 300, y: 250 }, 0.01)).toEqual({ area_m2: null, origen: 'sin-contorno' });
    expect(areaSalaDeFuente({ barriers: [] }, { x: 1, y: 1 }, 0.01)).toEqual({ area_m2: null, origen: 'sin-contorno' });
    // Fuente fuera de la única sala cerrada.
    expect(areaSalaDeFuente({ barriers: caja(0, 0, 100, 100) }, { x: 500, y: 500 }, 0.01).origen).toBe('sin-contorno');
    expect(areaSalaDeFuente({ barriers: abierta }, { x: 300, y: 250 }, 0.01, { areaManual_m2: 28 })).toEqual({ area_m2: 28, origen: 'manual' });
    expect(areaSalaDeFuente({ barriers: abierta }, { x: 300, y: 250 }, 0.01, { areaManual_m2: 0 }).origen).toBe('sin-contorno');
    // Con contorno cerrado manda el polígono aunque haya captura manual.
    expect(areaSalaDeFuente({ barriers: caja(0, 0, 600, 500) }, { x: 300, y: 250 }, 0.01, { areaManual_m2: 99 })).toMatchObject({ origen: 'contorno' });
  });
});

describe('PlanValidatorDialog: área por sala y captura manual', () => {
  const muro = (x1: number, y1: number, x2: number, y2: number) => ({ x1, y1, x2, y2, id: `${x1}-${y1}-${x2}-${y2}`, name: 'm' }) as Barrier;
  const fuente = (id: string, x: number, y: number) => ({ id, x, y, name: id, modality: { id: 'pet-f18', name: 'PET F-18' } }) as unknown as FloorPlan['sources'][number];
  const plano = (barriers: Barrier[], sources: FloorPlan['sources']) =>
    ({ id: 'p', name: 'Plano', imageUrl: null, scale_m_per_pixel: 0.01, width_pixels: 3000, height_pixels: 3000, barriers, sources, occupiedRegions: [] }) as FloorPlan;

  it('dos salas de 20 m² en un plano de 10×5 m: falla el mínimo de 30 m² aunque el rectángulo de todas dé 50 m²', () => {
    const b = [muro(0, 0, 1000, 0), muro(1000, 0, 1000, 500), muro(1000, 500, 0, 500), muro(0, 500, 0, 0), muro(400, 0, 400, 500)];
    render(<PlanValidatorDialog open onOpenChange={() => {}} floorPlan={plano(b, [fuente('a', 200, 250)])} />);
    fireEvent.click(screen.getByRole('button', { name: /Ejecutar Validación/ }));
    expect(screen.getByText(/Área de la sala \(20\.0 m², polígono de la sala\) menor al mínimo requerido \(30 m²\)/)).toBeTruthy();
  });

  it('sin contorno cerrado avisa y pide captura manual; con la captura evalúa', () => {
    const abierta = [muro(0, 0, 600, 0), muro(600, 0, 600, 500), muro(600, 500, 0, 500)];
    render(<PlanValidatorDialog open onOpenChange={() => {}} floorPlan={plano(abierta, [fuente('a', 300, 250)])} />);
    fireEvent.click(screen.getByRole('button', { name: /Ejecutar Validación/ }));
    expect(screen.getByText(/Área de la sala no evaluada: capture el área manualmente/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Área de la sala del equipo #1 (m²)'), { target: { value: '32' } });
    fireEvent.click(screen.getByRole('button', { name: /Ejecutar Validación/ }));
    expect(screen.getByText(/Área de la sala \(32\.0 m², captura manual\) cumple requisito mínimo/)).toBeTruthy();
  });
});
