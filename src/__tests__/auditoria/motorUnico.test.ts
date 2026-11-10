/**
 * Fase 11 — un solo motor para todas las rutas de cálculo.
 *
 * Rutas del diseñador y la función que ejecutan:
 * - Barra superior «Calcular Blindaje», «Guíame», paleta de comandos, barra lateral «Calc», F5, botones del lienzo y
 *   cálculo preliminar del DXF confirmado → `runCalculations` → `calcularProyectoAsync`.
 * - Cálculo por lotes y demás diálogos con `useShieldingEngine().calculateAllBarriers` → `calcularBarrerasValidadas`.
 * - Referencia: `calcularBarreraNormativa` sobre los mismos puntos de muestreo (motor validado en la Fase 4 contra
 *   NCRP 147 §5 y NCRP 151 §7.1).
 *
 * Para cada caso (NCRP 147 §5.1 y §5.2, NCRP 151 §7.1.1 y §7.1.5, TG-108 F-18, Tc-99m e I-131) las tres rutas deben dar
 * exactamente el mismo espesor y el mismo estado de cumplimiento, y el resultado del lienzo/reportes debe salir de
 * esa barrera (no de otro motor).
 */
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { useShieldingEngine } from '@/hooks/useShieldingEngine';
import {
  MOTOR_PROYECTO, calcularBarrerasValidadas, calcularProyecto, calcularProyectoAsync, resultadoDeBarrera,
} from '@/lib/motorProyecto';
import { calcularBarreraNormativa } from '@/lib/normativeBarrierEngine';
import { generateSamplePoints } from '@/lib/shieldingMath';
import { verificarBarrera } from '@/lib/estadoProyecto';
import { planoEjemploCompleto } from '@/lib/ejemploGuiado';
import { MATERIALS, MODALITIES, type Barrier, type FloorPlan, type Modality, type RadiationSource } from '@/types/radshield';

// Como en la suite de NCRP 147: los ids de la Tabla 4.5 que no están en el catálogo se declaran como diagnóstico.
const modalidad = (id: string): Modality =>
  MODALITIES.find((m) => m.id === id) ?? { id, name: id, description: id, category: 'diagnostic', standard: 'NCRP147', unit: 'mGy/paciente' };

const plano = (nombre: string, barriers: Barrier[], sources: RadiationSource[], escala = 0.01): FloorPlan => ({
  id: nombre, name: nombre, imageUrl: null, width_pixels: 2000, height_pixels: 2000, scale_m_per_pixel: escala,
  barriers, sources, regions: [], criticalPoints: [],
} as unknown as FloorPlan);

// Escala 0.01 m/px; la fuente en (0, 0) y la barrera perpendicular al eje x a la distancia indicada.
const muro = (id: string, d_m: number, extra: Partial<Barrier> = {}): Barrier => ({
  id, name: id, x1: d_m * 100, y1: -150, x2: d_m * 100, y2: 150, barrierType: 'secondary', useFactor: 1,
  occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'PB', ...extra,
} as Barrier);

const diag = (id: string, N: number): RadiationSource => ({
  id: `s-${id}`, x: 0, y: 0, name: id, modality: modalidad(id), workloadValue: N, workloadUnit: 'pacientes/semana',
  isocenterHeight_m: 0, useFactor: 1,
} as RadiationSource);

const linac = (mv: 6 | 18): RadiationSource => ({
  id: `l${mv}`, x: 0, y: 0, name: `${mv} MV`, modality: modalidad(`linac-${mv}mv`),
  workloadValue: (mv === 18 ? 450 : 225) / 2, workloadUnit: 'fracciones/semana', isocenterHeight_m: 0, useFactor: 0.25,
  imrtFraction: 0, imrtFactor: 5,
} as RadiationSource);

const nuclear = (id: string, A0_MBq: number): RadiationSource => ({
  id: `n-${id}`, x: 0, y: 0, name: id, modality: modalidad(id), workloadValue: 30, workloadUnit: 'pacientes/semana',
  isocenterHeight_m: 1, useFactor: 1, tg108: { A0_MBq, pacientesSemana: 30, tU_h: 1, tI_h: 0.5, sala: 'captacion' },
} as RadiationSource);

