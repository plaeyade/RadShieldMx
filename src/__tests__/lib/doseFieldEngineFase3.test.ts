/**
 * Fase 3 del motor de campo (docs/plan-motores-calculo.md): DoseMapDialog, SpatialDoseMapDialog, el modo
 * dosis de Medical 3D y doseMappingEngine consumen `doseFieldEngine`. Cada visor se compara con
 * `dosisEnPunto` en ≥ 10 puntos (diferencia < 1 %); unidades m vs. px con dos escalas; Γ, TVL de 511 keV
 * y cm/m de doseMappingEngine.
 */
import { describe, expect, it } from 'vitest';
import {
  calcularMallaRegular,
  centroCelda,
  componentesPresentes,
  dosisEnPunto,
  kermaComponente,
  kermaFiltrado,
  limitesDelPlano,
  type ComponenteCampo,
  type MallaRegularDosis,
} from '@/lib/doseFieldEngine';
import { mallaDoseMap, mallaSpatialDoseMap } from '@/lib/visoresDosis';
import { resultadoDesdeMalla } from '@/lib/doseMapEngine';
import { buildMedicalScene } from '@/lib/medical3D/sceneBuilder';
import {
  generateDetectorMesh,
  tasaDosisMapeo_uSv_h,
  muroMapeo,
  computeMeshStats,
} from '@/lib/doseMappingEngine';
import { MATERIALS, MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';

const modalidad = (id: string) => MODALITIES.find((m) => m.id === id)!;

/** Plano de prueba: LINAC 6 MV + radiografía, búnker con muro primario y secundario (escala s m/px). */
function plano(s = 0.01): FloorPlan {
  const px = (m: number) => m / s;
  const fuentes: RadiationSource[] = [
    {
      id: 'linac', name: 'LINAC', x: px(4), y: px(4), modality: modalidad('linac-6mv'), workloadValue: 250,
      workloadUnit: 'fracciones', isocenterHeight_m: 1.3, useFactor: 0.25, imrtFraction: 0,
    },
    {
      id: 'rx', name: 'Rx', x: px(1), y: px(1), modality: modalidad('rad-chest'), workloadValue: 120,
      workloadUnit: 'pacientes', isocenterHeight_m: 1.2, useFactor: 1,
    },
  ];
  const muro = (id: string, x1: number, y1: number, x2: number, y2: number, extra: Partial<Barrier>): Barrier => ({
    id, name: id, x1: px(x1), y1: px(y1), x2: px(x2), y2: px(y2), barrierType: 'secondary', useFactor: 0.25,
    occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', ...extra,
  });
  return {
    id: 'p', name: 'prueba', imageUrl: null, scale_m_per_pixel: s, width_pixels: px(10), height_pixels: px(10),
    sources: fuentes,
    barriers: [
      muro('primaria', 7, 0, 7, 8, { barrierType: 'primary', thickness_mm: 1500 }),
      muro('secundaria', 0, 7, 7, 7, { thickness_mm: 900 }),
      muro('plomo', 0, 2.5, 3, 2.5, { materialCode: 'PB', thickness_mm: 2 }),
    ],
    occupiedRegions: [], regions: [], criticalPoints: [],
  } as FloorPlan;
}

/** ≥ 10 celdas repartidas por la malla (incluye detrás de las barreras). */
function celdasMuestra(m: MallaRegularDosis): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < 16; i++) out.push([Math.floor(((i * 7 + 3) % 16) / 16 * m.nx), Math.floor(i / 16 * m.ny)]);
  out.push([m.nx - 1, m.ny - 1], [0, 0], [m.nx - 1, Math.floor(m.ny / 2)]);
  return out;
}

function compararConMotor(m: MallaRegularDosis, p: FloorPlan, componentes?: readonly ComponenteCampo[]) {
  const celdas = celdasMuestra(m);
  expect(celdas.length).toBeGreaterThanOrEqual(10);
  let atenuadas = 0;
  for (const [ix, iy] of celdas) {
    const { x, y } = centroCelda(m, ix, iy);
    const d = dosisEnPunto(p.sources, x, y, p.scale_m_per_pixel, { barriers: p.barriers });
    const ref = kermaFiltrado(d, componentes);
    const v = m.valores[iy * m.nx + ix];
    expect(Math.abs(v - ref) / Math.max(ref, 1e-30)).toBeLessThan(0.01);
    if (d.kerma_mSv_semana < 0.5 * d.kermaSinBlindaje_mSv_semana) atenuadas++;
  }
  expect(atenuadas).toBeGreaterThan(0); // las barreras reales del plano entran en el mapa
}

