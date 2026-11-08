/**
 * Fase 5 del motor de campo (docs/plan-motores-calculo.md):
 * - Visores en revisión reconectados a `doseFieldEngine` (Heat Map Avanzado → Isodosis → Isosuperficie 3D →
 *   3D Dose Mapping): cada uno se compara con `dosisEnPunto` en ≥ 10 puntos (diferencia < 1 %) y se monta en
 *   jsdom aunque su bandera esté apagada (las banderas sólo controlan menús y montaje en el diseñador).
 * - Banderas por visor, todas en `false`.
 * - Limitaciones de la Fase 4 corregidas: dominio del heat map del lienzo en metros, y uniones de muros en
 *   esquina (inglete) sin hueco t × t ni doble crédito.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MARGEN_DOMINIO_HEATMAP_M,
  MAX_CELDAS_LADO_HEATMAP,
  RADIO_MAX_DOMINIO_HEATMAP_M,
  UMBRAL_DOMINIO_HEATMAP_mSv_semana,
  calcularMallaDosis,
  centroCelda,
  cuerdaEnBarrera,
  dominioHeatmap,
  dosisEnPunto,
  kermaFiltrado,
  normalProtegida,
  radioDominioFuente,
  unionesDeBarreras,
  type ComponenteCampo,
  type MallaRegularDosis,
} from '@/lib/doseFieldEngine';
import {
  ALTURAS_3D_M,
  DECADAS_LOG,
  HORAS_OPERACION_SEMANA,
  NIVELES_ISODOSIS,
  fuentesAAltura,
  isodosisPlano,
  isosuperficie3D,
  malla3DPlano,
  mallaHeatMapAvanzado,
  meshDoseMapping3D,
  tasaMedia_uSv_h,
  valorEscala,
} from '@/lib/visoresDosis';
import { extractContours } from '@/lib/doseMapEngine';
import { getZoneForDoseRate } from '@/lib/doseMappingEngine';
import {
  BANDERAS_VISOR,
  HEATMAP_GPU,
  VISORES_EN_REVISION,
  VISOR_DOSE_MAPPING_3D,
  VISOR_HEATMAP_AVANZADO,
  VISOR_ISODOSIS,
  VISOR_ISOSUPERFICIE_3D,
  filtrarVisoresEnRevision,
  visorDisponible,
} from '@/lib/featureFlags';
import { DEFAULT_COMMANDS } from '@/sections/dialogs/CommandPalette';
import HeatMapViewer from '@/sections/dialogs/HeatMapViewer';
import IsodosisViewer from '@/sections/dialogs/IsodosisViewer';
import Isosurface3DDialog from '@/sections/dialogs/Isosurface3DDialog';
import DoseMapping3D from '@/sections/dialogs/DoseMapping3D';
import { useCanvasStore } from '@/stores/canvasStore';
import { useAppStore } from '@/stores/appStore';
import { MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';

const modalidad = (id: string) => MODALITIES.find((m) => m.id === id)!;

/** Plano de prueba (el de la Fase 3): LINAC 6 MV + radiografía, muro primario, secundario y plomo. */
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

function celdasMuestra(m: MallaRegularDosis): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < 16; i++) out.push([Math.floor(((i * 7 + 3) % 16) / 16 * m.nx), Math.floor(i / 16 * m.ny)]);
  out.push([m.nx - 1, m.ny - 1], [0, 0], [m.nx - 1, Math.floor(m.ny / 2)]);
  return out;
}

/** ≥ 10 celdas de la malla del visor frente a `dosisEnPunto`; devuelve cuántas quedaron atenuadas. */
function compararConMotor(m: MallaRegularDosis, p: FloorPlan, componentes?: readonly ComponenteCampo[]): number {
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
  return atenuadas;
}

afterEach(() => {
  useAppStore.getState().closeAll();
});