const CASOS: { nombre: string; plan: FloorPlan; metodo?: 'NCRP147' | 'NCRP151' }[] = [
  { nombre: 'NCRP 147 §5.1 angiografía cardiaca (secundaria, 4 m)', metodo: 'NCRP147', plan: plano('147-5.1', [muro('b', 4)], [diag('angio-cardiac', 25)]) },
  { nombre: 'NCRP 147 §5.2 tórax (primaria, 3 m)', metodo: 'NCRP147', plan: plano('147-5.2', [muro('b', 3, { barrierType: 'primary' })], [diag('rad-chest', 300)]) },
  {
    nombre: 'NCRP 151 §7.1.1 primaria 18 MV (T = 1/40)', metodo: 'NCRP151',
    plan: plano('151-7.1.1', [muro('b', 6.9, { barrierType: 'primary', occupancyFactor: 0.025, useFactor: 0.25, materialCode: 'CONCRETE235' })], [linac(18)]),
  },
  {
    nombre: 'NCRP 151 §7.1.5 secundaria doble energía (θ = 30°)', metodo: 'NCRP151',
    plan: plano('151-7.1.5', [muro('b', 6.9, { occupancyFactor: 0.025, useFactor: 0.25, materialCode: 'CONCRETE235', scatterAngle_deg: 30 })], [linac(18), linac(6)]),
  },
  { nombre: 'TG-108 PET/CT F-18 (ejemplo de «Guíame»)', plan: planoEjemploCompleto() },
  { nombre: 'TG-108 estilo Tc-99m', plan: plano('tc99m', [muro('b', 2), muro('c', 3.5, { materialCode: 'CONCRETE235' })], [nuclear('spect-tc99m', 740)]) },
  { nombre: 'TG-108 estilo I-131', plan: plano('i131', [muro('b', 2), muro('c', 3, { materialCode: 'CONCRETE235' })], [nuclear('radioiodine-i131', 5550)]) },
];

/** Espesor instalado: la mitad del requerido en la primera barrera (NO_CUMPLE) y el doble en las demás (CUMPLE). */
function conInstalado(plan: FloorPlan): FloorPlan {
  const ref = calcularProyecto(plan).barriers;
  return {
    ...plan,
    barriers: plan.barriers.map((b, i) => {
      const r = (ref[i].requiredThickness_mm ?? {}) as Record<string, number>;
      const req = r[b.materialCode] ?? 0;
      return { ...b, thickness_mm: req > 0 ? (i === 0 ? req / 2 : req * 2) : 10 };
    }),
  };
}

const resumen = (bs: Barrier[]) => bs.map((b) => ({
  id: b.id,
  espesores: b.requiredThickness_mm,
  kerma: b.maxKerma,
  estado: verificarBarrera(b).estado,
  norma: b.calculationTrace?.standard,
}));