describe('Fase 3 — DoseMapDialog consume el motor de campo', () => {
  it('malla del diálogo = dosisEnPunto en ≥ 10 puntos (todas las componentes)', () => {
    const p = plano();
    const m = mallaDoseMap(p, 40)!;
    expect(m.nx).toBe(40);
    compararConMotor(m, p);
  });

  it('componentes seleccionables: sólo fuga = kermaComponente(fuga)', () => {
    const p = plano();
    const m = mallaDoseMap(p, 30, ['fuga'])!;
    compararConMotor(m, p, ['fuga']);
    const { x, y } = centroCelda(m, 5, 5);
    const d = dosisEnPunto(p.sources, x, y, p.scale_m_per_pixel, { barriers: p.barriers });
    expect(m.valores[5 * m.nx + 5] / kermaComponente(d, 'fuga')).toBeCloseTo(1, 6); // Float32
  });

  it('el resultado de presentación conserva los valores del motor y dibuja P/T', () => {
    const m = mallaDoseMap(plano(), 20)!;
    const r = resultadoDesdeMalla(m, [0.02 / 0.25]);
    expect(r.grid).toBe(m.valores);
    expect(r.width).toBe(m.nx);
    expect(r.height).toBe(m.ny);
    expect(r.cellSize_m).toBeCloseTo(m.paso_m, 12);
    expect(r.contourLines[0]?.level).toBeCloseTo(0.08, 12);
  });

  it('sin fuentes no hay malla', () => {
    expect(mallaDoseMap({ ...plano(), sources: [] }, 40)).toBeNull();
  });
});

describe('Fase 3 — SpatialDoseMapDialog consume el motor de campo', () => {
  it('malla del visor = dosisEnPunto en ≥ 10 puntos', () => {
    const p = plano();
    compararConMotor(mallaSpatialDoseMap(p)!, p);
  });

  it('componentes presentes del plano: LINAC (primaria/fuga/dispersión) y NCRP 147', () => {
    const c = componentesPresentes(plano().sources, 0.01);
    expect(c).toEqual(expect.arrayContaining(['primaria', 'fuga', 'dispersion', 'primaria147', 'secundaria147']));
    const m = mallaSpatialDoseMap(plano(), ['primaria147', 'secundaria147'])!;
    compararConMotor(m, plano(), ['primaria147', 'secundaria147']);
  });
});

describe('Fase 3 — modo dosis de Medical 3D', () => {
  it('cada celda tiene el kerma del motor en su centro (m → px con la escala del plano)', () => {
    const p = plano();
    const scene = buildMedicalScene(p, 'linac', { dosis: {} });
    expect(scene.dosePoints.length).toBeGreaterThanOrEqual(10);
    const idx = [0, 7, 33, 101, 250, 377, scene.dosePoints.length - 1, 64, 128, 200, 300];
    for (const i of idx) {
      const pt = scene.dosePoints[i];
      const d = dosisEnPunto(p.sources, pt.position[0] / p.scale_m_per_pixel, pt.position[2] / p.scale_m_per_pixel, p.scale_m_per_pixel, { barriers: p.barriers });
      expect(Math.abs(pt.kerma_mSv_semana - d.kerma_mSv_semana) / d.kerma_mSv_semana).toBeLessThan(0.01);
      expect(pt.nivel).toBe(d.kerma_mSv_semana > 0.1 ? 'controlada' : d.kerma_mSv_semana > 0.02 ? 'supervisada' : 'libre');
    }
  });

  it('componentes seleccionables y sin cálculo si no se pide el modo dosis', () => {
    const p = plano();
    const sec = buildMedicalScene(p, 'linac', { dosis: { componentes: ['fuga', 'dispersion'] } });
    const pt = sec.dosePoints[40];
    const d = dosisEnPunto(p.sources, pt.position[0] / 0.01, pt.position[2] / 0.01, 0.01, { barriers: p.barriers });
    expect(pt.kerma_mSv_semana / kermaFiltrado(d, ['fuga', 'dispersion'])).toBeCloseTo(1, 6); // Float32
    expect(buildMedicalScene(p, 'linac').dosePoints).toEqual([]);
  });
});

describe('Fase 3 — unidades (m vs. px) con dos escalas', () => {
  it('el mismo plano físico a 0.01 y 0.02 m/px da la misma malla y el mismo kerma', () => {
    const a = plano(0.01), b = plano(0.02);
    const ma = mallaDoseMap(a, 32)!, mb = mallaDoseMap(b, 32)!;
    expect(ma.nx).toBe(mb.nx);
    expect(ma.ny).toBe(mb.ny);
    expect(ma.paso_m).toBeCloseTo(mb.paso_m, 9);
    expect(mb.paso_px).toBeCloseTo(ma.paso_px / 2, 9);
    for (let i = 0; i < ma.valores.length; i += 37) {
      expect(Math.abs(ma.valores[i] - mb.valores[i]) / Math.max(ma.valores[i], 1e-30)).toBeLessThan(1e-5);
    }
    // Un punto físico (8.5 m, 4 m), detrás del muro primario de 1.5 m (cara interior en x = 7 m).
    const ka = dosisEnPunto(a.sources, 850, 400, 0.01, { barriers: a.barriers }).kerma_mSv_semana;
    const kb = dosisEnPunto(b.sources, 425, 200, 0.02, { barriers: b.barriers }).kerma_mSv_semana;
    expect(kb / ka).toBeCloseTo(1, 9);
    expect(limitesDelPlano(b, 1)!.ancho * 0.02).toBeCloseTo(limitesDelPlano(a, 1)!.ancho * 0.01, 9);
  });

  it('la escena 3D a dos escalas tiene las mismas celdas en metros', () => {
    const sa = buildMedicalScene(plano(0.01), 'linac', { dosis: {} });
    const sb = buildMedicalScene(plano(0.02), 'linac', { dosis: {} });
    expect(sa.dosePoints.length).toBe(sb.dosePoints.length);
    for (let i = 0; i < sa.dosePoints.length; i += 29) {
      expect(sb.dosePoints[i].position[0]).toBeCloseTo(sa.dosePoints[i].position[0], 6);
      expect(sb.dosePoints[i].kerma_mSv_semana / sa.dosePoints[i].kerma_mSv_semana).toBeCloseTo(1, 4);
    }
  });
});

