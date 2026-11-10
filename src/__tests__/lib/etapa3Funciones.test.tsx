import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AR41, calcularVentilacionAr41 } from '@/lib/ventilacionBunker';
import { verificarBarrera, verificarPlano } from '@/lib/verificacionBlindaje';
import { DIALOGOS_REDIRIGIDOS, resolverDialogo, useAppStore } from '@/stores/appStore';
import UndoRedoHistoryPanel from '@/sections/dialogs/UndoRedoHistoryPanel';
import ShieldingVerification from '@/sections/dialogs/ShieldingVerification';
import type { Barrier, FloorPlan } from '@/types/radshield';

const barrera = (o: Partial<Barrier>): Barrier => ({
  id: 'b1', x1: 0, y1: 0, x2: 1, y2: 0, name: 'Muro este', barrierType: 'primary',
  useFactor: 0.25, occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE', ...o,
});

describe('ventilación Ar-41', () => {
  it('saturación sin ventilación = R/λ (cálculo a mano)', () => {
    const r = calcularVentilacionAr41({ volumenSala_m3: 100, renovaciones_h: 0, flujoTermico_n_cm2_s: 1e5, horasIrradiacion: 1000 });
    const R = 1e5 * 0.66e-24 * 0.00934 * 2.504e19;
    const lambda = Math.LN2 / (109.61 * 60);
    expect(r.produccion_Bq_cm3_s).toBeCloseTo(R, 12);
    expect(r.concentracionSaturacion_Bq_m3 / ((R / lambda) * 1e6)).toBeCloseTo(1, 9);
    expect(r.concentracionFinIrradiacion_Bq_m3 / r.concentracionSaturacion_Bq_m3).toBeCloseTo(1, 6);
    expect(r.advertencias.join(' ')).toContain('Sin ventilación');
  });

  it('la ventilación baja la concentración y la espera reduce la dosis al entrar', () => {
    const base = { volumenSala_m3: 120, flujoTermico_n_cm2_s: 1e5, horasIrradiacion: 2 };
    const sin = calcularVentilacionAr41({ ...base, renovaciones_h: 0 });
    const con = calcularVentilacionAr41({ ...base, renovaciones_h: 10, esperaAntesDeEntrar_min: 10 });
    expect(con.concentracionFinIrradiacion_Bq_m3).toBeLessThan(sin.concentracionFinIrradiacion_Bq_m3);
    expect(con.concentracionAlEntrar_Bq_m3).toBeLessThan(con.concentracionFinIrradiacion_Bq_m3);
    expect(con.emisionChimenea_Bq_s).toBeCloseTo(con.concentracionFinIrradiacion_Bq_m3 * (10 * 120) / 3600, 6);
  });

  it('límites de 10 CFR 20 Ap. B y validación de entradas', () => {
    expect(AR41.DAC_Bq_m3).toBeCloseTo(1.11e5, -2);
    expect(AR41.efluente_Bq_m3).toBeCloseTo(370, 6);
    expect(() => calcularVentilacionAr41({ volumenSala_m3: 0, renovaciones_h: 1, flujoTermico_n_cm2_s: 1, horasIrradiacion: 1 })).toThrow();
    expect(() => calcularVentilacionAr41({ volumenSala_m3: 1, renovaciones_h: -1, flujoTermico_n_cm2_s: 1, horasIrradiacion: 1 })).toThrow();
  });
});

