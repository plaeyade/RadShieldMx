/**
 * Alturas de niveles del edificio (datos del propietario): planta baja 5.40 m y, arriba de ella, todos los niveles
 * 5 m de piso a contrapiso (configurables, también nivel por nivel). Sótanos sin dato: no se asume altura. Las
 * distancias a los puntos protegidos de techo y piso salen de ellas.
 */
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ALTURA_ENTREPISO_M, ALTURA_PLANTA_BAJA_M, ALTURA_PUNTO_NIVEL_ABAJO_M, AlturaSotanoFaltante, ALTURA_PUNTO_NIVEL_ARRIBA_M,
  alturaNivel_m, distanciaVerticalNivel_m, distanciasTechoPiso_m, elevacionNivel_m,
} from '@/lib/nivelesEdificio';
import { calculateFloorCeiling, type FloorCeilingConfig } from '@/hooks/useFloorCeilingCalc';
import FloorCeilingDialog from '@/sections/dialogs/FloorCeilingDialog';

describe('niveles del edificio — PB 5.40 m y 5 m de piso a contrapiso arriba de planta baja', () => {
  it('por omisión: PB 5.40 m y 5 m en todos los niveles arriba de PB', () => {
    expect(ALTURA_PLANTA_BAJA_M).toBe(5.4);
    expect(ALTURA_ENTREPISO_M).toBe(5);
    expect(alturaNivel_m(0)).toBe(5.4);
    for (const n of [1, 2, 3, 7]) expect(alturaNivel_m(n)).toBe(5);
    expect(elevacionNivel_m(1)).toBeCloseTo(5.4, 12);
    expect(elevacionNivel_m(3)).toBeCloseTo(5.4 + 2 * 5, 12);
  });

  it('sótanos: sin dato no se asume altura (AlturaSotanoFaltante); con dato, la capturada', () => {
    expect(() => alturaNivel_m(-1)).toThrow(AlturaSotanoFaltante);
    expect(() => elevacionNivel_m(-2, { alturasPorNivel: { [-1]: 4 } })).toThrow(AlturaSotanoFaltante);
    expect(() => distanciasTechoPiso_m(0, 1.3)).toThrow(AlturaSotanoFaltante);
    // La sala en PB no necesita sótano para el techo.
    expect(distanciaVerticalNivel_m({ nivelFuente: 0, alturaFuente_m: 1.3, nivelDestino: 1 })).toBeCloseTo(5.4 + 0.5 - 1.3, 12);
    const cfg = { alturaPlantaBaja_m: 4.2, alturaSotano_m: 5 };
    expect(alturaNivel_m(0, cfg)).toBe(4.2);
    for (const n of [1, 2, 3, 7, -1, -2]) expect(alturaNivel_m(n, cfg)).toBe(5);
    expect(alturaNivel_m(-1, { alturasPorNivel: { [-1]: 3.8 } })).toBe(3.8);
    expect(() => alturaNivel_m(-1, { alturaSotano_m: 0 })).toThrow(AlturaSotanoFaltante);
    expect(elevacionNivel_m(0, cfg)).toBe(0);
    expect(elevacionNivel_m(1, cfg)).toBeCloseTo(4.2, 12);
    expect(elevacionNivel_m(2, cfg)).toBeCloseTo(9.2, 12);
    expect(elevacionNivel_m(4, cfg)).toBeCloseTo(4.2 + 3 * 5, 12);
    expect(elevacionNivel_m(-1, cfg)).toBeCloseTo(-5, 12);
    expect(elevacionNivel_m(-2, cfg)).toBeCloseTo(-10, 12);
  });

  it('PB, entrepiso y niveles concretos configurables', () => {
    expect(elevacionNivel_m(3, { alturaPlantaBaja_m: 6, alturaEntrepiso_m: 4.5 })).toBeCloseTo(6 + 2 * 4.5, 12);
    expect(elevacionNivel_m(3, { alturaPlantaBaja_m: 6, alturasPorNivel: { 2: 7 } })).toBeCloseTo(6 + 5 + 7, 12);
    expect(alturaNivel_m(1, { alturaEntrepiso_m: -1 })).toBe(5); // valor no válido → 5 m
    expect(() => elevacionNivel_m(1.5)).toThrow(RangeError);
  });

  it('punto protegido: 0.5 m sobre el piso de arriba y 1.7 m sobre el de abajo', () => {
    expect(ALTURA_PUNTO_NIVEL_ARRIBA_M).toBe(0.5);
    expect(ALTURA_PUNTO_NIVEL_ABAJO_M).toBe(1.7);
    const cfg = { alturaPlantaBaja_m: 5, alturaSotano_m: 5 };
    // Sala en PB, isocentro a 1.3 m: arriba 5 + 0.5 − 1.3 = 4.2 m; abajo (sótano −1) 1.3 + 5 − 1.7 = 4.6 m.
    const d = distanciasTechoPiso_m(0, 1.3, cfg);
    expect(d.arriba_m).toBeCloseTo(4.2, 12);
    expect(d.abajo_m).toBeCloseTo(4.6, 12);
    // Sala en el nivel 2: el nivel 3 está 5 m arriba de su piso (no la altura de PB).
    const d2 = distanciasTechoPiso_m(2, 1.3, { alturaPlantaBaja_m: 3.5 });
    // Con los valores por omisión, PB 5.40 m: arriba 5.4 + 0.5 − 1.3 = 4.6 m.
    expect(distanciasTechoPiso_m(0, 1.3, { alturaSotano_m: 5 }).arriba_m).toBeCloseTo(4.6, 12);
    expect(d2.arriba_m).toBeCloseTo(4.2, 12);
    expect(d2.abajo_m).toBeCloseTo(4.6, 12);
    // Dos niveles arriba de PB (nivel 2): 5 + 5 + 0.5 − 1.3.
    expect(distanciaVerticalNivel_m({ nivelFuente: 0, alturaFuente_m: 1.3, nivelDestino: 2 }, cfg)).toBeCloseTo(9.2, 12);
  });
});