describe('Fase 5 — banderas por visor', () => {
  it('todas apagadas por omisión; VISORES_EN_REVISION y HEATMAP_GPU siguen en false', () => {
    expect(VISOR_HEATMAP_AVANZADO).toBe(false);
    expect(VISOR_ISODOSIS).toBe(false);
    expect(VISOR_ISOSUPERFICIE_3D).toBe(false);
    expect(VISOR_DOSE_MAPPING_3D).toBe(false);
    expect(VISORES_EN_REVISION).toBe(false);
    expect(HEATMAP_GPU).toBe(false);
    expect(Object.values(BANDERAS_VISOR).every((v) => v === false)).toBe(true);
    for (const id of ['heatMap', 'isodosis', 'isosurface3d', 'dose3D']) expect(visorDisponible(id)).toBe(false);
    const ids = DEFAULT_COMMANDS({}).map((c) => c.id);
    for (const id of ['heatmap', 'isodosis', 'dose3d']) expect(ids).not.toContain(id);
  });

  it('una bandera propia habilita sólo su visor', () => {
    const soloHeat = { ...BANDERAS_VISOR, heatmap: true };
    expect(visorDisponible('heatMap', false, soloHeat)).toBe(true);
    expect(visorDisponible('isodosis', false, soloHeat)).toBe(false);
    expect(visorDisponible('dose3D', false, soloHeat)).toBe(false);
    const items = [{ id: 'heatmap' }, { id: 'isodosis' }, { id: 'calc' }];
    expect(filtrarVisoresEnRevision(items, (i) => i.id, false, soloHeat).map((i) => i.id)).toEqual(['heatmap', 'calc']);
  });
});

describe('Fase 5 — Heat Map Avanzado ↔ motor', () => {
  it('la malla del visor = dosisEnPunto (≥ 10 puntos, < 1 %) y las barreras reales atenúan', () => {
    const p = plano();
    const m = mallaHeatMapAvanzado(p)!;
    expect(m.nx).toBe(120);
    expect(compararConMotor(m, p)).toBeGreaterThan(0);
    compararConMotor(mallaHeatMapAvanzado(p, ['fuga'], 40)!, p, ['fuga']);
    compararConMotor(mallaHeatMapAvanzado(p, ['primaria147', 'secundaria147'], 40)!, p, ['primaria147', 'secundaria147']);
    expect(mallaHeatMapAvanzado({ ...p, sources: [] })).toBeNull();
  });

  it('escalas de color: relativas al máximo, log con DECADAS_LOG décadas', () => {
    expect(valorEscala(5, 10, 'linear')).toBeCloseTo(0.5, 12);
    expect(valorEscala(2.5, 10, 'sqrt')).toBeCloseTo(0.5, 12);
    expect(valorEscala(10, 10, 'log')).toBe(1);
    expect(valorEscala(10 * 10 ** -DECADAS_LOG, 10, 'log')).toBeCloseTo(0, 12);
    expect(valorEscala(0, 10, 'log')).toBe(0);
  });

  it('el visor se monta con el plano del lienzo aunque su bandera esté apagada', () => {
    const p = plano();
    useCanvasStore.getState().setFloorPlan(p);
    const m = mallaHeatMapAvanzado(p)!;
    render(<HeatMapViewer open onOpenChange={() => {}} />);
    expect(screen.getByTestId('heatmap-avanzado').textContent).toContain(`${m.nx}×${m.ny} celdas de ${m.paso_m.toFixed(2)} m`);
  });
});

describe('Fase 5 — Curvas Isodosis ↔ motor', () => {
  it('malla = dosisEnPunto (≥ 10 puntos, < 1 %); niveles absolutos con P/T; la isodosis P/T separa celdas', () => {
    const p = plano();
    const iso = isodosisPlano(p, 0.02, 0.25)!;
    compararConMotor(iso.malla, p);
    expect(iso.niveles).toContain(0.08);
    for (const n of NIVELES_ISODOSIS) expect(iso.niveles).toContain(n);
    const lineas = extractContours(iso.malla.valores, iso.malla.nx, iso.malla.ny, iso.niveles);
    const pt = lineas.find((l) => l.level === 0.08)!;
    expect(pt.segments.length).toBeGreaterThan(0);
    // Cada segmento cae en una celda cuyas esquinas (valores del motor) quedan a ambos lados del nivel.
    for (const [x1, y1] of pt.segments.slice(0, 20)) {
      const gx = Math.min(Math.floor(x1), iso.malla.nx - 2), gy = Math.min(Math.floor(y1), iso.malla.ny - 2);
      const esquinas = [[gx, gy], [gx + 1, gy], [gx, gy + 1], [gx + 1, gy + 1]].map(([i, j]) => iso.malla.valores[j * iso.malla.nx + i]);
      expect(Math.min(...esquinas)).toBeLessThanOrEqual(0.08);
      expect(Math.max(...esquinas)).toBeGreaterThanOrEqual(0.08);
    }
    compararConMotor(isodosisPlano(p, 0.02, 1, ['dispersion'], 40)!.malla, p, ['dispersion']);
  });

  it('el visor se monta con el plano del lienzo y muestra los niveles del motor', () => {
    const p = plano();
    useCanvasStore.getState().setFloorPlan(p);
    render(<IsodosisViewer open onOpenChange={() => {}} />);
    expect(screen.getByTestId('isodosis-niveles').textContent).toContain(isodosisPlano(p)!.niveles.join(', '));
  });
});