describe('verificación de blindaje', () => {
  it('cumple, no cumple, sin cálculo, sin espesor y material mixto', () => {
    expect(verificarBarrera(barrera({ requiredThickness_mm: { CONCRETE: 1800 }, thickness_mm: 1950 })).estado).toBe('CUMPLE');
    const no = verificarBarrera(barrera({ requiredThickness_mm: 2080, thickness_mm: 1950 }));
    expect(no.estado).toBe('NO_CUMPLE');
    expect(no.nota).toContain('130 mm');
    expect(verificarBarrera(barrera({ thickness_mm: 100 })).estado).toBe('SIN_CALCULO');
    expect(verificarBarrera(barrera({ requiredThickness_mm: 100 })).estado).toBe('SIN_ESPESOR');
    expect(verificarBarrera(barrera({ requiredThickness_mm: 100, shieldingLayers: [{ materialCode: 'CONCRETE', thickness_mm: 80 }, { materialCode: 'PB', thickness_mm: 5 }] })).estado).toBe('REVISAR_MATERIAL');
  });

  it('estima la dosis tras la barrera con la TVL cuando se conoce', () => {
    const f = verificarBarrera(barrera({ requiredThickness_mm: 1000, thickness_mm: 1300 }), () => 300);
    expect(f.dosisEstimada_mSv_sem).toBeCloseTo(0.002, 9);
  });

  it('el plano es apto sólo si todas cumplen, y el diálogo lo muestra', () => {
    // Fase 11: el diálogo usa la verificación del proyecto, que sólo cuenta requeridos con traza del motor.
    const traza = { calculationTrace: { standard: 'NCRP147' } } as unknown as Partial<Barrier>;
    const plano = { barriers: [barrera({ requiredThickness_mm: 10, thickness_mm: 20, ...traza }), barrera({ id: 'b2', requiredThickness_mm: 30, thickness_mm: 20, ...traza })] } as unknown as FloorPlan;
    const r = verificarPlano(plano);
    expect(r.apto).toBe(false);
    expect(r.resumen).toEqual({ total: 2, cumple: 1, noCumple: 1, pendientes: 0 });
    expect(renderToStaticMarkup(<ShieldingVerification open floorPlan={plano} />)).toContain('NO CUMPLE');
  });

  it('un requerido tecleado sin traza del motor no «cumple» en el diálogo (Fase 11)', () => {
    const plano = { barriers: [barrera({ requiredThickness_mm: 10, thickness_mm: 20 })] } as unknown as FloorPlan;
    const html = renderToStaticMarkup(<ShieldingVerification open floorPlan={plano} />);
    expect(html).toContain('SIN CALCULO');
    expect(html).toContain('0/1 cumplen');
  });
});

describe('redirecciones y historial', () => {
  it('las claves duplicadas abren el diálogo real', () => {
    expect(resolverDialogo('shieldingCalculator')).toBe('barrierCalculator');
    expect(resolverDialogo('uncertainty')).toBe('gumUncertainty');
    expect(resolverDialogo('export')).toBe('export');
    useAppStore.getState().closeAll();
    useAppStore.getState().open('quickBarrier');
    const d = useAppStore.getState().dialogs as Record<string, boolean>;
    expect(d.barrierCalculator).toBe(true);
    expect(d.quickBarrier).toBe(false);
    expect(Object.keys(DIALOGOS_REDIRIGIDOS)).toHaveLength(6);
  });

  it('el historial lista acciones y marca la actual', () => {
    const html = renderToStaticMarkup(
      <UndoRedoHistoryPanel open history={[{ id: 1, timestamp: 0, action: 'a', description: 'Mover barrera' }, { id: 2, timestamp: 0, action: 'b', description: 'Cambiar material' }]} currentIndex={0} canUndo canRedo />,
    );
    expect(html).toContain('Mover barrera');
    expect(html).toContain('Cambiar material');
    expect(html).toContain('posición 1');
  });
});

describe('flujo del aire desde Cyclotron-SIM', () => {
  it('lee el contrato KIUBE y escala por corriente', async () => {
    const { leerFlujoAire, flujoParaCorriente } = await import('@/lib/ventilacionBunker');
    const kiube = (await import('@/data/flujo_aire_kiube.json')).default;
    const f = leerFlujoAire(kiube);
    expect(f.corriente_uA).toBe(300);
    expect(flujoParaCorriente(f, 150)).toBeCloseTo(f.phi_termico_aire_n_cm2_s.media / 2, 3);
    expect(flujoParaCorriente(f, 300, true)).toBe(f.phi_termico_aire_n_cm2_s.p95);
    expect(() => leerFlujoAire({ contrato: 'otro' })).toThrow();
  });
});