describe('Fase 11 — todas las rutas usan el motor validado', () => {
  for (const caso of CASOS) {
    it(`${caso.nombre}: barra superior = barra lateral/F5/lienzo = lote = motor normativo`, async () => {
      const plan = conInstalado(caso.plan);
      const { result } = renderHook(() => useShieldingEngine());
      const porHook = result.current.calculateAllBarriers(plan.barriers, plan.sources, plan.scale_m_per_pixel);
      const sinc = calcularProyecto(plan);
      const progreso: number[] = [];
      const asinc = await calcularProyectoAsync(plan, { onProgress: (p) => progreso.push(p) });
      const lote = calcularBarrerasValidadas(plan.barriers, plan.sources, plan.scale_m_per_pixel);

      expect(resumen(sinc.barriers)).toEqual(resumen(porHook));
      expect(resumen(asinc.barriers)).toEqual(resumen(porHook));
      expect(resumen(lote)).toEqual(resumen(porHook));
      expect(progreso.at(-1)).toBe(100);

      // Hay espesor y estado reales: la primera barrera no cumple (instalado = requerido / 2).
      const primero = porHook[0];
      const req = (primero.requiredThickness_mm as Record<string, number>)[primero.materialCode];
      if (req > 0) expect(verificarBarrera(primero).estado).toBe('NO_CUMPLE');

      // Resultados para lienzo, PDF y CNSNS: salen de la barrera calculada, con su estado.
      for (const [i, b] of porHook.entries()) {
        const r = asinc.barrierResults[i];
        expect(r).toEqual(resultadoDeBarrera(b));
        expect(r.motor).toBe(MOTOR_PROYECTO);
        expect(r.estado).toBe(verificarBarrera(b).estado);
        expect(r.pass).toBe(r.estado === 'CUMPLE');
        expect(r.maxKermaRate_mGy_per_wk).toBe(b.maxKerma);
        expect(asinc.sampleLines[i].points.length).toBe(generateSamplePoints(b, plan.scale_m_per_pixel, plan.sources).length);
      }

      // Con NCRP 147/151 el espesor es exactamente el del motor normativo sobre los mismos puntos.
      if (caso.metodo) {
        for (const b of plan.barriers) {
          const pts = generateSamplePoints(b, plan.scale_m_per_pixel, plan.sources);
          const ref = calcularBarreraNormativa(b, plan.sources, pts, plan.scale_m_per_pixel, MATERIALS)!;
          expect(ref.metodo).toBe(caso.metodo);
          const calc = porHook.find((x) => x.id === b.id)!;
          expect(calc.requiredThickness_mm).toEqual(ref.espesores_mm);
          expect(calc.calculationTrace?.standard).toBe(caso.metodo);
        }
      }
    });
  }

  it('el resultado depende de la modalidad y la energía (el motor retirado usaba un TVL de plomo fijo)', () => {
    const p18 = calcularProyecto(CASOS[2].plan).barriers[0].requiredThickness_mm as Record<string, number>;
    const p6 = calcularProyecto(plano('6mv', CASOS[2].plan.barriers, [{ ...linac(6), workloadValue: 450 / 2 }])).barriers[0].requiredThickness_mm as Record<string, number>;
    // NCRP 151 §7.1.1: ~150 cm de concreto a 18 MV; 6 MV con la misma carga necesita menos.
    expect(p18.CONCRETE235 / 10).toBeGreaterThan(140);
    expect(p6.CONCRETE235).toBeLessThan(p18.CONCRETE235);
    const pet = calcularProyecto(planoEjemploCompleto()).barriers.map((b) => (b.requiredThickness_mm as Record<string, number>).PB ?? 0);
    expect(Math.max(...pet)).toBeLessThan(80);
  });

  it('ninguna ruta del diseñador usa AsyncShieldingEngine ni otro motor paralelo', () => {
    const sd = readFileSync('src/pages/ShieldingDesigner.tsx', 'utf8');
    expect(sd).not.toMatch(/new AsyncShieldingEngine|lib\/engine\/|asyncEngineRef|engine\.calculate\(|useSmartBarrier\(|useWebWorker\(|useWorkerCalculation\(|useWASM\(|lib\/shieldingEngine/);
    expect(sd).toMatch(/const runRadShieldCalculations = runCalculations;/);
    expect(sd).toMatch(/case 'f5': e\.preventDefault\(\); runRadShieldCalculations\(\)/);
    expect(sd.match(/calcularProyectoAsync\(/g)?.length).toBe(2); // runCalculations y DXF confirmado
  });
});

describe('Fase 11 — herramientas del agente con las tablas de NCRP 151', () => {
  it('checkSkyshine, compareMaterials y validateTVL usan la Tabla B.2 (TVL₁/TVLₑ)', async () => {
    const { getTool } = await import('@/lib/agents/tools');
    const { transmisionTVL, tvlPrimaria } = await import('@/lib/ncrp151');
    const sky = await getTool('checkSkyshine')!.execute({ energy: 18, roofThicknessCm: 120, hasOverhang: false });
    expect(sky.transmissionFactor).toBeCloseTo(Math.round(transmisionTVL(120, tvlPrimaria(18, 'concrete')) * 1000) / 1000, 6);
    const cmp = await getTool('compareMaterials')!.execute({ energy: 6, targetThicknessCm: 10 });
    const plomo = cmp.comparisons.find((c: { material: string }) => c.material === 'lead');
    expect(plomo.transmission).toBeCloseTo(transmisionTVL(10, tvlPrimaria(6, 'lead')), 12);
    const v = await getTool('validateTVL')!.execute({ energy: 6, material: 'concrete', claimedTVL: 37 });
    expect(v.actualTVL).toBe(tvlPrimaria(6, 'concrete').tvl1_cm);
  });
});