describe('Fase 3 — doseMappingEngine delega en el motor', () => {
  const fuente = { x: 2, y: 1.5, z: 2 };

  it('Γ de F-18: 1 GBq a 2 m da 143/4 µSv/h (antes 1000× menos)', () => {
    expect(tasaDosisMapeo_uSv_h({ x: 4, y: 1.5, z: 2 }, fuente, 1, null)).toBeCloseTo(143 / 4, 9);
    // La altura cuenta como distancia vertical: 1 m arriba y 0 en planta... a 1 m en planta: d = √2.
    expect(tasaDosisMapeo_uSv_h({ x: 3, y: 2.5, z: 2 }, fuente, 1, null)).toBeCloseTo(143 / 2, 9);
  });

  it('TVL de 511 keV del catálogo (TG-108): 1.66 cm de plomo y 17.6 cm de concreto = 1 TVL', () => {
    const sin = tasaDosisMapeo_uSv_h({ x: 5, y: 1.5, z: 2 }, fuente, 1, null);
    const pb = tasaDosisMapeo_uSv_h({ x: 5, y: 1.5, z: 2 }, fuente, 1, muroMapeo(fuente, 1, 1.66, 'lead'));
    const co = tasaDosisMapeo_uSv_h({ x: 5, y: 1.5, z: 2 }, fuente, 1, muroMapeo(fuente, 1, 17.6, 'concrete'));
    expect(pb / sin).toBeCloseTo(0.1, 6);
    expect(co / sin).toBeCloseTo(0.1, 6);
    expect(MATERIALS.find((m) => m.code === 'PB')!.TVL_mm['511keV']).toBe(16.6);
  });

  it('cm/m: el muro está a shieldDistance_m (m) de la fuente; antes de él no hay atenuación', () => {
    const muro = muroMapeo(fuente, 1.5, 10, 'lead');
    expect(tasaDosisMapeo_uSv_h({ x: 3, y: 1.5, z: 2 }, fuente, 1, muro)).toBeCloseTo(143, 6); // x = 3 < 3.5
    expect(tasaDosisMapeo_uSv_h({ x: 4.5, y: 1.5, z: 2 }, fuente, 1, muro)).toBeLessThan(1e-3);
  });

  it('la malla 3D = motor en ≥ 10 vóxeles; neutrones y electrones fuera de alcance', () => {
    const mesh = generateDetectorMesh('photon', fuente, 2, { x: 4, y: 3, z: 4 }, 50, 5, 'concrete', 1);
    expect(mesh.voxels.length).toBeGreaterThan(10);
    const muro = muroMapeo(fuente, 1, 5, 'concrete');
    for (let i = 0; i < mesh.voxels.length; i += Math.floor(mesh.voxels.length / 12)) {
      const v = mesh.voxels[i];
      const ref = tasaDosisMapeo_uSv_h(v, fuente, 2, muro);
      expect(Math.abs(v.doseRate_uSv_h - ref) / ref).toBeLessThan(0.01);
    }
    const pos = generateDetectorMesh('positron', fuente, 2, { x: 4, y: 3, z: 4 }, 50);
    expect(pos.voxels[3].doseRate_uSv_h).toBeCloseTo(generateDetectorMesh('photon', fuente, 2, { x: 4, y: 3, z: 4 }, 50).voxels[3].doseRate_uSv_h, 9);
    for (const t of ['neutron', 'electron'] as const) {
      const m = generateDetectorMesh(t, fuente, 2, { x: 4, y: 3, z: 4 }, 50, 10, 'concrete');
      expect(m.voxels).toEqual([]);
      expect(m.nota).toMatch(/fuera del alcance/);
      expect(computeMeshStats(m).voxelCount).toBe(0);
    }
  });

  it('calcularMallaRegular sin componentes = kerma total', () => {
    const p = plano();
    const rect = limitesDelPlano(p, 0)!;
    const m = calcularMallaRegular(p.sources, 0.01, rect, 12, { barriers: p.barriers });
    compararConMotor(m, p);
  });
});
