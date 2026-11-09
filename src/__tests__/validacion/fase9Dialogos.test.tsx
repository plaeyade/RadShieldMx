/**
 * Fase 9 — diálogos que en la Fase 8c sólo se rotularon como «datos de ejemplo»: o leen el estado real del proyecto
 * (plano + cálculo validado del motor) o quedan desactivados con un aviso, sin cifras inventadas.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Barrier, FloorPlan } from '@/types/radshield';
import { MODALITIES } from '@/types/radshield';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEscenariosStore } from '@/stores/escenariosStore';
import { compararPlanos, eventosDelPlano, formularioCNSNS, modulosDelPlano, requeridoContraInstalado, resumenProyecto } from '@/lib/estadoProyecto';
import { referenciaNCRP151 } from '@/lib/referenciaMC';
import DashboardDialog from '@/sections/dialogs/DashboardDialog';
import LogFileAnalysisDialog from '@/sections/dialogs/LogFileAnalysisDialog';
import CNSNSDigitalSubmission from '@/sections/dialogs/CNSNSDigitalSubmission';
import AuditLogDialog from '@/sections/dialogs/AuditLogDialog';
import AuditDashboardDialog from '@/sections/dialogs/AuditDashboardDialog';
import CompareScenariosDialog from '@/sections/dialogs/CompareScenariosDialog';
import CompareModeDialog from '@/sections/dialogs/CompareModeDialog';
import MonteCarloIntegrationDialog from '@/sections/dialogs/MonteCarloIntegrationDialog';
import NativeMCDialog from '@/sections/dialogs/NativeMCDialog';
import MultiSourceDetectorDialog from '@/sections/dialogs/MultiSourceDetectorDialog';
import ShapesReconstructionDialog from '@/sections/dialogs/ShapesReconstructionDialog';
import PerformanceDashboardDialog from '@/sections/dialogs/PerformanceDashboardDialog';
import AnimatedDoseMapsDialog from '@/sections/dialogs/AnimatedDoseMapsDialog';
import MCResultsDialog from '@/sections/dialogs/MCResultsDialog';

const DIR = path.resolve(__dirname, '../../sections/dialogs');
const fuente = (p: string) => readFileSync(path.join(DIR, p), 'utf8');

const traza = (standard: string) => ({
  formulaId: 'f', standard, modalityCategory: 'therapy' as const, energyKey: '6', sourceCount: 1, materialCount: 1,
  samplePointCount: 1, assumptions: [], citationIds: [], inputs: {}, outputs: {},
});
const barrera = (id: string, extra: Partial<Barrier>): Barrier => ({
  id, name: id, x1: 0, y1: 0, x2: 100, y2: 0, barrierType: 'primary', useFactor: 0.25, occupancyFactor: 1,
  designGoal_mSv_per_wk: 0.02, materialCode: 'concrete', ...extra,
});
const PLANO: FloorPlan = {
  id: 'p9', name: 'Búnker de prueba', imageUrl: null, scale_m_per_pixel: 0.01, width_pixels: 1000, height_pixels: 800, occupiedRegions: [],
  sources: [{ id: 's1', x: 50, y: 50, name: 'LINAC', modality: MODALITIES.find((m) => m.id === 'linac-6mv')!, workloadValue: 250, workloadUnit: 'fracciones/semana', isocenterHeight_m: 1.3, useFactor: 0.25 }],
  barriers: [
    barrera('Primaria N', { requiredThickness_mm: { concrete: 1000 }, thickness_mm: 1100, calculationTrace: traza('NCRP151') }),
    barrera('Secundaria E', { barrierType: 'secondary', requiredThickness_mm: { concrete: 500 }, thickness_mm: 400, calculationTrace: traza('NCRP151') }),
    barrera('Puerta', { barrierType: 'secondary', occupancyFactor: 0.125 }),
  ],
  importMetadata: { source: 'dxf', fileName: 'bunker.dxf', mappedBarriers: 3, importedAt: '2026-11-01T10:00:00.000Z', calculatedAt: '2026-11-01T11:00:00.000Z', calculatedBarriers: 2, calculationStatus: 'complete' },
};

beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
beforeEach(() => {
  useCanvasStore.setState({ floorPlan: structuredClone(PLANO) });
  useEscenariosStore.setState({ escenarios: [] });
});
afterEach(() => cleanup());

describe('lib/estadoProyecto: el estado del proyecto sale del plano y de la verificación', () => {
  it('resumen y módulos: cumple sólo si instalado ≥ requerido; sin cálculo cuenta como pendiente', () => {
    const r = resumenProyecto(PLANO);
    expect(r).toMatchObject({ fuentes: 1, barreras: 3, calculadas: 2, cumplen: 1, noCumplen: 1, pendientes: 1, cumplimiento: 33, requeridoMax_mm: 1000, objetivoMax_mSv_semana: 0.02 });
    const m = modulosDelPlano(PLANO);
    expect(m.find((x) => x.clave === 'therapy')).toMatchObject({ barreras: 2, cumplen: 1, noCumplen: 1, pendientes: 0, requeridoMax_mm: 1000, normas: ['NCRP151'] });
    expect(m.find((x) => x.clave === 'sin_calculo')).toMatchObject({ barreras: 1, pendientes: 1, requeridoMax_mm: null });
  });

  it('requerido contra instalado: diferencia relativa al requerido', () => {
    const f = requeridoContraInstalado(PLANO);
    expect(f.map((x) => x.estado)).toEqual(['CUMPLE', 'NO_CUMPLE', 'SIN_CALCULO']);
    expect(f[0].diferencia_pct).toBeCloseTo(10, 9);
    expect(f[1].diferencia_pct).toBeCloseTo(-20, 9);
    expect(f[2].diferencia_pct).toBeNull();
  });

  it('bitácora: sólo los eventos con fecha que guarda el plano, del más reciente al más antiguo', () => {
    const e = eventosDelPlano(PLANO);
    expect(e.map((x) => x.accion)).toEqual(['Cálculo de blindaje', 'Plano importado']);
    expect(e[1].detalle).toContain('bunker.dxf');
    expect(eventosDelPlano({ ...PLANO, importMetadata: undefined })).toEqual([]);
  });

  it('formulario CNSNS: datos de la instalación «Por completar», barreras con su verificación', () => {
    const s = formularioCNSNS(PLANO);
    const general = s[0].fields;
    expect(general.filter((f) => f.value === 'Por completar').map((f) => f.label)).toEqual(['Nombre de la instalación', 'Dirección', 'Licencia CNSNS', 'Responsable']);
    expect(s[2].fields.map((f) => f.status)).toEqual(['complete', 'error', 'pending']);
    expect(s[2].fields[1].value).toContain('requerido 500 mm · instalado 400 mm · NO CUMPLE');
    expect(s[3].fields[0].value).toBe('NCRP151');
  });

  it('comparación de escenarios: empareja barreras y da Δ requerido / Δ instalado', () => {
    const b = structuredClone(PLANO);
    b.barriers[1].thickness_mm = 600;
    b.barriers.push(barrera('Techo', {}));
    const c = compararPlanos(PLANO, b);
    const sec = c.filas.find((f) => f.barrera === 'Secundaria E')!;
    expect(sec.deltaInstalado_mm).toBe(200);
    expect(sec.deltaRequerido_mm).toBe(0);
    expect([sec.a?.estado, sec.b?.estado]).toEqual(['NO_CUMPLE', 'CUMPLE']);
    expect(c.filas.find((f) => f.barrera === 'Techo')?.a).toBeNull();
    expect([c.resumenA.cumplen, c.resumenB.cumplen]).toEqual([1, 2]);
  });
});

describe('Diálogos conectados al proyecto', () => {
  it('Dashboard: KPI del plano (33 % = 1 de 3 barreras cumple)', () => {
    render(<DashboardDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('dashboard-cumplimiento').textContent).toBe('33%');
    expect(screen.getByText('Teleterapia / braquiterapia (NCRP 151)')).toBeTruthy();
    expect(screen.queryByText(/Ciclotron IBA/)).toBeNull();
  });

  it('Dashboard sin barreras: estado vacío, sin cifras', () => {
    useCanvasStore.setState({ floorPlan: { ...PLANO, barriers: [] } });
    render(<DashboardDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('dashboard-vacio')).toBeTruthy();
  });

  it('Requerido contra instalado: filas del plano y tasa de cumplimiento', () => {
    render(<LogFileAnalysisDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('log-tasa').textContent).toBe('33%');
    expect(screen.getByText('-20.0%')).toBeTruthy();
    expect(screen.queryByText(/Tiempo de calculo MC/)).toBeNull();
  });

  it('Envío CNSNS: prellenado del plano, envío desactivado y sin folio simulado', () => {
    render(<CNSNSDigitalSubmission open onOpenChange={() => {}} />);
    expect(screen.getByTestId('cnsns-envio-desactivado')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Enviar a CNSNS/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('LINAC')).toBeTruthy();
    expect(screen.queryByText(/Hospital General/)).toBeNull();
    expect(fuente('CNSNSDigitalSubmission.tsx')).not.toMatch(/CNSNS-RP-2026/);
  });

  it('Bitácora y tablero de auditoría: eventos del plano; sin servidor lo dicen', () => {
    render(<AuditLogDialog open onClose={() => {}} />);
    expect(screen.getByText('Plano importado')).toBeTruthy();
    expect(screen.getByTestId('bitacora-estado').textContent).toMatch(/Sin servidor/);
    cleanup();
    render(<AuditDashboardDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('auditoria-total').textContent).toBe('2');
    expect(screen.queryByText(/Dr\. Garcia/)).toBeNull();
  });

  it('Comparadores: guardan el plano como escenario y lo comparan con el actual', () => {
    render(<CompareScenariosDialog onClose={() => {}} />);
    expect(screen.queryByTestId('tabla-comparacion')).toBeNull();
    fireEvent.click(screen.getByTestId('guardar-escenario'));
    act(() => {
      const p = structuredClone(useCanvasStore.getState().floorPlan);
      p.barriers[1].thickness_mm = 600;
      useCanvasStore.setState({ floorPlan: p });
    });
    expect(screen.getByTestId('tabla-comparacion').textContent).toContain('+200');
    cleanup();
    render(<CompareModeDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('tabla-comparacion')).toBeTruthy();
    for (const f of ['CompareScenariosDialog.tsx', 'CompareModeDialog.tsx']) expect(fuente(f)).not.toMatch(/totalCost|avgDose|48500/);
  });
});

describe('Monte Carlo y herramientas sin fuente real', () => {
  it('referencia NCRP 151 Tabla B.2: 6 MV en concreto, TVL₁ 37 cm y TVLₑ 33 cm', () => {
    const r = referenciaNCRP151('photon', 6, 'G4_CONCRETE', [37, 70])!;
    expect(r.tvl).toEqual({ tvl1_cm: 37, tvle_cm: 33 });
    expect(r.filas[0].transmision).toBeCloseTo(0.1, 12);
    expect(r.filas[1].transmision).toBeCloseTo(0.01, 12);
    expect(referenciaNCRP151('photon', 1.25, 'G4_Pb', [4])!.energia).toBe('Co60');
    expect(referenciaNCRP151('neutron', 6, 'G4_CONCRETE', [10])).toBeNull();
    expect(referenciaNCRP151('photon', 6, 'G4_WATER', [10])).toBeNull();
  });

  it('Integración MC: sin «Run» (la simulación aleatoria se desactivó) y sin TVL fijo de 37 cm', () => {
    render(<MonteCarloIntegrationDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('mc-simulacion-desactivada')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Run MC/i })).toBeNull();
    expect(fuente('MonteCarloIntegrationDialog.tsx')).not.toMatch(/runMonteCarloSimulation|Math\.abs\(results\[0\]\.tvl_cm - 37\)/);
  });

  it.each([
    ['NativeMC', () => render(<NativeMCDialog open onOpenChange={() => {}} />)],
    ['MultiSourceDetector', () => render(<MultiSourceDetectorDialog open onOpenChange={() => {}} />)],
    ['ShapesReconstruction', () => render(<ShapesReconstructionDialog open onOpenChange={() => {}} />)],
    ['PerformanceDashboard', () => render(<PerformanceDashboardDialog open onClose={() => {}} />)],
    ['AnimatedDoseMaps', () => render(<AnimatedDoseMapsDialog open onOpenChange={() => {}} />)],
    ['MCResults', () => render(<MCResultsDialog open onOpenChange={() => {}} resultJson={null} />)],
  ])('%s queda desactivado con aviso y sin cifras', (_n, montar) => {
    montar();
    const aviso = screen.getByTestId('herramienta-desactivada');
    expect(aviso.textContent).not.toMatch(/\d+(\.\d+)?\s*(mSv|μSv|uSv|MB|ms|%)/);
  });

  it('ningún diálogo de la lista de la Fase 8c sigue con «datos de ejemplo», salvo los de PACS (estudios anonimizados)', () => {
    const conBanner = ['AnimatedDoseMapsDialog', 'AuditLogDialog', 'AuditDashboardDialog', 'CNSNSDigitalSubmission', 'DashboardDialog', 'LogFileAnalysisDialog',
      'MonteCarloIntegrationDialog', 'CompareScenariosDialog', 'MCResultsDialog', 'CompareModeDialog', 'NativeMCDialog', 'ShapesReconstructionDialog',
      'MultiSourceDetectorDialog', 'PerformanceDashboardDialog'].filter((f) => fuente(`${f}.tsx`).includes('DatosEjemploBanner'));
    expect(conBanner).toEqual([]);
  });
});