describe('Fase 5 — Isosuperficie 3D ↔ motor', () => {
  it('cada punto 3D = dosisEnPunto con la fuente a |h − z| (≥ 10 puntos, < 1 %)', () => {
    const p = plano();
    const pts = malla3DPlano(p, { columnas: 20 });
    expect(new Set(pts.map((q) => q.z_m)).size).toBe(ALTURAS_3D_M.length);
    const muestra = pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / 24)) === 0);
    expect(muestra.length).toBeGreaterThanOrEqual(10);
    for (const q of muestra) {
      const ref = dosisEnPunto(fuentesAAltura(p, q.z_m), q.x_px, q.y_px, p.scale_m_per_pixel, { barriers: p.barriers }).kerma_mSv_semana;
      expect(Math.abs(q.kerma_mSv_semana - ref) / Math.max(ref, 1e-30)).toBeLessThan(0.01);
    }
    // A z = 0 es exactamente el plano 2D del motor (la fuente queda a isocenterHeight_m).
    const [q0] = malla3DPlano(p, { columnas: 20, alturas_m: [0] });
    const ref0 = dosisEnPunto(p.sources, q0.x_px, q0.y_px, p.scale_m_per_pixel, { barriers: p.barriers }).kerma_mSv_semana;
    expect(Math.abs(q0.kerma_mSv_semana - ref0) / ref0).toBeLessThan(1e-6);
    // La isosuperficie es el subconjunto ≥ nivel.
    const iso = isosuperficie3D(p, 0.1, { columnas: 20 });
    expect(iso.length).toBeGreaterThan(0);
    expect(iso.length).toBeLessThan(pts.length);
    expect(iso.every((q) => q.kerma_mSv_semana >= 0.1)).toBe(true);
  });

  it('el visor se monta (diálogo de appStore) con el plano del lienzo', () => {
    const p = plano();
    useCanvasStore.getState().setFloorPlan(p);
    useAppStore.getState().open('isosurface3d');
    render(<Isosurface3DDialog />);
    const n = malla3DPlano(p).length;
    const k = isosuperficie3D(p, 0.02).length;
    expect(screen.getByTestId('isosuperficie-conteo').textContent).toContain(`${k} de ${n} puntos`);
  });
});

describe('Fase 5 — 3D Dose Mapping ↔ motor (plano del lienzo)', () => {
  it('vóxeles = dosisEnPunto / 40 h (≥ 10 puntos, < 1 %), zona por tasa media', () => {
    const p = plano();
    const mesh = meshDoseMapping3D(p, { columnas: 16 });
    expect(mesh.nota).toBeUndefined();
    expect(mesh.voxels.length).toBeGreaterThan(100);
    const muestra = mesh.voxels.filter((_, i) => i % Math.floor(mesh.voxels.length / 20) === 0);
    expect(muestra.length).toBeGreaterThanOrEqual(10);
    const s = p.scale_m_per_pixel;
    const x0 = Math.min(...p.sources.map((f) => f.x), ...p.barriers.flatMap((b) => [b.x1, b.x2])) - 1 / s;
    const y0 = Math.min(...p.sources.map((f) => f.y), ...p.barriers.flatMap((b) => [b.y1, b.y2])) - 1 / s;
    for (const v of muestra) {
      // Escena: x = x del plano, y = altura, z = y del plano (m desde el origen de la malla).
      const k = dosisEnPunto(fuentesAAltura(p, v.y), x0 + v.x / s, y0 + v.z / s, s, { barriers: p.barriers }).kerma_mSv_semana;
      const tasa = (k * 1000) / HORAS_OPERACION_SEMANA;
      expect(Math.abs(v.doseRate_uSv_h - tasa) / Math.max(tasa, 1e-30)).toBeLessThan(0.01);
      expect(v.zone).toBe(getZoneForDoseRate(v.doseRate_uSv_h).id);
      expect(v.cumulativeDose_uSv).toBeCloseTo(v.doseRate_uSv_h * HORAS_OPERACION_SEMANA, 3);
    }
    expect(tasaMedia_uSv_h(0.02)).toBeCloseTo(0.5, 12);
    expect(meshDoseMapping3D({ ...p, sources: [] }).voxels).toHaveLength(0);
  });

  it('el visor se monta con el plano del lienzo como origen por omisión', () => {
    const p = plano();
    useCanvasStore.getState().setFloorPlan(p);
    render(<DoseMapping3D open onOpenChange={() => {}} />);
    expect(screen.getByTestId('dose3d-plano-info').textContent).toContain('2 fuente(s), 3 barrera(s)');
  });
});

