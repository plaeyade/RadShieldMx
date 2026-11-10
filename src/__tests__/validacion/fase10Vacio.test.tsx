/**
 * Fase 10 — sin proyecto: los diálogos de reporte y tablero muestran un estado vacío útil y ningún dato inventado;
 * con el ejemplo PET/CT la tabla del reporte sale del proyecto.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import { planoEjemploCompleto, planoVacio } from '@/lib/ejemploGuiado';
import AvisoProyectoVacio from '@/components/AvisoProyectoVacio';
import PdfReportDialog from '@/sections/dialogs/PdfReportDialog';
import VersionHistoryDialog from '@/sections/dialogs/VersionHistoryDialog';
import CNSNSDashboardDialog from '@/sections/dialogs/CNSNSDashboardDialog';
import DashboardCalcDialog from '@/sections/dialogs/DashboardCalcDialog';
import ExportDialog from '@/sections/dialogs/ExportDialog';

afterEach(() => { cleanup(); useAppStore.getState().closeAll(); });
const nada = () => undefined;

describe('estado vacío (Fase 10)', () => {
  it('AvisoProyectoVacio dice qué falta y desaparece cuando no falta nada', () => {
    const { rerender } = render(<AvisoProyectoVacio floorPlan={planoVacio()} />);
    expect(screen.getByTestId('f10-aviso-proyecto-vacio').dataset.falta).toBe('plano');
    rerender(<AvisoProyectoVacio floorPlan={planoEjemploCompleto()} />);
    expect(screen.getByTestId('f10-aviso-proyecto-vacio').dataset.falta).toBe('calculo');
    rerender(<AvisoProyectoVacio floorPlan={planoEjemploCompleto()} exige="fuentes" />);
    expect(screen.queryByTestId('f10-aviso-proyecto-vacio')).toBeNull();
  });

  it('PdfReport sin proyecto: sin filas fijas «Pared A/B: cumple»', () => {
    render(<PdfReportDialog open floorPlan={planoVacio()} />);
    expect(screen.queryByText(/Pared A/)).toBeNull();
    expect(screen.getByTestId('f10-aviso-proyecto-vacio')).toBeTruthy();
    expect(screen.getByTestId('pdf-report-conclusion').textContent).toMatch(/Sin barreras/);
  });

  it('PdfReport con el ejemplo: una fila por barrera del proyecto', () => {
    render(<PdfReportDialog open floorPlan={planoEjemploCompleto()} />);
    const tabla = screen.getByTestId('pdf-report-resultados');
    expect(tabla.querySelectorAll('tr')).toHaveLength(1 + 7);
    expect(tabla.textContent).toMatch(/Muro común captación/);
    expect(screen.getByTestId('pdf-report-conclusion').textContent).toMatch(/sin cálculo/);
  });

  it('VersionHistory sin versiones inventadas', () => {
    render(<VersionHistoryDialog open onOpenChange={nada} />);
    expect(screen.queryByText(/Dr\. Martinez/)).toBeNull();
    expect(screen.getByTestId('f10-version-history-vacio')).toBeTruthy();
  });

  it('tableros y exportación avisan del proyecto vacío sin lanzar', () => {
    render(<>
      <CNSNSDashboardDialog open onOpenChange={nada} floorPlan={planoVacio()} />
      <DashboardCalcDialog open onOpenChange={nada} floorPlan={planoVacio()} />
      <ExportDialog open onOpenChange={nada} onExportCSV={nada} onExportJSON={nada} floorPlan={planoVacio()} />
    </>);
    expect(screen.getAllByTestId('f10-aviso-proyecto-vacio').length).toBeGreaterThanOrEqual(3);
  });
});
