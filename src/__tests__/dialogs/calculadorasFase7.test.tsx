/**
 * Fase 7 — las calculadoras de prioridad alta de `docs/revision-dialogos.md` muestran lo que calcula el motor
 * normativo, con los valores iniciales de un ejemplo publicado (NCRP 151 §7.1, NCRP 147 §5.3.3.1, TG-108 Ej. 1).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import { useCanvasStore } from '@/stores/canvasStore';
import BarrierCalculatorDialog from '@/sections/dialogs/BarrierCalculatorDialog';
import ScenarioAnalysisDialog from '@/sections/dialogs/ScenarioAnalysisDialog';
import SensitivityAnalysisDialog from '@/sections/dialogs/SensitivityAnalysisDialog';
import ParetoOptimizerDialog from '@/sections/dialogs/ParetoOptimizerDialog';
import MultiLayerShieldDialog from '@/sections/dialogs/MultiLayerShieldDialog';
import OnnxPredictorDialog from '@/sections/dialogs/OnnxPredictorDialog';
import MultiObjectiveOptimizerDialog from '@/sections/dialogs/MultiObjectiveOptimizerDialog';
import Geant4McDialog from '@/sections/dialogs/Geant4McDialog';
import BatchCalculationDialog from '@/sections/dialogs/BatchCalculationDialog';
import DxfExportDialog from '@/sections/dialogs/DxfExportDialog';
import { barreraMV, transmisionHaz, transmisionPET } from '@/lib/calculadorasNormativas';
import { importDXFToFloorPlan } from '@/lib/medical3D/cadBimBridge';
import { exportarDXF } from '@/lib/dxfExport';
import { useShieldingEngine } from '@/hooks/useShieldingEngine';
import { MODALITIES, type FloorPlan } from '@/types/radshield';

const num = (s: string) => Number(s.replace(/[^\d.eE+-]/g, ''));
const DXF = readFileSync(path.resolve(__dirname, '../../../e2e/fixtures/sample-floorplan.dxf'), 'utf8');
const planoDXF = (): FloorPlan => {
  const { floorPlan } = importDXFToFloorPlan(DXF, 'sample-floorplan.dxf');
  return {
    ...floorPlan,
    sources: [{
      id: 'rad-1', name: 'Sala radiográfica', modality: MODALITIES.find((m) => m.id === 'rad-abdomen')!,
      x: floorPlan.width_pixels / 2, y: floorPlan.height_pixels / 2, workloadValue: 125, workloadUnit: 'pacientes/semana',
      isocenterHeight_m: 1.2, useFactor: 1,
    }],
  };
};

beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
});
afterEach(() => { cleanup(); useAppStore.getState().closeAll(); });

describe('BarrierCalculatorDialog (NCRP 151)', () => {
  it('valores iniciales = §7.1.1: 149.6 cm de concreto, redondeo 150 cm, CUMPLE', () => {
    render(<BarrierCalculatorDialog open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByTestId('bc-calcular'));
    expect(num(screen.getByTestId('bc-espesor').textContent!)).toBeCloseTo(149.6, 0);
    expect(screen.getByTestId('bc-dictamen').textContent).toMatch(/^CUMPLE/);
  });

  it('secundaria de doble energía (§7.1.5): regla de dos fuentes 66.4 cm, mismo resultado que el motor', () => {
    render(<BarrierCalculatorDialog open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByLabelText('Tipo de barrera'), { target: { value: 'secundaria' } });
    fireEvent.click(screen.getByLabelText('Equipo de doble energía'));
    fireEvent.click(screen.getByTestId('bc-calcular'));
    const r = barreraMV({
      tipo: 'secundaria', material: 'concrete', P_mSv_semana: 0.02, T: 0.025, U: 0.25, d_m: 7.2, theta_deg: 30,
      haces: [{ energia: 18, W_Gy_semana: 450, fraccionIMRT: 0, factorIMRT: 5 }, { energia: 6, W_Gy_semana: 225, fraccionIMRT: 0, factorIMRT: 5 }],
    });
    expect(Math.abs(r.espesorDosFuentes_cm - 66.4) / 66.4).toBeLessThan(0.015);
    expect(num(screen.getByTestId('bc-espesor').textContent!)).toBeCloseTo(r.espesor_cm, 1);
    expect(screen.getAllByRole('row')).toHaveLength(5); // encabezado + 2 dispersiones + 2 fugas
  });
});

describe('ScenarioAnalysisDialog', () => {
  it('el escenario base es la primaria NCRP 151 del motor con P = 0.02 (no controlada)', () => {
    render(<ScenarioAnalysisDialog open onOpenChange={() => {}} />);
    const r = barreraMV({ tipo: 'primaria', haces: [{ energia: 15, W_Gy_semana: 500 }], material: 'concrete', P_mSv_semana: 0.02, T: 0.05, U: 0.25, d_m: 4.5 });
    expect(num(screen.getByTestId('sa-base').textContent!)).toBeCloseTo(r.espesor_cm, 1);
  });
});

describe('Diálogos de haz (NCRP 147/151)', () => {
  it('SensitivityAnalysis: valores iniciales = NCRP 147 §5.3.3.1, 1.3 mm de plomo', () => {
    render(<SensitivityAnalysisDialog />);
    act(() => useAppStore.getState().open('sensitivityAnalysis'));
    expect(Math.abs(num(screen.getByTestId('sens-base').textContent!) - 1.3)).toBeLessThanOrEqual(0.065);
  });

  it('ParetoOptimizer: concreto 1496 mm (NCRP 151 §7.1.1) y sólo materiales con datos normativos', () => {
    render(<ParetoOptimizerDialog />);
    act(() => useAppStore.getState().open('paretoOptimizer'));
    const filas = within(screen.getByTestId('par-tabla')).getAllByRole('row').slice(1);
    expect(filas).toHaveLength(3);
    const concreto = filas.find((f) => f.textContent!.includes('Concreto'))!;
    expect(Math.abs(num(concreto.children[2].textContent!) - 1496) / 1496).toBeLessThan(0.005);
  });

  it('MultiLayerShield: B_total = producto de las transmisiones de cada capa (50 mm Pb + 1200 mm concreto, 18 MV)', () => {
    render(<MultiLayerShieldDialog />);
    act(() => useAppStore.getState().open('multiLayerShield'));
    const c = { regimen: 'megavoltaje' as const, energia: 18 as const, W_Gy_semana: 450, U: 0.25, d_m: 7.2 };
    const B = transmisionHaz(c, 'lead', 50) * transmisionHaz(c, 'concrete', 1200);
    expect(num(screen.getByTestId('ml-btotal').textContent!) / B).toBeCloseTo(1, 3);
  });
});

describe('Diálogos PET (AAPM TG-108)', () => {
  it('OnnxPredictor: Ejemplo 1, B = 0.189, ≈ 12 mm de plomo y ≈ 150 mm de concreto', () => {
    render(<OnnxPredictorDialog />);
    act(() => useAppStore.getState().open('onnxPredictor'));
    expect(num(screen.getByTestId('onnx-B').textContent!)).toBeCloseTo(0.189, 2);
    expect(Math.abs(num(screen.getByTestId('onnx-lead').textContent!) - 12)).toBeLessThanOrEqual(1);
    expect(Math.abs(num(screen.getByTestId('onnx-concrete').textContent!) - 150)).toBeLessThanOrEqual(10);
  });

  it('MultiObjectiveOptimizer: compara plomo, concreto y hierro', () => {
    render(<MultiObjectiveOptimizerDialog />);
    act(() => useAppStore.getState().open('multiObjectiveOptimizer'));
    expect(within(screen.getByTestId('moo-tabla')).getAllByRole('row')).toHaveLength(4);
  });

  it('Geant4 (referencia analítica): B(12 mm Pb) de la Tabla V', () => {
    render(<Geant4McDialog />);
    act(() => useAppStore.getState().open('geant4Mc'));
    expect(num(screen.getByTestId('g4-B').textContent!)).toBeCloseTo(transmisionPET('lead', 12), 4);
  });
});

describe('Diálogos del proyecto', () => {
  it('BatchCalculation: calcula las barreras del plano (DXF de la Fase 4) con el motor del diseñador', () => {
    const plano = planoDXF();
    act(() => useCanvasStore.getState().setFloorPlan(plano));
    render(<BatchCalculationDialog open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByTestId('batch-calcular'));
    const { result } = renderHook(() => useShieldingEngine());
    const ref = result.current.calculateAllBarriers(plano.barriers, plano.sources, plano.scale_m_per_pixel);
    for (const b of ref) {
      const req = (b.requiredThickness_mm as Record<string, number>);
      const v = req[b.materialCode] ?? req[{ concreto: 'CONCRETE235', plomo: 'PB' }[b.materialCode as 'concreto' | 'plomo']];
      expect(num(screen.getByTestId(`batch-req-${b.id}`).textContent!)).toBeCloseTo(v, 1);
    }
  });

  it('BatchCalculation sin barreras avisa en lugar de inventar valores', () => {
    act(() => useCanvasStore.getState().setFloorPlan({ ...planoDXF(), barriers: [] }));
    render(<BatchCalculationDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('batch-vacio')).toBeTruthy();
  });

  it('DxfExport: lista las capas del proyecto abierto (no un plano de ejemplo) y no ofrece DWG', () => {
    act(() => useCanvasStore.getState().setFloorPlan(planoDXF()));
    render(<DxfExportDialog />);
    act(() => useAppStore.getState().open('dxfExport'));
    expect(screen.getByTestId('dxf-capas').textContent).toContain('WALL_PRIMARY_CONCRETE_300MM');
    expect(screen.queryByText(/DWG \(/)).toBeNull();
  });

  it('exportarDXF → importDXFToFloorPlan devuelve la misma geometría, tipos, materiales y espesores', () => {
    const original = planoDXF();
    const { floorPlan: re } = importDXFToFloorPlan(exportarDXF(original), 'reexportado.dxf');
    expect(re.scale_m_per_pixel).toBeCloseTo(original.scale_m_per_pixel, 9);
    expect(re.barriers).toHaveLength(original.barriers.length);
    for (const b of original.barriers) {
      const r = re.barriers.find((x) => Math.abs(x.x1 - b.x1) < 1e-6 && Math.abs(x.y1 - b.y1) < 1e-6 && Math.abs(x.x2 - b.x2) < 1e-6 && Math.abs(x.y2 - b.y2) < 1e-6)!;
      expect(r).toBeTruthy();
      expect(r).toMatchObject({ barrierType: b.barrierType, materialCode: b.materialCode, thickness_mm: b.thickness_mm });
    }
  });
});