describe('Fase 5 — dominio del heat map del lienzo en metros (limitación 1 de la Fase 4)', () => {
  it('el mismo plano a 0.01 m/px y a 0.001 m/px (mm) da el mismo dominio en metros y el mismo kerma', () => {
    const a = plano(0.01), b = plano(0.001);
    const ma = calcularMallaDosis(a.sources, a.scale_m_per_pixel, 40, { barriers: a.barriers });
    const mb = calcularMallaDosis(b.sources, b.scale_m_per_pixel, 40, { barriers: b.barriers });
    const ra = dominioHeatmap(a.sources, 0.01, { barriers: a.barriers })!;
    const rb = dominioHeatmap(b.sources, 0.001, { barriers: b.barriers })!;
    expect(ra.ancho * 0.01).toBeCloseTo(rb.ancho * 0.001, 6);
    expect(ra.x0 * 0.01).toBeCloseTo(rb.x0 * 0.001, 6);
    // En mm el paso mínimo de 40 px (4 cm) cede ante MAX_CELDAS_LADO_HEATMAP: número de puntos acotado.
    expect(mb.length).toBeLessThanOrEqual(MAX_CELDAS_LADO_HEATMAP ** 2);
    expect(mb.length).toBeGreaterThan(400);
    // Cubre los muros (x = 7 m + 1.5 m de espesor) en ambas escalas.
    expect(Math.max(...mb.map((q) => q.x * 0.001))).toBeGreaterThan(8.5);
    expect(Math.max(...ma.map((q) => q.x * 0.01))).toBeGreaterThan(8.5);
    // El valor es el del motor en ambas escalas (punto físico común: 9 m, 4 m).
    for (const [m, s] of [[ma, 0.01], [mb, 0.001]] as const) {
      const q = m.reduce((best, r) => (Math.hypot(r.x * s - 9, r.y * s - 4) < Math.hypot(best.x * s - 9, best.y * s - 4) ? r : best));
      const pl = s === 0.01 ? a : b;
      const ref = dosisEnPunto(pl.sources, q.x, q.y, s, { barriers: pl.barriers }).kerma_mSv_semana;
      expect(Math.abs(q.kerma - ref) / ref).toBeLessThan(1e-6);
      expect(q.kerma).toBeLessThan(q.kermaSinBlindaje);
      expect(q.paso_px! * s).toBeGreaterThan(0);
    }
  });

  it('sin barreras, el dominio llega al radio donde el kerma sin blindaje cae bajo el umbral (acotado a 10 m)', () => {
    const pet: RadiationSource = {
      id: 'pet', name: 'PET', x: 0, y: 0, modality: modalidad('pet-f18'), workloadValue: 50, workloadUnit: 'MBq',
      nuclearActivity_GBq: 0.05, workloadHoursPerWeek: 1, isocenterHeight_m: 0, useFactor: 1,
    };
    const r = radioDominioFuente(pet, 0.01);
    expect(r).toBeGreaterThan(MARGEN_DOMINIO_HEATMAP_M);
    expect(r).toBeLessThan(RADIO_MAX_DOMINIO_HEATMAP_M);
    const kR = dosisEnPunto([pet], r / 0.01, 0, 0.01).kermaSinBlindaje_mSv_semana;
    expect(kR / UMBRAL_DOMINIO_HEATMAP_mSv_semana).toBeCloseTo(1, 6);
    const rect = dominioHeatmap([pet], 0.01)!;
    expect(rect.ancho * 0.01).toBeCloseTo(2 * r, 6);
    // Un LINAC no baja del umbral en 10 m sin blindaje: se acota.
    expect(radioDominioFuente(plano().sources[0], 0.01)).toBe(RADIO_MAX_DOMINIO_HEATMAP_M);
  });
});

