/**
 * Fase 8c — diálogos de prioridad media, por tema. Cada grupo contra un ejemplo publicado cuando existe
 * (NCRP 151 Tabla 5.1, §7.1.1, Tabla B.2; NCRP 147 §5.3.1.2; AAPM TG-108 Tabla V; IAEA SSR-6) o contra la
 * corrección concreta que se hizo (límite comparado una vez, TVL continuo, estado de cumplimiento, rutas).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { anguloSolidoCampo, skyshineFotones } from '@/lib/ncrp151';
import { barreraMV, blindajeCo60, espesorPET, espesorRequeridoHaz, incidenciaOblicua, transmisionPET } from '@/lib/calculadorasNormativas';
import { getRoomSummary, DEFAULT_THERAPY_TASKS } from '@/lib/therapy/TherapeuticRadionuclideShielding';
import { OPTIMIZATION_MATERIALS, requiredThickness, type OptimizationBarrier } from '@/lib/shieldingOptimizer';
import { DEFAULT_SPECT_PROCEDURES, salaSPECT, SPECT_RADIONUCLIDES, tvlSPECT } from '@/lib/spect/IPEMReport109';
import { generarBunker } from '@/lib/bunkerParametrico';
import { aplicarEquipoAFuente } from '@/lib/equipoAFuente';
import { tvlEquivalente511 } from '@/lib/bimRAD';
import { LIMITES_DOSIS } from '@/lib/limitesDosis';
import { MODALITIES, type FloorPlan, type RadiationSource } from '@/types/radshield';
import { useAppStore } from '@/stores/appStore';
import ChiltonSkyshineDialog from '@/sections/dialogs/ChiltonSkyshineDialog';
import ObliqueIncidenceDialog from '@/sections/dialogs/ObliqueIncidenceDialog';
import GammaKnifeDialog from '@/sections/dialogs/GammaKnifeDialog';
import StGermainScatterDialog from '@/sections/dialogs/StGermainScatterDialog';
import CostOptimizerDialog from '@/sections/dialogs/CostOptimizerDialog';
import AnnualDoseReport from '@/sections/dialogs/AnnualDoseReport';
import DashboardCalcDialog from '@/sections/dialogs/DashboardCalcDialog';
import RadioactiveTransportDialog from '@/sections/dialogs/RadioactiveTransportDialog';
import NeutronMazeDialog from '@/sections/dialogs/NeutronMazeDialog';
import AuditLogDialog from '@/sections/dialogs/AuditLogDialog';

const dentro = (calc: number, pub: number, tol: number) => expect(Math.abs(calc - pub) / pub).toBeLessThanOrEqual(tol);
const valor = (id: string) => Number(/[-+]?\d+(\.\d+)?(e[-+]?\d+)?/i.exec(screen.getByTestId(id).textContent ?? '')![0]);
const fuente = (p: string) => readFileSync(path.resolve(__dirname, '../../sections/dialogs', p), 'utf8');

beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(() => cleanup());

describe('Modelos locales → motores normativos (NCRP 151)', () => {
  it('skyshine, Ec. 5.1: reproduce la columna «calculada» de la Tabla 5.1 (240 Gy/h, Ω = 0.122, dᵢ = 5.97 m)', () => {
    // La columna calculada corresponde a B_xs ≈ 1 (techo con ≈ 10 % de atenuación). μSv/h:
    const tabla: [number, number][] = [[7.5, 202], [9.4, 127], [10.6, 97], [13.6, 63], [48.3, 4.7]];
    for (const [ds, pub] of tabla) dentro(skyshineFotones({ B_xs: 1, D0: 240, omega_sr: 0.122, di_m: 5.97, ds_m: ds }) / 1000, pub, 0.08);
    // Campo de 40 × 40 cm a 1 m → Ω ≈ 0.154 sr.
    expect(anguloSolidoCampo(0.4, 0.4, 1)).toBeCloseTo(0.1539, 3);
  });

  it('diálogo de skyshine: sin techo, 18 MV, W = 450 Gy/semana → B_xs = 1 y Ḣ ∝ 1/dₛ²', () => {
    render(<ChiltonSkyshineDialog onClose={() => {}} />);
    expect(valor('sky-bxs')).toBe(1);
    dentro(valor('sky-h-10') / valor('sky-h-20'), 4, 0.01);
  });

  it('incidencia oblicua (§2.2): ≤ 45° sólo t/cos θ; > 45° con B < 10⁻³ descuenta 1 HVL (MV) o 2 HVL (Co-60)', () => {
    const a30 = incidenciaOblicua(18, 'concrete', 150, 30);
    expect(a30.hvlDescontados).toBe(0);
    dentro(a30.recorrido_cm, 150 / Math.cos(Math.PI / 6), 1e-9);
    const a60 = incidenciaOblicua(18, 'concrete', 150, 60);
    expect(a60.hvlDescontados).toBe(1);
    dentro(a60.B_corregida, 2 * a60.B_oblicua, 1e-9);
    const co = incidenciaOblicua('Co60', 'concrete', 100, 60);
    dentro(co.B_corregida, 4 * co.B_oblicua, 1e-9);
    // Tope de 70°: 85° no acredita más recorrido que 70°.
    expect(incidenciaOblicua(6, 'concrete', 100, 85).recorrido_cm).toBeCloseTo(incidenciaOblicua(6, 'concrete', 100, 70).recorrido_cm, 9);
  });

  it('diálogo de incidencia oblicua: 60° sobre 150 cm muestra el aviso de la corrección', () => {
    render(<ObliqueIncidenceDialog open onClose={() => {}} />);
    fireEvent.change(screen.getByTestId('obl-th'), { target: { value: '60' } });
    expect(screen.getByTestId('obl-aviso')).toBeTruthy();
    expect(valor('obl-equivalente')).toBeLessThan(valor('obl-recorrido'));
  });

  it('Co-60 (Tabla B.2: TVL 21 / 7.0 / 4.0 cm): B = 10⁻³ → 63 cm de concreto, 21 de acero, 12 de plomo', () => {
    const r = blindajeCo60(1, 1e-3, 1);
    dentro(r.espesores_cm.concrete, 63, 1e-9);
    dentro(r.espesores_cm.steel, 21, 1e-9);
    dentro(r.espesores_cm.lead, 12, 1e-9);
    // Braquiterapia (valores del expediente): W = 256.41 mGy·m²/semana a 2.5 m, P = 0.1, T = 1/8.
    const b = blindajeCo60(256.41 / 2.5 ** 2, 0.1, 0.125);
    dentro(b.B_requerida, 0.0195, 0.01);
  });

  it('Gamma Knife: la fórmula ya no invierte el cociente; S1a (140.4 μSv/semana, P = 400) no requiere blindaje', () => {
    const r = blindajeCo60(0.1404, 0.4, 1);
    expect(r.espesores_cm.concrete).toBe(0);
    render(<GammaKnifeDialog open onOpenChange={() => {}} />);
    expect(fuente('GammaKnifeDialog.tsx')).not.toMatch(/ln\( \(P \* T\) \/ \(U \* D_acum\) \)/);
  });

  it('optimizador genético: el concreto primario coincide con NCRP 151 §7.1.1 (149.6 cm) y el tungsteno va por densidad', () => {
    const b: OptimizationBarrier = { id: 'p', name: 'p', area_m2: 10, distance_to_source_m: 7.2, use_factor: 0.25, occupancy_factor: 0.025, dose_limit_mSv_week: 0.02, workload_Gy_week: 450, is_primary: true, is_maze: false, current_thickness_mm: 0, current_material: 'concreto_ordinario' };
    const conc = OPTIMIZATION_MATERIALS.find(m => m.key === 'concreto_ordinario')!;
    dentro(requiredThickness(b, conc, 18), 1496, 0.005);
    const pb = OPTIMIZATION_MATERIALS.find(m => m.key === 'plomo_laminado')!;
    const w = OPTIMIZATION_MATERIALS.find(m => m.key === 'tungsteno')!;
    dentro(requiredThickness(b, w, 18), requiredThickness(b, pb, 18) * 11350 / 17500, 1e-9);
  });
});

describe('Modelos locales → motores normativos (NCRP 147, TG-108)', () => {
  it('secundaria de diagnóstico (antes «St-Germain»): §5.3.1.2 K = 0.47 mGy/semana y 33 mm de concreto', () => {
    render(<StGermainScatterDialog open onClose={() => {}} />);
    dentro(valor('sg-k'), 0.47, 0.04);
    dentro(valor('sg-concrete'), 33, 0.05);
  });

  it('optimizador de costos: el espesor mostrado es el de espesorRequeridoHaz (§7.1.1, 149.6 cm de concreto)', () => {
    render(<CostOptimizerDialog open onOpenChange={() => {}} />);
    const fila = screen.getByTestId('cost-tabla').textContent ?? '';
    expect(fila).toContain(espesorRequeridoHaz({ regimen: 'megavoltaje', energia: 18, W_Gy_semana: 450, U: 0.25, d_m: 7.2 }, 'concrete', 0.02, 0.025).toFixed(1));
  });

  it('BIMRAD: el TVL equivalente a 511 keV reproduce la transmisión de TG-108 Tabla V', () => {
    for (const [m, t] of [['lead', 0.02], ['concrete', 0.2]] as const) {
      expect(Math.pow(10, -t / tvlEquivalente511(m, t))).toBeCloseTo(transmisionPET(m, t * 1000), 10);
    }
    dentro(espesorPET('lead', 0.1), 15.9, 0.02); // 1.er TVL de plomo a 511 keV (citado ahora en la biblioteca de equipos)
  });

  it('SPECT (IPEM 109): TVL de Tc-99m ya no es la HVL; la sala completa se dimensiona por la suma, con TVL continuo', () => {
    const tc = SPECT_RADIONUCLIDES.find(r => r.symbol === 'Tc-99m')!;
    expect(tc.tenthValueLead_mm).toBeGreaterThan(0.8);
    dentro(tvlSPECT(tc, 'gypsum'), tc.tenthValueConcrete_mm * 2.35 / 0.705, 1e-9);
    const s = salaSPECT(DEFAULT_SPECT_PROCEDURES, 2, 0, 'lead', 100);
    const resto = s.resultados.reduce((a, r, k) => a + r.weeklyKerma_uSv * Math.pow(10, -s.plomo_mm / tvlSPECT(SPECT_RADIONUCLIDES.find(x => x.symbol === DEFAULT_SPECT_PROCEDURES[k].radionuclide)!, 'lead')), 0);
    dentro(resto, 100, 1e-6);
  });

  it('terapia con radiofármacos: la sala se compara con la meta una vez (antes meta × número de tareas)', () => {
    const r = getRoomSummary(DEFAULT_THERAPY_TASKS, 100);
    expect(r.withinLimits).toBe(r.totalWeekly_uSv <= 100);
    const t = r.results.find(x => x.shieldingRequired)!;
    dentro(t.minLead_mm, -Math.log10(100 / t.weeklyDose_uSv) * t.nuclide.tenthValueLead_mm, 1e-9);
  });
});

describe('Datos y textos', () => {
  it('reporte anual: T se aplica una vez (0.02 mSv/semana, T = 0.5, 46 semanas → 0.46 mSv/año)', () => {
    render(<AnnualDoseReport open onClose={() => {}} />);
    fireEvent.change(screen.getByTestId('adr-t'), { target: { value: '0.5' } });
    dentro(valor('adr-anual'), 0.46, 1e-3);
  });

  it('tablero de cálculo: una barrera con el 95 % del requerido no cumple (antes tolerancia del 90 %)', () => {
    const plano = {
      name: 'p', scale_m_per_pixel: 0.01, width_pixels: 100, height_pixels: 100, sources: [], occupiedRegions: [], regions: [],
      barriers: [{ id: 'b', name: 'b', x1: 0, y1: 0, x2: 1, y2: 1, barrierType: 'primary', useFactor: 1, occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'PB', material: 'Pb', requiredThickness_mm: 10, thickness_mm: 9.5 }],
    } as unknown as FloorPlan;
    render(<DashboardCalcDialog open onOpenChange={() => {}} floorPlan={plano} />);
    expect(screen.getByText('0 / 1')).toBeTruthy();
  });

  it('transporte (IAEA SSR-6): II-AMARILLA ≤ 10 μSv/h a 1 m y III-AMARILLA ≤ 0.1 mSv/h a 1 m', () => {
    render(<RadioactiveTransportDialog open onOpenChange={() => {}} />);
    expect(screen.getAllByText(/IT ≤ 1 \(≤ 10 μSv\/h a 1 m\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/IT ≤ 10 \(≤ 0.1 mSv\/h a 1 m\)/).length).toBeGreaterThan(0);
    expect(fuente('RadioactiveTransportDialog.tsx')).not.toMatch(/< 10 mSv\/h a 1m/);
  });

  it('textos normativos: EPA ya no llama «controlada» a 20 μSv/semana; el checklist usa la tabla única de límites', () => {
    expect(fuente('EPAGuidanceDialog.tsx')).not.toMatch(/'Area controlada \(NCRP 147\)', value: '20 uSv\/semana'/);
    expect(fuente('CNSNSChecklistDialog.tsx')).toContain('LIMITES_DOSIS');
    expect(LIMITES_DOSIS.icrp103.publico_mSv_anio).toBe(1);
    expect(LIMITES_DOSIS.objetivosDiseno.controlada_mSv_semana).toBe(0.1);
  });

  it('datos de demostración rotulados y pacientes anonimizados', () => {
    render(<AuditLogDialog open onClose={() => {}} />);
    expect(screen.getAllByTestId('datos-ejemplo').length).toBeGreaterThan(0);
    for (const f of ['PACSIntegrationDialog.tsx', 'PACSRealDialog.tsx', 'SmartSearchDICOMDialog.tsx']) {
      expect(fuente(f)).not.toMatch(/patientName: '(?!DEMO)[^']+'/);
    }
  });
});

describe('Navegación y acciones que no hacían nada', () => {
  it('búnker paramétrico: genera 4 barreras a la escala del plano y una fuente con W en fracciones/semana', () => {
    const g = generarBunker({ template: 'linac-6mv', roomLength: 7.5, roomWidth: 7, workload: 300 }, 0.01);
    expect(g.barriers).toHaveLength(4);
    expect(g.barriers.filter(b => b.barrierType === 'primary')).toHaveLength(2);
    expect(Math.abs(g.barriers[0].x2 - g.barriers[0].x1)).toBe(700);
    const m = MODALITIES.find(x => x.id === 'linac-6mv')!;
    dentro(g.sources[0].workloadValue * m.doseRateConstant, 300, 1e-9);
  });

  it('autollenado de equipo: aplica modalidad, carga e isocentro a la fuente', () => {
    const f = { id: 's', x: 0, y: 0, name: 'x', modality: MODALITIES[0], workloadValue: 1, workloadUnit: '', isocenterHeight_m: 1, useFactor: 1 } as RadiationSource;
    const r = aplicarEquipoAFuente(f, { name: 'TrueBeam', energies: [6, 10, 15, 18], workload_Gy_week: 500, isoHeight_m: 1.3 });
    expect(r.modality.id).toBe('linac-18mv');
    dentro(r.workloadValue * r.modality.doseRateConstant, 500, 1e-9);
  });

  it('laberinto con neutrones: redirige a la calculadora validada (maze)', () => {
    render(<NeutronMazeDialog open onClose={() => {}} />);
    act(() => { fireEvent.click(screen.getByTestId('redireccion-abrir')); });
    expect(useAppStore.getState().dialogs.maze).toBeTruthy();
  });

  it('el comparador común usa barreraMV: misma primaria que el motor', () => {
    const r = barreraMV({ tipo: 'primaria', haces: [{ energia: 18, W_Gy_semana: 450 }], material: 'concrete', P_mSv_semana: 0.02, T: 0.025, U: 0.25, d_m: 7.2 });
    dentro(r.espesor_cm, 149.6, 0.005);
  });
});