describe('techo y piso con las distancias de los niveles', () => {
  const base: FloorCeilingConfig = {
    energy_MeV: 18, workload_Gy_week: 450, useFactor: 0.25, isocenterHeight_m: 1.3, roomHeight_m: 3.5,
    floorThickness_m: 0.5, ceilingThickness_m: 1.2, areaAboveOccupied: true, areaBelowOccupied: true,
    distanceToAbove_m: 6.2, distanceToBelow_m: 4, designGoalAbove_mSv_week: 0.02, designGoalBelow_mSv_week: 0.02,
    occupancyAbove: 0.025, occupancyBelow: 1,
  };

  it('sin niveles, las distancias capturadas (sin cambio: §7.1.1 a 6.2 m pide 1496 mm)', () => {
    const r = calculateFloorCeiling(base);
    expect(r.distanciasDe).toBe('captura');
    expect(r.distanceToAbove_m).toBe(6.2);
    expect(r.ceilingRequiredThickness_mm).toBeGreaterThan(1489);
    expect(r.ceilingRequiredThickness_mm).toBeLessThan(1504);
  });

  it('con niveles, igual que capturar a mano la distancia de los 5 m por nivel', () => {
    const conNiveles = calculateFloorCeiling({ ...base, niveles: { nivelSala: 1, edificio: { alturaPlantaBaja_m: 4 } } });
    expect(conNiveles.distanciasDe).toBe('niveles');
    expect(conNiveles.distanceToAbove_m).toBeCloseTo(5 + 0.5 - 1.3, 12);
    expect(conNiveles.distanceToBelow_m).toBeCloseTo(1.3 + 4 - 1.7, 12);
    const aMano = calculateFloorCeiling({ ...base, distanceToAbove_m: 4.2, distanceToBelow_m: 3.6 });
    expect(conNiveles.ceilingRequiredThickness_mm).toBeCloseTo(aMano.ceilingRequiredThickness_mm, 9);
    expect(conNiveles.floorRequiredThickness_mm).toBeCloseTo(aMano.floorRequiredThickness_mm, 9);
    // Un entrepiso mayor aleja el punto de arriba y pide menos techo.
    const alto = calculateFloorCeiling({ ...base, niveles: { nivelSala: 1, edificio: { alturaEntrepiso_m: 6 } } });
    expect(alto.ceilingRequiredThickness_mm).toBeLessThan(conNiveles.ceilingRequiredThickness_mm);
  });

  it('sala en PB con área abajo ocupada y sin altura de sótano: el suelo queda pendiente y se pide el dato', () => {
    const r = calculateFloorCeiling({ ...base, niveles: { nivelSala: 0, edificio: {} } });
    expect(r.distanceToAbove_m).toBeCloseTo(5.4 + 0.5 - 1.3, 12);
    expect(r.distanceToBelow_m).toBeNull();
    expect(r.sotanosSinAltura).toEqual([-1]);
    expect(Number.isNaN(r.floorRequiredThickness_mm)).toBe(true);
    expect(r.floorCompliant).toBe(false);
    expect(r.recommendation).toMatch(/altura del sótano/);
    // Con el área de abajo desocupada no hace falta.
    const sinAbajo = calculateFloorCeiling({ ...base, areaBelowOccupied: false, niveles: { nivelSala: 0, edificio: {} } });
    expect(sinAbajo.sotanosSinAltura).toEqual([]);
    expect(sinAbajo.recommendation).not.toMatch(/sótano/);
    const conDato = calculateFloorCeiling({ ...base, niveles: { nivelSala: 0, edificio: { alturaSotano_m: 4 } } });
    expect(conDato.distanceToBelow_m).toBeCloseTo(1.3 + 4 - 1.7, 12);
    expect(conDato.sotanosSinAltura).toEqual([]);
  });

  it('el diálogo usa los niveles por omisión (PB 5.40 m, demás 5 m, sótano vacío) y muestra las distancias', () => {
    render(<FloorCeilingDialog open onOpenChange={() => {}} />);
    const valor = (l: string) => (screen.getByLabelText(l) as HTMLInputElement).value;
    expect(valor('Planta baja, piso a contrapiso (m)')).toBe('5.4');
    expect(valor('Demás niveles, piso a contrapiso (m)')).toBe('5');
    expect(valor('Sótanos, piso a contrapiso (m)')).toBe('');
    expect(valor('Distancia isocentro a punto arriba (m)')).toBe('4.6');
    expect(screen.queryByText(/Capture la altura del sótano/)).toBeNull();
    fireEvent.change(screen.getByLabelText('Demás niveles, piso a contrapiso (m)'), { target: { value: '6' } });
    // En PB el techo da al nivel 1: sólo cambia con la altura de PB.
    expect(valor('Distancia isocentro a punto arriba (m)')).toBe('4.6');
    fireEvent.change(screen.getByLabelText('Nivel de la sala (0 = PB)'), { target: { value: '1' } });
    expect(valor('Distancia isocentro a punto arriba (m)')).toBe('5.2');
    // Sala en sótano: el techo depende de la altura del sótano, que no tiene dato → se pide.
    fireEvent.change(screen.getByLabelText('Nivel de la sala (0 = PB)'), { target: { value: '-1' } });
    expect(screen.getByText(/Capture la altura del sótano \(nivel -1\)/)).toBeTruthy();
    expect(valor('Distancia isocentro a punto arriba (m)')).toBe('');
    fireEvent.change(screen.getByLabelText('Sótanos, piso a contrapiso (m)'), { target: { value: '4' } });
    expect(screen.queryByText(/Capture la altura del sótano/)).toBeNull();
    expect(valor('Distancia isocentro a punto arriba (m)')).toBe('3.2');
  });
});