describe('Fase 5 — uniones de muros en esquina (limitación 2 de la Fase 4)', () => {
  // Sala de 4 × 4 m (1 px = 1 cm), fuente en el centro, muros de concreto de 30 cm hacia afuera.
  const S = 0.01, T = 300;
  const fuenteRx: RadiationSource = {
    id: 'rx', name: 'Rx', x: 200, y: 200, modality: modalidad('rad-chest'), workloadValue: 500,
    workloadUnit: 'pacientes', isocenterHeight_m: 0, useFactor: 1,
  };
  const muro = (id: string, x1: number, y1: number, x2: number, y2: number, t = T): Barrier => ({
    id, name: id, x1, y1, x2, y2, barrierType: 'secondary', useFactor: 1, occupancyFactor: 1,
    designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', thickness_mm: t,
  });
  const sala = (hueco = 0): Barrier[] => [
    muro('sup', 0, 0, 400, 0), muro('der', 400 + hueco, 0, 400 + hueco, 400),
    muro('inf', 400, 400, 0, 400), muro('izq', 0, 400, 0, 0),
  ];
  const transmision = (barriers: Barrier[], x: number, y: number) => {
    const d = dosisEnPunto([fuenteRx], x, y, S, { barriers });
    return d.kerma_mSv_semana / d.kermaSinBlindaje_mSv_semana;
  };

  it('detecta las cuatro esquinas de la sala; con un hueco > 1 cm no hay unión', () => {
    const u = unionesDeBarreras(sala(), S, fuenteRx);
    expect(u.every((x) => x.inicio && x.fin)).toBe(true);
    const h = unionesDeBarreras(sala(3), S, fuenteRx);
    expect(h[1].inicio).toBeUndefined();
    expect(h[0].fin).toBeUndefined();
  });

  it('esquina exterior: el cuadrado t × t queda cubierto y la diagonal se atenúa como un muro continuo', () => {
    // Puntos más allá de la esquina (400, 0), cerca de la diagonal desde la fuente (ángulo de 45°).
    const conUnion = sala(), continuo = (lado: 'sup' | 'der') => (lado === 'der'
      ? [muro('der', 400, -1000, 400, 1000)]
      : [muro('sup', -1000, 0, 1000, 0)]);
    for (const da of [-0.06, -0.03, -0.01, 0.01, 0.03, 0.06]) {
      const ang = -Math.PI / 4 + da; // hacia arriba a la derecha (y del lienzo hacia abajo)
      const x = 200 + 400 * Math.cos(ang), y = 200 + 400 * Math.sin(ang);
      // Sin unión (comportamiento de la Fase 4) el rayo diagonal pasaba por el hueco: casi sin atenuación.
      const B = transmision(conUnion, x, y);
      // Con unión: igual que un muro continuo del lado por el que entra el rayo (ángulo < 45° → muro derecho).
      const ref = transmision(continuo(da > 0 ? 'der' : 'sup'), x, y);
      expect(Math.abs(B - ref) / ref).toBeLessThan(1e-9);
      expect(B).toBeLessThan(1e-2);
    }
    // El hueco geométrico de la Fase 4: con las esquinas separadas 3 cm (sin unión) y el rayo exacto por la esquina.
    expect(transmision(sala(3), 200 + 400, 200 - 400)).toBeGreaterThan(0.5);
    expect(transmision(conUnion, 200 + 400 + 2, 200 - 400)).toBeLessThan(1e-2);
  });

  it('esquina entrante: sin doble crédito en el solape de las bandas', () => {
    // Dos muros en L con la fuente fuera del ángulo: las bandas se solapan en [0, t]² del cuadrante.
    const f: RadiationSource = { ...fuenteRx, x: -300, y: -300 };
    const L = [muro('a', 0, 0, 1000, 0), muro('b', 0, 0, 0, 1000)];
    const u = unionesDeBarreras(L, S, f);
    expect(u[0].inicio && u[1].inicio).toBeTruthy();
    // Rayo que entra por el muro a cerca de la esquina y cruza el solape.
    const x = 400, y = 380;
    const d = dosisEnPunto([f], x, y, S, { barriers: L });
    const B = d.kerma_mSv_semana / d.kermaSinBlindaje_mSv_semana;
    const dSolo = dosisEnPunto([f], x, y, S, { barriers: [muro('a', -1000, 0, 1000, 0)] });
    const ref = dSolo.kerma_mSv_semana / dSolo.kermaSinBlindaje_mSv_semana;
    expect(Math.abs(B - ref) / ref).toBeLessThan(1e-9);
  });

  it('cuerdaEnBarrera: sin uniones, corte recto (Fase 2); con unión, la cuerda llega a la cara exterior', () => {
    const der = muro('der', 400, 0, 400, 400);
    const n = normalProtegida(der, fuenteRx);
    // Rayo cerca de la diagonal: entra al muro derecho a y ≈ 4.9 px y sale de su banda recta por el extremo (y = 0).
    const recta = cuerdaEnBarrera(200, 200, 610, -200, der, 30, n)!;
    expect(recta.profundidad).toBeLessThan(10);
    const u = unionesDeBarreras(sala(), S, fuenteRx)[1];
    const inglete = cuerdaEnBarrera(200, 200, 610, -200, der, 30, n, u)!;
    expect(inglete.profundidad).toBeCloseTo(30, 9);
  });
});
