/**
 * Fase 8a/8b — correcciones de unidades, fórmulas y datos falsos, contra ejemplos publicados:
 * NCRP 151 §7.1.1 (149.6 cm), §7.1.5 (46.1 / 37.3 cm), Tabla B.2 (15 MV) y Tabla B.9 (H₀); NCRP 147 §5.3.3.1
 * (1.3 mm Pb); AAPM TG-108 Ejemplo 2 (59.7 μSv/semana, ≈ 8 mm Pb) y Tablas IV/V.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { barreraMV, transmisionPET } from '@/lib/calculadorasNormativas';
import { blindajeEquipo } from '@/lib/blindajeEquipo';
import { AGENT_TOOLS } from '@/lib/agents/tools';
import { espesorReferenciaNCRP151, generateTrainingDataset } from '@/lib/ml/trainingData';
import { calculateFloorCeiling } from '@/hooks/useFloorCeilingCalc';
import { calculateNeutronShielding } from '@/hooks/useNeutronCalc';
import { puerta } from '@/lib/ncrp151Laberinto';
import { calculateDoseAtPoint } from '@/lib/mallaNuclear';
import { generarReporteCNSNSHtml } from '@/lib/reporteCNSNSHtml';
import { importDXFToFloorPlan } from '@/lib/medical3D/cadBimBridge';
import { useShieldingEngine } from '@/hooks/useShieldingEngine';
import { useCanvasStore } from '@/stores/canvasStore';
import { MODALITIES, type FloorPlan } from '@/types/radshield';
import VersaHD15MVDialog from '@/sections/dialogs/VersaHD15MVDialog';
import ElectronApplicatorDialog from '@/sections/dialogs/ElectronApplicatorDialog';
import AAPMTG108PETDialog from '@/sections/dialogs/AAPMTG108PETDialog';
import CrossValidationDialog from '@/sections/dialogs/CrossValidationDialog';
import TornadoSensitivityDialog from '@/sections/dialogs/TornadoSensitivityDialog';
import CNSNSAutoReportDialog from '@/sections/dialogs/CNSNSAutoReportDialog';
import ComplianceCertificationDialog from '@/sections/dialogs/ComplianceCertificationDialog';
import RegulatoryAlertsDialog from '@/sections/dialogs/RegulatoryAlertsDialog';

const num = (s: string) => parseFloat((s.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/) ?? ['NaN'])[0]);
const dentro = (calc: number, pub: number, tol: number) => expect(Math.abs(calc - pub) / pub).toBeLessThanOrEqual(tol);

beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(() => cleanup());

describe('8a — error de unidades ×1000 (P en mSv frente a W en Gy)', () => {
  it('VersaHD 15 MV: con sus valores iniciales da ≈ 205 cm de concreto (NCRP 151 Tabla B.2), no 84 cm', () => {
    render(<VersaHD15MVDialog open onClose={() => {}} />);
    const tab = screen.getByRole('tab', { name: /calcul/i });
    fireEvent.mouseDown(tab); fireEvent.click(tab);
    fireEvent.click(screen.getByRole('button', { name: /^Calcular$/ }));
    const t = num(screen.getByTestId('vhd-primaria').textContent!);
    const ref = barreraMV({ tipo: 'primaria', haces: [{ energia: 15, W_Gy_semana: 400 }], material: 'concrete', P_mSv_semana: 0.02, T: 0.5, U: 0.25, d_m: 5.5 });
    dentro(ref.espesor_cm, 204.6, 0.002); // 44 + (log10(1/B) − 1)·41 con B = 1.21×10⁻⁵
    expect(t).toBe(ref.espesorRedondeado_cm);
    expect(t).toBeGreaterThan(200);
  });

  it('ElectronApplicator: la contaminación de fotones se dimensiona con NCRP 151 en Sv (antes 1000× en B)', () => {
    render(<ElectronApplicatorDialog open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Calcular Blindaje/ }));
    const t = num(screen.getByTestId('ea-espesor').textContent!);
    // 12 MeV → fotones de 15 MV, f_x = 0.018; W_x = 600 cGy/min · 2.5 min · 25 pac · 0.018 / 100 Gy; d = 2 m, U = 1, T = 0.2
    const Wx = (600 * 2.5 * 25 * 0.018) / 100;
    const ref = barreraMV({ tipo: 'primaria', haces: [{ energia: 15, W_Gy_semana: Wx }], material: 'lead', P_mSv_semana: 0.02, T: 0.2, U: 1, d_m: 2 });
    expect(t).toBeCloseTo(ref.espesor_cm * 10, 0);
    // El error anterior equivalía a P 1000× mayor: ≈ 3 TVLₑ de plomo (3 × 57 mm) menos.
    const conError = barreraMV({ tipo: 'primaria', haces: [{ energia: 15, W_Gy_semana: Wx }], material: 'lead', P_mSv_semana: 20, T: 0.2, U: 1, d_m: 2 });
    expect(t - conError.espesor_cm * 10).toBeGreaterThan(150);
  });

  it('EquipmentShieldingWizard (lib/blindajeEquipo): primaria 18 MV = §7.1.1 (149.6 → 150 cm) y secundaria con fuga y dispersión', () => {
    const filas = blindajeEquipo({ categoria: 'LINAC', energia_MeV: 18, C1: 1, W_Gy_semana: 450, U: 0.25, T: 0.025, P_mSv_semana: 0.02, d_m: 7.2, materialId: 'concrete-normal-235' });
    expect(filas[0].thickness_cm).toBe(150);
    expect(filas[0].meetsLimit).toBe(true);
    dentro(filas.find((f) => f.type === 'scatter')!.thickness_cm, 46.1, 0.015);
    dentro(filas.find((f) => f.type === 'leakage')!.thickness_cm, 37.3, 0.015);
    expect(blindajeEquipo({ categoria: 'PET-CT', energia_MeV: 0.511, C1: 1, W_Gy_semana: 1, U: 1, T: 1, P_mSv_semana: 0.02, d_m: 3, materialId: 'x' })).toEqual([]);
  });

  it('agente de diseño: herramientas primaria (149.6 cm) y secundaria (fuga 37.3, dispersión 46.1 cm) de NCRP 151 §7.1', async () => {
    const tool = (n: string) => AGENT_TOOLS.find((t) => t.name === n)!;
    const pri = await tool('calculatePrimaryBarrier').execute({ energy: 18, distance: 7.2, workload: 450, occupancy: 0.025, goalDose: 0.02, useFactor: 0.25, material: 'concrete' }) as { thicknessCm: number };
    dentro(pri.thicknessCm, 149.6, 0.005);
    const fuga = await tool('calculateSecondaryBarrier').execute({ energy: 18, distance: 7.2, workload: 450, occupancy: 0.025, goalDose: 0.02, material: 'concrete', isLeakage: true }) as { thicknessCm: number };
    dentro(fuga.thicknessCm, 37.3, 0.015);
    const disp = await tool('calculateSecondaryBarrier').execute({ energy: 18, distance: 7.2, workload: 450, occupancy: 0.025, goalDose: 0.02, material: 'concrete', isLeakage: false }) as { thicknessCm: number };
    dentro(disp.thicknessCm, 46.1, 0.015);
  });

  it('datos de entrenamiento del ML: espesor objetivo NCRP 151 (149.6 cm) y P = 0.1 / 0.02 (no 0.4)', () => {
    dentro(espesorReferenciaNCRP151(18, 7.2, 450, 0.025, 0.02, 0.25, 'concrete'), 149.6, 0.005);
    const datos = generateTrainingDataset(200);
    expect(datos.every((d) => d.goalDose === 0.1 || d.goalDose === 0.02)).toBe(true);
    const d = datos[0];
    expect(d.thickness).toBeCloseTo(espesorReferenciaNCRP151(d.energy, d.distance, d.workload, d.occupancy, d.goalDose, d.useFactor, ['concrete', 'barite', 'steel', 'lead'][d.material]), 0);
  });

  it('FloorCeiling: el techo es barrera primaria; a 7.2 m del blanco (d_iso = 6.2 m) exige ≥ 1496 mm (§7.1.1)', () => {
    const r = calculateFloorCeiling({
      energy_MeV: 18, workload_Gy_week: 450, useFactor: 0.25, isocenterHeight_m: 1.3, roomHeight_m: 3.5, floorThickness_m: 0.5, ceilingThickness_m: 1.2,
      areaAboveOccupied: true, areaBelowOccupied: false, distanceToAbove_m: 6.2, distanceToBelow_m: 4, designGoalAbove_mSv_week: 0.02, designGoalBelow_mSv_week: 0.02,
      occupancyAbove: 0.025, occupancyBelow: 1,
    });
    dentro(r.ceilingRequiredThickness_mm, 1496, 0.005);
    expect(r.ceilingKerma_unshielded_mSv_week).toBeCloseTo((450 * 0.25 / 7.2 ** 2) * 1000, 6);
    expect(r.ceilingCompliant).toBe(false);
  });
});

describe('8a — TVL contra HVL, TG-108 y fórmulas', () => {
  it('neutrones: H₀ de la Tabla B.9 (18 MV: 1.6 mSv/Gy a 1.41 m) y polietileno borado con TVL de 45 mm a P/2 (§7.1.13)', () => {
    const r = calculateNeutronShielding({ energy_MeV: 18, workload_Gy_week: 450, distance_m: 1.41, target_mSv_week: 0.1 });
    expect(r.H0_mSv_Gy).toBe(1.6);
    expect(r.neutronDose_mSv_week).toBeCloseTo(450 * 1.6, 6);
    expect(r.bpeThickness_mm).toBeCloseTo(puerta(1e-4, { neutrones: 0.72, captura: 0, fotones: 0 }).bpe_mm, 6);
    expect(r.bpeThickness_mm).toBeCloseTo(Math.log10(0.72 / 5e-5) * 45, 6);
  });

  it('AAPMTG108PET: Ejemplo 2 (40 pacientes, 555 MBq, t_U = 1 h, t_I = 30 min, 3 m) = 59.7 μSv/semana y ≈ 8 mm de plomo', () => {
    render(<AAPMTG108PETDialog onClose={() => {}} />);
    const filas = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    filas.forEach((f, i) => {
      const [pac, act, t] = within(f).getAllByRole('spinbutton') as HTMLInputElement[];
      fireEvent.change(pac, { target: { value: i === 0 ? '40' : '0' } });
      if (i === 0) { fireEvent.change(act, { target: { value: '555' } }); fireEvent.change(t, { target: { value: '30' } }); }
    });
    const D = num(within(filas[0]).getAllByRole('cell')[4].textContent!);
    dentro(D, 59.7, 0.02);
    expect(Math.abs(num(screen.getByTestId('tg-pb').textContent!) - 8)).toBeLessThanOrEqual(1);
  });

  it('NuclearDoseGrid (lib/mallaNuclear): 1 GBq de F-18 a 1 m = 143 μSv/h; 10 mm de Pb transmite 0.2485 (Tabla IV, ±5 %)', () => {
    const libre = calculateDoseAtPoint(1, 0, [{ x: 0, y: 0, activity_GBq: 1, nuclide: 'F-18', useTime_h: 1 }], []);
    expect(libre.doseRate).toBeCloseTo(143, 6);
    const conPb = calculateDoseAtPoint(1, 0, [{ x: 0, y: 0, activity_GBq: 1, nuclide: 'F-18', useTime_h: 1 }], [{ name: 'Pb', material: 'Pb', thickness_mm: 10, position_x: 0.5 }]);
    dentro(conPb.doseRate / 143, 0.2485, 0.05);
    const tc = calculateDoseAtPoint(1, 0, [{ x: 0, y: 0, activity_GBq: 1, nuclide: 'Tc-99m', useTime_h: 1 }], [{ name: 'Pb', material: 'Pb', thickness_mm: 10, position_x: 0.5 }]);
    expect(tc.sinDatosBandaAncha).toBe(true);
    expect(transmisionPET('lead', 10)).toBeCloseTo(conPb.doseRate / 143, 9);
  });

  it('CrossValidation: Ec. 2.3 reproduce §7.1.1 (1496 mm)', () => {
    render(<CrossValidationDialog open onClose={() => {}} />);
    dentro(num(screen.getByTestId('cv-ec23').textContent!), 1496, 0.005);
  });

  it('TornadoSensitivity: inversa de Archer correcta, §5.3.3.1 = 1.3 mm de plomo (antes NaN)', () => {
    render(<TornadoSensitivityDialog onClose={() => {}} />);
    expect(Math.abs(num(screen.getByTestId('tor-base').textContent!) - 1.3)).toBeLessThanOrEqual(0.065);
  });
});

describe('8b — datos falsos fuera', () => {
  const DXF = readFileSync(path.resolve(__dirname, '../../../e2e/fixtures/sample-floorplan.dxf'), 'utf8');
  const plano = (): FloorPlan => {
    const { floorPlan } = importDXFToFloorPlan(DXF, 'sample.dxf');
    return { ...floorPlan, sources: [{ id: 'rad-1', name: 'Sala radiográfica', modality: MODALITIES.find((m) => m.id === 'rad-abdomen')!,
      x: floorPlan.width_pixels / 2, y: floorPlan.height_pixels / 2, workloadValue: 125, workloadUnit: 'pacientes/semana', isocenterHeight_m: 1.2, useFactor: 1 }] };
  };

  it('reporte CNSNS: sale del proyecto (barreras y requeridos del motor); sin cálculo no hay reporte', () => {
    const p = plano();
    expect(generarReporteCNSNSHtml(p, new Set(['barriers']))).toBeNull();
    const { result } = renderHook(() => useShieldingEngine());
    const calculado = { ...p, barriers: result.current.calculateAllBarriers(p.barriers, p.sources, p.scale_m_per_pixel) };
    const html = generarReporteCNSNSHtml(calculado, new Set(['cover', 'barriers', 'conclusions']))!;
    for (const b of calculado.barriers) expect(html).toContain(b.name);
    expect(html).not.toMatch(/300 Gy|7\/7|6 MV \(fotones\)/);
    expect(html).toContain('NCRP147');
  });

  it('diálogo del reporte CNSNS: estado vacío honesto si el plano no está calculado', () => {
    act(() => useCanvasStore.getState().setFloorPlan(plano()));
    render(<CNSNSAutoReportDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('cnsns-vacio')).toBeTruthy();
    expect((screen.getByTestId('cnsns-exportar') as HTMLButtonElement).disabled).toBe(true);
  });

  it('cumplimiento: sin certificaciones CE/FDA/ISO inventadas', () => {
    render(<ComplianceCertificationDialog open onOpenChange={() => {}} />);
    const tab = screen.getByRole('tab', { name: /Certificaciones/ });
    fireEvent.mouseDown(tab); fireEvent.click(tab);
    expect(screen.getByTestId('cert-vacio')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/CE Marking|510\(k\) —|ISO 9001:2015 — Quality Management|Declaration of Conformity/);
  });

  it('alertas regulatorias: sin alertas inventadas', () => {
    render(<RegulatoryAlertsDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('alertas-vacio').textContent).toMatch(/No hay alertas/);
    expect(document.body.textContent).not.toMatch(/LA-003\/2026/);
  });
});
