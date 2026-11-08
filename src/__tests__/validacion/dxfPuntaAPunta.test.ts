/**
 * Fase 4 — Plano DXF real de punta a punta: geometría → barreras → cálculo normativo → campo → reporte.
 *
 * Usa el mismo fixture que la prueba Playwright `e2e/dxf-import-to-canvas.spec.ts` (`e2e/fixtures/sample-floorplan.dxf`:
 * sala de 8 × 6 m en mm, dos muros primarios de concreto de 300 mm, uno secundario de 250 mm y una puerta de
 * 6 mm de plomo) y las mismas funciones que la aplicación: `importDXFToFloorPlan` (DXFViewerDialog),
 * `useShieldingEngine().calculateAllBarriers` / `calculateHeatmap` (ShieldingDesigner) y `verificarPlano`
 * (diálogo de verificación de blindaje). Corre en el job de Vitest de CI.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { importDXFToFloorPlan } from '@/lib/medical3D/cadBimBridge';
import { useShieldingEngine } from '@/hooks/useShieldingEngine';
import { capasDeBarrera, centroCelda, dosisEnPunto } from '@/lib/doseFieldEngine';
import { mallaDoseMap } from '@/lib/visoresDosis';
import { calcularBarreraNormativa } from '@/lib/normativeBarrierEngine';
import { generateSamplePoints } from '@/lib/shieldingMath';
import { verificarPlano } from '@/lib/verificacionBlindaje';
import { MATERIALS, MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';

const DXF = readFileSync(path.resolve(__dirname, '../../../e2e/fixtures/sample-floorplan.dxf'), 'utf8');

const importar = () => importDXFToFloorPlan(DXF, 'sample-floorplan.dxf');

const fuente = (plano: FloorPlan): RadiationSource => ({
  id: 'rad-1', name: 'Sala radiográfica', modality: MODALITIES.find((m) => m.id === 'rad-abdomen')!,
  x: plano.width_pixels / 2, y: plano.height_pixels / 2, workloadValue: 125, workloadUnit: 'pacientes/semana',
  isocenterHeight_m: 1.2, useFactor: 1,
});

describe('DXF real (e2e/fixtures/sample-floorplan.dxf) de punta a punta', () => {
  it('geometría: 4 barreras en metros (INSUNITS = mm), tipos, materiales y espesores declarados en las capas', () => {
    const { floorPlan, summary } = importar();
    expect(summary.mappedBarriers).toBe(4);
    expect(floorPlan.scale_m_per_pixel).toBeCloseTo(0.001, 9);
    const porCapa = (s: string) => floorPlan.barriers.find((b) => b.name.includes(s))!;
    const prim = floorPlan.barriers.filter((b) => b.name.includes('WALL_PRIMARY_CONCRETE_300MM'));
    expect(prim).toHaveLength(2);
    expect(prim.every((b) => b.barrierType === 'primary' && b.thickness_mm === 300)).toBe(true);
    expect(porCapa('WALL_SECONDARY_CONCRETE_250MM')).toMatchObject({ barrierType: 'secondary', thickness_mm: 250 });
    expect(porCapa('DOOR_LEAD_6MM')).toMatchObject({ barrierType: 'leakage', thickness_mm: 6 });
    // Los códigos del importador CAD se resuelven al catálogo para el motor.
    expect(capasDeBarrera(prim[0])).toEqual([{ materialCode: 'CONCRETE235', thickness_mm: 300 }]);
    expect(capasDeBarrera(porCapa('DOOR_LEAD_6MM'))).toEqual([{ materialCode: 'PB', thickness_mm: 6 }]);
  });

  it('barreras → cálculo normativo (NCRP 147) → campo → reporte de verificación', () => {
    const { floorPlan } = importar();
    const s = fuente(floorPlan);
    const plano: FloorPlan = { ...floorPlan, sources: [s] };
    const escala = plano.scale_m_per_pixel;
    const { result } = renderHook(() => useShieldingEngine());

    // Cálculo por barrera, como el botón «Calcular» del diseñador.
    const calculadas: Barrier[] = result.current.calculateAllBarriers(plano.barriers, plano.sources, escala);
    expect(calculadas).toHaveLength(4);
    for (const b of calculadas) {
      expect(b.calculationTrace?.standard).toBe('NCRP147');
      const req = b.requiredThickness_mm as Record<string, number>;
      expect(req.PB).toBeGreaterThan(0);
      expect(req.CONCRETE235).toBeGreaterThan(0);
      // Una sola fuente de verdad: el requerido coincide con el motor normativo en los mismos puntos de muestreo.
      const pts = generateSamplePoints(b, escala, plano.sources);
      const ref = calcularBarreraNormativa(b, plano.sources, pts, escala, MATERIALS)!;
      expect(req.PB).toBeCloseTo(ref.espesores_mm.PB, 9);
    }
    const prim = calculadas.find((b) => b.barrierType === 'primary')!;
    const sec = calculadas.find((b) => b.barrierType === 'secondary')!;
    // Primaria (Tabla 4.5/B.1) exige más que la secundaria (Tabla 4.7/C.1) a distancias similares.
    expect((prim.requiredThickness_mm as Record<string, number>).CONCRETE235)
      .toBeGreaterThan((sec.requiredThickness_mm as Record<string, number>).CONCRETE235);

    const planoCalculado: FloorPlan = { ...plano, barriers: calculadas };

    // Campo: detrás de cada barrera instalada (puntos de muestreo, 0.3 m más allá de la cara exterior) el kerma
    // es ≤ P/T, y la barrera atenúa con el método normativo (no «SIN_MATERIAL»).
    for (const b of calculadas) {
      for (const p of generateSamplePoints(b, escala, plano.sources)) {
        const d = dosisEnPunto(plano.sources, p.x, p.y, escala, { barriers: calculadas, materials: MATERIALS });
        expect(d.kerma_mSv_semana).toBeLessThanOrEqual(b.designGoal_mSv_per_wk / b.occupancyFactor);
        expect(d.kerma_mSv_semana).toBeLessThan(d.kermaSinBlindaje_mSv_semana);
        const cruces = d.porFuente[0].componentes.flatMap((c) => c.cruces);
        expect(cruces.length).toBeGreaterThan(0);
        expect(cruces.flatMap((c) => c.capas).every((c) => c.metodo === 'NCRP147_ARCHER')).toBe(true);
      }
    }

    // Mapa de dosis del plano completo (DoseMapDialog, `mallaDoseMap`, mismo motor): dentro de la sala sin atenuar;
    // fuera, atenuado por los muros del DXF y ≤ P/T más allá de 0.3 m de la cara exterior.
    const malla = mallaDoseMap(planoCalculado, 60)!;
    const dentro: number[] = [], fuera: number[] = [], frente: number[] = [];
    for (let iy = 0; iy < malla.ny; iy++) {
      for (let ix = 0; ix < malla.nx; ix++) {
        const { x, y } = centroCelda(malla, ix, iy);
        const i = iy * malla.nx + ix;
        if (x > 100 && x < 7900 && y > 100 && y < 5900) dentro.push(i);
        if (x < -600 || x > 8600 || y < -600 || y > 6600) fuera.push(i);
        // Frente a un muro (no en la diagonal de una esquina exterior).
        if ((x > 1000 && x < 7000 && (y < -600 || y > 6600)) || (y > 1000 && y < 5000 && (x < -600 || x > 8600))) frente.push(i);
      }
    }
    expect(dentro.length).toBeGreaterThan(0);
    expect(fuera.length).toBeGreaterThan(0);
    expect(dentro.every((i) => Math.abs(malla.valores[i] - malla.sinBlindaje[i]) <= 1e-6 * malla.sinBlindaje[i])).toBe(true);
    expect(fuera.every((i) => malla.valores[i] < malla.sinBlindaje[i])).toBe(true);
    expect(frente.length).toBeGreaterThan(0);
    expect(Math.max(...frente.map((i) => malla.valores[i]))).toBeLessThanOrEqual(0.02);
    // Fase 5 — esquinas: las bandas de muros que comparten extremo se unen en inglete, así que también en la
    // diagonal de las esquinas exteriores (antes un hueco t × t sin blindaje: hasta ~0.7 mGy/semana) el campo es
    // ≤ P/T más allá de 0.6 m de la cara exterior.
    expect(Math.max(...fuera.map((i) => malla.valores[i]))).toBeLessThanOrEqual(0.02);

    // Fase 5 — dominio del heat map del lienzo en metros: antes ±200 px alrededor de la fuente (±0.2 m en este DXF
    // en mm, sin llegar a los muros); ahora cubre la sala y más allá de los muros, con el valor del motor en cada punto.
    const heat = result.current.calculateHeatmap(plano.sources, escala, 50, undefined, calculadas);
    const xs = heat.map((q) => q.x), ys = heat.map((q) => q.y);
    expect(Math.min(...xs)).toBeLessThan(-300);
    expect(Math.max(...xs)).toBeGreaterThan(8300);
    expect(Math.min(...ys)).toBeLessThan(-300);
    expect(Math.max(...ys)).toBeGreaterThan(6300);
    expect(heat.length).toBeLessThanOrEqual(80 * 80);
    for (const q of heat.filter((_, i) => i % 97 === 0)) {
      const ref = dosisEnPunto(plano.sources, q.x, q.y, escala, { barriers: calculadas, materials: MATERIALS }).kerma_mSv_semana;
      expect(Math.abs(q.kerma - ref)).toBeLessThanOrEqual(1e-6 * ref + 1e-30);
    }
    const heatFuera = heat.filter((q) => q.x < -600 || q.x > 8600 || q.y < -600 || q.y > 6600);
    expect(heatFuera.length).toBeGreaterThan(0);
    expect(heatFuera.every((q) => q.kerma < q.kermaSinBlindaje && q.kerma <= 0.02)).toBe(true);

    // Reporte: verificación instalado (capas del DXF) vs. requerido (motor) — todas las barreras cumplen.
    const rep = verificarPlano(planoCalculado);
    expect(rep.filas).toHaveLength(4);
    expect(rep.filas.map((f) => f.estado)).toEqual(['CUMPLE', 'CUMPLE', 'CUMPLE', 'CUMPLE']);
    for (const f of rep.filas) {
      expect(f.requerido_mm).not.toBeNull();
      expect(f.instalado_mm).toBeGreaterThan(f.requerido_mm!);
    }
  });

  it('reporte: un muro más delgado que el requerido se marca NO_CUMPLE y el campo detrás supera P/T', () => {
    const { floorPlan } = importar();
    const plano: FloorPlan = { ...floorPlan, sources: [{ ...fuente(floorPlan), workloadValue: 2000 }] };
    const { result } = renderHook(() => useShieldingEngine());
    const calc = result.current.calculateAllBarriers(plano.barriers, plano.sources, plano.scale_m_per_pixel);
    const puerta = calc.find((b) => b.name.includes('DOOR_LEAD_6MM'))!;
    const delgada = calc.map((b) => (b.id === puerta.id ? { ...b, thickness_mm: 0.1 } : b));
    const fila = verificarPlano({ ...plano, barriers: delgada }).filas.find((f) => f.barreraId === puerta.id)!;
    expect(fila.estado).toBe('NO_CUMPLE');
    const [p] = generateSamplePoints({ ...puerta, thickness_mm: 0.1 }, plano.scale_m_per_pixel, plano.sources);
    const d = dosisEnPunto(plano.sources, p.x, p.y, plano.scale_m_per_pixel, { barriers: delgada, materials: MATERIALS });
    expect(d.kerma_mSv_semana).toBeGreaterThan(puerta.designGoal_mSv_per_wk);
  });
});
